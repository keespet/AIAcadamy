-- Migration: Cleanup unused indexes and legacy columns
-- Date: 2026-01-30
-- Description: Remove unused indexes identified in database audit

-- =====================================================
-- PART 1: Remove unused indexes
-- These indexes have 0 scans and waste storage/slow writes
-- =====================================================

-- Legacy invite token indexes (invite system replaced with direct creation)
DROP INDEX IF EXISTS public.idx_users_invite_token;
DROP INDEX IF EXISTS public.organization_members_invite_token_unique;

-- Legacy email index on organization_members (email column no longer used)
DROP INDEX IF EXISTS public.organization_members_email_unique;

-- Duplicate email index on users (idx_users_email is already being used)
DROP INDEX IF EXISTS public.users_email_key;

-- =====================================================
-- PART 2: Remove legacy columns (optional - uncomment if ready)
-- These columns are defined but never used in the application
-- =====================================================

-- Remove invite_token column from users table
-- ALTER TABLE public.users DROP COLUMN IF EXISTS invite_token;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS token_expires_at;

-- Remove invite_token and email columns from organization_members
-- ALTER TABLE public.organization_members DROP COLUMN IF EXISTS invite_token;
-- ALTER TABLE public.organization_members DROP COLUMN IF EXISTS email;

-- =====================================================
-- PART 3: Add missing updated_at columns for audit trail
-- =====================================================

-- Add updated_at to user_progress if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_progress'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.user_progress
        ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- Add updated_at to certificates if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'certificates'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.certificates
        ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- Create trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to user_progress
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON public.user_progress;
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to certificates
DROP TRIGGER IF EXISTS update_certificates_updated_at ON public.certificates;
CREATE TRIGGER update_certificates_updated_at
    BEFORE UPDATE ON public.certificates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
