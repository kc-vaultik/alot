# ALOT! Deployment Setup Guide

**Status:** Ready for Antigravity IDE deployment
**Date:** February 9, 2026

---

## ✅ Completed Setup

### 1. Supabase Configuration

**New Standalone Organization Created:**
- **Organization Name:** ALOT Platform
- **Organization ID:** `imhvdmvbsiejdsvrtynw`
- **Status:** Active, completely separate from VaultikAuth

**Production Project Created:**
- **Project Name:** alot-platform
- **Project ID:** `dovhuaykpvdbzdwiahzr`
- **Region:** East US (North Virginia)
- **Dashboard:** https://supabase.com/dashboard/project/dovhuaykpvdbzdwiahzr
- **API URL:** https://dovhuaykpvdbzdwiahzr.supabase.co

**Credentials (Already in `frontend/.env`):**
```bash
VITE_SUPABASE_URL=https://dovhuaykpvdbzdwiahzr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdmh1YXlrcHZkYnpkd2lhaHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzM3OTYsImV4cCI6MjA4NjIwOTc5Nn0.23d096Zk4vyarXPcW_THSXB-E8C6j-TAMFF-7D3jg_g
VITE_SUPABASE_PROJECT_ID=dovhuaykpvdbzdwiahzr
```

**Database Password (Secure Storage):**
```
1nJF3jG2C4xpxLTAgTRXe6f_hKmHhri21uBBy9nhzh0
```

### 2. Repository Structure

**GitHub Repository:** https://github.com/kc-vaultik/alot

**Key Directories:**
- `frontend/` - Complete React + TypeScript application (470 files)
- `supabase/migrations/` - 96 SQL migration files
- `docs/` - Architecture and database schema documentation
- `backend/` - FastAPI structure (for hybrid architecture if needed)

---

## ⚠️ Migration Issues (Needs Manual Fix)

The Lovable prototype migrations contain duplicates that require manual cleanup via Supabase Dashboard SQL Editor.

### Issues Found:

1. **Duplicate Table:** `user_preferences`
   - **Fixed in code:** Renamed GDPR version to `user_privacy_preferences`
   - **File:** `supabase/migrations/20250821124852_4b4d0348-d935-40b8-8a2c-086f40092b4a.sql`

2. **Duplicate Policies:** Multiple consultation_bookings policies
   - **Partially fixed:** Added DROP POLICY IF EXISTS
   - **Files affected:**
     - `20250827123312_e0fc6d66-37c2-4dde-b9c4-00eaf6109d02.sql`
     - `20250827123717_d959bdbb-40d1-4f8b-b1eb-347d57189cb3.sql`

3. **Auth config table** (deprecated in newer Supabase)
   - **Fixed:** Replaced with documentation comment
   - **File:** `20250821105321_525b789f-32b5-4b69-bbb3-7933c0f21e2c.sql`

### Manual Fix Options:

**Option A: Use Supabase Dashboard SQL Editor**
1. Open https://supabase.com/dashboard/project/dovhuaykpvdbzdwiahzr/sql/new
2. Run a custom consolidated schema (recommended for clean start)
3. Import data if migrating from existing prototype

**Option B: Fix Remaining Migration Conflicts**
Add `DROP POLICY IF EXISTS` to the DELETE policy in migration `20250827123312`:
```sql
DROP POLICY IF EXISTS "Users can delete their own consultation bookings" ON public.consultation_bookings;
CREATE POLICY "Users can delete their own consultation bookings"...
```

**Option C: Use Lovable's Original Database**
Keep using the existing Lovable Supabase project (if still accessible) and just deploy the frontend.

---

## 🚀 Vercel Deployment

### Prerequisites
- Vercel account connected (already logged in as `kunaal-6012`)
- GitHub repository accessible

### Quick Deploy:

**Method 1: Vercel CLI (Fastest)**
```bash
cd /c/Users/kacnf/alot/frontend
vercel
```

Follow prompts:
- Link to existing project? **No**
- Project name: **alot-platform**
- Directory: **.** (current directory)
- Build command: **npm run build**
- Output directory: **dist**

**Method 2: Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import GitHub repo: `kc-vaultik/alot`
3. Configure:
   - **Framework:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variables (from `frontend/.env`):
   ```
   VITE_SUPABASE_URL=https://dovhuaykpvdbzdwiahzr.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_SUPABASE_PROJECT_ID=dovhuaykpvdbzdwiahzr
   ```
5. Click **Deploy**

### Post-Deployment:

1. **Configure Supabase Auth Redirect:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add Vercel URL to **Redirect URLs**:
     - `https://your-app.vercel.app/**`
     - `https://your-app.vercel.app/auth/callback`

2. **Test Authentication:**
   - Try magic link login
   - Verify database connection

---

## 📋 Next Steps for Antigravity

### Immediate Actions:

1. **Deploy Frontend to Vercel** (5 minutes)
   ```bash
   cd frontend && vercel --prod
   ```

2. **Choose Database Setup Approach:**
   - **Quick Test:** Use Option C (existing Lovable database)
   - **Clean Production:** Use Option A (SQL Editor with consolidated schema)
   - **Development:** Fix remaining migrations (Option B)

3. **Verify Deployment:**
   - Test authentication flow
   - Check API connectivity
   - Verify asset loading

### Optional Enhancements:

4. **Set Up CI/CD:**
   - GitHub Actions for automated testing
   - Vercel auto-deployment on push

5. **Configure Custom Domain:**
   - Add domain in Vercel dashboard
   - Update DNS records
   - Update Supabase redirect URLs

6. **Monitoring:**
   - Vercel Analytics
   - Supabase Dashboard metrics
   - Error tracking (Sentry integration)

---

## 🔑 Important Credentials Summary

**⚠️ SECURITY:** All sensitive credentials are stored locally in:
```
C:\Users\kacnf\alot\secrets\supabase.env
```

This file is git-ignored and contains:
- Supabase Service Role Key (admin access)
- Database password
- API keys and tokens

**Public-safe credentials** (already in repository):
```bash
# Supabase (Public Info)
SUPABASE_ORG_ID=imhvdmvbsiejdsvrtynw
SUPABASE_PROJECT_ID=dovhuaykpvdbzdwiahzr
SUPABASE_URL=https://dovhuaykpvdbzdwiahzr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdmh1YXlrcHZkYnpkd2lhaHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzM3OTYsImV4cCI6MjA4NjIwOTc5Nn0.23d096Zk4vyarXPcW_THSXB-E8C6j-TAMFF-7D3jg_g

# GitHub
REPO=https://github.com/kc-vaultik/alot

# Vercel
VERCEL_USER=kunaal-6012
```

**To access sensitive credentials:**
```bash
# View credentials
cat C:\Users\kacnf\alot\secrets\supabase.env

# Load into environment (bash/git bash)
source secrets/supabase.env

# Load into environment (PowerShell)
Get-Content secrets\supabase.env | ForEach-Object {
    if ($_ -match '^([^=#]+)=(.+)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}
```

---

## 📞 Support

**Supabase Dashboard:** https://supabase.com/dashboard/project/dovhuaykpvdbzdwiahzr
**Vercel Dashboard:** https://vercel.com/kunaal-6012
**GitHub Repository:** https://github.com/kc-vaultik/alot

**Migration Status:** 80+ of 96 migrations applied, remaining have fixable duplicates

---

**Ready for autonomous deployment** ✅
