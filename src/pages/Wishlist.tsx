import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Wishlist = ({ user }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: productWishlists, refetch: refetchProducts } = useQuery({
    queryKey: ['product-wishlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_wishlists')
        .select(`
          *,
          product:products (
            id,
            name,
            price,
            category,
            availability
          )
        `);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: retailerWishlists, refetch: refetchRetailers } = useQuery({
    queryKey: ['retailer-wishlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retailer_wishlists')
        .select(`
          *,
          retailer:users (
            id,
            name,
            email
          )
        `);
      
      if (error) throw error;
      return data;
    }
  });

  const removeFromWishlist = async (type: 'product' | 'retailer', id: string) => {
    try {
      const { error } = await supabase
        .from(type === 'product' ? 'product_wishlists' : 'retailer_wishlists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Removed from wishlist",
        description: `Successfully removed from your ${type} wishlist.`
      });

      if (type === 'product') {
        refetchProducts();
      } else {
        refetchRetailers();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove from wishlist. Please try again."
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <Navigation user={user} />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary mb-8">My Wishlist</h1>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products" className="space-x-2">
              <Heart className="w-4 h-4" />
              <span>Saved Products</span>
            </TabsTrigger>
            <TabsTrigger value="retailers" className="space-x-2">
              <Store className="w-4 h-4" />
              <span>Saved Retailers</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productWishlists?.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">{item.product.category}</p>
                      <p className="text-primary font-medium mt-2">
                        AED {item.product.price}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromWishlist('product', item.id)}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </Button>
                  </div>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => navigate(`/product/${item.product.id}`)}
                  >
                    View Details
                  </Button>
                </Card>
              ))}
              {productWishlists?.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No products in your wishlist yet
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="retailers">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {retailerWishlists?.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{item.retailer.name}</h3>
                      <p className="text-sm text-gray-600">{item.retailer.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromWishlist('retailer', item.id)}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </Button>
                  </div>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => navigate(`/store/${item.retailer.id}`)}
                  >
                    View Store
                  </Button>
                </Card>
              ))}
              {retailerWishlists?.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No retailers in your wishlist yet
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Wishlist;