# ALOT! Database Schema

Complete PostgreSQL database schema for ALOT! platform.

## Entity Relationship Diagram

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       ├──────────────────────────────────┐
       │                                   │
       ▼                                   ▼
┌─────────────────┐              ┌──────────────────┐
│user_universal_  │              │     reveals      │
│    credits      │              │ (digital cards)  │
└─────────────────┘              └──────────────────┘
       │
       ▼
┌──────────────────┐
│credit_transactions│
└──────────────────┘

┌──────────────┐
│product_classes│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    rooms     │◄──────┐
│   (lots)     │       │
└──────┬───────┘       │
       │               │
       ├───────────────┼──────────────┐
       │               │              │
       ▼               │              ▼
┌─────────────┐       │     ┌──────────────┐
│room_entries │       │     │lottery_draws │
└──────┬──────┘       │     └──────────────┘
       │              │
       ▼              │
┌─────────────────┐  │
│room_entry_      │  │
│  purchases      │  │
└─────────────────┘  │
       │             │
       ▼             │
┌──────────────────┐ │
│room_trivia_      │ │
│   attempts       │◄┘
└──────────────────┘

┌─────────┐
│  hosts  │
└────┬────┘
     │
     └──────► rooms (host_id FK)
```

## Core Tables

### users

User accounts and authentication.

```sql
CREATE TABLE users (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,

    -- Profile
    full_name VARCHAR(255),
    date_of_birth DATE,
    phone_number VARCHAR(20),
    avatar_url VARCHAR(500),

    -- Verification
    verified_email BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    verified_identity BOOLEAN DEFAULT FALSE,

    -- Payment
    stripe_customer_id VARCHAR(255) UNIQUE,

    -- Stats
    total_entries INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    total_won INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, banned

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_stripe ON users(stripe_customer_id);
```

### product_classes

Collectible product catalog.

```sql
CREATE TABLE product_classes (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE,

    -- Product Info
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(50) NOT NULL, -- watch, bag, memorabilia, sneaker, etc.

    -- Valuation
    tier VARCHAR(20) NOT NULL, -- ICON, RARE, GRAIL, MYTHIC
    retail_value DECIMAL(12, 2) NOT NULL,
    appraised_value DECIMAL(12, 2),

    -- Description
    description TEXT,
    specifications JSONB, -- {movement: "automatic", case_size: "42mm", ...}
    condition VARCHAR(50), -- new, excellent, good, fair

    -- Media
    images JSONB NOT NULL, -- ["https://cdn.../img1.jpg", ...]
    videos JSONB, -- ["https://cdn.../video1.mp4"]

    -- Authenticity
    authenticity_certificate_url VARCHAR(500),
    serial_number VARCHAR(255),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category ON product_classes(category);
CREATE INDEX idx_products_tier ON product_classes(tier);
CREATE INDEX idx_products_retail_value ON product_classes(retail_value);
```

### rooms

Lot Room definitions and state.

```sql
CREATE TABLE rooms (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_class_id UUID NOT NULL REFERENCES product_classes(id),
    host_id UUID REFERENCES hosts(id), -- NULL for platform lots

    -- Configuration
    lot_type VARCHAR(20) NOT NULL DEFAULT 'known', -- known, mystery
    funding_target DECIMAL(12, 2) NOT NULL,
    deadline TIMESTAMP NOT NULL,

    -- State
    status VARCHAR(20) DEFAULT 'created',
    -- created, open, funded, drawing, settled, expired, refunding, closed
    current_funding DECIMAL(12, 2) DEFAULT 0,
    total_tickets INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,

    -- Entry Pricing
    entry_bundles JSONB NOT NULL,
    -- LOW_VALUE: [{"amount": 2, "tickets": 2}, {"amount": 5, "tickets": 5}, ...]
    -- HIGH_VALUE: [{"amount": 25, "tickets": 25}, ...]

    -- Marketplace
    visibility VARCHAR(20) DEFAULT 'public', -- public, private, unlisted
    marketplace_listed BOOLEAN DEFAULT TRUE,
    shareable_link VARCHAR(255) UNIQUE,

    -- Trivia
    trivia_enabled BOOLEAN DEFAULT TRUE,
    trivia_question TEXT,
    trivia_answer_hash VARCHAR(64), -- SHA256 hash of correct answer
    trivia_attempts_allowed INTEGER DEFAULT 3,
    trivia_cooldown_minutes INTEGER DEFAULT 60,

    -- Mystery Lot
    mystery_revealed BOOLEAN DEFAULT FALSE,
    mystery_reveal_threshold DECIMAL(5, 2), -- e.g., 0.50 for 50% funding

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    opened_at TIMESTAMP,
    funded_at TIMESTAMP,
    drawn_at TIMESTAMP,
    settled_at TIMESTAMP,
    expired_at TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_deadline ON rooms(deadline);
CREATE INDEX idx_rooms_product ON rooms(product_class_id);
CREATE INDEX idx_rooms_host ON rooms(host_id);
CREATE INDEX idx_rooms_open_active ON rooms(status, deadline) WHERE status = 'open';
```

### room_entries

User participation in lots (ticket allocations).

```sql
CREATE TABLE room_entries (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),

    -- Tickets
    tickets_start INTEGER NOT NULL,
    tickets_end INTEGER NOT NULL,
    ticket_count INTEGER NOT NULL,

    -- Purchase Method
    purchase_type VARCHAR(20) NOT NULL, -- cash, credits, trivia
    amount_paid DECIMAL(12, 2), -- NULL if credit/trivia purchase
    credits_spent INTEGER DEFAULT 0,
    purchase_id UUID REFERENCES room_entry_purchases(id),

    -- Outcome (populated after settlement)
    is_winner BOOLEAN DEFAULT FALSE,
    credits_awarded INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_room_entries_room ON room_entries(room_id);
CREATE INDEX idx_room_entries_user ON room_entries(user_id);
CREATE INDEX idx_room_entries_tickets ON room_entries(room_id, tickets_start, tickets_end);
CREATE INDEX idx_room_entries_user_room ON room_entries(user_id, room_id);
```

### room_entry_purchases

Payment transactions for entry purchases.

```sql
CREATE TABLE room_entry_purchases (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Payment Amount
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Stripe
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_checkout_session_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending, succeeded, failed, refunded, partially_refunded

    -- Refund (expired lots only)
    refund_eligible BOOLEAN DEFAULT FALSE,
    refund_choice VARCHAR(20), -- cash, credits, NULL if not chosen
    refunded_amount DECIMAL(12, 2),
    refunded_at TIMESTAMP,
    stripe_refund_id VARCHAR(255),
    credits_converted INTEGER, -- If chose credits

    -- Chargeback
    disputed BOOLEAN DEFAULT FALSE,
    disputed_at TIMESTAMP,
    dispute_status VARCHAR(20), -- needs_response, under_review, won, lost

    -- Metadata
    metadata JSONB, -- {ip_address, user_agent, ...}

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchases_room ON room_entry_purchases(room_id);
CREATE INDEX idx_purchases_user ON room_entry_purchases(user_id);
CREATE INDEX idx_purchases_stripe_intent ON room_entry_purchases(stripe_payment_intent_id);
CREATE INDEX idx_purchases_status ON room_entry_purchases(status);
```

### lottery_draws

Provably fair draw audit trail.

```sql
CREATE TABLE lottery_draws (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL UNIQUE REFERENCES rooms(id),

    -- Draw Inputs
    server_seed VARCHAR(64) NOT NULL, -- Generated at lot creation
    client_seed VARCHAR(64) NOT NULL, -- Derived from lot data
    nonce INTEGER DEFAULT 0,
    total_tickets INTEGER NOT NULL,

    -- Draw Computation
    combined_seed VARCHAR(64) NOT NULL, -- SHA256(server + client + nonce)
    winning_ticket INTEGER NOT NULL,

    -- Winner
    winner_user_id UUID NOT NULL REFERENCES users(id),
    winner_entry_id UUID NOT NULL REFERENCES room_entries(id),

    -- Audit
    drawn_at TIMESTAMP DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE,
    verification_details JSONB -- {verified_by, verified_at, notes}
);

CREATE INDEX idx_draws_room ON lottery_draws(room_id);
CREATE INDEX idx_draws_winner ON lottery_draws(winner_user_id);
```

### user_universal_credits

User credit balances.

```sql
CREATE TABLE user_universal_credits (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),

    -- Balance
    balance INTEGER DEFAULT 0, -- In credits (100 credits = $1 equivalent)

    -- Lifetime Stats
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    total_expired INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_credits_user ON user_universal_credits(user_id);
```

### credit_transactions

Credit transaction ledger.

```sql
CREATE TABLE credit_transactions (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Transaction
    amount INTEGER NOT NULL, -- Positive = earned, Negative = spent
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,

    -- Type
    transaction_type VARCHAR(50) NOT NULL,
    -- lot_settlement, expired_conversion, entry_purchase,
    -- admin_grant, admin_deduct, redemption, expiry

    -- References
    room_id UUID REFERENCES rooms(id),
    room_entry_id UUID REFERENCES room_entries(id),
    purchase_id UUID REFERENCES room_entry_purchases(id),

    -- Description
    description TEXT,
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_tx_created ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_tx_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_tx_room ON credit_transactions(room_id);
```

### room_trivia_attempts

Trivia gate attempt tracking.

```sql
CREATE TABLE room_trivia_attempts (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),

    -- Attempt
    attempt_number INTEGER NOT NULL, -- 1, 2, 3
    answer_submitted TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,

    -- Cooldown
    failed_all_attempts BOOLEAN DEFAULT FALSE,
    cooldown_until TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(room_id, user_id, attempt_number)
);

CREATE INDEX idx_trivia_room_user ON room_trivia_attempts(room_id, user_id);
CREATE INDEX idx_trivia_cooldown ON room_trivia_attempts(user_id, cooldown_until)
    WHERE failed_all_attempts = TRUE;
```

### reveals

Digital cards/assets representing user participation.

```sql
CREATE TABLE reveals (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    room_id UUID NOT NULL REFERENCES rooms(id),
    room_entry_id UUID NOT NULL REFERENCES room_entries(id),

    -- Card State
    status VARCHAR(20) DEFAULT 'pending',
    -- pending, revealed_lost, revealed_won, claimed, fulfillment, shipped, delivered

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    revealed_at TIMESTAMP,
    claimed_at TIMESTAMP,

    -- Fulfillment (if won)
    shipping_address JSONB, -- {name, address1, address2, city, state, zip, country}
    tracking_number VARCHAR(255),
    carrier VARCHAR(50),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    delivery_confirmed_by VARCHAR(20), -- carrier, user

    -- Issues
    issue_reported BOOLEAN DEFAULT FALSE,
    issue_type VARCHAR(50), -- damaged, lost, wrong_item, not_authentic
    issue_description TEXT,
    issue_reported_at TIMESTAMP,
    issue_resolved BOOLEAN DEFAULT FALSE,

    UNIQUE(user_id, room_id)
);

CREATE INDEX idx_reveals_user ON reveals(user_id);
CREATE INDEX idx_reveals_room ON reveals(room_id);
CREATE INDEX idx_reveals_status ON reveals(status);
```

## Marketplace Tables

### hosts

Marketplace host profiles.

```sql
CREATE TABLE hosts (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),

    -- Profile
    display_name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE, -- URL-friendly identifier
    description TEXT,
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    website_url VARCHAR(500),

    -- Social
    instagram_handle VARCHAR(100),
    twitter_handle VARCHAR(100),
    youtube_channel VARCHAR(100),

    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    -- pending, approved, suspended, banned
    approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),

    -- Economics
    revenue_share_percentage DECIMAL(5, 2) DEFAULT 0.00,
    -- e.g., 10.00 = Host gets 10% of margin
    listing_fee DECIMAL(10, 2) DEFAULT 0.00,

    -- Stripe Connect
    stripe_connect_account_id VARCHAR(255) UNIQUE,
    stripe_onboarding_completed BOOLEAN DEFAULT FALSE,

    -- Stats
    total_lots_created INTEGER DEFAULT 0,
    total_lots_funded INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,

    -- Settings
    auto_approve_lots BOOLEAN DEFAULT FALSE,
    require_custody_proof BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hosts_user ON hosts(user_id);
CREATE INDEX idx_hosts_slug ON hosts(slug);
CREATE INDEX idx_hosts_status ON hosts(status);
```

## Admin Tables

### admin_users

Admin accounts with role-based permissions.

```sql
CREATE TABLE admin_users (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),

    -- Role
    role VARCHAR(20) NOT NULL,
    -- super_admin, admin, moderator, support

    -- Permissions
    permissions JSONB NOT NULL,
    -- {can_create_lots, can_execute_draws, can_manage_hosts, ...}

    -- Status
    active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    last_action_at TIMESTAMP
);
```

### audit_logs

System audit trail.

```sql
CREATE TABLE audit_logs (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Actor
    user_id UUID REFERENCES users(id),
    admin_user_id UUID REFERENCES admin_users(id),

    -- Action
    action VARCHAR(100) NOT NULL,
    -- lot_created, draw_executed, user_suspended, refund_processed, etc.
    entity_type VARCHAR(50), -- lot, user, host, transaction
    entity_id UUID,

    -- Details
    details JSONB,
    ip_address INET,
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_admin ON audit_logs(admin_user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

## Indexes Summary

### Performance Indexes
```sql
-- Most frequently queried combinations
CREATE INDEX idx_active_lots ON rooms(status, deadline) WHERE status IN ('open', 'funded');
CREATE INDEX idx_user_active_entries ON room_entries(user_id, room_id) WHERE is_winner = FALSE;
CREATE INDEX idx_recent_purchases ON room_entry_purchases(created_at DESC, status);

-- Leaderboards and rankings
CREATE INDEX idx_user_stats ON users(total_won DESC, total_entries DESC);
CREATE INDEX idx_lot_funding ON rooms(current_funding DESC) WHERE status = 'open';
```

## Constraints & Business Rules

### Check Constraints
```sql
-- Ensure valid ticket ranges
ALTER TABLE room_entries
    ADD CONSTRAINT chk_ticket_range
    CHECK (tickets_end >= tickets_start);

ALTER TABLE room_entries
    ADD CONSTRAINT chk_ticket_count
    CHECK (ticket_count = tickets_end - tickets_start + 1);

-- Ensure valid funding
ALTER TABLE rooms
    ADD CONSTRAINT chk_funding_positive
    CHECK (funding_target > 0 AND current_funding >= 0);

-- Ensure valid credit amounts
ALTER TABLE user_universal_credits
    ADD CONSTRAINT chk_balance_positive
    CHECK (balance >= 0);

ALTER TABLE credit_transactions
    ADD CONSTRAINT chk_balance_consistency
    CHECK (balance_after = balance_before + amount);
```

### Triggers

**Update room funding on entry:**
```sql
CREATE OR REPLACE FUNCTION update_room_funding()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE rooms
    SET current_funding = current_funding + NEW.amount_paid,
        total_tickets = total_tickets + NEW.ticket_count,
        total_participants = (
            SELECT COUNT(DISTINCT user_id)
            FROM room_entries
            WHERE room_id = NEW.room_id
        )
    WHERE id = NEW.room_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_room_funding
AFTER INSERT ON room_entries
FOR EACH ROW
WHEN (NEW.amount_paid IS NOT NULL)
EXECUTE FUNCTION update_room_funding();
```

**Update credit balance:**
```sql
CREATE OR REPLACE FUNCTION update_credit_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_universal_credits
    SET balance = NEW.balance_after,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_credit_balance
AFTER INSERT ON credit_transactions
FOR EACH ROW
EXECUTE FUNCTION update_credit_balance();
```

## Views

### Active Lots Dashboard
```sql
CREATE VIEW v_active_lots AS
SELECT
    r.id,
    r.status,
    r.funding_target,
    r.current_funding,
    r.current_funding / r.funding_target * 100 AS funding_percentage,
    r.total_tickets,
    r.total_participants,
    r.deadline,
    EXTRACT(EPOCH FROM (r.deadline - NOW())) / 3600 AS hours_remaining,
    p.name AS product_name,
    p.brand AS product_brand,
    p.tier,
    p.retail_value,
    p.images->0 AS primary_image,
    h.display_name AS host_name
FROM rooms r
JOIN product_classes p ON r.product_class_id = p.id
LEFT JOIN hosts h ON r.host_id = h.id
WHERE r.status IN ('open', 'funded')
ORDER BY r.deadline ASC;
```

### User Dashboard
```sql
CREATE VIEW v_user_dashboard AS
SELECT
    u.id AS user_id,
    u.username,
    u.total_entries,
    u.total_won,
    uc.balance AS credit_balance,
    COUNT(DISTINCT re.room_id) AS active_lots,
    COALESCE(SUM(re.ticket_count), 0) AS total_active_tickets
FROM users u
LEFT JOIN user_universal_credits uc ON u.id = uc.user_id
LEFT JOIN room_entries re ON u.id = re.user_id
LEFT JOIN rooms r ON re.room_id = r.id AND r.status = 'open'
GROUP BY u.id, u.username, u.total_entries, u.total_won, uc.balance;
```

---

**Last Updated:** February 9, 2026
**Status:** Complete Schema - Ready for Implementation
