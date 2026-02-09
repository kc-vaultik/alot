# ALOT! Platform Architecture

## System Overview

ALOT! is a three-layer architecture combining:
1. **Lot Engine** - Campaign lifecycle management
2. **Draw Engine** - Provably fair winner selection
3. **Credit Economy** - Closed-loop retention system

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Layer                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │   Web App  │  │   Mobile   │  │   Admin    │             │
│  │  (React)   │  │  (Future)  │  │  Dashboard │             │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘             │
└────────┼───────────────┼───────────────┼────────────────────┘
         │               │               │
         └───────────────┴───────────────┘
                         │
                    API Gateway
                         │
┌────────────────────────┼────────────────────────────────────┐
│                  Application Layer                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              FastAPI Backend                         │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │   Lot    │  │   Draw   │  │  Credit  │          │    │
│  │  │  Engine  │  │  Engine  │  │  Economy │          │    │
│  │  └──────────┘  └──────────┘  └──────────┘          │    │
│  │                                                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │Marketplace│ │  Trivia  │  │Fulfillment│         │    │
│  │  │  System  │  │  System  │  │  System  │          │    │
│  │  └──────────┘  └──────────┘  └──────────┘          │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────▼───────┐ ┌────▼──────┐ ┌─────▼────────┐
│   PostgreSQL   │ │   Redis   │ │   Celery     │
│   (Primary)    │ │  (Cache)  │ │   (Tasks)    │
└────────────────┘ └───────────┘ └──────────────┘
         │
┌────────▼───────────────────────────────────────────────────┐
│                  Integration Layer                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ Stripe  │  │   AWS   │  │ Sentry  │  │PostHog  │      │
│  │(Payment)│  │   S3    │  │ (Error) │  │(Analytics)│     │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
└────────────────────────────────────────────────────────────┘
```

## Core Systems

### 1. Lot Engine

**Responsibility:** Manage lot lifecycle from creation to settlement

**Components:**
- **Lot Creator:** Validate and persist lot configuration
- **Funding Tracker:** Real-time funding progress monitoring
- **State Machine:** Manage lot state transitions
- **Entry Allocator:** Sequential ticket assignment
- **Settlement Orchestrator:** Execute outcome logic

**State Machine:**
```
     ┌─────────────────────┐
     │       CREATED       │
     └──────────┬──────────┘
                ▼
     ┌─────────────────────┐
     │        OPEN         │◄────┐
     │  (Accepting entries)│     │
     └──────┬──────────────┘     │
            │                     │
       ┌────┴────┐               │
       │         │               │
   Target    Deadline         Refund
   Reached   Reached          Extended
       │         │               │
       ▼         ▼               │
  ┌────────┐  ┌────────┐        │
  │FUNDED  │  │EXPIRED │────────┘
  └───┬────┘  └───┬────┘
      │           │
      ▼           ▼
  ┌────────┐  ┌──────────┐
  │DRAWING │  │REFUNDING │
  └───┬────┘  └─────┬────┘
      │             │
      ▼             ▼
  ┌────────┐  ┌──────────┐
  │SETTLED │  │ CLOSED   │
  └────────┘  └──────────┘
```

### 2. Draw Engine

**Responsibility:** Cryptographically fair winner selection

**Algorithm:**
```python
# Step 1: Generate server seed (created at lot creation)
server_seed = secrets.token_hex(32)  # 64-char hex

# Step 2: Derive client seed from lot data
client_seed_input = f"{lot_id}:{created_at}:{total_tickets}:{escrow_balance}"
client_seed = hashlib.sha256(client_seed_input.encode()).hexdigest()

# Step 3: Combine seeds with nonce
nonce = 0
combined_input = f"{server_seed}{client_seed}{nonce}"
combined_seed = hashlib.sha256(combined_input.encode()).hexdigest()

# Step 4: Compute winning ticket
first_8_hex = combined_seed[:8]
random_number = int(first_8_hex, 16)
winning_ticket = 1 + (random_number % total_tickets)

