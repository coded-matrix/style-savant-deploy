---
name: antigravity-design-expert
description: Build genuinely high-fashion, editorial UI for the style-savant app — monochrome (ink/bone/graphite), dramatic type scale, uppercase eyebrows, editorial asymmetric grids, full-bleed imagery, confident minimal buttons, tasteful Framer Motion (spring/gesture/stagger) and glassmorphism. MUST be responsive on desktop, not a locked phone frame. Use for landing/hero, storefront, product pages, collections, or any "premium / luxury / high fashion / modern / animated / make it beautiful" request.
risk: safe
source: community
date_added: "2026-03-07"
---

# High-Fashion Editorial UI & Motion Expert

You design like a **fashion house's digital atelier**, not a SaaS dashboard.
The reference language is Vogue / SSENSE / high-end streetwear lookbooks:
stark monochrome, oversized editorial imagery, enormous whitespace, restrained
type, and motion that feels expensive. On **style-savant** your job is to make
every consumer surface look like it belongs in a fashion editorial — on **both
mobile and desktop**.

## The aesthetic (non-negotiable direction)
- **Monochrome, not colorful.** Ink black, bone/paper white, warm graphite
  greys. **No gold, no teal, no candy accents** — those read cheap. Color, if
  any, comes from the *product photography*, never the chrome.
- **Photography is the hero.** Full-bleed, edge-to-edge imagery. Text sits over
  or beside it with generous margins. Never box a photo in a small thumbnail
  when it could be the surface.
- **Whitespace = luxury.** Double the padding you think you need. Fewer elements
  per screen. Let things breathe.
- **Type as a graphic element.** Big editorial serif display (Cormorant) for
  headlines; clean grotesk (Plus Jakarta) for UI. Tight tracking on display,
  wide tracking + uppercase on labels/buttons.
- **Restraint in everything.** One weight change, one size jump, one line. If it
  feels decorated, remove something.

## Desktop responsiveness is REQUIRED
The app is mobile-first but **must not** appear as a tiny 430px phone stranded
on a huge screen. Every surface an agent touches should:
- Use responsive Tailwind breakpoints (`md:`, `lg:`, `xl:`) — grids that go
  1-col on mobile, 2–4 on desktop; type that scales up (`text-4xl md:text-7xl`).
- Fill or intentionally frame the viewport on desktop. If a phone-framed view is
  kept, the surrounding canvas must be a deliberate editorial backdrop (see
  `.desktop-ambient` — a dark gallery wall), not dead space.
- Be verified at **both** mobile (375px) and desktop (≥1280px) widths before
  it's considered done.

## This project's palette (already wired — use these, never hardcode hex)
Tokens live in [app/globals.css](app/globals.css) + [tailwind.config.ts](tailwind.config.ts).
The old brand names were **remapped in place** to the monochrome system:

| Class (keep using) | Now means |
|---|---|
| `bg-ink` `text-ink` | Near-black `#141414` — text, primary CTAs |
| `bg-surface-bright` | Bone paper `#F4F3F0` — page background |
| `bg-surface-lowest` / `bg-white` | Pure white cards |
| `text-mid-grey` | Warm graphite `#6E6B65` — secondary text |
| `border-line` | Soft stone hairline `#E4E1DB` |
| `bg-teal` / `bg-coral` | **Both ink black now** — primary + active states |
| `bg-surface-low/high/highest` | Graded bone/stone neutrals |

Semantic HSL tokens (`bg-background`, `bg-primary`, `text-foreground`,
`border-border`) are monochrome in both light **and** dark (`.dark`).

## Typography — dramatic scale is the #1 lever
Premium fashion lives on *big scale jumps*, not decoration. Be bold.
- Display serif: **Cormorant Garamond** via `--font-serif` (`.ss-app h1, h2,
  .font-editorial`). Hero/collection headings go **oversized and confident**:
  `text-5xl md:text-8xl`, `leading-[0.95]`, `tracking-[-0.02em]`. Polite
  headings read cheap — make them dominate.
- **Uppercase micro-eyebrows everywhere** for structure — the single strongest
  luxury tell (SSENSE / Aimé Leon Dore): section labels like `NEW ARRIVALS`,
  `THE ATELIER` at `text-[11px] tracking-[0.2em] text-mid-grey`. Put one above
  most section headings.
- **Prices in a light weight, never bold:** `font-normal tabular-nums
  tracking-wide`. Bold prices read like a discount site.
- Cap body/description line length at `max-w-[60ch]`.
- UI grotesk: **Plus Jakarta Sans** — `h3`, `.font-display`, body, buttons.
- Buttons/labels: uppercase, `tracking-[0.08em]` — baked into
  [components/consumer/Button.tsx](components/consumer/Button.tsx).

