-- =============================================================================
-- START-X: FUNCTIONS & TRIGGERS
-- =============================================================================
-- Reusable PostgreSQL functions for Start-X database.
-- Run this file before schema.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- updated_at auto-update trigger function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Helper: apply updated_at trigger to a table
-- Usage: SELECT create_updated_at_trigger('table_name');
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_updated_at_trigger(target_table TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format(
        'CREATE OR REPLACE TRIGGER trg_%s_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        target_table, target_table
    );
END;
$$ LANGUAGE plpgsql;
