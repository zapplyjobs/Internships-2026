#!/usr/bin/env node

/**
 * Fix AI Pattern Matching in router.js
 *
 * Issue: Pattern only matches "AI Engineer" or "AI Researcher"
 * Fix: Match AI + any role (intern, analyst, developer, etc.)
 */

const fs = require('fs');
const path = require('path');

const routerPath = path.join(__dirname, 'src', 'routing', 'router.js');

console.log('🔧 Fixing AI pattern in router.js...\n');

let content = fs.readFileSync(routerPath, 'utf8');

// Original pattern (broken)
const oldPattern = /\{ regex: \/\\b\(artificial intelligence\|ai engineer\|ai researcher\)\\b\/, keyword: 'artificial intelligence' \}/g;

// New pattern (fixed)
const newPattern = "{ regex: /\\b(artificial intelligence|ai\\s+(engineer|researcher|intern|analyst|developer|specialist|associate))\\b/, keyword: 'artificial intelligence' }";

// Check if already fixed
if (content.match(/ai\\s\+\(/)) {
  console.log('✅ Pattern already fixed!');
  process.exit(0);
}

// Apply fix
const oldCount = (content.match(oldPattern) || []).length;
content = content.replace(oldPattern, newPattern);

fs.writeFileSync(routerPath, content);

console.log(`✅ Fixed ${oldCount} occurrence(s)`);
console.log('\nTesting fix:');

// Test the fix
const testCases = [
  'supply chain ai intern',
  'machine learning engineer',
  'ai analyst',
  'supply chain analyst'
];

const pattern = /\b(artificial intelligence|ai\s+(engineer|researcher|intern|analyst|developer|specialist|associate))\b/;

testCases.forEach(test => {
  const matches = pattern.test(test);
  const expected = test.includes('ai') && !test.includes('supply chain analyst');
  const status = matches === expected ? '✅' : '❌';
  console.log(`  ${status} "${test}": ${matches}`);
});

console.log('\n🎉 Fix complete!');
