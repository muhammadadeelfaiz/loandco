
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function useProductImageStorage() {
  const { toast } = useToast();

  useEffect(() => {
    const ensureStorageBucket = async () => {
      try {
        // Check if the bucket exists
        const { data: buckets, error: bucketsError } = await supabase
          .storage
          .listBuckets();
        
        if (bucketsError) {
          console.error('Error checking buckets:', bucketsError);
          return;
        }

        const bucketExists = buckets.some(bucket => bucket.name === 'product-images');
        
        if (!bucketExists) {
          // Create the bucket
          const { error: createError } = await supabase
            .storage
            .createBucket('product-images', {
              public: true,
              allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
              fileSizeLimit: 5242880 // 5MB
            });
          
          if (createError) {
            console.error('Error creating product-images bucket:', createError);
            toast({
              variant: "destructive",
              title: "Storage Setup Error",
              description: "Failed to create image storage. Some features may not work correctly."
            });
          } else {
            console.log('Product images bucket created successfully');
          }
        }
      } catch (error) {
        console.error('Error in storage bucket setup:', error);
      }
    };

    ensureStorageBucket();
  }, [toast]);

  return null;
}
