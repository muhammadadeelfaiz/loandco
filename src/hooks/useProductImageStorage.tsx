
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function useProductImageStorage() {
  const { toast } = useToast();

  useEffect(() => {
    const ensureStorageBucket = async () => {
      try {
        console.log("Checking product-images bucket existence...");
        // Check if the bucket exists
        const { data: buckets, error: bucketsError } = await supabase
          .storage
          .listBuckets();
        
        if (bucketsError) {
          console.error('Error checking buckets:', bucketsError);
          return;
        }

        const bucketExists = buckets.some(bucket => bucket.name === 'product-images');
        console.log("product-images bucket exists:", bucketExists);
        
        if (!bucketExists) {
          // Create the bucket
          console.log("Creating product-images bucket...");
          const { error: createError } = await supabase
            .storage
            .createBucket('product-images', {
              public: true,
              allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'],
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
            // Create RLS policy to make images public
            try {
              const { data: policyData, error: policyError } = await supabase.rpc(
                'create_storage_policy',
                {
                  bucket_name: 'product-images',
                  policy_name: 'Public Access',
                  definition: 'true',
                  policy_type: 'SELECT'
                }
              );
              
              if (policyError) {
                console.error('Error creating public access policy:', policyError);
              } else {
                console.log('Public access policy created successfully');
              }
            } catch (policyError) {
              console.error('Error in policy creation:', policyError);
            }
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
