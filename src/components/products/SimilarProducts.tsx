
import React from "react";
import { Card } from "@/components/ui/card";

interface SimilarProductsProps {
  products?: Array<{
    id: string;
    name: string;
    price: number;
    image?: string;
  }>;
}

const SimilarProducts = ({ products }: SimilarProductsProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Similar Products</h2>
      {(!products ? [1, 2, 3] : products).map((product, index) => (
        <Card key={typeof product === 'number' ? product : product.id} className="p-4 hover:shadow-lg transition-shadow">
          <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-md mb-2 overflow-hidden">
            <img 
              src={typeof product === 'number' 
                ? `https://images.unsplash.com/photo-148859052850${index}-98d2b5aba04b`
                : product.image || `https://images.unsplash.com/photo-148859052850${index}-98d2b5aba04b`
              }
              alt={typeof product === 'number' ? `iPhone ${index}` : product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="font-medium text-gray-800 dark:text-gray-200">
            {typeof product === 'number' ? 'iPhone 15 Pro' : product.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AED {typeof product === 'number' ? '4599' : product.price}
          </p>
        </Card>
      ))}
    </div>
  );
};

export default SimilarProducts;
