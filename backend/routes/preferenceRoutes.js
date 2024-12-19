/**
 * Preferences Routes
 * 
 * This module defines the API routes for managing user preferences and filtering articles.
 * 
 * - Each route corresponds to a specific operation related to filtering articles or retrieving metadata for dropdowns.
 * - The routes utilize controller functions for handling data processing and database queries.
 * 
 * Dependencies:
 * - Express.js for defining and handling API routes.
 * - Preferences controller functions for processing and managing filtering preferences.
 */
const express = require("express");
const router = express.Router();
const preferencesController = require("../controllers/preferencesController.js");

/**
 * Route: Filter Articles by Preferences
 * 
 * - Endpoint: `/filter-articles`
 * - Method: GET
 * - Description: Filters articles based on user-defined preferences such as date range, locations, disruption types, severity levels, and suppliers.
 * - Usage: Provides a list of articles matching the specified criteria.
 */
router.get("/filter-articles", preferencesController.filterArticlesByPreferences);

/**
 * Route: Get Available Locations for Dropdown
 * 
 * - Endpoint: `/available-locations`
 * - Method: GET
 * - Description: Retrieves distinct locations available in the database for populating a dropdown menu.
 * - Usage: Provides a list of unique locations to users for filtering or selection.
 */
router.get("/available-locations", preferencesController.getAvailableLocations);

/**
 * Route: Get Available Disruption Types for Dropdown
 * 
 * - Endpoint: `/available-disruption-types`
 * - Method: GET
 * - Description: Retrieves distinct disruption types available in the database for populating a dropdown menu.
 * - Usage: Provides a list of unique disruption types to users for filtering or selection.
 */
router.get("/available-disruption-types", preferencesController.getAvailableDisruptionTypes);

/**
 * Route: Get Available Severity Levels for Dropdown
 * 
 * - Endpoint: `/available-severity-levels`
 * - Method: GET
 * - Description: Retrieves distinct severity levels available in the database for populating a dropdown menu.
 * - Usage: Provides a list of unique severity levels to users for filtering or selection.
 */
router.get("/available-severity-levels", preferencesController.getAvailableSeverityLevels);

/**
 * Route: Search Articles
 * 
 * - Endpoint: `/search`
 * - Method: GET
 * - Description: Performs a generic search across multiple fields (e.g., title, location, disruption type, severity) in the articles database.
 * - Usage: Provides a list of articles matching the search query.
 */
router.get("/search", preferencesController.searchArticles);

module.exports = router;