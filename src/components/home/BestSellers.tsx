
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { EbayService } from "@/services/EbayService";
import { FirecrawlService } from "@/services/FirecrawlService";
import { Loader2 } from "lucide-react";

// Popular categories for best sellers
const BEST_SELLER_TERMS = [
  "best selling electronics",
  "top rated phone",
  "popular laptop",
  "trending gadgets"
];

// Function to convert price to AED
const convertToAED = (price: string): string => {
  // Check if the price string already contains AED
  if (price.includes('AED')) return price;
  
  // Handle price strings in different formats
  let currencyValue: string = 'USD';
  let numericValue: number = 0;
  
  // Extract currency and number from string like "USD 15.99"
  const currencyMatch = price.match(/^([A-Z]{3})\s+(\d+(\.\d+)?)$/);
  if (currencyMatch) {
    currencyValue = currencyMatch[1];
    numericValue = parseFloat(currencyMatch[2]);
  } else {
    // Try to extract just the number for cases where no currency is specified
    const numericMatch = price.replace(/[^0-9.]/g, '');
    numericValue = parseFloat(numericMatch);
  }
  
  // Return original string if we couldn't parse it
  if (isNaN(numericValue)) return `AED 0.00`;
  
  // Set conversion rate based on currency
  let rate = 3.67; // Default USD to AED rate
  
  switch(currencyValue) {
    case 'EUR': 
      rate = 4.06;
      break;
    case 'GBP':
      rate = 4.73;
      break;
    case 'JPY':
      rate = 0.025;
      break;
    case 'CAD':
      rate = 2.73;
      break;
    case 'AUD':
      rate = 2.45;
      break;
    case 'CHF':
      rate = 4.20;
      break;
    case 'AED':
      rate = 1;
      break;
    // USD or any other currency - use default rate
  }
  
  // Convert to AED
  const aedValue = numericValue * rate;
  return `AED ${aedValue.toFixed(2)}`;
};

const BestSellers = () => {
  const searchTerm = BEST_SELLER_TERMS[Math.floor(Math.random() * BEST_SELLER_TERMS.length)];

  const { data: ebayProducts, isLoading: isLoadingEbay } = useQuery({
    queryKey: ['ebay-best-sellers', searchTerm],
    queryFn: async () => {
      const result = await EbayService.searchProducts(searchTerm);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch eBay best sellers');
      }
      return result.data.slice(0, 2); // Get 2 products from eBay
    },
    staleTime: 3 * 60 * 60 * 1000, // 3 hours
    refetchOnWindowFocus: false,
  });

  const { data: amazonProducts, isLoading: isLoadingAmazon } = useQuery({
    queryKey: ['amazon-best-sellers', searchTerm],
    queryFn: async () => {
      return FirecrawlService.getAmazonProductsForHomepage(searchTerm);
    },
    staleTime: 3 * 60 * 60 * 1000, // 3 hours
    refetchOnWindowFocus: false,
  });

  const isLoading = isLoadingEbay || isLoadingAmazon;

  // Combine products from both sources
  const combinedProducts = () => {
    const products = [];
    
    // Add eBay products
    if (ebayProducts && ebayProducts.length > 0) {
      products.push(...ebayProducts.slice(0, 2).map(product => ({
        id: product.itemId,
        title: product.title,
        price: convertToAED(`${product.price.currency} ${product.price.value}`),
        image: product.image,
        url: product.url,
        source: 'eBay'
      })));
    }
    
    // Add Amazon products
    if (amazonProducts && amazonProducts.length > 0) {
      products.push(...amazonProducts.slice(0, 2).map(product => ({
        id: Math.random().toString(36).substring(2, 11),
        title: product.title,
        price: convertToAED(product.price),
        image: product.image,
        url: product.url || '',
        source: 'Amazon'
      })));
    }
    
    // Shuffle products
    return products.sort(() => 0.5 - Math.random()).slice(0, 4);
  };

  if (isLoading) {
    return (
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Best Sellers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <Card 
              key={item} 
              className="aspect-[3/4] flex items-center justify-center"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
          ))}
        </div>
      </section>
    );
  }

  const products = combinedProducts();
  
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Best Sellers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card 
            key={product.id}
            className="aspect-[3/4] overflow-hidden bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
            onClick={() => window.open(product.url, '_blank')}
          >
            <div className="relative h-full p-4 flex flex-col">
              <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden mb-4 relative">
                <img 
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs py-1 px-2 rounded-full">
                  {product.source}
                </div>
              </div>
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
                <p className="text-sm font-medium line-clamp-2 mb-2">{product.title}</p>
                <p className="text-lg font-bold">{product.price}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default BestSellers;
