#!/bin/sh
# Dynamic entrypoint — reads APP_NAME from environment
APP=${APP_NAME:-api}
echo "Starting app: $APP"

# API uses flat path, others use nested path from monorepo tsconfig
if [ "$APP" = "api" ]; then
  exec node "dist/apps/api/main.js"
else
  exec node "dist/apps/$APP/apps/$APP/src/main.js"
fi
