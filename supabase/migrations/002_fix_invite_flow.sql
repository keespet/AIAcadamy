-- Migration: Fix invite flow by making user_id nullable and adding email column
-- This allows invites to be stored before the user accepts and creates their account

-- Add email column for pending invites
ALTER TABLE organization_members
ADD COLUMN IF NOT EXISTS email text;

-- Make user_id nullable (for pending invites where user hasn't registered yet)
ALTER TABLE organization_members
ALTER COLUMN user_id DROP NOT NULL;

-- Drop the unique constraint on user_id temporarily
ALTER TABLE organization_members
DROP CONSTRAINT IF EXISTS organization_members_user_id_key;

-- Add a new unique constraint that allows multiple NULLs but unique non-NULL values
CREATE UNIQUE INDEX IF NOT EXISTS organization_members_user_id_unique
ON organization_members (user_id)
WHERE user_id IS NOT NULL;

-- Add unique constraint on email for pending invites
CREATE UNIQUE INDEX IF NOT EXISTS organization_members_email_unique
ON organization_members (email)
WHERE email IS NOT NULL AND user_id IS NULL;

-- Update status check to include 'invited' status
ALTER TABLE organization_members
DROP CONSTRAINT IF EXISTS organization_members_status_check;

ALTER TABLE organization_members
ADD CONSTRAINT organization_members_status_check
CHECK (status IN ('active', 'inactive', 'pending', 'invited'));

-- =============================================================================
-- After running this migration, also update the RLS policies if needed
-- and ensure the auth callback links the user_id when the invite is accepted
-- =============================================================================
