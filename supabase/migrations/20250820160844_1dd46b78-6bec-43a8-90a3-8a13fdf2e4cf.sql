-- Create social proof and testimonials system tables

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
('countries_served', 'Countries Served', 25, '25+', 'Number of countries we serve', 'general');