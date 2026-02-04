/**
 * Unified Job Fetcher - Internships ONLY
 *
 * Data Sources:
 * 1. JSearch API (direct) - Default via jsearch-source.js
 * 2. Aggregator (jobs-data-2026) - When USE_AGGREGATOR=true
 *
 * Feature Flag:
 *   - USE_AGGREGATOR=true: Fetch from tagged aggregator feed
 *   - USE_AGGREGATOR=false or unset: Fetch directly from JSearch API
 */

const { searchJSearchInternships } = require('./job-fetcher/jsearch-source');
const { fetchAllJobs: fetchFromAggregator, isAggregatorEnabled } = require('./job-fetcher/aggregator-consumer');
const { generateJobId, isUSOnlyJob } = require('./job-fetcher/utils.js');

/**
 * Fetch jobs from JSearch API (direct)
 * @returns {Promise<Array>} Array of unique job objects
 */
async function fetchFromJSearchDirect() {
  console.log('📡 Mode: Direct JSearch API');
  console.log('━'.repeat(50));

  // Fetch from JSearch API
  console.log('\n📡 Fetching from JSearch API...');
  const jsearchJobs = await searchJSearchInternships();

  console.log(`📊 JSearch returned: ${jsearchJobs.length} jobs`);

  // Filter to US-only jobs
  console.log('\n🇺🇸 Filtering to US-only jobs...');
  const usJobs = jsearchJobs.filter(job => isUSOnlyJob(job));
  console.log(`   Kept: ${usJobs.length} US jobs`);
  console.log(`   Removed: ${jsearchJobs.length - usJobs.length} non-US jobs`);

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

  return uniqueJobs;
}

/**
 * Fetch jobs from aggregator (jobs-data-2026)
 * @returns {Promise<Array>} Array of unique job objects
 */
async function fetchFromAggregatorFeed() {
  console.log('📡 Mode: Tagged Aggregator Feed');
  console.log('━'.repeat(50));
  console.log('   Source: jobs-data-2026');
  console.log('   Filter: employment=internship, domains=[all]');

  return await fetchFromAggregator();
}

/**
 * Fetch jobs from the appropriate source based on feature flag
 * @returns {Promise<Array>} Array of unique job objects
 */
async function fetchAllJobs() {
  console.log('🚀 Starting job collection for Internships-2026...');
  console.log('━'.repeat(50));

  // Check feature flag
  const useAggregator = isAggregatorEnabled();

  console.log(`\n🔧 Feature Flag: USE_AGGREGATOR=${useAggregator ? 'true' : 'false'}`);

  let uniqueJobs;

  if (useAggregator) {
    // Use aggregator feed
    uniqueJobs = await fetchFromAggregatorFeed();
  } else {
    // Use direct JSearch API (default)
    uniqueJobs = await fetchFromJSearchDirect();
  }

  // Final summary
  console.log('\n' + '━'.repeat(50));
  console.log('✅ Job collection complete!');
  console.log(`📊 Final count: ${uniqueJobs.length} unique jobs`);
  console.log(`📡 Source: ${useAggregator ? 'Aggregator' : 'Direct JSearch API'}`);
  console.log('━'.repeat(50) + '\n');

  return uniqueJobs;
}

module.exports = {
  fetchAllJobs,
  fetchFromJSearchDirect,
  fetchFromAggregatorFeed,
  isAggregatorEnabled: isAggregatorEnabled
};
