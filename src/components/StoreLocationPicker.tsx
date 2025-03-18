
import { useState, useEffect } from 'react';
import { Label } from './ui/label';
import Map from './map/Map';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MapPin, Target, Locate } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/hooks/useLocation';
import { Card, CardContent } from './ui/card';

interface StoreLocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
}

const StoreLocationPicker = ({ onLocationSelect, initialLocation }: StoreLocationPickerProps) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(initialLocation || null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(initialLocation || null);
  const [latitude, setLatitude] = useState(initialLocation?.lat.toString() || '');
  const [longitude, setLongitude] = useState(initialLocation?.lng.toString() || '');
  const { toast } = useToast();
  const { userLocation, isLoading: isLoadingUserLocation } = useLocation();

  // Update the input fields when selected location changes from map click
  useEffect(() => {
    if (selectedLocation) {
      setLatitude(selectedLocation.lat.toFixed(6));
      setLongitude(selectedLocation.lng.toFixed(6));
    }
  }, [selectedLocation]);

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
    setSelectedLocation(newLocation);
    
    toast({
      title: "Location Set",
      description: `Location coordinates set to ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      duration: 3000,
    });
  };

  const handleMapLocationChange = (newLocation: { lat: number; lng: number }) => {
    console.log("Map location changed:", newLocation);
    setSelectedLocation(newLocation);
    
    toast({
      title: "Location Selected",
      description: "Click 'Confirm Location' to set this location",
      duration: 2000,
    });
  };
  
  const confirmLocation = () => {
    if (selectedLocation) {
      setLocation(selectedLocation);
      onLocationSelect(selectedLocation);
      
      toast({
        title: "Location Confirmed",
        description: "Store location has been confirmed",
        duration: 2000,
      });
    }
  };

  const useCurrentLocation = () => {
    if (userLocation) {
      setSelectedLocation(userLocation);
      
      toast({
        title: "Current Location Used",
        description: "Your current location has been set",
        duration: 2000,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Location Unavailable",
        description: "Could not detect your current location",
        duration: 3000,
      });
    }
  };

  return (
    <Card className="rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
      <div className="relative h-[350px] w-full bg-gray-100 dark:bg-gray-800">
        <Map 
          location={location} 
          onLocationChange={handleMapLocationChange} 
          readonly={false}
          selectedLocation={selectedLocation}
          showRadius={false}
        />
        
        <div className="absolute top-3 right-3 flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 px-3 rounded-full shadow-md opacity-90 hover:opacity-100"
            onClick={useCurrentLocation}
            disabled={isLoadingUserLocation}
          >
            <Locate className="h-4 w-4 mr-1" />
            My Location
          </Button>
        </div>
        
        {/* Show location status indicator */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-md text-sm font-medium flex items-center gap-1.5">
          <MapPin className={`h-4 w-4 ${location ? 'text-green-600' : selectedLocation ? 'text-red-600' : 'text-gray-400'}`} />
          <span>
            {location ? 'Location Confirmed' : 
             selectedLocation ? 'Location Selected' : 
             'Click on Map to Select Location'}
          </span>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Store Location</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Click on the map to select your store's location or enter coordinates manually
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude" className="text-xs mb-1">Latitude</Label>
              <Input 
                id="latitude"
                value={latitude} 
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. 25.2048" 
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="longitude" className="text-xs mb-1">Longitude</Label>
              <Input 
                id="longitude"
                value={longitude} 
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. 55.2708" 
                className="h-9"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleManualLocationSet}
              variant="outline"
              className="flex items-center justify-center gap-2 flex-1"
            >
              <Target className="h-4 w-4" />
              Set Manually
            </Button>
            
            {selectedLocation && (
              <Button 
                variant="default"
                className="flex items-center justify-center gap-2 flex-1 bg-green-600 hover:bg-green-700"
                onClick={confirmLocation}
              >
                <MapPin className="h-4 w-4" />
                Confirm Location
              </Button>
            )}
          </div>
          
          {selectedLocation && (
            <div className="px-3 py-2 bg-muted rounded-md text-sm">
              Selected location: <span className="font-medium">{selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StoreLocationPicker;
