import { AlertCircle, ExternalLink, Key, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FirecrawlService } from "@/services/FirecrawlService";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

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
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  
  const handleRefreshApiKey = async () => {
    setRefreshing(true);
    toast({
      title: "Refreshing API Connection",
      description: "Attempting to reconnect to the product search service..."
    });
    
    try {
      // Use the new API key
      const apiKey = "1f98c121c7mshd020b5c989dcde0p19e810jsn206cf8a3609d";
      
      // Reset quota exceeded status
      FirecrawlService.resetQuotaExceeded();
      await FirecrawlService.resetApiKeyCache();
      
      // Save the new API key
      const success = await FirecrawlService.saveApiKey(apiKey);
      
      if (success) {
        toast({
          title: "Success",
          description: "Successfully connected to the product search service. Refresh the page to see results."
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: "Connection Error",
          description: "Failed to connect to the product search service. Please try again later.",
          variant: "destructive"
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while refreshing the connection.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

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
    // Check for quota exceeded error
    if (error.includes('Monthly API quota exceeded') || error.includes('quota exceeded')) {
      return (
        <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">API Quota Issue</AlertTitle>
          <AlertDescription className="space-y-3 text-amber-700 dark:text-amber-400">
            <p>We're having trouble with the Amazon product data API quota. Let's try refreshing with a new API key.</p>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshApiKey}
                disabled={refreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Connecting...' : 'Refresh Connection'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    
    // Special handling for API key errors with more user-friendly messaging
    if (error.includes('RapidAPI credentials not initialized') || error.includes('API key')) {
      return (
        <Alert variant="destructive">
          <Key className="h-4 w-4" />
          <AlertTitle>Product Search Service Unavailable</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>We're having trouble connecting to our product search service.</p>
            <p className="text-sm">
              This is usually a temporary issue. Please try refreshing the connection or try again later.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshApiKey}
                disabled={refreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Connecting...' : 'Refresh Connection'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    
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
        <AlertTitle>No AE Amazon results</AlertTitle>
        <AlertDescription>
          No products found on AE Amazon matching your search.
        </AlertDescription>
      </Alert>
    );
  }

  // Function to convert price to AED format
  const convertToAED = (priceString: string): string => {
    // Check if the price string already contains AED
    if (priceString.includes('AED')) return priceString;
    
    // Extract numeric value from price string
    const numericValue = parseFloat(priceString.replace(/[^0-9.]/g, ''));
    
    // If not a valid number, return original price
    if (isNaN(numericValue)) return `AED 0.00`;
    
    // Assume price is in USD if not specified and convert to AED (approximation - using 3.67 AED per USD)
    const aedValue = numericValue * 3.67;
    
    // Format with AED currency
    return `AED ${aedValue.toFixed(2)}`;
  };

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
          <p className="text-xl font-bold text-primary mb-2">{convertToAED(product.price)}</p>
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
              View on AE Amazon
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
