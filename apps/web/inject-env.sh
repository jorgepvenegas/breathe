#!/bin/sh
set -e

API_URL="${VITE_API_URL:-http://localhost:3001}"
echo "[inject-env] VITE_API_URL from environment: $API_URL"

if [ ! -f "dist/index.html" ]; then
  echo "[inject-env] ERROR: dist/index.html not found"
  ls -la
  exit 1
fi

echo "[inject-env] Injecting window.__ENV__ into dist/index.html..."

node -e "
  const fs = require('fs');
  const html = fs.readFileSync('dist/index.html', 'utf8');
  const script = \"<script>window.__ENV__={VITE_API_URL:'$API_URL'}</script>\";
  if (!html.includes('</head>')) {
    console.error('[inject-env] ERROR: </head> not found in dist/index.html');
    process.exit(1);
  }
  const newHtml = html.replace('</head>', script + '</head>');
  fs.writeFileSync('dist/index.html', newHtml);
  console.log('[inject-env] Injection successful');
"

echo "[inject-env] Starting serve on port ${PORT:-3000}..."
npx serve dist -s -l "${PORT:-3000}"
