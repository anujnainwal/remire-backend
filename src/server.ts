import dotenv from "dotenv";
import app from "./app";
import { connectToDB } from "./config/connectToDB";
import { autoSeedSuperAdmin } from "./config/autoSeed";
import socket from "socket.io";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import { sendEmail } from "./services/email.service";
import VerifyEmailTemplate from "./templates/verifyEmail.template"

dotenv.config();

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "0.0.0.0";
const ENV = process.env.NODE_ENV || "development";

const httpServer = createServer(app);

// Connect to database and run auto-seed
async function startServer() {
  try {
    await connectToDB();
    console.log("✅ Database connected successfully");

    // Run auto-seed for super admin
    await autoSeedSuperAdmin();
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

//socket implementation
const io = new socket.Server(httpServer, {
  cors: {
    origin: "*",
    credentials: true,
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
  allowEIO3: true, // Enable compatibility with Socket.IO v2 clients
});

// authentication middleware for socket.io
io.use((sock, next) => {
  try {
    const rawToken =
      sock.handshake.auth?.token || sock.handshake.headers?.token;

    if (!rawToken || typeof rawToken !== "string") {
      return next(new Error("Authentication error: token required"));
    }

    // support "Bearer <token>" or raw token
    const token = rawToken.startsWith("Bearer ")
      ? rawToken.split(" ")[1]
      : rawToken;

    if (!token) {
      return next(new Error("Authentication error: token required"));
    }

    // verify token and attach decoded payload to socket.data.user
    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
      if (err) {
        console.log("Socket auth verification failed:", err);
        return next(new Error("Authentication error: invalid token"));
      }

      // attach decoded data for later use in event handlers
      try {
        sock.data = sock.data || {};
        (sock.data as any).user = decoded;
      } catch (e) {
        // non-fatal, continue
      }

      return next();
    });
  } catch (error) {
    console.log("Error in socket auth middleware ->", error);
    return next(new Error("Authentication error"));
  }
});
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);
  let userInfo = socket?.data?.user ?? null;
  console.log(userInfo);

  socket.on("joinRoom", async (data) => {
    const roomId = data.roomId;
    console.log("📥 Incoming Room id:", roomId);

    if (!roomId) {
      socket.emit("errorEvent", {
        type: "joinRoom",
        message: "Room Id is required.",
      });
      return;
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  const serverUrl = `http://localhost:${PORT}`;
  const healthUrl = `${serverUrl}/health-check`;
  console.log("🚀 Server Started Successfully!");
  console.log("📅 Boot Time:", new Date().toLocaleString());
  console.log("🌍 Environment:", ENV);
  console.log("🔌 Host:", HOST);
  console.log("📡 Port:", PORT);
  console.log("📎 Base URL:", serverUrl);
  console.log("🩺 Health Check:", healthUrl);
  console.log("===========================================");
  
});

async function TestEmail (){
  try {
    let template = VerifyEmailTemplate("Anuj","https://remiwire.com/verify-email?token=abcd1234");
    let result = await sendEmail("anujsinghnainwal@gmail.com", "Test Email from Remiwire",undefined,template);
    console.log("Email send result:", result?.messageId);
  } catch (error) {
    
  }
}
TestEmail()

