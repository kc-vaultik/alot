# ALOT! — Marketplace Platform for Collectible Lot Rooms

> **Status:** Base Framework — Ready for Antigravity IDE Deployment

## Overview

ALOT! is a sophisticated marketplace platform that runs time-bounded "Lot Rooms" for high-value collectibles (watches, bags, memorabilia). The platform combines three core systems:

1. **Lot Engine** — Creation, funding, and state management
2. **Draw Engine** — Provably fair cryptographic winner selection
3. **Credit Economy** — Closed-loop Stash Credits for retention and redemption

### Core Mechanics

- **Weighted Entry System:** More entries = higher odds (baseline: $1 = 1 entry)
- **Funding Target:** Product Retail Value × 2.5
- **Two Settlement Regimes:**
  - **FUNDED:** Winner receives product, non-winners receive Stash Credits
  - **EXPIRED:** Participants choose 98% cash refund (2% fee) or 1.5× Stash Credits
- **Provably Fair:** Cryptographic draw with permanent audit trail
- **Marketplace:** Platform lots + Host/Creator lots

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  Lot Discovery │ Entry Purchase │ Live Updates │ Profile │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API / WebSocket
┌──────────────────────┴──────────────────────────────────┐
│                  BACKEND (FastAPI)                       │
├─────────────────────────────────────────────────────────┤
│  Lot Engine  │  Draw Engine  │  Credit Economy           │
│  Marketplace │  Trivia System │  Fulfillment             │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
   │PostgreSQL│   │  Redis  │   │ Stripe  │
   │ (Primary)│   │ (Cache) │   │(Payment)│
   └──────────┘   └─────────┘   └─────────┘
```

## Product Tiers

| Tier   | Value Range       | Description              |
|--------|-------------------|--------------------------|
| ICON   | $0 – $1,000       | Entry-level collectibles |
| RARE   | $1,000 – $8,000   | Mid-tier collectibles    |
| GRAIL  | $8,000 – $50,000  | Premium collectibles     |
| MYTHIC | $50,000+          | Ultra-premium items      |

## Key Features

### 1. Lot Lifecycle

```
OPEN → FUNDED → DRAWING → SETTLED
  └──→ EXPIRED → REFUNDING
```

- **OPEN:** Accepting entries, tracking funding progress
- **FUNDED:** Target reached, ready for draw
- **DRAWING:** Cryptographic winner selection in progress
- **SETTLED:** Winner determined, settlement executed
- **EXPIRED:** Deadline passed without funding
- **REFUNDING:** Processing refunds/credit conversions

### 2. Provably Fair Draw

- **Server Seed:** 32-byte cryptographic random
- **Client Seed:** SHA256(lot_id + creation_time + total_tickets + escrow_balance)
- **Combined Seed:** SHA256(server_seed + client_seed + nonce)
- **Winning Ticket:** 1 + (int(first 8 hex chars) % total_tickets)
- **Audit Trail:** All seeds, hashes, and results permanently stored

### 3. Stash Credits (Closed-Loop Economy)

- **Value:** 1 Credit = $0.01 platform value
- **Conversion:** 100 Credits = 1 entry
- **Restrictions:** Non-cashable, non-transferable
- **Uses:** Future lot entries, dream collectible redemption
- **Issuance:** Non-winners in funded lots, 1.5× multiplier in expired lots

### 4. Trivia System

**Current:** Trivia Gate
- 3 attempts per lot
- 60-minute cooldown after failure
- Required before purchase

**Planned:** Trivia Credits
- Free participation without funding contribution
- Post-purchase odds boost (capped)
- Anti-abuse controls

### 5. Marketplace (Host/Creator Lots)

- **Platform Lots:** Created by ALOT!, marketed to all users
- **Host Lots:** Created by approved Hosts for their audience + ALOT! marketplace
- **Visibility:** Private (shareable link) or public (marketplace listing)
- **Economics:** Revenue share model (TBD)

## Technology Stack

### Backend
- **Framework:** FastAPI (async Python)
- **ORM:** SQLAlchemy 2.0
- **Database:** PostgreSQL 15+
- **Cache:** Redis 7+
- **Task Queue:** Celery + Redis
- **Payments:** Stripe API
- **Authentication:** JWT + OAuth2
- **WebSocket:** FastAPI WebSocket + Redis PubSub

### Frontend
- **Framework:** React 18 + TypeScript
- **Bundler:** Vite
- **UI Library:** Tailwind CSS + shadcn/ui
- **State:** Zustand + React Query
- **Real-time:** WebSocket + React Query subscriptions
- **Forms:** React Hook Form + Zod validation

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Orchestration:** Kubernetes (production)
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry (errors) + PostHog (analytics)
- **Logging:** Structured JSON logs + ELK stack
- **Storage:** AWS S3 (images, documents)
- **CDN:** CloudFront

## Database Schema (Core Tables)

| Table                    | Purpose                                      |
|--------------------------|----------------------------------------------|
| `rooms`                  | Lot definitions (product, target, deadline) |
| `room_entries`           | Per-user per-lot participation               |
| `room_entry_purchases`   | Payment records tied to Stripe               |
| `lottery_draws`          | Provably fair audit data                     |
| `user_universal_credits` | Credit ledger/balances                       |
| `product_classes`        | Product catalog, tiering                     |
| `reveals`                | Digital asset/cards (e.g., WON status)       |
| `room_trivia_attempts`   | Trivia attempt tracking                      |
| `hosts`                  | Marketplace host profiles                    |
| `users`                  | User accounts and authentication             |

## Project Structure

```
alot/
├── backend/
│   ├── app/
│   │   ├── core/           # Configuration, security, database
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helpers (crypto, validation)
│   │   └── main.py         # FastAPI application
│   ├── tests/              # Backend tests
│   ├── alembic/            # Database migrations
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helper functions
│   ├── public/             # Static assets
│   ├── package.json
│   └── Dockerfile
├── docs/                   # Comprehensive documentation
├── scripts/                # Setup and deployment scripts
├── config/                 # Configuration files
├── .antigravity/           # Antigravity IDE metadata
└── docker-compose.yml      # Local development stack
```

## Quick Start (For Antigravity IDE)

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose
- Stripe API keys

### Setup Commands

```bash
# Backend setup
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
alembic upgrade head

