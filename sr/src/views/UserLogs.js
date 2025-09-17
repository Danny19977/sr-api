import React, { useState, useEffect } from "react";
import { 
  Card, Container, Row, Col, Table, Button, 
  Form, InputGroup, Badge, Spinner,
  Alert, Modal
} from "react-bootstrap";
import { userLogsService } from "../services/apiServices";
import { usePageViewLogger, useSearchLogger } from "../hooks/useActivityLogger";
import "../assets/css/user-logs.css";

function UserLogs() {
  // Log page view automatically
  usePageViewLogger('User Logs', { 
    description: 'User accessed the User Activity Logs page to monitor system activities' 
  });
  
  // Search logging hook
  const { logSearch } = useSearchLogger();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch user logs
  const fetchUserLogs = async (page = 1, search = '', limit = 15) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await userLogsService.getPaginated({
        page,
        limit,
        search
      });

      if (response.status === 'success') {
        setLogs(response.data || []);
        setTotalPages(response.pagination?.total_pages || 1);
        setTotalRecords(response.pagination?.total_records || 0);
        setCurrentPage(response.pagination?.current_page || 1);
      } else {
        setError('Failed to fetch user logs');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch user logs');
      console.error('Error fetching user logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUserLogs(1, searchTerm, pageSize);
  }, [pageSize]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    
    // Log search activity
    if (searchTerm.trim()) {
      logSearch(searchTerm, 'user_logs', logs.length);
    }
    
    fetchUserLogs(1, searchTerm, pageSize);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchUserLogs(page, searchTerm, pageSize);
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1);
    fetchUserLogs(1, searchTerm, newSize);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get action badge variant
  const getActionBadgeVariant = (action) => {
    switch (action?.toLowerCase()) {
      case 'login':
        return 'success';
      case 'logout':
        return 'secondary';
      case 'create':
        return 'primary';
      case 'update':
        return 'warning';
      case 'delete':
        return 'danger';
      default:
        return 'info';
    }
  };

  // Show log details
  const showLogDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  return (
    <>
      <Container fluid className="user-logs-container">
        <Row>
          <Col md="12">
            <Card className="user-logs-card strpied-tabled-with-hover">
              <Card.Header>
                <Card.Title as="h4">User Activity Logs</Card.Title>
                <p className="card-category">
                  Monitor all user actions and system activities
                </p>
              </Card.Header>
              <Card.Body className="table-full-width table-responsive px-0">
                
                {/* Alerts */}
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')} className="user-logs-error">
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert variant="success" dismissible onClose={() => setSuccess('')} className="user-logs-success">
                    {success}
                  </Alert>
                )}

                {/* Search and Controls */}
                <div className="user-logs-search-container">
                  <div className="user-logs-controls">
                    <Form onSubmit={handleSearch} className="user-logs-search-form">
                      <InputGroup>
                        <Form.Control
                          type="text"
                          placeholder="Search logs by user name, action, or description..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="user-logs-search-input"
                        />
                        <Button variant="outline-secondary" type="submit">
                          <i className="fas fa-search"></i>
                        </Button>
                      </InputGroup>
                    </Form>
                    
                    <div className="user-logs-page-size-control">
                      <span>Show:</span>
                      <Form.Select
                        size="sm"
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        className="user-logs-page-size-select"
                      >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </Form.Select>
                      <span>entries</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mt-3">
                    <small className="user-logs-summary">
                      Showing {logs.length > 0 ? ((currentPage - 1) * pageSize + 1) : 0} to{' '}
                      {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} entries
                    </small>
                  </div>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="user-logs-loading">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                )}

                {/* Table */}
                {!loading && (
                  <Table hover className="user-logs-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date & Time</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Log Name</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length > 0 ? logs.map((log, index) => (
                        <tr 
                          key={log.uuid}
                          onClick={() => showLogDetails(log)}
                          style={{ cursor: 'pointer' }}
                          title="Click to view details"
                        >
                          <td>{(currentPage - 1) * pageSize + index + 1}</td>
                          <td>
                            <small>
                              {formatDate(log.updated_at || log.created_at)}
                            </small>
                          </td>
                          <td>
                            <div>
                              <strong>{log.user?.fullname || 'Unknown User'}</strong>
                              <br />
                              <small className="text-muted">
                                {log.user?.title || 'No Title'}
                              </small>
                            </div>
                          </td>
                          <td>
                            <Badge 
                              bg={getActionBadgeVariant(log.action)}
                              className="user-logs-action-badge text-uppercase"
                            >
                              {log.action || 'N/A'}
                            </Badge>
                          </td>
                          <td>
                            <strong>{log.name || 'N/A'}</strong>
                          </td>
                          <td>
                            <div style={{ maxWidth: '250px' }}>
                              {log.Description ? 
                                (log.Description.length > 80 ? 
                                  `${log.Description.substring(0, 80)}...` : 
                                  log.Description
                                ) : 'No description'
                              }
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" className="user-logs-no-data">
                            {searchTerm ? (
                              <>
                                <i className="fas fa-search"></i>
                                <br />
                                <strong>No logs found matching your search.</strong>
                                <br />
                                <small>Try adjusting your search terms</small>
                              </>
                            ) : (
                              <>
                                <i className="fas fa-clipboard-list"></i>
                                <br />
                                <strong>No logs available.</strong>
                                <br />
                                <small>User activity logs will appear here</small>
                              </>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                )}

                {/* Pagination with Arrow Navigation */}
                {!loading && totalPages > 1 && (
                  <div className="user-logs-pagination">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="user-logs-summary">
                        Page {currentPage} of {totalPages} • Showing {logs.length > 0 ? ((currentPage - 1) * pageSize + 1) : 0} to{' '}
                        {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} entries
                      </small>
                      
                      <div className="d-flex align-items-center gap-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                          title="First Page"
                        >
                          <i className="fas fa-angle-double-left"></i>
                        </Button>
                        
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          title="Previous Page"
                        >
                          <i className="fas fa-angle-left"></i>
                        </Button>
                        
                        <span className="mx-3 fw-bold">
                          {currentPage} / {totalPages}
                        </span>
                        
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          title="Next Page"
                        >
                          <i className="fas fa-angle-right"></i>
                        </Button>
                        
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                          title="Last Page"
                        >
                          <i className="fas fa-angle-double-right"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Log Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" className="user-logs-details-modal">
        <Modal.Header closeButton>
          <Modal.Title>Log Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <div>
              <Row>
                <Col md={6}>
                  <div className="user-logs-details-label">Log ID:</div>
                  <div className="user-logs-details-value">{selectedLog.uuid}</div>
                </Col>
                <Col md={6}>
                  <div className="user-logs-details-label">Log Name:</div>
                  <div className="user-logs-details-value">{selectedLog.name || 'N/A'}</div>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <div className="user-logs-details-label">User:</div>
                  <div className="user-logs-details-value">
                    {selectedLog.user?.fullname || 'Unknown User'}<br />
                    <small className="text-muted">
                      {selectedLog.user?.email || 'No email'} | {selectedLog.user?.title || 'No title'}
                    </small>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="user-logs-details-label">Action:</div>
                  <div className="user-logs-details-value">
                    <Badge bg={getActionBadgeVariant(selectedLog.action)} className="user-logs-action-badge">
                      {selectedLog.action || 'N/A'}
                    </Badge>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className="user-logs-details-label">Created:</div>
                  <div className="user-logs-details-value">{formatDate(selectedLog.created_at)}</div>
                </Col>
                <Col md={6}>
                  <div className="user-logs-details-label">Updated:</div>
                  <div className="user-logs-details-value">{formatDate(selectedLog.updated_at)}</div>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <div className="user-logs-details-label">Description:</div>
                  <div className="user-logs-details-value">{selectedLog.Description || 'No description available'}</div>
                </Col>
              </Row>

              {selectedLog.Signature && (
                <Row>
                  <Col md={12}>
                    <div className="user-logs-details-label">Signature:</div>
                    <div className="user-logs-details-value font-monospace">{selectedLog.Signature}</div>
                  </Col>
                </Row>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default UserLogs;
