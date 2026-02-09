# ALOT! Prototype Integration Plan

## Executive Summary

This document outlines the integration of the existing **Lovable.dev prototype** (mycollectcard.lovable.app) with the **base framework** established in this repository. The prototype is a fully functional React + Supabase application that demonstrates the complete ALOT! user experience.

**Live Prototype:** https://mycollectcard.lovable.app
**Repository:** https://github.com/kc-vaultik/alot

---

## Current State Analysis

### Lovable Prototype (Production)
**Stack:**
- **Frontend:** React 18 + TypeScript + Vite
- **UI Library:** shadcn/ui + Tailwind CSS
- **Animations:** Framer Motion
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RPC Functions)
- **State Management:** React Query + Context API
- **Auth:** Magic Link (email-based, passwordless)
- **Deployment:** Lovable.dev platform

**Implemented Features:**
- ✅ Collect Room (main lot interface)
- ✅ Trivia Credits System (sweepstakes model)
- ✅ Admin Panel (6 modules: rooms, inventory, economy, users, support, settings)
- ✅ Collector Profiles (public user profiles)
- ✅ Claim System (gift/swap token-based claims)
- ✅ Settings (Personal Data, Documents/KYC, Security, Notifications, Support)
- ✅ Landing Page with brand carousel
- ✅ Authentication (magic link flow)
- ✅ Card Reveal Animations

### Base Framework (This Repository)
**Stack:**
- **Backend:** FastAPI + PostgreSQL + SQLAlchemy
- **Frontend:** React + TypeScript + Vite (placeholder)
- **Database:** PostgreSQL with comprehensive schema
- **Task Queue:** Celery + Redis
- **Payments:** Stripe integration structure
- **Deployment:** Docker Compose + AWS-ready

---

## Integration Strategy

### Phase 1: Repository Alignment (Immediate)

**Goal:** Update this repository to reflect the actual prototype architecture

1. **Copy Prototype Frontend**
   - Copy entire `src/` directory from Lovable prototype
   - Copy `components.json`, `tailwind.config.ts`, UI components
   - Copy all assets (cards, mystery, packs, products)
   - Update `package.json` with actual dependencies

2. **Update Documentation**
   - Update README.md with actual feature list
   - Document Supabase schema (98 migrations)
   - Create Supabase setup guide
   - Document magic link auth flow

3. **Environment Configuration**
   - Add Supabase environment variables
   - Document API keys and setup process
   - Create `.env.example` with Supabase config

### Phase 2: Backend Integration (Near-term)

**Decision Point:** Choose backend strategy:

#### Option A: Keep Supabase (Recommended for MVP)
**Pros:**
- Already fully implemented and working
- Edge functions handle business logic
- Built-in auth, storage, real-time
- Rapid deployment
- Lower operational complexity

**Cons:**
- Vendor lock-in to Supabase
- Less control over backend logic
- Harder to implement complex workflows

**Implementation:**
- Keep existing Supabase backend
- Use FastAPI only for:
  - Stripe webhook handling
  - Complex business logic (draw execution)
  - Third-party integrations
  - Background jobs (Celery)

#### Option B: Migrate to FastAPI Backend
**Pros:**
- Full control over backend
- Easier to implement complex lot mechanics
- Better for provably fair draw execution
- More scalable for enterprise

**Cons:**
- Requires reimplementing all auth logic
- Need to migrate 98 SQL migrations
- Longer development time
- More infrastructure to maintain

**Implementation:**
- Create migration scripts from Supabase → PostgreSQL
- Reimplement Supabase RPC functions as FastAPI endpoints
- Replace Supabase auth with JWT + magic link
- Migrate storage to S3

**Recommendation:** Start with Option A, evolve to Option B as scale requires

### Phase 3: Feature Completion

**Core Platform:**
- [ ] Implement provably fair draw execution
- [ ] Complete Stripe payment integration
- [ ] Add fulfillment tracking system
- [ ] Implement credit redemption flow
- [ ] Add host marketplace creation

