# Apply Migrations to Supabase - Quick Guide

**CLI is experiencing network timeouts. Use SQL Editor instead (5 minutes).**

---

## 🚀 Step-by-Step Instructions

### Step 1: Open SQL Editor

Click this link (or open manually):
```
https://supabase.com/dashboard/project/dovhuaykpvdbzdwiahzr/sql/new
```

### Step 2: Copy the Schema

Run this command to copy the consolidated schema to clipboard:

```bash
# Windows PowerShell
Get-Content C:\Users\kacnf\alot\supabase\CONSOLIDATED_SCHEMA.sql | Set-Clipboard

# Or Windows CMD
type C:\Users\kacnf\alot\supabase\CONSOLIDATED_SCHEMA.sql | clip
```

### Step 3: Paste and Run

1. In the SQL Editor, paste the entire schema (Ctrl+V)
2. Click the **"Run"** button (or press Ctrl+Enter)
3. Wait 2-3 minutes for completion

### Step 4: Verify Success

Run this query in a new SQL Editor tab:

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

**Expected Output:**
```
 type      | count
-----------+-------
 Tables    | 55
 Policies  | 100
 Functions | 25
```

---

## ✅ Post-Migration Setup

After migrations succeed, configure these settings in the Supabase Dashboard:

### 1. Auth Redirect URLs

**Location:** Authentication > URL Configuration

Add these URLs:
```
https://frontend-h67m9ct85-kunaal-vaultikcoms-projects.vercel.app/**
https://frontend-h67m9ct85-kunaal-vaultikcoms-projects.vercel.app/auth/callback
https://frontend-one-liard-39.vercel.app/**
https://frontend-one-liard-39.vercel.app/auth/callback
```

### 2. Auth Settings

**Location:** Authentication > Providers > Email

Set:
- **OTP Expiry:** 600 seconds
- **Password Reset Validity:** 3600 seconds

### 3. Test Authentication

Visit the deployed app and try magic link login:
```
https://frontend-h67m9ct85-kunaal-vaultikcoms-projects.vercel.app
```

---

## 🔍 Troubleshooting

### If you see "relation already exists" errors:

Run this first to clear the database:

```sql
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then paste and run the CONSOLIDATED_SCHEMA.sql again.

### If queries are slow:

The first run takes 2-3 minutes. Subsequent runs are instant.

---

## 📊 What Gets Created

| Object Type | Count | Examples |
|-------------|-------|----------|
| **Tables** | 55 | rooms, room_entries, users, products, lottery_draws |
| **RLS Policies** | 100+ | User data protection, admin access control |
| **Functions** | 25 | earn_trivia_credits, get_my_trivia_credits, is_admin_user |
| **Triggers** | 30 | Auto-update timestamps, audit logging |
| **Indexes** | 50+ | Performance optimization |

---

## 🎉 Success Checklist

After running migrations:

- [ ] Verification query shows ~55 tables, ~100 policies, ~25 functions
- [ ] Auth redirect URLs configured
- [ ] Auth settings updated (OTP expiry, password reset)
- [ ] Test login works at Vercel URL
- [ ] No errors in Supabase logs

---

## 📞 Quick Links

| Resource | URL |
|----------|-----|
| **SQL Editor** | https://supabase.com/dashboard/project/dovhuaykpvdbzdwiahzr/sql/new |
| **Auth Config** | https://supabase.com/dashboard/project/dovhuaykpvdbzdwiahzr/auth/providers |
| **Table Editor** | https://supabase.com/dashboard/project/dovhuaykpvdbzdwiahzr/editor |
| **Logs** | https://supabase.com/dashboard/project/dovhuaykpvdbzdwiahzr/logs/postgres-logs |
| **Frontend App** | https://frontend-h67m9ct85-kunaal-vaultikcoms-projects.vercel.app |

---

**Estimated Time:** 5 minutes
**Difficulty:** Copy/Paste
**Status:** Ready to apply ✅
