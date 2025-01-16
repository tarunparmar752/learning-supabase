const express = require("express");
const indexRouter = require("./routes/index");
const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.json());
app.use("/api/v1", indexRouter);

app.listen(3000, (req, res) => {
  console.log("====================================");
  console.log("Server is running on port 3000");
  console.log("====================================");
});
