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

#python build/build.py +@complete \
#  -@hls -@ui -@cast -@offline \
#  -lib/polyfill/patchedmediakeys_apple.js \
#  -lib/polyfill/indexed_db.js \
#  -lib/polyfill/fullscreen.js \
#  -lib/polyfill/pip_webkit.js  \
#  --force --name compiled --debug
