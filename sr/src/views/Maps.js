import React, { useRef, useState, useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useVisiteData } from "../hooks/useVisiteData";
import { useMapFilters } from "../hooks/useMapFilters";
import { useGoogleMap } from "../hooks/useGoogleMap";
import { useUserLocation } from "../hooks/useUserLocation";
import MapFilters from "../components/Maps/MapFilters";
import DateRangeModal from "../components/Maps/DateRangeModal";
import RefreshControls from "../components/Maps/RefreshControls";

// Load test utilities in development
if (process.env.NODE_ENV === 'development') {
  import('../utils/filterTestUtils.js');
}

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

      <div className="map-container" style={{ height: "80vh", width: "100%" }}>
        <div id="map" ref={mapRef} style={{ height: "100%", width: "100%" }}></div>
      </div>
    </Container>
  );
}

export default Maps;
