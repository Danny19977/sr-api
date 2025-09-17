import { useState, useEffect, useCallback } from 'react';
import { visiteDataService } from '../services/apiServices';

export const useVisiteData = (dateRange) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Fetching visite map markers data from backend...");
      
      let response;
      // The backend endpoint doesn't support date filtering yet, 
      // so we'll fetch all data and filter on frontend if needed
      console.log("📅 Fetching all map markers data from /visite-data/map-markers");
      response = await visiteDataService.getMapMarkersData();
      
      if (response.status === 'success' && response.data?.length > 0) {
        console.log(`✅ Successfully fetched ${response.data.length} map marker records from API`);
        
        let validData = response.data.filter(item => 
          item.latitude !== null && 
          item.longitude !== null && 
          !isNaN(parseFloat(item.latitude)) && 
          !isNaN(parseFloat(item.longitude)) &&
          item.text_value && // Ensure we have text_value for marker display
          item.latitude !== 0 && // Exclude zero coordinates
          item.longitude !== 0
        );

        // Apply date filtering on frontend if dateRange is provided
        if (dateRange && dateRange.startDate && dateRange.endDate) {
          const startDate = dateRange.startDate.toISOString().split('T')[0];
          const endDate = dateRange.endDate.toISOString().split('T')[0];
          
          validData = validData.filter(item => {
            if (!item.created_at) return true; // Include items without dates
            const itemDate = item.created_at.split(' ')[0]; // Extract date part from "YYYY-MM-DD HH:MM:SS"
            return itemDate >= startDate && itemDate <= endDate;
          });
          
          console.log(`📅 Filtered to ${validData.length} records for date range: ${startDate} to ${endDate}`);
        }
        
        console.log(`📍 ${validData.length} records have valid coordinates and text_value`);
        setData(validData);
      } else {
        console.log("⚠️ No data returned from API or empty data array");
        setData([]);
      }
      
      setLastRefreshTime(new Date());
    } catch (err) {
      console.error('❌ Error fetching visite map markers data:', err);
      setError(err.message);
      console.log("❌ Setting empty data due to error");
      setData([]);
      setLastRefreshTime(new Date());
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastRefreshTime,
    refetch: fetchData
  };
};
