/**
 * Disruption and Severity Analysis Endpoints
 *
 * This module provides endpoints for querying disruption types, weekly disruption counts,
 * severity levels, and total severity counts from a MongoDB collection.
 *
 * Dependencies:
 * - Requires `getDB` from the database configuration module to connect to the MongoDB instance.
 * - Expects the environment variable `COLLECTION_NAME` to specify the target collection.
 */

// Import the database connection utility
const { getDB } = require("../config/db.js");

/**
 * Endpoint: Get Totals for Each Disruption Type
 *
 * This function retrieves the total number of disruptions grouped by disruption type.
 *
 * - Null or undefined `disruptionType` fields are replaced with "Unknown".
 * - Results are sorted in descending order by total count.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {JSON} An array of disruption types with their total counts.
 */
const getDisruptionTypeTotals = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    const result = await collection
      .aggregate([
        {
          $match: { isdeleted: { $ne: true } },
        },
        {
          $group: {
            _id: { $ifNull: ["$disruptionType", "Unknown"] },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            disruptionType: "$_id",
            total: 1,
            _id: 0,
          },
        },
        { $sort: { total: -1 } },
      ])
      .toArray();

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching disruption type totals:", error.message);
    res.status(500).json({ message: "Error fetching disruption type totals." });
  }
};

/**
 * Helper Function: Get Last Week's Date Range
 *
 * Calculates the start and end dates for the previous week.
 *
 * @returns {Object} An object containing `start` and `end` Date objects.
 */
const getLastWeekRange = () => {
  const today = new Date();
  const startOfLastWeek = new Date(today);
  startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
  startOfLastWeek.setHours(0, 0, 0, 0);
  const endOfLastWeek = new Date(startOfLastWeek);
  endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
  endOfLastWeek.setHours(23, 59, 59, 999);

  console.log("Last Week Range:", startOfLastWeek, endOfLastWeek); // Debug
  return { start: startOfLastWeek, end: endOfLastWeek };
};

/**
 * Helper Function: Get Last Month's Date Range
 *
 * Calculates the start and end dates for the previous month.
 *
 * @returns {Object} An object containing `start` and `end` Date objects.
 */
const getLastMonthRange = () => {
  const today = new Date();
  const startOfLastMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1,
  );
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  endOfLastMonth.setHours(23, 59, 59, 999);

  console.log("Last Month Range:", startOfLastMonth, endOfLastMonth); // Debug
  return { start: startOfLastMonth, end: endOfLastMonth };
};

/**
 * Endpoint: Weekly Disruption Counts with Filter
 *
 * This function retrieves the weekly disruption counts within a specific date range.
 *
 * - Supports filtering by "lastweek" or "lastmonth".
 * - Results are grouped by week and disruption type.
 *
 * @param {Object} req - Express request object, expects a `range` query parameter.
 * @param {Object} res - Express response object.
 * @returns {JSON} An array of disruption counts grouped by week and type.
 */
const getWeeklyDisruptionTypeCounts = async (req, res) => {
  try {
    const { range } = req.query;
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    let dateRange;
    if (range === "lastweek") {
      dateRange = getLastWeekRange();
    } else if (range === "lastmonth") {
      dateRange = getLastMonthRange();
    } else {
      return res
        .status(400)
        .json({ message: "Invalid range. Use 'lastweek' or 'lastmonth'." });
    }

    const result = await collection
      .aggregate([
        {
          $addFields: {
            publishedDate: { $toDate: "$publishedDate" },
          },
        },
        {
          $match: {
            isdeleted: { $ne: true },
            publishedDate: {
              $gte: dateRange.start,
              $lte: dateRange.end,
            },
          },
        },
        {
          $group: {
            _id: {
              week: { $dateTrunc: { date: "$publishedDate", unit: "week" } },
              disruptionType: "$disruptionType",
            },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            week_start: "$_id.week",
            disruptionType: "$_id.disruptionType",
            total: 1,
            _id: 0,
          },
        },
        { $sort: { week_start: 1 } },
        { $limit: 50 },
      ])
      .toArray();

    console.log("Result:", result); // Debug
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching weekly disruption counts:", error.message);
    res
      .status(500)
      .json({ message: "Error fetching weekly disruption counts." });
  }
};

/**
 * Endpoint: Severity Level Counts with Filter
 *
 * Retrieves severity level counts grouped by a specific period (week/month).
 *
 * @param {Object} req - Express request object, expects `range` and `period` query parameters.
 * @param {Object} res - Express response object.
 * @returns {JSON} An array of severity level counts grouped by period.
 */
const getSeverityLevelCounts = async (req, res) => {
  try {
    const { range, period } = req.query;
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    let dateRange;

    if (range === "lastweek") {
      dateRange = getLastWeekRange();
    } else if (range === "lastmonth") {
      dateRange = getLastMonthRange();
    } else {
      return res
        .status(400)
        .json({ message: "Invalid range. Use 'lastweek' or 'lastmonth'." });
    }

    const truncUnit = period === "month" ? "month" : "week";

    const result = await collection
      .aggregate([
        {
          $addFields: {
            publishedDate: { $toDate: "$publishedDate" },
          },
        },
        {
          $match: {
            isdeleted: { $ne: true },
            publishedDate: {
              $gte: dateRange.start,
              $lte: dateRange.end,
            },
          },
        },
        {
          $group: {
            _id: {
              period: {
                $dateTrunc: { date: "$publishedDate", unit: truncUnit },
              },
              severity: "$severity",
            },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            period_start: "$_id.period",
            severity: "$_id.severity",
            total: 1,
            _id: 0,
          },
        },
        { $sort: { period_start: 1 } },
      ])
      .toArray();

    console.log("Result:", result); // Debug
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching severity counts:", error.message);
    res.status(500).json({ message: "Error fetching severity counts." });
  }
};

/**
 * Endpoint: Total Severity Counts
 *
 * Retrieves the total count of articles grouped by severity.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {JSON} An array of total severity counts.
 */
const getTotalSeverityCounts = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    const result = await collection
      .aggregate([
        { $match: { isdeleted: { $ne: true } } },
        { $group: { _id: "$severity", total: { $sum: 1 } } },
        { $project: { severity: "$_id", total: 1, _id: 0 } },
      ])
      .toArray();

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching total severity counts:", error.message);
    res.status(500).json({ message: "Error fetching total severity counts." });
  }
};

module.exports = {
  getDisruptionTypeTotals,
  getWeeklyDisruptionTypeCounts,
  getSeverityLevelCounts,
  getTotalSeverityCounts,
};
