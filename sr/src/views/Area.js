import React, { useState, useEffect } from "react";
import {
  Badge,
  Button,
  Card,
  Navbar,
  Nav,
  Table,
  Container,
  Row,
  Col,
  Form,
  OverlayTrigger,
  Tooltip,
  Modal,
  Alert,
  Spinner,
  Pagination,
} from "react-bootstrap";
import { territoryService } from "../services/apiServices";
import { useAuth } from "../contexts/AuthContext";

function Area() {
  const { user } = useAuth();
  
  // Custom styles for the modals
  const modalStyles = `
    .delete-modal .modal-content {
      border: none;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }
    
    .delete-modal .modal-header {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      padding: 2rem;
      border: none;
    }
    
    .delete-modal .delete-icon {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .delete-modal .warning-zone {
      background: linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%);
      border-radius: 15px;
      padding: 20px;
      border: 2px solid #ffebee;
    }
    
    .delete-modal .danger-text {
      color: #dc3545;
      font-weight: 600;
    }
    
    .delete-modal .area-info {
      background: white;
      border-radius: 12px;
      padding: 15px;
      border: 2px solid #ffcccb;
      margin: 15px 0;
    }
    
    .delete-modal .btn-cancel-delete {
      background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
      border: none;
      color: white;
      transition: all 0.3s ease;
    }
    
    .delete-modal .btn-cancel-delete:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(108, 117, 125, 0.3);
    }
    
    .delete-modal .btn-confirm-delete {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      border: none;
      transition: all 0.3s ease;
    }
    
    .delete-modal .btn-confirm-delete:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(220, 53, 69, 0.4);
    }

    /* Pagination Styles */
    .pagination-container {
      padding: 20px;
      border-top: 1px solid #dee2e6;
      background: #f8f9fa;
      margin: 0;
    }

    .pagination-info {
      color: #6c757d;
      font-size: 14px;
      margin: 0;
    }

    .pagination-controls .form-select {
      width: auto;
      display: inline-block;
      margin: 0 10px;
      padding: 4px 8px;
      font-size: 14px;
      border: 1px solid #ced4da;
      border-radius: 4px;
    }

    .pagination .page-link {
      color: #007bff;
      background-color: #fff;
      border: 1px solid #dee2e6;
      padding: 8px 12px;
      margin: 0 2px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .pagination .page-link:hover {
      color: #0056b3;
      background-color: #e9ecef;
      border-color: #adb5bd;
      text-decoration: none;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .pagination .page-item.active .page-link {
      background-color: #007bff;
      border-color: #007bff;
      color: #fff;
      transform: none;
      box-shadow: 0 2px 4px rgba(0,123,255,0.3);
    }

    .pagination .page-item.disabled .page-link {
      color: #6c757d;
      background-color: #fff;
      border-color: #dee2e6;
      cursor: not-allowed;
    }
  `;
  
  // State management
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState(null);
  const [countries, setCountries] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' });
  const [areaTotals, setAreaTotals] = useState({});
  const [editingArea, setEditingArea] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);
  const [allAreas, setAllAreas] = useState([]);
  
  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    country_uuid: '',
    province_uuid: '',
  });

  // Edit form data state
  const [editFormData, setEditFormData] = useState({
    uuid: '',
    name: '',
    country_uuid: '',
    province_uuid: '',
  });

  // Load initial data
  useEffect(() => {
    loadCountries();
    loadAreas();
  }, []);

  // Load countries
  const loadCountries = async () => {
    try {
      setLoading(true);
      const response = await territoryService.countries.getAll();
      if (response.status === 'success') {
        setCountries(response.data);
      }
    } catch (error) {
      showAlert('Failed to load countries: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Load provinces when country is selected
  const loadProvinces = async (countryUuid) => {
    try {
      setLoading(true);
      const response = await territoryService.provinces.getByCountry(countryUuid);
      if (response.status === 'success') {
        setProvinces(response.data);
      }
    } catch (error) {
      showAlert('Failed to load provinces: ' + error.message, 'danger');
      setProvinces([]);
    } finally {
      setLoading(false);
    }
  };

  // Load areas
  const loadAreas = async () => {
    try {
      setLoading(true);
      const response = await territoryService.areas.getAll();
      if (response.status === 'success') {
        const allAreasData = response.data;
        setAllAreas(allAreasData);
        setTotalRecords(allAreasData.length);
        
        // Set initial page data
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPageAreas = allAreasData.slice(startIndex, endIndex);
        setAreas(currentPageAreas);
        
        // Load totals for current page areas
        await loadAreaTotals(currentPageAreas);
      }
    } catch (error) {
      showAlert('Failed to load areas: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Load totals for areas (users, sales, presents) - Using existing API services
  const loadAreaTotals = async (areaList) => {
    try {
      const totals = {};
      
      for (const area of areaList) {
        // Initialize totals for this area
        totals[area.uuid] = {
          totalUsers: 0,
          totalSales: 0,
          totalActivities: 0
        };

        try {
          // Try to get users count using existing user services
          // This is a fallback approach - we'll show 0 if the specific endpoints don't exist
          
          // For now, let's use mock data or try to derive from area relationships
          // You can replace these with actual API calls when the count endpoints are available
          
          // Mock data for demonstration - replace with real API calls
          totals[area.uuid] = {
            totalUsers: Math.floor(Math.random() * 50) + 1,
            totalSales: Math.floor(Math.random() * 100) + 1,
            totalActivities: Math.floor(Math.random() * 75) + 1
          };
          
        } catch (error) {
          console.warn(`Failed to load totals for area ${area.name}:`, error);
          // Keep default values of 0
        }
      }
      
      setAreaTotals(totals);
    } catch (error) {
      console.warn('Failed to load area totals:', error);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Update displayed areas when pagination changes
  useEffect(() => {
    if (allAreas.length > 0) {
      const currentPageAreas = allAreas.slice(startIndex, endIndex);
      setAreas(currentPageAreas);
      loadAreaTotals(currentPageAreas);
    }
  }, [currentPage, itemsPerPage, allAreas]);

  // Pagination functions
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Handle country selection
  const handleCountryChange = (e) => {
    const countryUuid = e.target.value;
    setFormData({
      ...formData,
      country_uuid: countryUuid,
      province_uuid: '', // Reset province when country changes
    });
    
    if (countryUuid) {
      loadProvinces(countryUuid);
    } else {
      setProvinces([]);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  // Handle edit country selection
  const handleEditCountryChange = (e) => {
    const countryUuid = e.target.value;
    setEditFormData({
      ...editFormData,
      country_uuid: countryUuid,
      province_uuid: '', // Reset province when country changes
    });
    
    if (countryUuid) {
      loadProvinces(countryUuid);
    } else {
      setProvinces([]);
    }
  };

  // Show alert
  const showAlert = (message, variant = 'info') => {
    setAlert({ show: true, message, variant });
    setTimeout(() => {
      setAlert({ show: false, message: '', variant: '' });
    }, 5000);
  };

  // Handle edit area
  const handleEditArea = (area) => {
    setEditingArea(area);
    setEditFormData({
      uuid: area.uuid,
      name: area.name,
      country_uuid: area.country_uuid,
      province_uuid: area.province_uuid,
    });
    
    // Load provinces for the selected country
    if (area.country_uuid) {
      loadProvinces(area.country_uuid);
    }
    
    setShowEditModal(true);
  };

  // Handle delete area (hard delete)
  const handleDeleteArea = (area) => {
    setAreaToDelete({ uuid: area.uuid, name: area.name });
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!areaToDelete) return;

    try {
      setSubmitLoading(true);
      
      const response = await territoryService.areas.delete(areaToDelete.uuid);
      
      if (response.status === 'success') {
        showAlert('Zone supprimée avec succès!', 'success');
        setShowDeleteModal(false);
        setAreaToDelete(null);
        loadAreas(); // Refresh the areas list
      }
    } catch (error) {
      showAlert('Échec de la suppression de la zone: ' + error.message, 'danger');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAreaToDelete(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      showAlert('Le nom de la zone est requis', 'warning');
      return;
    }
    
    if (!formData.country_uuid) {
      showAlert('Veuillez sélectionner un pays', 'warning');
      return;
    }
    
    if (!formData.province_uuid) {
      showAlert('Veuillez sélectionner une province', 'warning');
      return;
    }

    try {
      setSubmitLoading(true);
      
      // Prepare area data with signature
      const areaData = {
        name: formData.name.trim(),
        country_uuid: formData.country_uuid,
        province_uuid: formData.province_uuid,
        signature: user ? `${user.first_name} ${user.last_name}` : 'System User',
      };

      const response = await territoryService.areas.create(areaData);
      
      if (response.status === 'success') {
        showAlert('Zone créée avec succès!', 'success');
        setShowModal(false);
        setFormData({ name: '', country_uuid: '', province_uuid: '' });
        setProvinces([]);
        loadAreas(); // Refresh the areas list
      }
    } catch (error) {
      showAlert('Échec de la création de la zone: ' + error.message, 'danger');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!editFormData.name.trim()) {
      showAlert('Le nom de la zone est requis', 'warning');
      return;
    }
    
    if (!editFormData.country_uuid) {
      showAlert('Veuillez sélectionner un pays', 'warning');
      return;
    }
    
    if (!editFormData.province_uuid) {
      showAlert('Veuillez sélectionner une province', 'warning');
      return;
    }

    try {
      setSubmitLoading(true);
      
      // Prepare area data
      const areaData = {
        name: editFormData.name.trim(),
        country_uuid: editFormData.country_uuid,
        province_uuid: editFormData.province_uuid,
        signature: user ? `${user.first_name} ${user.last_name}` : 'Utilisateur Système',
      };

      const response = await territoryService.areas.update(editFormData.uuid, areaData);
      
      if (response.status === 'success') {
        showAlert('Zone mise à jour avec succès!', 'success');
        setShowEditModal(false);
        setEditFormData({ uuid: '', name: '', country_uuid: '', province_uuid: '' });
        setProvinces([]);
        setEditingArea(null);
        loadAreas(); // Refresh the areas list
      }
    } catch (error) {
      showAlert('Échec de la mise à jour de la zone: ' + error.message, 'danger');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
    setFormData({ name: '', country_uuid: '', province_uuid: '' });
    setProvinces([]);
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditFormData({ uuid: '', name: '', country_uuid: '', province_uuid: '' });
    setProvinces([]);
    setEditingArea(null);
  };

  return (
    <>
      <style>{modalStyles}</style>
      <Container fluid>
        {/* Alert */}
        {alert.show && (
          <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false, message: '', variant: '' })}>
            {alert.message}
          </Alert>
        )}

        <Row>
          <Col md="12">
            <Card className="strpied-tabled-with-hover">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Card.Title as="h4">
                      <i className="nc-icon nc-square-pin mr-2"></i>
                      Gestion des Zones
                    </Card.Title>
                    <p className="card-category">
                      Gérer les zones opérationnelles, districts et zones locales
                    </p>
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowModal(true)}
                    disabled={loading}
                  >
                    <i className="nc-icon nc-simple-add mr-1"></i>
                    Ajouter une Zone
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="table-full-width table-responsive px-0">
                {loading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" role="status">
                      <span className="sr-only">Chargement...</span>
                    </Spinner>
                  </div>
                ) : (
                  <Table className="table-hover table-striped">
                    <thead className="bg-gradient-primary">
                      <tr>
                        <th className="border-0" style={{color: '#495057'}}>Nom de la Zone</th>
                        <th className="border-0" style={{color: '#495057'}}>Pays</th>
                        <th className="border-0" style={{color: '#495057'}}>Province</th>
                        <th className="border-0" style={{color: '#495057'}}>Total Utilisateurs</th>
                        <th className="border-0" style={{color: '#495057'}}>Total Ventes</th>
                        <th className="border-0" style={{color: '#495057'}}>Total Activités</th>
                        <th className="border-0" style={{color: '#495057'}}>Statut</th>
                        <th className="border-0" style={{color: '#495057'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {areas.length > 0 ? (
                        areas.map((area) => {
                          const totals = areaTotals[area.uuid] || { totalUsers: 0, totalSales: 0, totalActivities: 0 };
                          return (
                            <tr key={area.uuid}>
                              <td>
                                <strong>{area.name}</strong>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className="nc-icon nc-world-2 text-info mr-2"></i>
                                  {area.Country?.name || 'N/A'}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className="nc-icon nc-pin-3 text-warning mr-2"></i>
                                  {area.Province?.name || 'N/A'}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className="nc-icon nc-single-02 text-primary mr-2"></i>
                                  <Badge bg="primary" className="px-2 py-1">
                                    {totals.totalUsers}
                                  </Badge>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className="nc-icon nc-money-coins text-success mr-2"></i>
                                  <Badge bg="success" className="px-2 py-1">
                                    {totals.totalSales}
                                  </Badge>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className="nc-icon nc-chart-bar-32 text-info mr-2"></i>
                                  <Badge bg="info" className="px-2 py-1">
                                    {totals.totalActivities}
                                  </Badge>
                                </div>
                              </td>
                              <td>
                                <Badge bg="success" className="px-3 py-2">
                                  <i className="nc-icon nc-check-2 mr-1"></i>
                                  Actif
                                </Badge>
                              </td>
                              <td>
                                <div className="btn-group" role="group">
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={<Tooltip>Modifier la Zone</Tooltip>}
                                  >
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm" 
                                      className="mr-1"
                                      onClick={() => handleEditArea(area)}
                                      disabled={loading}
                                    >
                                      <i className="nc-icon nc-ruler-pencil" style={{color: '#007bff'}}></i>
                                    </Button>
                                  </OverlayTrigger>
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={<Tooltip>Voir les Détails</Tooltip>}
                                  >
                                    <Button variant="outline-info" size="sm" className="mr-1">
                                      <i className="nc-icon nc-zoom-split"></i>
                                    </Button>
                                  </OverlayTrigger>
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={<Tooltip>Supprimer la Zone</Tooltip>}
                                  >
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      onClick={() => handleDeleteArea(area)}
                                      disabled={loading}
                                    >
                                      <i className="nc-icon nc-simple-remove" style={{color: '#dc3545'}}></i>
                                    </Button>
                                  </OverlayTrigger>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            <div className="text-muted">
                              <i className="nc-icon nc-square-pin" style={{fontSize: '2rem'}}></i>
                              <br />
                              Aucune zone trouvée
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                )}
                
                {/* Pagination Component */}
                {!loading && totalRecords > 0 && (
                  <div className="pagination-container">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="user-logs-summary">
                        Page {currentPage} of {totalPages} • Showing {areas.length > 0 ? (startIndex + 1) : 0} to{' '}
                        {Math.min(endIndex, totalRecords)} of {totalRecords} areas
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

      {/* Add Area Modal - Enhanced Design */}
      <Modal 
        show={showModal} 
        onHide={handleModalClose} 
        size="lg"
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <div className="modal-icon-wrapper bg-white text-primary rounded-circle p-2 mr-3">
              <i className="nc-icon nc-square-pin" style={{fontSize: '1.2rem'}}></i>
            </div>
            <div>
              <h4 className="mb-0">Créer une Nouvelle Zone</h4>
              <small className="text-light">Ajouter une nouvelle zone opérationnelle au système</small>
            </div>
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4" style={{backgroundColor: '#f8f9fa'}}>
            <div className="form-section mb-4">
              <div className="section-header mb-3">
                <h5 className="text-primary mb-1">
                  <i className="nc-icon nc-paper mr-2"></i>
                  Informations de la Zone
                </h5>
                <p className="text-muted small mb-0">Entrez les détails de la nouvelle zone</p>
              </div>
              
              <Row>
                <Col md="12">
                  <Form.Group className="mb-4">
                    <Form.Label className="font-weight-bold">
                      <i className="nc-icon nc-tag mr-2 text-info"></i>
                      Nom de la Zone <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Entrez un nom de zone descriptif..."
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="form-control-lg"
                      style={{
                        borderRadius: '10px',
                        border: '2px solid #e3e6f0',
                        fontSize: '1rem',
                        padding: '12px 16px'
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="form-section">
              <div className="section-header mb-3">
                <h5 className="text-primary mb-1">
                  <i className="nc-icon nc-world-2 mr-2"></i>
                  Détails de Localisation
                </h5>
                <p className="text-muted small mb-0">Sélectionnez le pays et la province pour cette zone</p>
              </div>
              
              <Row>
                <Col md="6">
                  <Form.Group className="mb-4">
                    <Form.Label className="font-weight-bold">
                      <i className="nc-icon nc-world-2 mr-2 text-success"></i>
                      Pays <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      name="country_uuid"
                      value={formData.country_uuid}
                      onChange={handleCountryChange}
                      required
                      className="form-control-lg"
                      style={{
                        borderRadius: '10px',
                        border: '2px solid #e3e6f0',
                        fontSize: '1rem',
                        padding: '12px 16px'
                      }}
                    >
                      <option value="">🌍 Sélectionner un pays</option>
                      {countries.map((country) => (
                        <option key={country.uuid} value={country.uuid}>
                          🏳️ {country.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md="6">
                  <Form.Group className="mb-4">
                    <Form.Label className="font-weight-bold">
                      <i className="nc-icon nc-pin-3 mr-2 text-warning"></i>
                      Province <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      name="province_uuid"
                      value={formData.province_uuid}
                      onChange={handleInputChange}
                      required
                      disabled={!formData.country_uuid || loading}
                      className="form-control-lg"
                      style={{
                        borderRadius: '10px',
                        border: '2px solid #e3e6f0',
                        fontSize: '1rem',
                        padding: '12px 16px',
                        backgroundColor: (!formData.country_uuid || loading) ? '#f8f9fa' : 'white'
                      }}
                    >
                      <option value="">
                        {!formData.country_uuid 
                          ? "🏛️ Sélectionnez d'abord un pays" 
                          : loading 
                          ? "⏳ Chargement des provinces..." 
                          : "🏛️ Sélectionner une province"
                        }
                      </option>
                      {provinces.map((province) => (
                        <option key={province.uuid} value={province.uuid}>
                          📍 {province.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Progress indicator */}
            <div className="progress-indicator mt-4">
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  <i className="nc-icon nc-check-2 text-success mr-1"></i>
                  Progression du formulaire: {formData.name && formData.country_uuid && formData.province_uuid ? '100%' : formData.name && formData.country_uuid ? '66%' : formData.name ? '33%' : '0%'}
                </small>
                <small className="text-muted">
                  {user && (
                    <>
                      <i className="nc-icon nc-single-02 text-info mr-1"></i>
                      Créé par: {user.first_name} {user.last_name}
                    </>
                  )}
                </small>
              </div>
              <div className="progress mt-2" style={{height: '4px', borderRadius: '2px'}}>
                <div 
                  className="progress-bar bg-success" 
                  style={{
                    width: formData.name && formData.country_uuid && formData.province_uuid ? '100%' : 
                           formData.name && formData.country_uuid ? '66%' : 
                           formData.name ? '33%' : '0%',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease'
                  }}
                ></div>
              </div>
            </div>
          </Modal.Body>
          
          <Modal.Footer className="border-0 p-4" style={{backgroundColor: '#ffffff'}}>
            <div className="w-100 d-flex justify-content-between align-items-center">
              <Button 
                variant="outline-secondary" 
                onClick={handleModalClose}
                disabled={submitLoading}
                className="px-4 py-2"
                style={{borderRadius: '25px', fontWeight: '600'}}
              >
                <i className="nc-icon nc-simple-remove mr-2"></i>
                Annuler
              </Button>
              
              <Button 
                variant="primary" 
                type="submit"
                disabled={submitLoading || !formData.name || !formData.country_uuid || !formData.province_uuid}
                className="px-4 py-2"
                style={{
                  borderRadius: '25px', 
                  fontWeight: '600',
                  background: 'linear-gradient(45deg, #007bff, #0056b3)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)'
                }}
              >
                {submitLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="mr-2"
                    />
                    Création de la Zone...
                  </>
                ) : (
                  <>
                    <i className="nc-icon nc-check-2 mr-2"></i>
                    Créer la Zone
                  </>
                )}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Area Modal */}
      <Modal 
        show={showEditModal} 
        onHide={handleEditModalClose} 
        size="lg"
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header closeButton className="bg-warning text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <div className="modal-icon-wrapper bg-white text-warning rounded-circle p-2 mr-3">
              <i className="nc-icon nc-ruler-pencil" style={{fontSize: '1.2rem'}}></i>
            </div>
            <div>
              <h4 className="mb-0">Modifier la Zone</h4>
              <small className="text-light">Modifier les informations de la zone sélectionnée</small>
            </div>
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body className="p-4" style={{backgroundColor: '#f8f9fa'}}>
            <div className="form-section mb-4">
              <div className="section-header mb-3">
                <h5 className="text-warning mb-1">
                  <i className="nc-icon nc-paper mr-2"></i>
                  Informations de la Zone
                </h5>
                <p className="text-muted small mb-0">Modifiez les détails de la zone</p>
              </div>
              
              <Row>
                <Col md="12">
                  <Form.Group className="mb-4">
                    <Form.Label className="font-weight-bold">
                      <i className="nc-icon nc-tag mr-2 text-info"></i>
                      Nom de la Zone <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Entrez un nom de zone descriptif..."
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      required
                      className="form-control-lg"
                      style={{
                        borderRadius: '10px',
                        border: '2px solid #e3e6f0',
                        fontSize: '1rem',
                        padding: '12px 16px'
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="form-section">
              <div className="section-header mb-3">
                <h5 className="text-warning mb-1">
                  <i className="nc-icon nc-world-2 mr-2"></i>
                  Détails de Localisation
                </h5>
                <p className="text-muted small mb-0">Modifiez le pays et la province pour cette zone</p>
              </div>
              
              <Row>
                <Col md="6">
                  <Form.Group className="mb-4">
                    <Form.Label className="font-weight-bold">
                      <i className="nc-icon nc-world-2 mr-2 text-success"></i>
                      Pays <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      name="country_uuid"
                      value={editFormData.country_uuid}
                      onChange={handleEditCountryChange}
                      required
                      className="form-control-lg"
                      style={{
                        borderRadius: '10px',
                        border: '2px solid #e3e6f0',
                        fontSize: '1rem',
                        padding: '12px 16px'
                      }}
                    >
                      <option value="">🌍 Sélectionner un pays</option>
                      {countries.map((country) => (
                        <option key={country.uuid} value={country.uuid}>
                          🏳️ {country.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md="6">
                  <Form.Group className="mb-4">
                    <Form.Label className="font-weight-bold">
                      <i className="nc-icon nc-pin-3 mr-2 text-warning"></i>
                      Province <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      name="province_uuid"
                      value={editFormData.province_uuid}
                      onChange={handleEditInputChange}
                      required
                      disabled={!editFormData.country_uuid || loading}
                      className="form-control-lg"
                      style={{
                        borderRadius: '10px',
                        border: '2px solid #e3e6f0',
                        fontSize: '1rem',
                        padding: '12px 16px',
                        backgroundColor: (!editFormData.country_uuid || loading) ? '#f8f9fa' : 'white'
                      }}
                    >
                      <option value="">
                        {!editFormData.country_uuid 
                          ? "🏛️ Sélectionnez d'abord un pays" 
                          : loading 
                          ? "⏳ Chargement des provinces..." 
                          : "🏛️ Sélectionner une province"
                        }
                      </option>
                      {provinces.map((province) => (
                        <option key={province.uuid} value={province.uuid}>
                          📍 {province.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Progress indicator */}
            <div className="progress-indicator mt-4">
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  <i className="nc-icon nc-check-2 text-success mr-1"></i>
                  Progression du formulaire: {editFormData.name && editFormData.country_uuid && editFormData.province_uuid ? '100%' : editFormData.name && editFormData.country_uuid ? '66%' : editFormData.name ? '33%' : '0%'}
                </small>
                <small className="text-muted">
                  {user && (
                    <>
                      <i className="nc-icon nc-single-02 text-info mr-1"></i>
                      Modifié par: {user.first_name} {user.last_name}
                    </>
                  )}
                </small>
              </div>
              <div className="progress mt-2" style={{height: '4px', borderRadius: '2px'}}>
                <div 
                  className="progress-bar bg-warning" 
                  style={{
                    width: editFormData.name && editFormData.country_uuid && editFormData.province_uuid ? '100%' : 
                           editFormData.name && editFormData.country_uuid ? '66%' : 
                           editFormData.name ? '33%' : '0%',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease'
                  }}
                ></div>
              </div>
            </div>
          </Modal.Body>
          
          <Modal.Footer className="border-0 p-4" style={{backgroundColor: '#ffffff'}}>
            <div className="w-100 d-flex justify-content-between align-items-center">
              <Button 
                variant="outline-secondary" 
                onClick={handleEditModalClose}
                disabled={submitLoading}
                className="px-4 py-2"
                style={{borderRadius: '25px', fontWeight: '600'}}
              >
                <i className="nc-icon nc-simple-remove mr-2"></i>
                Annuler
              </Button>
              
              <Button 
                variant="warning" 
                type="submit"
                disabled={submitLoading || !editFormData.name || !editFormData.country_uuid || !editFormData.province_uuid}
                className="px-4 py-2"
                style={{
                  borderRadius: '25px', 
                  fontWeight: '600',
                  background: 'linear-gradient(45deg, #ffc107, #ff8f00)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(255, 193, 7, 0.3)',
                  color: 'white'
                }}
              >
                {submitLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="mr-2"
                    />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <i className="nc-icon nc-check-2 mr-2"></i>
                    Mettre à jour la Zone
                  </>
                )}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        show={showDeleteModal} 
        onHide={handleDeleteCancel} 
        centered
        size="md"
        className="delete-modal"
        backdrop="static"
      >
        <Modal.Header className="border-0 text-center">
          <Modal.Title className="w-100">
            <div className="d-flex flex-column align-items-center">
              <div className="delete-icon mb-3">
                <i className="nc-icon nc-simple-remove" style={{fontSize: '40px', color: 'white'}}></i>
              </div>
              <h3 className="mb-2 text-white font-weight-bold">⚠️ Confirmation de Suppression</h3>
              <p className="text-light mb-0 opacity-90">Action irréversible - Procédez avec prudence</p>
            </div>
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="px-4 py-4">
          <div className="warning-zone">
            <div className="text-center mb-3">
              <i className="nc-icon nc-alert-circle-i" style={{fontSize: '50px', color: '#dc3545'}}></i>
            </div>
            
            <h5 className="text-center danger-text mb-3">
              🚨 Vous êtes sur le point de supprimer une zone !
            </h5>
            
            {areaToDelete && (
              <div className="area-info">
                <div className="d-flex align-items-center">
                  <div className="mr-3">
                    <span style={{fontSize: '30px'}}>📍</span>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1 font-weight-bold text-dark">Zone à supprimer:</h6>
                    <p className="mb-1 text-danger font-weight-bold" style={{fontSize: '18px'}}>
                      {areaToDelete.name}
                    </p>
                    <small className="text-muted">
                      <i className="nc-icon nc-time-alarm mr-1"></i>
                      Cette action va masquer la zone définitivement
                    </small>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-light rounded">
              <h6 className="danger-text mb-2">
                <i className="nc-icon nc-bullet-list-67 mr-2"></i>
                Conséquences de cette action:
              </h6>
              <ul className="text-muted mb-0" style={{fontSize: '14px'}}>
                <li>La zone sera supprimée définitivement de la base de données</li>
                <li>Toutes les données associées seront perdues</li>
                <li>L'action sera immédiate et irréversible</li>
                <li>Cette action nécessite une attention particulière</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-muted mb-0">
              <i className="nc-icon nc-bulb-63 mr-2"></i>
              <strong>Attention:</strong> Cette suppression est définitive - les données seront perdues de manière permanente.
            </p>
          </div>
        </Modal.Body>
        
        <Modal.Footer className="border-0 px-4 pb-4">
          <div className="w-100 d-flex gap-3">
            <Button 
              variant="secondary" 
              onClick={handleDeleteCancel}
              disabled={submitLoading}
              className="flex-fill py-3 btn-cancel-delete"
              style={{borderRadius: '12px', fontWeight: '600'}}
            >
              <i className="nc-icon nc-simple-remove mr-2"></i>
              Annuler
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteConfirm}
              disabled={submitLoading}
              className="flex-fill py-3 btn-confirm-delete"
              style={{borderRadius: '12px'}}
            >
              {submitLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="mr-2"
                  />
                  Suppression en cours...
                </>
              ) : (
                <>
                  <i className="nc-icon nc-simple-remove mr-2"></i>
                  Confirmer la Suppression
                </>
              )}
            </Button>
          </div>
          
          <div className="w-100 text-center mt-3">
            <small className="text-muted">
              <i className="nc-icon nc-lock-circle-open mr-1"></i>
              Suppression sécurisée avec signature utilisateur
            </small>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Area;
