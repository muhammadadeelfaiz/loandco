
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Heart, Share2, Star, Store, Truck, MapPin, GitCompare } from "lucide-react";

interface ProductDetailsProps {
  user: User | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  availability: boolean;
  store_id: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  brand?: string;
  specifications?: Record<string, any>;
}

interface Store {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  latitude?: number;
  longitude?: number;
}

const ProductDetails = ({ user }: ProductDetailsProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error('Product ID is required');

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Product not found');

      return data as Product;
    },
    enabled: !!id,
    retry: 1
  });

  const { data: store, isLoading: isStoreLoading } = useQuery({
    queryKey: ['store', product?.store_id],
    queryFn: async () => {
      if (!product?.store_id) throw new Error('Store ID is required');

      const { data, error } = await supabase
        .from('stores')
        .select('id, name, description, logo_url, latitude, longitude')
        .eq('id', product.store_id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Store not found');

      return data as Store;
    },
    enabled: !!product?.store_id,
    retry: 1
  });

  const handleAddToWishlist = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('product_wishlists')
        .insert([{ user_id: user.id, product_id: id }]);

      if (error) throw error;

      toast({
        title: "Added to wishlist",
        description: "Product has been added to your wishlist"
      });
    } catch (error) {
      console.error('Wishlist error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add product to wishlist"
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      })
      .catch((error) => console.error('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard"
      });
    }
  };

  const handleCompare = () => {
    if (id) {
      navigate(`/compare/${id}`);
    }
  };

  const handleGetDirections = () => {
    if (store?.latitude && store?.longitude) {
      // Open directions in Mapbox
      const mapboxUrl = `https://www.mapbox.com/directions?route=d-${store.latitude},${store.longitude}`;
      window.open(mapboxUrl, '_blank');
      
      toast({
        title: "Directions",
        description: `Getting directions to ${store.name}`
      });
    } else {
      toast({
        title: "Location Unavailable",
        description: "Store location information is not available.",
        variant: "destructive"
      });
    }
  };

  if (isProductLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Product not found
            </h2>
            <Button onClick={() => navigate('/')} variant="outline">
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navigation user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-400 text-lg">No image available</div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-600 mt-2">{product.category}</p>
              {product.brand && (
                <p className="text-gray-600">Brand: {product.brand}</p>
              )}
            </div>

            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < 4 ? "text-yellow-400 fill-current" : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 text-gray-600">4.0 (12 reviews)</span>
            </div>

            <div>
              <p className="text-3xl font-bold text-primary">
                AED {product.price.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {product.availability ? (
                  <span className="text-green-600">In Stock</span>
                ) : (
                  <span className="text-red-600">Out of Stock</span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleAddToWishlist}>
                <Heart className="w-4 h-4 mr-2" />
                Wishlist
              </Button>
              
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              <Button variant="outline" onClick={handleCompare}>
                <GitCompare className="w-4 h-4 mr-2" />
                Compare
              </Button>
              
              {store?.latitude && store?.longitude && (
                <Button variant="outline" onClick={handleGetDirections}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
              )}
            </div>

            {!isStoreLoading && store && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Store className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">Sold by: {store.name}</p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary"
                    onClick={() => navigate(`/store/${store.id}`)}
                  >
                    Visit Store
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Truck className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium">Available at Local Store</p>
                <p className="text-sm text-gray-600">Visit store for more details on stock availability</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="description" className="space-y-4">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="description">
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-700 whitespace-pre-line">
                  {product.description || "No description available."}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications">
            <Card>
              <CardContent className="p-6">
                {product.specifications ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b pb-2">
                        <span className="font-medium">{key}</span>
                        <span className="text-gray-600">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No specifications available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div>
                      <p className="font-medium">John Doe</p>
                      <div className="flex items-center gap-1 my-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < 4 ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">
                        "Great product, exactly as described!"
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductDetails;
