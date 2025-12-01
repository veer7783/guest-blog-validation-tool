-- Check exact format of techcrunch.com in database
SELECT 
    id,
    site_url,
    LENGTH(site_url) as url_length,
    CHAR_LENGTH(site_url) as char_length,
    HEX(site_url) as hex_value,
    status
FROM guest_blog_sites
WHERE site_url LIKE '%techcrunch%'
LIMIT 5;

-- Check what the normalized version would be
SELECT 
    site_url as original,
    LOWER(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(site_url, 'https://', ''),
                    'http://', ''
                ),
                'www.', ''
            ),
            '/', ''
        )
    ) as normalized
FROM guest_blog_sites
WHERE site_url LIKE '%techcrunch%';

-- Check all variations that might exist
SELECT COUNT(*) as count, site_url 
FROM guest_blog_sites 
WHERE 
    site_url = 'techcrunch.com'
    OR site_url = 'https://techcrunch.com'
    OR site_url = 'https://techcrunch.com/'
    OR site_url = 'http://techcrunch.com'
GROUP BY site_url;
