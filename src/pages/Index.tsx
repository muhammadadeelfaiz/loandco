
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import LocationPrompt from "@/components/LocationPrompt";
import Navigation from "@/components/Navigation";
import { useStores } from "@/hooks/useStores";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import CategoryGrid from "@/components/home/CategoryGrid";
import BestSellers from "@/components/home/BestSellers";
import RetailerGrid from "@/components/home/RetailerGrid";
import Map from "@/components/Map";
import { Card } from "@/components/ui/card";

const CATEGORIES = [
  { name: "Tablets", image: "/lovable-uploads/1bf98cbb-1c1f-446b-af92-f18c1969ee44.png" },
  { name: "Mobiles", image: "/lovable-uploads/be208822-034e-4099-aad8-47621d7c713e.png" },
  { name: "Laptops", image: "/lovable-uploads/8329be5b-30dc-4556-a352-afbcba4c2b08.png" },
  { name: "Clothes", image: "/lovable-uploads/9c7c0a92-8e0a-4da2-ab91-a778342ba322.png" },
  { name: "Watches", image: "/lovable-uploads/7ea95596-4821-4572-9437-984f0a07e449.png" },
  { name: "Footwear", image: "/lovable-uploads/72f9d866-4935-4e69-baf1-ffc1549c4a62.png" },
  { name: "Toys", image: "/lovable-uploads/6766b6ef-3ac2-4559-bf7e-d8fecd971b72.png" },
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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { stores } = useStores(userLocation);

  const handleLocationReceived = (coords: { lat: number; lng: number }) => {
    setUserLocation(coords);
  };

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/search?category=${encodeURIComponent(categoryName)}`);
  };

  const handleStoreMarkerClick = (storeId: string) => {
    navigate(`/store/${storeId}`);
  };

  // Convert stores to map markers
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
        <CategoryGrid categories={CATEGORIES} onCategoryClick={handleCategoryClick} />
        
        {/* Nearby Stores Map Section */}
        <section className="my-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Stores Near You</h2>
          <Card className="p-4">
            <Map 
              location={userLocation}
              markers={storeMarkers}
              searchRadius={5}
              readonly={true}
            />
          </Card>
        </section>

        {/* Deals Section */}
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
