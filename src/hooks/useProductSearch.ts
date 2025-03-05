
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

  useEffect(() => {
    const checkApiKey = async () => {
      // Ensure we start with a fresh state
      await FirecrawlService.resetApiKeyCache();
      
      // Attempt to initialize the service with the stored API key
      const initialized = await FirecrawlService.initialize();
      console.log("API key initialization check result:", initialized);
      setApiKeyInitialized(initialized);
      
      if (!initialized) {
        console.warn('Product search service not initialized');
        setAmazonError('Unable to connect to the product search service. Please try refreshing the connection.');
        toast({
          title: "Connection Issue",
          description: "We're having trouble connecting to our product search service.",
          variant: "destructive"
        });
      } else {
        console.log('Product search service successfully initialized');
        toast({
          title: "Search Ready",
          description: "Connected to all product search services.",
        });
      }
    };
    
    checkApiKey();
  }, [toast]);

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

  useEffect(() => {
    const fetchAmazonProducts = async () => {
      if (!query || !apiKeyInitialized) return;
      
      setIsLoadingAmazon(true);
      setAmazonError(undefined);
      
      try {
        console.log('Starting Amazon product search with query:', query, 'API key initialized:', apiKeyInitialized);
        const amazonResult = await FirecrawlService.crawlAmazonProduct(query);
        
        if (amazonResult.success && amazonResult.data) {
          console.log('Amazon search successful, formatting products');
          const formattedProducts = amazonResult.data.map(product => ({
            ...product,
            url: product.url ? (product.url.startsWith('http') ? product.url : `https://www.amazon.ae${product.url}`) : undefined
          }));
          setAmazonProducts(formattedProducts);
        } else {
          console.error('Error from Amazon API:', amazonResult.error);
          setAmazonError(amazonResult.error || "Failed to fetch Amazon products");
          
          if (amazonResult.error?.includes('credentials not initialized')) {
            console.log('Attempting to reconnect to product search service...');
            await FirecrawlService.resetApiKeyCache();
            const reinitialized = await FirecrawlService.initialize();
            setApiKeyInitialized(reinitialized);
            
            if (reinitialized) {
              toast({
                title: "Connection Restored",
                description: "Product search service reconnected. Try searching again.",
              });
            }
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
  }, [query, apiKeyInitialized, toast]);

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
