# Supabase Database Deployment Guide

**Quick deployment instructions for ALOT! Platform database**

---

## 🚀 Quick Deploy (5 minutes)

### Option 1: Use Consolidated Schema (Recommended)

**File:** `supabase/CONSOLIDATED_SCHEMA.sql` (13,466 lines, all 96 migrations)

**Steps:**

1. Open Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/dovhuaykpvdbzdwiahzr/sql/new
   ```

2. Copy entire file content:
   ```bash
   # On Windows
   type C:\Users\kacnf\alot\supabase\CONSOLIDATED_SCHEMA.sql | clip

   # Or open in editor and copy all
   ```

3. Paste into SQL Editor and click **Run**

4. Wait 2-3 minutes for execution

5. Verify:
   ```sql
   SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
   -- Expected: ~55 tables
   ```

### Option 2: CLI Migration (If network stable)

```bash
cd /c/Users/kacnf/alot
supabase db push
```

If prompted, answer "Y" to apply all migrations.

---

## ✅ Post-Deployment Configuration

### 1. Auth Settings

**Dashboard:** Authentication > Providers > Email

Set:
- **OTP expiry:** 600 seconds (10 minutes)
- **Password reset validity:** 3600 seconds (1 hour)
- **Mailer:** Configure SMTP or use Supabase default

### 2. Redirect URLs

**Dashboard:** Authentication > URL Configuration

Add these Site URLs:
```
https://frontend-h67m9ct85-kunaal-vaultikcoms-projects.vercel.app
https://frontend-one-liard-39.vercel.app
```

Add these Redirect URLs:
```
https://frontend-h67m9ct85-kunaal-vaultikcoms-projects.vercel.app/**
https://frontend-h67m9ct85-kunaal-vaultikcoms-projects.vercel.app/auth/callback
https://frontend-one-liard-39.vercel.app/**
https://frontend-one-liard-39.vercel.app/auth/callback
```

### 3. Enable Realtime (Optional)

**Dashboard:** Database > Replication

For real-time features, enable replication on:
- `rooms`
- `room_entries`
- `lottery_draws`
- `user_universal_credits`

---

## 🧪 Verification Queries

Run these in SQL Editor to verify deployment:

### 1. Check All Objects
```sql
SELECT
  'Tables' as type,
  COUNT(*)::text as count
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT
  'Policies',
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT
  'Functions',
  COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';
```

**Expected Results:**
| type | count |
|------|-------|
| Tables | ~55 |
| Policies | ~100 |
| Functions | ~25 |

### 2. Check Core Tables
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'rooms',
    'room_entries',
    'user_universal_credits',
    'lottery_draws',
    'users',
    'products',
    'room_trivia_attempts'
  )
ORDER BY tablename;
```

**Expected:** All 7 tables present

### 3. Check RLS Policies
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('rooms', 'room_entries', 'users')
GROUP BY tablename;
```

**Expected:** Each table has 3-5 policies

### 4. Check Functions
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'earn_trivia_credits',
    'get_my_trivia_credits',
    'update_updated_at_column',
    'is_admin_user'
  )
ORDER BY routine_name;
```

**Expected:** All 4 functions present

---

## 🔍 Troubleshooting

### Issue: "relation already exists"

**Cause:** Tables partially created from previous attempts

**Solution:**
```sql
-- Drop all public schema objects and start fresh
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then run CONSOLIDATED_SCHEMA.sql again
```

### Issue: "policy already exists"

**Cause:** Policies partially created

**Solution:** All migrations now have `DROP POLICY IF EXISTS` - this shouldn't happen. If it does, manually drop:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### Issue: Network timeout during migration

**Solution:** Use Option 1 (Consolidated Schema in SQL Editor) instead of CLI

### Issue: Auth not working after deployment

**Solution:**
1. Verify redirect URLs are set correctly
2. Check that email provider is configured
3. Test with: Authentication > Users > Invite User

---

## 📊 Database Schema Overview

### Core Platform Tables (~20 tables)

| Table | Purpose |
|-------|---------|
| `users` | User accounts and profiles |
| `rooms` | Lot rooms with funding status |
| `room_entries` | User entries/tickets in rooms |
| `room_entry_purchases` | Purchase transactions |
| `lottery_draws` | Draw results and winners |
| `user_universal_credits` | Stash Credits balance |
| `credit_transactions` | Credit activity log |
| `room_trivia_attempts` | Trivia gate tracking |
| `reveals` | Card reveal tracking |
| `products` | Product catalog |

### Supporting Tables (~35 tables)

- Admin & Moderation (5 tables)
- Analytics & Tracking (8 tables)
- GDPR & Compliance (4 tables)
- Marketplace & Listings (6 tables)
- User Preferences & Settings (5 tables)
- Security & Audit (7 tables)

---

## 🔐 Security Notes

### RLS Policies Active

All tables have Row Level Security (RLS) enabled with policies:
- Users can only view/modify their own data
- Admin functions require `service_role`
- Public data (room listings) accessible to all
- Credit transactions logged immutably

### Service Role Usage

Service role key (in `DEPLOYMENT_SETUP.md`) should only be used for:
- Admin operations via backend
- Cron jobs (room settlement, locking)
- Stripe webhook handlers
- Background cleanup tasks

**Never expose service role key to frontend!**

---

## 📞 Quick Links

| Resource | URL |
|----------|-----|
| **SQL Editor** | https://supabase.com/dashboard/project/dovhuaykpvdbzdwiahzr/sql/new |
| **Table Editor** | https://supabase.com/dashboard/project/dovhuaykpvdbzdwiahzr/editor |
| **Auth Config** | https://supabase.com/dashboard/project/dovhuaykpvdbzdwiahzr/auth/providers |
| **API Docs** | https://supabase.com/dashboard/project/dovhuaykpvdbzdwiahzr/api |
| **Logs** | https://supabase.com/dashboard/project/dovhuaykpvdbzdwiahzr/logs/postgres-logs |

---

**Deploy time:** ~5 minutes
**Status:** All 96 migrations ready ✅
**Issues:** All fixed ✅
