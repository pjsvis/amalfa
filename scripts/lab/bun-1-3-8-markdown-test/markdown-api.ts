#!/usr/bin/env bun

/**
 * Markdown Rendering API
 *
 * Server-side markdown rendering using Bun's native markdown API.
 * Provides cached HTML rendering for public/docs markdown browser.
 */

interface CacheEntry {
  html: string;
  timestamp: number;
}

/**
 * Simple LRU-like cache for rendered markdown
 */
class MarkdownCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 100, ttlMs = 30 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.html;
  }

  set(key: string, html: string): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [k, v] of this.cache) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }

      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, { html, timestamp: Date.now() });
  }

  get stats() {
    return {
      size: this.cache.size,
      max: this.maxSize,
      ttl: `${this.ttl / 1000 / 60} minutes`,
    };
  }
}

// LRU Cache for rendered markdown (30-minute TTL)
const markdownCache = new MarkdownCache(100, 30 * 60 * 1000);

interface RenderResponse {
  html: string;
  cached: boolean;
  renderTime: number;
}

/**
 * Render markdown to HTML using Bun's native API
 */
export function renderMarkdown(markdown: string): string {
  return (Bun as any).markdown.html(markdown);
}

/**
 * Get cached or render fresh HTML
 */
export function getRenderedHtml(
  markdown: string,
  docId?: string,
): RenderResponse {
  const cacheKey = docId || hashMarkdown(markdown);

  const cached = markdownCache.get(cacheKey);
  if (cached) {
    return { html: cached, cached: true, renderTime: 0 };
  }

  const start = performance.now();
  const html = renderMarkdown(markdown);
  const end = performance.now();

  markdownCache.set(cacheKey, html);

  return { html, cached: false, renderTime: end - start };
}

/**
 * Simple hash for cache key
 */
function hashMarkdown(markdown: string): string {
  let hash = 0;
  for (let i = 0; i < markdown.length; i++) {
    const char = markdown.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Cache statistics
 */
export function getCacheStats() {
  return markdownCache.stats;
}

// CLI test
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🧪 Markdown API Test\n");

  const testMarkdown = await Bun.file("README.md").text();
  const result = getRenderedHtml(testMarkdown, "readme");

  console.log(`Cached: ${result.cached}`);
  console.log(`Render time: ${result.renderTime.toFixed(2)}ms`);
  console.log(`HTML length: ${result.html.length} chars`);
  console.log(`Cache stats:`, getCacheStats());

  console.log("\n✅ Markdown API ready for integration");
}
