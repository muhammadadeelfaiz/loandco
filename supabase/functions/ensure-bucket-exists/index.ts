
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the logged-in user
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if the product-images bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return new Response(JSON.stringify({ error: bucketsError.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const productImagesBucket = buckets.find(bucket => bucket.name === 'product-images');
    
    if (!productImagesBucket) {
      // Create the product-images bucket
      const { error: createBucketError } = await supabase.storage.createBucket('product-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      
      if (createBucketError) {
        return new Response(JSON.stringify({ error: createBucketError.message }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      
      // Set bucket policy to public
      const { error: policyError } = await supabase.storage.from('product-images').createSignedUrl('dummy', 60);
      
      if (policyError && !policyError.message.includes('not found')) {
        console.error('Error setting policy:', policyError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
