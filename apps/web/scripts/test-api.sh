#!/usr/bin/env bash
# Runs the API test suite against the Firestore emulator (a throw-away database) and a fake Claude.
#   npm test
# Needs Java (for the emulator) and ports 3200 / 8085 / 9999 free.
set -u
cd "$(dirname "$0")/.."

PORT=3200
DB_PORT=8085
OUTBOX="$(mktemp -d)"
LOG="$(mktemp)"
DB_LOG="$(mktemp)"
export FIRESTORE_EMULATOR_HOST="127.0.0.1:$DB_PORT"
export GCLOUD_PROJECT="demo-evermind-test"
# Never let the tests reach the real project, whatever .env.local says (Next.js doesn't override variables that are set).
export FIREBASE_PROJECT_ID="$GCLOUD_PROJECT" FIREBASE_PRIVATE_KEY="" FIREBASE_CLIENT_EMAIL="" FIRESTORE_DATABASE_ID=""

# A leftover server on these ports would silently answer instead of the one we start.
for p in $PORT $DB_PORT 9999; do
  if (echo >"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then
    echo "Port $p is already in use. Stop whatever is using it and run the tests again."
    exit 1
  fi
done

# Job control puts each background job in its own process group, so cleanup can stop the whole tree.
set -m

npx firebase emulators:start --only firestore --project "$GCLOUD_PROJECT" --config firebase.test.json >"$DB_LOG" 2>&1 &
DB=$!

node tests/mock-claude.mjs >/dev/null 2>&1 &
MOCK=$!

AUTH_SECRET="test-secret-test-secret-test-secret-123" \
ANTHROPIC_API_KEY=sk-test ANTHROPIC_BASE_URL=http://localhost:9999 \
FREE_MONTHLY_TOKENS=1000000 FREE_SEATS=3 LEARNING_SCHEDULER=off SIGNUP_LIMIT_PER_HOUR=1000 \
MAIL_OUTBOX_DIR="$OUTBOX" APP_URL="http://localhost:$PORT" \
RAZORPAY_KEY_ID=rzp_test RAZORPAY_KEY_SECRET=secret RAZORPAY_WEBHOOK_SECRET=whsec-test \
RAZORPAY_API_URL=http://localhost:9999/v1 RAZORPAY_PLAN_PRO_MONTHLY=plan_pro_m RAZORPAY_PLAN_PRO_YEARLY=plan_pro_y \
RAZORPAY_PLAN_BUSINESS_MONTHLY=plan_biz_m RAZORPAY_PLAN_BUSINESS_YEARLY=plan_biz_y \
NEXT_DIST_DIR=.next-test npx next dev -p $PORT >"$LOG" 2>&1 &
APP=$!

cleanup() {
  kill -- -"$MOCK" -"$APP" -"$DB" 2>/dev/null
  kill "$MOCK" "$APP" "$DB" 2>/dev/null
}
trap cleanup EXIT

for _ in $(seq 1 60); do
  curl -s -o /dev/null "http://127.0.0.1:$DB_PORT" && break
  sleep 1
done
curl -s -o /dev/null "http://127.0.0.1:$DB_PORT" || { echo "The Firestore emulator did not start. Log:"; tail -20 "$DB_LOG"; exit 1; }

for _ in $(seq 1 90); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' localhost:$PORT/api/health)" = "200" ] && break
  sleep 1
done
curl -s localhost:$PORT/api/health | grep -q '"ok":true' || { echo "App did not start. Log:"; tail -20 "$LOG"; exit 1; }

BASE_URL="http://localhost:$PORT" MAIL_OUTBOX_DIR="$OUTBOX" RAZORPAY_WEBHOOK_SECRET=whsec-test MOCK_URL=http://localhost:9999 node --test --test-concurrency=1 tests/*.test.mjs
