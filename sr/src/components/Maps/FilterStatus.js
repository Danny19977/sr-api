import React from 'react';
import { Badge } from 'react-bootstrap';

const FilterStatus = ({ 
  searchText = "", 
  filterOptions = {}, 
  filteredDataCount = 0, 
  rawDataCount = 0, 
  uniqueFilterValues = {} 
}) => {
  // Ensure filterOptions is properly structured
  const safeFilterOptions = {
    area: Array.isArray(filterOptions.area) ? filterOptions.area : [],
    user: Array.isArray(filterOptions.user) ? filterOptions.user : [],
    province: Array.isArray(filterOptions.province) ? filterOptions.province : [],
    ...filterOptions
  };

  const activeFilters = Object.entries(safeFilterOptions).filter(([key, values]) => Array.isArray(values) && values.length > 0);
  const totalActiveFilters = activeFilters.reduce((acc, [key, values]) => acc + values.length, 0);
  
  const getFilterLabel = (key) => {
    switch(key) {
      case 'area': return '🏢';
      case 'user': return '👤';
      case 'province': return '🗺️';
      default: return '🎛️';
    }
  };

  if (!searchText && totalActiveFilters === 0) {
    return (
      <div className="filter-status-info text-white-50 small">
        <span>Showing all {rawDataCount} markers</span>
      </div>
    );
  }

  return (
    <div className="filter-status-info">
      <div className="d-flex flex-wrap gap-2 align-items-center">
        {searchText && (
          <Badge bg="info" className="d-flex align-items-center">
            🔍 Search: "{searchText}"
          </Badge>
        )}
        
        {activeFilters.map(([filterType, values]) => (
          <Badge key={filterType} bg="primary" className="d-flex align-items-center">
            {getFilterLabel(filterType)} {filterType}: {values.length} selected
          </Badge>
        ))}
        
        <Badge bg="success" className="d-flex align-items-center" data-testid="marker-count">
          📍 {filteredDataCount} of {rawDataCount} results
        </Badge>
      </div>
      
      {filteredDataCount === 0 && (
        <div className="text-warning small mt-2">
          ⚠️ No markers match your current filters. Try adjusting your search criteria.
        </div>
      )}
    </div>
  );
};

export default FilterStatus;
