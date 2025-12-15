#!/usr/bin/env node

/**
 * Cleanup Script: Remove Internship Posts from New-Grad Location Channels
 *
 * Purpose: Remove cross-posted internship jobs from New-Grad location channels
 * Channels: boston, los-angeles (add others as needed)
 * Criteria: Thread title contains "Intern" (case-insensitive)
 *
 * Usage:
 *   node cleanup-intern-posts.js --dry-run  (preview only)
 *   node cleanup-intern-posts.js --execute  (actually delete)
 *
 * CRITICAL: Requires MANAGE_THREADS permission in Discord
 */

const { Client, GatewayIntentBits } = require('discord.js');

// Environment variables
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

// Location channel IDs to clean (from New-Grad-Jobs secrets)
const CHANNELS_TO_CLEAN = {
  'boston': process.env.DISCORD_BOSTON_CHANNEL_ID,
  'los-angeles': process.env.DISCORD_LA_CHANNEL_ID
};

// CLI arguments
const isDryRun = process.argv.includes('--dry-run');
const isExecute = process.argv.includes('--execute');

if (!isDryRun && !isExecute) {
  console.error('❌ ERROR: Must specify --dry-run or --execute');
  console.log('Usage:');
  console.log('  node cleanup-intern-posts.js --dry-run   (preview only)');
  console.log('  node cleanup-intern-posts.js --execute   (actually delete)');
  process.exit(1);
}

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

/**
 * Check if thread title contains "Intern" keyword
 */
function isInternshipPost(threadName) {
  return /intern/i.test(threadName);
}

/**
 * Cleanup internship posts from a channel
 */
async function cleanupChannel(channel, channelName) {
  console.log(`\n📋 Scanning ${channelName} channel (${channel.id})...`);

  try {
    // Fetch all active threads
    const threads = await channel.threads.fetchActive();
    const allThreads = threads.threads;

    console.log(`   Found ${allThreads.size} active threads`);

    let internPostsFound = 0;
    let deleted = 0;

    for (const [threadId, thread] of allThreads) {
      if (isInternshipPost(thread.name)) {
        internPostsFound++;
        console.log(`   🎯 MATCH: "${thread.name}" (ID: ${threadId})`);

        if (isExecute) {
          try {
            await thread.delete('Cleanup: Internship post in New-Grad location channel');
            deleted++;
            console.log(`      ✅ DELETED`);

            // Rate limiting: Wait 500ms between deletes
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`      ❌ DELETE FAILED: ${error.message}`);
          }
        } else {
          console.log(`      [DRY-RUN] Would delete this thread`);
        }
      }
    }

    console.log(`\n📊 ${channelName} Summary:`);
    console.log(`   Total threads: ${allThreads.size}`);
    console.log(`   Internship posts found: ${internPostsFound}`);
    if (isExecute) {
      console.log(`   Successfully deleted: ${deleted}`);
    }

    return { total: allThreads.size, found: internPostsFound, deleted };

  } catch (error) {
    console.error(`❌ Error scanning ${channelName}:`, error.message);
    return { total: 0, found: 0, deleted: 0 };
  }
}

/**
 * Main execution
 */
client.once('ready', async () => {
  console.log('🤖 Discord Bot Ready');
  console.log(`   Mode: ${isDryRun ? 'DRY-RUN (preview only)' : 'EXECUTE (will delete)'}`);
  console.log(`   Guild: ${GUILD_ID}`);
  console.log('━'.repeat(60));

  const guild = await client.guilds.fetch(GUILD_ID);
  const results = [];

  // Process each channel
  for (const [channelName, channelId] of Object.entries(CHANNELS_TO_CLEAN)) {
    if (!channelId) {
      console.log(`⚠️  ${channelName}: Channel ID not configured, skipping`);
      continue;
    }

    try {
      const channel = await guild.channels.fetch(channelId);
      const result = await cleanupChannel(channel, channelName);
      results.push({ channelName, ...result });
    } catch (error) {
      console.error(`❌ Failed to fetch ${channelName} channel:`, error.message);
    }
  }

  // Final summary
  console.log('\n━'.repeat(60));
  console.log('📊 OVERALL SUMMARY');
  console.log('━'.repeat(60));

  let totalThreads = 0;
  let totalFound = 0;
  let totalDeleted = 0;

  results.forEach(r => {
    totalThreads += r.total;
    totalFound += r.found;
    totalDeleted += r.deleted;
    console.log(`   ${r.channelName}: ${r.found} internship posts found`);
  });

  console.log(`\n   Total threads scanned: ${totalThreads}`);
  console.log(`   Total internship posts: ${totalFound}`);
  if (isExecute) {
    console.log(`   Total deleted: ${totalDeleted}`);
    console.log('\n✅ CLEANUP COMPLETE');
  } else {
    console.log(`\n💡 Run with --execute to actually delete these threads`);
  }

  client.destroy();
  process.exit(0);
});

// Error handling
client.on('error', error => {
  console.error('❌ Discord client error:', error);
  process.exit(1);
});

// Login
client.login(TOKEN).catch(error => {
  console.error('❌ Failed to login:', error.message);
  process.exit(1);
});
