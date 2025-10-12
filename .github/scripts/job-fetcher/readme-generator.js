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

          output += `| ${role}${statusIndicator} | ${location} | [<img src="./image.png" width="100" alt="Apply">](${applyLink}) | ${posted} |\n`;
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

## 🎓 **Featured Internship Programs 2026**

> **Top summer and fall internship programs for CS students and new graduates.**

### 🏢 **FAANG+ & Elite Tech Internships**

| Company | Program | Apply Now |
|---------|---------|-----------|
${internshipData.companyPrograms
  .map((program) => {
   
    return `| ${program.emogi} **${program.company}** | ${program.program} |<a href="${program.url}"  target="_blank"><img src="./image.png" width="100" alt="Apply"></a>|`;
  })
  .join("\n")}

### 📚 **Additional Internship & New Grad Resources**

| Platform | Description | Visit Now |
|----------|-------------|-----------|
${internshipData.sources
  .map(
    (source) =>
      `| **${source.emogi} ${source.name}** | ${source.description} | <a href="${source.url}"  target="_blank"><img src="./image1.png" width="100" alt="Visit Now"></a>|`
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

  const totalCompanies = Object.keys(stats?.totalByCompany || {}).length;
  const faangJobs = currentJobs.filter((job) =>
    companies.faang_plus.some((c) => c.name === job.employer_name)
  ).length;

  return `# 🎓 New Grad & Internship Opportunities 2026 by Zapply

**🚀 Real-time internships and new grad roles from ${totalCompanies}+ top companies like Google, Meta, Amazon, and Microsoft. Updated every 24 hours with ${
    currentJobs.length
  }+ fresh opportunities for CS students, recent graduates, and entry-level software engineers.**

**🎯 Includes summer internships, fall co-ops, and new graduate programs from tech giants, unicorn startups, and fast-growing companies.**

**🛠 Help us grow! Add new opportunities by submitting an issue! View CONTRIBUTING steps [here](CONTRIBUTING-GUIDE.md).**

---
## **Join Community**

Connect with fellow students and new grads, get career advice, share internship experiences, and stay updated on the latest opportunities. Join our community of CS students and recent graduates navigating their career journey together!


 <div align="center">
  <a href="https://discord.gg/yKWw28q7Yq" target="_blank">
    <img src="./discord-button.png" width="400" height="60" alt="Join Discord - Internship & New Grad Hub by Zapply">
  </a>
</div>


---

## 📊 **Live Stats**

🔥 **Current Opportunities:** ${currentJobs.length} internships & new grad roles  
🏢 **Top Companies:** ${totalCompanies} elite tech companies hiring  
⭐ **FAANG+ Positions:** ${faangJobs} premium opportunities  
📅 **Last Updated:** ${currentDate}  
🤖 **Next Update:** Tomorrow at 9 AM UTC  
📁 **Archived Opportunities:** ${archivedJobs.length} (older than 1 week)

${internshipData ? generateInternshipSection(internshipData) : ""}

---

## 🎯 **Fresh Opportunities 2026 (posted within 1 week)**

${generateJobTable(currentJobs)}


---
## **✨ Insights on the Repo**

### 🏢 **Top Hiring Companies**

#### ⭐ **FAANG+** (${(() => {
  const count = companies?.faang_plus?.filter(c => currentJobs.filter(job => job.employer_name === c.name).length > 0).length || 0;
  return `${count} ${count === 1 ? 'company' : 'companies'}`;
})()})
${companies?.faang_plus?.filter(c => currentJobs.filter(job => job.employer_name === c.name).length > 0).map((c, index) => {
  const totalJobs = currentJobs.filter(job => job.employer_name === c.name).length;
  const jobText = totalJobs === 1 ? 'position' : 'positions';
  if (index === 0) {
    return `${c.emoji} **[${c.name}](${c.career_url})** (${totalJobs} ${jobText})`;
  } else {
    return `${c.emoji} **[${c.name}](${c.career_url})** (${totalJobs})`;
  }
}).join(" • ") || "No companies available"}


#### 💰 **Fintech Leaders** (${(() => {
  const count = companies?.fintech?.filter(c => currentJobs.filter(job => job.employer_name === c.name).length > 0).length || 0;
  return `${count} ${count === 1 ? 'company' : 'companies'}`;
})()})
${companies?.fintech?.filter(c => currentJobs.filter(job => job.employer_name === c.name).length > 0).map((c, index) => {
  const totalJobs = currentJobs.filter(job => job.employer_name === c.name).length;
  const jobText = totalJobs === 1 ? 'position' : 'positions';
  if (index === 0) {
    return `${c.emoji} **[${c.name}](${c.career_url})** (${totalJobs} ${jobText})`;
  } else {
    return `${c.emoji} **[${c.name}](${c.career_url})** (${totalJobs})`;
  }
}).join(" • ") || "No companies available"}


#### ☁️ **Enterprise & Cloud** (${(() => {
  const count = [...(companies?.enterprise_saas || []), ...(companies?.top_tech || [])].filter(c => currentJobs.filter(job => job.employer_name === c.name).length > 0).length || 0;
  return `${count} ${count === 1 ? 'company' : 'companies'}`;
})()})
${[...(companies?.enterprise_saas || []), ...(companies?.top_tech || [])].filter(c => currentJobs.filter(job => job.employer_name === c.name).length > 0).map((c, index) => {
  const totalJobs = currentJobs.filter(job => job.employer_name === c.name).length;
  const jobText = totalJobs === 1 ? 'position' : 'positions';
  if (index === 0) {
    return `${c.emoji} **[${c.name}](${c.career_url})** (${totalJobs} ${jobText})`;
  } else {
    return `${c.emoji} **[${c.name}](${c.career_url})** (${totalJobs})`;
  }
}).join(" • ") || "No companies available"}

---
### 📈 **Opportunity Type Breakdown**

| Level               | Count | Percentage | Description                     |
|---------------------|-------|------------|-----------------------------------|
| 🟢 Internships & Co-ops | ${stats?.byLevel["Entry-Level"] || 0} | ${
    stats
      ? Math.round((stats.byLevel["Entry-Level"] / currentJobs.length) * 100)
      : 0
  }% | Summer/Fall programs for students |
| 🟡 New Grad Roles | ${stats?.byLevel["Mid-Level"] || 0} | ${
    stats
      ? Math.round((stats.byLevel["Mid-Level"] / currentJobs.length) * 100)
      : 0
  }% | 0-1 years of experience |
| 🔴 Early Career         | ${stats?.byLevel["Senior"] || 0} | ${
    stats ? Math.round((stats.byLevel["Senior"] / currentJobs.length) * 100) : 0
  }% | 1-2 years of experience |

---

### 🌍 **Top Locations**
${
  stats
    ? Object.entries(stats.byLocation)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([location, count]) => `- **${location}**: ${count} opportunities`)
        .join("\n")
    : ""
}

---

## 🔮 **Why Students & New Grads Choose Our Platform**

✅ **100% Real Opportunities:** ${
    currentJobs.length
  }+ verified internships and new grad roles from ${totalCompanies} top companies.

✅ **Fresh Daily Updates:** Live data from Google, Amazon, Meta, and more refreshed every 24 hours automatically.

✅ **Student-Focused:** Smart filtering for CS students, bootcamp grads, and recent graduates.

✅ **Intern-to-FTE Pipeline:** Track companies with strong conversion rates from internship to full-time.

✅ **Direct Applications:** Skip recruiters—apply straight to company career pages for faster response times.

✅ **Mobile-Optimized:** Perfect mobile experience for job hunting between classes or on campus.

---

## 🚀 **Application Tips for Students & New Grads**

### 🔍 **Research Before Applying**

- **Find the hiring manager:** Search "[Company] [Team] engineering manager" or "[Company] internship recruiter" on LinkedIn.
- **Check program details:** Look for program length, start dates, return offer rates, and housing stipends.
- **Verify eligibility:** Check for year requirements (rising junior, graduating senior, etc.) and visa sponsorship.
- [Use this 100% ATS-compliant and job-targeted resume template](https://docs.google.com/document/d/1EcP_vX-vTTblCe1hYSJn9apwrop0Df7h/export?format=docx).

### 📄 **Resume Best Practices for Students**

- **Lead with education:** GPA (if 3.0+), relevant coursework, CS projects, and hackathons.
- **Quantify projects:** "Built web app with 500+ users" > "Built a website."
- **Show technical skills:** List programming languages, frameworks, and tools you've actually used.
- [Read this informative guide on tweaking your resume for internships](https://drive.google.com/uc?export=download&id=1H6ljywqVnxONdYUD304V1QRayYxr0D1e).

### 🎯 **Interview Prep for New Grads**

- **Practice coding problems:** Use LeetCode, HackerRank, or similar platforms daily.
- **Prepare project stories:** Be ready to explain your GitHub repos and course projects in detail.
- **Ask smart questions:** "What does a typical day look like for interns?" or "How do you support new grads?"
- [Review this comprehensive interview guide on common questions for students](https://drive.google.com/uc?export=download&id=1MGRv7ANu9zEnnQJv4sstshsmc_Nj0Tl0).

---

## 📬 **Stay Updated**

- ⭐ **Star this repo** to bookmark and check daily for new opportunities.
- 👀 **Watch** to get notified when new internships and roles are posted.
- 📱 **Bookmark on your phone** for quick access during application season.
- 🤝 **Become a contributor** and help other students! Visit our CONTRIBUTING GUIDE [here](CONTRIBUTING-GUIDE.md).

---

${archivedJobs.length > 0 ? generateArchivedSection(archivedJobs, stats) : ""}


<div align="center">

**🎯 ${
    currentJobs.length
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
};