/**
 * JSearch API Integration
 *
 * Minimal implementation for internship-specific job searches
 * Free tier: 200 requests/month (6/day with safety margin)
 *
 * Features:
 * - 5 targeted internship queries
 * - Query rotation (1 query per run)
 * - Rate limiting (6 requests/day max)
 * - Graceful error handling
 */

const fs = require('fs');
const path = require('path');

// Configuration
const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY || 'YOUR_KEY_HERE';
const JSEARCH_BASE_URL = 'https://jsearch.p.rapidapi.com/search';
const MAX_REQUESTS_PER_DAY = 6;
const USAGE_FILE = path.join(__dirname, '../../data/jsearch_usage.json');

// Internship-specific queries (targeted to avoid wasting free tier)
const INTERNSHIP_QUERIES = [
    'software engineer intern',
    'software engineering internship',
    'data science intern',
    'machine learning intern',
    'product manager intern'
];

/**
 * Load or initialize usage tracking file
 */
function loadUsageTracking() {
    try {
        if (fs.existsSync(USAGE_FILE)) {
            const data = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
            const today = new Date().toISOString().split('T')[0];

            // Reset counter if new day
            if (data.date !== today) {
                return {
                    date: today,
                    requests: 0,
                    remaining: MAX_REQUESTS_PER_DAY,
                    queries_executed: []
                };
            }
            return data;
        }
    } catch (error) {
        console.error('⚠️ Error loading usage tracking:', error.message);
    }

    // Initialize new tracking file
    return {
        date: new Date().toISOString().split('T')[0],
        requests: 0,
        remaining: MAX_REQUESTS_PER_DAY,
        queries_executed: []
    };
}

/**
 * Save usage tracking
 */
function saveUsageTracking(data) {
    try {
        const dir = path.dirname(USAGE_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('⚠️ Error saving usage tracking:', error.message);
    }
}

/**
 * Search JSearch API for internships
 */
async function searchJSearchInternships() {
    // Check if API key is configured
    if (JSEARCH_API_KEY === 'YOUR_KEY_HERE') {
        console.log('⏸️ JSearch API key not configured (placeholder detected)');
        return [];
    }

    // Load usage tracking
    const usage = loadUsageTracking();

    // Check rate limit
    if (usage.requests >= MAX_REQUESTS_PER_DAY) {
        console.log(`⏸️ JSearch daily limit reached (${usage.requests}/${MAX_REQUESTS_PER_DAY}), skipping this run`);
        return [];
    }

    // Log available quota for visibility
    console.log(`📊 JSearch quota available: ${usage.remaining}/${MAX_REQUESTS_PER_DAY} requests remaining`);

    try {
        // Rotate queries based on current hour (spreads requests across queries)
        const currentHour = new Date().getUTCHours();
        const queryIndex = currentHour % INTERNSHIP_QUERIES.length;
        const query = INTERNSHIP_QUERIES[queryIndex];

        console.log(`📡 JSearch API - Query: "${query}" (${usage.requests + 1}/${MAX_REQUESTS_PER_DAY} today)`);

        // Build API request
        const url = new URL(JSEARCH_BASE_URL);
        url.searchParams.append('query', `${query} United States`);
        url.searchParams.append('page', '1');
        url.searchParams.append('num_pages', '1');
        url.searchParams.append('date_posted', 'month');
        url.searchParams.append('employment_types', 'FULLTIME,INTERN');
        url.searchParams.append('job_requirements', 'no_experience,under_3_years_experience');

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': JSEARCH_API_KEY,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            console.error(`❌ JSearch API request failed: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        const jobs = data.data || [];

        // Update usage tracking
        usage.requests++;
        usage.remaining = MAX_REQUESTS_PER_DAY - usage.requests;
        usage.queries_executed.push(query);
        saveUsageTracking(usage);

        console.log(`✅ JSearch returned ${jobs.length} jobs`);
        console.log(`📊 Usage today: ${usage.requests}/${MAX_REQUESTS_PER_DAY} requests, ${usage.remaining} remaining`);

        // Normalize jobs to internal format
        return normalizeJSearchJobs(jobs);

    } catch (error) {
        console.error('❌ JSearch API error:', error.message);
        return [];
    }
}

/**
 * Normalize JSearch job format to internal format
 */
function normalizeJSearchJobs(jobs) {
    return jobs.map(job => {
        try {
            return {
                job_title: job.job_title || '',
                employer_name: job.employer_name || '',
                job_city: job.job_city || '',
                job_state: job.job_state || '',
                job_description: job.job_description || '',
                job_apply_link: job.job_apply_link || job.job_google_link || '',
                job_posted_at_datetime_utc: job.job_posted_at_datetime_utc || new Date().toISOString(),
                job_employment_type: job.job_employment_type || 'INTERN',
                // Additional metadata
                job_source: 'jsearch',
                job_publisher: job.job_publisher || 'JSearch API'
            };
        } catch (error) {
            console.error('⚠️ Error normalizing JSearch job:', error.message);
            return null;
        }
    }).filter(job => job !== null);
}

module.exports = {
    searchJSearchInternships
};
