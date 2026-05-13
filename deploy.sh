#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v firebase >/dev/null 2>&1; then
  echo "Firebase CLI not found. Install it with: npm install -g firebase-tools"
  exit 1
fi

echo "Deploying Firebase Hosting..."
firebase deploy --only hosting

echo "Hosting deployed."

if command -v gcloud >/dev/null 2>&1; then
  echo "gcloud found. Deploying Functions via gcloud to ensure unauthenticated access..."

  if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" >/dev/null 2>&1; then
    echo "No active gcloud account found. Run 'gcloud auth login' and rerun this script."
    exit 1
  fi

  if [ ! -f "functions/.env" ]; then
    echo "functions/.env not found. Create it with LLM_API_KEY, LLM_API_URL, and LLM_MODEL."
    exit 1
  fi

  env_string=""
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%%#*}"
    line="$(echo "$line" | tr -d '\r')"
    [ -z "$line" ] && continue
    key="${line%%=*}"
    value="${line#*=}"
    value="${value%\"}"
    value="${value#\"}"
    if [ -n "$env_string" ]; then
      env_string="$env_string,$key=$value"
    else
      env_string="$key=$value"
    fi
  done < "functions/.env"

  gcloud config set project ai-starter-gcp >/dev/null
  gcloud functions deploy api \
    --region=us-central1 \
    --runtime=nodejs20 \
    --trigger-http \
    --entry-point=api \
    --allow-unauthenticated \
    --source=functions \
    --set-env-vars="$env_string"

  echo "Functions deployed via gcloud."
else
  echo "gcloud not found; only Hosting was deployed. Install gcloud to deploy Functions with public access."
fi

echo "Deployment complete."
