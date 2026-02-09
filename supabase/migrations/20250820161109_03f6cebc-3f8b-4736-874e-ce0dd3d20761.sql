-- Create enhanced user experience tables for search, analytics, and A/B testing

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
('luxury watch appraisal', 'popular', 80);