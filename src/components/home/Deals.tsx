
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { EbayService } from "@/services/EbayService";
import { FirecrawlService } from "@/services/FirecrawlService";
import { Loader2 } from "lucide-react";

// Deals-focused search terms
const DEALS_TERMS = [
  "clearance electronics",
  "sale laptop",
  "discount headphones",
  "special offer phone",
  "deal camera"
];

const Deals = () => {
  const searchTerm = DEALS_TERMS[Math.floor(Math.random() * DEALS_TERMS.length)];

  const { data: ebayProducts, isLoading: isLoadingEbay } = useQuery({
    queryKey: ['ebay-deals', searchTerm],
    queryFn: async () => {
      const result = await EbayService.searchProducts(searchTerm);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch eBay deals');
      }
      return result.data.slice(0, 2);
    },
    staleTime: 3 * 60 * 60 * 1000, // 3 hours
    refetchOnWindowFocus: false,
  });

  const { data: amazonProducts, isLoading: isLoadingAmazon } = useQuery({
    queryKey: ['amazon-deals', searchTerm],
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
        price: `${product.price.currency} ${product.price.value}`,
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
        price: product.price,
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
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Special Deals</h2>
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
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Special Deals</h2>
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

export default Deals;
