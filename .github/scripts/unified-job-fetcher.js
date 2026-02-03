/**
 * Unified Job Fetcher - Internships ONLY
 *
 * IMPORTANT: This repo now uses jobs-data-2026 central aggregator as PRIMARY data source
 * The aggregator fetches from JSearch API and distributes to all consumer repos
 *
 * Sources:
 * 1. jobs-data-2026 shared-data (PRIMARY - filtered internships from JSearch)
 * 2. API-based companies (optional - for company-specific integrations)
 */

const fs = require('fs');
const path = require('path');
const { getCompanies } = require('../../jobboard/src/backend/config/companies.js');
const { fetchAPIJobs } = require('../../jobboard/src/backend/services/apiService.js');
const { generateJobId, isUSOnlyJob } = require('./job-fetcher/utils.js');

// Path to shared data (filtered internships from jobs-data-2026)
const SHARED_DATA_PATH = path.join(process.cwd(), '.github', 'data', 'shared-jobs-filtered.jsonl');

/**
 * Delay helper for rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Load jobs from shared data
 * @returns {Array} - Array of job objects
 */
function loadSharedJobs() {
  try {
    if (!fs.existsSync(SHARED_DATA_PATH)) {
      console.warn(`⚠️ Shared data file not found: ${SHARED_DATA_PATH}`);
      return [];
    }

    const content = fs.readFileSync(SHARED_DATA_PATH, 'utf8');
    const lines = content.trim().split('\n').filter(line => line);

    const jobs = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.warn(`⚠️ Failed to parse line: ${line.substring(0, 50)}...`);
        return null;
      }
    }).filter(job => job !== null);

    console.log(`📂 Loaded ${jobs.length} internship jobs from shared data`);
    return jobs;

  } catch (error) {
    console.error(`❌ Error loading shared jobs:`, error.message);
    return [];
  }
}

/**
 * Convert shared job format to internal format
 * @param {Object} job - Shared job object
 * @returns {Object} - Internal job object
 */
function convertSharedJobToInternal(job) {
  return {
    // Core fields (shared data format)
    job_id: job.id,
    job_title: job.title,
    employer_name: job.company,
    job_city: job.location,
    job_is_remote: job.remote,
    job_apply_link: job.url,
    job_posted_at_datetime_utc: job.posted_at,
    job_description: job.description || '',
    job_employment_type: job.employment_types || [],
    job_job_title: job.title,

    // Source tracking
    _source: 'shared-data',
    _original_source: job.source,
  };
}

/**
 * Fetch jobs from all configured sources
 * @returns {Promise<Array>} Array of unique job objects
 */
async function fetchAllJobs() {
  console.log('🚀 Starting unified job collection...');
  console.log('━'.repeat(50));

  const allJobs = [];

  // === Part 1: PRIMARY - Shared data from jobs-data-2026 ===
  console.log('\n📡 Loading from shared-data (PRIMARY source)...');

  const sharedJobs = loadSharedJobs();
  const convertedJobs = sharedJobs.map(convertSharedJobToInternal);
  allJobs.push(...convertedJobs);

  console.log(`📊 After shared-data: ${allJobs.length} jobs total`);

  // === Part 2: Fetch from API-based companies (optional) ===
  // NOTE: Individual company APIs - for company-specific integrations
  console.log('\n📡 Checking API-based companies...');

  const companies = getCompanies();
  const companyKeys = Object.keys(companies);

  if (companyKeys.length > 0) {
    for (const key of companyKeys) {
      const company = companies[key];

      try {
        const jobs = await fetchAPIJobs(company);

        if (jobs && jobs.length > 0) {
          allJobs.push(...jobs);
        }

        // Rate limiting: 2 second delay between API calls
        await delay(2000);

      } catch (error) {
        console.error(`❌ Error processing ${company.name}:`, error.message);
      }
    }
    console.log(`\n📊 API companies total: ${allJobs.length} jobs`);
  } else {
    console.log(`   No API companies configured`);
  }

  // === Part 3: Filter to US-only jobs ===
  console.log('\n🇺🇸 Filtering to US-only jobs...');

  const removedJobs = [];
  const usJobs = allJobs.filter(job => {
    const isUSJob = isUSOnlyJob(job);

    if (!isUSJob) {
      removedJobs.push(job);
      return false;
    }

    return true;
  });

  console.log(`   Kept: ${usJobs.length} US jobs`);
  console.log(`   Removed: ${removedJobs.length} non-US jobs`);

  // === Part 4: Remove duplicates ===
  console.log('\n🔄 Removing duplicates...');

  const uniqueJobs = usJobs.filter((job, index, self) => {
    const jobId = generateJobId(job);
    return index === self.findIndex(j => generateJobId(j) === jobId);
  });

  const duplicatesRemoved = usJobs.length - uniqueJobs.length;
  console.log(`   Duplicates removed: ${duplicatesRemoved}`);

  // === Part 5: Sort by posting date ===
  uniqueJobs.sort((a, b) => {
    const dateA = new Date(a.job_posted_at_datetime_utc || 0);
    const dateB = new Date(b.job_posted_at_datetime_utc || 0);
    return dateB - dateA; // Latest first
  });

  // === Final Summary ===
  console.log('\n' + '━'.repeat(50));
  console.log('✅ Job collection complete!');
  console.log(`📊 Final count: ${uniqueJobs.length} unique jobs`);
  console.log('━'.repeat(50) + '\n');

  return uniqueJobs;
}

module.exports = {
  fetchAllJobs
};
