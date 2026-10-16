# Cloudflare Worker deployment

- Worker: `canteen-erp`
- Account: `24c4150cdb7fbf610c665e53aeb19135` (`gokul.fameix@gmail.com`)
- URL: https://canteen-erp.gokul-fameix.workers.dev
- Configuration: `wrangler.jsonc`
- Deployment version: `336c5b9a-64d8-4945-9a03-da10b6e3471c`

## Architecture

Next.js static export (`output: "export"`) produces `out/`. Cloudflare Workers Static Assets serves this build. No SSR adapter is needed. Existing `public/_redirects` rewrites preserve dynamic bill-detail and menu-edit URLs.

This checkout contains no Firebase integration, environment-variable references, API routes, or server actions. Authentication and records use browser localStorage. No environment variables are required; keep dashboard variables with `keep_vars`. Do not put credentials in this file or Wrangler config. Data remains browser- and origin-specific.

## Update this Worker only

```powershell
pnpm exec tsc --noEmit --incremental false
pnpm test
pnpm build
npx wrangler deploy --config wrangler.jsonc --dry-run
npx wrangler deploy --config wrangler.jsonc --keep-vars
```

Confirm Wrangler is signed into the account above before deploying. Do not create a new project.

## Verified

Production build and TypeScript check passed; all 13 tests passed. Live root, billing, login, menu, bills, bill-detail, and menu-edit routes returned successfully. All 98 mapped menu images and 15 billing JS/CSS/font assets matched build bytes. Browser interaction was not automated.
