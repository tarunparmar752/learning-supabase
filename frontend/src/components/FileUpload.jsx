import { useState } from "react";

// React example
export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/v1/bulk-users/bulk-upload",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Upload failed:", error);
    }
    setLoading(false);
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={!file || loading}>
        {loading ? "Uploading..." : "Upload Users"}
      </button>

      {results && (
        <div>
          <h3>Upload Results:</h3>
          <p>Total Processed: {results.totalProcessed}</p>
          <p>Successful: {results.successful}</p>
          <p>Failed: {results.failed}</p>
        </div>
      )}
    </div>
  );
}
