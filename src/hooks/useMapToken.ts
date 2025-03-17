
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UseMapTokenResult {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<string | null>;
}

/**
 * Hook to fetch and manage Mapbox token
 */
export const useMapToken = (): UseMapTokenResult => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchToken = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check for a valid cached token first
      const cachedToken = localStorage.getItem('mapbox_token');
      const cachedTimestamp = localStorage.getItem('mapbox_token_timestamp');
      
      if (cachedToken && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        // Use cached token if it's less than 30 minutes old
        if (now - timestamp < 30 * 60 * 1000) {
          console.log('Using cached Mapbox token');
          setToken(cachedToken);
          setIsLoading(false);
          return cachedToken;
        }
      }
      
      // Fetch fresh token from Edge Function (using map-service instead of map-token)
      console.log('Fetching fresh Mapbox token from map-service');
      const { data, error } = await supabase.functions.invoke('map-service');
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      if (!data || !data.token) {
        throw new Error('No token received from server');
      }
      
      // Cache the token
      localStorage.setItem('mapbox_token', data.token);
      localStorage.setItem('mapbox_token_timestamp', Date.now().toString());
      
      console.log(`Successfully fetched Mapbox token (source: ${data.source || 'unknown'})`);
      setToken(data.token);
      return data.token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Mapbox token';
      console.error('Error fetching Mapbox token:', errorMessage);
      
      // If all else fails, use the Mapbox default public token as last resort
      const fallbackToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';
      console.log('Using fallback Mapbox token as last resort');
      
      // Still report the error for debugging
      setError(errorMessage);
      
      // But set the fallback token so the map still works
      setToken(fallbackToken);
      return fallbackToken;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initial fetch on mount
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);
  
  const refreshToken = useCallback(async () => {
    // Clear cache
    localStorage.removeItem('mapbox_token');
    localStorage.removeItem('mapbox_token_timestamp');
    
    return fetchToken();
  }, [fetchToken]);
  
  return {
    token,
    isLoading,
    error,
    refreshToken
  };
};
