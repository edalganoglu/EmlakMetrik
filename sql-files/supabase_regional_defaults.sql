-- Run this in your Supabase SQL Editor
-- Regional Defaults Schema for EmlakMetrik

-- =============================================================================
-- 1. CREATE REGIONAL DEFAULTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS regional_defaults (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Location Info
    city TEXT NOT NULL,                    -- İl (e.g., 'İzmir', 'İstanbul')
    district TEXT,                         -- İlçe (e.g., 'Karşıyaka', 'Kadıköy')
    neighborhood TEXT,                     -- Mahalle (e.g., 'Örnekköy')
    
    -- Price Defaults
    avg_price_per_sqm NUMERIC DEFAULT 0,   -- Ortalama m² fiyatı
    avg_rent_per_sqm NUMERIC DEFAULT 0,    -- Ortalama m² kira (aylık)
    avg_dues NUMERIC DEFAULT 500,          -- Ortalama aidat
    
    -- Appreciation & Growth
    appreciation_rate NUMERIC DEFAULT 50,  -- Yıllık değer artış oranı (%)
    rent_increase_rate NUMERIC DEFAULT 25, -- Yıllık kira artış oranı (%)
    
    -- Loan Defaults
    default_loan_rate NUMERIC DEFAULT 2.49,    -- Default aylık faiz oranı (%)
    default_loan_term INTEGER DEFAULT 120,     -- Default vade (ay)
    default_down_payment NUMERIC DEFAULT 20,   -- Default peşinat oranı (%)
    
    -- Expense Rates
    deed_fee_rate NUMERIC DEFAULT 0.04,        -- Tapu harcı oranı
    property_tax_rate NUMERIC DEFAULT 0.002,   -- Emlak vergisi oranı (yıllık)
    maintenance_rate NUMERIC DEFAULT 0.10,     -- Bakım gideri oranı (kira %)
    
    -- Thresholds for Analysis
    good_roi_threshold NUMERIC DEFAULT 5,      -- İyi ROI alt sınırı (%)
    good_amortization_threshold NUMERIC DEFAULT 20, -- İyi amortisman üst sınırı (yıl)
    
    -- Metadata
    data_source TEXT,                      -- Veri kaynağı (e.g., 'emlakjet', 'manual')
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Unique constraint: Her konum için tek kayıt
    UNIQUE(city, district, neighborhood)
);

-- =============================================================================
-- 2. CREATE INDEX FOR FAST LOOKUPS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_regional_defaults_location 
ON regional_defaults(city, district, neighborhood);

CREATE INDEX IF NOT EXISTS idx_regional_defaults_city 
ON regional_defaults(city);

-- =============================================================================
-- 3. INSERT SAMPLE DATA FOR MAJOR CITIES
-- =============================================================================

-- Türkiye Genel (Fallback)
INSERT INTO regional_defaults (city, district, neighborhood, avg_price_per_sqm, avg_rent_per_sqm, avg_dues, appreciation_rate, default_loan_rate, data_source)
VALUES ('Türkiye', NULL, NULL, 35000, 280, 500, 50, 2.49, 'manual_average')
ON CONFLICT (city, district, neighborhood) DO UPDATE 
SET avg_price_per_sqm = EXCLUDED.avg_price_per_sqm,
    avg_rent_per_sqm = EXCLUDED.avg_rent_per_sqm,
    last_updated = NOW();

-- İstanbul Genel
INSERT INTO regional_defaults (city, district, neighborhood, avg_price_per_sqm, avg_rent_per_sqm, avg_dues, appreciation_rate, default_loan_rate, data_source)
VALUES ('İstanbul', NULL, NULL, 65000, 400, 1500, 55, 2.49, 'manual_average')
ON CONFLICT (city, district, neighborhood) DO UPDATE 
SET avg_price_per_sqm = EXCLUDED.avg_price_per_sqm,
    avg_rent_per_sqm = EXCLUDED.avg_rent_per_sqm,
    last_updated = NOW();

