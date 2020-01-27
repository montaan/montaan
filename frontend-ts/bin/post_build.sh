#!/bin/bash

cat build/static/css/{2,main}*.css > build/static/css/bundle.css &&
SHACSSFN=$(shasum -a 256 build/static/css/bundle.css | awk '{print $1}') &&
SHACSS=$(echo $SHACSSFN | xxd -r -p | base64) &&
mv build/static/css/bundle.css build/static/css/$SHACSSFN.css &&

cat build/static/js/{run,2,main}*.js > build/static/js/bundle.js &&
SHAJSFN=$(shasum -a 256 build/static/js/bundle.js | awk '{print $1}') &&
SHAJS=$(echo $SHAJSFN | xxd -r -p | base64) &&
mv build/static/js/bundle.js build/static/js/$SHAJSFN.js &&

SHAWORKER=$(shasum -a 256 build/service-worker.js | awk '{print $1}' | xxd -r -p | base64) &&

sed \
    -e "s|<head>|<head><meta http-equiv=\"Content-Security-Policy\" content=\"base-uri 'none'; object-src 'none'; script-src 'self'; worker-src 'self'; style-src 'unsafe-inline' 'self'\">|" \
    -e "s|<link href.*=\"stylesheet\">|<link href=\"/static/css/$SHACSSFN.css\" integrity=\"sha256-$SHACSS\" rel=\"stylesheet\">|" \
    -e "s|<script>.*</script>|<script src=\"/static/js/$SHAJSFN.js\" integrity=\"sha256-$SHAJS\"></script>|" \
    build/index.html > build/index-csp.html &&
mv build/index-csp.html build/index.html
