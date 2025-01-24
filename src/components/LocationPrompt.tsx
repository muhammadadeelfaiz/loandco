import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";

interface LocationPromptProps {
  onLocationReceived: (coords: { lat: number; lng: number }) => void;
}

const LocationPrompt = ({ onLocationReceived }: LocationPromptProps) => {
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      onLocationReceived(JSON.parse(savedLocation));
      return;
    }
    setIsPrompting(true);
  }, [onLocationReceived]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Geolocation is not supported by your browser"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        localStorage.setItem('userLocation', JSON.stringify(coords));
        onLocationReceived(coords);
        setIsPrompting(false);
      },
      (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        setIsPrompting(false);
      }
    );
  };

  if (!isPrompting) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Enable Location Services</h2>
        <p className="text-gray-600 mb-6">
          To show you nearby products and stores, we need your location. 
          Your location data will only be used to show relevant results.
        </p>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setIsPrompting(false)}>
            Skip
          </Button>
          <Button onClick={handleGetLocation}>
            Allow Location
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LocationPrompt;