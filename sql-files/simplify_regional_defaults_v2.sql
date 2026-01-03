-- Migration: City-Only Architecture & Schema Optimization
-- 1. Clean up detailed location data (Districts/Neighborhoods)
-- 2. Drop location columns (district, neighborhood) and unused metric columns
-- 3. Update all RPC functions to work with City only

-- 1. DELETE Detailed Data (Keep only City-level defaults)
DELETE FROM regional_defaults WHERE district IS NOT NULL OR neighborhood IS NOT NULL;

-- 2. Drop Constraints & Indices involving dropped columns
DROP INDEX IF EXISTS idx_regional_defaults_location;
ALTER TABLE regional_defaults DROP CONSTRAINT IF EXISTS regional_defaults_city_district_neighborhood_key;

-- 3. Drop Unused Columns
ALTER TABLE regional_defaults DROP COLUMN IF EXISTS district;
ALTER TABLE regional_defaults DROP COLUMN IF EXISTS neighborhood;
ALTER TABLE regional_defaults DROP COLUMN IF EXISTS rent_increase_rate;
ALTER TABLE regional_defaults DROP COLUMN IF EXISTS default_loan_rate;
ALTER TABLE regional_defaults DROP COLUMN IF EXISTS default_loan_term;
ALTER TABLE regional_defaults DROP COLUMN IF EXISTS default_down_payment;
ALTER TABLE regional_defaults DROP COLUMN IF EXISTS deed_fee_rate;
ALTER TABLE regional_defaults DROP COLUMN IF EXISTS property_tax_rate;
ALTER TABLE regional_defaults DROP COLUMN IF EXISTS maintenance_rate;
ALTER TABLE regional_defaults DROP COLUMN IF EXISTS good_roi_threshold;
ALTER TABLE regional_defaults DROP COLUMN IF EXISTS good_amortization_threshold;

-- 4. Add new Unique Constraint on City
ALTER TABLE regional_defaults ADD CONSTRAINT regional_defaults_city_key UNIQUE (city);

-- 5. Data Fix: Normalizing Appreciation Rate (0.28 -> 28)
UPDATE regional_defaults 
SET appreciation_rate = appreciation_rate * 100
WHERE appreciation_rate < 1 AND appreciation_rate > 0;

UPDATE regional_defaults
SET appreciation_rate = 50
WHERE appreciation_rate IS NULL;

-- 6. Update RPC: get_regional_defaults (City Only)
-- Dropping old signature first just in case
DROP FUNCTION IF EXISTS public.get_regional_defaults(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_regional_defaults(
    p_city TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- 1. Try city match
    SELECT jsonb_build_object(
        'city', city,
        'avg_price_per_sqm', avg_price_per_sqm,
        'avg_rent_per_sqm', avg_rent_per_sqm,
        'avg_dues', avg_dues,
        'appreciation_rate', appreciation_rate,
        'data_source', data_source,
        'last_updated', last_updated,
        'match_level', 'city'
    ) INTO v_result
    FROM regional_defaults
    WHERE city = p_city 
      AND is_active = TRUE
    LIMIT 1;
    
    IF v_result IS NOT NULL THEN
        RETURN v_result;
    END IF;
    
    -- 2. Fallback to Turkey defaults
    SELECT jsonb_build_object(
        'city', city,
        'avg_price_per_sqm', avg_price_per_sqm,
        'avg_rent_per_sqm', avg_rent_per_sqm,
        'avg_dues', avg_dues,
        'appreciation_rate', appreciation_rate,
        'data_source', data_source,
        'last_updated', last_updated,
        'match_level', 'country'
    ) INTO v_result
    FROM regional_defaults
    WHERE city = 'Türkiye'
      AND is_active = TRUE
    LIMIT 1;
    
    RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$;

-- 7. Update RPC: search_locations (City Only)
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
    v_query := '%' || LOWER(TRIM(p_query)) || '%';
    
    RETURN (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'city', city,
                    'display_name', city,
                    'level', 'city',
                    'avg_price_per_sqm', avg_price_per_sqm,
                    'avg_rent_per_sqm', avg_rent_per_sqm,
                    'avg_dues', avg_dues,
                    'appreciation_rate', appreciation_rate
                )
                ORDER BY 
                    CASE WHEN LOWER(city) = LOWER(TRIM(p_query)) THEN 0 ELSE 1 END,
                    city
            ),
            '[]'::JSONB
        )
        FROM (
            SELECT *
            FROM regional_defaults
            WHERE is_active = TRUE
              AND city != 'Türkiye'
              AND LOWER(city) LIKE v_query
            LIMIT p_limit
        ) AS matches
    );
END;
$$;

-- 8. Update RPC: get_all_locations (City Only)
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
                    'display_name', city,
                    'level', 'city',
                    'avg_price_per_sqm', avg_price_per_sqm,
                    'avg_rent_per_sqm', avg_rent_per_sqm,
                    'avg_dues', avg_dues,
                    'appreciation_rate', appreciation_rate
                )
                ORDER BY city
            ),
            '[]'::JSONB
        )
        FROM regional_defaults
        WHERE is_active = TRUE
          AND city != 'Türkiye'
    );
END;
$$;
