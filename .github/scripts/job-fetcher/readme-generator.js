const fs = require("fs");
const companyCategory = require("./software.json");
const {
  companies,
  ALL_COMPANIES,
  getCompanyEmoji,
  getCompanyCareerUrl,
  getExperienceLevel,
  getJobCategory,
  formatLocation,
} = require("./utils");
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

function generateJobTable(jobs) {
  console.log(
    `🔍 DEBUG: Starting generateJobTable with ${jobs.length} total jobs`
  );

  // ADD THESE 2 LINES:
  jobs = filterOutSeniorPositions(jobs);
  console.log(`🔍 DEBUG: After filtering seniors: ${jobs.length} jobs remaining`);

if (jobs.length === 0) {
  return `| Company | Role | Location | Level | Apply Now | Age |
|---------|------|----------|-------|-----------|-----|
| *No current openings* | *Check back tomorrow* | *-* | *-* | *-* | *-* |`;
}

  // Create a map of lowercase company names to actual names for case-insensitive matching
  const companyNameMap = new Map();
  Object.entries(companyCategory).forEach(([categoryKey, category]) => {
    category.companies.forEach((company) => {
      companyNameMap.set(company.toLowerCase(), {
        name: company,
        category: categoryKey,
        categoryTitle: category.title,
      });
    });
  });

  console.log(`🏢 DEBUG: Configured companies by category:`);
  Object.entries(companyCategory).forEach(([categoryKey, category]) => {
    console.log(
      `  ${category.emoji} ${category.title}: ${category.companies.join(", ")}`
    );
  });

  // Get unique companies from job data
  const uniqueJobCompanies = [...new Set(jobs.map((job) => job.employer_name))];
  console.log(
    `\n📊 DEBUG: Unique companies found in job data (${uniqueJobCompanies.length}):`,
    uniqueJobCompanies
  );

  // Group jobs by company - only include jobs from valid companies
  const jobsByCompany = {};
  const processedCompanies = new Set();
  const skippedCompanies = new Set();

  jobs.forEach((job) => {
    const employerNameLower = job.employer_name.toLowerCase();
    const matchedCompany = companyNameMap.get(employerNameLower);

    // Only process jobs from companies in our category list
    if (matchedCompany) {
      processedCompanies.add(job.employer_name);
      if (!jobsByCompany[matchedCompany.name]) {
        jobsByCompany[matchedCompany.name] = [];
      }
      jobsByCompany[matchedCompany.name].push(job);
    } else {
      skippedCompanies.add(job.employer_name);
    }
  });

  console.log(`\n✅ DEBUG: Companies INCLUDED (${processedCompanies.size}):`, [
    ...processedCompanies,
  ]);
  console.log(`\n❌ DEBUG: Companies SKIPPED (${skippedCompanies.size}):`, [
    ...skippedCompanies,
  ]);

  // Log job counts by company
  console.log(`\n📈 DEBUG: Job counts by company:`);
  Object.entries(jobsByCompany).forEach(([company, jobs]) => {
    const companyInfo = companyNameMap.get(company.toLowerCase());
    console.log(
      `  ${company}: ${jobs.length} jobs (Category: ${
        companyInfo?.categoryTitle || "Unknown"
      })`
    );
  });

  let output = "";

  // Handle each category
  Object.entries(companyCategory).forEach(([categoryKey, categoryData]) => {
    // Filter companies that actually have jobs
    const companiesWithJobs = categoryData.companies.filter(
      (company) => jobsByCompany[company] && jobsByCompany[company].length > 0
    );

    if (companiesWithJobs.length > 0) {
      const totalJobs = companiesWithJobs.reduce(
        (sum, company) => sum + jobsByCompany[company].length,
        0
      );

      console.log(
        `\n📝 DEBUG: Processing category "${categoryData.title}" with ${companiesWithJobs.length} companies and ${totalJobs} total jobs:`
      );
      companiesWithJobs.forEach((company) => {
        console.log(`  - ${company}: ${jobsByCompany[company].length} jobs`);
      });

      // Use singular/plural based on job count
      const positionText = totalJobs === 1 ? "position" : "positions";
      output += `### ${categoryData.emoji} **${categoryData.title}** (${totalJobs} ${positionText})\n\n`;

      // Handle ALL companies with their own sections (regardless of job count)
      companiesWithJobs.forEach((companyName) => {
        const companyJobs = jobsByCompany[companyName];
        const emoji = getCompanyEmoji(companyName);
        const positionText =
          companyJobs.length === 1 ? "position" : "positions";

        // Use collapsible details for companies with more than 15 jobs
        if (companyJobs.length > 15) {
          output += `<details>\n`;
          output += `<summary><h4>${emoji} <strong>${companyName}</strong> (${companyJobs.length} ${positionText})</h4></summary>\n\n`;
        } else {
          output += `#### ${emoji} **${companyName}** (${companyJobs.length} ${positionText})\n\n`;
        }

        output += `| Role | Location | Level | Apply Now | Age |\n`;
        output += `|------|----------|-------|-----------|-----|\n`;

        companyJobs.forEach((job) => {
          const role = job.job_title;
          const location = formatLocation(job.job_city, job.job_state);
          const posted = job.job_posted_at;
          const applyLink =
            job.job_apply_link || getCompanyCareerUrl(job.employer_name);

          // Get experience level and create badge
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
          if (
            description.includes("no sponsorship") ||
            description.includes("us citizen")
          ) {
            statusIndicator = " 🇺🇸";
          }
          if (description.includes("remote")) {
            statusIndicator += " 🏠";
          }

          output += `| ${role}${statusIndicator} | ${location} | ${levelBadge} | [<img src="images/apply.png" width="75" alt="Apply">](${applyLink}) | ${posted} |\n`;
        });

        if (companyJobs.length > 15) {
          output += `\n</details>\n\n`;
        } else {
          output += "\n";
        }
      });
    }
  });

  console.log(
    `\n🎉 DEBUG: Finished generating job table with ${
      Object.keys(jobsByCompany).length
    } companies processed`
  );

  // Process uncategorized companies (not in software.json)
  const categorizedCompanies = new Set();
  Object.values(companyCategory).forEach(category => {
    category.companies.forEach(company => categorizedCompanies.add(company));
  });

  const uncategorizedCompanies = Object.keys(jobsByCompany).filter(
    company => !categorizedCompanies.has(company)
  );

  if (uncategorizedCompanies.length > 0) {
    const totalUncategorizedJobs = uncategorizedCompanies.reduce(
      (sum, company) => sum + jobsByCompany[company].length, 0
    );

    console.log(`\n📝 DEBUG: Processing UNCATEGORIZED companies: ${uncategorizedCompanies.length} companies with ${totalUncategorizedJobs} jobs`);

    output += `### 🏢 **Other Companies** (${totalUncategorizedJobs} positions)\n\n`;

    // Handle large uncategorized companies (>10 jobs) separately
    const bigUncategorized = uncategorizedCompanies.filter(
      company => jobsByCompany[company].length > 10
    );

    bigUncategorized.forEach((companyName) => {
      const companyJobs = jobsByCompany[companyName];
      const emoji = getCompanyEmoji(companyName);

      if (companyJobs.length > 15) {
        output += `<details>\n`;
        output += `<summary><h4>${emoji} <strong>${companyName}</strong> (${companyJobs.length} positions)</h4></summary>\n\n`;
      } else {
        output += `#### ${emoji} **${companyName}** (${companyJobs.length} positions)\n\n`;
      }

      output += `| Role | Location | Level | Apply Now | Age |\n`;
      output += `|------|----------|-------|-----------|-----|\n`;

      companyJobs.forEach((job) => {
        const role = job.job_title;
        const location = formatLocation(job.job_city, job.job_state);
        const posted = job.job_posted_at;
        const level = getExperienceLevel(job.job_title, job.job_description);
        const levelBadge = {
          "Entry-Level": '![Entry](https://img.shields.io/badge/-Entry-brightgreen "Entry-Level")',
          "Mid-Level": '![Mid](https://img.shields.io/badge/-Mid-blue "Mid-Level")',
          "Senior": '![Senior](https://img.shields.io/badge/-Senior-red "Senior-Level")'
        }[level] || level;
        const applyLink = job.job_apply_link || getCompanyCareerUrl(job.employer_name);

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

      if (companyJobs.length > 15) {
        output += `\n</details>\n\n`;
      } else {
        output += "\n";
      }
    });

    // Combine small uncategorized companies into one table
    const smallUncategorized = uncategorizedCompanies.filter(
      company => jobsByCompany[company].length <= 10
    );

    if (smallUncategorized.length > 0) {
      output += `| Company | Role | Location | Level | Apply Now | Age |\n`;
      output += `|---------|------|----------|-------|-----------|-----|\n`;

      smallUncategorized.forEach((companyName) => {
        const companyJobs = jobsByCompany[companyName];
        const emoji = getCompanyEmoji(companyName);

        companyJobs.forEach((job) => {
          const role = job.job_title;
          const location = formatLocation(job.job_city, job.job_state);
          const posted = job.job_posted_at;
          const level = getExperienceLevel(job.job_title, job.job_description);
          const levelBadge = {
            "Entry-Level": '![Entry](https://img.shields.io/badge/-Entry-brightgreen "Entry-Level")',
            "Mid-Level": '![Mid](https://img.shields.io/badge/-Mid-blue "Mid-Level")',
            "Senior": '![Senior](https://img.shields.io/badge/-Senior-red "Senior-Level")'
          }[level] || level;
          const applyLink = job.job_apply_link || getCompanyCareerUrl(job.employer_name);

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
  }

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

  const archivedFaangJobs = archivedJobs.filter((job) =>
    companies.faang_plus.some((c) => c.name === job.employer_name)
  ).length;

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
- **⭐ FAANG+ Opportunities**: ${archivedFaangJobs} positions

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

  // Calculate actual displayed jobs (only from companies in software.json)
  const companyNameMap = new Map();
  Object.entries(companyCategory).forEach(([categoryKey, category]) => {
    if (Array.isArray(category.companies)) {
      category.companies.forEach((company) => {
        companyNameMap.set(company.toLowerCase(), company);
      });
    }
  });

  const displayedJobs = currentJobs.filter(job => {
    return companyNameMap.has(job.employer_name.toLowerCase());
  });

  // ADD THIS LINE:
  const filteredJobs = filterOutSeniorPositions(displayedJobs);

  const displayedJobCount = filteredJobs.length;
  const totalCompanies = [...new Set(filteredJobs.map(j => j.employer_name))].length;
  
  const faangJobs = filteredJobs.filter((job) =>
    companies.faang_plus.some((c) => c.name === job.employer_name)
  ).length;

  return `<div align="center">

<!-- Banner -->
<img src="images/int-heading.png" alt="Internships 2026 - Illustration of people collaborating on internships.">

# Internships 2026

<!-- Row 1: Job Stats (Custom Static Badges) -->
![Total Internships](https://img.shields.io/badge/Total_Internships-${displayedJobCount}-brightgreen?style=flat&logo=briefcase) ![Companies](https://img.shields.io/badge/Companies-${totalCompanies}-blue?style=flat&logo=building) ${faangJobs > 0 ? '![FAANG+ Internships](https://img.shields.io/badge/FAANG+_Internships-' + faangJobs + '-red?style=flat&logo=star)' : ''} ![Updated](https://img.shields.io/badge/Updated-Every_15_Minutes-orange?style=flat&logo=calendar)

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
  <a href=""><img src="images/extension-button.png" alt="Install Our Extension - Coming Soon" width="300"></a>
</p>

---

## Explore Around

<img src="images/community.png" alt="Explore Around">

Connect and seek advice from a growing network of fellow students and new grads.

<p align="center">
  <a href="https://discord.gg/UswBsduwcD"><img src="images/discord-2d.png" alt="Visit Our Website" width="250"></a>
  &nbsp;&nbsp;
  <a href="https://www.instagram.com/zapplyjobs"><img src="images/instagram-icon-2d.png" alt="Instagram" height="75"></a>
  &nbsp;&nbsp;
  <a href="https://www.tiktok.com/@zapplyjobs"><img src="images/tiktok-icon-2d.png" alt="TikTok" height="75"></a>
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

- Located in the US, Canada, or Remote.
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
    fs.writeFileSync("README.md", readmeContent, "utf8");
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