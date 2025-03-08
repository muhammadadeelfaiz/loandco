
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useLocation = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Try to get location from localStorage first
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        if (parsedLocation && typeof parsedLocation.lat === 'number' && typeof parsedLocation.lng === 'number') {
          setUserLocation(parsedLocation);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error("Error parsing saved location:", e);
        // Continue to geolocation API if parsing fails
      }
    }

    // If no valid saved location, try geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          localStorage.setItem('userLocation', JSON.stringify(location));
          setIsLoading(false);
          setError(null);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoading(false);
          
          let message = "Unable to get your location. ";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message += "Location access was denied.";
              break;
            case error.POSITION_UNAVAILABLE:
              message += "Location information unavailable.";
              break;
            case error.TIMEOUT:
              message += "Location request timed out.";
              break;
            default:
              message += "An unknown error occurred.";
          }
          
          setError(message);
          
          // Set default location (New York City)
          const defaultLocation = { lat: 40.7128, lng: -74.0060 };
          setUserLocation(defaultLocation);
          localStorage.setItem('userLocation', JSON.stringify(defaultLocation));
          
          toast({
            variant: "destructive",
            title: "Location Error",
            description: message + " Using default location instead.",
            duration: 5000,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000
        }
      );
    } else {
      setIsLoading(false);
      setError("Your browser doesn't support geolocation.");
      
      // Set default location
      const defaultLocation = { lat: 40.7128, lng: -74.0060 };
      setUserLocation(defaultLocation);
      localStorage.setItem('userLocation', JSON.stringify(defaultLocation));
      
      toast({
        variant: "destructive",
        title: "Browser Not Supported",
        description: "Your browser doesn't support geolocation. Using default location instead.",
        duration: 5000,
      });
    }
  }, [toast]);

  return { userLocation, isLoading, error };
};
