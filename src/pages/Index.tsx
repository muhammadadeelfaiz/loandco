import { useNavigate } from "react-router-dom";
import { useState } from "react";
import LocationPrompt from "@/components/LocationPrompt";
import Navigation from "@/components/Navigation";
import Map from "@/components/Map";
import { useStores } from "@/hooks/useStores";
import SearchBar from "@/components/home/SearchBar";
import CategoryFilter from "@/components/home/CategoryFilter";
import StoreList from "@/components/home/StoreList";
import FeatureCards from "@/components/home/FeatureCards";

const STORE_CATEGORIES = [
  "All",
  "Grocery",
  "Electronics",
  "Clothing",
  "Hardware"
];

const Index = ({ user }) => {
  const navigate = useNavigate();
  const userRole = user?.user_metadata?.role || "customer";
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  const { stores } = useStores(userLocation, selectedCategory === "All" ? null : selectedCategory);

  const handleLocationReceived = (coords: { lat: number; lng: number }) => {
    setUserLocation(coords);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const mapMarkers = stores.map(store => ({
    id: store.id,
    lat: store.latitude,
    lng: store.longitude,
    title: store.name,
    description: `${store.category} - ${store.distance ? `${store.distance.toFixed(1)}km away` : 'Distance unknown'}`
  }));

  return (
    <div>
      <LocationPrompt onLocationReceived={handleLocationReceived} />
      <Navigation user={user} />

      <div className="min-h-[calc(100vh-73px)] dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 bg-gradient-to-br from-blue-50/50 to-white">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-16 max-w-7xl">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-3 md:mb-4">
              {userRole === "customer" 
                ? "Find Local Products" 
                : "Manage Your Store"
              }
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6 md:mb-8">
              {userRole === "customer"
                ? "Connect with retailers and discover amazing products in your area"
                : "List your products and connect with local customers"
              }
            </p>
            
            <SearchBar 
              userRole={userRole}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSubmit={handleSearch}
            />
          </div>

          <CategoryFilter 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={STORE_CATEGORIES}
          />

          <div className="mt-6 md:mt-8 mb-12 md:mb-16">
            <div className="mb-4">
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Radius (km)
              </label>
              <input
                type="range"
                id="radius"
                min="1"
                max="20"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full h-2 bg-blue-200 dark:bg-blue-900 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{searchRadius} km</span>
            </div>
            
            <Map 
              location={userLocation}
              onLocationChange={handleLocationReceived}
              readonly={false}
              searchRadius={searchRadius}
              markers={mapMarkers}
            />
            
            <StoreList stores={stores} />
          </div>

          <FeatureCards userRole={userRole} />
        </div>
      </div>
    </div>
  );
};

export default Index;