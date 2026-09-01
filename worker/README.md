# Engagement RSVP Worker

This Worker accepts the invitation's bilingual RSVP form and appends each response to the private `RSVP Responses` tab in the existing Google Sheet.

## Private configuration

The repository-root `.env` file must contain the complete downloaded Google service-account JSON as one single-quoted value named `SERVICE_ACCOUNT_KEY`. The `.env` file is ignored by Git.

The spreadsheet must be shared as **Editor** with the `client_email` from that JSON file. No Google Cloud project role is required; access to this individual spreadsheet is granted through its Share dialog.

## Deploy

From the repository root:

```sh
set -a
source .env
set +a
npx wrangler deploy --config worker/wrangler.jsonc
printf '%s' "$SERVICE_ACCOUNT_KEY" | npx wrangler secret put SERVICE_ACCOUNT_KEY --config worker/wrangler.jsonc
```

`CLOUDFLARE_API_TOKEN` is used only by Wrangler and must not be uploaded as a Worker secret. The public RSVP route is configured in `assets/js/rsvp-config.js`.

Changes under `worker/` are also deployed from `main` by `.github/workflows/worker.yml`. That workflow reads `CLOUDFLARE_API_TOKEN` from the GitHub repository's Actions secrets; the Google key remains stored directly in Cloudflare and is preserved across code deployments.

## Endpoints

- `GET /health` returns a public health response without accessing Google.
- `POST /rsvp` accepts the invitation form from the configured GitHub Pages origin.

The Worker creates the `RSVP Responses` tab and its headers on the first accepted submission if they do not already exist.
