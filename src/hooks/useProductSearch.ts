
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
  const [ebayProducts, setEbayProducts] = useState<EbayProduct[]>([]);
  const [isLoadingAmazon, setIsLoadingAmazon] = useState(false);
  const [isLoadingEbay, setIsLoadingEbay] = useState(false);
  const { toast } = useToast();

  // Fetch local products
  const { data: products, isLoading } = useQuery({
    queryKey: ["search-products", query, category],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_products', {
        search_term: query,
        category_filter: category === 'all' ? null : category
      });
      if (error) throw error;
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
      try {
        const amazonResult = await FirecrawlService.crawlAmazonProduct(query);
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
  }, [query, toast]);

  return {
    products,
    isLoading,
    amazonProducts,
    isLoadingAmazon,
    ebayProducts,
    isLoadingEbay
  };
};
