const mongoose = require("mongoose");

async function connectDB(req, res, next) {
  try {
    if (mongoose.connection.readyState === 1) return next(); 
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI missing in .env");
    await mongoose.connect(uri, { dbName: "soundscope" });
    next();
  } catch (err) {
    console.error("DB connection error:", err.message);
    res.status(500).json({ error: "Database connection failed" });
  }
}

module.exports = connectDB;