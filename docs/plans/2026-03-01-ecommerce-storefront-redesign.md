# Ecommerce Storefront Redesign

**Date:** 2026-03-01
**Vibe:** Modern Marketplace — Dark Immersive Theme
**Data:** Mock/hardcoded products (API integration later)

## Brand Palette

- Deep Navy: `#110228` (base background)
- Cyan: `#26D5FF` (primary accent)
- Purple: `#7C3AED` → `#9333EA` (gradient accent)
- Glass: `rgba(255,255,255,0.05)` with `border: 1px solid rgba(255,255,255,0.1)`
- Text: White primary, `#a0a0c0` secondary

## Page Sections (top to bottom)

1. **Hero Banner** — Full-width carousel, gradient mesh bg, glass product card, cyan CTAs
2. **Category Strip** — Horizontal scrollable pills with icons, cyan active state
3. **Flash Sale** — Compact strip with countdown timer, horizontal product scroll
4. **Trending Products** — Curated carousel row, large cards with hover lift
5. **Product Grid + Filters** — Sticky sidebar filters, 3-4 col grid, glass cards, staggered fade-in

## Animations

- Scroll-triggered fade-in + slide-up (IntersectionObserver + CSS)
- Card hover: scale(1.02) + glow shadow
- Hero: slow gradient mesh shift
- Flash sale timer: digit fade transition
- Category pills: spring press effect
- `prefers-reduced-motion` respected throughout

## Files to Modify

- `app/ecommerce/products/page.tsx` — Full rewrite
- `components/ecommerce/ProductCard.tsx` — Dark theme glass card
- `components/ecommerce/Navbar.tsx` — Minor refinements
- `components/ecommerce/Footer.tsx` — Minor refinements
- `components/ecommerce/Hero.tsx` — Dark theme rewrite
- `app/globals.css` — Add animation keyframes
