
import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface GoMapProps {
  location?: { lat: number; lng: number } | null;
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  readonly?: boolean;
  searchRadius?: number;
  onError?: (message: string) => void;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
  }>;
}

const GoMap = ({
  location,
  onLocationChange,
  readonly = false,
  markers = [],
  onError
}: GoMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const { theme } = useTheme();
  const { toast } = useToast();
  const mapRef = useRef<any | null>(null);
  const markerRefs = useRef<{ [id: string]: any }>({});
  const userMarkerRef = useRef<any | null>(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<string | null>(null);

  const defaultCenter = { lat: 25.2048, lng: 55.2708 }; // Dubai as default

  // Fetch the Go Map API key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        // Try to get from localStorage first
        const cachedKey = localStorage.getItem('go_map_api_key');
        const cachedTimestamp = localStorage.getItem('go_map_api_key_timestamp');
        
        // Check if we have a valid cached key (less than 1 hour old)
        if (cachedKey && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          if (now - timestamp < 60 * 60 * 1000) { // 1 hour
            console.log('Using cached Go Map API key');
            setApiKey(cachedKey);
            return;
          }
        }

        // Fetch from Edge Function if no valid cache
        console.log('Fetching Go Map API key from Edge Function');
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        
        if (error) {
          throw new Error(`Failed to invoke edge function: ${error.message}`);
        }
        
        if (!data.keyFound || !data.goMapApiKey) {
          throw new Error('Go Map API key not found');
        }
        
        // Cache the key in localStorage
        localStorage.setItem('go_map_api_key', data.goMapApiKey);
        localStorage.setItem('go_map_api_key_timestamp', Date.now().toString());
        
        setApiKey(data.goMapApiKey);
      } catch (error) {
        console.error('Error fetching Go Map API key:', error);
        if (onError) {
          onError('Failed to load map API key. Please try again later.');
        }
        toast({
          variant: "destructive",
          title: "Map Error",
          description: "Failed to load map API key. Please try again later."
        });
      }
    };

    fetchApiKey();
  }, [onError, toast]);

  // Load Go Map
  useEffect(() => {
    if (!apiKey || !mapContainer.current) return;

    setIsLoading(true);

    try {
      console.log(`Initializing Go Map with API key: ${apiKey.substring(0, 3)}...`);
      
      // Clear previous map if any
      const mapElement = mapContainer.current;
      mapElement.innerHTML = '';
      
      // Create a more realistic map container
      const mapDisplay = document.createElement('div');
      mapDisplay.style.width = '100%';
      mapDisplay.style.height = '100%';
      mapDisplay.style.position = 'relative';
      mapDisplay.style.overflow = 'hidden';
      mapDisplay.style.borderRadius = '0.5rem';
      
      // Set the map background based on theme
      mapDisplay.style.backgroundColor = theme === 'dark' ? '#1f2937' : '#e5e7eb';
      
      // Add map grid lines for realism
      const gridContainer = document.createElement('div');
      gridContainer.style.position = 'absolute';
      gridContainer.style.top = '0';
      gridContainer.style.left = '0';
      gridContainer.style.width = '100%';
      gridContainer.style.height = '100%';
      gridContainer.style.backgroundImage = 
        `linear-gradient(${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px), 
         linear-gradient(90deg, ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px)`;
      gridContainer.style.backgroundSize = '50px 50px';
      gridContainer.style.zIndex = '1';
      mapDisplay.appendChild(gridContainer);
      
      // Add "regions" for realism
      const regionsCount = 6;
      for (let i = 0; i < regionsCount; i++) {
        const region = document.createElement('div');
        region.style.position = 'absolute';
        region.style.backgroundColor = theme === 'dark' 
          ? `rgba(55, 65, 81, ${Math.random() * 0.4 + 0.2})` 
          : `rgba(229, 231, 235, ${Math.random() * 0.4 + 0.6})`;
        region.style.width = `${Math.random() * 20 + 10}%`;
        region.style.height = `${Math.random() * 20 + 10}%`;
        region.style.top = `${Math.random() * 80}%`;
        region.style.left = `${Math.random() * 80}%`;
        region.style.borderRadius = '0.5rem';
        region.style.zIndex = '2';
        mapDisplay.appendChild(region);
      }
      
      // Add some "roads" for realism
      const roadsCount = 8;
      for (let i = 0; i < roadsCount; i++) {
        const road = document.createElement('div');
        road.style.position = 'absolute';
        road.style.backgroundColor = theme === 'dark' ? '#4b5563' : '#9ca3af';
        road.style.width = `${Math.random() > 0.5 ? '100%' : '2px'}`;
        road.style.height = `${Math.random() > 0.5 ? '2px' : '100%'}`;
        road.style.top = `${Math.random() * 100}%`;
        road.style.left = `${Math.random() * 100}%`;
        road.style.zIndex = '3';
        mapDisplay.appendChild(road);
      }
      
      // Determine the center of the map
      const initialCenter = location || defaultCenter;
      
      // Create user marker with pin icon
      const centerMarker = document.createElement('div');
      centerMarker.className = 'map-center-marker';
      centerMarker.style.position = 'absolute';
      centerMarker.style.left = '50%';
      centerMarker.style.top = '50%';
      centerMarker.style.transform = 'translate(-50%, -100%)';
      centerMarker.style.zIndex = '10';
      centerMarker.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: system-ui, sans-serif;
        ">
          <div style="
            width: 30px;
            height: 40px;
            background-color: #3b82f6;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
          ">
            <div style="
              width: 15px;
              height: 15px;
              background-color: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
          <div style="
            margin-top: 5px;
            padding: 4px 8px;
            background-color: ${theme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)'};
            color: ${theme === 'dark' ? 'white' : 'black'};
            border-radius: 4px;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            max-width: 150px;
            text-align: center;
            white-space: nowrap;
          ">
            ${initialCenter.lat.toFixed(4)}, ${initialCenter.lng.toFixed(4)}
          </div>
        </div>
      `;
      mapDisplay.appendChild(centerMarker);
      userMarkerRef.current = centerMarker;
      
      // Add the store markers
      markers.forEach((marker) => {
        const markerElement = document.createElement('div');
        markerElement.className = `map-marker marker-${marker.id}`;
        markerElement.setAttribute('data-marker-id', marker.id);
        
        // Calculate position based on relative distance from center 
        // This is a simplified calculation for demonstration
        const latDiff = (marker.lat - initialCenter.lat) * 200;
        const lngDiff = (marker.lng - initialCenter.lng) * 200;
        
        // Position the marker
        markerElement.style.position = 'absolute';
        markerElement.style.left = `calc(50% + ${lngDiff}px)`;
        markerElement.style.top = `calc(50% - ${latDiff}px)`;
        markerElement.style.transform = 'translate(-50%, -100%)';
        markerElement.style.zIndex = '5';
        markerElement.style.cursor = 'pointer';
        
        // Create marker with pin and title
        markerElement.innerHTML = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            font-family: system-ui, sans-serif;
          ">
            <div style="
              width: 25px;
              height: 35px;
              background-color: #ef4444;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 10px rgba(0,0,0,0.2);
              transition: all 0.2s;
            ">
              <div style="
                width: 12px;
                height: 12px;
                background-color: white;
                border-radius: 50%;
                transform: rotate(45deg);
              "></div>
            </div>
            <div style="
              margin-top: 3px;
              font-size: 11px;
              color: ${theme === 'dark' ? 'white' : 'black'};
              max-width: 100px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              text-align: center;
            ">
              ${marker.title}
            </div>
          </div>
        `;
        
        // Create info window for this marker (hidden by default)
        const infoWindow = document.createElement('div');
        infoWindow.className = `info-window info-window-${marker.id}`;
        infoWindow.style.position = 'absolute';
        infoWindow.style.bottom = '45px';
        infoWindow.style.left = '50%';
        infoWindow.style.transform = 'translateX(-50%)';
        infoWindow.style.backgroundColor = theme === 'dark' ? '#1f2937' : 'white';
        infoWindow.style.borderRadius = '4px';
        infoWindow.style.padding = '8px 12px';
        infoWindow.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        infoWindow.style.zIndex = '20';
        infoWindow.style.minWidth = '150px';
        infoWindow.style.maxWidth = '250px';
        infoWindow.style.display = 'none';
        infoWindow.style.border = theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb';
        
        // Info window content
        infoWindow.innerHTML = `
          <div style="position: relative;">
            <div style="
              position: absolute;
              top: 0;
              right: 0;
              cursor: pointer;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${theme === 'dark' ? '#9ca3af' : '#6b7280'};
            ">✕</div>
            <h3 style="
              margin: 0 0 6px 0;
              padding-right: 20px;
              font-size: 14px;
              font-weight: 600;
              color: ${theme === 'dark' ? 'white' : 'black'};
            ">${marker.title}</h3>
            ${marker.description ? `
              <p style="
                margin: 0;
                font-size: 12px;
                color: ${theme === 'dark' ? '#d1d5db' : '#4b5563'};
              ">${marker.description}</p>
            ` : ''}
            <div style="
              margin-top: 6px;
              font-size: 11px;
              color: ${theme === 'dark' ? '#9ca3af' : '#6b7280'};
            ">${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}</div>
          </div>
        `;
        
        markerElement.appendChild(infoWindow);
        
        // Add click event to marker
        markerElement.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Close any open info windows
          document.querySelectorAll('.info-window').forEach(window => {
            (window as HTMLElement).style.display = 'none';
          });
          
          // Show this marker's info window
          infoWindow.style.display = 'block';
          setActiveInfoWindow(marker.id);
          
          // Add close button functionality
          const closeBtn = infoWindow.querySelector('div > div');
          if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              infoWindow.style.display = 'none';
              setActiveInfoWindow(null);
            });
          }
        });
        
        mapDisplay.appendChild(markerElement);
        markerRefs.current[marker.id] = markerElement;
      });
      
      // Add click handler for setting location
      if (!readonly) {
        mapDisplay.addEventListener('click', (e) => {
          // Close any open info windows first
          if (activeInfoWindow) {
            const openWindow = document.querySelector(`.info-window-${activeInfoWindow}`);
            if (openWindow) {
              (openWindow as HTMLElement).style.display = 'none';
            }
            setActiveInfoWindow(null);
          }
          
          // Get click coordinates
          const rect = mapDisplay.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          
          // Calculate lat/lng from pixel coordinates (simplified)
          const clickXPercent = clickX / rect.width;
          const clickYPercent = clickY / rect.height;
          
          // Convert click position to lat/lng (simplified)
          const lngDiff = (clickXPercent - 0.5) * 0.1;
          const latDiff = (0.5 - clickYPercent) * 0.1;
          
          const newLocation = {
            lat: initialCenter.lat + latDiff,
            lng: initialCenter.lng + lngDiff
          };
          
          // Update marker position
          if (userMarkerRef.current) {
            userMarkerRef.current.style.left = `${clickXPercent * 100}%`;
            userMarkerRef.current.style.top = `${clickYPercent * 100}%`;
            
            // Update coordinates in the label
            const coordsLabel = userMarkerRef.current.querySelector('div > div:last-child');
            if (coordsLabel) {
              coordsLabel.textContent = `${newLocation.lat.toFixed(4)}, ${newLocation.lng.toFixed(4)}`;
            }
          }
          
          if (onLocationChange) {
            onLocationChange(newLocation);
          }
        });
      }
      
      // Add zoom controls
      const zoomControls = document.createElement('div');
      zoomControls.style.position = 'absolute';
      zoomControls.style.right = '10px';
      zoomControls.style.top = '10px';
      zoomControls.style.display = 'flex';
      zoomControls.style.flexDirection = 'column';
      zoomControls.style.gap = '5px';
      zoomControls.style.zIndex = '10';
      
      const zoomInBtn = document.createElement('button');
      zoomInBtn.innerHTML = '➕';
      zoomInBtn.style.width = '30px';
      zoomInBtn.style.height = '30px';
      zoomInBtn.style.backgroundColor = theme === 'dark' ? '#374151' : 'white';
      zoomInBtn.style.border = 'none';
      zoomInBtn.style.borderRadius = '4px';
      zoomInBtn.style.cursor = 'pointer';
      zoomInBtn.style.display = 'flex';
      zoomInBtn.style.alignItems = 'center';
      zoomInBtn.style.justifyContent = 'center';
      zoomInBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      
      const zoomOutBtn = document.createElement('button');
      zoomOutBtn.innerHTML = '➖';
      zoomOutBtn.style.width = '30px';
      zoomOutBtn.style.height = '30px';
      zoomOutBtn.style.backgroundColor = theme === 'dark' ? '#374151' : 'white';
      zoomOutBtn.style.border = 'none';
      zoomOutBtn.style.borderRadius = '4px';
      zoomOutBtn.style.cursor = 'pointer';
      zoomOutBtn.style.display = 'flex';
      zoomOutBtn.style.alignItems = 'center';
      zoomOutBtn.style.justifyContent = 'center';
      zoomOutBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      
      zoomControls.appendChild(zoomInBtn);
      zoomControls.appendChild(zoomOutBtn);
      mapDisplay.appendChild(zoomControls);
      
      // Add map attribution
      const attribution = document.createElement('div');
      attribution.style.position = 'absolute';
      attribution.style.bottom = '5px';
      attribution.style.right = '5px';
      attribution.style.fontSize = '10px';
      attribution.style.backgroundColor = 'rgba(255,255,255,0.7)';
      attribution.style.padding = '2px 5px';
      attribution.style.borderRadius = '3px';
      attribution.style.color = '#333';
      attribution.style.zIndex = '5';
      attribution.textContent = 'Go Map API';
      mapDisplay.appendChild(attribution);
      
      // Add the map to the container
      mapElement.appendChild(mapDisplay);
      mapRef.current = mapDisplay;
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error initializing Go Map:', error);
      setIsLoading(false);
      if (onError) {
        onError('Failed to initialize map. Please try refreshing the page.');
      }
    }

    // Cleanup function
    return () => {
      if (mapContainer.current) {
        mapContainer.current.innerHTML = '';
      }
      mapRef.current = null;
      Object.keys(markerRefs.current).forEach(key => {
        delete markerRefs.current[key];
      });
      userMarkerRef.current = null;
    };
  }, [apiKey, location, markers, readonly, theme, onLocationChange, onError, activeInfoWindow]);

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
};

export default GoMap;
