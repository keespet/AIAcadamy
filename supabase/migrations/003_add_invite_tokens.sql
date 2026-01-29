-- Migration: Add invite token columns for custom invite system
-- This replaces dependency on Supabase's inviteUserByEmail

-- Add invite_token column for secure token storage (hashed)
ALTER TABLE organization_members
ADD COLUMN IF NOT EXISTS invite_token text;

-- Add token_expires_at column for token expiration
ALTER TABLE organization_members
ADD COLUMN IF NOT EXISTS token_expires_at timestamp with time zone;

-- Add unique index on invite_token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS organization_members_invite_token_unique
ON organization_members (invite_token)
WHERE invite_token IS NOT NULL;
