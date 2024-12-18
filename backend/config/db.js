const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);

let db;

const connectDB = async () => {
  try {
    await client.connect();
    db = client.db(process.env.DATABASE_NAME);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) throw new Error("Database not initialized");
  return db;
};

module.exports = { connectDB, getDB };