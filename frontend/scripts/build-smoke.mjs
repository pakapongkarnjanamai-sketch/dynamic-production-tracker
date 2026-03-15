import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const distPath = path.join(projectRoot, 'dist');
const indexPath = path.join(distPath, 'index.html');

function fail(message) {
  console.error(`[smoke] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(distPath)) {
  fail('dist directory was not created');
}

if (!fs.existsSync(indexPath)) {
  fail('dist/index.html was not created');
}

const html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('id="root"')) {
  fail('dist/index.html does not contain root mount element');
}

if (!html.includes('/assets/') && !html.includes('assets/')) {
  fail('dist/index.html does not reference bundled assets');
}

if (!fs.existsSync(path.join(distPath, 'favicon.svg'))) {
  fail('dist/favicon.svg is missing');
}

console.log('[smoke] Frontend build smoke test passed');
