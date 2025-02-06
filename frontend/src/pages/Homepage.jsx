/**
 * Homepage Component
 *
 * This component serves as the main page of the application. It integrates analytics visualizations
 * and a table of articles into a cohesive dashboard layout.
 *
 * Features:
 * - Displays analytics charts for disruption types, severity levels, and keyword frequencies.
 * - Includes an interactive table for viewing and managing articles.
 *
 * Dependencies:
 * - `reactstrap`: For UI components such as `Container`, `Row`, `Col`, and `Card`.
 * - `AnalyticsCharts`: Component for rendering various analytics visualizations.
 * - `ArticlesTable`: Component for displaying and interacting with article data.
 */
import React from "react";
import { Card, Col, Container, Row, CardHeader } from "reactstrap";
import AnalyticsCharts from "../components/AnalyticsCharts";
import ArticlesTable from "../components/ArticlesTable";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import GaugeChart from "react-gauge-chart";

const Homepage = () => {
  return (
    <>
      <div className="page-title-box">
        <h4 className="mb-2 mt-4 pl-8">Disruption Resolution</h4>
      </div>
      <div className="flex">
        <div className="w-[60%]">
          <Container fluid>
            {/* Header */}
            {/* Analytics Section */}
            <Row className="px-3">
              <Card className="p-2 shadow-sm d-flex align-items-stretch">
                <ComposableMap>
                  <Geographies geography="/features.json">
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography key={geo.rsmKey} geography={geo} />
                      ))
                    }
                  </Geographies>
                </ComposableMap>
              </Card>
              {/* <Col xl={3} lg={4} md={6} className="mb-2"></Col>
              <Col xl={3} lg={4} md={6} className="mb-2">
                
              </Col>
              <Col xl={6} lg={8} md={12} className="mb-2">
                
              </Col> */}
            </Row>
            {/* Articles Table Section */}
            <Row className="mt-0">
              <Col>
                <ArticlesTable />
              </Col>
            </Row>
          </Container>
        </div>
        <div className="w-[40%]">
          <Card className="p-2 shadow-sm d-flex align-items-stretch flex justify-center items-center">
            <CardHeader className="d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Sentiment Score</h5>
            </CardHeader>
            <GaugeChart
              style={{
                color: "gray",
                width: "400px",
                margin: "auto",
              }}
              className="w-full"
              id="gauge-chart1"
            />
            {/* <AnalyticsCharts type="disruption" /> */}
          </Card>

          <Card
            className="p-2 shadow-sm d-flex align-items-stretch"
            style={{ minHeight: "350px" }}
          >
            <AnalyticsCharts type="severity" />
          </Card>
          <Card
            className="p-2 shadow-sm d-flex align-items-stretch"
            style={{ minHeight: "400px" }}
          >
            <AnalyticsCharts type="keywordTreemap" />
          </Card>
        </div>
      </div>
    </>
  );
};

export default Homepage;
