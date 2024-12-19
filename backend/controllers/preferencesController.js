/**
 * Article Filtering and Utility Endpoints
 * 
 * This module provides endpoints to filter articles based on user preferences, 
 * fetch distinct values for dropdowns, and perform generic search functionality.
 * 
 * Dependencies:
 * - MongoDB for querying and filtering article data.
 * - Express.js for handling API requests and responses.
 */
const { getDB } = require("../config/db.js");
const { ObjectId } = require("mongodb");

/**
 * Get Available Locations for Dropdown
 * 
 * This function retrieves distinct locations from the database for populating a dropdown.
 * Filters out deleted articles (`isdeleted: true`).
 * 
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @returns {JSON} Sorted list of unique locations.
 */
const getAvailableLocations = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    const locations = await collection.distinct("location", { isdeleted: { $ne: true } });

    res.status(200).json(locations.sort());
  } catch (error) {
    console.error("Error fetching available locations:", error.message);
    res.status(500).json({ message: "Error fetching available locations." });
  }
};

/**
 * Get Available Disruption Types for Dropdown
 * 
 * This function retrieves distinct disruption types from the database for populating a dropdown.
 * Filters out deleted articles (`isdeleted: true`).
 * 
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @returns {JSON} Sorted list of unique disruption types.
 */
const getAvailableDisruptionTypes = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    const disruptionTypes = await collection.distinct("disruptionType", { isdeleted: { $ne: true } });

    res.status(200).json(disruptionTypes.sort());
  } catch (error) {
    console.error("Error fetching available disruption types:", error.message);
    res.status(500).json({ message: "Error fetching available disruption types." });
  }
};

/**
 * Get Available Severity Levels for Dropdown
 * 
 * This function retrieves distinct severity levels from the database for populating a dropdown.
 * Filters out deleted articles (`isdeleted: true`).
 * 
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 * @returns {JSON} Sorted list of unique severity levels.
 */
const getAvailableSeverityLevels = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    const severityLevels = await collection.distinct("severity", { isdeleted: { $ne: true } });

    res.status(200).json(severityLevels.sort());
  } catch (error) {
    console.error("Error fetching available severity levels:", error.message);
    res.status(500).json({ message: "Error fetching available severity levels." });
  }
};

/**
 * Filter Articles by User Preferences
 * 
 * This function filters articles based on a variety of criteria provided in the query parameters:
 * - Date range (`fromDate` and `toDate`)
 * - Locations
 * - Disruption types
 * - Severity levels
 * - Suppliers
 * 
 * Filters out deleted articles (`isdeleted: true`) by default.
 * 
 * @param {Object} req Express request object with query parameters.
 * @param {Object} res Express response object.
 * @returns {JSON} List of filtered articles sorted by published date in descending order.
 */
const filterArticlesByPreferences = async (req, res) => {
  const {
    fromDate,
    toDate,
    locations,
    radius,
    disruptionTypes,
    severityLevels,
    suppliers,
  } = req.query;

  const db = getDB();
  const collection = db.collection(process.env.COLLECTION_NAME);

  const filter = { isdeleted: { $ne: true } };

  // Filter by date range if both fromDate and toDate are provided
  if (fromDate && toDate) {
    filter.publishedDate = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }

  // Filter by locations if provided
  if (locations && locations.length > 0) {
    filter.location = { $in: locations.split(",") };
  }

  // Filter by disruption types if provided
  if (disruptionTypes && disruptionTypes.length > 0) {
    filter.disruptionType = { $in: disruptionTypes.split(",") };
  }

  // Filter by severity levels if provided
  if (severityLevels && severityLevels.length > 0) {
    filter.severity = { $in: severityLevels.split(",") };
  }

  // Filter by suppliers if provided
  if (suppliers && suppliers.length > 0) {
    filter.sourceName = { $in: suppliers.split(",") };
  }

  try {
    const articles = await collection
      .find(filter)
      .sort({ publishedDate: -1 })
      .toArray();

    res.status(200).json(articles);
  } catch (error) {
    console.error("Error filtering articles:", error.message);
    res.status(500).json({ message: "Error filtering articles." });
  }
};

/**
 * Search Articles by Query
 * 
 * This function performs a generic search on articles based on a user-provided query.
 * The search is conducted on the following fields:
 * - Title
 * - Location
 * - Disruption type
 * - Severity level
 * 
 * Filters out deleted articles (`isdeleted: true`) by default.
 * 
 * @param {Object} req Express request object with a `query` parameter.
 * @param {Object} res Express response object.
 * @returns {JSON} List of articles matching the search query, sorted by published date in descending order.
 */
const searchArticles = async (req, res) => {
  const { query } = req.query;

  const db = getDB();
  const collection = db.collection(process.env.COLLECTION_NAME);

  try {
    const articles = await collection
      .find({
        isdeleted: { $ne: true },
        $or: [
          { title: { $regex: query, $options: "i" } },
          { location: { $regex: query, $options: "i" } },
          { disruptionType: { $regex: query, $options: "i" } },
          { severity: { $regex: query, $options: "i" } },
        ],
      })
      .sort({ publishedDate: -1 })
      .toArray();

    res.status(200).json(articles);
  } catch (error) {
    console.error("Error searching articles:", error.message);
    res.status(500).json({ message: "Error searching articles." });
  }
};

module.exports = {
  filterArticlesByPreferences,
  getAvailableLocations,
  getAvailableDisruptionTypes,
  getAvailableSeverityLevels,
  searchArticles,
};