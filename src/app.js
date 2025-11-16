const express = require("express");
const connectDB = require("./Config/database");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http= require("http")

require("dotenv").config();

app.use(
  cors({
    origin: ["http://localhost:5173","http://localhost:3000", "https://book-connect-frontend.vercel.app" ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const initalizeSocket = require("./utils/socket");
const chatRouter = require("./routes/chat");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/",chatRouter)

const server=http.createServer(app)
initalizeSocket(server); 

connectDB()
  .then(() => {
    server.listen(process.env.PORT, () => {
      // Server started successfully
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!");
  });
