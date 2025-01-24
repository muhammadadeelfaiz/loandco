import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapContext } from './MapContext';

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
}

interface MapMarkersProps {
  markers: MapMarker[];
}

const MapMarkers = ({ markers }: MapMarkersProps) => {
  const { map } = useMapContext();
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    if (!map) return;

    // Remove markers that are no longer in the list
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!markers.find(m => m.id === id)) {
        marker.remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    markers.forEach(marker => {
      if (markersRef.current[marker.id]) {
        markersRef.current[marker.id].setLngLat([marker.lng, marker.lat]);
      } else {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <h3 class="font-semibold">${marker.title}</h3>
            ${marker.description ? `<p>${marker.description}</p>` : ''}
          `);

        const el = document.createElement('div');
        el.className = 'marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.backgroundImage = 'url(https://img.icons8.com/material-outlined/24/000000/marker.png)';

        markersRef.current[marker.id] = new mapboxgl.Marker(el)
          .setLngLat([marker.lng, marker.lat])
          .setPopup(popup)
          .addTo(map);
      }
    });

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
    };
  }, [map, markers]);

  return null;
};

export default MapMarkers;