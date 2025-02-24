import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";

const CATEGORIES = [
  { name: "Electronics", image: "/lovable-uploads/1bf98cbb-1c1f-446b-af92-f18c1969ee44.png" },
  { name: "Fashion", image: "/lovable-uploads/9c7c0a92-8e0a-4da2-ab91-a778342ba322.png" },
  { name: "Home & Garden", image: "/lovable-uploads/cd2fc49a-fed6-46ed-935e-b78f5ad77b00.png" },
  { name: "Sports", image: "/lovable-uploads/b3e64fee-6c53-46f8-90b9-923245bc5c55.png" },
  { name: "Books", image: "/lovable-uploads/8329be5b-30dc-4556-a352-afbcba4c2b08.png" },
  { name: "Beauty", image: "/lovable-uploads/7ea95596-4821-4572-9437-984f0a07e449.png" },
  { name: "Health", image: "/lovable-uploads/72f9d866-4935-4e69-baf1-ffc1549c4a62.png" },
  { name: "Food & Beverages", image: "/lovable-uploads/cd2fc49a-fed6-46ed-935e-b78f5ad77b00.png" },
  { name: "Automotive", image: "/lovable-uploads/b3e64fee-6c53-46f8-90b9-923245bc5c55.png" },
  { name: "Toys", image: "/lovable-uploads/8329be5b-30dc-4556-a352-afbcba4c2b08.png" },
];

const RETAILER_IMAGES = {
  "Digital Store": "/lovable-uploads/5a3d5e73-5f21-4d64-8954-5684bbd5a3bb.png",
  "Fashion Hub": "/lovable-uploads/9c7c0a92-8e0a-4da2-ab91-a778342ba322.png",
};

const DEALS_IMAGES = [
  {
    src: "/lovable-uploads/photo-1618160702438-9b02ab6515c9.jpg",
    alt: "Special offers and discounts",
    title: "Up to 50% Off"
  },
  {
    src: "/lovable-uploads/photo-1581091226825-a6a2a5aee158.jpg",
    alt: "Online exclusive deals",
    title: "Online Exclusives"
  },
  {
    src: "/lovable-uploads/photo-1486312338219-ce68d2c6f44d.jpg",
    alt: "Electronics deals",
    title: "Tech Deals"
  }
];

interface IndexProps {
  user: any;
}

const Index = ({ user }: IndexProps) => {
  const navigate = useNavigate();
  const userRole = user?.user_metadata?.role || "customer";
  const { userLocation, isLoading: isLoadingLocation } = useLocation();
  const { stores } = useStores(userLocation);

  const handleLocationReceived = (coords: { lat: number; lng: number }) => {
    localStorage.setItem('userLocation', JSON.stringify(coords));
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
          <h2 className="text-3xl font-bold mb-8 text-center">Browse Categories</h2>
          <CategoryGrid categories={CATEGORIES} onCategoryClick={handleCategoryClick} />
        </div>
        
        <section className="my-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Stores Near You</h2>
          <Card className="p-4">
            {isLoadingLocation ? (
              <div className="h-[400px] flex items-center justify-center">
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
          </Card>
        </section>

        <section className="my-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Deals & Offers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEALS_IMAGES.map((deal, index) => (
              <div 
                key={index}
                className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <img 
                  src={deal.src} 
                  alt={deal.alt}
                  className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                  <h3 className="text-lg font-semibold">{deal.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        <BestSellers />
        <RetailerGrid stores={stores} retailerImages={RETAILER_IMAGES} />
      </main>
    </div>
  );
};

export default Index;
