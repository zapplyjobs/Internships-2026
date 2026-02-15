#!/usr/bin/env node

/**
 * Unified Job Fetcher - Centralized Aggregator Integration
 *
 * This module provides a unified interface for fetching internship jobs.
 * Post-aggregator migration (2026-02-15), it fetches from the centralized
 * jobs-aggregator-private repository and filters for internships.
 *
 * Previous approach (archived):
 * - Fetched from JSearch API + ATS sources directly
 * - Each repo had duplicate fetching logic
 *
 * New approach:
 * - Single centralized aggregator (jobs-aggregator-private)
 * - Repos consume from aggregator
 * - Aggregator handles JSearch + ATS + senior filtering + deduplication
 * - This repo filters for internship positions only
 */

const { fetchAllJobs: fetchFromAggregator } = require('./job-fetcher/aggregator-consumer');

/**
 * Fetch internship jobs (from centralized aggregator)
 * @returns {Promise<Array>} Array of internship job objects
 */
async function fetchAllJobs() {
  console.log('📡 Fetching internships from centralized aggregator...');

  try {
    const jobs = await fetchFromAggregator();

    console.log(`✅ Fetched ${jobs.length} internship jobs from aggregator`);

    return jobs;
  } catch (error) {
    console.error('❌ Failed to fetch from aggregator:', error.message);

    // Return empty array on failure (don't crash workflow)
    return [];
  }
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
