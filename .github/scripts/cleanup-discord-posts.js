#!/usr/bin/env node

/**
 * Discord Channel Cleanup Script
 * Deletes job posts from specified Discord channels
 *
 * Usage:
 *   - Set DELETE_ALL_CHANNELS=true to clean all category channels
 *   - Set specific CHANNEL_IDS (comma-separated) to clean specific channels
 *   - Set HOURS_AGO to only delete posts from last N hours (optional)
 *   - Set DRY_RUN=true to preview without deleting
 */

const { Client, GatewayIntentBits } = require('discord.js');

// Configuration from environment variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const DELETE_ALL_CHANNELS = process.env.DELETE_ALL_CHANNELS === 'true';
const CHANNEL_IDS = process.env.CHANNEL_IDS ? process.env.CHANNEL_IDS.split(',').map(id => id.trim()) : [];
const HOURS_AGO = process.env.HOURS_AGO ? parseInt(process.env.HOURS_AGO) : null;
const DRY_RUN = process.env.DRY_RUN === 'true';

// Category channel IDs (for DELETE_ALL_CHANNELS mode)
const CATEGORY_CHANNELS = {
  tech: process.env.DISCORD_TECH_CHANNEL_ID,
  sales: process.env.DISCORD_SALES_CHANNEL_ID,
  marketing: process.env.DISCORD_MARKETING_CHANNEL_ID,
  finance: process.env.DISCORD_FINANCE_CHANNEL_ID,
  healthcare: process.env.DISCORD_HEALTHCARE_CHANNEL_ID,
  product: process.env.DISCORD_PRODUCT_CHANNEL_ID,
  'supply-chain': process.env.DISCORD_SUPPLY_CHANNEL_ID,
  'project-management': process.env.DISCORD_PM_CHANNEL_ID,
  hr: process.env.DISCORD_HR_CHANNEL_ID
};

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/**
 * Delete messages from a channel
 * @param {Object} channel - Discord channel object
 * @param {Date|null} cutoffTime - Only delete messages after this time (null = all)
 * @returns {number} Number of messages deleted
 */
async function cleanupChannel(channel, cutoffTime = null) {
  console.log(`\n🔍 Scanning channel: ${channel.name} (${channel.id})`);

  let deletedCount = 0;
  let scannedCount = 0;

  try {
    // Fetch threads (forum posts)
    const threads = await channel.threads.fetchActive();
    const allThreads = threads.threads;

    // Also fetch archived threads if needed
    if (!cutoffTime || (Date.now() - cutoffTime.getTime()) > 7 * 24 * 60 * 60 * 1000) {
      const archivedThreads = await channel.threads.fetchArchived({ limit: 100 });
      archivedThreads.threads.forEach((thread, id) => {
        allThreads.set(id, thread);
      });
    }

    console.log(`📋 Found ${allThreads.size} threads in channel`);

    for (const [threadId, thread] of allThreads) {
      scannedCount++;

      // Check if thread is within time range
      if (cutoffTime && thread.createdTimestamp < cutoffTime.getTime()) {
        continue;
      }

      const createdDate = new Date(thread.createdTimestamp);
      console.log(`   📌 Thread: "${thread.name}" (created ${createdDate.toLocaleString()})`);

      if (DRY_RUN) {
        console.log(`   🔍 [DRY RUN] Would delete thread`);
        deletedCount++;
      } else {
        try {
          await thread.delete();
          console.log(`   ✅ Deleted thread`);
          deletedCount++;

          // Rate limit: Wait 1 second between deletions
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log(`   ❌ Failed to delete: ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error(`❌ Error scanning channel: ${error.message}`);
  }

  console.log(`📊 Channel summary: Scanned ${scannedCount}, Deleted ${deletedCount}`);
  return deletedCount;
}

/**
 * Main cleanup function
 */
async function cleanup() {
  console.log('🚀 Discord Channel Cleanup Script');
  console.log('==================================\n');

  if (!DISCORD_TOKEN || !DISCORD_GUILD_ID) {
    console.error('❌ Error: DISCORD_TOKEN and DISCORD_GUILD_ID are required');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE: No messages will be deleted\n');
  }

  // Determine which channels to clean
  let channelsToClean = [];
  if (DELETE_ALL_CHANNELS) {
    channelsToClean = Object.entries(CATEGORY_CHANNELS)
      .filter(([_, id]) => id)
      .map(([name, id]) => ({ name, id }));
    console.log(`🔄 Cleaning ALL category channels (${channelsToClean.length} channels)\n`);
  } else if (CHANNEL_IDS.length > 0) {
    channelsToClean = CHANNEL_IDS.map(id => ({ name: 'custom', id }));
    console.log(`🔄 Cleaning specific channels: ${CHANNEL_IDS.join(', ')}\n`);
  } else {
    console.error('❌ Error: Either DELETE_ALL_CHANNELS or CHANNEL_IDS must be set');
    process.exit(1);
  }

  // Calculate cutoff time if HOURS_AGO is set
  let cutoffTime = null;
  if (HOURS_AGO) {
    cutoffTime = new Date(Date.now() - (HOURS_AGO * 60 * 60 * 1000));
    console.log(`⏰ Only deleting posts from last ${HOURS_AGO} hours (after ${cutoffTime.toLocaleString()})\n`);
  } else {
    console.log(`⏰ Deleting ALL posts (no time limit)\n`);
  }

  // Login to Discord
  console.log('🔐 Logging in to Discord...');
  await client.login(DISCORD_TOKEN);

  // Wait for ready event
  await new Promise(resolve => {
    client.once('ready', () => {
      console.log(`✅ Logged in as ${client.user.tag}\n`);
      resolve();
    });
  });

  // Fetch guild
  const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
  console.log(`📍 Guild: ${guild.name}\n`);

  // Clean each channel
  let totalDeleted = 0;
  for (const { name, id } of channelsToClean) {
    try {
      const channel = await guild.channels.fetch(id);
      if (!channel) {
        console.log(`⚠️  Channel ${id} not found, skipping`);
        continue;
      }

      const deleted = await cleanupChannel(channel, cutoffTime);
      totalDeleted += deleted;

    } catch (error) {
      console.error(`❌ Error processing channel ${id}: ${error.message}`);
    }
  }

  // Summary
  console.log('\n==================================');
  console.log('📊 CLEANUP SUMMARY');
  console.log('==================================');
  console.log(`Channels processed: ${channelsToClean.length}`);
  console.log(`Total posts deleted: ${totalDeleted}`);
  if (DRY_RUN) {
    console.log('🔍 DRY RUN: No actual deletions were made');
  }
  console.log('==================================\n');

  client.destroy();
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run cleanup
cleanup();
