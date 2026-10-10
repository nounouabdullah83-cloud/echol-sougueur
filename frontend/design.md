# Design Guide — Echole System

This document defines the ground rules every frontend page/component must follow.

## Color Palette

Restricted to **black, white, and blue** only. Neutral grays are allowed only as
shades/mixes of black and blue.

| Token       | Value     | Usage                          |
| ----------- | --------- | ------------------------------ |
| `--black`   | `#0b0f19` | Primary text / dark background |
| `--white`   | `#ffffff` | Main background / light text   |
| `--accent`  | `#2563eb` | Actions, links, highlights     |
| `--accent-hover` | `#1d4ed8` | Hover states             |
| `--border`  | `#e2e8f0` | Dividers, borders              |

Do **not** introduce red, green, orange, or purple without explicit approval.

## Typography

Arabic-first stack, loaded from Google Fonts:

```css
--sans: 'Tajawal', 'Cairo', 'Segoe UI', system-ui, sans-serif;
--heading: 'Cairo', 'Tajawal', 'Segoe UI', system-ui, sans-serif;
```

- Body: **Tajawal** (fallback Cairo)
- Headings: **Cairo** (fallback Tajawal)
- Pages are RTL (`dir="rtl"`, `lang="ar"`).

---

## Mandatory Rules

1. **No animations and transitions**
   - Never use `animation`, `transition`, `@keyframes`, or JS-driven motion.
   - State changes (hover, focus, active) must be instant color changes only.

2. **No unnecessary border-radius**
   - Default radius is `0`. Use a border-radius only when a shape genuinely
     requires it (e.g. a badge/pill), and keep it `≤ 4px` (prefer `0`).

3. **No oversized images**
   - Set explicit `width`/`height` (or `max-width`) on every image.
   - Do not use full-bleed hero images; keep images contained and lightweight
     (`.svg`/`.webp`, optimized).
   - Never rely on `object-fit` to "save" an oversized image — size it first.

4. **No scroll animations**
   - No scroll-triggered effects, parallax, reveal-on-scroll, or sticky/floating
     elements that move on scroll.
   - The page must be static and fully readable at any scroll position.

> Any component that breaks a rule fails review and must be reverted.
