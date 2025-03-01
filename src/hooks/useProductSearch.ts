
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { FirecrawlService } from "@/services/FirecrawlService";
import { EbayService } from "@/services/EbayService";
import { useToast } from "@/components/ui/use-toast";

interface AmazonProduct {
  title: string;
  price: string;
  rating: string;
  reviews: string;
  image: string;
  url?: string;
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

export const useProductSearch = (query: string, category: string) => {
  const [amazonProducts, setAmazonProducts] = useState<AmazonProduct[]>([]);
  const [amazonError, setAmazonError] = useState<string | undefined>(undefined);
  const [ebayProducts, setEbayProducts] = useState<EbayProduct[]>([]);
  const [isLoadingAmazon, setIsLoadingAmazon] = useState(false);
  const [isLoadingEbay, setIsLoadingEbay] = useState(false);
  const { toast } = useToast();

  // Fetch local products with category filter
  const { data: products, isLoading } = useQuery({
    queryKey: ["search-products", query, category],
    queryFn: async () => {
      console.log('Fetching products with query:', query, 'and category:', category);
      const categoryFilter = category === 'all' ? null : category;
      const { data, error } = await supabase.rpc('search_products', {
        search_term: query,
        category_filter: categoryFilter
      });
      
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      console.log('Fetched products:', data);
      return data;
    },
  });

  // Fetch eBay products
  useEffect(() => {
    const fetchEbayProducts = async () => {
      setIsLoadingEbay(true);
      try {
        const searchQuery = category === 'all' ? query : `${query} ${category}`.trim();
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
  }, [query, category, toast]);

  // Fetch Amazon products
  useEffect(() => {
    const fetchAmazonProducts = async () => {
      if (!query) return;
      
      setIsLoadingAmazon(true);
      setAmazonError(undefined);
      
      try {
        const amazonResult = await FirecrawlService.crawlAmazonProduct(query);
        if (amazonResult.success && amazonResult.data) {
          setAmazonProducts(amazonResult.data);
        } else {
          console.error('Error from Amazon API:', amazonResult.error);
          setAmazonError(amazonResult.error || "Failed to fetch Amazon products");
        }
      } catch (error) {
        console.error('Error fetching Amazon products:', error);
        setAmazonError(error instanceof Error ? error.message : "Failed to fetch Amazon products");
      } finally {
        setIsLoadingAmazon(false);
      }
    };

    fetchAmazonProducts();
  }, [query]);

  return {
    products,
    isLoading,
    amazonProducts,
    amazonError,
    isLoadingAmazon,
    ebayProducts,
    isLoadingEbay
  };
};
