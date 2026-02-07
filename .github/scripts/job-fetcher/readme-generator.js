const fs = require("fs");
const path = require("path");
const jobCategories = require("./job_categories.json");
const {
  companies,
  ALL_COMPANIES,
  getCompanyEmoji,
  getCompanyCareerUrl,
  getExperienceLevel,
  formatLocation,
} = require("./utils");

// Path to repo root README.md
const REPO_README_PATH = path.join(__dirname, '../../../README.md');
// Import or load the JSON configuration

// Filter jobs by age - jobs posted within last 7 days are "current", older ones are "archived"
function filterJobsByAge(allJobs) {
  const currentJobs = [];
  const archivedJobs = [];

  allJobs.forEach((job) => {
    // Use the same logic as isJobOlderThanWeek to handle relative dates ("1d", "2w", etc.)
    const isOld = isJobOlderThanWeek(job.job_posted_at);

    if (!isOld) {
      currentJobs.push(job);
    } else {
      archivedJobs.push(job);
    }
  });

  console.log(`📅 Filtered: ${currentJobs.length} current (≤7 days), ${archivedJobs.length} archived (>7 days)`);
  return { currentJobs, archivedJobs };
}

// Helper function to check if job is older than 7 days
// Handles relative date formats like "1d", "2w", "1mo" and absolute dates
function isJobOlderThanWeek(dateString) {
  if (!dateString) return false;

  // Check if the date is in relative format (e.g., '1d', '2w', '1mo')
  const relativeMatch = dateString.match(/^(\d+)([hdwmo])$/i);
  if (relativeMatch) {
    const value = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();

    if (unit === 'd' && value >= 14) return true;
    if (unit === 'w' && value >= 2) return true;
    if (unit === 'mo') return true;
    return false;
  }

  // Fallback to absolute date comparison
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const jobDate = new Date(dateString);

  return jobDate < oneWeekAgo;
}

// Filter out senior positions - only keep Entry-Level and Mid-Level
function filterOutSeniorPositions(jobs) {
  return jobs.filter(job => {
    const level = getExperienceLevel(job.job_title, job.job_description);
    return level !== "Senior";
  });
}

// Helper function to categorize a job based on keywords
function getJobCategoryFromKeywords(jobTitle, jobDescription = '') {
  const text = `${jobTitle} ${jobDescription}`.toLowerCase();

  // Check each category's keywords
  for (const [categoryKey, categoryData] of Object.entries(jobCategories)) {
    for (const keyword of categoryData.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return categoryKey;
      }
    }
  }

  return 'software_engineering'; // Default fallback
}

