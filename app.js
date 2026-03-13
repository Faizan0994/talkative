const express = require("express");
const app = express();

app.listen(3000, (e) => {
  if (e) {
    console.error("Error starting the server:", e);
    return;
  }
  console.log("Server is running on port 3000");
});
