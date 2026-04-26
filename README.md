# Mazuwo Wireless Website

Static Cloudflare Pages site for Mazuwo Wireless.

## What changed

- Modern responsive UI with stronger logo placement, cleaner navigation, clearer service cards and improved calls to action.
- Main customer journeys rebuilt: Home, Services, Coverage, FAQ, Contact, Application and Code of Conduct.
- Lucy, the local AI helper, now runs fully in the browser from `/assets/js/ai.js` and `/assets/data/mazuwo-ai-model.json`.
- No AI API endpoint, API key or serverless function is required.

## Run locally

Use any static server from the site root:

```bash
npx serve .
```

Or in VS Code, open this folder and use Live Server.

## Deploy

Cloudflare Pages can deploy this as a static site. Build command: leave empty. Output directory: `/`.