function generateJobTable(jobs) {
  console.log(`🔍 DEBUG: Starting generateJobTable with ${jobs.length} total jobs`);

  jobs = filterOutSeniorPositions(jobs);
  console.log(`🔍 DEBUG: After filtering seniors: ${jobs.length} jobs remaining`);

  if (jobs.length === 0) {
    return `| Company | Role | Location | Level | Apply Now | Age |
|---------|------|----------|-------|-----------|-----|
| *No current openings* | *Check back tomorrow* | *-* | *-* | *-* | *-* |`;
  }

  console.log(`🏷️ DEBUG: Configured job categories:`);
  Object.entries(jobCategories).forEach(([categoryKey, category]) => {
    console.log(`  ${category.emoji} ${category.title}: ${category.keywords.join(', ')}`);
  });

  // Categorize each job and group by category
  const jobsByCategory = {};
  const categorizedJobs = new Set();

  jobs.forEach((job) => {
    const categoryKey = getJobCategoryFromKeywords(job.job_title, job.job_description);
    categorizedJobs.add(job.job_id);

    if (!jobsByCategory[categoryKey]) {
      jobsByCategory[categoryKey] = [];
    }
    jobsByCategory[categoryKey].push(job);
  });

  console.log(`\n📈 DEBUG: Jobs by category:`);
  Object.entries(jobsByCategory).forEach(([categoryKey, categoryJobs]) => {
    console.log(`  ${jobCategories[categoryKey]?.title || categoryKey}: ${categoryJobs.length} jobs`);
  });

  let output = "";

  // Handle each job category
  Object.entries(jobCategories).forEach(([categoryKey, categoryData]) => {
    const categoryJobs = jobsByCategory[categoryKey];

    if (!categoryJobs || categoryJobs.length === 0) {
      return; // Skip empty categories
    }

    const totalJobs = categoryJobs.length;
    console.log(`\n📝 DEBUG: Processing category "${categoryData.title}" with ${totalJobs} jobs`);

    // Group jobs by company within this category
    const jobsByCompany = {};
    categoryJobs.forEach((job) => {
      const company = job.employer_name;
      if (!jobsByCompany[company]) {
        jobsByCompany[company] = [];
      }
      jobsByCompany[company].push(job);
    });

    const positionText = totalJobs === 1 ? "position" : "positions";

    // Start collapsible category section
    output += `<details>\n`;
    output += `<summary><h3>${categoryData.emoji} <strong>${categoryData.title}</strong> (${totalJobs} ${positionText})</h3></summary>\n\n`;

    // Handle companies with >15 jobs separately
    const bigCompanies = Object.entries(jobsByCompany)
      .filter(([_, companyJobs]) => companyJobs.length > 15)
      .sort((a, b) => b[1].length - a[1].length);

    bigCompanies.forEach(([companyName, companyJobs]) => {
      const emoji = getCompanyEmoji(companyName);
      const posText = companyJobs.length === 1 ? "position" : "positions";

      output += `<details>\n`;
      output += `<summary><h4>${emoji} <strong>${companyName}</strong> (${companyJobs.length} ${posText})</h4></summary>\n\n`;

      output += `| Role | Location | Level | Apply Now | Age |\n`;
      output += `|------|----------|-------|-----------|-----|\n`;

      companyJobs.forEach((job) => {
        const role = job.job_title;
        const location = formatLocation(job.job_city, job.job_state);
        const posted = job.job_posted_at;
        const applyLink = job.job_apply_link || getCompanyCareerUrl(job.employer_name);

        const level = getExperienceLevel(job.job_title, job.job_description);
        let levelBadge = '';
        if (level === 'Entry-Level') {
          levelBadge = '![Entry](https://img.shields.io/badge/Entry-00C853)';
        } else if (level === 'Mid-Level') {
          levelBadge = '![Mid](https://img.shields.io/badge/-Mid-blue "Mid-Level")';
        } else if (level === 'Senior') {
          levelBadge = '![Senior](https://img.shields.io/badge/Senior-FF5252)';
        } else {
          levelBadge = '![Unknown](https://img.shields.io/badge/Unknown-9E9E9E)';
        }

        let statusIndicator = "";
        const description = (job.job_description || "").toLowerCase();
        if (description.includes("no sponsorship") || description.includes("us citizen")) {
          statusIndicator = " 🇺🇸";
        }
        if (description.includes("remote")) {
          statusIndicator += " 🏠";
        }

        output += `| ${role}${statusIndicator} | ${location} | ${levelBadge} | [<img src="images/apply.png" width="75" alt="Apply">](${applyLink}) | ${posted} |\n`;
      });

      output += `\n</details>\n\n`;
    });

    // Combine companies with <=15 jobs into one table
    const smallCompanies = Object.entries(jobsByCompany)
      .filter(([_, companyJobs]) => companyJobs.length <= 15)
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (smallCompanies.length > 0) {
      output += `| Company | Role | Location | Level | Apply Now | Age |\n`;
      output += `|---------|------|----------|-------|-----------|-----|\n`;

      smallCompanies.forEach(([companyName, companyJobs]) => {
        const emoji = getCompanyEmoji(companyName);

        companyJobs.forEach((job) => {
          const role = job.job_title;
          const location = formatLocation(job.job_city, job.job_state);
          const posted = job.job_posted_at;
          const applyLink = job.job_apply_link || getCompanyCareerUrl(job.employer_name);

          const level = getExperienceLevel(job.job_title, job.job_description);
          const levelBadge = {
            "Entry-Level": '![Entry](https://img.shields.io/badge/Entry-00C853)',
            "Mid-Level": '![Mid](https://img.shields.io/badge/-Mid-blue "Mid-Level")',
            "Senior": '![Senior](https://img.shields.io/badge/Senior-FF5252)'
          }[level] || '![Unknown](https://img.shields.io/badge/Unknown-9E9E9E)';

          let statusIndicator = "";
          const description = (job.job_description || "").toLowerCase();
          if (description.includes("no sponsorship") || description.includes("us citizen")) {
            statusIndicator = " 🇺🇸";
          }
          if (description.includes("remote")) {
            statusIndicator += " 🏠";
          }

          output += `| ${emoji} **${companyName}** | ${role}${statusIndicator} | ${location} | ${levelBadge} | [<img src="images/apply.png" width="75" alt="Apply">](${applyLink}) | ${posted} |\n`;
        });
      });

      output += "\n";
    }

    // End collapsible category section
    output += `</details>\n\n`;
  });

  console.log(`\n🎉 DEBUG: Finished generating job table with ${categorizedJobs.size} jobs categorized`);
  return output;
}

