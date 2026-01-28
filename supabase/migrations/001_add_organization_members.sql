-- Migration: Add organization members table for admin functionality
-- Run this in your Supabase SQL Editor if you have an existing database

-- Organization members table (links users to the organization with roles)
create table if not exists organization_members (
  id serial primary key,
  user_id uuid references auth.users on delete cascade unique,
  role text not null default 'participant' check (role in ('admin', 'participant')),
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  invited_by uuid references auth.users on delete set null,
  invited_at timestamp with time zone default timezone('utc'::text, now()) not null,
  joined_at timestamp with time zone
);

-- Enable RLS
alter table organization_members enable row level security;

-- Helper function to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from organization_members
    where user_id = auth.uid()
    and role = 'admin'
    and status = 'active'
  );
end;
$$ language plpgsql security definer;

-- Organization members policies

-- Users can view their own membership
create policy "Users can view own membership"
  on organization_members for select
  using (auth.uid() = user_id);

-- Admins can view all organization members
create policy "Admins can view all organization members"
  on organization_members for select
  using (public.is_admin());

-- Admins can insert organization members (invite)
create policy "Admins can insert organization members"
  on organization_members for insert
  with check (public.is_admin());

-- Admins can update organization members
create policy "Admins can update organization members"
  on organization_members for update
  using (public.is_admin());

-- Admins can delete organization members
create policy "Admins can delete organization members"
  on organization_members for delete
  using (public.is_admin());

-- Admin policies for viewing all user data

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on profiles for select
  using (public.is_admin());

-- Admins can view all user progress
create policy "Admins can view all user progress"
  on user_progress for select
  using (public.is_admin());

-- Admins can view all certificates
create policy "Admins can view all certificates"
  on certificates for select
  using (public.is_admin());

-- =============================================================================
-- IMPORTANT: After running this migration, you need to manually create your
-- first admin user. Run the following SQL, replacing the user_id with your
-- actual user ID from auth.users:
--
-- INSERT INTO organization_members (user_id, role, status, joined_at)
-- VALUES ('your-user-uuid-here', 'admin', 'active', now());
--
-- You can find your user_id in the Supabase Dashboard under Authentication > Users
-- =============================================================================
