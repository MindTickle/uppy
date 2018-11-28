#!/bin/bash
set -x
export NODE_ENV="dev"
export COMPANION_PORT=80
export COMPANION_DOMAIN="localhost:80"
export COMPANION_SELF_ENDPOINT="localhost:80"

export COMPANION_PROTOCOL="http"
export COMPANION_DATADIR="/tmp/uppy"
export COMPANION_SECRET="secret"

export COMPANION_DROPBOX_KEY="dropbox_key"
export COMPANION_DROPBOX_SECRET="dropbox_secret"

export COMPANION_GOOGLE_KEY="google_key"
export COMPANION_GOOGLE_SECRET="google_secret"

export COMPANION_INSTAGRAM_KEY="instagram_key"
export COMPANION_INSTAGRAM_SECRET="instagram_secret"
env

exec node /app/lib/standalone/start-server.js

set +x