# Step 5: Map to winner
winner_user_id = find_user_by_ticket(winning_ticket)
```

**Audit Trail:**
- All seeds stored before draw
- Combined seed and winning ticket persisted
- Timestamp of draw execution
- Verifiable by any party with read access

### 3. Credit Economy

**Responsibility:** Manage closed-loop value system

**Credit Lifecycle:**
```
      Purchase         Funded Lot           Spent on
      Failed    ┌───►  Non-Winner  ────┐    Future
        │       │         │             │    Entries
        │       │         ▼             │      │
        │       │    Issue Credits      │      │
        │       │         │             │      │
        ▼       │         └─────────────┤      ▼
    98% Refund  │                       │   Consume
       OR       │                       ▼    Credits
    1.5× Credit │              User Credit Balance
    Conversion  │                       │
        │       │                       │
        └───────┤                       │
                │                       ▼
                │              Dream Collectible
                │               Redemption (Future)
                │                       │
                └───────────────────────┘
```

**Value Equation:**
- 1 Credit = $0.01 platform value
- 100 Credits = 1 entry
- Non-cashable, non-transferable
- Issuance funded by lot economics (2.5× target)

### 4. Marketplace System

**Responsibility:** Enable Host/Creator lot creation

**Two-Sided Model:**

**Platform Lots:**
- Created by ALOT!
- Full inventory control
- Marketed to all users
- Platform assumes all risk

**Host Lots:**
- Created by approved Hosts
- Host supplies product
- Can be private (own audience) or public (marketplace)
- Revenue sharing model

**Custody Models (TBD - Choose One):**

**Model A: Platform Custody**
- Product transferred to ALOT! before listing
- Platform ships to winner
- Highest trust, lowest fraud risk
- Platform liability for fulfillment

**Model B: Host Fulfillment**
- Host retains custody until draw
- Host ships to winner
- Lower platform overhead
- Requires host escrow/deposit

**Model C: Hybrid Escrow**
- Product verified before listing
- Held by third-party escrow
- Released to winner post-draw
- Neutral trust model

## Data Layer Architecture

### Database Schema (Core Tables)

#### `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    date_of_birth DATE,
    verified_email BOOLEAN DEFAULT FALSE,
    verified_identity BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    stripe_customer_id VARCHAR(255),
    total_entries INTEGER DEFAULT 0,
    total_won INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' -- active, suspended, banned
);
```

#### `product_classes`
```sql
CREATE TABLE product_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(50), -- watch, bag, memorabilia
    tier VARCHAR(20), -- ICON, RARE, GRAIL, MYTHIC
    retail_value DECIMAL(12, 2) NOT NULL,
    description TEXT,
    specifications JSONB,
    images JSONB, -- Array of image URLs
    authenticity_certificate_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `rooms` (Lots)
```sql
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_class_id UUID REFERENCES product_classes(id),
    host_id UUID REFERENCES hosts(id), -- NULL for platform lots

    -- Configuration
    lot_type VARCHAR(20), -- known, mystery
    funding_target DECIMAL(12, 2) NOT NULL,
    deadline TIMESTAMP NOT NULL,

    -- State
    status VARCHAR(20) DEFAULT 'created', -- created, open, funded, drawing, settled, expired, refunding
    current_funding DECIMAL(12, 2) DEFAULT 0,
    total_tickets INTEGER DEFAULT 0,

    -- Entry pricing
    entry_bundles JSONB, -- [{amount: 2, tickets: 2}, ...]

    -- Marketplace
    visibility VARCHAR(20) DEFAULT 'public', -- public, private, unlisted
    marketplace_listed BOOLEAN DEFAULT TRUE,

    -- Trivia
    trivia_enabled BOOLEAN DEFAULT TRUE,
    trivia_question TEXT,
    trivia_answer_hash VARCHAR(64),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    opened_at TIMESTAMP,
    funded_at TIMESTAMP,
    drawn_at TIMESTAMP,
    settled_at TIMESTAMP,
    expired_at TIMESTAMP
);
```

#### `room_entries`
```sql
CREATE TABLE room_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id),
    user_id UUID REFERENCES users(id),

    -- Entry details
    tickets_start INTEGER NOT NULL,
    tickets_end INTEGER NOT NULL,
    ticket_count INTEGER NOT NULL,

    -- Purchase
    amount_paid DECIMAL(12, 2), -- NULL if credit purchase
    credits_spent INTEGER DEFAULT 0,
    purchase_id UUID REFERENCES room_entry_purchases(id),

    -- Outcome
    is_winner BOOLEAN DEFAULT FALSE,
    credits_awarded INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_room_entries_room ON room_entries(room_id);
CREATE INDEX idx_room_entries_user ON room_entries(user_id);
CREATE INDEX idx_room_entries_tickets ON room_entries(tickets_start, tickets_end);
```

