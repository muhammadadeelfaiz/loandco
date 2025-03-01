
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
  const [apiKeyInitialized, setApiKeyInitialized] = useState(false);
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

  // Initial check to see if API key is available
  useEffect(() => {
    const checkApiKey = async () => {
      const initialized = await FirecrawlService.initialize();
      setApiKeyInitialized(initialized);
      if (!initialized) {
        console.warn('RapidAPI key not initialized');
        setAmazonError('RapidAPI credentials not initialized. Please check that the RAPIDAPI_KEY secret is set in Supabase Edge Function Secrets.');
      }
    };
    
    checkApiKey();
  }, []);

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
      if (!query || !apiKeyInitialized) return;
      
      setIsLoadingAmazon(true);
      setAmazonError(undefined);
      
      try {
        console.log('Starting Amazon product search with query:', query);
        const amazonResult = await FirecrawlService.crawlAmazonProduct(query);
        
        if (amazonResult.success && amazonResult.data) {
          console.log('Amazon search successful, formatting products');
          // Ensure all Amazon products have properly formatted URLs
          const formattedProducts = amazonResult.data.map(product => ({
            ...product,
            url: product.url ? (product.url.startsWith('http') ? product.url : `https://${product.url}`) : undefined
          }));
          setAmazonProducts(formattedProducts);
        } else {
          console.error('Error from Amazon API:', amazonResult.error);
          setAmazonError(amazonResult.error || "Failed to fetch Amazon products");
          
          // Try reinitializing the API key if we get an error
          if (amazonResult.error?.includes('credentials not initialized')) {
            console.log('Attempting to reinitialize RapidAPI key...');
            await FirecrawlService.resetApiKeyCache();
            const reinitialized = await FirecrawlService.initialize();
            setApiKeyInitialized(reinitialized);
          }
        }
      } catch (error) {
        console.error('Error fetching Amazon products:', error);
        setAmazonError(error instanceof Error ? error.message : "Failed to fetch Amazon products");
      } finally {
        setIsLoadingAmazon(false);
      }
    };

    fetchAmazonProducts();
  }, [query, apiKeyInitialized]);

  return {
    products,
    isLoading,
    amazonProducts,
    amazonError,
    isLoadingAmazon,
    ebayProducts,
    isLoadingEbay,
    apiKeyInitialized
  };
};
