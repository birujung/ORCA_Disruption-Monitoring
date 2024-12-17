import React from "react";
import { Card, Col, Container, Row } from "reactstrap";
import AnalyticsCharts from "../components/AnalyticsCharts";
import ArticlesTable from "../components/ArticlesTable";

const Homepage = () => {
  return (
    <Container fluid>
      {/* Header */}
      <div className="page-title-box">
        <h4 className="mb-2 mt-4">Disruption Resolution</h4>
      </div>

      {/* Analytics Section */}
      <Row className="justify-content-center">
        <Col xl={3} lg={4} md={6} className="mb-2">
          <Card className="p-2 shadow-sm d-flex align-items-stretch" style={{ minHeight: "350px" }}>
            <AnalyticsCharts type="disruption" />
          </Card>
        </Col>
        <Col xl={3} lg={4} md={6} className="mb-2">
          <Card className="p-2 shadow-sm d-flex align-items-stretch" style={{ minHeight: "350px" }}>
            <AnalyticsCharts type="severity" />
          </Card>
        </Col>
        <Col xl={6} lg={8} md={12} className="mb-2">
          <Card className="p-2 shadow-sm d-flex align-items-stretch" style={{ minHeight: "400px" }}>
            <AnalyticsCharts type="keywordTreemap" />
          </Card>
        </Col>
      </Row>

      {/* Articles Table Section */}
      <Row className="mt-0">
        <Col>
          <ArticlesTable />
        </Col>
      </Row>
    </Container>
  );
};

export default Homepage;
