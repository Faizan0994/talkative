const express = require("express");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

//TODO: Rate limiting

app.use("/api/auth", authRouter);

app.listen(process.env.PORT || 3000, (error) => {
  console.log("server listening...");
  if (error) {
    console.log(error);
  }
});
