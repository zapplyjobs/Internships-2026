#!/usr/bin/env node

/**
 * Aggregator Consumer - Fetch internships from jobs-data-2026 tagged feed
 *
 * This module fetches jobs from the centralized aggregator and filters
 * for internship positions across all domains.
 *
 * Feature flag: USE_AGGREGATOR=true (in workflow or environment)
 */

const https = require('https');

// Aggregator URLs (PRIVATE repo - requires authentication)
const AGGREGATOR_URL = 'https://raw.githubusercontent.com/zapplyjobs/jobs-aggregator-private/main/.github/data/all_jobs.json';
const METADATA_URL = 'https://raw.githubusercontent.com/zapplyjobs/jobs-aggregator-private/main/.github/data/jobs-metadata.json';

/**
 * Fetch JSONL file from aggregator
 * @returns {Promise<Array>} - Array of job objects
 */
async function fetchJobsFromAggregator() {
  return new Promise((resolve, reject) => {
    // Get GitHub token for authentication (private repo access)
    const token = process.env.GITHUB_TOKEN || process.env.GH_PAT;

    const options = {
      headers: token ? { 'Authorization': `token ${token}` } : {}
    };

    https.get(AGGREGATOR_URL, options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          // Parse JSONL (one JSON per line)
          const lines = data.trim().split('\n').filter(line => line);
          const jobs = lines.map(line => {
            try {
              return JSON.parse(line);
            } catch (error) {
              console.warn('⚠️ Failed to parse line:', line.substring(0, 50));
              return null;
            }
          }).filter(job => job !== null);

          resolve(jobs);
        } catch (error) {
          reject(new Error(`Failed to parse jobs: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Filter jobs for internships across all domains
 * @param {Array} jobs - Array of tagged jobs from aggregator
 * @returns {Array} - Filtered internship jobs
 */
function filterInternshipJobs(jobs) {
  if (!Array.isArray(jobs)) {
    console.warn('filterInternshipJobs: jobs is not an array');
    return [];
  }

  return jobs.filter(job => {
    // Skip jobs without tags
    if (!job.tags) {
      return false;
    }

    // Must be tagged as internship
    if (job.tags.employment !== 'internship') {
      return false;
    }

    // Must have at least one domain tag
    if (!job.tags.domains || !Array.isArray(job.tags.domains) || job.tags.domains.length === 0) {
      return false;
    }

    return true;
  });
}

/**
 * Convert aggregator job format to Internships-2026 format
 * @param {Object} aggregatorJob - Job from aggregator
 * @returns {Object} - Job in Internships-2026 format
 */
function convertJobFormat(aggregatorJob) {
  // Extract location from aggregator's location object
  const location = aggregatorJob.location || {};
  const jobCity = location.city || aggregatorJob.job_city || '';
  const jobState = location.state || location.region || '';
  const jobCountry = location.country || 'US';

  // Map aggregator fields to existing format
  return {
    // Core fields (existing format)
    job_id: aggregatorJob.id,
    job_title: aggregatorJob.title,
    employer_name: aggregatorJob.company_name,
    job_city: jobCity,
    job_state: jobState,
    job_country: jobCountry === 'US' ? 'United States' : jobCountry,
    job_is_remote: aggregatorJob.tags?.locations?.includes('remote') || false,
    job_apply_link: aggregatorJob.apply_url || aggregatorJob.url,
    job_posted_at_datetime_utc: aggregatorJob.posted_at,
    job_description: aggregatorJob.description || null,
    job_employment_type: aggregatorJob.employment_types?.join(',') || 'INTERN',

    // Tags from aggregator (for reference)
    _tags: aggregatorJob.tags,

    // Source info
    _source: 'aggregator',
    _original_source: aggregatorJob.source || 'jsearch',

    // Include fingerprint for deduplication
    fingerprint: aggregatorJob.fingerprint
  };
}

/**
 * Fetch jobs from aggregator for Internships-2026
 * @returns {Promise<Array>} - Array of internship jobs
 */
async function fetchAllJobs() {
  const startTime = Date.now();

  console.log('🚀 Starting aggregator fetch for Internships-2026...');
  console.log('━'.repeat(60));

  try {
    // Fetch from aggregator
    console.log('\n📡 Fetching from jobs-data-2026 aggregator...');
    const allJobs = await fetchJobsFromAggregator();

    console.log(`✅ Aggregator returned: ${allJobs.length} total jobs`);
    console.log(`   Source: ${AGGREGATOR_URL}`);

    // Filter for internships
    console.log('\n🏷️  Filtering for internships...');
    const internshipJobs = filterInternshipJobs(allJobs);

    console.log(`✅ Internship filter: ${internshipJobs.length} jobs`);

    // Print domain breakdown
    const domainCounts = {};
    for (const job of internshipJobs) {
      if (job.tags?.domains) {
        for (const domain of job.tags.domains) {
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        }
      }
    }

    console.log('\n📊 Domain breakdown:');
    for (const [domain, count] of Object.entries(domainCounts)) {
      console.log(`   ${domain}: ${count}`);
    }

    // Convert to Internships-2026 format
    console.log('\n🔄 Converting to Internships-2026 format...');
    const convertedJobs = internshipJobs.map(convertJobFormat);

    // Remove duplicates (by job_id)
    console.log('\n🔄 Removing duplicates...');
    const uniqueJobs = [];
    const seenIds = new Set();

    for (const job of convertedJobs) {
      if (!seenIds.has(job.job_id)) {
        seenIds.add(job.job_id);
        uniqueJobs.push(job);
      }
    }

    const duplicatesRemoved = convertedJobs.length - uniqueJobs.length;
    console.log(`   Duplicates removed: ${duplicatesRemoved}`);

    // Sort by posting date
    uniqueJobs.sort((a, b) => {
      const dateA = new Date(a.job_posted_at_datetime_utc || 0);
      const dateB = new Date(b.job_posted_at_datetime_utc || 0);
      return dateB - dateA; // Latest first
    });

    // Final summary
    const duration = Date.now() - startTime;
    console.log('\n' + '━'.repeat(60));
    console.log('✅ Aggregator fetch complete!');
    console.log(`📊 Final count: ${uniqueJobs.length} unique internship jobs`);
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log('━'.repeat(60) + '\n');

    return uniqueJobs;

  } catch (error) {
    console.error('\n❌ Error fetching from aggregator:', error.message);

    // If aggregator fails, fall back to empty array (don't crash)
    // The workflow will show 0 jobs and alert the team
    console.log('\n⚠️  Returning empty job array');
    console.log('⚠️  Check aggregator status: https://github.com/zapplyjobs/jobs-data-2026');

    return [];
  }
}

/**
 * Check if aggregator consumer is enabled
 * @returns {boolean} - True if USE_AGGREGATOR env var is 'true' or '1'
 */
function isAggregatorEnabled() {
  const flag = process.env.USE_AGGREGATOR;
  return flag === 'true' || flag === '1';
}

module.exports = {
  fetchAllJobs,
  fetchJobsFromAggregator,
  filterInternshipJobs,
  convertJobFormat,
  isAggregatorEnabled,
  AGGREGATOR_URL
};

// Allow running directly for testing
if (require.main === module) {
  fetchAllJobs()
    .then(jobs => {
      console.log('\n📊 Test Results:');
      console.log(`Fetched: ${jobs.length} jobs`);
      console.log('\nFirst 3 jobs:');
      jobs.slice(0, 3).forEach(job => {
        console.log(`  - ${job.job_title} at ${job.employer_name}`);
        console.log(`    Tags:`, job._tags);
      });
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}
