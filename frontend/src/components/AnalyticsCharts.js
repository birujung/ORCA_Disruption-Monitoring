import axios from "axios";
import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Card, CardBody, CardHeader, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from "reactstrap";

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

const AnalyticsCharts = ({ type }) => {
  const [chartOptions, setChartOptions] = useState({});
  const [chartSeries, setChartSeries] = useState([]);
  const [timeRange, setTimeRange] = useState("total");

  const dummyActionData = {
    dates: ["2024-12-01", "2024-12-02", "2024-12-03", "2024-12-04", "2024-12-05"],
    counts: [20, 35, 50, 15, 40]
  };

  // Function to fetch data based on the selected time range
  useEffect(() => {
    const fetchData = async () => {
      if (type === "actions") {
        // Use dummy data for 'actions'
        const categories = ["Active", "Closed"];
        const series = categories.map(() => Math.floor(Math.random() * 100));

        setChartOptions({
          chart: { type: "donut", height: 350 },
          labels: categories,
          colors: ["#28a745", "#dc3545"],
          plotOptions: {
            pie: {
              donut: {
                size: "40%",
                labels: {
                  name: {
                    show: false,
                  },
                  show: true,
                  value: { show: true, fontSize: "14px" },
                },
              },
            },
          },
          legend: { position: "bottom" },
        });

        setChartSeries(series);
        return;
      }

      let endpoint = "";
      let startDate = "";
      let endDate = "";

      if (timeRange === "week") {
        // Set correct endpoint for weekly data
        switch (type) {
          case "disruption":
            endpoint = "/api/analytics/weekly-disruption-type-counts";
            break;
          case "severity":
            endpoint = "/api/analytics/severity-level-counts";
            break;
          default:
            return;
        }
        const { start, end } = getLastWeekDateRange(); // Get last week date range
        startDate = start;
        endDate = end;
      } else if (timeRange === "month") {
        // Set correct endpoint for monthly data
        switch (type) {
          case "disruption":
            endpoint = "/api/analytics/weekly-disruption-type-counts";
            break;
          case "severity":
            endpoint = "/api/analytics/severity-level-counts";
            break;
          case "actions":
            endpoint = "/api/analytics/weekly-actions";
            break;
          default:
            return;
        }
        const { start, end } = getLastMonthDateRange(); // Get last month date range
        startDate = start;
        endDate = end;
      } else {
        // Set correct endpoint for total data
        switch (type) {
          case "disruption":
            endpoint = "/api/analytics/disruption-type-totals";
            break;
          case "severity":
            endpoint = "/api/analytics/total-severity-counts";
            break;
          case "actions":
            endpoint = "/api/analytics/actions";
            break;
          default:
            return;
        }
      }

      try {
        const response = await axios.get(endpoint, {
          params: {
            startDate,
            endDate
          }
        });
        const { data } = response;

        // Handle specific data processing based on the type
        let series = [];
        let categories = [];
        if (type === "actions") {
          const categories = ["Active", "Closed"];
          const series = categories.map(() => Math.floor(Math.random() * 100));
        } else {
          const groupedData = data.reduce((acc, item) => {
            const label = item.label || item.disruptiontype || item.severity;
            if (!acc[label]) {
              acc[label] = 0;
            }
            acc[label] += parseInt(item.total);
            return acc;
          }, {});

          categories = Object.keys(groupedData);
          series = categories.map(type => groupedData[type]);
        }

        // Map colors based on disruption types
        const colors = categories.map((category) => disruptionTypeColors[category] || "#000000");

        setChartOptions({
          chart: {
            type: "donut",
            height: 350,
          },
          labels: categories,
          colors: type === "severity" ? ["#dc3545", "#ffc107", "#28a745"] : colors,
          plotOptions: {
            pie: {
              donut: {
                size: '40%',
                labels: {
                  show: true,
                  name: {
                    show: false,
                  },
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
                return value; // Return the actual count
              }
            }
          },
          legend: {
            position: "bottom",
          },
        });

        setChartSeries(series);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchData();
  }, [type, timeRange]);

  const getTitle = () => {
    switch (type) {
      case "disruption":
        return "Disruption Types";
      case "actions":
        return "Actions";
      case "severity":
        return "Severity Levels";
      default:
        return "Chart";
    }
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range); // Change time range
  };

  // Helper function to calculate the start and end date for the last week
  const getLastWeekDateRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Calculate previous week's Sunday
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - dayOfWeek - 7); // Move to last week's Sunday

    // Calculate start of the last week (Monday)
    const startOfWeek = new Date(lastSunday);
    startOfWeek.setDate(lastSunday.getDate() - 6); // Move back 6 days to Monday

    const endOfWeek = lastSunday; // End of the week (Sunday)

    return { start: startOfWeek.toISOString().split("T")[0], end: endOfWeek.toISOString().split("T")[0] };
  };

  // Helper function to calculate the start and end date for the last month
  const getLastMonthDateRange = () => {
    const today = new Date();
    const lastMonth = new Date(today.setMonth(today.getMonth() - 1));
    const start = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const end = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  };

  return (
    <div>
      <Card>
        <CardHeader className="d-flex align-items-center justify-content-between">
          <h5 className="card-title mb-0">{getTitle()}</h5>
          <UncontrolledDropdown>
            <DropdownToggle tag="a" className="text-reset dropdown-btn">
              <span className="fw-semibold text-uppercase fs-12">
                Sort by:{" "}
              </span>
              <span className="text-muted">
                {timeRange === "week" ? "Last Week" : timeRange === "month" ? "Last Month" : "All Time"}
                <i className="mdi mdi-chevron-down ms-1"></i>
              </span>
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-end">
              <DropdownItem onClick={() => handleTimeRangeChange("total")}>
                All Time
              </DropdownItem>
              <DropdownItem onClick={() => handleTimeRangeChange("week")}>
                Last Week
              </DropdownItem>
              <DropdownItem onClick={() => handleTimeRangeChange("month")}>
                Last Month
              </DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>
        </CardHeader>
        <CardBody>
          <ReactApexChart
            options={chartOptions}
            series={chartSeries}
            type="donut" // Set type to "donut" or change based on type
            height={320}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;
