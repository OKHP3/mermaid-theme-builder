# Deployment — Mermaid Theme Builder

**Project:** Mermaid Theme Builder  
**Owner:** OverKill Hill P³ / Jamie Hill  
**Architecture:** Fully static — no backend, no server-side logic

---

## Architecture overview

Mermaid Theme Builder is a fully static single-page application built with React + Vite. All logic runs in the browser. There is no backend, no API, no database, and no server-side rendering.

The application can be deployed to any static hosting service that supports:
- Single-page app (SPA) routing with a fallback to `index.html`
- HTTPS (required for clipboard API functionality)

---

## Build

```bash
# From repo root
pnpm --filter @workspace/mermaid-theme-builder run build
```

Output is emitted to `artifacts/mermaid-theme-builder/dist/`.

The build is fully static — no environment variables, no secrets, no runtime configuration.

---

## Deployment targets

### Replit Deployments (current)

The app is deployed via Replit's static deployment system. The build command runs `vite build` and the output is served from the `dist/` directory.

No additional configuration is required.

### Manual / self-hosted

1. Run `pnpm build` to generate `dist/`
2. Upload the contents of `dist/` to your hosting provider
3. Configure your server to serve `index.html` for all paths (SPA fallback)

Example nginx config:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### GitHub Pages

If deploying via GitHub Actions:

```yaml
- name: Build
  run: pnpm --filter @workspace/mermaid-theme-builder run build

- name: Deploy
  uses: peaceiris/actions-gh-pages@v4
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: artifacts/mermaid-theme-builder/dist
```

Note: Configure `base` in `vite.config.ts` if deploying to a subpath.

---

## Mermaid dependency

Mermaid.js is bundled into the app at build time via npm. It is **not** loaded from a CDN at runtime. This means:

- No external network requests at runtime (beyond CDN font loads, if any)
- The app works fully offline after initial load
- Mermaid version is locked by the `pnpm-lock.yaml` lockfile

---

## Version governance

Before any deployment:

1. Confirm `mermaid` version in `package.json` is the intended version
2. Confirm `src/data/mermaid-capabilities.ts` `MERMAID_VERSION_VERIFIED` matches the installed Mermaid version
3. Review the `RELEASE_CHECKLIST.md` and ensure all items pass

---

## No secrets required

This app has no environment secrets, API keys, or runtime configuration. The build is fully deterministic and reproducible.

---

## Performance notes

- The Mermaid.js bundle is large (~1–2 MB uncompressed). Gzip/Brotli compression is strongly recommended on the hosting layer.
- Vite's default chunking handles code splitting automatically.
- No CDN or caching configuration is required beyond standard static asset cache headers.

---

## Health check

After deployment, verify:

1. The app loads at the root URL
2. The default flowchart example renders in the preview pane
3. Applying a theme and copying "Styled Code" produces valid Mermaid with a `%%{init}%%` block
4. The "Themed" preview shows the applied theme
5. No console errors on load

---

## Rollback

The app is versioned via git tags. To roll back, redeploy from the previous tagged commit.

```bash
git checkout v0.1.0
pnpm --filter @workspace/mermaid-theme-builder run build
# redeploy dist/
```
