const express = require('express');
const router = express.Router();
const { getDisruptionTypeTotals, getWeeklyDisruptionTypeCounts, getSeverityLevelCounts, getTotalSeverityCounts } = require('../controllers/analyticsController.js');

// Route untuk Donut Chart (Total per Disruption Type)
router.get('/disruption-type-totals', getDisruptionTypeTotals);

// Route untuk Bar Chart (Jumlah per Disruption Type per minggu)
router.get('/weekly-disruption-type-counts', getWeeklyDisruptionTypeCounts);

// Route untuk Line Chart (Total per Severity Level per tanggal publikasi)
router.get('/severity-level-counts', getSeverityLevelCounts);

// Route untuk Total per Severity Level (Low, Medium, High)
router.get('/total-severity-counts', getTotalSeverityCounts);

module.exports = router;