const pool = require("../config/db.js");

// Donut Chart: Total per Disruption Type
const getDisruptionTypeTotals = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT disruptiontype, COUNT(*) as total FROM articles WHERE isdeleted = false GROUP BY disruptiontype"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching disruption type totals:", error.message);
    res.status(500).json({ message: "Error fetching disruption type totals." });
  }
};

// Bar Chart: Jumlah per Disruption Type per minggu
const getWeeklyDisruptionTypeCounts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Query SQL dengan filtering berdasarkan tanggal
    const result = await pool.query(`
      SELECT disruptiontype, 
             DATE_TRUNC('week', publisheddate) as week_start, 
             COUNT(*) as total 
      FROM articles 
      WHERE isdeleted = false
        AND publisheddate >= $1
        AND publisheddate <= $2
      GROUP BY disruptiontype, week_start 
      ORDER BY week_start ASC
    `, [startDate, endDate]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching weekly disruption type counts:", error.message);
    res.status(500).json({ message: "Error fetching weekly disruption type counts." });
  }
};

// Line Chart: Total per Severity Level per published date
const getSeverityLevelCounts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const result = await pool.query(`
      SELECT severity, 
             DATE_TRUNC('week', publisheddate) as week_start, 
             COUNT(*) as total 
      FROM articles 
      WHERE isdeleted = false 
        AND publisheddate >= $1
        AND publisheddate <= $2
      GROUP BY severity, week_start 
      ORDER BY week_start ASC
    `, [startDate, endDate]);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching severity level counts:", error.message);
    res.status(500).json({ message: "Error fetching severity level counts." });
  }
};

// Total per Severity Level (Low, Medium, High)
const getTotalSeverityCounts = async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT severity, COUNT(*) as total 
        FROM articles 
        WHERE isdeleted = false 
        GROUP BY severity
      `);
      res.status(200).json(result.rows);
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
