import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Products = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [hasVerifiedStore, setHasVerifiedStore] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: products, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    const checkStoreVerification = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: stores } = await supabase
        .from('stores')
        .select('is_verified')
        .eq('owner_id', user.id)
        .single();

      setHasVerifiedStore(!!stores?.is_verified);
    };

    checkStoreVerification();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasVerifiedStore) {
      toast({
        variant: "destructive",
        title: "Store Not Verified",
        description: "You need a verified store to add products. Please create a store first.",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('products')
        .insert([
          { 
            name, 
            price: parseFloat(price), 
            category,
            retailer_id: (await supabase.auth.getUser()).data.user?.id
          }
        ]);

      if (error) throw error;

      toast({
        title: "Product added successfully",
      });

      setName("");
      setPrice("");
      setCategory("");
      
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  if (hasVerifiedStore === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <Navigation user={{ user_metadata: { role: 'retailer' } }} />
        <div className="container mx-auto px-4 py-12">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Store Required</AlertTitle>
            <AlertDescription>
              You need to create and verify a store before you can list products.
            </AlertDescription>
          </Alert>
          
          <Button onClick={() => navigate('/create-store')}>
            Create Store
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <Navigation user={{ user_metadata: { role: 'retailer' } }} />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {hasVerifiedStore === null ? (
            <div>Loading...</div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-primary mb-8">Manage Products</h1>

              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit">Add Product</Button>
                </form>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Your Products</h2>
                <div className="grid gap-4">
                  {products?.map((product) => (
                    <div 
                      key={product.id} 
                      className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                          {product.category} - ${product.price}
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => {}}>Edit</Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;