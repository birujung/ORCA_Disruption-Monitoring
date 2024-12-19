/**
 * AnalyticsCharts Component
 * 
 * This component displays various analytical charts such as donut charts and treemaps
 * for visualizing data related to disruption types, severity levels, and keyword frequency.
 * 
 * - Supports dynamic data fetching via API.
 * - Provides time-range filtering (e.g., All Time, Last Week, Last Month).
 * - Uses React ApexCharts for rendering visually appealing charts.
 * 
 * Dependencies:
 * - `axios`: For API requests to fetch chart data.
 * - `react-apexcharts`: For rendering charts.
 * - `reactstrap`: For UI components such as `Card`, `Dropdown`, and `CardHeader`.
 * 
 * Props:
 * - `type`: Specifies the type of chart to render. Supported types are:
 *   - `"disruption"`: Donut chart for disruption type distribution.
 *   - `"severity"`: Donut chart for severity levels.
 *   - `"keywordTreemap"`: Treemap chart for keyword frequency.
 */
import axios from "axios";
import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import {
  Card,
  CardBody,
  CardHeader,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  UncontrolledDropdown,
} from "reactstrap";

// Predefined colors for chart categories
const disruptionTypeColors = {
  "Airport Disruption": "#0d6efd",
  "Bankruptcy": "#6610f2",
  "Business Spin-Off": "#6f42c1",
  "Business Sale": "#00c292",
  "Chemical Spill": "#ffbc00",
  "Corruption": "#ff5b5b",
  "Company Split": "#dc3545",
  "Cyber Attack": "#ffc107",
  "FDA/EMA/OSHA Action": "#28a745",
  "Factory Fire": "#17a2b8",
  "Fine": "#ff8c00",
  "Geopolitical": "#e83e8c",
  "Leadership Transition": "#fd7e14",
  "Legal Action": "#20c997",
  "Merger & Acquisition": "#f44336",
  "Port Disruption": "#9c27b0",
  "Protest/Riot": "#3f51b5",
  "Supply Shortage": "#8bc34a",
  "Earthquake": "#00bcd4",
  "Extreme Weather": "#cddc39",
  "Flood": "#ffeb3b",
  "Hurricane": "#607d8b",
  "Tornado": "#9e9e9e",
  "Volcano": "#3e2723",
  "Human Health": "#8e24aa",
  "Power Outage": "#795548",
  "CNA": "#c2185b",
  "Unknown": "#f57c00",
};
const severityColors = {
  High: "#dc3545",   // Merah
  Medium: "#ffc107", // Kuning
  Low: "#28a745",    // Hijau
};

