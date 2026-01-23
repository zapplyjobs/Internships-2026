# JSearch API - Monitoring Guide

**Setup Complete:** 2026-01-24
**Status:** ✅ API Key Added, Integration Enabled
**Branch:** feature/jsearch-integration

---

## Quick Status Check

**View Latest Run:**
```bash
gh run list --workflow=update-jobs.yml --limit=1
```

**View Run Details:**
```bash
gh run view [RUN_ID] --log | grep -i jsearch
```

---

## What to Look For

### ✅ SUCCESS Indicators

**In Workflow Logs:**
```
📊 JSearch quota available: 5/6 requests remaining
📡 JSearch API - Query: "software engineer intern" (1/6 today)
✅ JSearch returned 10 jobs
```

**In Database:**
```bash
# Check for JSearch jobs
node -e "const d = require('./.github/data/posted_jobs.json'); const sources = {}; d.jobs.forEach(j => sources[j.source || 'unknown'] = (sources[j.source || 'unknown'] || 0) + 1); console.log(sources);"

# Expected output:
# { unknown: 2125, simplifyjobs: X, jsearch: Y }
```

**Usage Tracking File Created:**
```bash
cat .github/data/jsearch_usage.json

# Expected:
# {
#   "date": "2026-01-24",
#   "requests": 1,
#   "remaining": 5,
#   "queries_executed": ["software engineer intern"]
# }
```

---

### ❌ FAILURE Indicators

**API Issues:**
```
❌ JSearch API request failed: 403 Forbidden  # Invalid API key
❌ JSearch API request failed: 429 Too Many Requests  # Quota exceeded
❌ JSearch API request failed: 500 Internal Server Error  # JSearch down
```

**Rate Limit Hit:**
```
⏸️ JSearch daily limit reached (6/6), skipping this run
```

**Disabled:**
```
⏭️ Skipping JSearch API (ENABLE_JSEARCH not set to true)
```

---

## Day 1 Checklist (Today)

- [ ] **Check workflow completed successfully**
  ```bash
  gh run list --workflow=update-jobs.yml --limit=1
  ```

- [ ] **Verify JSearch was called**
  ```bash
  gh run view [RUN_ID] --log | grep "JSearch"
  ```

- [ ] **Check jobs were returned**
  ```bash
  # Look for "✅ JSearch returned X jobs"
  ```

- [ ] **Verify source field in database**
  ```bash
  node -e "const jobs = require('./.github/data/posted_jobs.json').jobs; const jsearch = jobs.filter(j => j.source === 'jsearch'); console.log('JSearch jobs:', jsearch.length);"
  ```

- [ ] **Check usage tracking**
  ```bash
  cat .github/data/jsearch_usage.json
  ```

- [ ] **Verify no duplicates created**
  ```bash
  node -e "const jobs = require('./.github/data/posted_jobs.json').jobs; const urls = jobs.map(j => j.sourceUrl); const dups = urls.filter((url, i) => urls.indexOf(url) !== i); console.log('Duplicates:', dups.length);"
  ```

---

## Day 7 Evaluation (2026-01-31)

**Success Criteria:**
- ✅ ≥50 unique JSearch jobs added this week
- ✅ Duplicate rate <30%
- ✅ Zero API quota errors
- ✅ SimplifyJobs continues working

**Check Stats:**
```bash
# Count JSearch jobs
node -e "const jobs = require('./.github/data/posted_jobs.json').jobs.filter(j => j.source === 'jsearch'); console.log('Total JSearch jobs:', jobs.length);"

# Check weekly usage
cat .github/data/jsearch_usage.json
```

**Decision:**
- **IF SUCCESS:** Merge to main
  ```bash
  git checkout main
  git merge feature/jsearch-integration
  git push origin main
  ```

- **IF FAILURE:** Disable integration
  ```bash
  gh secret set ENABLE_JSEARCH --body "false"
  # OR delete the secret entirely
  gh secret delete ENABLE_JSEARCH
  ```

---

## Troubleshooting

### Issue: No JSearch jobs appearing

**Check 1: Workflow logs**
```bash
gh run view [RUN_ID] --log | grep -A5 "JSearch"
```

**Check 2: API key valid**
```bash
gh secret list | grep JSEARCH
# Should show: JSEARCH_API_KEY, ENABLE_JSEARCH
```

**Check 3: Source field**
```bash
# Check new_jobs.json for source field
node -e "const jobs = require('./.github/data/new_jobs.json'); console.log('Sample:', jobs[0]?.job_source);"
```

### Issue: Rate limit errors

**Check usage:**
```bash
cat .github/data/jsearch_usage.json
```

**Expected:** requests ≤ 6/day

**Fix:** Wait 24 hours for reset, or upgrade plan

### Issue: Duplicates created

**Check:**
```bash
node -e "const jobs = require('./.github/data/posted_jobs.json').jobs; const urls = jobs.map(j => j.sourceUrl); const dups = urls.filter((url, i) => urls.indexOf(url) !== i); if (dups.length > 0) console.log('DUPLICATES FOUND:', dups.length);"
```

**Fix:** Should be prevented by deduplication (contact Claude if this occurs)

---

## Useful Commands

**View all secrets:**
```bash
gh secret list
```

**Disable JSearch:**
```bash
gh secret set ENABLE_JSEARCH --body "false"
```

**Re-enable JSearch:**
```bash
gh secret set ENABLE_JSEARCH --body "true"
```

**Check quota:**
```bash
cat .github/data/jsearch_usage.json
```

**View source breakdown:**
```bash
node -e "const d = require('./.github/data/posted_jobs.json'); const s = {}; d.jobs.forEach(j => s[j.source||'unknown']=(s[j.source||'unknown']||0)+1); console.log(s);"
```

---

## Current Workflow Run

**Status:** In Progress (started 2026-01-23 14:24 UTC)
**Run ID:** 21289436487
**Branch:** feature/jsearch-integration

**Check status:**
```bash
gh run view 21289436487
```

**View logs:**
```bash
gh run view 21289436487 --log | grep -i jsearch
```

---

**Next Check:** After workflow completes (~5-10 min)
**Next Review:** Day 7 (2026-01-31)
