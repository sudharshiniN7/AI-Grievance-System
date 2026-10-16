const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // <-- ADDED

const connectDB = require("./config/db");
const complaintRoutes = require("./routes/complaintRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes"); // <-- ADDED

/**
 * Server Entry Point
 * --------------------
 * Bootstraps the Express app: connects to MongoDB, wires up middleware
 * and routes, and starts listening for requests.
 */

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Connect to MongoDB ----------
connectDB();

// ---------- Global middleware ----------

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
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
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Passenger Grievance Redressal System API is running.",
  });
});

// ---------- API routes ----------
app.use("/api/auth", authRoutes); // <-- ADDED
app.use("/api/complaints", complaintRoutes);
app.use("/api/dashboard", dashboardRoutes);

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