const AnalyticsCharts = ({ type }) => {
  // State variables
  const [chartOptions, setChartOptions] = useState({});
  const [chartSeries, setChartSeries] = useState([]);
  const [timeRange, setTimeRange] = useState("total");

  /**
   * Fetch data based on chart type and time range.
   */
  useEffect(() => {
    const fetchData = async () => {
      if (type === "keywordTreemap") {
        try {
          const response = await axios.get("/api/articles/keywords");
          const data = response.data

          // Process and filter data for treemap
          const filteredData = data
            .filter((item) => item.word && typeof item.count === "number")
            .map(({ word, count }) => ({ x: word, y: count }))
            .slice(0, 20);

          console.log(filteredData)

          setChartOptions({
            chart: { type: "treemap", height: 350 },
            title: {
              text: "Top Keywords",
              align: "center",
              style: { fontWeight: 500 },
            },
            legend: { show: false },
            plotOptions: {
              treemap: {
                distributed: true,
                enableShades: false,
              },
            },
          });

          setChartSeries([{ data: filteredData }]);
        } catch (error) {
          console.error("Error fetching keywords:", error);
        }
      }

      let endpoint = "";
      let queryParams = {};

      // Determine endpoint and parameters based on time range and type
      if (timeRange === "week") {
        switch (type) {
          case "disruption":
            endpoint = "/api/analytics/weekly-disruption-type-counts";
            queryParams = { range: "lastweek" };
            break;
          case "severity":
            endpoint = "/api/analytics/severity-level-counts";
            queryParams = { range: "lastweek" };
            break;
          default:
            return;
        }
      } else if (timeRange === "month") {
        switch (type) {
          case "disruption":
            endpoint = "/api/analytics/weekly-disruption-type-counts";
            queryParams = { range: "lastmonth" };
            break;
          case "severity":
            endpoint = "/api/analytics/severity-level-counts";
            queryParams = { range: "lastmonth" };
            break;
          default:
            return;
        }
      } else {
        switch (type) {
          case "disruption":
            endpoint = "/api/analytics/disruption-type-totals";
            break;
          case "severity":
            endpoint = "/api/analytics/total-severity-counts";
            break;
          default:
            return;
        }
      }

      try {
        const response = await axios.get(endpoint, { params: queryParams });
        const data = response.data;

        // Group and map data for chart
        const groupedData = data.reduce((acc, item) => {
          const label = item.disruptionType || item.severity || "Unknown";
          if (!acc[label]) acc[label] = 0;
          acc[label] += parseInt(item.total, 10);
          return acc;
        }, {});        

        const categories = Object.keys(groupedData);
        const series = categories.map((category) => groupedData[category]);
        const colors = categories.map(
          (category) => disruptionTypeColors[category] || "#000000"
        );

        setChartOptions({
          chart: {
            type: "donut",
            height: 350,
          },
          labels: categories,
          colors:
            type === "severity"
              ? categories.map((category) => severityColors[category] || "#000000")
              : colors,
          plotOptions: {
            pie: {
              donut: {
                size: '40%',
                labels: {
                  show: false,
                  value: {
                    show: true,
                    fontSize: '14px',
                  },
                  total: {
                    show: false,
                  },
                },
              },
            },
          },
          tooltip: {
            y: {
              formatter: function (value, { seriesIndex, dataPointIndex }) {
                return value;
              }
            }
          },
          legend: {
            show: type !== "disruption" && type !== "severity",
          },
          dataLabels: {
            enabled: true,
          },
        });
        setChartSeries(series);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchData();
  }, [type, timeRange]);

  /**
   * Get chart title based on type.
   */
  const getTitle = () => {
    switch (type) {
      case "disruption":
        return "Disruption Types";
      case "severity":
        return "Severity Levels";
      case "keywordTreemap":
        return "Top Keywords";
      default:
        return "Chart";
    }
  };

  /**
   * Handle time range selection.
   */
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  /**
   * Render the chart.
   */
  if (type === "keywordTreemap") {
    return (
      <Card>
        <CardHeader className="d-flex align-items-center justify-content-between">
          <h5 className="card-title mb-0">Top Keywords</h5>
        </CardHeader>
        <CardBody style={{ minHeight: "300px" }}>
          <ReactApexChart
            className="apex-charts"
            series={chartSeries}
            options={chartOptions}
            type="treemap"
            height="100%"
            weight={500}
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="d-flex align-items-center justify-content-between">
        <h5 className="card-title mb-0">{getTitle()}</h5>
        <UncontrolledDropdown>
          <DropdownToggle tag="a" className="text-reset dropdown-btn">
            <span className="fw-semibold text-uppercase fs-12">Sort by: </span>
            <span className="text-muted">
              {timeRange === "week"
                ? "Last Week"
                : timeRange === "month"
                ? "Last Month" 
                : "All Time"}
              <i className="mdi mdi-chevron-down ms-1"></i>
            </span>
          </DropdownToggle>
          <DropdownMenu className="dropdown-menu-end">
            <DropdownItem onClick={() => handleTimeRangeChange("total")}>All Time</DropdownItem>
            <DropdownItem onClick={() => handleTimeRangeChange("week")}>Last Week</DropdownItem>
            <DropdownItem onClick={() => handleTimeRangeChange("month")}>Last Month</DropdownItem>
          </DropdownMenu>
        </UncontrolledDropdown>
      </CardHeader>
      <CardBody>
        <ReactApexChart
          options={chartOptions}
          series={chartSeries}
          type="donut"
          height={350}
        />
      </CardBody>
    </Card>
  );
};

export default AnalyticsCharts;