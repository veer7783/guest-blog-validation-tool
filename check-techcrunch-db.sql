-- Check if techcrunch.com exists in Main Project database
-- Run this query in your Main Project database

-- Check in guest_blog_sites table (or whatever the table name is)
SELECT 
    id,
    site_url,
    status,
    created_at,
    updated_at
FROM guest_blog_sites
WHERE 
    site_url LIKE '%techcrunch.com%'
    OR site_url = 'techcrunch.com'
    OR site_url = 'https://techcrunch.com'
    OR site_url = 'http://techcrunch.com'
    OR site_url = 'www.techcrunch.com'
    OR site_url = 'https://www.techcrunch.com';

-- Also check for normalized versions
SELECT 
    id,
    site_url,
    status,
    created_at
FROM guest_blog_sites
WHERE 
    LOWER(REPLACE(REPLACE(REPLACE(site_url, 'https://', ''), 'http://', ''), 'www.', '')) = 'techcrunch.com';

-- Count total records in table
SELECT COUNT(*) as total_sites FROM guest_blog_sites;

-- Show first 10 records to verify table structure
SELECT * FROM guest_blog_sites LIMIT 10;
