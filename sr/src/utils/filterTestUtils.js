// Filter Test Utility
// Use this in browser console to test filtering functionality

window.testMapFilters = {
  // Test search functionality
  testSearch: (searchTerm) => {
    console.log(`🧪 Testing search with term: "${searchTerm}"`);
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    if (searchInput) {
      searchInput.value = searchTerm;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log("✅ Search test completed");
    } else {
      console.error("❌ Search input not found");
    }
  },

  // Test filter functionality
  testFilter: (filterType, values) => {
    console.log(`🧪 Testing ${filterType} filter with values:`, values);
    // This would need to be implemented based on the actual StyledSelect component
    console.log("⚠️ Filter testing requires manual interaction with dropdowns");
  },

  // Clear all filters
  clearAll: () => {
    console.log("🧪 Testing clear all filters");
    const clearButton = document.querySelector('button:contains("Clear Filters")');
    if (clearButton) {
      clearButton.click();
      console.log("✅ Clear all test completed");
    } else {
      console.error("❌ Clear button not found");
    }
  },

  // Log current filter state
  logState: () => {
    console.log("🧪 Current filter state:");
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    console.log("Search:", searchInput ? searchInput.value : "Not found");
    
    const markerCount = document.querySelector('[data-testid="marker-count"]')?.textContent;
    console.log("Visible markers:", markerCount || "Not found");
  }
};

console.log("🧪 Filter test utilities loaded! Use window.testMapFilters in console.");
console.log("Available methods:", Object.keys(window.testMapFilters));
