const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("🔥 Test server is working!");
});

app.listen(3001, "0.0.0.0", () => {
  console.log("Test server running on http://0.0.0.0:3001");
});