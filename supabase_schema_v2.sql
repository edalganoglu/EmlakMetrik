-- Run this in your Supabase SQL Editor to update the database for the loan and analysis features.
-- EmlakMetrik v2.0 Schema Update

-- =============================================================================
-- 1. UPDATE PROPERTIES TABLE FOR LOAN & ANALYSIS DATA
-- =============================================================================

-- Add new columns for loan information
ALTER TABLE properties ADD COLUMN IF NOT EXISTS loan_amount NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS down_payment NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS monthly_payment NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS loan_term INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS loan_rate NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS appreciation_rate NUMERIC DEFAULT 50;

-- Add columns for analysis results
ALTER TABLE properties ADD COLUMN IF NOT EXISTS roi NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amortization NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS net_monthly_income NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_initial_cost NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sqm NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per_sqm NUMERIC DEFAULT 0;

-- =============================================================================
-- 2. CREATE SECURE RPC FUNCTION FOR CREDIT DEDUCTION
-- This prevents client-side manipulation of credit balance
-- =============================================================================

CREATE OR REPLACE FUNCTION public.spend_credit_and_save_analysis(
    p_user_id UUID,
    p_title TEXT,
    p_location TEXT,
    p_price NUMERIC,
    p_monthly_rent NUMERIC,
    p_params JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance INTEGER;
    v_property_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Check current credit balance
    SELECT credit_balance INTO v_current_balance
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE; -- Lock the row to prevent race conditions
    
    IF v_current_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    IF v_current_balance < 1 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
    END IF;
    
    -- 2. Deduct 1 credit
    UPDATE profiles
    SET credit_balance = credit_balance - 1
    WHERE id = p_user_id;
    
    -- 3. Record the transaction
    INSERT INTO wallet_transactions (user_id, amount, type, description)
    VALUES (p_user_id, -1, 'spend', 'Analysis for ' || COALESCE(p_title, 'Property'));
    
    -- 4. Save the property analysis
    INSERT INTO properties (
        user_id,
        title,
        location,
        price,
        monthly_rent,
        status,
        is_unlocked,
        params,
        loan_amount,
        down_payment,
        monthly_payment,
        loan_term,
        loan_rate,
        appreciation_rate,
        roi,
        amortization,
        net_monthly_income,
        total_initial_cost,
        sqm,
        price_per_sqm
    )
    VALUES (
        p_user_id,
        p_title,
        p_location,
        p_price,
        p_monthly_rent,
        'completed',
        true,
        p_params,
        COALESCE((p_params->'results'->>'loanAmount')::NUMERIC, 0),
        COALESCE((p_params->'results'->>'downPayment')::NUMERIC, 0),
        COALESCE((p_params->'results'->>'monthlyLoanPayment')::NUMERIC, 0),
        COALESCE((p_params->'results'->>'loanTerm')::INTEGER, 0),
        COALESCE((p_params->'results'->>'loanRate')::NUMERIC, 0),
        COALESCE((p_params->'results'->>'appreciationRate')::NUMERIC, 50),
        COALESCE((p_params->'results'->>'roi')::NUMERIC, 0),
        COALESCE((p_params->'results'->>'amortization')::NUMERIC, 0),
        COALESCE((p_params->'results'->>'netMonthlyIncome')::NUMERIC, 0),
        COALESCE((p_params->'results'->>'totalInitialCost')::NUMERIC, 0),
        COALESCE((p_params->>'sqm')::NUMERIC, 0),
        COALESCE((p_params->'results'->>'pricePerSqm')::NUMERIC, 0)
    )
    RETURNING id INTO v_property_id;
    
    -- 5. Return success with property ID and new balance
    RETURN jsonb_build_object(
        'success', true,
        'property_id', v_property_id,
        'new_balance', v_current_balance - 1
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.spend_credit_and_save_analysis TO authenticated;

-- =============================================================================
-- 3. CREATE RPC FUNCTION FOR PDF GENERATION (Optional - for tracking)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.log_pdf_generation(
    p_user_id UUID,
    p_property_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log the PDF generation (for analytics purposes)
    INSERT INTO wallet_transactions (user_id, amount, type, description)
    VALUES (p_user_id, 0, 'reward', 'PDF Report generated for property ' || p_property_id::TEXT);
    
    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_pdf_generation TO authenticated;

-- =============================================================================
-- 4. CREATE COMPARABLES TABLE (Optional - for storing emsal data)
-- =============================================================================

CREATE TABLE IF NOT EXISTS comparables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    sqm NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    price_per_sqm NUMERIC GENERATED ALWAYS AS (price / NULLIF(sqm, 0)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE comparables ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see comparables for their own properties
CREATE POLICY "Users can view their own comparables"
    ON comparables FOR SELECT
    USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert comparables for their own properties
CREATE POLICY "Users can insert their own comparables"
    ON comparables FOR INSERT
    WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- 5. ADD INDEX FOR BETTER QUERY PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comparables_property_id ON comparables(property_id);

-- =============================================================================
-- MIGRATION COMPLETE!
-- =============================================================================

-- Note: After running this migration, update your calculator.tsx to use the RPC function:
-- 
-- Instead of:
--   await supabase.from('wallet_transactions').insert({...});
--   await supabase.from('properties').insert({...});
--
-- Use:
--   const { data, error } = await supabase.rpc('spend_credit_and_save_analysis', {
--     p_user_id: user.id,
--     p_title: address || `Property ${price}`,
--     p_location: location || 'Unknown Location',
--     p_price: parseFloat(price),
--     p_monthly_rent: parseFloat(rent),
--     p_params: { dues, renovation, sqm, useLoan, loanRate, loanTerm, downPaymentPercent, appreciationRate, results: resultData }
--   });
--
--   if (data.success) {
--     setCreditBalance(data.new_balance);
--     router.replace(`/analysis/${data.property_id}`);
--   } else {
--     Alert.alert('Error', data.error);
--   }
