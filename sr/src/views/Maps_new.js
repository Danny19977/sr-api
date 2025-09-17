import React, { useRef, useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
// Simple ImageGallery component for displaying images as a carousel
function ImageGallery({ images }) {
  const [current, setCurrent] = useState(0);
  if (!images || images.length === 0) return null;
  const goPrev = () => setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goNext = () => setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <img
          src={images[current]}
          alt={`Gallery ${current + 1}`}
          style={{ maxWidth: 220, maxHeight: 160, borderRadius: 8, boxShadow: "0 2px 8px #0002" }}
        />
        {images.length > 1 && (
          <>
            <Button variant="light" size="sm" style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)" }} onClick={goPrev}>&lt;</Button>
            <Button variant="light" size="sm" style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }} onClick={goNext}>&gt;</Button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div style={{ marginTop: 4, fontSize: 12 }}>
          {images.map((_, idx) => (
            <span key={idx} style={{ margin: "0 2px", color: idx === current ? "#667eea" : "#bbb" }}>&#9679;</span>
          ))}
        </div>
      )}
    </div>
  );
}
import { useVisiteData } from "../hooks/useVisiteData";
import { useMapFilters } from "../hooks/useMapFilters";
import { useGoogleMap } from "../hooks/useGoogleMap";
import { useUserLocation } from "../hooks/useUserLocation";
import MapFilters from "../components/Maps/MapFilters";
import DateRangeModal from "../components/Maps/DateRangeModal";
import RefreshControls from "../components/Maps/RefreshControls";

function Maps() {
  const mapRef = useRef(null);
  const [dateRange, setDateRange] = useState();
  const [showModal, setShowModal] = useState(false);
  const [tempRange, setTempRange] = useState();
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Custom hooks
  const { data: visiteData, loading, error, lastRefreshTime, refetch } = useVisiteData(dateRange);
  const userLocation = useUserLocation();
  
  const {
    searchText,
    setSearchText,
    filterOptions,
    setFilterOptions,
    filteredData,
    uniqueFilterValues,
    searchSuggestions,
    clearFilters,
    activeFiltersCount
  } = useMapFilters(visiteData);
  
  useGoogleMap(mapRef, filteredData, userLocation);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing data...");
      refetch();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col md="12">
          <Card className="border-0 shadow-sm" style={{ borderRadius: "16px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <Card.Body className="p-4">
              <MapFilters
                searchText={searchText}
                setSearchText={setSearchText}
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                uniqueFilterValues={uniqueFilterValues}
                searchSuggestions={searchSuggestions}
                showSuggestions={showSuggestions}
                setShowSuggestions={setShowSuggestions}
                activeFiltersCount={activeFiltersCount}
                clearFilters={clearFilters}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                filteredDataCount={filteredData.length}
                rawDataCount={visiteData.length}
              />
              
              <RefreshControls
                onRefresh={refetch}
                loading={loading}
                lastRefreshTime={lastRefreshTime}
                autoRefresh={autoRefresh}
                setAutoRefresh={setAutoRefresh}
                dateRange={dateRange}
                setDateRange={setDateRange}
                setShowModal={setShowModal}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {showModal && (
        <DateRangeModal
          show={showModal}
          onHide={() => setShowModal(false)}
          tempRange={tempRange}
          setTempRange={setTempRange}
          onApply={(range) => {
            setDateRange(range);
            setShowModal(false);
          }}
        />
      )}

      {/* Map Markers List with Image Gallery */}
      <Row>
        {filteredData && filteredData.length > 0 && filteredData.map((entry, idx) => {
          let images = [];
          try {
            images = Array.isArray(entry.file_url)
              ? entry.file_url
              : JSON.parse(entry.file_url || "[]");
          } catch {
            images = [];
          }
          return (
            <Col key={idx} md={4} sm={6} xs={12} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <ImageGallery images={images} />
                  <div style={{ marginTop: 12 }}>
                    <div><b>Text:</b> {entry.text_value}</div>
                    <div><b>Latitude:</b> {entry.latitude}</div>
                    <div><b>Longitude:</b> {entry.longitude}</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
      <div className="map-container" style={{ height: "80vh", width: "100%" }}>
        <div id="map" ref={mapRef} style={{ height: "100%", width: "100%" }}></div>
      </div>
    </Container>
  );
}

export default Maps;
