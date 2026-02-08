#!/usr/bin/env node

/**
 * Clone Location Channels Script
 *
 * Purpose: Clone all New-Grad location channels and create Internships versions
 * Usage: node clone-location-channels.js
 *
 * CRITICAL: Run this ONCE only, then delete the script
 */

const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

// Environment variables
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

// Target category ID where internships channels should be created
// Category: "location-specific internships"
const TARGET_CATEGORY_ID = '1449944601715544114';

// New-Grad location channel IDs to clone (from your existing secrets)
// Using "-int" suffix to distinguish from New-Grad channels
// Keeps city emoji, short enough to fit in Discord sidebar
const CHANNELS_TO_CLONE = {
  'DISCORD_LA_CHANNEL_ID': 'los-angeles-int',
  'DISCORD_NY_CHANNEL_ID': 'new-york-int',
  'DISCORD_SF_CHANNEL_ID': 'san-francisco-int',
  'DISCORD_BOSTON_CHANNEL_ID': 'boston-int',
  'DISCORD_CHICAGO_CHANNEL_ID': 'chicago-int',
  'DISCORD_SEATTLE_CHANNEL_ID': 'seattle-int',
  'DISCORD_AUSTIN_CHANNEL_ID': 'austin-int',
  'DISCORD_REMOTE_USA_CHANNEL_ID': 'remote-usa-int',
  'DISCORD_REDMOND_CHANNEL_ID': 'redmond-int',
  'DISCORD_MV_CHANNEL_ID': 'mountain-view-int',
  'DISCORD_SUNNYVALE_CHANNEL_ID': 'sunnyvale-int',
  'DISCORD_SAN_BRUNO_CHANNEL_ID': 'san-bruno-int'
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

/**
 * Clone a channel with all settings
 */
async function cloneChannel(sourceChannel, newName, targetCategoryId) {
  console.log(`   Cloning ${sourceChannel.name} → ${newName}`);

  try {
    const newChannel = await sourceChannel.clone({
      name: newName,
      parent: targetCategoryId,
      reason: 'Creating Internships location channels'
    });

    console.log(`   ✅ Created: ${newName} (ID: ${newChannel.id})`);

    // Rate limiting: Wait 1 second between creates
    await new Promise(resolve => setTimeout(resolve, 1000));

    return newChannel;
  } catch (error) {
    console.error(`   ❌ Failed to clone ${sourceChannel.name}:`, error.message);
    return null;
  }
}

/**
 * Main execution
 */
client.once('ready', async () => {
  console.log('🤖 Discord Bot Ready');
  console.log(`   Guild: ${GUILD_ID}`);
  console.log(`   Target Category: ${TARGET_CATEGORY_ID}`);
  console.log('━'.repeat(60));

  const guild = await client.guilds.fetch(GUILD_ID);
  const createdChannels = [];

  // Verify target category exists
  const targetCategory = await guild.channels.fetch(TARGET_CATEGORY_ID);
  if (!targetCategory || targetCategory.type !== ChannelType.GuildCategory) {
    console.error('❌ ERROR: Target category not found or not a category');
    console.log('Please set TARGET_CATEGORY_ID to your internships category ID');
    client.destroy();
    process.exit(1);
  }

  console.log(`📁 Target Category: ${targetCategory.name}\n`);

  // Clone each channel
  for (const [envVar, newName] of Object.entries(CHANNELS_TO_CLONE)) {
    const sourceChannelId = process.env[envVar];

    if (!sourceChannelId) {
      console.log(`⚠️  ${envVar}: Not configured, skipping`);
      continue;
    }

    try {
      const sourceChannel = await guild.channels.fetch(sourceChannelId);
      const newChannel = await cloneChannel(sourceChannel, newName, TARGET_CATEGORY_ID);

      if (newChannel) {
        createdChannels.push({
          envVar: envVar.replace('_CHANNEL_ID', '_INT_CHANNEL_ID'),
          name: newName,
          id: newChannel.id
        });
      }
    } catch (error) {
      console.error(`❌ Failed to fetch source channel ${envVar}:`, error.message);
    }
  }

  // Final summary
  console.log('\n' + '━'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('━'.repeat(60));
  console.log(`   Channels created: ${createdChannels.length}/${Object.keys(CHANNELS_TO_CLONE).length}\n`);

  if (createdChannels.length > 0) {
    console.log('✅ SUCCESS! Copy these to GitHub Secrets:\n');
    createdChannels.forEach(ch => {
      console.log(`${ch.envVar} = ${ch.id}`);
    });

    console.log('\n💡 Next Steps:');
    console.log('   1. Copy the IDs above to GitHub Secrets (Internships repo)');
    console.log('   2. Delete this script (no longer needed)');
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
