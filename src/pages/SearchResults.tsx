import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/search/ProductCard";
import SearchFilters from "@/components/search/SearchFilters";
import SearchBar from "@/components/home/SearchBar";
import { useToast } from "@/components/ui/use-toast";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category");
  const { toast } = useToast();
  
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState("all");
  const [category, setCategory] = useState(categoryParam || "all");
  const [distanceRange, setDistanceRange] = useState("all");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", searchQuery, category],
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

      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (value === "all") {
      setSearchParams(params => {
        params.delete("category");
        return params;
      });
    } else {
      setSearchParams(params => {
        params.set("category", value);
        return params;
      });
    }
  };

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
    navigate(`/search?q=${searchQuery}`);
  };

  const handleSearchChange = (value: string) => {
    navigate(`/search?q=${value}`);
  };

  useEffect(() => {
    if (categoryParam) {
      setCategory(categoryParam);
    }
  }, [categoryParam]);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={null} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-6 sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 py-4">
            <SearchBar 
              userRole="customer"
              searchTerm={searchQuery}
              onSearchChange={handleSearchChange}
              onSubmit={handleSearch}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {category !== "all" 
              ? `${category} Products`
              : searchQuery 
              ? `Search Results for "${searchQuery}"`
              : "All Products"}
          </h1>
          
          <div className="mb-6">
            <SearchFilters 
              sortBy={sortBy}
              setSortBy={setSortBy}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              category={category}
              setCategory={handleCategoryChange}
              distanceRange={distanceRange}
              setDistanceRange={setDistanceRange}
            />
          </div>
        </div>

        <div className="space-y-4">
          {products && products.length > 0 ? (
            products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onContactRetailer={handleContactRetailer}
                onGetDirections={handleGetDirections}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No products found.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchResults;