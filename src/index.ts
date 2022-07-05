import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import http from "http";
import ENV from "../config";
import { connectMongo, logger } from "./utils";

const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: ENV.frontendUrl,
    crediantials: true,
  },
});

io.on("connection", (socket: any) => {
  logger.info("socket connected..");
  socket.on("postNew", (payload: {}) => {
    io.emit("postNew", payload);
  });
  socket.on("postUpdate", (payload: {}) => {
    io.emit("postUpdate", payload);
  });
  socket.on("postShared", (postId: string) => {
    io.emit("postShared", postId);
  });
});

const port = ENV.port || 4000;

server.listen(port, () => {
  logger.info(`server is running on http://localhost:${port}`);
  connectMongo();
});
