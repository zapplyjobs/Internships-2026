/**
 * Unified Job Fetcher - Internships ONLY
 *
 * IMPORTANT: This repo uses JSearch API as PRIMARY data source
 * ATS platforms (Greenhouse/Lever/Ashby) return ALL jobs including senior roles
 * We use internship-specific API queries to filter for relevant roles
 *
 * Sources:
 * 1. JSearch API (PRIMARY - configured via JSEARCH_API_KEY secret)
 */

const { getCompanies } = require('../../jobboard/src/backend/config/companies.js');
const { fetchAPIJobs } = require('../../jobboard/src/backend/services/apiService.js');
const { generateJobId, isUSOnlyJob } = require('./job-fetcher/utils.js');

/**
 * Delay helper for rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch jobs from all configured sources
 * @returns {Promise<Array>} Array of unique job objects
 */
async function fetchAllJobs() {
  console.log('🚀 Starting unified job collection...');
  console.log('━'.repeat(50));

  const allJobs = [];

  // === Part 1: Fetch from API-based companies ===
  // NOTE: Individual company APIs disabled - all data now from aggregator
  // This section kept for potential future use if needed
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
    console.log(`   No API companies configured (using aggregator only)`);
  }

  // === Part 2: PRIMARY JSearch API ===
  console.log('\n📡 Fetching from JSearch API (PRIMARY source)...');

  try {
    const { searchJSearchInternships } = require('./job-fetcher/jsearch-source');
    const jsearchJobs = await searchJSearchInternships();
    allJobs.push(...jsearchJobs);
    console.log(`📊 After JSearch: ${allJobs.length} jobs total`);
  } catch (error) {
    console.error('❌ JSearch API failed:', error.message);
    throw new Error('JSearch is primary source - cannot continue without it');
  }

  // === Part 3: ATS platforms DISABLED for Internships ===
  // NOTE: Greenhouse/Lever/Ashby APIs return ALL jobs (including senior positions)
  // They do NOT filter to internships only - we use targeted API queries instead
  console.log('\n⏭️ Skipping ATS platforms (returns all jobs, not internships-only)...');

  // === Part 4: Filter to US-only jobs ===
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

  // === Part 5: Remove duplicates ===
  console.log('\n🔄 Removing duplicates...');

  const uniqueJobs = usJobs.filter((job, index, self) => {
    const jobId = generateJobId(job);
    return index === self.findIndex(j => generateJobId(j) === jobId);
  });

  const duplicatesRemoved = usJobs.length - uniqueJobs.length;
  console.log(`   Duplicates removed: ${duplicatesRemoved}`);

  // === Part 6: Sort by posting date ===
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
