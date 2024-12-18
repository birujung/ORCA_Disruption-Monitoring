const { getDB } = require("../config/db.js");

const getDisruptionTypeTotals = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    const result = await collection
      .aggregate([
        { 
          $match: { isdeleted: { $ne: true } } 
        },
        { 
          $group: { 
            _id: { $ifNull: ["$disruptionType", "Unknown"] }, // Ganti null/undefined menjadi "Unknown"
            total: { $sum: 1 }
          } 
        },
        { 
          $project: { 
            disruptionType: "$_id", 
            total: 1, 
            _id: 0 
          } 
        },
        { $sort: { total: -1 } } // Urutkan berdasarkan total
      ])
      .toArray();

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching disruption type totals:", error.message);
    res.status(500).json({ message: "Error fetching disruption type totals." });
  }
};

// Helper: Get Last Week Date Range
const getLastWeekRange = () => {
  const today = new Date();
  const startOfLastWeek = new Date(today);
  startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
  startOfLastWeek.setHours(0, 0, 0, 0); // Reset jam ke 00:00:00
  const endOfLastWeek = new Date(startOfLastWeek);
  endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
  endOfLastWeek.setHours(23, 59, 59, 999); // Set jam ke 23:59:59

  console.log("Last Week Range:", startOfLastWeek, endOfLastWeek); // Debug
  return { start: startOfLastWeek, end: endOfLastWeek };
};

const getLastMonthRange = () => {
  const today = new Date();
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  endOfLastMonth.setHours(23, 59, 59, 999);

  console.log("Last Month Range:", startOfLastMonth, endOfLastMonth); // Debug
  return { start: startOfLastMonth, end: endOfLastMonth };
};

// Endpoint: Weekly Disruption Counts with Filter
const getWeeklyDisruptionTypeCounts = async (req, res) => {
  try {
    const { range } = req.query; // Parameter untuk lastweek / lastmonth
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    let dateRange;

    // Ambil rentang tanggal berdasarkan filter
    if (range === "lastweek") {
      dateRange = getLastWeekRange();
    } else if (range === "lastmonth") {
      dateRange = getLastMonthRange();
    } else {
      return res.status(400).json({ message: "Invalid range. Use 'lastweek' or 'lastmonth'." });
    }

    // MongoDB Aggregation Pipeline
    const result = await collection
      .aggregate([
        {
          $addFields: { // Konversi publishedDate ke Date jika berupa string
            publishedDate: { $toDate: "$publishedDate" },
          },
        },
        {
          $match: {
            isdeleted: { $ne: true }, // Tidak termasuk data yang dihapus
            publishedDate: {
              $gte: dateRange.start, // Tanggal mulai
              $lte: dateRange.end,   // Tanggal akhir
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
      ])
      .toArray();

    console.log("Result:", result); // Debug hasil query
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching weekly disruption counts:", error.message);
    res.status(500).json({ message: "Error fetching weekly disruption counts." });
  }
};

// Endpoint: Severity Counts with Filter
const getSeverityLevelCounts = async (req, res) => {
  try {
    const { range, period } = req.query; // Parameter range dan period
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    let dateRange;

    if (range === "lastweek") {
      dateRange = getLastWeekRange();
    } else if (range === "lastmonth") {
      dateRange = getLastMonthRange();
    } else {
      return res.status(400).json({ message: "Invalid range. Use 'lastweek' or 'lastmonth'." });
    }

    const truncUnit = period === "month" ? "month" : "week";

    const result = await collection
      .aggregate([
        {
          $addFields: { // Konversi publishedDate ke Date jika berupa string
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
              period: { $dateTrunc: { date: "$publishedDate", unit: truncUnit } },
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

    console.log("Result:", result); // Debug hasil query
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching severity counts:", error.message);
    res.status(500).json({ message: "Error fetching severity counts." });
  }
};

const getTotalSeverityCounts = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(process.env.COLLECTION_NAME);

    const result = await collection
      .aggregate([
        { $match: { isdeleted: { $ne: true } } }, // Filter artikel yang tidak dihapus
        { $group: { _id: "$severity", total: { $sum: 1 } } }, // Group by severity
        { $project: { severity: "$_id", total: 1, _id: 0 } }, // Format hasil
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
