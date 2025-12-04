# Session Start Protocol - New Grad Internships 2026

**Last Updated:** December 4, 2025
**Purpose:** Mandatory checklist for ANY session working on this repository

---

## 🚨 CRITICAL: Before ANY Investigation or Work

**This protocol is MANDATORY when:**
- User says "catch up with internships" or mentions this repo
- User reports an issue with the internships workflow
- User asks about job posting problems
- Starting any debugging or investigation

**Why this matters:**
- Prevents re-investigating known issues
- Saves hours of debugging time
- Ensures lessons learned are applied
- Maintains institutional knowledge across sessions

---

## ✅ Mandatory Reading Order (ALWAYS Follow)

### 1. NEXT_SESSION_START_HERE.md (FIRST)
**Purpose:** Current status, recent changes, next actions
**Read:** Entire file (5 min)
**Look for:**
- Current status indicators (✅ or ❌)
- Recent fixes and their commit hashes
- Known issues and their status
- Verification checklist

### 2. LESSONS_LEARNED.md (SECOND)
**Purpose:** Complete problem guide with all known issues
**Read:** Scan all issue titles first, then read relevant sections
**Look for:**
- Symptoms matching current issue
- Root causes of similar problems
- Diagnostic methods that worked
- Prevention strategies

### 3. Workflow Logs (THIRD - Only if investigating active issue)
**Command:**
```bash
# Check latest workflow run
gh run list --limit 1 --repo="zapplyjobs/New-Grad-Internships-2026"

# View specific run logs
gh run view <run-id> --log --repo="zapplyjobs/New-Grad-Internships-2026"
```

**Look for:**
- Job count messages: "Processing summary: X total jobs"
- Error messages about API responses
- "0 jobs" scenarios
- Discord posting success/failure

---

## 🔍 Common Issue Diagnostic Quick Reference

### Issue Pattern: "0 Jobs Being Posted"

**Symptoms:**
- Discord shows no new job posts
- Workflow succeeds but no updates
- README.md not being updated

**Diagnostic Steps (in order):**
1. Check workflow logs for "Processing summary: 0 total jobs"
2. If 0 jobs:
   - Look for API error messages in "Update job listings" step
   - Check error message for "Response keys:" to see API response format
   - Compare with apiService.js to see if response format matches
3. If non-zero jobs:
   - Check Discord bot logs for posting errors
   - Check blacklist filter messages
   - Verify posted_jobs.json is being updated

**Known Root Causes (from LESSONS_LEARNED.md):**
- ✅ Issue #4: API response format change (payload property)
- ✅ Issue #3: Duplicate function declaration (syntax error)
- ✅ Issue #2: node_modules in git (workflow blocked)
- ✅ Issue #1: Queue persistence failure (duplicate API calls)

**Quick Fix Checklist:**
- [ ] Read LESSONS_LEARNED.md for matching symptoms
- [ ] Check API response format in logs vs apiService.js
- [ ] Verify workflow syntax (no duplicate declarations)
- [ ] Confirm git status clean (no node_modules tracked)
- [ ] Check pending_posts.json is committed

---

### Issue Pattern: "Workflow Failing"

**Symptoms:**
- GitHub Actions shows red X
- Exit code 1 or syntax errors
- Workflow stops mid-execution

**Diagnostic Steps:**
1. Check for syntax errors in logs
2. Verify pre-commit hooks are active (should catch syntax errors)
3. Check for git conflicts or unstaged changes
4. Verify all dependencies are installed

**Known Root Causes:**
- ✅ Issue #3: Duplicate function declaration
- ✅ Issue #2: node_modules causing git conflicts

---

### Issue Pattern: "Stale Jobs / Filter Issues"

**Symptoms:**
- Logs show jobs being skipped
- Messages like "Skipping stale job (posted Xh ago)"

