#!/usr/bin/env node

/**
 * Unified Job Fetcher - Internships-2026
 *
 * Wrapper around shared aggregator-consumer library.
 * Fetches ONLY internship positions from centralized aggregator.
 *
 * Architecture:
 * - Uses shared library: .github/scripts/shared/lib/aggregator-consumer.js
 * - Filters for employment: 'internship' only
 * - Aggregator already filtered out senior-level positions
 */

const { createAggregatorConsumer } = require('./shared/lib/aggregator-consumer');

/**
 * Fetch internship jobs (from centralized aggregator)
 * @returns {Promise<Array>} Array of internship job objects
 */
async function fetchAllJobs() {
  // Create consumer filtered for internships only
  const consumer = createAggregatorConsumer({
    filters: {
      employment: 'internship' // Only internships
    },
    verbose: true
  });

  return await consumer.fetchJobs();
}

module.exports = { fetchAllJobs };

// Run the script if called directly (for testing)
if (require.main === module) {
  fetchAllJobs()
    .then(jobs => {
      console.log(`\n✅ Fetched ${jobs.length} internship jobs from aggregator`);
      console.log('\n📊 First 3 jobs:');
      jobs.slice(0, 3).forEach((job, i) => {
        console.log(`${i + 1}. ${job.job_title} @ ${job.employer_name}`);
      });
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    });
}
