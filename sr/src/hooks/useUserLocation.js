import { useState, useEffect } from 'react';

export const useUserLocation = () => {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      console.log("🌍 Getting user location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          console.log("✅ User location obtained:", location);
        },
        (error) => {
          console.log("❌ Error getting user location:", error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      console.log("❌ Geolocation is not supported by this browser");
    }
  }, []);

  return userLocation;
};
