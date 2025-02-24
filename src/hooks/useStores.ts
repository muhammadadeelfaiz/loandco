
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
}

export const useStores = (userLocation: { lat: number; lng: number } | null, selectedCategory: string | null = null) => {
  const [stores, setStores] = useState<Store[]>([]);

  const { data: initialStores } = useQuery({
    queryKey: ['stores', selectedCategory],
    queryFn: async () => {
      let query = supabase.from('stores').select('*');
      
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Store[];
    }
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
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const storesWithDistance = stores.map(store => ({
    ...store,
    distance: userLocation 
      ? calculateDistance(userLocation.lat, userLocation.lng, store.latitude, store.longitude)
      : null
  }));

  return {
    stores: storesWithDistance.sort((a, b) => 
      (a.distance && b.distance) ? a.distance - b.distance : 0
    )
  };
};
