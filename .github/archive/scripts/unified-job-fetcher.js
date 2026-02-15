/**
 * Unified Job Fetcher - Internships ONLY
 *
 * Data Sources (ALL used together):
 * 1. JSearch API (direct) - Via jsearch-source.js
 * 2. Aggregator (jobs-data-2026) - When USE_AGGREGATOR=true
 *
 * Feature Flag:
 *   - USE_AGGREGATOR=true: Include aggregator feed
 *   - USE_AGGREGATOR=false: Direct JSearch only
 */

const { searchJSearchInternships } = require('./job-fetcher/jsearch-source');
const { fetchAllJobs: fetchFromAggregator, isAggregatorEnabled } = require('./job-fetcher/aggregator-consumer');
const { generateJobId, isUSOnlyJob } = require('./job-fetcher/utils.js');

/**
 * Fetch jobs from aggregator (jobs-data-2026)
 * @returns {Promise<Array>} Array of unique job objects
 */
async function fetchFromAggregatorFeed() {
  console.log('📡 Fetching from Aggregator (JSearch)...');
  console.log('   Source: jobs-data-2026');
  console.log('   Filter: employment=internship, domains=[all]');

  return await fetchFromAggregator();
}

/**
 * Fetch jobs from JSearch API (direct)
 * @returns {Promise<Array>} Array of unique job objects
 */
async function fetchFromJSearchDirect() {
  console.log('\n📡 Fetching from JSearch API (direct)...');
  const jsearchJobs = await searchJSearchInternships();
  console.log(`📊 JSearch: ${jsearchJobs.length} jobs`);
  return jsearchJobs;
}

/**
 * Fetch jobs from all configured sources
 * @returns {Promise<Array>} Array of unique job objects
 */
async function fetchAllJobs() {
  console.log('🚀 Starting job collection for Internships-2026...');
  console.log('━'.repeat(50));

  const allJobs = [];
  const sources = [];

  // Check feature flag
  const useAggregator = isAggregatorEnabled();

  console.log(`\n🔧 Feature Flag: USE_AGGREGATOR=${useAggregator ? 'true' : 'false'}`);

  // === Source 1: Aggregator (if enabled) ===
  if (useAggregator) {
    try {
      const aggregatorJobs = await fetchFromAggregatorFeed();
      allJobs.push(...aggregatorJobs);
      sources.push('Aggregator (JSearch)');
    } catch (error) {
      console.error(`❌ Aggregator failed:`, error.message);
    }
  }

  // === Source 2: Direct JSearch (ALWAYS used) ===
  try {
    const jsearchJobs = await fetchFromJSearchDirect();
    allJobs.push(...jsearchJobs);
    if (!sources.includes('Aggregator (JSearch)')) {
      sources.push('Direct JSearch API');
    } else {
      sources.push('Direct JSearch API');
    }
  } catch (error) {
    console.error(`❌ Direct JSearch failed:`, error.message);
  }

  // Filter to US-only jobs
  console.log('\n🇺🇸 Filtering to US-only jobs...');
  const usJobs = allJobs.filter(job => isUSOnlyJob(job));
  console.log(`   Kept: ${usJobs.length} US jobs`);
  console.log(`   Removed: ${allJobs.length - usJobs.length} non-US jobs`);

  // Remove duplicates
  console.log('\n🔄 Removing duplicates...');
  const uniqueJobs = usJobs.filter((job, index, self) => {
    const jobId = generateJobId(job);
    return index === self.findIndex(j => generateJobId(j) === jobId);
  });
  const duplicatesRemoved = usJobs.length - uniqueJobs.length;
  console.log(`   Duplicates removed: ${duplicatesRemoved}`);

  // Sort by posting date
  uniqueJobs.sort((a, b) => {
    const dateA = new Date(a.job_posted_at_datetime_utc || 0);
    const dateB = new Date(b.job_posted_at_datetime_utc || 0);
    return dateB - dateA; // Latest first
  });

  // Final summary
  console.log('\n' + '━'.repeat(50));
  console.log('✅ Job collection complete!');
  console.log(`📊 Final count: ${uniqueJobs.length} unique jobs`);
  console.log(`📡 Sources: ${sources.join(' + ')}`);
  console.log('━'.repeat(50) + '\n');

  return uniqueJobs;
}

module.exports = {
  fetchAllJobs,
  fetchFromJSearchDirect,
  fetchFromAggregatorFeed,
  isAggregatorEnabled: isAggregatorEnabled
};