#### `room_entry_purchases`
```sql
CREATE TABLE room_entry_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id),
    user_id UUID REFERENCES users(id),

    -- Payment
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_checkout_session_id VARCHAR(255),

    -- Status
    status VARCHAR(20), -- pending, succeeded, failed, refunded

    -- Refund (expired lots only)
    refund_choice VARCHAR(20), -- cash, credits
    refunded_amount DECIMAL(12, 2),
    refunded_at TIMESTAMP,
    stripe_refund_id VARCHAR(255),

    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

#### `lottery_draws`
```sql
CREATE TABLE lottery_draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) UNIQUE,

    -- Draw inputs
    server_seed VARCHAR(64) NOT NULL,
    client_seed VARCHAR(64) NOT NULL,
    nonce INTEGER DEFAULT 0,
    total_tickets INTEGER NOT NULL,

    -- Draw computation
    combined_seed VARCHAR(64) NOT NULL,
    winning_ticket INTEGER NOT NULL,
    winner_user_id UUID REFERENCES users(id),

    -- Audit
    drawn_at TIMESTAMP DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE
);
```

#### `user_universal_credits`
```sql
CREATE TABLE user_universal_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),

    -- Balance
    balance INTEGER DEFAULT 0, -- In credits (100 = $1 equivalent)

    -- Lifetime stats
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id)
);
```

#### `credit_transactions`
```sql
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),

    -- Transaction
    amount INTEGER NOT NULL, -- Positive for earn, negative for spend
    balance_after INTEGER NOT NULL,
    transaction_type VARCHAR(50), -- lot_settlement, expired_conversion, entry_purchase, redemption

    -- References
    room_id UUID REFERENCES rooms(id),
    room_entry_id UUID REFERENCES room_entries(id),

    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_tx_created ON credit_transactions(created_at DESC);
```

#### `room_trivia_attempts`
```sql
CREATE TABLE room_trivia_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id),
    user_id UUID REFERENCES users(id),

    -- Attempt
    attempt_number INTEGER, -- 1, 2, 3
    answer_submitted TEXT,
    is_correct BOOLEAN,

    -- Cooldown
    failed_all_attempts BOOLEAN DEFAULT FALSE,
    cooldown_until TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(room_id, user_id, attempt_number)
);
```

#### `reveals` (Digital Cards)
```sql
CREATE TABLE reveals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    room_id UUID REFERENCES rooms(id),

    -- Card state
    status VARCHAR(20), -- pending, lost, won, claimed, shipped
    revealed_at TIMESTAMP,

    -- Fulfillment (if won)
    claimed_at TIMESTAMP,
    shipping_address JSONB,
    tracking_number VARCHAR(255),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `hosts` (Marketplace)
```sql
CREATE TABLE hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),

    -- Profile
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),

    -- Status
    approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, suspended

    -- Economics
    revenue_share_percentage DECIMAL(5, 2), -- e.g., 10.00 for 10%
    stripe_connect_account_id VARCHAR(255),

    -- Stats
    total_lots_created INTEGER DEFAULT 0,
    total_lots_funded INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW()
);
```

## API Architecture

### REST API Endpoints

**Authentication:**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

**Lots:**
- `GET /api/lots` - List/filter lots (discovery)
- `GET /api/lots/{id}` - Get lot details
- `POST /api/lots` - Create lot (admin/host)
- `PATCH /api/lots/{id}` - Update lot
- `GET /api/lots/{id}/entries` - Get entries leaderboard

**Entries:**
- `POST /api/lots/{id}/entries/purchase` - Buy entries (cash)
- `POST /api/lots/{id}/entries/purchase-with-credits` - Buy entries (credits)
- `GET /api/users/me/entries` - My entries across all lots

**Trivia:**
- `POST /api/lots/{id}/trivia/attempt` - Submit trivia answer
- `GET /api/lots/{id}/trivia/status` - Check cooldown status

**Credits:**
- `GET /api/users/me/credits` - My credit balance
- `GET /api/users/me/credits/transactions` - Credit transaction history

**Payments:**
- `POST /api/payments/create-checkout-session` - Create Stripe session
- `POST /api/webhooks/stripe` - Stripe webhook handler

**Fulfillment:**
- `POST /api/reveals/{id}/claim` - Claim won item
- `PATCH /api/reveals/{id}/shipping` - Update shipping info
- `GET /api/reveals/{id}/tracking` - Get shipment tracking

