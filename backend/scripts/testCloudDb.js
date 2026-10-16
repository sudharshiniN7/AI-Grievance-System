const mongoose = require("mongoose");

const uri = process.argv[2] || process.env.CLOUD_MONGO_URI;

if (!uri) {
  console.error("Error: No connection string provided.");
  console.log("Usage: node backend/scripts/testCloudDb.js \"mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/grievance_redressal?retryWrites=true&w=majority\"");
  process.exit(1);
}

console.log("Testing connection to cloud MongoDB...");

mongoose
  .connect(uri, { serverSelectionTimeoutMS: 8000 })
  .then((conn) => {
    console.log(">>> SUCCESS! Cloud MongoDB connection established.");
    console.log(`    Host: ${conn.connection.host}`);
    console.log(`    Database: ${conn.connection.name}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n>>> FAILED to connect:", err.message);
    if (err.message.includes("bad auth") || err.message.includes("Authentication failed")) {
      console.error("    Tip: Check your database username and password in the connection string.");
      console.error("    If your password contains special characters like '@', '#', or '%', URL-encode them (e.g. '@' -> '%40').");
    } else if (err.message.includes("querySrv") || err.message.includes("ENOTFOUND")) {
      console.error("    Tip: The cluster address in your connection string is invalid.");
    } else if (err.message.includes("timed out") || err.message.includes("Server selection timed out")) {
      console.error("    Tip: MongoDB Atlas Network Access is blocking the connection.");
      console.error("    Go to MongoDB Atlas -> Network Access -> Add IP Address -> Select 'Allow Access From Anywhere' (0.0.0.0/0).");
    }
    process.exit(1);
  });
