# AI Starter GCP

A minimal reusable AI app template for Google Cloud with pay-per-invocation serverless infrastructure.

## What this template includes

- `Firebase Hosting` for static frontend
- `Cloud Run` for backend API and streaming responses
- External LLM provider adapter for on-demand inference
- Reusable app skeleton for future AI MVPs

## Deploy

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Login and initialize your Firebase project:
   ```bash
   firebase login
   firebase use --add
   ```
3. Set your LLM provider config in `functions/.env`:
   ```bash
   LLM_API_KEY="YOUR_OPENAI_API_KEY"
   LLM_API_URL="https://api.openai.com/v1/chat/completions"
   LLM_MODEL="gpt-4o-mini"
   ```
   (Note: The .env file is already configured with your OpenAI API key)
4. Authenticate gcloud and deploy the frontend and backend to Cloud Run for streaming support:
   ```bash
   gcloud auth login
   ./deploy.sh
   ```

## How it works

- Frontend sends a prompt to `/generate`
- Cloud Run streams the OpenAI response back to the browser
- Backend returns incremental text chunks so users see results immediately

## Customize for future projects

- change prompt copy in `public/index.html`
- adapt backend logic in `functions/index.js`
- swap AI provider by updating `ai.url`, `ai.key`, and `ai.model`
- keep UI generic and use the same structure for new use cases
