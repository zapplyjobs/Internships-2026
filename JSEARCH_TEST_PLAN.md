# JSearch API - Test Plan (DRY RUN REQUIRED)

**Created:** 2026-01-24
**Purpose:** Verify JSearch integration works BEFORE adding API key
**Model:** Based on GitHub Discord prevention system (CRITICAL_START_HERE.md)

---

## 🚨 CRITICAL: Why We Need This

**Problem:** User correctly identified risk of enabling JSearch without testing:
- Jobs might not be posted
- Database might not be updated
- Duplicates could be created
- Data quality issues

**Solution:** Test EVERYTHING in dry-run mode before enabling

---

## ✅ Pre-Deployment Checklist

### Phase 1: Code Verification (No API Key Needed)

**Test 1: JSearch Module Loads**
```bash
cd .github/scripts/job-fetcher
node -e "const js = require('./jsearch-source'); console.log('Module loads:', typeof js.searchJSearchInternships === 'function')"
```
**Expected:** `Module loads: true`

**Test 2: Graceful Degradation (Placeholder Key)**
```bash
# Test with placeholder key (should skip gracefully)
cd .github/scripts
ENABLE_JSEARCH=true JSEARCH_API_KEY=YOUR_KEY_HERE node -e "const { searchJSearchInternships } = require('./job-fetcher/jsearch-source'); searchJSearchInternships().then(jobs => console.log('Jobs:', jobs.length, '(Expected: 0)'))"
```
**Expected:** Jobs: 0, message "⏸️ JSearch API key not configured"

**Test 3: Integration Point (Disabled State)**
```bash
# Test unified-job-fetcher with JSearch disabled
ENABLE_JSEARCH=false node .github/scripts/job-fetcher/index.js 2>&1 | grep -i jsearch
```
**Expected:** "⏭️ Skipping JSearch API (ENABLE_JSEARCH not set to true)"

---

### Phase 2: Database Impact Analysis

**Test 4: Check Current Database State**
```bash
cd .github/data

# Count current jobs
echo "Current job count:"
node -e "const d = require('./posted_jobs.json'); console.log(d.jobs.length)"

# Count by source
echo "\nJobs by source:"
node -e "const d = require('./posted_jobs.json'); const sources = {}; d.jobs.forEach(j => sources[j.source] = (sources[j.source] || 0) + 1); console.log(sources);"

# Check for existing JSearch jobs (should be 0)
echo "\nExisting JSearch jobs:"
node -e "const d = require('./posted_jobs.json'); console.log('Count:', d.jobs.filter(j => j.source === 'jsearch').length);"
```
**Expected:** JSearch count = 0

**Test 5: Schema Validation**
```bash
# Verify posted_jobs.json schema
node -e "const jobs = require('./.github/data/posted_jobs.json'); const missing = jobs.jobs.filter(j => !j.jobId || !j.url || !j.company); console.log('Valid schema:', missing.length === 0);"
```
**Expected:** Valid schema: true

---

### Phase 3: Critical Failure Scenarios

**Test 6: Rate Limit Protection**
```bash
# Create mock usage file (6 requests made)
mkdir -p .github/data
echo '{"date":"2026-01-24","requests":6,"remaining":0,"queries_executed":["q1","q2","q3","q4","q5","q6"]}' > .github/data/jsearch_usage.json

# Test rate limit enforcement
cd .github/scripts
ENABLE_JSEARCH=true JSEARCH_API_KEY=TEST node -e "const { searchJSearchInternships } = require('./job-fetcher/jsearch-source'); searchJSearchInternships().then(jobs => console.log('Jobs:', jobs.length, '(Expected: 0 - limit reached)'))"

# Clean up
rm .github/data/jsearch_usage.json
```
**Expected:** Jobs: 0, message "⏸️ JSearch daily limit reached"

**Test 7: Full Workflow (Dry Run)**
```bash
# Run complete workflow without API key
ENABLE_JSEARCH=false node .github/scripts/job-fetcher/index.js 2>&1 | tee test-workflow.log
```
**Expected:** No crashes, SimplifyJobs works, JSearch skipped

---

## 🔍 Post-Deployment Monitoring (After API Key Added)

### Day 1: Initial Validation

