
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import SearchFilters from "@/components/search/SearchFilters";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { FirecrawlService } from "@/services/FirecrawlService";
import { EbayService } from "@/services/EbayService";
import { LocalProducts } from "@/components/search/LocalProducts";
import { EbayProducts } from "@/components/search/EbayProducts";
import { AmazonProducts } from "@/components/search/AmazonProducts";

type ProductWithRetailer = Database['public']['Tables']['products']['Row'] & {
  retailer_name?: string;
  distance?: number;
};

interface AmazonProduct {
  title: string;
  price: string;
  rating: string;
  reviews: string;
  image: string;
}

interface EbayProduct {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  image: string;
  condition: string;
  location: string;
  url: string;
}

const SearchResults = () => {
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState("all");
  const [category, setCategory] = useState("all");
  const [distanceRange, setDistanceRange] = useState("all");
  const [isLoadingAmazon, setIsLoadingAmazon] = useState(false);
  const [isLoadingEbay, setIsLoadingEbay] = useState(false);
  const [amazonProducts, setAmazonProducts] = useState<AmazonProduct[]>([]);
  const [ebayProducts, setEbayProducts] = useState<EbayProduct[]>([]);
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const submittedQuery = searchParams.get('q') || '';
  const categoryFromUrl = searchParams.get('category');

  useEffect(() => {
    if (categoryFromUrl) {
      setCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  // Fetch local products
  const { data: products, isLoading } = useQuery({
    queryKey: ["search-products", submittedQuery, category],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_products', {
        search_term: submittedQuery,
        category_filter: category === 'all' ? null : category
      });
      if (error) throw error;
      return data as ProductWithRetailer[];
    },
  });

  // Fetch eBay products when query or category changes
  useEffect(() => {
    const fetchEbayProducts = async () => {
      setIsLoadingEbay(true);
      try {
        const searchQuery = category === 'all' ? submittedQuery : `${submittedQuery} ${category}`.trim();
        if (searchQuery) {
          const ebayResult = await EbayService.searchProducts(searchQuery);
          if (ebayResult.success && ebayResult.data) {
            setEbayProducts(ebayResult.data);
          }
        }
      } catch (error) {
        console.error('Error fetching eBay products:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch eBay products"
        });
      } finally {
        setIsLoadingEbay(false);
      }
    };

    fetchEbayProducts();
  }, [submittedQuery, category, toast]);

  // Fetch Amazon products
  useEffect(() => {
    const fetchAmazonProducts = async () => {
      if (!submittedQuery) return;
      
      setIsLoadingAmazon(true);
      try {
        const amazonResult = await FirecrawlService.crawlAmazonProduct(submittedQuery);
        if (amazonResult.success && amazonResult.data) {
          setAmazonProducts(amazonResult.data);
        }
      } catch (error) {
        console.error('Error fetching Amazon products:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch Amazon products"
        });
      } finally {
        setIsLoadingAmazon(false);
      }
    };

    fetchAmazonProducts();
  }, [submittedQuery, toast]);

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

  const resetFilters = () => {
    setSortBy("default");
    setPriceRange("all");
    setCategory("all");
    setDistanceRange("all");
  };

  const filterAndSortProducts = (items: any[], type: 'local' | 'ebay') => {
    if (!items) return [];
    
    let filteredItems = [...items];

    // Apply price range filter
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      filteredItems = filteredItems.filter(item => {
        const price = type === 'local' ? item.price : parseFloat(item.price.value);
        if (max) {
          return price >= min && price <= max;
        }
        return price >= min;
      });
    }

    // Apply sorting
    filteredItems.sort((a, b) => {
      const priceA = type === 'local' ? a.price : parseFloat(a.price.value);
      const priceB = type === 'local' ? b.price : parseFloat(b.price.value);
      const nameA = type === 'local' ? a.name : a.title;
      const nameB = type === 'local' ? b.name : b.title;

      switch (sortBy) {
        case "price-asc":
          return priceA - priceB;
        case "price-desc":
          return priceB - priceA;
        case "name-asc":
          return nameA.localeCompare(nameB);
        case "name-desc":
          return nameB.localeCompare(nameA);
        case "distance":
          if (type === 'local') {
            const distA = a.distance ?? Infinity;
            const distB = b.distance ?? Infinity;
            return distA - distB;
          }
          return 0;
        default:
          return 0;
      }
    });

    // Apply distance filter for local products
    if (type === 'local' && distanceRange !== "all") {
      const maxDistance = parseInt(distanceRange);
      filteredItems = filteredItems.filter(
        item => typeof item.distance === 'number' && item.distance <= maxDistance
      );
    }

    return filteredItems;
  };

  const filteredLocalProducts = filterAndSortProducts(products, 'local');
  const filteredEbayProducts = filterAndSortProducts(ebayProducts, 'ebay');

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
            {submittedQuery 
              ? `Search Results for "${submittedQuery}"${category !== 'all' ? ` in ${category}` : ''}`
              : category !== 'all' 
                ? `Browsing ${category}`
                : "All Products"
            }
          </h1>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Local Stores</h2>
            <LocalProducts
              products={filteredLocalProducts}
              isLoading={isLoading}
              onContactRetailer={handleContactRetailer}
              onGetDirections={handleGetDirections}
            />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">eBay Products</h2>
            <EbayProducts 
              products={filteredEbayProducts}
              isLoading={isLoadingEbay}
            />
          </section>

          {submittedQuery && (
            <section>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Amazon Products</h2>
              <AmazonProducts 
                products={amazonProducts}
                isLoading={isLoadingAmazon}
              />
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchResults;
