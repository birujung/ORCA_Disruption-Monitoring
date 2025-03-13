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
import React, { useState } from "react";
import {
  Card,
  Col,
  Container,
  Row,
  CardHeader,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import AnalyticsCharts from "../components/AnalyticsCharts";
import ArticlesTable from "../components/ArticlesTable";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import Globe from "./Globe";

const Homepage = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggle = () => setDropdownOpen((prevState) => !prevState);

  return (
    <>
      <div className="page-title-box">
        <h4 className="mb-2 mt-4 pl-8">Disruption Resolution</h4>
      </div>
      <div className="flex">
        <div className="w-[60%]">
          <Container fluid>
            {/* Header */}
            {/* <CardHeader>World Map</CardHeader> */}
            {/* Analytics Section */}
            <Row className="px-3">
              <Card className="p-2 shadow-sm flex align-items-stretch">
                <Dropdown
                  direction="down"
                  isOpen={dropdownOpen}
                  toggle={toggle}
                >
                  <DropdownToggle
                    style={{
                      backgroundColor: "#eee",
                      color: "#4e4e4e",
                      border: "none",
                    }}
                    caret
                  >
                    Menus
                  </DropdownToggle>
                  <DropdownMenu>
                    <DropdownItem header>Supplier</DropdownItem>
                    <DropdownItem>Singapore</DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem header>Markets</DropdownItem>
                    <DropdownItem>America</DropdownItem>
                    <DropdownItem>Europe</DropdownItem>
                    <DropdownItem>South East Asia</DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem header>All Routes</DropdownItem>
                    <DropdownItem>HK to JP</DropdownItem>
                    <DropdownItem>US to VN</DropdownItem>
                    <DropdownItem>TH to AU</DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem header>Distribution Center</DropdownItem>
                    <DropdownItem>DC01</DropdownItem>
                    <DropdownItem>DC02</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </Card>
            </Row>
            <Row className="px-3">
              <Card className="p-2 shadow-sm flex align-items-stretch">
                <Globe />
                {/* <ComposableMap>
                  <Geographies geography="/features.json">
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography key={geo.rsmKey} geography={geo} />
                      ))
                    }
                  </Geographies>
                </ComposableMap> */}
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
            {/* <CardHeader className="d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Sentiment Score</h5>
            </CardHeader>
             */}
            <AnalyticsCharts type="disruption" />
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
