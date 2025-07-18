
-- Fix the companies source constraint to allow 'enhanced_mining'
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_source_check;

-- Add updated constraint that includes 'enhanced_mining'
ALTER TABLE companies ADD CONSTRAINT companies_source_check 
CHECK (source IN ('manual', 'scraping', 'apollo', 'enrichment', 'enhanced_mining', 'import'));
