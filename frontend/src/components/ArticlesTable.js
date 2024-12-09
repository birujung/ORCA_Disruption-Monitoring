import axios from "axios";
import { GoogleApiWrapper, Map, Marker } from "google-maps-react";
import moment from "moment";
import React, { useEffect, useMemo, useState } from "react";
import { Badge, Modal, ModalBody, ModalHeader } from "reactstrap";
import TableContainer from "./common/TableContainer";

// Format tanggal ke "DD MMM YYYY"
const formatDate = (date) =>
  moment(date, "YYYY-MM-DD HH:mm:ss").format("DD MMM YYYY");

// Fungsi untuk mengambil dua kalimat pertama
const formatDescription = (text) => {
  if (!text) return "No description available.";

  const sentences = text.split(".").filter((sentence) => sentence.trim() !== "");
  const firstTwoSentences = sentences.slice(0, 2).join(". ");
  return `${firstTwoSentences}.`;
};

const mapStyles = {
  width: '750px',
  height: '350px',
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

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/articles");
      const fetchedArticles = response.data || [];
      console.log("Fetched articles:", fetchedArticles);

      // Sort articles by publish date in descending order (latest first)
      const sortedArticles = fetchedArticles.sort((a, b) =>
        moment(a.publisheddate).isBefore(moment(b.publisheddate)) ? 1 : -1
      );
      
      console.log("Sorted articles:", sortedArticles);
      setArticles(sortedArticles);
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticleById = async (id) => {
    console.log("Fetching article with ID:", id); // Debugging log
    try {
      const response = await axios.get(`/api/articles/${id}`);
      console.log(response.data); // Check if data is returned
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
      await fetchArticles();
    } catch (error)      {
      console.error("Failed to scrape articles:", error);
    } finally {
      setIsScraping(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Date",
        accessorKey: "publisheddate",
        cell: (info) => <span>{formatDate(info.getValue())}</span>,
      },
      {
        header: "Title",
        accessorKey: "title",
        filterFn: "fuzzy",
        cell: (info) => (
          <div
            className="fw-bold text-primary text-wrap"
            style={{ cursor: "pointer" }}
            onClick={() => fetchArticleById(info.row.original.id)} // Open modal on title click
          >
            {info.getValue()}
          </div>
        ),
      },
      {
        header: "Description",
        accessorKey: "text",
        filterFn: "fuzzy",
        cell: (info) => (
          <div className="text-wrap">{formatDescription(info.getValue())}</div>
        ),
      },
      {
        header: "Disruption Type",
        accessorKey: "disruptiontype",
        filterFn: "fuzzy",
        cell: (info) => <span>{info.getValue()}</span>,
      },
      {
        header: "Country Impacted",
        accessorKey: "location",
        filterFn: "fuzzy",
        cell: (info) => <span>{info.getValue() || "Unknown"}</span>,
      },
      {
        header: "Tiers Impacted",
        accessorKey: "tier",
        filterFn: "fuzzy",
        cell: () => <span>{randomTier()}</span>,
      },
      {
        header: "Severity",
        accessorKey: "severity",
        filterFn: "fuzzy",
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
        filterFn: "fuzzy",
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
            <p><strong>Published Date:</strong> {formatDate(selectedArticle?.publisheddate)}</p>
            <p><strong>Location:</strong> {selectedArticle?.location}</p>
            <p><strong>Disruption Type:</strong> {selectedArticle?.disruptiontype}</p>
            <p><strong>Severity:</strong> 
              <Badge color={selectedArticle?.severity === "High" ? "danger" : selectedArticle?.severity === "Medium" ? "warning" : "success"}>
                {selectedArticle?.severity}
              </Badge>
            </p>
            <p><strong>Description:</strong> {selectedArticle?.text}</p>
          </div>

          {/* Google Map */}
          <div className="map-container" style={{ height: "400px", width: "100%" }}>
            <Map
              google={props.google}
              style={mapStyles}
              zoom={6}
              initialCenter={{
                lat: selectedArticle?.lat || selectedArticle?.location?.lat || defaultLocation.lat,
                lng: selectedArticle?.lng || selectedArticle?.location?.lng || defaultLocation.lng,
              }}
            >
              <Marker
                position={{
                  lat: selectedArticle?.lat || selectedArticle?.location?.lat || defaultLocation.lat,
                  lng: selectedArticle?.lng || selectedArticle?.location?.lng || defaultLocation.lng,
                }}
                icon={{
                  url: `http://maps.google.com/mapfiles/ms/icons/${getSeverityColor(selectedArticle?.severity)}-dot.png`,
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
