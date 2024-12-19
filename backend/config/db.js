/**
 * MongoDB Utility Module
 * 
 * This module provides functionality to connect to a MongoDB database and 
 * retrieve the database instance for usage in other parts of the application.
 * 
 * Dependencies:
 * - MongoDB Node.js Driver: Provides methods for connecting and interacting with MongoDB.
 * - dotenv: Loads environment variables from a `.env` file into `process.env`.
 * 
 * Environment Variables:
 * - MONGO_URI: The URI of the MongoDB database.
 * - DATABASE_NAME: The name of the database to connect to.
 */

// Importing the MongoDB client from the MongoDB Node.js driver
const { MongoClient } = require("mongodb");

require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);

let db;

/**
 * Connect to the MongoDB database.
 * 
 * This function establishes a connection to the MongoDB server and initializes
 * the `db` variable with the selected database. It logs a success message if
 * the connection is successful, or terminates the application with an error 
 * message in case of failure.
 * 
 * @throws {Error} If the connection to MongoDB fails, it logs the error and exits the process.
 */
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

/**
 * Get the MongoDB database instance.
 * 
 * This function retrieves the connected MongoDB database instance for usage.
 * It throws an error if the database is not initialized (i.e., if `connectDB`
 * has not been called successfully).
 * 
 * @returns {Db} The MongoDB database instance.
 * @throws {Error} If the database is not initialized.
 */
const getDB = () => {
  if (!db) throw new Error("Database not initialized");
  return db;
};

module.exports = { connectDB, getDB };