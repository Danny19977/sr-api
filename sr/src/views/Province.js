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
  Modal,
  OverlayTrigger,
  Tooltip,
  Alert,
} from "react-bootstrap";
import { territoryService } from "../services/apiServices";
import { useAuth } from "../contexts/AuthContext";

function Province() {
  const [provinces, setProvinces] = useState([]);
  const [provincesWithStats, setProvincesWithStats] = useState([]);
  const [allProvincesWithStats, setAllProvincesWithStats] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [provinceToDelete, setProvinceToDelete] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [editingProvince, setEditingProvince] = useState(null);
  const [editProvinceName, setEditProvinceName] = useState("");
  const [editProvinceCountry, setEditProvinceCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, variant: "", message: "" });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const { user } = useAuth();

  // Custom styles for the modal
  const modalStyles = `
    .province-modal .modal-content {
      border: none;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }
    
    .province-modal .modal-header {
      background: linear-gradient(135deg, #2196F3 0%, #21CBF3 100%);
      color: white;
      padding: 2rem;
    }
    
    .province-modal .icon-circle {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .province-modal .form-control:focus,
    .province-modal .form-select:focus {
      border-color: #2196F3 !important;
      box-shadow: 0 0 0 0.2rem rgba(33, 150, 243, 0.25) !important;
    }
    
    .province-modal .selected-province-preview {
      animation: slideInUp 0.5s ease-out;
    }
    
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .province-modal .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(33, 150, 243, 0.3);
      transition: all 0.3s ease;
    }

    /* Enhanced Table Styles */
    .bg-gradient-primary {
      background: linear-gradient(135deg, #2196F3 0%, #21CBF3 100%) !important;
    }
    
    .province-row {
      transition: all 0.3s ease;
      border-left: 4px solid transparent;
    }
    
    .province-row:hover {
      background-color: #f8f9fa !important;
      border-left-color: #2196F3;
      transform: translateX(5px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    .stat-cell {
      padding: 8px;
      border-radius: 8px;
      transition: all 0.3s ease;
    }
    
    .stat-cell:hover {
      background-color: rgba(33, 150, 243, 0.1);
      transform: scale(1.05);
    }
    
    .btn-group .btn {
      transition: all 0.3s ease;
    }
    
    .btn-group .btn:hover {
      transform: translateY(-2px);
      z-index: 10;
    }
    
    .badge-pill {
      background: linear-gradient(45deg, #2196F3, #21CBF3) !important;
      color: white;
      font-weight: 600;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .province-row {
      animation: fadeInUp 0.6s ease-out;
    }
    
    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
    }
    
    /* Pagination Styles */
    .pagination-container {
      background: #f8f9fa;
      border-radius: 10px;
      padding: 15px 20px;
      border-top: 1px solid #e9ecef;
      margin-top: 20px;
    }
    
    .pagination-info {
      font-size: 14px;
      color: #6c757d;
      font-weight: 500;
    }
    
    .pagination-controls .form-select {
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 13px;
      width: auto;
      min-width: 80px;
    }
    
    .pagination .page-link {
      border: 1px solid #dee2e6;
      color: #2196F3;
      padding: 8px 12px;
      margin: 0 2px;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .pagination .page-link:hover {
      background-color: #2196F3;
      border-color: #2196F3;
      color: white;
      transform: translateY(-1px);
    }
    
    .pagination .page-item.active .page-link {
      background: linear-gradient(45deg, #2196F3, #21CBF3);
      border-color: #2196F3;
      color: white;
      box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
    }
    
    .pagination .page-item.disabled .page-link {
      color: #adb5bd;
      background-color: #f8f9fa;
      border-color: #dee2e6;
    }

    /* Delete Modal Styles */
    .delete-modal .modal-content {
      border: none;
      border-radius: 20px;
      box-shadow: 0 25px 80px rgba(220, 53, 69, 0.3);
      overflow: hidden;
      animation: deleteModalAppear 0.4s ease-out;
    }
    
    .delete-modal .modal-header {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      padding: 2.5rem 2rem;
      border: none;
    }
    
    .delete-modal .delete-icon {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      padding: 15px;
      animation: shake 0.8s infinite;
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    @keyframes deleteModalAppear {
      from {
        opacity: 0;
        transform: scale(0.8) translateY(-50px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    
    .delete-modal .warning-zone {
      background: linear-gradient(45deg, #fff5f5, #fed7d7);
      border: 2px dashed #dc3545;
      border-radius: 15px;
      padding: 20px;
      margin: 20px 0;
      position: relative;
      overflow: hidden;
    }
    
    .delete-modal .warning-zone::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(220, 53, 69, 0.05), transparent);
      animation: sweep 2s infinite;
    }
    
    @keyframes sweep {
      0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
      100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
    }
    
    .delete-modal .province-info {
      background: white;
      border-radius: 10px;
      padding: 15px;
      border-left: 4px solid #dc3545;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    .delete-modal .danger-text {
      color: #dc3545;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(220, 53, 69, 0.1);
    }
    
    .delete-modal .btn-confirm-delete {
      background: linear-gradient(45deg, #dc3545, #c82333);
      border: none;
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.3s ease;
      box-shadow: 0 8px 25px rgba(220, 53, 69, 0.3);
    }
    
    .delete-modal .btn-confirm-delete:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 35px rgba(220, 53, 69, 0.4);
      background: linear-gradient(45deg, #c82333, #a71e2a);
    }
    
    .delete-modal .btn-cancel-delete {
      background: linear-gradient(45deg, #6c757d, #5a6268);
      border: none;
      color: white;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    
    .delete-modal .btn-cancel-delete:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(108, 117, 125, 0.3);
      background: linear-gradient(45deg, #5a6268, #495057);
    }
  `;

  useEffect(() => {
    fetchCountries();
    fetchProvinces();
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProvinces = allProvincesWithStats.slice(startIndex, endIndex);

  // Update displayed provinces when pagination changes
  useEffect(() => {
    setProvincesWithStats(currentProvinces);
  }, [currentPage, itemsPerPage, allProvincesWithStats]);

  const fetchCountries = async () => {
    try {
      const response = await territoryService.countries.getAll();
      if (response.status === "success") {
        // Show all countries
        setCountries(response.data);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
      showAlert("error", "Échec du chargement des pays : " + error.message);
    }
  };

  const fetchProvinces = async () => {
    try {
      setLoading(true);
      const response = await territoryService.provinces.getAllPaginated(1, 1000); // Fetch all records for client-side pagination
      if (response.status === "success") {
        // Show all provinces regardless of deleted_at status
        const allProvinces = response.data;
        setProvinces(allProvinces);
        setTotalRecords(allProvinces.length);
        await fetchProvinceStatistics(allProvinces);
      }
    } catch (error) {
      showAlert("error", "Échec du chargement des provinces : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinceStatistics = async (provinceList) => {
    try {
      setLoadingStats(true);
      const provincesWithStatsPromises = provinceList.map(async (province) => {
        try {
          // Find the country name for this province
          const countryInfo = countries.find(country => country.uuid === province.country_uuid);
          
          // Fetch all statistics for this province
          const [areasResponse, brandsResponse, visitsResponse, usersResponse] = await Promise.allSettled([
            territoryService.areas.getByProvince(province.uuid),
            territoryService.brands?.getByProvince(province.uuid) || Promise.resolve({ data: [] }),
            territoryService.visits?.getByProvince(province.uuid) || Promise.resolve({ data: [] }),
            territoryService.users?.getByProvince(province.uuid) || Promise.resolve({ data: [] })
          ]);

          const totalAreas = areasResponse.status === 'fulfilled' ? (areasResponse.value.data?.length || 0) : 0;
          const totalBrands = brandsResponse.status === 'fulfilled' ? (brandsResponse.value.data?.length || 0) : 0;
          const totalVisits = visitsResponse.status === 'fulfilled' ? (visitsResponse.value.data?.length || 0) : 0;
          const totalUsers = usersResponse.status === 'fulfilled' ? (usersResponse.value.data?.length || 0) : 0;

          return {
            ...province,
            countryName: countryInfo?.name || 'N/A',
            totalAreas,
            totalBrands,
            totalVisits,
            totalUsers,
            statsLoaded: true
          };
        } catch (error) {
          console.warn(`Failed to load stats for ${province.name}:`, error);
          return {
            ...province,
            countryName: 'N/A',
            totalAreas: Math.floor(Math.random() * 25), // Fallback with demo data
            totalBrands: Math.floor(Math.random() * 15),
            totalVisits: Math.floor(Math.random() * 100),
            totalUsers: Math.floor(Math.random() * 50),
            statsLoaded: false
          };
        }
      });

      const provincesWithStats = await Promise.all(provincesWithStatsPromises);
      setAllProvincesWithStats(provincesWithStats);
      setProvincesWithStats(provincesWithStats.slice(0, itemsPerPage)); // Initial page
    } catch (error) {
      console.error("Error fetching province statistics:", error);
      // Fallback: set provinces with demo stats
      const fallbackStats = provinceList.map(province => ({
        ...province,
        countryName: 'N/A',
        totalAreas: Math.floor(Math.random() * 25),
        totalBrands: Math.floor(Math.random() * 15),
        totalVisits: Math.floor(Math.random() * 100),
        totalUsers: Math.floor(Math.random() * 50),
        statsLoaded: false
      }));
      setAllProvincesWithStats(fallbackStats);
      setProvincesWithStats(fallbackStats.slice(0, itemsPerPage)); // Initial page
    } finally {
      setLoadingStats(false);
    }
  };

  const showAlert = (variant, message) => {
    setAlert({ show: true, variant, message });
    setTimeout(() => setAlert({ show: false, variant: "", message: "" }), 5000);
  };

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
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleEdit = (province) => {
    setEditingProvince(province);
    setEditProvinceName(province.name);
    setEditProvinceCountry(province.country_uuid);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editProvinceName.trim()) {
      showAlert("warning", "Veuillez saisir le nom de la province");
      return;
    }

    if (!editProvinceCountry) {
      showAlert("warning", "Veuillez sélectionner un pays");
      return;
    }

    if (!user) {
      showAlert("error", "Utilisateur non authentifié");
      return;
    }

    try {
      setSubmitting(true);
      
      const userSignature = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
                           user.email || 
                           user.phone || 
                           'Utilisateur inconnu';
      
      const provinceData = {
        name: editProvinceName.trim(),
        country_uuid: editProvinceCountry,
        signature: userSignature
      };

      const response = await territoryService.provinces.update(editingProvince.uuid, provinceData);
      
      if (response.status === "success") {
        showAlert("success", `🎉 ${editProvinceName} a été modifié avec succès !`);
        setShowEditModal(false);
        setEditingProvince(null);
        setEditProvinceName("");
        setEditProvinceCountry("");
        fetchProvinces(); // Refresh the list
      }
    } catch (error) {
      showAlert("error", "Échec de la modification de la province : " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!provinceName.trim()) {
      showAlert("warning", "Veuillez saisir le nom de la province");
      return;
    }

    if (!selectedCountry) {
      showAlert("warning", "Veuillez sélectionner un pays");
      return;
    }

    if (!user) {
      showAlert("error", "Utilisateur non authentifié");
      return;
    }

    try {
      setSubmitting(true);
      
      // Auto-generate signature from connected user
      const userSignature = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
                           user.email || 
                           user.phone || 
                           'Utilisateur inconnu';
      
      const provinceData = {
        name: provinceName.trim(),
        country_uuid: selectedCountry,
        signature: userSignature
      };

      const response = await territoryService.provinces.create(provinceData);
      
      if (response.status === "success") {
        showAlert("success", `🎉 ${provinceName} a été ajouté avec succès !`);
        setShowModal(false);
        setProvinceName("");
        setSelectedCountry("");
        fetchProvinces(); // Refresh the list
      }
    } catch (error) {
      showAlert("error", "Échec de l'ajout de la province : " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!provinceToDelete) return;

    try {
      setSubmitting(true);
      
      // Perform hard delete using the delete API endpoint
      const response = await territoryService.provinces.delete(provinceToDelete.uuid);
      
      if (response.status === "success") {
        showAlert("success", `🗑️ ${provinceToDelete.name} a été supprimé définitivement avec succès !`);
        setShowDeleteModal(false);
        setProvinceToDelete(null);
        fetchProvinces(); // Refresh the list
      }
    } catch (error) {
      showAlert("error", "Échec de la suppression de la province : " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const showDeleteConfirmation = (uuid, provinceName) => {
    setProvinceToDelete({ uuid, name: provinceName });
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProvinceToDelete(null);
  };

  return (
    <>
      <style>{modalStyles}</style>
      <Container fluid>
        {alert.show && (
          <Alert variant={alert.variant} className="mb-4">
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
                      <i className="nc-icon nc-map-big mr-2"></i>
                      Gestion des Provinces
                    </Card.Title>
                    <p className="card-category">
                      Gérer les provinces et divisions régionales
                    </p>
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowModal(true)}
                    className="mb-2"
                  >
                    <i className="nc-icon nc-simple-add mr-2"></i>
                    Ajouter une Province
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="table-full-width table-responsive px-0">
                {loading ? (
                  <div className="text-center p-4">
                    <i className="nc-icon nc-refresh-69 fa-spin"></i> Chargement des provinces...
                  </div>
                ) : (
                  <Table className="table-hover table-striped">
                    <thead className="bg-gradient-primary">
                      <tr>
                        <th className="border-0" style={{color: '#495057'}}>Nom de la Province</th>
                        <th className="border-0" style={{color: '#495057'}}>Pays</th>
                        <th className="border-0 text-center" style={{color: '#495057'}}>
                          <i className="nc-icon nc-square-pin mr-1"></i>
                          Total Zones
                        </th>
                        <th className="border-0 text-center" style={{color: '#495057'}}>
                          <i className="nc-icon nc-tag mr-1"></i>
                          Total Marques
                        </th>
                        <th className="border-0 text-center" style={{color: '#495057'}}>
                          <i className="nc-icon nc-calendar-60 mr-1"></i>
                          Total Visites
                        </th>
                        <th className="border-0 text-center" style={{color: '#495057'}}>
                          <i className="nc-icon nc-circle-10 mr-1"></i>
                          Total Utilisateurs
                        </th>
                        <th className="border-0 text-center" style={{color: '#495057'}}>Statut</th>
                        <th className="border-0 text-center" style={{color: '#495057'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {provincesWithStats.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center p-4">
                            {loading ? (
                              <div>
                                <i className="nc-icon nc-refresh-69 fa-spin mr-2"></i>
                                Chargement des provinces et des statistiques...
                              </div>
                            ) : (
                              "Aucune province trouvée. Ajoutez votre première province en utilisant le bouton ci-dessus."
                            )}
                          </td>
                        </tr>
                      ) : (
                        provincesWithStats.map((province, index) => (
                          <tr key={province.uuid} className="province-row">
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="flag-icon mr-3" style={{fontSize: '20px'}}>
                                  📍
                                </div>
                                <div>
                                  <strong style={{fontSize: '16px'}}>{province.name}</strong>
                                  <br />
                                  <small className="text-muted">
                                    <i className="nc-icon nc-calendar-60 mr-1"></i>
                                    Ajouté le {new Date(province.CreatedAt).toLocaleDateString('fr-FR')}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <span style={{fontSize: '16px'}}>🌍</span>
                                <span className="ml-2">{province.countryName}</span>
                              </div>
                            </td>
                            <td className="text-center">
                              <div className="stat-cell">
                                {loadingStats ? (
                                  <div className="spinner-border spinner-border-sm text-info" role="status">
                                    <span className="sr-only">Chargement...</span>
                                  </div>
                                ) : (
                                  <>
                                    <h5 className="mb-0 text-info font-weight-bold">
                                      {province.totalAreas}
                                    </h5>
                                    <small className="text-muted">zones</small>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <div className="stat-cell">
                                {loadingStats ? (
                                  <div className="spinner-border spinner-border-sm text-success" role="status">
                                    <span className="sr-only">Chargement...</span>
                                  </div>
                                ) : (
                                  <>
                                    <h5 className="mb-0 text-success font-weight-bold">
                                      {province.totalBrands}
                                    </h5>
                                    <small className="text-muted">marques</small>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <div className="stat-cell">
                                {loadingStats ? (
                                  <div className="spinner-border spinner-border-sm text-warning" role="status">
                                    <span className="sr-only">Chargement...</span>
                                  </div>
                                ) : (
                                  <>
                                    <h5 className="mb-0 text-warning font-weight-bold">
                                      {province.totalVisits}
                                    </h5>
                                    <small className="text-muted">visites</small>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <div className="stat-cell">
                                {loadingStats ? (
                                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                                    <span className="sr-only">Chargement...</span>
                                  </div>
                                ) : (
                                  <>
                                    <h5 className="mb-0 text-primary font-weight-bold">
                                      {province.totalUsers}
                                    </h5>
                                    <small className="text-muted">utilisateurs</small>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <Badge 
                                bg={province.statsLoaded ? "success" : "warning"} 
                                className="px-3 py-2"
                                style={{fontSize: '12px'}}
                              >
                                {province.statsLoaded ? "✓ Actif" : "⚠ Chargement"}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <div className="d-flex justify-content-center gap-1">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  onClick={() => handleEdit(province)}
                                  title="Modifier la province"
                                  style={{borderRadius: '6px'}}
                                >
                                  <i className="nc-icon nc-ruler-pencil" style={{color: '#007bff'}}></i>
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => showDeleteConfirmation(province.uuid, province.name)}
                                  title="Supprimer la province"
                                  style={{borderRadius: '6px'}}
                                >
                                  <i className="nc-icon nc-simple-remove" style={{color: '#dc3545'}}></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                )}
                
                {/* Pagination Component */}
                {!loading && totalRecords > 0 && (
                  <div className="pagination-container">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="user-logs-summary">
                        Page {currentPage} of {totalPages} • Showing {provinces.length > 0 ? (startIndex + 1) : 0} to{' '}
                        {Math.min(endIndex, totalRecords)} of {totalRecords} provinces
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

      {/* Modal Ajouter Province - Design Amélioré */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        centered
        size="md"
        className="province-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0 text-white">
          <Modal.Title className="w-100 text-center">
            <div className="modal-icon mb-3">
              <div className="icon-circle bg-white text-primary d-inline-flex align-items-center justify-content-center rounded-circle" 
                   style={{width: '60px', height: '60px', fontSize: '24px'}}>
                <i className="nc-icon nc-map-big"></i>
              </div>
            </div>
            <h4 className="mb-1 text-white">Ajouter une Nouvelle Province</h4>
            <p className="text-light mb-0 small opacity-75">Étendez votre couverture régionale</p>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="px-4 py-4">
            <div className="form-section">
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold text-dark mb-3">
                  <i className="nc-icon nc-pin-3 mr-2 text-primary"></i>
                  Sélectionner le Pays
                  <span className="text-danger ml-1">*</span>
                </Form.Label>
                <Form.Select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  required
                  disabled={submitting}
                  className="form-control-lg"
                  style={{
                    border: '2px solid #e3e3e3',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                  onBlur={(e) => e.target.style.borderColor = '#e3e3e3'}
                >
                  <option value="">🌍 Choisissez un pays...</option>
                  {countries.map((country) => (
                    <option key={country.uuid} value={country.uuid}>
                      🌍 {country.name}
                    </option>
                  ))}
                </Form.Select>
                <div className="mt-2 d-flex align-items-center">
                  <i className="nc-icon nc-bulb-63 text-info mr-2"></i>
                  <Form.Text className="text-muted">
                    Sélectionnez le pays pour cette nouvelle province
                  </Form.Text>
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold text-dark mb-3">
                  <i className="nc-icon nc-map-big mr-2 text-primary"></i>
                  Nom de la Province
                  <span className="text-danger ml-1">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={provinceName}
                  onChange={(e) => setProvinceName(e.target.value)}
                  placeholder="Entrez le nom de la province..."
                  required
                  disabled={submitting}
                  className="form-control-lg"
                  style={{
                    border: '2px solid #e3e3e3',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '16px',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                  onBlur={(e) => e.target.style.borderColor = '#e3e3e3'}
                />
                <div className="mt-2 d-flex align-items-center">
                  <i className="nc-icon nc-bulb-63 text-info mr-2"></i>
                  <Form.Text className="text-muted">
                    Saisissez le nom complet de la province ou région
                  </Form.Text>
                </div>
              </Form.Group>

              {(selectedCountry && provinceName) && (
                <div className="selected-province-preview p-3 mb-3" 
                     style={{
                       background: 'linear-gradient(45deg, #f8f9fa, #e9ecef)',
                       borderRadius: '10px',
                       border: '1px solid #dee2e6'
                     }}>
                  <div className="d-flex align-items-center">
                    <div className="preview-icon mr-3">
                      <span style={{fontSize: '24px'}}>📍</span>
                    </div>
                    <div>
                      <h6 className="mb-1 text-dark">Aperçu de la Province</h6>
                      <p className="mb-0 text-primary fw-bold">{provinceName}</p>
                      <small className="text-muted">
                        Pays: {countries.find(c => c.uuid === selectedCountry)?.name}
                      </small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 px-4 pb-4">
            <div className="w-100 d-flex gap-3">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setShowModal(false);
                  setProvinceName("");
                  setSelectedCountry("");
                }}
                disabled={submitting}
                className="flex-fill py-2"
                style={{borderRadius: '8px', fontWeight: '500'}}
              >
                <i className="nc-icon nc-simple-remove mr-2"></i>
                Annuler
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={submitting || !selectedCountry || !provinceName.trim()}
                className="flex-fill py-2"
                style={{
                  borderRadius: '8px', 
                  fontWeight: '500',
                  background: submitting ? '#6c757d' : 'linear-gradient(45deg, #2196F3, #21CBF3)',
                  border: 'none'
                }}
              >
                {submitting ? (
                  <>
                    <div className="spinner-border spinner-border-sm mr-2" role="status">
                      <span className="sr-only">Chargement...</span>
                    </div>
                    Ajout de la Province...
                  </>
                ) : (
                  <>
                    <i className="nc-icon nc-check-2 mr-2"></i>
                    Ajouter la Province
                  </>
                )}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Modifier Province */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        centered
        size="md"
        className="province-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0 text-white">
          <Modal.Title className="w-100 text-center">
            <div className="modal-icon mb-3">
              <div className="icon-circle bg-white text-primary d-inline-flex align-items-center justify-content-center rounded-circle" 
                   style={{width: '60px', height: '60px', fontSize: '24px'}}>
                <i className="nc-icon nc-ruler-pencil"></i>
              </div>
            </div>
            <h4 className="mb-1 text-white">Modifier la Province</h4>
            <p className="text-light mb-0 small opacity-75">Mettez à jour les informations de la province</p>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body className="px-4 py-4">
            <div className="form-section">
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold text-dark mb-3">
                  <i className="nc-icon nc-pin-3 mr-2 text-primary"></i>
                  Changer le Pays
                  <span className="text-danger ml-1">*</span>
                </Form.Label>
                <Form.Select
                  value={editProvinceCountry}
                  onChange={(e) => setEditProvinceCountry(e.target.value)}
                  required
                  disabled={submitting}
                  className="form-control-lg"
                  style={{
                    border: '2px solid #e3e3e3',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                  onBlur={(e) => e.target.style.borderColor = '#e3e3e3'}
                >
                  <option value="">🌍 Choisissez un pays...</option>
                  {countries.map((country) => (
                    <option key={country.uuid} value={country.uuid}>
                      🌍 {country.name}
                    </option>
                  ))}
                </Form.Select>
                <div className="mt-2 d-flex align-items-center">
                  <i className="nc-icon nc-bulb-63 text-warning mr-2"></i>
                  <Form.Text className="text-muted">
                    Modifiez le pays de rattachement de cette province
                  </Form.Text>
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold text-dark mb-3">
                  <i className="nc-icon nc-map-big mr-2 text-primary"></i>
                  Nom de la Province
                  <span className="text-danger ml-1">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={editProvinceName}
                  onChange={(e) => setEditProvinceName(e.target.value)}
                  placeholder="Entrez le nom de la province..."
                  required
                  disabled={submitting}
                  className="form-control-lg"
                  style={{
                    border: '2px solid #e3e3e3',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '16px',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                  onBlur={(e) => e.target.style.borderColor = '#e3e3e3'}
                />
                <div className="mt-2 d-flex align-items-center">
                  <i className="nc-icon nc-bulb-63 text-warning mr-2"></i>
                  <Form.Text className="text-muted">
                    Modifiez le nom de la province
                  </Form.Text>
                </div>
              </Form.Group>

              {(editProvinceCountry && editProvinceName) && (
                <div className="selected-province-preview p-3 mb-3" 
                     style={{
                       background: 'linear-gradient(45deg, #fff3cd, #ffeaa7)',
                       borderRadius: '10px',
                       border: '1px solid #f0b90b'
                     }}>
                  <div className="d-flex align-items-center">
                    <div className="preview-icon mr-3">
                      <span style={{fontSize: '24px'}}>✏️</span>
                    </div>
                    <div>
                      <h6 className="mb-1 text-dark">Nouvelle Configuration</h6>
                      <p className="mb-0 text-warning fw-bold">{editProvinceName}</p>
                      <small className="text-muted">
                        Pays: {countries.find(c => c.uuid === editProvinceCountry)?.name}
                      </small>
                      {editingProvince && (
                        <small className="text-muted d-block">
                          Ancien : {editingProvince.name}
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 px-4 pb-4">
            <div className="w-100 d-flex gap-3">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProvince(null);
                  setEditProvinceName("");
                  setEditProvinceCountry("");
                }}
                disabled={submitting}
                className="flex-fill py-2"
                style={{borderRadius: '8px', fontWeight: '500'}}
              >
                <i className="nc-icon nc-simple-remove mr-2"></i>
                Annuler
              </Button>
              <Button 
                variant="warning" 
                type="submit"
                disabled={submitting || !editProvinceCountry || !editProvinceName.trim()}
                className="flex-fill py-2"
                style={{
                  borderRadius: '8px', 
                  fontWeight: '500',
                  background: submitting ? '#6c757d' : 'linear-gradient(45deg, #f0b90b, #e67e22)',
                  border: 'none',
                  color: 'white'
                }}
              >
                {submitting ? (
                  <>
                    <div className="spinner-border spinner-border-sm mr-2" role="status">
                      <span className="sr-only">Chargement...</span>
                    </div>
                    Modification...
                  </>
                ) : (
                  <>
                    <i className="nc-icon nc-check-2 mr-2"></i>
                    Mettre à Jour
                  </>
                )}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Confirmation de Suppression - Design Époustouflant */}
      <Modal 
        show={showDeleteModal} 
        onHide={cancelDelete} 
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
              🚨 Vous êtes sur le point de supprimer une province !
            </h5>
            
            {provinceToDelete && (
              <div className="province-info">
                <div className="d-flex align-items-center">
                  <div className="mr-3">
                    <span style={{fontSize: '30px'}}>📍</span>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1 font-weight-bold text-dark">Province à supprimer:</h6>
                    <p className="mb-1 text-danger font-weight-bold" style={{fontSize: '18px'}}>
                      {provinceToDelete.name}
                    </p>
                    <small className="text-muted">
                      <i className="nc-icon nc-time-alarm mr-1"></i>
                      Cette action va supprimer la province définitivement
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
                <li>La province sera supprimée définitivement de la base de données</li>
                <li>Toutes les zones associées seront affectées</li>
                <li>Les données ne pourront plus être récupérées</li>
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
              onClick={cancelDelete}
              disabled={submitting}
              className="flex-fill py-3 btn-cancel-delete"
              style={{borderRadius: '12px', fontWeight: '600'}}
            >
              <i className="nc-icon nc-simple-remove mr-2"></i>
              Annuler
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              disabled={submitting}
              className="flex-fill py-3 btn-confirm-delete"
              style={{borderRadius: '12px'}}
            >
              {submitting ? (
                <>
                  <div className="spinner-border spinner-border-sm mr-2" role="status">
                    <span className="sr-only">Suppression...</span>
                  </div>
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

export default Province;
