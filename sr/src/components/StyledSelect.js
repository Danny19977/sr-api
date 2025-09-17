import React, { useState, useRef, useEffect } from 'react';
import './StyledSelect.css';

const StyledSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select an option...", 
  name,
  required = false,
  searchable = false,
  icon = null,
  disabled = false,
  maxHeight = "200px"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  useEffect(() => {
    if (searchable && searchTerm) {
      const filtered = options.filter(option =>
        (typeof option === 'string' ? option : option.label)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options, searchable]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    const selectedValue = typeof option === 'string' ? option : option.value;
    onChange({ target: { name, value: selectedValue } });
    setIsOpen(false);
    setSearchTerm('');
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }
  };

  const getDisplayValue = () => {
    if (!value) return placeholder;
    const selectedOption = options.find(option => 
      (typeof option === 'string' ? option : option.value) === value
    );
    return typeof selectedOption === 'string' ? selectedOption : selectedOption?.label || value;
  };

  return (
    <div className={`styled-select ${disabled ? 'disabled' : ''}`} ref={dropdownRef}>
      <div 
        className={`select-trigger ${isOpen ? 'open' : ''} ${value ? 'has-value' : ''}`}
        onClick={toggleDropdown}
      >
        <div className="select-content">
          {icon && <span className="select-icon">{icon}</span>}
          <span className="select-value">{getDisplayValue()}</span>
          {required && !value && <span className="required-asterisk">*</span>}
        </div>
        <div className="select-arrow">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      
      {isOpen && (
        <div className="select-dropdown" style={{ maxHeight }}>
          {searchable && (
            <div className="search-container">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                onClick={(e) => e.stopPropagation()}
              />
              <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M7 12C9.7614 12 12 9.7614 12 7C12 4.2386 9.7614 2 7 2C4.2386 2 2 4.2386 2 7C2 9.7614 4.2386 12 7 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 14L10.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
          
          <div className="options-container">
            {filteredOptions.length === 0 ? (
              <div className="no-options">No options found</div>
            ) : (
              filteredOptions.map((option, index) => {
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : option.label;
                const isSelected = optionValue === value;
                
                return (
                  <div
                    key={index}
                    className={`select-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(option)}
                  >
                    <span className="option-text">{optionLabel}</span>
                    {isSelected && (
                      <svg className="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyledSelect;
