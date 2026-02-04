/**
 * Discord Channel Configuration - Internships-2026
 *
 * UPDATED 2026-01-23: Channel consolidation (23 → 12 channels)
 * - Migrated to board types system
 * - Changed FORUM → TEXT channels (fixes 1K thread limit)
 * - Consolidated 7 low-volume channels → 'other'
 * - Board type: INTERNSHIPS
 *
 * Channel IDs (TEXT channels with -internships suffix):
 * - tech-internships: 1464303178286760059
 * - ai-internships: 1464304182923362324
 * - data-science-internships: 1464303204178067620
 * - sales-internships: 1464303497242742875
 * - marketing-internships: 1464304161230295131
 * - other-internships: 1464303266866135232
 * - bay-area-internships: 1464303236772270122
 * - remote-usa-internships: 1464303419794784347
 * - new-york-internships: 1464304146072207390
 * - pacific-northwest-internships: 1464303539101634634
 * - southern-california-internships: 1464303312626122855
 * - other-usa-internships: 1464303522177614001
 */

const { BOARD_TYPES, generateLegacyConfig } = require('../board-types');

// Generate channel configuration from board type template
const rawConfig = generateLegacyConfig(BOARD_TYPES.INTERNSHIPS);

/**
 * Category Consolidation Map (2026-01-23)
 * Maps old channel keys to new consolidated channels
 *
 * Consolidated into 'other':
 * - finance (50 posts, 0.8%)
 * - healthcare (56 posts, 0.9%)
 * - product (38 posts, 0.6%)
 * - project-management (37 posts, 0.6%)
 * - hr (56 posts, 0.9%)
 * - supply-chain (7 posts, 0.1%)
 */
const CATEGORY_ROUTING_MAP = {
  'finance': 'other',
  'healthcare': 'other',
  'product': 'other',
  'project-management': 'other',
  'hr': 'other',
  'supply-chain': 'other'
};

/**
 * Location Consolidation Map (2026-01-23)
 * Maps old location keys to new consolidated channels
 */
const LOCATION_ROUTING_MAP = {
  // Bay Area consolidation (4 → 1)
  'san-francisco': 'bay-area',
  'sunnyvale': 'bay-area',
  'mountain-view': 'bay-area',
  'san-bruno': 'bay-area',

  // Pacific Northwest consolidation (2 → 1)
  'seattle': 'pacific-northwest',
  'redmond': 'pacific-northwest',

  // Southern California consolidation
  'los-angeles': 'southern-california',

  // Other USA consolidation (3 cities)
  'austin': 'other-usa',
  'boston': 'other-usa',
  'chicago': 'other-usa',
  'dallas': 'other-usa',
  'dc-metro': 'other-usa'
};

/**
 * Apply routing maps to redirect old channel keys to new consolidated channels
 */
function applyRoutingMaps(config) {
  const mappedConfig = { ...config };

  // Apply category routing map
  for (const [oldKey, newKey] of Object.entries(CATEGORY_ROUTING_MAP)) {
    if (mappedConfig[oldKey]) {
      // If router returns 'finance', map it to 'other' channel ID
      mappedConfig[oldKey] = mappedConfig[newKey];
    }
  }

  return mappedConfig;
}

function applyLocationRoutingMaps(config) {
  const mappedConfig = { ...config };

  // Apply location routing map
  for (const [oldKey, newKey] of Object.entries(LOCATION_ROUTING_MAP)) {
    if (mappedConfig[oldKey]) {
      // If router returns 'seattle', map it to 'pacific-northwest' channel ID
      mappedConfig[oldKey] = mappedConfig[newKey];
    }
  }

  return mappedConfig;
}

// Apply routing maps to configurations
const CHANNEL_CONFIG = applyRoutingMaps(rawConfig.CHANNEL_CONFIG);
const LOCATION_CHANNEL_CONFIG = applyLocationRoutingMaps(rawConfig.LOCATION_CHANNEL_CONFIG);
const CATEGORY_CHANNEL_CONFIG = rawConfig.CATEGORY_CHANNEL_CONFIG || {};

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
  LOCATION_MODE_ENABLED,
  CATEGORY_ROUTING_MAP,
  LOCATION_ROUTING_MAP
};
