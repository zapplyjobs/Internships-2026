// src/backend/output/jobTransformers.js

/**
 * Clean job title by removing common prefixes, suffixes, and formatting issues
 * @param {string} title - Raw job title
 * @returns {string} Cleaned job title
 */
function cleanJobTitle(title) {
  if (!title) return title;

  // Remove common prefixes and suffixes AND handle pipe characters
  return title
    .replace(/\|/g, ' - ') // Replace pipes with dashes to prevent table breaking
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .replace(/\s+(I|II|III|IV|V|\d+)$/, '') // Remove Roman numerals and numbers at end
    .replace(/\s*-\s*(Remote|Hybrid|On-site).*$/i, '') // Remove work arrangement suffixes
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

/**
 * Parse and clean location text to extract city and state
 * @param {string} locationText - Raw location text
 * @returns {Object} Object with city and state properties
 */
function parseLocation(locationText) {
  // Handle null, undefined, empty string, or "null" string
  if (!locationText || locationText === 'null' || locationText.trim() === '' || locationText.toLowerCase().trim() === 'null') {
    return { city: 'Multiple Cities', state: '' };
  }

  // EARLY CHECK: Preserve "Multiple Cities" pattern before cleaning
  const lowerText = locationText.toLowerCase().trim();
  if (lowerText.includes('multiple') && (lowerText.includes('cities') || lowerText.includes('locations') || lowerText.includes('sites'))) {
    return { city: 'Multiple Cities', state: '' };
  }
  if (lowerText.includes('various') && (lowerText.includes('cities') || lowerText.includes('locations'))) {
    return { city: 'Multiple Cities', state: '' };
  }
  if (lowerText.includes('all locations') || lowerText.includes('nationwide')) {
    return { city: 'Multiple Cities', state: '' };
  }

  // Job-related keywords to remove (minimal list, most commented out to preserve location data)
  const nonLocationKeywords = [
    // Employment types
    'full time', 'full-time', 'fulltime',
    'part time', 'part-time', 'parttime',
    'contract', 'contractor',
    'temporary', 'temp',
    'permanent',
    'seasonal',
    'freelance', 'freelancer',
    'consultant', 'consulting',
    
    // Work arrangements
    'hybrid',
    'on-site', 'onsite', 'on site',
    'work from home', 'wfh',
    'telecommute', 'telecommuting',
    'virtual',
    'in-office', 'in office',
    
    // Job descriptors
    'experience', 'exp',
    'years', 'yrs', 'year',
    'required', 'req',
    'preferred', 'pref',
    'degree',
    'bachelor', 'bachelors', 'bs', 'ba',
    'master', 'masters', 'ms', 'ma', 'mba',
    'phd', 'doctorate',
    'position', 'positions',
    'role', 'roles',
    'job', 'jobs',
    'opportunity', 'opportunities',
    'opening', 'openings',
    'posting', 'postings',
    'vacancy', 'vacancies'
  ];

  let cleanLocation = locationText.trim();

  // Check for remote FIRST
  const remotePatterns = [
    /^remote$/i,
    /^remote[,\s]*$/i,
    /^remote\s*-\s*$/i,
    /^\s*remote\s*$/i
  ];
  
  for (const pattern of remotePatterns) {
    if (pattern.test(cleanLocation)) {
      return { city: 'Remote', state: '' };
    }
  }

  // Remove country suffixes (US, USA, United States)
  cleanLocation = cleanLocation
    .replace(/,?\s*United States\s*$/i, '')
    .replace(/,?\s*USA\s*$/i, '')
    .replace(/,?\s*U\.S\.A\.?\s*$/i, '')
    .replace(/,?\s*US\s*$/i, '')
    .trim();

  // Remove non-location keywords
  nonLocationKeywords.forEach(keyword => {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`^${escapedKeyword}[,\\s]*`, 'gi'),
      new RegExp(`\\b${escapedKeyword}\\b[,\\s]*`, 'gi'),
      new RegExp(`[,\\s]*${escapedKeyword}$`, 'gi'),
      new RegExp(`\\s+${escapedKeyword}\\s+`, 'gi')
    ];
    
    patterns.forEach(pattern => {
      cleanLocation = cleanLocation.replace(pattern, ' ');
    });
  });

  // Cleanup remaining artifacts
  cleanLocation = cleanLocation
    .replace(/\s+/g, ' ')
    .replace(/,+/g, ',')
    .replace(/\s*,\s*/g, ', ')
    .replace(/^[,\s\-:;|]+|[,\s\-:;|]+$/g, '')
    .replace(/\s+-\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Filter out empty or too short results
  if (!cleanLocation || cleanLocation.length < 2) {
    return { city: 'Multiple Cities', state: '' };
  }

  // Filter out generic/placeholder terms
  const genericTerms = [
    'us', 'usa', 'u.s.', 'u.s.a', 'u.s', 'us.', 
    'united states', 'unitedstates',
    'tbd', 'tba', 'n/a', 'na',
    'location', 'locations'
  ];
  
  // Special handling for "multiple", "various", etc.
  const multipleTerms = ['multiple', 'various', 'all', 'any', 'nationwide', 'national'];
  if (multipleTerms.includes(cleanLocation.toLowerCase())) {
    return { city: 'Multiple Cities', state: '' };
  }
  
  if (genericTerms.includes(cleanLocation.toLowerCase())) {
    return { city: 'Multiple Cities', state: '' };
  }

  // Check if just numbers or special characters
  if (/^[\d\s,\-._]+$/.test(cleanLocation)) {
    return { city: 'Multiple Cities', state: '' };
  }

  // Split by comma and parse
  const parts = cleanLocation
    .split(',')
    .map(part => part.trim())
    .filter(part => part.length > 0);

  // US state abbreviations
  const stateAbbreviations = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  // US state full names
  const stateNames = [
    'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
    'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
    'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
    'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
    'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
    'new hampshire', 'new jersey', 'new mexico', 'new york',
    'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon',
    'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
    'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
    'west virginia', 'wisconsin', 'wyoming'
  ];

  if (parts.length >= 2) {
    // Format: "Mountain View, California" or "Austin, TX"
    return {
      city: parts[0],
      state: parts[1]
    };
  } else if (parts.length === 1) {
    const singlePart = parts[0];

    // Check if it's a state abbreviation
    if (stateAbbreviations.includes(singlePart.toUpperCase())) {
      return { city: '', state: singlePart.toUpperCase() };
    }
    
    // Check if it's a state full name
    if (stateNames.includes(singlePart.toLowerCase())) {
      const capitalizedState = singlePart
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return { city: '', state: capitalizedState };
    }
    
    // Final check: if it contains job-related terms, filter it out
    const hasJobTerms = nonLocationKeywords.some(keyword => 
      singlePart.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasJobTerms) {
      return { city: 'Multiple Cities', state: '' };
    }
    
    // Assume it's a city if it's not a recognized state
    return { city: singlePart, state: '' };
  }

  // Default fallback
  return { city: 'Multiple Cities', state: '' };
}

