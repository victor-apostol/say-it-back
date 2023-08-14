#!/bin/sh

if [ -d "/app/migrations" ]; then
  npm run migration:generate -- migrations/first
  npm run migration:run
fi

npm run start:dev

