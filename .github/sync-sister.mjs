/**
 * sync-sister.mjs
 * Sister repo sync engine — compares shared files between this repo and the sister repo
 * 
 * Usage: node .github/sync-sister.mjs /path/to/sister-clone
 * 
 * Reads .github/sister-sync.json for sync rules
 * Copies "mirror" files directly, creates a diff report for "adapt" files
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';

const sisterDir = process.argv[2];
if (!sisterDir) {
  console.error('Usage: node sync-sister.mjs /path/to/sister-clone');
  process.exit(1);
}

// Load config
const configPath = '.github/sister-sync.json';
if (!existsSync(configPath)) {
  console.log('No sister-sync.json found. Nothing to sync.');
  process.exit(0);
}

const config = JSON.parse(readFileSync(configPath, 'utf-8'));
const sisterRepo = config.sister_repo;

console.log(`Sister repo: ${sisterRepo}`);
console.log(`Sister clone: ${sisterDir}`);
console.log('---');

let mirrorCount = 0;
let adaptCount = 0;
let issueCount = 0;
const issues = [];

// Process auto_sync rules
for (const rule of (config.sync_rules?.auto_sync || [])) {
  const localPath = rule.path;
  const sisterPath = rule.sister_path;
  const mode = rule.mode || 'mirror';

  const sisterFile = join(sisterDir, sisterPath);
  const localFile = join(process.cwd(), localPath);

  if (!existsSync(sisterFile)) {
    console.log(`SKIP: ${sisterPath} not found in sister repo`);
    continue;
  }

  const sisterContent = readFileSync(sisterFile, 'utf-8');
  const localContent = existsSync(localFile) ? readFileSync(localFile, 'utf-8') : null;

  if (sisterContent === localContent) {
    console.log(`SAME: ${localPath} (already in sync)`);
    continue;
  }

  if (mode === 'mirror') {
    // Direct copy
    mkdirSync(dirname(localFile), { recursive: true });
    writeFileSync(localFile, sisterContent);
    console.log(`MIRROR: ${localPath} ← ${sisterPath}`);
    mirrorCount++;
  } else if (mode === 'adapt') {
    // Write to a diff file for manual review
    const diffPath = `.github/sync-diffs/${basename(localPath)}.diff`;
    mkdirSync(dirname(diffPath), { recursive: true });
    
    let diff = `# Sync diff: ${sisterPath} → ${localPath}\n`;
    diff += `# Sister repo: ${sisterRepo}\n`;
    diff += `# Mode: adapt (needs manual review — domain-specific differences may exist)\n`;
    diff += `# Note: ${rule.note || ''}\n`;
    diff += `\n--- SISTER VERSION (${sisterPath}) ---\n`;
    diff += sisterContent;
    diff += `\n--- LOCAL VERSION (${localPath}) ---\n`;
    diff += localContent || '(file does not exist locally yet)';
    
    writeFileSync(diffPath, diff);
    console.log(`ADAPT: ${localPath} — diff written to ${diffPath}`);
    adaptCount++;
  }
}

// Process manual_adapt rules — create issue summaries
for (const rule of (config.sync_rules?.manual_adapt || [])) {
  const localPath = rule.path;
  const sisterPath = rule.sister_path;

  const sisterFile = join(sisterDir, sisterPath);
  const localFile = join(process.cwd(), localPath);

  if (!existsSync(sisterFile)) {
    console.log(`SKIP: ${sisterPath} not found in sister repo`);
    continue;
  }

  const sisterContent = readFileSync(sisterFile, 'utf-8');
  const localContent = existsSync(localFile) ? readFileSync(localFile, 'utf-8') : '';

  // Write a diff file for manual adaptation
  const diffPath = `.github/sync-diffs/${basename(localPath)}.diff`;
  mkdirSync(dirname(diffPath), { recursive: true });
  
  let diff = `# Manual adaptation needed: ${sisterPath} → ${localPath}\n`;
  diff += `# Sister repo: ${sisterRepo}\n`;
  diff += `# Note: ${rule.note || ''}\n`;
  diff += `\n--- SISTER VERSION (${sisterPath}) ---\n`;
  diff += sisterContent;
  diff += `\n--- LOCAL VERSION (${localPath}) ---\n`;
  diff += localContent || '(file does not exist locally yet)';
  
  writeFileSync(diffPath, diff);
  console.log(`MANUAL: ${localPath} — diff written to ${diffPath}`);
  issueCount++;
  issues.push({
    path: localPath,
    sisterPath: sisterPath,
    note: rule.note || '',
  });
}

// Write a sync report
const report = {
  timestamp: new Date().toISOString(),
  sisterRepo,
  mirrored: mirrorCount,
  adapted: adaptCount,
  manualAdapt: issueCount,
  issues,
};
writeFileSync('.github/sync-report.json', JSON.stringify(report, null, 2));

console.log('---');
console.log(`Done: ${mirrorCount} mirrored, ${adaptCount} needs review, ${issueCount} needs manual adaptation`);
