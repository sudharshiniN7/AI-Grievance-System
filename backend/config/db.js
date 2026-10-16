const mongoose = require("mongoose");

/**
 * Database Configuration
 * -----------------------
 * Handles the MongoDB connection using Mongoose. Reads the connection
 * string from an environment variable so credentials are never hard-coded.
 */

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/grievance_redressal";

/**
 * Connects to MongoDB. Exits the process if the connection fails,
 * since the API cannot function without a database.
 */
async function connectDB() {
  try {
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
}

// ---------- Connection event listeners ----------
// Useful for logging unexpected disconnects during development/demo.
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

module.exports = connectDB;