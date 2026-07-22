#!/bin/sh
set -eu

PG_BIN="$(pg_config --bindir)"

mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA"

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  gosu postgres "$PG_BIN/initdb" -D "$PGDATA" --auth=trust
  printf "listen_addresses = '127.0.0.1'\n" >> "$PGDATA/postgresql.conf"
fi

gosu postgres "$PG_BIN/pg_ctl" -D "$PGDATA" -l /tmp/style-savant-postgres.log start

until pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; do
  sleep 1
done

createdb -h 127.0.0.1 -U postgres style_savant 2>/dev/null || true

cd /app/backend
npx drizzle-kit migrate

USER_COUNT="$(psql -h 127.0.0.1 -U postgres -d style_savant -tAc 'SELECT COUNT(*) FROM users' 2>/dev/null || printf '0')"
if [ "$USER_COUNT" = "0" ]; then
  npm run db:seed
fi

PORT="${BACKEND_PORT:-3001}" node dist/server.js &
BACKEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
  gosu postgres "$PG_BIN/pg_ctl" -D "$PGDATA" stop -m fast 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd /app/frontend
HOSTNAME=0.0.0.0 PORT="${PORT:-${WEB_PORT:-7860}}" npm start
