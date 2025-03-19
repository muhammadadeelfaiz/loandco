
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";
import { supabase } from "@/lib/supabase";

interface Store {
  latitude: number;
  longitude: number;
}

interface ProductInfoProps {
  name: string;
  category: string;
  price: number;
  userLocation?: { lat: number; lng: number };
  store?: Store;
  description?: string;
  retailerId?: string;
  retailerName?: string;
  productId?: string;
}

interface Review {
  id: string;
  rating: number;
  review_text: string;
  reviewer_name: string;
  created_at: string;
}

const ProductInfo = ({ 
  name, 
  category, 
  price, 
  userLocation, 
  store, 
  description,
  retailerId,
  retailerName,
  productId
}: ProductInfoProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);

  useEffect(() => {
    const fetchReviews = async () => {
      if (productId) {
        const { data, error } = await supabase
          .from('product_reviews')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setReviews(data);
          
          // Calculate average rating
          if (data.length > 0) {
            const sum = data.reduce((acc, review) => acc + review.rating, 0);
            setAverageRating(parseFloat((sum / data.length).toFixed(1)));
          }
        }
      }
    };

    fetchReviews();
  }, [productId]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div>
          <p className="text-3xl font-bold text-primary">AED {price}</p>
          <Badge variant="secondary" className="mt-1">Available</Badge>
        </div>
        {userLocation && store && (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>
              {calculateDistance(
                userLocation.lat,
                userLocation.lng,
                store.latitude,
                store.longitude
              ).toFixed(1)}km away
            </span>
          </div>
        )}
        
        {reviews.length > 0 && (
          <div className="flex items-center ml-4">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(averageRating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {averageRating} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <h3>Product Description</h3>
        <p className="text-gray-600 dark:text-gray-400">
          {description || `Experience the latest ${name} with its stunning display, powerful processor, and advanced features. Available now at our store.`}
        </p>
      </div>

      {reviews.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 font-medium">{review.reviewer_name}</span>
                  <span className="ml-auto text-sm text-gray-500">
                    {formatDate(review.created_at)}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{review.review_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductInfo;
