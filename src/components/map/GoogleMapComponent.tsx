
import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface GoogleMapComponentProps {
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

const GoogleMapComponent = ({
  location,
  onLocationChange,
  readonly = false,
  markers = [],
  onError
}: GoogleMapComponentProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const { theme } = useTheme();
  const { toast } = useToast();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<{ [id: string]: google.maps.Marker }>({});
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapLoadAttempts, setMapLoadAttempts] = useState(0);

  const defaultCenter = { lat: 25.2048, lng: 55.2708 }; // Dubai as default
  const initialCenter = location || defaultCenter;
  
  // Fetch Google Maps API key from Supabase Edge Function
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        console.log('Fetching Google Maps API key from Edge Function...');
        setIsLoading(true);
        
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        
        if (error) {
          console.error('Error invoking Edge Function:', error);
          if (onError) onError(`Failed to load map configuration: ${error.message}`);
          return;
        }
        
        console.log('Edge Function response:', data);
        
        if (data && data.success && data.googleMapsApiKey) {
          console.log('Successfully retrieved Google Maps API key, length:', data.googleMapsApiKey.length);
          setApiKey(data.googleMapsApiKey);
        } else {
          const errorMessage = data?.error || 'Google Maps API key not found';
          console.error('Failed to get Google Maps API key:', errorMessage);
          if (onError) onError(`Failed to load map configuration: ${errorMessage}`);
        }
      } catch (err) {
        console.error('Exception fetching Google Maps API key:', err);
        if (onError) onError('Failed to load map configuration. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKey();
  }, [onError, mapLoadAttempts]);
  
  // Function to load Google Maps API script
  const loadGoogleMapsScript = useCallback((key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        console.log('Google Maps API already loaded');
        resolve();
        return;
      }

      console.log('Loading Google Maps script...');
      
      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps script loaded successfully');
        resolve();
      };
      
      script.onerror = (e) => {
        console.error('Failed to load Google Maps script:', e);
        reject(new Error('Failed to load Google Maps script'));
      };
      
      document.head.appendChild(script);
    });
  }, []);

  // Initialize map once API key is loaded
  useEffect(() => {
    if (!mapContainer.current || !apiKey) return;

    const initMap = async () => {
      setIsLoading(true);
      
      try {
        console.log('Initializing Google Maps with API key...');
        await loadGoogleMapsScript(apiKey);
        
        if (!window.google || !window.google.maps) {
          throw new Error('Google Maps failed to initialize properly');
        }
        
        console.log('Creating map instance...');
        // Create map instance
        const mapOptions: google.maps.MapOptions = {
          center: initialCenter,
          zoom: 14,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          styles: theme === 'dark' ? [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
          ] : []
        };
        
        if (mapContainer.current) {
          console.log('Creating map in container');
          const map = new google.maps.Map(mapContainer.current, mapOptions);
          mapRef.current = map;
          
          // Add user marker if location is provided
          if (location) {
            console.log('Adding user marker at', location);
            const userMarker = new google.maps.Marker({
              position: location,
              map: map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
              },
              title: "Your Location"
            });
            userMarkerRef.current = userMarker;
            
            // Add info window for user location
            const userInfoWindow = new google.maps.InfoWindow({
              content: `<div style="color: black;">Your Location</div>`
            });
            
            userMarker.addListener("click", () => {
              if (infoWindowRef.current) infoWindowRef.current.close();
              userInfoWindow.open({
                map: map,
                anchor: userMarker
              });
              infoWindowRef.current = userInfoWindow;
            });
          }
          
          // Add store markers
          markers.forEach((marker) => {
            console.log('Adding marker for', marker.title);
            const storeMarker = new google.maps.Marker({
              position: { lat: marker.lat, lng: marker.lng },
              map: map,
              title: marker.title,
              icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 5,
                fillColor: "#DB4437",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
              }
            });
            
            markerRefs.current[marker.id] = storeMarker;
            
            // Create info window content
            const content = `
              <div style="padding: 8px; max-width: 200px; color: black;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px;">${marker.title}</h3>
                ${marker.description ? `<p style="margin: 0; font-size: 14px;">${marker.description}</p>` : ''}
              </div>
            `;
            
            const infoWindow = new google.maps.InfoWindow({ content });
            
            storeMarker.addListener("click", () => {
              if (infoWindowRef.current) infoWindowRef.current.close();
              infoWindow.open({
                map: map,
                anchor: storeMarker
              });
              infoWindowRef.current = infoWindow;
            });
          });
          
          // Add click listener for location picking
          if (!readonly) {
            console.log('Adding click listener for location picking');
            google.maps.event.addListener(map, "click", (e: google.maps.MapMouseEvent) => {
              if (!e.latLng) return;
              
              const newLocation = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
              };
              
              // Remove previous marker if exists
              if (userMarkerRef.current) {
                userMarkerRef.current.setMap(null);
              }
              
              // Add new marker
              const userMarker = new google.maps.Marker({
                position: newLocation,
                map: map,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#4285F4",
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: 2,
                },
                title: "Selected Location"
              });
              
              userMarkerRef.current = userMarker;
              
              if (onLocationChange) {
                onLocationChange(newLocation);
              }
            });
          }
          
          console.log('Map initialization completed successfully');
          toast({
            title: "Map loaded",
            description: "Google Maps has been loaded successfully",
            duration: 3000,
          });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
        setIsLoading(false);
        if (onError) {
          onError('Failed to initialize map. Please try again later.');
        }
      }
    };

    initMap();
    
    // Cleanup function
    return () => {
      Object.values(markerRefs.current).forEach(marker => {
        marker.setMap(null);
      });
      
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }
      
      mapRef.current = null;
      markerRefs.current = {};
      userMarkerRef.current = null;
    };
  }, [initialCenter, location, loadGoogleMapsScript, markers, onError, onLocationChange, readonly, theme, apiKey, toast]);

  // Retry loading the map
  const retryLoadMap = () => {
    console.log('Retrying map load...');
    setMapLoadAttempts(prev => prev + 1);
  };

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
      {!isLoading && !apiKey && (
        <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 flex flex-col items-center justify-center p-4">
          <p className="text-red-500 mb-4 text-center">Failed to load Google Maps API key</p>
          <button 
            onClick={retryLoadMap}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleMapComponent;