**Diagnostic Steps:**
1. **⚠️ VERIFY REPOSITORY FIRST** - Use `--repo="zapplyjobs/New-Grad-Internships-2026"`
2. Check if messages are from wrong repo (common confusion)
3. If from correct repo:
   - Check utils.js:isJobOlderThanWeek function (7-day filter)
   - Verify job timestamps in source data

**Known Gotcha:**
- gh CLI can show logs from wrong repository if not explicit
- Always use `--repo` flag when checking workflows

---

## 🛡️ Investigation Best Practices

### 1. Repository Verification (CRITICAL)
**Always specify repository explicitly:**
```bash
# ✅ CORRECT - Explicit repo
gh run list --repo="zapplyjobs/New-Grad-Internships-2026"

# ❌ WRONG - May default to wrong repo
gh run list
```

**Why:** Multiple similar repos exist (New-Grad-Jobs, New-Grad-Internships-2026)

### 2. Read Before Investigating
**Order matters:**
1. Read NEXT_SESSION_START_HERE.md (current status)
2. Read LESSONS_LEARNED.md (known issues)
3. THEN check logs/investigate

**Why:** Prevents re-discovering known issues

### 3. Check API Response Format First
**For "0 jobs" issues:**
1. Find error message with "Response keys:"
2. Compare keys with apiService.js checks (payload, jobs, data, results)
3. Add missing key if needed

**Why:** API format changes are most common cause

### 4. Document New Issues
**If you discover a NEW issue:**
1. Add to LESSONS_LEARNED.md immediately
2. Update NEXT_SESSION_START_HERE.md status
3. Save to Memory MCP with key format: `internships_[issue]_[date]`
4. Include: symptoms, root cause, solution, prevention

---

## 📊 Success Indicators (Next Workflow Run)

**After any fix, verify these in logs:**
- ✅ "Processing summary: 300+ total jobs" (not 0)
- ✅ "Extracted X jobs from response.data.payload" (API working)
- ✅ "Posted X jobs to Discord" (bot working)
- ✅ "All N jobs already enriched" (queue working)
- ✅ No syntax errors
- ✅ No git conflicts

**If all pass:** Issue is fixed, update documentation
**If any fail:** Re-check corresponding section in LESSONS_LEARNED.md

---

## 🔄 Session End Checklist

When closing session after fixing an issue:
1. [ ] Update LESSONS_LEARNED.md with new issue (if applicable)
2. [ ] Update NEXT_SESSION_START_HERE.md status
3. [ ] Commit all documentation changes
4. [ ] Save key findings to Memory MCP
5. [ ] Verify fix deployed (check next workflow run)

---

## 📝 Memory MCP Keys for This Repo

**Navigation:**
- `nav_internships_protocol` → This file (SESSION_START_PROTOCOL.md)
- `nav_internships_lessons` → LESSONS_LEARNED.md
- `nav_internships_handoff` → NEXT_SESSION_START_HERE.md

**Historical Fixes:**
- `github_discord_queue_fix_deployed_2025_12_03` - Queue persistence
- `github_discord_node_modules_fix_2025_12_03` - node_modules removal
- `internships_duplicate_function_fix_2025_12_03` - Syntax error
- `precommit_hooks_deployment_2025_12_03` - Pre-commit hooks
- `internships_payload_fix_2025_12_04` - API payload format

**Query at session start:**
```javascript
// Get protocol file path
context_get({ key: "nav_internships_protocol" })

// Search for relevant issue memories
context_search({ query: "internships [symptom]" })
```

---

## ⚠️ What NOT to Do

❌ **Don't investigate before reading protocol** - Wastes time re-discovering known issues
❌ **Don't skip LESSONS_LEARNED.md** - Contains diagnostic methods that work
❌ **Don't use gh commands without --repo flag** - May check wrong repository
❌ **Don't propose optimizations without checking git history** - Stability before performance
❌ **Don't commit person/organization names** - Violates obfuscation rules

---

**Last Review:** December 4, 2025
**Next Review:** When new critical issue discovered or protocol improvements needed
