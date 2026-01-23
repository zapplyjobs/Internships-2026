/**
 * Board Type Configuration System
 *
 * Defines templates for different job board types (New-Grad, Internships, Remote)
 * Makes the GitHub Discord system portable across repositories
 *
 * Created: 2026-01-22 (Phase 2: Board Templates)
 *
 * Usage:
 *   const { getBoardConfig, BOARD_TYPES } = require('./board-types');
 *   const config = getBoardConfig(BOARD_TYPES.NEW_GRAD);
 */

/**
 * Board type identifiers
 */
const BOARD_TYPES = {
  NEW_GRAD: 'new-grad',
  INTERNSHIPS: 'internships',
  REMOTE: 'remote'
};

/**
 * Board type configuration templates
 *
 * Each board type defines:
 * - name: Display name
 * - description: Purpose of this board
 * - channelMode: 'env' (env vars) | 'discovery' (auto-discover by name)
 * - channelType: 'text' | 'forum'
 * - industryChannels: List of industry/functional channels
 * - locationChannels: List of location-based channels
 * - categoryChannels: Additional category-based channels (optional)
 * - envPrefix: Prefix for environment variables (if channelMode='env')
 */
const BOARD_CONFIGS = {
  [BOARD_TYPES.NEW_GRAD]: {
    name: 'New Grad Jobs 2026',
    description: 'Entry-level positions for new graduates',
    channelMode: 'env',
    channelType: 'text',
    envPrefix: 'DISCORD',

    // Consolidated industry channels (4 channels, 64%+ coverage)
    industryChannels: [
      {
        key: 'tech',
        envVar: 'DISCORD_TECH_CHANNEL_ID',
        coverage: 64,  // Percentage of jobs
        description: 'Software engineering, DevOps, QA'
      },
      {
        key: 'ai',
        envVar: 'DISCORD_AI_CHANNEL_ID',
        coverage: 15,
        description: 'ML, AI, research roles'
      },
      {
        key: 'data-science',
        envVar: 'DISCORD_DS_CHANNEL_ID',
        coverage: 8,
        description: 'Data analysts, scientists, BI'
      },
      {
        key: 'finance',
        envVar: 'DISCORD_FINANCE_CHANNEL_ID',
        coverage: 10,
        description: 'Finance, accounting, quant'
      }
    ],

    // Consolidated location channels (5 channels, 34%+ top region)
    locationChannels: [
      {
        key: 'bay-area',
        envVar: 'DISCORD_BAY_AREA_CHANNEL_ID',
        coverage: 34,
        cities: ['SF', 'Mountain View', 'Sunnyvale', 'San Jose', 'Palo Alto']
      },
      {
        key: 'new-york',
        envVar: 'DISCORD_NY_CHANNEL_ID',
        coverage: 11,
        cities: ['New York']
      },
      {
        key: 'pacific-northwest',
        envVar: 'DISCORD_PNW_CHANNEL_ID',
        coverage: 5,
        cities: ['Seattle', 'Redmond', 'Bellevue']
      },
      {
        key: 'remote-usa',
        envVar: 'DISCORD_REMOTE_USA_CHANNEL_ID',
        coverage: 4.8,
        cities: ['Remote']
      },
      {
        key: 'other-usa',
        envVar: 'DISCORD_OTHER_USA_CHANNEL_ID',
        coverage: 4.7,
        cities: ['Austin', 'Chicago', 'Boston', 'LA', 'Other']
      }
    ],

    categoryChannels: []  // None for new-grad
  },

  [BOARD_TYPES.INTERNSHIPS]: {
    name: 'Internships 2026',
    description: 'Internship positions for students',
    channelMode: 'env',
    channelType: 'text',  // Changed from 'forum' to 'text' (2026-01-23)
    envPrefix: 'DISCORD',

    // Consolidated industry channels (6 channels, 23→12 consolidation)
    industryChannels: [
      {
        key: 'tech',
        envVar: 'DISCORD_TECH_CHANNEL_ID',
        coverage: 18.0,
        description: 'Software engineering, DevOps, QA'
      },
      {
        key: 'ai',
        envVar: 'DISCORD_AI_CHANNEL_ID',
        coverage: 15.0,
        description: 'ML, AI, research'
      },
      {
        key: 'sales',
        envVar: 'DISCORD_SALES_CHANNEL_ID',
        coverage: 7.2,
        description: 'Sales roles'
      },
      {
        key: 'data-science',
        envVar: 'DISCORD_DS_CHANNEL_ID',
        coverage: 5.7,
        description: 'Data science, analytics'
      },
      {
        key: 'marketing',
        envVar: 'DISCORD_MARKETING_CHANNEL_ID',
        coverage: 2.7,
        description: 'Marketing positions'
      },
      {
        key: 'other',
        envVar: 'DISCORD_OTHER_CHANNEL_ID',
        coverage: 6.6,
        description: 'HR, healthcare, finance, product, PM, supply-chain'
      }
    ],

    // Consolidated location channels (6 channels, 12→6 consolidation)
    locationChannels: [
      {
        key: 'bay-area',
        envVar: 'DISCORD_BAY_AREA_INT_CHANNEL_ID',
        coverage: 17.6,
        cities: ['San Francisco', 'Sunnyvale', 'Mountain View', 'San Bruno', 'Palo Alto', 'San Jose']
      },
      {
        key: 'remote-usa',
        envVar: 'DISCORD_REMOTE_USA_INT_CHANNEL_ID',
        coverage: 12.6,
        cities: ['Remote']
      },
      {
        key: 'new-york',
        envVar: 'DISCORD_NY_INT_CHANNEL_ID',
        coverage: 5.5,
        cities: ['New York']
      },
      {
        key: 'pacific-northwest',
        envVar: 'DISCORD_PNW_INT_CHANNEL_ID',
        coverage: 2.4,
        cities: ['Seattle', 'Redmond', 'Bellevue']
      },
      {
        key: 'southern-california',
        envVar: 'DISCORD_SOCAL_INT_CHANNEL_ID',
        coverage: 2.6,
        cities: ['Los Angeles', 'San Diego']
      },
      {
        key: 'other-usa',
        envVar: 'DISCORD_OTHER_USA_INT_CHANNEL_ID',
        coverage: 6.8,
        cities: ['Austin', 'Boston', 'Chicago', 'Dallas', 'DC', 'Washington DC']
      }
    ],

    categoryChannels: []  // Removed SWE category channel (2026-01-23)
  },

  [BOARD_TYPES.REMOTE]: {
    name: 'Remote Jobs 2026',
    description: 'Remote-only positions',
    channelMode: 'discovery',  // Auto-discover channels by name
    channelType: 'text',
    envPrefix: null,  // Not used in discovery mode

    // Functional channels (11 channels, prefixed with 'remote-')
    industryChannels: [
      {
        key: 'tech',
        channelName: 'remote-tech',
        description: 'Software engineering, DevOps, QA'
      },
      {
        key: 'ai',
        channelName: 'remote-ai',
        description: 'ML, AI, Data Science'
      },
      {
        key: 'data-science',
        channelName: 'remote-data-science',
        description: 'Data analysts, scientists'
      },
      {
        key: 'sales',
        channelName: 'remote-sales',
        description: 'Sales roles'
      },
      {
        key: 'marketing',
        channelName: 'remote-marketing',
        description: 'Marketing positions'
      },
      {
        key: 'finance',
        channelName: 'remote-finance',
        description: 'Finance, accounting'
      },
      {
        key: 'healthcare',
        channelName: 'remote-healthcare',
        description: 'Healthcare tech'
      },
      {
        key: 'product',
        channelName: 'remote-product',
        description: 'Product management'
      },
      {
        key: 'supply-chain',
        channelName: 'remote-supply-chain',
        description: 'Supply chain roles'
      },
      {
        key: 'project-management',
        channelName: 'remote-project-management',
        description: 'PM roles'
      },
      {
        key: 'hr',
        channelName: 'remote-hr',
        description: 'HR positions'
      }
    ],

    // Location channels (12 channels, prefixed with 'remote-')
    locationChannels: [
      {
        key: 'usa',
        channelName: 'remote-usa',
        cities: ['Remote', 'USA']
      },
      {
        key: 'new-york',
        channelName: 'remote-new-york',
        cities: ['New York']
      },
      {
        key: 'austin',
        channelName: 'remote-austin',
        cities: ['Austin']
      },
      {
        key: 'chicago',
        channelName: 'remote-chicago',
        cities: ['Chicago']
      },
      {
        key: 'seattle',
        channelName: 'remote-seattle',
        cities: ['Seattle']
      },
      {
        key: 'redmond',
        channelName: 'remote-redmond',
        cities: ['Redmond']
      },
      {
        key: 'mountain-view',
        channelName: 'remote-mountain-view',
        cities: ['Mountain View']
      },
      {
        key: 'san-francisco',
        channelName: 'remote-san-francisco',
        cities: ['San Francisco']
      },
      {
        key: 'sunnyvale',
        channelName: 'remote-sunnyvale',
        cities: ['Sunnyvale']
      },
      {
        key: 'san-bruno',
        channelName: 'remote-san-bruno',
        cities: ['San Bruno']
      },
      {
        key: 'boston',
        channelName: 'remote-boston',
        cities: ['Boston']
      },
      {
        key: 'los-angeles',
        channelName: 'remote-los-angeles',
        cities: ['Los Angeles']
      }
    ],

    categoryChannels: []
  }
};