-- İstanbul Kadıköy
INSERT INTO regional_defaults (city, district, neighborhood, avg_price_per_sqm, avg_rent_per_sqm, avg_dues, appreciation_rate, default_loan_rate, data_source)
VALUES ('İstanbul', 'Kadıköy', NULL, 85000, 500, 2000, 60, 2.49, 'emlakjet')
ON CONFLICT (city, district, neighborhood) DO UPDATE 
SET avg_price_per_sqm = EXCLUDED.avg_price_per_sqm,
    avg_rent_per_sqm = EXCLUDED.avg_rent_per_sqm,
    last_updated = NOW();

-- İstanbul Beşiktaş
INSERT INTO regional_defaults (city, district, neighborhood, avg_price_per_sqm, avg_rent_per_sqm, avg_dues, appreciation_rate, default_loan_rate, data_source)
VALUES ('İstanbul', 'Beşiktaş', NULL, 95000, 550, 2500, 55, 2.49, 'emlakjet')
ON CONFLICT (city, district, neighborhood) DO UPDATE 
SET avg_price_per_sqm = EXCLUDED.avg_price_per_sqm,
    avg_rent_per_sqm = EXCLUDED.avg_rent_per_sqm,
    last_updated = NOW();

-- İzmir Genel
INSERT INTO regional_defaults (city, district, neighborhood, avg_price_per_sqm, avg_rent_per_sqm, avg_dues, appreciation_rate, default_loan_rate, data_source)
VALUES ('İzmir', NULL, NULL, 45000, 320, 800, 45, 2.49, 'manual_average')
ON CONFLICT (city, district, neighborhood) DO UPDATE 
SET avg_price_per_sqm = EXCLUDED.avg_price_per_sqm,
    avg_rent_per_sqm = EXCLUDED.avg_rent_per_sqm,
    last_updated = NOW();

-- İzmir Karşıyaka
INSERT INTO regional_defaults (city, district, neighborhood, avg_price_per_sqm, avg_rent_per_sqm, avg_dues, appreciation_rate, default_loan_rate, data_source)
VALUES ('İzmir', 'Karşıyaka', NULL, 47000, 330, 800, 45, 2.49, 'emlakjet')
ON CONFLICT (city, district, neighborhood) DO UPDATE 
SET avg_price_per_sqm = EXCLUDED.avg_price_per_sqm,
    avg_rent_per_sqm = EXCLUDED.avg_rent_per_sqm,
    last_updated = NOW();

-- İzmir Karşıyaka Örnekköy
INSERT INTO regional_defaults (city, district, neighborhood, avg_price_per_sqm, avg_rent_per_sqm, avg_dues, appreciation_rate, default_loan_rate, data_source)
VALUES ('İzmir', 'Karşıyaka', 'Örnekköy', 47105, 320, 800, 45, 1.96, 'emlakjet_dec2024')
ON CONFLICT (city, district, neighborhood) DO UPDATE 
SET avg_price_per_sqm = EXCLUDED.avg_price_per_sqm,
    avg_rent_per_sqm = EXCLUDED.avg_rent_per_sqm,
    last_updated = NOW();

-- Ankara Genel
INSERT INTO regional_defaults (city, district, neighborhood, avg_price_per_sqm, avg_rent_per_sqm, avg_dues, appreciation_rate, default_loan_rate, data_source)
VALUES ('Ankara', NULL, NULL, 40000, 280, 700, 40, 2.49, 'manual_average')
ON CONFLICT (city, district, neighborhood) DO UPDATE 
SET avg_price_per_sqm = EXCLUDED.avg_price_per_sqm,
    avg_rent_per_sqm = EXCLUDED.avg_rent_per_sqm,
    last_updated = NOW();

