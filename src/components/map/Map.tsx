import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapMarker from './MapMarker';
import CircleOverlay from './CircleOverlay';

interface MapProps {
  location?: { lat: number; lng: number };
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

const Map = ({ 
  location, 
  onLocationChange, 
  readonly = false,
  searchRadius = 5,
  markers = []
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoibGFzdG1hbjFvMW8xIiwiYSI6ImNtNjhhY3JrZjBkYnIycnM4czBxdHJ0ODYifQ._X04qSsIXJCSzmvgFmyFQw';
    
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: location ? [location.lng, location.lat] : [0, 0],
      zoom: 13
    });

    mapInstance.current = newMap;
    newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

    newMap.on('load', () => {
      setMap(newMap);
    });

    if (!readonly) {
      newMap.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        
        if (userMarker.current) {
          userMarker.current.setLngLat([lng, lat]);
        } else {
          userMarker.current = new mapboxgl.Marker({ color: '#3B82F6' })
            .setLngLat([lng, lat])
            .addTo(newMap);
        }

        onLocationChange?.({ lng, lat });
      });
    }

    return () => {
      if (userMarker.current) {
        userMarker.current.remove();
      }
      newMap.remove();
    };
  }, [location?.lat, location?.lng, onLocationChange, readonly]);

  const handleMarkerRemove = (id: string) => {
    console.log(`Marker ${id} removed`);
  };

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      {map && location && (
        <CircleOverlay
          map={map}
          center={[location.lng, location.lat]}
          radiusInKm={searchRadius}
        />
      )}
      {map && markers.map(marker => (
        <MapMarker
          key={marker.id}
          map={map}
          onMarkerRemove={handleMarkerRemove}
          {...marker}
        />
      ))}
      <style>{`
        .marker {
          background-size: cover;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Map;