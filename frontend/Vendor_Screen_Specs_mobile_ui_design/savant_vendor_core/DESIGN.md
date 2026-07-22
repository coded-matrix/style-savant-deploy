---
name: Savant Vendor Core
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#3d4948'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#6d7978'
  outline-variant: '#bdc9c7'
  surface-tint: '#006a65'
  primary: '#006762'
  on-primary: '#ffffff'
  primary-container: '#00837c'
  on-primary-container: '#f3fffd'
  inverse-primary: '#72d7cf'
  secondary: '#a43c28'
  on-secondary: '#ffffff'
  secondary-container: '#fd7e65'
  on-secondary-container: '#711707'
  tertiary: '#765700'
  on-tertiary: '#ffffff'
  tertiary-container: '#956e00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#8ff4eb'
  primary-fixed-dim: '#72d7cf'
  on-primary-fixed: '#00201e'
  on-primary-fixed-variant: '#00504c'
  secondary-fixed: '#ffdad3'
  secondary-fixed-dim: '#ffb4a5'
  on-secondary-fixed: '#3f0400'
  on-secondary-fixed-variant: '#842413'
  tertiary-fixed: '#ffdfa0'
  tertiary-fixed-dim: '#fbbc00'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  success-green: '#28A745'
  error-red: '#DC3545'
  surface-dark: '#1A1D1F'
  surface-white: '#FFFFFF'
  text-grey: '#6C757D'
  teal-tint: rgba(47, 156, 149, 0.05)
  red-tint: rgba(220, 53, 69, 0.05)
typography:
  display-hero:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
  title-page:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
  title-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 18px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  caption:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
  metadata:
    fontFamily: Hanken Grotesk
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 14px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter: 16px
  margin-card: 16px
  margin-page: 20px
  sidebar-width: 100px
  row-height-std: 52px
  header-system: 28px
  header-dash: 40px
---

## Brand & Style

This design system establishes a **Professional / Modern** aesthetic tailored for high-stakes e-commerce management. It balances the authoritative reliability of a fintech dashboard with the vibrant energy of a fashion-forward creative tool. 

The visual narrative is driven by high-contrast functional zones: a deep, immersive onboarding experience transitioning into a clean, data-dense management interface. The style leverages a "Utility-First" philosophy, where every element prioritizes legibility and status visibility to help vendors manage stock, campaigns, and earnings with precision.

**Key Stylistic Pillars:**
- **Information Density:** Optimized for quick scanning of metrics and product tables.
- **Vibrant Functionalism:** Using high-chroma colors (Teal and Coral) not just for brand presence, but as primary navigation and action cues.
- **Card-Based Architecture:** Organizing complex data into digestible, high-contrast modules.

## Colors

The palette is strategically split between **Brand Action** and **Operational Status**. 

- **Teal (#2F9C95)**: The primary anchor. Used for financial data (prices, payouts), focus states, and the immersive onboarding background.
- **Coral (#FF7F66)**: The high-intent CTA color. Reserved strictly for growth-oriented actions like "Add Product" or "Publish Live."
- **Functional Accents**: Amber, Green, and Red are strictly mapped to stock levels and system health.
- **Surfaces**: We use a triple-tier background system: `surface-dark` for persistent navigation, `neutral` (off-white) for the page canvas, and `surface-white` for the interactive cards.

## Typography

This system uses **Hanken Grotesk** across all levels to maintain a sharp, contemporary, and highly legible feel suitable for data-heavy dashboards.

The hierarchy is built on a high-contrast scale where bold weights are utilized for all structural headings and data points (Tiers, Prices, Metrics) to ensure they pop against the off-white background. Body and metadata levels use a tighter 10pt–12pt range to maximize information density without sacrificing readability.

**Usage Rules:**
- **Bold 700:** Use for all labels, headings, and primary data values.
- **Regular 400:** Use for descriptions, captions, and secondary metadata.
- **Italic:** Reserved strictly for legal notes and fine print in the `caption` style.

## Layout & Spacing

The layout utilizes a **Fixed-Fluid Hybrid** model. Navigation and headers occupy fixed dimensions to provide a stable frame for the fluid, card-based content area.

**Grid & Alignment:**
- **Base Rhythm:** All vertical and horizontal spacing follows a 4px/8px incremental scale.
- **Structure:** Content is housed in cards that reflow into a 2-column grid on tablets and stack vertically on mobile. On desktop, analytics cards should utilize a 3-column or 2x2 grid.
- **Density:** Table rows are set to a compact 52px height to ensure high visibility of product lists.

**Breakpoints:**
- **Mobile (<600px):** Single column cards, full-width buttons, 16px page margins.
- **Tablet (600px - 1024px):** 2-column grid for stat cards, 20px page margins.
- **Desktop (>1024px):** Fixed sidebar (100px), multi-column layout, max-width content container of 1440px.

## Elevation & Depth

This system avoids heavy drop shadows in favor of **Tonal Layering** and high-contrast borders. Depth is communicated through the stacking of surfaces.

- **Level 0 (Canvas):** Off-white (`#F8F9FA`) page background.
- **Level 1 (Cards):** Pure White (`#FFFFFF`) cards with a subtle 1px border. No shadow.
- **Level 2 (Navigation):** `surface-dark` persistent bars that sit above the canvas.
- **Level 3 (Overlays):** Modals and paywalls use a 55% opacity dark tint backdrop to isolate the content.

**Interactive Depth:**
Instead of raising elements on hover, we use **Teal Tints** (5% opacity) to highlight unread items or selected rows, keeping the interface flat and efficient.

## Shapes

The shape language is "Soft-Geometric," using varied corner radii to distinguish between containers and utility elements.

- **Large Containers (12px):** Used for primary form cards and significant onboarding blocks.
- **Standard Cards/Modals (8px):** Used for analytics, metrics, and secondary pop-ups.
- **Small Utilities (6px):** Used for image thumbnails, status badges, and size pills.
- **Interactive Elements:** Buttons follow the 12px rule for primary actions and 8px for smaller toolbar actions.
- **Avatars/Icons:** Strict circular clipping for user profiles and payout status indicators.

## Components

### Buttons
- **Primary (Coral):** White text, 12px radius, bold label. Reserved for "Growth" actions.
- **Primary (Teal):** White text, 12px radius. Used for "Value" and "Save" actions.
- **Secondary/Ghost:** Teal border (1px), Teal text, white background.

### Cards
- **Stat Cards:** White background, 8px radius, 16px internal padding. Metrics displayed in Bold Teal.
- **Campaign Cards:** 10px radius, featuring a left-accent border if the status is "Critical" or "Overdue."

### Input Fields
- **Standard Text:** Off-white background, 1px grey border. Transition to a 1px Teal border on focus.
- **Upload Zones:** Dashed Teal border with a light Teal tint background.

### Badges & Chips
- **Status Pills:** 6px radius. Color-coded background (Green/Amber/Red) with high-contrast text.
- **Filter Chips:** 50% rounded (pill), Coral background for active state, Grey for inactive.

### Tables
- **Standard Row:** 52px height, thin grey divider (#EDEDED). 
- **Alert Rows:** 5% Red Tint background for "Sold Out" items.
- **Highlight Rows:** 5% Teal Tint background for unread/new notifications.

### Specialized Components
- **Token Pill:** A persistent, high-visibility element in the top bar showing balance.
- **Strips:** Full-width alert banners (Amber or Teal) that appear at the top of content areas for contextual information.