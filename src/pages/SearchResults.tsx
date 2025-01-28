import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/search/ProductCard";
import FiltersSidebar from "@/components/search/FiltersSidebar";
import SearchFilters from "@/components/search/SearchFilters";
import { useProductFilters } from "@/hooks/useProductFilters";
import { useToast } from "@/components/ui/use-toast";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q");
  const categoryFilter = searchParams.get("category");
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

  useEffect(() => {
    if (categoryFilter) {
      setCategory(categoryFilter);
    }
  }, [categoryFilter, setCategory]);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", searchQuery, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          *,
          stores:retailer_id (
            id,
            name,
            latitude,
            longitude
          )
        `);

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      if (categoryFilter) {
        query = query.eq("category", categoryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const filteredProducts = filterProducts(products || []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={null} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {categoryFilter 
              ? `${categoryFilter} Products`
              : searchQuery 
              ? `Search Results for "${searchQuery}"`
              : "All Products"}
          </h1>
          
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FiltersSidebar onFilterChange={() => {}} />
          
          <div className="md:col-span-3">
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onContactRetailer={handleContactRetailer}
                  onGetDirections={handleGetDirections}
                />
              ))}
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No products found.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchResults;