import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapMarkerProps {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  map: mapboxgl.Map;
  onMarkerRemove: (id: string) => void;
}

const MapMarker = ({ id, lat, lng, title, description, map, onMarkerRemove }: MapMarkerProps) => {
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <h3 class="font-semibold">${title}</h3>
        ${description ? `<p>${description}</p>` : ''}
      `);

    const el = document.createElement('div');
    el.className = 'marker';
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.backgroundImage = 'url(https://img.icons8.com/material-outlined/24/000000/marker.png)';

    markerRef.current = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map);

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        onMarkerRemove(id);
      }
    };
  }, [id, lat, lng, title, description, map, onMarkerRemove]);

  useEffect(() => {
    markerRef.current?.setLngLat([lng, lat]);
  }, [lng, lat]);

  return null;
};

export default MapMarker;