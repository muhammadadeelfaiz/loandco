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
import Map from "@/components/map/Map";
import { Card } from "@/components/ui/card";
import { useLocation } from "@/hooks/useLocation";
import { Loader2, MapPin, Tag } from "lucide-react";
import Deals from "@/components/home/Deals";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import LocalRetailerProducts from "@/components/home/LocalRetailerProducts";

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

// Default search radius and limits
const DEFAULT_SEARCH_RADIUS_KM = 30;
const MIN_SEARCH_RADIUS_KM = 10;
const MAX_SEARCH_RADIUS_KM = 60;

const Index = ({ user }: IndexProps) => {
  const navigate = useNavigate();
  const userRole = user?.user_metadata?.role || "customer";
  const { userLocation, isLoading: isLoadingLocation, error: locationError } = useLocation();
  const [searchRadius, setSearchRadius] = useState<number>(DEFAULT_SEARCH_RADIUS_KM);
  const { stores, isLoading: isLoadingStores } = useStores(userLocation, null, searchRadius);
  const { toast } = useToast();
  const [mapKey, setMapKey] = useState<number>(0);
  const [mapError, setMapError] = useState<string | null>(null);
  
  const { data: localProducts, isLoading: isLoadingLocalProducts } = useQuery({
    queryKey: ['local-products', userLocation],
    queryFn: async () => {
      if (!userLocation) return [];
      
      const storeIds = stores.map(store => store.id);
      
      if (storeIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*, retailers:retailer_id(name)')
        .in('store_id', storeIds)
        .limit(6);
      
      if (error) {
        console.error('Error fetching local products:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!userLocation && stores.length > 0,
  });

  useEffect(() => {
    console.log('User location:', userLocation);
    console.log(`Stores count within ${searchRadius}km radius:`, stores.length);
    if (stores.length > 0) {
      console.log('First store:', stores[0]);
    }
  }, [userLocation, stores, searchRadius]);

  const handleLocationReceived = useCallback((coords: { lat: number; lng: number }) => {
    localStorage.setItem('userLocation', JSON.stringify(coords));
    
    setMapKey(prev => prev + 1);
  }, []);

  const handleRefreshLocation = useCallback(() => {
    localStorage.removeItem('userLocation');
    localStorage.removeItem('locationPrompted');
    
    setMapKey(prev => prev + 1);
  }, []);

  const handleRadiusChange = useCallback((value: number[]) => {
    const newRadius = value[0];
    console.log(`Changing search radius to ${newRadius}km`);
    setSearchRadius(newRadius);
    setMapKey(prev => prev + 1);
  }, []);

  const handleCategoryClick = useCallback((categoryName: string) => {
    navigate(`/search?category=${encodeURIComponent(categoryName)}`);
  }, [navigate]);

  const handleStoreMarkerClick = useCallback((storeId: string) => {
    console.log('Store marker clicked:', storeId);
    navigate(`/store/${storeId}`);
  }, [navigate]);

  const handleMapError = useCallback((errorMessage: string) => {
    setMapError(errorMessage);
    toast({
      variant: "destructive",
      title: "Map Error",
      description: errorMessage,
      duration: 3000,
    });
  }, [toast]);

  const storeMarkers = useMemo(() => {
    if (!stores || stores.length === 0) {
      console.log(`No stores available for markers within ${searchRadius}km radius`);
      return [];
    }
    
    const markers = stores.map(store => ({
      id: store.id,
      lat: store.latitude,
      lng: store.longitude,
      title: store.name,
      description: `${store.category}${store.distance ? ` - ${store.distance.toFixed(1)}km away` : ''}${store.description ? `\n${store.description}` : ''}`
    }));
    
    console.log(`Created store markers within ${searchRadius}km radius:`, markers.length);
    return markers;
  }, [stores, searchRadius]);

  const mapComponent = useMemo(() => {
    if (isLoadingLocation || isLoadingStores) {
      return (
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    console.log(`Rendering map with ${storeMarkers.length} markers within ${searchRadius}km radius`);
    
    return (
      <Map 
        key={`map-${mapKey}`}
        location={userLocation}
        markers={storeMarkers}
        searchRadius={searchRadius}
        readonly={true}
        onError={handleMapError}
        onMarkerClick={handleStoreMarkerClick}
      />
    );
  }, [isLoadingLocation, isLoadingStores, userLocation, storeMarkers, mapKey, handleMapError, handleStoreMarkerClick, searchRadius]);

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

        <LocalRetailerProducts />

        {localProducts && localProducts.length > 0 && (
          <section className="my-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                Products Near You
              </h2>
              <Button 
                variant="outline"
                onClick={() => navigate('/search')}
                className="text-sm"
              >
                View All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {localProducts.map((product) => (
                <Card 
                  key={product.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="p-4">
                    <div className="mb-3 h-40 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                      <div className="text-gray-400">Product Image</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                        <span className="text-primary font-bold">AED {product.price}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Tag className="w-3 h-3 mr-1" />
                        {product.category}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {product.description || `Quality ${product.name} available at a great price.`}
                      </p>
                      {product.retailers && (
                        <div className="mt-2 text-xs text-gray-500">
                          Sold by {product.retailers.name}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              
              {isLoadingLocalProducts && (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </section>
        )}

        <section className="my-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Stores Near You</h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Showing stores within {searchRadius}km
              </div>
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
          </div>
          
          <Card className="p-4 bg-white/80 dark:bg-gray-800/80">
            {userLocation && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Radius: {searchRadius} km</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({MIN_SEARCH_RADIUS_KM}km - {MAX_SEARCH_RADIUS_KM}km)
                  </span>
                </div>
                <Slider 
                  value={[searchRadius]}
                  min={MIN_SEARCH_RADIUS_KM}
                  max={MAX_SEARCH_RADIUS_KM}
                  step={5}
                  onValueChange={handleRadiusChange}
                  className="my-2"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Closer</span>
                  <span>Further</span>
                </div>
              </div>
            )}
            
            <div className="h-[400px] w-full">
              {mapComponent}
            </div>
            
            {storeMarkers.length === 0 && !isLoadingLocation && !isLoadingStores && (
              <div className="mt-4 text-center text-gray-600 dark:text-gray-300">
                <p>No stores found within {searchRadius}km of your location. Try updating your location or increasing the search radius.</p>
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
