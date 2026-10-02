#!/usr/bin/env bash
# Makes sure the local MongoDB container is running (creates it if it is missing or broken).
# Data lives in the "evermind-mongo" Docker volume, so recreating the container keeps it.
set -u
NAME=evermind-mongo

if docker ps --format '{{.Names}}' | grep -qx "$NAME"; then
  echo "MongoDB is already running."
  exit 0
fi

if docker start "$NAME" >/dev/null 2>&1; then
  echo "Started existing MongoDB container."
else
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  docker run -d --name "$NAME" --restart unless-stopped -p 27017:27017 -v evermind-mongo:/data/db mongo:7 >/dev/null
  echo "Created a fresh MongoDB container (your data volume was kept)."
fi

for _ in $(seq 1 30); do
  docker exec "$NAME" mongosh --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1 && { echo "MongoDB is ready."; exit 0; }
  sleep 1
done
echo "MongoDB did not become ready in time." >&2
exit 1
