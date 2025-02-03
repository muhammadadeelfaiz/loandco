import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Star, ExternalLink, MapPin, Phone, Mail, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Retailer {
  name: string;
  logo: string;
  price: number;
  rating: number;
  link: string;
  location?: string;
  inStock?: boolean;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  retailers: Retailer[];
}

// Mock data for demonstration
const MOCK_PRODUCT: Product = {
  id: "iphone-15-pro",
  name: "iPhone 15 Pro Max",
  category: "Smartphones",
  image: "/lovable-uploads/cd2fc49a-fed6-46ed-935e-b78f5ad77b00.png",
  description: "Experience the latest iPhone 15 Pro Max with its stunning display, powerful A17 Pro chip, and revolutionary camera system. Available in Natural Titanium, Blue Titanium, White Titanium, and Black Titanium.",
  retailers: [
    {
      name: "Local Store",
      logo: "/lovable-uploads/72f9d866-4935-4e69-baf1-ffc1549c4a62.png",
      price: 4599,
      rating: 4.5,
      link: "#",
      location: "Dubai Mall",
      inStock: true,
      address: "Financial Center Road, Downtown Dubai, UAE",
      phone: "+971 4 123 4567",
      email: "contact@localstore.ae",
      website: "www.localstore.ae"
    },
    {
      name: "Noon",
      logo: "/lovable-uploads/8329be5b-30dc-4556-a352-afbcba4c2b08.png",
      price: 4699,
      rating: 4.2,
      link: "#",
      location: "Online Store",
      inStock: true,
      phone: "800 666 6",
      email: "care@noon.com",
      website: "www.noon.com"
    },
    {
      name: "Amazon UAE",
      logo: "/lovable-uploads/b3e64fee-6c53-46f8-90b9-923245bc5c55.png",
      price: 4799,
      rating: 4.8,
      link: "#",
      location: "Online Store",
      inStock: false,
      phone: "800 AMAZON",
      email: "cs@amazon.ae",
      website: "www.amazon.ae"
    }
  ]
};

// Similar products data
const SIMILAR_PRODUCTS = [
  {
    id: "samsung-s24-ultra",
    name: "Samsung S24 Ultra",
    price: 4899,
    image: "/lovable-uploads/1bf98cbb-1c1f-446b-af92-f18c1969ee44.png"
  },
  {
    id: "pixel-8-pro",
    name: "Google Pixel 8 Pro",
    price: 3699,
    image: "/lovable-uploads/5a3d5e73-5f21-4d64-8954-5684bbd5a3bb.png"
  },
  {
    id: "xiaomi-14-pro",
    name: "Xiaomi 14 Pro",
    price: 3499,
    image: "/lovable-uploads/6766b6ef-3ac2-4559-bf7e-d8fecd971b72.png"
  }
];

const CompareProducts = () => {
  const { id } = useParams();
  const product = MOCK_PRODUCT;

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
            {SIMILAR_PRODUCTS.map((similarProduct) => (
              <Link to={`/product/${similarProduct.id}`} key={similarProduct.id}>
                <Card 
                  className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="w-full h-32 bg-white dark:bg-gray-800 rounded-md mb-2">
                    <img 
                      src={similarProduct.image}
                      alt={similarProduct.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">
                    {similarProduct.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AED {similarProduct.price}
                  </p>
                </Card>
              </Link>
            ))}
          </div>

          {/* Main Product Display */}
          <div className="md:col-span-3">
            <Card className="p-6">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="aspect-square bg-white rounded-lg p-4 mb-4">
                    <img 
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Product Information
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {product.description}
                    </p>
                  </div>
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
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {retailer.rating}
                                  </span>
                                </div>
                                <span className="text-gray-300">•</span>
                                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                  <MapPin className="w-4 h-4" />
                                  <span>{retailer.location}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-lg font-bold text-primary">
                              <DollarSign className="w-5 h-5" />
                              <span>AED {retailer.price}</span>
                            </div>
                            <Badge 
                              variant={retailer.inStock ? "default" : "destructive"}
                              className="mb-2"
                            >
                              {retailer.inStock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                          {retailer.address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 mt-1 text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">{retailer.address}</span>
                            </div>
                          )}
                          {retailer.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">{retailer.phone}</span>
                            </div>
                          )}
                          {retailer.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">{retailer.email}</span>
                            </div>
                          )}
                          {retailer.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">{retailer.website}</span>
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full mt-4"
                          asChild
                          disabled={!retailer.inStock}
                        >
                          <a 
                            href={retailer.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 justify-center"
                          >
                            Visit Store
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
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