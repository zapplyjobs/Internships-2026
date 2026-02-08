#!/usr/bin/env node

/**
 * Decrypt Failure Logs
 *
 * Usage: LOG_ENCRYPT_PASSWORD=your_secret node decrypt-failure-log.js
 * Downloads and decrypts failure logs from GitHub Actions artifacts
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ENCRYPT_PASSWORD = process.env.LOG_ENCRYPT_PASSWORD;

/**
 * Decrypt data using AES-256-CBC
 */
function decrypt(encryptedData, iv, password) {
  if (!password) {
    throw new Error('LOG_ENCRYPT_PASSWORD environment variable not set');
  }

  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(password, 'salt', 32);
  const ivBuffer = Buffer.from(iv, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const inputFile = args[0] || '.github/logs/failure-log-encrypted.json';

  console.log(`🔓 Decrypting failure log: ${inputFile}\n`);

  try {
    // Read encrypted file
    const encrypted = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    // Decrypt
    const decrypted = decrypt(encrypted.encryptedData, encrypted.iv, ENCRYPT_PASSWORD);
    const failureInfo = JSON.parse(decrypted);

    // Display summary
    console.log('━'.repeat(80));
    console.log('FAILURE REPORT');
    console.log('━'.repeat(80));

    console.log(`\n📋 Workflow Information:`);
    console.log(`   Repository: ${failureInfo.workflow.repository}`);
    console.log(`   Workflow: ${failureInfo.workflow.workflow}`);
    console.log(`   Run ID: ${failureInfo.workflow.runId}`);
    console.log(`   Timestamp: ${failureInfo.workflow.timestamp}`);
    console.log(`   Actor: ${failureInfo.workflow.actor}`);
    console.log(`   Ref: ${failureInfo.workflow.ref}`);

    console.log(`\n📊 Error Summary:`);
    console.log(`   Total Errors: ${failureInfo.summary.totalErrors}`);
    console.log(`   Primary Issue: ${failureInfo.summary.primaryIssue}`);

    if (failureInfo.summary.categories) {
      console.log(`\n   Error Categories:`);
      Object.entries(failureInfo.summary.categories).forEach(([cat, count]) => {
        if (count > 0) {
          console.log(`      ${cat}: ${count}`);
        }
      });
    }

    console.log(`\n🔍 Top Errors:`);
    failureInfo.summary.topErrors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });

    // Save decrypted file
    const outputFile = inputFile.replace('-encrypted.json', '-decrypted.json');
    fs.writeFileSync(outputFile, JSON.stringify(failureInfo, null, 2));

    console.log(`\n✅ Full decrypted log saved to: ${outputFile}`);
    console.log(`\n💡 Use "cat ${outputFile} | jq" to browse full logs\n`);

  } catch (error) {
    console.error('❌ Failed to decrypt:', error.message);
    console.log('\n💡 Make sure LOG_ENCRYPT_PASSWORD matches the encryption password');
    process.exit(1);
  }
}

main();
