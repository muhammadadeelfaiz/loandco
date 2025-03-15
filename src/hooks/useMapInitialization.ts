
import { useState, useEffect, useCallback, RefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// Temporary token - you should replace this with your own from Mapbox
const TEMP_MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZWFpIiwiYSI6ImNscDJsb2N0dDFmcHcya3BnYnZpNm9mbnEifQ.tHhXbyzm-GhoiZpFOSxG8A';

export const useMapInitialization = (mapContainer: RefObject<HTMLDivElement>, theme: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [tokenAttempts, setTokenAttempts] = useState(0);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSource, setTokenSource] = useState<string | null>(null);

  // Get the current domain for debugging
  const getCurrentDomain = useCallback(() => {
    try {
      return window.location.hostname;
    } catch (e) {
      return 'unknown';
    }
  }, []);

  // Function to validate a Mapbox token by making a test request
  const validateToken = useCallback(async (testToken: string): Promise<{isValid: boolean; error?: string}> => {
    try {
      console.log('Validating Mapbox token...');
      // Make a simple request to Mapbox API to verify token works
      const response = await fetch(`https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${testToken}`, {
        method: 'HEAD',
      });
      
      if (response.ok) {
        console.log('Token validation result: valid');
        return { isValid: true };
      } else {
        const status = response.status;
        let errorMsg = `Token invalid (HTTP ${status})`;
        
        if (status === 401) {
          errorMsg = "Token unauthorized or invalid";
        } else if (status === 403) {
          const domain = getCurrentDomain();
          errorMsg = `Token has domain restrictions that don't include '${domain}'`;
        }
        
        console.log(`Token validation result: invalid - ${errorMsg}`);
        return { isValid: false, error: errorMsg };
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return { isValid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [getCurrentDomain]);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log('Fetching Mapbox token... Attempt:', tokenAttempts + 1);
        setIsLoading(true);
        setTokenError(null);
        
        const currentDomain = getCurrentDomain();
        console.log(`Current domain: ${currentDomain}`);
        
        // First try to get token from localStorage cache if it exists and is recent
        const cachedToken = localStorage.getItem('mapbox_token');
        const cachedTimestamp = localStorage.getItem('mapbox_token_timestamp');
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        if (cachedToken && cachedTimestamp && parseInt(cachedTimestamp) > twentyFourHoursAgo) {
          // Validate cached token before using it
          const validationResult = await validateToken(cachedToken);
          if (validationResult.isValid) {
            console.log('Using valid cached Mapbox token from localStorage');
            setToken(cachedToken);
            setTokenSource('localStorage');
            setIsLoading(false);
            return;
          } else {
            console.log(`Cached token is invalid: ${validationResult.error}, clearing cache`);
            localStorage.removeItem('mapbox_token');
            localStorage.removeItem('mapbox_token_timestamp');
          }
        }
        
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
            if (data.valid) {
              console.log(`Successfully received valid Mapbox token from Supabase: ${data.source}`);
              
              // Cache the token in localStorage with timestamp
              localStorage.setItem('mapbox_token', data.token);
              localStorage.setItem('mapbox_token_timestamp', Date.now().toString());
              
              setToken(data.token);
              setTokenSource(data.source);
              setIsLoading(false);
              return;
            } else if (data.error && data.error.includes('domain')) {
              // Handle domain restriction error specifically
              console.error(`Token domain restriction error: ${data.error}`);
              setTokenError(`Token has domain restrictions that don't allow ${currentDomain}`);
              setToken(null);
              setIsLoading(false);
              
              toast({
                variant: "destructive",
                title: "Map Domain Restriction",
                description: `Your Mapbox token doesn't allow access from ${currentDomain}. Please update token settings.`,
                duration: 8000,
              });
              return;
            } else {
              console.warn(`Token from Supabase is invalid: ${data.error}`);
            }
          } else {
            console.warn('No token in response from map-service function');
          }
        } catch (supabaseError) {
          console.error('Supabase token fetch failed:', supabaseError);
        }
        
        // Use temporary token as last resort for development
        console.log('Using temporary Mapbox token for development');
        
        // Validate temporary token before using it
        const tempValidationResult = await validateToken(TEMP_MAPBOX_TOKEN);
        if (tempValidationResult.isValid) {
          localStorage.setItem('mapbox_token', TEMP_MAPBOX_TOKEN);
          localStorage.setItem('mapbox_token_timestamp', Date.now().toString());
          setToken(TEMP_MAPBOX_TOKEN);
          setTokenSource('fallback');
        } else {
          console.error(`Temporary token is invalid: ${tempValidationResult.error}`);
          setTokenError(tempValidationResult.error || 'Unable to obtain a valid Mapbox token');
          toast({
            variant: "destructive",
            title: "Map Error",
            description: "Failed to initialize map with valid token. Please check your network settings or Mapbox configuration.",
            duration: 5000,
          });
        }
        
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
  }, [toast, tokenAttempts, validateToken, getCurrentDomain]);

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
      // Try to use temporary token as last resort
      mapboxgl.accessToken = TEMP_MAPBOX_TOKEN;
      console.log('Using temporary token as fallback');
    } else {
      console.log('Using Mapbox token:', token.substring(0, 10) + '...');
      mapboxgl.accessToken = token;
    }

    try {
      const defaultLocation = location || { lat: 25.2048, lng: 55.2708 }; // Dubai as default

      console.log('Creating map instance with center:', defaultLocation);
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: theme === 'dark' 
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11',
        center: [defaultLocation.lng, defaultLocation.lat],
        zoom: 13,
        attributionControl: false,
      });
      
      // Add attribution in the bottom-right
      map.addControl(new mapboxgl.AttributionControl(), 'bottom-right');

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Setup marker if not in readonly mode
      if (!readonly) {
        const marker = new mapboxgl.Marker({
          draggable: !readonly,
          color: '#3886ce'
        });
        
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
    // Clear any cached tokens first
    localStorage.removeItem('mapbox_token');
    localStorage.removeItem('mapbox_token_timestamp');
    setTokenAttempts(prev => prev + 1);
  };

  return { isLoading, initializeMap, retryFetchToken, tokenError, tokenSource };
};
