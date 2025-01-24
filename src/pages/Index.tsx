import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import LocationPrompt from "@/components/LocationPrompt";
import Navigation from "@/components/Navigation";
import Map from "@/components/Map";
import { useState } from "react";
import { useStores } from "@/hooks/useStores";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <LocationPrompt onLocationReceived={handleLocationReceived} />
      <Navigation user={user} />

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            {userRole === "customer" 
              ? "Find Local Products" 
              : "Manage Your Store"
            }
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            {userRole === "customer"
              ? "Connect with retailers and discover amazing products in your area"
              : "List your products and connect with local customers"
            }
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
            <Input 
              type="search" 
              placeholder={userRole === "customer" ? "Search for products..." : "Search your inventory..."}
              className="pl-10 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Button 
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              size="sm"
            >
              Search
            </Button>
          </form>
        </div>

        {/* Category Filter */}
        <div className="mb-6 max-w-xs mx-auto">
          <Select
            value={selectedCategory || "All"}
            onValueChange={(value) => setSelectedCategory(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {STORE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Map Section */}
        <div className="mt-8 mb-16">
          <div className="mb-4">
            <label htmlFor="radius" className="block text-sm font-medium text-gray-700">
              Search Radius (km)
            </label>
            <input
              type="range"
              id="radius"
              min="1"
              max="20"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-600">{searchRadius} km</span>
          </div>
          
          <Map 
            location={userLocation}
            onLocationChange={handleLocationReceived}
            readonly={false}
            searchRadius={searchRadius}
            markers={mapMarkers}
          />
          
          {stores.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Nearby Stores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stores.map((store) => (
                  <div key={store.id} className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold">{store.name}</h4>
                    <p className="text-sm text-gray-600">
                      {store.category}
                      {store.distance && ` - ${store.distance.toFixed(1)}km away`}
                    </p>
                    {store.description && (
                      <p className="text-sm text-gray-500 mt-1">{store.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {userRole === "customer" ? (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-xl font-semibold mb-4">Browse Products</h3>
                <p className="text-gray-600">
                  Browse and compare products from local retailers
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-xl font-semibold mb-4">Connect</h3>
                <p className="text-gray-600">
                  Chat with retailers and get product information
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-xl font-semibold mb-4">Shop Local</h3>
                <p className="text-gray-600">
                  Support local businesses in your community
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-xl font-semibold mb-4">Manage Products</h3>
                <p className="text-gray-600">
                  Add and update your product listings
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-xl font-semibold mb-4">Track Orders</h3>
                <p className="text-gray-600">
                  Manage customer orders and inventory
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-xl font-semibold mb-4">Analytics</h3>
                <p className="text-gray-600">
                  View sales and performance metrics
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;