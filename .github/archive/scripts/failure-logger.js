#!/usr/bin/env node

/**
 * Encrypted Failure Logger
 *
 * Purpose: Log workflow failures with encryption for security
 * Output: Encrypted JSON artifact uploaded to GitHub Actions
 * Decryption: Use LOG_ENCRYPT_PASSWORD secret to decrypt locally
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration
const ENCRYPT_PASSWORD = process.env.LOG_ENCRYPT_PASSWORD;
const OUTPUT_DIR = path.join(__dirname, '..', '..', '.github', 'logs');
const FAILURE_LOG_PATH = path.join(OUTPUT_DIR, 'failure-log-encrypted.json');

/**
 * Encrypt data using AES-256-CBC
 */
function encrypt(text, password) {
  if (!password) {
    throw new Error('LOG_ENCRYPT_PASSWORD not set');
  }

  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(password, 'salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted
  };
}

/**
 * Collect failure information from environment variables
 */
function collectFailureInfo() {
  const workflowInfo = {
    timestamp: new Date().toISOString(),
    repository: process.env.GITHUB_REPOSITORY,
    workflow: process.env.GITHUB_WORKFLOW,
    runId: process.env.GITHUB_RUN_ID,
    runNumber: process.env.GITHUB_RUN_NUMBER,
    actor: process.env.GITHUB_ACTOR,
    ref: process.env.GITHUB_REF,
    sha: process.env.GITHUB_SHA,
    eventName: process.env.GITHUB_EVENT_NAME
  };

  // Read logs from standard locations
  const logs = {};

  const logFiles = [
    { name: 'job-fetcher', path: '.github/logs/job-fetcher.log' },
    { name: 'discord-bot', path: '.github/logs/discord-bot.log' }
  ];

  logFiles.forEach(({ name, path: logPath }) => {
    try {
      if (fs.existsSync(logPath)) {
        logs[name] = fs.readFileSync(logPath, 'utf8');
      }
    } catch (error) {
      logs[name] = `ERROR: Could not read ${logPath}: ${error.message}`;
    }
  });

  // Parse errors from logs
  const errors = extractErrors(logs);

  // Data source sanitization (remove sensitive URLs)
  const sanitizedLogs = sanitizeLogs(logs);

  return {
    workflow: workflowInfo,
    logs: sanitizedLogs,
    errors: errors,
    summary: generateSummary(errors)
  };
}

/**
 * Extract error messages from logs
 */
function extractErrors(logs) {
  const errors = [];

  Object.entries(logs).forEach(([logName, content]) => {
    if (typeof content !== 'string') return;

    // Find error patterns
    const errorPatterns = [
      /ERROR:?\s+(.+)/gi,
      /❌\s+(.+)/gi,
      /Error:\s+(.+)/gi,
      /Failed:?\s+(.+)/gi,
      /TypeError:\s+(.+)/gi,
      /ReferenceError:\s+(.+)/gi,
      /at\s+(.+)\s+\((.+):(\d+):(\d+)\)/g // Stack traces
    ];

    errorPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        errors.push({
          log: logName,
          error: match[1] ? match[1].trim() : match[0].trim(),
          context: match[2] || null // File location if stack trace
        });
      }
    });
  });

  return errors;
}

/**
 * Sanitize logs to remove sensitive data source URLs
 */
function sanitizeLogs(logs) {
  const sanitized = {};

  Object.entries(logs).forEach(([logName, content]) => {
    if (typeof content !== 'string') {
      sanitized[logName] = content;
      return;
    }

    // Replace URLs with placeholder
    let cleaned = content;

    // Remove full URLs (SimplifyJobs, GitHub raw content, etc.)
    cleaned = cleaned.replace(/https?:\/\/[^\s]+github[^\s]*SimplifyJobs[^\s]*/gi, '[DATA_SOURCE_REDACTED]');
    cleaned = cleaned.replace(/https?:\/\/raw\.githubusercontent\.com[^\s]*/gi, '[DATA_SOURCE_REDACTED]');
    cleaned = cleaned.replace(/https?:\/\/api\.github\.com[^\s]*SimplifyJobs[^\s]*/gi, '[DATA_SOURCE_REDACTED]');

    // Remove specific repo mentions
    cleaned = cleaned.replace(/SimplifyJobs\/[^\s]*/gi, '[REPO_REDACTED]');
    cleaned = cleaned.replace(/pittcsc\/[^\s]*/gi, '[REPO_REDACTED]');

    sanitized[logName] = cleaned;
  });

  return sanitized;
}

/**
 * Generate human-readable summary
 */
function generateSummary(errors) {
  if (errors.length === 0) {
    return {
      status: 'NO_ERRORS_FOUND',
      message: 'Workflow failed but no explicit errors detected in logs'
    };
  }

  // Categorize errors
  const categories = {
    'network': 0,
    'parsing': 0,
    'discord': 0,
    'git': 0,
    'other': 0
  };

  errors.forEach(error => {
    const msg = error.error.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
      categories.network++;
    } else if (msg.includes('parse') || msg.includes('json') || msg.includes('syntax')) {
      categories.parsing++;
    } else if (msg.includes('discord') || msg.includes('channel') || msg.includes('bot')) {
      categories.discord++;
    } else if (msg.includes('git') || msg.includes('push') || msg.includes('commit')) {
      categories.git++;
    } else {
      categories.other++;
    }
  });

  // Find most common error
  const topCategory = Object.entries(categories).reduce((a, b) => b[1] > a[1] ? b : a)[0];

  return {
    totalErrors: errors.length,
    categories,
    primaryIssue: topCategory,
    topErrors: errors.slice(0, 5).map(e => e.error)
  };
}

/**
 * Main execution
 */
function main() {
  console.log('📝 Collecting failure information...');

  try {
    // Collect failure data
    const failureInfo = collectFailureInfo();

    console.log(`\n📊 Failure Summary:`);
    console.log(`   Workflow: ${failureInfo.workflow.workflow}`);
    console.log(`   Run ID: ${failureInfo.workflow.runId}`);
    console.log(`   Timestamp: ${failureInfo.workflow.timestamp}`);
    console.log(`   Errors Found: ${failureInfo.errors.length}`);

    if (failureInfo.summary.primaryIssue) {
      console.log(`   Primary Issue: ${failureInfo.summary.primaryIssue}`);
    }

    // Encrypt and save
    console.log('\n🔒 Encrypting failure log...');
    const encrypted = encrypt(JSON.stringify(failureInfo, null, 2), ENCRYPT_PASSWORD);

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Save encrypted log
    fs.writeFileSync(FAILURE_LOG_PATH, JSON.stringify(encrypted, null, 2));

    console.log(`✅ Encrypted failure log saved: ${FAILURE_LOG_PATH}`);
    console.log('\n💡 To decrypt: node .github/scripts/decrypt-failure-log.js\n');

    // Output summary for GitHub Actions
    console.log('━'.repeat(60));
    console.log('FAILURE SUMMARY (for GitHub Actions):');
    console.log(JSON.stringify(failureInfo.summary, null, 2));
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('❌ Failed to create failure log:', error.message);
    process.exit(1);
  }
}

main();
