
// Add TypeScript declarations for Google Maps JavaScript API
declare global {
  interface Window {
    google: typeof google;
  }
  
  namespace google {
    namespace maps {
      // Add the missing MapMouseEvent interface
      interface MapMouseEvent {
        latLng?: google.maps.LatLng;
        stop(): void;
      }
    }
  }
}

export {};
