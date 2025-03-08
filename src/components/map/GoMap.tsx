
import { useEffect, useRef, useState, useCallback } from 'react';
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
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<{ [id: string]: google.maps.Marker }>({});
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const defaultCenter = { lat: 25.2048, lng: 55.2708 }; // Dubai as default
  const initialCenter = location || defaultCenter;

  // Fetch the Google Maps API key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        // Try to get from localStorage first
        const cachedKey = localStorage.getItem('google_maps_api_key');
        const cachedTimestamp = localStorage.getItem('google_maps_api_key_timestamp');
        
        // Check if we have a valid cached key (less than 1 hour old)
        if (cachedKey && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          if (now - timestamp < 60 * 60 * 1000) { // 1 hour
            console.log('Using cached Google Maps API key');
            setApiKey(cachedKey);
            return;
          }
        }

        // Fetch from Edge Function if no valid cache
        console.log('Fetching Google Maps API key from Edge Function');
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        
        if (error) {
          throw new Error(`Failed to invoke edge function: ${error.message}`);
        }
        
        if (!data.keyFound || !data.googleMapsApiKey) {
          throw new Error('Google Maps API key not found');
        }
        
        // Cache the key in localStorage
        localStorage.setItem('google_maps_api_key', data.googleMapsApiKey);
        localStorage.setItem('google_maps_api_key_timestamp', Date.now().toString());
        
        setApiKey(data.googleMapsApiKey);
      } catch (error) {
        console.error('Error fetching Google Maps API key:', error);
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

  // Function to load Google Maps API script
  const loadGoogleMapsScript = useCallback((apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));
      
      document.head.appendChild(script);
    });
  }, []);

  // Initialize map once API key is available
  useEffect(() => {
    if (!apiKey || !mapContainer.current) return;

    const initMap = async () => {
      setIsLoading(true);
      
      try {
        await loadGoogleMapsScript(apiKey);
        
        // Create map instance
        const mapOptions: google.maps.MapOptions = {
          center: initialCenter,
          zoom: 14,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          styles: theme === 'dark' ? [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
          ] : []
        };
        
        const map = new google.maps.Map(mapContainer.current, mapOptions);
        mapRef.current = map;
        
        // Add user marker if location is provided
        if (location) {
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
            userInfoWindow.open(map, userMarker);
            infoWindowRef.current = userInfoWindow;
          });
        }
        
        // Add store markers
        markers.forEach((marker) => {
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
            infoWindow.open(map, storeMarker);
            infoWindowRef.current = infoWindow;
          });
        });
        
        // Add click listener for location picking
        if (!readonly) {
          map.addListener("click", (e: google.maps.MapMouseEvent) => {
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
  }, [apiKey, initialCenter, location, loadGoogleMapsScript, markers, onError, onLocationChange, readonly, theme]);

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
