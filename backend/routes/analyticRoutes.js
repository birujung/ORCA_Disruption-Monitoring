/**
 * Analytics Routes
 * 
 * This module defines the API routes for fetching analytics data.
 * 
 * - Each route corresponds to a specific analytical chart or data aggregation.
 * - The routes utilize controller functions for data processing and retrieval.
 * 
 * Dependencies:
 * - Express.js for defining and handling API routes.
 * - Analytics controller functions for data aggregation.
 */
const express = require('express');
const router = express.Router();
const { getDisruptionTypeTotals, getWeeklyDisruptionTypeCounts, getSeverityLevelCounts, getTotalSeverityCounts } = require('../controllers/analyticsController.js');

/**
 * Route: Get Disruption Type Totals
 * 
 * - Endpoint: `/disruption-type-totals`
 * - Method: GET
 * - Description: Fetches the total counts for each disruption type.
 * - Usage: Used to display a donut chart showing the distribution of disruption types.
 */
router.get('/disruption-type-totals', getDisruptionTypeTotals);

/**
 * Route: Get Weekly Disruption Type Counts
 * 
 * - Endpoint: `/weekly-disruption-type-counts`
 * - Method: GET
 * - Description: Fetches the weekly counts for each disruption type.
 * - Usage: Used to display a donut chart showing disruption type counts per week and month.
 */
router.get('/weekly-disruption-type-counts', getWeeklyDisruptionTypeCounts);

/**
 * Route: Get Severity Level Counts
 * 
 * - Endpoint: `/severity-level-counts`
 * - Method: GET
 * - Description: Fetches the total counts for each severity level (Low, Medium, High) over time.
 * - Usage: Used to display a donut chart showing severity levels by publication date.
 */
router.get('/severity-level-counts', getSeverityLevelCounts);

/**
 * Route: Get Total Severity Level Counts
 * 
 * - Endpoint: `/total-severity-counts`
 * - Method: GET
 * - Description: Fetches the overall total counts for each severity level (Low, Medium, High).
 * - Usage: Used to display a summary of severity levels in a single dataset.
 */
router.get('/total-severity-counts', getTotalSeverityCounts);

module.exports = router;