#!/bin/bash
set -x

cp /app/env.test.sh /app/env.sh
. ./env.sh
env

exec node /app/lib/standalone/start-server.js

set +x
