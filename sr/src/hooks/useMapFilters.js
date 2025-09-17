import { useState, useMemo, useCallback } from 'react';

export const useMapFilters = (data) => {
  const [searchText, setSearchText] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    area: [],
    user: [],
    province: []
  });

  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  // Memoized unique values for filters
  const uniqueFilterValues = useMemo(() => {
    const areas = new Set();
    const users = new Set();
    const provinces = new Set();
    
    safeData.forEach(item => {
      if (item.area_name) areas.add(item.area_name);
      if (item.user_name) users.add(item.user_name);
      if (item.province_name) provinces.add(item.province_name);
    });
    
    return { area: areas, user: users, province: provinces };
  }, [safeData]);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    console.log("🔍 Applying filters to data:", {
      totalItems: safeData.length,
      searchText,
      filterOptions,
      activeFilters: Object.values(filterOptions).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0)
    });

    const filtered = safeData.filter(item => {
      // Search filter
      const searchTerms = searchText.toLowerCase().split(' ').filter(term => term.length > 0);
      const searchableText = [
        item.text_value,
        item.area_name,
        item.user_name,
        item.province_name,
        item.country_name,
        item.email
      ].filter(Boolean).join(' ').toLowerCase();
      
      const matchesSearch = searchTerms.length === 0 || 
        searchTerms.every(term => searchableText.includes(term));
      
      // Multi-select filters
      const matchesArea = !Array.isArray(filterOptions.area) || filterOptions.area.length === 0 || 
        filterOptions.area.includes(item.area_name);
      const matchesUser = !Array.isArray(filterOptions.user) || filterOptions.user.length === 0 || 
        filterOptions.user.includes(item.user_name);
      const matchesProvince = !Array.isArray(filterOptions.province) || filterOptions.province.length === 0 || 
        filterOptions.province.includes(item.province_name);
      
      const passes = matchesSearch && matchesArea && matchesUser && matchesProvince;
      
      // Log items that don't pass filters for debugging
      if (!passes && (searchText || Object.values(filterOptions).some(arr => arr.length > 0))) {
        console.log("❌ Item filtered out:", {
          id: item.id,
          area: item.area_name,
          user: item.user_name,
          province: item.province_name,
          text: item.text_value,
          matchesSearch,
          matchesArea,
          matchesUser,
          matchesProvince
        });
      }
      
      return passes;
    });

    console.log(`✅ Filtered ${filtered.length} items from ${safeData.length} total`);
    return filtered;
  }, [safeData, searchText, filterOptions]);

  // Search suggestions
  const searchSuggestions = useMemo(() => {
    if (searchText.length === 0) return [];
    
    const suggestions = new Set();
    safeData.forEach(item => {
      [item.text_value, item.area_name, item.user_name, item.province_name]
        .filter(Boolean)
        .forEach(field => {
          if (field.toLowerCase().includes(searchText.toLowerCase()) && 
              field.toLowerCase() !== searchText.toLowerCase()) {
            suggestions.add(field);
          }
        });
    });
    
    return Array.from(suggestions).slice(0, 5);
  }, [safeData, searchText]);

  const clearFilters = useCallback(() => {
    setSearchText("");
    setFilterOptions({ area: [], user: [], province: [] });
  }, []);

  const activeFiltersCount = useMemo(() => 
    Object.values(filterOptions).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0),
    [filterOptions]
  );

  return {
    searchText,
    setSearchText,
    filterOptions,
    setFilterOptions,
    filteredData,
    uniqueFilterValues,
    searchSuggestions,
    clearFilters,
    activeFiltersCount
  };
};
