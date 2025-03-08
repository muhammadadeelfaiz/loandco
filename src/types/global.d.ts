
// Add TypeScript declarations for Google Maps JavaScript API
declare global {
  interface Window {
    google: typeof google;
  }
  
  namespace google {
    namespace maps {
      // This provides an explicit type for the click event handler
      interface MapMouseEvent {
        latLng?: google.maps.LatLng;
        stop(): void;
      }
    }
  }
}

export {};
