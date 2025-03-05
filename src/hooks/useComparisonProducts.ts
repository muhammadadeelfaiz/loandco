
import { useState, useEffect } from 'react';
import { FirecrawlService } from '@/services/FirecrawlService';
import { EbayService } from '@/services/EbayService';

interface ComparisonProduct {
  id: string;
  name: string;
  price: string | number;
  source: 'local' | 'amazon' | 'ebay';
  imageUrl?: string;
  url?: string;
  retailer?: string;
}

export function useComparisonProducts(productName: string, productCategory: string) {
  const [amazonProducts, setAmazonProducts] = useState<ComparisonProduct[]>([]);
  const [ebayProducts, setEbayProducts] = useState<ComparisonProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExternalProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create a search query based on product name and category
        const searchQuery = `${productName} ${productCategory}`.trim();
        
        // Fetch Amazon products
        const amazonResult = await FirecrawlService.crawlAmazonProduct(searchQuery);
        if (amazonResult.success && amazonResult.data) {
          // Format Amazon products for comparison
          const formattedAmazonProducts = amazonResult.data.map(product => ({
            id: `amazon-${product.title.substring(0, 10)}`,
            name: product.title,
            price: product.price,
            source: 'amazon' as const,
            imageUrl: product.image,
            url: product.url || `https://www.amazon.ae/s?k=${encodeURIComponent(searchQuery)}`,
            retailer: 'Amazon.ae'
          })).slice(0, 5); // Limit to 5 products
          
          setAmazonProducts(formattedAmazonProducts);
        } else if (amazonResult.error) {
          console.error('Amazon API error:', amazonResult.error);
        }
        
        // Fetch eBay products
        const ebayResult = await EbayService.searchProducts(searchQuery);
        if (ebayResult.success && ebayResult.data) {
          // Format eBay products for comparison
          const formattedEbayProducts = ebayResult.data.map(product => ({
            id: product.itemId,
            name: product.title,
            price: `${product.price.currency} ${product.price.value}`,
            source: 'ebay' as const,
            imageUrl: product.image,
            url: product.url,
            retailer: 'eBay'
          })).slice(0, 5); // Limit to 5 products
          
          setEbayProducts(formattedEbayProducts);
        } else if (ebayResult.error) {
          console.error('eBay API error:', ebayResult.error);
        }
      } catch (err) {
        console.error('Error fetching comparison products:', err);
        setError('Failed to fetch comparison products');
      } finally {
        setIsLoading(false);
      }
    };

    if (productName) {
      fetchExternalProducts();
    }
    
  }, [productName, productCategory]);

  return {
    amazonProducts,
    ebayProducts,
    isLoading,
    error
  };
}
