require("dotenv").config();
const dashboardRoutes = require("./routes/dashboardRoutes");
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const complaintRoutes = require("./routes/complaintRoutes");

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
app.use(cors());
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
app.use("/api/complaints", complaintRoutes);
app.use("/api/dashboard", dashboardRoutes);
// ---------- 404 handler ----------
// Catches any request to a route that doesn't exist.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ---------- Global error handler ----------
// Catches any error passed via next(err) or thrown in an async handler
// that wasn't already caught locally.
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