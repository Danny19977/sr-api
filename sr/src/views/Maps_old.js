
import React, { useRef, useState, useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useVisiteData } from "../hooks/useVisiteData";
import { useMapFilters } from "../hooks/useMapFilters";
import { useGoogleMap } from "../hooks/useGoogleMap";
import { useUserLocation } from "../hooks/useUserLocation";
import MapFilters from "../components/Maps/MapFilters";
import DateRangeModal from "../components/Maps/DateRangeModal";
import RefreshControls from "../components/Maps/RefreshControls";

function Maps() {
  const mapRef = useRef(null);
  const [dateRange, setDateRange] = useState();
  const [showModal, setShowModal] = useState(false);
  const [tempRange, setTempRange] = useState();
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Custom hooks
  const { data: visiteData, loading, error, lastRefreshTime, refetch } = useVisiteData(dateRange);
  const userLocation = useUserLocation();
  
  const {
    searchText,
    setSearchText,
    filterOptions,
    setFilterOptions,
    filteredData,
    uniqueFilterValues,
    searchSuggestions,
    clearFilters,
    activeFiltersCount
  } = useMapFilters(visiteData);
  
  useGoogleMap(mapRef, filteredData, userLocation);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing data...");
      refetch();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  // Helper function to get display name from visite data
  const getDisplayDataFromVisiteData = (data) => {
    return {
      name: data.text_value || data.entry_label || 'Visite Data',
      location: data.area_name || data.province_name || '',
      email: data.email || '',
      details: {
        'Text Value': data.text_value,
        'Radio Value': data.radio_value,
        'Checkbox Value': data.checkbox_value,
        'Email': data.email,
        'Number Value': data.number_value,
        'Boolean Value': data.boolean_value,
        'Comment': data.comment,
        'File URL': data.file_url,
        'Entry Order': data.entry_order
      }
    };
  };

  // Function to calculate distance between two coordinates (Metric System)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c; // Distance in kilometers
    
    // Return distance in metric units
    if (distanceKm < 1) {
      const meters = Math.round(distanceKm * 1000);
      return `${meters} m`; // meters
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(2)} km`; // kilometers with 2 decimal places for short distances
    } else {
      return `${distanceKm.toFixed(1)} km`; // kilometers with 1 decimal place for longer distances
    }
  };

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          console.log("User location obtained:", position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log("Unable to retrieve your location:", error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, []);

  // Advanced filtering and search logic
  useEffect(() => {
    console.log("🗺️ Filtering logic running...");
    console.log("🗺️ Raw visite data count:", visiteData.length);
    console.log("🗺️ Search text:", searchText);
    console.log("🗺️ Filter options:", filterOptions);
    
    // Extract unique values for filters
    const areas = new Set();
    const users = new Set();
    const provinces = new Set();
    
    visiteData.forEach(data => {
      if (data.area_name) areas.add(data.area_name);
      if (data.user_name) users.add(data.user_name);
      if (data.province_name) provinces.add(data.province_name);
    });
    
    setUniqueFilterValues({
      area: areas,
      user: users,
      province: provinces
    });
    
    // Apply filters and search
    const filtered = visiteData.filter(data => {
      const displayData = getDisplayDataFromVisiteData(data);
      
      // Text search across multiple fields
      const searchTerms = searchText.toLowerCase().split(' ').filter(term => term.length > 0);
      const searchableText = [
        displayData.name,
        data.area_name,
        data.user_name,
        data.province_name,
        data.country_name,
        displayData.location,
        ...Object.values(displayData.details)
      ].filter(Boolean).join(' ').toLowerCase();
      
      const matchesSearch = searchTerms.length === 0 || 
        searchTerms.every(term => searchableText.includes(term));
      
      // Multi-select filter matching
      const matchesArea = filterOptions.area.length === 0 || 
        filterOptions.area.includes(data.area_name);
      const matchesUser = filterOptions.user.length === 0 || 
        filterOptions.user.includes(data.user_name);
      const matchesProvince = filterOptions.province.length === 0 || 
        filterOptions.province.includes(data.province_name);
      
      return matchesSearch && matchesArea && matchesUser && matchesProvince;
    });
    
    console.log("🗺️ Filtered data count:", filtered.length);
    console.log("🗺️ Sample filtered items:", filtered.slice(0, 3));
    
    setFilteredVisiteData(filtered);
    
    // Calculate grouped data count for display
    const groupedForCount = {};
    filtered.forEach(data => {
      const entryOrder = data.entry_order || 'unknown';
      if (!groupedForCount[entryOrder]) {
        groupedForCount[entryOrder] = [];
      }
      groupedForCount[entryOrder].push(data);
    });
    
    console.log("🗺️ Grouped data by entry_order:", groupedForCount);
    console.log("🗺️ Number of groups created:", Object.keys(groupedForCount).length);
    
    setGroupedDataCount(Object.keys(groupedForCount).length);
    
    // Update active filters count
    const activeCount = Object.values(filterOptions).reduce((acc, arr) => acc + arr.length, 0);
    setActiveFiltersCount(activeCount);
    
    // Generate search suggestions
    if (searchText.length > 0) {
      const suggestions = new Set();
      visiteData.forEach(data => {
        const displayData = getDisplayDataFromVisiteData(data);
        
        [displayData.name, data.area_name, data.user_name, data.province_name, displayData.location]
          .filter(Boolean)
          .forEach(field => {
            if (field.toLowerCase().includes(searchText.toLowerCase()) && 
                field.toLowerCase() !== searchText.toLowerCase()) {
              suggestions.add(field);
            }
          });
      });
      setSearchSuggestions(Array.from(suggestions).slice(0, 5));
    } else {
      setSearchSuggestions([]);
    }
  }, [visiteData, searchText, filterOptions]);

  // Fetch visite data function (moved outside useEffect for reusability)
  const fetchVisiteData = async () => {
    try {
      console.log("🗺️ Fetching visite data for maps...");
      
      // Get visite data with all relations (users, areas, provinces, countries)
      const response = await visiteDataService.getAllWithRelations();
      console.log("🗺️ Visite data response:", response);
      
      if (response.status === 'success' && response.data && response.data.length > 0) {
        console.log("🗺️ Raw visite data count:", response.data.length);
        
        const data = response.data.filter(item => 
          item.latitude !== null && 
          item.longitude !== null && 
          !isNaN(parseFloat(item.latitude)) && 
          !isNaN(parseFloat(item.longitude))
        );
        
        console.log("🗺️ Filtered visite data count:", data.length);
        console.log("🗺️ Sample visite data:", data.slice(0, 2));
        
        setVisiteData(data);
      } else {
        console.log("🗺️ No visite data from API, using mock data");
        // Create mock data for testing - adding more realistic data for your location
        const mockData = [
          {
            id: 1,
            latitude: -4.330819,
            longitude: 15.344838,
            entry_order: 1,
            user_id: 1,
            area_id: 1,
            province_id: 1,
            country_id: 1,
            user_name: "Test User 1",
            area_name: "Test Area 1",
            province_name: "Test Province 1",
            country_name: "Test Country",
            text_value: "Test value 1",
            number_value: 100,
            email: "test1@example.com",
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            latitude: -4.331819,
            longitude: 15.345838,
            entry_order: 1,
            user_id: 2,
            area_id: 2,
            province_id: 2,
            country_id: 1,
            user_name: "Test User 2",
            area_name: "Test Area 2",
            province_name: "Test Province 2",
            country_name: "Test Country",
            text_value: "Test value 2",
            number_value: 200,
            email: "test2@example.com",
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            latitude: -4.332819,
            longitude: 15.346838,
            entry_order: 2,
            user_id: 3,
            area_id: 3,
            province_id: 3,
            country_id: 1,
            user_name: "Test User 3",
            area_name: "Test Area 3",
            province_name: "Test Province 3",
            country_name: "Test Country",
            text_value: "Test value 3",
            number_value: 300,
            email: "test3@example.com",
            created_at: new Date().toISOString()
          }
        ];
        console.log("🗺️ Mock data created:", mockData);
        setVisiteData(mockData);
      }
    } catch (error) {
      console.error("🗺️ Error fetching visite data:", error);
      // Still provide mock data on error
      const mockData = [
        {
          id: 1,
          latitude: -4.330819,
          longitude: 15.344838,
          entry_order: 1,
          user_id: 1,
          area_id: 1,
          province_id: 1,
          country_id: 1,
          user_name: "Test User 1",
          area_name: "Test Area 1",
          province_name: "Test Province 1",
          country_name: "Test Country",
          text_value: "Test value 1",
          number_value: 100,
          email: "test1@example.com",
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          latitude: -4.331819,
          longitude: 15.345838,
          entry_order: 1,
          user_id: 2,
          area_id: 2,
          province_id: 2,
          country_id: 1,
          user_name: "Test User 2",
          area_name: "Test Area 2",
          province_name: "Test Province 2",
          country_name: "Test Country",
          text_value: "Test value 2",
          number_value: 200,
          email: "test2@example.com",
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          latitude: -4.332819,
          longitude: 15.346838,
          entry_order: 2,
          user_id: 3,
          area_id: 3,
          province_id: 3,
          country_id: 1,
          user_name: "Test User 3",
          area_name: "Test Area 3",
          province_name: "Test Province 3",
          country_name: "Test Country",
          text_value: "Test value 3",
          number_value: 300,
          email: "test3@example.com",
          created_at: new Date().toISOString()
        }
      ];
      console.log("🗺️ Mock data created:", mockData);
      setVisiteData(mockData);
    }
  };

  useEffect(() => {
    fetchVisiteData();
  }, [dateRange]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log("🗺️ Manual refresh triggered");
    
    try {
      await fetchVisiteData();
      setLastRefreshTime(new Date());
      console.log("🗺️ Refresh completed successfully");
    } catch (error) {
      console.error("🗺️ Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh useEffect
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      console.log("🗺️ Auto-refresh enabled - will refresh every 30 seconds");
      interval = setInterval(() => {
        console.log("🗺️ Auto-refresh triggered");
        handleRefresh();
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
        console.log("🗺️ Auto-refresh disabled");
      }
    };
  }, [autoRefresh]);

  useEffect(() => {
    if (!window.google || !mapRef.current) {
      console.log("🗺️ Google Maps not ready or map ref not available");
      return;
    }
    
    console.log("🗺️ Starting map rendering...");
    console.log("🗺️ Filtered visite data count:", filteredVisiteData.length);
    console.log("🗺️ Raw visite data count:", visiteData.length);
    console.log("🗺️ Sample raw visite data:", visiteData.slice(0, 2));
    console.log("🗺️ Sample filtered visite data:", filteredVisiteData.slice(0, 2));
    
    const google = window.google;
    let lat = "0";
    let lng = "0";
    let bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;
    
    // Store references to all markers and distance lines
    const allMarkers = [];
    let currentDistanceLine = null;
    
    // Process visite data and group by entry_order
    const validData = filteredVisiteData
      .filter(data => 
        data.latitude !== null && 
        data.longitude !== null && 
        !isNaN(parseFloat(data.latitude)) && 
        !isNaN(parseFloat(data.longitude))
      )
      .map(data => ({
        ...data,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        displayData: getDisplayDataFromVisiteData(data)
      }));

    console.log("🗺️ Valid data with coordinates:", validData.length);
    console.log("🗺️ Sample valid data:", validData.slice(0, 2));

    // Create individual markers for each entry (not grouped)
    console.log("🗺️ Creating individual markers for each entry...");
    
    // Create marker data for each individual entry
    const individualMarkers = validData.map((data, index) => {
      return {
        id: data.id || index,
        entryOrder: data.entry_order || 'unknown',
        latitude: data.latitude,
        longitude: data.longitude,
        dataItem: data,
        displayData: data.displayData,
        index: index
      };
    });

    console.log("🗺️ Individual markers to create:", individualMarkers.length);
    console.log("🗺️ Sample markers:", individualMarkers.slice(0, 3));

    // Also calculate grouped stats for display
    const groupedData = {};
    validData.forEach(data => {
      const entryOrder = data.entry_order || 'unknown';
      if (!groupedData[entryOrder]) {
        groupedData[entryOrder] = [];
      }
      groupedData[entryOrder].push(data);
    });

    console.log("🗺️ Grouped data for stats:", groupedData);
    console.log("🗺️ Number of entry_order groups:", Object.keys(groupedData).length);

    individualMarkers.forEach((marker) => {
      if (marker.latitude && marker.longitude) {
        console.log(`🗺️ Adding individual marker ${marker.id} (entry_order: ${marker.entryOrder}) at:`, marker.latitude, marker.longitude);
        hasMarkers = true;
        bounds.extend(new google.maps.LatLng(marker.latitude, marker.longitude));
      }
    });
    
    // Default center and zoom
    if (hasMarkers) {
      lat = bounds.getCenter().lat();
      lng = bounds.getCenter().lng();
      console.log("🗺️ Using bounds center:", lat, lng);
    } else if (individualMarkers.length > 0) {
      lat = individualMarkers[0].latitude;
      lng = individualMarkers[0].longitude;
      console.log("🗺️ Using first marker position:", lat, lng);
    } else {
      console.log("🗺️ No markers found, using default center");
    }
    
    console.log("🗺️ Final map center:", lat, lng);
    
    const myLatlng = new google.maps.LatLng(lat, lng);
    const mapOptions = {
      zoom: hasMarkers ? 10 : 5,
      center: myLatlng,
      scrollwheel: true,
      zoomControl: true,
    };
    
    console.log("🗺️ Creating map with options:", mapOptions);
    const map = new google.maps.Map(mapRef.current, mapOptions);
    
    // Function to find nearest marker
    const findNearestMarker = (clickedMarker, clickedSubmission) => {
      let nearestMarker = null;
      let nearestSubmission = null;
      let shortestDistance = Infinity;
      
      allMarkers.forEach(({ marker, submission }) => {
        if (marker !== clickedMarker && submission.latitude && submission.longitude) {
          const distance = calculateDistance(
            clickedSubmission.latitude,
            clickedSubmission.longitude,
            submission.latitude,
            submission.longitude
          );
          
          // Convert distance string to number for comparison
          const distanceNum = parseFloat(distance.replace(/[^\d.]/g, ''));
          
          if (distanceNum < shortestDistance) {
            shortestDistance = distanceNum;
            nearestMarker = marker;
            nearestSubmission = submission;
          }
        }
      });
      
      return { nearestMarker, nearestSubmission, distance: shortestDistance };
    };
    
    // Function to draw distance line
    const drawDistanceLine = (marker1, submission1, marker2, submission2, distance) => {
      // Remove existing distance line
      if (currentDistanceLine) {
        currentDistanceLine.setMap(null);
      }
      
      const lineCoordinates = [
        { lat: parseFloat(submission1.latitude), lng: parseFloat(submission1.longitude) },
        { lat: parseFloat(submission2.latitude), lng: parseFloat(submission2.longitude) }
      ];
      
      currentDistanceLine = new google.maps.Polyline({
        path: lineCoordinates,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 3,
        map: map
      });
      
      // Add distance label at midpoint
      const midLat = (parseFloat(submission1.latitude) + parseFloat(submission2.latitude)) / 2;
      const midLng = (parseFloat(submission1.longitude) + parseFloat(submission2.longitude)) / 2;
      
      const distanceLabel = new google.maps.InfoWindow({
        position: { lat: midLat, lng: midLng },
        content: `<div style="background: rgba(255,0,0,0.9); color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${distance}</div>`,
        disableAutoPan: true
      });
      
      distanceLabel.open(map);
      
      // Store reference to clean up later
      currentDistanceLine.distanceLabel = distanceLabel;
    };
    
    // Place individual markers for each entry
    console.log("🗺️ Starting to place markers, individual markers count:", individualMarkers.length);
    
    individualMarkers.forEach((marker, index) => {
      console.log(`🗺️ Processing marker ${index + 1}:`, marker);
      
      if (marker.latitude && marker.longitude) {
        console.log(`🗺️ Creating marker ${marker.id} (entry order ${marker.entryOrder}) at coordinates:`, marker.latitude, marker.longitude);
        
        const markerLatLng = new google.maps.LatLng(marker.latitude, marker.longitude);
        
        // Create custom marker icon with entry order number and unique colors
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#FFB347'];
        const markerColor = colors[marker.entryOrder % colors.length] || '#FF6B6B';
        
        const googleMarker = new google.maps.Marker({
          position: markerLatLng,
          map: map,
          animation: google.maps.Animation.DROP,
          title: `Entry #${marker.id} - Order: ${marker.entryOrder}`,
          label: {
            text: marker.entryOrder.toString(),
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px'
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 18,
            fillColor: markerColor,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });
        
        console.log(`🗺️ ✅ Marker created successfully for entry ${marker.id} (order: ${marker.entryOrder})`);
        
        // Store marker reference
        allMarkers.push({ marker: googleMarker, submission: marker });
        
        // Get creation date from the data item
        let createdAtRaw = marker.dataItem.created_at || "";
        let createdAt = "-";
        if (createdAtRaw) {
          const dateObj = new Date(createdAtRaw);
          if (!isNaN(dateObj.getTime())) {
            createdAt = dateObj.toLocaleString();
          } else if (typeof createdAtRaw === "string") {
            createdAt = createdAtRaw;
          }
        }
        
        // Debug: Log group data to see available fields
        console.log("Individual marker data:", marker);
        
        // Calculate distance from user location if available
        let distanceText = "";
        if (userLocation && marker.latitude && marker.longitude) {
          const distance = calculateDistance(
            userLocation.lat, 
            userLocation.lng, 
            marker.latitude, 
            marker.longitude
          );
          distanceText = `<tr><td style="padding:2px 0;width:30%;"><strong>Distance:</strong></td><td>${distance}</td></tr>`;
        }

        // Build content for this individual entry
        const item = marker.dataItem;
        const itemContent = `
          <div style="padding:8px; background:#f9f9f9; border-radius:6px;">
            <strong>Entry #${marker.id}</strong><br/>
            <small>
              <strong>Entry Order:</strong> ${item.entry_order || 'N/A'}<br/>
              <strong>Area:</strong> ${item.area_name || 'N/A'}<br/>
              <strong>Province:</strong> ${item.province_name || 'N/A'}<br/>
              <strong>User:</strong> ${item.user_name || 'N/A'}<br/>
              <strong>Text Value:</strong> ${item.text_value || 'N/A'}<br/>
              <strong>Number Value:</strong> ${item.number_value || 'N/A'}<br/>
              <strong>Email:</strong> ${item.email || 'N/A'}
            </small>
          </div>
        `;
        
        const infoContent = `
          <div style='min-width:350px; max-width:500px;'>
            <div class="info-header" style="margin-bottom:15px; text-align:center;">
              <h4 style="color:#2c3e50; margin:0;">Entry #${marker.id}</h4>
              <span style="color:#666; font-size:14px;">Entry Order: ${marker.entryOrder}</span>
            </div>
            
            <table style="width:100%;margin:8px 0;border-collapse:collapse; margin-bottom:15px;">
              <tr><td style="padding:4px 0;width:30%;"><strong>📍 Coordinates:</strong></td><td>${marker.latitude.toFixed(6)}, ${marker.longitude.toFixed(6)}</td></tr>
              ${distanceText}
              <tr><td style="padding:4px 0;"><strong>📅 Created:</strong></td><td>${createdAt}</td></tr>
            </table>

            <div style="max-height:300px; overflow-y:auto;">
              <h5 style="color:#2c3e50; margin-bottom:10px;">📋 Entry Details:</h5>
              ${itemContent}
            </div>
            
            <div style="margin-top:15px;display:flex;justify-content:space-between;align-items:center;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${marker.latitude},${marker.longitude}" 
                 target="_blank" 
                 style="display:inline-block;background:#4285F4;color:white;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;box-shadow:0 2px 4px rgba(66,133,244,0.3);transition:all 0.2s;">
                 <span style="margin-right:6px;">🧭</span> Get Directions
              </a>
              ${userLocation ? `
                <span style="font-size:11px;color:#666;background:#f5f5f5;padding:4px 8px;border-radius:4px;">
                  📍 ${calculateDistance(userLocation.lat, userLocation.lng, marker.latitude, marker.longitude)} away
                </span>
              ` : ''}
          </div>
        `;
        const infowindow = new google.maps.InfoWindow({ content: infoContent });
        
        googleMarker.addListener("click", () => {
          // Find and draw line to nearest marker
          const { nearestMarker, nearestSubmission, distance } = findNearestMarker(googleMarker, marker);
          
          if (nearestMarker && nearestSubmission) {
            const distanceStr = calculateDistance(
              marker.latitude,
              marker.longitude,
              nearestSubmission.latitude,
              nearestSubmission.longitude
            );
            drawDistanceLine(googleMarker, marker, nearestMarker, nearestSubmission, distanceStr);
          }
          
          // Open info window
          infowindow.open(map, googleMarker);
        });
      }
    });
    
    console.log(`🗺️ ✅ Marker creation complete. Total individual markers placed: ${allMarkers.length}`);
    console.log(`🗺️ 📊 Summary: ${individualMarkers.length} entries displayed as individual markers`);
    
    // Add map click listener to clear distance line
    map.addListener("click", () => {
      if (currentDistanceLine) {
        if (currentDistanceLine.distanceLabel) {
          currentDistanceLine.distanceLabel.close();
        }
        currentDistanceLine.setMap(null);
        currentDistanceLine = null;
      }
    });
    
    // Fit bounds if there are markers
    if (hasMarkers) {
      map.fitBounds(bounds);
            // Prevent zooming in too close
      const listener = google.maps.event.addListenerOnce(map, "bounds_changed", function () {
        if (map.getZoom() > 15) {
          map.setZoom(15);
        }
      });
    }
    
    // Cleanup function
    return () => {
      if (currentDistanceLine) {
        if (currentDistanceLine.distanceLabel) {
          currentDistanceLine.distanceLabel.close();
        }
        currentDistanceLine.setMap(null);
      }
    };
  return (
    <Container fluid>
      <Row className="mb-4">
        <Col md="12">
          <Card className="border-0 shadow-sm" style={{ borderRadius: "16px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <Card.Body className="p-4">
              <MapFilters
                searchText={searchText}
                setSearchText={setSearchText}
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                uniqueFilterValues={uniqueFilterValues}
                searchSuggestions={searchSuggestions}
                showSuggestions={showSuggestions}
                setShowSuggestions={setShowSuggestions}
                activeFiltersCount={activeFiltersCount}
                clearFilters={clearFilters}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                filteredDataCount={filteredData.length}
                rawDataCount={visiteData.length}
              />
              
              <RefreshControls
                onRefresh={refetch}
                loading={loading}
                lastRefreshTime={lastRefreshTime}
                autoRefresh={autoRefresh}
                setAutoRefresh={setAutoRefresh}
                dateRange={dateRange}
                setDateRange={setDateRange}
                setShowModal={setShowModal}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {showModal && (
        <DateRangeModal
          show={showModal}
          onHide={() => setShowModal(false)}
          tempRange={tempRange}
          setTempRange={setTempRange}
          onApply={(range) => {
            setDateRange(range);
            setShowModal(false);
          }}
        />
      )}

      <div className="map-container" style={{ height: "80vh", width: "100%" }}>
        <div id="map" ref={mapRef} style={{ height: "100%", width: "100%" }}></div>
      </div>
    </Container>
  );
}

export default Maps;
