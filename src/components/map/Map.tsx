
import MapboxMap from './MapboxMap';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

interface MapProps {
  location?: { lat: number; lng: number } | null;
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  readonly?: boolean;
  searchRadius?: number;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
  }>;
}

const Map = (props: MapProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchMapboxToken = async () => {
      const { data, error } = await supabase.functions.invoke('map-service', {
        body: { action: 'get-token' }
      });

      if (error) {
        console.error('Error fetching Mapbox token:', error);
        return;
      }

      if (data?.token) {
        setMapboxToken(data.token);
      }
      setIsLoading(false);
    };

    fetchMapboxToken();
  }, []);

  if (isLoading || !mapboxToken) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return <MapboxMap {...props} accessToken={mapboxToken} />;
};

export default Map;
