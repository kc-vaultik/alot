-- Create pre-authentication features tables for valuation tools and educational content

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
'{"annual_return": {"label": "Annual Return", "format": "percentage"}, "total_return": {"label": "Total Return", "format": "currency"}, "vs_sp500": {"label": "vs S&P 500", "format": "comparison"}}');