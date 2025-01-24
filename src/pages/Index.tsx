import { useNavigate } from "react-router-dom";
import { useState } from "react";
import LocationPrompt from "@/components/LocationPrompt";
import Navigation from "@/components/Navigation";
import { useStores } from "@/hooks/useStores";
import SearchBar from "@/components/home/SearchBar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const CATEGORIES = [
  { name: "Tablets", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158" },
  { name: "Mobiles", image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b" },
  { name: "Laptops", image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625" },
  { name: "Clothes", image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9" },
  { name: "Watches", image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625" },
  { name: "Footwear", image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9" },
  { name: "Toys", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158" },
];

const Index = ({ user }) => {
  const navigate = useNavigate();
  const userRole = user?.user_metadata?.role || "customer";
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { stores } = useStores(userLocation);

  const handleLocationReceived = (coords: { lat: number; lng: number }) => {
    setUserLocation(coords);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-loco">
      <LocationPrompt onLocationReceived={handleLocationReceived} />
      <Navigation user={user} />

      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-12">
          <SearchBar 
            userRole={userRole}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSubmit={handleSearch}
          />
        </div>

        {/* Featured Products */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map((item) => (
            <Card 
              key={item}
              className="aspect-[16/9] overflow-hidden bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
            >
              <img 
                src={`https://images.unsplash.com/photo-148859052850${item}-98d2b5aba04b`}
                alt={`Featured Product ${item}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </Card>
          ))}
        </div>

        {/* Popular Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-white">Popular categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
            {CATEGORIES.map((category) => (
              <div 
                key={category.name}
                className="group cursor-pointer"
                onClick={() => navigate(`/search?category=${category.name.toLowerCase()}`)}
              >
                <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-sm text-center text-white/80 group-hover:text-white transition-colors">
                  {category.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Best Sellers */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-white">Best sellers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <Card 
                key={item} 
                className="aspect-[3/4] bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <div className="p-4 h-full flex items-center justify-center text-secondary group-hover:text-accent transition-colors">
                  Coming Soon
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Top Retailers */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-white">Top retailers in your area</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-6">
            {stores.slice(0, 7).map((store) => (
              <div 
                key={store.id} 
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <Avatar className="w-20 h-20 border-2 border-white/20 shadow-lg group-hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl">
                    {store.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-center line-clamp-2 text-white/80 group-hover:text-white transition-colors">
                  {store.name}
                </span>
                {store.distance && (
                  <span className="text-xs text-white/60">
                    {store.distance.toFixed(1)}km away
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;