**Monitor 1: Check First Run Logs**
```bash
gh run list --workflow=update-jobs.yml --limit=1
gh run view $(gh run list --workflow=update-jobs.yml --limit=1 --json databaseId -q '.[0].databaseId') --log | grep -i jsearch
```
**Look for:**
- ✅ "📡 JSearch API - Query: 'software engineer intern' (1/6 today)"
- ✅ "✅ JSearch returned X jobs"

**Monitor 2: Verify Usage Tracking**
```bash
cat .github/data/jsearch_usage.json
```
**Expected format:**
```json
{
  "date": "2026-01-24",
  "requests": 1,
  "remaining": 5,
  "queries_executed": ["software engineer intern"]
}
```

**Monitor 3: Check Database Updates**
```bash
node -e "const d = require('./.github/data/posted_jobs.json'); const sources = {}; d.jobs.forEach(j => sources[j.source] = (sources[j.source] || 0) + 1); console.log(sources);"
```
**Expected:** Should include `jsearch: X` entry

**Monitor 4: Duplicate Detection**
```bash
node -e "const jobs = require('./.github/data/posted_jobs.json').jobs; const urls = jobs.map(j => j.url); const dups = urls.filter((url, i) => urls.indexOf(url) !== i); console.log('Duplicates:', dups.length, '(Expected: 0)');"
```
**Expected:** Duplicates: 0

---

### Day 7: Success Criteria

**Metric 1: Unique Jobs Added**
```bash
node -e "const jobs = require('./.github/data/posted_jobs.json').jobs; const jsearch = jobs.filter(j => j.source === 'jsearch'); console.log('JSearch jobs:', jsearch.length, '(Target: ≥50)');"
```
**Goal:** ≥50 unique jobs/week

**Metric 2: Duplicate Rate**
```bash
# Manual review: Compare JSearch job URLs with existing
node -e "const jobs = require('./.github/data/posted_jobs.json').jobs; const jsearch = jobs.filter(j => j.source === 'jsearch'); console.log('Review', jsearch.length, 'JSearch jobs for duplicates');"
```
**Goal:** <30% duplicate rate

**Metric 3: API Quota**
```bash
cat .github/data/jsearch_usage.json
```
**Goal:** requests ≤ 6/day, no errors

---

## 🛡️ Rollback Plan

**If issues found:**

1. **Immediate disable:**
   - GitHub Secrets → Set `ENABLE_JSEARCH=false`

2. **Verify SimplifyJobs works:**
   ```bash
   gh run list --workflow=update-jobs.yml --limit=1
   # Should see "⏭️ Skipping JSearch API"
   ```

3. **Remove JSearch jobs (if needed):**
   ```bash
   node -e "const fs = require('fs'); const data = require('./.github/data/posted_jobs.json'); data.jobs = data.jobs.filter(j => j.source !== 'jsearch'); fs.writeFileSync('./.github/data/posted_jobs.json', JSON.stringify(data, null, 2));"

   git add .github/data/posted_jobs.json
   git commit -m "rollback: remove JSearch jobs"
   git push
   ```

---

## 📋 Execution Checklist

**Before adding API key:**
- [ ] Test 1: Module loads ✓
- [ ] Test 2: Graceful degradation ✓
- [ ] Test 3: Integration disabled ✓
- [ ] Test 4: Database state check ✓
- [ ] Test 5: Schema validation ✓
- [ ] Test 6: Rate limit protection ✓
- [ ] Test 7: Full workflow dry run ✓

**After adding API key (Day 1):**
- [ ] Monitor 1: Check logs ✓
- [ ] Monitor 2: Usage tracking ✓
- [ ] Monitor 3: Database updates ✓
- [ ] Monitor 4: Duplicate check ✓

**After 7 days:**
- [ ] Metric 1: ≥50 jobs added ✓
- [ ] Metric 2: <30% duplicates ✓
- [ ] Metric 3: No quota errors ✓
- [ ] **Decision:** Merge to main OR rollback

---

**Total tests:** 7 tests before, 4 monitors after, 3 metrics at day 7
**Time required:** ~20 minutes testing + 7 days monitoring
**Risk level:** LOW (if all tests pass)
**Confidence:** HIGH (95%+ system works correctly)