-- Ankara Çankaya
INSERT INTO regional_defaults (city, district, neighborhood, avg_price_per_sqm, avg_rent_per_sqm, avg_dues, appreciation_rate, default_loan_rate, data_source)
VALUES ('Ankara', 'Çankaya', NULL, 55000, 350, 1200, 45, 2.49, 'emlakjet')
ON CONFLICT (city, district, neighborhood) DO UPDATE 
SET avg_price_per_sqm = EXCLUDED.avg_price_per_sqm,
    avg_rent_per_sqm = EXCLUDED.avg_rent_per_sqm,
    last_updated = NOW();

-- Antalya Genel
INSERT INTO regional_defaults (city, district, neighborhood, avg_price_per_sqm, avg_rent_per_sqm, avg_dues, appreciation_rate, default_loan_rate, data_source)
VALUES ('Antalya', NULL, NULL, 55000, 350, 1000, 50, 2.49, 'manual_average')
ON CONFLICT (city, district, neighborhood) DO UPDATE 
SET avg_price_per_sqm = EXCLUDED.avg_price_per_sqm,
    avg_rent_per_sqm = EXCLUDED.avg_rent_per_sqm,
    last_updated = NOW();

-- Bursa Genel
INSERT INTO regional_defaults (city, district, neighborhood, avg_price_per_sqm, avg_rent_per_sqm, avg_dues, appreciation_rate, default_loan_rate, data_source)
VALUES ('Bursa', NULL, NULL, 35000, 250, 600, 40, 2.49, 'manual_average')
ON CONFLICT (city, district, neighborhood) DO UPDATE 
SET avg_price_per_sqm = EXCLUDED.avg_price_per_sqm,
    avg_rent_per_sqm = EXCLUDED.avg_rent_per_sqm,
    last_updated = NOW();

