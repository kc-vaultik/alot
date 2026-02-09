-- Phase 1.1: Add promo bucket to enum (must be committed separately)
ALTER TYPE public.award_bucket ADD VALUE IF NOT EXISTS 'promo';