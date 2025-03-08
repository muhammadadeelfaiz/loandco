
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
  const { stores } = useStores(userLocation);
  const { toast } = useToast();

  const handleLocationReceived = (coords: { lat: number; lng: number }) => {
    localStorage.setItem('userLocation', JSON.stringify(coords));
    console.log("Location received:", coords);
    
    // Force reload the page to update all location-dependent components
    window.location.reload();
  };

  const handleRefreshLocation = () => {
    // Clear location from localStorage
    localStorage.removeItem('userLocation');
    localStorage.removeItem('locationPrompted');
    
    // Show the location prompt again
    window.location.reload();
  };

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/search?category=${encodeURIComponent(categoryName)}`);
  };

  const handleStoreMarkerClick = (storeId: string) => {
    navigate(`/store/${storeId}`);
  };

  const storeMarkers = stores.map(store => ({
    id: store.id,
    lat: store.latitude,
    lng: store.longitude,
    title: store.name,
    description: store.description || undefined
  }));

  return (
    <div className="min-h-screen bg-gradient-loco">
      <LocationPrompt onLocationReceived={handleLocationReceived} />
      <Navigation user={user} />

      <main className="container mx-auto px-4 py-8">
        <FeaturedProducts />
        
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
              {isLoadingLocation ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Map 
                  location={userLocation}
                  markers={storeMarkers}
                  searchRadius={5}
                  readonly={true}
                />
              )}
            </div>
          </Card>
        </section>
        
        <Deals />
        
        <RetailerGrid stores={stores} retailerImages={RETAILER_IMAGES} />
      </main>
    </div>
  );
};

export default Index;
