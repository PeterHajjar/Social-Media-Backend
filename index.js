const express = require("express");
const app = express();
const DB = require("./database").connectDB;
const authRouter = require("./routes/authRoutes");
const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");
const uploadRouter = require("./routes/uploadRoutes");
DB();

app.use(express.json());
//after express.json we should create a middleware which is
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/upload", uploadRouter);

app.listen(3000, () => {
  console.log("listening on port 3000");
});
