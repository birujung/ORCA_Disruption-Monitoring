/**
 * Main Application Entry Point
 * 
 * This module sets up the Express.js server, connects to the MongoDB database,
 * configures middleware, defines API routes, and schedules periodic tasks using cron jobs.
 * 
 * Dependencies:
 * - Express.js: For building the REST API.
 * - CORS: To allow cross-origin requests.
 * - Node-Cron: For scheduling periodic tasks.
 * - Compression: To compress HTTP responses for faster client-side performance.
 * - Express-Rate-Limit: To limit the number of requests from a single IP address within a specific time frame.
 * - dotenv: To manage environment variables.
 */
const express = require("express");
const { connectDB } = require("./config/db.js");
const cors = require("cors");
const cron = require("node-cron");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

require('dotenv').config();

// Importing route modules
const articleRoutes = require("./routes/articleRoutes");
const preferenceRoutes = require("./routes/preferenceRoutes");
const analyticsRoutes = require('./routes/analyticRoutes');

const app = express();

/**
 * Middleware Configuration
 * 
 * - Enables CORS to allow requests from different origins.
 * - Parses incoming JSON requests.
 * - Compresses responses to improve performance.
 * - Sets up rate limiting to prevent abuse and improve security.
 */
app.use(cors());
app.use(express.json());
app.use(compression());

app.set("trust proxy", 1);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Maximum 100 requests per IP in the specified time window
});
app.use(limiter);

/**
 * Database Connection and Route Setup
 * 
 * - Connects to MongoDB using the `connectDB` function.
 * - Registers API routes for articles, preferences, and analytics.
 */
connectDB().then(() => {
  app.use("/api/articles", articleRoutes);
  app.use("/api/preferences", preferenceRoutes);
  app.use('/api/analytics', analyticsRoutes);

  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

/**
 * Scheduled Cron Job
 * 
 * - Schedules a task to run every day at 8:00 AM.
 * - Executes the `scrapeAndSaveArticles` function to scrape and save articles to the database.
 * - (Need run continously, can't just run locally)
 */
cron.schedule("0 8 * * *", async () => {
  console.log("Running scheduled scraping task at 8:00 AM...");
  try {
    // Simulate the request with fixed parameters
    const req = {
      query: {
        from: new Date().toISOString().slice(0, 10), // Current date
        to: new Date().toISOString().slice(0, 10),   // Current date
      },
    };
    const res = {
      status: (code) => ({
        json: (message) => console.log("Scraping Result:", message),
      }),
    };

    // Run the scrape function
    await scrapeAndSaveArticles(req, res);
    console.log("Scraping task completed successfully!");
  } catch (error) {
    console.error("Error running scheduled scraping task:", error.message);
  }
});

/**
 * Error Handling
 * 
 * - Captures and logs unhandled exceptions.
 * - Ensures the application exits gracefully in case of fatal errors.
 */
process.on("uncaughtException", (err) => {
  console.error("Unhandled Exception:", err);
  process.exit(1);
});