
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface GoMapProps {
  location?: { lat: number; lng: number } | null;
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  readonly?: boolean;
  searchRadius?: number;
  onError?: (message: string) => void;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
  }>;
}

const GoMap = ({
  location,
  onLocationChange,
  readonly = false,
  markers = [],
  onError
}: GoMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const { theme } = useTheme();
  const { toast } = useToast();
  const mapRef = useRef<any | null>(null);
  const markerRefs = useRef<{ [id: string]: any }>({});
  const userMarkerRef = useRef<any | null>(null);

  const defaultCenter = { lat: 25.2048, lng: 55.2708 }; // Dubai as default

  // Fetch the Go Map API key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        // Try to get from localStorage first
        const cachedKey = localStorage.getItem('go_map_api_key');
        const cachedTimestamp = localStorage.getItem('go_map_api_key_timestamp');
        
        // Check if we have a valid cached key (less than 1 hour old)
        if (cachedKey && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          if (now - timestamp < 60 * 60 * 1000) { // 1 hour
            console.log('Using cached Go Map API key');
            setApiKey(cachedKey);
            return;
          }
        }

        // Fetch from Edge Function if no valid cache
        console.log('Fetching Go Map API key from Edge Function');
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        
        if (error) {
          throw new Error(`Failed to invoke edge function: ${error.message}`);
        }
        
        if (!data.keyFound || !data.goMapApiKey) {
          throw new Error('Go Map API key not found');
        }
        
        // Cache the key in localStorage
        localStorage.setItem('go_map_api_key', data.goMapApiKey);
        localStorage.setItem('go_map_api_key_timestamp', Date.now().toString());
        
        setApiKey(data.goMapApiKey);
      } catch (error) {
        console.error('Error fetching Go Map API key:', error);
        if (onError) {
          onError('Failed to load map API key. Please try again later.');
        }
        toast({
          variant: "destructive",
          title: "Map Error",
          description: "Failed to load map API key. Please try again later."
        });
      }
    };

    fetchApiKey();
  }, [onError, toast]);

  // Load Go Map script
  useEffect(() => {
    if (!apiKey || !mapContainer.current) return;

    setIsLoading(true);

    // For demonstration purposes - actual implementation depends on the Go Map API
    // This is a placeholder for the Go Map implementation
    try {
      // Initialize the map with the container and API key
      console.log(`Initializing Go Map with API key: ${apiKey.substring(0, 3)}...`);
      
      // Create a basic map display until the real Go Map API is integrated
      const mapElement = mapContainer.current;
      mapElement.innerHTML = '';
      mapElement.style.position = 'relative';
      
      // Create map container
      const mapDisplay = document.createElement('div');
      mapDisplay.style.width = '100%';
      mapDisplay.style.height = '100%';
      mapDisplay.style.backgroundColor = theme === 'dark' ? '#242f3e' : '#e8e8e8';
      mapDisplay.style.position = 'relative';
      mapElement.appendChild(mapDisplay);
      
      // Display center location
      const initialCenter = location || defaultCenter;
      const centerMarker = document.createElement('div');
      centerMarker.style.position = 'absolute';
      centerMarker.style.left = '50%';
      centerMarker.style.top = '50%';
      centerMarker.style.transform = 'translate(-50%, -50%)';
      centerMarker.style.width = '20px';
      centerMarker.style.height = '20px';
      centerMarker.style.borderRadius = '50%';
      centerMarker.style.backgroundColor = '#3886ce';
      centerMarker.style.border = '2px solid white';
      centerMarker.innerHTML = `<span style="position: absolute; bottom: -25px; left: -40px; width: 100px; text-align: center; color: ${theme === 'dark' ? 'white' : 'black'};">
          ${initialCenter.lat.toFixed(4)}, ${initialCenter.lng.toFixed(4)}
        </span>`;
      mapDisplay.appendChild(centerMarker);
      
      // Add markers if they exist
      markers.forEach((marker, index) => {
        const markerElement = document.createElement('div');
        markerElement.style.position = 'absolute';
        // Calculate position based on relative distance from center (this is simplified)
        const latDiff = (marker.lat - initialCenter.lat) * 100;
        const lngDiff = (marker.lng - initialCenter.lng) * 100;
        markerElement.style.left = `${50 + lngDiff}%`;
        markerElement.style.top = `${50 - latDiff}%`;
        markerElement.style.transform = 'translate(-50%, -50%)';
        markerElement.style.width = '16px';
        markerElement.style.height = '16px';
        markerElement.style.borderRadius = '50%';
        markerElement.style.backgroundColor = 'red';
        markerElement.style.border = '2px solid white';
        markerElement.style.cursor = 'pointer';
        
        markerElement.addEventListener('click', () => {
          // Show info window
          const infoWindow = document.createElement('div');
          infoWindow.style.position = 'absolute';
          infoWindow.style.left = `${50 + lngDiff}%`;
          infoWindow.style.top = `${50 - latDiff - 10}%`;
          infoWindow.style.transform = 'translate(-50%, -100%)';
          infoWindow.style.backgroundColor = 'white';
          infoWindow.style.padding = '8px';
          infoWindow.style.borderRadius = '4px';
          infoWindow.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
          infoWindow.style.zIndex = '10';
          infoWindow.style.width = '150px';
          infoWindow.innerHTML = `<strong>${marker.title}</strong>${marker.description ? `<p>${marker.description}</p>` : ''}`;
          
          // Close button
          const closeButton = document.createElement('div');
          closeButton.style.position = 'absolute';
          closeButton.style.top = '5px';
          closeButton.style.right = '5px';
          closeButton.style.cursor = 'pointer';
          closeButton.innerHTML = 'x';
          closeButton.addEventListener('click', () => {
            mapDisplay.removeChild(infoWindow);
          });
          
          infoWindow.appendChild(closeButton);
          mapDisplay.appendChild(infoWindow);
        });
        
        mapDisplay.appendChild(markerElement);
        markerRefs.current[marker.id] = markerElement;
      });
      
      // Handle clicking on map to set location
      if (!readonly) {
        mapDisplay.addEventListener('click', (e) => {
          const rect = mapDisplay.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          
          // Calculate lat/lng from pixel coordinates (simplified)
          const clickXPercent = clickX / rect.width;
          const clickYPercent = clickY / rect.height;
          
          // Convert click position to lat/lng (simplified)
          const lngDiff = (clickXPercent - 0.5) * 0.1;
          const latDiff = (0.5 - clickYPercent) * 0.1;
          
          const newLocation = {
            lat: initialCenter.lat + latDiff,
            lng: initialCenter.lng + lngDiff
          };
          
          if (onLocationChange) {
            onLocationChange(newLocation);
          }
          
          // Update center marker position
          centerMarker.style.left = `${clickXPercent * 100}%`;
          centerMarker.style.top = `${clickYPercent * 100}%`;
          centerMarker.innerHTML = `<span style="position: absolute; bottom: -25px; left: -40px; width: 100px; text-align: center; color: ${theme === 'dark' ? 'white' : 'black'};">
            ${newLocation.lat.toFixed(4)}, ${newLocation.lng.toFixed(4)}
          </span>`;
        });
      }
      
      // Add notice at the bottom
      const notice = document.createElement('div');
      notice.style.position = 'absolute';
      notice.style.bottom = '10px';
      notice.style.right = '10px';
      notice.style.backgroundColor = 'rgba(255,255,255,0.7)';
      notice.style.padding = '5px';
      notice.style.borderRadius = '4px';
      notice.style.fontSize = '12px';
      notice.style.color = '#333';
      notice.textContent = `Go Map API Integration`;
      mapDisplay.appendChild(notice);
      
      mapRef.current = mapDisplay;
      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing Go Map:', err);
      setIsLoading(false);
      if (onError) {
        onError('Failed to initialize map. Please try refreshing the page.');
      }
    }

    // Cleanup function
    return () => {
      if (mapContainer.current) {
        mapContainer.current.innerHTML = '';
      }
      mapRef.current = null;
      Object.keys(markerRefs.current).forEach(key => {
        delete markerRefs.current[key];
      });
    };
  }, [apiKey, location, markers, readonly, theme, onLocationChange, onError]);

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
};

export default GoMap;
