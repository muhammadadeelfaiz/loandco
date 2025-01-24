import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
}

interface MapMarkerListProps {
  map: mapboxgl.Map;
  markers: MapMarker[];
}

const MapMarkerList = ({ map, markers }: MapMarkerListProps) => {
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    const currentMarkers = { ...markersRef.current };

    // Add or update markers
    markers.forEach(marker => {
      if (currentMarkers[marker.id]) {
        currentMarkers[marker.id].setLngLat([marker.lng, marker.lat]);
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

        currentMarkers[marker.id] = new mapboxgl.Marker(el)
          .setLngLat([marker.lng, marker.lat])
          .setPopup(popup)
          .addTo(map);
      }
    });

    // Remove old markers
    Object.keys(markersRef.current).forEach(id => {
      if (!markers.find(m => m.id === id)) {
        markersRef.current[id].remove();
        delete currentMarkers[id];
      }
    });

    markersRef.current = currentMarkers;

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
    };
  }, [map, markers]);

  return null;
};

export default MapMarkerList;