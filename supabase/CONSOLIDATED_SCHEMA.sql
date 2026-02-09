-- Create website content management tables

-- Website content table for dynamic CMS
CREATE TABLE public.website_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL,
  content JSONB NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section_key, language)
);

-- Brands table for luxury brand management
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  category_ids UUID[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Categories table for authentication categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  slug TEXT NOT NULL UNIQUE,
  authentication_methods TEXT[],
  base_price DECIMAL(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Authentication methods table
CREATE TABLE public.authentication_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  category_specific_pricing JSONB,
  features TEXT[],
  duration_days INTEGER NOT NULL DEFAULT 7,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authentication_methods ENABLE ROW LEVEL SECURITY;

-- Create public read policies (website content should be publicly readable)
CREATE POLICY "Website content is publicly readable"
ON public.website_content
FOR SELECT
USING (is_active = true);

CREATE POLICY "Brands are publicly readable"
ON public.brands
FOR SELECT
USING (is_active = true);

CREATE POLICY "Categories are publicly readable"
ON public.categories
FOR SELECT
USING (is_active = true);

CREATE POLICY "Authentication methods are publicly readable"
ON public.authentication_methods
FOR SELECT
USING (is_active = true);

-- Create admin policies (only authenticated admin users can modify)
CREATE POLICY "Admin can manage website content"
ON public.website_content
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage brands"
ON public.brands
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage categories"
ON public.categories
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage authentication methods"
ON public.authentication_methods
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_website_content_updated_at
  BEFORE UPDATE ON public.website_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_authentication_methods_updated_at
  BEFORE UPDATE ON public.authentication_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_website_content_section_language ON public.website_content(section_key, language);
CREATE INDEX idx_brands_active ON public.brands(is_active, sort_order);
CREATE INDEX idx_categories_active ON public.categories(is_active, sort_order);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_authentication_methods_active ON public.authentication_methods(is_active, sort_order);-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;-- Create lead generation and marketing backend tables

-- Newsletter subscriptions table
CREATE TABLE public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  source TEXT NOT NULL DEFAULT 'website',
  subscription_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contact inquiries table
CREATE TABLE public.contact_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  inquiry_type TEXT NOT NULL DEFAULT 'general' CHECK (inquiry_type IN ('general', 'pricing', 'authentication', 'partnership', 'support')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  source TEXT NOT NULL DEFAULT 'website',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  assigned_to UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pricing plans table
CREATE TABLE public.pricing_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly', 'one_time')),
  tier_level INTEGER NOT NULL DEFAULT 1,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  features TEXT[],
  limits JSONB DEFAULT '{}',
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Plan features table for detailed feature management
CREATE TABLE public.plan_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.pricing_plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  feature_description TEXT,
  feature_value TEXT,
  is_included BOOLEAN NOT NULL DEFAULT true,
  is_highlight BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_key)
);

-- Promotional offers table
CREATE TABLE public.promotional_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_trial')),
  discount_value DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  applicable_plans UUID[],
  min_purchase_amount DECIMAL(10,2),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lead scoring table for marketing intelligence
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  company TEXT,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  lead_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'contacted', 'converted', 'lost')),
  stage TEXT NOT NULL DEFAULT 'awareness' CHECK (stage IN ('awareness', 'interest', 'consideration', 'intent', 'evaluation', 'purchase')),
  first_contact_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  conversion_date TIMESTAMP WITH TIME ZONE,
  utm_data JSONB DEFAULT '{}',
  behavior_data JSONB DEFAULT '{}',
  notes TEXT,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create public read policies for pricing and offers (publicly accessible)
CREATE POLICY "Pricing plans are publicly readable"
ON public.pricing_plans
FOR SELECT
USING (is_active = true);

CREATE POLICY "Plan features are publicly readable"
ON public.plan_features
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.pricing_plans 
  WHERE id = plan_features.plan_id AND is_active = true
));

CREATE POLICY "Active promotional offers are publicly readable"
ON public.promotional_offers
FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()) AND valid_from <= now());

-- Create public insert policies for newsletter and contact forms
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscriptions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can submit contact inquiries"
ON public.contact_inquiries
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can create leads"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- Create admin policies for management
CREATE POLICY "Admins can manage newsletter subscriptions"
ON public.newsletter_subscriptions
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage contact inquiries"
ON public.contact_inquiries
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage pricing plans"
ON public.pricing_plans
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage plan features"
ON public.plan_features
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage promotional offers"
ON public.promotional_offers
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage leads"
ON public.leads
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_newsletter_subscriptions_updated_at
  BEFORE UPDATE ON public.newsletter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_inquiries_updated_at
  BEFORE UPDATE ON public.contact_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_features_updated_at
  BEFORE UPDATE ON public.plan_features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotional_offers_updated_at
  BEFORE UPDATE ON public.promotional_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_newsletter_subscriptions_email ON public.newsletter_subscriptions(email);
CREATE INDEX idx_newsletter_subscriptions_status ON public.newsletter_subscriptions(status);
CREATE INDEX idx_contact_inquiries_email ON public.contact_inquiries(email);
CREATE INDEX idx_contact_inquiries_status ON public.contact_inquiries(status);
CREATE INDEX idx_contact_inquiries_type ON public.contact_inquiries(inquiry_type);
CREATE INDEX idx_pricing_plans_active ON public.pricing_plans(is_active, sort_order);
CREATE INDEX idx_plan_features_plan_id ON public.plan_features(plan_id);
CREATE INDEX idx_promotional_offers_code ON public.promotional_offers(code);
CREATE INDEX idx_promotional_offers_active ON public.promotional_offers(is_active);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_score ON public.leads(lead_score DESC);-- Create social proof and testimonials system tables

-- Testimonials table for customer testimonials
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_title TEXT,
  customer_company TEXT,
  customer_location TEXT,
  customer_avatar_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  testimonial_text TEXT NOT NULL,
  short_quote TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'direct' CHECK (source IN ('direct', 'google', 'trustpilot', 'yelp', 'facebook', 'linkedin', 'email', 'interview')),
  authentication_category TEXT,
  items_authenticated INTEGER DEFAULT 1,
  value_authenticated DECIMAL(12,2),
  testimonial_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Case studies table for detailed success stories
CREATE TABLE public.case_studies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subtitle TEXT,
  customer_name TEXT NOT NULL,
  customer_company TEXT,
  customer_industry TEXT,
  customer_avatar_url TEXT,
  cover_image_url TEXT,
  summary TEXT NOT NULL,
  challenge TEXT NOT NULL,
  solution TEXT NOT NULL,
  results TEXT NOT NULL,
  quote TEXT,
  metrics JSONB DEFAULT '{}', -- e.g., {"items_authenticated": 50, "total_value": 250000, "time_saved": "3 months"}
  authentication_categories TEXT[],
  featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  publish_date TIMESTAMP WITH TIME ZONE,
  reading_time_minutes INTEGER DEFAULT 5,
  tags TEXT[],
  seo_title TEXT,
  seo_description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reviews table for aggregated reviews from multiple sources
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('google', 'trustpilot', 'yelp', 'facebook', 'linkedin', 'direct', 'app_store', 'capterra', 'g2')),
  source_review_id TEXT,
  reviewer_name TEXT NOT NULL,
  reviewer_avatar_url TEXT,
  reviewer_location TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title TEXT,
  review_text TEXT NOT NULL,
  review_date TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  response_text TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  categories TEXT[], -- what aspects they reviewed (service, speed, accuracy, etc.)
  source_url TEXT,
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source, source_review_id)
);

-- Review sources configuration table
CREATE TABLE public.review_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  api_endpoint TEXT,
  api_credentials JSONB,
  sync_frequency_hours INTEGER DEFAULT 24,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  source_url TEXT,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Social proof statistics table for dynamic counters
CREATE TABLE public.social_proof_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_key TEXT NOT NULL UNIQUE,
  stat_name TEXT NOT NULL,
  stat_value BIGINT NOT NULL DEFAULT 0,
  stat_display_value TEXT, -- formatted version like "50M+" or "$250M"
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'authentication', 'financial', 'customer', 'performance')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_proof_stats ENABLE ROW LEVEL SECURITY;

-- Create public read policies (social proof should be publicly accessible)
CREATE POLICY "Active testimonials are publicly readable"
ON public.testimonials
FOR SELECT
USING (is_active = true);

CREATE POLICY "Published case studies are publicly readable"
ON public.case_studies
FOR SELECT
USING (is_published = true);

CREATE POLICY "Active reviews are publicly readable"
ON public.reviews
FOR SELECT
USING (is_active = true);

CREATE POLICY "Active review sources are publicly readable"
ON public.review_sources
FOR SELECT
USING (is_active = true);

CREATE POLICY "Active social proof stats are publicly readable"
ON public.social_proof_stats
FOR SELECT
USING (is_active = true);

-- Create admin policies for management
CREATE POLICY "Admins can manage testimonials"
ON public.testimonials
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage case studies"
ON public.case_studies
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage reviews"
ON public.reviews
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage review sources"
ON public.review_sources
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage social proof stats"
ON public.social_proof_stats
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_case_studies_updated_at
  BEFORE UPDATE ON public.case_studies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_review_sources_updated_at
  BEFORE UPDATE ON public.review_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_proof_stats_updated_at
  BEFORE UPDATE ON public.social_proof_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_testimonials_active_featured ON public.testimonials(is_active, featured, display_order);
CREATE INDEX idx_testimonials_rating ON public.testimonials(rating);
CREATE INDEX idx_testimonials_source ON public.testimonials(source);
CREATE INDEX idx_case_studies_published ON public.case_studies(is_published, featured, display_order);
CREATE INDEX idx_case_studies_slug ON public.case_studies(slug);
CREATE INDEX idx_reviews_source_rating ON public.reviews(source, rating, is_active);
CREATE INDEX idx_reviews_date ON public.reviews(review_date);
CREATE INDEX idx_reviews_featured ON public.reviews(is_featured, is_active);
CREATE INDEX idx_social_proof_stats_active ON public.social_proof_stats(is_active, display_order);
CREATE INDEX idx_social_proof_stats_category ON public.social_proof_stats(category);

-- Insert some initial social proof stats
INSERT INTO public.social_proof_stats (stat_key, stat_name, stat_value, stat_display_value, description, category) VALUES
('total_authenticated_value', 'Total Authenticated Value', 50000000, '$50M+', 'Total value of luxury items authenticated', 'financial'),
('items_authenticated', 'Items Authenticated', 10000, '10K+', 'Number of luxury items authenticated', 'authentication'),
('happy_customers', 'Happy Customers', 2500, '2.5K+', 'Number of satisfied customers', 'customer'),
('brands_supported', 'Brands Supported', 150, '150+', 'Number of luxury brands we authenticate', 'authentication'),
('success_rate', 'Authentication Accuracy', 99, '99%', 'Authentication accuracy rate', 'performance'),
('countries_served', 'Countries Served', 25, '25+', 'Number of countries we serve', 'general');-- Create enhanced user experience tables for search, analytics, and A/B testing

-- Search analytics table to track user searches
CREATE TABLE public.search_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  user_id UUID,
  search_query TEXT NOT NULL,
  search_type TEXT NOT NULL DEFAULT 'general' CHECK (search_type IN ('general', 'brands', 'categories', 'products', 'content')),
  filters_applied JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  clicked_result TEXT,
  clicked_position INTEGER,
  search_source TEXT NOT NULL DEFAULT 'website' CHECK (search_source IN ('website', 'mobile', 'api')),
  search_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User preferences for personalized recommendations
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE,
  session_id TEXT,
  preferred_categories TEXT[],
  preferred_brands TEXT[],
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  preferred_locations TEXT[],
  interests JSONB DEFAULT '{}',
  behavior_data JSONB DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Search suggestions for autocomplete and smart recommendations
CREATE TABLE public.search_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_text TEXT NOT NULL,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('brand', 'category', 'popular', 'trending', 'recent')),
  search_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  click_through_rate DECIMAL(5,4) DEFAULT 0.0000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Website analytics events table
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  event_properties JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Conversion tracking table
CREATE TABLE public.conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('newsletter_signup', 'contact_form', 'quote_request', 'consultation_booking', 'app_signup', 'purchase')),
  conversion_value DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  source_page TEXT NOT NULL,
  conversion_funnel JSONB DEFAULT '{}',
  attribution_data JSONB DEFAULT '{}',
  time_to_conversion_seconds INTEGER,
  touchpoints JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- A/B testing experiments table
CREATE TABLE public.ab_experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  hypothesis TEXT,
  success_metric TEXT NOT NULL,
  page_url_pattern TEXT NOT NULL,
  traffic_allocation DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (traffic_allocation >= 0 AND traffic_allocation <= 1),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'archived')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  sample_size_target INTEGER,
  confidence_level DECIMAL(3,2) DEFAULT 0.95,
  minimum_detectable_effect DECIMAL(5,4) DEFAULT 0.05,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- A/B test variants table
CREATE TABLE public.ab_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES public.ab_experiments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  traffic_weight DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (traffic_weight >= 0 AND traffic_weight <= 1),
  is_control BOOLEAN NOT NULL DEFAULT false,
  variant_config JSONB DEFAULT '{}',
  visitors_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0.0000,
  confidence_interval JSONB DEFAULT '{}',
  statistical_significance DECIMAL(5,4) DEFAULT 0.0000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(experiment_id, name)
);

-- User sessions table for session tracking
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT,
  landing_page TEXT,
  utm_data JSONB DEFAULT '{}',
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  session_duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  is_bounce BOOLEAN,
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(10,2) DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create public read policies for search suggestions (publicly accessible)
CREATE POLICY "Active search suggestions are publicly readable"
ON public.search_suggestions
FOR SELECT
USING (is_active = true);

CREATE POLICY "AB experiments are publicly readable for active tests"
ON public.ab_experiments
FOR SELECT
USING (status = 'running');

CREATE POLICY "AB variants are publicly readable for active tests"
ON public.ab_variants
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.ab_experiments 
  WHERE id = ab_variants.experiment_id AND status = 'running'
));

-- Create public insert policies for analytics and tracking
CREATE POLICY "Anyone can create search analytics"
ON public.search_analytics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can create user preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can create analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can create conversions"
ON public.conversions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can create user sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (true);

-- Create user-specific policies for preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences
FOR SELECT
USING (user_id = auth.uid() OR session_id IS NOT NULL);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create admin policies for management
CREATE POLICY "Admins can manage search suggestions"
ON public.search_suggestions
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage AB experiments"
ON public.ab_experiments
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage AB variants"
ON public.ab_variants
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all analytics"
ON public.search_analytics
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all events"
ON public.analytics_events
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all conversions"
ON public.conversions
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all sessions"
ON public.user_sessions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_search_suggestions_updated_at
  BEFORE UPDATE ON public.search_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ab_experiments_updated_at
  BEFORE UPDATE ON public.ab_experiments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ab_variants_updated_at
  BEFORE UPDATE ON public.ab_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_search_analytics_query ON public.search_analytics(search_query, search_type);
CREATE INDEX idx_search_analytics_session ON public.search_analytics(session_id);
CREATE INDEX idx_search_analytics_created_at ON public.search_analytics(created_at);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_user_preferences_session_id ON public.user_preferences(session_id);
CREATE INDEX idx_search_suggestions_type ON public.search_suggestions(suggestion_type, is_active, priority);
CREATE INDEX idx_search_suggestions_text ON public.search_suggestions USING gin(to_tsvector('english', suggestion_text));
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type, event_name);
CREATE INDEX idx_analytics_events_timestamp ON public.analytics_events(timestamp);
CREATE INDEX idx_conversions_type ON public.conversions(conversion_type);
CREATE INDEX idx_conversions_session ON public.conversions(session_id);
CREATE INDEX idx_ab_experiments_status ON public.ab_experiments(status);
CREATE INDEX idx_ab_variants_experiment ON public.ab_variants(experiment_id);
CREATE INDEX idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);

-- Insert some initial search suggestions
INSERT INTO public.search_suggestions (suggestion_text, suggestion_type, priority) VALUES
('Hermès', 'brand', 100),
('Rolex', 'brand', 95),
('Louis Vuitton', 'brand', 90),
('Chanel', 'brand', 85),
('Gucci', 'brand', 80),
('Handbags', 'category', 100),
('Watches', 'category', 95),
('Jewelry', 'category', 90),
('Shoes', 'category', 85),
('Accessories', 'category', 80),
('luxury authentication', 'popular', 100),
('birkin bag authentication', 'popular', 95),
('rolex authentication', 'popular', 90),
('designer handbag verification', 'popular', 85),
('luxury watch appraisal', 'popular', 80);-- Create pre-authentication features tables for valuation tools and educational content

-- Item valuation estimates table
CREATE TABLE public.item_valuations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  user_id UUID,
  item_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  model_number TEXT,
  condition TEXT CHECK (condition IN ('new', 'excellent', 'very_good', 'good', 'fair', 'poor')),
  year_manufactured INTEGER,
  purchase_price DECIMAL(12,2),
  estimated_current_value DECIMAL(12,2),
  market_trend TEXT CHECK (market_trend IN ('increasing', 'stable', 'decreasing')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  valuation_source TEXT NOT NULL DEFAULT 'internal' CHECK (valuation_source IN ('internal', 'external_api', 'manual', 'ml_model')),
  market_data JSONB DEFAULT '{}',
  comparable_sales JSONB DEFAULT '[]',
  factors_considered JSONB DEFAULT '{}',
  roi_analysis JSONB DEFAULT '{}',
  authentication_recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Market price trends table for tracking luxury item prices
CREATE TABLE public.market_price_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  model_name TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT 'excellent',
  price_point DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  data_source TEXT NOT NULL,
  collection_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  region TEXT DEFAULT 'global',
  market_segment TEXT DEFAULT 'secondary',
  sale_type TEXT CHECK (sale_type IN ('auction', 'retail', 'private', 'dealer')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Educational content table for guides, articles, and resources
CREATE TABLE public.educational_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'guide', 'tutorial', 'video', 'infographic', 'checklist', 'case_study')),
  category TEXT NOT NULL CHECK (category IN ('authentication', 'luxury_market', 'investment', 'care_maintenance', 'brand_knowledge', 'fraud_prevention')),
  subcategory TEXT,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  video_url TEXT,
  video_duration_seconds INTEGER,
  reading_time_minutes INTEGER,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[],
  author_name TEXT,
  author_bio TEXT,
  author_avatar_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  publish_date TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  related_content_ids UUID[],
  content_structure JSONB DEFAULT '{}', -- for rich content with sections, images, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Content categories table for organizing educational content
CREATE TABLE public.content_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES public.content_categories(id),
  icon_url TEXT,
  color_hex TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  content_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Video content table for managing video resources
CREATE TABLE public.video_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER NOT NULL,
  video_type TEXT CHECK (video_type IN ('tutorial', 'brand_spotlight', 'authentication_demo', 'market_insights', 'customer_story')),
  category TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[],
  transcript TEXT,
  chapters JSONB DEFAULT '[]', -- for video chapters/sections
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  publish_date TIMESTAMP WITH TIME ZONE,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ROI calculator configurations table
CREATE TABLE public.roi_calculator_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calculator_name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  calculation_formula JSONB NOT NULL, -- stores the formula and parameters
  input_fields JSONB NOT NULL, -- defines the input fields and their types
  output_format JSONB NOT NULL, -- defines how results are displayed
  example_calculations JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User content interactions table for tracking engagement
CREATE TABLE public.content_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('educational_content', 'video_content')),
  session_id TEXT,
  user_id UUID,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'share', 'bookmark', 'comment', 'download')),
  interaction_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.item_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_price_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_calculator_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_interactions ENABLE ROW LEVEL SECURITY;

-- Create public read policies for educational content
CREATE POLICY "Published educational content is publicly readable"
ON public.educational_content
FOR SELECT
USING (is_published = true);

CREATE POLICY "Active content categories are publicly readable"
ON public.content_categories
FOR SELECT
USING (is_active = true);

CREATE POLICY "Published video content is publicly readable"
ON public.video_content
FOR SELECT
USING (is_published = true);

CREATE POLICY "Active ROI calculators are publicly readable"
ON public.roi_calculator_configs
FOR SELECT
USING (is_active = true);

CREATE POLICY "Market price trends are publicly readable"
ON public.market_price_trends
FOR SELECT
USING (true);

-- Create public insert policies for user interactions
CREATE POLICY "Anyone can create item valuations"
ON public.item_valuations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can create content interactions"
ON public.content_interactions
FOR INSERT
WITH CHECK (true);

-- Create user-specific policies for valuations
CREATE POLICY "Users can view their own valuations"
ON public.item_valuations
FOR SELECT
USING (user_id = auth.uid() OR session_id IS NOT NULL);

-- Create admin policies for content management
CREATE POLICY "Admins can manage educational content"
ON public.educational_content
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage content categories"
ON public.content_categories
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage video content"
ON public.video_content
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage ROI calculators"
ON public.roi_calculator_configs
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage market price trends"
ON public.market_price_trends
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all valuations"
ON public.item_valuations
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all interactions"
ON public.content_interactions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_item_valuations_updated_at
  BEFORE UPDATE ON public.item_valuations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_educational_content_updated_at
  BEFORE UPDATE ON public.educational_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_categories_updated_at
  BEFORE UPDATE ON public.content_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_content_updated_at
  BEFORE UPDATE ON public.video_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roi_calculator_configs_updated_at
  BEFORE UPDATE ON public.roi_calculator_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_item_valuations_brand_category ON public.item_valuations(brand, category);
CREATE INDEX idx_item_valuations_session ON public.item_valuations(session_id);
CREATE INDEX idx_market_price_trends_brand_model ON public.market_price_trends(brand, model_name);
CREATE INDEX idx_market_price_trends_date ON public.market_price_trends(collection_date);
CREATE INDEX idx_educational_content_published ON public.educational_content(is_published, category, publish_date);
CREATE INDEX idx_educational_content_slug ON public.educational_content(slug);
CREATE INDEX idx_educational_content_featured ON public.educational_content(is_featured, is_published);
CREATE INDEX idx_content_categories_parent ON public.content_categories(parent_id);
CREATE INDEX idx_video_content_published ON public.video_content(is_published, category, publish_date);
CREATE INDEX idx_content_interactions_content ON public.content_interactions(content_id, content_type);
CREATE INDEX idx_content_interactions_session ON public.content_interactions(session_id);

-- Insert initial content categories
INSERT INTO public.content_categories (name, slug, description, sort_order) VALUES
('Authentication Guides', 'authentication-guides', 'Step-by-step guides for authenticating luxury items', 1),
('Brand Knowledge', 'brand-knowledge', 'Deep dives into luxury brands and their characteristics', 2),
('Market Insights', 'market-insights', 'Analysis of luxury goods market trends and valuations', 3),
('Fraud Prevention', 'fraud-prevention', 'How to spot fakes and avoid counterfeit items', 4),
('Investment Advice', 'investment-advice', 'Luxury goods as investment opportunities', 5),
('Care & Maintenance', 'care-maintenance', 'Proper care and maintenance of luxury items', 6);

-- Insert initial ROI calculator configurations
INSERT INTO public.roi_calculator_configs (calculator_name, description, category, calculation_formula, input_fields, output_format) VALUES
('Authentication ROI', 'Calculate return on investment for authentication services', 'authentication',
'{"formula": "((current_value - purchase_price - authentication_cost) / (purchase_price + authentication_cost)) * 100", "factors": ["purchase_price", "current_value", "authentication_cost", "insurance_savings", "resale_confidence"]}',
'{"purchase_price": {"type": "number", "label": "Purchase Price ($)", "required": true}, "current_value": {"type": "number", "label": "Current Market Value ($)", "required": true}, "authentication_cost": {"type": "number", "label": "Authentication Cost ($)", "default": 299}, "insurance_discount": {"type": "number", "label": "Annual Insurance Discount (%)", "default": 10}}',
'{"roi_percentage": {"label": "ROI Percentage", "format": "percentage"}, "net_profit": {"label": "Net Profit", "format": "currency"}, "break_even_years": {"label": "Break-even Period", "format": "years"}}'),

('Investment Comparison', 'Compare luxury goods investment vs traditional investments', 'investment',
'{"formula": "annual_return_rate", "comparison_benchmarks": ["sp500", "real_estate", "bonds"]}',
'{"item_value": {"type": "number", "label": "Item Value ($)", "required": true}, "holding_period": {"type": "number", "label": "Holding Period (years)", "default": 5}, "expected_appreciation": {"type": "number", "label": "Expected Annual Appreciation (%)", "default": 8}}',
'{"annual_return": {"label": "Annual Return", "format": "percentage"}, "total_return": {"label": "Total Return", "format": "currency"}, "vs_sp500": {"label": "vs S&P 500", "format": "comparison"}}');-- Create sales support tables for lead scoring, booking, and consultation systems

-- Lead scoring rules and models
CREATE TABLE public.lead_scoring_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL UNIQUE,
  description TEXT,
  event_type TEXT NOT NULL,
  event_criteria JSONB NOT NULL, -- conditions that must be met
  score_change INTEGER NOT NULL, -- points to add/subtract
  max_occurrences INTEGER, -- limit how many times this rule can apply
  decay_days INTEGER, -- how many days before score decays
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lead score history for tracking changes
CREATE TABLE public.lead_score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.lead_scoring_rules(id),
  score_change INTEGER NOT NULL,
  previous_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Consultation bookings table
CREATE TABLE public.consultation_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_reference TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_company TEXT,
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('demo', 'authentication_consultation', 'enterprise_consultation', 'investment_advisory', 'insurance_consultation')),
  preferred_date TIMESTAMP WITH TIME ZONE NOT NULL,
  alternative_date TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show')),
  meeting_type TEXT NOT NULL DEFAULT 'video_call' CHECK (meeting_type IN ('video_call', 'phone_call', 'in_person')),
  meeting_link TEXT,
  meeting_location TEXT,
  agenda TEXT,
  special_requirements TEXT,
  items_to_discuss JSONB DEFAULT '[]',
  estimated_portfolio_value DECIMAL(12,2),
  lead_source TEXT,
  utm_data JSONB DEFAULT '{}',
  assigned_consultant UUID,
  consultation_notes TEXT,
  follow_up_actions JSONB DEFAULT '[]',
  booking_confirmed_at TIMESTAMP WITH TIME ZONE,
  consultation_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Service request forms table
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_company TEXT,
  service_type TEXT NOT NULL CHECK (service_type IN ('authentication', 'valuation', 'insurance', 'storage', 'consultation', 'bulk_authentication', 'white_label')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'quoted', 'approved', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  description TEXT NOT NULL,
  items_details JSONB DEFAULT '[]', -- array of items to be serviced
  estimated_value DECIMAL(12,2),
  requested_timeline TEXT,
  special_instructions TEXT,
  attachments JSONB DEFAULT '[]', -- file URLs and metadata
  internal_notes TEXT,
  assigned_to UUID,
  estimated_completion_date TIMESTAMP WITH TIME ZONE,
  actual_completion_date TIMESTAMP WITH TIME ZONE,
  customer_satisfaction_score INTEGER CHECK (customer_satisfaction_score >= 1 AND customer_satisfaction_score <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quote generation and management
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_company TEXT,
  quote_type TEXT NOT NULL CHECK (quote_type IN ('individual', 'bulk', 'enterprise', 'subscription')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'revised')),
  services JSONB NOT NULL, -- array of services and pricing
  subtotal DECIMAL(12,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_percentage DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  terms_and_conditions TEXT,
  notes TEXT,
  internal_notes TEXT,
  created_by UUID,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CRM integration configurations
CREATE TABLE public.crm_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_name TEXT NOT NULL UNIQUE,
  crm_type TEXT NOT NULL CHECK (crm_type IN ('hubspot', 'salesforce', 'pipedrive', 'zoho', 'custom')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  api_endpoint TEXT,
  api_credentials JSONB, -- encrypted credentials
  field_mappings JSONB NOT NULL, -- maps our fields to CRM fields
  sync_direction TEXT NOT NULL DEFAULT 'bidirectional' CHECK (sync_direction IN ('push_only', 'pull_only', 'bidirectional')),
  sync_frequency_minutes INTEGER DEFAULT 15,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error', 'paused')),
  error_message TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CRM sync logs for tracking integration activity
CREATE TABLE public.crm_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.crm_integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('lead', 'contact', 'deal', 'activity')),
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  record_id TEXT NOT NULL, -- ID in our system
  external_id TEXT, -- ID in CRM system
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('push', 'pull')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  data_payload JSONB,
  response_data JSONB,
  sync_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sales funnel stages and conversion tracking
CREATE TABLE public.sales_funnel_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_name TEXT NOT NULL UNIQUE,
  stage_order INTEGER NOT NULL,
  description TEXT,
  conversion_goal TEXT,
  expected_duration_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sales funnel progression tracking
CREATE TABLE public.sales_funnel_progression (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.sales_funnel_stages(id),
  entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exited_at TIMESTAMP WITH TIME ZONE,
  duration_hours INTEGER,
  conversion_source TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lead_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_funnel_progression ENABLE ROW LEVEL SECURITY;

-- Create public insert policies for customer-facing forms
CREATE POLICY "Anyone can create consultation bookings"
ON public.consultation_bookings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can create service requests"
ON public.service_requests
FOR INSERT
WITH CHECK (true);

-- Create public read policies for sales funnel stages
CREATE POLICY "Active sales funnel stages are publicly readable"
ON public.sales_funnel_stages
FOR SELECT
USING (is_active = true);

-- Create user-specific policies for quotes
CREATE POLICY "Customers can view their own quotes"
ON public.quotes
FOR SELECT
USING (customer_email = auth.email() OR auth.uid() IS NOT NULL);

-- Create admin policies for management
CREATE POLICY "Admins can manage lead scoring rules"
ON public.lead_scoring_rules
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view lead score history"
ON public.lead_score_history
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage consultation bookings"
ON public.consultation_bookings
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage service requests"
ON public.service_requests
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage quotes"
ON public.quotes
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage CRM integrations"
ON public.crm_integrations
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view CRM sync logs"
ON public.crm_sync_logs
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage sales funnel stages"
ON public.sales_funnel_stages
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view sales funnel progression"
ON public.sales_funnel_progression
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_lead_scoring_rules_updated_at
  BEFORE UPDATE ON public.lead_scoring_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultation_bookings_updated_at
  BEFORE UPDATE ON public.consultation_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_integrations_updated_at
  BEFORE UPDATE ON public.crm_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_funnel_stages_updated_at
  BEFORE UPDATE ON public.sales_funnel_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_lead_score_history_lead_id ON public.lead_score_history(lead_id);
CREATE INDEX idx_consultation_bookings_email ON public.consultation_bookings(customer_email);
CREATE INDEX idx_consultation_bookings_date ON public.consultation_bookings(preferred_date);
CREATE INDEX idx_consultation_bookings_status ON public.consultation_bookings(status);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);
CREATE INDEX idx_service_requests_email ON public.service_requests(customer_email);
CREATE INDEX idx_quotes_customer_email ON public.quotes(customer_email);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_crm_sync_logs_integration ON public.crm_sync_logs(integration_id);
CREATE INDEX idx_sales_funnel_progression_lead ON public.sales_funnel_progression(lead_id);

-- Insert initial lead scoring rules
INSERT INTO public.lead_scoring_rules (rule_name, description, event_type, event_criteria, score_change) VALUES
('Website Visit', 'Basic website visit', 'page_view', '{"page_type": "any"}', 1),
('Pricing Page Visit', 'Visited pricing page', 'page_view', '{"page_url": "/pricing"}', 5),
('What We Authenticate Visit', 'Visited authentication page', 'page_view', '{"page_url": "/what-we-authenticate"}', 3),
('Newsletter Signup', 'Subscribed to newsletter', 'conversion', '{"type": "newsletter_signup"}', 15),
('Contact Form Submission', 'Submitted contact form', 'conversion', '{"type": "contact_form"}', 25),
('Item Valuation Request', 'Used valuation tool', 'engagement', '{"tool": "valuation"}', 20),
('ROI Calculator Usage', 'Used ROI calculator', 'engagement', '{"tool": "roi_calculator"}', 10),
('Consultation Booking', 'Booked consultation', 'conversion', '{"type": "consultation_booking"}', 50),
('Repeat Visit (Same Day)', 'Multiple visits same day', 'engagement', '{"frequency": "same_day"}', 5),
('High-Value Item Interest', 'Interested in high-value items', 'engagement', '{"value_threshold": 10000}', 15);

-- Insert initial sales funnel stages
INSERT INTO public.sales_funnel_stages (stage_name, stage_order, description, expected_duration_days) VALUES
('Awareness', 1, 'Initial website visit or brand awareness', 1),
('Interest', 2, 'Engaged with content, used tools, or subscribed', 3),
('Consideration', 3, 'Multiple visits, downloaded resources, or contacted us', 7),
('Intent', 4, 'Requested consultation or quote', 5),
('Evaluation', 5, 'In active discussion, received quote', 10),
('Purchase', 6, 'Converted to customer', 1);

-- Generate unique booking reference function
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
BEGIN
  ref := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.consultation_bookings WHERE booking_reference = ref) LOOP
    ref := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END LOOP;
  RETURN ref;
END;
$$ LANGUAGE plpgsql;-- Fix function security issue
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  ref TEXT;
BEGIN
  ref := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.consultation_bookings WHERE booking_reference = ref) LOOP
    ref := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END LOOP;
  RETURN ref;
END;
$$;-- Fix Supabase OTP expiry settings and add security configurations

-- Update auth.users table to include security fields if not exists
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_sign_in_at' AND table_schema = 'auth') THEN
    -- This column should already exist in Supabase auth schema
    NULL;
  END IF;
END $$;

-- Create a function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  -- Delete expired refresh tokens (older than 30 days)
  DELETE FROM auth.refresh_tokens 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete expired sessions (older than 7 days inactive)
  DELETE FROM auth.sessions 
  WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Create a function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  user_id uuid DEFAULT NULL,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_logs (
    event_type,
    user_id,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    event_type,
    user_id,
    details,
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
    COALESCE(current_setting('request.headers', true)::json->>'user-agent', 'unknown'),
    NOW()
  );
END;
$$;

-- Create security logs table for tracking authentication and security events
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on security logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for security logs (only service role can access)
CREATE POLICY "Service role can manage security logs" 
ON public.security_logs 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for security logs
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at);

-- Create rate limiting table for API endpoints
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or user ID
  endpoint TEXT NOT NULL,
  requests_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies for rate limits (only service role can access)
CREATE POLICY "Service role can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for rate limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint ON public.rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests integer DEFAULT 100,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  window_start_time timestamp with time zone;
BEGIN
  window_start_time := NOW() - INTERVAL '1 minute' * p_window_minutes;
  
  -- Get current count for this identifier and endpoint in the time window
  SELECT COALESCE(SUM(requests_count), 0)
  INTO current_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start > window_start_time;
  
  -- If under limit, record this request
  IF current_count < p_max_requests THEN
    INSERT INTO public.rate_limits (identifier, endpoint, requests_count)
    VALUES (p_identifier, p_endpoint, 1)
    ON CONFLICT (identifier, endpoint) 
    DO UPDATE SET 
      requests_count = rate_limits.requests_count + 1,
      window_start = CASE 
        WHEN rate_limits.window_start < window_start_time 
        THEN NOW() 
        ELSE rate_limits.window_start 
      END;
    
    RETURN true;
  ELSE
    -- Log rate limit exceeded
    PERFORM public.log_security_event(
      'rate_limit_exceeded',
      NULL,
      jsonb_build_object(
        'identifier', p_identifier,
        'endpoint', p_endpoint,
        'current_count', current_count,
        'max_requests', p_max_requests
      )
    );
    
    RETURN false;
  END IF;
END;
$$;

-- Create cleanup function that runs periodically
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cleanup old security logs (keep 90 days)
  DELETE FROM public.security_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Cleanup old rate limit entries (keep 24 hours)
  DELETE FROM public.rate_limits 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- Cleanup expired sessions
  PERFORM public.cleanup_expired_sessions();
END;
$$;-- Configure OTP settings for better security
-- NOTE: These settings are now configured via Supabase Dashboard > Authentication > Email Auth
-- or via environment variables in newer Supabase versions.
-- The auth.config table is no longer directly writable.

-- OTP expiry: Set to 10 minutes (600 seconds) in Dashboard
-- Password reset token validity: Set to 1 hour (3600 seconds) in Dashboard

-- Migration placeholder (no-op)
SELECT 1;-- GDPR and Legal Compliance Tables

-- Data export requests tracking
CREATE TABLE public.data_export_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  data_types TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  download_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data deletion requests tracking
CREATE TABLE public.data_deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Consent records for GDPR compliance
CREATE TABLE public.consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  consent_type TEXT NOT NULL, -- 'analytics', 'marketing', 'data_processing', etc.
  granted BOOLEAN NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  consent_method TEXT, -- 'cookie_banner', 'settings_page', 'registration', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User privacy preferences (GDPR compliance)
-- NOTE: Renamed from user_preferences to avoid conflict with shopping preferences table
CREATE TABLE public.user_privacy_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, preference_key)
);

-- Enable Row Level Security
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privacy_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data export requests
CREATE POLICY "Users can view their own export requests" 
ON public.data_export_requests 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own export requests" 
ON public.data_export_requests 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for data deletion requests
CREATE POLICY "Users can view their own deletion requests" 
ON public.data_deletion_requests 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own deletion requests" 
ON public.data_deletion_requests 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own deletion requests" 
ON public.data_deletion_requests 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

-- RLS Policies for consent records
CREATE POLICY "Users can view their own consent records" 
ON public.consent_records 
FOR SELECT 
USING (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "Anyone can create consent records" 
ON public.consent_records 
FOR INSERT 
WITH CHECK (true); -- Allow anonymous consent recording

CREATE POLICY "Users can update their own consent records" 
ON public.consent_records 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

-- RLS Policies for user privacy preferences
CREATE POLICY "Users can view their own privacy preferences"
ON public.user_privacy_preferences
FOR SELECT
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own privacy preferences"
ON public.user_privacy_preferences
FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own privacy preferences"
ON public.user_privacy_preferences
FOR UPDATE
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own privacy preferences"
ON public.user_privacy_preferences
FOR DELETE
USING (auth.uid()::text = user_id::text);

-- Indexes for performance
CREATE INDEX idx_data_export_requests_user_id ON public.data_export_requests(user_id);
CREATE INDEX idx_data_export_requests_status ON public.data_export_requests(status);
CREATE INDEX idx_data_deletion_requests_user_id ON public.data_deletion_requests(user_id);
CREATE INDEX idx_data_deletion_requests_status ON public.data_deletion_requests(status);
CREATE INDEX idx_data_deletion_requests_scheduled ON public.data_deletion_requests(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_consent_records_user_id ON public.consent_records(user_id);
CREATE INDEX idx_consent_records_type ON public.consent_records(consent_type);
CREATE INDEX idx_user_privacy_preferences_user_key ON public.user_privacy_preferences(user_id, preference_key);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_data_export_requests_updated_at
  BEFORE UPDATE ON public.data_export_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_deletion_requests_updated_at
  BEFORE UPDATE ON public.data_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consent_records_updated_at
  BEFORE UPDATE ON public.consent_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_privacy_preferences_updated_at
  BEFORE UPDATE ON public.user_privacy_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically clean up expired data (for data retention)
CREATE OR REPLACE FUNCTION cleanup_expired_data() RETURNS void AS $$
BEGIN
  -- Clean up old security logs (older than 1 year)
  DELETE FROM public.security_logs 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Clean up old consent records (keep only latest for each type per user)
  WITH latest_consents AS (
    SELECT DISTINCT ON (user_id, consent_type) 
      id, user_id, consent_type, recorded_at
    FROM public.consent_records 
    ORDER BY user_id, consent_type, recorded_at DESC
  )
  DELETE FROM public.consent_records 
  WHERE id NOT IN (SELECT id FROM latest_consents)
    AND recorded_at < NOW() - INTERVAL '2 years';
    
  -- Clean up completed export requests older than 30 days
  DELETE FROM public.data_export_requests 
  WHERE status = 'completed' 
    AND completed_at < NOW() - INTERVAL '30 days';
    
  -- Clean up failed requests older than 90 days
  DELETE FROM public.data_export_requests 
  WHERE status = 'failed' 
    AND created_at < NOW() - INTERVAL '90 days';
    
  DELETE FROM public.data_deletion_requests 
  WHERE status = 'failed' 
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users for cleanup function
GRANT EXECUTE ON FUNCTION cleanup_expired_data() TO authenticated;-- Fix security vulnerability in consultation_bookings table
-- Remove the overly permissive "ALL" policy and replace with specific policies

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Admins can manage consultation bookings" ON public.consultation_bookings;

-- Create more specific and secure policies

-- Only allow authenticated admin users to SELECT (read) consultation bookings
CREATE POLICY "Authenticated users can view consultation bookings" 
ON public.consultation_bookings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only allow authenticated admin users to UPDATE consultation bookings  
CREATE POLICY "Authenticated users can update consultation bookings"
ON public.consultation_bookings
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Only allow authenticated admin users to DELETE consultation bookings
CREATE POLICY "Authenticated users can delete consultation bookings"
ON public.consultation_bookings
FOR DELETE  
USING (auth.uid() IS NOT NULL);

-- Keep the public INSERT policy as-is (needed for the booking form)
-- "Anyone can create consultation bookings" policy remains unchanged-- Fix security vulnerability: Implement proper user-based access control
-- Users should only see their own bookings, not all customer data

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view consultation bookings" ON public.consultation_bookings;

-- Create a secure policy that only allows users to see their own bookings
-- This matches the authenticated user's email with the booking's customer email
CREATE POLICY "Users can only view their own consultation bookings" 
ON public.consultation_bookings 
FOR SELECT 
USING (
  -- Allow if the authenticated user's email matches the booking's customer email
  auth.email() = customer_email 
  OR 
  -- OR if the user has admin role (for future admin implementation)
  -- For now, we'll use a more restrictive approach and require explicit admin checks
  FALSE -- Placeholder for future admin role checking
);

-- Update the UPDATE policy to be more restrictive
DROP POLICY IF EXISTS "Authenticated users can update consultation bookings" ON public.consultation_bookings;

-- Only allow users to update their own bookings, and only specific fields
CREATE POLICY "Users can update their own consultation bookings"
ON public.consultation_bookings
FOR UPDATE
USING (auth.email() = customer_email)
WITH CHECK (auth.email() = customer_email);

-- Update the DELETE policy to be more restrictive  
DROP POLICY IF EXISTS "Authenticated users can delete consultation bookings" ON public.consultation_bookings;

-- Only allow users to delete their own bookings
CREATE POLICY "Users can delete their own consultation bookings"
ON public.consultation_bookings
FOR DELETE
USING (auth.email() = customer_email);

-- Keep the public INSERT policy unchanged for the booking form
-- The "Anyone can create consultation bookings" policy remains as-is-- Fix security vulnerability: Implement proper user-based access control
-- Users should only see their own bookings, not all customer data

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view consultation bookings" ON public.consultation_bookings;

-- Create a secure policy that only allows users to see their own bookings
-- This matches the authenticated user's email with the booking's customer email
-- Drop if exists to avoid conflicts with previous migrations
DROP POLICY IF EXISTS "Users can only view their own consultation bookings" ON public.consultation_bookings;

CREATE POLICY "Users can only view their own consultation bookings"
ON public.consultation_bookings
FOR SELECT
USING (
  -- Allow if the authenticated user's email matches the booking's customer email
  auth.email() = customer_email
  OR
  -- OR if the user has admin role (for future admin implementation)
  -- For now, we'll use a more restrictive approach and require explicit admin checks
  FALSE -- Placeholder for future admin role checking
);

-- Update the UPDATE policy to be more restrictive
DROP POLICY IF EXISTS "Authenticated users can update consultation bookings" ON public.consultation_bookings;

-- Only allow users to update their own bookings, and only specific fields
-- Drop if exists to avoid conflicts with previous migrations
DROP POLICY IF EXISTS "Users can update their own consultation bookings" ON public.consultation_bookings;

CREATE POLICY "Users can update their own consultation bookings"
ON public.consultation_bookings
FOR UPDATE
USING (auth.email() = customer_email)
WITH CHECK (auth.email() = customer_email);

-- Update the DELETE policy to be more restrictive
DROP POLICY IF EXISTS "Authenticated users can delete consultation bookings" ON public.consultation_bookings;

-- Only allow users to delete their own bookings
-- Drop if exists to avoid conflicts with previous migrations
DROP POLICY IF EXISTS "Users can delete their own consultation bookings" ON public.consultation_bookings;

CREATE POLICY "Users can delete their own consultation bookings"
ON public.consultation_bookings
FOR DELETE
USING (auth.email() = customer_email);

-- Keep the public INSERT policy unchanged for the booking form
-- The "Anyone can create consultation bookings" policy remains as-is-- Add admin access policy for consultation bookings management
-- This will allow designated admin users to manage all bookings

-- Create a security definer function to check admin role
-- This will be used when you implement user roles in the future
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- For now, we'll use a simple check - you can enhance this later with proper role tables
  -- This is a placeholder that always returns false until you implement admin roles
  -- You would replace this with actual role checking logic like:
  -- SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add admin SELECT policy
CREATE POLICY "Admins can view all consultation bookings" 
ON public.consultation_bookings 
FOR SELECT 
USING (public.is_admin_user());

-- Add admin UPDATE policy  
CREATE POLICY "Admins can update all consultation bookings"
ON public.consultation_bookings
FOR UPDATE
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Add admin DELETE policy
CREATE POLICY "Admins can delete all consultation bookings"
ON public.consultation_bookings
FOR DELETE
USING (public.is_admin_user());-- Fix the security warning for the admin function
-- Set proper search_path to prevent security issues

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
BEGIN
  -- For now, we'll use a simple check - you can enhance this later with proper role tables
  -- This is a placeholder that always returns false until you implement admin roles
  -- You would replace this with actual role checking logic like:
  -- SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  RETURN FALSE;
END;
$$;-- Strengthen security for consultation_bookings with additional safeguards

-- Add a user_id column to link authenticated users to their bookings
ALTER TABLE public.consultation_bookings 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create an audit log table for tracking access to sensitive data
CREATE TABLE IF NOT EXISTS public.consultation_booking_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.consultation_bookings(id) ON DELETE CASCADE,
    accessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    access_type TEXT NOT NULL, -- 'view', 'update', 'delete'
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT
);

-- Enable RLS on the audit log
ALTER TABLE public.consultation_booking_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view booking access logs"
ON public.consultation_booking_access_log
FOR SELECT
USING (public.is_admin_user());

-- Create a function to log access attempts with additional validation
CREATE OR REPLACE FUNCTION public.log_booking_access(
    p_booking_id UUID,
    p_access_type TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_agent_val TEXT;
    ip_address_val TEXT;
BEGIN
    -- Get user agent and IP from request headers
    user_agent_val := COALESCE(
        current_setting('request.headers', true)::json->>'user-agent', 
        'unknown'
    );
    ip_address_val := COALESCE(
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'x-real-ip',
        'unknown'
    );
    
    -- Insert audit log
    INSERT INTO public.consultation_booking_access_log (
        booking_id,
        accessed_by,
        access_type,
        user_agent,
        ip_address
    ) VALUES (
        p_booking_id,
        auth.uid(),
        p_access_type,
        user_agent_val,
        ip_address_val
    );
END;
$$;-- Implement enhanced security policies with stronger user authentication

-- Drop existing user policies to replace with enhanced versions
DROP POLICY IF EXISTS "Users can only view their own consultation bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Users can update their own consultation bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Users can delete their own consultation bookings" ON public.consultation_bookings;

-- Create enhanced security function that validates both user_id and email
CREATE OR REPLACE FUNCTION public.can_access_booking(booking_user_id UUID, booking_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    -- Must be authenticated
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Prefer user_id matching if available (more secure)
    IF booking_user_id IS NOT NULL THEN
        RETURN auth.uid() = booking_user_id;
    END IF;
    
    -- Fall back to email matching for legacy bookings
    -- but add additional validation
    IF booking_email IS NOT NULL AND auth.email() IS NOT NULL THEN
        -- Ensure the authenticated user's email matches exactly
        RETURN LOWER(TRIM(auth.email())) = LOWER(TRIM(booking_email));
    END IF;
    
    -- Deny access if no valid matching criteria
    RETURN FALSE;
END;
$$;

-- Enhanced SELECT policy with audit logging
CREATE POLICY "Users can view their own bookings with enhanced security"
ON public.consultation_bookings
FOR SELECT
USING (
    public.can_access_booking(user_id, customer_email)
    AND 
    -- Additional session validation: ensure session is not too old
    (auth.jwt()::json->>'exp')::bigint > EXTRACT(epoch FROM NOW())
);

-- Enhanced UPDATE policy with audit logging
CREATE POLICY "Users can update their own bookings with enhanced security"
ON public.consultation_bookings
FOR UPDATE
USING (
    public.can_access_booking(user_id, customer_email)
    AND 
    -- Additional session validation
    (auth.jwt()::json->>'exp')::bigint > EXTRACT(epoch FROM NOW())
)
WITH CHECK (
    public.can_access_booking(user_id, customer_email)
    AND
    -- Ensure user_id is set for authenticated updates
    (user_id = auth.uid() OR user_id IS NULL)
);

-- Enhanced DELETE policy with audit logging
CREATE POLICY "Users can delete their own bookings with enhanced security"
ON public.consultation_bookings
FOR DELETE
USING (
    public.can_access_booking(user_id, customer_email)
    AND 
    -- Additional session validation
    (auth.jwt()::json->>'exp')::bigint > EXTRACT(epoch FROM NOW())
);

-- Create trigger to automatically set user_id when authenticated users create bookings
CREATE OR REPLACE FUNCTION public.set_booking_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If user is authenticated and user_id is not already set, set it
    IF auth.uid() IS NOT NULL AND NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    
    -- Ensure customer_email matches authenticated user's email if both exist
    IF auth.uid() IS NOT NULL AND auth.email() IS NOT NULL THEN
        NEW.customer_email := auth.email();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for INSERT operations
CREATE TRIGGER set_consultation_booking_user_id
    BEFORE INSERT ON public.consultation_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_booking_user_id();-- SECURITY FIX: Replace complex access control with simple, bulletproof policies
-- Clear, auditable policies that eliminate potential vulnerabilities

-- Drop all existing complex policies
DROP POLICY IF EXISTS "Users can view their own bookings with enhanced security" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Users can update their own bookings with enhanced security" ON public.consultation_bookings;  
DROP POLICY IF EXISTS "Users can delete their own bookings with enhanced security" ON public.consultation_bookings;

-- Drop the complex access control function
DROP FUNCTION IF EXISTS public.can_access_booking(UUID, TEXT);

-- Create simple, bulletproof user access policies
-- CRYSTAL CLEAR: Users can only access bookings where user_id exactly matches their auth.uid()

CREATE POLICY "Users can view only their own bookings - simple and secure"
ON public.consultation_bookings
FOR SELECT
USING (
    auth.uid() IS NOT NULL 
    AND user_id IS NOT NULL 
    AND user_id = auth.uid()
);

CREATE POLICY "Users can update only their own bookings - simple and secure"
ON public.consultation_bookings
FOR UPDATE
USING (
    auth.uid() IS NOT NULL 
    AND user_id IS NOT NULL 
    AND user_id = auth.uid()
)
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id IS NOT NULL 
    AND user_id = auth.uid()
);

CREATE POLICY "Users can delete only their own bookings - simple and secure"
ON public.consultation_bookings
FOR DELETE
USING (
    auth.uid() IS NOT NULL 
    AND user_id IS NOT NULL 
    AND user_id = auth.uid()
);

-- Update the INSERT trigger to ALWAYS set user_id for authenticated users
-- and validate email consistency
CREATE OR REPLACE FUNCTION public.secure_booking_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If user is authenticated, MUST set user_id and ensure email consistency
    IF auth.uid() IS NOT NULL THEN
        NEW.user_id := auth.uid();
        
        -- If authenticated user has an email, use their verified email
        IF auth.email() IS NOT NULL THEN
            NEW.customer_email := auth.email();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Replace the existing trigger
DROP TRIGGER IF EXISTS set_consultation_booking_user_id ON public.consultation_bookings;
CREATE TRIGGER secure_consultation_booking_insert
    BEFORE INSERT ON public.consultation_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.secure_booking_insert();-- Add clear admin access policies for consultation bookings management

-- Simple admin access - clear and auditable
CREATE POLICY "Admins have full access to all consultation bookings - clear and secure"
ON public.consultation_bookings
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Remove duplicate admin policies that were created earlier
DROP POLICY IF EXISTS "Admins can view all consultation bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Admins can update all consultation bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Admins can delete all consultation bookings" ON public.consultation_bookings;-- Fix security vulnerability in quotes table RLS policy
-- Remove overly permissive policy that allows any authenticated user to see all quotes
DROP POLICY IF EXISTS "Customers can view their own quotes" ON public.quotes;

-- Create secure policy that only allows customers to view quotes where they are the customer
-- OR where they are an admin (using the admin function)
CREATE POLICY "Secure customer quote access"
ON public.quotes 
FOR SELECT 
USING (
  (customer_email = auth.email()) OR 
  public.is_admin_user()
);-- COMPREHENSIVE SECURITY FIX: Secure all customer data tables
-- Only allow public contact form submissions, everything else admin-only

-- 1. Fix contact_inquiries: Allow public INSERT but restrict SELECT to admins
DROP POLICY IF EXISTS "Anyone can submit contact inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Admins can manage contact inquiries" ON public.contact_inquiries;

CREATE POLICY "Public can submit contact forms"
ON public.contact_inquiries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can view contact inquiries"
ON public.contact_inquiries 
FOR SELECT 
USING (public.is_admin_user());

CREATE POLICY "Only admins can manage contact inquiries"
ON public.contact_inquiries 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 2. Fix leads table: Admin-only access
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;

CREATE POLICY "Only admins can manage leads"
ON public.leads 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 3. Fix newsletter_subscriptions: Allow public INSERT but restrict SELECT to admins
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Admins can manage newsletter subscriptions" ON public.newsletter_subscriptions;

CREATE POLICY "Public can subscribe to newsletter"
ON public.newsletter_subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can view newsletter subscriptions"
ON public.newsletter_subscriptions 
FOR SELECT 
USING (public.is_admin_user());

CREATE POLICY "Only admins can manage newsletter subscriptions"
ON public.newsletter_subscriptions 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 4. Fix analytics_events: Admin-only access
DROP POLICY IF EXISTS "Anyone can create analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.analytics_events;

CREATE POLICY "Only admins can manage analytics events"
ON public.analytics_events 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 5. Check if service_requests table exists and secure it
DROP POLICY IF EXISTS "Anyone can create service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins can view service requests" ON public.service_requests;

-- Only create policies if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'service_requests' AND table_schema = 'public') THEN
        EXECUTE 'CREATE POLICY "Only admins can manage service requests" ON public.service_requests FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user())';
    END IF;
END$$;

-- 6. Check if user_sessions table exists and secure it
DROP POLICY IF EXISTS "Anyone can create user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can view user sessions" ON public.user_sessions;

-- Only create policies if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_sessions' AND table_schema = 'public') THEN
        EXECUTE 'CREATE POLICY "Only admins can manage user sessions" ON public.user_sessions FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user())';
    END IF;
END$$;

-- 7. Secure other sensitive tables that might exist
DROP POLICY IF EXISTS "Anyone can create content interactions" ON public.content_interactions;
DROP POLICY IF EXISTS "Admins can view all interactions" ON public.content_interactions;

CREATE POLICY "Only admins can manage content interactions"
ON public.content_interactions 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Anyone can create conversions" ON public.conversions;
DROP POLICY IF EXISTS "Admins can view all conversions" ON public.conversions;

CREATE POLICY "Only admins can manage conversions"
ON public.conversions 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Anyone can create search analytics" ON public.search_analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.search_analytics;

CREATE POLICY "Only admins can manage search analytics"
ON public.search_analytics 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Anyone can create item valuations" ON public.item_valuations;
DROP POLICY IF EXISTS "Admins can view all valuations" ON public.item_valuations;
DROP POLICY IF EXISTS "Users can view their own valuations" ON public.item_valuations;

CREATE POLICY "Only admins can manage item valuations"
ON public.item_valuations 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());-- Fix remaining security issues by removing conflicting policies and securing all tables

-- Remove conflicting policies that allow any authenticated user access
DROP POLICY IF EXISTS "Admins can manage service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;

-- Ensure security_logs is properly secured
DROP POLICY IF EXISTS "Service role can manage security logs" ON public.security_logs;
CREATE POLICY "Only admins can manage security logs"
ON public.security_logs 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Check if there are any other problematic policies allowing broad access
-- Remove any policies that use "auth.uid() IS NOT NULL" without proper admin check

-- Check and fix quotes table policy to be more restrictive
DROP POLICY IF EXISTS "Secure customer quote access" ON public.quotes;
CREATE POLICY "Admin or customer quote access"
ON public.quotes 
FOR SELECT 
USING (
  public.is_admin_user() OR 
  (customer_email IS NOT NULL AND customer_email = COALESCE(auth.email(), ''))
);

CREATE POLICY "Only admins can modify quotes"
ON public.quotes 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Ensure all public-readable tables are secured
-- Remove any remaining overly permissive policies
DROP POLICY IF EXISTS "Authentication methods are publicly readable" ON public.authentication_methods;
CREATE POLICY "Only admins can access authentication methods"
ON public.authentication_methods 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Brands are publicly readable" ON public.brands;
CREATE POLICY "Only admins can access brands"
ON public.brands 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
CREATE POLICY "Only admins can access categories"
ON public.categories 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Published case studies are publicly readable" ON public.case_studies;
CREATE POLICY "Only admins can access case studies"
ON public.case_studies 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Published educational content is publicly readable" ON public.educational_content;
CREATE POLICY "Only admins can access educational content"
ON public.educational_content 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Market price trends are publicly readable" ON public.market_price_trends;
CREATE POLICY "Only admins can access market price trends"
ON public.market_price_trends 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Pricing plans are publicly readable" ON public.pricing_plans;
CREATE POLICY "Only admins can access pricing plans"
ON public.pricing_plans 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Plan features are publicly readable" ON public.plan_features;
CREATE POLICY "Only admins can access plan features"
ON public.plan_features 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Active promotional offers are publicly readable" ON public.promotional_offers;
CREATE POLICY "Only admins can access promotional offers"
ON public.promotional_offers 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());-- Phase 2: Database Security - Remove authentication tables and update admin function
-- Since this is a contact-form-only website, we'll remove unused auth tables and simplify admin access

-- First, update the is_admin_user() function to work with service role only
-- This allows admin access only via service role, not user authentication
-- Use CASCADE to drop dependent policies
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow service role access (for admin operations)
  -- This removes dependency on user authentication
  RETURN (current_setting('role') = 'service_role' OR 
          (auth.jwt() ->> 'role') = 'service_role');
END;
$$;

-- Remove unused authentication-related tables
-- These tables are not needed for a contact-form-only website

DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.service_requests CASCADE;

-- Remove auth-related scoring and funnel tables (not needed for contact form)
DROP TABLE IF EXISTS public.lead_score_history CASCADE;
DROP TABLE IF EXISTS public.sales_funnel_progression CASCADE;

-- Keep only essential tables for contact form functionality:
-- - contact_inquiries (for form submissions)
-- - leads (for lead management)
-- - security_logs (for security monitoring)
-- - rate_limits (for rate limiting)

-- Update any remaining policies that reference user authentication
-- Since we removed user auth, ensure all sensitive data is service-role protected

-- Update lead scoring rules to work without user context
UPDATE public.lead_scoring_rules 
SET event_criteria = jsonb_set(
  event_criteria, 
  '{user_context}', 
  '"service_only"'::jsonb
)
WHERE event_criteria ? 'user_id';

-- Clean up any orphaned data from removed tables
-- This ensures database consistency after table removal

-- Add a simple admin access pattern for the contact form data
-- Admins can access via service role or direct database connection
COMMENT ON FUNCTION public.is_admin_user() IS 
'Simplified admin function for contact-form website. Only allows service role access.';

-- Log this migration
INSERT INTO public.security_logs (event_type, details, created_at)
VALUES (
  'database_cleanup', 
  '{"action": "removed_auth_tables", "reason": "contact_form_only_website", "phase": "2"}',
  NOW()
) ON CONFLICT DO NOTHING;-- Clean up contact form related tables since we now use Resend
-- The contact_inquiries table is no longer needed as contact forms go directly to Resend

-- Drop the contact_inquiries table and its policies
DROP TABLE IF EXISTS public.contact_inquiries;

-- Note: We're keeping the following tables as they may still be useful:
-- - leads (for CRM and lead management)
-- - newsletter_subscriptions (for newsletter management)
-- - crm_integrations and crm_sync_logs (for CRM system integrations)-- =============================================
-- MYSTERY CARD V2 PRODUCTION SCHEMA
-- =============================================

-- =============================================
-- 1. CREATE ENUMS
-- =============================================

CREATE TYPE public.product_category AS ENUM ('POKEMON', 'SNEAKERS', 'WATCHES', 'HANDBAGS', 'WINE');
CREATE TYPE public.rarity_band AS ENUM ('ICON', 'RARE', 'GRAIL', 'MYTHIC');
CREATE TYPE public.award_bucket AS ENUM ('microWins', 'midWins', 'services', 'jackpot', 'superJackpot', 'reserve');
CREATE TYPE public.pool_event AS ENUM ('ADD', 'RESERVE', 'RELEASE', 'CAPTURE');
CREATE TYPE public.inventory_status AS ENUM ('IN_CUSTODY', 'GUARANTEED_SELLER', 'SOFT_LISTING_OK', 'UNAVAILABLE');
CREATE TYPE public.award_status AS ENUM ('RESERVED', 'FULFILLED', 'CANCELLED', 'EXPIRED');
CREATE TYPE public.pricing_tier AS ENUM ('T5', 'T10', 'T20');

-- =============================================
-- 2. CREATE TABLES
-- =============================================

-- 2.1 Economy Configs (versioned config storage)
CREATE TABLE public.economy_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ
);

-- 2.2 Product Classes (prize catalog)
CREATE TABLE public.product_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  category public.product_category NOT NULL,
  band public.rarity_band NOT NULL,
  bucket public.award_bucket NOT NULL,
  expected_fulfillment_cost_usd NUMERIC(12,2) NOT NULL,
  retail_value_usd NUMERIC(12,2) NOT NULL,
  image_url TEXT,
  inventory_required_status public.inventory_status[] NOT NULL DEFAULT ARRAY['IN_CUSTODY'::public.inventory_status],
  is_jackpot BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 Inventory Items (simulated inventory)
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_class_id UUID NOT NULL REFERENCES public.product_classes(id) ON DELETE CASCADE,
  sku TEXT,
  status public.inventory_status NOT NULL DEFAULT 'IN_CUSTODY',
  reserved_for_award_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 Bucket Balances (pool tracking - 6 buckets)
CREATE TABLE public.bucket_balances (
  bucket public.award_bucket PRIMARY KEY,
  balance_usd NUMERIC(14,4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 Pool Ledger (append-only transaction log)
CREATE TABLE public.pool_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type public.pool_event NOT NULL,
  bucket public.award_bucket NOT NULL,
  amount_usd NUMERIC(14,4) NOT NULL,
  ref_type TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 Purchases (with Stripe fields)
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  tier public.pricing_tier NOT NULL,
  quantity INT NOT NULL,
  unit_price_usd NUMERIC(10,2) NOT NULL,
  total_price_usd NUMERIC(10,2) NOT NULL,
  stripe_amount_total_cents INT NOT NULL,
  net_revenue_usd NUMERIC(10,4),
  pool_contribution_usd NUMERIC(10,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 Reveals (card reveal results)
CREATE TABLE public.reveals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_class_id UUID NOT NULL REFERENCES public.product_classes(id),
  band public.rarity_band NOT NULL,
  is_golden BOOLEAN NOT NULL DEFAULT false,
  credits_awarded INT NOT NULL DEFAULT 0,
  product_credits_awarded INT NOT NULL DEFAULT 0,
  universal_credits_awarded INT NOT NULL DEFAULT 0,
  is_award BOOLEAN NOT NULL DEFAULT false,
  award_id UUID,
  serial_number TEXT NOT NULL,
  card_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.8 User Universal Credits
CREATE TABLE public.user_universal_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9 User Product Credits
CREATE TABLE public.user_product_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_class_id UUID NOT NULL REFERENCES public.product_classes(id) ON DELETE CASCADE,
  credits INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_class_id)
);

-- 2.10 Awards (issued wins)
CREATE TABLE public.awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_class_id UUID NOT NULL REFERENCES public.product_classes(id),
  reveal_id UUID REFERENCES public.reveals(id),
  bucket public.award_bucket NOT NULL,
  reserved_cost_usd NUMERIC(12,2) NOT NULL,
  status public.award_status NOT NULL DEFAULT 'RESERVED',
  fulfilled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.11 Webhook Events (idempotency)
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, event_id)
);

-- =============================================
-- 3. CREATE INDEXES
-- =============================================

CREATE INDEX idx_product_classes_category ON public.product_classes(category);
CREATE INDEX idx_product_classes_band ON public.product_classes(band);
CREATE INDEX idx_product_classes_bucket ON public.product_classes(bucket);
CREATE INDEX idx_inventory_items_product_class ON public.inventory_items(product_class_id);
CREATE INDEX idx_inventory_items_status ON public.inventory_items(status);
CREATE INDEX idx_pool_ledger_bucket ON public.pool_ledger(bucket);
CREATE INDEX idx_pool_ledger_created_at ON public.pool_ledger(created_at);
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_stripe_session ON public.purchases(stripe_session_id);
CREATE INDEX idx_reveals_user_id ON public.reveals(user_id);
CREATE INDEX idx_reveals_purchase_id ON public.reveals(purchase_id);
CREATE INDEX idx_reveals_product_class ON public.reveals(product_class_id);
CREATE INDEX idx_user_product_credits_user ON public.user_product_credits(user_id);
CREATE INDEX idx_awards_user_id ON public.awards(user_id);
CREATE INDEX idx_webhook_events_provider_event ON public.webhook_events(provider, event_id);

-- =============================================
-- 4. ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.economy_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reveals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_universal_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_product_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. RLS POLICIES
-- =============================================

-- Economy Configs: Public read
CREATE POLICY "Anyone can read active economy configs"
  ON public.economy_configs FOR SELECT
  USING (is_active = true);

-- Product Classes: Public read
CREATE POLICY "Anyone can read active product classes"
  ON public.product_classes FOR SELECT
  USING (is_active = true);

-- Inventory Items: No client access (service role only)
-- No policies = no access for anon/authenticated

-- Bucket Balances: No client access (service role only)
-- No policies = no access for anon/authenticated

-- Pool Ledger: No client access (service role only)
-- No policies = no access for anon/authenticated

-- Purchases: Users can only read their own
CREATE POLICY "Users can read their own purchases"
  ON public.purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Reveals: Users can only read their own
CREATE POLICY "Users can read their own reveals"
  ON public.reveals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- User Universal Credits: Users can only read their own
CREATE POLICY "Users can read their own universal credits"
  ON public.user_universal_credits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- User Product Credits: Users can only read their own
CREATE POLICY "Users can read their own product credits"
  ON public.user_product_credits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Awards: Users can only read their own
CREATE POLICY "Users can read their own awards"
  ON public.awards FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Webhook Events: No client access
-- No policies = no access for anon/authenticated

-- =============================================
-- 6. ENABLE REALTIME FOR REVEALS
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.reveals;

-- =============================================
-- 7. ATOMIC RPC: process_mystery_card_purchase
-- =============================================

CREATE OR REPLACE FUNCTION public.process_mystery_card_purchase(
  p_user_id UUID,
  p_stripe_session_id TEXT,
  p_stripe_payment_intent_id TEXT,
  p_tier TEXT,
  p_quantity INT,
  p_unit_price_cents INT,
  p_total_cents INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier public.pricing_tier;
  v_unit_price_usd NUMERIC(10,2);
  v_total_price_usd NUMERIC(10,2);
  v_net_per_card NUMERIC(10,4);
  v_pool_per_card NUMERIC(10,4);
  v_total_pool NUMERIC(10,4);
  v_purchase_id UUID;
  v_reveals JSONB := '[]'::JSONB;
  v_reveal JSONB;
  v_i INT;
  v_random NUMERIC;
  v_band public.rarity_band;
  v_product RECORD;
  v_credits INT;
  v_product_credits INT;
  v_universal_credits INT;
  v_is_golden BOOLEAN;
  v_is_award BOOLEAN := false;
  v_award_id UUID;
  v_bucket_balance NUMERIC;
  v_attempt_rate NUMERIC;
  v_reveal_id UUID;
  v_serial TEXT;
  v_existing_purchase UUID;
BEGIN
  -- Cast tier
  v_tier := p_tier::public.pricing_tier;
  
  -- Convert cents to USD
  v_unit_price_usd := p_unit_price_cents / 100.0;
  v_total_price_usd := p_total_cents / 100.0;
  
  -- Check idempotency: if purchase already exists, return existing reveals
  SELECT id INTO v_existing_purchase
  FROM public.purchases
  WHERE stripe_session_id = p_stripe_session_id;
  
  IF v_existing_purchase IS NOT NULL THEN
    SELECT jsonb_agg(jsonb_build_object(
      'id', r.id,
      'product_class_id', r.product_class_id,
      'band', r.band,
      'is_golden', r.is_golden,
      'is_award', r.is_award,
      'serial_number', r.serial_number,
      'credits_awarded', r.credits_awarded,
      'product', jsonb_build_object(
        'id', pc.id,
        'name', pc.name,
        'brand', pc.brand,
        'model', pc.model,
        'category', pc.category,
        'retail_value_usd', pc.retail_value_usd,
        'image_url', pc.image_url
      )
    ))
    INTO v_reveals
    FROM public.reveals r
    JOIN public.product_classes pc ON pc.id = r.product_class_id
    WHERE r.purchase_id = v_existing_purchase;
    
    RETURN jsonb_build_object('purchase_id', v_existing_purchase, 'reveals', COALESCE(v_reveals, '[]'::JSONB), 'already_processed', true);
  END IF;
  
  -- Calculate economics per card
  -- Net = price - 2.9% - ($0.30/quantity) - $0.30 ops
  v_net_per_card := v_unit_price_usd - (v_unit_price_usd * 0.029) - (0.30 / p_quantity) - 0.30;
  v_pool_per_card := v_net_per_card * 0.35;
  v_total_pool := v_pool_per_card * p_quantity;
  
  -- Insert purchase record
  INSERT INTO public.purchases (
    user_id, stripe_session_id, stripe_payment_intent_id, tier,
    quantity, unit_price_usd, total_price_usd, stripe_amount_total_cents,
    net_revenue_usd, pool_contribution_usd
  ) VALUES (
    p_user_id, p_stripe_session_id, p_stripe_payment_intent_id, v_tier,
    p_quantity, v_unit_price_usd, v_total_price_usd, p_total_cents,
    v_net_per_card * p_quantity, v_total_pool
  ) RETURNING id INTO v_purchase_id;
  
  -- Allocate pool to buckets (percentages: micro 10%, mid 35%, services 20%, jackpot 12%, superJackpot 3%, reserve 20%)
  -- Lock and update each bucket individually
  
  -- microWins: 10%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_total_pool * 0.10), updated_at = now()
  WHERE bucket = 'microWins';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'microWins', v_total_pool * 0.10, 'purchase', v_purchase_id::TEXT);
  
  -- midWins: 35%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_total_pool * 0.35), updated_at = now()
  WHERE bucket = 'midWins';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'midWins', v_total_pool * 0.35, 'purchase', v_purchase_id::TEXT);
  
  -- services: 20%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_total_pool * 0.20), updated_at = now()
  WHERE bucket = 'services';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'services', v_total_pool * 0.20, 'purchase', v_purchase_id::TEXT);
  
  -- jackpot: 12%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_total_pool * 0.12), updated_at = now()
  WHERE bucket = 'jackpot';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'jackpot', v_total_pool * 0.12, 'purchase', v_purchase_id::TEXT);
  
  -- superJackpot: 3%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_total_pool * 0.03), updated_at = now()
  WHERE bucket = 'superJackpot';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'superJackpot', v_total_pool * 0.03, 'purchase', v_purchase_id::TEXT);
  
  -- reserve: 20%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_total_pool * 0.20), updated_at = now()
  WHERE bucket = 'reserve';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'reserve', v_total_pool * 0.20, 'purchase', v_purchase_id::TEXT);
  
  -- Process each card
  FOR v_i IN 1..p_quantity LOOP
    v_is_award := false;
    v_award_id := NULL;
    
    -- Band selection (weighted by tier)
    v_random := random();
    
    v_band := CASE v_tier
      WHEN 'T5' THEN 
        CASE 
          WHEN v_random < 0.93 THEN 'ICON'::public.rarity_band
          WHEN v_random < 0.99 THEN 'RARE'::public.rarity_band
          WHEN v_random < 0.999 THEN 'GRAIL'::public.rarity_band
          ELSE 'MYTHIC'::public.rarity_band
        END
      WHEN 'T10' THEN 
        CASE 
          WHEN v_random < 0.85 THEN 'ICON'::public.rarity_band
          WHEN v_random < 0.97 THEN 'RARE'::public.rarity_band
          WHEN v_random < 0.995 THEN 'GRAIL'::public.rarity_band
          ELSE 'MYTHIC'::public.rarity_band
        END
      WHEN 'T20' THEN 
        CASE 
          WHEN v_random < 0.75 THEN 'ICON'::public.rarity_band
          WHEN v_random < 0.93 THEN 'RARE'::public.rarity_band
          WHEN v_random < 0.99 THEN 'GRAIL'::public.rarity_band
          ELSE 'MYTHIC'::public.rarity_band
        END
    END;
    
    -- Select product from matching band (inventory-aware with fallback)
    SELECT * INTO v_product
    FROM public.product_classes pc
    WHERE pc.band = v_band
      AND pc.is_active = true
      AND (
        -- Either has inventory in required status, or we allow soft listing
        EXISTS (
          SELECT 1 FROM public.inventory_items ii 
          WHERE ii.product_class_id = pc.id 
          AND ii.status = ANY(pc.inventory_required_status)
          AND ii.reserved_for_award_id IS NULL
        )
        OR 'SOFT_LISTING_OK' = ANY(pc.inventory_required_status)
      )
    ORDER BY random()
    LIMIT 1;
    
    -- Fallback: if no product found, try lower bands
    IF v_product IS NULL AND v_band = 'MYTHIC' THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.band = 'GRAIL' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    IF v_product IS NULL AND v_band IN ('MYTHIC', 'GRAIL') THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.band = 'RARE' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    IF v_product IS NULL THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.band = 'ICON' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    -- Calculate credits: 1 credit = $0.01 of pool contribution
    v_credits := FLOOR(v_pool_per_card / 0.01);
    
    -- Split credits by band (higher bands get more product-specific credits)
    v_product_credits := CASE v_band
      WHEN 'ICON' THEN FLOOR(v_credits * 0.70)
      WHEN 'RARE' THEN FLOOR(v_credits * 0.80)
      WHEN 'GRAIL' THEN FLOOR(v_credits * 0.90)
      WHEN 'MYTHIC' THEN FLOOR(v_credits * 0.95)
    END;
    v_universal_credits := v_credits - v_product_credits;
    
    -- Golden card check (very rare: 1 in 10000 for T5, better odds for higher tiers)
    v_is_golden := CASE v_tier
      WHEN 'T5' THEN random() < 0.0001
      WHEN 'T10' THEN random() < 0.0002
      WHEN 'T20' THEN random() < 0.0005
    END;
    
    -- Golden cards get instant 100% (full product cost in credits)
    IF v_is_golden THEN
      v_product_credits := FLOOR(v_product.expected_fulfillment_cost_usd * 100);
      v_is_award := true;
    END IF;
    
    -- Award attempt (if not already golden)
    IF NOT v_is_golden THEN
      -- Attempt rate based on tier and bucket
      v_attempt_rate := CASE v_tier
        WHEN 'T5' THEN 0.001
        WHEN 'T10' THEN 0.002
        WHEN 'T20' THEN 0.005
      END;
      
      IF random() < v_attempt_rate AND v_product.bucket = 'midWins' THEN
        -- Lock the specific bucket row and check balance
        SELECT balance_usd INTO v_bucket_balance
        FROM public.bucket_balances
        WHERE bucket = v_product.bucket
        FOR UPDATE;
        
        IF v_bucket_balance >= v_product.expected_fulfillment_cost_usd THEN
          -- Reserve the cost from bucket
          UPDATE public.bucket_balances
          SET balance_usd = balance_usd - v_product.expected_fulfillment_cost_usd,
              updated_at = now()
          WHERE bucket = v_product.bucket;
          
          -- Create award
          INSERT INTO public.awards (user_id, product_class_id, bucket, reserved_cost_usd, status)
          VALUES (p_user_id, v_product.id, v_product.bucket, v_product.expected_fulfillment_cost_usd, 'RESERVED')
          RETURNING id INTO v_award_id;
          
          -- Log reservation
          INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
          VALUES ('RESERVE', v_product.bucket, v_product.expected_fulfillment_cost_usd, 'award', v_award_id::TEXT);
          
          v_is_award := true;
        ELSE
          -- Near-win: boost credits by 12%
          v_credits := FLOOR(v_credits * 1.12);
          v_product_credits := FLOOR(v_product_credits * 1.12);
        END IF;
      END IF;
    END IF;
    
    -- Generate serial number
    v_serial := LPAD((FLOOR(random() * 10000)::INT)::TEXT, 4, '0') || '/' || '10000';
    
    -- Insert reveal
    INSERT INTO public.reveals (
      purchase_id, user_id, product_class_id, band, is_golden,
      credits_awarded, product_credits_awarded, universal_credits_awarded,
      is_award, award_id, serial_number
    ) VALUES (
      v_purchase_id, p_user_id, v_product.id, v_band, v_is_golden,
      v_credits, v_product_credits, v_universal_credits,
      v_is_award, v_award_id, v_serial
    ) RETURNING id INTO v_reveal_id;
    
    -- Update award with reveal_id
    IF v_award_id IS NOT NULL THEN
      UPDATE public.awards SET reveal_id = v_reveal_id WHERE id = v_award_id;
    END IF;
    
    -- Upsert user product credits
    INSERT INTO public.user_product_credits (user_id, product_class_id, credits)
    VALUES (p_user_id, v_product.id, v_product_credits)
    ON CONFLICT (user_id, product_class_id)
    DO UPDATE SET credits = public.user_product_credits.credits + v_product_credits, updated_at = now();
    
    -- Upsert user universal credits
    INSERT INTO public.user_universal_credits (user_id, credits)
    VALUES (p_user_id, v_universal_credits)
    ON CONFLICT (user_id)
    DO UPDATE SET credits = public.user_universal_credits.credits + v_universal_credits, updated_at = now();
    
    -- Build reveal JSON
    v_reveal := jsonb_build_object(
      'id', v_reveal_id,
      'product_class_id', v_product.id,
      'band', v_band,
      'is_golden', v_is_golden,
      'is_award', v_is_award,
      'serial_number', v_serial,
      'credits_awarded', v_credits,
      'product_credits_awarded', v_product_credits,
      'universal_credits_awarded', v_universal_credits,
      'product', jsonb_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'brand', v_product.brand,
        'model', v_product.model,
        'category', v_product.category,
        'retail_value_usd', v_product.retail_value_usd,
        'image_url', v_product.image_url
      )
    );
    
    v_reveals := v_reveals || v_reveal;
  END LOOP;
  
  RETURN jsonb_build_object('purchase_id', v_purchase_id, 'reveals', v_reveals, 'already_processed', false);
END;
$$;

-- =============================================
-- 8. SEED DATA
-- =============================================

-- 8.1 Initialize bucket balances
INSERT INTO public.bucket_balances (bucket, balance_usd) VALUES
  ('microWins', 0),
  ('midWins', 0),
  ('services', 0),
  ('jackpot', 0),
  ('superJackpot', 0),
  ('reserve', 0);

-- 8.2 Insert economy config v2
INSERT INTO public.economy_configs (version, config, is_active, activated_at) VALUES (
  'v2.0',
  '{
    "pool_split": {
      "microWins": 0.10,
      "midWins": 0.35,
      "services": 0.20,
      "jackpot": 0.12,
      "superJackpot": 0.03,
      "reserve": 0.20
    },
    "tier_weights": {
      "T5": {"ICON": 0.93, "RARE": 0.06, "GRAIL": 0.009, "MYTHIC": 0.001},
      "T10": {"ICON": 0.85, "RARE": 0.12, "GRAIL": 0.025, "MYTHIC": 0.005},
      "T20": {"ICON": 0.75, "RARE": 0.18, "GRAIL": 0.06, "MYTHIC": 0.01}
    },
    "credit_splits": {
      "ICON": {"product": 0.70, "universal": 0.30},
      "RARE": {"product": 0.80, "universal": 0.20},
      "GRAIL": {"product": 0.90, "universal": 0.10},
      "MYTHIC": {"product": 0.95, "universal": 0.05}
    },
    "golden_rates": {"T5": 0.0001, "T10": 0.0002, "T20": 0.0005},
    "award_attempt_rates": {"T5": 0.001, "T10": 0.002, "T20": 0.005},
    "near_win_boost": 1.12,
    "fees": {"stripe_pct": 0.029, "stripe_fixed": 0.30, "ops": 0.30}
  }'::JSONB,
  true,
  now()
);

-- 8.3 Insert product classes (merged catalog)
-- WATCHES
INSERT INTO public.product_classes (name, brand, model, category, band, bucket, expected_fulfillment_cost_usd, retail_value_usd, image_url, is_jackpot) VALUES
  ('Patek Perpetual Calendar', 'Patek Philippe', '5320G', 'WATCHES', 'MYTHIC', 'superJackpot', 85000, 100000, '/lovable-uploads/patek-perpetual.png', true),
  ('AP Royal Oak Skeleton', 'Audemars Piguet', '15407ST', 'WATCHES', 'MYTHIC', 'jackpot', 42000, 50000, '/lovable-uploads/ap-skeleton.png', true),
  ('Rolex Submariner', 'Rolex', '126610LN', 'WATCHES', 'GRAIL', 'midWins', 10000, 12000, '/lovable-uploads/rolex-submariner.png', false),
  ('Rolex Daytona', 'Rolex', '116500LN', 'WATCHES', 'GRAIL', 'midWins', 28000, 35000, '/lovable-uploads/rolex-daytona.png', false),
  ('Omega Speedmaster', 'Omega', 'Moonwatch', 'WATCHES', 'RARE', 'midWins', 5500, 7000, '/lovable-uploads/omega-speedmaster.png', false),
  ('Tudor Black Bay', 'Tudor', 'BB58', 'WATCHES', 'ICON', 'midWins', 3200, 4000, '/lovable-uploads/tudor-blackbay.png', false);

-- HANDBAGS
INSERT INTO public.product_classes (name, brand, model, category, band, bucket, expected_fulfillment_cost_usd, retail_value_usd, image_url, is_jackpot) VALUES
  ('Hermès Birkin 35', 'Hermès', 'Birkin 35 Togo', 'HANDBAGS', 'MYTHIC', 'jackpot', 25000, 30000, '/lovable-uploads/hermes-birkin.png', true),
  ('Chanel Classic Flap', 'Chanel', 'Medium Caviar', 'HANDBAGS', 'GRAIL', 'midWins', 7500, 9500, '/lovable-uploads/chanel-flap.png', false),
  ('Louis Vuitton Capucines', 'Louis Vuitton', 'MM', 'HANDBAGS', 'RARE', 'midWins', 4500, 6000, '/lovable-uploads/lv-capucines.png', false),
  ('Gucci Bamboo 1947', 'Gucci', 'Small', 'HANDBAGS', 'ICON', 'midWins', 2800, 3500, '/lovable-uploads/gucci-bamboo.png', false);

-- POKEMON
INSERT INTO public.product_classes (name, brand, model, category, band, bucket, expected_fulfillment_cost_usd, retail_value_usd, image_url, is_jackpot, inventory_required_status) VALUES
  ('Charizard 1st Edition', 'Pokémon', 'Base Set Holo', 'POKEMON', 'MYTHIC', 'jackpot', 35000, 50000, '/lovable-uploads/charizard-1st.png', true, ARRAY['GUARANTEED_SELLER'::public.inventory_status]),
  ('Pikachu Illustrator', 'Pokémon', 'Promo', 'POKEMON', 'MYTHIC', 'superJackpot', 200000, 300000, '/lovable-uploads/pikachu-illustrator.png', true, ARRAY['IN_CUSTODY'::public.inventory_status]),
  ('PSA 10 Vintage Holo', 'Pokémon', 'Various', 'POKEMON', 'GRAIL', 'midWins', 400, 500, '/lovable-uploads/pokemon-grail.png', false, ARRAY['SOFT_LISTING_OK'::public.inventory_status]),
  ('Pokémon Hit Card', 'Pokémon', 'Modern Hit', 'POKEMON', 'ICON', 'midWins', 60, 80, '/lovable-uploads/pokemon-hit.png', false, ARRAY['SOFT_LISTING_OK'::public.inventory_status]);

-- SNEAKERS
INSERT INTO public.product_classes (name, brand, model, category, band, bucket, expected_fulfillment_cost_usd, retail_value_usd, image_url, is_jackpot, inventory_required_status) VALUES
  ('Nike Air Mag', 'Nike', 'Back to Future', 'SNEAKERS', 'MYTHIC', 'superJackpot', 80000, 100000, '/lovable-uploads/nike-mag.png', true, ARRAY['IN_CUSTODY'::public.inventory_status]),
  ('Travis Scott x Nike', 'Nike', 'Reverse Mocha', 'SNEAKERS', 'GRAIL', 'midWins', 1000, 1200, '/lovable-uploads/travis-scott.png', false, ARRAY['SOFT_LISTING_OK'::public.inventory_status]),
  ('Jordan 1 Chicago', 'Nike', '1985 OG', 'SNEAKERS', 'GRAIL', 'midWins', 4500, 6000, '/lovable-uploads/jordan-chicago.png', false, ARRAY['GUARANTEED_SELLER'::public.inventory_status]),
  ('Sneaker Drop', 'Various', 'Limited Release', 'SNEAKERS', 'ICON', 'midWins', 150, 200, '/lovable-uploads/sneaker-drop.png', false, ARRAY['SOFT_LISTING_OK'::public.inventory_status]);

-- WINE
INSERT INTO public.product_classes (name, brand, model, category, band, bucket, expected_fulfillment_cost_usd, retail_value_usd, image_url, is_jackpot, inventory_required_status) VALUES
  ('Romanée-Conti', 'DRC', '2019', 'WINE', 'MYTHIC', 'jackpot', 18000, 25000, '/lovable-uploads/romanee-conti.png', true, ARRAY['IN_CUSTODY'::public.inventory_status]),
  ('Pétrus', 'Pétrus', '2018', 'WINE', 'GRAIL', 'midWins', 3500, 5000, '/lovable-uploads/petrus.png', false, ARRAY['GUARANTEED_SELLER'::public.inventory_status]),
  ('Opus One', 'Opus One', '2020', 'WINE', 'RARE', 'midWins', 280, 400, '/lovable-uploads/opus-one.png', false, ARRAY['SOFT_LISTING_OK'::public.inventory_status]),
  ('Wine Pack Voucher', 'Various', 'Curated Selection', 'WINE', 'ICON', 'midWins', 90, 120, '/lovable-uploads/wine-pack.png', false, ARRAY['SOFT_LISTING_OK'::public.inventory_status]);-- Phase 1.1: Add promo bucket to enum (must be committed separately)
ALTER TYPE public.award_bucket ADD VALUE IF NOT EXISTS 'promo';-- Phase 1.2-1.5: Promo Pool remaining schema changes

-- 1.2 Initialize promo bucket balance
INSERT INTO public.bucket_balances(bucket, balance_usd)
VALUES ('promo', 0)
ON CONFLICT (bucket) DO NOTHING;

-- 1.3 Create daily_free_pulls table
CREATE TABLE IF NOT EXISTS public.daily_free_pulls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pull_date DATE NOT NULL,
  reveal_id UUID REFERENCES public.reveals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, pull_date)
);

ALTER TABLE public.daily_free_pulls ENABLE ROW LEVEL SECURITY;

-- Users can only read their own claims
CREATE POLICY "daily_free_pulls_read_own"
ON public.daily_free_pulls FOR SELECT
USING (auth.uid() = user_id);

-- 1.4 Create promo_spend_daily table (service role only - no RLS policies)
CREATE TABLE IF NOT EXISTS public.promo_spend_daily (
  spend_date DATE PRIMARY KEY,
  spent_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.5 Enable realtime for daily_free_pulls
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_free_pulls;-- Enable RLS on promo_spend_daily (no policies = service role only access)
ALTER TABLE public.promo_spend_daily ENABLE ROW LEVEL SECURITY;-- Phase 3: Modify process_mystery_card_purchase to add promo skim logic
CREATE OR REPLACE FUNCTION public.process_mystery_card_purchase(p_user_id uuid, p_stripe_session_id text, p_stripe_payment_intent_id text, p_tier text, p_quantity integer, p_unit_price_cents integer, p_total_cents integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tier public.pricing_tier;
  v_unit_price_usd NUMERIC(10,2);
  v_total_price_usd NUMERIC(10,2);
  v_net_per_card NUMERIC(10,4);
  v_pool_per_card NUMERIC(10,4);
  v_total_pool NUMERIC(10,4);
  v_purchase_id UUID;
  v_reveals JSONB := '[]'::JSONB;
  v_reveal JSONB;
  v_i INT;
  v_random NUMERIC;
  v_band public.rarity_band;
  v_product RECORD;
  v_credits INT;
  v_product_credits INT;
  v_universal_credits INT;
  v_is_golden BOOLEAN;
  v_is_award BOOLEAN := false;
  v_award_id UUID;
  v_bucket_balance NUMERIC;
  v_attempt_rate NUMERIC;
  v_reveal_id UUID;
  v_serial TEXT;
  v_existing_purchase UUID;
  -- Promo pool variables
  v_config JSONB;
  v_promo_skim_pct NUMERIC;
  v_promo_add NUMERIC;
  v_pool_remaining NUMERIC;
  v_tmp NUMERIC;
BEGIN
  -- Cast tier
  v_tier := p_tier::public.pricing_tier;
  
  -- Convert cents to USD
  v_unit_price_usd := p_unit_price_cents / 100.0;
  v_total_price_usd := p_total_cents / 100.0;
  
  -- Check idempotency: if purchase already exists, return existing reveals
  SELECT id INTO v_existing_purchase
  FROM public.purchases
  WHERE stripe_session_id = p_stripe_session_id;
  
  IF v_existing_purchase IS NOT NULL THEN
    SELECT jsonb_agg(jsonb_build_object(
      'id', r.id,
      'product_class_id', r.product_class_id,
      'band', r.band,
      'is_golden', r.is_golden,
      'is_award', r.is_award,
      'serial_number', r.serial_number,
      'credits_awarded', r.credits_awarded,
      'product', jsonb_build_object(
        'id', pc.id,
        'name', pc.name,
        'brand', pc.brand,
        'model', pc.model,
        'category', pc.category,
        'retail_value_usd', pc.retail_value_usd,
        'image_url', pc.image_url
      )
    ))
    INTO v_reveals
    FROM public.reveals r
    JOIN public.product_classes pc ON pc.id = r.product_class_id
    WHERE r.purchase_id = v_existing_purchase;
    
    RETURN jsonb_build_object('purchase_id', v_existing_purchase, 'reveals', COALESCE(v_reveals, '[]'::JSONB), 'already_processed', true);
  END IF;
  
  -- Calculate economics per card
  -- Net = price - 2.9% - ($0.30/quantity) - $0.30 ops
  v_net_per_card := v_unit_price_usd - (v_unit_price_usd * 0.029) - (0.30 / p_quantity) - 0.30;
  v_pool_per_card := v_net_per_card * 0.35;
  v_total_pool := v_pool_per_card * p_quantity;
  
  -- Load economy config for promo settings
  SELECT config INTO v_config FROM public.economy_configs WHERE is_active = true LIMIT 1;
  
  -- Calculate promo skim (carved from the 35% pool)
  v_promo_skim_pct := COALESCE((v_config->'promoPool'->>'skimPctOfPoolAdd')::NUMERIC, 0);
  v_promo_add := ROUND(v_total_pool * v_promo_skim_pct, 4);
  v_pool_remaining := v_total_pool - v_promo_add;
  
  -- Insert purchase record
  INSERT INTO public.purchases (
    user_id, stripe_session_id, stripe_payment_intent_id, tier,
    quantity, unit_price_usd, total_price_usd, stripe_amount_total_cents,
    net_revenue_usd, pool_contribution_usd
  ) VALUES (
    p_user_id, p_stripe_session_id, p_stripe_payment_intent_id, v_tier,
    p_quantity, v_unit_price_usd, v_total_price_usd, p_total_cents,
    v_net_per_card * p_quantity, v_total_pool
  ) RETURNING id INTO v_purchase_id;
  
  -- Add to promo bucket with row lock (if promo skim is enabled)
  IF v_promo_add > 0 THEN
    SELECT balance_usd INTO v_tmp
    FROM public.bucket_balances WHERE bucket = 'promo' FOR UPDATE;
    
    UPDATE public.bucket_balances
    SET balance_usd = balance_usd + v_promo_add, updated_at = now()
    WHERE bucket = 'promo';
    
    INSERT INTO public.pool_ledger(event_type, bucket, amount_usd, ref_type, ref_id)
    VALUES ('ADD', 'promo', v_promo_add, 'purchase', v_purchase_id::TEXT);
  END IF;
  
  -- Allocate remaining pool to buckets (percentages: micro 10%, mid 35%, services 20%, jackpot 12%, superJackpot 3%, reserve 20%)
  -- Lock and update each bucket individually, using v_pool_remaining instead of v_total_pool
  
  -- microWins: 10%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_pool_remaining * 0.10), updated_at = now()
  WHERE bucket = 'microWins';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'microWins', v_pool_remaining * 0.10, 'purchase', v_purchase_id::TEXT);
  
  -- midWins: 35%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_pool_remaining * 0.35), updated_at = now()
  WHERE bucket = 'midWins';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'midWins', v_pool_remaining * 0.35, 'purchase', v_purchase_id::TEXT);
  
  -- services: 20%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_pool_remaining * 0.20), updated_at = now()
  WHERE bucket = 'services';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'services', v_pool_remaining * 0.20, 'purchase', v_purchase_id::TEXT);
  
  -- jackpot: 12%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_pool_remaining * 0.12), updated_at = now()
  WHERE bucket = 'jackpot';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'jackpot', v_pool_remaining * 0.12, 'purchase', v_purchase_id::TEXT);
  
  -- superJackpot: 3%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_pool_remaining * 0.03), updated_at = now()
  WHERE bucket = 'superJackpot';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'superJackpot', v_pool_remaining * 0.03, 'purchase', v_purchase_id::TEXT);
  
  -- reserve: 20%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_pool_remaining * 0.20), updated_at = now()
  WHERE bucket = 'reserve';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'reserve', v_pool_remaining * 0.20, 'purchase', v_purchase_id::TEXT);
  
  -- Process each card
  FOR v_i IN 1..p_quantity LOOP
    v_is_award := false;
    v_award_id := NULL;
    
    -- Band selection (weighted by tier)
    v_random := random();
    
    v_band := CASE v_tier
      WHEN 'T5' THEN 
        CASE 
          WHEN v_random < 0.93 THEN 'ICON'::public.rarity_band
          WHEN v_random < 0.99 THEN 'RARE'::public.rarity_band
          WHEN v_random < 0.999 THEN 'GRAIL'::public.rarity_band
          ELSE 'MYTHIC'::public.rarity_band
        END
      WHEN 'T10' THEN 
        CASE 
          WHEN v_random < 0.85 THEN 'ICON'::public.rarity_band
          WHEN v_random < 0.97 THEN 'RARE'::public.rarity_band
          WHEN v_random < 0.995 THEN 'GRAIL'::public.rarity_band
          ELSE 'MYTHIC'::public.rarity_band
        END
      WHEN 'T20' THEN 
        CASE 
          WHEN v_random < 0.75 THEN 'ICON'::public.rarity_band
          WHEN v_random < 0.93 THEN 'RARE'::public.rarity_band
          WHEN v_random < 0.99 THEN 'GRAIL'::public.rarity_band
          ELSE 'MYTHIC'::public.rarity_band
        END
    END;
    
    -- Select product from matching band (inventory-aware with fallback)
    SELECT * INTO v_product
    FROM public.product_classes pc
    WHERE pc.band = v_band
      AND pc.is_active = true
      AND (
        -- Either has inventory in required status, or we allow soft listing
        EXISTS (
          SELECT 1 FROM public.inventory_items ii 
          WHERE ii.product_class_id = pc.id 
          AND ii.status = ANY(pc.inventory_required_status)
          AND ii.reserved_for_award_id IS NULL
        )
        OR 'SOFT_LISTING_OK' = ANY(pc.inventory_required_status)
      )
    ORDER BY random()
    LIMIT 1;
    
    -- Fallback: if no product found, try lower bands
    IF v_product IS NULL AND v_band = 'MYTHIC' THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.band = 'GRAIL' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    IF v_product IS NULL AND v_band IN ('MYTHIC', 'GRAIL') THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.band = 'RARE' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    IF v_product IS NULL THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.band = 'ICON' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    -- Calculate credits: 1 credit = $0.01 of pool contribution
    v_credits := FLOOR(v_pool_per_card / 0.01);
    
    -- Split credits by band (higher bands get more product-specific credits)
    v_product_credits := CASE v_band
      WHEN 'ICON' THEN FLOOR(v_credits * 0.70)
      WHEN 'RARE' THEN FLOOR(v_credits * 0.80)
      WHEN 'GRAIL' THEN FLOOR(v_credits * 0.90)
      WHEN 'MYTHIC' THEN FLOOR(v_credits * 0.95)
    END;
    v_universal_credits := v_credits - v_product_credits;
    
    -- Golden card check (very rare: 1 in 10000 for T5, better odds for higher tiers)
    v_is_golden := CASE v_tier
      WHEN 'T5' THEN random() < 0.0001
      WHEN 'T10' THEN random() < 0.0002
      WHEN 'T20' THEN random() < 0.0005
    END;
    
    -- Golden cards get instant 100% (full product cost in credits)
    IF v_is_golden THEN
      v_product_credits := FLOOR(v_product.expected_fulfillment_cost_usd * 100);
      v_is_award := true;
    END IF;
    
    -- Award attempt (if not already golden)
    IF NOT v_is_golden THEN
      -- Attempt rate based on tier and bucket
      v_attempt_rate := CASE v_tier
        WHEN 'T5' THEN 0.001
        WHEN 'T10' THEN 0.002
        WHEN 'T20' THEN 0.005
      END;
      
      IF random() < v_attempt_rate AND v_product.bucket = 'midWins' THEN
        -- Lock the specific bucket row and check balance
        SELECT balance_usd INTO v_bucket_balance
        FROM public.bucket_balances
        WHERE bucket = v_product.bucket
        FOR UPDATE;
        
        IF v_bucket_balance >= v_product.expected_fulfillment_cost_usd THEN
          -- Reserve the cost from bucket
          UPDATE public.bucket_balances
          SET balance_usd = balance_usd - v_product.expected_fulfillment_cost_usd,
              updated_at = now()
          WHERE bucket = v_product.bucket;
          
          -- Create award
          INSERT INTO public.awards (user_id, product_class_id, bucket, reserved_cost_usd, status)
          VALUES (p_user_id, v_product.id, v_product.bucket, v_product.expected_fulfillment_cost_usd, 'RESERVED')
          RETURNING id INTO v_award_id;
          
          -- Log reservation
          INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
          VALUES ('RESERVE', v_product.bucket, v_product.expected_fulfillment_cost_usd, 'award', v_award_id::TEXT);
          
          v_is_award := true;
        ELSE
          -- Near-win: boost credits by 12%
          v_credits := FLOOR(v_credits * 1.12);
          v_product_credits := FLOOR(v_product_credits * 1.12);
        END IF;
      END IF;
    END IF;
    
    -- Generate serial number
    v_serial := LPAD((FLOOR(random() * 10000)::INT)::TEXT, 4, '0') || '/' || '10000';
    
    -- Insert reveal
    INSERT INTO public.reveals (
      purchase_id, user_id, product_class_id, band, is_golden,
      credits_awarded, product_credits_awarded, universal_credits_awarded,
      is_award, award_id, serial_number
    ) VALUES (
      v_purchase_id, p_user_id, v_product.id, v_band, v_is_golden,
      v_credits, v_product_credits, v_universal_credits,
      v_is_award, v_award_id, v_serial
    ) RETURNING id INTO v_reveal_id;
    
    -- Update award with reveal_id
    IF v_award_id IS NOT NULL THEN
      UPDATE public.awards SET reveal_id = v_reveal_id WHERE id = v_award_id;
    END IF;
    
    -- Upsert user product credits
    INSERT INTO public.user_product_credits (user_id, product_class_id, credits)
    VALUES (p_user_id, v_product.id, v_product_credits)
    ON CONFLICT (user_id, product_class_id)
    DO UPDATE SET credits = public.user_product_credits.credits + v_product_credits, updated_at = now();
    
    -- Upsert user universal credits
    INSERT INTO public.user_universal_credits (user_id, credits)
    VALUES (p_user_id, v_universal_credits)
    ON CONFLICT (user_id)
    DO UPDATE SET credits = public.user_universal_credits.credits + v_universal_credits, updated_at = now();
    
    -- Build reveal JSON
    v_reveal := jsonb_build_object(
      'id', v_reveal_id,
      'product_class_id', v_product.id,
      'band', v_band,
      'is_golden', v_is_golden,
      'is_award', v_is_award,
      'serial_number', v_serial,
      'credits_awarded', v_credits,
      'product_credits_awarded', v_product_credits,
      'universal_credits_awarded', v_universal_credits,
      'product', jsonb_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'brand', v_product.brand,
        'model', v_product.model,
        'category', v_product.category,
        'retail_value_usd', v_product.retail_value_usd,
        'image_url', v_product.image_url
      )
    );
    
    v_reveals := v_reveals || v_reveal;
  END LOOP;
  
  RETURN jsonb_build_object('purchase_id', v_purchase_id, 'reveals', v_reveals, 'already_processed', false);
END;
$function$;-- Phase 4: Create process_daily_free_pull RPC and make reveals.purchase_id nullable

-- First, make purchase_id nullable for free pulls
ALTER TABLE public.reveals ALTER COLUMN purchase_id DROP NOT NULL;

-- Create the daily free pull RPC
CREATE OR REPLACE FUNCTION public.process_daily_free_pull(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_config JSONB;
  v_promo_config JSONB;
  v_free_pull_config JSONB;
  v_today DATE := CURRENT_DATE;
  v_reveal_id UUID;
  v_band public.rarity_band;
  v_product RECORD;
  v_credits_grant INT;
  v_max_award_cost NUMERIC;
  v_daily_cap NUMERIC;
  v_promo_balance NUMERIC;
  v_daily_spent NUMERIC;
  v_is_award BOOLEAN := FALSE;
  v_award_id UUID;
  v_serial TEXT;
  v_random NUMERIC;
BEGIN
  -- 1. Load active economy config
  SELECT config INTO v_config FROM economy_configs WHERE is_active = true LIMIT 1;
  v_promo_config := v_config->'promoPool';
  v_free_pull_config := v_promo_config->'freePull';
  
  -- Check if promo/free pull is enabled
  IF v_promo_config IS NULL OR v_free_pull_config IS NULL THEN
    RETURN jsonb_build_object('error', 'Promo pool not configured');
  END IF;
  
  IF NOT COALESCE((v_promo_config->>'enabled')::BOOLEAN, FALSE) OR 
     NOT COALESCE((v_free_pull_config->>'enabled')::BOOLEAN, FALSE) THEN
    RETURN jsonb_build_object('error', 'Free pulls are currently disabled');
  END IF;
  
  -- 2. Enforce 1/day limit (unique constraint will fail if already claimed)
  BEGIN
    INSERT INTO daily_free_pulls (user_id, pull_date)
    VALUES (p_user_id, v_today);
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('error', 'Free pull already claimed today', 'next_available', v_today + INTERVAL '1 day');
  END;
  
  -- 3. Get config values
  v_credits_grant := COALESCE((v_free_pull_config->>'creditsGrant')::INT, 200);
  v_max_award_cost := COALESCE((v_free_pull_config->>'maxAwardCostUsd')::NUMERIC, 80);
  v_daily_cap := COALESCE((v_promo_config->>'dailySpendCapUsd')::NUMERIC, 500);
  
  -- 4. Band selection (weighted by freePull config)
  v_random := random();
  v_band := CASE
    WHEN v_random < COALESCE((v_free_pull_config->'bandWeightsOverride'->>'ICON')::NUMERIC, 0.97) THEN 'ICON'::rarity_band
    WHEN v_random < COALESCE((v_free_pull_config->'bandWeightsOverride'->>'ICON')::NUMERIC, 0.97) + 
                    COALESCE((v_free_pull_config->'bandWeightsOverride'->>'RARE')::NUMERIC, 0.025) THEN 'RARE'::rarity_band
    WHEN v_random < COALESCE((v_free_pull_config->'bandWeightsOverride'->>'ICON')::NUMERIC, 0.97) + 
                    COALESCE((v_free_pull_config->'bandWeightsOverride'->>'RARE')::NUMERIC, 0.025) +
                    COALESCE((v_free_pull_config->'bandWeightsOverride'->>'GRAIL')::NUMERIC, 0.005) THEN 'GRAIL'::rarity_band
    ELSE 'MYTHIC'::rarity_band
  END;
  
  -- 5. Select product from band
  SELECT * INTO v_product
  FROM product_classes pc
  WHERE pc.band = v_band AND pc.is_active = true
  ORDER BY random() LIMIT 1;
  
  -- Fallback to ICON if no product found
  IF v_product IS NULL THEN
    SELECT * INTO v_product FROM product_classes WHERE band = 'ICON' AND is_active = true ORDER BY random() LIMIT 1;
    v_band := 'ICON';
  END IF;
  
  -- If still no product, return error
  IF v_product IS NULL THEN
    -- Rollback the daily_free_pulls insert by deleting it
    DELETE FROM daily_free_pulls WHERE user_id = p_user_id AND pull_date = v_today;
    RETURN jsonb_build_object('error', 'No products available');
  END IF;
  
  -- 6. Attempt award (if enabled and product qualifies)
  IF COALESCE((v_free_pull_config->>'allowAwards')::BOOLEAN, TRUE) AND 
     v_product.expected_fulfillment_cost_usd <= v_max_award_cost THEN
    
    -- Lock promo bucket
    SELECT balance_usd INTO v_promo_balance
    FROM bucket_balances WHERE bucket = 'promo' FOR UPDATE;
    
    -- Lock/upsert daily spend
    INSERT INTO promo_spend_daily (spend_date, spent_usd)
    VALUES (v_today, 0)
    ON CONFLICT (spend_date) DO NOTHING;
    
    SELECT spent_usd INTO v_daily_spent
    FROM promo_spend_daily WHERE spend_date = v_today FOR UPDATE;
    
    -- Check if we can fund this award
    IF v_promo_balance >= v_product.expected_fulfillment_cost_usd AND
       (v_daily_spent + v_product.expected_fulfillment_cost_usd) <= v_daily_cap THEN
      
      -- Reserve from promo bucket
      UPDATE bucket_balances
      SET balance_usd = balance_usd - v_product.expected_fulfillment_cost_usd, updated_at = now()
      WHERE bucket = 'promo';
      
      -- Update daily spend
      UPDATE promo_spend_daily
      SET spent_usd = spent_usd + v_product.expected_fulfillment_cost_usd, updated_at = now()
      WHERE spend_date = v_today;
      
      -- Create award
      INSERT INTO awards (user_id, product_class_id, bucket, reserved_cost_usd, status)
      VALUES (p_user_id, v_product.id, 'promo', v_product.expected_fulfillment_cost_usd, 'RESERVED')
      RETURNING id INTO v_award_id;
      
      -- Log to ledger
      INSERT INTO pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
      VALUES ('RESERVE', 'promo', v_product.expected_fulfillment_cost_usd, 'award', v_award_id::TEXT);
      
      v_is_award := TRUE;
    END IF;
  END IF;
  
  -- 7. Generate serial
  v_serial := LPAD((FLOOR(random() * 10000)::INT)::TEXT, 4, '0') || '/10000';
  
  -- 8. Insert reveal (with NULL purchase_id for free pulls)
  INSERT INTO reveals (
    purchase_id, user_id, product_class_id, band, is_golden,
    credits_awarded, product_credits_awarded, universal_credits_awarded,
    is_award, award_id, serial_number
  ) VALUES (
    NULL, p_user_id, v_product.id, v_band, FALSE,
    v_credits_grant, 
    FLOOR(v_credits_grant * 0.7), -- 70% to product
    FLOOR(v_credits_grant * 0.3), -- 30% universal
    v_is_award, v_award_id, v_serial
  ) RETURNING id INTO v_reveal_id;
  
  -- 9. Update daily_free_pulls with reveal_id
  UPDATE daily_free_pulls SET reveal_id = v_reveal_id WHERE user_id = p_user_id AND pull_date = v_today;
  
  -- 10. Update award with reveal_id
  IF v_award_id IS NOT NULL THEN
    UPDATE awards SET reveal_id = v_reveal_id WHERE id = v_award_id;
  END IF;
  
  -- 11. Upsert credits
  INSERT INTO user_product_credits (user_id, product_class_id, credits)
  VALUES (p_user_id, v_product.id, FLOOR(v_credits_grant * 0.7))
  ON CONFLICT (user_id, product_class_id)
  DO UPDATE SET credits = user_product_credits.credits + FLOOR(v_credits_grant * 0.7), updated_at = now();
  
  INSERT INTO user_universal_credits (user_id, credits)
  VALUES (p_user_id, FLOOR(v_credits_grant * 0.3))
  ON CONFLICT (user_id)
  DO UPDATE SET credits = user_universal_credits.credits + FLOOR(v_credits_grant * 0.3), updated_at = now();
  
  -- 12. Return reveal payload
  RETURN jsonb_build_object(
    'success', TRUE,
    'reveal', jsonb_build_object(
      'id', v_reveal_id,
      'product_class_id', v_product.id,
      'band', v_band,
      'is_golden', FALSE,
      'is_award', v_is_award,
      'serial_number', v_serial,
      'credits_awarded', v_credits_grant,
      'product', jsonb_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'brand', v_product.brand,
        'model', v_product.model,
        'category', v_product.category,
        'retail_value_usd', v_product.retail_value_usd,
        'image_url', v_product.image_url
      )
    )
  );
END;
$$;-- Add revealed_at column to track when user has seen the reveal animation
ALTER TABLE public.reveals
ADD COLUMN IF NOT EXISTS revealed_at TIMESTAMPTZ;

-- Backfill: mark all existing reveals as already seen (so they appear in vault)
UPDATE public.reveals
SET revealed_at = created_at
WHERE revealed_at IS NULL;

-- Create RPC function to mark a reveal as seen after animation completes
CREATE OR REPLACE FUNCTION public.mark_reveal_seen(p_reveal_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.reveals
  SET revealed_at = now()
  WHERE id = p_reveal_id
    AND user_id = auth.uid();
$$;-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for storing user roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy: Users can read their own roles
CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable RLS on bucket_balances (currently has no RLS)
ALTER TABLE public.bucket_balances ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read bucket_balances
CREATE POLICY "Only admins can read bucket balances"
ON public.bucket_balances
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can modify bucket_balances
CREATE POLICY "Only admins can modify bucket balances"
ON public.bucket_balances
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));-- Phase 1: 1v1 Battles Database Schema

-- 1.1 New Enum Types
CREATE TYPE public.battle_status AS ENUM ('QUEUED', 'ACTIVE', 'COMPLETE', 'EXPIRED', 'CANCELLED');
CREATE TYPE public.round_winner AS ENUM ('A', 'B', 'TIE');
CREATE TYPE public.opponent_type AS ENUM ('human', 'agent');
CREATE TYPE public.agent_tier AS ENUM ('rookie', 'skilled', 'pro', 'elite');

-- 1.2 Battle Sets Table (user's 5-card lineup)
CREATE TABLE public.battle_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reveal_ids UUID[] NOT NULL CHECK (array_length(reveal_ids, 1) = 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 1.3 Battle Queue Table (for matchmaking)
CREATE TABLE public.battle_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  battle_set_id UUID NOT NULL REFERENCES battle_sets(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL DEFAULT 1000,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '2 minutes'),
  UNIQUE(user_id)
);

-- 1.4 Battles Table
CREATE TABLE public.battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status public.battle_status NOT NULL DEFAULT 'QUEUED',
  opponent_type public.opponent_type NOT NULL DEFAULT 'human',
  user_a UUID NOT NULL REFERENCES auth.users(id),
  user_b UUID REFERENCES auth.users(id),
  battle_set_a UUID NOT NULL REFERENCES battle_sets(id),
  battle_set_b UUID REFERENCES battle_sets(id),
  agent_tier public.agent_tier,
  agent_seed TEXT,
  agent_deck JSONB,
  round_categories TEXT[] NOT NULL DEFAULT '{}',
  score_a INTEGER NOT NULL DEFAULT 0,
  score_b INTEGER NOT NULL DEFAULT 0,
  winner_user_id UUID REFERENCES auth.users(id),
  is_ranked BOOLEAN NOT NULL DEFAULT true,
  reward_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '10 minutes')
);

-- 1.5 Battle Rounds Table
CREATE TABLE public.battle_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  round_index INTEGER NOT NULL CHECK (round_index BETWEEN 1 AND 3),
  category TEXT NOT NULL,
  reveal_a_id UUID REFERENCES reveals(id),
  reveal_b_id UUID REFERENCES reveals(id),
  agent_card JSONB,
  score_a NUMERIC(6,2),
  score_b NUMERIC(6,2),
  winner public.round_winner,
  a_submitted_at TIMESTAMPTZ,
  b_submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(battle_id, round_index)
);

-- 1.6 Leaderboard Stats Table
CREATE TABLE public.leaderboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id TEXT NOT NULL DEFAULT 'S1',
  rating INTEGER NOT NULL DEFAULT 1000,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  streak_current INTEGER NOT NULL DEFAULT 0,
  streak_best INTEGER NOT NULL DEFAULT 0,
  wins_by_category JSONB NOT NULL DEFAULT '{}',
  last_battle_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, season_id)
);

-- Enable RLS on all tables
ALTER TABLE public.battle_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_stats ENABLE ROW LEVEL SECURITY;

-- 1.7 RLS Policies

-- battle_sets: Users can manage their own
CREATE POLICY "Users can view own battle sets" ON public.battle_sets
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own battle sets" ON public.battle_sets
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own battle sets" ON public.battle_sets
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own battle sets" ON public.battle_sets
FOR DELETE USING (auth.uid() = user_id);

-- battle_queue: Users can manage their own queue entry
CREATE POLICY "Users can view own queue entry" ON public.battle_queue
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue entry" ON public.battle_queue
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own queue entry" ON public.battle_queue
FOR DELETE USING (auth.uid() = user_id);

-- battles: Users can read battles they're in
CREATE POLICY "Users can view own battles" ON public.battles
FOR SELECT USING (auth.uid() IN (user_a, user_b));

-- battle_rounds: Users can view rounds of their battles
CREATE POLICY "Users can view own battle rounds" ON public.battle_rounds
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.battles 
    WHERE battles.id = battle_rounds.battle_id 
    AND auth.uid() IN (battles.user_a, battles.user_b)
  )
);

-- leaderboard_stats: Anyone can read (public leaderboard)
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_stats
FOR SELECT USING (true);

-- Enable realtime for battles and battle_rounds
ALTER PUBLICATION supabase_realtime ADD TABLE public.battles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_rounds;-- Phase 2: Battle System Database Functions (RPCs)

-- 2.1 compute_card_score: Pure scoring function
CREATE OR REPLACE FUNCTION public.compute_card_score(
  p_reveal_id UUID,
  p_is_joker BOOLEAN DEFAULT false
)
RETURNS NUMERIC(6,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_band rarity_band;
  v_retail_value NUMERIC;
  v_rarity_score NUMERIC;
  v_value_score NUMERIC;
  v_attributes_score NUMERIC;
  v_card_score NUMERIC;
  v_clamped_value NUMERIC;
BEGIN
  -- Get card data
  SELECT pc.band, pc.retail_value_usd
  INTO v_band, v_retail_value
  FROM reveals r
  JOIN product_classes pc ON pc.id = r.product_class_id
  WHERE r.id = p_reveal_id;

  IF v_band IS NULL THEN
    RAISE EXCEPTION 'Card not found: %', p_reveal_id;
  END IF;

  -- RarityScore (0-100)
  v_rarity_score := CASE v_band
    WHEN 'ICON' THEN 40
    WHEN 'RARE' THEN 60
    WHEN 'GRAIL' THEN 80
    WHEN 'MYTHIC' THEN 100
  END;

  -- ValueScore (log-scaled, 0-100)
  v_clamped_value := LEAST(GREATEST(COALESCE(v_retail_value, 50), 50), 100000);
  v_value_score := 100 * (log(v_clamped_value) - log(50)) / (log(100000) - log(50));

  -- AttributesScore (MVP: use band as proxy)
  v_attributes_score := CASE v_band
    WHEN 'ICON' THEN 35
    WHEN 'RARE' THEN 50
    WHEN 'GRAIL' THEN 70
    WHEN 'MYTHIC' THEN 90
  END;

  -- Final score: Value 45%, Rarity 35%, Attributes 20%
  v_card_score := (v_value_score * 0.45) + (v_rarity_score * 0.35) + (v_attributes_score * 0.20);

  -- Joker penalty (15% reduction for cross-category play)
  IF p_is_joker THEN
    v_card_score := v_card_score * 0.85;
  END IF;

  RETURN ROUND(v_card_score, 2);
END;
$$;

-- 2.2 save_battle_set: Validate and store user's 5-card deck
CREATE OR REPLACE FUNCTION public.save_battle_set(p_reveal_ids UUID[])
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_battle_set_id UUID;
  v_owned_count INT;
BEGIN
  -- Validate exactly 5 cards
  IF array_length(p_reveal_ids, 1) != 5 THEN
    RAISE EXCEPTION 'Battle set must contain exactly 5 cards, got %', array_length(p_reveal_ids, 1);
  END IF;

  -- Validate user owns all cards and they are revealed
  SELECT COUNT(*) INTO v_owned_count
  FROM reveals r
  WHERE r.id = ANY(p_reveal_ids)
    AND r.user_id = v_user_id
    AND r.revealed_at IS NOT NULL;

  IF v_owned_count != 5 THEN
    RAISE EXCEPTION 'You must own all 5 revealed cards. Found % valid cards.', v_owned_count;
  END IF;

  -- Upsert battle set (one active set per user)
  INSERT INTO battle_sets (user_id, reveal_ids)
  VALUES (v_user_id, p_reveal_ids)
  ON CONFLICT (user_id) 
  DO UPDATE SET reveal_ids = p_reveal_ids, created_at = now()
  RETURNING id INTO v_battle_set_id;

  RETURN v_battle_set_id;
END;
$$;

-- 2.3 get_available_categories: Helper to get categories from a battle set
CREATE OR REPLACE FUNCTION public.get_battle_set_categories(p_battle_set_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_categories TEXT[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT pc.category::TEXT)
  INTO v_categories
  FROM battle_sets bs
  CROSS JOIN UNNEST(bs.reveal_ids) AS rid
  JOIN reveals r ON r.id = rid
  JOIN product_classes pc ON pc.id = r.product_class_id
  WHERE bs.id = p_battle_set_id;

  RETURN v_categories;
END;
$$;

-- 2.4 start_battle: Matchmaking and battle creation
CREATE OR REPLACE FUNCTION public.start_battle(p_battle_set_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_rating INT;
  v_queued_battle RECORD;
  v_battle_id UUID;
  v_my_categories TEXT[];
  v_opponent_categories TEXT[];
  v_common_categories TEXT[];
  v_round_categories TEXT[];
  v_i INT;
BEGIN
  -- Get or create user's leaderboard stats
  INSERT INTO leaderboard_stats (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id, season_id) DO NOTHING;

  SELECT rating INTO v_user_rating
  FROM leaderboard_stats
  WHERE user_id = v_user_id AND season_id = 'S1';

  -- Get my categories
  v_my_categories := get_battle_set_categories(p_battle_set_id);

  -- Look for a queued battle within rating range (±200)
  SELECT b.* INTO v_queued_battle
  FROM battles b
  JOIN leaderboard_stats ls ON ls.user_id = b.user_a
  WHERE b.status = 'QUEUED'
    AND b.user_b IS NULL
    AND b.user_a != v_user_id
    AND b.opponent_type = 'human'
    AND b.expires_at > now()
    AND ABS(ls.rating - v_user_rating) <= 200
  ORDER BY b.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_queued_battle.id IS NOT NULL THEN
    -- Found an opponent! Join the battle
    v_opponent_categories := get_battle_set_categories(v_queued_battle.battle_set_a);
    
    -- Find common categories
    SELECT ARRAY_AGG(cat) INTO v_common_categories
    FROM (
      SELECT UNNEST(v_my_categories) AS cat
      INTERSECT
      SELECT UNNEST(v_opponent_categories) AS cat
    ) AS common;

    -- If not enough common categories, use all available from both
    IF array_length(v_common_categories, 1) IS NULL OR array_length(v_common_categories, 1) < 3 THEN
      SELECT ARRAY_AGG(DISTINCT cat) INTO v_common_categories
      FROM (
        SELECT UNNEST(v_my_categories) AS cat
        UNION
        SELECT UNNEST(v_opponent_categories) AS cat
      ) AS all_cats;
    END IF;

    -- Select 3 random categories for rounds
    SELECT ARRAY_AGG(cat ORDER BY random()) INTO v_round_categories
    FROM (
      SELECT UNNEST(v_common_categories) AS cat
      ORDER BY random()
      LIMIT 3
    ) AS selected;

    -- Pad with repeats if needed
    WHILE array_length(v_round_categories, 1) < 3 LOOP
      v_round_categories := array_append(v_round_categories, v_common_categories[1]);
    END LOOP;

    -- Update battle to active
    UPDATE battles
    SET user_b = v_user_id,
        battle_set_b = p_battle_set_id,
        status = 'ACTIVE',
        started_at = now(),
        round_categories = v_round_categories,
        expires_at = now() + INTERVAL '15 minutes'
    WHERE id = v_queued_battle.id
    RETURNING id INTO v_battle_id;

    -- Initialize opponent's leaderboard stats if not exists
    INSERT INTO leaderboard_stats (user_id)
    VALUES (v_queued_battle.user_a)
    ON CONFLICT (user_id, season_id) DO NOTHING;

    -- Create 3 battle rounds
    FOR v_i IN 1..3 LOOP
      INSERT INTO battle_rounds (battle_id, round_index, category)
      VALUES (v_battle_id, v_i, v_round_categories[v_i]);
    END LOOP;

    RETURN jsonb_build_object(
      'status', 'matched',
      'battle_id', v_battle_id,
      'opponent_type', 'human',
      'round_categories', v_round_categories
    );
  ELSE
    -- No opponent found, create queued battle
    INSERT INTO battles (
      user_a, battle_set_a, status, opponent_type, is_ranked
    ) VALUES (
      v_user_id, p_battle_set_id, 'QUEUED', 'human', true
    ) RETURNING id INTO v_battle_id;

    RETURN jsonb_build_object(
      'status', 'queued',
      'battle_id', v_battle_id,
      'message', 'Waiting for opponent...'
    );
  END IF;
END;
$$;

-- 2.5 start_agent_battle: Create practice match vs AI
CREATE OR REPLACE FUNCTION public.start_agent_battle(p_battle_set_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_rating INT;
  v_agent_tier agent_tier;
  v_battle_id UUID;
  v_my_categories TEXT[];
  v_round_categories TEXT[];
  v_agent_deck JSONB;
  v_i INT;
BEGIN
  -- Get user's rating
  INSERT INTO leaderboard_stats (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id, season_id) DO NOTHING;

  SELECT rating INTO v_user_rating
  FROM leaderboard_stats
  WHERE user_id = v_user_id AND season_id = 'S1';

  -- Determine agent tier based on rating
  v_agent_tier := CASE
    WHEN v_user_rating < 900 THEN 'rookie'
    WHEN v_user_rating < 1200 THEN 'skilled'
    WHEN v_user_rating < 1500 THEN 'pro'
    ELSE 'elite'
  END;

  -- Get categories from battle set
  v_my_categories := get_battle_set_categories(p_battle_set_id);

  -- Generate 3 random categories
  SELECT ARRAY_AGG(cat ORDER BY random()) INTO v_round_categories
  FROM (
    SELECT UNNEST(v_my_categories) AS cat
    ORDER BY random()
    LIMIT 3
  ) AS selected;

  -- Pad if needed
  WHILE array_length(v_round_categories, 1) IS NULL OR array_length(v_round_categories, 1) < 3 LOOP
    v_round_categories := array_append(COALESCE(v_round_categories, '{}'), v_my_categories[1]);
  END LOOP;

  -- Generate agent deck (5 virtual cards from product_classes)
  SELECT jsonb_agg(card_data) INTO v_agent_deck
  FROM (
    SELECT jsonb_build_object(
      'product_class_id', pc.id,
      'category', pc.category,
      'band', pc.band,
      'retail_value_usd', pc.retail_value_usd,
      'name', pc.name
    ) AS card_data
    FROM product_classes pc
    WHERE pc.is_active = true
    ORDER BY 
      CASE v_agent_tier
        WHEN 'rookie' THEN CASE WHEN pc.band = 'ICON' THEN 0 ELSE 1 END
        WHEN 'skilled' THEN CASE WHEN pc.band IN ('ICON', 'RARE') THEN 0 ELSE 1 END
        WHEN 'pro' THEN CASE WHEN pc.band IN ('RARE', 'GRAIL') THEN 0 ELSE 1 END
        ELSE 0
      END,
      random()
    LIMIT 5
  ) AS deck;

  -- Create battle
  INSERT INTO battles (
    user_a, battle_set_a, status, opponent_type, agent_tier,
    agent_seed, agent_deck, round_categories, is_ranked,
    reward_multiplier, started_at
  ) VALUES (
    v_user_id, p_battle_set_id, 'ACTIVE', 'agent', v_agent_tier,
    gen_random_uuid()::TEXT, v_agent_deck, v_round_categories, false,
    0.30, now()
  ) RETURNING id INTO v_battle_id;

  -- Create 3 battle rounds
  FOR v_i IN 1..3 LOOP
    INSERT INTO battle_rounds (battle_id, round_index, category)
    VALUES (v_battle_id, v_i, v_round_categories[v_i]);
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'matched',
    'battle_id', v_battle_id,
    'opponent_type', 'agent',
    'agent_tier', v_agent_tier,
    'round_categories', v_round_categories
  );
END;
$$;

-- 2.6 compute_agent_card_score: Score for agent's virtual card
CREATE OR REPLACE FUNCTION public.compute_agent_card_score(
  p_card_data JSONB,
  p_is_joker BOOLEAN DEFAULT false
)
RETURNS NUMERIC(6,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_band TEXT;
  v_retail_value NUMERIC;
  v_rarity_score NUMERIC;
  v_value_score NUMERIC;
  v_attributes_score NUMERIC;
  v_card_score NUMERIC;
  v_clamped_value NUMERIC;
BEGIN
  v_band := p_card_data->>'band';
  v_retail_value := COALESCE((p_card_data->>'retail_value_usd')::NUMERIC, 100);

  -- RarityScore
  v_rarity_score := CASE v_band
    WHEN 'ICON' THEN 40
    WHEN 'RARE' THEN 60
    WHEN 'GRAIL' THEN 80
    WHEN 'MYTHIC' THEN 100
    ELSE 40
  END;

  -- ValueScore (log-scaled)
  v_clamped_value := LEAST(GREATEST(v_retail_value, 50), 100000);
  v_value_score := 100 * (log(v_clamped_value) - log(50)) / (log(100000) - log(50));

  -- AttributesScore
  v_attributes_score := CASE v_band
    WHEN 'ICON' THEN 35
    WHEN 'RARE' THEN 50
    WHEN 'GRAIL' THEN 70
    WHEN 'MYTHIC' THEN 90
    ELSE 35
  END;

  -- Final score
  v_card_score := (v_value_score * 0.45) + (v_rarity_score * 0.35) + (v_attributes_score * 0.20);

  IF p_is_joker THEN
    v_card_score := v_card_score * 0.85;
  END IF;

  RETURN ROUND(v_card_score, 2);
END;
$$;

-- 2.7 submit_round_pick: Record player's card choice and process round
CREATE OR REPLACE FUNCTION public.submit_round_pick(
  p_battle_id UUID,
  p_round_index INT,
  p_reveal_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_battle RECORD;
  v_round RECORD;
  v_is_user_a BOOLEAN;
  v_card_category TEXT;
  v_is_joker BOOLEAN;
  v_my_score NUMERIC(6,2);
  v_opponent_score NUMERIC(6,2);
  v_round_winner round_winner;
  v_agent_card JSONB;
  v_agent_category TEXT;
BEGIN
  -- Get battle
  SELECT * INTO v_battle
  FROM battles
  WHERE id = p_battle_id
  FOR UPDATE;

  IF v_battle IS NULL THEN
    RAISE EXCEPTION 'Battle not found';
  END IF;

  IF v_battle.status != 'ACTIVE' THEN
    RAISE EXCEPTION 'Battle is not active';
  END IF;

  -- Determine if user is player A or B
  v_is_user_a := (v_battle.user_a = v_user_id);
  
  IF NOT v_is_user_a AND v_battle.user_b != v_user_id THEN
    RAISE EXCEPTION 'You are not part of this battle';
  END IF;

  -- Get round
  SELECT * INTO v_round
  FROM battle_rounds
  WHERE battle_id = p_battle_id AND round_index = p_round_index
  FOR UPDATE;

  IF v_round IS NULL THEN
    RAISE EXCEPTION 'Round not found';
  END IF;

  -- Check if already submitted
  IF v_is_user_a AND v_round.reveal_a_id IS NOT NULL THEN
    RAISE EXCEPTION 'You already submitted for this round';
  END IF;
  
  IF NOT v_is_user_a AND v_round.reveal_b_id IS NOT NULL THEN
    RAISE EXCEPTION 'You already submitted for this round';
  END IF;

  -- Validate card ownership
  IF NOT EXISTS (
    SELECT 1 FROM reveals r
    WHERE r.id = p_reveal_id 
    AND r.user_id = v_user_id
    AND r.revealed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'You do not own this card';
  END IF;

  -- Get card category
  SELECT pc.category::TEXT INTO v_card_category
  FROM reveals r
  JOIN product_classes pc ON pc.id = r.product_class_id
  WHERE r.id = p_reveal_id;

  -- Check if joker (cross-category play)
  v_is_joker := (v_card_category != v_round.category);

  -- Calculate score
  v_my_score := compute_card_score(p_reveal_id, v_is_joker);

  -- Record the pick
  IF v_is_user_a THEN
    UPDATE battle_rounds
    SET reveal_a_id = p_reveal_id,
        score_a = v_my_score,
        a_submitted_at = now()
    WHERE id = v_round.id;
  ELSE
    UPDATE battle_rounds
    SET reveal_b_id = p_reveal_id,
        score_b = v_my_score,
        b_submitted_at = now()
    WHERE id = v_round.id;
  END IF;

  -- If agent battle, process agent pick immediately
  IF v_battle.opponent_type = 'agent' THEN
    -- Agent picks best matching card from deck
    SELECT card INTO v_agent_card
    FROM (
      SELECT card,
        CASE WHEN card->>'category' = v_round.category THEN 1 ELSE 0 END AS category_match,
        (random() * 0.2) AS randomness
      FROM jsonb_array_elements(v_battle.agent_deck) AS card
    ) AS picks
    ORDER BY category_match DESC, randomness DESC
    LIMIT 1;

    v_agent_category := v_agent_card->>'category';
    v_opponent_score := compute_agent_card_score(v_agent_card, v_agent_category != v_round.category);

    UPDATE battle_rounds
    SET agent_card = v_agent_card,
        score_b = v_opponent_score,
        b_submitted_at = now()
    WHERE id = v_round.id;
  END IF;

  -- Refresh round data
  SELECT * INTO v_round
  FROM battle_rounds
  WHERE id = v_round.id;

  -- Check if both players submitted
  IF v_round.a_submitted_at IS NOT NULL AND v_round.b_submitted_at IS NOT NULL THEN
    -- Determine round winner
    IF v_round.score_a > v_round.score_b THEN
      v_round_winner := 'A';
    ELSIF v_round.score_b > v_round.score_a THEN
      v_round_winner := 'B';
    ELSE
      -- Tiebreaker: compare rarity, then value, then coin flip
      v_round_winner := CASE WHEN random() < 0.5 THEN 'A' ELSE 'B' END;
    END IF;

    -- Update round
    UPDATE battle_rounds
    SET winner = v_round_winner,
        completed_at = now()
    WHERE id = v_round.id;

    -- Update battle scores
    IF v_round_winner = 'A' THEN
      UPDATE battles SET score_a = score_a + 1 WHERE id = p_battle_id;
    ELSE
      UPDATE battles SET score_b = score_b + 1 WHERE id = p_battle_id;
    END IF;

    -- Refresh battle
    SELECT * INTO v_battle FROM battles WHERE id = p_battle_id;

    -- Check for match completion (first to 2)
    IF v_battle.score_a >= 2 OR v_battle.score_b >= 2 OR p_round_index = 3 THEN
      PERFORM complete_battle(p_battle_id);
    END IF;

    RETURN jsonb_build_object(
      'round_complete', true,
      'my_score', v_my_score,
      'opponent_score', v_round.score_b,
      'winner', v_round_winner,
      'battle_score_a', v_battle.score_a + CASE WHEN v_round_winner = 'A' THEN 1 ELSE 0 END,
      'battle_score_b', v_battle.score_b + CASE WHEN v_round_winner = 'B' THEN 1 ELSE 0 END
    );
  END IF;

  RETURN jsonb_build_object(
    'round_complete', false,
    'my_score', v_my_score,
    'waiting_for_opponent', true
  );
END;
$$;

-- 2.8 complete_battle: Finalize match and award rewards
CREATE OR REPLACE FUNCTION public.complete_battle(p_battle_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_battle RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_winner_reward INT;
  v_loser_reward INT;
  v_k_factor INT := 32;
  v_winner_rating INT;
  v_loser_rating INT;
  v_expected_winner NUMERIC;
  v_rating_change INT;
  v_round RECORD;
BEGIN
  SELECT * INTO v_battle
  FROM battles
  WHERE id = p_battle_id
  FOR UPDATE;

  IF v_battle.status = 'COMPLETE' THEN
    RETURN; -- Already completed
  END IF;

  -- Determine winner
  IF v_battle.score_a > v_battle.score_b THEN
    v_winner_id := v_battle.user_a;
    v_loser_id := v_battle.user_b;
  ELSE
    v_winner_id := v_battle.user_b;
    v_loser_id := v_battle.user_a;
  END IF;

  -- Calculate rewards (with multiplier for agent battles)
  v_winner_reward := FLOOR(50 * v_battle.reward_multiplier);
  v_loser_reward := FLOOR(10 * v_battle.reward_multiplier);

  -- Award credits to winner
  INSERT INTO user_universal_credits (user_id, credits)
  VALUES (v_winner_id, v_winner_reward)
  ON CONFLICT (user_id)
  DO UPDATE SET credits = user_universal_credits.credits + v_winner_reward, updated_at = now();

  -- Award credits to loser (if human)
  IF v_loser_id IS NOT NULL THEN
    INSERT INTO user_universal_credits (user_id, credits)
    VALUES (v_loser_id, v_loser_reward)
    ON CONFLICT (user_id)
    DO UPDATE SET credits = user_universal_credits.credits + v_loser_reward, updated_at = now();
  END IF;

  -- Update leaderboard stats (only for ranked human battles)
  IF v_battle.is_ranked AND v_battle.opponent_type = 'human' AND v_loser_id IS NOT NULL THEN
    -- Get current ratings
    SELECT rating INTO v_winner_rating
    FROM leaderboard_stats WHERE user_id = v_winner_id AND season_id = 'S1';
    
    SELECT rating INTO v_loser_rating
    FROM leaderboard_stats WHERE user_id = v_loser_id AND season_id = 'S1';

    -- Calculate ELO change
    v_expected_winner := 1.0 / (1.0 + power(10, (v_loser_rating - v_winner_rating)::NUMERIC / 400));
    v_rating_change := ROUND(v_k_factor * (1 - v_expected_winner));

    -- Update winner stats
    UPDATE leaderboard_stats
    SET rating = rating + v_rating_change,
        wins = wins + 1,
        streak_current = streak_current + 1,
        streak_best = GREATEST(streak_best, streak_current + 1),
        last_battle_at = now(),
        updated_at = now()
    WHERE user_id = v_winner_id AND season_id = 'S1';

    -- Update loser stats
    UPDATE leaderboard_stats
    SET rating = GREATEST(rating - v_rating_change, 100),
        losses = losses + 1,
        streak_current = 0,
        last_battle_at = now(),
        updated_at = now()
    WHERE user_id = v_loser_id AND season_id = 'S1';

    -- Update wins_by_category for each round won
    FOR v_round IN 
      SELECT * FROM battle_rounds WHERE battle_id = p_battle_id AND winner IS NOT NULL
    LOOP
      IF v_round.winner = 'A' AND v_battle.user_a = v_winner_id THEN
        UPDATE leaderboard_stats
        SET wins_by_category = jsonb_set(
          COALESCE(wins_by_category, '{}'),
          ARRAY[v_round.category],
          to_jsonb(COALESCE((wins_by_category->>v_round.category)::INT, 0) + 1)
        )
        WHERE user_id = v_winner_id AND season_id = 'S1';
      ELSIF v_round.winner = 'B' AND v_battle.user_b = v_winner_id THEN
        UPDATE leaderboard_stats
        SET wins_by_category = jsonb_set(
          COALESCE(wins_by_category, '{}'),
          ARRAY[v_round.category],
          to_jsonb(COALESCE((wins_by_category->>v_round.category)::INT, 0) + 1)
        )
        WHERE user_id = v_winner_id AND season_id = 'S1';
      END IF;
    END LOOP;
  END IF;

  -- Mark battle complete
  UPDATE battles
  SET status = 'COMPLETE',
      winner_user_id = v_winner_id,
      completed_at = now()
  WHERE id = p_battle_id;
END;
$$;

-- 2.9 cancel_queued_battle: Allow user to leave queue
CREATE OR REPLACE FUNCTION public.cancel_queued_battle(p_battle_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  UPDATE battles
  SET status = 'CANCELLED'
  WHERE id = p_battle_id
    AND user_a = v_user_id
    AND status = 'QUEUED';

  RETURN FOUND;
END;
$$;

-- 2.10 get_active_battle: Get user's current active battle
CREATE OR REPLACE FUNCTION public.get_active_battle()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_battle RECORD;
BEGIN
  SELECT * INTO v_battle
  FROM battles
  WHERE (user_a = v_user_id OR user_b = v_user_id)
    AND status IN ('QUEUED', 'ACTIVE')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_battle IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_battle.id,
    'status', v_battle.status,
    'opponent_type', v_battle.opponent_type,
    'agent_tier', v_battle.agent_tier,
    'is_user_a', v_battle.user_a = v_user_id,
    'score_a', v_battle.score_a,
    'score_b', v_battle.score_b,
    'round_categories', v_battle.round_categories,
    'started_at', v_battle.started_at
  );
END;
$$;-- Function to spend universal credits to gain product progress
CREATE OR REPLACE FUNCTION public.spend_credits_for_progress(
  p_user_id UUID,
  p_product_class_id UUID,
  p_credits_to_spend INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_universal INTEGER;
  v_new_universal INTEGER;
  v_new_product_credits INTEGER;
BEGIN
  -- Validate input
  IF p_credits_to_spend <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Credits to spend must be positive');
  END IF;

  -- Lock and get current universal credits
  SELECT credits INTO v_current_universal
  FROM user_universal_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if user has enough credits
  IF v_current_universal IS NULL OR v_current_universal < p_credits_to_spend THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Insufficient credits',
      'available', COALESCE(v_current_universal, 0),
      'required', p_credits_to_spend
    );
  END IF;

  -- Deduct from universal credits
  v_new_universal := v_current_universal - p_credits_to_spend;
  
  UPDATE user_universal_credits
  SET credits = v_new_universal, updated_at = now()
  WHERE user_id = p_user_id;

  -- Add to product credits (upsert)
  INSERT INTO user_product_credits (user_id, product_class_id, credits, updated_at)
  VALUES (p_user_id, p_product_class_id, p_credits_to_spend, now())
  ON CONFLICT (user_id, product_class_id)
  DO UPDATE SET 
    credits = user_product_credits.credits + EXCLUDED.credits,
    updated_at = now()
  RETURNING credits INTO v_new_product_credits;

  RETURN json_build_object(
    'success', true,
    'credits_spent', p_credits_to_spend,
    'new_universal_balance', v_new_universal,
    'new_product_credits', v_new_product_credits
  );
END;
$$;-- Create category pool balances table (one pool per category)
CREATE TABLE public.category_pool_balances (
  category public.product_category NOT NULL PRIMARY KEY,
  balance_usd NUMERIC(12,4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.category_pool_balances ENABLE ROW LEVEL SECURITY;

-- Admin-only access (same pattern as bucket_balances)
CREATE POLICY "Only admins can read category pool balances"
ON public.category_pool_balances FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can modify category pool balances"
ON public.category_pool_balances FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Initialize balances for all categories
INSERT INTO public.category_pool_balances (category, balance_usd) VALUES
  ('POKEMON', 0),
  ('SNEAKERS', 0),
  ('WATCHES', 0),
  ('HANDBAGS', 0),
  ('WINE', 0),
  ('CLOTHING', 0),
  ('JEWELLERY', 0),
  ('ART_TOYS', 0),
  ('SPORT_MEMORABILIA', 0);

-- Add category-specific pricing (clear existing and add new)
DELETE FROM public.category_pricing;

INSERT INTO public.category_pricing (category, tier, price_cents, display_name, description, is_active) VALUES
  -- Handbags: Premium pricing
  ('HANDBAGS', 'T5', 1000, 'Handbags Starter', 'Gucci, Prada tier cards', true),
  ('HANDBAGS', 'T10', 2000, 'Handbags Premium', 'YSL, Louis Vuitton tier cards', true),
  ('HANDBAGS', 'T20', 3500, 'Handbags Elite', 'Chanel, Hermès tier cards', true),
  
  -- Watches: Highest pricing
  ('WATCHES', 'T5', 1500, 'Watches Starter', 'Seiko, Tissot tier cards', true),
  ('WATCHES', 'T10', 2500, 'Watches Premium', 'Rolex, Omega tier cards', true),
  ('WATCHES', 'T20', 4500, 'Watches Elite', 'AP, Patek tier cards', true),
  
  -- Sneakers: Mid pricing
  ('SNEAKERS', 'T5', 800, 'Sneakers Starter', 'Nike, Adidas tier cards', true),
  ('SNEAKERS', 'T10', 1500, 'Sneakers Premium', 'Jordan, Dunks tier cards', true),
  ('SNEAKERS', 'T20', 2500, 'Sneakers Elite', 'Dior J1, Trophy Room tier cards', true),
  
  -- Pokemon/Trading Cards: Entry pricing
  ('POKEMON', 'T5', 500, 'Cards Starter', 'Base set tier cards', true),
  ('POKEMON', 'T10', 1000, 'Cards Premium', 'Holo, rare tier cards', true),
  ('POKEMON', 'T20', 2000, 'Cards Elite', '1st Edition, PSA graded tier cards', true),
  
  -- Wine: Premium pricing
  ('WINE', 'T5', 1200, 'Wine Starter', 'Entry wines tier cards', true),
  ('WINE', 'T10', 2000, 'Wine Premium', 'Reserve wines tier cards', true),
  ('WINE', 'T20', 3500, 'Wine Elite', 'Grand Cru tier cards', true),
  
  -- Clothing: Mid pricing
  ('CLOTHING', 'T5', 800, 'Clothing Starter', 'Chrome Hearts tier cards', true),
  ('CLOTHING', 'T10', 1500, 'Clothing Premium', 'Off-White tier cards', true),
  ('CLOTHING', 'T20', 2500, 'Clothing Elite', 'Archive pieces tier cards', true),
  
  -- Jewellery: Premium pricing
  ('JEWELLERY', 'T5', 1000, 'Jewellery Starter', 'Silver tier cards', true),
  ('JEWELLERY', 'T10', 2000, 'Jewellery Premium', 'Gold tier cards', true),
  ('JEWELLERY', 'T20', 4000, 'Jewellery Elite', 'Diamond, Cartier tier cards', true),
  
  -- Art & Toys: Mid pricing
  ('ART_TOYS', 'T5', 1000, 'Art & Toys Starter', 'Pop Mart tier cards', true),
  ('ART_TOYS', 'T10', 1800, 'Art & Toys Premium', 'KAWS tier cards', true),
  ('ART_TOYS', 'T20', 3000, 'Art & Toys Elite', 'Bearbrick, Murakami tier cards', true),
  
  -- Sport Memorabilia: Mid pricing
  ('SPORT_MEMORABILIA', 'T5', 800, 'Sports Starter', 'Jerseys tier cards', true),
  ('SPORT_MEMORABILIA', 'T10', 1500, 'Sports Premium', 'Signed items tier cards', true),
  ('SPORT_MEMORABILIA', 'T20', 3000, 'Sports Elite', 'Game-worn, championship tier cards', true);

-- Create category pool ledger for tracking
CREATE TABLE public.category_pool_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category public.product_category NOT NULL,
  event_type public.pool_event NOT NULL,
  amount_usd NUMERIC(12,4) NOT NULL,
  ref_type TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ledger
ALTER TABLE public.category_pool_ledger ENABLE ROW LEVEL SECURITY;

-- Admin-only access to ledger
CREATE POLICY "Only admins can read category pool ledger"
ON public.category_pool_ledger FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Create the category pack purchase RPC
CREATE OR REPLACE FUNCTION public.process_category_pack_purchase(
  p_user_id uuid,
  p_stripe_session_id text,
  p_stripe_payment_intent_id text,
  p_category text,
  p_tier text,
  p_quantity integer,
  p_unit_price_cents integer,
  p_total_cents integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_category public.product_category;
  v_tier public.pricing_tier;
  v_unit_price_usd NUMERIC(10,2);
  v_total_price_usd NUMERIC(10,2);
  v_net_per_card NUMERIC(10,4);
  v_pool_per_card NUMERIC(10,4);
  v_total_pool NUMERIC(10,4);
  v_purchase_id UUID;
  v_reveals JSONB := '[]'::JSONB;
  v_reveal JSONB;
  v_i INT;
  v_random NUMERIC;
  v_band public.rarity_band;
  v_product RECORD;
  v_credits INT;
  v_product_credits INT;
  v_universal_credits INT;
  v_is_golden BOOLEAN;
  v_is_award BOOLEAN := false;
  v_award_id UUID;
  v_pool_balance NUMERIC;
  v_attempt_rate NUMERIC;
  v_reveal_id UUID;
  v_serial TEXT;
  v_existing_purchase UUID;
BEGIN
  -- Cast category and tier
  v_category := p_category::public.product_category;
  v_tier := p_tier::public.pricing_tier;
  
  -- Convert cents to USD
  v_unit_price_usd := p_unit_price_cents / 100.0;
  v_total_price_usd := p_total_cents / 100.0;
  
  -- Check idempotency
  SELECT id INTO v_existing_purchase
  FROM public.purchases
  WHERE stripe_session_id = p_stripe_session_id;
  
  IF v_existing_purchase IS NOT NULL THEN
    SELECT jsonb_agg(jsonb_build_object(
      'id', r.id,
      'product_class_id', r.product_class_id,
      'band', r.band,
      'is_golden', r.is_golden,
      'is_award', r.is_award,
      'serial_number', r.serial_number,
      'credits_awarded', r.credits_awarded,
      'product', jsonb_build_object(
        'id', pc.id,
        'name', pc.name,
        'brand', pc.brand,
        'model', pc.model,
        'category', pc.category,
        'retail_value_usd', pc.retail_value_usd,
        'image_url', pc.image_url
      )
    ))
    INTO v_reveals
    FROM public.reveals r
    JOIN public.product_classes pc ON pc.id = r.product_class_id
    WHERE r.purchase_id = v_existing_purchase;
    
    RETURN jsonb_build_object('purchase_id', v_existing_purchase, 'reveals', COALESCE(v_reveals, '[]'::JSONB), 'already_processed', true);
  END IF;
  
  -- Calculate economics per card
  v_net_per_card := v_unit_price_usd - (v_unit_price_usd * 0.029) - (0.30 / p_quantity) - 0.30;
  v_pool_per_card := v_net_per_card * 0.35;
  v_total_pool := v_pool_per_card * p_quantity;
  
  -- Insert purchase record
  INSERT INTO public.purchases (
    user_id, stripe_session_id, stripe_payment_intent_id, tier,
    quantity, unit_price_usd, total_price_usd, stripe_amount_total_cents,
    net_revenue_usd, pool_contribution_usd
  ) VALUES (
    p_user_id, p_stripe_session_id, p_stripe_payment_intent_id, v_tier,
    p_quantity, v_unit_price_usd, v_total_price_usd, p_total_cents,
    v_net_per_card * p_quantity, v_total_pool
  ) RETURNING id INTO v_purchase_id;
  
  -- Add to category pool (lock row first)
  UPDATE public.category_pool_balances
  SET balance_usd = balance_usd + v_total_pool, updated_at = now()
  WHERE category = v_category;
  
  -- Log to category ledger
  INSERT INTO public.category_pool_ledger (category, event_type, amount_usd, ref_type, ref_id)
  VALUES (v_category, 'ADD', v_total_pool, 'purchase', v_purchase_id::TEXT);
  
  -- Process each card
  FOR v_i IN 1..p_quantity LOOP
    v_is_award := false;
    v_award_id := NULL;
    
    -- Band selection (weighted by tier)
    v_random := random();
    
    v_band := CASE v_tier
      WHEN 'T5' THEN 
        CASE 
          WHEN v_random < 0.93 THEN 'ICON'::public.rarity_band
          WHEN v_random < 0.99 THEN 'RARE'::public.rarity_band
          WHEN v_random < 0.999 THEN 'GRAIL'::public.rarity_band
          ELSE 'MYTHIC'::public.rarity_band
        END
      WHEN 'T10' THEN 
        CASE 
          WHEN v_random < 0.85 THEN 'ICON'::public.rarity_band
          WHEN v_random < 0.97 THEN 'RARE'::public.rarity_band
          WHEN v_random < 0.995 THEN 'GRAIL'::public.rarity_band
          ELSE 'MYTHIC'::public.rarity_band
        END
      WHEN 'T20' THEN 
        CASE 
          WHEN v_random < 0.75 THEN 'ICON'::public.rarity_band
          WHEN v_random < 0.93 THEN 'RARE'::public.rarity_band
          WHEN v_random < 0.99 THEN 'GRAIL'::public.rarity_band
          ELSE 'MYTHIC'::public.rarity_band
        END
    END;
    
    -- Select product from matching category AND band
    SELECT * INTO v_product
    FROM public.product_classes pc
    WHERE pc.category = v_category
      AND pc.band = v_band
      AND pc.is_active = true
    ORDER BY random()
    LIMIT 1;
    
    -- Fallback within same category to lower bands
    IF v_product IS NULL AND v_band = 'MYTHIC' THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.category = v_category AND pc.band = 'GRAIL' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    IF v_product IS NULL AND v_band IN ('MYTHIC', 'GRAIL') THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.category = v_category AND pc.band = 'RARE' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    IF v_product IS NULL THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.category = v_category AND pc.band = 'ICON' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    -- Final fallback: any product in category
    IF v_product IS NULL THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.category = v_category AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    -- If still no product, error
    IF v_product IS NULL THEN
      RAISE EXCEPTION 'No products available for category %', v_category;
    END IF;
    
    -- Calculate credits
    v_credits := FLOOR(v_pool_per_card / 0.01);
    
    v_product_credits := CASE v_band
      WHEN 'ICON' THEN FLOOR(v_credits * 0.70)
      WHEN 'RARE' THEN FLOOR(v_credits * 0.80)
      WHEN 'GRAIL' THEN FLOOR(v_credits * 0.90)
      WHEN 'MYTHIC' THEN FLOOR(v_credits * 0.95)
    END;
    v_universal_credits := v_credits - v_product_credits;
    
    -- Golden card check
    v_is_golden := CASE v_tier
      WHEN 'T5' THEN random() < 0.0001
      WHEN 'T10' THEN random() < 0.0002
      WHEN 'T20' THEN random() < 0.0005
    END;
    
    IF v_is_golden THEN
      v_product_credits := FLOOR(v_product.expected_fulfillment_cost_usd * 100);
      v_is_award := true;
    END IF;
    
    -- Award attempt from category pool
    IF NOT v_is_golden THEN
      v_attempt_rate := CASE v_tier
        WHEN 'T5' THEN 0.001
        WHEN 'T10' THEN 0.002
        WHEN 'T20' THEN 0.005
      END;
      
      IF random() < v_attempt_rate THEN
        SELECT balance_usd INTO v_pool_balance
        FROM public.category_pool_balances
        WHERE category = v_category
        FOR UPDATE;
        
        IF v_pool_balance >= v_product.expected_fulfillment_cost_usd THEN
          UPDATE public.category_pool_balances
          SET balance_usd = balance_usd - v_product.expected_fulfillment_cost_usd, updated_at = now()
          WHERE category = v_category;
          
          INSERT INTO public.awards (user_id, product_class_id, bucket, reserved_cost_usd, status)
          VALUES (p_user_id, v_product.id, v_product.bucket, v_product.expected_fulfillment_cost_usd, 'RESERVED')
          RETURNING id INTO v_award_id;
          
          INSERT INTO public.category_pool_ledger (category, event_type, amount_usd, ref_type, ref_id)
          VALUES (v_category, 'RESERVE', v_product.expected_fulfillment_cost_usd, 'award', v_award_id::TEXT);
          
          v_is_award := true;
        ELSE
          v_credits := FLOOR(v_credits * 1.12);
          v_product_credits := FLOOR(v_product_credits * 1.12);
        END IF;
      END IF;
    END IF;
    
    -- Generate serial
    v_serial := LPAD((FLOOR(random() * 10000)::INT)::TEXT, 4, '0') || '/' || '10000';
    
    -- Insert reveal
    INSERT INTO public.reveals (
      purchase_id, user_id, product_class_id, band, is_golden,
      credits_awarded, product_credits_awarded, universal_credits_awarded,
      is_award, award_id, serial_number
    ) VALUES (
      v_purchase_id, p_user_id, v_product.id, v_band, v_is_golden,
      v_credits, v_product_credits, v_universal_credits,
      v_is_award, v_award_id, v_serial
    ) RETURNING id INTO v_reveal_id;
    
    IF v_award_id IS NOT NULL THEN
      UPDATE public.awards SET reveal_id = v_reveal_id WHERE id = v_award_id;
    END IF;
    
    -- Upsert credits
    INSERT INTO public.user_product_credits (user_id, product_class_id, credits)
    VALUES (p_user_id, v_product.id, v_product_credits)
    ON CONFLICT (user_id, product_class_id)
    DO UPDATE SET credits = public.user_product_credits.credits + v_product_credits, updated_at = now();
    
    INSERT INTO public.user_universal_credits (user_id, credits)
    VALUES (p_user_id, v_universal_credits)
    ON CONFLICT (user_id)
    DO UPDATE SET credits = public.user_universal_credits.credits + v_universal_credits, updated_at = now();
    
    v_reveal := jsonb_build_object(
      'id', v_reveal_id,
      'product_class_id', v_product.id,
      'band', v_band,
      'is_golden', v_is_golden,
      'is_award', v_is_award,
      'serial_number', v_serial,
      'credits_awarded', v_credits,
      'product_credits_awarded', v_product_credits,
      'universal_credits_awarded', v_universal_credits,
      'product', jsonb_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'brand', v_product.brand,
        'model', v_product.model,
        'category', v_product.category,
        'retail_value_usd', v_product.retail_value_usd,
        'image_url', v_product.image_url
      )
    );
    
    v_reveals := v_reveals || v_reveal;
  END LOOP;
  
  RETURN jsonb_build_object('purchase_id', v_purchase_id, 'reveals', v_reveals, 'already_processed', false);
END;
$$;-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can read their own reveals" ON reveals;

-- Recreate as permissive (default)
CREATE POLICY "Users can read their own reveals"
ON reveals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);-- Drop the restrictive policy
DROP POLICY IF EXISTS "Anyone can read active product classes" ON product_classes;

-- Recreate as permissive (default)
CREATE POLICY "Anyone can read active product classes"
ON product_classes
FOR SELECT
TO public
USING (is_active = true);-- Fix awards RLS policy
DROP POLICY IF EXISTS "Users can read their own awards" ON awards;
CREATE POLICY "Users can read their own awards"
ON awards FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Fix battle_queue RLS policies
DROP POLICY IF EXISTS "Users can view own queue entry" ON battle_queue;
CREATE POLICY "Users can view own queue entry"
ON battle_queue FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own queue entry" ON battle_queue;
CREATE POLICY "Users can insert own queue entry"
ON battle_queue FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own queue entry" ON battle_queue;
CREATE POLICY "Users can delete own queue entry"
ON battle_queue FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Fix battle_rounds RLS policy
DROP POLICY IF EXISTS "Users can view own battle rounds" ON battle_rounds;
CREATE POLICY "Users can view own battle rounds"
ON battle_rounds FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM battles
  WHERE battles.id = battle_rounds.battle_id
  AND (auth.uid() = battles.user_a OR auth.uid() = battles.user_b)
));

-- Fix battles RLS policy
DROP POLICY IF EXISTS "Users can view own battles" ON battles;
CREATE POLICY "Users can view own battles"
ON battles FOR SELECT TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Fix battle_sets RLS policies
DROP POLICY IF EXISTS "Users can view own battle sets" ON battle_sets;
CREATE POLICY "Users can view own battle sets"
ON battle_sets FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own battle sets" ON battle_sets;
CREATE POLICY "Users can insert own battle sets"
ON battle_sets FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own battle sets" ON battle_sets;
CREATE POLICY "Users can update own battle sets"
ON battle_sets FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own battle sets" ON battle_sets;
CREATE POLICY "Users can delete own battle sets"
ON battle_sets FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Fix daily_free_pulls RLS policy
DROP POLICY IF EXISTS "daily_free_pulls_read_own" ON daily_free_pulls;
CREATE POLICY "daily_free_pulls_read_own"
ON daily_free_pulls FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Fix user_product_credits RLS policy
DROP POLICY IF EXISTS "Users can read their own product credits" ON user_product_credits;
CREATE POLICY "Users can read their own product credits"
ON user_product_credits FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Fix user_universal_credits RLS policy
DROP POLICY IF EXISTS "Users can read their own universal credits" ON user_universal_credits;
CREATE POLICY "Users can read their own universal credits"
ON user_universal_credits FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Fix purchases RLS policy
DROP POLICY IF EXISTS "Users can read their own purchases" ON purchases;
CREATE POLICY "Users can read their own purchases"
ON purchases FOR SELECT TO authenticated
USING (auth.uid() = user_id);-- Create card_transfers table for tracking gifts and swaps
CREATE TABLE public.card_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reveal_id uuid NOT NULL REFERENCES public.reveals(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL,
  to_user_id uuid,
  transfer_type TEXT NOT NULL CHECK (transfer_type IN ('GIFT', 'SWAP')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CLAIMED', 'EXPIRED', 'CANCELLED')),
  claim_token TEXT UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

-- Create swap_offers table for tracking swap requests
CREATE TABLE public.swap_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offerer_transfer_id uuid NOT NULL REFERENCES public.card_transfers(id) ON DELETE CASCADE,
  receiver_reveal_id uuid REFERENCES public.reveals(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- Enable RLS on both tables
ALTER TABLE public.card_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_offers ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_card_transfers_from_user ON public.card_transfers(from_user_id);
CREATE INDEX idx_card_transfers_to_user ON public.card_transfers(to_user_id);
CREATE INDEX idx_card_transfers_reveal ON public.card_transfers(reveal_id);
CREATE INDEX idx_card_transfers_claim_token ON public.card_transfers(claim_token);
CREATE INDEX idx_card_transfers_status ON public.card_transfers(status);
CREATE INDEX idx_swap_offers_transfer ON public.swap_offers(offerer_transfer_id);

-- RLS Policies for card_transfers

-- Users can view transfers they sent or received
CREATE POLICY "Users can view their own transfers"
ON public.card_transfers
FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can create transfers for cards they own
CREATE POLICY "Users can create transfers for their cards"
ON public.card_transfers
FOR INSERT
WITH CHECK (
  auth.uid() = from_user_id 
  AND EXISTS (
    SELECT 1 FROM public.reveals 
    WHERE id = reveal_id AND user_id = auth.uid()
  )
);

-- Users can update their own pending transfers (cancel)
CREATE POLICY "Users can update their own transfers"
ON public.card_transfers
FOR UPDATE
USING (auth.uid() = from_user_id AND status = 'PENDING');

-- Users can delete their own pending transfers
CREATE POLICY "Users can delete their own transfers"
ON public.card_transfers
FOR DELETE
USING (auth.uid() = from_user_id AND status = 'PENDING');

-- RLS Policies for swap_offers

-- Users can view swap offers related to their transfers or cards
CREATE POLICY "Users can view their swap offers"
ON public.swap_offers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.card_transfers ct 
    WHERE ct.id = offerer_transfer_id 
    AND (ct.from_user_id = auth.uid() OR ct.to_user_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.reveals r 
    WHERE r.id = receiver_reveal_id AND r.user_id = auth.uid()
  )
);

-- Users can create swap offers for transfers targeting them
CREATE POLICY "Users can create swap offers"
ON public.swap_offers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reveals r 
    WHERE r.id = receiver_reveal_id AND r.user_id = auth.uid()
  )
);

-- Users can update swap offers they're involved in
CREATE POLICY "Users can update their swap offers"
ON public.swap_offers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.card_transfers ct 
    WHERE ct.id = offerer_transfer_id 
    AND ct.from_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.reveals r 
    WHERE r.id = receiver_reveal_id AND r.user_id = auth.uid()
  )
);-- RPC Function: Create a gift transfer
CREATE OR REPLACE FUNCTION public.create_gift_transfer(
  p_reveal_id uuid,
  p_claim_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_transfer_id uuid;
  v_card_exists boolean;
BEGIN
  -- Validate user owns the card
  SELECT EXISTS (
    SELECT 1 FROM reveals 
    WHERE id = p_reveal_id 
    AND user_id = v_user_id 
    AND revealed_at IS NOT NULL
  ) INTO v_card_exists;
  
  IF NOT v_card_exists THEN
    RETURN jsonb_build_object('error', 'You do not own this card or it has not been revealed');
  END IF;
  
  -- Check if card already has a pending transfer
  IF EXISTS (
    SELECT 1 FROM card_transfers 
    WHERE reveal_id = p_reveal_id 
    AND status = 'PENDING'
  ) THEN
    RETURN jsonb_build_object('error', 'This card already has a pending transfer');
  END IF;
  
  -- Create the transfer
  INSERT INTO card_transfers (
    reveal_id, from_user_id, transfer_type, claim_token
  ) VALUES (
    p_reveal_id, v_user_id, 'GIFT', p_claim_token
  ) RETURNING id INTO v_transfer_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'claim_token', p_claim_token,
    'expires_at', (now() + interval '7 days')
  );
END;
$$;

-- RPC Function: Create a swap offer (listing card for swap)
CREATE OR REPLACE FUNCTION public.create_swap_offer(
  p_reveal_id uuid,
  p_claim_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_transfer_id uuid;
  v_card_exists boolean;
BEGIN
  -- Validate user owns the card
  SELECT EXISTS (
    SELECT 1 FROM reveals 
    WHERE id = p_reveal_id 
    AND user_id = v_user_id 
    AND revealed_at IS NOT NULL
  ) INTO v_card_exists;
  
  IF NOT v_card_exists THEN
    RETURN jsonb_build_object('error', 'You do not own this card or it has not been revealed');
  END IF;
  
  -- Check if card already has a pending transfer
  IF EXISTS (
    SELECT 1 FROM card_transfers 
    WHERE reveal_id = p_reveal_id 
    AND status = 'PENDING'
  ) THEN
    RETURN jsonb_build_object('error', 'This card already has a pending transfer');
  END IF;
  
  -- Create the swap transfer
  INSERT INTO card_transfers (
    reveal_id, from_user_id, transfer_type, claim_token
  ) VALUES (
    p_reveal_id, v_user_id, 'SWAP', p_claim_token
  ) RETURNING id INTO v_transfer_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'claim_token', p_claim_token,
    'expires_at', (now() + interval '7 days')
  );
END;
$$;

-- RPC Function: Claim a gift
CREATE OR REPLACE FUNCTION public.claim_gift(
  p_claim_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_transfer RECORD;
BEGIN
  -- Get the transfer
  SELECT ct.*, r.user_id as current_owner
  INTO v_transfer
  FROM card_transfers ct
  JOIN reveals r ON r.id = ct.reveal_id
  WHERE ct.claim_token = p_claim_token
  AND ct.transfer_type = 'GIFT'
  FOR UPDATE;
  
  IF v_transfer IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid or expired gift link');
  END IF;
  
  IF v_transfer.status != 'PENDING' THEN
    RETURN jsonb_build_object('error', 'This gift has already been claimed or cancelled');
  END IF;
  
  IF v_transfer.expires_at < now() THEN
    -- Mark as expired
    UPDATE card_transfers SET status = 'EXPIRED' WHERE id = v_transfer.id;
    RETURN jsonb_build_object('error', 'This gift link has expired');
  END IF;
  
  IF v_transfer.from_user_id = v_user_id THEN
    RETURN jsonb_build_object('error', 'You cannot claim your own gift');
  END IF;
  
  -- Transfer ownership of the card
  UPDATE reveals 
  SET user_id = v_user_id 
  WHERE id = v_transfer.reveal_id;
  
  -- Mark transfer as claimed
  UPDATE card_transfers 
  SET status = 'CLAIMED', 
      to_user_id = v_user_id, 
      claimed_at = now() 
  WHERE id = v_transfer.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'reveal_id', v_transfer.reveal_id,
    'message', 'Gift claimed successfully!'
  );
END;
$$;

-- RPC Function: Claim a swap by offering a card
CREATE OR REPLACE FUNCTION public.claim_swap(
  p_claim_token text,
  p_offered_reveal_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_transfer RECORD;
  v_offered_card_exists boolean;
BEGIN
  -- Get the swap transfer
  SELECT ct.*, r.user_id as current_owner
  INTO v_transfer
  FROM card_transfers ct
  JOIN reveals r ON r.id = ct.reveal_id
  WHERE ct.claim_token = p_claim_token
  AND ct.transfer_type = 'SWAP'
  FOR UPDATE;
  
  IF v_transfer IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid or expired swap link');
  END IF;
  
  IF v_transfer.status != 'PENDING' THEN
    RETURN jsonb_build_object('error', 'This swap has already been completed or cancelled');
  END IF;
  
  IF v_transfer.expires_at < now() THEN
    UPDATE card_transfers SET status = 'EXPIRED' WHERE id = v_transfer.id;
    RETURN jsonb_build_object('error', 'This swap link has expired');
  END IF;
  
  IF v_transfer.from_user_id = v_user_id THEN
    RETURN jsonb_build_object('error', 'You cannot swap with yourself');
  END IF;
  
  -- Validate user owns the offered card
  SELECT EXISTS (
    SELECT 1 FROM reveals 
    WHERE id = p_offered_reveal_id 
    AND user_id = v_user_id 
    AND revealed_at IS NOT NULL
  ) INTO v_offered_card_exists;
  
  IF NOT v_offered_card_exists THEN
    RETURN jsonb_build_object('error', 'You do not own the card you are offering');
  END IF;
  
  -- Check offered card doesn't have pending transfer
  IF EXISTS (
    SELECT 1 FROM card_transfers 
    WHERE reveal_id = p_offered_reveal_id 
    AND status = 'PENDING'
  ) THEN
    RETURN jsonb_build_object('error', 'Your offered card has a pending transfer');
  END IF;
  
  -- Perform the atomic swap
  -- Give the requester's card to the offerer (original owner)
  UPDATE reveals 
  SET user_id = v_transfer.from_user_id 
  WHERE id = p_offered_reveal_id;
  
  -- Give the offerer's card to the requester (current user)
  UPDATE reveals 
  SET user_id = v_user_id 
  WHERE id = v_transfer.reveal_id;
  
  -- Mark transfer as claimed
  UPDATE card_transfers 
  SET status = 'CLAIMED', 
      to_user_id = v_user_id, 
      claimed_at = now() 
  WHERE id = v_transfer.id;
  
  -- Create a swap_offers record for history
  INSERT INTO swap_offers (
    offerer_transfer_id, receiver_reveal_id, status, resolved_at
  ) VALUES (
    v_transfer.id, p_offered_reveal_id, 'ACCEPTED', now()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'received_reveal_id', v_transfer.reveal_id,
    'given_reveal_id', p_offered_reveal_id,
    'message', 'Swap completed successfully!'
  );
END;
$$;

-- RPC Function: Cancel a pending transfer
CREATE OR REPLACE FUNCTION public.cancel_transfer(
  p_transfer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_transfer RECORD;
BEGIN
  -- Get the transfer
  SELECT * INTO v_transfer
  FROM card_transfers
  WHERE id = p_transfer_id
  FOR UPDATE;
  
  IF v_transfer IS NULL THEN
    RETURN jsonb_build_object('error', 'Transfer not found');
  END IF;
  
  IF v_transfer.from_user_id != v_user_id THEN
    RETURN jsonb_build_object('error', 'You can only cancel your own transfers');
  END IF;
  
  IF v_transfer.status != 'PENDING' THEN
    RETURN jsonb_build_object('error', 'Only pending transfers can be cancelled');
  END IF;
  
  -- Cancel the transfer
  UPDATE card_transfers 
  SET status = 'CANCELLED' 
  WHERE id = p_transfer_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Transfer cancelled successfully'
  );
END;
$$;-- 1.1 Create collector_profiles table
CREATE TABLE public.collector_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Create collector_connections table (follow system)
CREATE TABLE public.collector_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'FOLLOWING' CHECK (status IN ('FOLLOWING', 'MUTUAL')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create indexes for performance
CREATE INDEX idx_collector_connections_follower ON public.collector_connections(follower_id);
CREATE INDEX idx_collector_connections_following ON public.collector_connections(following_id);
CREATE INDEX idx_collector_profiles_username ON public.collector_profiles(username);

-- 1.3 Create get_collector_score RPC function
CREATE OR REPLACE FUNCTION public.get_collector_score(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card_count INT := 0;
  v_collection_value NUMERIC := 0;
  v_swaps_completed INT := 0;
  v_gifts_given INT := 0;
  v_battles_won INT := 0;
  v_battles_lost INT := 0;
  v_redemptions INT := 0;
  v_collection_value_score NUMERIC;
  v_card_count_score NUMERIC;
  v_swaps_score NUMERIC;
  v_gifts_score NUMERIC;
  v_battle_score NUMERIC;
  v_redemption_score NUMERIC;
  v_total_score INT;
BEGIN
  -- Get card count and collection value
  SELECT COUNT(*), COALESCE(SUM(pc.retail_value_usd), 0)
  INTO v_card_count, v_collection_value
  FROM reveals r
  JOIN product_classes pc ON pc.id = r.product_class_id
  WHERE r.user_id = p_user_id AND r.revealed_at IS NOT NULL;

  -- Get swaps completed (transfers where user was either sender or receiver with status CLAIMED and type swap)
  SELECT COUNT(*)
  INTO v_swaps_completed
  FROM card_transfers ct
  WHERE (ct.from_user_id = p_user_id OR ct.to_user_id = p_user_id)
    AND ct.status = 'CLAIMED'
    AND ct.transfer_type = 'swap';

  -- Get gifts given
  SELECT COUNT(*)
  INTO v_gifts_given
  FROM card_transfers ct
  WHERE ct.from_user_id = p_user_id
    AND ct.status = 'CLAIMED'
    AND ct.transfer_type = 'gift';

  -- Get battle stats
  SELECT COALESCE(wins, 0), COALESCE(losses, 0)
  INTO v_battles_won, v_battles_lost
  FROM leaderboard_stats
  WHERE user_id = p_user_id AND season_id = 'S1';

  -- Get redemptions (awards with status FULFILLED)
  SELECT COUNT(*)
  INTO v_redemptions
  FROM awards
  WHERE user_id = p_user_id AND status = 'FULFILLED';

  -- Calculate component scores
  -- Collection value: 25% weight (log-scaled, $0-$100K+)
  v_collection_value_score := LEAST(25, (CASE WHEN v_collection_value > 0 THEN log(v_collection_value + 1) / log(100001) * 25 ELSE 0 END));
  
  -- Card count: 15% weight (0-500+ cards)
  v_card_count_score := LEAST(15, (v_card_count::NUMERIC / 500) * 15);
  
  -- Swaps completed: 15% weight (0-50+ swaps)
  v_swaps_score := LEAST(15, (v_swaps_completed::NUMERIC / 50) * 15);
  
  -- Gifts given: 10% weight (0-25+ gifts)
  v_gifts_score := LEAST(10, (v_gifts_given::NUMERIC / 25) * 10);
  
  -- Battle win rate: 20% weight
  v_battle_score := CASE 
    WHEN (v_battles_won + v_battles_lost) > 0 
    THEN (v_battles_won::NUMERIC / (v_battles_won + v_battles_lost)) * 20
    ELSE 0 
  END;
  
  -- Redemptions: 15% weight (0-10+ items)
  v_redemption_score := LEAST(15, (v_redemptions::NUMERIC / 10) * 15);

  -- Calculate total score (1-100, minimum 1)
  v_total_score := GREATEST(1, LEAST(100, ROUND(
    v_collection_value_score + v_card_count_score + v_swaps_score + 
    v_gifts_score + v_battle_score + v_redemption_score
  )::INT));

  RETURN jsonb_build_object(
    'score', v_total_score,
    'card_count', v_card_count,
    'collection_value', v_collection_value,
    'swaps_completed', v_swaps_completed,
    'gifts_given', v_gifts_given,
    'battles_won', v_battles_won,
    'battles_lost', v_battles_lost,
    'redemptions', v_redemptions,
    'breakdown', jsonb_build_object(
      'collection_value_score', ROUND(v_collection_value_score, 2),
      'card_count_score', ROUND(v_card_count_score, 2),
      'swaps_score', ROUND(v_swaps_score, 2),
      'gifts_score', ROUND(v_gifts_score, 2),
      'battle_score', ROUND(v_battle_score, 2),
      'redemption_score', ROUND(v_redemption_score, 2)
    )
  );
END;
$$;

-- 1.4 Create trigger for auto-profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_base_username TEXT;
  v_counter INT := 0;
BEGIN
  -- Generate base username from email (before @)
  v_base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  -- Remove non-alphanumeric characters
  v_base_username := REGEXP_REPLACE(v_base_username, '[^a-z0-9]', '', 'g');
  -- Ensure minimum length
  IF LENGTH(v_base_username) < 3 THEN
    v_base_username := 'collector';
  END IF;
  
  v_username := v_base_username;
  
  -- Handle uniqueness by appending numbers if needed
  WHILE EXISTS (SELECT 1 FROM collector_profiles WHERE username = v_username) LOOP
    v_counter := v_counter + 1;
    v_username := v_base_username || v_counter::TEXT;
  END LOOP;
  
  -- Insert profile
  INSERT INTO collector_profiles (user_id, username, display_name)
  VALUES (NEW.id, v_username, v_username);
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- 1.5 Enable RLS
ALTER TABLE public.collector_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_connections ENABLE ROW LEVEL SECURITY;

-- Profiles RLS: Anyone can read public profiles
CREATE POLICY "Anyone can view public profiles"
ON public.collector_profiles
FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

-- Profiles RLS: Owners can update their own
CREATE POLICY "Users can update own profile"
ON public.collector_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Profiles RLS: Users can insert their own (for manual profile creation if trigger fails)
CREATE POLICY "Users can insert own profile"
ON public.collector_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Connections RLS: Users can view connections involving them or public users
CREATE POLICY "Users can view connections"
ON public.collector_connections
FOR SELECT
USING (
  auth.uid() = follower_id 
  OR auth.uid() = following_id
  OR EXISTS (SELECT 1 FROM collector_profiles WHERE user_id = following_id AND is_public = true)
);

-- Connections RLS: Users can create their own follows
CREATE POLICY "Users can create follows"
ON public.collector_connections
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

-- Connections RLS: Users can delete their own follows
CREATE POLICY "Users can delete own follows"
ON public.collector_connections
FOR DELETE
USING (auth.uid() = follower_id);

-- Connections RLS: System can update for mutual status (via RPC)
CREATE POLICY "Users can update own connections"
ON public.collector_connections
FOR UPDATE
USING (auth.uid() = follower_id OR auth.uid() = following_id);-- 2.1 get_collector_profile: Returns profile with computed score and stats
CREATE OR REPLACE FUNCTION public.get_collector_profile(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_score_data JSONB;
  v_follower_count INT;
  v_following_count INT;
  v_is_following BOOLEAN := false;
  v_current_user UUID := auth.uid();
BEGIN
  -- Get profile
  SELECT * INTO v_profile
  FROM collector_profiles
  WHERE user_id = p_user_id;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  
  -- Check if profile is public or owned by current user
  IF NOT v_profile.is_public AND v_current_user != p_user_id THEN
    RETURN jsonb_build_object('error', 'Profile is private');
  END IF;
  
  -- Get score data
  v_score_data := get_collector_score(p_user_id);
  
  -- Get follower/following counts
  SELECT COUNT(*) INTO v_follower_count
  FROM collector_connections WHERE following_id = p_user_id;
  
  SELECT COUNT(*) INTO v_following_count
  FROM collector_connections WHERE follower_id = p_user_id;
  
  -- Check if current user is following this profile
  IF v_current_user IS NOT NULL AND v_current_user != p_user_id THEN
    SELECT EXISTS(
      SELECT 1 FROM collector_connections 
      WHERE follower_id = v_current_user AND following_id = p_user_id
    ) INTO v_is_following;
  END IF;
  
  RETURN jsonb_build_object(
    'user_id', v_profile.user_id,
    'username', v_profile.username,
    'display_name', v_profile.display_name,
    'avatar_url', v_profile.avatar_url,
    'bio', v_profile.bio,
    'is_public', v_profile.is_public,
    'created_at', v_profile.created_at,
    'follower_count', v_follower_count,
    'following_count', v_following_count,
    'is_following', v_is_following,
    'is_own_profile', v_current_user = p_user_id,
    'score', v_score_data->'score',
    'stats', jsonb_build_object(
      'card_count', v_score_data->'card_count',
      'collection_value', v_score_data->'collection_value',
      'swaps_completed', v_score_data->'swaps_completed',
      'gifts_given', v_score_data->'gifts_given',
      'battles_won', v_score_data->'battles_won',
      'battles_lost', v_score_data->'battles_lost',
      'redemptions', v_score_data->'redemptions'
    ),
    'score_breakdown', v_score_data->'breakdown'
  );
END;
$$;

-- 2.2 search_collectors: Search by username or display_name
CREATE OR REPLACE FUNCTION public.search_collectors(p_query TEXT, p_limit INT DEFAULT 20)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_results JSONB := '[]'::JSONB;
  v_collector RECORD;
  v_score_data JSONB;
BEGIN
  FOR v_collector IN
    SELECT cp.*
    FROM collector_profiles cp
    WHERE cp.is_public = true
      AND (
        cp.username ILIKE '%' || p_query || '%'
        OR cp.display_name ILIKE '%' || p_query || '%'
      )
    ORDER BY 
      CASE WHEN cp.username ILIKE p_query || '%' THEN 0
           WHEN cp.display_name ILIKE p_query || '%' THEN 1
           ELSE 2 END,
      cp.username
    LIMIT p_limit
  LOOP
    v_score_data := get_collector_score(v_collector.user_id);
    
    v_results := v_results || jsonb_build_object(
      'user_id', v_collector.user_id,
      'username', v_collector.username,
      'display_name', v_collector.display_name,
      'avatar_url', v_collector.avatar_url,
      'score', v_score_data->'score',
      'card_count', v_score_data->'card_count'
    );
  END LOOP;
  
  RETURN v_results;
END;
$$;

-- 2.3 follow_collector: Creates connection, updates to MUTUAL if reciprocal
CREATE OR REPLACE FUNCTION public.follow_collector(p_target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user UUID := auth.uid();
  v_existing_follow RECORD;
  v_reverse_follow RECORD;
BEGIN
  -- Validate
  IF v_current_user IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  
  IF v_current_user = p_target_user_id THEN
    RETURN jsonb_build_object('error', 'Cannot follow yourself');
  END IF;
  
  -- Check if target profile exists and is public
  IF NOT EXISTS (
    SELECT 1 FROM collector_profiles 
    WHERE user_id = p_target_user_id AND is_public = true
  ) THEN
    RETURN jsonb_build_object('error', 'Profile not found or is private');
  END IF;
  
  -- Check if already following
  SELECT * INTO v_existing_follow
  FROM collector_connections
  WHERE follower_id = v_current_user AND following_id = p_target_user_id;
  
  IF v_existing_follow IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Already following this collector');
  END IF;
  
  -- Check if they follow us (for mutual status)
  SELECT * INTO v_reverse_follow
  FROM collector_connections
  WHERE follower_id = p_target_user_id AND following_id = v_current_user;
  
  -- Create the follow
  INSERT INTO collector_connections (follower_id, following_id, status)
  VALUES (v_current_user, p_target_user_id, 
    CASE WHEN v_reverse_follow IS NOT NULL THEN 'MUTUAL' ELSE 'FOLLOWING' END
  );
  
  -- Update reverse connection to mutual if exists
  IF v_reverse_follow IS NOT NULL THEN
    UPDATE collector_connections
    SET status = 'MUTUAL'
    WHERE id = v_reverse_follow.id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'status', CASE WHEN v_reverse_follow IS NOT NULL THEN 'MUTUAL' ELSE 'FOLLOWING' END
  );
END;
$$;

-- 2.4 unfollow_collector: Removes connection
CREATE OR REPLACE FUNCTION public.unfollow_collector(p_target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user UUID := auth.uid();
  v_connection RECORD;
BEGIN
  -- Validate
  IF v_current_user IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  
  -- Find and delete the connection
  DELETE FROM collector_connections
  WHERE follower_id = v_current_user AND following_id = p_target_user_id
  RETURNING * INTO v_connection;
  
  IF v_connection IS NULL THEN
    RETURN jsonb_build_object('error', 'Not following this collector');
  END IF;
  
  -- If it was mutual, update the reverse connection back to FOLLOWING
  UPDATE collector_connections
  SET status = 'FOLLOWING'
  WHERE follower_id = p_target_user_id 
    AND following_id = v_current_user 
    AND status = 'MUTUAL';
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 2.5 get_collector_collection: Returns public cards for viewing another user's collection
CREATE OR REPLACE FUNCTION public.get_collector_collection(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_current_user UUID := auth.uid();
  v_cards JSONB := '[]'::JSONB;
BEGIN
  -- Get profile
  SELECT * INTO v_profile
  FROM collector_profiles
  WHERE user_id = p_user_id;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  
  -- Check if profile is public or owned by current user
  IF NOT v_profile.is_public AND v_current_user != p_user_id THEN
    RETURN jsonb_build_object('error', 'Profile is private');
  END IF;
  
  -- Get revealed cards
  SELECT COALESCE(jsonb_agg(card_data ORDER BY r.created_at DESC), '[]'::JSONB)
  INTO v_cards
  FROM (
    SELECT jsonb_build_object(
      'id', r.id,
      'product_class_id', r.product_class_id,
      'band', r.band,
      'is_golden', r.is_golden,
      'serial_number', r.serial_number,
      'revealed_at', r.revealed_at,
      'product', jsonb_build_object(
        'id', pc.id,
        'name', pc.name,
        'brand', pc.brand,
        'model', pc.model,
        'category', pc.category,
        'retail_value_usd', pc.retail_value_usd,
        'image_url', pc.image_url
      )
    ) AS card_data,
    r.created_at
    FROM reveals r
    JOIN product_classes pc ON pc.id = r.product_class_id
    WHERE r.user_id = p_user_id AND r.revealed_at IS NOT NULL
  ) AS r;
  
  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'username', v_profile.username,
    'display_name', v_profile.display_name,
    'cards', v_cards,
    'card_count', jsonb_array_length(v_cards)
  );
END;
$$;

-- 2.6 get_collectors_list: Filter by all/following/followers/mutual
CREATE OR REPLACE FUNCTION public.get_collectors_list(p_filter TEXT DEFAULT 'all', p_limit INT DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user UUID := auth.uid();
  v_results JSONB := '[]'::JSONB;
  v_collector RECORD;
  v_score_data JSONB;
BEGIN
  IF p_filter = 'following' THEN
    -- Users I follow
    FOR v_collector IN
      SELECT cp.*
      FROM collector_profiles cp
      JOIN collector_connections cc ON cc.following_id = cp.user_id
      WHERE cc.follower_id = v_current_user
      ORDER BY cc.created_at DESC
      LIMIT p_limit
    LOOP
      v_score_data := get_collector_score(v_collector.user_id);
      v_results := v_results || jsonb_build_object(
        'user_id', v_collector.user_id,
        'username', v_collector.username,
        'display_name', v_collector.display_name,
        'avatar_url', v_collector.avatar_url,
        'score', v_score_data->'score',
        'card_count', v_score_data->'card_count',
        'connection_status', 'FOLLOWING'
      );
    END LOOP;
    
  ELSIF p_filter = 'followers' THEN
    -- Users who follow me
    FOR v_collector IN
      SELECT cp.*, cc.status
      FROM collector_profiles cp
      JOIN collector_connections cc ON cc.follower_id = cp.user_id
      WHERE cc.following_id = v_current_user
      ORDER BY cc.created_at DESC
      LIMIT p_limit
    LOOP
      v_score_data := get_collector_score(v_collector.user_id);
      v_results := v_results || jsonb_build_object(
        'user_id', v_collector.user_id,
        'username', v_collector.username,
        'display_name', v_collector.display_name,
        'avatar_url', v_collector.avatar_url,
        'score', v_score_data->'score',
        'card_count', v_score_data->'card_count',
        'connection_status', v_collector.status
      );
    END LOOP;
    
  ELSIF p_filter = 'mutual' THEN
    -- Mutual connections (friends)
    FOR v_collector IN
      SELECT cp.*
      FROM collector_profiles cp
      JOIN collector_connections cc ON cc.following_id = cp.user_id
      WHERE cc.follower_id = v_current_user AND cc.status = 'MUTUAL'
      ORDER BY cc.created_at DESC
      LIMIT p_limit
    LOOP
      v_score_data := get_collector_score(v_collector.user_id);
      v_results := v_results || jsonb_build_object(
        'user_id', v_collector.user_id,
        'username', v_collector.username,
        'display_name', v_collector.display_name,
        'avatar_url', v_collector.avatar_url,
        'score', v_score_data->'score',
        'card_count', v_score_data->'card_count',
        'connection_status', 'MUTUAL'
      );
    END LOOP;
    
  ELSE
    -- All public collectors (sorted by score)
    FOR v_collector IN
      SELECT cp.*
      FROM collector_profiles cp
      WHERE cp.is_public = true
      LIMIT p_limit
    LOOP
      v_score_data := get_collector_score(v_collector.user_id);
      v_results := v_results || jsonb_build_object(
        'user_id', v_collector.user_id,
        'username', v_collector.username,
        'display_name', v_collector.display_name,
        'avatar_url', v_collector.avatar_url,
        'score', v_score_data->'score',
        'card_count', v_score_data->'card_count'
      );
    END LOOP;
    
    -- Sort by score descending
    SELECT COALESCE(jsonb_agg(elem ORDER BY (elem->>'score')::INT DESC), '[]'::JSONB)
    INTO v_results
    FROM jsonb_array_elements(v_results) AS elem;
  END IF;
  
  RETURN v_results;
END;
$$;-- Update create_gift_transfer to accept optional target user
CREATE OR REPLACE FUNCTION public.create_gift_transfer(
  p_reveal_id uuid,
  p_claim_token text,
  p_to_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer_id uuid;
  v_expires_at timestamp with time zone;
BEGIN
  -- Verify the reveal belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM reveals 
    WHERE id = p_reveal_id AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card not found or not owned by you');
  END IF;

  -- Check if there's already a pending transfer for this reveal
  IF EXISTS (
    SELECT 1 FROM card_transfers 
    WHERE reveal_id = p_reveal_id AND status = 'PENDING'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This card already has a pending transfer');
  END IF;

  v_expires_at := now() + interval '7 days';

  -- Create the transfer
  INSERT INTO card_transfers (
    reveal_id,
    from_user_id,
    to_user_id,
    transfer_type,
    claim_token,
    status,
    expires_at
  ) VALUES (
    p_reveal_id,
    auth.uid(),
    p_to_user_id,
    'GIFT',
    p_claim_token,
    'PENDING',
    v_expires_at
  )
  RETURNING id INTO v_transfer_id;

  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'claim_token', p_claim_token,
    'expires_at', v_expires_at,
    'is_direct', p_to_user_id IS NOT NULL
  );
END;
$$;

-- Update create_swap_offer to accept optional target user
CREATE OR REPLACE FUNCTION public.create_swap_offer(
  p_reveal_id uuid,
  p_claim_token text,
  p_to_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer_id uuid;
  v_expires_at timestamp with time zone;
BEGIN
  -- Verify the reveal belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM reveals 
    WHERE id = p_reveal_id AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card not found or not owned by you');
  END IF;

  -- Check if there's already a pending transfer for this reveal
  IF EXISTS (
    SELECT 1 FROM card_transfers 
    WHERE reveal_id = p_reveal_id AND status = 'PENDING'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This card already has a pending transfer');
  END IF;

  v_expires_at := now() + interval '7 days';

  -- Create the transfer
  INSERT INTO card_transfers (
    reveal_id,
    from_user_id,
    to_user_id,
    transfer_type,
    claim_token,
    status,
    expires_at
  ) VALUES (
    p_reveal_id,
    auth.uid(),
    p_to_user_id,
    'SWAP',
    p_claim_token,
    'PENDING',
    v_expires_at
  )
  RETURNING id INTO v_transfer_id;

  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'claim_token', p_claim_token,
    'expires_at', v_expires_at,
    'is_direct', p_to_user_id IS NOT NULL
  );
END;
$$;

-- Function to get pending transfers for/from a specific collector
CREATE OR REPLACE FUNCTION public.get_pending_transfers_with_collector(
  p_collector_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_incoming_gifts integer;
  v_incoming_swaps integer;
  v_outgoing_gifts integer;
  v_outgoing_swaps integer;
BEGIN
  -- Count incoming gifts (to current user from specified collector)
  SELECT COUNT(*) INTO v_incoming_gifts
  FROM card_transfers
  WHERE to_user_id = auth.uid()
    AND from_user_id = p_collector_user_id
    AND transfer_type = 'GIFT'
    AND status = 'PENDING';

  -- Count incoming swaps
  SELECT COUNT(*) INTO v_incoming_swaps
  FROM card_transfers
  WHERE to_user_id = auth.uid()
    AND from_user_id = p_collector_user_id
    AND transfer_type = 'SWAP'
    AND status = 'PENDING';

  -- Count outgoing gifts (from current user to specified collector)
  SELECT COUNT(*) INTO v_outgoing_gifts
  FROM card_transfers
  WHERE from_user_id = auth.uid()
    AND to_user_id = p_collector_user_id
    AND transfer_type = 'GIFT'
    AND status = 'PENDING';

  -- Count outgoing swaps
  SELECT COUNT(*) INTO v_outgoing_swaps
  FROM card_transfers
  WHERE from_user_id = auth.uid()
    AND to_user_id = p_collector_user_id
    AND transfer_type = 'SWAP'
    AND status = 'PENDING';

  RETURN jsonb_build_object(
    'incoming_gifts', v_incoming_gifts,
    'incoming_swaps', v_incoming_swaps,
    'outgoing_gifts', v_outgoing_gifts,
    'outgoing_swaps', v_outgoing_swaps,
    'total_incoming', v_incoming_gifts + v_incoming_swaps,
    'total_outgoing', v_outgoing_gifts + v_outgoing_swaps
  );
END;
$$;-- Create a helper function to calculate collector score
CREATE OR REPLACE FUNCTION public.calculate_collector_score(
  p_collection_value NUMERIC,
  p_card_count INTEGER,
  p_swaps_completed INTEGER,
  p_gifts_given INTEGER,
  p_battles_won INTEGER,
  p_battles_lost INTEGER,
  p_redemptions INTEGER
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_collection_value_score NUMERIC;
  v_card_count_score NUMERIC;
  v_swaps_score NUMERIC;
  v_gifts_score NUMERIC;
  v_battle_score NUMERIC;
  v_redemption_score NUMERIC;
  v_total_score NUMERIC;
BEGIN
  -- Collection value score: min(25, log10(value + 1) / log10(100000) * 25)
  v_collection_value_score := LEAST(25, 
    CASE WHEN p_collection_value > 0 
      THEN (log(p_collection_value + 1) / log(100000)) * 25 
      ELSE 0 
    END
  );
  
  -- Card count score: min(15, cards / 500 * 15)
  v_card_count_score := LEAST(15, (p_card_count::NUMERIC / 500) * 15);
  
  -- Swaps score: min(15, swaps / 50 * 15)
  v_swaps_score := LEAST(15, (p_swaps_completed::NUMERIC / 50) * 15);
  
  -- Gifts score: min(10, gifts / 25 * 10)
  v_gifts_score := LEAST(10, (p_gifts_given::NUMERIC / 25) * 10);
  
  -- Battle score: (wins / max(wins + losses, 1)) * 20
  v_battle_score := (p_battles_won::NUMERIC / GREATEST(p_battles_won + p_battles_lost, 1)) * 20;
  
  -- Redemption score: min(15, redemptions / 10 * 15)
  v_redemption_score := LEAST(15, (p_redemptions::NUMERIC / 10) * 15);
  
  -- Total score
  v_total_score := v_collection_value_score + v_card_count_score + v_swaps_score + 
                   v_gifts_score + v_battle_score + v_redemption_score;
  
  -- Clamp to 1-100 range (minimum 1 for any user)
  RETURN GREATEST(1, LEAST(100, ROUND(v_total_score)));
END;
$$;

-- Update get_collector_profile to use the new scoring algorithm
CREATE OR REPLACE FUNCTION public.get_collector_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_card_count INTEGER;
  v_collection_value NUMERIC;
  v_swaps_completed INTEGER;
  v_gifts_given INTEGER;
  v_battles_won INTEGER;
  v_battles_lost INTEGER;
  v_redemptions INTEGER;
  v_follower_count INTEGER;
  v_following_count INTEGER;
  v_is_following BOOLEAN;
  v_score INTEGER;
  v_score_breakdown JSONB;
BEGIN
  -- Get profile
  SELECT * INTO v_profile
  FROM collector_profiles
  WHERE user_id = p_user_id;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  
  -- Check privacy (only owner can view private profiles)
  IF NOT v_profile.is_public AND auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('error', 'Profile is private');
  END IF;
  
  -- Get card count and collection value
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(SUM(pc.retail_value_usd), 0)
  INTO v_card_count, v_collection_value
  FROM reveals r
  JOIN product_classes pc ON pc.id = r.product_class_id
  WHERE r.user_id = p_user_id AND r.revealed_at IS NOT NULL;
  
  -- Get swaps completed (as sender or receiver)
  SELECT COUNT(*)::INTEGER INTO v_swaps_completed
  FROM card_transfers
  WHERE (from_user_id = p_user_id OR to_user_id = p_user_id)
    AND transfer_type = 'SWAP'
    AND status = 'CLAIMED';
  
  -- Get gifts given
  SELECT COUNT(*)::INTEGER INTO v_gifts_given
  FROM card_transfers
  WHERE from_user_id = p_user_id
    AND transfer_type = 'GIFT'
    AND status = 'CLAIMED';
  
  -- Get battle stats
  SELECT 
    COALESCE(wins, 0),
    COALESCE(losses, 0)
  INTO v_battles_won, v_battles_lost
  FROM leaderboard_stats
  WHERE user_id = p_user_id AND season_id = 'S1';
  
  IF v_battles_won IS NULL THEN
    v_battles_won := 0;
    v_battles_lost := 0;
  END IF;
  
  -- Get redemptions
  SELECT COUNT(*)::INTEGER INTO v_redemptions
  FROM awards
  WHERE user_id = p_user_id AND status = 'FULFILLED';
  
  -- Get follower/following counts
  SELECT COUNT(*)::INTEGER INTO v_follower_count
  FROM collector_connections
  WHERE following_id = p_user_id;
  
  SELECT COUNT(*)::INTEGER INTO v_following_count
  FROM collector_connections
  WHERE follower_id = p_user_id;
  
  -- Check if current user is following this profile
  v_is_following := EXISTS (
    SELECT 1 FROM collector_connections
    WHERE follower_id = auth.uid() AND following_id = p_user_id
  );
  
  -- Calculate score using helper function
  v_score := calculate_collector_score(
    v_collection_value,
    v_card_count,
    v_swaps_completed,
    v_gifts_given,
    v_battles_won,
    v_battles_lost,
    v_redemptions
  );
  
  -- Build score breakdown for UI display
  v_score_breakdown := jsonb_build_object(
    'collection_value_score', ROUND(LEAST(25, 
      CASE WHEN v_collection_value > 0 
        THEN (log(v_collection_value + 1) / log(100000)) * 25 
        ELSE 0 
      END
    ), 1),
    'card_count_score', ROUND(LEAST(15, (v_card_count::NUMERIC / 500) * 15), 1),
    'swaps_score', ROUND(LEAST(15, (v_swaps_completed::NUMERIC / 50) * 15), 1),
    'gifts_score', ROUND(LEAST(10, (v_gifts_given::NUMERIC / 25) * 10), 1),
    'battle_score', ROUND((v_battles_won::NUMERIC / GREATEST(v_battles_won + v_battles_lost, 1)) * 20, 1),
    'redemption_score', ROUND(LEAST(15, (v_redemptions::NUMERIC / 10) * 15), 1)
  );
  
  RETURN jsonb_build_object(
    'user_id', v_profile.user_id,
    'username', v_profile.username,
    'display_name', v_profile.display_name,
    'avatar_url', v_profile.avatar_url,
    'bio', v_profile.bio,
    'is_public', v_profile.is_public,
    'created_at', v_profile.created_at,
    'follower_count', v_follower_count,
    'following_count', v_following_count,
    'is_following', v_is_following,
    'is_own_profile', auth.uid() = p_user_id,
    'score', v_score,
    'stats', jsonb_build_object(
      'card_count', v_card_count,
      'collection_value', v_collection_value,
      'swaps_completed', v_swaps_completed,
      'gifts_given', v_gifts_given,
      'battles_won', v_battles_won,
      'battles_lost', v_battles_lost,
      'redemptions', v_redemptions
    ),
    'score_breakdown', v_score_breakdown
  );
END;
$$;

-- Update get_collectors_list to use the scoring function
CREATE OR REPLACE FUNCTION public.get_collectors_list(
  p_filter text DEFAULT 'all',
  p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH collector_data AS (
    SELECT 
      cp.user_id,
      cp.username,
      cp.display_name,
      cp.avatar_url,
      -- Get card count
      (SELECT COUNT(*)::INTEGER FROM reveals r WHERE r.user_id = cp.user_id AND r.revealed_at IS NOT NULL) as card_count,
      -- Get collection value
      (SELECT COALESCE(SUM(pc.retail_value_usd), 0) 
       FROM reveals r 
       JOIN product_classes pc ON pc.id = r.product_class_id 
       WHERE r.user_id = cp.user_id AND r.revealed_at IS NOT NULL) as collection_value,
      -- Get swaps
      (SELECT COUNT(*)::INTEGER FROM card_transfers 
       WHERE (from_user_id = cp.user_id OR to_user_id = cp.user_id) 
       AND transfer_type = 'SWAP' AND status = 'CLAIMED') as swaps_completed,
      -- Get gifts
      (SELECT COUNT(*)::INTEGER FROM card_transfers 
       WHERE from_user_id = cp.user_id AND transfer_type = 'GIFT' AND status = 'CLAIMED') as gifts_given,
      -- Get battles
      COALESCE((SELECT wins FROM leaderboard_stats WHERE user_id = cp.user_id AND season_id = 'S1'), 0) as battles_won,
      COALESCE((SELECT losses FROM leaderboard_stats WHERE user_id = cp.user_id AND season_id = 'S1'), 0) as battles_lost,
      -- Get redemptions
      (SELECT COUNT(*)::INTEGER FROM awards WHERE user_id = cp.user_id AND status = 'FULFILLED') as redemptions,
      -- Connection status
      (SELECT cc.status FROM collector_connections cc 
       WHERE cc.follower_id = auth.uid() AND cc.following_id = cp.user_id) as connection_status
    FROM collector_profiles cp
    WHERE cp.is_public = true
      AND cp.user_id != auth.uid()
      AND (
        p_filter = 'all'
        OR (p_filter = 'following' AND EXISTS (
          SELECT 1 FROM collector_connections 
          WHERE follower_id = auth.uid() AND following_id = cp.user_id
        ))
        OR (p_filter = 'followers' AND EXISTS (
          SELECT 1 FROM collector_connections 
          WHERE follower_id = cp.user_id AND following_id = auth.uid()
        ))
        OR (p_filter = 'mutual' AND EXISTS (
          SELECT 1 FROM collector_connections 
          WHERE follower_id = auth.uid() AND following_id = cp.user_id AND status = 'MUTUAL'
        ))
      )
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', cd.user_id,
      'username', cd.username,
      'display_name', cd.display_name,
      'avatar_url', cd.avatar_url,
      'card_count', cd.card_count,
      'score', calculate_collector_score(
        cd.collection_value,
        cd.card_count,
        cd.swaps_completed,
        cd.gifts_given,
        cd.battles_won,
        cd.battles_lost,
        cd.redemptions
      ),
      'connection_status', cd.connection_status
    )
    ORDER BY calculate_collector_score(
      cd.collection_value,
      cd.card_count,
      cd.swaps_completed,
      cd.gifts_given,
      cd.battles_won,
      cd.battles_lost,
      cd.redemptions
    ) DESC
  )
  INTO v_result
  FROM collector_data cd
  LIMIT p_limit;
  
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- Update search_collectors to include score
CREATE OR REPLACE FUNCTION public.search_collectors(
  p_query text,
  p_limit integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH collector_data AS (
    SELECT 
      cp.user_id,
      cp.username,
      cp.display_name,
      cp.avatar_url,
      (SELECT COUNT(*)::INTEGER FROM reveals r WHERE r.user_id = cp.user_id AND r.revealed_at IS NOT NULL) as card_count,
      (SELECT COALESCE(SUM(pc.retail_value_usd), 0) 
       FROM reveals r JOIN product_classes pc ON pc.id = r.product_class_id 
       WHERE r.user_id = cp.user_id AND r.revealed_at IS NOT NULL) as collection_value,
      (SELECT COUNT(*)::INTEGER FROM card_transfers 
       WHERE (from_user_id = cp.user_id OR to_user_id = cp.user_id) 
       AND transfer_type = 'SWAP' AND status = 'CLAIMED') as swaps_completed,
      (SELECT COUNT(*)::INTEGER FROM card_transfers 
       WHERE from_user_id = cp.user_id AND transfer_type = 'GIFT' AND status = 'CLAIMED') as gifts_given,
      COALESCE((SELECT wins FROM leaderboard_stats WHERE user_id = cp.user_id AND season_id = 'S1'), 0) as battles_won,
      COALESCE((SELECT losses FROM leaderboard_stats WHERE user_id = cp.user_id AND season_id = 'S1'), 0) as battles_lost,
      (SELECT COUNT(*)::INTEGER FROM awards WHERE user_id = cp.user_id AND status = 'FULFILLED') as redemptions
    FROM collector_profiles cp
    WHERE cp.is_public = true
      AND cp.user_id != auth.uid()
      AND (
        cp.username ILIKE '%' || p_query || '%'
        OR cp.display_name ILIKE '%' || p_query || '%'
      )
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', cd.user_id,
      'username', cd.username,
      'display_name', cd.display_name,
      'avatar_url', cd.avatar_url,
      'card_count', cd.card_count,
      'score', calculate_collector_score(
        cd.collection_value,
        cd.card_count,
        cd.swaps_completed,
        cd.gifts_given,
        cd.battles_won,
        cd.battles_lost,
        cd.redemptions
      )
    )
  )
  INTO v_result
  FROM collector_data cd
  LIMIT p_limit;
  
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;-- Fix search_path for calculate_collector_score function
CREATE OR REPLACE FUNCTION public.calculate_collector_score(
  p_collection_value NUMERIC,
  p_card_count INTEGER,
  p_swaps_completed INTEGER,
  p_gifts_given INTEGER,
  p_battles_won INTEGER,
  p_battles_lost INTEGER,
  p_redemptions INTEGER
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_collection_value_score NUMERIC;
  v_card_count_score NUMERIC;
  v_swaps_score NUMERIC;
  v_gifts_score NUMERIC;
  v_battle_score NUMERIC;
  v_redemption_score NUMERIC;
  v_total_score NUMERIC;
BEGIN
  -- Collection value score: min(25, log10(value + 1) / log10(100000) * 25)
  v_collection_value_score := LEAST(25, 
    CASE WHEN p_collection_value > 0 
      THEN (log(p_collection_value + 1) / log(100000)) * 25 
      ELSE 0 
    END
  );
  
  -- Card count score: min(15, cards / 500 * 15)
  v_card_count_score := LEAST(15, (p_card_count::NUMERIC / 500) * 15);
  
  -- Swaps score: min(15, swaps / 50 * 15)
  v_swaps_score := LEAST(15, (p_swaps_completed::NUMERIC / 50) * 15);
  
  -- Gifts score: min(10, gifts / 25 * 10)
  v_gifts_score := LEAST(10, (p_gifts_given::NUMERIC / 25) * 10);
  
  -- Battle score: (wins / max(wins + losses, 1)) * 20
  v_battle_score := (p_battles_won::NUMERIC / GREATEST(p_battles_won + p_battles_lost, 1)) * 20;
  
  -- Redemption score: min(15, redemptions / 10 * 15)
  v_redemption_score := LEAST(15, (p_redemptions::NUMERIC / 10) * 15);
  
  -- Total score
  v_total_score := v_collection_value_score + v_card_count_score + v_swaps_score + 
                   v_gifts_score + v_battle_score + v_redemption_score;
  
  -- Clamp to 1-100 range (minimum 1 for any user)
  RETURN GREATEST(1, LEAST(100, ROUND(v_total_score)));
END;
$$;-- Backfill collector profiles for existing users who don't have one
INSERT INTO public.collector_profiles (user_id, username, display_name)
SELECT 
  u.id,
  LOWER(REGEXP_REPLACE(COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)), '[^a-zA-Z0-9]', '', 'g')) || '_' || FLOOR(RANDOM() * 9000 + 1000)::TEXT,
  COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1))
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.collector_profiles cp WHERE cp.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;-- Allow public (unauthenticated) users to browse collectors.
-- When unauthenticated, connection_status will be null and we won't exclude auth.uid() from results.

CREATE OR REPLACE FUNCTION public.get_collectors_list(
  p_filter text DEFAULT 'all',
  p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH collector_data AS (
    SELECT 
      cp.user_id,
      cp.username,
      cp.display_name,
      cp.avatar_url,
      -- Get card count
      (SELECT COUNT(*)::INTEGER FROM reveals r WHERE r.user_id = cp.user_id AND r.revealed_at IS NOT NULL) as card_count,
      -- Get collection value
      (SELECT COALESCE(SUM(pc.retail_value_usd), 0) 
       FROM reveals r 
       JOIN product_classes pc ON pc.id = r.product_class_id 
       WHERE r.user_id = cp.user_id AND r.revealed_at IS NOT NULL) as collection_value,
      -- Get swaps
      (SELECT COUNT(*)::INTEGER FROM card_transfers 
       WHERE (from_user_id = cp.user_id OR to_user_id = cp.user_id) 
       AND transfer_type = 'SWAP' AND status = 'CLAIMED') as swaps_completed,
      -- Get gifts
      (SELECT COUNT(*)::INTEGER FROM card_transfers 
       WHERE from_user_id = cp.user_id AND transfer_type = 'GIFT' AND status = 'CLAIMED') as gifts_given,
      -- Get battles
      COALESCE((SELECT wins FROM leaderboard_stats WHERE user_id = cp.user_id AND season_id = 'S1'), 0) as battles_won,
      COALESCE((SELECT losses FROM leaderboard_stats WHERE user_id = cp.user_id AND season_id = 'S1'), 0) as battles_lost,
      -- Get redemptions
      (SELECT COUNT(*)::INTEGER FROM awards WHERE user_id = cp.user_id AND status = 'FULFILLED') as redemptions,
      -- Connection status (null when unauthenticated)
      (SELECT cc.status FROM collector_connections cc 
       WHERE auth.uid() IS NOT NULL
         AND cc.follower_id = auth.uid()
         AND cc.following_id = cp.user_id) as connection_status
    FROM collector_profiles cp
    WHERE cp.is_public = true
      AND (auth.uid() IS NULL OR cp.user_id != auth.uid())
      AND (
        p_filter = 'all'
        OR (
          auth.uid() IS NOT NULL
          AND (
            (p_filter = 'following' AND EXISTS (
              SELECT 1 FROM collector_connections 
              WHERE follower_id = auth.uid() AND following_id = cp.user_id
            ))
            OR (p_filter = 'followers' AND EXISTS (
              SELECT 1 FROM collector_connections 
              WHERE follower_id = cp.user_id AND following_id = auth.uid()
            ))
            OR (p_filter = 'mutual' AND EXISTS (
              SELECT 1 FROM collector_connections 
              WHERE follower_id = auth.uid() AND following_id = cp.user_id AND status = 'MUTUAL'
            ))
          )
        )
      )
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', cd.user_id,
      'username', cd.username,
      'display_name', cd.display_name,
      'avatar_url', cd.avatar_url,
      'card_count', cd.card_count,
      'score', calculate_collector_score(
        cd.collection_value,
        cd.card_count,
        cd.swaps_completed,
        cd.gifts_given,
        cd.battles_won,
        cd.battles_lost,
        cd.redemptions
      ),
      'connection_status', cd.connection_status
    )
    ORDER BY calculate_collector_score(
      cd.collection_value,
      cd.card_count,
      cd.swaps_completed,
      cd.gifts_given,
      cd.battles_won,
      cd.battles_lost,
      cd.redemptions
    ) DESC
  )
  INTO v_result
  FROM collector_data cd
  LIMIT p_limit;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;-- Fix get_collector_profile() numeric casting for ROUND(..., scale)
-- Postgres supports ROUND(numeric, int) but not ROUND(double precision, int).

CREATE OR REPLACE FUNCTION public.get_collector_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile RECORD;
  v_card_count INTEGER;
  v_collection_value NUMERIC;
  v_swaps_completed INTEGER;
  v_gifts_given INTEGER;
  v_battles_won INTEGER;
  v_battles_lost INTEGER;
  v_redemptions INTEGER;
  v_follower_count INTEGER;
  v_following_count INTEGER;
  v_is_following BOOLEAN;
  v_score INTEGER;
  v_score_breakdown JSONB;
BEGIN
  -- Get profile
  SELECT * INTO v_profile
  FROM collector_profiles
  WHERE user_id = p_user_id;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  
  -- Check privacy (only owner can view private profiles)
  IF NOT v_profile.is_public AND auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('error', 'Profile is private');
  END IF;
  
  -- Get card count and collection value
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(SUM(pc.retail_value_usd), 0)
  INTO v_card_count, v_collection_value
  FROM reveals r
  JOIN product_classes pc ON pc.id = r.product_class_id
  WHERE r.user_id = p_user_id AND r.revealed_at IS NOT NULL;
  
  -- Get swaps completed (as sender or receiver)
  SELECT COUNT(*)::INTEGER INTO v_swaps_completed
  FROM card_transfers
  WHERE (from_user_id = p_user_id OR to_user_id = p_user_id)
    AND transfer_type = 'SWAP'
    AND status = 'CLAIMED';
  
  -- Get gifts given
  SELECT COUNT(*)::INTEGER INTO v_gifts_given
  FROM card_transfers
  WHERE from_user_id = p_user_id
    AND transfer_type = 'GIFT'
    AND status = 'CLAIMED';
  
  -- Get battle stats
  SELECT 
    COALESCE(wins, 0),
    COALESCE(losses, 0)
  INTO v_battles_won, v_battles_lost
  FROM leaderboard_stats
  WHERE user_id = p_user_id AND season_id = 'S1';
  
  IF v_battles_won IS NULL THEN
    v_battles_won := 0;
    v_battles_lost := 0;
  END IF;
  
  -- Get redemptions
  SELECT COUNT(*)::INTEGER INTO v_redemptions
  FROM awards
  WHERE user_id = p_user_id AND status = 'FULFILLED';
  
  -- Get follower/following counts
  SELECT COUNT(*)::INTEGER INTO v_follower_count
  FROM collector_connections
  WHERE following_id = p_user_id;
  
  SELECT COUNT(*)::INTEGER INTO v_following_count
  FROM collector_connections
  WHERE follower_id = p_user_id;
  
  -- Check if current user is following this profile
  v_is_following := EXISTS (
    SELECT 1 FROM collector_connections
    WHERE follower_id = auth.uid() AND following_id = p_user_id
  );
  
  -- Calculate score using helper function
  v_score := calculate_collector_score(
    v_collection_value,
    v_card_count,
    v_swaps_completed,
    v_gifts_given,
    v_battles_won,
    v_battles_lost,
    v_redemptions
  );

  -- Ensure ROUND(..., 1) receives numeric (not double precision)
  v_score_breakdown := jsonb_build_object(
    'collection_value_score', ROUND(
      LEAST(
        25::numeric,
        (
          CASE WHEN v_collection_value > 0 
            THEN ((log((v_collection_value + 1)::double precision) / log(100000::double precision)) * 25)::numeric
            ELSE 0::numeric
          END
        )
      ),
      1
    ),
    'card_count_score', ROUND(LEAST(15::numeric, (v_card_count::NUMERIC / 500) * 15), 1),
    'swaps_score', ROUND(LEAST(15::numeric, (v_swaps_completed::NUMERIC / 50) * 15), 1),
    'gifts_score', ROUND(LEAST(10::numeric, (v_gifts_given::NUMERIC / 25) * 10), 1),
    'battle_score', ROUND((v_battles_won::NUMERIC / GREATEST(v_battles_won + v_battles_lost, 1)) * 20, 1),
    'redemption_score', ROUND(LEAST(15::numeric, (v_redemptions::NUMERIC / 10) * 15), 1)
  );
  
  RETURN jsonb_build_object(
    'user_id', v_profile.user_id,
    'username', v_profile.username,
    'display_name', v_profile.display_name,
    'avatar_url', v_profile.avatar_url,
    'bio', v_profile.bio,
    'is_public', v_profile.is_public,
    'created_at', v_profile.created_at,
    'follower_count', v_follower_count,
    'following_count', v_following_count,
    'is_following', v_is_following,
    'is_own_profile', auth.uid() = p_user_id,
    'score', v_score,
    'stats', jsonb_build_object(
      'card_count', v_card_count,
      'collection_value', v_collection_value,
      'swaps_completed', v_swaps_completed,
      'gifts_given', v_gifts_given,
      'battles_won', v_battles_won,
      'battles_lost', v_battles_lost,
      'redemptions', v_redemptions
    ),
    'score_breakdown', v_score_breakdown
  );
END;
$function$;-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'gift_received', 'swap_offer', 'swap_completed', 'gift_claimed'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can read their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify on gift transfer creation
CREATE OR REPLACE FUNCTION public.notify_on_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name TEXT;
  v_product_name TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Only create notification if there's a recipient
  IF NEW.to_user_id IS NOT NULL THEN
    -- Get sender's display name
    SELECT COALESCE(display_name, username) INTO v_sender_name
    FROM collector_profiles
    WHERE user_id = NEW.from_user_id;
    
    -- Get product name from the reveal
    SELECT pc.name INTO v_product_name
    FROM reveals r
    JOIN product_classes pc ON pc.id = r.product_class_id
    WHERE r.id = NEW.reveal_id;
    
    IF NEW.transfer_type = 'GIFT' THEN
      v_notification_title := 'You received a gift!';
      v_notification_message := COALESCE(v_sender_name, 'A collector') || ' sent you a ' || COALESCE(v_product_name, 'mystery card') || '.';
    ELSIF NEW.transfer_type = 'SWAP' THEN
      v_notification_title := 'New swap offer';
      v_notification_message := COALESCE(v_sender_name, 'A collector') || ' wants to swap their ' || COALESCE(v_product_name, 'card') || ' with you.';
    END IF;
    
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.to_user_id,
      CASE WHEN NEW.transfer_type = 'GIFT' THEN 'gift_received' ELSE 'swap_offer' END,
      v_notification_title,
      v_notification_message,
      jsonb_build_object(
        'transfer_id', NEW.id,
        'from_user_id', NEW.from_user_id,
        'claim_token', NEW.claim_token,
        'product_name', v_product_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on card_transfers
CREATE TRIGGER on_transfer_created
  AFTER INSERT ON public.card_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_transfer();

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE notifications
  SET read = true
  WHERE id = p_notification_id AND user_id = auth.uid();
$$;

-- Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE notifications
  SET read = true
  WHERE user_id = auth.uid() AND read = false;
$$;-- Public RPC to fetch transfer details by claim token (for claim page pre-login)
CREATE OR REPLACE FUNCTION public.get_transfer_details_by_claim_token(p_claim_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_transfer RECORD;
BEGIN
  SELECT
    ct.id,
    ct.reveal_id,
    ct.from_user_id,
    ct.transfer_type,
    ct.status,
    ct.expires_at,
    r.id AS card_id,
    r.band,
    r.serial_number,
    pc.name,
    pc.brand,
    pc.image_url,
    pc.retail_value_usd
  INTO v_transfer
  FROM public.card_transfers ct
  JOIN public.reveals r ON r.id = ct.reveal_id
  JOIN public.product_classes pc ON pc.id = r.product_class_id
  WHERE ct.claim_token = p_claim_token
  LIMIT 1;

  IF v_transfer.id IS NULL THEN
    RETURN jsonb_build_object('error', 'This claim link is invalid or has expired');
  END IF;

  -- Basic validity checks
  IF v_transfer.status = 'CLAIMED' THEN
    RETURN jsonb_build_object('error', 'This card has already been claimed');
  END IF;

  IF v_transfer.status = 'CANCELLED' THEN
    RETURN jsonb_build_object('error', 'This transfer has been cancelled');
  END IF;

  IF v_transfer.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'This claim link has expired');
  END IF;

  RETURN jsonb_build_object(
    'transfer', jsonb_build_object(
      'id', v_transfer.id,
      'reveal_id', v_transfer.reveal_id,
      'from_user_id', v_transfer.from_user_id,
      'transfer_type', lower(v_transfer.transfer_type),
      'status', v_transfer.status,
      'expires_at', v_transfer.expires_at,
      'card', jsonb_build_object(
        'id', v_transfer.card_id,
        'product_name', v_transfer.name,
        'product_brand', v_transfer.brand,
        'product_image', v_transfer.image_url,
        'band', v_transfer.band,
        'serial_number', v_transfer.serial_number,
        'retail_value_usd', v_transfer.retail_value_usd
      )
    )
  );
END;
$$;-- Add admin-only RLS policies for internal/financial tables flagged by linter

-- inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can read inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Only admins can modify inventory" ON public.inventory_items;
CREATE POLICY "Only admins can read inventory"
ON public.inventory_items
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can modify inventory"
ON public.inventory_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- pool_ledger
ALTER TABLE public.pool_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can read pool ledger" ON public.pool_ledger;
DROP POLICY IF EXISTS "Only admins can modify pool ledger" ON public.pool_ledger;
CREATE POLICY "Only admins can read pool ledger"
ON public.pool_ledger
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can modify pool ledger"
ON public.pool_ledger
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- promo_spend_daily
ALTER TABLE public.promo_spend_daily ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can read promo spend" ON public.promo_spend_daily;
DROP POLICY IF EXISTS "Only admins can modify promo spend" ON public.promo_spend_daily;
CREATE POLICY "Only admins can read promo spend"
ON public.promo_spend_daily
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can modify promo spend"
ON public.promo_spend_daily
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can read webhook events" ON public.webhook_events;
DROP POLICY IF EXISTS "Only admins can modify webhook events" ON public.webhook_events;
CREATE POLICY "Only admins can read webhook events"
ON public.webhook_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can modify webhook events"
ON public.webhook_events
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));-- Drop the old 2-parameter versions that cause function overload ambiguity
-- This leaves only the 3-parameter versions with p_to_user_id uuid DEFAULT NULL

-- Drop old create_swap_offer(uuid, text) - the one WITHOUT default
DROP FUNCTION IF EXISTS public.create_swap_offer(uuid, text);

-- Drop old create_gift_transfer(uuid, text) - the one WITHOUT default  
DROP FUNCTION IF EXISTS public.create_gift_transfer(uuid, text);-- Allow authenticated users to view public marketplace listings
-- (transfers where to_user_id IS NULL, meaning they're available for anyone)
CREATE POLICY "Anyone can view public marketplace listings"
ON public.card_transfers
FOR SELECT
TO authenticated
USING (
  to_user_id IS NULL 
  AND status = 'PENDING'
  AND transfer_type = 'SWAP'
);-- Allow viewing reveals that are part of public marketplace listings
CREATE POLICY "Users can view reveals in public marketplace"
ON public.reveals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.card_transfers ct
    WHERE ct.reveal_id = reveals.id
      AND ct.status = 'PENDING'
      AND ct.transfer_type = 'SWAP'
      AND ct.to_user_id IS NULL
  )
);-- Phase 1: Rooms Feature Database Schema

-- 1.1 Extend reveals table with Product Card mechanics
ALTER TABLE reveals ADD COLUMN IF NOT EXISTS redeem_credits_cents bigint NOT NULL DEFAULT 0;
ALTER TABLE reveals ADD COLUMN IF NOT EXISTS priority_points int NOT NULL DEFAULT 0;
ALTER TABLE reveals ADD COLUMN IF NOT EXISTS staked_room_id uuid NULL;
ALTER TABLE reveals ADD COLUMN IF NOT EXISTS staked_at timestamptz NULL;
ALTER TABLE reveals ADD COLUMN IF NOT EXISTS redeemed_at timestamptz NULL;
ALTER TABLE reveals ADD COLUMN IF NOT EXISTS card_state text NOT NULL DEFAULT 'owned';
-- card_state values: 'owned' | 'staked' | 'won' | 'redeemed'

-- 1.2 Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL,  -- 'SILVER' | 'GOLD' | 'PLATINUM'
  tier_cap_cents bigint NOT NULL,  -- e.g., 500000 = $5,000
  category text NULL,  -- optional category filter (WATCHES, HANDBAGS, etc.)
  status text NOT NULL DEFAULT 'OPEN',  -- OPEN | LOCKED | FUNDED | CLOSED | SETTLED
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  min_participants int NOT NULL DEFAULT 10,
  max_participants int NOT NULL DEFAULT 100,
  escrow_target_cents bigint NOT NULL,  -- tier_cap + 8% buffer
  escrow_balance_cents bigint NOT NULL DEFAULT 0,
  winner_entry_id uuid NULL,
  winner_user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.3 Create room_entries table
CREATE TABLE IF NOT EXISTS room_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reveal_id uuid NOT NULL REFERENCES reveals(id),
  stake_snapshot jsonb NOT NULL,  -- {rc_cents, pp, rs, product_value_cents}
  priority_score numeric NULL,
  rank int NULL,
  status text NOT NULL DEFAULT 'STAKED',  -- STAKED | LOST | WON
  staked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, reveal_id)  -- A card can only be staked once per room
);

-- 1.4 Create tier_escrow_pools table
CREATE TABLE IF NOT EXISTS tier_escrow_pools (
  tier text PRIMARY KEY,
  tier_cap_cents bigint NOT NULL,
  balance_cents bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial tiers
INSERT INTO tier_escrow_pools (tier, tier_cap_cents) VALUES
  ('SILVER', 100000),    -- $1,000
  ('GOLD', 500000),      -- $5,000
  ('PLATINUM', 1500000)  -- $15,000
ON CONFLICT (tier) DO NOTHING;

-- 1.5 Create escrow_ledger table (audit trail)
CREATE TABLE IF NOT EXISTS escrow_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,  -- 'tier_pool' | 'room_escrow'
  tier text NULL,
  room_id uuid NULL REFERENCES rooms(id),
  delta_cents bigint NOT NULL,
  reason text NOT NULL,  -- pack_allocation, room_funding, redemption_purchase
  ref_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_escrow_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms (public read, admin write)
CREATE POLICY "Anyone can view rooms"
  ON rooms FOR SELECT
  USING (true);

-- RLS Policies for room_entries
CREATE POLICY "Users can view room entries"
  ON room_entries FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own entries"
  ON room_entries FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for tier_escrow_pools (public read)
CREATE POLICY "Anyone can view tier escrow pools"
  ON tier_escrow_pools FOR SELECT
  USING (true);

-- RLS Policies for escrow_ledger (admin only)
CREATE POLICY "Only admins can view escrow ledger"
  ON escrow_ledger FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add foreign key constraint for reveals.staked_room_id
ALTER TABLE reveals ADD CONSTRAINT reveals_staked_room_id_fkey 
  FOREIGN KEY (staked_room_id) REFERENCES rooms(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_tier ON rooms(tier);
CREATE INDEX IF NOT EXISTS idx_rooms_end_at ON rooms(end_at);
CREATE INDEX IF NOT EXISTS idx_room_entries_room_id ON room_entries(room_id);
CREATE INDEX IF NOT EXISTS idx_room_entries_user_id ON room_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_room_entries_reveal_id ON room_entries(reveal_id);
CREATE INDEX IF NOT EXISTS idx_reveals_card_state ON reveals(card_state);
CREATE INDEX IF NOT EXISTS idx_reveals_staked_room_id ON reveals(staked_room_id);-- Drop old battle function that conflicts
DROP FUNCTION IF EXISTS public.cancel_queued_battle(uuid);

-- Phase 2: Rooms RPC Functions

-- 2.1 join_room: Stake a card into a room
CREATE OR REPLACE FUNCTION public.join_room(p_room_id uuid, p_reveal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_reveal RECORD;
  v_room RECORD;
  v_product RECORD;
  v_entry_count INT;
  v_entry_id UUID;
  v_stake_snapshot JSONB;
BEGIN
  -- Get room with lock
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_room.status != 'OPEN' THEN
    RAISE EXCEPTION 'Room is not open for entries (status: %)', v_room.status;
  END IF;

  -- Check capacity
  SELECT COUNT(*) INTO v_entry_count
  FROM room_entries
  WHERE room_id = p_room_id;

  IF v_entry_count >= v_room.max_participants THEN
    RAISE EXCEPTION 'Room is at maximum capacity';
  END IF;

  -- Get reveal with lock
  SELECT * INTO v_reveal
  FROM reveals
  WHERE id = p_reveal_id
  FOR UPDATE;

  IF v_reveal IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;

  IF v_reveal.user_id != v_user_id THEN
    RAISE EXCEPTION 'You do not own this card';
  END IF;

  IF v_reveal.card_state != 'owned' THEN
    RAISE EXCEPTION 'Card is not available for staking (state: %)', v_reveal.card_state;
  END IF;

  IF v_reveal.revealed_at IS NULL THEN
    RAISE EXCEPTION 'Card must be revealed before staking';
  END IF;

  -- Get product to check value
  SELECT * INTO v_product
  FROM product_classes
  WHERE id = v_reveal.product_class_id;

  IF v_product IS NULL THEN
    RAISE EXCEPTION 'Product not found for this card';
  END IF;

  -- Convert product value to cents for comparison
  IF (v_product.retail_value_usd * 100) > v_room.tier_cap_cents THEN
    RAISE EXCEPTION 'Card value ($%) exceeds room tier cap ($%)', 
      v_product.retail_value_usd, 
      v_room.tier_cap_cents / 100;
  END IF;

  -- Check category filter if room has one
  IF v_room.category IS NOT NULL AND v_room.category != v_product.category::text THEN
    RAISE EXCEPTION 'Card category (%) does not match room category (%)', 
      v_product.category, 
      v_room.category;
  END IF;

  -- Build stake snapshot
  v_stake_snapshot := jsonb_build_object(
    'rc_cents', v_reveal.redeem_credits_cents,
    'pp', v_reveal.priority_points,
    'rs', CASE v_reveal.band
      WHEN 'ICON' THEN 40
      WHEN 'RARE' THEN 60
      WHEN 'GRAIL' THEN 80
      WHEN 'MYTHIC' THEN 100
      ELSE 40
    END,
    'product_value_cents', (v_product.retail_value_usd * 100)::bigint,
    'product_name', v_product.name,
    'band', v_reveal.band
  );

  -- Update reveal state
  UPDATE reveals
  SET card_state = 'staked',
      staked_room_id = p_room_id,
      staked_at = now()
  WHERE id = p_reveal_id;

  -- Insert room entry
  INSERT INTO room_entries (room_id, user_id, reveal_id, stake_snapshot)
  VALUES (p_room_id, v_user_id, p_reveal_id, v_stake_snapshot)
  RETURNING id INTO v_entry_id;

  -- Return updated room and entry info
  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'room', jsonb_build_object(
      'id', v_room.id,
      'tier', v_room.tier,
      'status', v_room.status,
      'participants', v_entry_count + 1,
      'max_participants', v_room.max_participants,
      'escrow_balance_cents', v_room.escrow_balance_cents,
      'escrow_target_cents', v_room.escrow_target_cents
    ),
    'stake_snapshot', v_stake_snapshot
  );
END;
$$;

-- 2.2 leave_room: Unstake a card from a room (before lock time)
CREATE OR REPLACE FUNCTION public.leave_room(p_room_id uuid, p_reveal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_reveal RECORD;
  v_room RECORD;
  v_entry RECORD;
  v_lock_threshold TIMESTAMPTZ;
BEGIN
  -- Get room
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id;

  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_room.status NOT IN ('OPEN', 'LOCKED') THEN
    RAISE EXCEPTION 'Cannot leave room in status: %', v_room.status;
  END IF;

  -- Calculate lock threshold (50% of room duration)
  v_lock_threshold := v_room.start_at + ((v_room.end_at - v_room.start_at) / 2);

  IF now() > v_lock_threshold THEN
    RAISE EXCEPTION 'Cannot leave room after lock time (past 50%% of room duration)';
  END IF;

  -- Get entry
  SELECT * INTO v_entry
  FROM room_entries
  WHERE room_id = p_room_id AND reveal_id = p_reveal_id;

  IF v_entry IS NULL THEN
    RAISE EXCEPTION 'Entry not found';
  END IF;

  IF v_entry.user_id != v_user_id THEN
    RAISE EXCEPTION 'You do not own this entry';
  END IF;

  -- Get reveal with lock
  SELECT * INTO v_reveal
  FROM reveals
  WHERE id = p_reveal_id
  FOR UPDATE;

  IF v_reveal IS NULL OR v_reveal.staked_room_id != p_room_id THEN
    RAISE EXCEPTION 'Card is not staked in this room';
  END IF;

  -- Restore reveal state
  UPDATE reveals
  SET card_state = 'owned',
      staked_room_id = NULL,
      staked_at = NULL
  WHERE id = p_reveal_id;

  -- Delete entry
  DELETE FROM room_entries
  WHERE room_id = p_room_id AND reveal_id = p_reveal_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully left room',
    'reveal_id', p_reveal_id
  );
END;
$$;

-- 2.3 settle_room: Compute winners and finalize room (called by cron)
CREATE OR REPLACE FUNCTION public.settle_room(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_room RECORD;
  v_entry RECORD;
  v_winner_entry RECORD;
  v_max_pp INT := 1;
  v_max_rs INT := 1;
  v_rc_pct NUMERIC;
  v_pp_norm NUMERIC;
  v_rs_norm NUMERIC;
  v_priority_score NUMERIC;
  v_is_funded BOOLEAN;
  v_entries_updated INT := 0;
BEGIN
  -- Get room with lock
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_room.status = 'SETTLED' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Room already settled');
  END IF;

  IF v_room.status NOT IN ('OPEN', 'LOCKED', 'FUNDED', 'CLOSED') THEN
    RAISE EXCEPTION 'Room cannot be settled in status: %', v_room.status;
  END IF;

  -- Check if room time has ended
  IF now() < v_room.end_at THEN
    RAISE EXCEPTION 'Room has not ended yet';
  END IF;

  -- Get max PP and RS for normalization
  SELECT 
    GREATEST(MAX((stake_snapshot->>'pp')::INT), 1),
    GREATEST(MAX((stake_snapshot->>'rs')::INT), 1)
  INTO v_max_pp, v_max_rs
  FROM room_entries
  WHERE room_id = p_room_id;

  -- Compute priority scores for all entries
  FOR v_entry IN 
    SELECT * FROM room_entries 
    WHERE room_id = p_room_id
    FOR UPDATE
  LOOP
    -- RC% = min(100, rc_cents / product_value_cents * 100)
    v_rc_pct := LEAST(100, 
      ((v_entry.stake_snapshot->>'rc_cents')::NUMERIC / 
       GREATEST((v_entry.stake_snapshot->>'product_value_cents')::NUMERIC, 1)) * 100
    );
    
    -- PP_norm = PP / maxPP * 100
    v_pp_norm := ((v_entry.stake_snapshot->>'pp')::NUMERIC / v_max_pp) * 100;
    
    -- RS_norm = RS / maxRS * 100
    v_rs_norm := ((v_entry.stake_snapshot->>'rs')::NUMERIC / v_max_rs) * 100;
    
    -- Score = 0.55 * RC_pct + 0.35 * PP_norm + 0.10 * RS_norm
    v_priority_score := (0.55 * v_rc_pct) + (0.35 * v_pp_norm) + (0.10 * v_rs_norm);
    
    -- Update entry with score
    UPDATE room_entries
    SET priority_score = ROUND(v_priority_score, 4)
    WHERE id = v_entry.id;
    
    v_entries_updated := v_entries_updated + 1;
  END LOOP;

  -- Assign ranks (higher score = lower rank number = better)
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY priority_score DESC, staked_at ASC) as rank_num
    FROM room_entries
    WHERE room_id = p_room_id
  )
  UPDATE room_entries re
  SET rank = ranked.rank_num
  FROM ranked
  WHERE re.id = ranked.id;

  -- Check if funded
  v_is_funded := v_room.escrow_balance_cents >= v_room.escrow_target_cents;

  -- Get winner (rank 1)
  SELECT * INTO v_winner_entry
  FROM room_entries
  WHERE room_id = p_room_id AND rank = 1;

  IF v_winner_entry IS NOT NULL THEN
    -- Mark winner
    UPDATE room_entries
    SET status = 'WON'
    WHERE id = v_winner_entry.id;

    -- Update winner's reveal state
    UPDATE reveals
    SET card_state = CASE WHEN v_is_funded THEN 'won' ELSE 'owned' END
    WHERE id = v_winner_entry.reveal_id;

    -- Update room with winner
    UPDATE rooms
    SET winner_entry_id = v_winner_entry.id,
        winner_user_id = v_winner_entry.user_id,
        status = 'SETTLED'
    WHERE id = p_room_id;

    -- Mark losers and apply PP decay
    UPDATE room_entries
    SET status = 'LOST'
    WHERE room_id = p_room_id AND id != v_winner_entry.id;

    -- Apply 20% PP decay to losers' cards
    UPDATE reveals r
    SET priority_points = FLOOR(priority_points * 0.80),
        card_state = 'owned',
        staked_room_id = NULL,
        staked_at = NULL
    FROM room_entries re
    WHERE re.reveal_id = r.id
      AND re.room_id = p_room_id
      AND re.id != v_winner_entry.id;
  ELSE
    -- No entries, just close the room
    UPDATE rooms
    SET status = 'SETTLED'
    WHERE id = p_room_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'room_id', p_room_id,
    'is_funded', v_is_funded,
    'entries_processed', v_entries_updated,
    'winner_entry_id', v_winner_entry.id,
    'winner_user_id', v_winner_entry.user_id,
    'winner_score', v_winner_entry.priority_score
  );
END;
$$;

-- 2.4 claim_redemption: Winner claims their prize
CREATE OR REPLACE FUNCTION public.claim_redemption(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_room RECORD;
  v_entry RECORD;
  v_reveal RECORD;
  v_product RECORD;
  v_product_value_cents BIGINT;
  v_pay_cents BIGINT;
  v_award_id UUID;
BEGIN
  -- Get room
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id;

  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_room.status != 'SETTLED' THEN
    RAISE EXCEPTION 'Room is not settled yet';
  END IF;

  IF v_room.winner_user_id != v_user_id THEN
    RAISE EXCEPTION 'You are not the winner of this room';
  END IF;

  -- Get winner entry
  SELECT * INTO v_entry
  FROM room_entries
  WHERE id = v_room.winner_entry_id;

  IF v_entry IS NULL OR v_entry.status != 'WON' THEN
    RAISE EXCEPTION 'Winner entry not found';
  END IF;

  -- Get reveal
  SELECT * INTO v_reveal
  FROM reveals
  WHERE id = v_entry.reveal_id
  FOR UPDATE;

  IF v_reveal IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;

  IF v_reveal.redeemed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Already redeemed';
  END IF;

  -- Get product
  SELECT * INTO v_product
  FROM product_classes
  WHERE id = v_reveal.product_class_id;

  v_product_value_cents := (v_product.retail_value_usd * 100)::BIGINT;

  -- Calculate payment needed
  v_pay_cents := GREATEST(0, v_product_value_cents - v_reveal.redeem_credits_cents);

  IF v_pay_cents > 0 THEN
    -- Return Stripe checkout info (actual Stripe session created by edge function)
    RETURN jsonb_build_object(
      'success', true,
      'requires_payment', true,
      'pay_cents', v_pay_cents,
      'product_value_cents', v_product_value_cents,
      'redeem_credits_cents', v_reveal.redeem_credits_cents,
      'product', jsonb_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'brand', v_product.brand,
        'model', v_product.model,
        'image_url', v_product.image_url
      ),
      'room_id', p_room_id,
      'reveal_id', v_reveal.id
    );
  END IF;

  -- Free redemption: create award immediately
  INSERT INTO awards (user_id, product_class_id, bucket, reserved_cost_usd, status, reveal_id)
  VALUES (
    v_user_id, 
    v_reveal.product_class_id, 
    'room_redemption', 
    v_product.expected_fulfillment_cost_usd,
    'RESERVED',
    v_reveal.id
  )
  RETURNING id INTO v_award_id;

  -- Mark reveal as redeemed
  UPDATE reveals
  SET redeemed_at = now(),
      card_state = 'redeemed',
      is_award = true,
      award_id = v_award_id
  WHERE id = v_reveal.id;

  -- Deduct from room escrow
  UPDATE rooms
  SET escrow_balance_cents = escrow_balance_cents - (v_product.expected_fulfillment_cost_usd * 100)::BIGINT
  WHERE id = p_room_id;

  -- Log to escrow ledger
  INSERT INTO escrow_ledger (scope, room_id, delta_cents, reason, ref_id)
  VALUES ('room_escrow', p_room_id, -(v_product.expected_fulfillment_cost_usd * 100)::BIGINT, 'redemption_purchase', v_award_id::TEXT);

  RETURN jsonb_build_object(
    'success', true,
    'requires_payment', false,
    'redeemed', true,
    'award_id', v_award_id,
    'product', jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'brand', v_product.brand,
      'model', v_product.model,
      'image_url', v_product.image_url
    )
  );
END;
$$;

-- 2.5 Helper: get_room_leaderboard
CREATE OR REPLACE FUNCTION public.get_room_leaderboard(p_room_id uuid, p_limit int DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_room RECORD;
  v_leaderboard JSONB;
BEGIN
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  SELECT jsonb_agg(entry_data ORDER BY rank_num ASC) INTO v_leaderboard
  FROM (
    SELECT 
      jsonb_build_object(
        'rank', COALESCE(re.rank, ROW_NUMBER() OVER (ORDER BY re.priority_score DESC NULLS LAST, re.staked_at ASC)),
        'entry_id', re.id,
        'user_id', re.user_id,
        'reveal_id', re.reveal_id,
        'priority_score', COALESCE(re.priority_score, 0),
        'status', re.status,
        'stake_snapshot', re.stake_snapshot,
        'username', cp.username,
        'display_name', cp.display_name,
        'avatar_url', cp.avatar_url
      ) as entry_data,
      COALESCE(re.rank, ROW_NUMBER() OVER (ORDER BY re.priority_score DESC NULLS LAST, re.staked_at ASC)) as rank_num
    FROM room_entries re
    LEFT JOIN collector_profiles cp ON cp.user_id = re.user_id
    WHERE re.room_id = p_room_id
    LIMIT p_limit
  ) sub;

  RETURN jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id,
      'tier', v_room.tier,
      'status', v_room.status,
      'category', v_room.category,
      'start_at', v_room.start_at,
      'end_at', v_room.end_at,
      'escrow_balance_cents', v_room.escrow_balance_cents,
      'escrow_target_cents', v_room.escrow_target_cents,
      'winner_user_id', v_room.winner_user_id
    ),
    'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb)
  );
END;
$$;

-- 2.6 Helper: get_my_eligible_cards (cards user can stake in a room)
CREATE OR REPLACE FUNCTION public.get_my_eligible_cards(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_room RECORD;
  v_cards JSONB;
BEGIN
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  SELECT jsonb_agg(card_data) INTO v_cards
  FROM (
    SELECT jsonb_build_object(
      'reveal_id', r.id,
      'product_class_id', r.product_class_id,
      'band', r.band,
      'serial_number', r.serial_number,
      'redeem_credits_cents', r.redeem_credits_cents,
      'priority_points', r.priority_points,
      'card_state', r.card_state,
      'product', jsonb_build_object(
        'id', pc.id,
        'name', pc.name,
        'brand', pc.brand,
        'model', pc.model,
        'category', pc.category,
        'retail_value_usd', pc.retail_value_usd,
        'image_url', pc.image_url
      ),
      'preview_score', ROUND(
        (0.55 * LEAST(100, (r.redeem_credits_cents::NUMERIC / GREATEST(pc.retail_value_usd * 100, 1)) * 100)) +
        (0.35 * (r.priority_points::NUMERIC / GREATEST(100, 1)) * 100) +
        (0.10 * CASE r.band WHEN 'ICON' THEN 40 WHEN 'RARE' THEN 60 WHEN 'GRAIL' THEN 80 WHEN 'MYTHIC' THEN 100 ELSE 40 END)
      , 2)
    ) as card_data
    FROM reveals r
    JOIN product_classes pc ON pc.id = r.product_class_id
    WHERE r.user_id = v_user_id
      AND r.card_state = 'owned'
      AND r.revealed_at IS NOT NULL
      AND (pc.retail_value_usd * 100) <= v_room.tier_cap_cents
      AND (v_room.category IS NULL OR pc.category::text = v_room.category)
    ORDER BY pc.retail_value_usd DESC
  ) sub;

  RETURN jsonb_build_object(
    'room_id', p_room_id,
    'tier', v_room.tier,
    'tier_cap_cents', v_room.tier_cap_cents,
    'category', v_room.category,
    'cards', COALESCE(v_cards, '[]'::jsonb)
  );
END;
$$;

-- 2.7 Helper: get_active_rooms
CREATE OR REPLACE FUNCTION public.get_active_rooms(p_tier text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rooms JSONB;
BEGIN
  SELECT jsonb_agg(room_data ORDER BY end_at ASC) INTO v_rooms
  FROM (
    SELECT jsonb_build_object(
      'id', r.id,
      'tier', r.tier,
      'tier_cap_cents', r.tier_cap_cents,
      'category', r.category,
      'status', r.status,
      'start_at', r.start_at,
      'end_at', r.end_at,
      'min_participants', r.min_participants,
      'max_participants', r.max_participants,
      'escrow_target_cents', r.escrow_target_cents,
      'escrow_balance_cents', r.escrow_balance_cents,
      'participant_count', (SELECT COUNT(*) FROM room_entries WHERE room_id = r.id),
      'is_funded', r.escrow_balance_cents >= r.escrow_target_cents
    ) as room_data
    FROM rooms r
    WHERE r.status IN ('OPEN', 'LOCKED', 'FUNDED')
      AND (p_tier IS NULL OR r.tier = p_tier)
    ORDER BY r.end_at ASC
  ) sub;

  RETURN jsonb_build_object(
    'rooms', COALESCE(v_rooms, '[]'::jsonb)
  );
END;
$$;-- Phase 4: Data Migration

-- 4.1.1 Convert existing credits_awarded to redeem_credits_cents (1 credit = $0.01 = 1 cent)
UPDATE reveals
SET redeem_credits_cents = credits_awarded
WHERE redeem_credits_cents = 0 AND credits_awarded > 0;

-- 4.1.2 Initialize priority_points based on rarity band
-- ICON: 10 PP, RARE: 25 PP, GRAIL: 50 PP, MYTHIC: 100 PP
UPDATE reveals
SET priority_points = CASE band
  WHEN 'ICON' THEN 10
  WHEN 'RARE' THEN 25
  WHEN 'GRAIL' THEN 50
  WHEN 'MYTHIC' THEN 100
  ELSE 10
END
WHERE priority_points = 0;

-- 4.1.3 Ensure all existing cards have card_state = 'owned'
UPDATE reveals
SET card_state = 'owned'
WHERE card_state IS NULL OR card_state = '';-- Drop and recreate get_active_rooms with correct column references
DROP FUNCTION IF EXISTS public.get_active_rooms(text);

CREATE OR REPLACE FUNCTION public.get_active_rooms(p_tier text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(room_data)
  INTO v_result
  FROM (
    SELECT 
      r.id,
      r.tier,
      r.tier_cap_cents,
      r.category,
      r.status,
      r.start_at,
      r.end_at,
      r.min_participants,
      r.max_participants,
      r.escrow_target_cents,
      r.escrow_balance_cents,
      r.created_at,
      (SELECT COUNT(*) FROM room_entries re WHERE re.room_id = r.id AND re.status = 'STAKED') as participant_count
    FROM rooms r
    WHERE r.status IN ('OPEN', 'LOCKED')
      AND (p_tier IS NULL OR r.tier = p_tier)
    ORDER BY r.end_at ASC
  ) room_data;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;-- Fix rooms table RLS - make it permissive so anyone can view
DROP POLICY IF EXISTS "Anyone can view rooms" ON rooms;

CREATE POLICY "Anyone can view rooms"
ON rooms FOR SELECT
TO authenticated, anon
USING (true);

-- Fix room_entries RLS - make SELECT permissive
DROP POLICY IF EXISTS "Users can view room entries" ON room_entries;
DROP POLICY IF EXISTS "Users can view their own entries" ON room_entries;

CREATE POLICY "Anyone can view room entries"
ON room_entries FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can view their own entries"
ON room_entries FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fix tier_escrow_pools RLS - make it permissive
DROP POLICY IF EXISTS "Anyone can view tier escrow pools" ON tier_escrow_pools;

CREATE POLICY "Anyone can view tier escrow pools"
ON tier_escrow_pools FOR SELECT
TO authenticated, anon
USING (true);

-- Ensure tier_escrow_pools has rows for our new tiers
INSERT INTO tier_escrow_pools (tier, tier_cap_cents, balance_cents)
VALUES 
  ('ICON', 100000, 0),
  ('RARE', 800000, 0),
  ('GRAIL', 5000000, 0),
  ('MYTHIC', 10000000, 0)
ON CONFLICT (tier) DO NOTHING;-- Phase 1: Sealed Rooms & Rewards Schema Updates

-- 1.1 Add columns to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS lock_at timestamptz;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS leaderboard_visibility text DEFAULT 'after_close';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS reward_budget_cents bigint DEFAULT 0;

-- 1.2 Add columns to room_entries table
ALTER TABLE room_entries ADD COLUMN IF NOT EXISTS percentile_band text;
ALTER TABLE room_entries ADD COLUMN IF NOT EXISTS credits_awarded integer DEFAULT 0;
ALTER TABLE room_entries ADD COLUMN IF NOT EXISTS packs_awarded integer DEFAULT 0;
ALTER TABLE room_entries ADD COLUMN IF NOT EXISTS early_stake_bonus numeric DEFAULT 0;

-- 1.3 Create room_rewards table (immutable payouts)
CREATE TABLE IF NOT EXISTS room_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  entry_id uuid NOT NULL REFERENCES room_entries(id) ON DELETE CASCADE,
  percentile_band text NOT NULL,
  final_rank integer NOT NULL,
  credits_awarded integer NOT NULL DEFAULT 0,
  packs_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS on room_rewards
ALTER TABLE room_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own rewards
CREATE POLICY "Users can view their own room rewards"
  ON room_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- 1.4 Create reward_pack_grants table
CREATE TABLE IF NOT EXISTS reward_pack_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_type text NOT NULL DEFAULT 'room_reward',
  source_id uuid,
  status text NOT NULL DEFAULT 'PENDING',
  opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on reward_pack_grants
ALTER TABLE reward_pack_grants ENABLE ROW LEVEL SECURITY;

-- Users can view their own reward packs
CREATE POLICY "Users can view their own reward packs"
  ON reward_pack_grants FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own reward packs (to mark as opened)
CREATE POLICY "Users can update their own reward packs"
  ON reward_pack_grants FOR UPDATE
  USING (auth.uid() = user_id);

-- 1.5 Create reward configuration table
CREATE TABLE IF NOT EXISTS room_reward_config (
  tier text PRIMARY KEY,
  multiplier numeric NOT NULL,
  base_participation_credits integer NOT NULL,
  base_packs integer NOT NULL DEFAULT 0,
  packs_cap integer NOT NULL DEFAULT 0
);

-- Enable RLS on room_reward_config
ALTER TABLE room_reward_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read reward config
CREATE POLICY "Anyone can read reward config"
  ON room_reward_config FOR SELECT
  USING (true);

-- Insert default reward configuration
INSERT INTO room_reward_config (tier, multiplier, base_participation_credits, base_packs, packs_cap) VALUES
  ('ICON', 1.0, 40, 0, 0),
  ('RARE', 1.5, 60, 0, 0),
  ('GRAIL', 2.2, 90, 1, 2),
  ('MYTHIC', 3.5, 140, 1, 2)
ON CONFLICT (tier) DO UPDATE SET
  multiplier = EXCLUDED.multiplier,
  base_participation_credits = EXCLUDED.base_participation_credits,
  base_packs = EXCLUDED.base_packs,
  packs_cap = EXCLUDED.packs_cap;

-- Update existing rooms with default lock_at (1 hour before end_at)
UPDATE rooms 
SET lock_at = end_at - INTERVAL '1 hour'
WHERE lock_at IS NULL AND end_at IS NOT NULL;-- Phase 2: Update RPCs for Sealed Rooms & Rewards

-- 2.1 Update join_room RPC with lock check and early stake bonus
CREATE OR REPLACE FUNCTION public.join_room(p_room_id uuid, p_reveal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_room RECORD;
  v_reveal RECORD;
  v_product RECORD;
  v_entry_id uuid;
  v_rc_cents bigint;
  v_pp integer;
  v_rs numeric;
  v_priority_score numeric;
  v_stake_snapshot jsonb;
  v_participant_count integer;
  v_early_stake_bonus numeric := 0;
  v_room_duration_hours numeric;
  v_time_since_start_hours numeric;
BEGIN
  -- Check authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get room with lock
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check room status
  IF v_room.status != 'OPEN' THEN
    RAISE EXCEPTION 'Room is not open for entries';
  END IF;

  -- Check if room is locked (new check)
  IF v_room.lock_at IS NOT NULL AND now() >= v_room.lock_at THEN
    RAISE EXCEPTION 'Room is locked for new entries';
  END IF;

  -- Check max participants
  SELECT COUNT(*) INTO v_participant_count 
  FROM room_entries WHERE room_id = p_room_id AND status = 'STAKED';
  
  IF v_participant_count >= v_room.max_participants THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- Check user doesn't already have an entry
  IF EXISTS (SELECT 1 FROM room_entries WHERE room_id = p_room_id AND user_id = v_user_id AND status = 'STAKED') THEN
    RAISE EXCEPTION 'Already entered this room';
  END IF;

  -- Get the reveal and verify ownership
  SELECT * INTO v_reveal FROM reveals WHERE id = p_reveal_id AND user_id = v_user_id;
  
  IF v_reveal IS NULL THEN
    RAISE EXCEPTION 'Card not found or not owned';
  END IF;

  -- Check card state
  IF v_reveal.card_state != 'owned' THEN
    RAISE EXCEPTION 'Card is not available for staking';
  END IF;

  -- Get product details
  SELECT * INTO v_product FROM product_classes WHERE id = v_reveal.product_class_id;
  
  IF v_product IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Check tier eligibility (card value must be <= tier cap)
  IF (v_product.retail_value_usd * 100) > v_room.tier_cap_cents THEN
    RAISE EXCEPTION 'Card value exceeds room tier cap';
  END IF;

  -- Calculate RC (redeem credits in cents)
  v_rc_cents := v_reveal.redeem_credits_cents;

  -- Calculate PP (priority points)
  v_pp := v_reveal.priority_points;

  -- Calculate RS (rarity score based on band)
  v_rs := CASE v_reveal.band
    WHEN 'ICON' THEN 25
    WHEN 'RARE' THEN 50
    WHEN 'GRAIL' THEN 75
    WHEN 'MYTHIC' THEN 100
    ELSE 25
  END;

  -- Calculate early stake bonus (up to +3 points for early entry)
  IF v_room.lock_at IS NOT NULL AND v_room.start_at IS NOT NULL THEN
    v_room_duration_hours := EXTRACT(EPOCH FROM (v_room.lock_at - v_room.start_at)) / 3600;
    v_time_since_start_hours := EXTRACT(EPOCH FROM (now() - v_room.start_at)) / 3600;
    
    IF v_room_duration_hours > 0 THEN
      -- Linear bonus: 3 points at start, 0 at lock time
      v_early_stake_bonus := GREATEST(0, 3 * (1 - (v_time_since_start_hours / v_room_duration_hours)));
    END IF;
  END IF;

  -- Calculate priority score using weights: RC 55%, PP 35%, RS 10%
  -- Normalize RC to 0-100 scale based on tier cap
  v_priority_score := (
    (LEAST(v_rc_cents::numeric / v_room.tier_cap_cents, 1) * 100 * 0.55) +
    (LEAST(v_pp::numeric / 1000, 1) * 100 * 0.35) +
    (v_rs * 0.10) +
    v_early_stake_bonus
  );

  -- Build stake snapshot
  v_stake_snapshot := jsonb_build_object(
    'rc_cents', v_rc_cents,
    'pp', v_pp,
    'rs', v_rs,
    'product_value_cents', (v_product.retail_value_usd * 100)::bigint,
    'product_name', v_product.name,
    'band', v_reveal.band
  );

  -- Create room entry
  INSERT INTO room_entries (room_id, user_id, reveal_id, stake_snapshot, priority_score, status, early_stake_bonus)
  VALUES (p_room_id, v_user_id, p_reveal_id, v_stake_snapshot, v_priority_score, 'STAKED', v_early_stake_bonus)
  RETURNING id INTO v_entry_id;

  -- Update card state to staked
  UPDATE reveals 
  SET card_state = 'staked', staked_at = now(), staked_room_id = p_room_id
  WHERE id = p_reveal_id;

  -- Update room escrow balance
  UPDATE rooms 
  SET escrow_balance_cents = escrow_balance_cents + (v_product.retail_value_usd * 100)::bigint
  WHERE id = p_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'room', jsonb_build_object(
      'id', v_room.id,
      'tier', v_room.tier,
      'status', v_room.status,
      'participants', v_participant_count + 1,
      'max_participants', v_room.max_participants,
      'escrow_balance_cents', v_room.escrow_balance_cents + (v_product.retail_value_usd * 100)::bigint,
      'escrow_target_cents', v_room.escrow_target_cents
    ),
    'stake_snapshot', v_stake_snapshot,
    'priority_score', v_priority_score,
    'early_stake_bonus', v_early_stake_bonus
  );
END;
$function$;

-- 2.2 Update leave_room RPC with lock check
CREATE OR REPLACE FUNCTION public.leave_room(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_room RECORD;
  v_entry RECORD;
  v_product_value_cents bigint;
BEGIN
  -- Check authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get room with lock
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check room status - can only leave OPEN rooms
  IF v_room.status != 'OPEN' THEN
    RAISE EXCEPTION 'Cannot leave room that is not open';
  END IF;

  -- Check if room is locked (new check)
  IF v_room.lock_at IS NOT NULL AND now() >= v_room.lock_at THEN
    RAISE EXCEPTION 'Cannot leave after room is locked';
  END IF;

  -- Get user's entry
  SELECT * INTO v_entry 
  FROM room_entries 
  WHERE room_id = p_room_id AND user_id = v_user_id AND status = 'STAKED'
  FOR UPDATE;
  
  IF v_entry IS NULL THEN
    RAISE EXCEPTION 'No active entry found in this room';
  END IF;

  -- Get product value from snapshot
  v_product_value_cents := (v_entry.stake_snapshot->>'product_value_cents')::bigint;

  -- Delete the entry
  DELETE FROM room_entries WHERE id = v_entry.id;

  -- Return card to owned state
  UPDATE reveals 
  SET card_state = 'owned', staked_at = NULL, staked_room_id = NULL
  WHERE id = v_entry.reveal_id;

  -- Update room escrow balance
  UPDATE rooms 
  SET escrow_balance_cents = escrow_balance_cents - v_product_value_cents
  WHERE id = p_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully left the room',
    'reveal_id', v_entry.reveal_id
  );
END;
$function$;

-- 2.3 Update get_room_leaderboard RPC with sealed visibility
CREATE OR REPLACE FUNCTION public.get_room_leaderboard(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_room RECORD;
  v_leaderboard jsonb;
  v_my_entry jsonb;
BEGIN
  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- If room is OPEN or LOCKED, only return the calling user's entry
  IF v_room.status IN ('OPEN', 'LOCKED') THEN
    -- Return only user's own entry (sealed leaderboard)
    SELECT jsonb_build_object(
      'rank', NULL,
      'entry_id', re.id,
      'user_id', re.user_id,
      'reveal_id', re.reveal_id,
      'priority_score', re.priority_score,
      'status', re.status,
      'stake_snapshot', re.stake_snapshot,
      'early_stake_bonus', re.early_stake_bonus
    ) INTO v_my_entry
    FROM room_entries re
    WHERE re.room_id = p_room_id AND re.user_id = v_user_id AND re.status = 'STAKED';

    RETURN jsonb_build_object(
      'room', jsonb_build_object(
        'id', v_room.id,
        'tier', v_room.tier,
        'tier_cap_cents', v_room.tier_cap_cents,
        'category', v_room.category,
        'status', v_room.status,
        'start_at', v_room.start_at,
        'end_at', v_room.end_at,
        'lock_at', v_room.lock_at,
        'min_participants', v_room.min_participants,
        'max_participants', v_room.max_participants,
        'escrow_target_cents', v_room.escrow_target_cents,
        'escrow_balance_cents', v_room.escrow_balance_cents,
        'leaderboard_visibility', v_room.leaderboard_visibility,
        'participant_count', (SELECT COUNT(*) FROM room_entries WHERE room_id = p_room_id AND status = 'STAKED')
      ),
      'leaderboard', '[]'::jsonb,
      'my_entry', v_my_entry,
      'is_sealed', true
    );
  END IF;

  -- Room is SETTLED or CLOSED - return full leaderboard
  SELECT jsonb_agg(
    jsonb_build_object(
      'rank', ranked.rank,
      'entry_id', ranked.id,
      'user_id', ranked.user_id,
      'reveal_id', ranked.reveal_id,
      'priority_score', ranked.priority_score,
      'status', ranked.status,
      'stake_snapshot', ranked.stake_snapshot,
      'percentile_band', ranked.percentile_band,
      'credits_awarded', ranked.credits_awarded,
      'packs_awarded', ranked.packs_awarded,
      'username', cp.username,
      'display_name', cp.display_name,
      'avatar_url', cp.avatar_url
    ) ORDER BY ranked.rank
  ) INTO v_leaderboard
  FROM (
    SELECT re.*, re.rank as rank
    FROM room_entries re
    WHERE re.room_id = p_room_id
    ORDER BY re.rank NULLS LAST, re.priority_score DESC
  ) ranked
  LEFT JOIN collector_profiles cp ON cp.user_id = ranked.user_id;

  RETURN jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id,
      'tier', v_room.tier,
      'tier_cap_cents', v_room.tier_cap_cents,
      'category', v_room.category,
      'status', v_room.status,
      'start_at', v_room.start_at,
      'end_at', v_room.end_at,
      'lock_at', v_room.lock_at,
      'min_participants', v_room.min_participants,
      'max_participants', v_room.max_participants,
      'escrow_target_cents', v_room.escrow_target_cents,
      'escrow_balance_cents', v_room.escrow_balance_cents,
      'winner_entry_id', v_room.winner_entry_id,
      'winner_user_id', v_room.winner_user_id,
      'leaderboard_visibility', v_room.leaderboard_visibility,
      'participant_count', (SELECT COUNT(*) FROM room_entries WHERE room_id = p_room_id)
    ),
    'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb),
    'is_sealed', false
  );
END;
$function$;

-- 2.4 Create get_my_room_entry RPC
CREATE OR REPLACE FUNCTION public.get_my_room_entry(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_room RECORD;
  v_entry RECORD;
  v_competitiveness_band text;
  v_improvement_tips jsonb := '[]'::jsonb;
  v_participant_count integer;
  v_avg_score numeric;
BEGIN
  -- Check authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Get user's entry
  SELECT * INTO v_entry 
  FROM room_entries 
  WHERE room_id = p_room_id AND user_id = v_user_id AND status = 'STAKED';
  
  IF v_entry IS NULL THEN
    RETURN jsonb_build_object(
      'has_entry', false,
      'room_id', p_room_id,
      'room_status', v_room.status
    );
  END IF;

  -- Get participant count and average score for context
  SELECT COUNT(*), AVG(priority_score) 
  INTO v_participant_count, v_avg_score
  FROM room_entries 
  WHERE room_id = p_room_id AND status = 'STAKED';

  -- Determine competitiveness band based on score thresholds
  v_competitiveness_band := CASE
    WHEN v_entry.priority_score >= 70 THEN 'High'
    WHEN v_entry.priority_score >= 40 THEN 'Medium'
    ELSE 'Low'
  END;

  -- Build improvement tips based on stake snapshot
  IF (v_entry.stake_snapshot->>'rc_cents')::numeric < v_room.tier_cap_cents * 0.5 THEN
    v_improvement_tips := v_improvement_tips || '"Earn more Redeem Credits to boost your score"'::jsonb;
  END IF;
  
  IF (v_entry.stake_snapshot->>'pp')::integer < 500 THEN
    v_improvement_tips := v_improvement_tips || '"Gain Priority Points through battles and activities"'::jsonb;
  END IF;
  
  IF v_entry.stake_snapshot->>'band' IN ('ICON', 'RARE') THEN
    v_improvement_tips := v_improvement_tips || '"Higher rarity cards provide better Rarity Score"'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'has_entry', true,
    'entry', jsonb_build_object(
      'id', v_entry.id,
      'room_id', v_entry.room_id,
      'reveal_id', v_entry.reveal_id,
      'priority_score', v_entry.priority_score,
      'early_stake_bonus', v_entry.early_stake_bonus,
      'stake_snapshot', v_entry.stake_snapshot,
      'staked_at', v_entry.staked_at,
      'status', v_entry.status,
      'percentile_band', v_entry.percentile_band,
      'credits_awarded', v_entry.credits_awarded,
      'packs_awarded', v_entry.packs_awarded
    ),
    'competitiveness_band', v_competitiveness_band,
    'improvement_tips', v_improvement_tips,
    'room_status', v_room.status,
    'participant_count', v_participant_count,
    'avg_score', ROUND(v_avg_score, 2)
  );
END;
$function$;

-- 2.5 Update settle_room RPC with rewards calculation
CREATE OR REPLACE FUNCTION public.settle_room(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_room RECORD;
  v_winner_entry RECORD;
  v_entry RECORD;
  v_reward_config RECORD;
  v_total_entries integer;
  v_current_rank integer := 0;
  v_percentile numeric;
  v_percentile_band text;
  v_placement_bonus integer;
  v_pack_bonus integer;
  v_credits_awarded integer;
  v_packs_awarded integer;
  v_results jsonb := '[]'::jsonb;
BEGIN
  -- Get room with lock
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check room can be settled
  IF v_room.status NOT IN ('LOCKED', 'OPEN') THEN
    RAISE EXCEPTION 'Room cannot be settled - status: %', v_room.status;
  END IF;

  -- Get reward config for this tier
  SELECT * INTO v_reward_config FROM room_reward_config WHERE tier = v_room.tier;
  
  IF v_reward_config IS NULL THEN
    -- Use defaults if no config
    v_reward_config := ROW('ICON', 1.0, 40, 0, 0)::room_reward_config;
  END IF;

  -- Get total entries
  SELECT COUNT(*) INTO v_total_entries FROM room_entries WHERE room_id = p_room_id AND status = 'STAKED';
  
  IF v_total_entries = 0 THEN
    -- No entries, just close the room
    UPDATE rooms SET status = 'SETTLED' WHERE id = p_room_id;
    RETURN jsonb_build_object('success', true, 'message', 'Room settled with no entries', 'winner', null);
  END IF;

  -- Rank all entries and calculate rewards
  FOR v_entry IN 
    SELECT re.* 
    FROM room_entries re 
    WHERE re.room_id = p_room_id AND re.status = 'STAKED'
    ORDER BY re.priority_score DESC, re.staked_at ASC
  LOOP
    v_current_rank := v_current_rank + 1;
    
    -- Calculate percentile (1 = top, 100 = bottom)
    v_percentile := (v_current_rank::numeric / v_total_entries) * 100;
    
    -- Determine percentile band
    v_percentile_band := CASE
      WHEN v_percentile <= 10 THEN 'S'
      WHEN v_percentile <= 30 THEN 'A'
      WHEN v_percentile <= 60 THEN 'B'
      ELSE 'C'
    END;
    
    -- Determine placement bonus credits
    v_placement_bonus := CASE v_percentile_band
      WHEN 'S' THEN 120
      WHEN 'A' THEN 70
      WHEN 'B' THEN 35
      ELSE 0
    END;
    
    -- Determine pack bonus
    v_pack_bonus := CASE v_percentile_band
      WHEN 'S' THEN 1
      WHEN 'A' THEN 1
      ELSE 0
    END;
    
    -- Calculate total credits: (base + placement_bonus) * tier_multiplier
    v_credits_awarded := FLOOR((v_reward_config.base_participation_credits + v_placement_bonus) * v_reward_config.multiplier);
    
    -- Calculate packs: min(base_packs + bonus_packs, cap)
    v_packs_awarded := LEAST(v_reward_config.base_packs + v_pack_bonus, v_reward_config.packs_cap);
    
    -- Update entry with rank, band, and rewards
    UPDATE room_entries 
    SET rank = v_current_rank,
        percentile_band = v_percentile_band,
        credits_awarded = v_credits_awarded,
        packs_awarded = v_packs_awarded,
        status = CASE WHEN v_current_rank = 1 THEN 'WON' ELSE 'LOST' END
    WHERE id = v_entry.id;
    
    -- Insert room reward record
    INSERT INTO room_rewards (room_id, user_id, entry_id, percentile_band, final_rank, credits_awarded, packs_awarded)
    VALUES (p_room_id, v_entry.user_id, v_entry.id, v_percentile_band, v_current_rank, v_credits_awarded, v_packs_awarded);
    
    -- Credit universal credits to user
    INSERT INTO user_universal_credits (user_id, credits)
    VALUES (v_entry.user_id, v_credits_awarded)
    ON CONFLICT (user_id)
    DO UPDATE SET credits = user_universal_credits.credits + v_credits_awarded, updated_at = now();
    
    -- Create reward pack grants
    FOR i IN 1..v_packs_awarded LOOP
      INSERT INTO reward_pack_grants (user_id, source_type, source_id)
      SELECT v_entry.user_id, 'room_reward', rr.id
      FROM room_rewards rr 
      WHERE rr.room_id = p_room_id AND rr.user_id = v_entry.user_id;
    END LOOP;
    
    -- Update card state based on outcome
    IF v_current_rank = 1 THEN
      -- Winner gets the card back as 'won'
      UPDATE reveals SET card_state = 'won' WHERE id = v_entry.reveal_id;
    ELSE
      -- Losers get their cards back as 'owned'
      UPDATE reveals SET card_state = 'owned', staked_at = NULL, staked_room_id = NULL WHERE id = v_entry.reveal_id;
    END IF;
    
    -- Track winner
    IF v_current_rank = 1 THEN
      v_winner_entry := v_entry;
    END IF;
    
    -- Add to results
    v_results := v_results || jsonb_build_object(
      'user_id', v_entry.user_id,
      'rank', v_current_rank,
      'percentile_band', v_percentile_band,
      'credits_awarded', v_credits_awarded,
      'packs_awarded', v_packs_awarded
    );
  END LOOP;

  -- Update room as settled
  UPDATE rooms 
  SET status = 'SETTLED',
      winner_entry_id = v_winner_entry.id,
      winner_user_id = v_winner_entry.user_id
  WHERE id = p_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'room_id', p_room_id,
    'total_entries', v_total_entries,
    'winner', jsonb_build_object(
      'user_id', v_winner_entry.user_id,
      'entry_id', v_winner_entry.id,
      'priority_score', v_winner_entry.priority_score
    ),
    'results', v_results
  );
END;
$function$;

-- 2.6 Create claim_reward_pack RPC
CREATE OR REPLACE FUNCTION public.claim_reward_pack(p_pack_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_pack RECORD;
  v_band rarity_band;
  v_product RECORD;
  v_credits_grant integer := 150; -- Reward packs give 150 credits
  v_product_credits integer;
  v_universal_credits integer;
  v_reveal_id uuid;
  v_serial text;
  v_random numeric;
BEGIN
  -- Check authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get pack with lock
  SELECT * INTO v_pack FROM reward_pack_grants WHERE id = p_pack_id AND user_id = v_user_id FOR UPDATE;
  
  IF v_pack IS NULL THEN
    RAISE EXCEPTION 'Reward pack not found or not owned';
  END IF;

  IF v_pack.status != 'PENDING' THEN
    RAISE EXCEPTION 'Reward pack already opened';
  END IF;

  -- Band selection for reward packs (weighted toward lower tiers - no golden, no awards)
  v_random := random();
  v_band := CASE
    WHEN v_random < 0.80 THEN 'ICON'::rarity_band
    WHEN v_random < 0.95 THEN 'RARE'::rarity_band
    WHEN v_random < 0.99 THEN 'GRAIL'::rarity_band
    ELSE 'MYTHIC'::rarity_band
  END;

  -- Select product from band
  SELECT * INTO v_product
  FROM product_classes pc
  WHERE pc.band = v_band AND pc.is_active = true
  ORDER BY random() LIMIT 1;

  -- Fallback to ICON if no product found
  IF v_product IS NULL THEN
    SELECT * INTO v_product FROM product_classes WHERE band = 'ICON' AND is_active = true ORDER BY random() LIMIT 1;
    v_band := 'ICON';
  END IF;

  IF v_product IS NULL THEN
    RAISE EXCEPTION 'No products available';
  END IF;

  -- Split credits (70% product, 30% universal)
  v_product_credits := FLOOR(v_credits_grant * 0.7);
  v_universal_credits := v_credits_grant - v_product_credits;

  -- Generate serial
  v_serial := LPAD((FLOOR(random() * 10000)::INT)::TEXT, 4, '0') || '/10000';

  -- Insert reveal (no award, no golden for reward packs)
  INSERT INTO reveals (
    purchase_id, user_id, product_class_id, band, is_golden,
    credits_awarded, product_credits_awarded, universal_credits_awarded,
    is_award, serial_number
  ) VALUES (
    NULL, v_user_id, v_product.id, v_band, false,
    v_credits_grant, v_product_credits, v_universal_credits,
    false, v_serial
  ) RETURNING id INTO v_reveal_id;

  -- Upsert credits
  INSERT INTO user_product_credits (user_id, product_class_id, credits)
  VALUES (v_user_id, v_product.id, v_product_credits)
  ON CONFLICT (user_id, product_class_id)
  DO UPDATE SET credits = user_product_credits.credits + v_product_credits, updated_at = now();

  INSERT INTO user_universal_credits (user_id, credits)
  VALUES (v_user_id, v_universal_credits)
  ON CONFLICT (user_id)
  DO UPDATE SET credits = user_universal_credits.credits + v_universal_credits, updated_at = now();

  -- Mark pack as opened
  UPDATE reward_pack_grants SET status = 'OPENED', opened_at = now() WHERE id = p_pack_id;

  RETURN jsonb_build_object(
    'success', true,
    'reveal', jsonb_build_object(
      'id', v_reveal_id,
      'product_class_id', v_product.id,
      'band', v_band,
      'is_golden', false,
      'is_award', false,
      'serial_number', v_serial,
      'credits_awarded', v_credits_grant,
      'product', jsonb_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'brand', v_product.brand,
        'model', v_product.model,
        'category', v_product.category,
        'retail_value_usd', v_product.retail_value_usd,
        'image_url', v_product.image_url
      )
    )
  );
END;
$function$;-- Drop the old function signature that causes PostgREST ambiguity
DROP FUNCTION IF EXISTS public.get_room_leaderboard(uuid, integer);-- Phase 1: Lottery Rooms Schema Updates

-- Add new columns to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS product_class_id uuid REFERENCES public.product_classes(id),
ADD COLUMN IF NOT EXISTS funding_target_cents bigint,
ADD COLUMN IF NOT EXISTS is_mystery boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS mystery_product_id uuid REFERENCES public.product_classes(id),
ADD COLUMN IF NOT EXISTS deadline_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN public.rooms.product_class_id IS 'The product being funded in this room (null for mystery rooms until revealed)';
COMMENT ON COLUMN public.rooms.funding_target_cents IS 'Target funding amount (retail_value × 2.5)';
COMMENT ON COLUMN public.rooms.is_mystery IS 'Whether this is a mystery room with hidden product';
COMMENT ON COLUMN public.rooms.mystery_product_id IS 'For mystery rooms: the actual product (revealed after funding)';
COMMENT ON COLUMN public.rooms.deadline_at IS 'Optional deadline for room funding';

-- Update status column to support new values
-- Current values: OPEN, LOCKED, FUNDED, CLOSED, SETTLED
-- New values: OPEN, FUNDED, DRAWING, SETTLED, EXPIRED, REFUNDING
-- We'll add a check constraint for valid statuses

ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_status_check;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_status_check 
CHECK (status IN ('OPEN', 'FUNDED', 'DRAWING', 'SETTLED', 'EXPIRED', 'REFUNDING', 'LOCKED', 'CLOSED'));

-- Create index for product lookups
CREATE INDEX IF NOT EXISTS idx_rooms_product_class_id ON public.rooms(product_class_id);
CREATE INDEX IF NOT EXISTS idx_rooms_is_mystery ON public.rooms(is_mystery) WHERE is_mystery = true;
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);-- Phase 3: Lottery Room Entry Schema & RPC Functions

-- 1. Modify room_entries table for lottery system
ALTER TABLE public.room_entries 
ADD COLUMN IF NOT EXISTS amount_spent_cents bigint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tickets integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS outcome text NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS credits_converted integer DEFAULT 0;

-- Add constraint for outcome values
ALTER TABLE public.room_entries DROP CONSTRAINT IF EXISTS room_entries_outcome_check;
ALTER TABLE public.room_entries ADD CONSTRAINT room_entries_outcome_check 
CHECK (outcome IN ('PENDING', 'WON', 'REFUNDED', 'CONVERTED'));

-- 2. Create room_entry_purchases table (tracks individual purchases)
CREATE TABLE IF NOT EXISTS public.room_entry_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  entry_id uuid REFERENCES public.room_entries(id) ON DELETE CASCADE,
  amount_cents bigint NOT NULL,
  tickets_granted integer NOT NULL,
  stripe_session_id text,
  stripe_payment_intent_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for room_entry_purchases
CREATE INDEX IF NOT EXISTS idx_room_entry_purchases_room_id ON public.room_entry_purchases(room_id);
CREATE INDEX IF NOT EXISTS idx_room_entry_purchases_user_id ON public.room_entry_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_room_entry_purchases_stripe_session ON public.room_entry_purchases(stripe_session_id);

-- RLS for room_entry_purchases
ALTER TABLE public.room_entry_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases" ON public.room_entry_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view room purchase counts" ON public.room_entry_purchases
  FOR SELECT USING (true);

-- 3. Create lottery_draws audit table
CREATE TABLE IF NOT EXISTS public.lottery_draws (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  winner_entry_id uuid REFERENCES public.room_entries(id),
  winner_user_id uuid,
  total_tickets integer NOT NULL,
  winning_ticket_number integer NOT NULL,
  random_seed text,
  drawn_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS for lottery_draws
ALTER TABLE public.lottery_draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lottery draws" ON public.lottery_draws
  FOR SELECT USING (true);

-- 4. RPC: buy_room_entry - Process entry purchase, create tickets, update funding
CREATE OR REPLACE FUNCTION public.buy_room_entry(
  p_room_id uuid,
  p_amount_cents bigint,
  p_stripe_session_id text DEFAULT NULL,
  p_stripe_payment_intent_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_room rooms%ROWTYPE;
  v_entry_id uuid;
  v_tickets integer;
  v_new_balance bigint;
  v_funding_progress numeric;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get room and verify it's open
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.status != 'OPEN' THEN
    RAISE EXCEPTION 'Room is not open for entries';
  END IF;

  -- Calculate tickets (1 ticket per $1)
  v_tickets := (p_amount_cents / 100)::integer;
  IF v_tickets < 1 THEN
    RAISE EXCEPTION 'Minimum entry is $1';
  END IF;

  -- Create or update room entry for user
  INSERT INTO room_entries (room_id, user_id, reveal_id, stake_snapshot, amount_spent_cents, tickets, status, outcome)
  VALUES (
    p_room_id, 
    v_user_id, 
    gen_random_uuid(), -- Placeholder reveal_id
    jsonb_build_object('entry_type', 'lottery', 'amount_cents', p_amount_cents),
    p_amount_cents,
    v_tickets,
    'STAKED',
    'PENDING'
  )
  ON CONFLICT (room_id, user_id) DO UPDATE SET
    amount_spent_cents = room_entries.amount_spent_cents + p_amount_cents,
    tickets = room_entries.tickets + v_tickets,
    stake_snapshot = jsonb_set(
      room_entries.stake_snapshot, 
      '{total_amount_cents}', 
      to_jsonb(room_entries.amount_spent_cents + p_amount_cents)
    )
  RETURNING id INTO v_entry_id;

  -- Record individual purchase
  INSERT INTO room_entry_purchases (room_id, user_id, entry_id, amount_cents, tickets_granted, stripe_session_id, stripe_payment_intent_id)
  VALUES (p_room_id, v_user_id, v_entry_id, p_amount_cents, v_tickets, p_stripe_session_id, p_stripe_payment_intent_id);

  -- Update room funding balance
  UPDATE rooms 
  SET escrow_balance_cents = escrow_balance_cents + p_amount_cents
  WHERE id = p_room_id
  RETURNING escrow_balance_cents INTO v_new_balance;

  -- Calculate funding progress
  v_funding_progress := CASE 
    WHEN v_room.funding_target_cents > 0 THEN 
      (v_new_balance::numeric / v_room.funding_target_cents::numeric) * 100
    ELSE 0 
  END;

  -- Check if room is now fully funded
  IF v_new_balance >= v_room.funding_target_cents THEN
    UPDATE rooms SET status = 'FUNDED' WHERE id = p_room_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'tickets_granted', v_tickets,
    'total_tickets', (SELECT tickets FROM room_entries WHERE id = v_entry_id),
    'funding_progress', round(v_funding_progress, 2),
    'room_status', (SELECT status FROM rooms WHERE id = p_room_id)
  );
END;
$$;

-- 5. RPC: draw_room_winner - Weighted random selection
CREATE OR REPLACE FUNCTION public.draw_room_winner(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_total_tickets integer;
  v_winning_ticket integer;
  v_running_total integer := 0;
  v_winner_entry room_entries%ROWTYPE;
  v_random_seed text;
  v_entry RECORD;
BEGIN
  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.status != 'FUNDED' THEN
    RAISE EXCEPTION 'Room must be fully funded to draw winner';
  END IF;

  -- Update status to DRAWING
  UPDATE rooms SET status = 'DRAWING' WHERE id = p_room_id;

  -- Get total tickets
  SELECT COALESCE(SUM(tickets), 0) INTO v_total_tickets
  FROM room_entries WHERE room_id = p_room_id AND outcome = 'PENDING';

  IF v_total_tickets = 0 THEN
    RAISE EXCEPTION 'No tickets in room';
  END IF;

  -- Generate random winning ticket number (1 to total_tickets)
  v_random_seed := gen_random_uuid()::text;
  v_winning_ticket := floor(random() * v_total_tickets)::integer + 1;

  -- Find winner by iterating through entries
  FOR v_entry IN 
    SELECT * FROM room_entries 
    WHERE room_id = p_room_id AND outcome = 'PENDING'
    ORDER BY staked_at
  LOOP
    v_running_total := v_running_total + v_entry.tickets;
    IF v_running_total >= v_winning_ticket THEN
      SELECT * INTO v_winner_entry FROM room_entries WHERE id = v_entry.id;
      EXIT;
    END IF;
  END LOOP;

  IF v_winner_entry.id IS NULL THEN
    RAISE EXCEPTION 'Failed to select winner';
  END IF;

  -- Record the draw
  INSERT INTO lottery_draws (room_id, winner_entry_id, winner_user_id, total_tickets, winning_ticket_number, random_seed)
  VALUES (p_room_id, v_winner_entry.id, v_winner_entry.user_id, v_total_tickets, v_winning_ticket, v_random_seed);

  -- Update winner entry
  UPDATE room_entries SET outcome = 'WON' WHERE id = v_winner_entry.id;

  -- Update room with winner
  UPDATE rooms SET 
    status = 'SETTLED',
    winner_entry_id = v_winner_entry.id,
    winner_user_id = v_winner_entry.user_id
  WHERE id = p_room_id;

  -- Create notification for winner
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    v_winner_entry.user_id,
    'room_win',
    'You Won!',
    'Congratulations! You won the lottery room!',
    jsonb_build_object('room_id', p_room_id, 'tickets', v_winner_entry.tickets, 'total_tickets', v_total_tickets)
  );

  RETURN jsonb_build_object(
    'success', true,
    'winner_entry_id', v_winner_entry.id,
    'winner_user_id', v_winner_entry.user_id,
    'winning_ticket', v_winning_ticket,
    'total_tickets', v_total_tickets,
    'winner_tickets', v_winner_entry.tickets,
    'win_probability', round((v_winner_entry.tickets::numeric / v_total_tickets::numeric) * 100, 2)
  );
END;
$$;

-- 6. RPC: reveal_mystery_product - Assign product to mystery room
CREATE OR REPLACE FUNCTION public.reveal_mystery_product(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_product product_classes%ROWTYPE;
BEGIN
  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF NOT v_room.is_mystery THEN
    RAISE EXCEPTION 'Not a mystery room';
  END IF;
  IF v_room.mystery_product_id IS NOT NULL THEN
    -- Already revealed, return existing product
    SELECT * INTO v_product FROM product_classes WHERE id = v_room.mystery_product_id;
    RETURN jsonb_build_object('success', true, 'product', row_to_json(v_product), 'already_revealed', true);
  END IF;

  -- Select random product matching room tier
  SELECT * INTO v_product 
  FROM product_classes 
  WHERE is_active = true 
    AND band = v_room.tier::rarity_band
  ORDER BY random() 
  LIMIT 1;

  IF v_product IS NULL THEN
    RAISE EXCEPTION 'No products available for this tier';
  END IF;

  -- Update room with revealed product
  UPDATE rooms SET 
    mystery_product_id = v_product.id,
    product_class_id = v_product.id
  WHERE id = p_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'product', row_to_json(v_product),
    'already_revealed', false
  );
END;
$$;

-- 7. RPC: convert_to_credits - Convert entry to 1.5x credits
CREATE OR REPLACE FUNCTION public.convert_to_credits(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_entry room_entries%ROWTYPE;
  v_room rooms%ROWTYPE;
  v_credits_to_add integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.status NOT IN ('SETTLED', 'EXPIRED', 'REFUNDING') THEN
    RAISE EXCEPTION 'Room must be settled or expired to convert credits';
  END IF;

  -- Get user's entry
  SELECT * INTO v_entry FROM room_entries 
  WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
  
  IF v_entry IS NULL THEN
    RAISE EXCEPTION 'No entry found for this room';
  END IF;
  IF v_entry.outcome != 'PENDING' THEN
    RAISE EXCEPTION 'Entry already processed';
  END IF;
  IF v_entry.outcome = 'WON' THEN
    RAISE EXCEPTION 'Winners cannot convert to credits';
  END IF;

  -- Calculate credits (1.5x multiplier, amount in cents -> credits)
  v_credits_to_add := (v_entry.amount_spent_cents * 1.5 / 100)::integer;

  -- Add to user's universal credits
  INSERT INTO user_universal_credits (user_id, credits)
  VALUES (v_user_id, v_credits_to_add)
  ON CONFLICT (user_id) DO UPDATE SET
    credits = user_universal_credits.credits + v_credits_to_add,
    updated_at = now();

  -- Update entry outcome
  UPDATE room_entries SET 
    outcome = 'CONVERTED',
    credits_converted = v_credits_to_add
  WHERE id = v_entry.id;

  RETURN jsonb_build_object(
    'success', true,
    'credits_converted', v_credits_to_add,
    'amount_spent_cents', v_entry.amount_spent_cents,
    'multiplier', 1.5
  );
END;
$$;

-- 8. RPC: request_room_refund - Mark entry for refund (actual refund via Stripe edge function)
CREATE OR REPLACE FUNCTION public.request_room_refund(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_entry room_entries%ROWTYPE;
  v_room rooms%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.status NOT IN ('EXPIRED', 'REFUNDING') THEN
    RAISE EXCEPTION 'Refunds only available for expired rooms';
  END IF;

  -- Get user's entry
  SELECT * INTO v_entry FROM room_entries 
  WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
  
  IF v_entry IS NULL THEN
    RAISE EXCEPTION 'No entry found for this room';
  END IF;
  IF v_entry.outcome != 'PENDING' THEN
    RAISE EXCEPTION 'Entry already processed';
  END IF;

  -- Mark as refunded (actual refund handled by edge function)
  UPDATE room_entries SET outcome = 'REFUNDED' WHERE id = v_entry.id;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry.id,
    'refund_amount_cents', v_entry.amount_spent_cents,
    'message', 'Refund request submitted. Funds will be returned to your original payment method.'
  );
END;
$$;

-- 9. RPC: get_room_details - Get full room info with product and stats
CREATE OR REPLACE FUNCTION public.get_room_details(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_product product_classes%ROWTYPE;
  v_total_tickets integer;
  v_participant_count integer;
  v_user_entry room_entries%ROWTYPE;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  IF v_room IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room not found');
  END IF;

  -- Get product (either direct or mystery revealed)
  IF v_room.product_class_id IS NOT NULL THEN
    SELECT * INTO v_product FROM product_classes WHERE id = v_room.product_class_id;
  END IF;

  -- Get stats
  SELECT COALESCE(SUM(tickets), 0), COUNT(*) 
  INTO v_total_tickets, v_participant_count
  FROM room_entries WHERE room_id = p_room_id;

  -- Get user's entry if authenticated
  IF v_user_id IS NOT NULL THEN
    SELECT * INTO v_user_entry FROM room_entries 
    WHERE room_id = p_room_id AND user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'room', row_to_json(v_room),
    'product', CASE WHEN v_product.id IS NOT NULL THEN row_to_json(v_product) ELSE NULL END,
    'is_product_revealed', v_room.product_class_id IS NOT NULL,
    'total_tickets', v_total_tickets,
    'participant_count', v_participant_count,
    'funding_progress', CASE 
      WHEN v_room.funding_target_cents > 0 THEN 
        round((v_room.escrow_balance_cents::numeric / v_room.funding_target_cents::numeric) * 100, 2)
      ELSE 0 
    END,
    'my_entry', CASE WHEN v_user_entry.id IS NOT NULL THEN jsonb_build_object(
      'id', v_user_entry.id,
      'tickets', v_user_entry.tickets,
      'amount_spent_cents', v_user_entry.amount_spent_cents,
      'outcome', v_user_entry.outcome,
      'win_probability', CASE 
        WHEN v_total_tickets > 0 THEN round((v_user_entry.tickets::numeric / v_total_tickets::numeric) * 100, 2)
        ELSE 0
      END
    ) ELSE NULL END
  );
END;
$$;

-- Add unique constraint for room_entries (one entry per user per room)
ALTER TABLE public.room_entries DROP CONSTRAINT IF EXISTS room_entries_room_user_unique;
ALTER TABLE public.room_entries ADD CONSTRAINT room_entries_room_user_unique UNIQUE (room_id, user_id);-- Fix buy_room_entry to accept user_id parameter for webhook calls
CREATE OR REPLACE FUNCTION public.buy_room_entry(
  p_room_id uuid,
  p_amount_cents bigint,
  p_stripe_session_id text DEFAULT NULL,
  p_stripe_payment_intent_id text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_room rooms%ROWTYPE;
  v_entry_id uuid;
  v_tickets integer;
  v_new_balance bigint;
  v_funding_progress numeric;
BEGIN
  -- Get user id from parameter or auth context
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID required (either via parameter or authentication)';
  END IF;

  -- Get room and verify it's open
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.status != 'OPEN' THEN
    RAISE EXCEPTION 'Room is not open for entries';
  END IF;

  -- Calculate tickets (1 ticket per $1)
  v_tickets := (p_amount_cents / 100)::integer;
  IF v_tickets < 1 THEN
    RAISE EXCEPTION 'Minimum entry is $1';
  END IF;

  -- Create or update room entry for user
  INSERT INTO room_entries (room_id, user_id, reveal_id, stake_snapshot, amount_spent_cents, tickets, status, outcome)
  VALUES (
    p_room_id, 
    v_user_id, 
    gen_random_uuid(), -- Placeholder reveal_id
    jsonb_build_object('entry_type', 'lottery', 'amount_cents', p_amount_cents),
    p_amount_cents,
    v_tickets,
    'STAKED',
    'PENDING'
  )
  ON CONFLICT (room_id, user_id) DO UPDATE SET
    amount_spent_cents = room_entries.amount_spent_cents + p_amount_cents,
    tickets = room_entries.tickets + v_tickets,
    stake_snapshot = jsonb_set(
      room_entries.stake_snapshot, 
      '{total_amount_cents}', 
      to_jsonb(room_entries.amount_spent_cents + p_amount_cents)
    )
  RETURNING id INTO v_entry_id;

  -- Record individual purchase
  INSERT INTO room_entry_purchases (room_id, user_id, entry_id, amount_cents, tickets_granted, stripe_session_id, stripe_payment_intent_id)
  VALUES (p_room_id, v_user_id, v_entry_id, p_amount_cents, v_tickets, p_stripe_session_id, p_stripe_payment_intent_id);

  -- Update room funding balance
  UPDATE rooms 
  SET escrow_balance_cents = escrow_balance_cents + p_amount_cents
  WHERE id = p_room_id
  RETURNING escrow_balance_cents INTO v_new_balance;

  -- Calculate funding progress
  v_funding_progress := CASE 
    WHEN v_room.funding_target_cents > 0 THEN 
      (v_new_balance::numeric / v_room.funding_target_cents::numeric) * 100
    ELSE 0 
  END;

  -- Check if room is now fully funded
  IF v_new_balance >= v_room.funding_target_cents THEN
    UPDATE rooms SET status = 'FUNDED' WHERE id = p_room_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'tickets_granted', v_tickets,
    'total_tickets', (SELECT tickets FROM room_entries WHERE id = v_entry_id),
    'funding_progress', round(v_funding_progress, 2),
    'room_status', (SELECT status FROM rooms WHERE id = p_room_id)
  );
END;
$$;-- Seed Initial 4 Lottery Rooms

-- 1. Rolex Submariner Room (high-value: $12,000 retail × 2.5 = $30,000 funding target)
INSERT INTO public.rooms (
  product_class_id,
  tier,
  tier_cap_cents,
  funding_target_cents,
  escrow_target_cents,
  status,
  is_mystery,
  start_at,
  end_at,
  deadline_at,
  min_participants,
  max_participants,
  category,
  leaderboard_visibility
) VALUES (
  '4b0661e9-1c15-4210-8469-e413596a7493', -- Rolex Submariner
  'RARE',
  1200000, -- $12,000 tier cap
  3000000, -- $30,000 funding target (2.5x retail)
  3000000,
  'OPEN',
  false,
  NOW(),
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days',
  10,
  500,
  'WATCHES',
  'after_close'
);

-- 2. Chanel Classic Flap Room (high-value: $11,000 retail × 2.5 = $27,500 funding target)
INSERT INTO public.rooms (
  product_class_id,
  tier,
  tier_cap_cents,
  funding_target_cents,
  escrow_target_cents,
  status,
  is_mystery,
  start_at,
  end_at,
  deadline_at,
  min_participants,
  max_participants,
  category,
  leaderboard_visibility
) VALUES (
  'a6cd7b9e-7432-4854-9235-ef6c52f4017d', -- Chanel Classic Flap
  'GRAIL',
  1100000, -- $11,000 tier cap
  2750000, -- $27,500 funding target (2.5x retail)
  2750000,
  'OPEN',
  false,
  NOW(),
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days',
  10,
  500,
  'HANDBAGS',
  'after_close'
);

-- 3. Messi Jersey Room (low-value: $500 retail × 2.5 = $1,250 funding target)
INSERT INTO public.rooms (
  product_class_id,
  tier,
  tier_cap_cents,
  funding_target_cents,
  escrow_target_cents,
  status,
  is_mystery,
  start_at,
  end_at,
  deadline_at,
  min_participants,
  max_participants,
  category,
  leaderboard_visibility
) VALUES (
  'a876f489-574e-4d89-b2bd-b7e8868d3435', -- Messi Argentina World Cup Jersey
  'ICON',
  50000, -- $500 tier cap
  125000, -- $1,250 funding target (2.5x retail)
  125000,
  'OPEN',
  false,
  NOW(),
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days',
  5,
  200,
  'SPORT_MEMORABILIA',
  'after_close'
);

-- 4. Mystery Room (low-value, product hidden until funded)
-- Using Messi Jersey as the mystery product (will be revealed when funded)
INSERT INTO public.rooms (
  product_class_id,
  mystery_product_id,
  tier,
  tier_cap_cents,
  funding_target_cents,
  escrow_target_cents,
  status,
  is_mystery,
  start_at,
  end_at,
  deadline_at,
  min_participants,
  max_participants,
  category,
  leaderboard_visibility
) VALUES (
  NULL, -- Hidden until funded
  'a876f489-574e-4d89-b2bd-b7e8868d3435', -- Mystery product: Messi Jersey (hidden)
  'ICON',
  50000, -- $500 tier cap
  125000, -- $1,250 funding target (2.5x retail)
  125000,
  'OPEN',
  true, -- This is a mystery room
  NOW(),
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days',
  5,
  200,
  NULL, -- Category hidden for mystery
  'after_close'
);-- Update get_active_rooms RPC to filter for lottery rooms only
CREATE OR REPLACE FUNCTION public.get_active_rooms(p_tier TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'rooms', COALESCE(json_agg(
      json_build_object(
        'id', r.id,
        'tier', r.tier,
        'status', r.status,
        'product_class_id', r.product_class_id,
        'mystery_product_id', r.mystery_product_id,
        'is_mystery', r.is_mystery,
        'category', r.category,
        'start_at', r.start_at,
        'end_at', r.end_at,
        'deadline_at', r.deadline_at,
        'lock_at', r.lock_at,
        'escrow_balance_cents', r.escrow_balance_cents,
        'escrow_target_cents', r.escrow_target_cents,
        'funding_target_cents', r.funding_target_cents,
        'tier_cap_cents', r.tier_cap_cents,
        'min_participants', r.min_participants,
        'max_participants', r.max_participants,
        'leaderboard_visibility', r.leaderboard_visibility,
        'winner_user_id', r.winner_user_id,
        'winner_entry_id', r.winner_entry_id,
        'participant_count', (
          SELECT COUNT(DISTINCT user_id) 
          FROM room_entries re 
          WHERE re.room_id = r.id AND re.status = 'active'
        ),
        'product', CASE 
          WHEN r.is_mystery THEN NULL
          WHEN r.product_class_id IS NOT NULL THEN (
            SELECT json_build_object(
              'id', pc.id,
              'name', pc.name,
              'brand', pc.brand,
              'model', pc.model,
              'image_url', pc.image_url,
              'retail_value_usd', pc.retail_value_usd,
              'category', pc.category,
              'band', pc.band
            )
            FROM product_classes pc
            WHERE pc.id = r.product_class_id
          )
          ELSE NULL
        END
      )
    ), '[]'::json)
  ) INTO result
  FROM rooms r
  WHERE r.status IN ('OPEN', 'FUNDED', 'DRAWING')
    AND r.funding_target_cents IS NOT NULL  -- Only lottery rooms
    AND (p_tier IS NULL OR r.tier = p_tier);

  RETURN result;
END;
$$;-- Function to get room entry data by Stripe session ID
CREATE OR REPLACE FUNCTION public.get_room_entry_by_session(
  p_session_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase record;
  v_entry record;
  v_room record;
  v_product record;
  v_result json;
BEGIN
  -- Find the purchase by Stripe session ID
  SELECT * INTO v_purchase
  FROM room_entry_purchases
  WHERE stripe_session_id = p_session_id
  LIMIT 1;
  
  IF v_purchase IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Purchase not found');
  END IF;
  
  -- Get the room entry
  SELECT * INTO v_entry
  FROM room_entries
  WHERE room_id = v_purchase.room_id 
    AND user_id = v_purchase.user_id
  ORDER BY staked_at DESC
  LIMIT 1;
  
  -- Get room details
  SELECT * INTO v_room
  FROM rooms
  WHERE id = v_purchase.room_id;
  
  -- Get product details
  SELECT pc.* INTO v_product
  FROM product_classes pc
  WHERE pc.id = v_room.product_class_id
     OR pc.id = v_room.mystery_product_id;
  
  -- Get total tickets across all entries in room for user
  DECLARE
    v_total_user_tickets int;
    v_total_room_tickets int;
  BEGIN
    SELECT COALESCE(SUM(tickets), 0) INTO v_total_user_tickets
    FROM room_entries
    WHERE room_id = v_purchase.room_id 
      AND user_id = v_purchase.user_id
      AND status IN ('active', 'pending');
    
    SELECT COALESCE(SUM(tickets), 0) INTO v_total_room_tickets
    FROM room_entries
    WHERE room_id = v_purchase.room_id
      AND status IN ('active', 'pending');
    
    v_result := json_build_object(
      'success', true,
      'room_id', v_room.id,
      'room', json_build_object(
        'id', v_room.id,
        'tier', v_room.tier,
        'status', v_room.status,
        'start_at', v_room.start_at,
        'end_at', v_room.end_at,
        'deadline_at', v_room.deadline_at,
        'escrow_balance_cents', v_room.escrow_balance_cents,
        'escrow_target_cents', v_room.escrow_target_cents,
        'funding_target_cents', v_room.funding_target_cents,
        'tier_cap_cents', v_room.tier_cap_cents,
        'max_participants', v_room.max_participants,
        'min_participants', v_room.min_participants,
        'is_mystery', v_room.is_mystery,
        'category', v_room.category
      ),
      'product', CASE WHEN v_product IS NOT NULL THEN json_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'brand', v_product.brand,
        'model', v_product.model,
        'image_url', v_product.image_url,
        'retail_value_usd', v_product.retail_value_usd,
        'category', v_product.category,
        'band', v_product.band
      ) ELSE NULL END,
      'tickets_purchased', v_purchase.tickets_granted,
      'user_total_tickets', v_total_user_tickets,
      'total_room_tickets', v_total_room_tickets,
      'amount_cents', v_purchase.amount_cents
    );
    
    RETURN v_result;
  END;
END;
$$;-- Step 1: Drop the unique constraint that includes reveal_id
ALTER TABLE room_entries DROP CONSTRAINT IF EXISTS room_entries_room_id_reveal_id_key;

-- Step 2: Drop the foreign key constraint
ALTER TABLE room_entries DROP CONSTRAINT IF EXISTS room_entries_reveal_id_fkey;

-- Step 3: Make reveal_id nullable
ALTER TABLE room_entries ALTER COLUMN reveal_id DROP NOT NULL;

-- Step 4: Re-add foreign key (now allows NULL)
ALTER TABLE room_entries 
ADD CONSTRAINT room_entries_reveal_id_fkey 
FOREIGN KEY (reveal_id) REFERENCES reveals(id);

-- Step 5: Add unique constraint on (room_id, user_id) for lottery entries (upsert support)
-- First check if it exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'room_entries_room_id_user_id_key'
  ) THEN
    ALTER TABLE room_entries ADD CONSTRAINT room_entries_room_id_user_id_key UNIQUE (room_id, user_id);
  END IF;
END $$;

-- Step 6: Update the buy_room_entry function to use NULL for reveal_id
CREATE OR REPLACE FUNCTION buy_room_entry(
  p_room_id uuid,
  p_amount_cents integer,
  p_stripe_session_id text DEFAULT NULL,
  p_stripe_payment_intent_id text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_room rooms%ROWTYPE;
  v_entry_id uuid;
  v_tickets integer;
  v_new_balance bigint;
  v_funding_progress numeric;
BEGIN
  -- Get user id from parameter or auth context
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID required (either via parameter or authentication)';
  END IF;

  -- Get room and verify it's open
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.status != 'OPEN' THEN
    RAISE EXCEPTION 'Room is not open for entries';
  END IF;

  -- Calculate tickets (1 ticket per $1)
  v_tickets := (p_amount_cents / 100)::integer;
  IF v_tickets < 1 THEN
    RAISE EXCEPTION 'Minimum entry is $1';
  END IF;

  -- Create or update room entry for user (NULL reveal_id for lottery entries)
  INSERT INTO room_entries (room_id, user_id, reveal_id, stake_snapshot, amount_spent_cents, tickets, status, outcome)
  VALUES (
    p_room_id, 
    v_user_id, 
    NULL,  -- No reveal for lottery entries
    jsonb_build_object('entry_type', 'lottery', 'amount_cents', p_amount_cents),
    p_amount_cents,
    v_tickets,
    'STAKED',
    'PENDING'
  )
  ON CONFLICT (room_id, user_id) DO UPDATE SET
    amount_spent_cents = room_entries.amount_spent_cents + p_amount_cents,
    tickets = room_entries.tickets + v_tickets,
    stake_snapshot = jsonb_set(
      room_entries.stake_snapshot, 
      '{total_amount_cents}', 
      to_jsonb(room_entries.amount_spent_cents + p_amount_cents)
    )
  RETURNING id INTO v_entry_id;

  -- Record individual purchase
  INSERT INTO room_entry_purchases (room_id, user_id, entry_id, amount_cents, tickets_granted, stripe_session_id, stripe_payment_intent_id)
  VALUES (p_room_id, v_user_id, v_entry_id, p_amount_cents, v_tickets, p_stripe_session_id, p_stripe_payment_intent_id);

  -- Update room funding balance
  UPDATE rooms 
  SET escrow_balance_cents = escrow_balance_cents + p_amount_cents
  WHERE id = p_room_id
  RETURNING escrow_balance_cents INTO v_new_balance;

  -- Calculate funding progress
  v_funding_progress := CASE 
    WHEN v_room.funding_target_cents > 0 THEN 
      (v_new_balance::numeric / v_room.funding_target_cents::numeric) * 100
    ELSE 0 
  END;

  -- Check if room is now fully funded
  IF v_new_balance >= v_room.funding_target_cents THEN
    UPDATE rooms SET status = 'FUNDED' WHERE id = p_room_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'tickets_granted', v_tickets,
    'total_tickets', (SELECT tickets FROM room_entries WHERE id = v_entry_id),
    'funding_progress', round(v_funding_progress, 2),
    'room_status', (SELECT status FROM rooms WHERE id = p_room_id)
  );
END;
$$;-- Update get_room_leaderboard to include tickets and amount_spent_cents for lottery rooms
CREATE OR REPLACE FUNCTION public.get_room_leaderboard(p_room_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_room RECORD;
  v_leaderboard jsonb;
  v_my_entry jsonb;
  v_total_tickets bigint;
BEGIN
  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Calculate total tickets for lottery rooms
  SELECT COALESCE(SUM(tickets), 0) INTO v_total_tickets
  FROM room_entries 
  WHERE room_id = p_room_id AND status = 'STAKED';

  -- If room is OPEN or LOCKED, only return the calling user's entry (sealed)
  IF v_room.status IN ('OPEN', 'LOCKED') THEN
    -- Return only user's own entry (sealed leaderboard)
    SELECT jsonb_build_object(
      'rank', NULL,
      'entry_id', re.id,
      'user_id', re.user_id,
      'reveal_id', re.reveal_id,
      'priority_score', re.priority_score,
      'status', re.status,
      'stake_snapshot', re.stake_snapshot,
      'early_stake_bonus', re.early_stake_bonus,
      -- Add lottery-specific fields
      'tickets', re.tickets,
      'amount_spent_cents', re.amount_spent_cents
    ) INTO v_my_entry
    FROM room_entries re
    WHERE re.room_id = p_room_id AND re.user_id = v_user_id AND re.status = 'STAKED';

    -- For lottery rooms (OPEN status), also return participant list with tickets
    -- but hide priority scores to maintain fairness
    IF v_room.is_mystery = false THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'rank', NULL,
          'entry_id', re.id,
          'user_id', re.user_id,
          'tickets', re.tickets,
          'username', cp.username,
          'display_name', cp.display_name,
          'avatar_url', cp.avatar_url
        ) ORDER BY re.tickets DESC
      ) INTO v_leaderboard
      FROM room_entries re
      LEFT JOIN collector_profiles cp ON cp.user_id = re.user_id
      WHERE re.room_id = p_room_id AND re.status = 'STAKED';
    END IF;

    RETURN jsonb_build_object(
      'room', jsonb_build_object(
        'id', v_room.id,
        'tier', v_room.tier,
        'tier_cap_cents', v_room.tier_cap_cents,
        'category', v_room.category,
        'status', v_room.status,
        'start_at', v_room.start_at,
        'end_at', v_room.end_at,
        'lock_at', v_room.lock_at,
        'min_participants', v_room.min_participants,
        'max_participants', v_room.max_participants,
        'escrow_target_cents', v_room.escrow_target_cents,
        'escrow_balance_cents', v_room.escrow_balance_cents,
        'leaderboard_visibility', v_room.leaderboard_visibility,
        'participant_count', (SELECT COUNT(*) FROM room_entries WHERE room_id = p_room_id AND status = 'STAKED'),
        'is_mystery', v_room.is_mystery
      ),
      'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb),
      'my_entry', v_my_entry,
      'is_sealed', v_room.is_mystery,
      'total_tickets', v_total_tickets
    );
  END IF;

  -- Room is SETTLED or CLOSED - return full leaderboard
  SELECT jsonb_agg(
    jsonb_build_object(
      'rank', ranked.rank,
      'entry_id', ranked.id,
      'user_id', ranked.user_id,
      'reveal_id', ranked.reveal_id,
      'priority_score', ranked.priority_score,
      'status', ranked.status,
      'stake_snapshot', ranked.stake_snapshot,
      'percentile_band', ranked.percentile_band,
      'credits_awarded', ranked.credits_awarded,
      'packs_awarded', ranked.packs_awarded,
      'tickets', ranked.tickets,
      'amount_spent_cents', ranked.amount_spent_cents,
      'username', cp.username,
      'display_name', cp.display_name,
      'avatar_url', cp.avatar_url
    ) ORDER BY ranked.rank
  ) INTO v_leaderboard
  FROM (
    SELECT re.*, re.rank as rank
    FROM room_entries re
    WHERE re.room_id = p_room_id
    ORDER BY re.rank NULLS LAST, re.priority_score DESC
  ) ranked
  LEFT JOIN collector_profiles cp ON cp.user_id = ranked.user_id;

  RETURN jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id,
      'tier', v_room.tier,
      'tier_cap_cents', v_room.tier_cap_cents,
      'category', v_room.category,
      'status', v_room.status,
      'start_at', v_room.start_at,
      'end_at', v_room.end_at,
      'lock_at', v_room.lock_at,
      'min_participants', v_room.min_participants,
      'max_participants', v_room.max_participants,
      'escrow_target_cents', v_room.escrow_target_cents,
      'escrow_balance_cents', v_room.escrow_balance_cents,
      'winner_entry_id', v_room.winner_entry_id,
      'winner_user_id', v_room.winner_user_id,
      'leaderboard_visibility', v_room.leaderboard_visibility,
      'participant_count', (SELECT COUNT(*) FROM room_entries WHERE room_id = p_room_id),
      'is_mystery', v_room.is_mystery
    ),
    'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb),
    'is_sealed', false,
    'total_tickets', v_total_tickets
  );
END;
$function$;-- Drop and recreate get_active_rooms to include product information
DROP FUNCTION IF EXISTS public.get_active_rooms(text);

CREATE FUNCTION public.get_active_rooms(p_tier text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'rooms', COALESCE(jsonb_agg(room_data), '[]'::jsonb)
  )
  INTO v_result
  FROM (
    SELECT 
      jsonb_build_object(
        'id', r.id,
        'tier', r.tier,
        'tier_cap_cents', r.tier_cap_cents,
        'category', r.category,
        'status', r.status,
        'start_at', r.start_at,
        'end_at', r.end_at,
        'lock_at', r.lock_at,
        'deadline_at', r.deadline_at,
        'min_participants', r.min_participants,
        'max_participants', r.max_participants,
        'escrow_target_cents', r.escrow_target_cents,
        'escrow_balance_cents', r.escrow_balance_cents,
        'funding_target_cents', r.funding_target_cents,
        'reward_budget_cents', r.reward_budget_cents,
        'leaderboard_visibility', r.leaderboard_visibility,
        'is_mystery', r.is_mystery,
        'product_class_id', r.product_class_id,
        'mystery_product_id', r.mystery_product_id,
        'participant_count', (
          SELECT COUNT(DISTINCT re.user_id)
          FROM room_entries re
          WHERE re.room_id = r.id AND re.status = 'STAKED'
        ),
        'total_tickets', (
          SELECT COALESCE(SUM(re.tickets), 0)
          FROM room_entries re
          WHERE re.room_id = r.id AND re.status = 'STAKED'
        ),
        'created_at', r.created_at,
        'product', CASE 
          WHEN pc.id IS NOT NULL THEN jsonb_build_object(
            'id', pc.id,
            'name', pc.name,
            'brand', pc.brand,
            'model', pc.model,
            'category', pc.category::text,
            'retail_value_usd', pc.retail_value_usd,
            'image_url', pc.image_url,
            'band', pc.band::text
          )
          ELSE NULL
        END
      ) as room_data
    FROM rooms r
    LEFT JOIN product_classes pc ON r.product_class_id = pc.id
    WHERE r.status IN ('OPEN', 'ACTIVE')
      AND (p_tier IS NULL OR r.tier = p_tier)
    ORDER BY r.created_at DESC
  ) subq;

  RETURN v_result;
END;
$$;-- Refactor get_active_rooms for cleaner structure and maintainability
DROP FUNCTION IF EXISTS public.get_active_rooms(text);

CREATE FUNCTION public.get_active_rooms(p_tier text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Use CTEs for clean separation of concerns
  WITH 
    -- CTE 1: Calculate room statistics from entries
    room_stats AS (
      SELECT 
        re.room_id,
        COUNT(DISTINCT re.user_id) AS participant_count,
        COALESCE(SUM(re.tickets), 0) AS total_tickets
      FROM room_entries re
      WHERE re.status = 'STAKED'
      GROUP BY re.room_id
    ),
    
    -- CTE 2: Build product JSON for non-mystery rooms
    product_data AS (
      SELECT 
        pc.id,
        jsonb_build_object(
          'id', pc.id,
          'name', pc.name,
          'brand', pc.brand,
          'model', pc.model,
          'category', pc.category::text,
          'retail_value_usd', pc.retail_value_usd,
          'image_url', pc.image_url,
          'band', pc.band::text
        ) AS product_json
      FROM product_classes pc
      WHERE pc.is_active = true
    ),
    
    -- CTE 3: Combine rooms with stats and product data
    enriched_rooms AS (
      SELECT 
        -- Core room fields
        r.id,
        r.tier,
        r.tier_cap_cents,
        r.category,
        r.status,
        r.start_at,
        r.end_at,
        r.lock_at,
        r.deadline_at,
        r.min_participants,
        r.max_participants,
        r.escrow_target_cents,
        r.escrow_balance_cents,
        r.funding_target_cents,
        r.reward_budget_cents,
        r.leaderboard_visibility,
        r.is_mystery,
        r.product_class_id,
        r.mystery_product_id,
        r.created_at,
        -- Computed stats (default to 0 if no entries)
        COALESCE(rs.participant_count, 0) AS participant_count,
        COALESCE(rs.total_tickets, 0) AS total_tickets,
        -- Product data (null for mystery rooms)
        pd.product_json AS product
      FROM rooms r
      LEFT JOIN room_stats rs ON rs.room_id = r.id
      LEFT JOIN product_data pd ON pd.id = r.product_class_id
      WHERE r.status IN ('OPEN', 'ACTIVE')
        AND (p_tier IS NULL OR r.tier = p_tier)
      ORDER BY r.created_at DESC
    )
  
  -- Build final response
  SELECT jsonb_build_object(
    'rooms', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', er.id,
          'tier', er.tier,
          'tier_cap_cents', er.tier_cap_cents,
          'category', er.category,
          'status', er.status,
          'start_at', er.start_at,
          'end_at', er.end_at,
          'lock_at', er.lock_at,
          'deadline_at', er.deadline_at,
          'min_participants', er.min_participants,
          'max_participants', er.max_participants,
          'escrow_target_cents', er.escrow_target_cents,
          'escrow_balance_cents', er.escrow_balance_cents,
          'funding_target_cents', er.funding_target_cents,
          'reward_budget_cents', er.reward_budget_cents,
          'leaderboard_visibility', er.leaderboard_visibility,
          'is_mystery', er.is_mystery,
          'product_class_id', er.product_class_id,
          'mystery_product_id', er.mystery_product_id,
          'created_at', er.created_at,
          'participant_count', er.participant_count,
          'total_tickets', er.total_tickets,
          'product', er.product
        )
      ),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM enriched_rooms er;

  RETURN v_result;
END;
$$;

-- Add function comment for documentation
COMMENT ON FUNCTION public.get_active_rooms(text) IS 
'Fetches active lottery rooms with product info and participation stats.
Parameters:
  - p_tier: Optional tier filter (ICON, RARE, GRAIL, MYTHIC)
Returns:
  - JSON object with rooms array containing room details, product info, and stats';-- Drop existing function and recreate with correct structure
DROP FUNCTION IF EXISTS public.get_room_entry_by_session(TEXT);

CREATE FUNCTION public.get_room_entry_by_session(p_session_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_purchase RECORD;
  v_room RECORD;
  v_product RECORD;
  v_user_total_tickets INT;
  v_total_room_tickets INT;
BEGIN
  -- Find the purchase by stripe_session_id
  SELECT rep.*, re.tickets, re.user_id, re.id as entry_id
  INTO v_purchase
  FROM room_entry_purchases rep
  JOIN room_entries re ON re.id = rep.entry_id
  WHERE rep.stripe_session_id = p_session_id
  ORDER BY rep.created_at DESC
  LIMIT 1;

  IF v_purchase IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Purchase not found');
  END IF;

  -- Get room details
  SELECT r.id, r.tier, r.status, r.start_at, r.end_at, r.deadline_at,
         r.escrow_balance_cents, r.escrow_target_cents, r.funding_target_cents,
         r.tier_cap_cents, r.max_participants, r.min_participants,
         r.is_mystery, r.category, r.product_class_id, r.mystery_product_id
  INTO v_room
  FROM rooms r
  WHERE r.id = v_purchase.room_id;

  IF v_room IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Room not found');
  END IF;

  -- Get product details (use mystery_product_id if is_mystery, otherwise product_class_id)
  SELECT pc.id, pc.name, pc.brand, pc.model, pc.image_url, 
         pc.retail_value_usd, pc.category::text, pc.band::text
  INTO v_product
  FROM product_classes pc
  WHERE pc.id = COALESCE(
    CASE WHEN v_room.is_mystery THEN v_room.mystery_product_id ELSE v_room.product_class_id END,
    v_room.product_class_id
  );

  -- Calculate user's total tickets in this room
  SELECT COALESCE(SUM(re.tickets), 0)
  INTO v_user_total_tickets
  FROM room_entries re
  WHERE re.room_id = v_purchase.room_id
    AND re.user_id = v_purchase.user_id;

  -- Calculate total tickets in room
  SELECT COALESCE(SUM(re.tickets), 0)
  INTO v_total_room_tickets
  FROM room_entries re
  WHERE re.room_id = v_purchase.room_id;

  -- Build and return the result
  v_result := json_build_object(
    'success', true,
    'room_id', v_room.id,
    'room', json_build_object(
      'id', v_room.id,
      'tier', v_room.tier,
      'status', v_room.status,
      'start_at', v_room.start_at,
      'end_at', v_room.end_at,
      'deadline_at', v_room.deadline_at,
      'escrow_balance_cents', v_room.escrow_balance_cents,
      'escrow_target_cents', v_room.escrow_target_cents,
      'funding_target_cents', v_room.funding_target_cents,
      'tier_cap_cents', v_room.tier_cap_cents,
      'max_participants', v_room.max_participants,
      'min_participants', v_room.min_participants,
      'is_mystery', v_room.is_mystery,
      'category', v_room.category
    ),
    'product', CASE 
      WHEN v_product IS NOT NULL THEN json_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'brand', v_product.brand,
        'model', v_product.model,
        'image_url', v_product.image_url,
        'retail_value_usd', v_product.retail_value_usd,
        'category', v_product.category,
        'band', v_product.band
      )
      ELSE NULL
    END,
    'tickets_purchased', v_purchase.tickets_granted,
    'user_total_tickets', v_user_total_tickets,
    'total_room_tickets', v_total_room_tickets,
    'amount_cents', v_purchase.amount_cents
  );

  RETURN v_result;
END;
$$;-- Refactor get_room_entry_by_session to use clean CTE structure
DROP FUNCTION IF EXISTS public.get_room_entry_by_session(TEXT);

CREATE FUNCTION public.get_room_entry_by_session(p_session_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    WITH purchase_data AS (
      -- Find purchase by stripe_session_id
      SELECT 
        rep.id AS purchase_id,
        rep.room_id,
        rep.user_id,
        rep.amount_cents,
        rep.tickets_granted,
        rep.entry_id
      FROM room_entry_purchases rep
      WHERE rep.stripe_session_id = p_session_id
      ORDER BY rep.created_at DESC
      LIMIT 1
    ),
    room_data AS (
      -- Get room details with all fields
      SELECT 
        r.id,
        r.tier,
        r.status,
        r.start_at,
        r.end_at,
        r.deadline_at,
        r.escrow_balance_cents,
        r.escrow_target_cents,
        r.funding_target_cents,
        r.tier_cap_cents,
        r.max_participants,
        r.min_participants,
        r.is_mystery,
        r.category,
        r.product_class_id,
        r.mystery_product_id
      FROM rooms r
      WHERE r.id = (SELECT room_id FROM purchase_data)
    ),
    product_data AS (
      -- Get product from product_classes
      SELECT 
        pc.id,
        pc.name,
        pc.brand,
        pc.model,
        pc.image_url,
        pc.retail_value_usd,
        pc.category::text AS category,
        pc.band::text AS band
      FROM product_classes pc
      WHERE pc.id = COALESCE(
        (SELECT CASE WHEN rd.is_mystery THEN rd.mystery_product_id ELSE rd.product_class_id END FROM room_data rd),
        (SELECT product_class_id FROM room_data)
      )
    ),
    user_ticket_stats AS (
      -- Calculate user's total tickets in this room
      SELECT COALESCE(SUM(re.tickets), 0)::int AS user_total_tickets
      FROM room_entries re
      WHERE re.room_id = (SELECT room_id FROM purchase_data)
        AND re.user_id = (SELECT user_id FROM purchase_data)
    ),
    room_ticket_stats AS (
      -- Calculate total tickets in room
      SELECT COALESCE(SUM(re.tickets), 0)::int AS total_room_tickets
      FROM room_entries re
      WHERE re.room_id = (SELECT room_id FROM purchase_data)
    )
    SELECT 
      CASE 
        WHEN pd.purchase_id IS NULL THEN 
          json_build_object('success', false, 'error', 'Purchase not found')
        WHEN rd.id IS NULL THEN 
          json_build_object('success', false, 'error', 'Room not found')
        ELSE
          json_build_object(
            'success', true,
            'room_id', rd.id,
            'room', json_build_object(
              'id', rd.id,
              'tier', rd.tier,
              'status', rd.status,
              'start_at', rd.start_at,
              'end_at', rd.end_at,
              'deadline_at', rd.deadline_at,
              'escrow_balance_cents', rd.escrow_balance_cents,
              'escrow_target_cents', rd.escrow_target_cents,
              'funding_target_cents', rd.funding_target_cents,
              'tier_cap_cents', rd.tier_cap_cents,
              'max_participants', rd.max_participants,
              'min_participants', rd.min_participants,
              'is_mystery', rd.is_mystery,
              'category', rd.category
            ),
            'product', CASE 
              WHEN prd.id IS NOT NULL THEN json_build_object(
                'id', prd.id,
                'name', prd.name,
                'brand', prd.brand,
                'model', prd.model,
                'image_url', prd.image_url,
                'retail_value_usd', prd.retail_value_usd,
                'category', prd.category,
                'band', prd.band
              )
              ELSE NULL
            END,
            'tickets_purchased', pd.tickets_granted,
            'user_total_tickets', uts.user_total_tickets,
            'total_room_tickets', rts.total_room_tickets,
            'amount_cents', pd.amount_cents
          )
      END
    FROM purchase_data pd
    LEFT JOIN room_data rd ON true
    LEFT JOIN product_data prd ON true
    LEFT JOIN user_ticket_stats uts ON true
    LEFT JOIN room_ticket_stats rts ON true
  );
END;
$$;-- Drop existing policy
DROP POLICY IF EXISTS "Anyone can read active product classes" ON product_classes;

-- Create new policy that allows reading active products OR products the user has reveals for
CREATE POLICY "Users can read product classes for their reveals"
ON product_classes
FOR SELECT
USING (
  is_active = true 
  OR EXISTS (
    SELECT 1 FROM reveals 
    WHERE reveals.product_class_id = product_classes.id 
    AND reveals.user_id = auth.uid()
  )
);-- Phase 6: Economy Model Update - Winner Settlement & Loser Credit Pool
-- Updates the lottery room settlement to implement the new economy rules:
-- 1. Winner's redeem_credits_cents for that product resets to 0
-- 2. Loser pool = 10% of product value, distributed pro-rata by spend
-- 3. Room expiry: 98% cash refund (2% platform fee)

-- 1. Updated draw_room_winner with loser credit pool distribution
CREATE OR REPLACE FUNCTION public.draw_room_winner(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_product product_classes%ROWTYPE;
  v_total_tickets integer;
  v_total_spent_cents bigint;
  v_winning_ticket integer;
  v_running_total integer := 0;
  v_winner_entry room_entries%ROWTYPE;
  v_random_seed text;
  v_entry RECORD;
  v_loser_pool_cents bigint;
  v_credits_for_loser integer;
  v_loser_results jsonb := '[]'::jsonb;
BEGIN
  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.status != 'FUNDED' THEN
    RAISE EXCEPTION 'Room must be fully funded to draw winner';
  END IF;

  -- Get product info for loser pool calculation
  SELECT * INTO v_product FROM product_classes WHERE id = v_room.product_class_id;
  IF v_product IS NULL THEN
    RAISE EXCEPTION 'Product not found for room';
  END IF;

  -- Update status to DRAWING
  UPDATE rooms SET status = 'DRAWING' WHERE id = p_room_id;

  -- Get total tickets and total spent
  SELECT COALESCE(SUM(tickets), 0), COALESCE(SUM(amount_spent_cents), 0) 
  INTO v_total_tickets, v_total_spent_cents
  FROM room_entries WHERE room_id = p_room_id AND outcome = 'PENDING';

  IF v_total_tickets = 0 THEN
    RAISE EXCEPTION 'No tickets in room';
  END IF;

  -- Generate random winning ticket number (1 to total_tickets)
  v_random_seed := gen_random_uuid()::text;
  v_winning_ticket := floor(random() * v_total_tickets)::integer + 1;

  -- Find winner by iterating through entries
  FOR v_entry IN 
    SELECT * FROM room_entries 
    WHERE room_id = p_room_id AND outcome = 'PENDING'
    ORDER BY staked_at
  LOOP
    v_running_total := v_running_total + v_entry.tickets;
    IF v_running_total >= v_winning_ticket THEN
      SELECT * INTO v_winner_entry FROM room_entries WHERE id = v_entry.id;
      EXIT;
    END IF;
  END LOOP;

  IF v_winner_entry.id IS NULL THEN
    RAISE EXCEPTION 'Failed to select winner';
  END IF;

  -- Record the draw
  INSERT INTO lottery_draws (room_id, winner_entry_id, winner_user_id, total_tickets, winning_ticket_number, random_seed)
  VALUES (p_room_id, v_winner_entry.id, v_winner_entry.user_id, v_total_tickets, v_winning_ticket, v_random_seed);

  -- Update winner entry
  UPDATE room_entries SET outcome = 'WON' WHERE id = v_winner_entry.id;

  -- WINNER: Reset their redeem_credits_cents for this product to 0
  -- This represents them "cashing in" their credits for the product
  UPDATE reveals 
  SET redeem_credits_cents = 0
  WHERE user_id = v_winner_entry.user_id 
    AND product_class_id = v_room.product_class_id;

  -- Calculate loser pool: 10% of product retail value (in cents)
  v_loser_pool_cents := (v_product.retail_value_usd * 100 * 0.10)::bigint;

  -- Distribute loser credits pro-rata to non-winners
  -- Credits = (user_spent / total_spent_by_losers) * loser_pool
  FOR v_entry IN 
    SELECT re.*, 
           (v_total_spent_cents - v_winner_entry.amount_spent_cents) as total_loser_spent
    FROM room_entries re
    WHERE re.room_id = p_room_id 
      AND re.outcome = 'PENDING' 
      AND re.id != v_winner_entry.id
  LOOP
    -- Calculate pro-rata credits for this loser
    IF v_entry.total_loser_spent > 0 THEN
      v_credits_for_loser := FLOOR(
        (v_entry.amount_spent_cents::numeric / v_entry.total_loser_spent::numeric) * v_loser_pool_cents
      )::integer;
    ELSE
      v_credits_for_loser := 0;
    END IF;

    -- Add credits to user's universal credits (stored as cents, 1 credit = 1 cent = $0.01)
    INSERT INTO user_universal_credits (user_id, credits)
    VALUES (v_entry.user_id, v_credits_for_loser)
    ON CONFLICT (user_id) DO UPDATE SET
      credits = user_universal_credits.credits + v_credits_for_loser,
      updated_at = now();

    -- Update entry with credits awarded and mark as lost
    UPDATE room_entries 
    SET outcome = 'LOST',
        credits_awarded = v_credits_for_loser
    WHERE id = v_entry.id;

    -- Track loser results
    v_loser_results := v_loser_results || jsonb_build_object(
      'user_id', v_entry.user_id,
      'spent_cents', v_entry.amount_spent_cents,
      'credits_awarded', v_credits_for_loser
    );

    -- Notify loser about their credits
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      v_entry.user_id,
      'room_loss_credits',
      'Room Ended - Credits Earned',
      format('You earned %s Vault Credits from the lottery room', v_credits_for_loser),
      jsonb_build_object(
        'room_id', p_room_id, 
        'credits_awarded', v_credits_for_loser,
        'spent_cents', v_entry.amount_spent_cents
      )
    );
  END LOOP;

  -- Update room with winner
  UPDATE rooms SET 
    status = 'SETTLED',
    winner_entry_id = v_winner_entry.id,
    winner_user_id = v_winner_entry.user_id
  WHERE id = p_room_id;

  -- Create notification for winner
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    v_winner_entry.user_id,
    'room_win',
    'Congratulations - You Won!',
    format('You won the %s! Your entry has been converted to the product.', v_product.name),
    jsonb_build_object(
      'room_id', p_room_id, 
      'product_id', v_product.id,
      'product_name', v_product.name,
      'tickets', v_winner_entry.tickets, 
      'total_tickets', v_total_tickets
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'winner_entry_id', v_winner_entry.id,
    'winner_user_id', v_winner_entry.user_id,
    'winning_ticket', v_winning_ticket,
    'total_tickets', v_total_tickets,
    'winner_tickets', v_winner_entry.tickets,
    'win_probability', round((v_winner_entry.tickets::numeric / v_total_tickets::numeric) * 100, 2),
    'loser_pool_cents', v_loser_pool_cents,
    'loser_results', v_loser_results
  );
END;
$$;

-- 2. Add LOST as valid outcome for room_entries
ALTER TABLE public.room_entries DROP CONSTRAINT IF EXISTS room_entries_outcome_check;
ALTER TABLE public.room_entries ADD CONSTRAINT room_entries_outcome_check 
CHECK (outcome IN ('PENDING', 'WON', 'LOST', 'REFUNDED', 'CONVERTED'));

-- 3. Updated request_room_refund with 98% refund (2% platform fee)
-- The actual refund amount calculation happens in the edge function
-- This RPC just marks the entry for processing
CREATE OR REPLACE FUNCTION public.request_room_refund(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_entry room_entries%ROWTYPE;
  v_room rooms%ROWTYPE;
  v_refund_amount_cents bigint;
  v_platform_fee_cents bigint;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.status NOT IN ('EXPIRED', 'REFUNDING') THEN
    RAISE EXCEPTION 'Refunds only available for expired rooms';
  END IF;

  -- Get user's entry
  SELECT * INTO v_entry FROM room_entries 
  WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
  
  IF v_entry IS NULL THEN
    RAISE EXCEPTION 'No entry found for this room';
  END IF;
  IF v_entry.outcome != 'PENDING' THEN
    RAISE EXCEPTION 'Entry already processed';
  END IF;

  -- Calculate 98% refund (2% platform fee)
  v_platform_fee_cents := FLOOR(v_entry.amount_spent_cents * 0.02);
  v_refund_amount_cents := v_entry.amount_spent_cents - v_platform_fee_cents;

  -- Mark as refunded (actual refund handled by edge function)
  UPDATE room_entries 
  SET outcome = 'REFUNDED',
      credits_awarded = 0  -- No credits minted for expired rooms
  WHERE id = v_entry.id;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry.id,
    'original_amount_cents', v_entry.amount_spent_cents,
    'refund_amount_cents', v_refund_amount_cents,
    'platform_fee_cents', v_platform_fee_cents,
    'platform_fee_percent', 2,
    'message', 'Refund request submitted. 98% of funds will be returned to your original payment method.'
  );
END;
$$;

-- 4. Add comment to document the economy model
COMMENT ON FUNCTION public.draw_room_winner IS 
'Lottery room winner selection with economy model v2:
- Winner receives product, their redeem_credits_cents for that product resets to 0
- Loser pool = 10% of product retail value, distributed as Vault Credits pro-rata by spend
- 1 Vault Credit = 1 cent = $0.01';

COMMENT ON FUNCTION public.request_room_refund IS
'Room refund request for expired/unfunded rooms:
- 98% cash refund via Stripe
- 2% platform fee retained
- No Vault Credits minted for expired rooms';-- Phase 1: Add VC → Entries Conversion
-- 1.1 Create audit table for credit-based entry purchases

CREATE TABLE public.room_entry_credit_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  user_id UUID NOT NULL,
  entry_id UUID REFERENCES public.room_entries(id),
  credits_spent INTEGER NOT NULL,
  entries_granted INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_entry_credit_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own credit purchases
CREATE POLICY "Users can view their own credit purchases"
  ON public.room_entry_credit_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_room_entry_credit_purchases_room_id ON public.room_entry_credit_purchases(room_id);
CREATE INDEX idx_room_entry_credit_purchases_user_id ON public.room_entry_credit_purchases(user_id);

-- 1.2 Create buy_entries_with_credits RPC
-- Conversion rate: 100 VC = 1 Entry (1 VC = $0.01, 1 Entry = $1)

CREATE OR REPLACE FUNCTION public.buy_entries_with_credits(
  p_room_id UUID,
  p_credits_to_spend INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_room RECORD;
  v_current_credits INTEGER;
  v_entries_to_grant INTEGER;
  v_entry_id UUID;
  v_existing_entry RECORD;
  v_result JSON;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate credits amount (minimum 100 VC = 1 entry)
  IF p_credits_to_spend < 100 THEN
    RETURN json_build_object('success', false, 'error', 'Minimum 100 Vault Credits required (= 1 entry)');
  END IF;

  -- Calculate entries: 100 VC = 1 Entry
  v_entries_to_grant := p_credits_to_spend / 100;
  
  -- If user tries to spend 150, they get 1 entry (we only use multiples of 100)
  -- Adjust credits_to_spend to actual amount used
  p_credits_to_spend := v_entries_to_grant * 100;

  -- Get room and validate it's open
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Room not found');
  END IF;

  IF v_room.status != 'OPEN' THEN
    RETURN json_build_object('success', false, 'error', 'Room is not open for entries');
  END IF;

  -- Check if room is past deadline
  IF v_room.deadline_at IS NOT NULL AND v_room.deadline_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Room entry deadline has passed');
  END IF;

  -- Get user's current credits
  SELECT credits INTO v_current_credits
  FROM user_universal_credits
  WHERE user_id = v_user_id;

  IF NOT FOUND OR v_current_credits < p_credits_to_spend THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient Vault Credits');
  END IF;

  -- Deduct credits from user
  UPDATE user_universal_credits
  SET credits = credits - p_credits_to_spend,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Check if user already has an entry in this room
  SELECT * INTO v_existing_entry
  FROM room_entries
  WHERE room_id = p_room_id AND user_id = v_user_id;

  IF FOUND THEN
    -- Update existing entry with more tickets
    UPDATE room_entries
    SET tickets = tickets + v_entries_to_grant
    WHERE id = v_existing_entry.id
    RETURNING id INTO v_entry_id;
  ELSE
    -- Create new entry
    INSERT INTO room_entries (
      room_id,
      user_id,
      tickets,
      stake_snapshot,
      status,
      outcome
    ) VALUES (
      p_room_id,
      v_user_id,
      v_entries_to_grant,
      '{}'::jsonb,
      'ACTIVE',
      'PENDING'
    )
    RETURNING id INTO v_entry_id;
  END IF;

  -- Record the credit purchase for audit
  INSERT INTO room_entry_credit_purchases (
    room_id,
    user_id,
    entry_id,
    credits_spent,
    entries_granted
  ) VALUES (
    p_room_id,
    v_user_id,
    v_entry_id,
    p_credits_to_spend,
    v_entries_to_grant
  );

  -- Update room escrow balance (convert VC to cents: 1 VC = 1 cent)
  UPDATE rooms
  SET escrow_balance_cents = escrow_balance_cents + p_credits_to_spend
  WHERE id = p_room_id;

  -- Build result
  v_result := json_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'credits_spent', p_credits_to_spend,
    'entries_granted', v_entries_to_grant,
    'new_total_entries', (SELECT tickets FROM room_entries WHERE id = v_entry_id),
    'remaining_credits', v_current_credits - p_credits_to_spend
  );

  RETURN v_result;
END;
$$;-- Phase 6: Provably Fair Draw Implementation (Fixed)
-- Drop existing function first to change return type

-- Add new columns for provably fair verification
ALTER TABLE public.lottery_draws 
ADD COLUMN IF NOT EXISTS seed_commitment TEXT,
ADD COLUMN IF NOT EXISTS server_seed TEXT,
ADD COLUMN IF NOT EXISTS client_seed TEXT,
ADD COLUMN IF NOT EXISTS nonce INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_hash TEXT;

-- Add index for verification lookups
CREATE INDEX IF NOT EXISTS idx_lottery_draws_verification 
ON public.lottery_draws(verification_hash) 
WHERE verification_hash IS NOT NULL;

-- Drop existing function to change return type
DROP FUNCTION IF EXISTS public.draw_room_winner(UUID);

-- Recreate draw_room_winner with provably fair mechanics
CREATE FUNCTION public.draw_room_winner(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room RECORD;
  v_total_tickets INTEGER;
  v_winning_ticket INTEGER;
  v_winner_entry RECORD;
  v_server_seed TEXT;
  v_client_seed TEXT;
  v_combined_seed TEXT;
  v_verification_hash TEXT;
  v_draw_id UUID;
BEGIN
  -- Lock and fetch room
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Room not found');
  END IF;

  -- Only draw for FUNDED rooms
  IF v_room.status != 'FUNDED' THEN
    RETURN json_build_object('success', false, 'error', 'Room is not in FUNDED status');
  END IF;

  -- Calculate total tickets
  SELECT COALESCE(SUM(tickets), 0) INTO v_total_tickets
  FROM room_entries
  WHERE room_id = p_room_id AND status = 'ACTIVE';

  IF v_total_tickets = 0 THEN
    UPDATE rooms SET status = 'EXPIRED' WHERE id = p_room_id;
    RETURN json_build_object('success', false, 'error', 'No active entries');
  END IF;

  -- Generate provably fair seeds
  v_server_seed := encode(gen_random_bytes(32), 'hex');
  
  v_client_seed := encode(
    sha256(
      (p_room_id::text || v_room.created_at::text || v_total_tickets::text || v_room.escrow_balance_cents::text)::bytea
    ), 
    'hex'
  );
  
  v_combined_seed := encode(
    sha256((v_server_seed || v_client_seed || '0')::bytea),
    'hex'
  );
  
  v_verification_hash := encode(sha256(v_server_seed::bytea), 'hex');
  
  v_winning_ticket := 1 + (('x' || substring(v_combined_seed from 1 for 8))::bit(32)::bigint % v_total_tickets);

  -- Find winner by ticket range
  WITH ticket_ranges AS (
    SELECT 
      id,
      user_id,
      reveal_id,
      tickets,
      SUM(tickets) OVER (ORDER BY staked_at, id) AS upper_bound,
      SUM(tickets) OVER (ORDER BY staked_at, id) - tickets + 1 AS lower_bound
    FROM room_entries
    WHERE room_id = p_room_id AND status = 'ACTIVE'
  )
  SELECT * INTO v_winner_entry
  FROM ticket_ranges
  WHERE v_winning_ticket BETWEEN lower_bound AND upper_bound
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Could not determine winner');
  END IF;

  -- Record the draw
  INSERT INTO lottery_draws (
    room_id, winner_entry_id, winner_user_id, total_tickets,
    winning_ticket_number, random_seed, server_seed, client_seed,
    nonce, verification_hash
  ) VALUES (
    p_room_id, v_winner_entry.id, v_winner_entry.user_id, v_total_tickets,
    v_winning_ticket, v_combined_seed, v_server_seed, v_client_seed,
    0, v_verification_hash
  )
  RETURNING id INTO v_draw_id;

  -- Update room
  UPDATE rooms
  SET status = 'SETTLED', winner_user_id = v_winner_entry.user_id, winner_entry_id = v_winner_entry.id
  WHERE id = p_room_id;

  -- Mark winner
  UPDATE room_entries
  SET status = 'WON', outcome = 'WON', rank = 1
  WHERE id = v_winner_entry.id;

  -- Mark losers
  UPDATE room_entries
  SET status = 'LOST', outcome = 'LOST'
  WHERE room_id = p_room_id AND id != v_winner_entry.id AND status = 'ACTIVE';

  RETURN json_build_object(
    'success', true,
    'draw_id', v_draw_id,
    'winner_user_id', v_winner_entry.user_id,
    'winner_entry_id', v_winner_entry.id,
    'total_tickets', v_total_tickets,
    'winning_ticket', v_winning_ticket,
    'verification_hash', v_verification_hash
  );
END;
$$;

-- Create verification function
CREATE OR REPLACE FUNCTION public.verify_lottery_draw(p_draw_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draw RECORD;
  v_computed_seed TEXT;
  v_computed_ticket INTEGER;
  v_is_valid BOOLEAN;
BEGIN
  SELECT * INTO v_draw FROM lottery_draws WHERE id = p_draw_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Draw not found');
  END IF;

  IF v_draw.server_seed IS NOT NULL AND v_draw.client_seed IS NOT NULL THEN
    v_computed_seed := encode(
      sha256((v_draw.server_seed || v_draw.client_seed || COALESCE(v_draw.nonce, 0)::text)::bytea),
      'hex'
    );
    v_computed_ticket := 1 + (('x' || substring(v_computed_seed from 1 for 8))::bit(32)::bigint % v_draw.total_tickets);
    v_is_valid := (v_computed_ticket = v_draw.winning_ticket_number);
  ELSE
    v_is_valid := false;
  END IF;

  RETURN json_build_object(
    'success', true,
    'draw_id', v_draw.id,
    'room_id', v_draw.room_id,
    'is_valid', v_is_valid,
    'total_tickets', v_draw.total_tickets,
    'winning_ticket', v_draw.winning_ticket_number,
    'drawn_at', v_draw.drawn_at,
    'server_seed', v_draw.server_seed,
    'client_seed', v_draw.client_seed,
    'verification_hash', v_draw.verification_hash
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_lottery_draw(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_lottery_draw(UUID) TO anon;-- Phase 1: Add product metadata columns to product_classes
-- 1.1 Add description column (nullable TEXT)
ALTER TABLE public.product_classes 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 1.2 Add traits column (TEXT array with empty default)
ALTER TABLE public.product_classes 
ADD COLUMN IF NOT EXISTS traits TEXT[] DEFAULT '{}';-- =============================================
-- Phase 2: Settings Database Schema
-- =============================================

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2.1 Create user_notification_settings table
CREATE TABLE public.user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  -- Master toggles
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  -- Granular notification types
  notify_gifts BOOLEAN NOT NULL DEFAULT true,
  notify_swaps BOOLEAN NOT NULL DEFAULT true,
  notify_battles BOOLEAN NOT NULL DEFAULT true,
  notify_rooms BOOLEAN NOT NULL DEFAULT true,
  notify_rewards BOOLEAN NOT NULL DEFAULT true,
  notify_marketing BOOLEAN NOT NULL DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Constraints
  CONSTRAINT user_notification_settings_user_id_unique UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_notification_settings
CREATE POLICY "Users can view their own notification settings"
ON public.user_notification_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
ON public.user_notification_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
ON public.user_notification_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- 2.2 Create kyc_documents table
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('government_id', 'proof_of_address', 'selfie')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  expires_at DATE
);

-- Enable RLS
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kyc_documents
CREATE POLICY "Users can view their own KYC documents"
ON public.kyc_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC documents"
ON public.kyc_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending KYC documents"
ON public.kyc_documents
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can delete their own pending KYC documents"
ON public.kyc_documents
FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- 2.3 Create user_sessions table (for security section)
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  user_agent TEXT,
  is_current BOOLEAN NOT NULL DEFAULT false,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.user_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- Triggers for updated_at timestamps
-- =============================================

-- Trigger for user_notification_settings
CREATE TRIGGER update_user_notification_settings_updated_at
BEFORE UPDATE ON public.user_notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Indexes for performance
-- =============================================

CREATE INDEX idx_user_notification_settings_user_id ON public.user_notification_settings(user_id);
CREATE INDEX idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX idx_kyc_documents_status ON public.kyc_documents(status);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_active ON public.user_sessions(last_active_at DESC);-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- RLS Policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);-- Create kyc-documents storage bucket (private - not public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents', 
  'kyc-documents', 
  false,  -- Private bucket for sensitive documents
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- RLS Policies for kyc-documents bucket
-- Users can only access their own documents
CREATE POLICY "Users can view their own KYC documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own KYC documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- Update buy_room_entry to create a reveal/card when purchasing room entry
-- The card will be visible in vault with 'staked' state (locked/in play)

CREATE OR REPLACE FUNCTION public.buy_room_entry(
  p_room_id uuid, 
  p_amount_cents bigint, 
  p_stripe_session_id text DEFAULT NULL::text, 
  p_stripe_payment_intent_id text DEFAULT NULL::text, 
  p_user_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_room rooms%ROWTYPE;
  v_product product_classes%ROWTYPE;
  v_entry_id uuid;
  v_reveal_id uuid;
  v_tickets integer;
  v_new_balance bigint;
  v_funding_progress numeric;
  v_serial text;
  v_existing_entry room_entries%ROWTYPE;
BEGIN
  -- Get user id from parameter or auth context
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID required (either via parameter or authentication)';
  END IF;

  -- Get room and verify it's open
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.status != 'OPEN' THEN
    RAISE EXCEPTION 'Room is not open for entries';
  END IF;
  IF v_room.product_class_id IS NULL THEN
    RAISE EXCEPTION 'Room has no product configured';
  END IF;

  -- Get product details for the reveal
  SELECT * INTO v_product FROM product_classes WHERE id = v_room.product_class_id;
  IF v_product IS NULL THEN
    RAISE EXCEPTION 'Room product not found';
  END IF;

  -- Calculate tickets (1 ticket per $1)
  v_tickets := (p_amount_cents / 100)::integer;
  IF v_tickets < 1 THEN
    RAISE EXCEPTION 'Minimum entry is $1';
  END IF;

  -- Check if user already has an entry in this room
  SELECT * INTO v_existing_entry 
  FROM room_entries 
  WHERE room_id = p_room_id AND user_id = v_user_id;

  IF v_existing_entry IS NOT NULL THEN
    -- User already has entry - just add more tickets (no new card needed)
    UPDATE room_entries SET
      amount_spent_cents = amount_spent_cents + p_amount_cents,
      tickets = tickets + v_tickets,
      stake_snapshot = jsonb_set(
        stake_snapshot, 
        '{total_amount_cents}', 
        to_jsonb(amount_spent_cents + p_amount_cents)
      )
    WHERE id = v_existing_entry.id
    RETURNING id INTO v_entry_id;
    
    v_reveal_id := v_existing_entry.reveal_id;
  ELSE
    -- First entry for this user - create a reveal/card
    -- Generate unique serial number for this card
    v_serial := 'RM-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);

    -- Create the reveal (card) with staked state
    INSERT INTO reveals (
      user_id,
      product_class_id,
      band,
      serial_number,
      card_state,
      staked_room_id,
      staked_at,
      revealed_at,
      is_golden,
      is_award,
      credits_awarded,
      product_credits_awarded,
      universal_credits_awarded,
      redeem_credits_cents,
      priority_points,
      card_data
    ) VALUES (
      v_user_id,
      v_room.product_class_id,
      v_product.band,
      v_serial,
      'staked',           -- Card is locked/in play
      p_room_id,          -- Link to the room
      now(),              -- When it was staked
      now(),              -- Revealed immediately
      false,              -- Not golden
      false,              -- Not an award
      0,                  -- No credits yet
      0,
      0,
      0,                  -- No redeem credits yet (will be set on settlement)
      0,
      jsonb_build_object(
        'source', 'room_entry',
        'room_tier', v_room.tier,
        'entry_amount_cents', p_amount_cents
      )
    ) RETURNING id INTO v_reveal_id;

    -- Create the room entry linked to the reveal
    INSERT INTO room_entries (
      room_id, 
      user_id, 
      reveal_id,
      stake_snapshot, 
      amount_spent_cents, 
      tickets, 
      status, 
      outcome
    ) VALUES (
      p_room_id, 
      v_user_id, 
      v_reveal_id,  -- Link to the reveal/card
      jsonb_build_object(
        'entry_type', 'card_entry',
        'amount_cents', p_amount_cents,
        'product_name', v_product.name,
        'product_band', v_product.band
      ),
      p_amount_cents,
      v_tickets,
      'STAKED',
      'PENDING'
    ) RETURNING id INTO v_entry_id;
  END IF;

  -- Record individual purchase
  INSERT INTO room_entry_purchases (
    room_id, 
    user_id, 
    entry_id, 
    amount_cents, 
    tickets_granted, 
    stripe_session_id, 
    stripe_payment_intent_id
  ) VALUES (
    p_room_id, 
    v_user_id, 
    v_entry_id, 
    p_amount_cents, 
    v_tickets, 
    p_stripe_session_id, 
    p_stripe_payment_intent_id
  );

  -- Update room funding balance
  UPDATE rooms 
  SET escrow_balance_cents = escrow_balance_cents + p_amount_cents
  WHERE id = p_room_id
  RETURNING escrow_balance_cents INTO v_new_balance;

  -- Calculate funding progress
  v_funding_progress := CASE 
    WHEN v_room.funding_target_cents > 0 THEN 
      (v_new_balance::numeric / v_room.funding_target_cents::numeric) * 100
    ELSE 0 
  END;

  -- Check if room is now fully funded
  IF v_new_balance >= v_room.funding_target_cents THEN
    UPDATE rooms SET status = 'FUNDED' WHERE id = p_room_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'reveal_id', v_reveal_id,
    'tickets_granted', v_tickets,
    'total_tickets', (SELECT tickets FROM room_entries WHERE id = v_entry_id),
    'funding_progress', round(v_funding_progress, 2),
    'room_status', (SELECT status FROM rooms WHERE id = p_room_id),
    'card_created', v_existing_entry IS NULL
  );
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.buy_room_entry IS 'Creates a room entry with an associated reveal/card. First entry creates a new card with staked state visible in vault. Additional purchases add tickets to existing entry.';

-- Migrate existing room entries to have associated reveal/cards
-- This creates staked cards for entries that were created before the buy_room_entry update

DO $$
DECLARE
  v_entry RECORD;
  v_reveal_id uuid;
  v_serial text;
  v_product product_classes%ROWTYPE;
  v_room rooms%ROWTYPE;
BEGIN
  -- Loop through all room entries without a reveal
  FOR v_entry IN 
    SELECT re.*, r.tier as room_tier, r.product_class_id
    FROM room_entries re
    JOIN rooms r ON re.room_id = r.id
    WHERE re.reveal_id IS NULL
  LOOP
    -- Get product details
    SELECT * INTO v_product FROM product_classes WHERE id = v_entry.product_class_id;
    SELECT * INTO v_room FROM rooms WHERE id = v_entry.room_id;
    
    IF v_product IS NOT NULL THEN
      -- Generate unique serial number
      v_serial := 'RM-' || substr(md5(random()::text || clock_timestamp()::text || v_entry.id::text), 1, 8);
      
      -- Create the reveal/card with staked state
      INSERT INTO reveals (
        user_id,
        product_class_id,
        band,
        serial_number,
        card_state,
        staked_room_id,
        staked_at,
        revealed_at,
        is_golden,
        is_award,
        credits_awarded,
        product_credits_awarded,
        universal_credits_awarded,
        redeem_credits_cents,
        priority_points,
        card_data
      ) VALUES (
        v_entry.user_id,
        v_entry.product_class_id,
        v_product.band,
        v_serial,
        'staked',
        v_entry.room_id,
        v_entry.staked_at,
        v_entry.staked_at,
        false,
        false,
        0,
        0,
        0,
        0,
        0,
        jsonb_build_object(
          'source', 'room_entry_migration',
          'room_tier', v_entry.room_tier,
          'entry_amount_cents', v_entry.amount_spent_cents,
          'migrated_at', now()
        )
      ) RETURNING id INTO v_reveal_id;
      
      -- Link the reveal to the room entry
      UPDATE room_entries 
      SET reveal_id = v_reveal_id,
          stake_snapshot = jsonb_set(
            COALESCE(stake_snapshot, '{}'::jsonb),
            '{entry_type}',
            '"card_entry"'
          )
      WHERE id = v_entry.id;
      
      RAISE NOTICE 'Created reveal % for entry % (room: %, product: %)', 
        v_reveal_id, v_entry.id, v_entry.room_id, v_product.name;
    END IF;
  END LOOP;
END $$;

-- Verify the migration worked
SELECT 
  re.id as entry_id,
  re.reveal_id,
  re.tickets,
  r.tier,
  pc.name as product_name,
  rv.card_state,
  rv.serial_number
FROM room_entries re
JOIN rooms r ON re.room_id = r.id
JOIN product_classes pc ON r.product_class_id = pc.id
LEFT JOIN reveals rv ON re.reveal_id = rv.id
WHERE re.user_id = '3121af0a-5228-4c24-87ab-d652c28db72f';

-- Direct migration: Create reveals for Rolex and Chanel entries

-- 1. Create reveal for Rolex Submariner entry (75 tickets, $7500)
INSERT INTO reveals (
  user_id,
  product_class_id,
  band,
  serial_number,
  card_state,
  staked_room_id,
  staked_at,
  revealed_at,
  is_golden,
  is_award,
  credits_awarded,
  product_credits_awarded,
  universal_credits_awarded,
  redeem_credits_cents,
  priority_points,
  card_data
) VALUES (
  '3121af0a-5228-4c24-87ab-d652c28db72f',  -- user_id
  '4b0661e9-1c15-4210-8469-e413596a7493',  -- Rolex product_class_id
  'RARE',
  'RM-ROLEX001',
  'staked',
  '55f0805e-7d1f-4b37-8b6e-8ec056e6ec1e',  -- Rolex room_id
  now(),
  now(),
  false,
  false,
  0, 0, 0, 0, 0,
  '{"source": "room_entry_migration", "room_tier": "RARE", "entry_amount_cents": 7500}'::jsonb
);

-- 2. Create reveal for Chanel Classic Flap entry (50 tickets, $5000)
INSERT INTO reveals (
  user_id,
  product_class_id,
  band,
  serial_number,
  card_state,
  staked_room_id,
  staked_at,
  revealed_at,
  is_golden,
  is_award,
  credits_awarded,
  product_credits_awarded,
  universal_credits_awarded,
  redeem_credits_cents,
  priority_points,
  card_data
) VALUES (
  '3121af0a-5228-4c24-87ab-d652c28db72f',  -- user_id
  'a6cd7b9e-7432-4854-9235-ef6c52f4017d',  -- Chanel product_class_id
  'GRAIL',
  'RM-CHANEL01',
  'staked',
  '46c005ce-b851-48ed-b2b9-594edb06a9c5',  -- Chanel room_id
  now(),
  now(),
  false,
  false,
  0, 0, 0, 0, 0,
  '{"source": "room_entry_migration", "room_tier": "GRAIL", "entry_amount_cents": 5000}'::jsonb
);

-- 3. Link the reveals to the room entries
UPDATE room_entries 
SET reveal_id = (
  SELECT id FROM reveals 
  WHERE serial_number = 'RM-ROLEX001' 
  LIMIT 1
)
WHERE id = 'a8426910-cfbc-46e9-a74b-a092b829d8dc';

UPDATE room_entries 
SET reveal_id = (
  SELECT id FROM reveals 
  WHERE serial_number = 'RM-CHANEL01' 
  LIMIT 1
)
WHERE id = '62bffc13-12ce-42c8-b905-8fa6f3abff03';

-- Update settle_room to properly handle card state transitions
-- Winners: card_state = 'won', clear staked_room_id (can redeem immediately)
-- Losers: card_state = 'owned', clear staked_room_id, add credits to redeem_credits_cents

CREATE OR REPLACE FUNCTION public.settle_room(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_room RECORD;
  v_product RECORD;
  v_winner_entry RECORD;
  v_entry RECORD;
  v_reward_config RECORD;
  v_total_entries integer;
  v_current_rank integer := 0;
  v_percentile numeric;
  v_percentile_band text;
  v_placement_bonus integer;
  v_pack_bonus integer;
  v_credits_awarded integer;
  v_packs_awarded integer;
  v_card_credits_cents bigint;
  v_results jsonb := '[]'::jsonb;
BEGIN
  -- Get room with lock
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check room can be settled
  IF v_room.status NOT IN ('LOCKED', 'OPEN') THEN
    RAISE EXCEPTION 'Room cannot be settled - status: %', v_room.status;
  END IF;

  -- Get product details for calculating loser credits
  SELECT * INTO v_product FROM product_classes WHERE id = v_room.product_class_id;

  -- Get reward config for this tier
  SELECT * INTO v_reward_config FROM room_reward_config WHERE tier = v_room.tier;
  
  IF v_reward_config IS NULL THEN
    -- Use defaults if no config
    v_reward_config := ROW('ICON', 1.0, 40, 0, 0)::room_reward_config;
  END IF;

  -- Get total entries
  SELECT COUNT(*) INTO v_total_entries FROM room_entries WHERE room_id = p_room_id AND status = 'STAKED';
  
  IF v_total_entries = 0 THEN
    -- No entries, just close the room
    UPDATE rooms SET status = 'SETTLED' WHERE id = p_room_id;
    RETURN jsonb_build_object('success', true, 'message', 'Room settled with no entries', 'winner', null);
  END IF;

  -- Rank all entries and calculate rewards
  FOR v_entry IN 
    SELECT re.* 
    FROM room_entries re 
    WHERE re.room_id = p_room_id AND re.status = 'STAKED'
    ORDER BY re.priority_score DESC, re.staked_at ASC
  LOOP
    v_current_rank := v_current_rank + 1;
    
    -- Calculate percentile (1 = top, 100 = bottom)
    v_percentile := (v_current_rank::numeric / v_total_entries) * 100;
    
    -- Determine percentile band
    v_percentile_band := CASE
      WHEN v_percentile <= 10 THEN 'S'
      WHEN v_percentile <= 30 THEN 'A'
      WHEN v_percentile <= 60 THEN 'B'
      ELSE 'C'
    END;
    
    -- Determine placement bonus credits
    v_placement_bonus := CASE v_percentile_band
      WHEN 'S' THEN 120
      WHEN 'A' THEN 70
      WHEN 'B' THEN 35
      ELSE 0
    END;
    
    -- Determine pack bonus
    v_pack_bonus := CASE v_percentile_band
      WHEN 'S' THEN 1
      WHEN 'A' THEN 1
      ELSE 0
    END;
    
    -- Calculate total credits: (base + placement_bonus) * tier_multiplier
    v_credits_awarded := FLOOR((v_reward_config.base_participation_credits + v_placement_bonus) * v_reward_config.multiplier);
    
    -- Calculate packs: min(base_packs + bonus_packs, cap)
    v_packs_awarded := LEAST(v_reward_config.base_packs + v_pack_bonus, v_reward_config.packs_cap);
    
    -- Update entry with rank, band, and rewards
    UPDATE room_entries 
    SET rank = v_current_rank,
        percentile_band = v_percentile_band,
        credits_awarded = v_credits_awarded,
        packs_awarded = v_packs_awarded,
        status = CASE WHEN v_current_rank = 1 THEN 'WON' ELSE 'LOST' END
    WHERE id = v_entry.id;
    
    -- Insert room reward record
    INSERT INTO room_rewards (room_id, user_id, entry_id, percentile_band, final_rank, credits_awarded, packs_awarded)
    VALUES (p_room_id, v_entry.user_id, v_entry.id, v_percentile_band, v_current_rank, v_credits_awarded, v_packs_awarded);
    
    -- Credit universal credits to user
    INSERT INTO user_universal_credits (user_id, credits)
    VALUES (v_entry.user_id, v_credits_awarded)
    ON CONFLICT (user_id)
    DO UPDATE SET credits = user_universal_credits.credits + v_credits_awarded, updated_at = now();
    
    -- Create reward pack grants
    FOR i IN 1..v_packs_awarded LOOP
      INSERT INTO reward_pack_grants (user_id, source_type, source_id)
      SELECT v_entry.user_id, 'room_reward', rr.id
      FROM room_rewards rr 
      WHERE rr.room_id = p_room_id AND rr.user_id = v_entry.user_id;
    END LOOP;
    
    -- ============================================================
    -- CARD STATE TRANSITIONS - The key logic for card unlocking
    -- ============================================================
    IF v_current_rank = 1 THEN
      -- WINNER: Card becomes 'won', can redeem the product immediately
      -- Set redeem_credits_cents to 100% of product value (fully redeemable)
      UPDATE reveals 
      SET 
        card_state = 'won',
        staked_room_id = NULL,
        staked_at = NULL,
        redeem_credits_cents = COALESCE(v_product.retail_value_usd, 0) * 100  -- 100% progress
      WHERE id = v_entry.reveal_id;
      
      v_winner_entry := v_entry;
    ELSE
      -- LOSER: Card becomes 'owned', gets credits toward redemption based on entry amount
      -- Calculate credits: entry amount spent goes toward product redemption
      -- This incentivizes playing more to accumulate credits
      v_card_credits_cents := v_entry.amount_spent_cents;
      
      UPDATE reveals 
      SET 
        card_state = 'owned',
        staked_room_id = NULL,
        staked_at = NULL,
        -- Add entry amount as credits toward this product's redemption
        redeem_credits_cents = COALESCE(redeem_credits_cents, 0) + v_card_credits_cents
      WHERE id = v_entry.reveal_id;
    END IF;
    
    -- Add to results
    v_results := v_results || jsonb_build_object(
      'user_id', v_entry.user_id,
      'rank', v_current_rank,
      'percentile_band', v_percentile_band,
      'credits_awarded', v_credits_awarded,
      'packs_awarded', v_packs_awarded,
      'card_credits_cents', CASE WHEN v_current_rank = 1 THEN COALESCE(v_product.retail_value_usd, 0) * 100 ELSE v_card_credits_cents END
    );
  END LOOP;

  -- Update room as settled
  UPDATE rooms 
  SET status = 'SETTLED',
      winner_entry_id = v_winner_entry.id,
      winner_user_id = v_winner_entry.user_id
  WHERE id = p_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'room_id', p_room_id,
    'total_entries', v_total_entries,
    'winner', jsonb_build_object(
      'user_id', v_winner_entry.user_id,
      'entry_id', v_winner_entry.id,
      'priority_score', v_winner_entry.priority_score
    ),
    'results', v_results
  );
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.settle_room IS 'Settles a room by determining winner, distributing rewards, and updating card states. Winners get 100% redemption credits. Losers get their entry amount added to card credits for future redemption.';
-- Create suppliers table for inventory tracking
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add supplier_id to inventory_items
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id),
ADD COLUMN IF NOT EXISTS cost_usd NUMERIC,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Enable RLS on suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Only admins can manage suppliers
CREATE POLICY "Only admins can read suppliers" 
ON public.suppliers 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can modify suppliers" 
ON public.suppliers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on suppliers
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images (public read, admin write)
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Only admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));-- Add status field to collector_profiles for moderation
ALTER TABLE public.collector_profiles 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'suspended', 'banned'));

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_collector_profiles_status ON public.collector_profiles(status);

-- Create moderation_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  details JSONB,
  performed_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view/create moderation logs
CREATE POLICY "Admins can view moderation logs"
ON public.moderation_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create moderation logs"
ON public.moderation_logs FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));-- Create general admin audit log for tracking all admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for querying by entity
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity ON public.admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON public.admin_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert audit logs (insert-only, no updates or deletes)
CREATE POLICY "Admins can create audit logs"
ON public.admin_audit_log FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));-- =============================================
-- Phase 11: Product Trivia Questions - "Knowledge Boost"
-- =============================================

-- 1. Create product_questions table
CREATE TABLE public.product_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_class_id UUID NOT NULL REFERENCES public.product_classes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  bonus_tickets INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX idx_product_questions_product ON public.product_questions(product_class_id) WHERE is_active = true;

-- 2. Create user_question_answers table
CREATE TABLE public.user_question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.product_questions(id) ON DELETE CASCADE,
  selected_option CHAR(1) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  bonus_tickets_awarded INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Each user can only answer each question once per room
  UNIQUE(user_id, room_id, question_id)
);

-- Index for user lookups
CREATE INDEX idx_user_question_answers_user_room ON public.user_question_answers(user_id, room_id);

-- 3. Enable RLS on product_questions
ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;

-- Anyone can read active questions
CREATE POLICY "Anyone can read active questions" ON public.product_questions
  FOR SELECT USING (is_active = true);

-- 4. Enable RLS on user_question_answers
ALTER TABLE public.user_question_answers ENABLE ROW LEVEL SECURITY;

-- Users can read their own answers
CREATE POLICY "Users can read own answers" ON public.user_question_answers
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own answers (controlled by RPC)
CREATE POLICY "Users can insert own answers" ON public.user_question_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create the answer_trivia_question RPC function
CREATE OR REPLACE FUNCTION public.answer_trivia_question(
  p_room_id UUID,
  p_question_id UUID,
  p_selected_option CHAR(1)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_question RECORD;
  v_entry RECORD;
  v_room RECORD;
  v_is_correct BOOLEAN;
  v_bonus_tickets INTEGER := 0;
BEGIN
  -- Validate user is authenticated
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'You must be logged in');
  END IF;

  -- Validate selected option
  IF p_selected_option NOT IN ('A', 'B', 'C', 'D') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid option selected');
  END IF;

  -- Get the room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Lot not found');
  END IF;

  IF v_room.status NOT IN ('OPEN', 'FUNDED') THEN
    RETURN json_build_object('success', false, 'error', 'Lot is no longer accepting answers');
  END IF;

  -- Check user has an active entry in this room
  SELECT * INTO v_entry
  FROM room_entries
  WHERE room_id = p_room_id AND user_id = v_user_id AND status = 'STAKED'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'You must have an entry in this lot to answer questions');
  END IF;

  -- Get the question and verify it belongs to this room's product
  SELECT pq.* INTO v_question
  FROM product_questions pq
  WHERE pq.id = p_question_id 
    AND pq.product_class_id = v_room.product_class_id
    AND pq.is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Question not found for this lot');
  END IF;

  -- Check if already answered
  IF EXISTS (
    SELECT 1 FROM user_question_answers 
    WHERE user_id = v_user_id AND room_id = p_room_id AND question_id = p_question_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'You have already answered this question');
  END IF;

  -- Check answer
  v_is_correct := (p_selected_option = v_question.correct_option);
  
  IF v_is_correct THEN
    v_bonus_tickets := v_question.bonus_tickets;
    
    -- Award bonus tickets to entry
    UPDATE room_entries
    SET tickets = tickets + v_bonus_tickets
    WHERE id = v_entry.id;
  END IF;

  -- Record the answer
  INSERT INTO user_question_answers (
    user_id, room_id, question_id, selected_option, is_correct, bonus_tickets_awarded
  ) VALUES (
    v_user_id, p_room_id, p_question_id, p_selected_option, v_is_correct, v_bonus_tickets
  );

  RETURN json_build_object(
    'success', true,
    'is_correct', v_is_correct,
    'correct_option', v_question.correct_option,
    'bonus_tickets', v_bonus_tickets,
    'new_total_tickets', v_entry.tickets + v_bonus_tickets
  );
END;
$$;-- Phase 12: Trivia-Gated Ticket Purchases
-- Table to track user trivia attempts per room for purchase unlock

CREATE TABLE public.room_trivia_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  attempts_used INTEGER NOT NULL DEFAULT 0,
  last_failed_at TIMESTAMPTZ,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, room_id)
);

-- Index for efficient lookups
CREATE INDEX idx_room_trivia_attempts_user_room ON room_trivia_attempts(user_id, room_id);

-- RLS Policies
ALTER TABLE room_trivia_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own trivia attempts" ON room_trivia_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trivia attempts" ON room_trivia_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trivia attempts" ON room_trivia_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- RPC: Attempt trivia question to unlock purchase
CREATE OR REPLACE FUNCTION public.attempt_trivia_for_purchase(
  p_room_id UUID,
  p_question_id UUID,
  p_selected_option TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_attempts RECORD;
  v_question RECORD;
  v_is_correct BOOLEAN;
  v_max_attempts INTEGER := 3;
  v_cooldown_minutes INTEGER := 60;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get or create attempt record
  INSERT INTO room_trivia_attempts (user_id, room_id)
  VALUES (v_user_id, p_room_id)
  ON CONFLICT (user_id, room_id) DO NOTHING;

  SELECT * INTO v_attempts FROM room_trivia_attempts
  WHERE user_id = v_user_id AND room_id = p_room_id FOR UPDATE;

  -- Check if already unlocked
  IF v_attempts.unlocked_at IS NOT NULL THEN
    RETURN json_build_object('success', true, 'already_unlocked', true, 'can_purchase', true);
  END IF;

  -- Check cooldown (if 3 attempts used, must wait)
  IF v_attempts.attempts_used >= v_max_attempts THEN
    IF v_attempts.last_failed_at + (v_cooldown_minutes || ' minutes')::interval > now() THEN
      RETURN json_build_object(
        'success', false, 
        'error', 'Too many wrong answers. Try again later.',
        'cooldown_ends_at', v_attempts.last_failed_at + (v_cooldown_minutes || ' minutes')::interval,
        'can_purchase', false
      );
    ELSE
      -- Reset attempts after cooldown
      UPDATE room_trivia_attempts
      SET attempts_used = 0, last_failed_at = NULL
      WHERE id = v_attempts.id;
      v_attempts.attempts_used := 0;
    END IF;
  END IF;

  -- Get question
  SELECT pq.* INTO v_question
  FROM product_questions pq
  JOIN rooms r ON r.product_class_id = pq.product_class_id
  WHERE pq.id = p_question_id AND r.id = p_room_id AND pq.is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Question not found for this lot');
  END IF;

  -- Check answer
  v_is_correct := (UPPER(p_selected_option) = UPPER(v_question.correct_option));

  IF v_is_correct THEN
    -- Unlock purchase
    UPDATE room_trivia_attempts
    SET unlocked_at = now()
    WHERE id = v_attempts.id;
    
    RETURN json_build_object(
      'success', true, 
      'is_correct', true, 
      'can_purchase', true,
      'correct_option', v_question.correct_option
    );
  ELSE
    -- Increment failed attempts
    UPDATE room_trivia_attempts
    SET attempts_used = attempts_used + 1, last_failed_at = now()
    WHERE id = v_attempts.id;
    
    RETURN json_build_object(
      'success', true,
      'is_correct', false,
      'correct_option', v_question.correct_option,
      'attempts_remaining', v_max_attempts - v_attempts.attempts_used - 1,
      'can_purchase', false
    );
  END IF;
END;
$$;-- =====================================================
-- SWEEPSTAKES MODEL: TRIVIA CREDITS SYSTEM
-- Phase 1: Database Schema
-- =====================================================

-- 1. Create user_trivia_credits table (global balance per user)
CREATE TABLE public.user_trivia_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_trivia_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_trivia_credits
CREATE POLICY "Users can view their own trivia credits"
  ON public.user_trivia_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage trivia credits"
  ON public.user_trivia_credits FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Create trivia_credit_transaction_type enum
CREATE TYPE public.trivia_credit_transaction_type AS ENUM (
  'EARNED_TRIVIA_GATE',
  'EARNED_KNOWLEDGE_BOOST', 
  'SPENT_FREE_ENTRY',
  'BONUS',
  'ADMIN_ADJUSTMENT'
);

-- 3. Create trivia_credit_transactions table (audit trail)
CREATE TABLE public.trivia_credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID REFERENCES public.rooms(id),
  question_id UUID REFERENCES public.product_questions(id),
  amount INTEGER NOT NULL,
  transaction_type public.trivia_credit_transaction_type NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trivia_credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trivia_credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.trivia_credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON public.trivia_credit_transactions FOR INSERT
  WITH CHECK (true);

-- 4. Add entry_type and trivia_tickets to room_entries
ALTER TABLE public.room_entries 
  ADD COLUMN IF NOT EXISTS entry_type TEXT NOT NULL DEFAULT 'PAID' CHECK (entry_type IN ('PAID', 'TRIVIA_CREDIT', 'HYBRID')),
  ADD COLUMN IF NOT EXISTS trivia_tickets INTEGER NOT NULL DEFAULT 0 CHECK (trivia_tickets >= 0);

-- 5. Create room_trivia_entries table (free entries via trivia)
CREATE TABLE public.room_trivia_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  user_id UUID NOT NULL,
  trivia_tickets INTEGER NOT NULL DEFAULT 0 CHECK (trivia_tickets >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE public.room_trivia_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for room_trivia_entries
CREATE POLICY "Users can view their own trivia entries"
  ON public.room_trivia_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view trivia entries in rooms they participate in"
  ON public.room_trivia_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_entries re 
      WHERE re.room_id = room_trivia_entries.room_id 
      AND re.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage trivia entries"
  ON public.room_trivia_entries FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Create trivia_credit_config table for configurable constants
CREATE TABLE public.trivia_credit_config (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default configuration values
INSERT INTO public.trivia_credit_config (key, value, description) VALUES
  ('CREDITS_PER_CORRECT_ANSWER', 1, 'Trivia Credits earned per correct answer'),
  ('CREDITS_PER_FREE_TICKET', 10, 'Trivia Credits required to get 1 free ticket'),
  ('TRIVIA_TICKET_WEIGHT', 10, 'Weight of trivia ticket in draw (10 = 0.1x, 100 = 1x)'),
  ('MAX_CREDITS_PER_DAY', 10, 'Maximum Trivia Credits earnable per day'),
  ('MAX_QUESTIONS_PER_LOT', 5, 'Maximum trivia questions per lot per user'),
  ('MAX_FREE_TICKETS_PER_LOT', 3, 'Maximum free tickets per lot per user');

-- RLS for config (read-only for authenticated users)
ALTER TABLE public.trivia_credit_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read config"
  ON public.trivia_credit_config FOR SELECT
  USING (true);

-- 7. Create daily_trivia_credits table to track daily caps
CREATE TABLE public.daily_trivia_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  earn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  credits_earned INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, earn_date)
);

-- Enable RLS
ALTER TABLE public.daily_trivia_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily credits"
  ON public.daily_trivia_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage daily credits"
  ON public.daily_trivia_credits FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. Create lot_trivia_questions table to track per-lot question limits
CREATE TABLE public.lot_trivia_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  question_id UUID NOT NULL REFERENCES public.product_questions(id),
  is_correct BOOLEAN NOT NULL,
  credits_earned INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, room_id, question_id)
);

-- Enable RLS
ALTER TABLE public.lot_trivia_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lot questions"
  ON public.lot_trivia_questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage lot questions"
  ON public.lot_trivia_questions FOR ALL
  USING (true)
  WITH CHECK (true);

-- 9. Create indexes for performance
CREATE INDEX idx_trivia_credit_transactions_user_id ON public.trivia_credit_transactions(user_id);
CREATE INDEX idx_trivia_credit_transactions_room_id ON public.trivia_credit_transactions(room_id);
CREATE INDEX idx_room_trivia_entries_room_id ON public.room_trivia_entries(room_id);
CREATE INDEX idx_room_trivia_entries_user_id ON public.room_trivia_entries(user_id);
CREATE INDEX idx_daily_trivia_credits_user_date ON public.daily_trivia_credits(user_id, earn_date);
CREATE INDEX idx_lot_trivia_questions_user_room ON public.lot_trivia_questions(user_id, room_id);

-- 10. Update timestamp trigger for user_trivia_credits
CREATE TRIGGER update_user_trivia_credits_updated_at
  BEFORE UPDATE ON public.user_trivia_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- =====================================================
-- SWEEPSTAKES MODEL: TRIVIA CREDITS SYSTEM
-- Phase 2: Backend RPC Functions
-- =====================================================

-- 1. Helper function to get trivia config value
CREATE OR REPLACE FUNCTION public.get_trivia_config(p_key TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value INTEGER;
BEGIN
  SELECT value INTO v_value FROM trivia_credit_config WHERE key = p_key;
  RETURN COALESCE(v_value, 0);
END;
$$;

-- 2. Function to get user's trivia credits
CREATE OR REPLACE FUNCTION public.get_my_trivia_credits()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_credits INTEGER;
  v_lifetime INTEGER;
  v_daily_earned INTEGER;
  v_daily_limit INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get or create user trivia credits record
  INSERT INTO user_trivia_credits (user_id, credits, lifetime_earned)
  VALUES (v_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT credits, lifetime_earned 
  INTO v_credits, v_lifetime
  FROM user_trivia_credits WHERE user_id = v_user_id;

  -- Get today's earned credits
  SELECT COALESCE(credits_earned, 0) INTO v_daily_earned
  FROM daily_trivia_credits 
  WHERE user_id = v_user_id AND earn_date = CURRENT_DATE;

  v_daily_limit := get_trivia_config('MAX_CREDITS_PER_DAY');

  RETURN json_build_object(
    'success', true,
    'credits', COALESCE(v_credits, 0),
    'lifetime_earned', COALESCE(v_lifetime, 0),
    'daily_earned', COALESCE(v_daily_earned, 0),
    'daily_limit', v_daily_limit,
    'can_earn_more', COALESCE(v_daily_earned, 0) < v_daily_limit
  );
END;
$$;

-- 3. Function to earn trivia credits (called when answering trivia questions)
CREATE OR REPLACE FUNCTION public.earn_trivia_credits(
  p_room_id UUID,
  p_question_id UUID,
  p_selected_option TEXT,
  p_source TEXT DEFAULT 'KNOWLEDGE_BOOST' -- 'TRIVIA_GATE' or 'KNOWLEDGE_BOOST'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_question RECORD;
  v_is_correct BOOLEAN;
  v_credits_to_award INTEGER;
  v_daily_earned INTEGER;
  v_daily_limit INTEGER;
  v_lot_questions_count INTEGER;
  v_lot_limit INTEGER;
  v_new_balance INTEGER;
  v_transaction_type trivia_credit_transaction_type;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get question details
  SELECT * INTO v_question
  FROM product_questions
  WHERE id = p_question_id AND is_active = true;

  IF v_question IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Question not found');
  END IF;

  -- Check if already answered this question for this lot
  IF EXISTS (
    SELECT 1 FROM lot_trivia_questions 
    WHERE user_id = v_user_id AND room_id = p_room_id AND question_id = p_question_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Already answered this question');
  END IF;

  -- Check daily limit
  v_daily_limit := get_trivia_config('MAX_CREDITS_PER_DAY');
  
  INSERT INTO daily_trivia_credits (user_id, earn_date, credits_earned, questions_answered)
  VALUES (v_user_id, CURRENT_DATE, 0, 0)
  ON CONFLICT (user_id, earn_date) DO NOTHING;

  SELECT credits_earned INTO v_daily_earned
  FROM daily_trivia_credits 
  WHERE user_id = v_user_id AND earn_date = CURRENT_DATE;

  -- Check per-lot question limit
  v_lot_limit := get_trivia_config('MAX_QUESTIONS_PER_LOT');
  
  SELECT COUNT(*) INTO v_lot_questions_count
  FROM lot_trivia_questions
  WHERE user_id = v_user_id AND room_id = p_room_id;

  IF v_lot_questions_count >= v_lot_limit THEN
    RETURN json_build_object('success', false, 'error', 'Maximum questions reached for this lot');
  END IF;

  -- Check if answer is correct
  v_is_correct := (v_question.correct_option = p_selected_option);

  -- Calculate credits to award (only if correct AND under daily limit)
  v_credits_to_award := 0;
  IF v_is_correct AND v_daily_earned < v_daily_limit THEN
    v_credits_to_award := get_trivia_config('CREDITS_PER_CORRECT_ANSWER');
    -- Don't exceed daily limit
    IF v_daily_earned + v_credits_to_award > v_daily_limit THEN
      v_credits_to_award := v_daily_limit - v_daily_earned;
    END IF;
  END IF;

  -- Record the question answer
  INSERT INTO lot_trivia_questions (user_id, room_id, question_id, is_correct, credits_earned)
  VALUES (v_user_id, p_room_id, p_question_id, v_is_correct, v_credits_to_award);

  -- Update daily credits
  UPDATE daily_trivia_credits
  SET credits_earned = credits_earned + v_credits_to_award,
      questions_answered = questions_answered + 1
  WHERE user_id = v_user_id AND earn_date = CURRENT_DATE;

  -- Update user's trivia credits balance if credits awarded
  IF v_credits_to_award > 0 THEN
    -- Ensure user has a record
    INSERT INTO user_trivia_credits (user_id, credits, lifetime_earned)
    VALUES (v_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE user_trivia_credits
    SET credits = credits + v_credits_to_award,
        lifetime_earned = lifetime_earned + v_credits_to_award,
        updated_at = now()
    WHERE user_id = v_user_id
    RETURNING credits INTO v_new_balance;

    -- Determine transaction type
    v_transaction_type := CASE 
      WHEN p_source = 'TRIVIA_GATE' THEN 'EARNED_TRIVIA_GATE'::trivia_credit_transaction_type
      ELSE 'EARNED_KNOWLEDGE_BOOST'::trivia_credit_transaction_type
    END;

    -- Record transaction
    INSERT INTO trivia_credit_transactions (user_id, room_id, question_id, amount, transaction_type, balance_after)
    VALUES (v_user_id, p_room_id, p_question_id, v_credits_to_award, v_transaction_type, v_new_balance);
  ELSE
    SELECT credits INTO v_new_balance FROM user_trivia_credits WHERE user_id = v_user_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'is_correct', v_is_correct,
    'correct_option', v_question.correct_option,
    'credits_earned', v_credits_to_award,
    'new_balance', COALESCE(v_new_balance, 0),
    'daily_earned', v_daily_earned + v_credits_to_award,
    'daily_limit', v_daily_limit,
    'lot_questions_answered', v_lot_questions_count + 1,
    'lot_questions_limit', v_lot_limit
  );
END;
$$;

-- 4. Function to enter lot with trivia credits (free entry)
CREATE OR REPLACE FUNCTION public.enter_lot_with_trivia_credits(
  p_room_id UUID,
  p_tickets_to_buy INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_room RECORD;
  v_credits_per_ticket INTEGER;
  v_credits_required INTEGER;
  v_user_credits INTEGER;
  v_max_free_tickets INTEGER;
  v_current_trivia_tickets INTEGER;
  v_new_balance INTEGER;
  v_entry_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_tickets_to_buy < 1 THEN
    RETURN json_build_object('success', false, 'error', 'Must buy at least 1 ticket');
  END IF;

  -- Get room details
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF v_room IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Lot not found');
  END IF;

  IF v_room.status != 'OPEN' THEN
    RETURN json_build_object('success', false, 'error', 'Lot is not open for entries');
  END IF;

  -- Get config values
  v_credits_per_ticket := get_trivia_config('CREDITS_PER_FREE_TICKET');
  v_max_free_tickets := get_trivia_config('MAX_FREE_TICKETS_PER_LOT');
  v_credits_required := p_tickets_to_buy * v_credits_per_ticket;

  -- Get user's current trivia credits
  SELECT COALESCE(credits, 0) INTO v_user_credits
  FROM user_trivia_credits WHERE user_id = v_user_id;

  IF v_user_credits < v_credits_required THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Insufficient Trivia Credits',
      'required', v_credits_required,
      'available', COALESCE(v_user_credits, 0)
    );
  END IF;

  -- Check current trivia tickets for this lot
  SELECT COALESCE(trivia_tickets, 0) INTO v_current_trivia_tickets
  FROM room_trivia_entries WHERE room_id = p_room_id AND user_id = v_user_id;

  IF COALESCE(v_current_trivia_tickets, 0) + p_tickets_to_buy > v_max_free_tickets THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Maximum free tickets reached for this lot',
      'max_allowed', v_max_free_tickets,
      'current', COALESCE(v_current_trivia_tickets, 0)
    );
  END IF;

  -- Deduct credits
  UPDATE user_trivia_credits
  SET credits = credits - v_credits_required,
      updated_at = now()
  WHERE user_id = v_user_id
  RETURNING credits INTO v_new_balance;

  -- Record transaction
  INSERT INTO trivia_credit_transactions (user_id, room_id, amount, transaction_type, balance_after)
  VALUES (v_user_id, p_room_id, -v_credits_required, 'SPENT_FREE_ENTRY', v_new_balance);

  -- Create or update room_trivia_entries
  INSERT INTO room_trivia_entries (room_id, user_id, trivia_tickets)
  VALUES (p_room_id, v_user_id, p_tickets_to_buy)
  ON CONFLICT (room_id, user_id) 
  DO UPDATE SET trivia_tickets = room_trivia_entries.trivia_tickets + p_tickets_to_buy
  RETURNING id INTO v_entry_id;

  RETURN json_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'tickets_purchased', p_tickets_to_buy,
    'credits_spent', v_credits_required,
    'new_balance', v_new_balance,
    'total_trivia_tickets', COALESCE(v_current_trivia_tickets, 0) + p_tickets_to_buy
  );
END;
$$;

-- 5. Function to get user's trivia entry for a room
CREATE OR REPLACE FUNCTION public.get_my_trivia_entry(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_entry RECORD;
  v_questions_answered INTEGER;
  v_max_questions INTEGER;
  v_max_free_tickets INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get trivia entry
  SELECT * INTO v_entry
  FROM room_trivia_entries
  WHERE room_id = p_room_id AND user_id = v_user_id;

  -- Get questions answered for this lot
  SELECT COUNT(*) INTO v_questions_answered
  FROM lot_trivia_questions
  WHERE room_id = p_room_id AND user_id = v_user_id;

  v_max_questions := get_trivia_config('MAX_QUESTIONS_PER_LOT');
  v_max_free_tickets := get_trivia_config('MAX_FREE_TICKETS_PER_LOT');

  RETURN json_build_object(
    'success', true,
    'has_entry', v_entry IS NOT NULL,
    'trivia_tickets', COALESCE(v_entry.trivia_tickets, 0),
    'questions_answered', v_questions_answered,
    'max_questions', v_max_questions,
    'max_free_tickets', v_max_free_tickets,
    'can_answer_more', v_questions_answered < v_max_questions
  );
END;
$$;

-- 6. Update draw_room_winner to include trivia entries with weighted odds
CREATE OR REPLACE FUNCTION public.draw_room_winner(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room RECORD;
  v_total_weighted_tickets NUMERIC;
  v_trivia_weight NUMERIC;
  v_server_seed TEXT;
  v_client_seed TEXT;
  v_combined_seed TEXT;
  v_nonce INTEGER;
  v_winning_ticket_raw NUMERIC;
  v_winning_ticket INTEGER;
  v_cumulative NUMERIC := 0;
  v_winner_user_id UUID;
  v_winner_entry_id UUID;
  v_winner_type TEXT;
  v_draw_id UUID;
  v_entry RECORD;
  v_trivia_entry RECORD;
BEGIN
  -- Get room details
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  
  IF v_room IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Room not found');
  END IF;

  IF v_room.status != 'FUNDED' THEN
    RETURN json_build_object('success', false, 'error', 'Room is not funded');
  END IF;

  -- Get trivia ticket weight (stored as integer, e.g., 10 = 0.1)
  v_trivia_weight := get_trivia_config('TRIVIA_TICKET_WEIGHT')::NUMERIC / 100.0;

  -- Calculate total weighted tickets (paid + trivia*weight)
  SELECT 
    COALESCE(SUM(re.tickets), 0) + 
    COALESCE((SELECT SUM(rte.trivia_tickets) * v_trivia_weight FROM room_trivia_entries rte WHERE rte.room_id = p_room_id), 0)
  INTO v_total_weighted_tickets
  FROM room_entries re
  WHERE re.room_id = p_room_id AND re.status = 'active';

  IF v_total_weighted_tickets <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No entries in room');
  END IF;

  -- Generate cryptographic seeds
  v_server_seed := encode(gen_random_bytes(32), 'hex');
  v_client_seed := md5(p_room_id::TEXT || v_room.created_at::TEXT || v_total_weighted_tickets::TEXT);
  v_nonce := (SELECT COUNT(*) FROM lottery_draws WHERE room_id = p_room_id)::INTEGER + 1;
  
  -- Combine seeds
  v_combined_seed := encode(sha256((v_server_seed || v_client_seed || v_nonce::TEXT)::bytea), 'hex');
  
  -- Generate winning ticket number (1 to total_weighted_tickets)
  v_winning_ticket_raw := 1 + (('x' || substr(v_combined_seed, 1, 8))::bit(32)::bigint % v_total_weighted_tickets::bigint);
  v_winning_ticket := v_winning_ticket_raw::INTEGER;

  -- Find winner by iterating through all entries (paid first, then trivia)
  -- Paid entries
  FOR v_entry IN 
    SELECT id, user_id, tickets FROM room_entries 
    WHERE room_id = p_room_id AND status = 'active'
    ORDER BY staked_at
  LOOP
    v_cumulative := v_cumulative + v_entry.tickets;
    IF v_cumulative >= v_winning_ticket THEN
      v_winner_user_id := v_entry.user_id;
      v_winner_entry_id := v_entry.id;
      v_winner_type := 'PAID';
      EXIT;
    END IF;
  END LOOP;

  -- If not found in paid entries, check trivia entries
  IF v_winner_user_id IS NULL THEN
    FOR v_trivia_entry IN 
      SELECT id, user_id, trivia_tickets FROM room_trivia_entries 
      WHERE room_id = p_room_id
      ORDER BY created_at
    LOOP
      v_cumulative := v_cumulative + (v_trivia_entry.trivia_tickets * v_trivia_weight);
      IF v_cumulative >= v_winning_ticket THEN
        v_winner_user_id := v_trivia_entry.user_id;
        v_winner_entry_id := v_trivia_entry.id;
        v_winner_type := 'TRIVIA';
        EXIT;
      END IF;
    END LOOP;
  END IF;

  IF v_winner_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Could not determine winner');
  END IF;

  -- Record draw
  INSERT INTO lottery_draws (
    room_id, 
    total_tickets, 
    winning_ticket_number, 
    server_seed, 
    client_seed, 
    nonce,
    random_seed,
    verification_hash,
    winner_user_id,
    winner_entry_id
  ) VALUES (
    p_room_id,
    v_total_weighted_tickets::INTEGER,
    v_winning_ticket,
    v_server_seed,
    v_client_seed,
    v_nonce,
    v_combined_seed,
    encode(sha256(v_combined_seed::bytea), 'hex'),
    v_winner_user_id,
    v_winner_entry_id
  ) RETURNING id INTO v_draw_id;

  -- Update room status
  UPDATE rooms 
  SET status = 'SETTLED',
      winner_user_id = v_winner_user_id,
      winner_entry_id = v_winner_entry_id
  WHERE id = p_room_id;

  -- Update winner's entry
  IF v_winner_type = 'PAID' THEN
    UPDATE room_entries 
    SET outcome = 'WON', status = 'settled'
    WHERE id = v_winner_entry_id;
  END IF;

  -- Mark other paid entries as lost
  UPDATE room_entries 
  SET outcome = 'LOST', status = 'settled'
  WHERE room_id = p_room_id AND id != v_winner_entry_id AND status = 'active';

  RETURN json_build_object(
    'success', true,
    'draw_id', v_draw_id,
    'winner_user_id', v_winner_user_id,
    'winner_entry_id', v_winner_entry_id,
    'winner_type', v_winner_type,
    'winning_ticket', v_winning_ticket,
    'total_weighted_tickets', v_total_weighted_tickets,
    'trivia_weight', v_trivia_weight
  );
END;
$$;

-- 7. Function to get lot trivia stats (questions available, answered, etc.)
CREATE OR REPLACE FUNCTION public.get_lot_trivia_stats(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_questions_answered INTEGER;
  v_correct_answers INTEGER;
  v_max_questions INTEGER;
  v_credits_per_ticket INTEGER;
  v_max_free_tickets INTEGER;
  v_trivia_tickets INTEGER;
  v_user_credits INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get config
  v_max_questions := get_trivia_config('MAX_QUESTIONS_PER_LOT');
  v_credits_per_ticket := get_trivia_config('CREDITS_PER_FREE_TICKET');
  v_max_free_tickets := get_trivia_config('MAX_FREE_TICKETS_PER_LOT');

  -- Get user's answered questions for this lot
  SELECT COUNT(*), COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)
  INTO v_questions_answered, v_correct_answers
  FROM lot_trivia_questions
  WHERE user_id = v_user_id AND room_id = p_room_id;

  -- Get user's trivia tickets for this lot
  SELECT COALESCE(trivia_tickets, 0) INTO v_trivia_tickets
  FROM room_trivia_entries
  WHERE user_id = v_user_id AND room_id = p_room_id;

  -- Get user's current trivia credits
  SELECT COALESCE(credits, 0) INTO v_user_credits
  FROM user_trivia_credits WHERE user_id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'questions_answered', COALESCE(v_questions_answered, 0),
    'correct_answers', COALESCE(v_correct_answers, 0),
    'max_questions', v_max_questions,
    'can_answer_more', COALESCE(v_questions_answered, 0) < v_max_questions,
    'trivia_tickets', COALESCE(v_trivia_tickets, 0),
    'max_free_tickets', v_max_free_tickets,
    'can_get_more_tickets', COALESCE(v_trivia_tickets, 0) < v_max_free_tickets,
    'user_credits', COALESCE(v_user_credits, 0),
    'credits_per_ticket', v_credits_per_ticket,
    'affordable_tickets', FLOOR(COALESCE(v_user_credits, 0)::NUMERIC / v_credits_per_ticket)
  );
END;
$$;