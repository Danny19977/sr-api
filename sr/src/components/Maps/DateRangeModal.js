import React from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import AnimatedRangeCalendar from '../AnimatedRangeCalendar';

const DateRangeModal = ({
  show,
  onHide,
  tempRange,
  setTempRange,
  onApply
}) => {
  
  const handleApply = () => {
    if (tempRange && tempRange.startDate && tempRange.endDate) {
      onApply(tempRange);
    }
  };

  const handleClear = () => {
    setTempRange(null);
    onApply(null);
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      centered
      backdrop="static"
    >
      <Modal.Header 
        closeButton 
        style={{ 
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          border: "none"
        }}
      >
        <Modal.Title>
          📅 Select Date Range for Visite Data
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ padding: "2rem" }}>
        <Row>
          <Col md="12" className="text-center">
            <p className="text-muted mb-4">
              Choose a date range to filter the visite data displayed on the map.
              Leave empty to show all available data.
            </p>
            
            <AnimatedRangeCalendar
              startDate={tempRange?.startDate}
              endDate={tempRange?.endDate}
              onChange={(startDate, endDate) => {
                setTempRange(startDate && endDate ? { startDate, endDate } : null);
              }}
            />
            
            {tempRange && (
              <div className="mt-3 p-3 bg-light rounded">
                <strong>Selected Range:</strong><br/>
                <span className="text-primary">
                  {tempRange.startDate?.toLocaleDateString()} - {tempRange.endDate?.toLocaleDateString()}
                </span>
              </div>
            )}
          </Col>
        </Row>
      </Modal.Body>
      
      <Modal.Footer style={{ borderTop: "none", padding: "1rem 2rem 2rem" }}>
        <div className="w-100 d-flex justify-content-between">
          <Button 
            variant="outline-danger" 
            onClick={handleClear}
            style={{ borderRadius: "25px", fontWeight: "600" }}
          >
            🗑️ Clear Filter
          </Button>
          
          <div>
            <Button 
              variant="secondary" 
              onClick={onHide}
              className="me-2"
              style={{ borderRadius: "25px", fontWeight: "600" }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleApply}
              disabled={!tempRange}
              style={{ borderRadius: "25px", fontWeight: "600" }}
            >
              Apply Filter
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default DateRangeModal;
