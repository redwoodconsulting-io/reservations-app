#!/bin/bash

jq -n \
  --arg FIREBASE_PROJECT_ID "$FIREBASE_PROJECT_ID" \
  -f .firebaserc.jq \
  > .firebaserc
