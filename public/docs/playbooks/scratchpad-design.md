# Design Scratchpad: AntiGravity Emulation

**Goal**: Adopt the visual language of Google's AntiGravity agent.

## 1. Core Philosophy
- **High Contrast Dark Mode**: Deep backgrounds (`#202124` or darker), crisp white text (`#ffffff`), and subtle borders.
- **Typography**: Clean, geometric sans-serif (Google Sans / Inter).
- **Fluidity**: Responsive sizing for typography and spacing.
- **"The Card"**: Distinct surfaces with subtle borders and rounded corners.

## 2. Color Palette (Dark Mode)

| Semantic Name | Value | Description |
| :--- | :--- | :--- |
| `--primary` | `#202124` | Main Background (Deep Gray) |
| `--secondary` | `#ffffff` | Primary Text (Crisp White) |
| `--accent` | `#303134` | Secondary Background / Sidebar |
| `--surface-1` | `#202124` | App Background |
| `--surface-2` | `#303134` | Card / Panel Background |
| `--surface-hover` | `#3c4043` | Hover State |
| `--border-base` | `#5f6368` | Subtle Borders |
| `--link` | `#8ab4f8` | Google Blue (Links) |
| `--link-visited` | `#c58af9` | Google Violet (Visited) |

## 3. Typography

- **Font Family**: `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Scale**:
    - `xs`: `0.75rem`
    - `sm`: `0.875rem`
    - `base`: `1rem`
    - `lg`: `1.125rem`
    - `xl`: `1.25rem`
    - `2xl`: `1.5rem`

## 4. Spacing (Fluid)

Using Open Props `size-fluid-*` where appropriate, but anchoring on a 4px grid.

- `--spacing-1`: `4px`
- `--spacing-2`: `8px`
- `--spacing-3`: `12px`
- `--spacing-4`: `16px` (Standard Gap)
- `--spacing-5`: `20px`
- `--spacing-6`: `24px`

## 5. Implementation Strategy
1.  **Update `theme.css`**: Replace existing color variables with the new palette.
2.  **Refine Typography**: Ensure `Inter` is loaded or falls back gracefully.
3.  **Component Audit**: Check Sidebars, Cards, and TOC for contrast issues.
