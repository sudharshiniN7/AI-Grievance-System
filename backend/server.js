require("dotenv").config({ path: "./backend/.env" });

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

// CHANGED: was app.use(cors()) with no options — allowed all origins but
// did NOT allow credentials (cookies) to be sent/received. Auth cookies
// require an explicit origin + credentials: true; "*" and credentials
// cannot be combined per the CORS spec, so this must name the frontend's
// actual origin.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173"; // <-- ADDED
app.use(
  cors({
    origin: FRONTEND_ORIGIN, // <-- CHANGED (was: no options, i.e. allow all)
    credentials: true,        // <-- ADDED — required for the browser to send/store the auth cookie
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