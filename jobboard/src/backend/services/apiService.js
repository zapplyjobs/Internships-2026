/**
 * API Service Layer
 * Handles HTTP requests to external job data sources
 *
 * NOTE: SimplifyJobs integration removed - now using JSearch API only
 */

const axios = require('axios');

/**
 * Fetch jobs from API-based companies
 * @param {Object} company - Company configuration object
 * @returns {Promise<Array>} Array of job objects
 */
async function fetchAPIJobs(company) {
  if (!company.apiMode) {
    return null; // Not an API company, skip
  }

  try {
    console.log(`📡 Fetching from ${company.name} API...`);

    const response = await axios.get(company.url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'JobAggregator/1.0'
      },
      timeout: 30000 // 30 second timeout
    });

    // Use company-specific parser if available
    if (company.parser && typeof company.parser === 'function') {
      const jobs = company.parser(response.data);
      console.log(`✅ ${company.name}: ${jobs.length} jobs`);
      return jobs;
    }

    console.log(`⚠️  ${company.name}: No parser function defined`);
    return [];

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error(`⏱️  ${company.name}: Request timeout (>30s)`);
    } else if (error.response) {
      console.error(`❌ ${company.name}: HTTP ${error.response.status}`);
    } else {
      console.error(`❌ ${company.name}: ${error.message}`);
    }
    return [];
  }
}

/**
 * Fetch jobs from external aggregator service
 * NOTE: Deprecated - SimplifyJobs integration removed
 * Now using JSearch API via jsearch-source.js
 * @returns {Promise<Array>} Empty array (function deprecated)
 */
async function fetchExternalJobsData() {
  console.log('⚠️  fetchExternalJobsData() is deprecated - using JSearch API instead');
  return [];
}

/**
 * Helper function to safely convert dates to ISO string
 * @param {*} dateValue - Date value to convert (Unix timestamp in seconds or milliseconds)
 * @returns {string|null} ISO string or null
 */
function safeISOString(dateValue) {
  if (!dateValue) return null;

  try {
    // Convert to milliseconds if timestamp is in seconds (< 10 billion)
    const timestamp = dateValue < 10000000000 ? dateValue * 1000 : dateValue;

    // Validate: must be between Jan 1, 2023 and Dec 31, 2026 (reasonable range for new grad jobs)
    const MIN_TIMESTAMP = new Date('2023-01-01').getTime();
    const MAX_TIMESTAMP = new Date('2026-12-31').getTime();

    if (timestamp < MIN_TIMESTAMP || timestamp > MAX_TIMESTAMP) {
      console.log(`⚠️ Invalid timestamp ${dateValue} (${new Date(timestamp).toISOString()}) - outside valid range`);
      return null; // Invalid date range
    }

    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
}

module.exports = {
  fetchAPIJobs,
  fetchExternalJobsData
};
