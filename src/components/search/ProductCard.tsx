
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Star, Heart, GitCompare } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import ChatInterface from "@/components/chat/ChatInterface";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    description?: string;
    retailer_id?: string;
    retailer_name?: string;
    distance?: number;
    store_latitude?: number;
    store_longitude?: number;
    stores?: {
      latitude: number;
      longitude: number;
      name: string;
    };
    retailers?: {
      name: string;
    };
  };
  onContactRetailer: (retailerName: string) => void;
  onGetDirections: (lat: number, lng: number, storeName: string) => void;
}

const ProductCard = ({ product, onContactRetailer, onGetDirections }: ProductCardProps) => {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to add items to your wishlist",
          variant: "destructive",
        });
        
        // Store the product ID to add to wishlist after login
        localStorage.setItem('pendingWishlistItem', product.id);
        
        // Navigate to the sign in page
        navigate('/signin');
        return;
      }

      const { data, error } = await supabase
        .from('product_wishlists')
        .insert([
          { 
            user_id: session.user.id,
            product_id: product.id
          }
        ]);

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already in wishlist",
            description: "This product is already in your wishlist",
          });
        } else {
          throw error;
        }
      } else {
        setIsInWishlist(true);
        toast({
          title: "Added to wishlist",
          description: "Product has been added to your wishlist",
        });
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to add product to wishlist",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetDirections = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.store_latitude && product.store_longitude) {
      // Open directions in Mapbox
      const mapboxUrl = `https://www.mapbox.com/directions?route=d-${product.store_latitude},${product.store_longitude}`;
      window.open(mapboxUrl, '_blank');
      
      // Also trigger the callback for any additional handling
      onGetDirections(
        product.store_latitude,
        product.store_longitude,
        product.retailer_name || "Store"
      );
    } else {
      toast({
        title: "Location Unavailable",
        description: "Store location information is not available.",
        variant: "destructive"
      });
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    // Navigate to the compare page with this product ID
    navigate(`/compare/${product.id}`);
  };

  // Get retailer name from different sources
  const retailerName = product.retailer_name || 
                       (product.retailers ? product.retailers.name : null);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link to={`/product/${product.id}`}>
        <CardContent className="p-0">
          <div className="flex gap-4">
            <div className="w-48 h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <div className="text-gray-400 dark:text-gray-500">Product Image</div>
            </div>
            
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {product.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">4.5</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={handleAddToWishlist}
                    disabled={isLoading}
                  >
                    <Heart 
                      className={`w-4 h-4 ${isInWishlist ? 'fill-current text-red-500' : ''}`} 
                    />
                  </Button>
                </div>
              </div>
              
              <p className="text-2xl font-bold text-primary mb-2">
                AED {product.price.toFixed(2)}
              </p>

              {product.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {product.description}
                </p>
              )}
              
              {retailerName && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <span>Sold by {retailerName}</span>
                </div>
              )}
              
              {product.distance && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{product.distance.toFixed(1)}km away</span>
                </div>
              )}
              
              <div className="flex gap-2 mt-auto">
                {product.retailer_id && retailerName && (
                  <div onClick={(e) => e.preventDefault()}>
                    <ChatInterface 
                      userId={undefined} 
                      retailerId={product.retailer_id} 
                      retailerName={retailerName} 
                    />
                  </div>
                )}
                
                {retailerName && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      onContactRetailer(retailerName);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Contact Seller
                  </Button>
                )}
                
                {product.store_latitude && product.store_longitude && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGetDirections}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Get Directions
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCompare}
                  className="flex items-center gap-2"
                >
                  <GitCompare className="w-4 h-4" />
                  Compare
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default ProductCard;
