-- Phase 1: Add product metadata columns to product_classes
-- 1.1 Add description column (nullable TEXT)
ALTER TABLE public.product_classes 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 1.2 Add traits column (TEXT array with empty default)
ALTER TABLE public.product_classes 
ADD COLUMN IF NOT EXISTS traits TEXT[] DEFAULT '{}';