**Admin Enhancements:**
- [ ] Complete admin analytics dashboard
- [ ] Add bulk operations for inventory
- [ ] Implement automated lot monitoring
- [ ] Add fraud detection system

**User Features:**
- [ ] Complete KYC document verification
- [ ] Add wishlist functionality
- [ ] Implement referral system
- [ ] Add notification preferences

---

## Database Architecture Comparison

### Supabase Schema (from Prototype)

**Core Tables:**
```sql
-- Users & Auth (Supabase managed)
auth.users

-- Product Management
product_classes
product_questions (trivia)

-- Lot System
rooms (lots)
lot_participants
lot_trivia_questions

-- Credits System
user_trivia_credits
trivia_credit_config
daily_trivia_credits
trivia_credit_transactions

-- Admin
admin_users
admin_roles
```

### Base Framework Schema (Designed)

**Core Tables:**
```sql
-- Users
users
admin_users

-- Products
product_classes

-- Lots
rooms
room_entries
room_entry_purchases

-- Draw System
lottery_draws

-- Credits
user_universal_credits
credit_transactions

-- Trivia
room_trivia_attempts

-- Marketplace
hosts

-- Fulfillment
reveals
```

**Key Differences:**
1. Prototype uses Supabase auth.users (managed)
2. Prototype separates trivia credits from universal credits
3. Prototype has more granular admin permissions
4. Base framework has more detailed purchase tracking

---

## API Mapping

### Supabase RPC Functions → FastAPI Endpoints

| Supabase RPC | FastAPI Endpoint | Purpose |
|--------------|------------------|---------|
| `get_trivia_config()` | `GET /api/trivia/config` | Get trivia configuration |
| `get_my_trivia_credits()` | `GET /api/users/me/trivia-credits` | Get user's trivia credits |
| `earn_trivia_credits()` | `POST /api/trivia/earn` | Earn credits from trivia |
| `spend_trivia_credits()` | `POST /api/lots/{id}/enter-with-trivia` | Use trivia credits for entry |
| `create_room()` | `POST /api/admin/rooms` | Create new lot (admin) |
| `execute_draw()` | `POST /api/admin/rooms/{id}/draw` | Execute provably fair draw |

---

## Migration Roadmap

### Week 1: Foundation
- [x] Create base repository structure
- [x] Push to GitHub
- [ ] Copy Lovable prototype frontend
- [ ] Update documentation
- [ ] Test local development setup

### Week 2: Backend Decision
- [ ] Evaluate Supabase vs FastAPI tradeoffs
- [ ] Create technical spec for chosen approach
- [ ] Set up backend environment
- [ ] Implement core API endpoints

### Week 3-4: Integration
- [ ] Connect frontend to backend
- [ ] Implement authentication flow
- [ ] Add payment processing
- [ ] Test end-to-end flows

### Week 5-6: Features
- [ ] Implement provably fair draw
- [ ] Add fulfillment system
- [ ] Complete admin panel features
- [ ] Add monitoring and analytics

### Week 7-8: Polish & Launch
- [ ] Security audit
- [ ] Performance optimization
- [ ] Legal compliance review
- [ ] Staging deployment
- [ ] Production launch

---

## File Structure (Proposed)

