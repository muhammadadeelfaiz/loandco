
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_node_server
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Get RapidAPI Key Function Starting");

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get RAPIDAPI_KEY from environment
    const rapidApiKey = Deno.env.get("RAPIDAPI_KEY");
    
    if (!rapidApiKey) {
      console.error("RAPIDAPI_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ 
          error: "RAPIDAPI_KEY not configured in Supabase Edge Function Secrets" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log(`Successfully retrieved RAPIDAPI_KEY (length: ${rapidApiKey.length})`);
    
    // Additional validation to ensure the key is properly formatted
    if (rapidApiKey.length < 20) {
      console.error("RAPIDAPI_KEY appears to be malformed (too short)");
      return new Response(
        JSON.stringify({ 
          error: "RAPIDAPI_KEY appears to be invalid (too short)" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        rapidApiKey,
        message: "RapidAPI key retrieved successfully" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error retrieving RAPIDAPI_KEY:", error.message);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to retrieve RAPIDAPI_KEY",
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
