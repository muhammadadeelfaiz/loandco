
import { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export const useMapInitialization = (mapContainer: React.RefObject<HTMLDivElement>, theme: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [tokenAttempts, setTokenAttempts] = useState(0);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log('Fetching Mapbox token... Attempt:', tokenAttempts + 1);
        setIsLoading(true);
        setTokenError(null);
        
        // First try to get token from localStorage cache if it exists and is recent
        const cachedToken = localStorage.getItem('mapbox_token');
        const cachedTimestamp = localStorage.getItem('mapbox_token_timestamp');
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        if (cachedToken && cachedTimestamp && parseInt(cachedTimestamp) > twentyFourHoursAgo) {
          console.log('Using cached Mapbox token from localStorage');
          setToken(cachedToken);
          setIsLoading(false);
          return;
        }
        
        // Fixed fallback token for development/emergencies
        const FALLBACK_TOKEN = 'pk.eyJ1IjoibG92YWJsZWFpIiwiYSI6ImNscDJsb2N0dDFmcHcya3BnYnZpNm9mbnEifQ.tHhXbyzm-GhoiZpFOSxG8A'; 
        
        // Try to get token from Supabase Function
        try {
          console.log('Calling Supabase map-service function...');
          const { data, error } = await supabase.functions.invoke('map-service', {
            method: 'GET',
          });
          
          if (error) {
            console.error('Supabase function error:', error);
            throw error;
          }
          
          if (data?.token) {
            console.log('Successfully received Mapbox token from Supabase:', data.source);
            
            // Cache the token in localStorage with timestamp
            localStorage.setItem('mapbox_token', data.token);
            localStorage.setItem('mapbox_token_timestamp', Date.now().toString());
            
            setToken(data.token);
            setIsLoading(false);
            return;
          } else {
            console.warn('No token in response from map-service function');
          }
        } catch (supabaseError) {
          console.error('Supabase token fetch failed:', supabaseError);
        }
        
        // Use fallback token as last resort
        console.log('Using fallback Mapbox token');
        setToken(FALLBACK_TOKEN);
        setIsLoading(false);
      } catch (error) {
        console.error('Token fetch error:', error);
        setTokenError(error instanceof Error ? error.message : 'Unknown error fetching map token');
        setToken(null);
        setIsLoading(false);
        
        toast({
          variant: "destructive",
          title: "Map Error",
          description: error instanceof Error ? error.message : "Failed to fetch map configuration",
          duration: 5000,
        });
        
        // Increment attempt counter
        setTokenAttempts(prev => prev + 1);
      }
    };

    // Only fetch if we don't have a token or if there was an error and we're retrying
    if (!token || tokenError) {
      fetchToken();
    }
  }, [toast, tokenAttempts]);

  const initializeMap = async (
    location: { lat: number; lng: number },
    onLocationChange?: (location: { lat: number; lng: number }) => void,
    readonly = false
  ) => {
    if (!mapContainer.current) {
      console.error('Map container not found');
      return null;
    }

    if (!token) {
      console.error('No Mapbox token available');
      return null;
    }

    try {
      console.log('Initializing map with token...');
      mapboxgl.accessToken = token;

      const defaultLocation = location || { lat: 25.2048, lng: 55.2708 }; // Dubai as default

      console.log('Creating map instance with center:', defaultLocation);
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: theme === 'dark' 
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11',
        center: [defaultLocation.lng, defaultLocation.lat],
        zoom: 13,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Setup marker if not in readonly mode
      if (!readonly) {
        const marker = new mapboxgl.Marker();
        
        map.on('click', (e) => {
          const newLocation = {
            lat: e.lngLat.lat,
            lng: e.lngLat.lng
          };
          
          marker.setLngLat([newLocation.lng, newLocation.lat]).addTo(map);
          onLocationChange?.(newLocation);
        });

        if (location) {
          marker.setLngLat([location.lng, location.lat]).addTo(map);
        }
      }

      // Setup event handlers
      map.on('load', () => {
        console.log('Map loaded successfully');
        setIsLoading(false);
      });

      map.on('error', (e) => {
        console.error('Mapbox error:', e);
        toast({
          variant: "destructive",
          title: "Map Error",
          description: "There was an error with the map. Please try reloading the page.",
          duration: 5000,
        });
      });

      return map;

    } catch (error) {
      console.error('Map initialization failed:', error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Map Error",
        description: error instanceof Error ? error.message : "Failed to initialize map",
        duration: 5000,
      });
      return null;
    }
  };

  // Function to retry fetching the token
  const retryFetchToken = () => {
    setTokenAttempts(prev => prev + 1);
  };

  return { isLoading, initializeMap, retryFetchToken, tokenError };
};
