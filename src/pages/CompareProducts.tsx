import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, ArrowLeft } from "lucide-react";

interface CompareProductsProps {
  user: User | null;
}

const CompareProducts = ({ user }: CompareProductsProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        // Fetch the main product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (productError) throw productError;
        setProduct(productData);

        // Fetch similar products in the same category
        const { data: similarData, error: similarError } = await supabase
          .from('products')
          .select('*')
          .eq('category', productData.category)
          .neq('id', id)
          .limit(3);

        if (similarError) throw similarError;
        setSimilarProducts(similarData || []);
      } catch (error) {
        console.error('Error fetching product data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation user={user} />
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 flex items-center gap-2"
          onClick={() => navigate(`/product/${id}`)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Product
        </Button>

        <h1 className="text-3xl font-bold mb-8">Compare Products</h1>

        <Tabs defaultValue="features" className="space-y-6">
          <TabsList>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="features">
            <Card>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Feature</TableHead>
                      <TableHead>{product.name}</TableHead>
                      {similarProducts.map((p) => (
                        <TableHead key={p.id}>{p.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Availability</TableCell>
                      <TableCell>
                        {product.availability ? (
                          <Check className="text-green-500" />
                        ) : (
                          <X className="text-red-500" />
                        )}
                      </TableCell>
                      {similarProducts.map((p) => (
                        <TableCell key={`avail-${p.id}`}>
                          {p.availability ? (
                            <Check className="text-green-500" />
                          ) : (
                            <X className="text-red-500" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Free Shipping</TableCell>
                      <TableCell>
                        <Check className="text-green-500" />
                      </TableCell>
                      {similarProducts.map((p, index) => (
                        <TableCell key={`ship-${p.id}`}>
                          {index === 0 ? (
                            <X className="text-red-500" />
                          ) : (
                            <Check className="text-green-500" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Warranty</TableCell>
                      <TableCell>1 Year</TableCell>
                      {similarProducts.map((p, index) => (
                        <TableCell key={`warranty-${p.id}`}>
                          {index === 1 ? "2 Years" : "1 Year"}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications">
            <Card>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Specification</TableHead>
                      <TableHead>{product.name}</TableHead>
                      {similarProducts.map((p) => (
                        <TableHead key={p.id}>{p.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Category</TableCell>
                      <TableCell>{product.category}</TableCell>
                      {similarProducts.map((p) => (
                        <TableCell key={`cat-${p.id}`}>{p.category}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Weight</TableCell>
                      <TableCell>0.5 kg</TableCell>
                      {similarProducts.map((p, index) => (
                        <TableCell key={`weight-${p.id}`}>
                          {index === 0 ? "0.6 kg" : index === 1 ? "0.4 kg" : "0.5 kg"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Dimensions</TableCell>
                      <TableCell>10 x 5 x 2 cm</TableCell>
                      {similarProducts.map((p, index) => (
                        <TableCell key={`dim-${p.id}`}>
                          {index === 0 ? "12 x 6 x 2 cm" : index === 1 ? "9 x 5 x 2 cm" : "10 x 5 x 2 cm"}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Pricing</TableHead>
                      <TableHead>{product.name}</TableHead>
                      {similarProducts.map((p) => (
                        <TableHead key={p.id}>{p.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Price</TableCell>
                      <TableCell className="font-bold">AED {product.price}</TableCell>
                      {similarProducts.map((p) => (
                        <TableCell key={`price-${p.id}`} className="font-bold">
                          AED {p.price}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Discount</TableCell>
                      <TableCell>10%</TableCell>
                      {similarProducts.map((p, index) => (
                        <TableCell key={`discount-${p.id}`}>
                          {index === 0 ? "5%" : index === 1 ? "15%" : "None"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Actions</TableCell>
                      <TableCell>
                        <Button size="sm" className="w-full">View Details</Button>
                      </TableCell>
                      {similarProducts.map((p) => (
                        <TableCell key={`action-${p.id}`}>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => navigate(`/product/${p.id}`)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CompareProducts;
