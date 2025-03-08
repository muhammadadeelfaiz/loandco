
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface GoogleMapProps {
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

// Add missing Google Maps type definitions
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

const GoogleMap = ({
  location,
  onLocationChange,
  readonly = false,
  markers = [],
  onError
}: GoogleMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const { theme } = useTheme();
  const { toast } = useToast();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<{ [id: string]: google.maps.Marker }>({});
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  const defaultCenter = { lat: 25.2048, lng: 55.2708 }; // Dubai as default

  // Fetch the RapidAPI key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        // Try to get from localStorage first
        const cachedKey = localStorage.getItem('rapidapi_key');
        const cachedTimestamp = localStorage.getItem('rapidapi_key_timestamp');
        
        // Check if we have a valid cached key (less than 1 hour old)
        if (cachedKey && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          if (now - timestamp < 60 * 60 * 1000) { // 1 hour
            console.log('Using cached RapidAPI key');
            setApiKey(cachedKey);
            return;
          }
        }

        // Fetch from Edge Function if no valid cache
        console.log('Fetching RapidAPI key from Edge Function');
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        
        if (error) {
          throw new Error(`Failed to invoke edge function: ${error.message}`);
        }
        
        if (!data.keyFound || !data.rapidApiKey) {
          throw new Error('RapidAPI key not found');
        }
        
        // Cache the key in localStorage
        localStorage.setItem('rapidapi_key', data.rapidApiKey);
        localStorage.setItem('rapidapi_key_timestamp', Date.now().toString());
        
        setApiKey(data.rapidApiKey);
      } catch (error) {
        console.error('Error fetching RapidAPI key:', error);
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

  // Load Google Maps API script
  useEffect(() => {
    if (!apiKey) return;

    const loadGoogleMapsScript = () => {
      // Check if script is already loaded
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Define the callback function
      window.initMap = () => {
        initializeMap();
      };
      
      script.onerror = () => {
        console.error('Error loading Google Maps script');
        if (onError) {
          onError('Failed to load Google Maps. Please try again later.');
        }
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapContainer.current) return;
      
      try {
        const initialCenter = location || defaultCenter;
        
        // Create map instance
        const mapOptions: google.maps.MapOptions = {
          center: { lat: initialCenter.lat, lng: initialCenter.lng },
          zoom: 12,
          mapTypeId: theme === 'dark' ? 'satellite' : 'roadmap',
          styles: theme === 'dark' ? [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
          ] : undefined
        };
        
        mapRef.current = new google.maps.Map(mapContainer.current, mapOptions);
        
        // Add user location marker if provided
        if (location) {
          userMarkerRef.current = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: mapRef.current,
            draggable: !readonly,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#3886ce',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });
          
          if (!readonly && userMarkerRef.current) {
            google.maps.event.addListener(userMarkerRef.current, 'dragend', () => {
              const position = userMarkerRef.current?.getPosition();
              if (position && onLocationChange) {
                onLocationChange({ lat: position.lat(), lng: position.lng() });
              }
            });
          }
        }
        
        // Add click listener for location selection
        if (!readonly) {
          google.maps.event.addListener(mapRef.current, 'click', (event) => {
            const newLocation = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng()
            };
            
            if (userMarkerRef.current) {
              userMarkerRef.current.setPosition(newLocation);
            } else {
              userMarkerRef.current = new google.maps.Marker({
                position: newLocation,
                map: mapRef.current!,
                draggable: !readonly,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#3886ce',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2
                }
              });
              
              google.maps.event.addListener(userMarkerRef.current, 'dragend', () => {
                const position = userMarkerRef.current?.getPosition();
                if (position && onLocationChange) {
                  onLocationChange({ lat: position.lat(), lng: position.lng() });
                }
              });
            }
            
            if (onLocationChange) {
              onLocationChange(newLocation);
            }
          });
        }
        
        // Add other markers
        markers.forEach(marker => {
          const infoWindow = new google.maps.InfoWindow({
            content: `<strong>${marker.title}</strong>${marker.description ? `<p>${marker.description}</p>` : ''}`
          });
          
          const mapMarker = new google.maps.Marker({
            position: { lat: marker.lat, lng: marker.lng },
            map: mapRef.current!,
            title: marker.title,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#FF0000',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });
          
          mapMarker.addListener('click', () => {
            // Fix the error - instead of passing the marker directly, pass null and the marker separately
            infoWindow.open({
              map: mapRef.current,
              anchor: mapMarker
            });
          });
          
          markerRefs.current[marker.id] = mapMarker;
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setIsLoading(false);
        if (onError) {
          onError('Failed to initialize map. Please try refreshing the page.');
        }
      }
    };

    loadGoogleMapsScript();

    // Cleanup function
    return () => {
      // Clean up any event listeners or resources
      Object.values(markerRefs.current).forEach(marker => {
        marker.setMap(null);
      });
      
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }
      
      // Remove the initMap global callback
      if (window.initMap) {
        // @ts-ignore
        delete window.initMap;
      }
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

export default GoogleMap;
