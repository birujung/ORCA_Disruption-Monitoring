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
      <Row>
        <Col xl={4}>
          <Card className="card-height-100">
            <AnalyticsCharts type="disruption" />
          </Card>
        </Col>
        <Col xl={4}>
          <Card className="card-height-100">
            <AnalyticsCharts type="actions" />
          </Card>
        </Col>
        <Col xl={4}>
          <Card className="card-height-100">
            <AnalyticsCharts type="severity" />
          </Card>
        </Col>
      </Row>

      {/* Articles Table Section */}
      <Row className="mt-4">
        <Col>
          <ArticlesTable />
        </Col>
      </Row>
    </Container>
  );
};

export default Homepage;