/**
 * Get board configuration by type
 * @param {string} boardType - One of BOARD_TYPES
 * @returns {Object} Board configuration
 */
function getBoardConfig(boardType) {
  if (!BOARD_CONFIGS[boardType]) {
    throw new Error(`Unknown board type: ${boardType}. Valid types: ${Object.values(BOARD_TYPES).join(', ')}`);
  }
  return BOARD_CONFIGS[boardType];
}

/**
 * Generate legacy-compatible CHANNEL_CONFIG object from board config
 * For backwards compatibility with existing code
 *
 * @param {string} boardType - One of BOARD_TYPES
 * @returns {Object} { CHANNEL_CONFIG, LOCATION_CHANNEL_CONFIG, CATEGORY_CHANNEL_CONFIG }
 */
function generateLegacyConfig(boardType) {
  const config = getBoardConfig(boardType);

  if (config.channelMode === 'env') {
    // Environment variable mode (New-Grad, Internships)
    const CHANNEL_CONFIG = {};
    const LOCATION_CHANNEL_CONFIG = {};
    const CATEGORY_CHANNEL_CONFIG = {};

    config.industryChannels.forEach(ch => {
      CHANNEL_CONFIG[ch.key] = process.env[ch.envVar];
    });

    config.locationChannels.forEach(ch => {
      LOCATION_CHANNEL_CONFIG[ch.key] = process.env[ch.envVar];
    });

    config.categoryChannels.forEach(ch => {
      CATEGORY_CHANNEL_CONFIG[ch.key] = process.env[ch.envVar];
    });

    return { CHANNEL_CONFIG, LOCATION_CHANNEL_CONFIG, CATEGORY_CHANNEL_CONFIG };
  } else if (config.channelMode === 'discovery') {
    // Channel name discovery mode (Remote)
    const FUNCTIONAL_CHANNELS = config.industryChannels.map(ch => ch.channelName);
    const LOCATION_CHANNELS = config.locationChannels.map(ch => ch.channelName);

    return {
      FUNCTIONAL_CHANNELS,
      LOCATION_CHANNELS,
      ALL_REQUIRED_CHANNELS: [...FUNCTIONAL_CHANNELS, ...LOCATION_CHANNELS]
    };
  }
}

/**
 * Get documentation for required environment variables
 * @param {string} boardType - One of BOARD_TYPES
 * @returns {Array} List of { envVar, description, example }
 */
function getRequiredEnvVars(boardType) {
  const config = getBoardConfig(boardType);

  if (config.channelMode !== 'env') {
    return []; // No env vars needed for discovery mode
  }

  const envVars = [];

  config.industryChannels.forEach(ch => {
    envVars.push({
      envVar: ch.envVar,
      description: `${ch.description} (${ch.coverage ? ch.coverage + '% coverage' : 'industry routing'})`,
      example: '1234567890123456789'
    });
  });

  config.locationChannels.forEach(ch => {
    envVars.push({
      envVar: ch.envVar,
      description: `${ch.cities.join(', ')} (${ch.coverage ? ch.coverage + '% coverage' : 'location routing'})`,
      example: '1234567890123456789'
    });
  });

  config.categoryChannels.forEach(ch => {
    envVars.push({
      envVar: ch.envVar,
      description: ch.description,
      example: '1234567890123456789'
    });
  });

  return envVars;
}

module.exports = {
  BOARD_TYPES,
  getBoardConfig,
  generateLegacyConfig,
  getRequiredEnvVars
};
