
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
    if (!map || !map.loaded()) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers only if map is loaded
    markers.forEach(marker => {
      try {
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<h3 class="font-bold">${marker.title}</h3>
           ${marker.description ? `<p>${marker.description}</p>` : ''}`
        );

        const mapMarker = new mapboxgl.Marker()
          .setLngLat([marker.lng, marker.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(mapMarker);
      } catch (error) {
        console.error('Error adding marker:', error);
      }
    });

    // Cleanup function
    return () => {
      markersRef.current.forEach(marker => {
        try {
          marker.remove();
        } catch (error) {
          console.error('Error removing marker:', error);
        }
      });
      markersRef.current = [];
    };
  }, [map, markers]);
};
