#!/bin/bash
set -x

env \
NODE_ENV="$TRACK" \
COMPANION_PORT=80 \
COMPANION_DOMAIN="uploadermt.macho.mindtickle.com" \
COMPANION_SELF_ENDPOINT="uploadermt.macho.mindtickle.com" \
COMPANION_PROTOCOL="https" \
COMPANION_DATADIR="/tmp/uppy" \
COMPANION_SECRET="secret" \
nodemon 

set +x
