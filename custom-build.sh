#!/bin/bash

rm -rf dist

python build/gendeps.py
python build/build.py +@complete \
  -@hls -@ui -@cast -@offline \
  -lib/polyfill/patchedmediakeys_apple.js \
  -lib/polyfill/indexed_db.js \
  -lib/polyfill/fullscreen.js \
  -lib/polyfill/pip_webkit.js  \
  --force --name compiled

node_modules/.bin/ncat \
  node_modules/mp4box/dist/mp4box.all.min.js \
  dist/shaka-player.compiled.js \
  -m true \
  -o dist/shaka-player.compiled.js

python build/build.py +@complete \
  -@hls -@ui -@cast -@offline \
  -lib/polyfill/patchedmediakeys_apple.js \
  -lib/polyfill/indexed_db.js \
  -lib/polyfill/fullscreen.js \
  -lib/polyfill/pip_webkit.js  \
  --force --name compiled --debug

node_modules/.bin/ncat \
  node_modules/mp4box/dist/mp4box.all.js \
  dist/shaka-player.compiled.debug.js \
  -m true \
  -o dist/shaka-player.compiled.debug.js