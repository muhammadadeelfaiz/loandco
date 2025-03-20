
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    retailers?: {
      name: string;
    };
    store_name?: string;
    retailer_name?: string;
    image_url?: string;
    store_longitude?: number;
    store_latitude?: number;
    distance?: number;
  };
  onContactRetailer: (retailerName: string) => void;
  onGetDirections: (lat: number, lng: number, storeName: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onContactRetailer,
  onGetDirections,
}) => {
  const navigate = useNavigate();
  const retailerName = product.retailer_name || product.store_name || "Unknown Retailer";
  const hasLocation = product.store_latitude && product.store_longitude;

  // Format the image URL properly
  const formatImageUrl = (url?: string) => {
    if (!url) return '/placeholder.svg';
    
    // If it's already a complete URL, return it
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    
    // If it's an Unsplash ID without the domain, add it
    if (url.startsWith('photo-')) {
      return `https://images.unsplash.com/${url}`;
    }
    
    // Handle Supabase storage URLs that might be relative
    if (url.includes('storage/v1/object/public')) {
      return url;
    }
    
    // Fallback to just returning the URL
    return url;
  };

  // Test image loading and provide fallback
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log("Image failed to load:", product.image_url);
    e.currentTarget.src = '/placeholder.svg';
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-48 h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {product.image_url ? (
            <img
              src={formatImageUrl(product.image_url)}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="text-gray-400 text-lg">No Image</div>
          )}
        </div>

        <CardContent className="flex-1 p-4 md:p-6">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    {product.category}
                  </p>
                </div>
                <div className="text-xl font-bold text-primary">
                  AED {product.price}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                Sold by: {retailerName}
              </p>

              {hasLocation && product.distance !== undefined && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-2 mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{product.distance.toFixed(1)} km away</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-auto">
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                View Details
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/compare/${product.id}`)}
              >
                Compare Prices
              </Button>

              {hasLocation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onGetDirections(
                      product.store_latitude!,
                      product.store_longitude!,
                      retailerName
                    )
                  }
                >
                  <MapPin className="mr-1 h-4 w-4" /> Directions
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onContactRetailer(retailerName)}
              >
                <MessageSquare className="mr-1 h-4 w-4" /> Contact
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default ProductCard;
