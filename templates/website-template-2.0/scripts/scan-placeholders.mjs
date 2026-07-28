import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const mode = process.argv.includes('--launch') ? 'launch' : 'template';
const tokenPattern = /\{\{[^}]+\}\}/g;

const ignoredDirs = new Set(['.git', '.wrangler', 'node_modules']);
const launchAllowedFiles = new Set([
  'client.fulfillment.schema.json',
  'tracking.manifest.json',
  'docs/manus-fulfillment-skills.md',
  'verification.checklist.md',
  'README.md'
]);

const launchAllowedPatterns = [
  /^\.cursor\//,
  /^docs\//,
  /^client\.fulfillment\.schema\.json$/,
  /^tracking\.manifest\.json$/,
  /^verification\.checklist\.md$/,
  /^README\.md$/
];

function isTextFile(file) {
  return /\.(html|js|css|md|toml|json|sql|txt|yml|yaml)$/i.test(file);
}

function shouldSkip(relPath) {
  if (mode !== 'launch') return false;
  if (launchAllowedFiles.has(relPath)) return true;
  return launchAllowedPatterns.some((pattern) => pattern.test(relPath));
}

function walk(dir, hits) {
  for (const name of readdirSync(dir)) {
    if (ignoredDirs.has(name)) continue;
    const file = join(dir, name);
    const relPath = relative(root, file);
    if (statSync(file).isDirectory()) {
      walk(file, hits);
      continue;
    }
    if (!isTextFile(file) || shouldSkip(relPath)) continue;

    const text = readFileSync(file, 'utf8');
    const matches = text.match(tokenPattern) || [];
    for (const token of matches) hits.push({ file: relPath, token });
  }
}

/* ---- Structural checks -------------------------------------------------- */
/* These run before the token scan and catch missing files / missing pixel
   injection that would cause silent tracking failures in production.        */
const structuralErrors = [];

// 1. client.config.js must exist in the dist root.
//    It is loaded as <script src="/client.config.js"> in every HTML page.
//    If it is missing, window.CLIENT_CONFIG is undefined and ALL tracking
//    (pixel, GA4, Clarity, GHL external) silently fails.
if (!existsSync(join(root, 'client.config.js'))) {
  structuralErrors.push(
    'MISSING client.config.js — copy clients/<name>/client.config.js into dist/ before deploying. ' +
    'Without it, window.CLIENT_CONFIG is undefined and all tracking is dead.'
  );
}

// 2. Every HTML page that loads tracking.js must also have the Meta pixel
//    injected directly (fbevents.js). If it is missing, build-config.mjs
//    pixel injection was skipped — most likely because META_PIXEL_ID was
//    empty or not yet hydrated.
function collectHtml(dir, out) {
  for (const name of readdirSync(dir)) {
    if (ignoredDirs.has(name)) continue;
    const file = join(dir, name);
    if (statSync(file).isDirectory()) { collectHtml(file, out); continue; }
    if (/\.html$/i.test(name)) out.push(file);
  }
}
const htmlFiles = [];
collectHtml(root, htmlFiles);
for (const f of htmlFiles) {
  const text = readFileSync(f, 'utf8');
  if (text.includes('tracking.js') && !text.includes('fbevents.js')) {
    structuralErrors.push(
      'MISSING PIXEL in ' + relative(root, f) + ' — ' +
      'tracking.js is loaded but fbevents.js pixel is not injected. ' +
      'Ensure META_PIXEL_ID is set in client.config.js and re-run build-config.mjs.'
    );
  }
}

if (structuralErrors.length) {
  console.error('Structural build errors (FAIL):');
  for (const e of structuralErrors) console.error('  ✘ ' + e);
  process.exit(1);
}

/* ---- Token scan --------------------------------------------------------- */
const hits = [];
walk(root, hits);

if (hits.length) {
  console.error('Unresolved template placeholders found:');
  for (const hit of hits.slice(0, 200)) {
    console.error('- ' + hit.file + ': ' + hit.token);
  }
  if (hits.length > 200) console.error('...and ' + (hits.length - 200) + ' more.');
  process.exit(1);
}

console.log(mode === 'launch'
  ? 'Launch placeholder scan passed.'
  : 'Template placeholder scan passed.');
