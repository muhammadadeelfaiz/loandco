import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, MapPin, Star, MessageSquare, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  availability: boolean;
  store_id: string;
}

interface Store {
  id: string;
  name: string;
  category: string;
  description: string | null;
  latitude: number;
  longitude: number;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logo_url?: string | null;
  owner_id?: string | null;
  is_verified?: boolean;
  opening_hours?: Record<string, any> | null;
}

const StoreProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [rating] = useState(Math.floor(Math.random() * 2) + 4);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  // Separate queries for store and products with proper error handling
  const { data: store, isLoading: isStoreLoading, error: storeError } = useQuery({
    queryKey: ['store', id],
    queryFn: async () => {
      if (!id) throw new Error('Store ID is required');

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Store not found');
      return data as Store;
    },
    enabled: !!id,
    retry: 1
  });

  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ['store-products', id],
    queryFn: async () => {
      if (!id) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', id);

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!store?.id,
    retry: 1
  });

  const handleAddToWishlist = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add stores to your wishlist",
        variant: "destructive"
      });
      return;
    }

    if (!store?.owner_id) {
      toast({
        title: "Error",
        description: "Unable to add store to wishlist",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('retailer_wishlists')
        .insert([{ user_id: user.id, retailer_id: store.owner_id }]);

      if (error) throw error;

      toast({
        title: "Added to wishlist",
        description: "Store has been added to your wishlist"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add store to wishlist"
      });
    }
  };

  if (storeError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {storeError instanceof Error ? storeError.message : 'Error loading store'}
            </h2>
            <Button onClick={() => navigate('/')} variant="outline">
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isStoreLoading || !store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navigation user={user} />
      <div className="container mx-auto px-4 py-8">
        {store && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {store.logo_url ? (
                  <img 
                    src={store.logo_url} 
                    alt={`${store.name} logo`}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-400">
                      {store.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold">{store.name}</h1>
                  <p className="text-gray-600">{store.category}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-gray-600">{rating}.0</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleAddToWishlist}>
                  <Heart className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              </div>
            </div>

            <p className="mt-6 text-gray-700">{store.description || 'No description available.'}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {store.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-5 h-5" />
                  <span>{store.phone}</span>
                </div>
              )}
              {store.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-5 h-5" />
                  <span>{store.email}</span>
                </div>
              )}
              {(store.latitude && store.longitude) && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span>View on map</span>
                </div>
              )}
            </div>
          </div>
        )}

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {isProductsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-200"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square bg-gray-100"></div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category}</p>
                      <p className="text-primary font-medium mt-2">
                        AED {product.price.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  No products available at the moment.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div>
                      <p className="font-medium">Alan Smith</p>
                      <p className="text-sm text-gray-600">
                        "Great store with excellent service!"
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Return policy</h3>
                  <p className="text-gray-600">
                    Returns are accepted within 30 days of purchase with the proper receipt.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Terms and conditions</h3>
                  <p className="text-gray-600">
                    Click to read the complete terms and conditions
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StoreProfile;