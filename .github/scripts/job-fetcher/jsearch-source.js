/**
 * JSearch API Integration (PAID TIER)
 *
 * Full-featured implementation for internship-specific job searches
 * Paid tier: 2,500 requests/month (~83 requests/day with safety margin)
 *
 * Features:
 * - 5 targeted internship queries
 * - Query rotation (1 query per run)
 * - Rate limiting (80 requests/day max for safety)
 * - Graceful error handling
 */

const fs = require('fs');
const path = require('path');

// Configuration - PAID API KEY
const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY || 'e07540d3e5msh515ec67c062f15dp170d38jsn657708c915e8';
const JSEARCH_BASE_URL = 'https://jsearch.p.rapidapi.com/search';
const MAX_REQUESTS_PER_DAY = 100;  // Paid tier: 10000/month = ~333/day, workflow runs 96/day (every 15min)
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

    // Initialize new tracking file (paid tier)
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
        url.searchParams.append('num_pages', '10');  // Max 10 pages = 100 jobs per request
        url.searchParams.append('date_posted', 'month');
        url.searchParams.append('country', 'us');  // IMPORTANT: Always specify country explicitly
        url.searchParams.append('employment_types', 'INTERN');  // Internships only (string, not array)
        url.searchParams.append('job_requirements', 'no_experience');  // Entry level only

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
        const jobs = data.data || {};

        // Update usage tracking with detailed metrics
        usage.requests++;
        usage.remaining = MAX_REQUESTS_PER_DAY - usage.requests;
        usage.queries_executed.push(query);

        // Add performance metrics
        if (!usage.metrics) usage.metrics = {};
        if (!usage.metrics.jobs_per_query) usage.metrics.jobs_per_query = {};
        if (!usage.metrics.jobs_per_query[query]) usage.metrics.jobs_per_query[query] = [];
        usage.metrics.jobs_per_query[query].push(jobs.length);

        // Track total jobs fetched
        if (!usage.metrics.total_jobs) usage.metrics.total_jobs = 0;
        usage.metrics.total_jobs += jobs.length;

        // Calculate averages
        const avgJobsPerRequest = usage.metrics.total_jobs / usage.requests;

        saveUsageTracking(usage);

        console.log(`✅ JSearch returned ${jobs.length} jobs (avg ${avgJobsPerRequest.toFixed(1)} jobs/request)`);
        console.log(`📊 Usage today: ${usage.requests}/${MAX_REQUESTS_PER_DAY} requests, ${usage.remaining} remaining`);
        console.log(`📈 Total jobs fetched today: ${usage.metrics.total_jobs}`);

        // Normalize jobs to internal format (pass full response, not just jobs array)
        return normalizeJSearchJobs(data);

    } catch (error) {
        console.error('❌ JSearch API error:', error.message);
        return [];
    }
}

/**
 * Normalize company name from JSearch data
 * JSearch sometimes returns internal field names instead of actual company names
 * Examples: "Org_Subtype_BU023_Global_Services" should be "Dell"
 */
function normalizeCompanyName(job) {
    const employerName = job.employer_name || '';

    // Internal field patterns that indicate bad data
    const internalPatterns = [
        /^Org_Subtype_/i,        // Dell: "Org_Subtype_BU023_Global_Services"
        /^BU\d+_/i,              // Various internal BU codes
        /^Department_/i,         // Department-based names
        /^Division_/i,           // Division-based names
    ];

    const needsNormalization = internalPatterns.some(pattern =>
        pattern.test(employerName)
    );

    if (!needsNormalization) {
        return employerName;
    }

    // Try to extract company from apply URL domain
    if (job.job_apply_link) {
        const urlMatch = job.job_apply_link.match(/https?:\/\/(?:www\.)?([^\/]+)/i);
        if (urlMatch) {
            const domain = urlMatch[1].toLowerCase();

            // Known domain to company mappings
            const domainMappings = {
                'jobs.dell.com': 'Dell',
                'dell.com': 'Dell',
                'jobs.apple.com': 'Apple',
                'careers.apple.com': 'Apple',
                'careers.google.com': 'Google',
                'google.com': 'Google',
                'jobs.netflix.com': 'Netflix',
                'careers.microsoft.com': 'Microsoft',
                'jobs.amazon.com': 'Amazon',
                'careers.meta.com': 'Meta',
                'jobs.fb.com': 'Meta',
            };

            // Check for exact domain match
            if (domainMappings[domain]) {
                return domainMappings[domain];
            }

            // Extract from second-level domain (e.g., "careers.company.com" -> "Company")
            const parts = domain.split('.');
            if (parts.length >= 2) {
                const secondLevel = parts[parts.length - 2];
                // Capitalize first letter of each word
                return secondLevel.split('-').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
            }
        }
    }

    // Fallback to original employer name
    return employerName;
}

/**
 * Normalize JSearch job format to internal format
 * JSearch API returns nested format: data: {0: {job}, 1: {job}, ...}
 */
function normalizeJSearchJobs(response) {
    // Handle nested response format: data: {0: {job}, 1: {job}, ...}
    // NOT a simple array!
    let jobsArray;
    if (response.data && typeof response.data === 'object') {
        // Convert {0: {}, 1: {}, ...} to array
        jobsArray = Object.values(response.data);
    } else if (Array.isArray(response.data)) {
        jobsArray = response.data;
    } else {
        console.error('❌ Unexpected JSearch response format');
        return [];
    }

    return jobsArray.map(job => {
        try {
            // Normalize company name FIRST (before any filtering)
            const normalizedEmployer = normalizeCompanyName(job);

            // Internship filter: Only accept true internships
            const title = (job.job_title || '').toLowerCase();
            const desc = (job.job_description || '').toLowerCase();

            // Must have internship keyword in title OR description
            const internKeywords = ['intern', 'internship', 'co-op', 'coop'];
            const hasInternKeyword = internKeywords.some(kw =>
                title.includes(kw) || desc.substring(0, 500).includes(kw)
            );

            if (!hasInternKeyword) {
                return null; // Skip non-internship roles
            }

            // Reject fake internships (senior roles with "intern" in title)
            const fakeInternPatterns = ['senior intern', 'sr. intern', 'principal intern', 'manager intern'];
            const isFakeIntern = fakeInternPatterns.some(pattern => title.includes(pattern));

            if (isFakeIntern) {
                return null;
            }

            return {
                job_title: job.job_title || '',
                employer_name: normalizedEmployer,
                job_city: job.job_city || '',
                job_state: job.job_state || '',
                job_description: job.job_description || '',
                job_apply_link: job.job_apply_link || job.job_google_link || '',
                job_posted_at_datetime_utc: job.job_posted_at_datetime_utc || new Date().toISOString(),
                job_employment_type: job.job_employment_type || 'INTERN',
                // Additional metadata
                job_source: 'jsearch',
                job_publisher: job.job_publisher || 'JSearch API',
                // JSearch-specific fields
                job_is_remote: job.job_is_remote || false,
                job_location: job.job_location || ''
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
