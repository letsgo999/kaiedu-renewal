# Cloudflare Pages Deployment

This project is a Hono server app built for Cloudflare Pages. It is not a plain static HTML site, so the repository root will not contain an `index.html` file. The HTML is rendered by the worker generated during the build.

## Required Build Settings

When connecting this repository in Cloudflare Pages, use:

| Setting | Value |
| --- | --- |
| Framework preset | None / Custom |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | leave blank |
| Node.js version | `22.16.0` |

The build command is required. If it is left blank, Cloudflare skips the build step and fails with:

```txt
No build command specified. Skipping build step.
Error: Output directory "dist" not found.
```

## Expected Build Output

After a successful build, Cloudflare uploads files from `dist`, including:

```txt
dist/_worker.js
dist/_routes.json
dist/static/
```

## Runtime Notes

- `wrangler.jsonc` currently defines the Pages project name as `kaiedu-renewal`.
- The D1 binding still points to the copied source database configuration. Change it before production-style testing if you want a separate renewal database.
- Claude-powered consultation requires the relevant API key/environment variables to be configured in Cloudflare before that feature can work fully.
