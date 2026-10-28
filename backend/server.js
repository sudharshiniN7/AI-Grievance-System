const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // <-- ADDED

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const complaintRoutes = require("./routes/complaintRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes"); // <-- ADDED
const { autoSeedAdminIfConfigured } = require("./controllers/authController");

/**
 * Server Entry Point
 * --------------------
 * Bootstraps the Express app: connects to MongoDB, wires up middleware
 * and routes, and starts listening for requests.
 */

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Connect to MongoDB & Auto-seed Admin ----------
connectDB().then(() => {
  autoSeedAdminIfConfigured();
});

// ---------- Global middleware ----------

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  "https://resolvex-lemon.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /^https:\/\/[\w-]+\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin not allowed: " + origin), false);
    },
    credentials: true,
  })
);

app.use(cookieParser()); // <-- ADDED — populates req.cookies, required by authMiddleware.js

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Health check ----------
app.get(["/", "/health", "/api"], (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(200).json({
    success: true,
    message: "Passenger Grievance Redressal System API is running.",
    database: dbStatus,
  });
});

// ---------- Database connectivity guard for API routes ----------
app.use(["/api", "/auth", "/complaints", "/dashboard"], (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message:
        "Database connection unavailable. Please make sure MongoDB is running locally on 127.0.0.1:27017.",
    });
  }
  next();
});

// ---------- API routes ----------
app.use("/api/auth", authRoutes); // <-- ADDED
app.use("/api/complaints", complaintRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Compatibility route aliases (without /api prefix)
app.use("/auth", authRoutes);
app.use("/complaints", complaintRoutes);
app.use("/dashboard", dashboardRoutes);

// ---------- 404 handler ----------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ---------- Global error handler ----------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong on the server.",
  });
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});