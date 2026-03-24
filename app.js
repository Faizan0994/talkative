const express = require("express");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/users");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

//TODO: Rate limiting

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

app.listen(process.env.PORT || 3000, (error) => {
  console.log("server listening...");
  if (error) {
    console.log(error);
  }
});
