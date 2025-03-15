
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export interface Store {
  id: string;
  name: string;
  category: string;
  description: string | null;
  latitude: number;
  longitude: number;
  distance?: number;
}

export const useStores = (
  userLocation: { lat: number; lng: number } | null, 
  selectedCategory: string | null = null,
  radiusKm: number = 60 // Default radius of 60km
) => {
  const [stores, setStores] = useState<Store[]>([]);

  const { data: initialStores, isLoading } = useQuery({
    queryKey: ['stores', selectedCategory, userLocation?.lat, userLocation?.lng, radiusKm],
    queryFn: async () => {
      let query = supabase.from('stores').select('*');
      
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching stores:', error);
        throw error;
      }
      console.log('Fetched stores from Supabase:', data);
      
      // Validate that stores have valid coordinates
      const validStores = data.filter(store => 
        typeof store.latitude === 'number' && 
        typeof store.longitude === 'number' &&
        !isNaN(store.latitude) && 
        !isNaN(store.longitude)
      );
      
      if (validStores.length < data.length) {
        console.warn('Some stores have invalid coordinates:', 
          data.filter(s => !validStores.includes(s)).map(s => s.id));
      }
      
      return validStores as Store[];
    },
    enabled: true
  });

  useEffect(() => {
    if (initialStores) {
      setStores(initialStores);
    }
  }, [initialStores]);

  useEffect(() => {
    const channel = supabase
      .channel('stores_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stores'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setStores(current => [...current, payload.new as Store]);
          } else if (payload.eventType === 'DELETE') {
            setStores(current => current.filter(store => store.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setStores(current =>
              current.map(store =>
                store.id === payload.new.id ? { ...store, ...payload.new } : store
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2 || 
        isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      return null;
    }
    
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate distance and filter stores within radius
  const storesWithDistance = stores.map(store => {
    let distance = null;
    if (userLocation && store.latitude && store.longitude) {
      distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        store.latitude, 
        store.longitude
      );
    }
    
    return {
      ...store,
      distance
    };
  }).filter(store => 
    // Only include stores within the specified radius
    store.distance !== null && store.distance <= radiusKm
  );

  return {
    stores: storesWithDistance.sort((a, b) => 
      (a.distance !== null && b.distance !== null) ? (a.distance - b.distance) : 0
    ),
    isLoading
  };
};
