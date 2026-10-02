#!/usr/bin/env bash
# Runs the API test suite against a throw-away database and a fake Claude.
#   npm test
# Needs MongoDB (npm run db) and port 3200 / 9999 free.
set -u
cd "$(dirname "$0")/.."

PORT=3200
OUTBOX="$(mktemp -d)"
LOG="$(mktemp)"
export MONGODB_URI="mongodb://localhost:27017/evermind_test"

# A leftover server on these ports would silently answer instead of the one we start.
for p in $PORT 9999; do
  if (echo >"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then
    echo "Port $p is already in use. Stop whatever is using it and run the tests again."
    exit 1
  fi
done

bash scripts/ensure-db.sh >/dev/null || { echo "MongoDB is not available."; exit 1; }
docker exec evermind-mongo mongosh --quiet --eval 'db.getSiblingDB("evermind_test").dropDatabase()' >/dev/null 2>&1

setsid node tests/mock-claude.mjs >/dev/null 2>&1 &
MOCK=$!

AUTH_SECRET="test-secret-test-secret-test-secret-123" \
ANTHROPIC_API_KEY=sk-test ANTHROPIC_BASE_URL=http://localhost:9999 \
FREE_MONTHLY_TOKENS=1000000 FREE_SEATS=3 LEARNING_SCHEDULER=off SIGNUP_LIMIT_PER_HOUR=1000 \
MAIL_OUTBOX_DIR="$OUTBOX" APP_URL="http://localhost:$PORT" \
setsid npx next dev -p $PORT >"$LOG" 2>&1 &
APP=$!

cleanup() {
  # Each was started in its own process group (setsid), so this stops the whole tree.
  kill -- -"$MOCK" -"$APP" 2>/dev/null
  kill "$MOCK" "$APP" 2>/dev/null
  docker exec evermind-mongo mongosh --quiet --eval 'db.getSiblingDB("evermind_test").dropDatabase()' >/dev/null 2>&1
}
trap cleanup EXIT

for _ in $(seq 1 90); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' localhost:$PORT/api/health)" = "200" ] && break
  sleep 1
done
curl -s localhost:$PORT/api/health | grep -q '"ok":true' || { echo "App did not start. Log:"; tail -20 "$LOG"; exit 1; }

BASE_URL="http://localhost:$PORT" MAIL_OUTBOX_DIR="$OUTBOX" node --test --test-concurrency=1 tests/*.test.mjs
