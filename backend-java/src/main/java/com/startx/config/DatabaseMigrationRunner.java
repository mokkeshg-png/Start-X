package com.startx.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Applies idempotent DDL migrations on every startup.
 *
 * <p>Only active in the default (production/dev) profile. Disabled in the
 * {@code test} profile because H2 does not support PostgreSQL-specific SQL
 * such as the {@code user_role_type} enum type or RLS syntax.</p>
 *
 * <p>Because the project uses {@code ddl-auto: none}, Hibernate will not
 * create tables automatically. This runner applies the authorized_emails
 * table and its RLS policies the first time the backend starts against a
 * fresh database — and does nothing on subsequent starts (all statements use
 * {@code IF NOT EXISTS} or equivalent guards).</p>
 */
@Component
@Order(1)
@Profile("!test")
public class DatabaseMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        log.info("DatabaseMigrationRunner: applying idempotent migrations...");
        try {
            applyAuthorizedEmailsTable();
            applyStudentsInsertPolicy();
            applyStaffInsertPolicy();
            log.info("DatabaseMigrationRunner: all migrations applied successfully.");
        } catch (Exception e) {
            // Log but do not crash startup — the table may already exist or the DB
            // might be temporarily unavailable; health endpoint will surface this.
            log.error("DatabaseMigrationRunner: migration failed (non-fatal): {}", e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // authorized_emails table
    // -------------------------------------------------------------------------

    private void applyAuthorizedEmailsTable() {
        // 1. Create table
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS public.authorized_emails (
                id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
                email           varchar(255)  NOT NULL,
                role            user_role_type NOT NULL,
                status          varchar(20)   NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','registered','active','revoked')),
                added_by        uuid          REFERENCES public.users(user_id) ON DELETE SET NULL,
                linked_user_id  uuid          REFERENCES public.users(user_id) ON DELETE SET NULL,
                created_at      timestamptz   NOT NULL DEFAULT now(),
                updated_at      timestamptz   NOT NULL DEFAULT now()
            )
            """);
        log.info("  [ok] authorized_emails table");

        // 2. Unique email constraint
        jdbcTemplate.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'authorized_emails_email_unique'
                ) THEN
                    ALTER TABLE public.authorized_emails
                        ADD CONSTRAINT authorized_emails_email_unique UNIQUE (email);
                END IF;
            END$$
            """);

        // 3. Lowercase check constraint
        jdbcTemplate.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'authorized_emails_email_lowercase'
                ) THEN
                    ALTER TABLE public.authorized_emails
                        ADD CONSTRAINT authorized_emails_email_lowercase
                        CHECK (email = lower(trim(email)));
                END IF;
            END$$
            """);

        // 4. Indexes
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_authorized_emails_email  ON public.authorized_emails (email)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_authorized_emails_role   ON public.authorized_emails (role)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_authorized_emails_status ON public.authorized_emails (status)");

        // 5. Updated_at trigger
        jdbcTemplate.execute("""
            CREATE OR REPLACE FUNCTION public.update_authorized_emails_updated_at()
            RETURNS TRIGGER LANGUAGE plpgsql AS $$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $$
            """);
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS trg_authorized_emails_updated_at ON public.authorized_emails");
        jdbcTemplate.execute("""
            CREATE TRIGGER trg_authorized_emails_updated_at
                BEFORE UPDATE ON public.authorized_emails
                FOR EACH ROW EXECUTE FUNCTION public.update_authorized_emails_updated_at()
            """);

        // 6. Enable RLS
        jdbcTemplate.execute("ALTER TABLE public.authorized_emails ENABLE ROW LEVEL SECURITY");

        // 7. RLS policies (idempotent: drop then create)
        jdbcTemplate.execute("DROP POLICY IF EXISTS authorized_emails_select_admin ON public.authorized_emails");
        jdbcTemplate.execute("""
            CREATE POLICY authorized_emails_select_admin
                ON public.authorized_emails FOR SELECT
                USING (get_my_role() = 'admin')
            """);

        jdbcTemplate.execute("DROP POLICY IF EXISTS authorized_emails_insert_admin ON public.authorized_emails");
        jdbcTemplate.execute("""
            CREATE POLICY authorized_emails_insert_admin
                ON public.authorized_emails FOR INSERT
                WITH CHECK (get_my_role() = 'admin')
            """);

        jdbcTemplate.execute("DROP POLICY IF EXISTS authorized_emails_update_admin ON public.authorized_emails");
        jdbcTemplate.execute("""
            CREATE POLICY authorized_emails_update_admin
                ON public.authorized_emails FOR UPDATE
                USING    (get_my_role() = 'admin')
                WITH CHECK (get_my_role() = 'admin')
            """);

        jdbcTemplate.execute("DROP POLICY IF EXISTS authorized_emails_delete_admin ON public.authorized_emails");
        jdbcTemplate.execute("""
            CREATE POLICY authorized_emails_delete_admin
                ON public.authorized_emails FOR DELETE
                USING (get_my_role() = 'admin')
            """);

        log.info("  [ok] authorized_emails RLS policies");
    }

    // -------------------------------------------------------------------------
    // Students INSERT policy (missing from original schema)
    // -------------------------------------------------------------------------

    private void applyStudentsInsertPolicy() {
        jdbcTemplate.execute("DROP POLICY IF EXISTS students_insert ON public.students");
        jdbcTemplate.execute("""
            CREATE POLICY students_insert
                ON public.students FOR INSERT
                WITH CHECK (
                    (user_id = auth.uid())
                    OR is_staff_or_above()
                )
            """);
        log.info("  [ok] students INSERT policy");
    }

    // -------------------------------------------------------------------------
    // Staff INSERT policy (missing from original schema)
    // -------------------------------------------------------------------------

    private void applyStaffInsertPolicy() {
        jdbcTemplate.execute("DROP POLICY IF EXISTS staff_insert ON public.staff");
        jdbcTemplate.execute("""
            CREATE POLICY staff_insert
                ON public.staff FOR INSERT
                WITH CHECK (
                    (user_id = auth.uid())
                    OR is_staff_or_above()
                )
            """);
        log.info("  [ok] staff INSERT policy");
    }
}
