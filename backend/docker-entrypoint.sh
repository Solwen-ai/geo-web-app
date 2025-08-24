#!/bin/bash
# Start virtual X server in background
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
sleep 2

# Run the container command (default: npm run start)
exec "$@"