**Admin:**
- `POST /api/admin/lots/{id}/draw` - Execute draw
- `POST /api/admin/lots/{id}/settle` - Execute settlement
- `GET /api/admin/analytics` - Platform analytics

**Marketplace (Host):**
- `POST /api/hosts/apply` - Apply to become host
- `GET /api/hosts/me` - My host profile
- `POST /api/hosts/me/lots` - Create host lot
- `GET /api/hosts/{id}/lots` - Host's public lots

### WebSocket Events

**Connection:**
```javascript
ws://api/ws?token=<jwt_token>
```

**Client → Server:**
- `subscribe_lot:{lot_id}` - Subscribe to lot updates
- `unsubscribe_lot:{lot_id}` - Unsubscribe

**Server → Client:**
- `lot_update:{lot_id}` - Funding progress update
- `lot_funded:{lot_id}` - Lot reached target
- `draw_started:{lot_id}` - Draw in progress
- `draw_completed:{lot_id}` - Winner announced
- `lot_expired:{lot_id}` - Lot deadline reached

## Security Architecture

### Authentication Flow

```
1. User registers → Email verification
2. User logs in → JWT access token (15 min) + refresh token (7 days)
3. Client stores tokens in httpOnly cookies
4. Access token sent with each API request
5. Token expires → Auto-refresh using refresh token
6. Refresh token expires → Re-login required
```

### Payment Security

- Stripe Checkout for PCI compliance
- Webhook signature verification
- Idempotency keys for all payment operations
- Double-entry accounting for credits
- Transaction logs for audit

### Data Protection

- Passwords hashed with bcrypt (cost factor 12)
- Sensitive PII encrypted at rest
- TLS 1.3 for all connections
- CORS configured for frontend origin only
- Rate limiting on all endpoints

## Scalability Considerations

### Caching Strategy

**Redis Layers:**
- **L1 (Hot):** Active lot data (funding, ticket count)
- **L2 (Warm):** User balances, leaderboards
- **L3 (Cold):** Historical data

**Cache Invalidation:**
- Write-through for lot updates
- Event-based invalidation for settlements
- TTL-based expiry for read-heavy data

### Database Optimization

**Indexes:**
- Composite indexes on (room_id, user_id)
- Partial indexes on active lots
- GiST indexes for timestamp ranges

**Partitioning:**
- Partition `room_entries` by `room_id`
- Partition `credit_transactions` by month
- Archive closed lots to separate table

### Task Queue (Celery)

**Scheduled Tasks:**
- Check lot deadlines every 1 minute
- Execute expired lot refunds
- Send reminder emails
- Cleanup old sessions

**Event Tasks:**
- Execute draw (async after funding)
- Process settlements (parallel credit issuance)
- Send winner notifications
- Stripe webhook processing

## Monitoring & Observability

### Metrics

**Business Metrics:**
- Lots created/funded/expired per day
- Conversion rate (open → funded)
- Average time to funding
- Credit issuance vs spend
- Revenue per lot

**Technical Metrics:**
- API response times (p50, p95, p99)
- Database query performance
- Cache hit rate
- WebSocket connection count
- Task queue length

### Logging

**Structured Logs (JSON):**
```json
{
  "timestamp": "2026-02-09T10:30:00Z",
  "level": "INFO",
  "service": "lot-engine",
  "event": "lot_funded",
  "lot_id": "uuid",
  "funding_target": 5000.00,
  "final_funding": 5123.50,
  "total_tickets": 2561,
  "duration_seconds": 86400
}
```

### Alerting

**Critical Alerts:**
- Draw execution failures
- Payment webhook processing failures
- Database connection pool exhaustion
- High error rate (>1%)

**Warning Alerts:**
- Slow API responses (>500ms p95)
- Low cache hit rate (<80%)
- Task queue backlog (>100)

## Deployment Architecture

### Development
```
Docker Compose:
- Backend (FastAPI)
- Frontend (Vite dev server)
- PostgreSQL
- Redis
- Celery worker
- Mailhog (email testing)
```

### Production
```
AWS Infrastructure:
- ECS/Fargate for containers
- RDS PostgreSQL (Multi-AZ)
- ElastiCache Redis (cluster mode)
- ALB for load balancing
- S3 + CloudFront for static assets
- Route53 for DNS
- ACM for TLS certificates
```

---

**Last Updated:** February 9, 2026
**Status:** Base Architecture - Ready for Antigravity IDE
