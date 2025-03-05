
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useComparisonProducts } from "@/hooks/useComparisonProducts";
import { ProductComparisonTable } from "@/components/products/ProductComparisonTable";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CompareProductsProps {
  user: User | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  store_id?: string;
  store_name?: string;
  store_latitude?: number;
  store_longitude?: number;
  description?: string;
}

const CompareProducts = ({ user }: CompareProductsProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setIsLoading(true);
      
      try {
        // Fetch product with store information
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            stores:store_id (
              name,
              latitude,
              longitude
            )
          `)
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          // Format the product data
          setProduct({
            id: data.id,
            name: data.name,
            price: data.price,
            category: data.category,
            store_id: data.store_id,
            store_name: data.stores?.name,
            store_latitude: data.stores?.latitude,
            store_longitude: data.stores?.longitude,
            description: data.description
          });
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to fetch product details');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load product information"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProduct();
  }, [id, toast]);

  // Fetch comparison products from Amazon and eBay
  const { amazonProducts, ebayProducts, isLoading: isLoadingExternal } = useComparisonProducts(
    product?.name || '',
    product?.category || ''
  );

  const handleGetDirections = (lat: number, lng: number, storeName: string) => {
    // Open directions in Mapbox
    const mapboxUrl = `https://www.mapbox.com/directions?route=d-${lat},${lng}`;
    window.open(mapboxUrl, '_blank');
    
    toast({
      title: "Directions",
      description: `Getting directions to ${storeName}`
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Price Comparison
          </h1>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ) : product ? (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Comparing prices for: {product.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {product.description || `Compare prices for ${product.name} across local stores and online retailers.`}
              </p>
            </div>

            <ProductComparisonTable
              localProduct={{
                id: product.id,
                name: product.name,
                price: product.price,
                store_name: product.store_name,
                latitude: product.store_latitude,
                longitude: product.store_longitude
              }}
              amazonProducts={amazonProducts}
              ebayProducts={ebayProducts}
              isLoading={isLoadingExternal}
              onGetDirections={handleGetDirections}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Product not found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't find the product you're looking for.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Return to Home
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CompareProducts;
