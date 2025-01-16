// services/UserUploadService.js
const csv = require("csv-parser");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

// Load environment variables from the .env file
dotenv.config();

const supabase = createClient(process.env.url, process.env.key);

class UserUploadService {
  constructor() {
    this.results = {
      successful: [],
      failed: [],
      total: 0,
    };
  }

  validateUserData(user) {
    const errors = [];

    // Basic validation for exact field names
    if (!user["First Name"]?.trim()) errors.push("First Name is required");
    if (!user["Last Name"]?.trim()) errors.push("Last Name is required");
    if (!user["Email"]?.trim()) errors.push("Email is required");

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (user["Email"] && !emailRegex.test(user["Email"])) {
      errors.push("Invalid email format");
    }

    return errors;
  }

  async checkExistingEmail(email) {
    const { data, error } = await supabase
      .from("users")
      .select("Email")
      .eq("Email", email)
      .single();

    return data !== null;
  }

  async processUserBatch(users) {
    try {
      // Filter out duplicate emails within the batch
      const uniqueUsers = users.filter(
        (user, index, self) =>
          index === self.findIndex((u) => u["Email"] === user["Email"])
      );

      // Check for existing emails in database
      const emailChecks = await Promise.all(
        uniqueUsers.map((user) => this.checkExistingEmail(user["Email"]))
      );

      // Filter out users with existing emails
      const newUsers = uniqueUsers.filter((_, index) => !emailChecks[index]);
      const duplicateUsers = uniqueUsers.filter(
        (_, index) => emailChecks[index]
      );

      // Add duplicate users to failed results
      duplicateUsers.forEach((user) => {
        this.results.failed.push({
          ...user,
          error: "Email already exists",
        });
      });

      if (newUsers.length === 0) {
        return { success: true, data: [] };
      }

      // Transform users to match database format
      const formattedUsers = newUsers.map((user) => ({
        first_name: user["First Name"],
        last_name: user["Last Name"],
        Email: user["Email"].toLowerCase(),
        created_at: new Date().toISOString(),
      }));

      // Insert new users
      const { data, error } = await supabase
        .from("users")
        .insert(formattedUsers)
        .select();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error("Batch insert failed:", error);
      return { success: false, error };
    }
  }

  async bulkUploadUsers(filePath, batchSize = 100) {
    return new Promise((resolve, reject) => {
      const currentBatch = [];
      let processedCount = 0;

      const processBatch = async () => {
        if (currentBatch.length === 0) return;

        const result = await this.processUserBatch([...currentBatch]);

        if (result.success) {
          this.results.successful.push(...result.data);
        } else {
          this.results.failed.push(
            ...currentBatch.map((user) => ({
              ...user,
              error: result.error.message,
            }))
          );
        }

        currentBatch.length = 0; // Clear the batch
      };

      fs.createReadStream(filePath)
        .pipe(csv({ separator: ";" }))
        .on("data", async (row) => {
          processedCount++;

          // Keep original CSV format for validation
          const user = {
            "First Name": row["First Name"]?.trim() || "",
            "Last Name": row["Last Name"]?.trim() || "",
            Email: row["Email"]?.trim() || "",
          };
          //   console.log("here comes the user", user);
          const validationErrors = this.validateUserData(user);

          if (validationErrors.length === 0) {
            currentBatch.push(user);

            if (currentBatch.length >= batchSize) {
              await processBatch();
            }
          } else {
            this.results.failed.push({
              ...user,
              error: validationErrors.join(", "),
            });
          }
        })
        .on("end", async () => {
          // Process final batch
          await processBatch();

          // Generate summary
          const summary = {
            totalProcessed: processedCount,
            successful: this.results.successful.length,
            failed: this.results.failed.length,
            failureDetails: this.results.failed,
          };

          resolve(summary);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }

  logResults() {
    console.log("Upload Summary:");
    console.log("Total Processed:", this.results.total);
    console.log("Successfully Uploaded:", this.results.successful.length);
    console.log("Failed:", this.results.failed.length);

    if (this.results.failed.length > 0) {
      console.log("\nFailed Entries:");
      this.results.failed.forEach((fail, index) => {
        console.log(`\n${index + 1}. ${fail["Email"]}`);
        console.log(`   Error: ${fail.error}`);
      });
    }
  }
}

module.exports = { UserUploadService };
