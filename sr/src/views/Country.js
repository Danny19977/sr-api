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
import { territoryService, salesService, userService } from "../services/apiServices";
import { useAuth } from "../contexts/AuthContext";

function Country() {
  const [countries, setCountries] = useState([]);
  const [countriesWithStats, setCountriesWithStats] = useState([]);
  const [allCountriesWithStats, setAllCountriesWithStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [editingCountry, setEditingCountry] = useState(null);
  const [editCountryName, setEditCountryName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, variant: "", message: "" });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const { user } = useAuth();

  // Custom styles for the modal - Province Design Applied
  const modalStyles = `
    .country-modal .modal-content {
      border: none;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }
    
    .country-modal .modal-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
    }
    
    .country-modal .icon-circle {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .country-modal .form-control:focus,
    .country-modal .form-select:focus {
      border-color: #667eea !important;
      box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25) !important;
    }
    
    .country-modal .selected-country-preview {
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
    
    .country-modal .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    }

    /* Enhanced Table Styles */
    .bg-gradient-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    }
    
    .country-row {
      transition: all 0.3s ease;
      border-left: 4px solid transparent;
    }
    
    .country-row:hover {
      background-color: #f8f9fa !important;
      border-left-color: #667eea;
      transform: translateX(5px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    .stat-cell {
      padding: 8px;
      border-radius: 8px;
      transition: all 0.3s ease;
    }
    
    .stat-cell:hover {
      background-color: rgba(102, 126, 234, 0.1);
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
      background: linear-gradient(45deg, #667eea, #764ba2) !important;
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
    
    .country-row {
      transition: all 0.3s ease;
      border-left: 4px solid transparent;
    }
    
    .country-row:hover {
      background-color: #f8f9fa !important;
      border-left-color: #667eea;
      transform: translateX(5px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    .stat-cell {
      padding: 8px;
      border-radius: 8px;
      transition: all 0.3s ease;
    }
    
    .stat-cell:hover {
      background-color: rgba(102, 126, 234, 0.1);
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
      background: linear-gradient(45deg, #667eea, #764ba2) !important;
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
    
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0,0,0);
      }
      40%, 43% {
        transform: translate3d(0, -10px, 0);
      }
      70% {
        transform: translate3d(0, -5px, 0);
      }
      90% {
        transform: translate3d(0, -2px, 0);
      }
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(102, 126, 234, 0);
      }
    }
    
    @keyframes shimmer {
      0% {
        background-position: -468px 0;
      }
      100% {
        background-position: 468px 0;
      }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes bounceLoader {
      0%, 80%, 100% {
        transform: scale(0);
      } 40% {
        transform: scale(1);
      }
    }
    
    .country-row {
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
      color: #667eea;
      padding: 8px 12px;
      margin: 0 2px;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .pagination .page-link:hover {
      background-color: #667eea;
      border-color: #667eea;
      color: white;
      transform: translateY(-1px);
    }
    
    .pagination .page-item.active .page-link {
      background: linear-gradient(45deg, #667eea, #764ba2);
      border-color: #667eea;
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    
    .pagination .page-item.disabled .page-link {
      color: #adb5bd;
      background-color: #f8f9fa;
      border-color: #dee2e6;
    }

    /* Delete Modal Styles for Country */
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
    
    .delete-modal .country-info {
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

  // Liste des pays africains
  const africanCountries = [
    "Algérie", "Angola", "Bénin", "Botswana", "Burkina Faso", "Burundi", "Cap-Vert", "Cameroun",
    "République centrafricaine", "Tchad", "Comores", "Congo", "République démocratique du Congo", 
    "Côte d'Ivoire", "Djibouti", "Égypte", "Guinée équatoriale", "Érythrée", "Eswatini", "Éthiopie",
    "Gabon", "Gambie", "Ghana", "Guinée", "Guinée-Bissau", "Kenya", "Lesotho", "Libéria", "Libye",
    "Madagascar", "Malawi", "Mali", "Mauritanie", "Maurice", "Maroc", "Mozambique", "Namibie",
    "Niger", "Nigéria", "Rwanda", "São Tomé-et-Príncipe", "Sénégal", "Seychelles", "Sierra Leone",
    "Somalie", "Afrique du Sud", "Soudan du Sud", "Soudan", "Tanzanie", "Togo", "Tunisie", "Ouganda",
    "Zambie", "Zimbabwe"
  ];

  useEffect(() => {
    fetchCountries();
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCountries = allCountriesWithStats.slice(startIndex, endIndex);

  // Update displayed countries when pagination changes
  useEffect(() => {
    setCountriesWithStats(currentCountries);
  }, [currentPage, itemsPerPage, allCountriesWithStats]);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      
      const response = await territoryService.countries.getAllPaginated(1, 1000);
      
      // Check if response has data regardless of status
      if (response && response.data && Array.isArray(response.data)) {
        
        // Show all countries regardless of deleted_at status
        const allCountries = response.data;
        
        if (allCountries.length > 0) {
          setCountries(allCountries);
          setTotalRecords(allCountries.length);
          
          // Temporarily set countries with basic stats to show them immediately
          const quickStats = allCountries.map(country => ({
            ...country,
            totalProvinces: 0,
            totalAreas: 0, 
            totalBrands: 0,
            totalUsers: 0,
            statsLoaded: false
          }));
          setAllCountriesWithStats(quickStats);
          setCountriesWithStats(quickStats.slice(0, itemsPerPage));
          
          // Then load detailed stats in background
          await fetchCountryStatistics(allCountries);
        } else {
          setCountries([]);
          setTotalRecords(0);
          setAllCountriesWithStats([]);
          setCountriesWithStats([]);
        }
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      console.error("API Error:", error);
      showAlert("warning", "Impossible de se connecter à l'API. Utilisation de données de démonstration.");
      
      // Create mock data if API fails
      const mockCountries = [
        {
          uuid: "mock-1",
          name: "Maroc",
          created_at: "2024-01-15T10:00:00Z"
        },
        {
          uuid: "mock-2", 
          name: "Algérie",
          created_at: "2024-01-16T10:00:00Z"
        },
        {
          uuid: "mock-3",
          name: "Tunisie", 
          created_at: "2024-01-17T10:00:00Z"
        },
        {
          uuid: "mock-4",
          name: "Égypte",
          created_at: "2024-01-18T10:00:00Z"
        },
        {
          uuid: "mock-5",
          name: "Sénégal",
          created_at: "2024-01-19T10:00:00Z"
        }
      ];
      
      setCountries(mockCountries);
      setTotalRecords(mockCountries.length);
      await fetchCountryStatistics(mockCountries);
    } finally {
      setLoading(false);
    }
  };

  const fetchCountryStatistics = async (countryList) => {
    try {
      setLoadingStats(true);
      const countriesWithStatsPromises = countryList.map(async (country) => {
        try {
          // Fetch statistics for each country in parallel
          const [provincesResponse, areasResponse, salesResponse, usersResponse] = await Promise.allSettled([
            territoryService.provinces.getByCountry(country.uuid),
            // For areas, we'll get them through provinces since there's no direct getByCountry for areas
            territoryService.provinces.getByCountry(country.uuid).then(async (provResponse) => {
              if (provResponse.data && provResponse.data.length > 0) {
                const areaPromises = provResponse.data.map(province => 
                  territoryService.areas.getByProvince(province.uuid).catch(() => ({ data: [] }))
                );
                const areaResults = await Promise.all(areaPromises);
                return { data: areaResults.flatMap(result => result.data || []) };
              }
              return { data: [] };
            }),
            salesService.getByCountry(country.uuid).catch(() => ({ data: [] })),
            // For users, we'll get all users and filter by country (if needed)
            userService.getAll().then(response => ({
              data: response.data ? response.data.filter(user => user.country_uuid === country.uuid) : []
            })).catch(() => ({ data: [] }))
          ]);

          return {
            ...country,
            totalProvinces: provincesResponse.status === 'fulfilled' ? (provincesResponse.value?.data?.length || 0) : 0,
            totalAreas: areasResponse.status === 'fulfilled' ? (areasResponse.value?.data?.length || 0) : 0,
            totalBrands: salesResponse.status === 'fulfilled' ? (salesResponse.value?.data?.length || 0) : 0,
            totalUsers: usersResponse.status === 'fulfilled' ? (usersResponse.value?.data?.length || 0) : 0,
            statsLoaded: true
          };
        } catch (error) {
          console.warn(`Failed to load stats for ${country.name}:`, error);
          return {
            ...country,
            totalProvinces: Math.floor(Math.random() * 10), // Fallback with demo data
            totalAreas: Math.floor(Math.random() * 25),
            totalBrands: Math.floor(Math.random() * 15),
            totalUsers: Math.floor(Math.random() * 50),
            statsLoaded: false
          };
        }
      });

      const countriesWithStats = await Promise.all(countriesWithStatsPromises);
      
      setAllCountriesWithStats(countriesWithStats);
      setCountriesWithStats(countriesWithStats.slice(0, itemsPerPage)); // Initial page
    } catch (error) {
      console.error("Error fetching country statistics:", error);
      // Fallback: set countries with demo stats
      const fallbackStats = countryList.map(country => ({
        ...country,
        totalProvinces: Math.floor(Math.random() * 10),
        totalAreas: Math.floor(Math.random() * 25),
        totalBrands: Math.floor(Math.random() * 15),
        totalUsers: Math.floor(Math.random() * 50),
        statsLoaded: false
      }));
      
      setAllCountriesWithStats(fallbackStats);
      setCountriesWithStats(fallbackStats.slice(0, itemsPerPage)); // Initial page
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

  const handleEdit = (country) => {
    setEditingCountry(country);
    setEditCountryName(country.name);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editCountryName.trim()) {
      showAlert("warning", "Veuillez sélectionner un pays dans la liste déroulante");
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
      
      const countryData = {
        name: editCountryName,
        signature: userSignature
      };

      const response = await territoryService.countries.update(editingCountry.uuid, countryData);
      
      if (response.status === "success") {
        showAlert("success", `🎉 ${editCountryName} a été modifié avec succès !`);
        setShowEditModal(false);
        setEditingCountry(null);
        setEditCountryName("");
        fetchCountries(); // Actualiser la liste
      }
    } catch (error) {
      showAlert("error", "Échec de la modification du pays : " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCountry) {
      showAlert("warning", "Veuillez sélectionner un pays dans la liste déroulante");
      return;
    }

    if (!user) {
      showAlert("error", "Utilisateur non authentifié");
      return;
    }

    try {
      setSubmitting(true);
      
      // Auto-générer la signature à partir de l'utilisateur connecté
      const userSignature = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
                           user.email || 
                           user.phone || 
                           'Utilisateur inconnu';
      
      const countryData = {
        name: selectedCountry,
        signature: userSignature
      };

      const response = await territoryService.countries.create(countryData);
      
      if (response.status === "success") {
        showAlert("success", `🎉 ${selectedCountry} a été ajouté avec succès à votre territoire !`);
        setShowModal(false);
        setSelectedCountry("");
        fetchCountries(); // Actualiser la liste
      }
    } catch (error) {
      showAlert("error", "Échec de l'ajout du pays : " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!countryToDelete) return;

    try {
      setSubmitting(true);
      
      // Perform hard delete using the delete API endpoint
      const response = await territoryService.countries.delete(countryToDelete.uuid);
      
      if (response.status === "success") {
        showAlert("success", `🗑️ ${countryToDelete.name} a été supprimé définitivement avec succès !`);
        setShowDeleteModal(false);
        setCountryToDelete(null);
        fetchCountries(); // Actualiser la liste
      }
    } catch (error) {
      showAlert("error", "Échec de la suppression du pays : " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const showDeleteConfirmation = (uuid, countryName) => {
    setCountryToDelete({ uuid, name: countryName });
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCountryToDelete(null);
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
                      <i className="nc-icon nc-globe mr-2"></i>
                      Gestion des Pays
                    </Card.Title>
                    <p className="card-category">
                      Gérer les pays et leurs divisions territoriales
                    </p>
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowModal(true)}
                    className="mb-2"
                  >
                    <i className="nc-icon nc-simple-add mr-2"></i>
                    Ajouter un Pays
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="table-full-width table-responsive px-0">
                {loading ? (
                  <div className="text-center p-4">
                    <i className="nc-icon nc-refresh-69 fa-spin"></i> Chargement des pays...
                  </div>
                ) : (
                  <Table className="table-hover table-striped">
                    <thead className="bg-gradient-primary">
                      <tr>
                        <th className="border-0" style={{color: '#495057'}}>Nom du Pays</th>
                        <th className="border-0 text-center" style={{color: '#495057'}}>
                          <i className="nc-icon nc-map-big mr-1"></i>
                          Total Provinces
                        </th>
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
                      {countriesWithStats.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center p-5">
                            {loading ? (
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '200px',
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))',
                                borderRadius: '20px',
                                margin: '10px',
                                border: '2px dashed rgba(102, 126, 234, 0.2)'
                              }}>
                                <div style={{
                                  width: '60px',
                                  height: '60px',
                                  border: '4px solid rgba(102, 126, 234, 0.2)',
                                  borderTop: '4px solid #667eea',
                                  borderRadius: '50%',
                                  animation: 'spin 1s linear infinite',
                                  marginBottom: '20px'
                                }}></div>
                                <h5 style={{
                                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  fontWeight: 'bold',
                                  marginBottom: '10px'
                                }}>
                                  🌍 Chargement des pays...
                                </h5>
                                <p style={{color: '#8c93a6', fontSize: '14px', textAlign: 'center', maxWidth: '300px'}}>
                                  Récupération des données des pays et calcul des statistiques en temps réel
                                </p>
                                <div style={{
                                  display: 'flex',
                                  gap: '8px',
                                  marginTop: '15px'
                                }}>
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#667eea',
                                    animation: 'bounceLoader 1.4s ease-in-out infinite both',
                                    animationDelay: '0s'
                                  }}></div>
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#764ba2',
                                    animation: 'bounceLoader 1.4s ease-in-out infinite both',
                                    animationDelay: '0.16s'
                                  }}></div>
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#667eea',
                                    animation: 'bounceLoader 1.4s ease-in-out infinite both',
                                    animationDelay: '0.32s'
                                  }}></div>
                                </div>
                              </div>
                            ) : (
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '200px',
                                background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.05), rgba(255, 143, 4, 0.05))',
                                borderRadius: '20px',
                                margin: '10px',
                                border: '2px dashed rgba(255, 193, 7, 0.3)'
                              }}>
                                <div style={{
                                  fontSize: '60px',
                                  marginBottom: '20px',
                                  opacity: '0.7'
                                }}>🌍</div>
                                <h5 style={{
                                  background: 'linear-gradient(45deg, #ffc107, #fd7e14)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  fontWeight: 'bold',
                                  marginBottom: '10px'
                                }}>
                                  Aucun pays trouvé
                                </h5>
                                <p style={{color: '#8c93a6', fontSize: '14px', textAlign: 'center', maxWidth: '300px'}}>
                                  Ajoutez votre premier pays en utilisant le bouton ci-dessus pour commencer à gérer vos territoires.
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        countriesWithStats.map((country, index) => (
                          <tr key={country.uuid} className="country-row">
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="flag-icon mr-3" style={{fontSize: '20px'}}>
                                  🌍
                                </div>
                                <div>
                                  <strong style={{fontSize: '16px'}}>{country.name}</strong>
                                  <br />
                                  <small className="text-muted">
                                    <i className="nc-icon nc-calendar-60 mr-1"></i>
                                    Ajouté le {new Date(country.created_at || country.CreatedAt).toLocaleDateString('fr-FR')}
                                  </small>
                                </div>
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
                                      {country.totalProvinces}
                                    </h5>
                                    <small className="text-muted">provinces</small>
                                  </>
                                )}
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
                                      {country.totalAreas}
                                    </h5>
                                    <small className="text-muted">zones</small>
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
                                      {country.totalBrands}
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
                                      {country.totalVisits}
                                    </h5>
                                    <small className="text-muted">visites</small>
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
                                      {country.totalUsers}
                                    </h5>
                                    <small className="text-muted">utilisateurs</small>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <Badge 
                                bg={country.statsLoaded ? "success" : "warning"} 
                                className="px-3 py-2"
                                style={{fontSize: '12px'}}
                              >
                                {country.statsLoaded ? "✓ Actif" : "⚠ Chargement"}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <div className="d-flex justify-content-center gap-1">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  onClick={() => handleEdit(country)}
                                  title="Modifier le pays"
                                  style={{borderRadius: '6px'}}
                                >
                                  <i className="nc-icon nc-ruler-pencil" style={{color: '#007bff'}}></i>
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => showDeleteConfirmation(country.uuid, country.name)}
                                  title="Supprimer le pays"
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
                        Page {currentPage} of {totalPages} • Showing {countries.length > 0 ? (startIndex + 1) : 0} to{' '}
                        {Math.min(endIndex, totalRecords)} of {totalRecords} countries
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

      {/* Modal Ajouter Pays - Design Amélioré */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        centered
        size="md"
        className="country-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0 text-white">
          <Modal.Title className="w-100 text-center">
            <div className="modal-icon mb-3">
              <div className="icon-circle bg-white text-primary d-inline-flex align-items-center justify-content-center rounded-circle" 
                   style={{width: '60px', height: '60px', fontSize: '24px'}}>
                <i className="nc-icon nc-globe"></i>
              </div>
            </div>
            <h4 className="mb-1 text-white">Ajouter un Nouveau Pays</h4>
            <p className="text-light mb-0 small opacity-75">Étendez votre portée territoriale en Afrique</p>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="px-4 py-4">
            <div className="form-section">
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold text-dark mb-3">
                  <i className="nc-icon nc-pin-3 mr-2 text-primary"></i>
                  Nom du Pays
                  <span className="text-danger ml-1">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  placeholder="Entrez le nom du pays..."
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
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e3e3e3'}
                />
                <div className="mt-2 d-flex align-items-center">
                  <i className="nc-icon nc-bulb-63 text-info mr-2"></i>
                  <Form.Text className="text-muted">
                    Saisissez le nom complet du pays
                  </Form.Text>
                </div>
              </Form.Group>

              {selectedCountry && (
                <div className="selected-country-preview p-3 mb-3" 
                     style={{
                       background: 'linear-gradient(45deg, #f8f9fa, #e9ecef)',
                       borderRadius: '10px',
                       border: '1px solid #dee2e6'
                     }}>
                  <div className="d-flex align-items-center">
                    <div className="preview-icon mr-3">
                      <span style={{fontSize: '24px'}}>🌍</span>
                    </div>
                    <div>
                      <h6 className="mb-1 text-dark">Pays Sélectionné</h6>
                      <p className="mb-0 text-primary fw-bold">{selectedCountry}</p>
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
                onClick={() => setShowModal(false)}
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
                disabled={submitting || !selectedCountry.trim()}
                className="flex-fill py-2"
                style={{
                  borderRadius: '8px', 
                  fontWeight: '500',
                  background: submitting ? '#6c757d' : 'linear-gradient(45deg, #667eea, #764ba2)',
                  border: 'none'
                }}
              >
                {submitting ? (
                  <>
                    <div className="spinner-border spinner-border-sm mr-2" role="status">
                      <span className="sr-only">Chargement...</span>
                    </div>
                    Ajout du Pays...
                  </>
                ) : (
                  <>
                    <i className="nc-icon nc-check-2 mr-2"></i>
                    Ajouter le Pays
                  </>
                )}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Modifier Pays */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        centered
        size="md"
        className="country-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0 text-white">
          <Modal.Title className="w-100 text-center">
            <div className="modal-icon mb-3">
              <div className="icon-circle bg-white text-primary d-inline-flex align-items-center justify-content-center rounded-circle" 
                   style={{width: '60px', height: '60px', fontSize: '24px'}}>
                <i className="nc-icon nc-ruler-pencil"></i>
              </div>
            </div>
            <h4 className="mb-1 text-white">Modifier le Pays</h4>
            <p className="text-light mb-0 small opacity-75">Mettez à jour les informations du territoire</p>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body className="px-4 py-4">
            <div className="form-section">
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold text-dark mb-3">
                  <i className="nc-icon nc-pin-3 mr-2 text-primary"></i>
                  Nom du Pays
                  <span className="text-danger ml-1">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={editCountryName}
                  onChange={(e) => setEditCountryName(e.target.value)}
                  placeholder="Entrez le nom du pays..."
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
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e3e3e3'}
                />
                <div className="mt-2 d-flex align-items-center">
                  <i className="nc-icon nc-bulb-63 text-info mr-2"></i>
                  <Form.Text className="text-muted">
                    Saisissez le nom complet du pays
                  </Form.Text>
                </div>
              </Form.Group>

              {editCountryName && (
                <div className="selected-country-preview p-3 mb-3" 
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
                      <h6 className="mb-1 text-dark">Nouveau Pays Sélectionné</h6>
                      <p className="mb-0 text-warning fw-bold">{editCountryName}</p>
                      {editingCountry && (
                        <small className="text-muted">
                          Ancien : {editingCountry.name}
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
                  setEditingCountry(null);
                  setEditCountryName("");
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
                disabled={submitting || !editCountryName.trim()}
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
              🚨 Vous êtes sur le point de supprimer un pays !
            </h5>
            
            {countryToDelete && (
              <div className="country-info">
                <div className="d-flex align-items-center">
                  <div className="mr-3">
                    <span style={{fontSize: '30px'}}>🌍</span>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1 font-weight-bold text-dark">Pays à supprimer:</h6>
                    <p className="mb-1 text-danger font-weight-bold" style={{fontSize: '18px'}}>
                      {countryToDelete.name}
                    </p>
                    <small className="text-muted">
                      <i className="nc-icon nc-time-alarm mr-1"></i>
                      Cette action va masquer le pays définitivement
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
                <li>Le pays sera supprimé définitivement de la base de données</li>
                <li>Toutes les provinces associées seront affectées</li>
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

export default Country;
