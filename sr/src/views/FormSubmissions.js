import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Row,
  Col,
  Button,
  Alert,
  Input,
  Form,
  FormGroup,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Enhanced CSS Styles for Drag and Drop
const enhancedDragDropCSS = `
/* === ENHANCED DRAG AND DROP STYLES === */
.droppable-area {
  min-height: 100px;
  transition: all 0.3s ease;
}

.droppable-area.drag-over {
  background-color: #e3f2fd;
  border: 2px dashed #2196f3;
  border-radius: 8px;
  transform: scale(1.01);
}

.droppable-area.reorder-mode {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.draggable-field {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.draggable-field.dragging {
  opacity: 0.8;
  transform: rotate(3deg) scale(1.05);
  z-index: 1000;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 2px solid #007bff;
}

.drag-handle {
  cursor: grab;
  padding: 8px 12px;
  background: linear-gradient(45deg, #007bff, #0056b3);
  color: white;
  border-radius: 6px;
  text-align: center;
  min-width: 40px;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.drag-handle:hover {
  background: linear-gradient(45deg, #0056b3, #004085);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
}

.drag-handle:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.reorder-header {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #2196f3;
  margin: -10px -10px 15px -10px;
}

.reorder-toggle-btn {
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 25px;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.9rem;
}

.reorder-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.reorder-toggle-btn.active {
  background: linear-gradient(45deg, #28a745, #20c997);
  border-color: #28a745;
  animation: pulse-success 2s infinite;
}

@keyframes pulse-success {
  0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
  100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
}

.section-item {
  border-left: 4px solid #6c757d;
  padding-left: 15px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 0 8px 8px 0;
}

.form-field-item {
  position: relative;
}

.form-field-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.section-header-container {
  position: relative;
}

/* Enhanced drag feedback */
.draggable-field:not(.dragging):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* Smooth transitions for all interactive elements */
.badge, .btn, .form-control, .form-select {
  transition: all 0.2s ease;
}

/* Special styling for drag mode */
.droppable-area.reorder-mode .form-field-item {
  border: 2px dashed transparent;
  transition: all 0.3s ease;
}

.droppable-area.reorder-mode .form-field-item:hover {
  border-color: #007bff;
  background-color: #f8f9ff;
}

/* Drop zone indicators */
.droppable-area.drag-over::before {
  content: "Drop question here";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #2196f3;
  font-weight: bold;
  font-size: 1.2rem;
  z-index: 10;
  pointer-events: none;
  opacity: 0.8;
}

/* Success animation for completed reorder */
@keyframes reorder-success {
  0% { background-color: #d4edda; }
  50% { background-color: #c3e6cb; }
  100% { background-color: transparent; }
}

.draggable-field.reorder-success {
  animation: reorder-success 1s ease-out;
}

/* Mobile responsiveness for drag handles */
@media (max-width: 768px) {
  .drag-handle {
    padding: 6px 10px;
    font-size: 1rem;
    min-width: 35px;
  }
  
  .reorder-header {
    margin: -5px -5px 10px -5px;
    padding: 8px;
  }
  
  .reorder-toggle-btn {
    padding: 8px 16px;
    font-size: 0.8rem;
  }
}

/* === END ENHANCED DRAG AND DROP STYLES === */
`;

// Inject the CSS into the document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = enhancedDragDropCSS;
  document.head.appendChild(styleElement);
}
import { 
  formService,
  formItemService,
  formSubmissionService,
  formResponseService
} from '../services/apiServices';
import { useAuth } from '../contexts/AuthContext';

// Professional styling for enhanced form submission experience
const formSubmissionStyles = `
  .field-number {
    font-size: 0.75rem;
    min-width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .badge-field-type {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  
  .badge-required {
    animation: pulse 2s infinite;
  }
  
  .badge-conditional {
    position: relative;
    overflow: hidden;
  }
  
  .badge-conditional::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: shine 3s infinite;
  }
  
  /* Drag and Drop Styles */
  .drag-handle {
    cursor: grab;
    color: #6c757d;
    padding: 0.5rem;
    margin-right: 0.5rem;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
  }
  
  .drag-handle:hover {
    background: #e9ecef;
    color: #495057;
    transform: scale(1.1);
  }
  
  .drag-handle:active {
    cursor: grabbing;
    background: #007bff;
    color: white;
  }
  
  .draggable-field {
    transition: all 0.2s ease;
    position: relative;
  }
  
  .draggable-field.dragging {
    transform: rotate(3deg);
    box-shadow: 0 8px 25px rgba(0,0,0,0.2) !important;
    z-index: 1000;
    background: white !important;
  }
  
  .droppable-area {
    min-height: 100px;
    transition: all 0.3s ease;
  }
  
  .droppable-area.drag-over {
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border: 2px dashed #2196f3;
    border-radius: 0.75rem;
  }
  
  .drag-indicator {
    height: 4px;
    background: linear-gradient(90deg, #007bff, #28a745);
    border-radius: 2px;
    margin: 0.5rem 0;
    opacity: 0;
    transform: scaleX(0);
    transition: all 0.3s ease;
  }
  
  .drag-indicator.active {
    opacity: 1;
    transform: scaleX(1);
  }
  
  .reorder-mode .form-field-item {
    border: 2px dashed #dee2e6 !important;
    background: #f8f9fa !important;
  }
  
  .reorder-mode .form-field-item:hover {
    border-color: #007bff !important;
    background: white !important;
  }
  
  .reorder-toggle-btn {
    background: linear-gradient(45deg, #17a2b8, #138496);
    border: none;
    border-radius: 20px;
    padding: 0.5rem 1rem;
    color: white;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
  }
  
  .reorder-toggle-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(23, 162, 184, 0.4);
  }
  
  .reorder-toggle-btn.active {
    background: linear-gradient(45deg, #28a745, #1e7e34);
    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes shine {
    0% { left: -100%; }
    100% { left: 100%; }
  }
  
  .form-field-item {
    transition: all 0.3s ease;
  }
  
  .form-field-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
  }
  
  .section-header-display {
    position: relative;
    margin: 2rem 0;
  }
  
  .section-header-display::before,
  .section-header-display::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #007bff, #6c757d, #007bff);
  }
  
  .section-header-display::before {
    top: 0;
  }
  
  .section-header-display::after {
    bottom: 0;
  }
  
  .scale-container {
    padding: 1rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
  }
  
  .scale-option {
    flex: 1;
    max-width: 60px;
  }
  
  .scale-circle {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    border: 2px solid #dee2e6;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    font-weight: bold;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .scale-circle:hover {
    border-color: #007bff;
    background: #f8f9fa;
    transform: scale(1.1);
  }
  
  .scale-label input:checked + .scale-circle {
    border-color: #007bff;
    background: #007bff;
    color: white;
    transform: scale(1.15);
  }
  
  .rating-container {
    padding: 1rem;
    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
    border-radius: 0.5rem;
    border: 1px solid #ffeaa7;
  }
  
  .rating-btn {
    transition: all 0.2s ease;
  }
  
  .rating-btn:hover {
    transform: scale(1.2);
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  }
  
  .field-input-container .form-control:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    transform: scale(1.02);
    transition: all 0.2s ease;
  }
  
  .field-error {
    animation: shake 0.5s ease-in-out;
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  .field-value-preview {
    font-family: 'Courier New', monospace;
    position: relative;
    overflow: hidden;
  }
  
  .field-value-preview::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: valueShine 2s infinite;
  }
  
  @keyframes valueShine {
    0% { left: -100%; }
    100% { left: 100%; }
  }
  
  .conditional-fields-container {
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border: 2px dashed #2196f3;
    border-radius: 0.75rem;
    position: relative;
    overflow: hidden;
  }
  
  .conditional-fields-container::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #2196f3, #21cbf3, #2196f3);
    z-index: -1;
    border-radius: 0.75rem;
    animation: borderFlow 3s linear infinite;
  }
  
  @keyframes borderFlow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  .table-grid {
    background: white;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .table-grid th {
    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
    color: white;
    font-weight: 600;
    text-align: center;
    padding: 0.75rem 0.5rem;
  }
  
  .table-grid td {
    padding: 0.75rem 0.5rem;
    text-align: center;
    vertical-align: middle;
    border-color: #dee2e6;
  }
  
  .table-grid tbody tr:hover {
    background-color: #f8f9fa;
  }
  
  .debug-section {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 1px solid #dee2e6;
    border-radius: 0.75rem;
    position: relative;
  }
  
  .debug-section::before {
    content: '🔧';
    position: absolute;
    top: -10px;
    left: 20px;
    background: #f8f9fa;
    padding: 0 0.5rem;
    font-size: 1.2rem;
  }
  
  @media (max-width: 768px) {
    .field-number {
      min-width: 20px;
      height: 20px;
      font-size: 0.65rem;
    }
    
    .badge-field-type {
      font-size: 0.6rem;
    }
    
    .scale-circle {
      width: 30px;
      height: 30px;
      font-size: 0.8rem;
    }
    
    .rating-btn {
      font-size: 1.2rem;
      padding: 0.15rem 0.3rem;
    }
    
    .drag-handle {
      padding: 0.25rem;
      margin-right: 0.25rem;
    }
  }
`;

// Inject styles into the document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = formSubmissionStyles;
  
  // Remove existing style if it exists
  const existingStyle = document.getElementById('form-submission-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  styleSheet.id = 'form-submission-styles';
  document.head.appendChild(styleSheet);
}

