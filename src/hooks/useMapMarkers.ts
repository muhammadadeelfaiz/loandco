import { useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';

interface Marker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
}

export const useMapMarkers = (onMarkerClick?: (markerId: string) => void) => {
  const markersRef = useRef<{[key: string]: mapboxgl.Marker}>({});

  const updateMarkers = useCallback((map: mapboxgl.Map, markers: Marker[]) => {
    console.log('updateMarkers called with', markers.length, 'markers');
    
    // Track existing marker IDs to avoid removing and recreating unchanged markers
    const existingMarkerIds = new Set(Object.keys(markersRef.current));
    const newMarkerIds = new Set(markers.map(m => m.id));
    
    // Remove markers that are no longer in the list
    existingMarkerIds.forEach(id => {
      if (!newMarkerIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    markers.forEach(marker => {
      if (markersRef.current[marker.id]) {
        // Update position if marker already exists
        markersRef.current[marker.id].setLngLat([marker.lng, marker.lat]);
        
        // Update popup content if it exists
        const popup = markersRef.current[marker.id].getPopup();
        if (popup) {
          popup.setHTML(`
            <div class="p-2">
              <h3 class="font-bold text-sm">${marker.title}</h3>
              ${marker.description ? `<p class="text-xs mt-1">${marker.description}</p>` : ''}
            </div>
          `);
        }
      } else {
        // Create a new marker element
        const el = document.createElement('div');
        el.className = 'store-marker';
        el.style.width = '36px';
        el.style.height = '36px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#3B82F6';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.color = 'white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.padding = '2px';
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 7.278 12 12"></path><path d="M12 12 3.5 7.278"></path><path d="M20.5 16.722 12 12"></path><path d="M12 12 3.5 16.722"></path><circle cx="12" cy="12" r="9"></circle><path d="m8 9 1 0"></path><path d="m15 9 1 0"></path><path d="m8 15 8 0"></path></svg>`;
        
        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: true
        }).setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-sm">${marker.title}</h3>
            ${marker.description ? `<p class="text-xs mt-1">${marker.description}</p>` : ''}
          </div>
        `);

        // Create marker
        const mapMarker = new mapboxgl.Marker(el)
          .setLngLat([marker.lng, marker.lat])
          .setPopup(popup)
          .addTo(map);

        // Add click handler for marker
        if (onMarkerClick) {
          el.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent map click event
            onMarkerClick(marker.id);
          });
        }

        // Store for later reference
        markersRef.current[marker.id] = mapMarker;
      }
    });
    
    return () => {
      // Clean up all markers
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
    };
  }, [onMarkerClick]);

  return {
    updateMarkers
  };
};