-- =============================================================================
-- 4. CREATE RPC FUNCTION TO GET REGIONAL DEFAULTS
-- Returns the most specific match (neighborhood > district > city > Türkiye)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_regional_defaults(
    p_city TEXT,
    p_district TEXT DEFAULT NULL,
    p_neighborhood TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Try to find the most specific match first
    
    -- 1. Try exact match (city + district + neighborhood)
    IF p_neighborhood IS NOT NULL THEN
        SELECT jsonb_build_object(
            'city', city,
            'district', district,
            'neighborhood', neighborhood,
            'avg_price_per_sqm', avg_price_per_sqm,
            'avg_rent_per_sqm', avg_rent_per_sqm,
            'avg_dues', avg_dues,
            'appreciation_rate', appreciation_rate,
            'rent_increase_rate', rent_increase_rate,
            'default_loan_rate', default_loan_rate,
            'default_loan_term', default_loan_term,
            'default_down_payment', default_down_payment,
            'deed_fee_rate', deed_fee_rate,
            'property_tax_rate', property_tax_rate,
            'maintenance_rate', maintenance_rate,
            'good_roi_threshold', good_roi_threshold,
            'good_amortization_threshold', good_amortization_threshold,
            'data_source', data_source,
            'last_updated', last_updated,
            'match_level', 'neighborhood'
        ) INTO v_result
        FROM regional_defaults
        WHERE city = p_city 
          AND district = p_district 
          AND neighborhood = p_neighborhood
          AND is_active = TRUE
        LIMIT 1;
        
        IF v_result IS NOT NULL THEN
            RETURN v_result;
        END IF;
    END IF;
    
    -- 2. Try district match (city + district)
    IF p_district IS NOT NULL THEN
        SELECT jsonb_build_object(
            'city', city,
            'district', district,
            'neighborhood', neighborhood,
            'avg_price_per_sqm', avg_price_per_sqm,
            'avg_rent_per_sqm', avg_rent_per_sqm,
            'avg_dues', avg_dues,
            'appreciation_rate', appreciation_rate,
            'rent_increase_rate', rent_increase_rate,
            'default_loan_rate', default_loan_rate,
            'default_loan_term', default_loan_term,
            'default_down_payment', default_down_payment,
            'deed_fee_rate', deed_fee_rate,
            'property_tax_rate', property_tax_rate,
            'maintenance_rate', maintenance_rate,
            'good_roi_threshold', good_roi_threshold,
            'good_amortization_threshold', good_amortization_threshold,
            'data_source', data_source,
            'last_updated', last_updated,
            'match_level', 'district'
        ) INTO v_result
        FROM regional_defaults
        WHERE city = p_city 
          AND district = p_district 
          AND neighborhood IS NULL
          AND is_active = TRUE
        LIMIT 1;
        
        IF v_result IS NOT NULL THEN
            RETURN v_result;
        END IF;
    END IF;
    
    -- 3. Try city match
    SELECT jsonb_build_object(
        'city', city,
        'district', district,
        'neighborhood', neighborhood,
        'avg_price_per_sqm', avg_price_per_sqm,
        'avg_rent_per_sqm', avg_rent_per_sqm,
        'avg_dues', avg_dues,
        'appreciation_rate', appreciation_rate,
        'rent_increase_rate', rent_increase_rate,
        'default_loan_rate', default_loan_rate,
        'default_loan_term', default_loan_term,
        'default_down_payment', default_down_payment,
        'deed_fee_rate', deed_fee_rate,
        'property_tax_rate', property_tax_rate,
        'maintenance_rate', maintenance_rate,
        'good_roi_threshold', good_roi_threshold,
        'good_amortization_threshold', good_amortization_threshold,
        'data_source', data_source,
        'last_updated', last_updated,
        'match_level', 'city'
    ) INTO v_result
    FROM regional_defaults
    WHERE city = p_city 
      AND district IS NULL 
      AND neighborhood IS NULL
      AND is_active = TRUE
    LIMIT 1;
    
    IF v_result IS NOT NULL THEN
        RETURN v_result;
    END IF;
    
    -- 4. Fallback to Turkey defaults
    SELECT jsonb_build_object(
        'city', city,
        'district', district,
        'neighborhood', neighborhood,
        'avg_price_per_sqm', avg_price_per_sqm,
        'avg_rent_per_sqm', avg_rent_per_sqm,
        'avg_dues', avg_dues,
        'appreciation_rate', appreciation_rate,
        'rent_increase_rate', rent_increase_rate,
        'default_loan_rate', default_loan_rate,
        'default_loan_term', default_loan_term,
        'default_down_payment', default_down_payment,
        'deed_fee_rate', deed_fee_rate,
        'property_tax_rate', property_tax_rate,
        'maintenance_rate', maintenance_rate,
        'good_roi_threshold', good_roi_threshold,
        'good_amortization_threshold', good_amortization_threshold,
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

GRANT EXECUTE ON FUNCTION public.get_regional_defaults TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_regional_defaults TO anon;

-- =============================================================================
-- 5. CREATE RPC FUNCTION TO LIST AVAILABLE CITIES
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_available_cities()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(DISTINCT city ORDER BY city)
        FROM regional_defaults
        WHERE is_active = TRUE AND city != 'Türkiye'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_cities TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_cities TO anon;

-- =============================================================================
-- 6. ENABLE RLS
-- =============================================================================

ALTER TABLE regional_defaults ENABLE ROW LEVEL SECURITY;

-- Everyone can read regional defaults
CREATE POLICY "Anyone can read regional defaults"
    ON regional_defaults FOR SELECT
    USING (TRUE);

-- Only admins can modify (you'll need to set up admin role separately)
-- For now, we'll just prevent general users from modifying
CREATE POLICY "No public insert"
    ON regional_defaults FOR INSERT
    WITH CHECK (FALSE);

CREATE POLICY "No public update"
    ON regional_defaults FOR UPDATE
    USING (FALSE);

CREATE POLICY "No public delete"
    ON regional_defaults FOR DELETE
    USING (FALSE);

-- =============================================================================
-- DONE! 
-- Now you can call: SELECT get_regional_defaults('İzmir', 'Karşıyaka', 'Örnekköy');
-- =============================================================================