# Frontend setup
cd frontend
npm install

# Start full stack
docker-compose up -d
```

### Environment Variables Required

**Backend (.env)**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/alot
REDIS_URL=redis://localhost:6379/0
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
JWT_SECRET_KEY=...
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:8006
VITE_WS_URL=ws://localhost:8007
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Deployment Strategy

### Development
- Local Docker Compose stack
- Hot reload for both frontend and backend
- Seeded test data

### Staging
- AWS ECS or Kubernetes
- Blue-green deployment
- Stripe test mode
- Full monitoring

### Production
- Multi-region AWS deployment
- Auto-scaling
- Stripe production mode
- Full observability stack

## Legal & Compliance (IMPORTANT)

⚠️ **Legal Review Required Before Launch**

Key items to finalize:
1. Exact funded-lot non-winner credit formula
2. Dream collectible redemption mechanics
3. Host marketplace custody/fulfillment model
4. Gambling classification per jurisdiction
5. Age/geo restrictions
6. Chargeback handling in funded lots
7. Terms of Service and Privacy Policy
8. Host agreement and liability

## Development Roadmap

### Phase 1: Foundation (MVP)
- [ ] Database schema and migrations
- [ ] User authentication and profiles
- [ ] Lot creation (platform lots only)
- [ ] Entry purchase flow (cash only)
- [ ] Basic lot discovery UI

### Phase 2: Core Mechanics
- [ ] Provably fair draw engine
- [ ] Settlement logic (funded/expired)
- [ ] Stash Credits ledger
- [ ] Credit entry purchases
- [ ] Lot lifecycle automation

### Phase 3: Advanced Features
- [ ] Trivia gate system
- [ ] Marketplace (Host lots)
- [ ] Dream collectible redemption
- [ ] Fulfillment tracking
- [ ] Advanced analytics

### Phase 4: Scale & Polish
- [ ] Performance optimization
- [ ] Real-time updates (WebSocket)
- [ ] Mobile responsiveness
- [ ] Admin dashboard
- [ ] Full monitoring and observability

## Cost Estimates

### Development
- Backend: ~80-120 hours
- Frontend: ~100-140 hours
- Infrastructure: ~40-60 hours
- Testing: ~60-80 hours
- **Total:** ~280-400 hours

### Monthly Operational Costs
- **Infrastructure:** $200-500 (AWS, hosting, databases)
- **Stripe Fees:** 2.9% + $0.30 per transaction
- **Monitoring:** $50-100 (Sentry, PostHog)
- **CDN/Storage:** $50-150
- **Total:** ~$300-750/month (excluding transaction volume)

## Documentation

See `/docs` directory for:
- `ARCHITECTURE.md` — Detailed system architecture
- `DATABASE_SCHEMA.md` — Complete database design
- `API_SPECIFICATION.md` — REST API documentation
- `LEGAL_MECHANICS.md` — Full mechanics for legal review
- `DEPLOYMENT_GUIDE.md` — Production deployment steps
- `CONTRIBUTING.md` — Development guidelines

## Support & Contact

- **Project Owner:** Pietro Novelli
- **Documentation Date:** January 5, 2026
- **Framework Created:** February 9, 2026
- **Status:** Base framework ready for Antigravity IDE deployment

---

**Note:** This is a foundational architecture designed for Antigravity IDE to fully deploy and manage. All core systems are defined, documented, and structured for rapid development and deployment.
