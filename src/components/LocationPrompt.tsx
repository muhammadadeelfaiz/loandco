
import { useState, useEffect } from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { MapPin, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationPromptProps {
  onLocationReceived: (coords: { lat: number; lng: number }) => void;
}

const LocationPrompt = ({ onLocationReceived }: LocationPromptProps) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const hasPrompted = localStorage.getItem('locationPrompted');
    const savedLocation = localStorage.getItem('userLocation');
    
    if (!hasPrompted && !savedLocation) {
      setShowPrompt(true);
    }
  }, []);

  const handleAllowLocation = () => {
    setIsLoading(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          onLocationReceived(coords);
          localStorage.setItem('locationPrompted', 'true');
          localStorage.setItem('userLocation', JSON.stringify(coords));
          
          setIsLoading(false);
          setShowPrompt(false);
          
          toast({
            title: "Location Access Granted",
            description: "We'll use your location to show nearby stores and products.",
            duration: 3000,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoading(false);
          
          let errorMessage = 'Unable to access your location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location services in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = 'An unknown error occurred.';
          }
          
          setError(errorMessage);
          
          toast({
            variant: "destructive",
            title: "Location Error",
            description: errorMessage,
            duration: 5000,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setIsLoading(false);
      setError('Geolocation is not supported by this browser.');
      
      toast({
        variant: "destructive",
        title: "Browser Not Supported",
        description: "Your browser doesn't support geolocation.",
        duration: 5000,
      });
    }
  };

  const handleSkip = () => {
    localStorage.setItem('locationPrompted', 'true');
    setShowPrompt(false);
    
    // Use default location (New York City)
    const defaultLocation = { lat: 40.7128, lng: -74.0060 };
    onLocationReceived(defaultLocation);
    localStorage.setItem('userLocation', JSON.stringify(defaultLocation));
    
    toast({
      title: "Using Default Location",
      description: "We're using a default location to show you content.",
      duration: 3000,
    });
  };

  return (
    <AlertDialog open={showPrompt} onOpenChange={setShowPrompt}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> 
            Share Your Location
          </AlertDialogTitle>
          <AlertDialogDescription>
            Allow access to your location to find nearby stores and products. 
            This helps us provide you with the most relevant local shopping options.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {error && (
          <div className="bg-destructive/10 p-3 rounded-md flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <AlertDialogFooter className="sm:justify-between">
          <AlertDialogCancel onClick={handleSkip} disabled={isLoading}>Skip for now</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleAllowLocation}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⟳</span>
                Detecting location...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                Allow location access
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LocationPrompt;
