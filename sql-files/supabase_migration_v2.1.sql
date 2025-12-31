-- EmlakMetrik v2.1 Migration - Update Credit Costs
-- Analiz: 2 kredi, PDF: 10 kredi
-- Reklam izleme: +2 kredi (zaten doğru)

-- =============================================================================
-- 1. UPDATE SPEND_CREDIT_AND_SAVE_ANALYSIS FUNCTION (1 -> 2 credits)
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
    v_credit_cost INTEGER := 2; -- Updated from 1 to 2
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
    
    IF v_current_balance < v_credit_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'Yetersiz kredi. Analiz için ' || v_credit_cost || ' kredi gerekli.');
    END IF;
    
    -- 2. Deduct credits
    UPDATE profiles
    SET credit_balance = credit_balance - v_credit_cost
    WHERE id = p_user_id;
    
    -- 3. Record the transaction
    INSERT INTO wallet_transactions (user_id, amount, type, description)
    VALUES (p_user_id, -v_credit_cost, 'spend', 'Analiz: ' || COALESCE(p_title, 'Mülk Analizi'));
    
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
        'new_balance', v_current_balance - v_credit_cost
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.spend_credit_and_save_analysis TO authenticated;

-- =============================================================================
-- 2. CREATE PDF GENERATION CREDIT FUNCTION (10 credits)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.spend_credit_for_pdf(
    p_user_id UUID,
    p_property_id UUID,
    p_property_title TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance INTEGER;
    v_credit_cost INTEGER := 10;
BEGIN
    -- 1. Check current credit balance
    SELECT credit_balance INTO v_current_balance
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;
    
    IF v_current_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kullanıcı bulunamadı');
    END IF;
    
    IF v_current_balance < v_credit_cost THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Yetersiz kredi. PDF raporu için ' || v_credit_cost || ' kredi gerekli.',
            'required', v_credit_cost,
            'current', v_current_balance
        );
    END IF;
    
    -- 2. Deduct credits
    UPDATE profiles
    SET credit_balance = credit_balance - v_credit_cost
    WHERE id = p_user_id;
    
    -- 3. Record the transaction
    INSERT INTO wallet_transactions (user_id, amount, type, description)
    VALUES (
        p_user_id, 
        -v_credit_cost, 
        'spend', 
        'PDF Rapor: ' || COALESCE(p_property_title, p_property_id::TEXT)
    );
    
    -- 4. Return success with new balance
    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_current_balance - v_credit_cost,
        'cost', v_credit_cost
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.spend_credit_for_pdf TO authenticated;

-- =============================================================================
-- 3. CREATE REFUND FUNCTION (for error cases)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.refund_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_reason TEXT DEFAULT 'Hata - kredi iadesi'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    -- Update credit balance
    UPDATE profiles
    SET credit_balance = credit_balance + p_amount
    WHERE id = p_user_id
    RETURNING credit_balance INTO v_new_balance;
    
    IF v_new_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kullanıcı bulunamadı');
    END IF;
    
    -- Record the refund transaction
    INSERT INTO wallet_transactions (user_id, amount, type, description)
    VALUES (p_user_id, p_amount, 'refund', p_reason);
    
    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'refunded', p_amount
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.refund_credits TO authenticated;

-- =============================================================================
-- CREDIT COST SUMMARY (v2.1)
-- =============================================================================
-- Analiz yapmak: 2 kredi
-- PDF oluşturmak: 10 kredi
-- Reklam izlemek: +2 kredi (kazanç)
-- =============================================================================
