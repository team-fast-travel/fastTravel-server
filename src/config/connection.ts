import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import http from "http";
import { Server, type Server as SocketIOServer } from "socket.io";
import type { Express } from "express";
import { socketHandler } from "./socketHandler.js";

let io: SocketIOServer | null = null;

export const setSocket = (socketInstance: SocketIOServer) => {
  io = socketInstance;
};

export const getSocket = (): SocketIOServer | null => io;

interface ConnectionProps {
  app: Express;
  port: number;
}

export const connection = async ({ app, port }: ConnectionProps) => {
  const dbURL = process.env.MONGODB_URL as string;

  if (!dbURL) {
    throw new Error("MONGODB_URL is not defined in environment variables");
  }

  try {
    await mongoose.connect(dbURL, { autoIndex: true });
    console.log("Connected to database");

    // Create HTTP server
    const server = http.createServer(app);

    // Attach socket.io
    const ioInstance = new Server(server, {
      cors: {
        origin: "*",
      },
    });

    // Handle socket connection
    socketHandler(ioInstance);

    // Store globally
    setSocket(ioInstance);

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Database connection failed", error);
  }
};