const FormSubmissions = () => {
  const { user } = useAuth(); // Get authenticated user
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formItems, setFormItems] = useState([]);
  const [responses, setResponses] = useState({});
  const [conditionallyVisibleFields, setConditionallyVisibleFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [gpsCoordinates, setGpsCoordinates] = useState({ latitude: null, longitude: null });
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle', 'requesting', 'success', 'error'
  
  // Drag and Drop states
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [currentCameraItemUuid, setCurrentCameraItemUuid] = useState(null);

  // Load forms on component mount
  useEffect(() => {
    loadForms();
  }, []);

  // Load form items when a form is selected
  useEffect(() => {
    if (selectedForm) {
      loadFormData();
    }
  }, [selectedForm]);

  // Initialize conditional field visibility when form items change
  useEffect(() => {
    if (formItems.length > 0) {
      initializeConditionalFieldVisibility();
      
      // Auto-populate GPS fields if coordinates are already available
      if (gpsStatus === 'success' && gpsCoordinates.latitude !== null && gpsCoordinates.longitude !== null) {
        autoPopulateGPSFields(gpsCoordinates.latitude, gpsCoordinates.longitude);
      }
    }
  }, [formItems, gpsStatus, gpsCoordinates]);

  // Request GPS coordinates when form is loaded
  useEffect(() => {
    if (selectedForm && formItems.length > 0) {
      requestGPSCoordinates();
    }
  }, [selectedForm, formItems]);

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const requestGPSCoordinates = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    setGpsStatus('requesting');
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('🌍 Raw GPS coordinates:', { latitude, longitude });
        setGpsCoordinates({
          latitude: latitude,
          longitude: longitude
        });
        setGpsStatus('success');
        console.log('🌍 GPS coordinates stored:', { 
          latitude: latitude, 
          longitude: longitude 
        });
        
        // Auto-populate any existing latitude/longitude form fields
        if (formItems.length > 0) {
          autoPopulateGPSFields(latitude, longitude);
        }
      },
      (error) => {
        setGpsStatus('error');
        console.warn('Error getting GPS coordinates:', error.message);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.warn('User denied the request for Geolocation.');
            break;
          case error.POSITION_UNAVAILABLE:
            console.warn('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            console.warn('The request to get user location timed out.');
            break;
          default:
            console.warn('An unknown error occurred.');
            break;
        }
      },
      options
    );
  };

  const initializeConditionalFieldVisibility = () => {
    const initialVisibility = {};
    
    formItems.forEach(item => {
      if (item.item_type === 'select' && item.conditional_fields) {
        try {
          const conditionalFields = JSON.parse(item.conditional_fields || '{}');
          Object.keys(conditionalFields).forEach(optionValue => {
            if (conditionalFields[optionValue]) {
              conditionalFields[optionValue].forEach(field => {
                initialVisibility[`${item.uuid}_${optionValue}_${field.id}`] = false;
              });
            }
          });
        } catch (error) {
          console.warn('Error initializing conditional fields for item:', item.uuid, error);
        }
      }
    });
    
    setConditionallyVisibleFields(initialVisibility);
  };

  const loadForms = async () => {
    try {
      setLoading(true);
      const response = await formService.getAll();
      if (response.status === 'success') {
        setForms(response.data);
        // Auto-select "Visite" form if it exists
        const visiteForm = response.data.find(form => 
          form.title && form.title.toLowerCase().includes('visite')
        );
        if (visiteForm) {
          setSelectedForm(visiteForm);
        } else if (response.data.length > 0) {
          setSelectedForm(response.data[0]);
        }
      }
    } catch (error) {
      setError('Failed to load forms: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    if (!selectedForm) return;
    
    try {
      setLoading(true);
      
      // Load form items
      const itemsResponse = await formItemService.getByForm(selectedForm.uuid);
      
      if (itemsResponse.status === 'success') {
        const items = itemsResponse.data.sort((a, b) => a.sort_order - b.sort_order);
        setFormItems(items);
        
        // Log conditional fields for debugging
        console.log('📋 Loaded form items with conditional fields:', items.map(item => ({
          uuid: item.uuid,
          question: item.question,
          type: item.item_type,
          hasConditionalFields: !!item.conditional_fields,
          conditionalFieldsLength: item.conditional_fields ? Object.keys(JSON.parse(item.conditional_fields || '{}')).length : 0
        })));
        
        // Initialize responses and conditional fields
        setResponses({});
        setConditionallyVisibleFields({});
        setValidationErrors({});
      }
    } catch (error) {
      setError('Failed to load form items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (itemUuid, value, valueType = 'text') => {
    setResponses(prev => ({
      ...prev,
      [itemUuid]: {
        value,
        valueType,
        form_item_uuid: itemUuid
      }
    }));

    // Clear validation error for this field
    if (validationErrors[itemUuid]) {
      setValidationErrors(prev => ({
        ...prev,
        [itemUuid]: null
      }));
    }

    // Update conditional field visibility for dropdown fields
    const item = formItems.find(item => item.uuid === itemUuid);
    if (item && item.item_type === 'select' && item.conditional_fields) {
      updateConditionalFieldVisibility(item, value);
    }
  };

  // Auto-populate GPS coordinate fields in the form
  const autoPopulateGPSFields = (latitude, longitude) => {
    console.log('🌍 Auto-populating GPS fields with:', { latitude, longitude });
    
    formItems.forEach(item => {
      if (item.question) {
        const question = item.question.toLowerCase();
        
        // Check for latitude fields (more comprehensive pattern matching)
        if (question.includes('latitude') || question.includes('lat ') || question.includes('lat.') || 
            question.includes('coordonnée latitude') || question.includes('coord lat') ||
            question.includes('géolocalisation lat') || question.includes('position lat')) {
          console.log(`📍 Found latitude field: ${item.question} (${item.uuid})`);
          handleInputChange(item.uuid, latitude, 'number');
        }
        
        // Check for longitude fields (more comprehensive pattern matching)
        if (question.includes('longitude') || question.includes('lng ') || question.includes('lng.') || 
            question.includes('long ') || question.includes('long.') || 
            question.includes('coordonnée longitude') || question.includes('coord lng') ||
            question.includes('géolocalisation lng') || question.includes('position lng')) {
          console.log(`📍 Found longitude field: ${item.question} (${item.uuid})`);
          handleInputChange(item.uuid, longitude, 'number');
        }
        
        // Check for combined GPS coordinate fields
        if (question.includes('coordonnées') || question.includes('coordinates') || 
            question.includes('géolocalisation') || question.includes('gps') ||
            question.includes('position géographique')) {
          console.log(`📍 Found combined GPS field: ${item.question} (${item.uuid})`);
          handleInputChange(item.uuid, `${latitude}, ${longitude}`, 'text');
        }
      }
    });
  };

  const updateConditionalFieldVisibility = (item, selectedValue) => {
    console.log('🔍 Updating conditional field visibility:', {
      itemUuid: item.uuid,
      itemQuestion: item.question,
      selectedValue,
      conditionalFields: item.conditional_fields
    });
    
    try {
      const conditionalFields = JSON.parse(item.conditional_fields || '{}');
      console.log('📝 Parsed conditional fields:', conditionalFields);
      
      setConditionallyVisibleFields(prev => {
        const newVisibleFields = { ...prev };
        
        // Hide all conditional fields for this item first
        Object.keys(conditionalFields).forEach(optionValue => {
          if (conditionalFields[optionValue]) {
            conditionalFields[optionValue].forEach(field => {
              const fieldKey = `${item.uuid}_${optionValue}_${field.id}`;
              newVisibleFields[fieldKey] = false;
              console.log(`🙈 Hiding field: ${fieldKey}`);
            });
          }
        });
        
        // Show conditional fields for the selected value
        // Handle various possible values including case-insensitive matching
        let matchedKey = null;
        
        // First try exact match
        if (selectedValue && conditionalFields[selectedValue]) {
          matchedKey = selectedValue;
        } else if (selectedValue) {
          // Try case-insensitive match
          const lowerSelectedValue = selectedValue.toLowerCase();
          matchedKey = Object.keys(conditionalFields).find(key => 
            key.toLowerCase() === lowerSelectedValue
          );
          
          // Try partial match for common variations
          if (!matchedKey) {
            matchedKey = Object.keys(conditionalFields).find(key => {
              const lowerKey = key.toLowerCase();
              const lowerValue = lowerSelectedValue;
              return lowerKey.includes(lowerValue) || lowerValue.includes(lowerKey);
            });
          }
        }
        
        if (matchedKey && conditionalFields[matchedKey]) {
          console.log(`🎯 Found matching key: "${matchedKey}" for selected value: "${selectedValue}"`);
          conditionalFields[matchedKey].forEach(field => {
            const fieldKey = `${item.uuid}_${matchedKey}_${field.id}`;
            newVisibleFields[fieldKey] = true;
            console.log(`👁️ Showing field: ${fieldKey}`, field);
          });
        } else {
          console.log(`❌ No matching conditional fields found for: "${selectedValue}"`);
          console.log('Available keys:', Object.keys(conditionalFields));
        }
        
        console.log('🎯 Final visible fields state:', newVisibleFields);
        return newVisibleFields;
      });
    } catch (error) {
      console.warn('Error processing conditional fields:', error);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result) => {
    setIsDragging(false);
    
    const { destination, source, draggableId } = result;

    // If dropped outside the list or in the same position, do nothing
    if (!destination || 
        (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    console.log('🎯 Drag end result:', {
      source: source.index,
      destination: destination.index,
      draggableId
    });

    // Reorder the formItems array
    const newFormItems = Array.from(formItems);
    const [reorderedItem] = newFormItems.splice(source.index, 1);
    newFormItems.splice(destination.index, 0, reorderedItem);

    // Update the form items with new order
    setFormItems(newFormItems);

    // Show success message
    setSuccess(`Question "${reorderedItem.question}" moved successfully!`);
    setTimeout(() => setSuccess(null), 3000);

    console.log('✅ Form items reordered:', newFormItems.map((item, index) => ({
      index,
      question: item.question,
      uuid: item.uuid
    })));
  };

  const toggleReorderMode = () => {
    setIsReorderMode(!isReorderMode);
    if (!isReorderMode) {
      setSuccess('Reorder mode enabled! Drag questions to rearrange them.');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setSuccess('Reorder mode disabled. Questions saved in new order.');
      setTimeout(() => setSuccess(null), 3000);
    }
  };
  const handleCameraCapture = (itemUuid) => {
    setCurrentCameraItemUuid(itemUuid);
    startCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Use back camera for form submissions
        audio: false 
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Error accessing camera. Please allow camera access or check that your camera is working.');
    }
  };

  const capturePhoto = () => {
    if (cameraStream && currentCameraItemUuid) {
      const video = document.getElementById('camera-video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        // Create a unique filename for the captured image
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `camera_${timestamp}.jpg`;
        
        // For camera type, we store the file URL in file_url column
        handleInputChange(currentCameraItemUuid, filename, 'file_url');
        
        // In a real application, you would upload the blob to a server here
        console.log('Camera photo captured:', {
          blob,
          filename,
          itemUuid: currentCameraItemUuid,
          size: blob.size,
          type: blob.type
        });
        
        // You could also create a preview URL if needed
        // const previewUrl = URL.createObjectURL(blob);
        // console.log('Preview URL:', previewUrl);
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
    setCurrentCameraItemUuid(null);
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate main form items
    formItems.forEach(item => {
      if (item.required) {
        const response = responses[item.uuid];
        if (!response || !response.value || response.value.toString().trim() === '') {
          errors[item.uuid] = 'This field is required';
        }
      }
    });

    // Validate conditional fields that are currently visible
    formItems.forEach(item => {
      if (item.item_type === 'select' && item.conditional_fields) {
        try {
          const conditionalFields = JSON.parse(item.conditional_fields || '{}');
          const selectedValue = responses[item.uuid]?.value;
          
          if (selectedValue && conditionalFields[selectedValue]) {
            conditionalFields[selectedValue].forEach(field => {
              const fieldKey = `${item.uuid}_${selectedValue}_${field.id}`;
              const isVisible = conditionallyVisibleFields[fieldKey];
              const response = responses[fieldKey];
              
              if (isVisible && field.required && (!response || !response.value || response.value.toString().trim() === '')) {
                errors[fieldKey] = 'This field is required';
              }
            });
          }
        } catch (error) {
          console.warn('Error validating conditional fields:', error);
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // Debug GPS coordinates
      console.log('🌍 GPS Coordinates before submission:', gpsCoordinates);
      console.log('🌍 GPS Status:', gpsStatus);
      
      // Step 1: Create form submission (VisiteHarder) with updated field names
      const submissionData = {
        form_uuid: selectedForm.uuid,
        submitter_name: user?.fullname || user?.name || 'Form Viewer',
        submitter_email: user?.email || 'user@example.com',
        status: 'submitted',
        // Include user information if available
        ...(user?.uuid && { user_uuid: user.uuid }),
        ...(user?.country_uuid && { country_uuid: user.country_uuid }),
        ...(user?.province_uuid && { province_uuid: user.province_uuid }),
        ...(user?.area_uuid && { area_uuid: user.area_uuid }),
        // Add signature if available
        ...(user?.signature && { signature: user.signature })
      };

      console.log('📝 Creating form submission with data:', submissionData);

      const submissionResponse = await formSubmissionService.create(submissionData);
      console.log('📝 Form submission response:', submissionResponse);
      
      if (submissionResponse.status === 'success') {
        const submissionUuid = submissionResponse.data.uuid;
        console.log('✅ Form submission created with UUID:', submissionUuid);
        
        // Step 2: Prepare all form responses for bulk submission
        const formResponses = [];
        
        // Process main form fields and conditional fields
        for (const [itemUuid, responseData] of Object.entries(responses)) {
          if (responseData.value !== null && responseData.value !== undefined && responseData.value.toString().trim() !== '') {
            
            let actualFormItemUuid = itemUuid;
            let entryLabel = null;
            
            // Handle conditional fields vs regular fields
            if (itemUuid.includes('_')) {
              // This is a conditional field - extract the parent item UUID
              const parts = itemUuid.split('_');
              if (parts.length >= 3) {
                // Format: parentUuid_selectedValue_fieldId
                const parentUuid = parts[0];
                const selectedValue = parts[1];
                const fieldId = parts[parts.length - 1];
                
                // Use the parent form item UUID for conditional fields
                actualFormItemUuid = parentUuid;
                entryLabel = `Conditional Field (${selectedValue}): ${fieldId}`;
                
                console.log('🔗 Processing conditional field:', {
                  originalKey: itemUuid,
                  parentUuid,
                  selectedValue,
                  fieldId,
                  entryLabel
                });
              }
            }

            // Create response payload with updated backend field names
            const responsePayload = {
              visite_harder_uuid: submissionUuid,
              form_item_uuid: actualFormItemUuid,
              // Include user information for easier querying (as per backend model)
              ...(user?.uuid && { user_uuid: user.uuid }),
              ...(user?.country_uuid && { country_uuid: user.country_uuid }),
              ...(user?.province_uuid && { province_uuid: user.province_uuid }),
              ...(user?.area_uuid && { area_uuid: user.area_uuid }),
              // Add entry label if it's a conditional field
              ...(entryLabel && { entry_label: entryLabel }),
              // Add GPS coordinates to each response if available
              ...(gpsCoordinates.latitude !== null && gpsCoordinates.longitude !== null && 
                  typeof gpsCoordinates.latitude === 'number' && typeof gpsCoordinates.longitude === 'number' && 
                  !isNaN(gpsCoordinates.latitude) && !isNaN(gpsCoordinates.longitude) && {
                latitude: gpsCoordinates.latitude,
                longitude: gpsCoordinates.longitude
              })
            };

            // Set the appropriate value field based on type with proper type conversion
            const value = responseData.value;
            switch (responseData.valueType) {
              case 'number':
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                  responsePayload.number_value = numValue;
                } else {
                  console.warn(`Invalid number value for ${itemUuid}:`, value);
                  responsePayload.text_value = value.toString();
                }
                break;
              case 'boolean':
                // Handle various boolean representations
                if (typeof value === 'boolean') {
                  responsePayload.boolean_value = value;
                } else if (typeof value === 'string') {
                  responsePayload.boolean_value = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
                } else {
                  responsePayload.boolean_value = Boolean(value);
                }
                break;
              case 'date':
                // Ensure proper date format
                if (value instanceof Date) {
                  responsePayload.date_value = value.toISOString().split('T')[0];
                } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                  responsePayload.date_value = value;
                } else {
                  console.warn(`Invalid date value for ${itemUuid}:`, value);
                  responsePayload.text_value = value.toString();
                }
                break;
              case 'file_url':
                // For camera and file uploads, store in file_url column
                responsePayload.file_url = value.toString();
                break;
              default:
                responsePayload.text_value = value.toString();
            }

            console.log('📝 Adding response to bulk submission:', {
              itemUuid: actualFormItemUuid,
              originalKey: itemUuid,
              responsePayload,
              originalValue: value,
              valueType: responseData.valueType
            });

            formResponses.push(responsePayload);
          }
        }

        // Auto-add GPS coordinates as dedicated responses if we have latitude/longitude form fields
        if (gpsCoordinates.latitude !== null && gpsCoordinates.longitude !== null && 
            typeof gpsCoordinates.latitude === 'number' && typeof gpsCoordinates.longitude === 'number' && 
            !isNaN(gpsCoordinates.latitude) && !isNaN(gpsCoordinates.longitude)) {
          
          console.log('🌍 Processing GPS coordinates for form fields');
          
          // Check if there are existing latitude/longitude form items
          const latitudeItem = formItems.find(item => 
            item.question && (
              item.question.toLowerCase().includes('latitude') || 
              item.question.toLowerCase().includes('lat') ||
              item.question.toLowerCase().includes('coordonnée latitude') ||
              item.question.toLowerCase().includes('coord lat')
            )
          );
          
          const longitudeItem = formItems.find(item => 
            item.question && (
              item.question.toLowerCase().includes('longitude') || 
              item.question.toLowerCase().includes('lng') ||
              item.question.toLowerCase().includes('long') ||
              item.question.toLowerCase().includes('coordonnée longitude') ||
              item.question.toLowerCase().includes('coord lng')
            )
          );

          console.log('🌍 Found GPS form fields:', { latitudeItem, longitudeItem });

          // Add latitude response if field exists and wasn't already filled by user
          if (latitudeItem && !responses[latitudeItem.uuid]) {
            formResponses.push({
              visite_harder_uuid: submissionUuid,
              form_item_uuid: latitudeItem.uuid,
              number_value: gpsCoordinates.latitude,
              entry_label: 'Auto-captured GPS Latitude',
              latitude: gpsCoordinates.latitude,
              longitude: gpsCoordinates.longitude,
              ...(user?.uuid && { user_uuid: user.uuid }),
              ...(user?.country_uuid && { country_uuid: user.country_uuid }),
              ...(user?.province_uuid && { province_uuid: user.province_uuid }),
              ...(user?.area_uuid && { area_uuid: user.area_uuid })
            });
            console.log('🌍 Added latitude GPS response');
          }

          // Add longitude response if field exists and wasn't already filled by user
          if (longitudeItem && !responses[longitudeItem.uuid]) {
            formResponses.push({
              visite_harder_uuid: submissionUuid,
              form_item_uuid: longitudeItem.uuid,
              number_value: gpsCoordinates.longitude,
              entry_label: 'Auto-captured GPS Longitude',
              latitude: gpsCoordinates.latitude,
              longitude: gpsCoordinates.longitude,
              ...(user?.uuid && { user_uuid: user.uuid }),
              ...(user?.country_uuid && { country_uuid: user.country_uuid }),
              ...(user?.province_uuid && { province_uuid: user.province_uuid }),
              ...(user?.area_uuid && { area_uuid: user.area_uuid })
            });
            console.log('🌍 Added longitude GPS response');
          }
        }

        // Step 3: Submit all responses using bulk endpoint
        if (formResponses.length > 0) {
          console.log('💾 Submitting bulk responses:', formResponses);
          
          const bulkPayload = {
            visite_harder_uuid: submissionUuid,
            responses: formResponses
          };

          try {
            // Use the bulk endpoint from the updated backend API
            const bulkResponse = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/public/form-responses/bulk`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(localStorage.getItem('authToken') && {
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                })
              },
              body: JSON.stringify(bulkPayload)
            });

            const bulkResult = await bulkResponse.json();
            console.log('📦 Bulk response submission result:', bulkResult);

            if (bulkResult.status === 'success' || bulkResult.status === 'partial_success') {
              console.log('✅ Form responses submitted successfully');
              console.log(`📊 Created ${bulkResult.created_count} out of ${formResponses.length} responses`);
              
              if (bulkResult.errors && bulkResult.errors.length > 0) {
                console.warn('⚠️ Some responses had errors:', bulkResult.errors);
              }
            } else {
              throw new Error(bulkResult.message || 'Failed to submit form responses');
            }
          } catch (bulkError) {
            console.error('❌ Bulk submission failed, falling back to individual submissions:', bulkError);
            
            // Fallback: Submit responses individually
            for (const [index, response] of formResponses.entries()) {
              try {
                const responseResult = await formResponseService.create(response);
                console.log(`✅ Individual response ${index + 1} saved:`, responseResult);
              } catch (error) {
                console.error(`❌ Failed to save individual response ${index + 1}:`, error);
              }
            }
          }
        } else {
          console.log('📝 No form responses to submit');
        }

        setSuccess('Form submitted successfully!');
        setResponses({});
        setConditionallyVisibleFields({});
        setValidationErrors({});
        
        // Reset GPS coordinates for next submission
        setGpsCoordinates({ latitude: null, longitude: null });
        setGpsStatus('idle');
        
        // Re-request GPS for next submission
        setTimeout(() => {
          requestGPSCoordinates();
        }, 1000);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setError('Failed to submit form: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getFieldOptions = (item) => {
    if (!item.options || !['select', 'radio', 'checkbox'].includes(item.item_type)) {
      return [];
    }
    return item.options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
  };

  const renderFormField = (item) => {
    const options = getFieldOptions(item);
    const response = responses[item.uuid];
    const value = response?.value || '';
    const hasError = validationErrors[item.uuid];

    // Parse additional options for advanced field types
    let additionalOptions = {};
    try {
      if (item.additional_options) {
        additionalOptions = JSON.parse(item.additional_options);
      }
    } catch (error) {
      console.warn('Error parsing additional options for item:', item.uuid, error);
    }

    switch (item.item_type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={additionalOptions.placeholder || `Enter ${item.question.toLowerCase()}`}
            maxLength={additionalOptions.maxLength || undefined}
          />
        );

      case 'paragraph':
      case 'textarea':
        return (
          <Input
            type="textarea"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={additionalOptions.placeholder || `Enter ${item.question.toLowerCase()}`}
            rows={additionalOptions.rows || "4"}
            maxLength={additionalOptions.maxLength || undefined}
          />
        );

      case 'number':
      case 'integer':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'number')}
            invalid={!!hasError}
            placeholder={additionalOptions.placeholder || `Enter ${item.question.toLowerCase()}`}
            min={additionalOptions.min || undefined}
            max={additionalOptions.max || undefined}
            step={item.item_type === 'integer' ? '1' : (additionalOptions.step || 'any')}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={additionalOptions.placeholder || "Enter email address"}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={additionalOptions.placeholder || "Enter URL (https://...)"}
          />
        );

      case 'phone':
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={additionalOptions.placeholder || "Enter phone number"}
          />
        );

      case 'password':
        return (
          <Input
            type="password"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={additionalOptions.placeholder || "Enter password"}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'date')}
            invalid={!!hasError}
            min={additionalOptions.minDate || undefined}
            max={additionalOptions.maxDate || undefined}
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
          />
        );

      case 'datetime-local':
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
          />
        );

      case 'color':
        return (
          <div className="d-flex align-items-center gap-3">
            <Input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
              invalid={!!hasError}
              style={{ width: '60px', height: '40px' }}
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
              placeholder="Color value"
              style={{ flex: 1 }}
            />
          </div>
        );

      case 'range':
        return (
          <div>
            <div className="d-flex justify-content-between mb-2">
              <small className="text-muted">{additionalOptions.minLabel || additionalOptions.min || 0}</small>
              <strong className="text-primary">{value || additionalOptions.min || 0}</strong>
              <small className="text-muted">{additionalOptions.maxLabel || additionalOptions.max || 100}</small>
            </div>
            <Input
              type="range"
              value={value || additionalOptions.min || 0}
              onChange={(e) => handleInputChange(item.uuid, e.target.value, 'number')}
              invalid={!!hasError}
              min={additionalOptions.min || 0}
              max={additionalOptions.max || 100}
              step={additionalOptions.step || 1}
              className="form-range"
            />
          </div>
        );

      case 'linear-scale':
        const scaleMin = parseInt(additionalOptions.scaleMin) || 1;
        const scaleMax = parseInt(additionalOptions.scaleMax) || 5;
        const scaleArray = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i);
        
        return (
          <div>
            <div className="d-flex justify-content-between mb-3">
              <small className="text-muted fw-bold">{additionalOptions.scaleMinLabel || scaleMin}</small>
              <small className="text-muted fw-bold">{additionalOptions.scaleMaxLabel || scaleMax}</small>
            </div>
            <div className="d-flex justify-content-between align-items-center scale-container">
              {scaleArray.map((scaleValue) => (
                <div key={scaleValue} className="text-center scale-option">
                  <FormGroup check>
                    <Input
                      type="radio"
                      name={item.uuid}
                      value={scaleValue}
                      checked={parseInt(value) === scaleValue}
                      onChange={(e) => handleInputChange(item.uuid, parseInt(e.target.value), 'number')}
                      id={`scale_${item.uuid}_${scaleValue}`}
                    />
                    <Label for={`scale_${item.uuid}_${scaleValue}`} className="scale-label">
                      <div className="scale-circle">{scaleValue}</div>
                    </Label>
                  </FormGroup>
                </div>
              ))}
            </div>
          </div>
        );

      case 'rating':
        const maxRating = parseInt(additionalOptions.maxRating) || 5;
        const ratingType = additionalOptions.ratingType || 'stars';
        const ratingArray = Array.from({ length: maxRating }, (_, i) => i + 1);
        
        return (
          <div className="rating-container">
            <div className="d-flex gap-2 align-items-center">
              {ratingArray.map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={`btn rating-btn ${parseInt(value) >= rating ? 'rating-active' : 'rating-inactive'}`}
                  onClick={() => handleInputChange(item.uuid, rating, 'number')}
                  style={{
                    fontSize: '1.5rem',
                    padding: '0.25rem 0.5rem',
                    border: 'none',
                    background: 'transparent',
                    color: parseInt(value) >= rating ? '#ffc107' : '#dee2e6',
                    cursor: 'pointer'
                  }}
                >
                  {ratingType === 'hearts' ? '♥' : ratingType === 'thumbs' ? '👍' : '★'}
                </button>
              ))}
              {value && (
                <span className="ms-2 text-muted">
                  ({value}/{maxRating})
                </span>
              )}
            </div>
          </div>
        );

      case 'file':
        return (
          <div>
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleInputChange(item.uuid, file.name, 'file_url');
                  console.log('File selected:', file);
                }
              }}
              invalid={!!hasError}
              accept={additionalOptions.acceptedFileTypes || "*/*"}
              multiple={additionalOptions.allowMultiple || false}
            />
            {additionalOptions.maxFileSize && (
              <small className="text-muted mt-1 d-block">
                Max file size: {additionalOptions.maxFileSize}MB
              </small>
            )}
            {value && (
              <div className="mt-2">
                <small className="text-success">
                  <i className="fa fa-check-circle me-1"></i>
                  File selected: {value}
                </small>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div>
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleInputChange(item.uuid, file.name, 'file_url');
                  console.log('Image selected:', file);
                }
              }}
              invalid={!!hasError}
              accept="image/*"
            />
            {value && (
              <div className="mt-2">
                <small className="text-success">
                  <i className="fa fa-image me-1"></i>
                  Image selected: {value}
                </small>
              </div>
            )}
          </div>
        );

      case 'select':
      case 'dropdown':
        return (
          <div>
            <Input
              type="select"
              value={value}
              onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
              invalid={!!hasError}
            >
              <option value="">Select an option</option>
              {options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
              {additionalOptions.showOtherOption && (
                <option value="Other">Other...</option>
              )}
            </Input>
            
            {/* Show "Other" text input if selected */}
            {value === 'Other' && additionalOptions.showOtherOption && (
              <Input
                type="text"
                className="mt-2"
                placeholder="Please specify..."
                onChange={(e) => handleInputChange(item.uuid, `Other: ${e.target.value}`, 'text')}
              />
            )}
            
            {/* Render conditional fields if they exist and an option is selected */}
            {value && item.conditional_fields && renderConditionalFields(item, value)}
          </div>
        );

      case 'radio':
      case 'multiple-choice':
        return (
          <div>
            {options.map((option, index) => (
              <FormGroup check key={index} className="mb-2">
                <Label check className="d-flex align-items-center">
                  <Input
                    type="radio"
                    name={item.uuid}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
                    className="me-2"
                  />
                  <span>{option}</span>
                </Label>
              </FormGroup>
            ))}
            {additionalOptions.showOtherOption && (
              <FormGroup check className="mb-2">
                <Label check className="d-flex align-items-center">
                  <Input
                    type="radio"
                    name={item.uuid}
                    value="Other"
                    checked={value && value.startsWith('Other')}
                    onChange={(e) => handleInputChange(item.uuid, 'Other: ', 'text')}
                    className="me-2"
                  />
                  <span className="me-2">Other:</span>
                  {value && value.startsWith('Other') && (
                    <Input
                      type="text"
                      size="sm"
                      placeholder="Please specify..."
                      value={value.replace('Other: ', '')}
                      onChange={(e) => handleInputChange(item.uuid, `Other: ${e.target.value}`, 'text')}
                      style={{ width: '200px' }}
                    />
                  )}
                </Label>
              </FormGroup>
            )}
          </div>
        );

      case 'checkbox':
      case 'multiple-select':
        return (
          <div>
            {options.map((option, index) => {
              const currentValues = value ? value.split(',').map(v => v.trim()) : [];
              return (
                <FormGroup check key={index} className="mb-2">
                  <Label check className="d-flex align-items-center">
                    <Input
                      type="checkbox"
                      value={option}
                      checked={currentValues.includes(option)}
                      onChange={(e) => {
                        let newValues;
                        
                        if (e.target.checked) {
                          newValues = [...currentValues, option];
                        } else {
                          newValues = currentValues.filter(v => v !== option);
                        }
                        
                        handleInputChange(item.uuid, newValues.join(','), 'text');
                      }}
                      className="me-2"
                    />
                    <span>{option}</span>
                  </Label>
                </FormGroup>
              );
            })}
            {additionalOptions.showOtherOption && (
              <FormGroup check className="mb-2">
                <Label check className="d-flex align-items-center">
                  <Input
                    type="checkbox"
                    value="Other"
                    checked={value && value.includes('Other:')}
                    onChange={(e) => {
                      const currentValues = value ? value.split(',').map(v => v.trim()) : [];
                      let newValues;
                      
                      if (e.target.checked) {
                        newValues = [...currentValues.filter(v => !v.startsWith('Other:')), 'Other: '];
                      } else {
                        newValues = currentValues.filter(v => !v.startsWith('Other:'));
                      }
                      
                      handleInputChange(item.uuid, newValues.join(','), 'text');
                    }}
                    className="me-2"
                  />
                  <span className="me-2">Other:</span>
                  {value && value.includes('Other:') && (
                    <Input
                      type="text"
                      size="sm"
                      placeholder="Please specify..."
                      onChange={(e) => {
                        const currentValues = value ? value.split(',').map(v => v.trim()) : [];
                        const otherValues = currentValues.filter(v => !v.startsWith('Other:'));
                        const newValues = [...otherValues, `Other: ${e.target.value}`];
                        handleInputChange(item.uuid, newValues.join(','), 'text');
                      }}
                      style={{ width: '200px' }}
                    />
                  )}
                </Label>
              </FormGroup>
            )}
          </div>
        );

      case 'boolean':
      case 'yes-no':
        return (
          <div>
            <FormGroup check className="mb-2">
              <Label check className="d-flex align-items-center">
                <Input
                  type="radio"
                  name={item.uuid}
                  value="true"
                  checked={value === 'true' || value === true}
                  onChange={(e) => handleInputChange(item.uuid, true, 'boolean')}
                  className="me-2"
                />
                <span>{additionalOptions.yesLabel || 'Yes'}</span>
              </Label>
            </FormGroup>
            <FormGroup check className="mb-2">
              <Label check className="d-flex align-items-center">
                <Input
                  type="radio"
                  name={item.uuid}
                  value="false"
                  checked={value === 'false' || value === false}
                  onChange={(e) => handleInputChange(item.uuid, false, 'boolean')}
                  className="me-2"
                />
                <span>{additionalOptions.noLabel || 'No'}</span>
              </Label>
            </FormGroup>
          </div>
        );

      case 'grid':
        const gridRows = additionalOptions.gridRows || [];
        const gridColumns = additionalOptions.gridColumns || [];
        const gridValues = value ? JSON.parse(value || '{}') : {};
        
        return (
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}></th>
                  {gridColumns.map((column, index) => (
                    <th key={index} className="text-center" style={{ width: `${70/gridColumns.length}%` }}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="fw-bold">{row}</td>
                    {gridColumns.map((column, colIndex) => (
                      <td key={colIndex} className="text-center">
                        <Input
                          type="radio"
                          name={`${item.uuid}_${rowIndex}`}
                          value={column}
                          checked={gridValues[row] === column}
                          onChange={(e) => {
                            const newGridValues = { ...gridValues, [row]: e.target.value };
                            handleInputChange(item.uuid, JSON.stringify(newGridValues), 'text');
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'checkbox-grid':
        const checkboxGridRows = additionalOptions.gridRows || [];
        const checkboxGridColumns = additionalOptions.gridColumns || [];
        const checkboxGridValues = value ? JSON.parse(value || '{}') : {};
        
        return (
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}></th>
                  {checkboxGridColumns.map((column, index) => (
                    <th key={index} className="text-center" style={{ width: `${70/checkboxGridColumns.length}%` }}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {checkboxGridRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="fw-bold">{row}</td>
                    {checkboxGridColumns.map((column, colIndex) => (
                      <td key={colIndex} className="text-center">
                        <Input
                          type="checkbox"
                          checked={checkboxGridValues[row] && checkboxGridValues[row].includes(column)}
                          onChange={(e) => {
                            const rowValues = checkboxGridValues[row] || [];
                            let newRowValues;
                            
                            if (e.target.checked) {
                              newRowValues = [...rowValues, column];
                            } else {
                              newRowValues = rowValues.filter(val => val !== column);
                            }
                            
                            const newGridValues = { 
                              ...checkboxGridValues, 
                              [row]: newRowValues.length > 0 ? newRowValues : undefined 
                            };
                            
                            // Clean up empty arrays
                            Object.keys(newGridValues).forEach(key => {
                              if (!newGridValues[key] || newGridValues[key].length === 0) {
                                delete newGridValues[key];
                              }
                            });
                            
                            handleInputChange(item.uuid, JSON.stringify(newGridValues), 'text');
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'section-header':
      case 'page-break':
        return (
          <div className="section-header-display">
            <hr className="my-4" />
            <div className="text-center">
              <h5 className="text-primary mb-3">
                <i className="fa fa-bookmark me-2"></i>
                {item.question}
              </h5>
              {additionalOptions.description && (
                <p className="text-muted">{additionalOptions.description}</p>
              )}
            </div>
            <hr className="my-4" />
          </div>
        );

      case 'camera':
        return (
          <div>
            <Button
              color="primary"
              onClick={() => handleCameraCapture(item.uuid)}
              className="mb-2 me-2"
              size="lg"
            >
              <i className="fa fa-camera me-2"></i>
              Take Photo
            </Button>
            {value && (
              <div className="mt-2 p-2 bg-success bg-opacity-10 rounded">
                <small className="text-success">
                  <i className="fa fa-check-circle me-1"></i>
                  Photo captured: <strong>{value}</strong>
                </small>
              </div>
            )}
            {additionalOptions.description && (
              <small className="text-muted d-block mt-1">
                {additionalOptions.description}
              </small>
            )}
          </div>
        );

      case 'location':
        return (
          <div>
            <div className="d-flex gap-2 mb-2">
              <Button
                color="info"
                size="sm"
                onClick={() => {
                  if (gpsCoordinates.latitude && gpsCoordinates.longitude) {
                    const locationString = `${gpsCoordinates.latitude}, ${gpsCoordinates.longitude}`;
                    handleInputChange(item.uuid, locationString, 'text');
                  } else {
                    requestGPSCoordinates();
                  }
                }}
                disabled={gpsStatus === 'requesting'}
              >
                <i className="fa fa-map-marker me-1"></i>
                {gpsStatus === 'requesting' ? 'Getting Location...' : 'Use Current Location'}
              </Button>
            </div>
            <Input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
              invalid={!!hasError}
              placeholder="Enter location or use current location"
              readOnly={additionalOptions.autoCapture}
            />
            {gpsStatus === 'success' && gpsCoordinates.latitude && gpsCoordinates.longitude && (
              <small className="text-success mt-1 d-block">
                <i className="fa fa-check-circle me-1"></i>
                Current location: {gpsCoordinates.latitude.toFixed(6)}, {gpsCoordinates.longitude.toFixed(6)}
              </small>
            )}
          </div>
        );

      default:
        return (
          <div>
            <Input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
              invalid={!!hasError}
              placeholder={`Enter ${item.question.toLowerCase()}`}
            />
            <small className="text-warning mt-1 d-block">
              <i className="fa fa-exclamation-triangle me-1"></i>
              Unknown field type: {item.item_type}
            </small>
          </div>
        );
    }
  };

  const renderConditionalFields = (parentItem, selectedValue) => {
    try {
      const conditionalFields = JSON.parse(parentItem.conditional_fields || '{}');
      
      console.log('🎭 Rendering conditional fields for:', {
        parentItemUuid: parentItem.uuid,
        selectedValue,
        availableOptions: Object.keys(conditionalFields),
        fieldsForValue: conditionalFields[selectedValue]
      });
      
      if (!conditionalFields[selectedValue] || !Array.isArray(conditionalFields[selectedValue])) {
        console.log('❌ No conditional fields found for value:', selectedValue);
        return null;
      }

      const fieldsToShow = conditionalFields[selectedValue];
      if (fieldsToShow.length === 0) {
        console.log('📭 Empty conditional fields array for value:', selectedValue);
        return null;
      }

      return (
        <div className="conditional-fields-container mt-4 p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="mb-0 text-primary fw-bold">
              <i className="fa fa-sitemap me-2"></i>
              Conditional Questions for: 
              <span className="badge bg-primary ms-2">{selectedValue}</span>
            </h6>
            <small className="text-muted">
              <i className="fa fa-info-circle me-1"></i>
              {fieldsToShow.length} field{fieldsToShow.length !== 1 ? 's' : ''} shown
            </small>
          </div>
          
          <div className="conditional-fields-grid">
            {fieldsToShow.map((field) => {
              const fieldKey = `${parentItem.uuid}_${selectedValue}_${field.id}`;
              const isVisible = conditionallyVisibleFields[fieldKey];
              const response = responses[fieldKey];
              const value = response?.value || '';
              const hasError = validationErrors[fieldKey];

              console.log('🎨 Rendering conditional field:', {
                fieldKey,
                field,
                isVisible,
                hasValue: !!value
              });

              if (!isVisible) {
                console.log('🙈 Field not visible:', fieldKey);
                return null;
              }

              // Get field type color
              const getConditionalFieldTypeColor = (type) => {
                const colorMap = {
                  'text': 'primary',
                  'paragraph': 'primary', 
                  'textarea': 'primary',
                  'number': 'success',
                  'integer': 'success',
                  'email': 'info',
                  'url': 'info',
                  'phone': 'info',
                  'date': 'secondary',
                  'time': 'secondary',
                  'color': 'warning',
                  'range': 'success',
                  'linear-scale': 'success',
                  'rating': 'warning',
                  'file': 'dark',
                  'select': 'primary',
                  'dropdown': 'primary',
                  'radio': 'primary',
                  'multiple-choice': 'primary',
                  'checkbox': 'primary',
                  'multiple-select': 'primary',
                  'boolean': 'secondary',
                  'yes-no': 'secondary',
                  'grid': 'info'
                };
                return colorMap[type] || 'secondary';
              };

              const fieldTypeColor = getConditionalFieldTypeColor(field.type);

              return (
                <div key={fieldKey} className="conditional-field-item mb-4 p-3 bg-white rounded-3 border border-primary border-opacity-25 shadow-sm">
                  <div className="conditional-field-header mb-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Label className="fw-bold text-dark mb-0">
                        <i className="fa fa-arrow-right text-primary me-2"></i>
                        {field.label}
                        {field.required && (
                          <span className="text-danger ms-1" title="Required conditional field">
                            <i className="fa fa-asterisk" style={{ fontSize: '0.6rem' }}></i>
                          </span>
                        )}
                      </Label>
                    </div>
                    
                    {/* Conditional Field Badges */}
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      <span className={`badge bg-${fieldTypeColor} badge-field-type`} style={{ fontSize: '0.65rem' }}>
                        <i className="fa fa-cog me-1"></i>
                        {field.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      
                      {field.required && (
                        <span className="badge bg-danger badge-required" style={{ fontSize: '0.65rem' }}>
                          <i className="fa fa-exclamation-circle me-1"></i>
                          Required
                        </span>
                      )}
                      
                      {value && (
                        <span className="badge bg-success" style={{ fontSize: '0.65rem' }}>
                          <i className="fa fa-check-circle me-1"></i>
                          Answered
                        </span>
                      )}
                      
                      <span className="badge bg-info text-dark" style={{ fontSize: '0.65rem' }}>
                        <i className="fa fa-code-branch me-1"></i>
                        Conditional
                      </span>
                    </div>
                  </div>
                  
                  {/* Field Input */}
                  <div className="conditional-field-input">
                    {renderConditionalField(field, fieldKey, value, hasError)}
                    
                    {hasError && (
                      <div className="field-error mt-2 p-2 bg-danger bg-opacity-10 border border-danger rounded">
                        <small className="text-danger fw-bold">
                          <i className="fa fa-exclamation-triangle me-1"></i>
                          {hasError}
                        </small>
                      </div>
                    )}
                  </div>

                  {/* Conditional Field Value Preview */}
                  {value && (
                    <div className="field-value-preview mt-2 p-2 bg-info bg-opacity-10 border border-info rounded">
                      <small className="text-info">
                        <i className="fa fa-eye me-1"></i>
                        <strong>Value:</strong> 
                        <span className="ms-1 font-monospace">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : value.toString()}
                        </span>
                      </small>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Conditional Logic Summary */}
          <div className="mt-3 p-2 bg-primary bg-opacity-10 rounded">
            <small className="text-primary">
              <i className="fa fa-info-circle me-1"></i>
              <strong>Conditional Logic:</strong> These fields appear because you selected "{selectedValue}" above.
            </small>
          </div>
        </div>
      );
    } catch (error) {
      console.warn('Error rendering conditional fields:', error);
      return (
        <div className="mt-3 p-3 border rounded bg-warning">
          <small className="text-dark">
            <i className="fa fa-exclamation-triangle me-2"></i>
            Error loading conditional fields: {error.message}
          </small>
        </div>
      );
    }
  };

  const renderConditionalField = (field, fieldKey, value, hasError) => {
    const handleConditionalFieldChange = (newValue, valueType = 'text') => {
      setResponses(prev => ({
        ...prev,
        [fieldKey]: {
          value: newValue,
          valueType,
          // For conditional fields, we store the field key but the actual form_item_uuid 
          // will be processed during submission
          form_item_uuid: fieldKey
        }
      }));

      // Clear validation error
      if (validationErrors[fieldKey]) {
        setValidationErrors(prev => ({
          ...prev,
          [fieldKey]: null
        }));
      }
    };

    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            maxLength={field.maxLength || undefined}
          />
        );

      case 'paragraph':
      case 'textarea':
        return (
          <Input
            type="textarea"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            rows={field.rows || "3"}
            maxLength={field.maxLength || undefined}
          />
        );

      case 'number':
      case 'integer':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'number')}
            invalid={!!hasError}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            min={field.min || undefined}
            max={field.max || undefined}
            step={field.type === 'integer' ? '1' : (field.step || 'any')}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={field.placeholder || "Enter email address"}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={field.placeholder || "Enter URL (https://...)"}
          />
        );

      case 'phone':
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={field.placeholder || "Enter phone number"}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'date')}
            invalid={!!hasError}
            min={field.minDate || undefined}
            max={field.maxDate || undefined}
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
            invalid={!!hasError}
          />
        );

      case 'color':
        return (
          <div className="d-flex align-items-center gap-2">
            <Input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
              invalid={!!hasError}
              style={{ width: '50px', height: '35px' }}
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
              placeholder="Color value"
              style={{ flex: 1 }}
            />
          </div>
        );

      case 'range':
        return (
          <div>
            <div className="d-flex justify-content-between mb-2">
              <small className="text-muted">{field.minLabel || field.min || 0}</small>
              <strong className="text-primary">{value || field.min || 0}</strong>
              <small className="text-muted">{field.maxLabel || field.max || 100}</small>
            </div>
            <Input
              type="range"
              value={value || field.min || 0}
              onChange={(e) => handleConditionalFieldChange(e.target.value, 'number')}
              invalid={!!hasError}
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 1}
              className="form-range"
            />
          </div>
        );

      case 'linear-scale':
        const scaleMin = parseInt(field.scaleMin) || 1;
        const scaleMax = parseInt(field.scaleMax) || 5;
        const scaleArray = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i);
        
        return (
          <div>
            <div className="d-flex justify-content-between mb-2">
              <small className="text-muted fw-bold">{field.scaleMinLabel || scaleMin}</small>
              <small className="text-muted fw-bold">{field.scaleMaxLabel || scaleMax}</small>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              {scaleArray.map((scaleValue) => (
                <div key={scaleValue} className="text-center">
                  <FormGroup check>
                    <Input
                      type="radio"
                      name={fieldKey}
                      value={scaleValue}
                      checked={parseInt(value) === scaleValue}
                      onChange={(e) => handleConditionalFieldChange(parseInt(e.target.value), 'number')}
                      id={`scale_${fieldKey}_${scaleValue}`}
                    />
                    <Label for={`scale_${fieldKey}_${scaleValue}`} className="scale-label">
                      <div className="scale-circle">{scaleValue}</div>
                    </Label>
                  </FormGroup>
                </div>
              ))}
            </div>
          </div>
        );

      case 'rating':
        const maxRating = parseInt(field.maxRating) || 5;
        const ratingType = field.ratingType || 'stars';
        const ratingArray = Array.from({ length: maxRating }, (_, i) => i + 1);
        
        return (
          <div className="rating-container">
            <div className="d-flex gap-1 align-items-center">
              {ratingArray.map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={`btn rating-btn ${parseInt(value) >= rating ? 'rating-active' : 'rating-inactive'}`}
                  onClick={() => handleConditionalFieldChange(rating, 'number')}
                  style={{
                    fontSize: '1.2rem',
                    padding: '0.2rem 0.4rem',
                    border: 'none',
                    background: 'transparent',
                    color: parseInt(value) >= rating ? '#ffc107' : '#dee2e6',
                    cursor: 'pointer'
                  }}
                >
                  {ratingType === 'hearts' ? '♥' : ratingType === 'thumbs' ? '👍' : '★'}
                </button>
              ))}
              {value && (
                <span className="ms-2 small text-muted">
                  ({value}/{maxRating})
                </span>
              )}
            </div>
          </div>
        );

      case 'select':
      case 'dropdown':
        return (
          <Input
            type="select"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
            invalid={!!hasError}
          >
            <option value="">Select an option</option>
            {field.options && field.options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
            {field.showOtherOption && (
              <option value="Other">Other...</option>
            )}
          </Input>
        );

      case 'radio':
      case 'multiple-choice':
        return (
          <div>
            {field.options && field.options.map((option, index) => (
              <FormGroup check key={index} className="mb-2">
                <Label check className="d-flex align-items-center">
                  <Input
                    type="radio"
                    name={fieldKey}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
                    className="me-2"
                  />
                  <span>{option}</span>
                </Label>
              </FormGroup>
            ))}
            {field.showOtherOption && (
              <FormGroup check className="mb-2">
                <Label check className="d-flex align-items-center">
                  <Input
                    type="radio"
                    name={fieldKey}
                    value="Other"
                    checked={value && value.startsWith('Other')}
                    onChange={(e) => handleConditionalFieldChange('Other: ', 'text')}
                    className="me-2"
                  />
                  <span className="me-2">Other:</span>
                  {value && value.startsWith('Other') && (
                    <Input
                      type="text"
                      size="sm"
                      placeholder="Please specify..."
                      value={value.replace('Other: ', '')}
                      onChange={(e) => handleConditionalFieldChange(`Other: ${e.target.value}`, 'text')}
                      style={{ width: '150px' }}
                    />
                  )}
                </Label>
              </FormGroup>
            )}
          </div>
        );

      case 'checkbox':
      case 'multiple-select':
        return (
          <div>
            {field.options && field.options.map((option, index) => {
              const currentValues = value ? value.split(',').map(v => v.trim()) : [];
              return (
                <FormGroup check key={index} className="mb-2">
                  <Label check className="d-flex align-items-center">
                    <Input
                      type="checkbox"
                      value={option}
                      checked={currentValues.includes(option)}
                      onChange={(e) => {
                        let newValues;
                        
                        if (e.target.checked) {
                          newValues = [...currentValues, option];
                        } else {
                          newValues = currentValues.filter(v => v !== option);
                        }
                        
                        handleConditionalFieldChange(newValues.join(','), 'text');
                      }}
                      className="me-2"
                    />
                    <span>{option}</span>
                  </Label>
                </FormGroup>
              );
            })}
          </div>
        );

      case 'boolean':
      case 'yes-no':
        return (
          <div>
            <FormGroup check className="mb-2">
              <Label check className="d-flex align-items-center">
                <Input
                  type="radio"
                  name={fieldKey}
                  value="true"
                  checked={value === 'true' || value === true}
                  onChange={(e) => handleConditionalFieldChange(true, 'boolean')}
                  className="me-2"
                />
                <span>{field.yesLabel || 'Yes'}</span>
              </Label>
            </FormGroup>
            <FormGroup check className="mb-2">
              <Label check className="d-flex align-items-center">
                <Input
                  type="radio"
                  name={fieldKey}
                  value="false"
                  checked={value === 'false' || value === false}
                  onChange={(e) => handleConditionalFieldChange(false, 'boolean')}
                  className="me-2"
                />
                <span>{field.noLabel || 'No'}</span>
              </Label>
            </FormGroup>
          </div>
        );

      case 'file':
        return (
          <div>
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleConditionalFieldChange(file.name, 'file_url');
                  console.log('Conditional field file selected:', file);
                }
              }}
              invalid={!!hasError}
              accept={field.acceptedFileTypes || "*/*"}
            />
            {field.maxFileSize && (
              <small className="text-muted mt-1 d-block">
                Max file size: {field.maxFileSize}MB
              </small>
            )}
            {value && (
              <div className="mt-1">
                <small className="text-success">
                  <i className="fa fa-check-circle me-1"></i>
                  File: {value}
                </small>
              </div>
            )}
          </div>
        );

      case 'grid':
        const gridRows = field.gridRows || [];
        const gridColumns = field.gridColumns || [];
        const gridValues = value ? JSON.parse(value || '{}') : {};
        
        return (
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}></th>
                  {gridColumns.map((column, index) => (
                    <th key={index} className="text-center small" style={{ width: `${70/gridColumns.length}%` }}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="fw-bold small">{row}</td>
                    {gridColumns.map((column, colIndex) => (
                      <td key={colIndex} className="text-center">
                        <Input
                          type="radio"
                          name={`${fieldKey}_${rowIndex}`}
                          value={column}
                          checked={gridValues[row] === column}
                          onChange={(e) => {
                            const newGridValues = { ...gridValues, [row]: e.target.value };
                            handleConditionalFieldChange(JSON.stringify(newGridValues), 'text');
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="content">
      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <CardTitle tag="h4">
                  {selectedForm ? selectedForm.title : 'Form Submissions'}
                </CardTitle>
                {forms.length > 1 && (
                  <div style={{ width: '300px' }}>
                    <Input
                      type="select"
                      value={selectedForm?.uuid || ''}
                      onChange={(e) => {
                        const form = forms.find(f => f.uuid === e.target.value);
                        setSelectedForm(form);
                        setResponses({});
                        setConditionallyVisibleFields({});
                        setValidationErrors({});
                        setError(null);
                        setSuccess(null);
                        // Reset GPS coordinates when switching forms
                        setGpsCoordinates({ latitude: null, longitude: null });
                        setGpsStatus('idle');
                      }}
                    >
                      <option value="">Select a form</option>
                      {forms.map((form) => (
                        <option key={form.uuid} value={form.uuid}>
                          {form.title}
                        </option>
                      ))}
                    </Input>
                  </div>
                )}
              </div>
              {selectedForm && selectedForm.description && (
                <div className="mt-2">
                  <small className="text-muted">{selectedForm.description}</small>
                </div>
              )}
              {/* GPS Status Indicator */}
              <div className="mt-2 d-flex align-items-center">
                {gpsStatus === 'requesting' && (
                  <small className="text-info">
                    📍 Requesting location access...
                  </small>
                )}
                {gpsStatus === 'success' && gpsCoordinates.latitude !== null && gpsCoordinates.longitude !== null && (
                  <small className="text-success">
                    📍 Location captured: Lat: {gpsCoordinates.latitude.toFixed(6)}, 
                    Lng: {gpsCoordinates.longitude.toFixed(6)}
                    {formItems.some(item => 
                      item.question && (
                        item.question.toLowerCase().includes('latitude') || 
                        item.question.toLowerCase().includes('longitude') ||
                        item.question.toLowerCase().includes('lat') ||
                        item.question.toLowerCase().includes('lng')
                      )
                    ) && ' (Auto-filled in form fields)'}
                  </small>
                )}
                {gpsStatus === 'error' && (
                  <small className="text-warning">
                    ⚠️ Location access denied or unavailable
                  </small>
                )}
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

              {loading && !selectedForm ? (
                <div className="text-center">
                  <p>Loading forms...</p>
                </div>
              ) : !selectedForm ? (
                <div className="text-center">
                  <p>No forms available. Please create a form in the Form Builder first.</p>
                </div>
              ) : loading ? (
                <div className="text-center">
                  <p>Loading form questions...</p>
                </div>
              ) : formItems.length === 0 ? (
                <div className="text-center">
                  <p>This form has no questions. Please add questions in the Form Builder.</p>
                </div>
              ) : (
                <Form onSubmit={handleSubmit}>
                  {/* GPS Coordinates Status */}
                  <div className="mb-4 p-3 border rounded">
                    <h6 className="mb-2">
                      <i className="fa fa-map-marker me-2"></i>
                      Location Information
                    </h6>
                    
                    {gpsStatus === 'requesting' && (
                      <div className="text-info">
                        <i className="fa fa-spinner fa-spin me-2"></i>
                        Requesting GPS coordinates...
                      </div>
                    )}
                    
                    {gpsStatus === 'success' && gpsCoordinates.latitude && gpsCoordinates.longitude && (
                      <div className="text-success">
                        <i className="fa fa-check-circle me-2"></i>
                        Location captured successfully
                        <div className="mt-1">
                          <small className="text-muted">
                            Lat: {parseFloat(gpsCoordinates.latitude).toFixed(6)}, 
                            Lng: {parseFloat(gpsCoordinates.longitude).toFixed(6)}
                          </small>
                        </div>
                      </div>
                    )}
                    
                    {gpsStatus === 'error' && (
                      <div className="text-warning">
                        <i className="fa fa-exclamation-triangle me-2"></i>
                        Unable to get location (will submit without GPS coordinates)
                        <div className="mt-2">
                          <Button 
                            color="outline-primary" 
                            size="sm"
                            onClick={requestGPSCoordinates}
                            disabled={gpsStatus === 'requesting'}
                          >
                            <i className="fa fa-refresh me-1"></i>
                            Try Again
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {gpsStatus === 'idle' && (
                      <div className="text-muted">
                        <i className="fa fa-info-circle me-2"></i>
                        GPS coordinates will be captured automatically
                      </div>
                    )}
                  </div>

                  {/* Reorder Mode Toggle */}
                  <div className="mb-4 d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1 text-primary">
                        <i className="fa fa-list me-2"></i>
                        Form Questions
                        <span className="badge bg-primary ms-2">
                          {formItems.filter(item => !['section-header', 'page-break'].includes(item.item_type)).length} Questions
                        </span>
                      </h6>
                      <small className="text-muted">
                        {isReorderMode 
                          ? 'Drag and drop questions to reorder them' 
                          : 'Click "Reorder Questions" to rearrange the form'
                        }
                      </small>
                    </div>
                    <Button
                      color={isReorderMode ? 'success' : 'info'}
                      className={`reorder-toggle-btn ${isReorderMode ? 'active' : ''}`}
                      onClick={toggleReorderMode}
                    >
                      <i className={`fa ${isReorderMode ? 'fa-check' : 'fa-arrows-v'} me-2`}></i>
                      {isReorderMode ? 'Finish Reordering' : 'Reorder Questions'}
                    </Button>
                  </div>

                  {/* Form Questions with Drag and Drop */}
                  <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                    <Droppable droppableId="form-questions" type="question">
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`droppable-area ${snapshot.isDraggingOver ? 'drag-over' : ''} ${isReorderMode ? 'reorder-mode' : ''}`}
                        >
                          {formItems.map((item, index) => {
                            // Skip section headers and page breaks from numbering but still render them
                            const isDisplayItem = ['section-header', 'page-break'].includes(item.item_type);
                            const displayIndex = isDisplayItem ? null : 
                              formItems.slice(0, index).filter(prevItem => 
                                !['section-header', 'page-break'].includes(prevItem.item_type)
                              ).length + 1;

                            // Parse additional options for styling
                            let additionalOptions = {};
                            try {
                              if (item.additional_options) {
                                additionalOptions = JSON.parse(item.additional_options);
                              }
                            } catch (error) {
                              console.warn('Error parsing additional options for display:', error);
                            }

                            // Get field type color for professional display
                            const getFieldTypeColor = (type) => {
                              const colorMap = {
                                'text': 'primary',
                                'paragraph': 'primary', 
                                'textarea': 'primary',
                                'number': 'success',
                                'integer': 'success',
                                'email': 'info',
                                'url': 'info',
                                'phone': 'info',
                                'password': 'warning',
                                'date': 'secondary',
                                'time': 'secondary',
                                'datetime-local': 'secondary',
                                'color': 'warning',
                                'range': 'success',
                                'linear-scale': 'success',
                                'rating': 'warning',
                                'file': 'dark',
                                'image': 'dark',
                                'camera': 'dark',
                                'location': 'info',
                                'select': 'primary',
                                'dropdown': 'primary',
                                'radio': 'primary',
                                'multiple-choice': 'primary',
                                'checkbox': 'primary',
                                'multiple-select': 'primary',
                                'boolean': 'secondary',
                                'yes-no': 'secondary',
                                'grid': 'info',
                                'checkbox-grid': 'info',
                                'section-header': 'dark',
                                'page-break': 'dark'
                              };
                              return colorMap[type] || 'secondary';
                            };

                            const fieldTypeColor = getFieldTypeColor(item.item_type);

                            return (
                              <Draggable 
                                key={item.uuid} 
                                draggableId={item.uuid} 
                                index={index}
                                isDragDisabled={!isReorderMode}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`mb-4 ${isDisplayItem ? 'section-item' : 'form-field-item'} draggable-field ${snapshot.isDragging ? 'dragging' : ''}`}
                                  >
                                    {isDisplayItem ? (
                                      // Special rendering for section headers and page breaks
                                      <div className="section-header-container">
                                        {isReorderMode && (
                                          <div className="d-flex align-items-center mb-2">
                                            <div {...provided.dragHandleProps} className="drag-handle">
                                              <i className="fa fa-grip-vertical"></i>
                                            </div>
                                            <span className="badge bg-dark ms-2">Section Element</span>
                                          </div>
                                        )}
                                        {renderFormField(item)}
                                      </div>
                                    ) : (
                                      // Standard form field rendering
                                      <div className="p-4 border rounded-3 shadow-sm bg-white position-relative">
                                        {/* Drag Handle for Reorder Mode */}
                                        {isReorderMode && (
                                          <div className="d-flex align-items-center mb-3 reorder-header">
                                            <div {...provided.dragHandleProps} className="drag-handle">
                                              <i className="fa fa-grip-vertical"></i>
                                            </div>
                                            <span className="badge bg-info ms-2">
                                              <i className="fa fa-arrows-v me-1"></i>
                                              Drag to Reorder
                                            </span>
                                          </div>
                                        )}

                                        {/* Field Header */}
                                        <div className="field-header mb-3">
                                          <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div className="flex-grow-1">
                                              <h6 className="mb-1 fw-bold text-dark">
                                                <span className="field-number me-2 badge bg-light text-dark rounded-pill">
                                                  {displayIndex}
                                                </span>
                                                {item.question}
                                                {item.required && (
                                                  <span className="text-danger ms-1" title="Required field">
                                                    <i className="fa fa-asterisk" style={{ fontSize: '0.7rem' }}></i>
                                                  </span>
                                                )}
                                              </h6>
                                              {item.description && (
                                                <p className="text-muted small mb-2" style={{ fontStyle: 'italic' }}>
                                                  {item.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {/* Field Type Badges */}
                                          <div className="d-flex flex-wrap gap-2 mb-3">
                                            <span className={`badge bg-${fieldTypeColor} badge-field-type`}>
                                              <i className="fa fa-tag me-1"></i>
                                              {item.item_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                            
                                            {item.required && (
                                              <span className="badge bg-danger badge-required">
                                                <i className="fa fa-exclamation-circle me-1"></i>
                                                Required
                                              </span>
                                            )}
                                            
                                            {item.item_type === 'select' && item.conditional_fields && (
                                              <span className="badge bg-info badge-conditional">
                                                <i className="fa fa-code-branch me-1"></i>
                                                Has Conditional Logic
                                              </span>
                                            )}
                                            
                                            {responses[item.uuid] && (
                                              <span className="badge bg-success badge-answered">
                                                <i className="fa fa-check-circle me-1"></i>
                                                Answered ({responses[item.uuid].valueType})
                                              </span>
                                            )}
                                            
                                            {additionalOptions.maxLength && (
                                              <span className="badge bg-secondary badge-limit">
                                                <i className="fa fa-ruler me-1"></i>
                                                Max: {additionalOptions.maxLength}
                                              </span>
                                            )}
                                            
                                            {(additionalOptions.min !== undefined || additionalOptions.max !== undefined) && (
                                              <span className="badge bg-secondary badge-range">
                                                <i className="fa fa-arrows-h me-1"></i>
                                                Range: {additionalOptions.min || 0} - {additionalOptions.max || '∞'}
                                              </span>
                                            )}

                                            {additionalOptions.showOtherOption && (
                                              <span className="badge bg-warning text-dark badge-other">
                                                <i className="fa fa-plus-circle me-1"></i>
                                                Has "Other" Option
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Field Input */}
                                        <FormGroup className="field-input-container">
                                          {renderFormField(item)}
                                          {validationErrors[item.uuid] && (
                                            <div className="field-error mt-2 p-2 bg-danger bg-opacity-10 border border-danger rounded">
                                              <small className="text-danger fw-bold">
                                                <i className="fa fa-exclamation-triangle me-1"></i>
                                                {validationErrors[item.uuid]}
                                              </small>
                                            </div>
                                          )}
                                        </FormGroup>

                                        {/* Field Value Preview */}
                                        {responses[item.uuid] && responses[item.uuid].value && (
                                          <div className="field-value-preview mt-3 p-2 bg-success bg-opacity-10 border border-success rounded">
                                            <small className="text-success">
                                              <i className="fa fa-eye me-1"></i>
                                              <strong>Current Value:</strong> 
                                              <span className="ms-1 font-monospace">
                                                {typeof responses[item.uuid].value === 'object' 
                                                  ? JSON.stringify(responses[item.uuid].value, null, 2)
                                                  : responses[item.uuid].value.toString()
                                                }
                                              </span>
                                              <span className="ms-2 badge bg-success bg-opacity-25 text-success">
                                                {responses[item.uuid].valueType}
                                              </span>
                                            </small>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  {/* Enhanced Debug Information - HIDDEN 
                  {Object.keys(responses).length > 0 && (
                    <div className="debug-section mb-4 p-4">
                      <h6 className="mb-3 text-primary fw-bold">
                        <i className="fa fa-bug me-2"></i>
                        Form Submission Debug Information
                        <span className="badge bg-primary ms-2">{Object.keys(responses).length} Response(s)</span>
                      </h6>
                      
                      <Row>
                        <Col md="6">
                          <div className="debug-subsection mb-3">
                            <h6 className="text-secondary mb-2">
                              <i className="fa fa-user me-2"></i>User Information
                            </h6>
                            <ul className="list-unstyled small">
                              <li className="mb-1">
                                <strong>User UUID:</strong> 
                                <code className="ms-2">{user?.uuid || 'Not available'}</code>
                              </li>
                              <li className="mb-1">
                                <strong>Country:</strong> 
                                <code className="ms-2">{user?.country_uuid || 'Not available'}</code>
                              </li>
                              <li className="mb-1">
                                <strong>Province:</strong> 
                                <code className="ms-2">{user?.province_uuid || 'Not available'}</code>
                              </li>
                              <li className="mb-1">
                                <strong>Area:</strong> 
                                <code className="ms-2">{user?.area_uuid || 'Not available'}</code>
                              </li>
                            </ul>
                          </div>
                        </Col>
                        
                        <Col md="6">
                          <div className="debug-subsection mb-3">
                            <h6 className="text-secondary mb-2">
                              <i className="fa fa-map-marker me-2"></i>GPS Coordinates
                            </h6>
                            <ul className="list-unstyled small">
                              <li className="mb-1">
                                <strong>Latitude:</strong> 
                                <code className="ms-2">{gpsCoordinates.latitude?.toFixed(6) || 'Not captured'}</code>
                              </li>
                              <li className="mb-1">
                                <strong>Longitude:</strong> 
                                <code className="ms-2">{gpsCoordinates.longitude?.toFixed(6) || 'Not captured'}</code>
                              </li>
                              <li className="mb-1">
                                <strong>Status:</strong> 
                                <span className={`ms-2 badge ${
                                  gpsStatus === 'success' ? 'bg-success' : 
                                  gpsStatus === 'error' ? 'bg-danger' : 
                                  gpsStatus === 'requesting' ? 'bg-warning text-dark' : 'bg-secondary'
                                }`}>
                                  {gpsStatus.toUpperCase()}
                                </span>
                              </li>
                            </ul>
                          </div>
                        </Col>
                      </Row>

                      <div className="debug-subsection">
                        <h6 className="text-secondary mb-3">
                          <i className="fa fa-database me-2"></i>Form Responses
                          <small className="text-muted ms-2">({Object.keys(responses).length} fields)</small>
                        </h6>
                        
                        <div className="response-grid">
                          {Object.entries(responses).map(([key, data], index) => {
                            const isConditionalField = key.includes('_');
                            const fieldItem = formItems.find(item => item.uuid === key);
                            const fieldType = fieldItem?.item_type || 'conditional';
                            
                            return (
                              <div key={key} className="response-item mb-2 p-2 border rounded bg-white">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                      <span className="badge bg-light text-dark response-index">
                                        #{index + 1}
                                      </span>
                                      <span className={`badge ${isConditionalField ? 'bg-info' : 'bg-primary'}`}>
                                        {isConditionalField ? 'Conditional' : fieldType}
                                      </span>
                                    </div>
                                    <div className="response-content">
                                      <strong className="text-dark">Field ID:</strong> 
                                      <code className="ms-1 small">{key}</code>
                                    </div>
                                    <div className="response-content">
                                      <strong className="text-dark">Value:</strong> 
                                      <code className="ms-1 small text-success">
                                        {typeof data.value === 'object' 
                                          ? JSON.stringify(data.value) 
                                          : data.value?.toString() || 'null'
                                        }
                                      </code>
                                    </div>
                                  </div>
                                  <span className={`badge bg-${
                                    data.valueType === 'number' ? 'success' : 
                                    data.valueType === 'boolean' ? 'warning' : 
                                    data.valueType === 'date' ? 'info' : 
                                    data.valueType === 'file_url' ? 'dark' : 'secondary'
                                  }`}>
                                    {data.valueType}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  */}

                  {/* Enhanced Submission Button */}
                  <div className="submission-section text-center mt-5 p-4 bg-light rounded-3">
                    <div className="mb-3">
                      <h5 className="text-primary mb-2">
                        <i className="fa fa-paper-plane me-2"></i>
                        Ready to Submit?
                      </h5>
                      <p className="text-muted mb-0">
                        {Object.keys(responses).length > 0 
                          ? `You have answered ${Object.keys(responses).length} field${Object.keys(responses).length !== 1 ? 's' : ''}`
                          : 'Please answer the form questions above'
                        }
                      </p>
                    </div>
                    
                    <div className="submission-stats mb-3">
                      <Row className="text-center">
                        <Col md="3">
                          <div className="stat-item">
                            <div className="stat-number text-primary fw-bold fs-4">
                              {formItems.filter(item => !['section-header', 'page-break'].includes(item.item_type)).length}
                            </div>
                            <div className="stat-label small text-muted">Total Questions</div>
                          </div>
                        </Col>
                        <Col md="3">
                          <div className="stat-item">
                            <div className="stat-number text-success fw-bold fs-4">
                              {Object.keys(responses).length}
                            </div>
                            <div className="stat-label small text-muted">Answered</div>
                          </div>
                        </Col>
                        <Col md="3">
                          <div className="stat-item">
                            <div className="stat-number text-warning fw-bold fs-4">
                              {formItems.filter(item => item.required && !['section-header', 'page-break'].includes(item.item_type)).length}
                            </div>
                            <div className="stat-label small text-muted">Required</div>
                          </div>
                        </Col>
                        <Col md="3">
                          <div className="stat-item">
                            <div className="stat-number text-info fw-bold fs-4">
                              {gpsStatus === 'success' ? '✓' : '○'}
                            </div>
                            <div className="stat-label small text-muted">GPS Status</div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                    
                    <Button 
                      type="submit" 
                      color="primary" 
                      size="lg"
                      className="px-5 py-3 fw-bold"
                      disabled={submitting || formItems.length === 0}
                      style={{
                        background: submitting 
                          ? 'linear-gradient(45deg, #6c757d, #495057)' 
                          : 'linear-gradient(45deg, #007bff, #0056b3)',
                        border: 'none',
                        borderRadius: '25px',
                        boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)',
                        transform: submitting ? 'none' : 'translateY(-2px)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {submitting ? (
                        <>
                          <i className="fa fa-spinner fa-spin me-2"></i>
                          Submitting Form...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-paper-plane me-2"></i>
                          Submit Form
                        </>
                      )}
                    </Button>
                    
                    {Object.keys(responses).length === 0 && (
                      <div className="mt-3">
                        <small className="text-muted">
                          <i className="fa fa-info-circle me-1"></i>
                          Complete the form above to enable submission
                        </small>
                      </div>
                    )}
                  </div>
                </Form>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Camera Modal */}
      <Modal 
        isOpen={showCamera} 
        toggle={stopCamera}
        size="lg"
        backdrop="static"
        centered
      >
        <ModalHeader toggle={stopCamera}>
          📷 Take Photo
        </ModalHeader>
        <ModalBody>
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <video
              id="camera-video"
              ref={(video) => {
                if (video && cameraStream) {
                  video.srcObject = cameraStream;
                  video.play();
                }
              }}
              style={{
                width: '100%',
                maxWidth: '500px',
                height: 'auto',
                borderRadius: '8px'
              }}
              autoPlay
              playsInline
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            color="secondary" 
            onClick={stopCamera}
          >
            Cancel
          </Button>
          <Button 
            color="primary" 
            onClick={capturePhoto}
          >
            📷 Capture Photo
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default FormSubmissions;
