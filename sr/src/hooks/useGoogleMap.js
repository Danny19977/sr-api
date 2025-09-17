import { useEffect, useRef, useCallback } from 'react';

export const useGoogleMap = (containerRef, data, userLocation) => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const distanceLineRef = useRef(null);

  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(2)} km`;
    } else {
      return `${distanceKm.toFixed(1)} km`;
    }
  }, []);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(({ marker }) => marker.setMap(null));
    markersRef.current = [];
    
    if (distanceLineRef.current) {
      if (distanceLineRef.current.distanceLabel) {
        distanceLineRef.current.distanceLabel.close();
      }
      distanceLineRef.current.setMap(null);
      distanceLineRef.current = null;
    }
  }, []);

  const createInfoWindowContent = useCallback((item, userLocation, calculateDistance) => {
    let distanceText = "";
    if (userLocation && item.latitude && item.longitude) {
      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        parseFloat(item.latitude), 
        parseFloat(item.longitude)
      );
      distanceText = `<tr><td style="padding:2px 0;width:30%;"><strong>Distance:</strong></td><td>${distance}</td></tr>`;
    }

    const createdAt = item.created_at ? 
      (item.created_at.includes('T') ? new Date(item.created_at).toLocaleString() : item.created_at) : 
      'N/A';

    return `
      <div style='min-width:380px; max-width:520px;'>
        <div class="info-header" style="margin-bottom:15px; text-align:center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px; border-radius: 8px; margin: -8px -8px 15px -8px;">
          <h4 style="color:white; margin:0; font-size: 16px;">📍 Visit Entry #${item.id}</h4>
          <span style="color:#e8e8e8; font-size:13px;">${item.visite_harder_uuid || 'Unknown UUID'}</span>
        </div>
        
        <!-- Main Text Value Display -->
        <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 12px; margin-bottom: 15px; border-radius: 4px;">
          <h5 style="color: #2c3e50; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">📝 Details:</h5>
          <p style="margin: 0; color: #495057; font-size: 15px; line-height: 1.4; font-weight: 500;">
            ${item.text_value || 'No description available'}
          </p>
        </div>
        
        <table style="width:100%;margin:8px 0;border-collapse:collapse; margin-bottom:15px; font-size: 13px;">
          <tr><td style="padding:4px 0;width:35%;"><strong>📍 Coordinates:</strong></td><td>${parseFloat(item.latitude).toFixed(6)}, ${parseFloat(item.longitude).toFixed(6)}</td></tr>
          ${distanceText}
          <tr><td style="padding:4px 0;"><strong>📅 Created:</strong></td><td>${createdAt}</td></tr>
          <tr><td style="padding:4px 0;"><strong>🔢 Entry Order:</strong></td><td>${item.entry_order || 'N/A'}</td></tr>
        </table>

        <div style="max-height:200px; overflow-y:auto;">
          <h6 style="color:#495057; margin-bottom:8px; font-size: 13px;">📋 Additional Information:</h6>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
            <div style="padding:6px; background:#f8f9fa; border-radius:4px;">
              <strong>👤 User:</strong><br/>
              <span style="color:#666;">${item.user_name || 'N/A'}</span>
            </div>
            <div style="padding:6px; background:#f8f9fa; border-radius:4px;">
              <strong>📧 Email:</strong><br/>
              <span style="color:#666;">${item.email || 'N/A'}</span>
            </div>
            <div style="padding:6px; background:#f8f9fa; border-radius:4px;">
              <strong>📍 Area:</strong><br/>
              <span style="color:#666;">${item.area_name || 'N/A'}</span>
            </div>
            <div style="padding:6px; background:#f8f9fa; border-radius:4px;">
              <strong>🌎 Province:</strong><br/>
              <span style="color:#666;">${item.province_name || 'N/A'}</span>
            </div>
            <div style="padding:6px; background:#f8f9fa; border-radius:4px;">
              <strong>🏛️ Country:</strong><br/>
              <span style="color:#666;">${item.country_name || 'N/A'}</span>
            </div>
            ${item.number_value ? `
            <div style="padding:6px; background:#f8f9fa; border-radius:4px;">
              <strong>🔢 Number Value:</strong><br/>
              <span style="color:#666;">${item.number_value}</span>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div style="margin-top:15px;display:flex;justify-content:space-between;align-items:center;">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}" 
             target="_blank" 
             style="display:inline-block;background:#4285F4;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;box-shadow:0 2px 4px rgba(66,133,244,0.3);transition:all 0.2s;">
             <span style="margin-right:6px;">🧭</span> Get Directions
          </a>
          <small style="color:#666; font-size: 11px;">
            Visit ID: ${item.visite_harder_uuid ? item.visite_harder_uuid.substring(0, 8) + '...' : 'N/A'}
          </small>
        </div>
      </div>
    `;
  }, []);

  const createMarkers = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    console.log("🗺️ Starting marker creation...");
    console.log("🗺️ Received filtered data:", data.length, "items");
    clearMarkers();
    
    const google = window.google;
    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    const validData = data.filter(item => 
      item.latitude !== null && 
      item.longitude !== null && 
      !isNaN(parseFloat(item.latitude)) && 
      !isNaN(parseFloat(item.longitude))
    );

    console.log(`🗺️ Creating ${validData.length} markers from ${data.length} filtered items`);

    // Group data by visite_harder_uuid for better marker organization
    const groupedData = validData.reduce((acc, item) => {
      const uuid = item.visite_harder_uuid || `entry-${item.id}`;
      if (!acc[uuid]) {
        acc[uuid] = [];
      }
      acc[uuid].push(item);
      return acc;
    }, {});

    console.log(`🗺️ Grouped into ${Object.keys(groupedData).length} unique visits`);

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#FFB347'];
    let markerIndex = 0;

    // Create markers grouped by visite_harder_uuid
    Object.entries(groupedData).forEach(([uuid, items], groupIndex) => {
      const groupColor = colors[groupIndex % colors.length];
      
      items.forEach((item, itemIndex) => {
        const lat = parseFloat(item.latitude);
        const lng = parseFloat(item.longitude);
        
        hasMarkers = true;
        bounds.extend(new google.maps.LatLng(lat, lng));
        
        // Use group index for marker labels to show visit grouping
        const markerLabel = items.length > 1 ? 
          `${groupIndex + 1}.${itemIndex + 1}` : // Show sub-entries if multiple entries per visit
          `${groupIndex + 1}`; // Show visit number if single entry per visit

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapRef.current,
          animation: google.maps.Animation.DROP,
          title: `Visit: ${uuid.substring(0, 8)}... - Entry #${item.id}`,
          label: {
            text: markerLabel,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '11px'
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: items.length > 1 ? 20 : 18, // Larger markers for visits with multiple entries
            fillColor: groupColor,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        // Create info window content
        const infoContent = createInfoWindowContent(item, userLocation, calculateDistance);
        const infoWindow = new google.maps.InfoWindow({ content: infoContent });
        
        marker.addListener("click", () => {
          infoWindow.open(mapRef.current, marker);
          
          // Add distance line if user location is available
          if (userLocation && distanceLineRef.current) {
            if (distanceLineRef.current.distanceLabel) {
              distanceLineRef.current.distanceLabel.close();
            }
            distanceLineRef.current.setMap(null);
          }
          
          if (userLocation) {
            const lineCoordinates = [
              { lat: userLocation.lat, lng: userLocation.lng },
              { lat: lat, lng: lng }
            ];

            distanceLineRef.current = new google.maps.Polyline({
              path: lineCoordinates,
              geodesic: true,
              strokeColor: '#FF0000',
              strokeOpacity: 0.8,
              strokeWeight: 3,
              map: mapRef.current
            });

            const distance = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
            const midpoint = {
              lat: (userLocation.lat + lat) / 2,
              lng: (userLocation.lng + lng) / 2
            };

            distanceLineRef.current.distanceLabel = new google.maps.InfoWindow({
              content: `<div style="font-weight: bold; color: #FF0000;">${distance}</div>`,
              position: midpoint
            });

            distanceLineRef.current.distanceLabel.open(mapRef.current);
          }
        });

        markersRef.current.push({ marker, data: item });
        markerIndex++;
      });
    });

    if (hasMarkers) {
      console.log("🗺️ Fitting bounds to markers");
      mapRef.current.fitBounds(bounds);
      const listener = google.maps.event.addListenerOnce(mapRef.current, "bounds_changed", () => {
        if (mapRef.current.getZoom() > 15) {
          mapRef.current.setZoom(15);
        }
      });
    } else {
      console.log("🗺️ No markers to display");
    }
  }, [data, userLocation, calculateDistance, clearMarkers, createInfoWindowContent]);

  const initializeMap = useCallback(() => {
    if (!containerRef.current || !window.google) return;

    console.log("🗺️ Initializing Google Map...");
    const google = window.google;
    const defaultCenter = data.length > 0 
      ? { lat: parseFloat(data[0].latitude) || 0, lng: parseFloat(data[0].longitude) || 0 }
      : { lat: 0, lng: 0 };

    mapRef.current = new google.maps.Map(containerRef.current, {
      zoom: 10,
      center: defaultCenter,
      scrollwheel: true,
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true,
      styles: [
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#193341" }]
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [{ color: "#2c5aa0" }]
        }
      ]
    });

    // Clear distance line on map click
    mapRef.current.addListener("click", () => {
      if (distanceLineRef.current) {
        if (distanceLineRef.current.distanceLabel) {
          distanceLineRef.current.distanceLabel.close();
        }
        distanceLineRef.current.setMap(null);
        distanceLineRef.current = null;
      }
    });

    console.log("✅ Google Map initialized");
  }, [data]);

  useEffect(() => {
    if (window.google) {
      initializeMap();
    }
  }, [initializeMap]);

  useEffect(() => {
    if (mapRef.current) {
      createMarkers();
    }
  }, [createMarkers]);

  return { clearMarkers, mapRef };
};
