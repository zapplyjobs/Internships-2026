# GitHub Secrets Setup Guide - Internships-2026

**Last Updated:** 2026-01-22

## Required Secrets

The following secrets must be configured in the GitHub repository settings:

### Core Discord Secrets (Already Configured)
- `DISCORD_TOKEN` - Bot token
- `DISCORD_CLIENT_ID` - Application client ID
- `DISCORD_GUILD_ID` - Discord server/guild ID
- `DISCORD_CHANNEL_ID` - Legacy fallback channel

### Industry Category Channel IDs (11 channels) ⚠️ MUST CREATE

These were previously hardcoded in workflows. You must create these secrets with the following values:

```
DISCORD_TECH_CHANNEL_ID = 1429365682948145164
DISCORD_AI_CHANNEL_ID = 1446528260627501228
DISCORD_DS_CHANNEL_ID = 1446528167362822296
DISCORD_SALES_CHANNEL_ID = 1429365752145645670
DISCORD_MARKETING_CHANNEL_ID = 1429365805090607206
DISCORD_FINANCE_CHANNEL_ID = 1429366120854585434
DISCORD_HEALTHCARE_CHANNEL_ID = 1429366171840286781
DISCORD_PRODUCT_CHANNEL_ID = 1429366236055081131
DISCORD_SUPPLY_CHANNEL_ID = 1429366422613786674
DISCORD_PM_CHANNEL_ID = 1429366331836207126
DISCORD_HR_CHANNEL_ID = 1429366524459745401
```

### Location Channel IDs (Already Configured with _INT_ suffix)
- `DISCORD_REMOTE_USA_INT_CHANNEL_ID`
- `DISCORD_NY_INT_CHANNEL_ID`
- `DISCORD_AUSTIN_INT_CHANNEL_ID`
- `DISCORD_CHICAGO_INT_CHANNEL_ID`
- `DISCORD_SEATTLE_INT_CHANNEL_ID`
- `DISCORD_REDMOND_INT_CHANNEL_ID`
- `DISCORD_MV_INT_CHANNEL_ID`
- `DISCORD_SF_INT_CHANNEL_ID`
- `DISCORD_SUNNYVALE_INT_CHANNEL_ID`
- `DISCORD_SAN_BRUNO_INT_CHANNEL_ID`
- `DISCORD_BOSTON_INT_CHANNEL_ID`
- `DISCORD_LA_INT_CHANNEL_ID`
- `DISCORD_DALLAS_INT_CHANNEL_ID`
- `DISCORD_SAN_DIEGO_INT_CHANNEL_ID`
- `DISCORD_DC_INT_CHANNEL_ID`

## How to Add Secrets

1. Go to: https://github.com/zapplyjobs/Internships-2026/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret name and value from the list above
4. Click "Add secret"

## Why This Change?

**Before:** Channel IDs were hardcoded in workflow YAML files (lines 77-87 in cleanup-discord-posts.yml)

**Problem:**
- Had to edit workflow files to change channel IDs
- Risk of committing sensitive IDs to public repos
- Inconsistent with how location channels were configured

**After:** All channel IDs now use GitHub Secrets

**Benefits:**
- Centralized secret management
- No hardcoded values in code
- Consistent with rest of the system
- Easy to update without modifying workflows

## Verification

After adding secrets, verify workflows run successfully:
- Check `.github/workflows/update-jobs.yml` runs without errors
- Check `.github/workflows/cleanup-discord-posts.yml` runs without errors
- Monitor GitHub Actions logs for "secret not found" errors

## Files Modified

- `.github/workflows/cleanup-discord-posts.yml` (lines 76-87)
- `.github/workflows/update-jobs.yml` (lines 119-130)
