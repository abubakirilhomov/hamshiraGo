#!/bin/sh
# Dynamic entrypoint — reads APP_NAME from environment
APP=${APP_NAME:-api}
echo "Starting app: $APP"
exec node "dist/apps/$APP/apps/$APP/src/main.js"
