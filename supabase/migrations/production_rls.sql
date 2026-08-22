-- ==========================================================
-- Z COACHING & CAPTAIN KARIM ZAKARIA PLATFORM
-- PRODUCTION ROW LEVEL SECURITY (RLS) HARDENING
-- ==========================================================

-- Enable RLS on core tables
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS biomarker_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscription_audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 1. Helper function: Check if current user is COACH_ADMIN
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION is_coach_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'COACH_ADMIN'
      OR auth.users.raw_app_meta_data->>'role' = 'COACH_ADMIN'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------
-- 2. CLIENTS TABLE POLICIES
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Coach admin full access on clients" ON clients;
CREATE POLICY "Coach admin full access on clients"
ON clients FOR ALL
USING (is_coach_admin())
WITH CHECK (is_coach_admin());

DROP POLICY IF EXISTS "Trainee can only view own profile" ON clients;
CREATE POLICY "Trainee can only view own profile"
ON clients FOR SELECT
USING (auth.uid() = user_id);

-- ----------------------------------------------------------
-- 3. CHECK_INS TABLE POLICIES
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Coach admin full access on check_ins" ON check_ins;
CREATE POLICY "Coach admin full access on check_ins"
ON check_ins FOR ALL
USING (is_coach_admin())
WITH CHECK (is_coach_admin());

DROP POLICY IF EXISTS "Trainee can view and submit own check_ins" ON check_ins;
CREATE POLICY "Trainee can view and submit own check_ins"
ON check_ins FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------
-- 4. DIET_PLANS TABLE POLICIES
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Coach admin full access on diet_plans" ON diet_plans;
CREATE POLICY "Coach admin full access on diet_plans"
ON diet_plans FOR ALL
USING (is_coach_admin())
WITH CHECK (is_coach_admin());

DROP POLICY IF EXISTS "Trainee can view active diet plan" ON diet_plans;
CREATE POLICY "Trainee can view active diet plan"
ON diet_plans FOR SELECT
USING (auth.uid() = user_id);

-- ----------------------------------------------------------
-- 5. WORKOUT_LOGS TABLE POLICIES
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Coach admin full access on workout_logs" ON workout_logs;
CREATE POLICY "Coach admin full access on workout_logs"
ON workout_logs FOR ALL
USING (is_coach_admin())
WITH CHECK (is_coach_admin());

DROP POLICY IF EXISTS "Trainee can log own workout sets" ON workout_logs;
CREATE POLICY "Trainee can log own workout sets"
ON workout_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
