import React, { useState, useEffect } from 'react';
import './FormOptions.css';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Row,
  Col,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Table,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Collapse
} from 'reactstrap';
import { 
  formOptionService, 
  formItemService, 
  formService,
  formSubmissionService,
  formResponseService,
  visiteDataService,
  territoryService,
  userService
} from '../services/apiServices';

// Add some inline styles for better UX
const styles = {
  submissionHeader: {
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  responseValue: {
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.9em'
  },
  submissionCard: {
    transition: 'all 0.3s ease',
    border: '1px solid #e3e6f0'
  },
  responseCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none'
  },
  statsCard: {
    background: 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
    color: 'white',
    border: 'none'
  },
  infoCard: {
    borderLeft: '4px solid #007bff',
    transition: 'all 0.3s ease'
  }
};

const FormOptions = () => {
  // Tab management
  const [activeTab, setActiveTab] = useState('options');
  
  // Options management states
  const [options, setOptions] = useState([]);
  const [forms, setForms] = useState([]);
  const [formItems, setFormItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form submissions states
  const [submissions, setSubmissions] = useState([]);
  const [submissionResponses, setSubmissionResponses] = useState({});
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [expandedSubmissions, setExpandedSubmissions] = useState({});
  
  // Stores Info (visite_data) states
  const [storesData, setStoresData] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [areas, setAreas] = useState([]);
  const [users, setUsers] = useState([]);
  const [groupedStoresData, setGroupedStoresData] = useState({});
  
  // Modal states
  const [optionModal, setOptionModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState(null);
  const [imageModal, setImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  
  // Filters
  const [selectedForm, setSelectedForm] = useState('');
  const [selectedFormItem, setSelectedFormItem] = useState('');
  
  // Option data
  const [optionData, setOptionData] = useState({
    display_text: '',
    value: '',
    option_label: '',
    sort_order: 0,
    is_default: false,
    form_item_uuid: '',
    user_uuid: '', // Will be set from auth context
    country_uuid: '',
    province_uuid: '',
    area_uuid: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadForms();
    loadOptions();
    loadSubmissions();
    loadStoresData();
    loadReferenceData();
  }, []);

  // Load form items when form is selected
  useEffect(() => {
    if (selectedForm) {
      loadFormItems(selectedForm);
      if (activeTab === 'submissions') {
        loadSubmissionsByForm(selectedForm);
      }
    } else {
      setFormItems([]);
      setSelectedFormItem('');
      if (activeTab === 'submissions') {
        loadSubmissions();
      }
    }
  }, [selectedForm, activeTab]);

  // Load stores data when switching to stores tab
  useEffect(() => {
    if (activeTab === 'stores') {
      loadStoresData();
    }
  }, [activeTab]);

  // Filter options when form item is selected
  useEffect(() => {
    if (selectedFormItem) {
      loadOptionsByFormItem(selectedFormItem);
    } else if (selectedForm === '') {
      loadOptions();
    }
  }, [selectedFormItem]);

  const loadForms = async () => {
    try {
      const response = await formService.getAll();
      if (response.status === 'success') {
        setForms(response.data);
      }
    } catch (error) {
      console.warn('Failed to load forms:', error);
    }
  };

  const loadFormItems = async (formUuid) => {
    try {
      const response = await formItemService.getByForm(formUuid);
      if (response.status === 'success') {
        // Only show items that can have options
        const optionableItems = response.data.filter(item => 
          ['select', 'radio', 'checkbox'].includes(item.item_type)
        );
        setFormItems(optionableItems);
      }
    } catch (error) {
      console.warn('Failed to load form items:', error);
    }
  };

  const loadOptions = async () => {
    try {
      setLoading(true);
      const response = await formOptionService.getAll();
      if (response.status === 'success') {
        setOptions(response.data.sort((a, b) => a.sort_order - b.sort_order));
      }
    } catch (error) {
      setError('Failed to load options: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOptionsByFormItem = async (formItemUuid) => {
    try {
      setLoading(true);
      const response = await formOptionService.getByFormItem(formItemUuid);
      if (response.status === 'success') {
        setOptions(response.data.sort((a, b) => a.sort_order - b.sort_order));
      }
    } catch (error) {
      setError('Failed to load options: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOption = async () => {
    try {
      setLoading(true);
      const response = await formOptionService.create(optionData);
      if (response.status === 'success') {
        setSuccess('Option created successfully!');
        setOptionModal(false);
        resetOptionData();
        
        // Reload options based on current filter
        if (selectedFormItem) {
          loadOptionsByFormItem(selectedFormItem);
        } else {
          loadOptions();
        }
      }
    } catch (error) {
      setError('Failed to create option: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOption = async () => {
    try {
      setLoading(true);
      const response = await formOptionService.update(editingOptionId, optionData);
      if (response.status === 'success') {
        setSuccess('Option updated successfully!');
        setOptionModal(false);
        setEditMode(false);
        setEditingOptionId(null);
        resetOptionData();
        
        // Reload options based on current filter
        if (selectedFormItem) {
          loadOptionsByFormItem(selectedFormItem);
        } else {
          loadOptions();
        }
      }
    } catch (error) {
      setError('Failed to update option: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOption = async (optionUuid) => {
    if (!window.confirm('Are you sure you want to delete this option?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await formOptionService.delete(optionUuid);
      if (response.status === 'success') {
        setSuccess('Option deleted successfully!');
        
        // Reload options based on current filter
        if (selectedFormItem) {
          loadOptionsByFormItem(selectedFormItem);
        } else {
          loadOptions();
        }
      }
    } catch (error) {
      setError('Failed to delete option: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    setEditingOptionId(null);
    resetOptionData();
    if (selectedFormItem) {
      setOptionData(prev => ({ ...prev, form_item_uuid: selectedFormItem }));
    }
    setOptionModal(true);
  };

  const openEditModal = (option) => {
    setEditMode(true);
    setEditingOptionId(option.uuid);
    setOptionData({
      display_text: option.display_text,
      value: option.value,
      option_label: option.option_label || '',
      sort_order: option.sort_order,
      is_default: option.is_default,
      form_item_uuid: option.form_item_uuid,
      user_uuid: option.user_uuid || '',
      country_uuid: option.country_uuid || '',
      province_uuid: option.province_uuid || '',
      area_uuid: option.area_uuid || ''
    });
    setOptionModal(true);
  };

  const resetOptionData = () => {
    setOptionData({
      display_text: '',
      value: '',
      option_label: '',
      sort_order: 0,
      is_default: false,
      form_item_uuid: selectedFormItem || '',
      user_uuid: '',
      country_uuid: '',
      province_uuid: '',
      area_uuid: ''
    });
  };

  const getFormTitle = (formUuid) => {
    const form = forms.find(f => f.uuid === formUuid);
    return form ? form.title : 'Unknown Form';
  };

  const getFormItemQuestion = (formItemUuid) => {
    const item = formItems.find(item => item.uuid === formItemUuid);
    if (!item) {
      // Try to find in all loaded options
      const option = options.find(opt => opt.form_item_uuid === formItemUuid);
      return option?.form_item?.question || 'Unknown Question';
    }
    return item.question;
  };

  // Submission management functions
  const loadSubmissions = async () => {
    try {
      setSubmissionsLoading(true);
      const response = await formSubmissionService.getAll();
      if (response.status === 'success') {
        setSubmissions(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    } catch (error) {
      console.warn('Failed to load submissions:', error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const loadSubmissionsByForm = async (formUuid) => {
    try {
      setSubmissionsLoading(true);
      const response = await formSubmissionService.getByForm(formUuid);
      if (response.status === 'success') {
        setSubmissions(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    } catch (error) {
      console.warn('Failed to load submissions for form:', error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const loadSubmissionResponses = async (submissionUuid) => {
    try {
      const response = await formResponseService.getBySubmission(submissionUuid);
      if (response.status === 'success') {
        setSubmissionResponses(prev => ({
          ...prev,
          [submissionUuid]: response.data
        }));
      }
    } catch (error) {
      console.warn('Failed to load submission responses:', error);
    }
  };

  const toggleSubmissionExpansion = (submissionUuid) => {
    setExpandedSubmissions(prev => {
      const newExpanded = { ...prev };
      if (newExpanded[submissionUuid]) {
        delete newExpanded[submissionUuid];
      } else {
        newExpanded[submissionUuid] = true;
        // Load responses if not already loaded
        if (!submissionResponses[submissionUuid]) {
          loadSubmissionResponses(submissionUuid);
        }
      }
      return newExpanded;
    });
  };

  const formatResponseValue = (response) => {
    if (response.text_value) return response.text_value;
    if (response.number_value !== null) return response.number_value.toString();
    if (response.boolean_value !== null) return response.boolean_value ? 'Yes' : 'No';
    if (response.date_value) return new Date(response.date_value).toLocaleDateString();
    return 'No value';
  };

  const getFormItemByUuid = (itemUuid) => {
    // First try to find in current form items
    let item = formItems.find(item => item.uuid === itemUuid);
    if (item) return item;
    
    // If not found, try to find from submission responses (they might include form_item data)
    for (const responses of Object.values(submissionResponses)) {
      const response = responses.find(resp => resp.form_item_uuid === itemUuid);
      if (response && response.form_item) {
        return response.form_item;
      }
    }
    
    return { uuid: itemUuid, question: 'Unknown Question', item_type: 'text' };
  };

  // ============================================================================
  // STORES DATA FUNCTIONS
  // ============================================================================

  // Sample data for testing when backend endpoint doesn't exist
  const getSampleStoresData = () => {
    return {
      "1": [
        {
          text_value: "Product A,Product B,Product C",
          radio_value: "Option 1",
          checkbox_value: "Checked Item",
          email: "store1@example.com",
          number_value: 150,
          boolean_value: true,
          comment: "This is a sample comment about the store visit",
          file_url: "https://via.placeholder.com/300x200/0066cc/ffffff?text=Store+Image+1,https://via.placeholder.com/300x200/cc6600/ffffff?text=Store+Image+2",
          area_uuid: "sample-area-uuid-1",
          province_uuid: "sample-province-uuid-1", 
          country_uuid: "sample-country-uuid-1",
          user_uuid: "sample-user-uuid-1",
          entry_order: 1
        },
        {
          text_value: "Item X,Item Y",
          radio_value: "Option 2",
          checkbox_value: null,
          email: "store2@example.com",
          number_value: 75,
          boolean_value: false,
          comment: "Another sample comment with more details",
          file_url: "https://via.placeholder.com/300x200/cc0066/ffffff?text=Store+Photo",
          area_uuid: "sample-area-uuid-2",
          province_uuid: "sample-province-uuid-1",
          country_uuid: "sample-country-uuid-1", 
          user_uuid: "sample-user-uuid-2",
          entry_order: 1
        }
      ],
      "2": [
        {
          text_value: "Service A",
          radio_value: null,
          checkbox_value: "Multiple,Selected,Items",
          email: null,
          number_value: 200,
          boolean_value: true,
          comment: null,
          file_url: null,
          area_uuid: "sample-area-uuid-3",
          province_uuid: "sample-province-uuid-2",
          country_uuid: "sample-country-uuid-1",
          user_uuid: "sample-user-uuid-1",
          entry_order: 2
        }
      ]
    };
  };

  const loadStoresData = async () => {
    try {
      setStoresLoading(true);
      const response = await visiteDataService.getGroupedByEntryOrder();
      if (response.status === 'success' && response.data) {
        // Ensure the data is in the expected format
        const groupedData = response.data || {};
        setGroupedStoresData(groupedData);
        
        // Also set flat data for easier processing
        const flatData = Object.values(groupedData).flat().filter(item => item);
        setStoresData(flatData);
      } else {
        // Handle case where endpoint doesn't exist or returns different format
        setGroupedStoresData({});
        setStoresData([]);
      }
    } catch (error) {
      console.warn('Failed to load stores data:', error);
      
      // For development: Use sample data if endpoint doesn't exist
      if (error.message.includes('404') || error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        console.log('Using sample data for stores info (backend endpoint not available)');
        const sampleData = getSampleStoresData();
        setGroupedStoresData(sampleData);
        setStoresData(Object.values(sampleData).flat());
      } else {
        setError('Failed to load stores data: ' + error.message);
        setGroupedStoresData({});
        setStoresData([]);
      }
    } finally {
      setStoresLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      // Load all reference data in parallel
      const [countriesRes, provincesRes, areasRes, usersRes] = await Promise.all([
        territoryService.countries.getAll(),
        territoryService.provinces.getAll(),
        territoryService.areas.getAll(),
        userService.getAll()
      ]);

      if (countriesRes.status === 'success') setCountries(countriesRes.data);
      if (provincesRes.status === 'success') setProvinces(provincesRes.data);
      if (areasRes.status === 'success') setAreas(areasRes.data);
      if (usersRes.status === 'success') setUsers(usersRes.data);
    } catch (error) {
      console.warn('Failed to load reference data:', error);
      
      // Set sample reference data for development
      setCountries([
        { uuid: 'sample-country-uuid-1', name: 'Sample Country' }
      ]);
      setProvinces([
        { uuid: 'sample-province-uuid-1', name: 'Sample Province 1' },
        { uuid: 'sample-province-uuid-2', name: 'Sample Province 2' }
      ]);
      setAreas([
        { uuid: 'sample-area-uuid-1', name: 'Sample Area 1' },
        { uuid: 'sample-area-uuid-2', name: 'Sample Area 2' },
        { uuid: 'sample-area-uuid-3', name: 'Sample Area 3' }
      ]);
      setUsers([
        { uuid: 'sample-user-uuid-1', first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com' },
        { uuid: 'sample-user-uuid-2', first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@example.com' }
      ]);
    }
  };

  // Helper functions for getting names by UUID
  const getCountryName = (uuid) => {
    if (!uuid) return '-';
    const country = countries.find(c => c.uuid === uuid);
    return country ? country.name : '-';
  };

  const getProvinceName = (uuid) => {
    if (!uuid) return '-';
    const province = provinces.find(p => p.uuid === uuid);
    return province ? province.name : '-';
  };

  const getAreaName = (uuid) => {
    if (!uuid) return '-';
    const area = areas.find(a => a.uuid === uuid);
    return area ? area.name : '-';
  };

  const getUserFullName = (uuid) => {
    if (!uuid) return '-';
    const user = users.find(u => u.uuid === uuid);
    return user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || '-' : '-';
  };

  // Handle image modal
  const openImageModal = (imageUrls) => {
    const images = imageUrls.split(',').map(url => url.trim()).filter(url => url);
    setSelectedImages(images);
    setImageModal(true);
  };

  const renderCellValue = (value, type = 'text') => {
    if (!value && value !== 0 && value !== false) return <span className="text-muted">-</span>;
    
    switch (type) {
      case 'boolean':
        return (
          <Badge color={value ? 'success' : 'danger'} size="sm">
            {value ? 'Yes' : 'No'}
          </Badge>
        );
      case 'email':
        return (
          <a href={`mailto:${value}`} className="text-decoration-none">
            {value}
          </a>
        );
      case 'images':
        if (value && value.includes(',')) {
          const imageCount = value.split(',').length;
          return (
            <Button 
              color="info" 
              size="sm" 
              onClick={() => openImageModal(value)}
            >
              View Images ({imageCount})
            </Button>
          );
        } else if (value) {
          return (
            <Button 
              color="info" 
              size="sm" 
              onClick={() => openImageModal(value)}
            >
              View Image
            </Button>
          );
        }
        return <span className="text-muted">-</span>;
      default:
        return <span>{value}</span>;
    }
  };

  // Export functionality
  const exportSubmissionsToCSV = () => {
    if (submissions.length === 0) return;
    
    const csvHeaders = [
      'Form Title',
      'Submitter Name', 
      'Submitter Email',
      'Status',
      'Submitted Date',
      'GPS Available',
      'Latitude',
      'Longitude',
      'Response Count'
    ];
    
    const csvData = submissions.map(submission => [
      getFormTitle(submission.form_uuid),
      submission.submitter_name,
      submission.submitter_email,
      submission.status,
      new Date(submission.created_at).toLocaleString(),
      submission.latitude && submission.longitude ? 'Yes' : 'No',
      submission.latitude || 'N/A',
      submission.longitude || 'N/A',
      submissionResponses[submission.uuid]?.length || 'Loading...'
    ]);
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `form_submissions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get statistics
  const getSubmissionStats = () => {
    const totalSubmissions = submissions.length;
    const submittedCount = submissions.filter(s => s.status === 'submitted').length;
    const withGPS = submissions.filter(s => s.latitude && s.longitude).length;
    const formsUsed = new Set(submissions.map(s => s.form_uuid)).size;
    
    return {
      total: totalSubmissions,
      submitted: submittedCount,
      withGPS,
      formsUsed
    };
  };

  return (
    <div className="content">
      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <CardTitle tag="h4" className="mb-0 d-flex align-items-center">
                  <i className="fas fa-cogs text-primary me-2"></i>
                  Advanced Form Management
                </CardTitle>
                <div className="d-flex align-items-center gap-2">
                  <Nav tabs className="me-3 border-0">
                    <NavItem>
                      <NavLink
                        className={`${activeTab === 'options' ? 'active' : ''} px-4 py-2 rounded-pill`}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab('options');
                        }}
                        style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                      >
                        <i className="fas fa-list-ul me-1"></i>
                        Form Options
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={`${activeTab === 'submissions' ? 'active' : ''} px-4 py-2 rounded-pill`}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab('submissions');
                        }}
                        style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                      >
                        <i className="fas fa-file-alt me-1"></i>
                        Submissions ({submissions.length})
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={`${activeTab === 'stores' ? 'active' : ''} px-4 py-2 rounded-pill`}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab('stores');
                        }}
                        style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                      >
                        <i className="fas fa-store me-1"></i>
                        Stores Info ({Object.keys(groupedStoresData).length})
                      </NavLink>
                    </NavItem>
                  </Nav>
                  {activeTab === 'options' && (
                    <Button 
                      color="primary" 
                      size="sm"
                      className="rounded-pill px-3" 
                      onClick={openCreateModal}
                      disabled={!selectedFormItem}
                    >
                      <i className="fas fa-plus me-1"></i>
                      Add Option
                    </Button>
                  )}
                  {activeTab === 'submissions' && submissions.length > 0 && (
                    <Button 
                      color="success" 
                      size="sm"
                      className="rounded-pill px-3" 
                      onClick={exportSubmissionsToCSV}
                    >
                      <i className="fas fa-download me-1"></i>
                      Export CSV
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {error && (
                <Alert color="danger" toggle={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert color="success" toggle={() => setSuccess(null)}>
                  {success}
                </Alert>
              )}

              {/* Filters */}
              <Row className="mb-3">
                <Col md="6">
                  <FormGroup>
                    <Label for="formFilter">Filter by Form</Label>
                    <Input
                      type="select"
                      id="formFilter"
                      value={selectedForm}
                      onChange={(e) => setSelectedForm(e.target.value)}
                    >
                      <option value="">All Forms</option>
                      {forms.map((form) => (
                        <option key={form.uuid} value={form.uuid}>
                          {form.title}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
                {activeTab === 'options' && (
                  <Col md="6">
                    <FormGroup>
                      <Label for="formItemFilter">Filter by Form Item</Label>
                      <Input
                        type="select"
                        id="formItemFilter"
                        value={selectedFormItem}
                        onChange={(e) => setSelectedFormItem(e.target.value)}
                        disabled={!selectedForm}
                      >
                        <option value="">All Form Items</option>
                        {formItems.map((item) => (
                          <option key={item.uuid} value={item.uuid}>
                            {item.question} ({item.item_type})
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                )}
              </Row>

              <TabContent activeTab={activeTab}>
                {/* Form Options Tab */}
                <TabPane tabId="options">
                  {loading && options.length === 0 ? (
                    <div className="text-center">
                      <p>Loading options...</p>
                    </div>
                  ) : (
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Display Text</th>
                          <th>Value</th>
                          <th>Form Item</th>
                          <th>Default</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {options.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center">
                              {selectedFormItem 
                                ? 'No options found for this form item' 
                                : 'No options found. Select a form item to add options.'
                              }
                            </td>
                          </tr>
                        ) : (
                          options.map((option) => (
                            <tr key={option.uuid}>
                              <td>{option.sort_order}</td>
                              <td>{option.display_text}</td>
                              <td>
                                <code>{option.value}</code>
                              </td>
                              <td>
                                <div>
                                  <strong>{getFormItemQuestion(option.form_item_uuid)}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {getFormTitle(option.form_item?.form_uuid || '')}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <Badge color={option.is_default ? 'success' : 'secondary'}>
                                  {option.is_default ? 'Default' : 'Option'}
                                </Badge>
                              </td>
                              <td>
                                <Button 
                                  color="warning" 
                                  size="sm" 
                                  className="me-1"
                                  onClick={() => openEditModal(option)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  color="danger" 
                                  size="sm"
                                  onClick={() => handleDeleteOption(option.uuid)}
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  )}
                </TabPane>

                {/* Form Submissions Tab */}
                <TabPane tabId="submissions">
                  {submissionsLoading && submissions.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3 text-muted">Loading submissions...</p>
                    </div>
                  ) : (
                    <div>
                      {/* Statistics Dashboard */}
                      {submissions.length > 0 && (
                        <div className="submissions-dashboard mb-4">
                          <Row>
                            <Col lg="3" md="6" className="mb-3">
                              <div className="stats-display">
                                <span className="stats-number">{getSubmissionStats().total}</span>
                                <span className="stats-label">Total Submissions</span>
                              </div>
                            </Col>
                            <Col lg="3" md="6" className="mb-3">
                              <div className="stats-display" style={{background: 'linear-gradient(45deg, #28a745 0%, #20c997 100%)'}}>
                                <span className="stats-number">{getSubmissionStats().submitted}</span>
                                <span className="stats-label">Completed</span>
                              </div>
                            </Col>
                            <Col lg="3" md="6" className="mb-3">
                              <div className="stats-display" style={{background: 'linear-gradient(45deg, #17a2b8 0%, #6610f2 100%)'}}>
                                <span className="stats-number">{getSubmissionStats().withGPS}</span>
                                <span className="stats-label">With GPS</span>
                              </div>
                            </Col>
                            <Col lg="3" md="6" className="mb-3">
                              <div className="stats-display" style={{background: 'linear-gradient(45deg, #fd7e14 0%, #e83e8c 100%)'}}>
                                <span className="stats-number">{getSubmissionStats().formsUsed}</span>
                                <span className="stats-label">Forms Used</span>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      )}

                      <div className="mb-4 p-3 bg-light rounded">
                        <Row className="align-items-center">
                          <Col md="8">
                            <h6 className="mb-0 d-flex align-items-center">
                              <i className="fas fa-chart-bar text-primary me-2"></i>
                              Submissions Dashboard
                            </h6>
                          </Col>
                          <Col md="4" className="text-end">
                            <Badge color="info" pill className="me-2 px-3 py-2">
                              <i className="fas fa-file-alt me-1"></i>
                              Total: {submissions.length}
                            </Badge>
                            {selectedForm && (
                              <Badge color="secondary" pill className="px-3 py-2">
                                <i className="fas fa-filter me-1"></i>
                                {getFormTitle(selectedForm)}
                              </Badge>
                            )}
                          </Col>
                        </Row>
                      </div>
                      
                      {/* Summary Table for all submissions */}
                      {submissions.length > 0 && (
                        <div className="mb-4">
                          <h6 className="d-flex align-items-center mb-3">
                            <i className="fas fa-table text-secondary me-2"></i>
                            Quick Overview
                          </h6>
                          <Table responsive hover className="table-enhanced">
                            <thead className="table-primary">
                              <tr>
                                <th className="border-0">
                                  <i className="fas fa-clipboard-list me-1"></i>
                                  Form
                                </th>
                                <th className="border-0">
                                  <i className="fas fa-user me-1"></i>
                                  Submitter
                                </th>
                                <th className="border-0">
                                  <i className="fas fa-envelope me-1"></i>
                                  Contact
                                </th>
                                <th className="border-0">
                                  <i className="fas fa-check-circle me-1"></i>
                                  Status
                                </th>
                                <th className="border-0">
                                  <i className="fas fa-calendar me-1"></i>
                                  Submitted
                                </th>
                                <th className="border-0">
                                  <i className="fas fa-map-marker-alt me-1"></i>
                                  Location
                                </th>
                                <th className="border-0">
                                  <i className="fas fa-eye me-1"></i>
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {submissions.map((submission, index) => (
                                <tr key={submission.uuid} className="align-middle">
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <Badge color="outline-primary" className="me-2" style={{ minWidth: '25px' }}>
                                        {index + 1}
                                      </Badge>
                                      <div>
                                        <strong className="text-primary">{getFormTitle(submission.form_uuid)}</strong>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <div className="avatar-circle bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                                           style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                                        {submission.submitter_name.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="fw-medium">{submission.submitter_name}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <a href={`mailto:${submission.submitter_email}`} className="text-decoration-none">
                                      <i className="fas fa-envelope text-muted me-1"></i>
                                      {submission.submitter_email}
                                    </a>
                                  </td>
                                  <td>
                                    <Badge 
                                      color={submission.status === 'submitted' ? 'success' : 'warning'} 
                                      className="px-3 py-2"
                                    >
                                      <i className={`fas ${submission.status === 'submitted' ? 'fa-check' : 'fa-clock'} me-1`}></i>
                                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                    </Badge>
                                  </td>
                                  <td>
                                    <div className="text-center">
                                      <div className="fw-bold text-dark">
                                        {new Date(submission.created_at).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </div>
                                      <small className="text-muted">
                                        {new Date(submission.created_at).toLocaleDateString('en-US', { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                      </small>
                                    </div>
                                  </td>
                                  <td className="text-center">
                                    {submission.latitude && submission.longitude ? (
                                      <Badge color="success" className="px-3 py-2">
                                        <i className="fas fa-map-marker-alt me-1"></i>
                                        GPS ✓
                                      </Badge>
                                    ) : (
                                      <Badge color="secondary" className="px-3 py-2">
                                        <i className="fas fa-map-marker-alt me-1"></i>
                                        No GPS
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    <Button 
                                      color="primary" 
                                      size="sm"
                                      className="px-3"
                                      onClick={() => toggleSubmissionExpansion(submission.uuid)}
                                    >
                                      <i className={`fas ${expandedSubmissions[submission.uuid] ? 'fa-eye-slash' : 'fa-eye'} me-1`}></i>
                                      {expandedSubmissions[submission.uuid] ? 'Hide' : 'View'}
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                      
                      {submissions.length === 0 ? (
                        <div className="text-center py-5">
                          <div className="mb-4">
                            <i className="fas fa-clipboard-list text-muted" style={{ fontSize: '4rem' }}></i>
                          </div>
                          <h5 className="text-muted mb-3">No Form Submissions Found</h5>
                          <p className="text-muted mb-4">
                            {selectedForm 
                              ? `No submissions found for "${getFormTitle(selectedForm)}". Try selecting a different form or clear the filter.`
                              : 'Start collecting data by sharing your forms with users.'
                            }
                          </p>
                          {selectedForm && (
                            <Button 
                              color="secondary" 
                              size="sm"
                              onClick={() => setSelectedForm('')}
                              className="rounded-pill px-4"
                            >
                              <i className="fas fa-filter me-1"></i>
                              Clear Filter
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div>
                          <h6 className="mt-4 mb-3 d-flex align-items-center">
                            <i className="fas fa-list-alt text-primary me-2"></i>
                            Detailed Form Responses
                            <Badge color="light" className="ms-2">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</Badge>
                          </h6>
                          <div className="submissions-list">
                            {submissions.map((submission, index) => (
                              <Card 
                                key={submission.uuid} 
                                className="mb-4 submission-card fade-in" 
                              >
                                <CardHeader 
                                  className="submission-header d-flex justify-content-between align-items-center"
                                  onClick={() => toggleSubmissionExpansion(submission.uuid)}
                                >
                                <div>
                                  <h6 className="mb-1 d-flex align-items-center text-white">
                                    <i className="fas fa-clipboard-list text-white me-2"></i>
                                    Form: {getFormTitle(submission.form_uuid)}
                                  </h6>
                                  <div className="row">
                                    <div className="col-md-6">
                                      <small className="text-white">
                                        <div className="d-flex align-items-center mb-1">
                                          <i className="fas fa-user text-white me-2"></i>
                                          <strong>Submitter:</strong> 
                                          <span className="ms-2">{submission.submitter_name}</span>
                                        </div>
                                        <div className="d-flex align-items-center mb-1">
                                          <i className="fas fa-envelope text-white me-2"></i>
                                          <strong>Email:</strong> 
                                          <span className="ms-2">{submission.submitter_email}</span>
                                        </div>
                                        <div className="d-flex align-items-center">
                                          <i className="fas fa-check-circle text-white me-2"></i>
                                          <strong>Status:</strong> 
                                          <Badge color={submission.status === 'submitted' ? 'success' : 'warning'} className="ms-2" size="sm">
                                            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                          </Badge>
                                        </div>
                                      </small>
                                    </div>
                                    <div className="col-md-6">
                                      <small className="text-white">
                                        <div className="d-flex align-items-center mb-1">
                                          <i className="fas fa-calendar text-white me-2"></i>
                                          <strong>Submitted:</strong> 
                                          <span className="ms-2">{new Date(submission.created_at).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                          })}</span>
                                        </div>
                                        <div className="d-flex align-items-center mb-1">
                                          <i className="fas fa-sync text-white me-2"></i>
                                          <strong>Updated:</strong> 
                                          <span className="ms-2">{new Date(submission.updated_at).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                          })}</span>
                                        </div>
                                        <div className="d-flex align-items-center">
                                          {submission.latitude && submission.longitude ? (
                                            <>
                                              <i className="fas fa-map-marker-alt text-white me-2"></i>
                                              <strong>GPS:</strong>
                                              <Badge color="success" className="ms-2" size="sm">
                                                <i className="fas fa-check me-1"></i>
                                                Available
                                              </Badge>
                                            </>
                                          ) : (
                                            <>
                                              <i className="fas fa-map-marker-alt text-white me-2"></i>
                                              <span>No GPS coordinates</span>
                                            </>
                                          )}
                                        </div>
                                      </small>
                                    </div>
                                  </div>
                                </div>
                                <div className="d-flex align-items-center">
                                  <Badge 
                                    color={submission.status === 'submitted' ? 'light' : 'warning'} 
                                    className="me-3 px-3 py-2"
                                    style={{ fontSize: '0.8em' }}
                                  >
                                    <i className={`fas ${submission.status === 'submitted' ? 'fa-check-circle' : 'fa-clock'} me-1`}></i>
                                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                  </Badge>
                                  <Button 
                                    color="light" 
                                    size="sm"
                                    className="rounded-pill"
                                    style={{ minWidth: '40px' }}
                                  >
                                    <i className={`fas ${expandedSubmissions[submission.uuid] ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                                  </Button>
                                </div>
                              </CardHeader>
                              <Collapse isOpen={expandedSubmissions[submission.uuid]}>
                                <CardBody>
                                  <h6 className="mb-3">Form Responses:</h6>
                                  {submissionResponses[submission.uuid] ? (
                                    submissionResponses[submission.uuid].length > 0 ? (
                                      <div className="response-cards">
                                        {submissionResponses[submission.uuid].map((response, index) => {
                                          const formItem = getFormItemByUuid(response.form_item_uuid);
                                          const responseValue = formatResponseValue(response);
                                          
                                          return (
                                            <Card key={response.uuid} className="mb-3 response-card shadow-sm">
                                              <CardBody className="p-3">
                                                <Row>
                                                  <Col md="8">
                                                    <div className="d-flex align-items-start mb-2">
                                                      <Badge 
                                                        color="primary" 
                                                        className="me-2 mt-1" 
                                                        style={{ minWidth: '24px', textAlign: 'center' }}
                                                      >
                                                        {index + 1}
                                                      </Badge>
                                                      <div className="flex-grow-1">
                                                        <h6 className="mb-1 text-primary fw-bold">
                                                          {formItem.question}
                                                        </h6>
                                                        <div className="d-flex align-items-center gap-2 mb-2">
                                                          <Badge color="secondary" size="sm" className="text-uppercase">
                                                            {formItem.item_type}
                                                          </Badge>
                                                          <small className="text-muted">
                                                            Answered on {new Date(response.created_at).toLocaleDateString()}
                                                          </small>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </Col>
                                                  <Col md="4">
                                                    <div className="text-end">
                                                      <div className="response-value-display p-2 bg-light rounded border">
                                                        {response.text_value && (
                                                          <div>
                                                            <small className="text-muted d-block">Text Response:</small>
                                                            <span className="fw-bold text-dark">{response.text_value}</span>
                                                          </div>
                                                        )}
                                                        {response.number_value !== null && response.number_value !== undefined && (
                                                          <div>
                                                            <small className="text-muted d-block">Numeric Value:</small>
                                                            <span className="fw-bold text-info">{response.number_value}</span>
                                                          </div>
                                                        )}
                                                        {response.boolean_value !== null && response.boolean_value !== undefined && (
                                                          <div>
                                                            <small className="text-muted d-block">Boolean Response:</small>
                                                            <Badge color={response.boolean_value ? 'success' : 'danger'}>
                                                              {response.boolean_value ? '✓ Yes' : '✗ No'}
                                                            </Badge>
                                                          </div>
                                                        )}
                                                        {response.date_value && (
                                                          <div>
                                                            <small className="text-muted d-block">Date Selected:</small>
                                                            <span className="fw-bold text-warning">
                                                              {new Date(response.date_value).toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                              })}
                                                            </span>
                                                          </div>
                                                        )}
                                                        {!response.text_value && response.number_value === null && 
                                                         response.boolean_value === null && !response.date_value && (
                                                          <div className="text-center">
                                                            <small className="text-muted fst-italic">No response provided</small>
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </Col>
                                                </Row>
                                              </CardBody>
                                            </Card>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-muted">No responses found for this submission.</p>
                                    )
                                  ) : (
                                    <div className="text-center">
                                      <p>Loading responses...</p>
                                    </div>
                                  )}
                                  
                                  <div className="mt-3 pt-3 border-top bg-light rounded p-3">
                                    <h6 className="text-primary mb-3">
                                      <i className="fas fa-info-circle me-2"></i>
                                      Submission Summary
                                    </h6>
                                    <Row>
                                      <Col md="6">
                                        <div className="info-card bg-white p-3 rounded shadow-sm mb-3">
                                          <h6 className="text-secondary mb-2">Submitter Information</h6>
                                          <div className="mb-2">
                                            <strong className="text-primary">Name:</strong> 
                                            <span className="ms-2">{submission.submitter_name}</span>
                                          </div>
                                          <div className="mb-2">
                                            <strong className="text-primary">Email:</strong> 
                                            <span className="ms-2">{submission.submitter_email}</span>
                                          </div>
                                          <div className="mb-0">
                                            <strong className="text-primary">Status:</strong> 
                                            <Badge color={submission.status === 'submitted' ? 'success' : 'warning'} className="ms-2">
                                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                            </Badge>
                                          </div>
                                        </div>
                                      </Col>
                                      <Col md="6">
                                        <div className="info-card bg-white p-3 rounded shadow-sm mb-3">
                                          <h6 className="text-secondary mb-2">Submission Details</h6>
                                          <div className="mb-2">
                                            <strong className="text-primary">Submitted:</strong> 
                                            <span className="ms-2">
                                              {new Date(submission.created_at).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </span>
                                          </div>
                                          <div className="mb-2">
                                            <strong className="text-primary">Last Updated:</strong> 
                                            <span className="ms-2">
                                              {new Date(submission.updated_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </span>
                                          </div>
                                          <div className="mb-0">
                                            <strong className="text-primary">GPS Location:</strong> 
                                            {submission.latitude && submission.longitude ? (
                                              <div className="ms-2">
                                                <Badge color="success" className="me-2">
                                                  <i className="fas fa-map-marker-alt me-1"></i>
                                                  Available
                                                </Badge>
                                                <small className="text-muted">
                                                  ({parseFloat(submission.latitude).toFixed(6)}, {parseFloat(submission.longitude).toFixed(6)})
                                                </small>
                                              </div>
                                            ) : (
                                              <Badge color="secondary" className="ms-2">
                                                <i className="fas fa-map-marker-alt me-1"></i>
                                                Not Available
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </Col>
                                    </Row>
                                    
                                    {/* Response Statistics */}
                                    {submissionResponses[submission.uuid] && (
                                      <div className="info-card bg-white p-3 rounded shadow-sm">
                                        <h6 className="text-secondary mb-2">Response Statistics</h6>
                                        <Row>
                                          <Col md="3">
                                            <div className="text-center">
                                              <div className="display-6 text-primary fw-bold">
                                                {submissionResponses[submission.uuid].length}
                                              </div>
                                              <small className="text-muted">Total Responses</small>
                                            </div>
                                          </Col>
                                          <Col md="3">
                                            <div className="text-center">
                                              <div className="display-6 text-success fw-bold">
                                                {submissionResponses[submission.uuid].filter(r => 
                                                  r.text_value || r.number_value !== null || r.boolean_value !== null || r.date_value
                                                ).length}
                                              </div>
                                              <small className="text-muted">Answered Questions</small>
                                            </div>
                                          </Col>
                                          <Col md="3">
                                            <div className="text-center">
                                              <div className="display-6 text-info fw-bold">
                                                {submissionResponses[submission.uuid].filter(r => r.text_value).length}
                                              </div>
                                              <small className="text-muted">Text Responses</small>
                                            </div>
                                          </Col>
                                          <Col md="3">
                                            <div className="text-center">
                                              <div className="display-6 text-warning fw-bold">
                                                {submissionResponses[submission.uuid].filter(r => 
                                                  r.number_value !== null || r.boolean_value !== null || r.date_value
                                                ).length}
                                              </div>
                                              <small className="text-muted">Structured Data</small>
                                            </div>
                                          </Col>
                                        </Row>
                                      </div>
                                    )}
                                  </div>
                                </CardBody>
                              </Collapse>
                            </Card>
                          ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabPane>

                {/* Stores Info Tab */}
                <TabPane tabId="stores">
                  {storesLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3 text-muted">Loading stores data...</p>
                    </div>
                  ) : (
                    <div>
                      {/* Statistics for Stores */}
                      <div className="mb-4 p-3 bg-light rounded">
                        <Row className="align-items-center">
                          <Col md="8">
                            <h6 className="mb-0 d-flex align-items-center">
                              <i className="fas fa-store text-primary me-2"></i>
                              Stores Information Dashboard
                              {storesData.length > 0 && storesData[0].text_value === "Product A,Product B,Product C" && (
                                <Badge color="warning" className="ms-2" size="sm">
                                  <i className="fas fa-exclamation-triangle me-1"></i>
                                  Using Sample Data
                                </Badge>
                              )}
                            </h6>
                          </Col>
                          <Col md="4" className="text-end">
                            <Badge color="info" pill className="me-2 px-3 py-2">
                              <i className="fas fa-database me-1"></i>
                              Total Entries: {storesData.length}
                            </Badge>
                            <Badge color="secondary" pill className="px-3 py-2">
                              <i className="fas fa-layer-group me-1"></i>
                              Groups: {Object.keys(groupedStoresData).length}
                            </Badge>
                          </Col>
                        </Row>
                      </div>

                      {Object.keys(groupedStoresData).length === 0 ? (
                        <div className="text-center py-5">
                          <div className="mb-4">
                            <i className="fas fa-store text-muted" style={{ fontSize: '4rem' }}></i>
                          </div>
                          <h5 className="text-muted mb-3">No Stores Data Found</h5>
                          <p className="text-muted">
                            No store visit data is available in the system yet.
                          </p>
                        </div>
                      ) : (
                        <div>
                          {Object.entries(groupedStoresData).map(([entryOrder, entries]) => {
                            // Ensure entries is an array
                            const entriesArray = Array.isArray(entries) ? entries : [];
                            
                            if (entriesArray.length === 0) {
                              return null; // Skip empty groups
                            }

                            return (
                            <Card key={entryOrder} className="mb-4 shadow-sm">
                              <CardHeader className="bg-primary text-white">
                                <h6 className="mb-0 d-flex align-items-center">
                                  <i className="fas fa-list-ol me-2"></i>
                                  Entry Group #{entryOrder}
                                  <Badge color="light" className="ms-2 text-dark">
                                    {entriesArray.length} record{entriesArray.length !== 1 ? 's' : ''}
                                  </Badge>
                                </h6>
                              </CardHeader>
                              <CardBody className="p-0">
                                <div className="table-responsive">
                                  <Table hover className="mb-0">
                                    <thead className="table-light">
                                      <tr>
                                        <th style={{ minWidth: '150px' }}>Text Values</th>
                                        <th>Radio</th>
                                        <th>Checkbox</th>
                                        <th>Email</th>
                                        <th>Number</th>
                                        <th>Boolean</th>
                                        <th>Comment</th>
                                        <th>Images</th>
                                        <th>Area</th>
                                        <th>Province</th>
                                        <th>Country</th>
                                        <th>User</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {entriesArray.map((entry, index) => (
                                        <tr key={`${entryOrder}-${index}`}>
                                          <td>
                                            {entry.text_value ? (
                                              <div>
                                                {entry.text_value.split(',').map((text, idx) => (
                                                  <Badge key={idx} color="info" className="me-1 mb-1" size="sm">
                                                    {text.trim()}
                                                  </Badge>
                                                ))}
                                              </div>
                                            ) : (
                                              <span className="text-muted">-</span>
                                            )}
                                          </td>
                                          <td>{renderCellValue(entry.radio_value)}</td>
                                          <td>{renderCellValue(entry.checkbox_value)}</td>
                                          <td>{renderCellValue(entry.email, 'email')}</td>
                                          <td>{renderCellValue(entry.number_value)}</td>
                                          <td>{renderCellValue(entry.boolean_value, 'boolean')}</td>
                                          <td>
                                            {entry.comment ? (
                                              <div style={{ maxWidth: '200px' }}>
                                                <span className="text-truncate d-block" title={entry.comment}>
                                                  {entry.comment}
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-muted">-</span>
                                            )}
                                          </td>
                                          <td>{renderCellValue(entry.file_url, 'images')}</td>
                                          <td>
                                            <Badge color="outline-secondary" size="sm">
                                              {getAreaName(entry.area_uuid)}
                                            </Badge>
                                          </td>
                                          <td>
                                            <Badge color="outline-secondary" size="sm">
                                              {getProvinceName(entry.province_uuid)}
                                            </Badge>
                                          </td>
                                          <td>
                                            <Badge color="outline-secondary" size="sm">
                                              {getCountryName(entry.country_uuid)}
                                            </Badge>
                                          </td>
                                          <td>
                                            <Badge color="outline-primary" size="sm">
                                              {getUserFullName(entry.user_uuid)}
                                            </Badge>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </div>
                              </CardBody>
                            </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </TabPane>
              </TabContent>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Create/Edit Option Modal */}
      <Modal isOpen={optionModal} toggle={() => setOptionModal(false)}>
        <ModalHeader toggle={() => setOptionModal(false)}>
          {editMode ? 'Edit Option' : 'Create New Option'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="form_item_uuid">Form Item *</Label>
              <Input
                type="select"
                id="form_item_uuid"
                value={optionData.form_item_uuid}
                onChange={(e) => setOptionData({...optionData, form_item_uuid: e.target.value})}
                disabled={editMode}
              >
                <option value="">Select a form item</option>
                {formItems.map((item) => (
                  <option key={item.uuid} value={item.uuid}>
                    {item.question} ({item.item_type})
                  </option>
                ))}
              </Input>
            </FormGroup>
            
            <FormGroup>
              <Label for="display_text">Display Text *</Label>
              <Input
                type="text"
                id="display_text"
                value={optionData.display_text}
                onChange={(e) => setOptionData({...optionData, display_text: e.target.value})}
                placeholder="What users will see"
              />
            </FormGroup>
            
            <FormGroup>
              <Label for="value">Value *</Label>
              <Input
                type="text"
                id="value"
                value={optionData.value}
                onChange={(e) => setOptionData({...optionData, value: e.target.value})}
                placeholder="The actual value stored"
              />
            </FormGroup>
            
            <FormGroup>
              <Label for="option_label">Option Label</Label>
              <Input
                type="text"
                id="option_label"
                value={optionData.option_label}
                onChange={(e) => setOptionData({...optionData, option_label: e.target.value})}
                placeholder="Additional description (optional)"
              />
            </FormGroup>
            
            <FormGroup>
              <Label for="sort_order">Sort Order</Label>
              <Input
                type="number"
                id="sort_order"
                value={optionData.sort_order}
                onChange={(e) => setOptionData({...optionData, sort_order: parseInt(e.target.value)})}
                placeholder="0"
              />
            </FormGroup>
            
            <FormGroup check>
              <Label check>
                <Input
                  type="checkbox"
                  checked={optionData.is_default}
                  onChange={(e) => setOptionData({...optionData, is_default: e.target.checked})}
                />
                Set as default option
              </Label>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setOptionModal(false)}>
            Cancel
          </Button>
          <Button 
            color={editMode ? "warning" : "primary"}
            onClick={editMode ? handleUpdateOption : handleCreateOption}
            disabled={!optionData.display_text || !optionData.value || !optionData.form_item_uuid || loading}
          >
            {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Option' : 'Create Option')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal isOpen={imageModal} toggle={() => setImageModal(false)} size="lg">
        <ModalHeader toggle={() => setImageModal(false)}>
          Store Images ({selectedImages.length})
        </ModalHeader>
        <ModalBody>
          {selectedImages.length > 0 ? (
            <Row>
              {selectedImages.map((imageUrl, index) => (
                <Col md="6" key={index} className="mb-3">
                  <Card>
                    <CardBody className="p-2">
                      <img 
                        src={imageUrl} 
                        alt={`Store image ${index + 1}`}
                        className="img-fluid rounded"
                        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNHB4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                      <div className="mt-2">
                        <small className="text-muted">Image {index + 1}</small>
                        <br />
                        <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                          <i className="fas fa-external-link-alt me-1"></i>
                          Open Full Size
                        </a>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center text-muted">
              <p>No images to display</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setImageModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default FormOptions;
