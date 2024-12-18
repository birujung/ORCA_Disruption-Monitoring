const express = require("express");
const { connectDB } = require("./config/db.js");
const cors = require("cors");
const cron = require("node-cron");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

require('dotenv').config();

const articleRoutes = require("./routes/articleRoutes");
const preferenceRoutes = require("./routes/preferenceRoutes");
const analyticsRoutes = require('./routes/analyticRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(compression());

app.set("trust proxy", 1);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100 // maksimal 100 request per IP
});
app.use(limiter);

// Koneksi ke MongoDB
connectDB().then(() => {
  app.use("/api/articles", articleRoutes);
  app.use("/api/preferences", preferenceRoutes);
  app.use('/api/analytics', analyticsRoutes);

  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// Schedule Cron Job to Run at 8 AM Everyday
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

// Error Handling
process.on("uncaughtException", (err) => {
  console.error("Unhandled Exception:", err);
  process.exit(1);
});