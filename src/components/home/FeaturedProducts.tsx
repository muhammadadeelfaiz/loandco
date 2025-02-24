
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { EbayService } from "@/services/EbayService";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

// Cache key that changes every few hours
const getCacheKey = () => {
  const now = new Date();
  // Changes every 3 hours
  const timeSegment = Math.floor(now.getHours() / 3);
  const day = now.getDate();
  const month = now.getMonth();
  return `featured-products-${month}-${day}-${timeSegment}`;
};

// Random search terms to get diverse products
const SEARCH_TERMS = [
  "smartphone",
  "laptop",
  "headphones",
  "smart watch",
  "tablet",
  "camera",
  "gaming console"
];

const FeaturedProducts = () => {
  const [searchTerm] = useState(() => {
    // Pick a random search term when component mounts
    const randomIndex = Math.floor(Math.random() * SEARCH_TERMS.length);
    return SEARCH_TERMS[randomIndex];
  });

  const { data, isLoading, error } = useQuery({
    queryKey: [getCacheKey(), searchTerm],
    queryFn: async () => {
      console.log('Fetching featured eBay products for term:', searchTerm);
      const result = await EbayService.searchProducts(searchTerm);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch eBay products');
      }
      // Get 3 random products from the results
      const shuffled = [...result.data].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    },
    staleTime: 3 * 60 * 60 * 1000, // 3 hours
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[1, 2, 3].map((item) => (
          <Card 
            key={item}
            className="relative aspect-[4/3] flex items-center justify-center bg-white/90 backdrop-blur-sm"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    console.error('Error loading featured products:', error);
    // Fallback to placeholder images on error
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[1, 2, 3].map((item) => (
          <Card 
            key={item}
            className="relative aspect-[4/3] overflow-hidden bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
          >
            <img 
              src={`https://images.unsplash.com/photo-148859052850${item}-98d2b5aba04b`}
              alt={`Featured Product ${item}`}
              className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {data.map((product) => (
        <Card 
          key={product.itemId}
          className="relative aspect-[4/3] overflow-hidden bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
          onClick={() => window.open(product.url, '_blank')}
        >
          <div className="absolute inset-0 p-4 flex flex-col">
            <div className="relative flex-1 bg-gray-50 rounded-lg overflow-hidden">
              <img 
                src={product.image}
                alt={product.title}
                className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="mt-2 p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white">
              <p className="text-sm font-medium truncate">{product.title}</p>
              <p className="text-lg font-bold">{product.price.currency} {product.price.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FeaturedProducts;

