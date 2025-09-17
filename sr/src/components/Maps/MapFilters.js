import React from 'react';
import { Button, Row, Col, Form } from 'react-bootstrap';
import StyledSelect from '../StyledSelect';
import FilterStatus from './FilterStatus';

const MapFilters = ({
  searchText,
  setSearchText,
  filterOptions,
  setFilterOptions,
  uniqueFilterValues,
  searchSuggestions,
  showSuggestions,
  setShowSuggestions,
  activeFiltersCount,
  clearFilters,
  showFilters,
  setShowFilters,
  filteredDataCount,
  rawDataCount
}) => {
  
  const handleFilterChange = (filterType, selectedOptions) => {
    console.log(`🎛️ Filter change - ${filterType}:`, selectedOptions);
    
    // Ensure selectedOptions is always treated as an array
    let values = [];
    if (selectedOptions) {
      if (Array.isArray(selectedOptions)) {
        values = selectedOptions.map(opt => opt.value);
      } else if (selectedOptions.value) {
        // Single selection case
        values = [selectedOptions.value];
      }
    }
    
    setFilterOptions(prev => {
      const newFilters = {
        ...prev,
        [filterType]: values
      };
      console.log("🎛️ New filter options:", newFilters);
      return newFilters;
    });
  };

  return (
    <div>
      {/* Search Bar */}
      <Row className="mb-3">
        <Col md="8">
          <div style={{ position: "relative" }}>
            <div className="input-group" style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <span className="input-group-text bg-white border-0" style={{ fontSize: "18px" }}>🔍</span>
              <input
                type="text"
                className="form-control border-0"
                placeholder="Search by name, area, user, province..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => setShowSuggestions(searchText.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                style={{ 
                  fontSize: "16px", 
                  padding: "12px 16px",
                  backgroundColor: "white"
                }}
              />
              {searchText && (
                <button 
                  className="btn btn-outline-secondary border-0"
                  onClick={() => setSearchText("")}
                  style={{ backgroundColor: "white" }}
                >
                  ✖️
                </button>
              )}
            </div>
            
            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="position-absolute w-100" style={{ top: "100%", zIndex: 1000 }}>
                <div className="bg-white border-0 shadow-lg" style={{ borderRadius: "8px", marginTop: "4px" }}>
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-2 border-bottom"
                      style={{ cursor: "pointer", fontSize: "14px" }}
                      onMouseDown={() => {
                        setSearchText(suggestion);
                        setShowSuggestions(false);
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                    >
                      🔍 {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Filter Toggle and Stats */}
      <Row className="mb-3">
        <Col md="12">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="d-flex align-items-center gap-2 mb-2 mb-md-0">
              <Button
                variant="light"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                style={{ 
                  borderRadius: "20px", 
                  fontWeight: "600",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}
              >
                🎛️ Advanced Filters {activeFiltersCount > 0 && (
                  <span className="badge bg-danger ms-2">{activeFiltersCount}</span>
                )}
              </Button>
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={clearFilters}
                  style={{ 
                    borderRadius: "20px", 
                    fontWeight: "600"
                  }}
                >
                  🗑️ Clear Filters
                </Button>
              )}
            </div>
            
            <FilterStatus
              searchText={searchText}
              filterOptions={filterOptions}
              filteredDataCount={filteredDataCount}
              rawDataCount={rawDataCount}
              uniqueFilterValues={uniqueFilterValues}
            />
          </div>
        </Col>
      </Row>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="animate__animated animate__fadeIn">
          <Row className="mb-3">
            <Col md="12">
              <div 
                className="p-4 rounded-lg border-0"
                style={{ 
                  background: "rgba(255,255,255,0.95)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "16px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
                }}
              >
                <h5 className="mb-3" style={{ color: "#2c3e50", fontWeight: "600" }}>
                  🎛️ Advanced Filters
                </h5>
                
                <Row>
                  <Col md="4" className="mb-3">
                    <Form.Label style={{ fontWeight: "600", color: "#34495e" }}>
                      🏢 Filter by Area
                    </Form.Label>
                    <StyledSelect
                      isMulti
                      options={Array.from(uniqueFilterValues.area).map(area => ({ 
                        value: area, 
                        label: area 
                      }))}
                      value={Array.isArray(filterOptions.area) ? filterOptions.area.map(area => ({ value: area, label: area })) : []}
                      onChange={(selectedOptions) => handleFilterChange('area', selectedOptions)}
                      placeholder="Select areas..."
                      className="filter-select"
                    />
                  </Col>
                  
                  <Col md="4" className="mb-3">
                    <Form.Label style={{ fontWeight: "600", color: "#34495e" }}>
                      👤 Filter by User
                    </Form.Label>
                    <StyledSelect
                      isMulti
                      options={Array.from(uniqueFilterValues.user).map(user => ({ 
                        value: user, 
                        label: user 
                      }))}
                      value={Array.isArray(filterOptions.user) ? filterOptions.user.map(user => ({ value: user, label: user })) : []}
                      onChange={(selectedOptions) => handleFilterChange('user', selectedOptions)}
                      placeholder="Select users..."
                      className="filter-select"
                    />
                  </Col>
                  
                  <Col md="4" className="mb-3">
                    <Form.Label style={{ fontWeight: "600", color: "#34495e" }}>
                      🗺️ Filter by Province
                    </Form.Label>
                    <StyledSelect
                      isMulti
                      options={Array.from(uniqueFilterValues.province).map(province => ({ 
                        value: province, 
                        label: province 
                      }))}
                      value={Array.isArray(filterOptions.province) ? filterOptions.province.map(province => ({ value: province, label: province })) : []}
                      onChange={(selectedOptions) => handleFilterChange('province', selectedOptions)}
                      placeholder="Select provinces..."
                      className="filter-select"
                    />
                  </Col>
                </Row>
                
                <div className="text-center mt-3">
                  <small className="text-muted">
                    💡 Use multiple filters to narrow down your search. Click "Clear Filters" to reset all selections.
                  </small>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default MapFilters;
