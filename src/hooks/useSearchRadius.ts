
import mapboxgl from 'mapbox-gl';
import { useCallback } from 'react';

export const useSearchRadius = () => {
  const updateSearchRadius = useCallback(
    (
      map: mapboxgl.Map,
      location?: { lat: number; lng: number },
      searchRadius: number = 5
    ) => {
      if (!map || !location) return;

      // Clear existing circle layer and source
      if (map.getLayer('search-radius')) {
        map.removeLayer('search-radius');
      }
      if (map.getSource('search-radius')) {
        map.removeSource('search-radius');
      }

      // Only add the search radius if the map is fully loaded
      if (map.loaded()) {
        try {
          map.addSource('search-radius', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [location.lng, location.lat]
              }
            }
          });

          map.addLayer({
            id: 'search-radius',
            type: 'circle',
            source: 'search-radius',
            paint: {
              'circle-radius': {
                stops: [
                  [0, 0],
                  [20, searchRadius * 1000]
                ],
                base: 2
              },
              'circle-color': 'rgba(59, 130, 246, 0.1)',
              'circle-stroke-width': 2,
              'circle-stroke-color': 'rgba(59, 130, 246, 0.8)'
            }
          });

          map.flyTo({
            center: [location.lng, location.lat],
            essential: true
          });
        } catch (error) {
          console.error('Error updating search radius:', error);
        }
      } else {
        // If map is not loaded yet, wait for the load event
        map.once('load', () => {
          try {
            if (map.getSource('search-radius')) {
              map.removeSource('search-radius');
            }
            
            map.addSource('search-radius', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [location.lng, location.lat]
                }
              }
            });

            map.addLayer({
              id: 'search-radius',
              type: 'circle',
              source: 'search-radius',
              paint: {
                'circle-radius': {
                  stops: [
                    [0, 0],
                    [20, searchRadius * 1000]
                  ],
                  base: 2
                },
                'circle-color': 'rgba(59, 130, 246, 0.1)',
                'circle-stroke-width': 2,
                'circle-stroke-color': 'rgba(59, 130, 246, 0.8)'
              }
            });

            map.flyTo({
              center: [location.lng, location.lat],
              essential: true
            });
          } catch (error) {
            console.error('Error updating search radius after load:', error);
          }
        });
      }
    },
    []
  );

  return {
    updateSearchRadius
  };
};
