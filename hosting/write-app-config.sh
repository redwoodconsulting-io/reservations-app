#!/bin/bash

jq 'with_entries((.value | select(startswith("$"))) |= env[.[1:]])' \
  < src/app/reservations-app.config.json.template \
  > src/app/reservations-app.config.json
