---
description: Guide to deploying PolyVis components to Cloudflare Pages/Workers
---

# Cloudflare Playbook

PolyVis uses Cloudflare Pages for deploying experiments and production components. We leverage the "Edge" for our "Hollow Node" architecture.

## 1. Prerequisites

*   **Cloudflare Account**: Created and Active.
*   **Wrangler CLI**: `bun add -g wrangler`
*   **Authentication**: `bun x wrangler login`

## 2. Project Structure for Pages

Cloudflare Pages distinguishes between "Static Assets" and "Functions" (Serverless Backend).

**CRITICAL: For Direct Uploads (`wrangler pages deploy`), the `functions` directory must be at the ROOT, essentially a sibling to your static build folder.**

```text
/my-project
  ├── functions/          (Backend Logic - Auto-detected by Wrangler)
  │   └── feed.js         (Maps to /feed)
  └── dist/               (Static Assets - Upload Target)
      ├── index.html
      └── bundle.js
```

## 3. Creating a Function (The Reactor)

To create a Server-Sent Events (SSE) stream or API, place a `.js` or `.ts` file in `functions/`.

**`functions/feed.ts` Example:**
```typescript
export async function onRequest(context) {
    const stream = new ReadableStream({
        start(controller) {
            // ... Logic to push data ...
            controller.enqueue(new TextEncoder().encode("data: hello\n\n"));
        }
    });

    return new Response(stream, {
        headers: { "Content-Type": "text/event-stream" }
    });
}
```
*This file will be available at `/feed`.*

## 4. Deployment

### Direct Upload (No Git Integration)
For experiments, we use direct upload.

1.  **Prepare**:
    *   `dist/` contains HTML/JS.
    *   `functions/` contains backend code (at project root).
2.  **Deploy**:
    Run this command from the **folder containing functions/**:
    ```bash
    bun x wrangler pages deploy ./dist --project-name <PROJECT_NAME>
    ```
    *Wrangler will detect `./functions` and compile a worker, while uploading `./dist` as assets.*

### Promoting to Production
By default, deployments are "Preview" (aliased to a hash or branch name).
To update the main production URL:

```bash
bun x wrangler pages deploy ./dist --project-name <PROJECT_NAME> --branch main
```

## 5. Troubleshooting "New Project" Issues

*   **SSL Errors (`ERR_SSL_VERSION_OR_CIPHER_MISMATCH`)**: 
    *   **Cause**: Cloudflare is provisioning the SSL certificate for the new subdomain.
    *   **Solution**: Wait 1-15 minutes. It resolves automatically.
*   **Functions 404 / Returning HTML**:
    *   **Cause**: Your `functions` folder was likely inside `dist/`. Move it UP one level to the project root. Wrangler does not look inside the upload target for source functions.
*   **Nothing is here yet**:
    *   **Cause**: You might be visiting the `main` URL before deploying to the `main` branch. Check the "Alias URL" in the deployment output.

## 6. Useful Commands

*   `bun x wrangler pages project list` - See active projects.
*   `bun x wrangler pages deployment list --project-name <NAME>` - See history.