```
alot/
├── frontend/                    # React app (from Lovable prototype)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   ├── landing/        # Landing page components
│   │   │   ├── shared/         # Shared components (reveal animations)
│   │   │   └── routing/        # Route components
│   │   ├── features/
│   │   │   ├── collect-room/   # Main lot interface
│   │   │   ├── admin/          # Admin panel
│   │   │   ├── collectors/     # User profiles
│   │   │   ├── settings/       # User settings
│   │   │   └── marketplace/    # Future marketplace
│   │   ├── contexts/           # React contexts
│   │   ├── integrations/       # Supabase client
│   │   ├── lib/                # Utilities
│   │   ├── pages/              # Page components
│   │   └── assets/             # Images, icons
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # FastAPI (optional/hybrid)
│   ├── app/
│   │   ├── core/               # Config, database
│   │   ├── models/             # SQLAlchemy models
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Business logic
│   │   └── utils/              # Helpers
│   ├── alembic/                # Migrations
│   └── requirements.txt
│
├── supabase/                    # Supabase config (from prototype)
│   ├── functions/              # Edge functions
│   ├── migrations/             # 98 SQL migration files
│   └── config.toml
│
├── docs/
│   ├── ARCHITECTURE.md         # System architecture
│   ├── DATABASE_SCHEMA.md      # Database design
│   ├── PROTOTYPE_INTEGRATION.md # This document
│   └── API_SPECIFICATION.md    # API docs
│
├── .antigravity/               # Antigravity IDE metadata
├── docker-compose.yml
├── README.md
└── QUICKSTART.md
```

---

## Development Workflow

### Local Development with Prototype

1. **Clone Repository**
   ```bash
   git clone https://github.com/kc-vaultik/alot.git
   cd alot
   ```

2. **Setup Frontend**
   ```bash
   cd frontend
   npm install

   # Copy env file and add Supabase keys
   cp .env.example .env

   # Start dev server
   npm run dev
   ```

3. **Connect to Supabase**
   - Use existing Supabase project (pzynbgpkixduqwnlqkaj)
   - OR create new Supabase project and run migrations

4. **Optional: Run Local Backend**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python -m app.main
   ```

### Antigravity IDE Integration

The `.antigravity/project.json` file contains metadata for Antigravity IDE:

```json
{
  "project": {
    "name": "ALOT!",
    "type": "full-stack-web"
  },
  "architecture": {
    "backend": {
      "framework": "FastAPI",
      "database": "PostgreSQL",
      "alternative": "Supabase (current prototype)"
    },
    "frontend": {
      "framework": "React",
      "source": "Lovable.dev prototype"
    }
  },
  "deployment": {
    "frontend": "Vercel/Lovable",
    "backend": "Optional (Supabase Edge Functions)"
  }
}
```

**Antigravity IDE Tasks:**
1. Analyze Lovable prototype structure
2. Integrate with base framework
3. Choose backend strategy (Supabase vs FastAPI)
4. Generate migration scripts if needed
5. Deploy unified application

---

## Next Steps

### Immediate Actions (For You)

1. **Review Integration Plan**
   - Decide on backend strategy (Supabase vs FastAPI)
   - Confirm feature priorities
   - Approve migration timeline

2. **Repository Setup**
   - Clone Lovable prototype into this repo
   - Update documentation
   - Test local setup

3. **Antigravity IDE Briefing**
   - Share this document with Antigravity
   - Provide Supabase credentials (if needed)
   - Define success criteria

### For Antigravity IDE

1. **Analyze Prototype**
   - Study Lovable codebase structure
   - Understand Supabase schema (98 migrations)
   - Map features to base framework

2. **Choose Integration Path**
   - Evaluate Supabase vs FastAPI tradeoffs
   - Design migration strategy
   - Create implementation timeline

3. **Execute Integration**
   - Copy frontend to repository
   - Set up backend (chosen approach)
   - Implement missing features
   - Deploy unified platform

---

## Success Criteria

**Phase 1 Complete:**
- [x] GitHub repository created
- [ ] Lovable prototype integrated
- [ ] Documentation updated
- [ ] Local development working

**Phase 2 Complete:**
- [ ] Backend strategy chosen and implemented
- [ ] Authentication working
- [ ] Core lot mechanics functional
- [ ] Admin panel operational

**Phase 3 Complete:**
- [ ] All MVP features implemented
- [ ] Production deployment ready
- [ ] Legal compliance verified
- [ ] Performance benchmarks met

---

**Last Updated:** February 9, 2026
**Status:** Repository created, awaiting prototype integration
**Next:** Copy Lovable frontend and choose backend strategy