/**
 * Convert date string to relative format (e.g., "1h", "2d", "1w", "1mo")
 * @param {string} postedDate - Raw posted date string
 * @returns {string} Relative date format
 */
function convertDateToRelative(postedDate) {
  const dateStr = String(postedDate);

  // Check if it's already in the desired format
  const desiredFormatRegex = /^\d+[hdwmo]+$/i;
  if (desiredFormatRegex.test(dateStr.trim())) {
    return dateStr.trim();
  }

  // Clean and normalize the input
  let cleanedDate = dateStr
    .replace(/^posted\s+/i, '')
    .replace(/\s+ago$/i, '')
    .replace(/^on\s+/i, '')
    .trim()
    .toLowerCase();

  // Handle special cases first
  if (cleanedDate === 'today' || cleanedDate === 'yesterday') {
    return "1d";
  }
  if (cleanedDate.includes('just') || cleanedDate.includes('recently') || cleanedDate.includes('now')) {
    return "1h";
  }

  // Handle "30+ days" or similar patterns
  const daysPlusRegex = /(\d+)\+?\s*days?/i;
  const daysPlusMatch = cleanedDate.match(daysPlusRegex);
  if (daysPlusMatch) {
    const days = parseInt(daysPlusMatch[1]);
    if (days >= 30) {
      const months = Math.floor(days / 30);
      return `${months}mo`;
    } else if (days >= 7) {
      const weeks = Math.floor(days / 7);
      return `${weeks}w`;
    } else {
      return `${days}d`;
    }
  }

  // Handle "X+ weeks", "X+ months" patterns
  const weeksPlusRegex = /(\d+)\+?\s*weeks?/i;
  const weeksPlusMatch = cleanedDate.match(weeksPlusRegex);
  if (weeksPlusMatch) {
    const weeks = parseInt(weeksPlusMatch[1]);
    return `${weeks}w`;
  }

  const monthsPlusRegex = /(\d+)\+?\s*months?/i;
  const monthsPlusMatch = cleanedDate.match(monthsPlusRegex);
  if (monthsPlusMatch) {
    const months = parseInt(monthsPlusMatch[1]);
    return `${months}mo`;
  }

  // Parse relative time expressions
  const timeRegex = /(\d+)\s*(hour|hours|h|minute|minutes|min|day|days|d|week|weeks|w|month|months|mo|m)(?:\s|$)/i;
  const match = cleanedDate.match(timeRegex);

  if (match) {
    const number = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    if (unit.startsWith('h') || unit.includes('hour')) {
      return `${number}h`;
    } else if (unit.startsWith('min') || unit.includes('minute')) {
      return number >= 60 ? `${Math.floor(number / 60)}h` : "1h";
    } else if (unit.startsWith('d') || unit.includes('day')) {
      return `${number}d`;
    } else if (unit.startsWith('w') || unit.includes('week')) {
      return `${number}w`;
    } else if ((unit === 'm' || unit.startsWith('month')) && unit !== 'min') {
      return `${number}mo`;
    }
  }

  // Try to parse absolute dates as fallback
  const parsedDate = new Date(dateStr);
  if (isNaN(parsedDate.getTime())) {
    return "1d";
  }

  // Calculate difference
  const now = new Date();
  const diffTime = Math.abs(now - parsedDate);
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffHours < 24) {
    return diffHours === 0 ? "1h" : `${diffHours}h`;
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months}mo`;
  }
}

/**
 * Check if job is older than one month
 * @param {string} postedDate - Raw posted date string
 * @returns {boolean} True if job is older than 1 month
 */
function isJobOlderThanOneMonth(postedDate) {
  const relativeDate = convertDateToRelative(postedDate);
  const match = relativeDate.match(/^(\d+)([hdwmo])$/i);
  
  if (!match) return true;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 'mo' && value >= 1) {
    return true;
  }
  
  return false;
}

/**
 * Main transformation function - converts raw job data to standardized format
 * @param {Array} jobs - Array of raw job objects
 * @param {string} searchQuery - Search query used for job search
 * @returns {Array} Array of transformed job objects
 */
function transformJobs(jobs, searchQuery) {
  return jobs
    .filter(job => job.title && job.title.trim() !== '')
    .filter(job => !isJobOlderThanOneMonth(job.posted))
    .map(job => {
      const { city, state } = parseLocation(job.location);
      const applyLink = job.applyLink || "";
      const postedRelative = convertDateToRelative(job.posted);
      const job_description = job.description;

      return {
        employer_name: job.company || "",
        job_title: cleanJobTitle(job.title),
        job_city: city || '',
        job_state: state || '',
        job_posted_at: postedRelative || "Recently",
        job_description: job_description || `${searchQuery} job for the role ${job.title}`,
        job_apply_link: applyLink,
      };
    });
}

// Export all functions
module.exports = {
  cleanJobTitle,
  parseLocation,
  convertDateToRelative,
  isJobOlderThanOneMonth,
  transformJobs
};
