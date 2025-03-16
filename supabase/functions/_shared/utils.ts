
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Helper to handle CORS preflight requests
export function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

// Helper for consistent error responses
export function errorResponse(message: string, status: number = 500, additionalData: Record<string, any> = {}) {
  return new Response(
    JSON.stringify({ 
      error: message,
      timestamp: new Date().toISOString(),
      ...additionalData
    }), 
    { 
      headers: corsHeaders,
      status: status
    }
  );
}

// Helper for successful responses
export function successResponse(data: Record<string, any>, status: number = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      ...data
    }),
    {
      headers: corsHeaders,
      status: status
    }
  );
}
