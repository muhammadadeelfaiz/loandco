
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import { Loader2 } from "lucide-react";

interface LocationPromptProps {
  onLocationReceived: (coords: { lat: number; lng: number }) => void;
}

const LocationPrompt = ({ onLocationReceived }: LocationPromptProps) => {
  const [isPrompting, setIsPrompting] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSavedLocation = async () => {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        const location = JSON.parse(savedLocation);
        onLocationReceived(location);
      } else {
        setIsPrompting(true);
      }
    };

    checkSavedLocation();
  }, [onLocationReceived]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Browser Not Supported",
        description: "Your browser doesn't support location services. Please enter your location manually."
      });
      setShowManualInput(true);
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        localStorage.setItem('userLocation', JSON.stringify(coords));
        onLocationReceived(coords);
        setIsPrompting(false);
        setIsLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLoading(false);
        let errorMessage = "Unable to get your location. ";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "You denied location access. Please enter your location manually.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
        }

        toast({
          variant: "destructive",
          title: "Location Error",
          description: errorMessage
        });
        setShowManualInput(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const handleManualLocation = async () => {
    try {
      // For demo purposes, using a default location for Dubai Mall
      const defaultCoords = {
        lat: 25.1972,
        lng: 55.2744
      };
      
      localStorage.setItem('userLocation', JSON.stringify(defaultCoords));
      onLocationReceived(defaultCoords);
      setIsPrompting(false);
      
      toast({
        title: "Location Set",
        description: "Using approximate location based on your input"
      });
    } catch (error) {
      console.error("Error setting manual location:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to set location. Please try again."
      });
    }
  };

  if (!isPrompting) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Enable Location Services</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          To show you nearby products and stores, we need your location. 
          Your location data will only be used to show relevant results.
        </p>

        {showManualInput ? (
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter your ZIP code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setIsPrompting(false)}>
                Cancel
              </Button>
              <Button onClick={handleManualLocation}>
                Set Location
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowManualInput(true)}>
              Enter Manually
            </Button>
            <Button 
              onClick={handleGetLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                'Allow Location'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPrompt;
