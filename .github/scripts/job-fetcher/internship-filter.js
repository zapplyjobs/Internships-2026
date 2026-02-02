/**
 * Internship Filtering Module
 *
 * Validates that jobs are actually internships, not full-time/senior positions
 *
 * Bug #4 Fix (2026-01-26): Data sources return mixed job levels, filtering required
 * User reminder: "AVOID: Never add ATS to Internships-2026 - ATS APIs return ALL jobs"
 *
 * Created: 2026-01-26
 */

/**
 * Check if a job is actually an internship
 * @param {Object} job - Job object with job_title, job_description
 * @returns {boolean} True if internship, false otherwise
 */
function isInternship(job) {
  const title = (job.job_title || job.title || '').toLowerCase();
  const description = (job.job_description || job.description || '').toLowerCase();

  // MUST contain "intern" keyword in title OR description mentions internship program
  const hasInternKeyword = title.includes('intern') ||
                           description.includes('internship program') ||
                           description.includes('intern program') ||
                           description.includes('summer intern');

  if (!hasInternKeyword) {
    return false; // Not an internship
  }

  // EXCLUDE jobs with senior/mid-level indicators in title
  const isSeniorLevel = title.includes('senior') ||
                        title.includes('sr.') ||
                        title.includes('sr ') ||
                        title.includes('lead') ||
                        title.includes('principal') ||
                        title.includes('staff') ||
                        title.includes('manager') ||
                        title.includes('director');

  if (isSeniorLevel) {
    return false; // Senior-level position
  }

  // EXCLUDE jobs requiring significant experience (>1 year)
  // Common patterns: "2 years of experience", "3+ years experience", "5 years' experience"
  const experienceMatch = description.match(/(\d+)\+?\s*years?\s*(of\s*)?(relevant\s*)?experience/i);
  if (experienceMatch) {
    const yearsRequired = parseInt(experienceMatch[1]);
    if (yearsRequired > 1) {
      return false; // Requires too much experience for an internship
    }
  }

  // EXCLUDE jobs with high salary ranges (>$50K typically means full-time)
  // Common patterns: "$72,700 - $109,100", "Salary: $80,000+"
  const salaryMatch = description.match(/\$(\d{2,3}),?(\d{3})/);
  if (salaryMatch) {
    const salary = parseInt(salaryMatch[1] + salaryMatch[2]);
    if (salary > 50000) {
      return false; // Salary too high for internship (likely annual salary, not intern stipend)
    }
  }

  return true; // Passed all checks - is an internship
}

/**
 * Filter array of jobs to only internships
 * @param {Array} jobs - Array of job objects
 * @returns {Object} { filtered: Array, removed: Array }
 */
function filterInternships(jobs) {
  const filtered = [];
  const removed = [];

  for (const job of jobs) {
    if (isInternship(job)) {
      filtered.push(job);
    } else {
      removed.push({
        title: job.job_title || job.title,
        company: job.employer_name || job.company_name,
        reason: 'Not an internship (failed isInternship check)'
      });
    }
  }

  return { filtered, removed };
}

module.exports = { isInternship, filterInternships };
