# KAIEDU Renewal

Separate renewal candidate for Korea AI Education Center.

This project starts from the current live Hono / Cloudflare Pages app and is intended to receive the selected Stitch redesign screens without losing the existing backend flows.

## Local Development

```txt
npm install
npm run dev
```

## Build

```txt
npm run build
```

## Deploy

```txt
npm run deploy
```

Before deploying, confirm the Cloudflare Pages project name and D1 database binding in `wrangler.jsonc`. The project name has been changed to `kaiedu-renewal`, but the database binding still points to the copied source configuration.

## Migration

See `MIGRATION_PLAN.md` for the recommended route-by-route redesign plan.
