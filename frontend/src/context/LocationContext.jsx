import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { egyptGovernorates } from '../data/egyptLocations';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [selectedGovernorate, setSelectedGovernorate] = useState(() => {
    return localStorage.getItem('loc_gov') || localStorage.getItem('chefaa_gov') || 'القاهرة';
  });
  const [selectedDistrict, setSelectedDistrict] = useState(() => {
    return localStorage.getItem('loc_dist') || localStorage.getItem('chefaa_dist') || 'المعادي';
  });
  const [userCoordinates, setUserCoordinates] = useState(() => {
    const saved = localStorage.getItem('loc_gps_coords') || localStorage.getItem('chefaa_gps_coords');
    return saved ? JSON.parse(saved) : null;
  });
  const [isGpsActive, setIsGpsActive] = useState(() => {
    return localStorage.getItem('loc_gps_active') === 'true' || localStorage.getItem('chefaa_gps_active') === 'true';
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('loc_gov', selectedGovernorate);
    localStorage.setItem('loc_dist', selectedDistrict);
  }, [selectedGovernorate, selectedDistrict]);

  useEffect(() => {
    if (userCoordinates) {
      localStorage.setItem('loc_gps_coords', JSON.stringify(userCoordinates));
    }
  }, [userCoordinates]);

  // Current Governorate Object
  const currentGovObj =
    egyptGovernorates.find((g) => g.nameAr === selectedGovernorate) ||
    egyptGovernorates[0];

  const updateLocation = (govName, distName, coords = null) => {
    setSelectedGovernorate(govName);
    setSelectedDistrict(distName);
    if (coords) {
      setUserCoordinates(coords);
      setIsGpsActive(true);
      localStorage.setItem('loc_gps_active', 'true');
    }
    setGpsError(null);
    setIsLocationModalOpen(false);
  };

  /**
   * Detect Live GPS Location via Browser Geolocation & Reverse Geocoding
   */
  const detectLiveLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGpsError('متصفحك لا يدعم خاصية تحديد الموقع الجغرافي (Geolocation)');
      return false;
    }

    setGpsLoading(true);
    setGpsError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const coords = { lat, lng, accuracy: position.coords.accuracy };
          setUserCoordinates(coords);

          try {
            // Reverse Geocoding via OpenStreetMap API in Arabic
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
              { headers: { 'User-Agent': 'HealthcarePharmacyPlatform/1.0' } }
            );

            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const detectedState = addr.state || addr.governorate || addr.city || '';
              const detectedCity = addr.city || addr.town || addr.suburb || addr.neighbourhood || addr.village || addr.county || 'المنطقة الحالية';

              // Match with our 27 governorates
              let matchedGov = egyptGovernorates.find((g) =>
                detectedState.includes(g.nameAr) || g.nameAr.includes(detectedState)
              );

              // If state didn't match, check city / county
              if (!matchedGov) {
                matchedGov = egyptGovernorates.find((g) =>
                  g.districts.some((d) => detectedCity.includes(d) || d.includes(detectedCity))
                );
              }

              const targetGov = matchedGov ? matchedGov.nameAr : (detectedState || 'القاهرة');
              const targetDist = detectedCity || 'موقعي الحالي المباشر';

              setSelectedGovernorate(targetGov);
              setSelectedDistrict(targetDist);
              setIsGpsActive(true);
              localStorage.setItem('loc_gps_active', 'true');
              resolve(true);
            } else {
              // Fallback with exact coordinates
              setSelectedDistrict(`الموقع الحالي (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
              setIsGpsActive(true);
              resolve(true);
            }
          } catch (e) {
            console.warn('Reverse geocoding fallback:', e);
            setSelectedDistrict(`موقعي المباشر GPS`);
            setIsGpsActive(true);
            resolve(true);
          } finally {
            setGpsLoading(false);
          }
        },
        (error) => {
          setGpsLoading(false);
          let msg = 'تعذر الحصول على إذن الوصول للموقع الجغرافي';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'يرجى السماح بصلاحية الوصول للموقع في المتصفح لتحديد أقرب صيدلية لك تلقائياً.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'إشارة الـ GPS غير متوفرة حالياً.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'انتهت مهلة تحديد الموقع، يرجى المحاولة ثانية.';
          }
          setGpsError(msg);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  }, []);

  return (
    <LocationContext.Provider
      value={{
        selectedGovernorate,
        selectedDistrict,
        currentGovObj,
        userCoordinates,
        isGpsActive,
        gpsLoading,
        gpsError,
        isLocationModalOpen,
        setIsLocationModalOpen,
        updateLocation,
        detectLiveLocation,
        egyptGovernorates,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
