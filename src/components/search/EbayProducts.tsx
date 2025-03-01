import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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

interface EbayProductsProps {
  products: EbayProduct[];
  isLoading: boolean;
}

export const EbayProducts = ({ products, isLoading }: EbayProductsProps) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No eBay results</AlertTitle>
        <AlertDescription>
          No products found on eBay matching your search.
        </AlertDescription>
      </Alert>
    );
  }

  // Function to convert price to AED
  const convertToAED = (value: string, currency: string): string => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return `${currency} ${value}`;
    
    let rate = 3.67; // Default USD to AED rate
    
    // Adjust rate based on currency
    switch(currency) {
      case 'USD':
        rate = 3.67;
        break;
      case 'EUR':
        rate = 4.06;
        break;
      case 'GBP':
        rate = 4.73;
        break;
      // Add more currencies as needed
      default:
        // Use USD rate for unknown currencies
        rate = 3.67;
    }
    
    const aedValue = numericValue * rate;
    return `AED ${aedValue.toFixed(2)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div key={product.itemId} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <img 
            src={product.image} 
            alt={product.title}
            className="w-full h-48 object-contain mb-4"
          />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {product.title}
          </h3>
          <p className="text-xl font-bold text-primary mb-2">
            {convertToAED(product.price.value, product.price.currency)}
            <span className="text-sm text-gray-500 ml-2">
              ({product.price.currency} {product.price.value})
            </span>
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
            <span>{product.condition}</span>
            <span>•</span>
            <span>{product.location}</span>
          </div>
          <Button 
            className="w-full"
            onClick={() => window.open(product.url, '_blank')}
          >
            View on eBay
          </Button>
        </div>
      ))}
    </div>
  );
};
