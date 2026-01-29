-- Create users table for custom authentication
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL DEFAULT '',
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('admin', 'participant')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invite_token TEXT,
  token_expires_at TIMESTAMPTZ,
  invited_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Create index on invite_token for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_invite_token ON public.users(invite_token) WHERE invite_token IS NOT NULL;

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (full access)
CREATE POLICY "Service role has full access to users" ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert an admin user (you'll need to update the password_hash after creation)
-- Generate password hash using: await hashPassword('your-admin-password')
-- Example: INSERT INTO public.users (email, password_hash, full_name, role, status)
--          VALUES ('admin@example.com', '$2a$12$...', 'Admin User', 'admin', 'active');