function generateInternshipSection(internshipData) {
  if (!internshipData) return "";

  return `
---

## SWE Internships 2026

<img src="images/int-internships.png" alt="Software engineering internships for 2026.">

### 🏢 **FAANG+ & Elite Tech Internships**

| Company | Program | Apply Now |
|---------|---------|-----------|
${internshipData.companyPrograms
  .map((program) => {
    return `| ${program.emogi} **${program.company}** | ${program.program} | [<img src="images/apply.png" width="75" alt="Apply">](${program.url}) |`;
  })
  .join("\n")}

### 📚 **Additional Internship & New Grad Resources**

| Platform | Description | Visit Now |
|----------|-------------|-----------|
${internshipData.sources
  .map(
    (source) =>
      `| ${source.emogi} **${source.name}** | ${source.description} | [<img src="images/int-visit.png" width="75" alt="Visit Now">](${source.url}) |`
  )
  .join("\n")}

`;
}

function generateArchivedSection(archivedJobs, stats) {
  if (archivedJobs.length === 0) return "";

  // Get top category from archived jobs
  const categoryCounts = {};
  archivedJobs.forEach(job => {
    const cat = getJobCategoryFromKeywords(job.job_title, job.job_description);
    const catTitle = jobCategories[cat]?.title || 'Software Engineering';
    categoryCounts[catTitle] = (categoryCounts[catTitle] || 0) + 1;
  });
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Software Engineering';

  return `
---

<details>
<summary><h2>📁 <strong>Archived Internships & New Grad Roles</strong> - ${
    archivedJobs.length
  } (7+ days old) - Click to Expand</h2></summary>

> Some positions may still be accepting applications or useful for planning.

### **Archived Opportunity Stats**
- **📁 Total Positions**: ${archivedJobs.length} roles
- **🏢 Companies**: ${Object.keys(stats.totalByCompany).length} companies
- **🏷️ Top Category**: ${topCategory}

${generateJobTable(archivedJobs)}

</details>

---

`;
}

