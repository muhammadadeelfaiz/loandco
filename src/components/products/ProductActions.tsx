
import React from "react";
import { Button } from "@/components/ui/button";
import { Store, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatInterface from "@/components/chat/ChatInterface";

interface ProductActionsProps {
  storeWebsite?: string;
  productId: string;
  retailerId?: string;
  retailerName?: string;
}

const ProductActions = ({ 
  storeWebsite, 
  productId, 
  retailerId, 
  retailerName 
}: ProductActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-4 mb-8">
      {storeWebsite ? (
        <Button className="flex-1" asChild>
          <a href={storeWebsite} target="_blank" rel="noopener noreferrer">
            <Store className="w-4 h-4 mr-2" />
            Visit Store
          </a>
        </Button>
      ) : (
        <Button className="flex-1" disabled>
          <Store className="w-4 h-4 mr-2" />
          Store Unavailable
        </Button>
      )}
      
      {retailerId && retailerName ? (
        <ChatInterface 
          userId={undefined} 
          retailerId={retailerId} 
          retailerName={retailerName} 
        />
      ) : null}
      
      <Button 
        variant="outline" 
        className="flex-1"
        onClick={() => navigate(`/compare/${productId}`)}
      >
        Compare Prices
      </Button>
    </div>
  );
};

export default ProductActions;
