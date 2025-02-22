
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface Marker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
}

export const useMapMarkers = (map: mapboxgl.Map | null, markers: Marker[]) => {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(marker => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<h3 class="font-bold">${marker.title}</h3>
         ${marker.description ? `<p>${marker.description}</p>` : ''}`
      );

      const mapMarker = new mapboxgl.Marker()
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(mapMarker);
    });
  }, [map, markers]);
};
