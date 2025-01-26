import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, MapPin, Package } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import Map from "@/components/Map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Store {
  id: string;
  name: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  owner: {
    name: string;
    email: string;
    phone?: string;
  };
  products: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
  }>;
}

const StoreProfile = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: store, isLoading } = useQuery({
    queryKey: ['store', id],
    queryFn: async () => {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select(`
          *,
          owner:owner_id (
            name,
            email
          ),
          products:products (
            id,
            name,
            price,
            category
          )
        `)
        .eq('id', id)
        .single();

      if (storeError) throw storeError;
      return storeData as Store;
    }
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handleContactStore = () => {
    if (store?.owner?.email) {
      window.location.href = `mailto:${store.owner.email}`;
    } else {
      toast({
        variant: "destructive",
        title: "Contact Error",
        description: "Store contact information is not available."
      });
    }
  };

  const handleGetDirections = () => {
    if (store?.latitude && store?.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`,
        '_blank'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-modern dark:bg-gradient-modern-dark">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-modern dark:bg-gradient-modern-dark">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Store not found
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-modern dark:bg-gradient-modern-dark">
      <Navigation user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="glass-card p-6 rounded-xl">
            <h1 className="text-3xl font-bold gradient-text mb-2">{store.name}</h1>
            <p className="text-gray-600 dark:text-gray-300">{store.description}</p>
            
            <div className="mt-4 flex flex-wrap gap-4">
              <Button onClick={handleContactStore}>
                <Mail className="w-4 h-4 mr-2" />
                Contact Store
              </Button>
              <Button variant="outline" onClick={handleGetDirections}>
                <MapPin className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] rounded-lg overflow-hidden">
                  <Map
                    location={{ lat: store.latitude, lng: store.longitude }}
                    readonly
                    markers={[{
                      id: store.id,
                      lat: store.latitude,
                      lng: store.longitude,
                      title: store.name,
                      description: store.category
                    }]}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {store.products?.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {product.category}
                        </p>
                      </div>
                      <p className="font-semibold text-primary">
                        {product.price.toFixed(2)} AED
                      </p>
                    </div>
                  ))}
                  {(!store.products || store.products.length === 0) && (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      No products available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfile;
