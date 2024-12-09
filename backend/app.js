const express = require("express");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

require('dotenv').config();

const articleRoutes = require("./routes/articleRoutes");
const preferenceRoutes = require("./routes/preferenceRoutes");
const analyticsRoutes = require('./routes/analyticRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(compression());
app.use(morgan("combined"));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100 // maksimal 100 request per IP
});
app.use(limiter);

// Routes
app.use("/api/articles", articleRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Handling
process.on("uncaughtException", (err) => {
  console.error("Unhandled Exception:", err);
  process.exit(1);
});

const transporter = nodemailer.createTransport({
  service: "gmail", // Atau email service lain
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

process.on("unhandledRejection", (reason, promise) => {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: "admin@example.com", // Email tujuan
    subject: "Unhandled Rejection Detected",
    text: `An unhandled rejection occurred:\n\n${reason}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Gagal mengirim email:", error);
    } else {
      console.log("Email notifikasi terkirim:", info.response);
    }
  });
  console.error("Unhandled Rejection:", reason);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});