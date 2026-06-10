// BUG-111: Build script — concatenates all BWTL JSX sources in load order,
// transpiles via Babel (preset-react only), writes dist/bundle.js.
// Supports BWTL_SRC and BWTL_DIST env vars so the build can run from a
// node_modules-friendly temp directory (e.g. on C: when src is on Google Drive).
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const SRC = process.env.BWTL_SRC || path.join(__dirname, 'src');
const DIST = process.env.BWTL_DIST || path.join(__dirname, 'dist');

// Exact load order from index.html <script type="text/babel"> tags
const SOURCE_ORDER = [
  'icons.jsx',
  'bwtl-api.js',
  'etymology.jsx',
  'tweaks-panel.jsx',
  'panels.jsx',
  'chat.jsx',
  'workspace.jsx',
  'study-extra.jsx',
  'library.jsx',
  'generate.jsx',
  'theodoros.jsx',
  'bookmarks.jsx',
  'admin.jsx',
  'spec.jsx',
  'tweaks.jsx',
  'app.jsx',
];

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST);

let combined = '';
for (const file of SOURCE_ORDER) {
  const content = fs.readFileSync(path.join(SRC, file), 'utf8');
  combined += `\n// ─── ${file} ───\n${content}\n`;
}

const result = babel.transformSync(combined, {
  presets: [['@babel/preset-react', { runtime: 'classic' }]],
  filename: 'bundle.jsx',
  sourceType: 'script',
});

fs.writeFileSync(path.join(DIST, 'bundle.js'), result.code, 'utf8');
console.log(`Built dist/bundle.js (${(result.code.length / 1024).toFixed(1)} KB)`);
