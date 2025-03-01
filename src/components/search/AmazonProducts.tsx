
import { AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface AmazonProduct {
  title: string;
  price: string;
  rating: string;
  reviews: string;
  image: string;
  url?: string;
}

interface AmazonProductsProps {
  products: AmazonProduct[];
  isLoading: boolean;
  error?: string;
}

export const AmazonProducts = ({ products, isLoading, error }: AmazonProductsProps) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading Amazon products</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (products.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Amazon results</AlertTitle>
        <AlertDescription>
          No products found on Amazon matching your search.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200">
          <div className="relative h-48 mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
            <img 
              src={product.image} 
              alt={product.title}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
            {product.title}
          </h3>
          <p className="text-xl font-bold text-primary mb-2">{product.price}</p>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
            <span>Rating: {product.rating}</span>
            <span>•</span>
            <span>{product.reviews} reviews</span>
          </div>
          {product.url && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={() => {
                // Ensure URL has proper format before opening
                let url = product.url;
                if (url && !url.startsWith('http')) {
                  url = `https://${url}`;
                }
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Amazon
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
