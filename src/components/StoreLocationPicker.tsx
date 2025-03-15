
import { useState } from 'react';
import { Label } from './ui/label';
import Map from './Map';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StoreLocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
}

const StoreLocationPicker = ({ onLocationSelect, initialLocation }: StoreLocationPickerProps) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(initialLocation || null);
  const [latitude, setLatitude] = useState(initialLocation?.lat.toString() || '');
  const [longitude, setLongitude] = useState(initialLocation?.lng.toString() || '');
  const { toast } = useToast();

  const handleManualLocationSet = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        variant: "destructive",
        title: "Invalid coordinates",
        description: "Please enter valid latitude and longitude values",
        duration: 3000,
      });
      return;
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        variant: "destructive",
        title: "Coordinates out of range",
        description: "Latitude must be between -90 and 90, longitude between -180 and 180",
        duration: 3000,
      });
      return;
    }
    
    const newLocation = { lat, lng };
    setLocation(newLocation);
    onLocationSelect(newLocation);
    
    toast({
      title: "Location Set",
      description: `Location coordinates set to ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      duration: 3000,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Store Location</Label>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter your store's coordinates
        </p>
      </div>
      
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <Label htmlFor="latitude">Latitude</Label>
          <Input 
            id="latitude"
            value={latitude} 
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="e.g. 25.2048" 
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="longitude">Longitude</Label>
          <Input 
            id="longitude"
            value={longitude} 
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="e.g. 55.2708" 
          />
        </div>
      </div>
      
      <Button 
        onClick={handleManualLocationSet}
        className="w-full flex items-center justify-center gap-2"
      >
        <MapPin className="h-4 w-4" />
        Set Location
      </Button>
      
      <div className="h-[300px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <Map location={location} readonly={true} />
      </div>
      
      {location && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Selected location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default StoreLocationPicker;
