-- Migration 004: pgvector + student_embeddings
-- Purpose: Enable semantic similarity search for AI team formation.
--
-- SAFETY:
--   - Uses CREATE EXTENSION IF NOT EXISTS — safe to run multiple times.
--   - Uses CREATE TABLE IF NOT EXISTS — will not destroy existing data.
--   - Run AFTER schema.sql and the ai_analysis migration.
--
-- Check if pgvector is already enabled before running:
--   SELECT * FROM pg_extension WHERE extname = 'vector';
--
-- Supabase already has pgvector available on all plans.
-- If you see "extension already exists", that is fine — this migration is idempotent.

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Student embeddings table
--    Stores text + embedding for each student profile.
--    Used for semantic candidate retrieval in team_formation.
--    We pre-filter candidates by embedding similarity BEFORE sending to OpenAI,
--    so we never send the full student database to the LLM.
CREATE TABLE IF NOT EXISTS public.student_embeddings (
    embedding_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL UNIQUE REFERENCES public.students(student_id) ON DELETE CASCADE,
    -- The text that was embedded (for transparency and re-embedding)
    content         TEXT NOT NULL,
    -- 1536 dimensions = text-embedding-3-small
    -- 3072 dimensions = text-embedding-3-large
    -- Adjust the dimension here to match the model you use.
    embedding       vector(1536),
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. HNSW index for fast approximate nearest-neighbour search
--    cosine similarity is recommended for OpenAI embeddings.
CREATE INDEX IF NOT EXISTS idx_student_embeddings_hnsw
    ON public.student_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 4. Index on student_id for direct lookups
CREATE INDEX IF NOT EXISTS idx_student_embeddings_student
    ON public.student_embeddings(student_id);

-- 5. RLS
ALTER TABLE public.student_embeddings ENABLE ROW LEVEL SECURITY;

-- Staff and above can read embeddings (for team formation)
CREATE POLICY "Staff can read student embeddings"
    ON public.student_embeddings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE user_id = auth.uid()
            AND role IN ('staff', 'department_head', 'admin')
        )
    );

-- Service role inserts/updates (Edge Function)
-- Service role bypasses RLS automatically, so no policy needed for writes.

-- 6. updated_at trigger (reuse existing function from functions.sql)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_student_embeddings_updated_at'
    ) THEN
        EXECUTE 'CREATE TRIGGER trg_student_embeddings_updated_at
            BEFORE UPDATE ON public.student_embeddings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
    END IF;
END$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper function: find top-N similar students by embedding
-- Called from the Edge Function to pre-filter candidates before OpenAI.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION find_similar_students(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    student_id  UUID,
    content     TEXT,
    similarity  float
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        se.student_id,
        se.content,
        1 - (se.embedding <=> query_embedding) AS similarity
    FROM public.student_embeddings se
    WHERE 1 - (se.embedding <=> query_embedding) > match_threshold
    ORDER BY se.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON TABLE public.student_embeddings IS
    'Stores OpenAI text embeddings for student profiles used in semantic team formation. '
    'Populated by the ai-analyze Edge Function (team_formation module).';
