// Builds a single, self-contained HTML file of the app (all JS, fonts, images
// and sounds inlined) so it can be hosted anywhere as one shareable link.
//
//   npx expo export --platform web && node scripts/build-web-preview.js
//
// Output: web-preview/out-in-athens.html
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const src = html.match(/<script src="([^"]+)"/)[1];
let js = fs.readFileSync(path.join(dist, src), 'utf8');

const MIME = { '.ttf': 'font/ttf', '.png': 'image/png', '.wav': 'audio/wav', '.jpg': 'image/jpeg' };
let inlined = 0;
js = js.replace(/"(\/assets\/[^"]+)"/g, (m, url) => {
  const file = path.join(dist, decodeURIComponent(url));
  if (!fs.existsSync(file)) return m;
  // expo-router's own debug-screen icons are never shown in the app; skip them to save space.
  if (url.includes('/expo-router/assets/')) return m;
  inlined++;
  const mime = MIME[path.extname(file)] || 'application/octet-stream';
  return JSON.stringify(`data:${mime};base64,${fs.readFileSync(file).toString('base64')}`);
});
js = js.replace(/<\/script/gi, '<\\/script');

const page = `<title>Out in Athens</title>
<meta name="theme-color" content="#A63A2B">
<style>
  :root { --bg: #F3ECDD; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #1C1A17; color-scheme: dark } }
  :root[data-theme="dark"] { --bg: #1C1A17; color-scheme: dark }
  html { height: 100%; box-sizing: border-box; }
  body { height: 100%; margin: 0; overflow: hidden; background: var(--bg); }
  #root { display: flex; height: 100%; flex: 1; }
</style>
<div id="root"></div>
<script>
  // Hosted previews run in a sandboxed frame that refuses URL changes. The app keeps its
  // own navigation state, so history writes are optional: ignore them when refused.
  ['pushState', 'replaceState'].forEach(function (k) {
    var orig = history[k];
    history[k] = function () { try { return orig.apply(history, arguments); } catch (e) {} };
  });
</script>
<script>${js}</script>
`;

const outDir = path.join(root, 'web-preview');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'out-in-athens.html');
fs.writeFileSync(out, page);
console.log(`Inlined ${inlined} assets → ${path.relative(root, out)} (${(page.length / 1024 / 1024).toFixed(2)} MB)`);
