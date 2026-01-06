# Part 1: The Playbook (`docs/PLAYBOOK_BASECOAT_MIGRATION.md`)

*This document defines the "Laws of Physics" for the new UI. It prevents the agent from guessing styles.*

# 📘 Playbook: The Semantic Basecoat Standard

**Context:** We are migrating a local-first AI dashboard from a legacy stack (Pico.css) to a new "Enlightened" stack (Tailwind + Basecoat variables). We do this page-by-page.

## 1. The Architecture

* **Server:** Bun (No Node.js, no Express).
* **Routing:** UnPoly (`up-target`, `up-layer`). HTML-over-the-wire.
* **Reactivity:** Alpine.js (`x-data`, `x-show`).
* **CSS:** Tailwind CSS (Utility) + Basecoat (Theme Variables) + Open Props (Legacy Variables).

## 2. The "CSS DMZ" Strategy

We never mix stacks on the same page.

* **Legacy Pages:** Load `pico.css` + `styles.css`.
* **New Pages:** Load `basecoat-output.css` (Tailwind build).
* **The Switch:** When migrating a page, **replace** the `<link>` tags in the `<head>`. Do not keep Pico.

## 3. The Semantic Basecoat Mapping

We do not write "div soup." We use Basecoat utility classes on Semantic HTML5 tags.

| UI Component | Semantic Tag | Basecoat Classes (Tailwind) |
| --- | --- | --- |
| **Page Container** | `<main>` | `container mx-auto p-8 max-w-7xl` |
| **Card / Panel** | `<article>` | `rounded-xl border border-border bg-card text-card-foreground shadow-sm` |
| **Card Header** | `<header>` | `flex flex-col space-y-1.5 p-6 border-b border-border/50 bg-muted/20` |
| **Primary Button** | `<button>` | `btn btn-primary` (Custom utility defined in `app.css`) |
| **Data Output** | `<output>` | `font-mono text-sm` |
| **Accordion** | `<details>` | `group border-t border-border` |
| **Markdown Area** | `<div>` | `prose prose-sm dark:prose-invert` |

## 4. State Management (Alpine)

* Do not use inline `onclick`. Use Alpine `x-on:click` or `@click`.
* For complex Markdown rendering:
```html
<div x-html="marked.parse(rawData)" class="prose"></div>

```



## 5. File Structure

* `src/frontend/` - Raw HTML templates.
* `src/assets/css/app.css` - Source CSS (Tailwind imports + Basecoat Variables).
* `src/public/assets/css/basecoat-output.css` - The compiled output (Git ignored).

