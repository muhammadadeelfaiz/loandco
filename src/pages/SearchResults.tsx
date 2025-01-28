import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/search/ProductCard";
import FiltersSidebar from "@/components/search/FiltersSidebar";
import SearchBar from "@/components/home/SearchBar";
import { useToast } from "@/components/ui/use-toast";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category");
  const { toast } = useToast();
  
  const [activeFilters, setActiveFilters] = useState({
    categories: new Set<string>(categoryParam ? [categoryParam] : []),
    conditions: new Set<string>(),
    priceRange: [0, 1000],
    priceBrackets: new Set<string>(),
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", searchQuery, categoryParam],
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

      if (categoryParam) {
        query = query.eq("category", categoryParam);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const handleFilterChange = (type: string, value: any) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      
      switch (type) {
        case "category":
          const categories = new Set(prev.categories);
          if (value.checked) {
            categories.clear(); // Clear other categories
            categories.add(value.value);
            setSearchParams(params => {
              params.set("category", value.value);
              return params;
            });
          } else {
            categories.delete(value.value);
            setSearchParams(params => {
              params.delete("category");
              return params;
            });
          }
          newFilters.categories = categories;
          break;
        
        case "condition":
          const conditions = new Set(prev.conditions);
          if (value.checked) {
            conditions.add(value.value);
          } else {
            conditions.delete(value.value);
          }
          newFilters.conditions = conditions;
          break;
        
        case "price":
          newFilters.priceRange = value;
          break;
        
        case "priceRange":
          const priceBrackets = new Set(prev.priceBrackets);
          if (value.checked) {
            priceBrackets.add(value.value);
          } else {
            priceBrackets.delete(value.value);
          }
          newFilters.priceBrackets = priceBrackets;
          break;
      }
      
      return newFilters;
    });
  };

  const handleResetFilters = () => {
    setActiveFilters({
      categories: new Set<string>(),
      conditions: new Set<string>(),
      priceRange: [0, 1000],
      priceBrackets: new Set<string>(),
    });
    setSearchParams(params => {
      params.delete("category");
      return params;
    });
  };

  const filterProducts = (products: any[]) => {
    return products.filter(product => {
      if (activeFilters.categories.size > 0 && !activeFilters.categories.has(product.category)) {
        return false;
      }

      if (product.price < activeFilters.priceRange[0] || product.price > activeFilters.priceRange[1]) {
        return false;
      }

      if (activeFilters.priceBrackets.size > 0) {
        const price = product.price;
        let matchesBracket = false;
        
        activeFilters.priceBrackets.forEach(bracket => {
          const [min, max] = bracket.split('-').map(v => v === 'Over' ? Infinity : Number(v.replace(/[^0-9]/g, '')));
          if (price >= min && (max === Infinity || price <= max)) {
            matchesBracket = true;
          }
        });

        if (!matchesBracket) return false;
      }

      return true;
    });
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
      setActiveFilters(prev => ({
        ...prev,
        categories: new Set([categoryParam])
      }));
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

  const filteredProducts = filterProducts(products || []);

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
            {categoryParam 
              ? `${categoryParam} Products`
              : searchQuery 
              ? `Search Results for "${searchQuery}"`
              : "All Products"}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="md:sticky md:top-24 h-fit transition-all duration-300 ease-in-out">
            <FiltersSidebar 
              onFilterChange={handleFilterChange} 
              onReset={handleResetFilters}
              activeFilters={activeFilters}
            />
          </aside>
          
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