import axios from "axios";
import { GoogleApiWrapper, Map, Marker } from "google-maps-react";
import moment from "moment";
import React, { useEffect, useMemo, useState } from "react";
import { Badge, Modal, ModalBody, ModalHeader } from "reactstrap";
import TableContainer from "./common/TableContainer";

// Helper functions
const formatDate = (date) => {
  if (!date) return "Unknown";
  return moment(date).format("DD MMM YYYY"); // Tangani ISO date format
};

const formatDescription = (text) => {
  if (!text) return "No description available.";
  const sentences = text.split(".").filter((sentence) => sentence.trim() !== "");
  return `${sentences.slice(0, 2).join(". ")}.`;
};

const mapStyles = {
  width: "750px",
  height: "350px",
};

const randomTier = () => `Tier ${Math.floor(Math.random() * 5) + 1}`;
const randomAction = () => (Math.random() > 0.5 ? "Active" : "Closed");

const ArticlesTable = (props) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  // Modal related states
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch articles on component mount
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/articles");
        const sortedArticles = response.data.sort((a, b) =>
          moment(b.publishedDate).diff(moment(a.publishedDate)) // Perbaiki publishedDate
        );
        setArticles(sortedArticles);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchArticles();
  }, []);
  
  const fetchArticleById = async (id) => {
    try {
      const response = await axios.get(`/api/articles/${id}`);
      setSelectedArticle(response.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch article by ID:", error);
    }
  };  

  const handleScrapeArticles = async () => {
    setIsScraping(true);
    try {
      await axios.post("/api/articles/scrape");
      const response = await axios.get("/api/articles");
      const sortedArticles = response.data.sort((a, b) =>
        moment(b.publishedDate).diff(moment(a.publishedDate))
      );
      setArticles(sortedArticles);
    } catch (error) {
      console.error("Failed to scrape articles:", error);
    } finally {
      setIsScraping(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Date",
        accessorKey: "publishedDate", // Properti MongoDB
        cell: (info) => <span>{formatDate(info.getValue())}</span>,
      },
      {
        header: "Title",
        accessorKey: "title",
        cell: (info) => (
          <div
            className="fw-bold text-primary text-wrap"
            style={{ cursor: "pointer" }}
            onClick={() => fetchArticleById(info.row.original._id)} // Gunakan _id dari MongoDB
          >
            {info.getValue()}
          </div>
        ),
      },
      {
        header: "Description",
        accessorKey: "text",
        cell: (info) => (
          <div className="text-wrap">{formatDescription(info.getValue())}</div>
        ),
      },
      {
        header: "Disruption Type",
        accessorKey: "disruptionType", // Properti MongoDB
        cell: (info) => <span>{info.getValue()}</span>,
      },
      {
        header: "Country Impacted",
        accessorKey: "location",
        cell: (info) => <span>{info.getValue() || "Unknown"}</span>,
      },
      {
        header: "Tiers Impacted",
        accessorKey: "tier",
        cell: () => <span>{randomTier()}</span>,
      },
      {
        header: "Severity",
        accessorKey: "severity",
        cell: (info) => {
          const severity = info.getValue();
          const badgeColor =
            severity === "High"
              ? "danger"
              : severity === "Medium"
              ? "warning"
              : "success";
          return <Badge color={badgeColor}>{severity}</Badge>;
        },
      },
      {
        header: "Actions",
        accessorKey: "action",
        cell: () => (
          <span className="text-underline" style={{ cursor: "pointer" }}>
            {randomAction()}
          </span>
        ),
      },
    ],
    []
  );

  const severityColors = {
    High: "red",
    Medium: "orange",
    Low: "green",
  };

  const getSeverityColor = (severity) => severityColors[severity] || "gray";

  const defaultLocation = { lat: 1.3521, lng: 103.8198 }; // Singapore Default

  return (
    <div className="card">
      <div className="card-header d-flex align-items-center">
        <h5 className="card-title mb-0 flex-grow-1">All Articles</h5>
        <button
          className="btn btn-soft-primary"
          onClick={handleScrapeArticles}
          disabled={isScraping || loading}
        >
          {isScraping ? "Scraping..." : "Refresh"}
        </button>
      </div>
      <div className="card-body">
        <TableContainer
          columns={columns}
          data={articles}
          isGlobalFilter={true}
          customPageSize={10}
          SearchPlaceholder="Search articles..."
        />
      </div>

      {/* Modal for displaying article details */}
      <Modal size="lg" isOpen={isModalOpen} toggle={() => setIsModalOpen(false)} centered>
        <ModalHeader toggle={() => setIsModalOpen(false)}>
          <h2>{selectedArticle?.title}</h2>
        </ModalHeader>
        <ModalBody>
          <div>
            <p><strong>Published Date:</strong> {formatDate(selectedArticle?.publishedDate)}</p>
            <p><strong>Location:</strong> {selectedArticle?.location}</p>
            <p><strong>Disruption Type:</strong> {selectedArticle?.disruptiontype}</p>
            <p><strong>Severity:</strong> 
              <Badge color={selectedArticle?.severity === "High" ? "danger" : selectedArticle?.severity === "Medium" ? "warning" : "success"}>
                {selectedArticle?.severity}
              </Badge>
            </p>
            <p><strong>Description:</strong> {selectedArticle?.text}</p>
            <p>
              <strong>Source:</strong>{" "}
              {selectedArticle?.url ? (
                <a
                  href={selectedArticle.url}
                  target="_blank" // Buka URL di tab baru
                  rel="noopener noreferrer" // Keamanan tambahan
                  style={{ color: "#007bff", textDecoration: "underline", cursor: "pointer" }}
                >
                  {selectedArticle.url}
                </a>
              ) : (
                "No source available"
              )}
            </p>
          </div>

          {/* Google Map */}
          <div className="map-container" style={{ height: "400px", width: "100%" }}>
            <Map
              google={props.google}
              style={mapStyles}
              zoom={6}
              initialCenter={{
                lat: selectedArticle?.lat || defaultLocation.lat,
                lng: selectedArticle?.lng || defaultLocation.lng,
              }}
            >
              <Marker
                position={{
                  lat: selectedArticle?.lat || defaultLocation.lat,
                  lng: selectedArticle?.lng || defaultLocation.lng,
                }}
                icon={{
                  url: `http://maps.google.com/mapfiles/ms/icons/${getSeverityColor(
                    selectedArticle?.severity
                  )}-dot.png`,
                }}
              />
            </Map>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default GoogleApiWrapper({
  apiKey: "AIzaSyAadOIBO2RrktCrOApb5rw8jQExdxcv_hM",
})(ArticlesTable);
