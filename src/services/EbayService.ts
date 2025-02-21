
import { supabase } from '@/lib/supabase';

interface EbayProduct {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  image: string;
  condition: string;
  location: string;
  url: string;
}

export class EbayService {
  static async searchProducts(query: string): Promise<{ success: boolean; error?: string; data?: EbayProduct[] }> {
    try {
      console.log('Starting eBay product search via Edge Function for query:', query);
      
      const { data, error } = await supabase.functions.invoke('ebay-search', {
        body: { query },
        params: { q: query }
      });

      if (error) {
        console.error('Supabase Edge Function error:', error);
        return {
          success: false,
          error: 'Failed to search eBay products'
        };
      }

      console.log('eBay search response:', {
        success: data.success,
        hasData: !!data.data,
        itemCount: data.data?.length || 0,
        error: data.error
      });

      if (!data.success || !data.data) {
        return {
          success: false,
          error: data.error || 'Failed to fetch eBay products'
        };
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error searching eBay products:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search eBay products'
      };
    }
  }
}
