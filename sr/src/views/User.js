import React, { useState, useEffect } from "react";
import { 
  Card, Container, Row, Col, Button, Form, 
  Alert, Table, Badge, Dropdown, Modal, Pagination, InputGroup
} from "react-bootstrap";
import { userService, territoryService } from "../services/apiServices";
import { usePageViewLogger, useCrudLogger, useFormLogger, useSearchLogger } from "../hooks/useActivityLogger";
import { v4 as uuidv4 } from 'uuid';
import "../assets/css/user-management.css";

function User() {
  // Activity logging hooks
  usePageViewLogger('User Management', { 
    description: 'User accessed the User Management page to manage system users' 
  });
  const { logCreate, logUpdate, logDelete } = useCrudLogger();
  const { logFormSubmit, logFormValidationError } = useFormLogger('user_management');
  const { logSearch } = useSearchLogger();
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Pagination states - Backend pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    title: '',
    password: '',
    confirm_password: '',
    role: '',
    permission: '',
    image: '',
    status: false,
    country_uuid: '',
    province_uuid: '',
    area_uuid: ''
  });

  const [errors, setErrors] = useState({});
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  const titleOptions = [
    { value: 'Support', label: 'Support' },
    { value: 'manager', label: 'Manager' },
    { value: 'Supervisor', label: 'Superviseur' },
    { value: 'hostesse', label: 'Hôtesse' }
  ];

  const permissionOptions = [
    { value: 'ALL', label: 'Tout => "Voir Ajouter Modifier Supprimer"' },
    { value: 'VAE', label: 'VAE => "Voir Ajouter Modifier"' },
    { value: 'VED', label: 'VED => "Voir Modifier Supprimer"' },
    { value: 'VE', label: 'VE => "Voir Modifier"' },
    { value: 'VA', label: 'VA => "Voir Ajouter"' },
    { value: 'V', label: 'V => "Voir"' }
  ];

  useEffect(() => {
    fetchUsers(1, ''); // Load first page with no search on component mount
    fetchCountries();
  }, []);

  useEffect(() => {
    if (formData.country_uuid) {
      fetchProvinces(formData.country_uuid);
    }
  }, [formData.country_uuid]);

  useEffect(() => {
    if (formData.province_uuid) {
      fetchAreas(formData.province_uuid);
    }
  }, [formData.province_uuid]);

  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await userService.getAllPaginated(page, usersPerPage, search);
      const usersData = response.data || [];
      const pagination = response.pagination || {};
      
      setUsers(usersData);
      setFilteredUsers(usersData);
      setTotalUsers(pagination.total_records || 0);
      setTotalPages(pagination.total_pages || 0);
      setCurrentPage(pagination.current_page || 1);
    } catch (error) {
      showAlert('Erreur lors de la récupération des utilisateurs', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await territoryService.countries.getAll();
      setCountries(response.data || []);
    } catch (error) {
      showAlert('Erreur lors de la récupération des pays', 'danger');
    }
  };

  const fetchProvinces = async (countryUuid) => {
    try {
      const response = await territoryService.provinces.getByCountry(countryUuid);
      setProvinces(response.data || []);
      // Reset province and area when country changes
      setFormData(prev => ({ ...prev, province_uuid: '', area_uuid: '' }));
      setAreas([]);
    } catch (error) {
      showAlert('Erreur lors de la récupération des provinces', 'danger');
    }
  };

  const fetchAreas = async (provinceUuid) => {
    try {
      const response = await territoryService.areas.getByProvince(provinceUuid);
      setAreas(response.data || []);
      // Reset area when province changes
      setFormData(prev => ({ ...prev, area_uuid: '' }));
    } catch (error) {
      showAlert('Erreur lors de la récupération des Areas', 'danger');
    }
  };

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: '' }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // Auto-set role based on title
      ...(name === 'title' && { role: value })
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (error) {
      showAlert('Erreur lors de l\'accès à la caméra. Veuillez autoriser l\'accès ou vérifier que votre caméra fonctionne.', 'danger');
    }
  };

  const capturePhoto = () => {
    if (cameraStream) {
      const video = document.getElementById('camera-video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        setSelectedImage(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }, 'image/jpeg', 0.8);
      
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullname.trim()) newErrors.fullname = 'Le nom complet est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';
    if (!formData.title) newErrors.title = 'Le titre est requis';
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (!formData.confirm_password) newErrors.confirm_password = 'La confirmation du mot de passe est requise';
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Les mots de passe ne correspondent pas';
    }
    if (!formData.permission) newErrors.permission = 'La permission est requise';
    
    // Location fields are now optional - no validation required
    // if (!formData.country_uuid) newErrors.country_uuid = 'Le pays est requis';
    // if (!formData.province_uuid) newErrors.province_uuid = 'La province est requise';
    // if (!formData.area_uuid) newErrors.area_uuid = 'La Area est requise';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Phone validation
    if (formData.phone) {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 8) {
        newErrors.phone = 'Le numéro de téléphone doit contenir au moins 8 chiffres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setErrors({});
    
    if (!validateForm()) {
      showAlert('Veuillez corriger les erreurs dans le formulaire', 'danger');
      // Scroll to first error field
      const firstErrorField = document.querySelector('.is-invalid');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
      return;
    }

    try {
      setLoading(true);

      // Validate phone number format
      const phoneNumber = formData.phone.replace(/\D/g, ''); // Remove non-digits
      if (phoneNumber.length < 8) {
        setErrors(prev => ({ ...prev, phone: 'Le numéro de téléphone doit contenir au moins 8 chiffres' }));
        showAlert('Numéro de téléphone invalide', 'danger');
        setLoading(false);
        return;
      }

      // Check for duplicate email before submitting
      if (users.some(user => user.email.toLowerCase() === formData.email.toLowerCase())) {
        setErrors(prev => ({ ...prev, email: 'Cette adresse email est déjà utilisée' }));
        showAlert('Cette adresse email est déjà utilisée par un autre utilisateur', 'danger');
        setLoading(false);
        return;
      }

      // Prepare user data
      const userData = {
        uuid: uuidv4(),
        fullname: formData.fullname.trim(),
        email: formData.email.toLowerCase().trim(),
        Phone: phoneNumber, // Keep phone as string
        title: formData.title,
        password: formData.password,
        confirm_password: formData.confirm_password,
        role: formData.role || formData.title, // Fallback to title if role not set
        permission: formData.permission,
        profile_image: selectedImage ? 'base64-image-data' : '', // You'll need to implement image upload
        status: formData.status,
        country_uuid: formData.country_uuid || null,
        province_uuid: formData.province_uuid || null,
        area_uuid: formData.area_uuid || null,
        signature: `${formData.fullname.trim()} - ${new Date().toLocaleDateString()}`
      };

      const response = await userService.create(userData);
      
      if (response && response.success !== false) {
        // Log successful user creation
        logCreate('user', userData.fullname, userData.uuid);
        logFormSubmit('create_user', userData);
        
        showAlert('Utilisateur créé avec succès!', 'success');
        setShowModal(false);
        resetForm();
        await fetchUsers(currentPage, searchTerm); // Refresh the user list
      } else {
        // Handle API response indicating failure
        const errorMessage = response?.message || response?.error || 'Erreur inconnue lors de la création';
        logFormValidationError({ general: errorMessage });
        showAlert(`Erreur lors de la création: ${errorMessage}`, 'danger');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle different types of errors
      let errorMessage = 'Erreur lors de la création de l\'utilisateur';
      
      if (error.response) {
        // Server responded with error status
        const statusCode = error.response.status;
        const responseData = error.response.data;
        
        switch (statusCode) {
          case 400:
            errorMessage = responseData?.message || 'Données invalides. Veuillez vérifier les informations saisies.';
            break;
          case 401:
            errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
            break;
          case 403:
            errorMessage = 'Vous n\'avez pas les permissions nécessaires pour créer un utilisateur.';
            break;
          case 409:
            errorMessage = 'Un utilisateur avec cette adresse email existe déjà.';
            if (responseData?.field === 'email') {
              setErrors(prev => ({ ...prev, email: 'Cette adresse email est déjà utilisée' }));
            }
            break;
          case 422:
            errorMessage = 'Données de validation incorrectes.';
            if (responseData?.errors) {
              // Handle field-specific validation errors
              const fieldErrors = {};
              Object.keys(responseData.errors).forEach(field => {
                fieldErrors[field] = responseData.errors[field][0]; // Get first error message
              });
              setErrors(fieldErrors);
            }
            break;
          case 500:
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            break;
          default:
            errorMessage = responseData?.message || `Erreur ${statusCode}: ${error.message}`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
      } else {
        // Other error
        errorMessage = error.message || 'Erreur inattendue lors de la création de l\'utilisateur.';
      }
      
      showAlert(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setErrors({});
    
    if (!validateEditForm()) {
      showAlert('Veuillez corriger les erreurs dans le formulaire', 'danger');
      // Scroll to first error field
      const firstErrorField = document.querySelector('.is-invalid');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
      return;
    }

    try {
      setLoading(true);

      // Validate phone number format
      const phoneNumber = formData.phone.replace(/\D/g, ''); // Remove non-digits
      if (phoneNumber.length < 8) {
        setErrors(prev => ({ ...prev, phone: 'Le numéro de téléphone doit contenir au moins 8 chiffres' }));
        showAlert('Numéro de téléphone invalide', 'danger');
        setLoading(false);
        return;
      }

      // Prepare user update data
      const updateData = {
        fullname: formData.fullname.trim(),
        email: formData.email.toLowerCase().trim(),
        Phone: phoneNumber, // Keep phone as string
        title: formData.title,
        role: formData.role || formData.title,
        permission: formData.permission,
        status: formData.status,
        country_uuid: formData.country_uuid || null,
        province_uuid: formData.province_uuid || null,
        area_uuid: formData.area_uuid || null,
        signature: `${formData.fullname.trim()} - ${new Date().toLocaleDateString()}`
      };

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
        updateData.confirm_password = formData.confirm_password;
      }

      // Only include image if changed
      if (selectedImage) {
        updateData.profile_image = 'base64-image-data'; // You'll need to implement image upload
      }

      const response = await userService.update(editingUser.uuid || editingUser.id, updateData);
      
      if (response && response.success !== false) {
        showAlert('Utilisateur modifié avec succès!', 'success');
        setShowEditModal(false);
        resetForm();
        await fetchUsers(currentPage, searchTerm); // Refresh the user list
      } else {
        // Handle API response indicating failure
        const errorMessage = response?.message || response?.error || 'Erreur inconnue lors de la modification';
        showAlert(`Erreur lors de la modification: ${errorMessage}`, 'danger');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      
      // Handle different types of errors
      let errorMessage = 'Erreur lors de la modification de l\'utilisateur';
      
      if (error.response) {
        // Server responded with error status
        const statusCode = error.response.status;
        const responseData = error.response.data;
        
        switch (statusCode) {
          case 400:
            errorMessage = responseData?.message || 'Données invalides. Veuillez vérifier les informations saisies.';
            break;
          case 401:
            errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
            break;
          case 403:
            errorMessage = 'Vous n\'avez pas les permissions nécessaires pour modifier cet utilisateur.';
            break;
          case 404:
            errorMessage = 'Utilisateur non trouvé. Il a peut-être été supprimé par un autre utilisateur.';
            break;
          case 409:
            errorMessage = 'Un autre utilisateur avec cette adresse email existe déjà.';
            if (responseData?.field === 'email') {
              setErrors(prev => ({ ...prev, email: 'Cette adresse email est déjà utilisée' }));
            }
            break;
          case 422:
            errorMessage = 'Données de validation incorrectes.';
            if (responseData?.errors) {
              // Handle field-specific validation errors
              const fieldErrors = {};
              Object.keys(responseData.errors).forEach(field => {
                fieldErrors[field] = responseData.errors[field][0]; // Get first error message
              });
              setErrors(fieldErrors);
            }
            break;
          case 500:
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            break;
          default:
            errorMessage = responseData?.message || `Erreur ${statusCode}: ${error.message}`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
      } else {
        // Other error
        errorMessage = error.message || 'Erreur inattendue lors de la modification de l\'utilisateur.';
      }
      
      showAlert(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const validateEditForm = () => {
    const newErrors = {};

    if (!formData.fullname.trim()) newErrors.fullname = 'Le nom complet est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';
    if (!formData.title) newErrors.title = 'Le titre est requis';
    
    // Password validation only if password is provided
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
      }
      if (!formData.confirm_password) {
        newErrors.confirm_password = 'La confirmation du mot de passe est requise';
      } else if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Les mots de passe ne correspondent pas';
      }
    }
    
    if (!formData.permission) newErrors.permission = 'La permission est requise';
    
    // Location fields are now optional - no validation required
    // if (!formData.country_uuid) newErrors.country_uuid = 'Le pays est requis';
    // if (!formData.province_uuid) newErrors.province_uuid = 'La province est requise';
    // if (!formData.area_uuid) newErrors.area_uuid = 'La Area est requise';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Phone validation
    if (formData.phone) {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 8) {
        newErrors.phone = 'Le numéro de téléphone doit contenir au moins 8 chiffres';
      }
    }

    // Check for duplicate email (excluding current user)
    if (editingUser && formData.email) {
      const duplicateUser = users.find(user => 
        user.email.toLowerCase() === formData.email.toLowerCase() && 
        (user.uuid || user.id) !== (editingUser.uuid || editingUser.id)
      );
      if (duplicateUser) {
        newErrors.email = 'Cette adresse email est déjà utilisée par un autre utilisateur';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      fullname: '',
      email: '',
      phone: '',
      title: '',
      password: '',
      confirm_password: '',
      role: '',
      permission: '',
      image: '',
      status: false,
      country_uuid: '',
      province_uuid: '',
      area_uuid: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
    setErrors({});
    setEditingUser(null);
    setUserToDelete(null);
    setDeleteConfirmText('');
    stopCamera();
  };

  const handleModalClose = () => {
    setShowModal(false);
    resetForm();
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    resetForm();
  };

  // Search functionality - Backend search
  const handleSearch = async (searchValue) => {
    setSearchTerm(searchValue);
    setCurrentPage(1); // Reset to first page when searching
    
    // Log search activity if there's a search term
    if (searchValue.trim()) {
      logSearch(searchValue.trim(), 'users', totalUsers);
    }
    
    await fetchUsers(1, searchValue.trim());
  };

  // Backend pagination - users are already paginated from API
  const currentUsers = filteredUsers;

  const handlePageChange = async (pageNumber) => {
    setCurrentPage(pageNumber);
    await fetchUsers(pageNumber, searchTerm);
  };

  // Action handlers
  const handleView = (user) => {
    // Implement view functionality
    console.log('View user:', user);
    showAlert(`Affichage de ${user.fullname}`, 'info');
  };

  const handleEdit = async (user) => {
    try {
      setEditingUser(user);
      
      // Populate form data with user information
      setFormData({
        fullname: user.fullname || '',
        email: user.email || '',
        phone: user.phone?.toString() || '',
        title: user.title || '',
        password: '', // Don't pre-fill password for security
        confirm_password: '',
        role: user.role || user.title || '',
        permission: user.permission || '',
        image: user.profile_image || '',
        status: user.status || false,
        country_uuid: user.country_uuid || '',
        province_uuid: user.province_uuid || '',
        area_uuid: user.area_uuid || ''
      });

      // If user has country, fetch provinces
      if (user.country_uuid) {
        await fetchProvinces(user.country_uuid);
      }
      
      // If user has province, fetch areas
      if (user.province_uuid) {
        await fetchAreas(user.province_uuid);
      }

      // Set image preview if user has profile image
      if (user.profile_image) {
        setImagePreview(user.profile_image);
      }

      setShowEditModal(true);
    } catch (error) {
      showAlert('Erreur lors du chargement des données utilisateur', 'danger');
    }
  };

  const handleDelete = (user) => {
    // Show delete confirmation modal
    setUserToDelete(user);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteConfirmText !== "SUPPRIMER") {
      showAlert('Vous devez taper "SUPPRIMER" pour confirmer la suppression.', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      // Call the delete API
      await userService.delete(userToDelete.uuid || userToDelete.id);
      
      showAlert(`L'utilisateur "${userToDelete.fullname}" a été supprimé avec succès`, 'success');
      
      // Refetch data for current page
      await fetchUsers(currentPage, searchTerm);

      // Close modal
      setShowDeleteModal(false);
      setUserToDelete(null);
      setDeleteConfirmText('');
    } catch (error) {
      showAlert(`Erreur lors de la suppression de l'utilisateur: ${error.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
    setDeleteConfirmText('');
  };

  return (
    <>
      {/* Fixed Alert in Top Right Corner */}
      {alert.show && (
        <div className="alert-container-top-right">
          <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false, message: '', variant: '' })}>
            <div className="d-flex align-items-center">
              <i className={`fas ${alert.variant === 'success' ? 'fa-check-circle' : alert.variant === 'danger' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2`}></i>
              {alert.message}
            </div>
          </Alert>
        </div>
      )}
      
      <Container fluid>        
        <Row>
          <Col md="12">
            <Card className="strpied-tabled-with-hover">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Card.Title as="h4">Gestion des Utilisateurs</Card.Title>
                    <p className="card-category">
                      Ici vous pouvez gérer tous les utilisateurs du système
                    </p>
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowModal(true)}
                    disabled={loading}
                  >
                    <i className="fa fa-plus"></i> Ajouter Utilisateur
                  </Button>
                </div>
                
                {/* Search Bar */}
                <div className="mt-3">
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="fas fa-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Rechercher par nom complet, email, téléphone, titre, permission, pays, province, area..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                    {searchTerm && (
                      <Button 
                        variant="outline-secondary"
                        onClick={() => handleSearch('')}
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    )}
                  </InputGroup>
                </div>

                {/* Results Info */}
                <div className="mt-2">
                  <small className="text-muted">
                    {totalUsers > 0 ? (
                      <>
                        Affichage de {((currentPage - 1) * usersPerPage) + 1} à {Math.min(currentPage * usersPerPage, totalUsers)} sur {totalUsers} utilisateur(s)
                        {searchTerm && ` (filtré sur "${searchTerm}")`}
                      </>
                    ) : (
                      'Aucun utilisateur trouvé'
                    )}
                  </small>
                </div>
              </Card.Header>
              <Card.Body className="table-full-width table-responsive px-0">
                {loading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                      <span className="sr-only">Chargement...</span>
                    </div>
                  </div>
                ) : (
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Nom Complet</th>
                        <th>Email</th>
                        <th>Téléphone</th>
                        <th>Titre</th>
                        <th>Permission</th>
                        <th>Pays</th>
                        <th>Province</th>
                        <th>Area</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.length > 0 ? currentUsers.map((user, idx) => (
                        <tr key={user.uuid ? user.uuid : user.id ? user.id : idx}>
                          <td>{user.fullname}</td>
                          <td>{user.email}</td>
                          <td>{user.phone}</td>
                          <td>{user.title}</td>
                          <td>
                            <Badge bg={user.permission === 'ALL' ? 'success' : 'info'}>
                              {user.permission}
                            </Badge>
                          </td>
                          <td>{user.country?.name || 'N/A'}</td>
                          <td>{user.province?.name || 'N/A'}</td>
                          <td>{user.area?.name || 'N/A'}</td>
                          <td>
                            <Badge bg={user.status ? 'success' : 'secondary'}>
                              {user.status ? 'Actif' : 'Inactif'}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleView(user)}
                                title="Voir"
                              >
                                <i className="fas fa-eye" style={{color: '#ff9500'}}></i>
                              </Button>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEdit(user)}
                                title="Modifier"
                              >
                                <i className="fas fa-edit" style={{color: '#007bff'}}></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(user)}
                                title="Supprimer"
                              >
                                <i className="fas fa-trash" style={{color: '#dc3545'}}></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="10" className="text-center">
                            {searchTerm ? 'Aucun utilisateur trouvé pour cette recherche' : 'Aucun utilisateur trouvé'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
              
              {/* Arrow-based Pagination (from UserLogs) */}
              {totalPages > 1 && (
                <Card.Footer>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="user-logs-summary">
                      Page {currentPage} of {totalPages} • Showing {users.length > 0 ? ((currentPage - 1) * usersPerPage + 1) : 0} to{' '}
                      {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
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
                </Card.Footer>
              )}
            </Card>
          </Col>
        </Row>

        {/* Enhanced Add User Modal with Modern Design */}
        <Modal 
          show={showModal} 
          onHide={handleModalClose}
          size="xl"
          backdrop="static"
          className="modern-user-modal"
          centered
        >
          <div className="modal-glass-overlay">
            <Modal.Header className="modern-modal-header">
              <div className="modal-header-content">
                <div className="header-icon-wrapper">
                  <div className="header-icon">
                    <i className="fas fa-user-plus"></i>
                  </div>
                </div>
                <div className="header-text">
                  <Modal.Title className="modern-modal-title">
                    Créer un Nouvel Utilisateur
                  </Modal.Title>
                  <p className="modal-subtitle">
                    Ajoutez un nouveau membre à votre équipe TeamOnSite
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="modern-close-btn"
                onClick={handleModalClose}
                disabled={loading}
              >
                <i className="fas fa-times"></i>
              </button>
            </Modal.Header>

            <Form onSubmit={handleSubmit}>
              <Modal.Body className="modern-modal-body">
                <div className="form-progress-indicator">
                  <div className="progress-step active">
                    <span className="step-number">1</span>
                    <span className="step-label">Informations Personnelles</span>
                  </div>
                  <div className="progress-line"></div>
                  <div className="progress-step">
                    <span className="step-number">2</span>
                    <span className="step-label">Accès & Permissions</span>
                  </div>
                  <div className="progress-line"></div>
                  <div className="progress-step">
                    <span className="step-number">3</span>
                    <span className="step-label">Localisation</span>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="form-section active-section">
                  <div className="section-header">
                    <div className="section-icon">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="section-title">
                      <h4>Informations Personnelles</h4>
                      <p>Détails de base du nouvel utilisateur</p>
                    </div>
                  </div>

                  <Row className="modern-form-row">
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-id-card label-icon"></i>
                          Nom Complet <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            type="text"
                            name="fullname"
                            value={formData.fullname}
                            onChange={handleInputChange}
                            isInvalid={!!errors.fullname}
                            placeholder="Jean Dupont"
                            className="modern-input"
                          />
                          <div className="input-focus-line"></div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.fullname}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-envelope label-icon"></i>
                          Email <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            isInvalid={!!errors.email}
                            placeholder="jean.dupont@teamonsite.com"
                            className="modern-input"
                          />
                          <div className="input-focus-line"></div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.email}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  </Row>

                  <Row className="modern-form-row">
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-phone label-icon"></i>
                          Téléphone <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            isInvalid={!!errors.phone}
                            placeholder="+33 1 23 45 67 89"
                            className="modern-input"
                          />
                          <div className="input-focus-line"></div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.phone}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-briefcase label-icon"></i>
                          Titre <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            as="select"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            isInvalid={!!errors.title}
                            className="modern-select"
                          >
                            <option value="">Choisir un titre...</option>
                            {titleOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Form.Control>
                          <div className="select-arrow">
                            <i className="fas fa-chevron-down"></i>
                          </div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.title}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  </Row>

                  <Row className="modern-form-row">
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-camera label-icon"></i>
                          Photo de Profil
                        </label>
                        <div className="image-upload-container">
                          <div className="image-upload-area">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="image-input"
                              id="profile-image"
                            />
                            <label htmlFor="profile-image" className="image-upload-label">
                              {imagePreview ? (
                                <div className="image-preview-container">
                                  <img 
                                    src={imagePreview} 
                                    alt="Aperçu" 
                                    className="image-preview"
                                  />
                                  <div className="image-overlay">
                                    <i className="fas fa-image"></i>
                                    <span>Changer la photo</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="image-placeholder">
                                  <i className="fas fa-user-circle"></i>
                                  <span>Choisir depuis l'appareil</span>
                                  <small>PNG, JPG jusqu'à 5MB</small>
                                </div>
                              )}
                            </label>
                          </div>
                          
                          <div className="camera-actions">
                            <button
                              type="button"
                              className="camera-btn"
                              onClick={startCamera}
                            >
                              <i className="fas fa-camera"></i>
                              Prendre une photo
                            </button>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-toggle-on label-icon"></i>
                          Statut du Compte
                        </label>
                        <div className="status-toggle-container">
                          <div 
                            className={`status-toggle ${formData.status ? 'active' : 'inactive'}`}
                            onClick={() => setFormData(prev => ({ ...prev, status: !prev.status }))}
                          >
                            <div className="toggle-slider">
                              <span className="toggle-text">
                                {formData.status ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                          </div>
                          <p className="status-description">
                            {formData.status ? 
                              'L\'utilisateur peut se connecter et accéder au système' : 
                              'L\'utilisateur ne peut pas se connecter'
                            }
                          </p>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Security Section */}
                <div className="form-section">
                  <div className="section-header">
                    <div className="section-icon">
                      <i className="fas fa-shield-alt"></i>
                    </div>
                    <div className="section-title">
                      <h4>Accès & Sécurité</h4>
                      <p>Configuration des accès et permissions</p>
                    </div>
                  </div>

                  <Row className="modern-form-row">
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-lock label-icon"></i>
                          Mot de Passe <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            isInvalid={!!errors.password}
                            placeholder="Mot de passe sécurisé"
                            className="modern-input"
                          />
                          <div className="input-focus-line"></div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.password}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-lock label-icon"></i>
                          Confirmer le Mot de Passe <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            type="password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleInputChange}
                            isInvalid={!!errors.confirm_password}
                            placeholder="Répéter le mot de passe"
                            className="modern-input"
                          />
                          <div className="input-focus-line"></div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.confirm_password}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  </Row>

                  <Row className="modern-form-row">
                    <Col lg={12} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-user-shield label-icon"></i>
                          Niveau de Permission <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            as="select"
                            name="permission"
                            value={formData.permission}
                            onChange={handleInputChange}
                            isInvalid={!!errors.permission}
                            className="modern-select"
                          >
                            <option value="">Choisir un niveau de permission...</option>
                            {permissionOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Form.Control>
                          <div className="select-arrow">
                            <i className="fas fa-chevron-down"></i>
                          </div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.permission}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Location Section */}
                <div className="form-section">
                  <div className="section-header">
                    <div className="section-icon">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div className="section-title">
                      <h4>Localisation & Affectation <small className="text-muted">(Optionnel)</small></h4>
                      <p>Zone géographique de responsabilité</p>
                    </div>
                  </div>

                  <Row className="modern-form-row">
                    <Col lg={4} md={6}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-globe label-icon"></i>
                          Pays <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            as="select"
                            name="country_uuid"
                            value={formData.country_uuid}
                            onChange={handleInputChange}
                            isInvalid={!!errors.country_uuid}
                            disabled={countries.length === 0}
                            className="modern-select"
                          >
                            <option value="">
                              {countries.length === 0 ? "Aucun pays disponible" : "Sélectionner un pays..."}
                            </option>
                            {countries.map(country => (
                              <option key={country.uuid} value={country.uuid}>
                                {country.name}
                              </option>
                            ))}
                          </Form.Control>
                          <div className="select-arrow">
                            <i className="fas fa-chevron-down"></i>
                          </div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.country_uuid}
                        </Form.Control.Feedback>
                        {countries.length === 0 && (
                          <small className="text-warning">
                            <i className="fas fa-exclamation-triangle"></i>
                            Aucun pays trouvé dans la base de données
                          </small>
                        )}
                      </div>
                    </Col>
                    <Col lg={4} md={6}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-map label-icon"></i>
                          Province <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            as="select"
                            name="province_uuid"
                            value={formData.province_uuid}
                            onChange={handleInputChange}
                            isInvalid={!!errors.province_uuid}
                            disabled={!formData.country_uuid}
                            className="modern-select"
                          >
                            <option value="">Sélectionner une province...</option>
                            {provinces.map(province => (
                              <option key={province.uuid} value={province.uuid}>
                                {province.name}
                              </option>
                            ))}
                          </Form.Control>
                          <div className="select-arrow">
                            <i className="fas fa-chevron-down"></i>
                          </div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.province_uuid}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                    <Col lg={4} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-map-pin label-icon"></i>
                          Zone (Area) <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            as="select"
                            name="area_uuid"
                            value={formData.area_uuid}
                            onChange={handleInputChange}
                            isInvalid={!!errors.area_uuid}
                            disabled={!formData.province_uuid}
                            className="modern-select"
                          >
                            <option value="">Sélectionner une zone...</option>
                            {areas.map(area => (
                              <option key={area.uuid} value={area.uuid}>
                                {area.name}
                              </option>
                            ))}
                          </Form.Control>
                          <div className="select-arrow">
                            <i className="fas fa-chevron-down"></i>
                          </div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.area_uuid}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  </Row>

                  {/* Location Preview */}
                  {formData.country_uuid && (
                    <div className="location-preview">
                      <div className="preview-header">
                        <i className="fas fa-eye"></i>
                        <span>Aperçu de l'affectation</span>
                      </div>
                      <div className="location-breadcrumb">
                        <span className="breadcrumb-item">
                          <i className="fas fa-globe"></i>
                          {countries.find(c => c.uuid === formData.country_uuid)?.name || 'Pays'}
                        </span>
                        {formData.province_uuid && (
                          <>
                            <i className="fas fa-chevron-right breadcrumb-separator"></i>
                            <span className="breadcrumb-item">
                              <i className="fas fa-map"></i>
                              {provinces.find(p => p.uuid === formData.province_uuid)?.name || 'Province'}
                            </span>
                          </>
                        )}
                        {formData.area_uuid && (
                          <>
                            <i className="fas fa-chevron-right breadcrumb-separator"></i>
                            <span className="breadcrumb-item">
                              <i className="fas fa-map-pin"></i>
                              {areas.find(a => a.uuid === formData.area_uuid)?.name || 'Zone'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Modal.Body>

              <Modal.Footer className="modern-modal-footer">
                <div className="footer-actions">
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleModalClose} 
                    disabled={loading}
                    className="modern-btn-cancel"
                  >
                    <i className="fas fa-times"></i>
                    Annuler
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading}
                    className="modern-btn-submit"
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus"></i>
                        Créer l'Utilisateur
                      </>
                    )}
                  </Button>
                </div>
              </Modal.Footer>
            </Form>
          </div>
        </Modal>

        {/* Edit User Modal */}
        <Modal 
          show={showEditModal} 
          onHide={handleEditModalClose}
          size="xl"
          backdrop="static"
          className="modern-user-modal"
          centered
        >
          <div className="modal-glass-overlay">
            <Modal.Header className="modern-modal-header">
              <div className="modal-header-content">
                <div className="header-icon-wrapper">
                  <div className="header-icon" style={{backgroundColor: '#ffc107'}}>
                    <i className="fas fa-user-edit"></i>
                  </div>
                </div>
                <div className="header-text">
                  <Modal.Title className="modern-modal-title">
                    Modifier l'Utilisateur
                  </Modal.Title>
                  <p className="modal-subtitle">
                    Mettre à jour les informations de {editingUser?.fullname}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="modern-close-btn"
                onClick={handleEditModalClose}
                disabled={loading}
              >
                <i className="fas fa-times"></i>
              </button>
            </Modal.Header>

            <Form onSubmit={handleEditSubmit}>
              <Modal.Body className="modern-modal-body">
                <div className="form-progress-indicator">
                  <div className="progress-step active">
                    <span className="step-number">1</span>
                    <span className="step-label">Informations Personnelles</span>
                  </div>
                  <div className="progress-line"></div>
                  <div className="progress-step">
                    <span className="step-number">2</span>
                    <span className="step-label">Accès & Permissions</span>
                  </div>
                  <div className="progress-line"></div>
                  <div className="progress-step">
                    <span className="step-number">3</span>
                    <span className="step-label">Localisation</span>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="form-section active-section">
                  <div className="section-header">
                    <div className="section-icon">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="section-title">
                      <h4>Informations Personnelles</h4>
                      <p>Modifier les détails de l'utilisateur</p>
                    </div>
                  </div>

                  <Row className="modern-form-row">
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-id-card label-icon"></i>
                          Nom Complet <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            type="text"
                            name="fullname"
                            value={formData.fullname}
                            onChange={handleInputChange}
                            isInvalid={!!errors.fullname}
                            placeholder="Jean Dupont"
                            className="modern-input"
                          />
                          <div className="input-focus-line"></div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.fullname}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-envelope label-icon"></i>
                          Email <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            isInvalid={!!errors.email}
                            placeholder="jean.dupont@teamonsite.com"
                            className="modern-input"
                          />
                          <div className="input-focus-line"></div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.email}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  </Row>

                  <Row className="modern-form-row">
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-phone label-icon"></i>
                          Téléphone <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            isInvalid={!!errors.phone}
                            placeholder="+33 1 23 45 67 89"
                            className="modern-input"
                          />
                          <div className="input-focus-line"></div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.phone}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-briefcase label-icon"></i>
                          Titre <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            as="select"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            isInvalid={!!errors.title}
                            className="modern-select"
                          >
                            <option value="">Choisir un titre...</option>
                            {titleOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Form.Control>
                          <div className="select-arrow">
                            <i className="fas fa-chevron-down"></i>
                          </div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.title}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  </Row>

                  <Row className="modern-form-row">
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-camera label-icon"></i>
                          Photo de Profil
                        </label>
                        <div className="image-upload-container">
                          <div className="image-upload-area">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="image-input"
                              id="edit-profile-image"
                            />
                            <label htmlFor="edit-profile-image" className="image-upload-label">
                              {imagePreview ? (
                                <div className="image-preview-container">
                                  <img 
                                    src={imagePreview} 
                                    alt="Aperçu" 
                                    className="image-preview"
                                  />
                                  <div className="image-overlay">
                                    <i className="fas fa-image"></i>
                                    <span>Changer la photo</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="image-placeholder">
                                  <i className="fas fa-user-circle"></i>
                                  <span>Choisir depuis l'appareil</span>
                                  <small>PNG, JPG jusqu'à 5MB</small>
                                </div>
                              )}
                            </label>
                          </div>
                          
                          <div className="camera-actions">
                            <button
                              type="button"
                              className="camera-btn"
                              onClick={startCamera}
                            >
                              <i className="fas fa-camera"></i>
                              Prendre une photo
                            </button>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-toggle-on label-icon"></i>
                          Statut du Compte
                        </label>
                        <div className="status-toggle-container">
                          <div 
                            className={`status-toggle ${formData.status ? 'active' : 'inactive'}`}
                            onClick={() => setFormData(prev => ({ ...prev, status: !prev.status }))}
                          >
                            <div className="toggle-slider">
                              <span className="toggle-text">
                                {formData.status ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                          </div>
                          <p className="status-description">
                            {formData.status ? 
                              'L\'utilisateur peut se connecter et accéder au système' : 
                              'L\'utilisateur ne peut pas se connecter'
                            }
                          </p>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Security Section */}
                <div className="form-section">
                  <div className="section-header">
                    <div className="section-icon">
                      <i className="fas fa-shield-alt"></i>
                    </div>
                    <div className="section-title">
                      <h4>Accès & Sécurité</h4>
                      <p>Modifier les accès et permissions (laisser vide pour ne pas changer le mot de passe)</p>
                    </div>
                  </div>

                  <Row className="modern-form-row">
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-lock label-icon"></i>
                          Nouveau Mot de Passe <span className="text-muted">(optionnel)</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            isInvalid={!!errors.password}
                            placeholder="Laisser vide pour ne pas modifier"
                            className="modern-input"
                          />
                          <div className="input-focus-line"></div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.password}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                    <Col lg={6} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-lock label-icon"></i>
                          Confirmer le Nouveau Mot de Passe
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            type="password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleInputChange}
                            isInvalid={!!errors.confirm_password}
                            placeholder="Confirmer le nouveau mot de passe"
                            className="modern-input"
                            disabled={!formData.password}
                          />
                          <div className="input-focus-line"></div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.confirm_password}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  </Row>

                  <Row className="modern-form-row">
                    <Col lg={12} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-user-shield label-icon"></i>
                          Niveau de Permission <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            as="select"
                            name="permission"
                            value={formData.permission}
                            onChange={handleInputChange}
                            isInvalid={!!errors.permission}
                            className="modern-select"
                          >
                            <option value="">Choisir un niveau de permission...</option>
                            {permissionOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Form.Control>
                          <div className="select-arrow">
                            <i className="fas fa-chevron-down"></i>
                          </div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.permission}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Location Section */}
                <div className="form-section">
                  <div className="section-header">
                    <div className="section-icon">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div className="section-title">
                      <h4>Localisation & Affectation <small className="text-muted">(Optionnel)</small></h4>
                      <p>Modifier la zone géographique de responsabilité</p>
                    </div>
                  </div>

                  <Row className="modern-form-row">
                    <Col lg={4} md={6}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-globe label-icon"></i>
                          Pays <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            as="select"
                            name="country_uuid"
                            value={formData.country_uuid}
                            onChange={handleInputChange}
                            isInvalid={!!errors.country_uuid}
                            disabled={countries.length === 0}
                            className="modern-select"
                          >
                            <option value="">
                              {countries.length === 0 ? "Aucun pays disponible" : "Sélectionner un pays..."}
                            </option>
                            {countries.map(country => (
                              <option key={country.uuid} value={country.uuid}>
                                {country.name}
                              </option>
                            ))}
                          </Form.Control>
                          <div className="select-arrow">
                            <i className="fas fa-chevron-down"></i>
                          </div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.country_uuid}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                    <Col lg={4} md={6}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-map label-icon"></i>
                          Province <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            as="select"
                            name="province_uuid"
                            value={formData.province_uuid}
                            onChange={handleInputChange}
                            isInvalid={!!errors.province_uuid}
                            disabled={!formData.country_uuid}
                            className="modern-select"
                          >
                            <option value="">Sélectionner une province...</option>
                            {provinces.map(province => (
                              <option key={province.uuid} value={province.uuid}>
                                {province.name}
                              </option>
                            ))}
                          </Form.Control>
                          <div className="select-arrow">
                            <i className="fas fa-chevron-down"></i>
                          </div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.province_uuid}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                    <Col lg={4} md={12}>
                      <div className="modern-form-group">
                        <label className="modern-label">
                          <i className="fas fa-map-pin label-icon"></i>
                          Zone (Area) <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <Form.Control
                            as="select"
                            name="area_uuid"
                            value={formData.area_uuid}
                            onChange={handleInputChange}
                            isInvalid={!!errors.area_uuid}
                            disabled={!formData.province_uuid}
                            className="modern-select"
                          >
                            <option value="">Sélectionner une zone...</option>
                            {areas.map(area => (
                              <option key={area.uuid} value={area.uuid}>
                                {area.name}
                              </option>
                            ))}
                          </Form.Control>
                          <div className="select-arrow">
                            <i className="fas fa-chevron-down"></i>
                          </div>
                        </div>
                        <Form.Control.Feedback type="invalid" className="modern-feedback">
                          {errors.area_uuid}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  </Row>

                  {/* Location Preview */}
                  {formData.country_uuid && (
                    <div className="location-preview">
                      <div className="preview-header">
                        <i className="fas fa-eye"></i>
                        <span>Aperçu de l'affectation</span>
                      </div>
                      <div className="location-breadcrumb">
                        <span className="breadcrumb-item">
                          <i className="fas fa-globe"></i>
                          {countries.find(c => c.uuid === formData.country_uuid)?.name || 'Pays'}
                        </span>
                        {formData.province_uuid && (
                          <>
                            <i className="fas fa-chevron-right breadcrumb-separator"></i>
                            <span className="breadcrumb-item">
                              <i className="fas fa-map"></i>
                              {provinces.find(p => p.uuid === formData.province_uuid)?.name || 'Province'}
                            </span>
                          </>
                        )}
                        {formData.area_uuid && (
                          <>
                            <i className="fas fa-chevron-right breadcrumb-separator"></i>
                            <span className="breadcrumb-item">
                              <i className="fas fa-map-pin"></i>
                              {areas.find(a => a.uuid === formData.area_uuid)?.name || 'Zone'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Modal.Body>

              <Modal.Footer className="modern-modal-footer">
                <div className="footer-actions">
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleEditModalClose} 
                    disabled={loading}
                    className="modern-btn-cancel"
                  >
                    <i className="fas fa-times"></i>
                    Annuler
                  </Button>
                  <Button 
                    variant="warning" 
                    type="submit" 
                    disabled={loading}
                    className="modern-btn-submit"
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Modification en cours...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-edit"></i>
                        Modifier l'Utilisateur
                      </>
                    )}
                  </Button>
                </div>
              </Modal.Footer>
            </Form>
          </div>
        </Modal>

        {/* Camera Modal */}
        <Modal 
          show={showCamera} 
          onHide={stopCamera}
          size="lg"
          backdrop="static"
          className="camera-modal"
          centered
        >
          <div className="camera-modal-content">
            <Modal.Header className="camera-modal-header">
              <Modal.Title>
                <i className="fas fa-camera"></i>
                Prendre une Photo
              </Modal.Title>
              <button 
                type="button" 
                className="modern-close-btn"
                onClick={stopCamera}
              >
                <i className="fas fa-times"></i>
              </button>
            </Modal.Header>
            <Modal.Body className="camera-modal-body">
              <div className="camera-container">
                <video
                  id="camera-video"
                  ref={(video) => {
                    if (video && cameraStream) {
                      video.srcObject = cameraStream;
                      video.play();
                    }
                  }}
                  className="camera-video"
                  autoPlay
                  playsInline
                />
                <div className="camera-overlay">
                  <div className="camera-frame"></div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer className="camera-modal-footer">
              <Button 
                variant="outline-secondary" 
                onClick={stopCamera}
                className="camera-cancel-btn"
              >
                <i className="fas fa-times"></i>
                Annuler
              </Button>
              <Button 
                variant="primary" 
                onClick={capturePhoto}
                className="camera-capture-btn"
              >
                <i className="fas fa-camera"></i>
                Capturer
              </Button>
            </Modal.Footer>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal 
          show={showDeleteModal} 
          onHide={cancelDelete}
          size="md"
          backdrop="static"
          className="delete-confirmation-modal"
          centered
        >
          <Modal.Header className="border-0 pb-0">
            <div className="w-100 text-center">
              <div className="delete-icon-wrapper mb-3">
                <i className="fas fa-exclamation-triangle text-danger" style={{fontSize: '3rem'}}></i>
              </div>
              <Modal.Title className="text-danger h4">
                Confirmer la Suppression
              </Modal.Title>
            </div>
          </Modal.Header>

          <Modal.Body className="text-center px-4">
            <div className="mb-4">
              <p className="mb-3">
                Êtes-vous sûr(e) de vouloir supprimer l'utilisateur :
              </p>
              <h5 className="text-primary mb-3">
                <i className="fas fa-user"></i> {userToDelete?.fullname}
              </h5>
              
              <div className="alert alert-warning border-0 mb-4">
                <div className="fw-bold mb-2">
                  <i className="fas fa-exclamation-triangle"></i> Cette action est irréversible !
                </div>
                <small>
                  Cela supprimera définitivement :
                  <ul className="list-unstyled mt-2 mb-0">
                    <li>• Toutes les données de l'utilisateur</li>
                    <li>• Son accès au système</li>
                    <li>• Ses permissions et affectations</li>
                  </ul>
                </small>
              </div>

              <div className="confirmation-input mb-3">
                <label className="form-label text-muted">
                  Pour confirmer, tapez <strong>"SUPPRIMER"</strong> ci-dessous :
                </label>
                <Form.Control
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Tapez SUPPRIMER"
                  className="text-center border-danger"
                  style={{fontSize: '1.1rem', fontWeight: 'bold'}}
                />
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className="border-0 pt-0 justify-content-center">
            <Button 
              variant="outline-secondary"
              onClick={cancelDelete}
              disabled={loading}
              className="px-4"
            >
              <i className="fas fa-times"></i> Annuler
            </Button>
            <Button 
              variant="danger"
              onClick={confirmDelete}
              disabled={loading || deleteConfirmText !== "SUPPRIMER"}
              className="px-4"
            >
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  Suppression...
                </>
              ) : (
                <>
                  <i className="fas fa-trash"></i> Supprimer Définitivement
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}

export default User;
