/**
 * Location-based Job Routing Module
 * Determines which location-specific Discord channel a job should be posted to
 */

const { LOCATION_CHANNEL_CONFIG } = require('../discord/config');

/**
 * Determine which location channel a job should go to
 * @param {Object} job - Job object with location data
 * @returns {string|null} Channel ID or null if no location match
 */
function getJobLocationChannel(job) {
  const city = (job.job_city || '').toLowerCase().trim();
  const state = (job.job_state || '').toLowerCase().trim();
  const title = (job.job_title || '').toLowerCase();
  const description = (job.job_description || '').toLowerCase();
  const combined = `${title} ${description} ${city} ${state}`;

  // Metro area city matching (comprehensive)
  const cityMatches = {
    // San Francisco Bay Area
    'san francisco': 'san-francisco',
    'oakland': 'san-francisco',
    'berkeley': 'san-francisco',
    'san jose': 'san-francisco',
    'palo alto': 'san-francisco',
    'fremont': 'san-francisco',
    'hayward': 'san-francisco',
    'richmond': 'san-francisco',
    'daly city': 'san-francisco',
    'alameda': 'san-francisco',
    'cupertino': 'san-francisco',
    'santa clara': 'san-francisco',
    'mountain view': 'mountain-view',
    'sunnyvale': 'sunnyvale',
    'san bruno': 'san-bruno',

    // NYC Metro Area
    'new york': 'new-york',
    'manhattan': 'new-york',
    'brooklyn': 'new-york',
    'queens': 'new-york',
    'bronx': 'new-york',
    'staten island': 'new-york',
    'jersey city': 'new-york',
    'newark': 'new-york',
    'hoboken': 'new-york',
    'white plains': 'new-york',
    'yonkers': 'new-york',

    // Seattle Metro Area
    'seattle': 'seattle',
    'bellevue': 'seattle',
    'tacoma': 'seattle',
    'everett': 'seattle',
    'renton': 'seattle',
    'kent': 'seattle',
    'redmond': 'redmond',

    // Austin Metro Area
    'austin': 'austin',
    'round rock': 'austin',
    'cedar park': 'austin',
    'georgetown': 'austin',
    'pflugerville': 'austin',

    // Chicago Metro Area
    'chicago': 'chicago',
    'naperville': 'chicago',
    'aurora': 'chicago',
    'joliet': 'chicago',
    'evanston': 'chicago',
    'schaumburg': 'chicago',

    // Boston Metro Area
    'boston': 'boston',
    'cambridge': 'boston',
    'somerville': 'boston',
    'brookline': 'boston',
    'quincy': 'boston',
    'newton': 'boston',
    'waltham': 'boston',
    'revere': 'boston',
    'medford': 'boston',

    // Los Angeles Metro Area
    'los angeles': 'los-angeles',
    'santa monica': 'los-angeles',
    'pasadena': 'los-angeles',
    'long beach': 'los-angeles',
    'glendale': 'los-angeles',
    'irvine': 'los-angeles',
    'anaheim': 'los-angeles',
    'burbank': 'los-angeles',
    'torrance': 'los-angeles',

    // Dallas Metro Area (new)
    'dallas': 'dallas',
    'fort worth': 'dallas',
    'arlington': 'dallas',
    'plano': 'dallas',
    'irving': 'dallas',
    'frisco': 'dallas',
    'mckinney': 'dallas',
    'garland': 'dallas',
    'richardson': 'dallas',
    'denton': 'dallas',

    // San Diego Metro Area (new)
    'san diego': 'san-diego',
    'chula vista': 'san-diego',
    'oceanside': 'san-diego',
    'escondido': 'san-diego',
    'carlsbad': 'san-diego',
    'el cajon': 'san-diego',
    'la jolla': 'san-diego',

    // DC Metro Area (new)
    'washington': 'dc-metro',
    'washington dc': 'dc-metro',
    'washington d.c.': 'dc-metro',
    'arlington': 'dc-metro',  // VA Arlington (context-dependent, DC takes priority)
    'alexandria': 'dc-metro',
    'bethesda': 'dc-metro',
    'silver spring': 'dc-metro',
    'reston': 'dc-metro',
    'tysons': 'dc-metro',
    'mclean': 'dc-metro',
    'fairfax': 'dc-metro',
    'rockville': 'dc-metro',
    'chantilly': 'dc-metro',
    'manassas': 'dc-metro',
    'herndon': 'dc-metro',
    'sterling': 'dc-metro'
  };

  // City abbreviations
  const cityAbbreviations = {
    'sf': 'san-francisco',
    'nyc': 'new-york'
  };

  // 1. Check exact city matches first (most reliable)
  for (const [searchCity, channelKey] of Object.entries(cityMatches)) {
    if (city.includes(searchCity)) {
      return LOCATION_CHANNEL_CONFIG[channelKey];
    }
  }

  // 2. Check abbreviations
  for (const [abbr, channelKey] of Object.entries(cityAbbreviations)) {
    if (city === abbr || city.split(/\s+/).includes(abbr)) {
      return LOCATION_CHANNEL_CONFIG[channelKey];
    }
  }

  // 3. Check title + description for city names
  for (const [searchCity, channelKey] of Object.entries(cityMatches)) {
    if (combined.includes(searchCity)) {
      return LOCATION_CHANNEL_CONFIG[channelKey];
    }
  }

  // 4. State-based fallback (for ALL jobs, not just remote)
  // If we have a state but no specific city match, map to the main city in that state
  if (state) {
    if (state === 'ca' || state === 'california') {
      // CA jobs without specific city go to LA (most CA jobs not in Bay Area)
      // Bay Area cities already caught by city matching above
      return LOCATION_CHANNEL_CONFIG['los-angeles'];
    }
    if (state === 'ma' || state === 'massachusetts') {
      return LOCATION_CHANNEL_CONFIG['boston'];
    }
    if (state === 'ny' || state === 'new york') {
      return LOCATION_CHANNEL_CONFIG['new-york'];
    }
    if (state === 'tx' || state === 'texas') {
      // Check if Dallas area is mentioned, otherwise default to Austin
      if (combined.includes('dallas') || combined.includes('fort worth') || combined.includes('plano')) {
        return LOCATION_CHANNEL_CONFIG['dallas'];
      }
      return LOCATION_CHANNEL_CONFIG['austin'];
    }
    if (state === 'wa' || state === 'washington') {
      // Check if Redmond is specifically mentioned
      if (combined.includes('redmond')) {
        return LOCATION_CHANNEL_CONFIG['redmond'];
      }
      return LOCATION_CHANNEL_CONFIG['seattle'];
    }
    if (state === 'il' || state === 'illinois') {
      return LOCATION_CHANNEL_CONFIG['chicago'];
    }
    if (state === 'dc' || state === 'district of columbia') {
      return LOCATION_CHANNEL_CONFIG['dc-metro'];
    }
    if (state === 'va' || state === 'virginia') {
      // Northern VA goes to DC metro, but only if DC-area cities mentioned
      if (combined.includes('arlington') || combined.includes('alexandria') ||
          combined.includes('reston') || combined.includes('tysons') ||
          combined.includes('mclean') || combined.includes('fairfax')) {
        return LOCATION_CHANNEL_CONFIG['dc-metro'];
      }
      // Other VA cities fall through to remote-usa
    }
    if (state === 'md' || state === 'maryland') {
      // MD suburbs go to DC metro
      if (combined.includes('bethesda') || combined.includes('silver spring') ||
          combined.includes('rockville')) {
        return LOCATION_CHANNEL_CONFIG['dc-metro'];
      }
      // Other MD cities fall through to remote-usa
    }
  }

  // 5. Remote USA - Only if explicitly remote AND US-based
  // Check for remote indicators in LOCATION fields (job_city, job_state) OR strong remote keywords
  const isRemoteLocation = city.includes('remote') || state.includes('remote');
  const hasStrongRemoteKeyword = /\b(remote|work from home|wfh|distributed|anywhere|location independent)\b/.test(combined);
  const isUSBased = /\b(usa|united states|u\.s\.|us only|us-based|us remote)\b/.test(combined);

  if ((isRemoteLocation || hasStrongRemoteKeyword) && isUSBased) {
    return LOCATION_CHANNEL_CONFIG['remote-usa'];
  }

  // 6. No fallback to remote-usa for non-remote US jobs
  // Jobs from Phoenix, Denver, Miami, etc. will ONLY post to their category channel (tech, marketing, etc.)
  // This prevents non-remote jobs from appearing in remote-usa channel
  // If a job has no specific location channel match, it returns null and posts only to category channel

  return null;
}

module.exports = {
  getJobLocationChannel
};
