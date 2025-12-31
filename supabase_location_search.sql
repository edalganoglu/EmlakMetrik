-- Add this to your Supabase SQL Editor after running supabase_regional_defaults.sql
-- Search function for location autocomplete

-- =============================================================================
-- 1. CREATE SEARCH FUNCTION FOR AUTOCOMPLETE
-- =============================================================================

CREATE OR REPLACE FUNCTION public.search_locations(
    p_query TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_query TEXT;
BEGIN
    -- Normalize search query
    v_query := '%' || LOWER(TRIM(p_query)) || '%';
    
    RETURN (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'city', city,
                    'district', district,
                    'neighborhood', neighborhood,
                    'display_name', 
                        CASE 
                            WHEN neighborhood IS NOT NULL THEN city || ', ' || district || ', ' || neighborhood
                            WHEN district IS NOT NULL THEN city || ', ' || district
                            ELSE city
                        END,
                    'level',
                        CASE 
                            WHEN neighborhood IS NOT NULL THEN 'neighborhood'
                            WHEN district IS NOT NULL THEN 'district'
                            ELSE 'city'
                        END,
                    'avg_price_per_sqm', avg_price_per_sqm,
                    'avg_rent_per_sqm', avg_rent_per_sqm,
                    'avg_dues', avg_dues,
                    'appreciation_rate', appreciation_rate
                )
                ORDER BY 
                    -- Prioritize exact matches
                    CASE WHEN LOWER(city) = LOWER(TRIM(p_query)) THEN 0
                         WHEN LOWER(district) = LOWER(TRIM(p_query)) THEN 1
                         WHEN LOWER(neighborhood) = LOWER(TRIM(p_query)) THEN 2
                         ELSE 3 
                    END,
                    -- Then by specificity (neighborhood > district > city)
                    CASE WHEN neighborhood IS NOT NULL THEN 0
                         WHEN district IS NOT NULL THEN 1
                         ELSE 2
                    END,
                    city, district, neighborhood
            ),
            '[]'::JSONB
        )
        FROM (
            SELECT DISTINCT ON (city, district, neighborhood) *
            FROM regional_defaults
            WHERE is_active = TRUE
              AND city != 'Türkiye'
              AND (
                  LOWER(city) LIKE v_query
                  OR LOWER(COALESCE(district, '')) LIKE v_query
                  OR LOWER(COALESCE(neighborhood, '')) LIKE v_query
                  OR LOWER(city || ' ' || COALESCE(district, '') || ' ' || COALESCE(neighborhood, '')) LIKE v_query
              )
            LIMIT p_limit
        ) AS matches
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_locations TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_locations TO anon;

-- =============================================================================
-- 2. CREATE FUNCTION TO GET ALL LOCATIONS (for initial load)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_all_locations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'city', city,
                    'district', district,
                    'neighborhood', neighborhood,
                    'display_name', 
                        CASE 
                            WHEN neighborhood IS NOT NULL THEN city || ', ' || district || ', ' || neighborhood
                            WHEN district IS NOT NULL THEN city || ', ' || district
                            ELSE city
                        END,
                    'level',
                        CASE 
                            WHEN neighborhood IS NOT NULL THEN 'neighborhood'
                            WHEN district IS NOT NULL THEN 'district'
                            ELSE 'city'
                        END
                )
                ORDER BY city, district NULLS FIRST, neighborhood NULLS FIRST
            ),
            '[]'::JSONB
        )
        FROM regional_defaults
        WHERE is_active = TRUE
          AND city != 'Türkiye'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_locations TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_locations TO anon;
