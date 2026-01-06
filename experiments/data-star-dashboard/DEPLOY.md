
# Deploying PolyVis Reactor to Cloudflare Pages

This guide assumes you have the `wrangler` CLI installed (`bun add -g wrangler`) and are logged in.

## 1. Directory Structure
The deployment package is prepared in `dist/`.
- `dist/public/`: Static Assets (index.html, datastar.bundle.js)
- `dist/functions/`: Backend Logic (feed.js)

## 2. Deploy Command
Run the following command from the experiment root (`experiments/data-star-dashboard/`):

```bash
bun x wrangler pages deploy dist/public --project-name polyvis-reactor
```

*Note: Cloudflare Pages automatically detects the `../functions` directory relative to the public directory if structured correctly. If using the specific `dist/public` folder upload scheme, ensure Functions are handled.
Actually, for Pages, the project root is `dist`.
So `dist/` contains `public`? No.*

**Correction for Local Test:**
Cloudflare Pages deployment usually wants:
- `public` folder content -> Root of site
- `functions` folder -> Root of site (hidden)

So the `dist` folder should look like:
```
dist/
  index.html
  datastar.bundle.js
  functions/
    feed.js
```

**We need to restructure `dist/` slightly.**

```bash
mv dist/public/* dist/
rmdir dist/public
```

Then deploy `dist/` directly.

## 3. Revised Deployment
1. `cp index.html dist/`
2. `cp datastar.bundle.js dist/`
3. `cp -r functions dist/` (Ensure feed.js is in dist/functions/feed.js)
4. `bun x wrangler pages deploy dist --project-name polyvis-reactor`

## 4. Verify
After deployment, Cloudflare will give you a URL (e.g., `https://polyvis-reactor.pages.dev`).
Visit it to see the Reactor running at the Edge.
