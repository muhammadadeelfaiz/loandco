import { useState } from "react";
import SearchBar from "@/components/home/SearchBar";
import SearchFilters from "@/components/search/SearchFilters";
import ProductCard from "@/components/search/ProductCard";
import FiltersSidebar from "@/components/search/FiltersSidebar";
import { useLocation } from "@/hooks/useLocation";
import { useProductFilters } from "@/hooks/useProductFilters";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";

const SearchResults = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const userLocation = useLocation();
  const { toast } = useToast();
  const {
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    category,
    setCategory,
    distanceRange,
    setDistanceRange,
    filterProducts,
  } = useProductFilters();

  const { data: searchResults } = useQuery({
    queryKey: ["search-products", searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_products", {
        search_term: searchTerm,
      });
      if (error) throw error;
      return data;
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search logic
  };

  const handleContactRetailer = (retailerName: string) => {
    toast({
      title: "Contact Request Sent",
      description: `Your message has been sent to ${retailerName}`,
    });
  };

  const handleGetDirections = (lat: number, lng: number, storeName: string) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank"
    );
  };

  const handleFilterChange = (type: string, value: any) => {
    // Implement filter logic
    console.log("Filter changed:", type, value);
  };

  const filteredProducts = searchResults
    ? filterProducts(searchResults)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={{ user_metadata: { role: "customer" } }} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <SearchBar
            userRole="customer"
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSubmit={handleSearchSubmit}
          />
        </div>

        <div className="flex gap-8">
          <FiltersSidebar onFilterChange={handleFilterChange} />
          
          <div className="flex-1">
            <div className="mb-6">
              <SearchFilters
                sortBy={sortBy}
                setSortBy={setSortBy}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                category={category}
                setCategory={setCategory}
                distanceRange={distanceRange}
                setDistanceRange={setDistanceRange}
              />
            </div>

            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onContactRetailer={handleContactRetailer}
                  onGetDirections={handleGetDirections}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;