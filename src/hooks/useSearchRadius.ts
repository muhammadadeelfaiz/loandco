
import mapboxgl from 'mapbox-gl';

export const useSearchRadius = () => {
  const updateSearchRadius = (
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

    // Add circle for search radius
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
    }
  };

  return {
    updateSearchRadius
  };
};
