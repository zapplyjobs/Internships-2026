/**
 * Discord Channel Configuration - Internships-2026
 *
 * UPDATED 2026-01-23: Migrated to board types system
 * - Uses src/board-types.js for portable configuration
 * - Board type: INTERNSHIPS (full industry + location spread)
 * - Channel type: FORUM channels
 */

const { BOARD_TYPES, generateLegacyConfig } = require('../board-types');

// Generate channel configuration from board type template
const {
  CHANNEL_CONFIG,
  LOCATION_CHANNEL_CONFIG,
  CATEGORY_CHANNEL_CONFIG
} = generateLegacyConfig(BOARD_TYPES.INTERNSHIPS);

// Legacy single channel support
const LEGACY_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

// Check if multi-channel mode is enabled
const MULTI_CHANNEL_MODE = Object.values(CHANNEL_CONFIG).some(id => id && id.trim() !== '');
const LOCATION_MODE_ENABLED = Object.values(LOCATION_CHANNEL_CONFIG).some(id => id && id.trim() !== '');

module.exports = {
  CHANNEL_CONFIG,
  LOCATION_CHANNEL_CONFIG,
  CATEGORY_CHANNEL_CONFIG,
  LEGACY_CHANNEL_ID,
  MULTI_CHANNEL_MODE,
  LOCATION_MODE_ENABLED
};
