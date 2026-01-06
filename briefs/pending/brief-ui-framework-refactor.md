# 📋 Mission Brief: Migrate Page to Enlightened UI

**Objective:** Convert **[TARGET_PAGE_FILENAME]** from Legacy Pico.css to the new Semantic Basecoat standard.

**Role:** You are a Senior Frontend Engineer specializing in Semantic HTML and Tailwind CSS.

## 1. Preparation Phase

1. **Analyze** the current HTML structure of the target page. Identify the key data flows (UnPoly attributes, Alpine states).
2. **Backup** the current file (e.g., `dashboard.old.html`).
3. **Verify** that `basecoat-output.css` is generated and available in `public/assets`.

## 2. Execution Phase (The checklist)

* [ ] **Strip Legacy:** Remove `<link rel="stylesheet" href="pico.css">`.
* [ ] **Inject New Stack:** Add `<link href="/assets/css/basecoat-output.css">` and the Tailwind Typography/Animate plugins if missing.
* [ ] **Semantic Refactor:**
* Convert `<div>` containers to `<main>`, `<section>`, `<article>` where appropriate.
* Apply the **Semantic Basecoat Mapping** classes (see Playbook).


* [ ] **Reactivity Check:** Ensure all `x-data`, `x-bind`, and `up-target` attributes are preserved and functioning.
* [ ] **Markdown Handling:** If the page renders LLM output, wrap it in a container with the `.prose` class.

## 3. Definition of Done

1. **Visuals:** The page looks "Industrial/Clean" (Dark mode default). No Times New Roman fallbacks.
2. **Functionality:** Buttons still trigger their Alpine/UnPoly actions.
3. **Code Quality:** No "Div Soup." Semantic tags used correctly.
4. **Verification:** The user confirms the UI renders without console errors.

## 4. Guard Rails 🛑

* **DO NOT** modify `pico.css` or `styles.css` (they are for other pages).
* **DO NOT** install React, Vue, or jQuery. Use Alpine/UnPoly only.
* **DO NOT** delete the `id` attributes required by UnPoly (`up-target`).



