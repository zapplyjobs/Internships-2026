# Archived Scripts - Internships-2026

**Purpose:** Collection of scripts that are not actively used by workflows but may be useful for debugging, maintenance, or reference.

**Created:** 2026-02-08
**Status:** Archived - Not actively called by workflows

---

## Directory Structure

### analytics/ (2 files)
Scripts for analyzing job data and statistics.

### debugging/ (3 files)
Debug tools for encrypted data and log files.

### maintenance/ (9 files)
Scripts for system maintenance and data management.

### tests/ (1 file)
Experimental and test scripts.

### utils/ (2 files)
Utility scripts for logging and deduplication.

---

## What's Archived (17 scripts)

| File | Purpose | Why Archived |
|------|---------|-------------|
| **Analytics (2)** | | |
| channel-stats.js | Channel statistics tracking | Not called by workflows |
| query-metrics.js | Metrics query tool | Not called by workflows |
| **Debugging (3)** | | |
| decrypt-failure-log.js | Debug tool for failure logs | Not called by workflows |
| decrypt-jobs-data.js | Debug tool for encrypted data | Not called by workflows |
| decrypt-routing-logs.js | Debug tool for routing logs | Not called by workflows |
| **Maintenance (9)** | | |
| cleanup-intern-posts.js | Internship post cleanup | Not called by workflows |
| clone-location-channels.js | Channel cloning utility | Not called by workflows |
| create-audit-log.js | Audit log generator | Not called by workflows |
| cron-validator.js | Cron syntax validator | Not called by workflows |
| fix-ai-pattern.js | AI pattern fixer | Not called by workflows |
| post_with_bot.js | Legacy bot posting script | Not called by workflows |
| routing-logger.js | Routing logging utility | Not called by workflows |
| schema-validator.js | Schema validation tool | Not called by workflows |
| state-sync-manager.js | State sync utility | Not called by workflows |
| **Tests (1)** | | |
| advanced-job-fetcher.js | Experimental fetcher | Not called by workflows |
| **Utils (2)** | | |
| deduplication-logger.js | Deduplication logging | Not called by workflows |
| discord-post-logger.js | Post logging utility | Not called by workflows |

---

## Active Scripts (Not Archived)

The following scripts remain in `.github/scripts/` and are actively used:

**Core Job Processing:**
- `job-fetcher/` - Core job fetching and processing logic
- `jobs-data-exporter.js` - External data export
- `write-current-jobs.js` - Aggregator export

**Metrics & Reporting:**
- `generate-metrics-report.js` - Metrics generation
- `weekly-summary.js` - Weekly statistics

**Maintenance:**
- `cleanup-discord-posts.js` - Discord cleanup
- `failure-logger.js` - Failure tracking
- `save-discord-logs.js` - Discord log saving
- `test-location-channels.js` - Location channel testing

**Utility:**
- `encryption-utils.js` - Encryption utilities
- `enhanced-discord-bot.js` - Discord bot
- `real-career-scraper.js` - Career scraper

**Support Modules:**
- `src/` - Shared modules (discord, routing, data, monitoring)

---

## Notes

- All scripts were archived on 2026-02-08
- Archived scripts remain in git history if needed
- Can be restored from git history if needed for debugging
- No workflow changes required - archived scripts weren't referenced
- Active functionality preserved - all critical scripts remain in place
