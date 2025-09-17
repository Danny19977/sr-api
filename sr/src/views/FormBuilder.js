import React, { useState, useEffect } from 'react';
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
  Alert
} from 'reactstrap';
import { formService, formItemService, formOptionService } from '../services/apiServices';

const FormBuilder = () => {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formItems, setFormItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal states
  const [formModal, setFormModal] = useState(false);
  const [itemModal, setItemModal] = useState(false);
  const [optionModal, setOptionModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formEditMode, setFormEditMode] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    user_uuid: '', // Will be set from auth context
    country_uuid: '',
    province_uuid: '',
    area_uuid: ''
  });
  
  const [itemData, setItemData] = useState({
    question: '',
    item_type: 'text',
    required: false,
    sort_order: 0,
    options: '',
    form_uuid: '',
    description: '', // Help text for the field
    placeholder: '', // Placeholder text
    validation: {}, // Field validation rules
    // Linear scale properties
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: '',
    scaleMaxLabel: '',
    // Rating properties
    maxStars: 5,
    // Grid properties
    gridRows: [],
    gridColumns: [],
    // File upload properties
    allowedFileTypes: '',
    maxFileSize: '',
    // Advanced properties
    showOtherOption: false,
    randomizeOptions: false,
    allowMultipleFiles: false
  });

  // Options for select, radio, and checkbox types
  const [fieldOptions, setFieldOptions] = useState([]);
  const [newOptionText, setNewOptionText] = useState('');
  
  // Grid properties
  const [newRowText, setNewRowText] = useState('');
  const [newColumnText, setNewColumnText] = useState('');
  
  // Conditional fields for dropdown options - Enhanced with nested conditions
  const [conditionalFields, setConditionalFields] = useState({});
  const [selectedOptionForCondition, setSelectedOptionForCondition] = useState('');
  const [nestedConditions, setNestedConditions] = useState({});
  const [activeConditionPath, setActiveConditionPath] = useState('');

  // Load forms on component mount
  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const response = await formService.getAll();
      if (response.status === 'success') {
        setForms(response.data);
      }
    } catch (error) {
      setError('Failed to load forms: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFormItems = async (formUuid) => {
    try {
      setLoading(true);
      const response = await formItemService.getByForm(formUuid);
      if (response.status === 'success') {
        setFormItems(response.data);
      }
    } catch (error) {
      setError('Failed to load form items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async () => {
    try {
      setLoading(true);
      
      let response;
      if (formEditMode && editingForm) {
        // Update existing form
        response = await formService.update(editingForm.uuid, formData);
      } else {
        // Create new form
        response = await formService.create(formData);
      }
      
      if (response.status === 'success') {
        setSuccess(formEditMode ? 'Form updated successfully!' : 'Form created successfully!');
        setFormModal(false);
        setFormEditMode(false);
        setEditingForm(null);
        setFormData({
          title: '',
          description: '',
          user_uuid: '',
          country_uuid: '',
          province_uuid: '',
          area_uuid: ''
        });
        loadForms();
      }
    } catch (error) {
      setError(`Failed to ${formEditMode ? 'update' : 'create'} form: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditForm = (form) => {
    setFormEditMode(true);
    setEditingForm(form);
    setFormData({
      title: form.title,
      description: form.description || '',
      user_uuid: form.user_uuid || '',
      country_uuid: form.country_uuid || '',
      province_uuid: form.province_uuid || '',
      area_uuid: form.area_uuid || ''
    });
    setFormModal(true);
  };

  const handleCreateFormItem = async () => {
    console.log('handleCreateFormItem called!'); // Debug log
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Validate that we have a selected form
      if (!selectedForm || !selectedForm.uuid) {
        setError('No form selected. Please select a form first.');
        setLoading(false);
        return;
      }
      
      // Prepare options string for dropdown, radio, checkbox, linear scale, and grid types
      let optionsString = '';
      if (['select', 'radio', 'checkbox', 'linear-scale', 'rating', 'grid', 'checkbox-grid'].includes(itemData.item_type)) {
        if (itemData.item_type === 'linear-scale') {
          // For linear scale, store min, max, and labels
          optionsString = `${itemData.scaleMin || 1}-${itemData.scaleMax || 5}|${itemData.scaleMinLabel || ''}|${itemData.scaleMaxLabel || ''}`;
        } else if (itemData.item_type === 'rating') {
          // For rating, store max stars
          optionsString = `${itemData.maxStars || 5}`;
        } else if (itemData.item_type === 'grid' || itemData.item_type === 'checkbox-grid') {
          // For grids, store rows and columns
          optionsString = `rows:${(itemData.gridRows || []).join(',')}|cols:${(itemData.gridColumns || []).join(',')}`;
        } else {
          optionsString = fieldOptions.join(',');
        }
      }
      
      const itemDataWithForm = {
        question: itemData.question,
        item_type: itemData.item_type,
        required: itemData.required || false,
        sort_order: editMode ? (itemData.sort_order || 0) : (formItems.length + 1), // Auto-increment for new items
        options: optionsString,
        conditional_fields: JSON.stringify(conditionalFields), // Store conditional fields as JSON
        form_uuid: selectedForm.uuid
      };

      console.log('🚀 Submitting form item with conditional fields:', {
        ...itemDataWithForm,
        conditionalFieldsObject: conditionalFields
      });
      console.log('Using formItemService:', formItemService); // Debug log
      
      let response;
      if (editMode && editingItem) {
        // Update existing item
        response = await formItemService.update(editingItem.uuid, itemDataWithForm);
        console.log('Update Response:', response); // Debug log
      } else {
        // Create new item
        response = await formItemService.create(itemDataWithForm);
        console.log('Create Response:', response); // Debug log
      }
      
      if (response && response.status === 'success') {
        setSuccess(editMode ? 'Form item updated successfully!' : 'Form item created successfully!');
        setItemModal(false);
        setEditMode(false);
        setEditingItem(null);
        setItemData({
          question: '',
          item_type: 'text',
          required: false,
          sort_order: 0,
          options: '',
          form_uuid: '',
          description: '',
          placeholder: '',
          validation: {},
          scaleMin: 1,
          scaleMax: 5,
          scaleMinLabel: '',
          scaleMaxLabel: '',
          maxStars: 5,
          gridRows: [],
          gridColumns: [],
          allowedFileTypes: '',
          maxFileSize: '',
          showOtherOption: false,
          randomizeOptions: false,
          allowMultipleFiles: false
        });
        setFieldOptions([]);
        setNewOptionText('');
        setNewRowText('');
        setNewColumnText('');
        setConditionalFields({});
        setSelectedOptionForCondition('');
        loadFormItems(selectedForm.uuid);
      } else {
        setError(`Failed to ${editMode ? 'update' : 'create'} form item: ` + (response?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} form item:`, error); // Debug log
      setError(`Failed to ${editMode ? 'update' : 'create'} form item: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setEditMode(true);
    setEditingItem(item);
    setItemData({
      question: item.question,
      item_type: item.item_type,
      required: item.required || false,
      sort_order: item.sort_order || 0,
      options: item.options || '',
      form_uuid: item.form_uuid,
      description: item.description || '',
      placeholder: item.placeholder || '',
      validation: item.validation ? (typeof item.validation === 'string' ? JSON.parse(item.validation) : item.validation) : {},
      scaleMin: 1,
      scaleMax: 5,
      scaleMinLabel: '',
      scaleMaxLabel: '',
      maxStars: 5,
      gridRows: [],
      gridColumns: [],
      allowedFileTypes: item.allowedFileTypes || '',
      maxFileSize: item.maxFileSize || '',
      showOtherOption: item.showOtherOption || false,
      randomizeOptions: item.randomizeOptions || false,
      allowMultipleFiles: item.allowMultipleFiles || false
    });
    
    // Set field options if the item has options
    if (item.options && ['select', 'radio', 'checkbox', 'linear-scale', 'rating', 'grid', 'checkbox-grid'].includes(item.item_type)) {
      if (item.item_type === 'linear-scale') {
        // Parse linear scale data
        const parts = item.options.split('|');
        const [range, minLabel, maxLabel] = parts;
        const [min, max] = range.split('-').map(Number);
        setItemData(prev => ({
          ...prev,
          scaleMin: min || 1,
          scaleMax: max || 5,
          scaleMinLabel: minLabel || '',
          scaleMaxLabel: maxLabel || ''
        }));
      } else if (item.item_type === 'rating') {
        setItemData(prev => ({
          ...prev,
          maxStars: parseInt(item.options) || 5
        }));
      } else if (item.item_type === 'grid' || item.item_type === 'checkbox-grid') {
        // Parse grid data
        const parts = item.options.split('|');
        const rowsPart = parts.find(p => p.startsWith('rows:'));
        const colsPart = parts.find(p => p.startsWith('cols:'));
        
        const rows = rowsPart ? rowsPart.substring(5).split(',').filter(r => r.trim()) : [];
        const cols = colsPart ? colsPart.substring(5).split(',').filter(c => c.trim()) : [];
        
        setItemData(prev => ({
          ...prev,
          gridRows: rows,
          gridColumns: cols
        }));
      } else {
        setFieldOptions(item.options.split(',').map(opt => opt.trim()));
      }
    } else {
      setFieldOptions([]);
    }
    
    // Load conditional fields if they exist
    if (item.conditional_fields) {
      try {
        const conditionals = JSON.parse(item.conditional_fields);
        setConditionalFields(conditionals);
      } catch (error) {
        console.error('Error parsing conditional fields:', error);
        setConditionalFields({});
      }
    } else {
      setConditionalFields({});
    }
    
    setNewOptionText('');
    setSelectedOptionForCondition('');
    setItemModal(true);
  };

  const handleDeleteItem = async (uuid) => {
    if (window.confirm('Are you sure you want to delete this form item?')) {
      try {
        setLoading(true);
        const response = await formItemService.delete(uuid);
        if (response && response.status === 'success') {
          setSuccess('Form item deleted successfully!');
          loadFormItems(selectedForm.uuid);
        } else {
          setError('Failed to delete form item: ' + (response?.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting form item:', error);
        setError('Failed to delete form item: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteForm = async (uuid) => {
    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone and will also delete all form items and submissions associated with this form.')) {
      try {
        setLoading(true);
        const response = await formService.delete(uuid);
        if (response && response.status === 'success') {
          setSuccess('Form deleted successfully!');
          // Clear selected form if it was the one deleted
          if (selectedForm && selectedForm.uuid === uuid) {
            setSelectedForm(null);
            setFormItems([]);
          }
          loadForms();
        } else {
          setError('Failed to delete form: ' + (response?.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting form:', error);
        setError('Failed to delete form: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectForm = (form) => {
    setSelectedForm(form);
    loadFormItems(form.uuid);
  };

  const getItemTypeColor = (type) => {
    const colors = {
      text: 'primary',
      textarea: 'info',
      select: 'success',
      radio: 'warning',
      checkbox: 'danger',
      file: 'secondary',
      number: 'dark',
      email: 'primary',
      url: 'primary',
      tel: 'primary',
      date: 'info',
      time: 'info',
      'datetime-local': 'info',
      'linear-scale': 'success',
      rating: 'warning',
      grid: 'danger',
      'checkbox-grid': 'danger',
      section: 'light',
      'page-break': 'light',
      camera: 'info',
      signature: 'dark',
      range: 'success',
      color: 'warning',
      password: 'dark'
    };
    return colors[type] || 'secondary';
  };

  const getItemTypeDisplayName = (type) => {
    const names = {
      text: 'Short Answer',
      textarea: 'Paragraph',
      select: 'Dropdown',
      radio: 'Multiple Choice',
      checkbox: 'Checkboxes',
      file: 'File Upload',
      number: 'Number',
      email: 'Email',
      url: 'URL',
      tel: 'Phone Number',
      date: 'Date',
      time: 'Time',
      'datetime-local': 'Date & Time',
      'linear-scale': 'Linear Scale',
      rating: 'Star Rating',
      grid: 'Multiple Choice Grid',
      'checkbox-grid': 'Checkbox Grid',
      section: 'Section Break',
      'page-break': 'Page Break',
      camera: 'Camera',
      signature: 'Digital Signature',
      range: 'Range Slider',
      color: 'Color Picker',
      password: 'Password'
    };
    return names[type] || type;
  };

  // Helper functions for managing field options
  const addOption = () => {
    if (newOptionText.trim() && !fieldOptions.includes(newOptionText.trim())) {
      setFieldOptions([...fieldOptions, newOptionText.trim()]);
      setNewOptionText('');
    }
  };

  const removeOption = (index) => {
    const optionToRemove = fieldOptions[index];
    const updated = fieldOptions.filter((_, i) => i !== index);
    setFieldOptions(updated);
    
    // Remove conditional fields for this option
    if (conditionalFields[optionToRemove]) {
      const updatedConditionals = { ...conditionalFields };
      delete updatedConditionals[optionToRemove];
      setConditionalFields(updatedConditionals);
    }
  };

  // Grid management functions
  const addGridRow = () => {
    if (newRowText.trim() && !itemData.gridRows.includes(newRowText.trim())) {
      setItemData({
        ...itemData,
        gridRows: [...itemData.gridRows, newRowText.trim()]
      });
      setNewRowText('');
    }
  };

  const removeGridRow = (index) => {
    const updatedRows = itemData.gridRows.filter((_, i) => i !== index);
    setItemData({
      ...itemData,
      gridRows: updatedRows
    });
  };

  const addGridColumn = () => {
    if (newColumnText.trim() && !itemData.gridColumns.includes(newColumnText.trim())) {
      setItemData({
        ...itemData,
        gridColumns: [...itemData.gridColumns, newColumnText.trim()]
      });
      setNewColumnText('');
    }
  };

  const removeGridColumn = (index) => {
    const updatedColumns = itemData.gridColumns.filter((_, i) => i !== index);
    setItemData({
      ...itemData,
      gridColumns: updatedColumns
    });
  };

  // Enhanced helper functions for conditional fields with nested support
  const addConditionalField = (optionValue, fieldType, fieldLabel, isRequired = false, parentFieldId = null) => {
    if (!optionValue || !fieldType || !fieldLabel) return;
    
    const fieldId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newField = {
      id: fieldId,
      type: fieldType,
      label: fieldLabel,
      required: isRequired,
      parentFieldId: parentFieldId,
      options: ['select', 'radio', 'checkbox'].includes(fieldType) ? [] : null,
      children: {}, // For nested conditional fields
      // Enhanced properties
      placeholder: '',
      helpText: '',
      validation: {},
      // For linear scale
      scaleMin: 1,
      scaleMax: 5,
      scaleMinLabel: '',
      scaleMaxLabel: '',
      // For rating
      maxStars: 5,
      // For grid
      gridRows: [],
      gridColumns: [],
      // Advanced options
      showOtherOption: false,
      randomizeOptions: false,
      conditionalLogic: 'show', // 'show' or 'hide'
      dependsOn: parentFieldId ? { fieldId: parentFieldId, value: optionValue } : null
    };
    
    setConditionalFields(prev => ({
      ...prev,
      [optionValue]: [
        ...(prev[optionValue] || []),
        newField
      ]
    }));

    return fieldId;
  };

  const addNestedConditionalField = (parentFieldId, parentOptionValue, optionValue, fieldType, fieldLabel, isRequired = false) => {
    const childFieldId = addConditionalField(optionValue, fieldType, fieldLabel, isRequired, parentFieldId);
    
    // Link the child to the parent
    setConditionalFields(prev => {
      const updated = { ...prev };
      // Find and update the parent field
      Object.keys(updated).forEach(key => {
        updated[key] = updated[key].map(field => {
          if (field.id === parentFieldId) {
            return {
              ...field,
              children: {
                ...field.children,
                [parentOptionValue]: [
                  ...(field.children[parentOptionValue] || []),
                  childFieldId
                ]
              }
            };
          }
          return field;
        });
      });
      return updated;
    });

    return childFieldId;
  };

  const removeConditionalField = (optionValue, fieldId) => {
    setConditionalFields(prev => {
      const updated = { ...prev };
      
      // Remove the field and all its children
      const removeFieldAndChildren = (fields) => {
        return fields.filter(field => {
          if (field.id === fieldId) {
            // Remove all children of this field
            Object.values(field.children || {}).forEach(childIds => {
              if (Array.isArray(childIds)) {
                childIds.forEach(childId => {
                  Object.keys(updated).forEach(key => {
                    updated[key] = removeFieldAndChildren(updated[key]);
                  });
                });
              }
            });
            return false;
          }
          return true;
        });
      };

      updated[optionValue] = removeFieldAndChildren(updated[optionValue] || []);
      
      if (updated[optionValue].length === 0) {
        delete updated[optionValue];
      }
      
      return updated;
    });
  };

  const addConditionalFieldOption = (optionValue, fieldId, optionText) => {
    if (!optionText.trim()) return;
    
    setConditionalFields(prev => ({
      ...prev,
      [optionValue]: prev[optionValue]?.map(field => 
        field.id === fieldId 
          ? { ...field, options: [...(field.options || []), optionText.trim()] }
          : field
      ) || []
    }));
  };

  const removeConditionalFieldOption = (optionValue, fieldId, optionIndex) => {
    setConditionalFields(prev => ({
      ...prev,
      [optionValue]: prev[optionValue]?.map(field => 
        field.id === fieldId 
          ? { ...field, options: field.options?.filter((_, i) => i !== optionIndex) || [] }
          : field
      ) || []
    }));
  };

  const updateConditionalFieldProperty = (optionValue, fieldId, property, value) => {
    setConditionalFields(prev => ({
      ...prev,
      [optionValue]: prev[optionValue]?.map(field => 
        field.id === fieldId 
          ? { ...field, [property]: value }
          : field
      ) || []
    }));
  };

  const updateConditionalFieldValidation = (optionValue, fieldId, validationProperty, value) => {
    setConditionalFields(prev => ({
      ...prev,
      [optionValue]: prev[optionValue]?.map(field => 
        field.id === fieldId 
          ? { 
              ...field, 
              validation: { 
                ...field.validation, 
                [validationProperty]: value 
              } 
            }
          : field
      ) || []
    }));
  };

  const handleFieldTypeChange = (type) => {
    setItemData({...itemData, item_type: type});
    // Reset options when changing field type
    if (!['select', 'radio', 'checkbox', 'linear-scale', 'rating', 'grid', 'checkbox-grid'].includes(type)) {
      setFieldOptions([]);
      setNewOptionText('');
      setConditionalFields({});
      setSelectedOptionForCondition('');
    }
    // Reset grid data when not using grid types
    if (!['grid', 'checkbox-grid'].includes(type)) {
      setItemData(prev => ({
        ...prev,
        item_type: type,
        gridRows: [],
        gridColumns: []
      }));
      setNewRowText('');
      setNewColumnText('');
    }
  };

  const isOptionsRequired = () => {
    return ['select', 'radio', 'checkbox', 'linear-scale', 'rating', 'grid', 'checkbox-grid'].includes(itemData.item_type);
  };

  // Enhanced conditional field adder component with advanced features
  const ConditionalFieldAdder = ({ onAdd, parentFieldId = null, nestingLevel = 0 }) => {
    const [fieldType, setFieldType] = useState('text');
    const [fieldLabel, setFieldLabel] = useState('');
    const [isRequired, setIsRequired] = useState(false);
    const [placeholder, setPlaceholder] = useState('');
    const [helpText, setHelpText] = useState('');
    const [conditionalLogic, setConditionalLogic] = useState('show');
    
    // For choice fields
    const [fieldOptions, setFieldOptionsLocal] = useState([]);
    const [newOption, setNewOption] = useState('');
    const [showOtherOption, setShowOtherOption] = useState(false);
    const [randomizeOptions, setRandomizeOptions] = useState(false);
    
    // For linear scale
    const [scaleMin, setScaleMin] = useState(1);
    const [scaleMax, setScaleMax] = useState(5);
    const [scaleMinLabel, setScaleMinLabel] = useState('');
    const [scaleMaxLabel, setScaleMaxLabel] = useState('');
    
    // For rating
    const [maxStars, setMaxStars] = useState(5);
    
    // For grid
    const [gridRows, setGridRows] = useState([]);
    const [gridColumns, setGridColumns] = useState([]);
    const [newRow, setNewRow] = useState('');
    const [newColumn, setNewColumn] = useState('');
    
    // For validation
    const [minLength, setMinLength] = useState('');
    const [maxLength, setMaxLength] = useState('');
    const [minValue, setMinValue] = useState('');
    const [maxValue, setMaxValue] = useState('');

    const addOption = () => {
      if (newOption.trim() && !fieldOptions.includes(newOption.trim())) {
        setFieldOptionsLocal([...fieldOptions, newOption.trim()]);
        setNewOption('');
      }
    };

    const removeOption = (index) => {
      setFieldOptionsLocal(fieldOptions.filter((_, i) => i !== index));
    };

    const addGridRow = () => {
      if (newRow.trim() && !gridRows.includes(newRow.trim())) {
        setGridRows([...gridRows, newRow.trim()]);
        setNewRow('');
      }
    };

    const addGridColumn = () => {
      if (newColumn.trim() && !gridColumns.includes(newColumn.trim())) {
        setGridColumns([...gridColumns, newColumn.trim()]);
        setNewColumn('');
      }
    };

    const resetForm = () => {
      setFieldLabel('');
      setIsRequired(false);
      setPlaceholder('');
      setHelpText('');
      setFieldOptionsLocal([]);
      setNewOption('');
      setShowOtherOption(false);
      setRandomizeOptions(false);
      setScaleMin(1);
      setScaleMax(5);
      setScaleMinLabel('');
      setScaleMaxLabel('');
      setMaxStars(5);
      setGridRows([]);
      setGridColumns([]);
      setNewRow('');
      setNewColumn('');
      setMinLength('');
      setMaxLength('');
      setMinValue('');
      setMaxValue('');
    };

    const handleAdd = () => {
      if (fieldLabel.trim()) {
        const fieldData = {
          type: fieldType,
          label: fieldLabel.trim(),
          required: isRequired,
          placeholder: placeholder,
          helpText: helpText,
          conditionalLogic: conditionalLogic,
          validation: {
            minLength: minLength,
            maxLength: maxLength,
            minValue: minValue,
            maxValue: maxValue
          }
        };

        // Add type-specific data
        if (['select', 'radio', 'checkbox'].includes(fieldType)) {
          fieldData.options = fieldOptions;
          fieldData.showOtherOption = showOtherOption;
          fieldData.randomizeOptions = randomizeOptions;
        } else if (fieldType === 'linear-scale') {
          fieldData.scaleMin = scaleMin;
          fieldData.scaleMax = scaleMax;
          fieldData.scaleMinLabel = scaleMinLabel;
          fieldData.scaleMaxLabel = scaleMaxLabel;
        } else if (fieldType === 'rating') {
          fieldData.maxStars = maxStars;
        } else if (fieldType === 'grid' || fieldType === 'checkbox-grid') {
          fieldData.gridRows = gridRows;
          fieldData.gridColumns = gridColumns;
        }

        onAdd(fieldData);
        resetForm();
      }
    };

    const isChoiceType = ['select', 'radio', 'checkbox'].includes(fieldType);
    const isGridType = ['grid', 'checkbox-grid'].includes(fieldType);
    const canAddField = fieldLabel.trim() && 
      (!isChoiceType || fieldOptions.length > 0) &&
      (!isGridType || (gridRows.length > 0 && gridColumns.length > 0)) &&
      (fieldType !== 'linear-scale' || scaleMin < scaleMax);

    return (
      <div className={`border rounded p-3 ${nestingLevel > 0 ? 'bg-light' : 'bg-white'}`} style={{marginLeft: nestingLevel * 20}}>
        <div className="d-flex align-items-center mb-3">
          <h6 className="mb-0">
            {nestingLevel === 0 ? '🔧 Add Conditional Field' : `🔗 Add Nested Field (Level ${nestingLevel + 1})`}
          </h6>
          {nestingLevel > 0 && (
            <Badge color="info" className="ms-2">Nested</Badge>
          )}
        </div>

        <Row>
          <Col md="6">
            <FormGroup>
              <Label className="small fw-bold">Field Label *</Label>
              <Input
                type="text"
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
                placeholder="Enter field label"
                size="sm"
              />
            </FormGroup>
          </Col>
          <Col md="3">
            <FormGroup>
              <Label className="small fw-bold">Field Type</Label>
              <Input
                type="select"
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value)}
                size="sm"
              >
                <option value="text">Short Answer</option>
                <option value="textarea">Paragraph</option>
                <option value="select">Dropdown</option>
                <option value="radio">Multiple Choice</option>
                <option value="checkbox">Checkboxes</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="url">URL</option>
                <option value="tel">Phone</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
                <option value="datetime-local">Date & Time</option>
                <option value="linear-scale">Linear Scale</option>
                <option value="rating">Star Rating</option>
                <option value="grid">Multiple Choice Grid</option>
                <option value="checkbox-grid">Checkbox Grid</option>
                <option value="file">File Upload</option>
                <option value="camera">Camera</option>
              </Input>
            </FormGroup>
          </Col>
          <Col md="3">
            <FormGroup>
              <Label className="small fw-bold">Behavior</Label>
              <Input
                type="select"
                value={conditionalLogic}
                onChange={(e) => setConditionalLogic(e.target.value)}
                size="sm"
              >
                <option value="show">Show when selected</option>
                <option value="hide">Hide when selected</option>
              </Input>
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md="6">
            <FormGroup>
              <Label className="small">Placeholder Text</Label>
              <Input
                type="text"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="Enter placeholder text"
                size="sm"
              />
            </FormGroup>
          </Col>
          <Col md="6">
            <FormGroup>
              <Label className="small">Help Text</Label>
              <Input
                type="text"
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
                placeholder="Enter help text"
                size="sm"
              />
            </FormGroup>
          </Col>
        </Row>

        {/* Field Type Specific Configurations */}
        {isChoiceType && (
          <FormGroup>
            <Label className="small fw-bold">Options *</Label>
            <div className="d-flex mb-2">
              <Input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Add option"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                size="sm"
                className="me-2"
              />
              <Button color="primary" size="sm" onClick={addOption} disabled={!newOption.trim()}>
                Add
              </Button>
            </div>
            
            <Row className="mb-2">
              <Col md="6">
                <FormGroup check>
                  <Label check className="small">
                    <Input
                      type="checkbox"
                      checked={showOtherOption}
                      onChange={(e) => setShowOtherOption(e.target.checked)}
                    />
                    Add "Other" option
                  </Label>
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup check>
                  <Label check className="small">
                    <Input
                      type="checkbox"
                      checked={randomizeOptions}
                      onChange={(e) => setRandomizeOptions(e.target.checked)}
                    />
                    Randomize options
                  </Label>
                </FormGroup>
              </Col>
            </Row>

            {fieldOptions.length > 0 && (
              <div className="border rounded p-2 bg-light">
                <div className="small fw-bold mb-1">Options Preview:</div>
                {fieldOptions.map((option, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small">{option}</span>
                    <Button
                      color="danger"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="py-0 px-1"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </FormGroup>
        )}

        {fieldType === 'linear-scale' && (
          <FormGroup>
            <Label className="small fw-bold">Linear Scale Configuration</Label>
            <Row>
              <Col md="3">
                <Label className="small">Min Value</Label>
                <Input
                  type="number"
                  value={scaleMin}
                  onChange={(e) => setScaleMin(parseInt(e.target.value) || 1)}
                  min="0"
                  max="10"
                  size="sm"
                />
              </Col>
              <Col md="3">
                <Label className="small">Max Value</Label>
                <Input
                  type="number"
                  value={scaleMax}
                  onChange={(e) => setScaleMax(parseInt(e.target.value) || 5)}
                  min="2"
                  max="10"
                  size="sm"
                />
              </Col>
              <Col md="3">
                <Label className="small">Min Label</Label>
                <Input
                  type="text"
                  value={scaleMinLabel}
                  onChange={(e) => setScaleMinLabel(e.target.value)}
                  placeholder="e.g., Poor"
                  size="sm"
                />
              </Col>
              <Col md="3">
                <Label className="small">Max Label</Label>
                <Input
                  type="text"
                  value={scaleMaxLabel}
                  onChange={(e) => setScaleMaxLabel(e.target.value)}
                  placeholder="e.g., Excellent"
                  size="sm"
                />
              </Col>
            </Row>
          </FormGroup>
        )}

        {fieldType === 'rating' && (
          <FormGroup>
            <Label className="small fw-bold">Rating Configuration</Label>
            <Row>
              <Col md="6">
                <Label className="small">Maximum Stars</Label>
                <Input
                  type="number"
                  value={maxStars}
                  onChange={(e) => setMaxStars(parseInt(e.target.value) || 5)}
                  min="1"
                  max="10"
                  size="sm"
                />
              </Col>
            </Row>
          </FormGroup>
        )}

        {isGridType && (
          <FormGroup>
            <Label className="small fw-bold">Grid Configuration</Label>
            <Row>
              <Col md="6">
                <Label className="small">Rows (Questions) *</Label>
                <div className="d-flex mb-2">
                  <Input
                    type="text"
                    value={newRow}
                    onChange={(e) => setNewRow(e.target.value)}
                    placeholder="Add row question"
                    size="sm"
                    className="me-2"
                  />
                  <Button color="primary" size="sm" onClick={addGridRow} disabled={!newRow.trim()}>
                    Add
                  </Button>
                </div>
                {gridRows.map((row, index) => (
                  <div key={index} className="small bg-light p-1 rounded mb-1 d-flex justify-content-between">
                    <span>{row}</span>
                    <button className="btn btn-sm btn-danger py-0 px-1" onClick={() => setGridRows(gridRows.filter((_, i) => i !== index))}>×</button>
                  </div>
                ))}
              </Col>
              <Col md="6">
                <Label className="small">Columns (Options) *</Label>
                <div className="d-flex mb-2">
                  <Input
                    type="text"
                    value={newColumn}
                    onChange={(e) => setNewColumn(e.target.value)}
                    placeholder="Add column option"
                    size="sm"
                    className="me-2"
                  />
                  <Button color="primary" size="sm" onClick={addGridColumn} disabled={!newColumn.trim()}>
                    Add
                  </Button>
                </div>
                {gridColumns.map((column, index) => (
                  <div key={index} className="small bg-light p-1 rounded mb-1 d-flex justify-content-between">
                    <span>{column}</span>
                    <button className="btn btn-sm btn-danger py-0 px-1" onClick={() => setGridColumns(gridColumns.filter((_, i) => i !== index))}>×</button>
                  </div>
                ))}
              </Col>
            </Row>
          </FormGroup>
        )}

        {/* Validation Rules */}
        {!['section', 'page-break'].includes(fieldType) && (
          <FormGroup>
            <Label className="small fw-bold">Validation Rules</Label>
            <Row>
              <Col md="3">
                <FormGroup check>
                  <Label check className="small">
                    <Input
                      type="checkbox"
                      checked={isRequired}
                      onChange={(e) => setIsRequired(e.target.checked)}
                    />
                    Required field
                  </Label>
                </FormGroup>
              </Col>
              {fieldType === 'text' && (
                <>
                  <Col md="3">
                    <Label className="small">Min Length</Label>
                    <Input
                      type="number"
                      value={minLength}
                      onChange={(e) => setMinLength(e.target.value)}
                      placeholder="Min chars"
                      size="sm"
                      min="0"
                    />
                  </Col>
                  <Col md="3">
                    <Label className="small">Max Length</Label>
                    <Input
                      type="number"
                      value={maxLength}
                      onChange={(e) => setMaxLength(e.target.value)}
                      placeholder="Max chars"
                      size="sm"
                      min="1"
                    />
                  </Col>
                </>
              )}
              {fieldType === 'number' && (
                <>
                  <Col md="3">
                    <Label className="small">Min Value</Label>
                    <Input
                      type="number"
                      value={minValue}
                      onChange={(e) => setMinValue(e.target.value)}
                      placeholder="Min value"
                      size="sm"
                    />
                  </Col>
                  <Col md="3">
                    <Label className="small">Max Value</Label>
                    <Input
                      type="number"
                      value={maxValue}
                      onChange={(e) => setMaxValue(e.target.value)}
                      placeholder="Max value"
                      size="sm"
                    />
                  </Col>
                </>
              )}
            </Row>
          </FormGroup>
        )}

        <div className="d-flex justify-content-end">
          <Button 
            color="success" 
            size="sm" 
            onClick={handleAdd}
            disabled={!canAddField}
            className="me-2"
          >
            ✨ Add {nestingLevel > 0 ? 'Nested ' : ''}Field
          </Button>
          <Button 
            color="secondary" 
            size="sm" 
            onClick={resetForm}
          >
            🔄 Reset
          </Button>
        </div>
      </div>
    );
  };

  // Enhanced conditional field display component with nested support
  const ConditionalFieldDisplay = ({ field, optionValue, onRemove, onAddOption, onRemoveOption, onUpdateProperty, nestingLevel = 0 }) => {
    const [newOption, setNewOption] = useState('');
    const [showNestedAdder, setShowNestedAdder] = useState(false);
    const [selectedParentOption, setSelectedParentOption] = useState('');

    const handleAddOption = () => {
      if (newOption.trim()) {
        onAddOption(newOption.trim());
        setNewOption('');
      }
    };

    const isChoiceType = ['select', 'radio', 'checkbox'].includes(field.type);
    const canHaveChildren = ['select', 'radio'].includes(field.type);

    const addNestedField = (fieldData) => {
      if (selectedParentOption && canHaveChildren) {
        const childFieldId = addConditionalField(
          selectedParentOption,
          fieldData.type,
          fieldData.label,
          fieldData.required,
          field.id
        );
        
        // Update the field with all the additional properties
        updateConditionalFieldProperty(optionValue, childFieldId, 'placeholder', fieldData.placeholder);
        updateConditionalFieldProperty(optionValue, childFieldId, 'helpText', fieldData.helpText);
        updateConditionalFieldProperty(optionValue, childFieldId, 'validation', fieldData.validation);
        
        if (fieldData.options) {
          updateConditionalFieldProperty(optionValue, childFieldId, 'options', fieldData.options);
        }
        if (fieldData.scaleMin !== undefined) {
          updateConditionalFieldProperty(optionValue, childFieldId, 'scaleMin', fieldData.scaleMin);
          updateConditionalFieldProperty(optionValue, childFieldId, 'scaleMax', fieldData.scaleMax);
          updateConditionalFieldProperty(optionValue, childFieldId, 'scaleMinLabel', fieldData.scaleMinLabel);
          updateConditionalFieldProperty(optionValue, childFieldId, 'scaleMaxLabel', fieldData.scaleMaxLabel);
        }
        
        setShowNestedAdder(false);
        setSelectedParentOption('');
      }
    };

    const renderFieldPreview = () => {
      switch (field.type) {
        case 'text':
          return (
            <Input
              type="text"
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              disabled
              size="sm"
              className="mb-2"
            />
          );
        
        case 'textarea':
          return (
            <Input
              type="textarea"
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              disabled
              size="sm"
              rows="2"
              className="mb-2"
            />
          );
        
        case 'select':
          return (
            <Input type="select" disabled size="sm" className="mb-2">
              <option>Select an option...</option>
              {(field.options || []).map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
              {field.showOtherOption && <option>Other...</option>}
            </Input>
          );
        
        case 'radio':
          return (
            <div className="mb-2">
              {(field.options || []).map((option, index) => (
                <FormGroup check key={index} className="mb-1">
                  <Label check className="small">
                    <Input type="radio" name={`preview_${field.id}`} disabled />
                    {option}
                  </Label>
                </FormGroup>
              ))}
              {field.showOtherOption && (
                <FormGroup check className="mb-1">
                  <Label check className="small">
                    <Input type="radio" name={`preview_${field.id}`} disabled />
                    Other: <Input type="text" size="sm" style={{display: 'inline-block', width: '150px', marginLeft: '5px'}} disabled />
                  </Label>
                </FormGroup>
              )}
            </div>
          );
        
        case 'checkbox':
          return (
            <div className="mb-2">
              {(field.options || []).map((option, index) => (
                <FormGroup check key={index} className="mb-1">
                  <Label check className="small">
                    <Input type="checkbox" disabled />
                    {option}
                  </Label>
                </FormGroup>
              ))}
              {field.showOtherOption && (
                <FormGroup check className="mb-1">
                  <Label check className="small">
                    <Input type="checkbox" disabled />
                    Other: <Input type="text" size="sm" style={{display: 'inline-block', width: '150px', marginLeft: '5px'}} disabled />
                  </Label>
                </FormGroup>
              )}
            </div>
          );
        
        case 'linear-scale':
          return (
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="small">{field.scaleMinLabel || field.scaleMin || 1}</span>
              {Array.from({length: (field.scaleMax || 5) - (field.scaleMin || 1) + 1}, (_, i) => (
                <button key={i} className="btn btn-outline-primary btn-sm" disabled>
                  {(field.scaleMin || 1) + i}
                </button>
              ))}
              <span className="small">{field.scaleMaxLabel || field.scaleMax || 5}</span>
            </div>
          );
        
        case 'rating':
          return (
            <div className="d-flex gap-1 mb-2">
              {Array.from({length: field.maxStars || 5}, (_, i) => (
                <span key={i} className="text-warning" style={{fontSize: '1.2em'}}>☆</span>
              ))}
            </div>
          );
        
        case 'grid':
        case 'checkbox-grid':
          if (field.gridRows && field.gridColumns && field.gridRows.length > 0 && field.gridColumns.length > 0) {
            return (
              <table className="table table-sm table-bordered mb-2">
                <thead>
                  <tr>
                    <th></th>
                    {field.gridColumns.map((col, index) => (
                      <th key={index} className="text-center small">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {field.gridRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="small">{row}</td>
                      {field.gridColumns.map((col, colIndex) => (
                        <td key={colIndex} className="text-center">
                          <input 
                            type={field.type === 'grid' ? 'radio' : 'checkbox'} 
                            disabled 
                            name={field.type === 'grid' ? `preview_${field.id}_row_${rowIndex}` : `preview_${field.id}_row_${rowIndex}_col_${colIndex}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          }
          return <div className="small text-muted mb-2">Grid not configured</div>;
        
        default:
          return (
            <Input
              type={field.type}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              disabled
              size="sm"
              className="mb-2"
            />
          );
      }
    };

    return (
      <div 
        className={`border rounded p-3 mb-3 ${nestingLevel > 0 ? 'bg-light border-secondary' : 'bg-white'}`}
        style={{marginLeft: nestingLevel * 20}}
      >
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-1">
              <strong className="small">{field.label}</strong>
              <Badge color={getItemTypeColor(field.type)} size="sm">
                {getItemTypeDisplayName(field.type)}
              </Badge>
              {field.required && <Badge color="danger" size="sm">Required</Badge>}
              {field.conditionalLogic === 'hide' && <Badge color="warning" size="sm">Hide Logic</Badge>}
              {nestingLevel > 0 && <Badge color="info" size="sm">Nested Level {nestingLevel + 1}</Badge>}
            </div>
            
            {field.helpText && (
              <div className="small text-muted mb-2">💡 {field.helpText}</div>
            )}
            
            {field.validation && Object.keys(field.validation).some(key => field.validation[key]) && (
              <div className="small text-info mb-2">
                🔒 Validation: 
                {field.validation.minLength && ` Min: ${field.validation.minLength} chars`}
                {field.validation.maxLength && ` Max: ${field.validation.maxLength} chars`}
                {field.validation.minValue && ` Min: ${field.validation.minValue}`}
                {field.validation.maxValue && ` Max: ${field.validation.maxValue}`}
              </div>
            )}
          </div>
          
          <Button 
            color="danger" 
            size="sm" 
            onClick={onRemove}
            title="Remove field"
          >
            🗑️
          </Button>
        </div>

        {/* Field Preview */}
        <div className="mb-3">
          <div className="small text-muted mb-1">Preview:</div>
          {renderFieldPreview()}
        </div>

        {/* Options Management for Choice Fields */}
        {isChoiceType && (
          <div className="mb-3">
            <div className="d-flex gap-2 mb-2">
              <Input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Add option"
                size="sm"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
              />
              <Button 
                color="primary" 
                size="sm" 
                onClick={handleAddOption}
                disabled={!newOption.trim()}
              >
                Add Option
              </Button>
            </div>
            
            {field.options && field.options.length > 0 && (
              <div>
                <div className="small text-muted mb-1">Current Options:</div>
                {field.options.map((option, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-1 p-2 bg-light rounded">
                    <span className="small">{option}</span>
                    <div className="d-flex gap-1">
                      {canHaveChildren && (
                        <Button
                          color="info"
                          size="sm"
                          onClick={() => {
                            setSelectedParentOption(option);
                            setShowNestedAdder(true);
                          }}
                          title="Add nested field for this option"
                          className="py-0 px-1"
                        >
                          🔗+
                        </Button>
                      )}
                      <Button 
                        color="danger" 
                        size="sm" 
                        onClick={() => onRemoveOption(index)}
                        className="py-0 px-1"
                        title="Remove option"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nested Field Adder */}
        {showNestedAdder && selectedParentOption && (
          <div className="mt-3 border-top pt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0 small">
                🔗 Add Nested Field for: "<strong>{selectedParentOption}</strong>"
              </h6>
              <Button
                color="secondary"
                size="sm"
                onClick={() => {
                  setShowNestedAdder(false);
                  setSelectedParentOption('');
                }}
              >
                Cancel
              </Button>
            </div>
            <ConditionalFieldAdder 
              onAdd={addNestedField}
              parentFieldId={field.id}
              nestingLevel={nestingLevel + 1}
            />
          </div>
        )}

        {/* Display Existing Nested Fields */}
        {canHaveChildren && field.children && Object.keys(field.children).length > 0 && (
          <div className="mt-3 border-top pt-3">
            <h6 className="small mb-2">🌳 Nested Fields:</h6>
            {Object.entries(field.children).map(([parentOption, childIds]) => (
              <div key={parentOption} className="mb-3">
                <div className="small fw-bold text-primary mb-2">
                  When "{parentOption}" is selected:
                </div>
                {Array.isArray(childIds) ? childIds.map(childId => {
                  // Find the child field in conditional fields
                  const childField = Object.values(conditionalFields).flat().find(f => f.id === childId);
                  return childField ? (
                    <ConditionalFieldDisplay
                      key={childId}
                      field={childField}
                      optionValue={parentOption}
                      onRemove={() => removeConditionalField(parentOption, childId)}
                      onAddOption={(optionText) => addConditionalFieldOption(parentOption, childId, optionText)}
                      onRemoveOption={(optionIndex) => removeConditionalFieldOption(parentOption, childId, optionIndex)}
                      onUpdateProperty={(property, value) => updateConditionalFieldProperty(parentOption, childId, property, value)}
                      nestingLevel={nestingLevel + 1}
                    />
                  ) : null;
                }) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="content">
      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">Form Builder</CardTitle>
              <Button 
                color="primary" 
                size="sm" 
                onClick={() => {
                  setFormEditMode(false);
                  setEditingForm(null);
                  setFormData({
                    title: '',
                    description: '',
                    user_uuid: '',
                    country_uuid: '',
                    province_uuid: '',
                    area_uuid: ''
                  });
                  setFormModal(true);
                }}
              >
                Create New Form
              </Button>
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

              <Row>
                {/* Forms List */}
                <Col md="4">
                  <Card>
                    <CardHeader>
                      <CardTitle tag="h5">Forms</CardTitle>
                    </CardHeader>
                    <CardBody style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      {loading && <p>Loading forms...</p>}
                      {forms.length === 0 && !loading && (
                        <p>No forms created yet.</p>
                      )}
                      {forms.map((form) => (
                        <Card 
                          key={form.uuid} 
                          className={`mb-2 cursor-pointer ${selectedForm?.uuid === form.uuid ? 'border-primary' : ''}`}
                          onClick={() => handleSelectForm(form)}
                        >
                          <CardBody className="p-2">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{form.title}</h6>
                                <small className="text-muted">
                                  {form.description?.substring(0, 50)}...
                                </small>
                                <br />
                                <Badge color="info" className="mt-1">
                                  {form.form_items?.length || 0} items
                                </Badge>
                              </div>
                              <div className="d-flex gap-1">
                                <Button 
                                  color="warning" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent card selection
                                    handleEditForm(form);
                                  }}
                                  title="Edit Form"
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                                <Button 
                                  color="danger" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent card selection
                                    handleDeleteForm(form.uuid);
                                  }}
                                  title="Delete Form"
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </CardBody>
                  </Card>
                </Col>

                {/* Form Items */}
                <Col md="8">
                  {selectedForm ? (
                    <Card>
                      <CardHeader>
                        <CardTitle tag="h5">
                          Form Items - {selectedForm.title}
                        </CardTitle>
                        <Button 
                          color="success" 
                          size="sm" 
                          onClick={() => {
                            setEditMode(false);
                            setEditingItem(null);
                            setItemModal(true);
                            setFieldOptions([]);
                            setNewOptionText('');
                            setConditionalFields({});
                            setSelectedOptionForCondition('');
                            setItemData({
                              question: '',
                              item_type: 'text',
                              required: false,
                              sort_order: 0,
                              options: '',
                              form_uuid: ''
                            });
                          }}
                        >
                          Add Form Item
                        </Button>
                      </CardHeader>
                      <CardBody>
                        {formItems.length === 0 ? (
                          <p>No form items yet. Add some questions to get started.</p>
                        ) : (
                          <Table responsive>
                            <thead>
                              <tr>
                                <th>Order</th>
                                <th>Question</th>
                                <th>Type</th>
                                <th>Options</th>
                                <th>Required</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formItems.map((item) => (
                                <tr key={item.uuid}>
                                  <td>{item.sort_order}</td>
                                  <td>{item.question}</td>
                                  <td>
                                    <Badge color={getItemTypeColor(item.item_type)}>
                                      {getItemTypeDisplayName(item.item_type)}
                                    </Badge>
                                  </td>
                                  <td>
                                    {item.options ? (
                                      <div>
                                        <div className="d-flex flex-wrap gap-1 mb-1">
                                          {item.options.split(',').slice(0, 3).map((option, index) => (
                                            <Badge key={index} color="light" className="text-dark">
                                              {option.trim()}
                                            </Badge>
                                          ))}
                                          {item.options.split(',').length > 3 && (
                                            <Badge color="secondary">
                                              +{item.options.split(',').length - 3} more
                                            </Badge>
                                          )}
                                        </div>
                                        {item.conditional_fields && JSON.parse(item.conditional_fields || '{}') && Object.keys(JSON.parse(item.conditional_fields || '{}')).length > 0 && (
                                          <Badge color="info" className="small">
                                            Has Conditions
                                          </Badge>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                  <td>
                                    <Badge color={item.required ? 'danger' : 'secondary'}>
                                      {item.required ? 'Required' : 'Optional'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Button 
                                      color="warning" 
                                      size="sm" 
                                      className="me-1"
                                      onClick={() => handleEditItem(item)}
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      color="danger" 
                                      size="sm"
                                      onClick={() => handleDeleteItem(item.uuid)}
                                    >
                                      Delete
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        )}
                      </CardBody>
                    </Card>
                  ) : (
                    <Card>
                      <CardBody className="text-center">
                        <h5>Select a form to view its items</h5>
                        <p className="text-muted">
                          Choose a form from the left panel to see and manage its questions.
                        </p>
                      </CardBody>
                    </Card>
                  )}
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Create Form Modal */}
      <Modal isOpen={formModal} toggle={() => setFormModal(false)}>
        <ModalHeader toggle={() => {
          setFormModal(false);
          setFormEditMode(false);
          setEditingForm(null);
          setFormData({
            title: '',
            description: '',
            user_uuid: '',
            country_uuid: '',
            province_uuid: '',
            area_uuid: ''
          });
        }}>
          {formEditMode ? 'Edit Form' : 'Create New Form'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="title">Form Title *</Label>
              <Input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter form title"
              />
            </FormGroup>
            {/* <FormGroup>
              <Label for="description">Description</Label>
              <Input
                type="textarea"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter form description"
                rows="3"
              />
            </FormGroup> */}
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => {
            setFormModal(false);
            setFormEditMode(false);
            setEditingForm(null);
            setFormData({
              title: '',
              description: '',
              user_uuid: '',
              country_uuid: '',
              province_uuid: '',
              area_uuid: ''
            });
          }}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onClick={handleCreateForm}
            disabled={!formData.title || loading}
          >
            {loading ? (formEditMode ? 'Updating...' : 'Creating...') : (formEditMode ? 'Update Form' : 'Create Form')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Create Form Item Modal */}
      <Modal isOpen={itemModal} toggle={() => {
        setItemModal(false);
        setEditMode(false);
        setEditingItem(null);
        setFieldOptions([]);
        setNewOptionText('');
        setConditionalFields({});
        setSelectedOptionForCondition('');
      }} size="xl">
        <ModalHeader toggle={() => {
          setItemModal(false);
          setEditMode(false);
          setEditingItem(null);
          setFieldOptions([]);
          setNewOptionText('');
          setConditionalFields({});
          setSelectedOptionForCondition('');
        }}>
          {editMode ? 'Edit Form Item' : 'Add Form Item'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="question">Question *</Label>
              <Input
                type="text"
                id="question"
                value={itemData.question}
                onChange={(e) => setItemData({...itemData, question: e.target.value})}
                placeholder="Enter question"
              />
            </FormGroup>
            <FormGroup>
              <Label for="item_type">Field Type *</Label>
              <Input
                type="select"
                id="item_type"
                value={itemData.item_type}
                onChange={(e) => handleFieldTypeChange(e.target.value)}
              >
                <option value="text">Short Answer (Text Input)</option>
                <option value="textarea">Paragraph (Long Text)</option>
                <option value="select">Dropdown</option>
                <option value="radio">Multiple Choice (Radio)</option>
                <option value="checkbox">Checkboxes</option>
                <option value="file">File Upload</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="url">URL</option>
                <option value="tel">Phone Number</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
                <option value="datetime-local">Date & Time</option>
                <option value="linear-scale">Linear Scale</option>
                <option value="rating">Star Rating</option>
                <option value="grid">Multiple Choice Grid</option>
                <option value="checkbox-grid">Checkbox Grid</option>
                <option value="section">Section Break</option>
                <option value="page-break">Page Break</option>
                <option value="camera">Camera</option>
                <option value="signature">Digital Signature</option>
                <option value="range">Range Slider</option>
                <option value="color">Color Picker</option>
                <option value="password">Password</option>
              </Input>
            </FormGroup>

            {/* Help Text and Placeholder Section */}
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="description">Help Text (Optional)</Label>
                  <Input
                    type="textarea"
                    id="description"
                    value={itemData.description || ''}
                    onChange={(e) => setItemData({...itemData, description: e.target.value})}
                    placeholder="Add help text for this field"
                    rows="2"
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="placeholder">Placeholder Text (Optional)</Label>
                  <Input
                    type="text"
                    id="placeholder"
                    value={itemData.placeholder || ''}
                    onChange={(e) => setItemData({...itemData, placeholder: e.target.value})}
                    placeholder="Enter placeholder text"
                  />
                </FormGroup>
              </Col>
            </Row>

            {/* Linear Scale Configuration */}
            {itemData.item_type === 'linear-scale' && (
              <FormGroup>
                <Label>Linear Scale Configuration *</Label>
                <Row>
                  <Col md="3">
                    <Label>Min Value</Label>
                    <Input
                      type="number"
                      value={itemData.scaleMin}
                      onChange={(e) => setItemData({...itemData, scaleMin: parseInt(e.target.value) || 1})}
                      min="0"
                      max="10"
                    />
                  </Col>
                  <Col md="3">
                    <Label>Max Value</Label>
                    <Input
                      type="number"
                      value={itemData.scaleMax}
                      onChange={(e) => setItemData({...itemData, scaleMax: parseInt(e.target.value) || 5})}
                      min="2"
                      max="10"
                    />
                  </Col>
                  <Col md="3">
                    <Label>Min Label (Optional)</Label>
                    <Input
                      type="text"
                      value={itemData.scaleMinLabel}
                      onChange={(e) => setItemData({...itemData, scaleMinLabel: e.target.value})}
                      placeholder="e.g., Poor"
                    />
                  </Col>
                  <Col md="3">
                    <Label>Max Label (Optional)</Label>
                    <Input
                      type="text"
                      value={itemData.scaleMaxLabel}
                      onChange={(e) => setItemData({...itemData, scaleMaxLabel: e.target.value})}
                      placeholder="e.g., Excellent"
                    />
                  </Col>
                </Row>
                <div className="mt-2 p-2 bg-light rounded">
                  <small className="text-muted">Preview: </small>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span className="small">{itemData.scaleMinLabel || itemData.scaleMin}</span>
                    {Array.from({length: itemData.scaleMax - itemData.scaleMin + 1}, (_, i) => (
                      <button key={i} className="btn btn-outline-primary btn-sm" disabled>
                        {itemData.scaleMin + i}
                      </button>
                    ))}
                    <span className="small">{itemData.scaleMaxLabel || itemData.scaleMax}</span>
                  </div>
                </div>
              </FormGroup>
            )}

            {/* Rating Configuration */}
            {itemData.item_type === 'rating' && (
              <FormGroup>
                <Label>Star Rating Configuration *</Label>
                <Row>
                  <Col md="6">
                    <Label>Maximum Stars</Label>
                    <Input
                      type="number"
                      value={itemData.maxStars}
                      onChange={(e) => setItemData({...itemData, maxStars: parseInt(e.target.value) || 5})}
                      min="1"
                      max="10"
                    />
                  </Col>
                </Row>
                <div className="mt-2 p-2 bg-light rounded">
                  <small className="text-muted">Preview: </small>
                  <div className="d-flex gap-1 mt-1">
                    {Array.from({length: itemData.maxStars}, (_, i) => (
                      <span key={i} className="text-warning" style={{fontSize: '1.2em'}}>☆</span>
                    ))}
                  </div>
                </div>
              </FormGroup>
            )}

            {/* Grid Configuration */}
            {(itemData.item_type === 'grid' || itemData.item_type === 'checkbox-grid') && (
              <FormGroup>
                <Label>{itemData.item_type === 'grid' ? 'Multiple Choice Grid' : 'Checkbox Grid'} Configuration *</Label>
                
                {/* Rows */}
                <div className="mb-3">
                  <Label>Rows (Questions)</Label>
                  <div className="d-flex mb-2">
                    <Input
                      type="text"
                      value={newRowText}
                      onChange={(e) => setNewRowText(e.target.value)}
                      placeholder="Add row question"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGridRow())}
                      className="me-2"
                    />
                    <Button 
                      color="primary" 
                      size="sm" 
                      onClick={addGridRow}
                      disabled={!newRowText.trim()}
                    >
                      Add Row
                    </Button>
                  </div>
                  {itemData.gridRows.length > 0 && (
                    <div className="border rounded p-2">
                      {itemData.gridRows.map((row, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-1 p-1 bg-light rounded">
                          <span className="small">{row}</span>
                          <Button 
                            color="danger" 
                            size="sm" 
                            onClick={() => removeGridRow(index)}
                            className="py-0 px-1"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Columns */}
                <div className="mb-3">
                  <Label>Columns (Options)</Label>
                  <div className="d-flex mb-2">
                    <Input
                      type="text"
                      value={newColumnText}
                      onChange={(e) => setNewColumnText(e.target.value)}
                      placeholder="Add column option"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGridColumn())}
                      className="me-2"
                    />
                    <Button 
                      color="primary" 
                      size="sm" 
                      onClick={addGridColumn}
                      disabled={!newColumnText.trim()}
                    >
                      Add Column
                    </Button>
                  </div>
                  {itemData.gridColumns.length > 0 && (
                    <div className="border rounded p-2">
                      {itemData.gridColumns.map((column, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-1 p-1 bg-light rounded">
                          <span className="small">{column}</span>
                          <Button 
                            color="danger" 
                            size="sm" 
                            onClick={() => removeGridColumn(index)}
                            className="py-0 px-1"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grid Preview */}
                {itemData.gridRows.length > 0 && itemData.gridColumns.length > 0 && (
                  <div className="mt-2 p-2 bg-light rounded">
                    <small className="text-muted">Preview:</small>
                    <table className="table table-sm table-bordered mt-1">
                      <thead>
                        <tr>
                          <th></th>
                          {itemData.gridColumns.map((col, index) => (
                            <th key={index} className="text-center small">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {itemData.gridRows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            <td className="small">{row}</td>
                            {itemData.gridColumns.map((col, colIndex) => (
                              <td key={colIndex} className="text-center">
                                <input 
                                  type={itemData.item_type === 'grid' ? 'radio' : 'checkbox'} 
                                  disabled 
                                  name={itemData.item_type === 'grid' ? `row_${rowIndex}` : `row_${rowIndex}_col_${colIndex}`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </FormGroup>
            )}

            {/* File Upload Configuration */}
            {itemData.item_type === 'file' && (
              <FormGroup>
                <Label>File Upload Configuration</Label>
                <Row>
                  <Col md="6">
                    <Label>Allowed File Types (Optional)</Label>
                    <Input
                      type="text"
                      value={itemData.allowedFileTypes || ''}
                      onChange={(e) => setItemData({...itemData, allowedFileTypes: e.target.value})}
                      placeholder="e.g., .pdf,.doc,.jpg,.png"
                    />
                    <small className="text-muted">Separate multiple types with commas</small>
                  </Col>
                  <Col md="6">
                    <Label>Max File Size (Optional)</Label>
                    <Input
                      type="text"
                      value={itemData.maxFileSize || ''}
                      onChange={(e) => setItemData({...itemData, maxFileSize: e.target.value})}
                      placeholder="e.g., 10MB, 1GB"
                    />
                  </Col>
                </Row>
                <FormGroup check className="mt-2">
                  <Label check>
                    <Input
                      type="checkbox"
                      checked={itemData.allowMultipleFiles || false}
                      onChange={(e) => setItemData({...itemData, allowMultipleFiles: e.target.checked})}
                    />
                    <span className="ms-1">Allow multiple files</span>
                  </Label>
                </FormGroup>
              </FormGroup>
            )}

            {/* Standard Options Section */}
            {['select', 'radio', 'checkbox'].includes(itemData.item_type) && (
              <FormGroup>
                <Label>Options *</Label>
                <div className="mb-2">
                  <div className="d-flex">
                    <Input
                      type="text"
                      value={newOptionText}
                      onChange={(e) => setNewOptionText(e.target.value)}
                      placeholder={`Add ${itemData.item_type === 'select' ? 'dropdown option' : 
                                           itemData.item_type === 'radio' ? 'radio button option' : 
                                           'checkbox option'}`}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                      className="me-2"
                    />
                    <Button 
                      color="primary" 
                      size="sm" 
                      onClick={addOption}
                      disabled={!newOptionText.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Advanced Options */}
                <Row className="mb-2">
                  <Col md="6">
                    <FormGroup check>
                      <Label check>
                        <Input
                          type="checkbox"
                          checked={itemData.showOtherOption || false}
                          onChange={(e) => setItemData({...itemData, showOtherOption: e.target.checked})}
                        />
                        <span className="ms-1">Add "Other" option</span>
                      </Label>
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup check>
                      <Label check>
                        <Input
                          type="checkbox"
                          checked={itemData.randomizeOptions || false}
                          onChange={(e) => setItemData({...itemData, randomizeOptions: e.target.checked})}
                        />
                        <span className="ms-1">Randomize option order</span>
                      </Label>
                    </FormGroup>
                  </Col>
                </Row>
                
                {fieldOptions.length > 0 && (
                  <div className="border rounded p-3">
                    <Label className="mb-2">Preview ({itemData.item_type}):</Label>
                    
                    {itemData.item_type === 'select' && (
                      <div>
                        <Input type="select" disabled>
                          <option>Select an option...</option>
                          {fieldOptions.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                          ))}
                          {itemData.showOtherOption && <option>Other...</option>}
                        </Input>
                      </div>
                    )}

                    {itemData.item_type === 'radio' && (
                      <div>
                        {fieldOptions.map((option, index) => (
                          <FormGroup check key={index} className="mb-1">
                            <Label check>
                              <Input type="radio" name="preview_radio" disabled />
                              {option}
                            </Label>
                          </FormGroup>
                        ))}
                        {itemData.showOtherOption && (
                          <FormGroup check className="mb-1">
                            <Label check>
                              <Input type="radio" name="preview_radio" disabled />
                              Other: <Input type="text" size="sm" style={{display: 'inline-block', width: '200px', marginLeft: '5px'}} disabled />
                            </Label>
                          </FormGroup>
                        )}
                      </div>
                    )}

                    {itemData.item_type === 'checkbox' && (
                      <div>
                        {fieldOptions.map((option, index) => (
                          <FormGroup check key={index} className="mb-1">
                            <Label check>
                              <Input type="checkbox" disabled />
                              {option}
                            </Label>
                          </FormGroup>
                        ))}
                        {itemData.showOtherOption && (
                          <FormGroup check className="mb-1">
                            <Label check>
                              <Input type="checkbox" disabled />
                              Other: <Input type="text" size="sm" style={{display: 'inline-block', width: '200px', marginLeft: '5px'}} disabled />
                            </Label>
                          </FormGroup>
                        )}
                      </div>
                    )}

                    <div className="mt-3">
                      <Label className="mb-2">Manage Options:</Label>
                      {fieldOptions.map((option, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-1 p-2 bg-light rounded">
                          <span>{option}</span>
                          <Button 
                            color="danger" 
                            size="sm" 
                            onClick={() => removeOption(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {fieldOptions.length === 0 && (
                  <small className="text-muted">
                    {itemData.item_type === 'select' && 'Add options for the dropdown list'}
                    {itemData.item_type === 'radio' && 'Add options for radio buttons (users can select only one)'}
                    {itemData.item_type === 'checkbox' && 'Add options for checkboxes (users can select multiple)'}
                  </small>
                )}
              </FormGroup>
            )}

            {/* Validation Rules Section */}
            {!['section', 'page-break'].includes(itemData.item_type) && (
              <FormGroup>
                <Label>Field Validation</Label>
                <Row>
                  <Col md="6">
                    <FormGroup check>
                      <Label check>
                        <Input
                          type="checkbox"
                          checked={itemData.required || false}
                          onChange={(e) => setItemData({...itemData, required: e.target.checked})}
                        />
                        <span className="ms-1">Required field</span>
                      </Label>
                    </FormGroup>
                  </Col>
                  {itemData.item_type === 'text' && (
                    <>
                      <Col md="3">
                        <Label>Min Length</Label>
                        <Input
                          type="number"
                          value={itemData.validation?.minLength || ''}
                          onChange={(e) => setItemData({
                            ...itemData, 
                            validation: {...itemData.validation, minLength: e.target.value}
                          })}
                          placeholder="Min chars"
                          min="0"
                        />
                      </Col>
                      <Col md="3">
                        <Label>Max Length</Label>
                        <Input
                          type="number"
                          value={itemData.validation?.maxLength || ''}
                          onChange={(e) => setItemData({
                            ...itemData, 
                            validation: {...itemData.validation, maxLength: e.target.value}
                          })}
                          placeholder="Max chars"
                          min="1"
                        />
                      </Col>
                    </>
                  )}
                  {itemData.item_type === 'number' && (
                    <>
                      <Col md="3">
                        <Label>Min Value</Label>
                        <Input
                          type="number"
                          value={itemData.validation?.min || ''}
                          onChange={(e) => setItemData({
                            ...itemData, 
                            validation: {...itemData.validation, min: e.target.value}
                          })}
                          placeholder="Min value"
                        />
                      </Col>
                      <Col md="3">
                        <Label>Max Value</Label>
                        <Input
                          type="number"
                          value={itemData.validation?.max || ''}
                          onChange={(e) => setItemData({
                            ...itemData, 
                            validation: {...itemData.validation, max: e.target.value}
                          })}
                          placeholder="Max value"
                        />
                      </Col>
                    </>
                  )}
                </Row>
              </FormGroup>
            )}

            {/* Enhanced Conditional Fields Section - Support for multiple field types */}
            {['select', 'radio'].includes(itemData.item_type) && fieldOptions.length > 0 && (
              <FormGroup>
                <Label className="d-flex align-items-center gap-2">
                  <span>🧠 Advanced Conditional Logic</span>
                  <Badge color="info" size="sm">Enhanced</Badge>
                </Label>
                <small className="text-muted d-block mb-3">
                  Create sophisticated forms with fields that appear/hide based on user selections. 
                  Support for nested conditions, multiple field types, and complex validation rules.
                </small>
                
                <div className="mb-4 p-3 border rounded bg-light">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <h6 className="mb-0">🎯 Select option to add conditional logic:</h6>
                    <Badge color="primary" size="sm">{itemData.item_type === 'select' ? 'Dropdown' : 'Multiple Choice'}</Badge>
                  </div>
                  <Input
                    type="select"
                    value={selectedOptionForCondition}
                    onChange={(e) => setSelectedOptionForCondition(e.target.value)}
                    className="mb-2"
                  >
                    <option value="">🔽 Choose an option to add conditions...</option>
                    {fieldOptions.map((option, index) => (
                      <option key={index} value={option}>
                        ✨ {option} {conditionalFields[option]?.length > 0 ? `(${conditionalFields[option].length} conditional fields)` : ''}
                      </option>
                    ))}
                  </Input>

                  {selectedOptionForCondition && (
                    <div className="alert alert-info small mb-0">
                      <strong>💡 Pro Tip:</strong> You can create nested conditions by adding dropdown or multiple choice fields, 
                      then adding conditions to their options. Build complex decision trees with unlimited nesting!
                    </div>
                  )}
                </div>

                {selectedOptionForCondition && (
                  <div className="border rounded p-4 mb-4 bg-white shadow-sm">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <h5 className="mb-0">🔧 Building conditions for:</h5>
                      <Badge color="success" size="lg">{selectedOptionForCondition}</Badge>
                    </div>
                    
                    <div className="mb-4">
                      <ConditionalFieldAdder 
                        onAdd={(fieldData) => {
                          const fieldId = addConditionalField(
                            selectedOptionForCondition, 
                            fieldData.type, 
                            fieldData.label, 
                            fieldData.required
                          );
                          
                          // Update with enhanced properties
                          updateConditionalFieldProperty(selectedOptionForCondition, fieldId, 'placeholder', fieldData.placeholder);
                          updateConditionalFieldProperty(selectedOptionForCondition, fieldId, 'helpText', fieldData.helpText);
                          updateConditionalFieldProperty(selectedOptionForCondition, fieldId, 'validation', fieldData.validation);
                          updateConditionalFieldProperty(selectedOptionForCondition, fieldId, 'conditionalLogic', fieldData.conditionalLogic);
                          
                          if (fieldData.options) {
                            updateConditionalFieldProperty(selectedOptionForCondition, fieldId, 'options', fieldData.options);
                            updateConditionalFieldProperty(selectedOptionForCondition, fieldId, 'showOtherOption', fieldData.showOtherOption);
                            updateConditionalFieldProperty(selectedOptionForCondition, fieldId, 'randomizeOptions', fieldData.randomizeOptions);
                          }
                          
                          if (fieldData.scaleMin !== undefined) {
                            updateConditionalFieldProperty(selectedOptionForCondition, fieldId, 'scaleMin', fieldData.scaleMin);
                            updateConditionalFieldProperty(selectedOptionForCondition, fieldId, 'scaleMax', fieldData.scaleMax);
                            updateConditionalFieldProperty(selectedOptionForCondition, fieldId, 'scaleMinLabel', fieldData.scaleMinLabel);
                            updateConditionalFieldProperty(selectedOptionForCondition, fieldId, 'scaleMaxLabel', fieldData.scaleMaxLabel);
                          }
                          
                          if (fieldData.maxStars !== undefined) {
                            updateConditionalFieldProperty(selectedOptionForCondition, fieldId, 'maxStars', fieldData.maxStars);
                          }
                          
                          if (fieldData.gridRows) {
                            updateConditionalFieldProperty(selectedOptionForCondition, fieldId, 'gridRows', fieldData.gridRows);
                            updateConditionalFieldProperty(selectedOptionForCondition, fieldId, 'gridColumns', fieldData.gridColumns);
                          }
                        }}
                        nestingLevel={0}
                      />
                    </div>

                    {conditionalFields[selectedOptionForCondition]?.length > 0 && (
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <h6 className="mb-0">🌟 Current conditional fields:</h6>
                          <Badge color="success" size="sm">
                            {conditionalFields[selectedOptionForCondition].length} field{conditionalFields[selectedOptionForCondition].length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        {conditionalFields[selectedOptionForCondition].map((field) => (
                          <ConditionalFieldDisplay
                            key={field.id}
                            field={field}
                            optionValue={selectedOptionForCondition}
                            onRemove={() => removeConditionalField(selectedOptionForCondition, field.id)}
                            onAddOption={(optionText) => addConditionalFieldOption(selectedOptionForCondition, field.id, optionText)}
                            onRemoveOption={(optionIndex) => removeConditionalFieldOption(selectedOptionForCondition, field.id, optionIndex)}
                            onUpdateProperty={(property, value) => updateConditionalFieldProperty(selectedOptionForCondition, field.id, property, value)}
                            nestingLevel={0}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Conditional Fields Summary */}
                {Object.keys(conditionalFields).length > 0 && (
                  <div className="border rounded p-4 bg-gradient" style={{background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'}}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <h6 className="mb-0">📊 Conditional Logic Summary</h6>
                      <Badge color="primary" size="sm">
                        {Object.keys(conditionalFields).length} option{Object.keys(conditionalFields).length !== 1 ? 's' : ''} with conditions
                      </Badge>
                    </div>
                    
                    <div className="row">
                      {Object.entries(conditionalFields).map(([optionValue, fields]) => (
                        <div key={optionValue} className="col-md-6 mb-3">
                          <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-3">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <h6 className="card-title mb-0 text-primary">"{optionValue}"</h6>
                                <Badge color="info" size="sm">{fields.length} field{fields.length !== 1 ? 's' : ''}</Badge>
                              </div>
                              <div className="small">
                                {fields.map((field, index) => (
                                  <div key={field.id} className="d-flex align-items-center gap-2 mb-1">
                                    <Badge color={getItemTypeColor(field.type)} size="sm">
                                      {getItemTypeDisplayName(field.type)}
                                    </Badge>
                                    <span className="text-muted">{field.label}</span>
                                    {field.required && <Badge color="danger" size="sm">Required</Badge>}
                                    {field.children && Object.keys(field.children).length > 0 && (
                                      <Badge color="warning" size="sm">Has nested</Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                              
                              <div className="mt-2 pt-2 border-top">
                                <small className="text-muted">
                                  <strong>Logic:</strong> Fields will {fields[0]?.conditionalLogic || 'show'} when "{optionValue}" is selected
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 p-3 bg-white rounded border">
                      <div className="small text-muted">
                        <strong>🎯 Form Flow Preview:</strong>
                        <ul className="mb-0 mt-1">
                          <li>User sees main question: "<strong>{itemData.question}</strong>"</li>
                          {Object.entries(conditionalFields).map(([optionValue, fields]) => (
                            <li key={optionValue}>
                              When "<strong>{optionValue}</strong>" is selected → {fields.length} additional field{fields.length !== 1 ? 's' : ''} appear
                              {fields.some(f => f.children && Object.keys(f.children).length > 0) && (
                                <span className="text-info"> (with nested conditions)</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {Object.keys(conditionalFields).length === 0 && (
                  <div className="text-center p-4 border rounded bg-light">
                    <div className="text-muted mb-2">
                      <i className="fas fa-magic fa-2x"></i>
                    </div>
                    <h6 className="text-muted">No conditional fields yet</h6>
                    <small className="text-muted">
                      Select an option above to start building dynamic, intelligent forms!
                    </small>
                  </div>
                )}
              </FormGroup>
            )}

            {/* Remove Sort Order field - auto-calculated */}
            {/* <FormGroup>
              <Label for="sort_order">Sort Order</Label>
              <Input
                type="number"
                id="sort_order"
                value={itemData.sort_order}
                onChange={(e) => setItemData({...itemData, sort_order: parseInt(e.target.value)})}
                placeholder="0"
              />
            </FormGroup> */}
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => {
            setItemModal(false);
            setEditMode(false);
            setEditingItem(null);
            setFieldOptions([]);
            setNewOptionText('');
            setNewRowText('');
            setNewColumnText('');
            setConditionalFields({});
            setSelectedOptionForCondition('');
            setItemData({
              question: '',
              item_type: 'text',
              required: false,
              sort_order: 0,
              options: '',
              form_uuid: '',
              description: '',
              placeholder: '',
              validation: {},
              scaleMin: 1,
              scaleMax: 5,
              scaleMinLabel: '',
              scaleMaxLabel: '',
              maxStars: 5,
              gridRows: [],
              gridColumns: [],
              allowedFileTypes: '',
              maxFileSize: '',
              showOtherOption: false,
              randomizeOptions: false,
              allowMultipleFiles: false
            });
          }}>
            Cancel
          </Button>
          <Button 
            color="success" 
            onClick={handleCreateFormItem}
            disabled={
              !selectedForm ||
              !itemData.question.trim() || 
              (isOptionsRequired() && (
                (['select', 'radio', 'checkbox'].includes(itemData.item_type) && fieldOptions.length === 0) ||
                (itemData.item_type === 'linear-scale' && (itemData.scaleMin >= itemData.scaleMax)) ||
                (itemData.item_type === 'rating' && (!itemData.maxStars || itemData.maxStars < 1)) ||
                (['grid', 'checkbox-grid'].includes(itemData.item_type) && (itemData.gridRows.length === 0 || itemData.gridColumns.length === 0))
              )) || 
              loading
            }
          >
            {loading ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Item' : 'Add Item')}
          </Button>
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-small text-muted">
              Debug: Mode: {editMode ? 'Edit' : 'Create'}, 
              Form: {selectedForm ? '✓' : '✗'}, 
              Question: {itemData.question ? '✓' : '✗'}, 
              Type: {itemData.item_type},
              Options: {isOptionsRequired() ? (
                ['select', 'radio', 'checkbox'].includes(itemData.item_type) ? (fieldOptions.length > 0 ? '✓' : '✗') :
                itemData.item_type === 'linear-scale' ? (itemData.scaleMin < itemData.scaleMax ? '✓' : '✗') :
                itemData.item_type === 'rating' ? (itemData.maxStars > 0 ? '✓' : '✗') :
                ['grid', 'checkbox-grid'].includes(itemData.item_type) ? 
                  (itemData.gridRows.length > 0 && itemData.gridColumns.length > 0 ? '✓' : '✗') : 'N/A'
              ) : 'N/A'}, 
              Loading: {loading ? 'Yes' : 'No'}
            </div>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default FormBuilder;
