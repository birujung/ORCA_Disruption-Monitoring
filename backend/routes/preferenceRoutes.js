const express = require("express");
const router = express.Router();
const preferencesController = require("../controllers/preferencesController.js");

// Endpoint for filtering articles by preferences
router.get("/filter-articles", preferencesController.filterArticlesByPreferences);

// Endpoint to get available locations for the dropdown
router.get("/available-locations", preferencesController.getAvailableLocations);

// Endpoint to get available disruption types for the dropdown
router.get("/available-disruption-types", preferencesController.getAvailableDisruptionTypes);

// Endpoint to get available severity levels for the dropdown
router.get("/available-severity-levels", preferencesController.getAvailableSeverityLevels);

// Endpoint to search generic articles
router.get("/search", preferencesController.searchArticles);

module.exports = router;