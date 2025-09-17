import React from 'react';
import { Button, Row, Col } from 'react-bootstrap';

const RefreshControls = ({
  onRefresh,
  loading,
  lastRefreshTime,
  autoRefresh,
  setAutoRefresh,
  dateRange,
  setDateRange,
  setShowModal
}) => {
  
  const formatLastRefreshTime = (time) => {
    if (!time) return 'Never';
    const now = new Date();
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    return time.toLocaleDateString();
  };

  return (
    <Row className="mt-3">
      <Col md="12">
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <div className="d-flex flex-wrap gap-2 mb-2 mb-md-0">
            <Button
              variant="light"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              style={{ 
                borderRadius: "20px", 
                fontWeight: "600",
                backgroundColor: "rgba(255,255,255,0.9)",
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}
            >
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Refreshing...
                </>
              ) : (
                <>🔄 Manual Refresh</>
              )}
            </Button>
            
            <Button
              variant={autoRefresh ? "success" : "light"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{ 
                borderRadius: "20px", 
                fontWeight: "600",
                backgroundColor: autoRefresh ? "#28a745" : "rgba(255,255,255,0.9)",
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                color: autoRefresh ? "white" : "#333"
              }}
            >
              {autoRefresh ? "🟢 Auto-Refresh ON" : "⚪ Auto-Refresh OFF"}
            </Button>
            
            <Button
              variant="info"
              size="sm"
              onClick={() => setShowModal(true)}
              style={{ 
                borderRadius: "20px", 
                fontWeight: "600",
                backgroundColor: "#17a2b8",
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}
            >
              📅 Date Range
            </Button>
            
            {dateRange && (
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => setDateRange(null)}
                style={{ 
                  borderRadius: "20px", 
                  fontWeight: "600"
                }}
              >
                🗑️ Clear Date Filter
              </Button>
            )}
          </div>
          
          <div className="text-end">
            <small className="text-white">
              <strong>Last updated:</strong> {formatLastRefreshTime(lastRefreshTime)}
            </small>
            {dateRange && (
              <div>
                <small className="text-white opacity-75">
                  📅 {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
                </small>
              </div>
            )}
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default RefreshControls;
