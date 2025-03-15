
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import LocationPrompt from "@/components/LocationPrompt";
import Navigation from "@/components/Navigation";
import { useStores } from "@/hooks/useStores";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import CategoryGrid from "@/components/home/CategoryGrid";
import BestSellers from "@/components/home/BestSellers";
import RetailerGrid from "@/components/home/RetailerGrid";
import Map from "@/components/Map";
import { Card } from "@/components/ui/card";
import { useLocation } from "@/hooks/useLocation";
import { Loader2, MapPin } from "lucide-react";
import Deals from "@/components/home/Deals";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface IndexProps {
  user: User | null;
}

const CATEGORIES = [
  { name: "Electronics", image: "/lovable-uploads/1bf98cbb-1c1f-446b-af92-f18c1969ee44.png" },
  { name: "Fashion", image: "/lovable-uploads/9c7c0a92-8e0a-4da2-ab91-a778342ba322.png" },
  { name: "Home & Garden", image: "/lovable-uploads/a5b732da-cecd-4769-8f07-fe650aca3281.png" },
  { name: "Sports", image: "/lovable-uploads/88a4569e-4f6d-4939-ac15-0c6ac7b6e3fc.png" },
  { name: "Books", image: "/lovable-uploads/d2e2fe4c-bdcb-43ea-8b2e-1ef01827afa4.png" },
  { name: "Beauty", image: "/lovable-uploads/b3c74228-0324-4ed4-8a4d-887008bf51db.png" },
  { name: "Health", image: "/lovable-uploads/1b3c7f96-b1ac-40d2-b469-91f2eda8fcf5.png" },
  { name: "Food & Beverages", image: "/lovable-uploads/7a857710-4bc6-47a1-9dda-465ae2d7e3bd.png" },
  { name: "Automotive", image: "/lovable-uploads/a355fe90-4a24-48a1-aece-9efbe0db417a.png" },
  { name: "Toys", image: "/lovable-uploads/a4efafee-7622-4ccc-9b02-9ea93d5e4e3e.png" },
];

const RETAILER_IMAGES = {
  "Digital Store": "/lovable-uploads/5a3d5e73-5f21-4d64-8954-5684bbd5a3bb.png",
  "Fashion Hub": "/lovable-uploads/9c7c0a92-8e0a-4da2-ab91-a778342ba322.png",
};

const Index = ({ user }: IndexProps) => {
  const navigate = useNavigate();
  const userRole = user?.user_metadata?.role || "customer";
  const { userLocation, isLoading: isLoadingLocation, error: locationError } = useLocation();
  const { stores, isLoading: isLoadingStores } = useStores(userLocation);
  const { toast } = useToast();
  const [mapKey, setMapKey] = useState<number>(0);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    console.log('User location:', userLocation);
    console.log('Stores count:', stores.length);
    if (stores.length > 0) {
      console.log('First store:', stores[0]);
    }
  }, [userLocation, stores]);

  const handleLocationReceived = useCallback((coords: { lat: number; lng: number }) => {
    localStorage.setItem('userLocation', JSON.stringify(coords));
    
    // Don't reload the page, just update the state
    setMapKey(prev => prev + 1);
  }, []);

  const handleRefreshLocation = useCallback(() => {
    // Clear location from localStorage
    localStorage.removeItem('userLocation');
    localStorage.removeItem('locationPrompted');
    
    // Show the location prompt again without full page reload
    setMapKey(prev => prev + 1);
  }, []);

  const handleCategoryClick = useCallback((categoryName: string) => {
    navigate(`/search?category=${encodeURIComponent(categoryName)}`);
  }, [navigate]);

  const handleStoreMarkerClick = useCallback((storeId: string) => {
    console.log('Store marker clicked:', storeId);
    navigate(`/store/${storeId}`);
  }, [navigate]);

  // Handle map errors
  const handleMapError = useCallback((errorMessage: string) => {
    setMapError(errorMessage);
    toast({
      variant: "destructive",
      title: "Map Error",
      description: errorMessage,
      duration: 3000,
    });
  }, [toast]);

  // Memoize the store markers to prevent unnecessary recalculations
  const storeMarkers = useMemo(() => {
    if (!stores || stores.length === 0) {
      console.log('No stores available for markers');
      return [];
    }
    
    const markers = stores.map(store => ({
      id: store.id,
      lat: store.latitude,
      lng: store.longitude,
      title: store.name,
      description: `${store.category}${store.distance ? ` - ${store.distance.toFixed(1)}km away` : ''}${store.description ? `\n${store.description}` : ''}`
    }));
    
    console.log('Created store markers:', markers.length);
    return markers;
  }, [stores]);

  // Memoize the Map component with its props to prevent re-rendering
  const mapComponent = useMemo(() => {
    if (isLoadingLocation || isLoadingStores) {
      return (
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    console.log('Rendering map with', storeMarkers.length, 'markers');
    
    return (
      <Map 
        key={`map-${mapKey}`}
        location={userLocation}
        markers={storeMarkers}
        searchRadius={5}
        readonly={true}
        onError={handleMapError}
        onMarkerClick={handleStoreMarkerClick}
      />
    );
  }, [isLoadingLocation, isLoadingStores, userLocation, storeMarkers, mapKey, handleMapError, handleStoreMarkerClick]);

  return (
    <div className="min-h-screen bg-gradient-loco">
      <LocationPrompt onLocationReceived={handleLocationReceived} />
      <Navigation user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <FeaturedProducts />
        </div>
        
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-50">Browse Categories</h2>
            <p className="text-gray-600 dark:text-gray-300">Discover amazing deals across all categories</p>
          </div>
          <CategoryGrid categories={CATEGORIES} onCategoryClick={handleCategoryClick} />
        </div>
        
        <BestSellers />

        <section className="my-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Stores Near You</h2>
            
            {userLocation && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshLocation}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Update Location
              </Button>
            )}
          </div>
          
          <Card className="p-4 bg-white/80 dark:bg-gray-800/80">
            <div className="h-[400px] w-full">
              {mapComponent}
            </div>
            
            {storeMarkers.length === 0 && !isLoadingLocation && !isLoadingStores && (
              <div className="mt-4 text-center text-gray-600 dark:text-gray-300">
                <p>No stores found near your location. Try updating your location or check back later.</p>
              </div>
            )}
          </Card>
        </section>
        
        <Deals />
        
        <RetailerGrid stores={stores} retailerImages={RETAILER_IMAGES} />
      </main>
    </div>
  );
};

export default Index;
