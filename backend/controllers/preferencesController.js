const pool = require("../config/db.js");

// Function to get available locations for location dropdown
const getAvailableLocations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT location FROM Cities
      WHERE IsDeleted = false
      ORDER BY location ASC;
    `);
    res.status(200).json(result.rows.map(row => row.location));
  } catch (error) {
    console.error("Error fetching available locations:", error.message);
    res.status(500).json({ message: "Error fetching available locations." });
  }
};

// Function to get available disruption types for disruption type dropdown
const getAvailableDisruptionTypes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT category_name FROM Disruption_Categories
      WHERE IsDeleted = false
      ORDER BY category_name ASC;
    `);
    res.status(200).json(result.rows.map(row => row.category_name));
  } catch (error) {
    console.error("Error fetching available disruption types:", error.message);
    res.status(500).json({ message: "Error fetching available disruption types." });
  }
};

// Function to get available severity levels for severity level dropdown
const getAvailableSeverityLevels = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT severity FROM Articles
      WHERE IsDeleted = false
      ORDER BY severity ASC;
    `);
    res.status(200).json(result.rows.map(row => row.severity));
  } catch (error) {
    console.error("Error fetching available severity levels:", error.message);
    res.status(500).json({ message: "Error fetching available severity levels." });
  }
};

// Function to filter articles based on user preferences
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

  let query = `SELECT * FROM Articles WHERE IsDeleted = false`;
  const filterClauses = [];
  const values = [];

  // Filter by date range if both fromDate and toDate are provided
  if (fromDate && toDate) {
    filterClauses.push(`publishedDate BETWEEN $${values.length + 1} AND $${values.length + 2}`);
    values.push(fromDate, toDate);
  }

  // Filter by locations if provided
  if (locations && locations.length > 0) {
    filterClauses.push(`location = ANY($${values.length + 1}::text[])`);
    values.push(locations);
  }

  // Filter by radius if provided
  if (radius) {
    filterClauses.push(`
      ST_DistanceSphere(ST_MakePoint(lat, lng), ST_MakePoint($${values.length + 1}, $${values.length + 2})) <= $${values.length + 3}
    `);
    values.push(req.body.userLat, req.body.userLng, radius);
  }

  // Filter by disruption types if provided
  if (disruptionTypes && disruptionTypes.length > 0) {
    filterClauses.push(`disruptionType = ANY($${values.length + 1}::text[])`);
    values.push(disruptionTypes);
  }

  // Filter by severity levels if provided
  if (severityLevels && severityLevels.length > 0) {
    filterClauses.push(`severity = ANY($${values.length + 1}::text[])`);
    values.push(severityLevels);
  }

  // Filter by suppliers if provided
  if (suppliers && suppliers.length > 0) {
    filterClauses.push(`sourceName = ANY($${values.length + 1}::text[])`);
    values.push(suppliers);
  }

  // Combine all conditions
  if (filterClauses.length > 0) {
    query += ` AND ${filterClauses.join(" AND ")}`;
  }

  query += ` ORDER BY publishedDate DESC;`;

  try {
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error filtering articles:", error.message);
    res.status(500).json({ message: "Error filtering articles." });
  }
};

// Endpoint to search articles by a generic search term
const searchArticles = async (req, res) => {
  const { query } = req.query;

  try {
    const result = await pool.query(`
      SELECT * FROM Articles
      WHERE IsDeleted = false
      AND (title ILIKE $1 OR location ILIKE $1 OR disruptiontype ILIKE $1 OR severity ILIKE $1)
      ORDER BY publisheddate DESC
    `, [`%${query}%`]);

    res.status(200).json(result.rows);
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