// Generate comprehensive README
async function generateReadme(
  currentJobs,
  archivedJobs = [],
  internshipData = null,
  stats = null
) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Filter and count jobs
  const filteredJobs = filterOutSeniorPositions(currentJobs);
  const displayedJobCount = filteredJobs.length;
  const totalCompanies = [...new Set(filteredJobs.map(j => j.employer_name))].length;

  // Count by job category for badges
  const categoryCounts = {};
  filteredJobs.forEach(job => {
    const cat = getJobCategoryFromKeywords(job.job_title, job.job_description);
    const catTitle = jobCategories[cat]?.title || 'Software Engineering';
    categoryCounts[catTitle] = (categoryCounts[catTitle] || 0) + 1;
  });
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Software Engineering';
  const topCategoryCount = categoryCounts[topCategory] || 0;
  const topCategoryBadge = topCategory.replace(/\s+/g, '_').substring(0, 20);

  return `<div align="center">

<!-- Banner -->
<img src="images/int-heading.png" alt="Internships 2026 - Illustration of people collaborating on internships.">

# Internships 2026

<!-- Row 1: Job Stats (Custom Static Badges) -->
![Total Internships](https://img.shields.io/badge/Total_Internships-${displayedJobCount}-brightgreen?style=flat&logo=briefcase) ![Companies](https://img.shields.io/badge/Companies-${totalCompanies}-blue?style=flat&logo=building) ![${topCategory.substring(0, 15)}](https://img.shields.io/badge/${topCategoryBadge}-${topCategoryCount}-red?style=flat&logo=star) ![Updated](https://img.shields.io/badge/Updated-Every_15_Minutes-orange?style=flat&logo=calendar)

</div>

<p align="center">🚀 Real-time internships from ${totalCompanies}+ top companies like Google, Meta, Amazon, and Microsoft. Updated every 10 minutes with ${displayedJobCount}+ fresh opportunities for CS students.</p>

<p align="center">🎯 Includes summer internships, fall co-ops, and new graduate programs from tech giants, unicorn startups, and fast-growing companies.</p>

> [!TIP]
> 🛠  Help us grow! Add new jobs by submitting an issue! View [contributing steps](CONTRIBUTING-GUIDE.md) here.

---

## Website & Autofill Extension

<img src="images/zapply.png" alt="Apply to jobs in seconds with Zapply.">

Explore Zapply's website and check out:

- Our chrome extension that auto-fills your job applications in seconds.
- A dedicated job board with the latest jobs for various types of roles.
- User account providing multiple profiles for different resume roles.
- Job application tracking with streaks to unlock commitment awards.

Experience an advanced career journey with us! 🚀

<p align="center">
  <a href="https://zapply.jobs/"><img src="images/zapply-button.png" alt="Visit Our Website" width="300"></a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://chromewebstore.google.com/detail/zapply-instant-autofill-f/lkomdndabnpakcabffgobiejimpamjom"><img src="images/extension-button.png" alt="Install Our Extension" width="300"></a>
</p>

---

## Explore Around

<img src="images/community.png" alt="Explore Around">

Connect and seek advice from a growing network of fellow students and new grads.

<p align="center">
  <a href="https://discord.gg/UswBsduwcD"><img src="images/discord-2d.png" alt="Visit Our Website" width="250"></a>
  &nbsp;&nbsp;
  <a href="https://www.instagram.com/zapplyjobs"><img src="images/instagram-icon-2d.png" alt="Instagram" width="75"></a>
  &nbsp;&nbsp;
  <a href="https://www.tiktok.com/@zapplyjobs"><img src="images/tiktok-icon-2d.png" alt="TikTok" width="75"></a>
</p>

---

## Fresh Internships 2026

<img src="images/insights.png" alt="Insights pulled from current listings.">

${generateJobTable(currentJobs)}

---

## More Resources

<img src="images/more-resources.png" alt="Jobs and templates in our other repos.">

Check out our other repos for jobs and free resources:

<p align="center">
  <a href="https://github.com/zapplyjobs/New-Grad-Software-Engineering-Jobs-2026"><img src="images/repo-sej.png" alt="Software Engineering Jobs" height="40"></a>
  &nbsp;&nbsp;
  <a href="https://github.com/zapplyjobs/New-Grad-Data-Science-Jobs-2026"><img src="images/repo-dsj.png" alt="Data Science Jobs" height="40"></a>
  &nbsp;&nbsp;
  <a href="https://github.com/zapplyjobs/New-Grad-Hardware-Engineering-Jobs-2026"><img src="images/repo-hej.png" alt="Hardware Engineering Jobs" height="40"></a>
</p>
<p align="center">
  <a href="https://github.com/zapplyjobs/New-Grad-Jobs-2026"><img src="images/repo-ngj.png" alt="New Grad Jobs" height="40"></a>
  &nbsp;&nbsp;
  <a href="https://github.com/zapplyjobs/Remote-Jobs-2026"><img src="images/repo-rmj.png" alt="Remote Jobs" height="40"></a>
  &nbsp;&nbsp;
  <a href="https://github.com/zapplyjobs/New-Grad-Nursing-Jobs-2026"><img src="images/repo-nsj.png" alt="Nursing Jobs" height="40"></a>
  &nbsp;&nbsp;
  <a href="https://github.com/zapplyjobs/Research-Internships-for-Undergraduates"><img src="images/repo-rifu.png" alt="Research Internships" height="40"></a>
</p>
<p align="center">
  <a href="https://github.com/zapplyjobs/underclassmen-internships"><img src="images/repo-uci.png" alt="Underclassmen Internships" height="40"></a>
  &nbsp;&nbsp;
  <a href="https://github.com/zapplyjobs/resume-samples-2026"><img src="images/repo-rss.png" alt="Resume Samples" height="40"></a>
  &nbsp;&nbsp;
  <a href="https://github.com/zapplyjobs/interview-handbook-2026"><img src="images/repo-ihb.png" alt="Interview Handbook" height="40"></a>
</p>

---

## Become a Contributor

<img src="images/contributor.png" alt="Become a Contributor">

Add new jobs to our listings keeping in mind the following:

- Located in the US.
- Openings are currently accepting applications and not older than 14 days.
- Create a new issue to submit different job positions.
- Update a job by submitting an issue with the job URL and required changes.

Our team reviews within 24-48 hours and approved jobs are added to the main list!

Questions? Create a miscellaneous issue, and we'll assist! 🙏

${archivedJobs.length > 0 ? generateArchivedSection(archivedJobs, stats) : ""}

<div align="center">

**🎯 ${
    displayedJobCount
  } current opportunities from ${totalCompanies} top companies.**

**Found this helpful? Give it a ⭐ to support fellow students!**

*Not affiliated with any companies listed. All applications redirect to official career pages.*

---

**Last Updated:** ${currentDate} • **Next Update:** Daily at 9 AM UTC

</div>`;
}

// Update README file
async function updateReadme(currentJobs, archivedJobs, internshipData, stats) {
  try {
    console.log("📝 Generating README content...");
    const readmeContent = await generateReadme(
      currentJobs,
      archivedJobs,
      internshipData,
      stats
    );
    fs.writeFileSync(REPO_README_PATH, readmeContent, "utf8");
    console.log(`✅ README.md updated with ${currentJobs.length} current opportunities`);

    console.log("\n📊 Summary:");
    console.log(`- Total current: ${currentJobs.length}`);
    console.log(`- Archived:      ${archivedJobs.length}`);
    console.log(
      `- Companies:     ${Object.keys(stats?.totalByCompany || {}).length}`
    );
  } catch (err) {
    console.error("❌ Error updating README:", err);
    throw err;
  }
}

module.exports = {
  generateJobTable,
  generateInternshipSection,
  generateArchivedSection,
  generateReadme,
  updateReadme,
  filterJobsByAge,
  filterOutSeniorPositions,  // ADD THIS
};