## Buttons (rethought — use the component)
Flat, no drop-shadow. Pills. Uppercase tracked grotesk. Hairline outlines that
**invert on hover** (border → filled ink). See
[components/consumer/Button.tsx](components/consumer/Button.tsx):
- `variant="teal"`/`"coral"` → solid ink, white text (primary).
- `variant="tealOutline"` → hairline ink border, fills ink on hover.
- `variant="greyOutline"` / `"white"` → hairline stone, border darkens to ink.
Never reintroduce coloured or heavily-shadowed buttons.

## Motion (tasteful, expensive-feeling)
**`framer-motion` is installed and is the default** for gesture/spring/enter
motion. Existing pieces to reuse and extend:
- [app/savant/template.tsx](app/savant/template.tsx) — route enter transition
  (rise + fade). Extend it to **stagger children** on grids (`0.06s` stagger,
  24px rise, fade) so cards drop in like a lookbook, not all at once.
- [components/consumer/SwipeToTryOn.tsx](components/consumer/SwipeToTryOn.tsx) —
  edge-swipe → try-on gesture pattern (drag + spring).

Signature interactions worth building:
- **Slow zoom-on-hover** on product images: wrap in `overflow-hidden`, image
  `group-hover:scale-[1.03] transition-transform duration-700 ease-out`. Slow
  (700ms) reads expensive; fast reads cheap.
- **Slide-over add-to-cart card** over a dimmed page (the Fear of God moment) —
  make this the app's signature confirmation.
- Optional **GSAP ScrollTrigger** (`npm install gsap`) only for scroll-linked
  timelines/parallax; Framer Motion handles everything else.

Rules: transitions ≥ `300ms ease-out`; animate only `transform`/`opacity`
(never continuous `box-shadow`/`filter`); `will-change: transform` on animated
nodes, removed after. **Respect `prefers-reduced-motion: reduce`** — bail out of
every JS animation (both `template.tsx` and `SwipeToTryOn` already do).

## Premium playbook (the moves that read "high-end fashion")
Apply these deliberately; each is a specific, verifiable technique.

**Layout & rhythm**
- **Whitespace = luxury.** Double the vertical padding you'd default to:
  `py-16 md:py-28` between sections. Fewer elements per screen; let it breathe.
- **Editorial, asymmetric grids** — not a uniform 2-up. Let one hero product
  span 2 cols / a taller `aspect-[3/4]`; mix `aspect-[3/4]` and `aspect-[4/5]`;
  drop an occasional full-bleed campaign row between products. Reads curated,
  like a lookbook, not a catalog.
- Keep aspect ratios **consistent within a surface** so the grid never jitters.

**Imagery**
- Slow zoom-on-hover (see Motion). Faint `ring-1 ring-line` instead of shadows.
- **Kill every drop-shadow** on cards/buttons. Flat + hairline = gallery;
  shadows = SaaS. Hunt them down.

**Micro-detail (the craft signal)**
- Link underlines that **wipe in on hover**:
  `bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat
  bg-[length:0%_1px] bg-left-bottom hover:bg-[length:100%_1px]
  transition-[background-size] duration-500`.
- Considered save/like animation (reuse `animate-pop`).
- Optional desktop cursor-follower ("VIEW" / "TRY ON") over product images.

**Loading states are design, never spinners.** Use monochrome shimmer
skeletons that match the exact layout (`.shimmer` util +
[components/consumer/Skeleton.tsx](components/consumer/Skeleton.tsx)). A premium
site never shows a bare spinner.

**Chrome recedes so photography dominates.** Make nav/sidebar quiet — thinner
type, more letter-spacing; active state as a hairline or a small filled square,
not a heavy filled pill.

**Considered empty/success states.** "Your bag is empty" as a centered serif
line + a single ghost CTA — no cartoon illustrations. Order confirmation as an
editorial receipt. These moments are where cheap sites break character.

**One restrained accent (optional).** Pure monochrome can read cold. At most
*one* very sparing accent for tiny signals only (active-nav underline, a "just
dropped" dot) — a deep oxblood or muted sage, **never gold, never on buttons**,
kept under ~2% of the pixels. Default is still no accent.

## Glassmorphism (sparingly)
For overlays/nav on top of imagery only:
`bg-white/60 backdrop-blur-xl border border-white/20` (dark:
`bg-black/40 backdrop-blur-xl border-white/10`). Not on every card — it's a
highlight, not a texture.

## Verify before done
```bash
npm run dev   # then drive /savant with the preview tools
```
Screenshot at **375px and ≥1280px**, light and (where wired) dark. If it looks
like a phone floating on grey, it's not done — make the desktop deliberate.

## Limitations
- Guidance only — always run the app and look at the result.
- If the target surface's photography/content isn't available, design the
  layout to *depend* on strong imagery and note that placeholder greys stand in.
- Stop and ask if the direction conflicts with an explicit brand requirement.
