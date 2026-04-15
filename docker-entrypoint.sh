#!/bin/sh
set -eu

run_migrations="${RUN_MIGRATIONS_ON_STARTUP:-}"

if [ -z "$run_migrations" ]; then
  if [ "${NODE_ENV:-development}" = "production" ]; then
    run_migrations="true"
  else
    run_migrations="false"
  fi
fi

if [ "$run_migrations" = "true" ]; then
  echo "[entrypoint] Running Prisma migrations before application startup."
  npx prisma migrate deploy --config prisma.config.ts
fi

if [ "$#" -gt 0 ]; then
  case "$*" in
    *"prisma migrate deploy"*)
      if [ "$run_migrations" != "true" ]; then
        echo "[entrypoint] Ignoring startup command that runs Prisma migrations. Set RUN_MIGRATIONS_ON_STARTUP=true to allow this." >&2
        exec node dist/src/main.js
      fi
      ;;
  esac

  exec "$@"
fi

exec node dist/src/main.js