/**
 * Script to create an admin user
 *
 * Usage:
 *   npx ts-node scripts/create-admin.ts <email> <password> <full_name>
 *
 * Example:
 *   npx ts-node scripts/create-admin.ts admin@example.com MySecurePassword123 "Admin User"
 */

import bcrypt from 'bcryptjs'

async function main() {
  const [, , email, password, fullName] = process.argv

  if (!email || !password || !fullName) {
    console.error('Usage: npx ts-node scripts/create-admin.ts <email> <password> <full_name>')
    console.error('Example: npx ts-node scripts/create-admin.ts admin@example.com MyPassword123 "Admin User"')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  console.log('\n=== SQL to create admin user ===\n')
  console.log(`INSERT INTO public.users (email, password_hash, full_name, role, status)`)
  console.log(`VALUES ('${email.toLowerCase()}', '${passwordHash}', '${fullName}', 'admin', 'active');`)
  console.log('\n=== Run this SQL in your Supabase SQL editor ===\n')
}

main()
