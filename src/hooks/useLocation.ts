
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useLocation = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setUserLocation(JSON.parse(savedLocation));
      setIsLoading(false);
      return;
    }

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
          toast({
            variant: "destructive",
            title: "Location Error",
            description: message
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Browser Not Supported",
        description: "Your browser doesn't support geolocation."
      });
    }
  }, [toast]);

  return { userLocation, isLoading };
};
