// ── ENV debug (only in non-production, or strip sensitive keys in prod) ──────
console.log("🚀 [server] Starting up... NODE_ENV:", process.env.NODE_ENV);
console.log("🔍 [server] ENV keys present:", Object.keys(process.env).join(", "));
// Log only non-sensitive env vars to avoid leaking secrets in logs
console.log("🔍 [server] Safe ENV snapshot:", {
  NODE_ENV:              process.env.NODE_ENV,
  PORT:                  process.env.PORT,
  FRONTEND_URL:          process.env.FRONTEND_URL,
  GOOGLE_CALLBACK_URL:   process.env.GOOGLE_CALLBACK_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  HAS_MONGODB_URI:       !!process.env.MONGODB_URI,
  HAS_JWT_SECRET:        !!process.env.JWT_SECRET,
  HAS_YOUTUBE_CLIENT_ID: !!process.env.YOUTUBE_CLIENT_ID,
  HAS_YOUTUBE_REFRESH:   !!process.env.YOUTUBE_REFRESH_TOKEN,
});

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { createServer } from "http";
import { Server } from "socket.io";
import passport from "./config/passport.js";
import connectDB from "./config/db.js";
import Message from "./models/Message.js";
import authRoutes from "./routes/auth.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import orderRoutes from "./routes/order.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import postRoutes from "./routes/post.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import timetableRoutes from "./routes/timetable.routes.js";
import resourceRoutes from "./routes/resource.routes.js";
import roomRoutes from "./routes/room.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import assignmentRoutes from "./routes/assignment.routes.js";
import lostFoundRoutes from "./routes/lostfound.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import confessionRoutes from "./routes/confession.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import proxyRouter from "./routes/proxy.js";
import connectionRoutes from "./routes/connection.routes.js";
import projectRoutes from "./routes/project.routes.js";
import targetsRouter from "./routes/targets.routes.js";
import jobsRouter from "./routes/internships.routes.js";

console.log("✅ [server] Step 1: All imports loaded");

const app = express();
console.log("✅ [server] Step 2: Express app created");

const allowedOrigins = [
  "https://networkup.in",
  // Add http://localhost:5173 or similar if you need local dev
];
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      console.log("✅ [CORS] Allowed origin:", origin || "(no origin)");
      callback(null, true);
    } else {
      console.warn("🚫 [CORS] Blocked origin:", origin);
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ── Middleware (applied ONCE — duplicates removed) ────────────────────────────
app.use(cors(corsOptions));
console.log("✅ [server] Step 3: CORS applied");

app.use(compression());
console.log("✅ [server] Step 4: Compression applied");

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "style-src":  ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src":   ["'self'", "data:", "https://fonts.gstatic.com"],
      "media-src":  ["'self'", "blob:", "https:", "data:"],
      "img-src":    ["'self'", "blob:", "data:", "https:", "http:"],
      "frame-src":  ["'self'", "https://www.youtube.com"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
console.log("✅ [server] Step 5: Helmet applied");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
console.log("✅ [server] Step 6: Body parsers + Passport initialized");

// ── Routes ────────────────────────────────────────────────────────────────────
console.log("⏳ [server] Step 7: Registering routes...");
app.use("/api/auth",         authRoutes);
app.use("/api/seller",       sellerRoutes);
app.use("/api/orders",       orderRoutes);
app.use("/api/user",         userRoutes);
app.use("/api/admin",        adminRoutes);
app.use("/api/feed",         postRoutes);
app.use("/api/chat",         chatRoutes);
app.use("/api/connections",  connectionRoutes);
app.use("/api/projects",     projectRoutes);
app.use("/api/timetable",    timetableRoutes);
app.use("/api/resources",    resourceRoutes);
app.use("/api/rooms",        roomRoutes);
app.use("/api/attendance",   attendanceRoutes);
app.use("/api/assignments",  assignmentRoutes);
app.use("/api/lostfound",    lostFoundRoutes);
app.use("/api/feedback",     feedbackRoutes);
app.use("/api/confessions",  confessionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api",              proxyRouter);
app.use("/api/targets",      targetsRouter);
app.use("/api/internships",  jobsRouter);
console.log("✅ [server] Step 7: All routes registered");

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  console.log("📡 [server] GET / — health check hit");
  res.send("Backend running 🚀");
});

// ── Request logger (helps trace which routes are being hit) ───────────────────
app.use((req, res, next) => {
  console.log(`📩 [server] ${req.method} ${req.originalUrl} — from origin: ${req.headers.origin || "(no origin)"}`);
  next();
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("🔥 [server] Unhandled error on", req.method, req.originalUrl);
  console.error("🔥 [server] Error message:", err.message);
  console.error("🔥 [server] Stack:", err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// ── HTTP + Socket.IO ──────────────────────────────────────────────────────────
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: corsOptions });
const onlineUsers = new Map();
console.log("✅ [server] Step 8: HTTP + Socket.IO created");

io.on("connection", (socket) => {
  console.log("🔌 [socket.io] Client connected. socketId:", socket.id);

  socket.on("user_online", (userId) => {
    console.log("👤 [socket.io] user_online. userId:", userId, "socketId:", socket.id);
    onlineUsers.set(userId, socket.id);
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });

  socket.on("send_message", async ({ senderId, receiverId, text }) => {
    console.log("💬 [socket.io] send_message. from:", senderId, "to:", receiverId, "text length:", text?.length);
    try {
      const conversationId = [senderId, receiverId].sort().join("_");
      const message = await Message.create({ conversationId, senderId, receiverId, text });
      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) {
        console.log("📤 [socket.io] Delivering message to receiver socket:", receiverSocket);
        io.to(receiverSocket).emit("receive_message", message);
      } else {
        console.log("📭 [socket.io] Receiver offline. receiverId:", receiverId);
      }
      socket.emit("message_sent", message);
    } catch (err) {
      console.error("❌ [socket.io] send_message error:", err.message);
    }
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) io.to(receiverSocket).emit("user_typing", { senderId });
  });

  socket.on("stop_typing", ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) io.to(receiverSocket).emit("user_stop_typing", { senderId });
  });

  socket.on("disconnect", () => {
    let disconnectedUser = null;
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        disconnectedUser = userId;
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log("🔌 [socket.io] Client disconnected. socketId:", socket.id, "userId:", disconnectedUser || "(unknown)");
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

console.log("⏳ [server] Step 9: Connecting to MongoDB...");
connectDB()
  .then(() => {
    console.log("✅ [server] Step 9: MongoDB connected");
    httpServer.listen(PORT, () => {
      console.log(`✅ [server] Step 10: Server running on port ${PORT}`);
      console.log(`✅ [server] Health check: http://localhost:${PORT}/`);
    });
  })
  .catch((err) => {
    console.error("❌ [server] MongoDB connection FAILED:", err.message);
    console.error("❌ [server] Stack:", err.stack);
    // Do NOT call process.exit() on shared hosting — Passenger will restart
  });

// ── Crash guards ──────────────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("💥 [server] UNCAUGHT EXCEPTION:", err.message);
  console.error("💥 [server] Stack:", err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 [server] UNHANDLED REJECTION at:", promise);
  console.error("💥 [server] Reason:", reason);
});