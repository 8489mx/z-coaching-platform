-- ==========================================================
-- Z COACHING & CAPTAIN KARIM ZAKARIA PLATFORM
-- AUTOMATED DAILY BACKUPS & ARCHIVE RETENTION ENGINE
-- ==========================================================

-- 1. Create Archive Table for Historical Snapshots
CREATE TABLE IF NOT EXISTS client_lifecycle_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_active_clients INT NOT NULL,
  total_checkins_completed INT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Daily Snapshot Procedure
CREATE OR REPLACE FUNCTION perform_daily_ecosystem_backup()
RETURNS VOID AS $$
DECLARE
  v_active_count INT;
  v_checkins_count INT;
  v_backup_payload JSONB;
BEGIN
  -- Count active clients
  SELECT COUNT(*) INTO v_active_count FROM clients WHERE status = 'ACTIVE';

  -- Count completed check-ins
  SELECT COUNT(*) INTO v_checkins_count FROM check_ins;

  -- Build aggregated snapshot
  SELECT json_build_object(
    'clients', (SELECT json_agg(c) FROM clients c),
    'check_ins', (SELECT json_agg(ch) FROM check_ins ch),
    'diet_plans', (SELECT json_agg(dp) FROM diet_plans dp),
    'workout_logs', (SELECT json_agg(wl) FROM workout_logs wl)
  ) INTO v_backup_payload;

  -- Insert snapshot record
  INSERT INTO client_lifecycle_snapshots (
    snapshot_date,
    total_active_clients,
    total_checkins_completed,
    payload
  ) VALUES (
    CURRENT_DATE,
    v_active_count,
    v_checkins_count,
    v_backup_payload
  );

  -- Prune temporary draft cache older than 30 days
  DELETE FROM subscription_audit_logs 
  WHERE created_at < NOW() - INTERVAL '30 days' 
  AND log_type = 'TEMP_DRAFT';

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Scheduled pg_cron Trigger (Runs at 03:00 AM UTC every day)
-- SELECT cron.schedule('daily-zcoaching-backup', '0 3 * * *', 'SELECT perform_daily_ecosystem_backup();');
