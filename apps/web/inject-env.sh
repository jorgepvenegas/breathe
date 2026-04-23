#!/bin/sh
# Inject runtime environment variables into the built index.html
# This allows VITE_API_URL to be set at runtime rather than build time

API_URL="${VITE_API_URL:-http://localhost:3001}"

# Inject a script tag into index.html that sets window.__ENV__
sed -i "s|</head>|<script>window.__ENV__={VITE_API_URL:'$API_URL'}</script></head>|" dist/index.html

# Start the server
npx serve dist -s -l "${PORT:-3000}"
