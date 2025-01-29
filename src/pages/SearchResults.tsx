import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/search/ProductCard";
import SearchBar from "@/components/home/SearchBar";
import SearchFilters from "@/components/search/SearchFilters";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

const SearchResults = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState("all");
  const [category, setCategory] = useState("all");
  const [distanceRange, setDistanceRange] = useState("all");
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery({
    queryKey: ["search-products", submittedQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('search_products', {
          search_term: submittedQuery
        });

      if (error) {
        console.error('Error searching products:', error);
        throw error;
      }

      return data || [];
    },
    enabled: submittedQuery.length > 0
  });

  const handleContactRetailer = (retailerName: string) => {
    toast({
      title: "Contact Information",
      description: `Contact ${retailerName} for more information.`,
    });
  };

  const handleGetDirections = (lat: number, lng: number, storeName: string) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${storeName}`,
      "_blank"
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(searchQuery);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const resetFilters = () => {
    setSortBy("default");
    setPriceRange("all");
    setCategory("all");
    setDistanceRange("all");
  };

  const filterProducts = (products: any[]) => {
    if (!products) return [];
    
    let filteredProducts = [...products];

    // Apply category filter
    if (category !== "all") {
      filteredProducts = filteredProducts.filter(
        product => product.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Apply price range filter
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      if (max) {
        filteredProducts = filteredProducts.filter(
          product => product.price >= min && product.price <= max
        );
      } else {
        // Handle cases like "1000+" where there's no upper limit
        filteredProducts = filteredProducts.filter(
          product => product.price >= min
        );
      }
    }

    // Apply sorting
    switch (sortBy) {
      case "price-asc":
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "distance":
        if (distanceRange !== "all") {
          const maxDistance = parseInt(distanceRange);
          filteredProducts = filteredProducts.filter(
            product => product.distance && product.distance <= maxDistance
          );
        }
        filteredProducts.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        break;
      case "rating":
        // If we implement ratings later, we can add sorting here
        break;
    }

    return filteredProducts;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation user={null} />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  const filteredProducts = filterProducts(products);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={null} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-6">
            <SearchBar 
              userRole="customer"
              searchTerm={searchQuery}
              onSearchChange={handleSearchChange}
              onSubmit={handleSearch}
            />
          </div>
          
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center mb-6">
            <div className="flex-1">
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
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="w-full md:w-auto"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {submittedQuery ? `Search Results for "${submittedQuery}"` : "All Products"}
          </h1>
        </div>

        <div className="space-y-4">
          {filteredProducts && filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  retailer_name: product.retailer_name,
                  store_latitude: null,
                  store_longitude: null
                }}
                onContactRetailer={handleContactRetailer}
                onGetDirections={handleGetDirections}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {submittedQuery ? "No products found matching your search." : "Start searching to see products."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchResults;