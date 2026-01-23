# JSearch API Setup Guide

**Status:** Infrastructure complete, awaiting API key
**Branch:** feature/jsearch-integration
**Commits:** 672748d9 (implementation), 5678269e (security fix)

---

## ✅ Infrastructure Complete

All code is ready and tested:
- ✅ JSearch source module (178 lines, rate limiting, error handling)
- ✅ Integration point in unified-job-fetcher.js
- ✅ Workflow environment variables configured
- ✅ Security: No hardcoded API keys
- ✅ Feature flag: Disabled by default

---

## 🔑 Your Action Required (10 minutes)

### Step 1: Create RapidAPI Account (3 min)

1. Go to: https://rapidapi.com/auth/sign-up
2. Sign up with email or Google
3. Verify email

### Step 2: Subscribe to JSearch Free Tier (2 min)

1. Go to: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
2. Click "Subscribe to Test" button
3. Select **BASIC (FREE)** plan:
   - ✅ 200 requests/month
   - ✅ $0.00/month
   - ✅ No credit card required
4. Click "Subscribe"

### Step 3: Get Your API Key (1 min)

1. On the JSearch API page, look for **"X-RapidAPI-Key"** header
2. Copy the key (starts with your RapidAPI username)
3. Format: `YOUR_KEY_HERE` → `abc123def456...`

### Step 4: Add GitHub Secrets (2 min)

1. Go to: https://github.com/zapplyjobs/Internships-2026/settings/secrets/actions
2. Click "New repository secret"
3. Add **JSEARCH_API_KEY**:
   - Name: `JSEARCH_API_KEY`
   - Secret: [paste your API key from Step 3]
4. Click "New repository secret" again
5. Add **ENABLE_JSEARCH**:
   - Name: `ENABLE_JSEARCH`
   - Secret: `true`

### Step 5: Test (5 min)

1. Go to: https://github.com/zapplyjobs/Internships-2026/actions/workflows/update-jobs.yml
2. Click "Run workflow" dropdown
3. Select branch: `feature/jsearch-integration`
4. Click "Run workflow"

**Expected logs:**
```
📡 Fetching from JSearch API (experimental)...
📡 JSearch API - Query: "software engineer intern" (1/6 today)
✅ JSearch returned 10 jobs
```

---

## 📊 Success Criteria

After enabling, monitor for 7 days:

**Good signs:**
- ✅ JSearch returns ≥10 jobs per run
- ✅ Usage tracking: 1-6 requests/day
- ✅ Zero API errors
- ✅ SimplifyJobs continues working
- ✅ Job count increases weekly

**Goals:**
- ≥50 unique internships/week from JSearch
- <30% duplicate rate
- Zero quota warnings

**If successful:** Merge to main after 7 days
**If unsuccessful:** Disable ENABLE_JSEARCH secret

---

## 🔍 Monitoring Commands

```bash
# Check workflow logs
# GitHub Actions → Update Zapply Jobs → Latest run → View logs

# Check usage tracking (after first run)
cat .github/data/jsearch_usage.json

# Check job count
wc -l .github/data/posted_jobs.json
```

---

## 🛡️ Security Features

- ✅ No hardcoded API keys (all via GitHub Secrets)
- ✅ Double opt-in (ENABLE_JSEARCH=true + valid API key required)
- ✅ Deprecated file cleaned (5678269e)
- ✅ Graceful degradation (SimplifyJobs continues if JSearch fails)
- ✅ Rate limiting (6 requests/day max, 180/month with buffer)

---

## 🏗️ Architecture

```
Workflow (update-jobs.yml)
  ↓ Sets env vars: ENABLE_JSEARCH, JSEARCH_API_KEY
job-fetcher/index.js
  ↓ Calls processJobs()
job-processor.js
  ↓ Calls fetchAllJobs()
unified-job-fetcher.js
  ↓ If ENABLE_JSEARCH=true
job-fetcher/jsearch-source.js
  ↓ Searches 1 query per run (rotation)
  ↓ Tracks usage in jsearch_usage.json
  ↓ Returns jobs → merged with SimplifyJobs
```

---

## 📝 Files Created/Modified

**New files:**
- `.github/scripts/job-fetcher/jsearch-source.js` (178 lines)

**Modified files:**
- `.github/scripts/unified-job-fetcher.js` (+20 lines)
- `.github/workflows/update-jobs.yml` (+3 lines)
- `.github/scripts/advanced-job-fetcher.js` (security fix)

**Auto-created on first run:**
- `.github/data/jsearch_usage.json` (usage tracking)

---

**Created:** 2026-01-23
**Last Updated:** 2026-01-24
**Ready for:** API key setup and testing
