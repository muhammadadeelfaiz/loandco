
import mapboxgl from 'mapbox-gl';

export const useSearchRadius = () => {
  const updateSearchRadius = (
    map: mapboxgl.Map,
    location?: { lat: number; lng: number },
    searchRadius: number = 30
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

        // Calculate radius in meters
        const radiusInMeters = searchRadius * 1000;

        map.addLayer({
          id: 'search-radius',
          type: 'circle',
          source: 'search-radius',
          paint: {
            'circle-radius': {
              stops: [
                [0, 0],
                [20, radiusInMeters]
              ],
              base: 2
            },
            'circle-color': 'rgba(59, 130, 246, 0.1)',
            'circle-stroke-width': 2,
            'circle-stroke-color': 'rgba(59, 130, 246, 0.8)'
          }
        });

        // Adjust the zoom level based on the search radius
        const zoomLevel = Math.max(9, 14 - Math.log(searchRadius / 2.5) / Math.log(2));
        
        map.flyTo({
          center: [location.lng, location.lat],
          zoom: zoomLevel,
          essential: true
        });
        
        console.log(`Search radius set to ${searchRadius}km (${radiusInMeters}m) at zoom ${zoomLevel}`);
      } catch (error) {
        console.error('Error updating search radius:', error);
      }
    }
  };

  return {
    updateSearchRadius
  };
};
