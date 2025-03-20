
import React, { useState } from "react";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Footer } from "@/components/ui/Footer"; // Corrected import path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import CategoryGrid from "@/components/home/CategoryGrid";
import FeatureCards from "@/components/home/FeatureCards";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Deals from "@/components/home/Deals";
import ChatHomeSection from "@/components/home/ChatHomeSection";
import SearchBar from "@/components/home/SearchBar";
import LocalRetailerProducts from "@/components/home/LocalRetailerProducts";

interface HomeProps {
  user: User | null;
}

// Sample categories data for CategoryGrid
const categories = [
  { name: "Electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
  { name: "Clothing", image: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
  { name: "Home & Garden", image: "https://images.unsplash.com/photo-1501127122-f385ca6ddd9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
  { name: "Sports", image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
  { name: "Beauty", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
  { name: "Food", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" }
];

const Index = ({ user }: HomeProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Handler for category click
  const handleCategoryClick = (category: string) => {
    navigate(`/search?q=${encodeURIComponent(category)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden mb-16">
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 md:p-12 shadow-lg">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Find Local Products & Compare Prices
              </h1>
              <p className="text-white/90 text-lg mb-8">
                Discover products from local retailers and compare with online marketplaces
              </p>
              
              <SearchBar 
                userRole={user?.user_metadata?.role || 'customer'}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSubmit={handleSearch}
              />
              
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm text-white/80">
                <span>Popular:</span>
                {["Electronics", "Clothing", "Home", "Sports"].map((term) => (
                  <button
                    key={term}
                    className="hover:text-white hover:underline"
                    onClick={() => navigate(`/search?q=${term}`)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <CategoryGrid 
          categories={categories} 
          onCategoryClick={handleCategoryClick}
        />

        {/* Local Retailer Products */}
        <LocalRetailerProducts />

        {/* Features */}
        <FeatureCards userRole={user?.user_metadata?.role || 'customer'} />

        {/* Featured Products */}
        <FeaturedProducts />

        {/* Deals Section */}
        <Deals />
        
        {/* Featured Retailers */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Featured Local Retailers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Tech Haven",
                description: "Specializing in the latest electronics and gadgets",
                image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1"
              },
              {
                name: "Green Grocers",
                description: "Fresh, local produce and organic foods",
                image: "https://images.unsplash.com/photo-1542838132-92c53300491e"
              },
              {
                name: "Crafty Corner",
                description: "Handmade crafts and artisanal products",
                image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da"
              }
            ].map((retailer, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src={retailer.image} 
                    alt={retailer.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{retailer.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {retailer.description}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/search?q=${retailer.name}`)}
                  >
                    View Products
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Chat Section */}
        <ChatHomeSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
