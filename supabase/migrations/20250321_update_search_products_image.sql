
-- Update the search_products function to ensure it returns image_url
CREATE OR REPLACE FUNCTION public.search_products(search_term text, category_filter text)
 RETURNS TABLE(id uuid, name text, price numeric, category text, availability boolean, retailer_id uuid, created_at timestamp without time zone, store_id uuid, stores jsonb, retailers jsonb, image_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.price,
        p.category,
        p.availability,
        p.retailer_id,
        p.created_at,
        p.store_id,
        jsonb_build_object(
            'latitude', s.latitude,
            'longitude', s.longitude,
            'name', s.name
        ) as stores,
        jsonb_build_object(
            'name', u.name
        ) as retailers,
        p.image_url
    FROM products p
    LEFT JOIN users u ON p.retailer_id = u.id
    LEFT JOIN stores s ON p.store_id = s.id
    WHERE 
        (p.name ILIKE '%' || search_term || '%'
        OR p.category ILIKE '%' || search_term || '%'
        OR search_term = '')
        AND (category_filter IS NULL OR p.category = category_filter);
END;
$function$;
