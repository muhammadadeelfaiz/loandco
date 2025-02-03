import { useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Star, ExternalLink } from "lucide-react";

interface Retailer {
  name: string;
  logo: string;
  price: number;
  rating: number;
  link: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  retailers: Retailer[];
}

// Mock data for demonstration
const MOCK_PRODUCT: Product = {
  id: "nike-dunk-low",
  name: "Nike Dunk Low Retro",
  category: "Men's Shoe",
  image: "/lovable-uploads/cd2fc49a-fed6-46ed-935e-b78f5ad77b00.png",
  retailers: [
    {
      name: "Local Store",
      logo: "https://via.placeholder.com/50x50.png?text=LS",
      price: 450,
      rating: 4.5,
      link: "#"
    },
    {
      name: "Noon",
      logo: "https://via.placeholder.com/50x50.png?text=Noon",
      price: 575,
      rating: 4.2,
      link: "#"
    },
    {
      name: "Nike",
      logo: "https://via.placeholder.com/50x50.png?text=Nike",
      price: 600,
      rating: 4.8,
      link: "#"
    }
  ]
};

const CompareProducts = () => {
  const { id } = useParams();
  const product = MOCK_PRODUCT; // In real implementation, fetch based on id

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={null} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Similar Products Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Similar Products
            </h2>
            {[1, 2, 3].map((index) => (
              <Card 
                key={index} 
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-md mb-2">
                  <img 
                    src={product.image}
                    alt={`Similar product ${index}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AED {450 + (index * 25)}
                </p>
              </Card>
            ))}
          </div>

          {/* Main Product Display */}
          <div className="md:col-span-3">
            <Card className="p-6">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="aspect-square bg-white rounded-lg p-4">
                  <img 
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {product.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {product.category}
                  </p>
                  
                  <div className="space-y-6">
                    {product.retailers.map((retailer, index) => (
                      <div 
                        key={index}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
                              <img 
                                src={retailer.logo}
                                alt={retailer.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold">{retailer.name}</h3>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {retailer.rating}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-lg font-bold text-primary">
                              <DollarSign className="w-5 h-5" />
                              <span>AED {retailer.price}</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="mt-2"
                              asChild
                            >
                              <a 
                                href={retailer.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                Visit Store
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompareProducts;