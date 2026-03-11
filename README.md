# Riftbound Companion — Promotional Website

Static promotional website for **Riftbound Companion**, an Android companion app for the Riftbound card game by Riot Games.

---

## Project Structure

```
riftbound-web/
├── index.html              # Single-page site
├── css/
│   └── style.css           # All styles (~1900 lines, comment-blocked sections)
├── js/
│   └── main.js             # All interactivity (single IIFE, ~560 lines)
└── assets/
    ├── adaptive-icon.png   # App icon — used in navbar and footer
    ├── splash.png          # Unused (kept as reference)
    └── caroussel/          # Screenshot images (1–12, .jpg or .png)
        ├── 1.jpg
        ├── 2.jpg
        └── ...
```

No build step, no dependencies, no server required. Open `index.html` directly in a browser.

---

## Page Sections

| # | Section | Nav anchor |
|---|---------|-----------|
| 1 | **Navbar** — fixed, frosted glass on scroll | — |
| 2 | **Hero** — full-viewport with animated particle system | `#hero` |
| 3 | **Audience** — 4 player-type cards | — |
| 4 | **Features** — 6 feature cards with hover glows | `#features` |
| 5 | **Screenshots** — 3-up rotating carousel with lightbox | `#screenshots` |
| 6 | **Scenarios** — 5 use-case story cards | — |
| 7 | **Deep Dive** — 3 trust/technical detail cards | — |
| 8 | **Pricing** — Free vs Premium ($2.99 one-time) comparison | `#pricing` |
| 9 | **Download CTA** — Google Play badge | `#download` |
| 10 | **Footer** — links, social icons, Riot disclaimer | — |

---

## Design System

### Colors
| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#0a0a0f` | Page background |
| `--color-bg-card` | `#12121a` | Feature/pricing cards |
| `--color-bg-elevated` | `#1a1a26` | Phone mockup frames |
| `--color-border` | `#2a2a40` | Default borders |
| `--color-gold` | `#c9a84c` | Primary accent |
| `--color-gold-light` | `#f0c96a` | Hover brightening |
| `--color-gold-dark` | `#8b6b1e` | Button gradient base |
| `--color-purple-hover` | `#9d4edd` | Hover glow on cards |
| `--color-text-primary` | `#f0ead6` | Body copy |
| `--color-text-secondary` | `#8a8a9a` | Subtitles, captions |

### Typography
- **Display / headings:** `Cinzel` (Google Fonts) — arcane, classical
- **Body:** `Inter` (Google Fonts) — clean legibility

### Interaction Pattern
- **Default:** gold border (`--color-gold`)
- **Hover:** purple glow (`--glow-purple`) + `translateY(-4px)` on cards
- **Navbar:** transparent → frosted glass (`backdrop-filter: blur(12px)`) past 20px scroll

---

## Hero Particle System

The hero background cycles through 6 elemental domains, one every 5 seconds (full 30-second rotation). Each domain has its own animation keyframe, color palette, particle count, size, and drift behaviour.

| Domain | Keyframe | Colors | Feel |
|--------|----------|--------|------|
| **Fury** | `ember-rise` | Red/orange | Rising fire embers |
| **Body** | `body-heave` | Orange/coral | Slow pulsing blobs |
| **Calm** | `calm-waft` | Teal/green | Drifting teardrops |
| **Mind** | `mind-twinkle` | Blue/cyan | Rapid blinking sparks |
| **Order** | `order-ascend` | Gold/yellow | Square particles rotating to diamonds |
| **Chaos** | `chaos-scatter` | Purple/violet | Erratic spinning blobs |

Transitions fade out over 1.5s before spawning the next domain's particles. Respects `prefers-reduced-motion`.

---

## Carousel & Lightbox

### Carousel
- Displays 3 slides simultaneously (active center + 2 visible side slides)
- 12 screenshots sourced from `assets/caroussel/` (supports `.jpg` and `.png` — auto-fallback on load error)
- Auto-advances every 4.5s, pauses for 8s after user interaction
- Controls: prev/next buttons, dot indicators, touch swipe, keyboard arrows

### Lightbox
- Click the **active (center) slide** to open a full-screen image viewer
- Keyboard: `Escape` closes, `←` / `→` navigates; syncs carousel position
- Click the dark backdrop to close
- Focus-trapped for accessibility (`aria-modal`, focus restore on close)

---

## Adding / Replacing Screenshots

1. Drop numbered image files into `assets/caroussel/` (e.g. `13.jpg` or `13.png`)
2. Add a corresponding `<div class="carousel__slide">` block in `index.html` — copy any existing slide and update the `src`, `alt`, and `aria-label`
3. Dot indicators update automatically — no JS changes needed

Both `.jpg` and `.png` are supported. If the default `.jpg` path fails, JS retries with `.png` automatically.

---

## JavaScript Modules (`js/main.js`)

All code lives in a single IIFE. Functions:

| Function | Purpose |
|---|---|
| `initImageFallbacks()` | `.jpg` ↔ `.png` auto-retry on image load error |
| `initNavbarScroll()` | Adds `.is-scrolled` (frosted glass) past 20px, rAF-throttled |
| `initSmoothScroll()` | Delegated click handler for all `#` anchor links |
| `initScrollSpy()` | IntersectionObserver highlights active nav link |
| `initMobileMenu()` | Hamburger toggle; closes on link click or outside click |
| `initScrollAnimations()` | IntersectionObserver → `.is-visible` on `[data-animate]` elements |
| `initCarousel()` | 3-up carousel, auto-advance, swipe, keyboard, dots |
| `initLightbox()` | Full-screen image viewer triggered from active carousel slide |
| `initHeroEmbers()` | Domain-cycling particle system |
| `initHoverGlows()` | Mouse-tracking CSS spotlight on feature cards (desktop only) |

---

## Responsive Breakpoints

| Breakpoint | Layout changes |
|---|---|
| `> 1024px` | 3-col features, full navbar |
| `≤ 1024px` | 2-col features, navbar CTA hidden |
| `≤ 768px` | 1-col everything, hamburger, carousel single-slide |
| `≤ 480px` | Smaller fonts, reduced padding, smaller phone mockup |

---

## Pricing

| Tier | Price | Notes |
|---|---|---|
| Free | $0 | Core features, limited match history (20), 3 deck slots |
| Premium | $2.99 | One-time purchase, lifetime access, no subscription |

---

## Legal

This is an independent fan project. Not affiliated with, endorsed by, or connected to Riot Games. Riftbound and all related marks are property of Riot Games.
