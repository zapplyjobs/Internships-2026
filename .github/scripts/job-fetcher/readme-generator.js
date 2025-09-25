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

// Generate enhanced job table with better formatting
// Import or load the JSON configuration

function generateJobTable(jobs) {
  console.log(
    `🔍 DEBUG: Starting generateJobTable with ${jobs.length} total jobs`
  );

  if (jobs.length === 0) {
    return `| Company | Role | Location | Apply Now | Age |
|---------|------|----------|-----------|-----|
| *No current openings* | *Check back tomorrow* | *-* | *-* | *-* |`;
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

        output += `| Role | Location | Apply Now | Age |\n`;
        output += `|------|----------|-----------|-----|\n`;

        companyJobs.forEach((job) => {
          const role = job.job_title;
          const location = formatLocation(job.job_city, job.job_state);
          const posted = job.job_posted_at;
          const applyLink =
            job.job_apply_link || getCompanyCareerUrl(job.employer_name);

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

          output += `| ${role}${statusIndicator} | ${location} | [Apply](${applyLink}) | ${posted} |\n`;
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
  return output;
}

function generateInternshipSection(internshipData) {
  if (!internshipData) return "";

  return `
---

## 🎓 **SWE Internships 2025-2026**

> **Top internships for software engineers, programmers, and computer science majors.**

### 🏢 **FAANG+ Internship Programs**

| Company | Program | Apply Now |
|---------|---------|-----------|
${internshipData.companyPrograms
  .map((program) => {
    const companyObj = ALL_COMPANIES.find((c) => c.name === program.company);
    const emoji = companyObj ? companyObj.emoji : "🏢";
    return `| ${emoji} **${program.company}** | ${program.program} |<a href="${program.url}"  target="_blank"><img src="https://img.shields.io/badge/Apply_Button-B0BEC5?style=for-the-badge&borderRadius=45" width="120" height="35" alt="Apply Now"></a>|`;
  })
  .join("\n")}

### 📚 **Top Software Internship Resources**

| Platform | Description | Visit Now |
|----------|-------------|-----------|
${internshipData.sources
  .map(
    (source) =>
      `| **${source.emogi} ${source.name}** | ${source.description} | <a href="${source.url}"><img src="https://img.shields.io/badge/Visit_Button-B0BEC5?style=for-the-badge&borderRadius=45" width="120" height="35" alt="Visit Button"></a>|`
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
<summary><h2>📁 <strong>Archived SWE Jobs</strong> - ${
    archivedJobs.length
  } (7+ days old) - Click to Expand</h2></summary>

> Either still hiring or useful for research.

### **Archived Job Stats**
- **📁 Total Jobs**: ${archivedJobs.length} positions
- **🏢 Companies**: ${Object.keys(stats.totalByCompany).length} companies  
- **⭐ FAANG+ Jobs & Internships**: ${archivedFaangJobs} roles

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

  const totalCompanies = Object.keys(stats?.totalByCompany || {}).length;
  const faangJobs = currentJobs.filter((job) =>
    companies.faang_plus.some((c) => c.name === job.employer_name)
  ).length;

  return `# 💻 Software Engineering Jobs & Internships 2025-2026 by Zapply

**🚀 Real-time software engineering, programming, and IT jobs from ${totalCompanies}+ top companies like Tesla, NVIDIA, and Raytheon. Updated every 24 hours with ${
    currentJobs.length
  }+ fresh opportunities for new graduates, CS students, and entry-level software developers.**

**🎯 Includes roles across tech giants, fast-growing startups, and engineering-first companies like Chewy, CACI, and TD Bank.**

**🛠 Help us grow! Add new jobs by submitting an issue! View CONTRIBUTING steps [here](CONTRIBUTING-new.md).**

---

## **Join Community**

**🤗 [Job Finder & Career Hub by Zapply](https://discord.gg/yKWw28q7Yq)** - Connect with fellow job seekers, get career advice, share experiences, and stay updated on the latest opportunities. Join developers and CS students navigating their career journey together!


---

## 📊 **Live Stats**

🔥 **Current Positions:** ${currentJobs.length} hot software engineering jobs  
🏢 **Top Companies:** ${totalCompanies} elite tech including Tesla, NVIDIA, Raytheon  
⭐ **FAANG+ Jobs & Internships:** ${faangJobs} premium opportunities  
📅 **Last Updated:** ${currentDate}  
🤖 **Next Update:** Tomorrow at 9 AM UTC  
📁 **Archived Developer Jobs:** ${archivedJobs.length} (older than 1 week)

${internshipData ? generateInternshipSection(internshipData) : ""}

---

## 🎯 **Fresh Software Job Listings 2025-2026 (under 1 week)**

${generateJobTable(currentJobs)}

---
## **✨ Insights on the Repo**

### 🏢 **Top Companies**

### 🌟 FAANG+ Companies
*${companies?.faang_plus?.length || 0} companies • Premium technology leaders*

${
  companies?.faang_plus
    ?.map((c) => {
      if (stats && stats.byCategory && currentJobs) {
        const companyJobs = currentJobs.filter(
          (job) => job.employer_name === c.name
        );
        const totalJobs = companyJobs.length;

        if (totalJobs > 0) {
          const jobCategories = companyJobs.reduce((acc, job) => {
            const category =
              getJobCategory(job.job_title, job.job_description) || "Other";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {});

          const sortedCategories = Object.entries(jobCategories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

          const jobsText = sortedCategories
            .map(([cat, count]) => `**${count}** ${cat}`)
            .join(" • ");

          return `**${c.emoji} [${c.name}](${c.career_url})**\n*Available positions:* ${jobsText}`;
        }
      }
      return `**${c.emoji} [${c.name}](${c.career_url})`;
    })
    .join("\n\n") || "*No companies available*"
}

---

### 🦄 Unicorn Startups
*${companies?.unicorn_startups?.length || 0} companies • High-growth potential*

${
  companies?.unicorn_startups
    ?.map((c) => {
      if (stats && stats.byCategory && currentJobs) {
        const companyJobs = currentJobs.filter(
          (job) => job.employer_name === c.name
        );
        const totalJobs = companyJobs.length;

        if (totalJobs > 0) {
          const jobCategories = companyJobs.reduce((acc, job) => {
            const category =
              getJobCategory(job.job_title, job.job_description) || "Other";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {});

          const sortedCategories = Object.entries(jobCategories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

          const jobsText = sortedCategories
            .map(([cat, count]) => `**${count}** ${cat}`)
            .join(" • ");

          return `**${c.emoji} [${c.name}](${c.career_url})**\n*Available positions:* ${jobsText}`;
        }
      }
      return `**${c.emoji} [${c.name}](${c.career_url})**\n`;
    })
    .join("\n\n") || "*No companies available*"
}

---

## 🎯 Industry Leaders

### 💰 Fintech & Financial Services
*${companies?.fintech?.length || 0} companies • Financial innovation*

${
  companies?.fintech
    ?.map((c) => {
      if (stats && stats.byCategory && currentJobs) {
        const companyJobs = currentJobs.filter(
          (job) => job.employer_name === c.name
        );
        const totalJobs = companyJobs.length;

        if (totalJobs > 0) {
          const jobCategories = companyJobs.reduce((acc, job) => {
            const category =
              getJobCategory(job.job_title, job.job_description) || "Other";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {});

          const sortedCategories = Object.entries(jobCategories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

          const jobsText = sortedCategories
            .map(([cat, count]) => `**${count}** ${cat}`)
            .join(" • ");

          return `**${c.emoji} [${c.name}](${c.career_url})**\n*Available positions:* ${jobsText}`;
        }
      }
      return `**${c.emoji} [${c.name}](${c.career_url})**\n`;
    })
    .join("\n\n") || "*No companies available*"
}

---

### 🎮 Gaming & Entertainment
*${
    [...(companies?.gaming || []), ...(companies?.media_entertainment || [])]
      .length
  } companies • Creative & interactive media*

${
  [...(companies?.gaming || []), ...(companies?.media_entertainment || [])]
    .map((c) => {
      if (stats && stats.byCategory && currentJobs) {
        const companyJobs = currentJobs.filter(
          (job) => job.employer_name === c.name
        );
        const totalJobs = companyJobs.length;

        if (totalJobs > 0) {
          const jobCategories = companyJobs.reduce((acc, job) => {
            const category =
              getJobCategory(job.job_title, job.job_description) || "Other";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {});

          const sortedCategories = Object.entries(jobCategories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

          const jobsText = sortedCategories
            .map(([cat, count]) => `**${count}** ${cat}`)
            .join(" • ");

          return `**${c.emoji} [${c.name}](${c.career_url})**\n*Available positions:* ${jobsText}`;
        }
      }
      return `**${c.emoji} [${c.name}](${c.career_url})**\n`;
    })
    .join("\n\n") || "*No companies available*"
}

---

### ☁️ Enterprise & Cloud Solutions
*${
    [...(companies?.top_tech || []), ...(companies?.enterprise_saas || [])]
      .length
  } companies • Business technology*

${
  [...(companies?.top_tech || []), ...(companies?.enterprise_saas || [])]
    .map((c) => {
      if (stats && stats.byCategory && currentJobs) {
        const companyJobs = currentJobs.filter(
          (job) => job.employer_name === c.name
        );
        const totalJobs = companyJobs.length;

        if (totalJobs > 0) {
          const jobCategories = companyJobs.reduce((acc, job) => {
            const category =
              getJobCategory(job.job_title, job.job_description) || "Other";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {});

          const sortedCategories = Object.entries(jobCategories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

          const jobsText = sortedCategories
            .map(([cat, count]) => `**${count}** ${cat}`)
            .join(" • ");

          return `**${c.emoji} [${c.name}](${c.career_url})**\n*Available positions:* ${jobsText}`;
        }
      }
      return `**${c.emoji} [${c.name}](${c.career_url})**\n`;
    })
    .join("\n\n") || "*No companies available*"
}

---

### 📈 **Experience Breakdown**

| Level               | Count | Percentage | Top Companies                     |
|---------------------|-------|------------|-----------------------------------|
| 🟢 Entry Level & New Grad | ${stats?.byLevel["Entry-Level"] || 0} | ${
    stats
      ? Math.round((stats.byLevel["Entry-Level"] / currentJobs.length) * 100)
      : 0
  }% | No or minimal experience |
| 🟡 Beginner & Early Career | ${stats?.byLevel["Mid-Level"] || 0} | ${
    stats
      ? Math.round((stats.byLevel["Mid-Level"] / currentJobs.length) * 100)
      : 0
  }% | 1-2 years of experience |
| 🔴 Manager         | ${stats?.byLevel["Senior"] || 0} | ${
    stats ? Math.round((stats.byLevel["Senior"] / currentJobs.length) * 100) : 0
  }% | 2+ years of experience |

---

### 🌍 **Top Locations**
${
  stats
    ? Object.entries(stats.byLocation)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([location, count]) => `- **${location}**: ${count} positions`)
        .join("\n")
    : ""
}

---

## 🔮 **Why Software Engineers Choose Our Job Board**

✅ **100% Real Jobs:** ${
    currentJobs.length
  }+ verified CS internships and entry-level software roles from ${totalCompanies} elite tech companies.

✅ **Fresh Daily Updates:** Live company data from Tesla, Raytheon, Chewy, and CACI refreshed every 24 hours automatically.

✅ **Entry-Level Focused:** Smart filtering for CS majors, new grads, and early-career engineers.

✅ **Intern-to-FTE Pipeline:** Track internships that convert to full-time SWE roles.

✅ **Direct Applications:** Skip recruiters -- apply straight to company career pages for Tesla, Amazon, and NVIDIA positions.

✅ **Mobile-Optimized:** Perfect mobile experience for CS students job hunting between classes.

---

## 🚀 **Job Hunt Tips That Actually Work**

### 🔍 **Research Before Applying**

- **Find the hiring manager:** Search "[Company] [Team] engineering manager" on LinkedIn.
- **Check recent tech decisions:** Read their engineering blog for stack changes or new initiatives.
- **Verify visa requirements:** Look for 🇺🇸 indicator or "US persons only" in job description.
- [Use this 100% ATS-compliant and job-targeted resume template](https://docs.google.com/document/d/1eGqU7E9if-d1VoWWWts79CT-LzbJsfeZ/edit?usp=drive_link&ouid=108189138560979620587&rtpof=true&sd=true).

### 📄 **Resume Best Practices**

- **Mirror their tech stack:** Copy exact keywords from job post (React, Django, Node.js, etc.).
- **Lead with business impact:** "Improved app speed by 30%" > "Used JavaScript."
- **Show product familiarity:** "Built Netflix-style recommendation engine" or "Created Stripe payment integration."
- [Read this informative guide on tweaking your resume](https://docs.google.com/document/d/12ngAUd7fKO4eV39SBgQdA8nHw_lJIngu/edit?usp=drive_link&ouid=108189138560979620587&rtpof=true&sd=true).

### 🎯 **Interview Best Practices**

- **Ask tech-specific questions:** "How do you handle CI/CD at scale?" shows real research.
- **Prepare failure stories:** "Migration failed, learned X, rebuilt with Y" demonstrates growth mindset.
- **Reference their products:** "As a daily Slack user, I've noticed..." proves genuine interest.
- [Review this comprehensive interview guide on common behavioral, technical, and curveball questions](https://docs.google.com/document/d/1LU4kSNRu0JNiWG5CNPRp0kgzAhq27VHy/edit?usp=drive_link&ouid=108189138560979620587&rtpof=true&sd=true).

---

## 📬 **Stay Updated**

- ⭐ **Star this repo** to bookmark and check daily.
- 👀 **Watch** to get notified of new SWE jobs.
- 📱 **Bookmark on your phone** for quick job hunting.
- 🤝 **Become a contributor** and add new jobs! Visit our CONTRIBUTING GUIDE [here](CONTRIBUTING-new.md).

---

${archivedJobs.length > 0 ? generateArchivedSection(archivedJobs, stats) : ""}


<div align="center">

**🎯 ${
    currentJobs.length
  } current opportunities from ${totalCompanies} elite companies.**

**Found this helpful? Give it a ⭐ to support us!**

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
    console.log(`✅ README.md updated with ${currentJobs.length} current jobs`);

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
};
