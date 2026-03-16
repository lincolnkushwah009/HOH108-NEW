# GOD IS KIND (GIK)
## Complete Website Design System & Experience Blueprint
### Version 1.0 — February 2025

---

# 1. WEBSITE CONCEPT

## 1.1 Visual Theme: "Sacred Minimalism"

The GIK digital experience is built on **Sacred Minimalism** — a design philosophy where every pixel serves a purpose, every whitespace is intentional, and every interaction feels like a quiet ritual. The website should feel like walking into a curated gallery where sustainability meets divinity.

**Core Design Pillars:**
- **Silence** — The design speaks through restraint, not noise
- **Weight** — Every element carries gravitas; nothing feels disposable
- **Reverence** — The spiritual undertone is felt, never forced
- **Craft** — Every detail communicates handmade quality and intention

## 1.2 Color Palette

### Primary Palette
| Token | Color | Hex | Usage |
|-------|-------|-----|-------|
| `--gik-void` | Pure Black | `#0A0A0A` | Primary text, hero backgrounds |
| `--gik-canvas` | Warm White | `#F7F5F0` | Page background, breathing space |
| `--gik-stone` | Warm Gray | `#B8B2A8` | Secondary text, borders, dividers |
| `--gik-linen` | Off-White | `#EDE9E1` | Card backgrounds, subtle sections |
| `--gik-earth` | Deep Clay | `#8B7355` | Accent, CTAs, active states |

### Accent Palette (Category-Specific)
| Token | Color | Hex | Category |
|-------|-------|-----|----------|
| `--gik-utility` | Slate | `#5A5A5A` | GIK Utility™ |
| `--gik-align` | Burnished Gold | `#C4A265` | GIK Align™ |
| `--gik-panel` | Charcoal | `#2C2C2C` | GIK Panel™ |

### Functional Colors
| Token | Color | Hex | Usage |
|-------|-------|-----|-------|
| `--gik-success` | Sage | `#7A8B6F` | Success states, sustainability badges |
| `--gik-error` | Muted Rust | `#B85C4A` | Error states |
| `--gik-info` | Soft Blue | `#6B8FA3` | Informational |

**Rule:** Never use more than 3 colors on any single viewport. The palette is deliberately muted — luxury whispers.

## 1.3 Typography

### Font System
| Role | Font | Fallback | Weight |
|------|------|----------|--------|
| **Display / Headlines** | **Cormorant Garamond** | Georgia, serif | 300 (Light), 500 (Medium) |
| **Body / UI** | **Inter** | -apple-system, sans-serif | 400 (Regular), 500 (Medium) |
| **Accent / Labels** | **Spaced Inter** (tracking +0.15em) | sans-serif | 500 (Medium) |
| **Monospace / Data** | **JetBrains Mono** | monospace | 400 |

### Type Scale
```
--text-hero:    clamp(3.5rem, 8vw, 7rem)    / 0.95 line-height  / -0.03em tracking
--text-h1:      clamp(2.5rem, 5vw, 4.5rem)  / 1.05 line-height  / -0.02em tracking
--text-h2:      clamp(1.8rem, 3.5vw, 3rem)  / 1.1 line-height   / -0.015em tracking
--text-h3:      clamp(1.3rem, 2vw, 1.75rem) / 1.2 line-height   / -0.01em tracking
--text-body:    1rem (16px)                  / 1.7 line-height   / 0 tracking
--text-small:   0.875rem (14px)              / 1.6 line-height   / 0.01em tracking
--text-caption:  0.75rem (12px)               / 1.5 line-height   / 0.08em tracking (uppercase)
```

**Rule:** Headlines always use Cormorant Garamond Light (300). Body always uses Inter Regular (400). Labels and category names use Inter Medium with wide letter-spacing (all caps). Never bold headlines — light weight conveys luxury.

## 1.4 Mood

**The experience should evoke:**
- Walking through a Japanese museum at dawn
- Touching hand-finished stone
- The quiet confidence of knowing something is rare
- The weight of an heirloom object
- The calm of a perfectly ordered space

**Mood References:**
- The silence of an Aesop store
- Apple product pages' cinematic storytelling
- Axel Vervoordt's interior philosophy
- Kinfolk magazine editorial layouts
- The reverence of a sacred space

## 1.5 Imagery Style

### Photography Direction
- **Product shots:** Shot on neutral linen/stone/concrete surfaces. Single object, massive negative space. Natural side-lighting creating gentle shadows. Never flat-lay cluttered arrangements.
- **Lifestyle shots:** Minimal interiors — concrete walls, raw wood, natural light flooding through large windows. Products placed contextually but never competing with environment.
- **Detail shots:** Extreme macro of material textures — recycled paper grain, upcycled metal patina, wood grain. These tell the sustainability story visually.
- **Spiritual shots:** Subtle — morning light, incense smoke wisps, water ripples, sacred geometry patterns in architecture. Never literal religious imagery.

### Image Treatment
- Desaturated warm tone (never cold/blue)
- High key with deep selective blacks
- No filters, no heavy post-processing
- Aspect ratios: 4:5 (product), 16:9 (hero/editorial), 1:1 (grid), 3:4 (lifestyle)

## 1.6 UI Component Style

### Buttons
- **Primary:** Black fill (`#0A0A0A`), warm white text, no border-radius, 56px height, uppercase Inter 12px tracking +0.15em. Hover: background fades to `--gik-earth` with 400ms ease.
- **Secondary:** Transparent with 1px `--gik-stone` border, black text. Hover: fill shifts to `--gik-linen`.
- **Ghost:** Text-only with subtle underline offset by 4px. Hover: underline slides in from left.

### Cards
- No border, no shadow, no border-radius
- Subtle `--gik-linen` background or fully transparent
- Image + minimal text beneath
- Generous internal padding (32px minimum)
- Hover: image scales 1.03x with 600ms cubic-bezier ease

### Input Fields
- Borderless bottom-line style (1px `--gik-stone`)
- 56px height
- Label floats above on focus (animated)
- Focus: bottom border transitions to `--gik-void`

### Dividers
- 1px `--gik-linen` or `--gik-stone` at 30% opacity
- Used sparingly — whitespace is the primary divider

### Navigation
- Ultra minimal — text only, no icons in main nav
- Fixed top bar: transparent on scroll, becomes `--gik-canvas` with subtle blur backdrop on scroll
- Hamburger on mobile: elegant full-screen overlay with staggered text animation

---

# 2. COMPLETE SITEMAP

```
GOD IS KIND (GIK)
│
├── HOME (/)
│
├── SHOP (/shop)
│   ├── All Products (/shop/all)
│   ├── GIK Utility™ (/shop/utility)
│   ├── GIK Align™ (/shop/align)
│   ├── GIK Panel™ (/shop/panel)
│   └── Limited Editions (/shop/limited)
│
├── PRODUCT DETAIL (/shop/{category}/{product-slug})
│
├── COLLECTIONS (/collections)
│   ├── New Arrivals (/collections/new)
│   ├── Bestsellers (/collections/bestsellers)
│   ├── The Founder's Edit (/collections/founders-edit)
│   └── Seasonal Curation (/collections/seasonal)
│
├── THE STORY (/story)
│   ├── About GIK (/story/about)
│   ├── The Founder (/story/founder)
│   ├── Our Craft (/story/craft)
│   └── Design Philosophy (/story/philosophy)
│
├── SUSTAINABILITY (/sustainability)
│   ├── Our Promise (/sustainability/promise)
│   ├── Material Journey (/sustainability/materials)
│   └── Impact Report (/sustainability/impact)
│
├── JOURNAL (/journal)
│   ├── Article Detail (/journal/{slug})
│   └── Categories: Design / Living / Sustainability / Sacred Spaces
│
├── THE EXPERIENCE (/experience)
│   ├── Spiritual Alignment Guide (/experience/alignment-guide)
│   ├── Room Visualizer (/experience/visualizer) [Phase 2]
│   └── Designer Collaborations (/experience/collaborations)
│
├── CONTACT (/contact)
│   ├── General Inquiry
│   ├── Trade / Architecture Program (/contact/trade)
│   └── Custom Orders (/contact/custom)
│
├── ACCOUNT (/account)
│   ├── Login / Register (/account/login)
│   ├── Orders (/account/orders)
│   ├── Addresses (/account/addresses)
│   └── Wishlist (/account/wishlist)
│
├── CART (/cart)
│
├── CHECKOUT (/checkout)
│
├── LEGAL
│   ├── Privacy Policy (/privacy)
│   ├── Terms & Conditions (/terms)
│   ├── Shipping Policy (/shipping)
│   └── Return Policy (/returns)
│
└── TRADE PROGRAM (/trade)
    └── Application for architects & designers
```

### Premium Pages That Elevate the Brand:
- **The Founder (/story/founder)** — Editorial long-form page with full-bleed imagery, personal letter from the founder
- **Material Journey (/sustainability/materials)** — Interactive scroll experience showing how recycled materials become GIK products
- **Spiritual Alignment Guide (/experience/alignment-guide)** — Interactive quiz matching customers to GIK Align™ products based on Vaastu principles
- **Trade Program (/trade)** — Exclusive portal for architects and interior designers with trade pricing
- **The Founder's Edit (/collections/founders-edit)** — Hand-picked collection by the founder, refreshed monthly
- **Designer Collaborations (/experience/collaborations)** — Dedicated pages for limited artist/designer partnerships

---

# 3. DETAILED PAGE-BY-PAGE UX WIREFRAME PLAN

---

## 3.1 HOME PAGE (/)

The homepage is the brand's manifesto — not a product catalog. Every scroll reveals a chapter of the GIK story.

### Section 1: CINEMATIC HERO
```
┌─────────────────────────────────────────────────┐
│                                                 │
│            [Full-viewport video/image]           │
│                                                 │
│         G O D   I S   K I N D                   │
│                                                 │
│       "Where sustainability meets the sacred"   │
│                                                 │
│              [ Explore ]                        │
│                                                 │
│                                                 │
│                          ↓ Scroll indicator      │
└─────────────────────────────────────────────────┘
```
- **Layout:** Full viewport (100vh), edge-to-edge
- **Content:** Slow-motion video loop (recycled material being crafted) or high-end hero image
- **Typography:** Brand name in spaced uppercase Inter (tracking +0.3em), tagline in Cormorant Garamond Light italic
- **Interaction:** Parallax scroll — image scales down slightly as user scrolls, revealing next section. Subtle grain texture overlay.
- **Animation:** Text fades in with staggered 200ms delays per line. Scroll indicator pulses gently.
- **CTA:** "Explore" ghost button with animated underline

### Section 2: BRAND PHILOSOPHY STATEMENT
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│    "Every object in your home                   │
│     should carry a story of kindness."          │
│                                                 │
│                        — GIK                    │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Layout:** Centered text, massive padding (200px+ vertical)
- **Background:** `--gik-canvas`
- **Typography:** Cormorant Garamond Light, `--text-h1` size
- **Animation:** Text reveals word-by-word on scroll (intersection observer), each word fading up with 80ms stagger
- **Scroll behavior:** This section acts as a "breath" — pure whitespace with text

### Section 3: FEATURED COLLECTIONS (The Three Pillars)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  GIK UTILITY™        GIK ALIGN™      GIK PANEL™│
│  ┌──────────┐     ┌──────────┐    ┌──────────┐ │
│  │          │     │          │    │          │  │
│  │  [Image] │     │  [Image] │    │  [Image] │  │
│  │          │     │          │    │          │  │
│  └──────────┘     └──────────┘    └──────────┘ │
│  Functional        Sacred          Art Deco     │
│  Minimal           Spiritual       Statement    │
│                                                 │
│              [ Shop All → ]                     │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Layout:** 3-column grid on desktop, horizontal scroll on mobile
- **Cards:** Full-bleed images (4:5 ratio), category label in uppercase caption, one-line description in body text
- **Interaction:** Hover reveals a subtle color wash matching category accent color. Image lifts (translateY -8px) with 500ms ease.
- **Animation:** Cards stagger in from bottom on scroll entry (100ms delay between each)
- **Mobile:** Horizontal snap-scroll carousel with peek of next card

### Section 4: FEATURED PRODUCT SHOWCASE
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ┌──────────────────────┐                       │
│  │                      │    THE VEDIC FRAME    │
│  │                      │                       │
│  │    [Large Product    │    Handcrafted from    │
│  │     Image 60%]       │    reclaimed teak.     │
│  │                      │    Each piece unique.   │
│  │                      │                       │
│  │                      │    ₹12,500             │
│  │                      │                       │
│  └──────────────────────┘    [ View Product ]   │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Layout:** Asymmetric split — 60% image left, 40% text right (alternates for next product)
- **Content:** 2-3 hero products, one at a time, with editorial-style storytelling
- **Interaction:** Horizontal scroll or vertical section-snap between products
- **Animation:** Image slides in from left, text content fades from right with 300ms delay
- **Scroll behavior:** Each product occupies full viewport height, section-snap scrolling

### Section 5: SUSTAINABILITY STORY
```
┌─────────────────────────────────────────────────┐
│                                                 │
│             OUR PROMISE TO THE EARTH            │
│                                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐           │
│  │ 850 │  │ 12  │  │ 100%│  │  0  │           │
│  │ kg  │  │tons │  │recyc│  │waste│           │
│  │     │  │     │  │     │  │     │           │
│  │Mater│  │CO2  │  │Packa│  │Land │           │
│  │saved│  │saved│  │ging │  │fill │           │
│  └─────┘  └─────┘  └─────┘  └─────┘           │
│                                                 │
│  "We don't just make products.                  │
│   We give materials a second life."             │
│                                                 │
│           [ Read Our Story → ]                  │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Layout:** Centered content, numbers in a 4-column grid
- **Background:** Subtle texture overlay (recycled paper grain)
- **Numbers:** Large display text (Cormorant Garamond), animated count-up on scroll entry
- **Animation:** Numbers count up from 0 with easeOutExpo, 1.5s duration, staggered 200ms
- **Quote:** Fades in after numbers complete
- **Interaction:** Subtle background parallax with a material texture image

### Section 6: EDITORIAL / JOURNAL PREVIEW
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  FROM THE JOURNAL                               │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐             │
│  │              │  │              │             │
│  │   [Image]    │  │   [Image]    │             │
│  │              │  │              │             │
│  ├──────────────┤  ├──────────────┤             │
│  │ LIVING       │  │ SACRED SPACES│             │
│  │              │  │              │             │
│  │ The Art of   │  │ Vaastu for   │             │
│  │ Conscious    │  │ Modern       │             │
│  │ Living       │  │ Homes        │             │
│  └──────────────┘  └──────────────┘             │
│                                                 │
│           [ Read the Journal → ]                │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Layout:** 2-column grid, editorial card style
- **Content:** Latest 2 journal articles with category tag, title, excerpt
- **Interaction:** Hover lifts card with soft shadow, image zooms 1.02x
- **Animation:** Slides in from bottom on scroll

### Section 7: NEWSLETTER / COMMUNITY
```
┌─────────────────────────────────────────────────┐
│                                                 │
│           JOIN THE GIK COMMUNITY                │
│                                                 │
│     Receive curated stories, early access       │
│     to limited editions, and the GIK journal.   │
│                                                 │
│     ┌──────────────────────┐ ┌──────────┐       │
│     │  Your email           │ │ Subscribe│       │
│     └──────────────────────┘ └──────────┘       │
│                                                 │
│     By subscribing you agree to our             │
│     privacy policy.                             │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Layout:** Centered, minimal
- **Background:** `--gik-linen`
- **Input style:** Bottom-border only, inline with submit button
- **Animation:** Subtle fade in. On submit: button text morphs to checkmark with "Welcome" message
- **Interaction:** Email validation inline, success state replaces entire section with thank-you message

### Section 8: FOOTER
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  GOD IS KIND                                    │
│                                                 │
│  SHOP          THE STORY        HELP            │
│  Utility       About            Contact         │
│  Align         Founder          Shipping        │
│  Panel         Craft            Returns         │
│  All           Philosophy       Trade Program   │
│                                                 │
│  JOURNAL       SUSTAINABILITY   CONNECT         │
│  Design        Our Promise      Instagram       │
│  Living        Materials        Pinterest       │
│  Sacred        Impact           LinkedIn        │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  © 2025 God Is Kind. All rights reserved.       │
│  Privacy  ·  Terms  ·  Sitemap                  │
│                                                 │
│  Designed in India. Crafted with intention.      │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Layout:** 6-column grid (3 on mobile)
- **Background:** `--gik-void` (black), text in `--gik-canvas`
- **Typography:** Links in Inter Regular, section heads in uppercase caption style
- **Footer tagline:** "Designed in India. Crafted with intention." in Cormorant Garamond italic
- **Interaction:** Links have underline-slide-in hover effect

---

## 3.2 SHOP PAGE (/shop)

The shop page must feel like browsing a curated gallery, not scrolling through a marketplace.

### Header Area
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  SHOP                                           │
│  "Objects of intention"                         │
│                                                 │
│  [All]  [Utility™]  [Align™]  [Panel™]  [Limited]│
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Category pills:** Horizontal scrollable on mobile, text-only tabs (active = underline) on desktop
- **Active state:** Underline slides to active tab with 300ms ease

### Filter & Sort Bar
```
┌─────────────────────────────────────────────────┐
│  Filter ▾          Sort: Newest ▾     48 items  │
└─────────────────────────────────────────────────┘
```
- **Filters (slide-in panel from left on mobile, dropdown on desktop):**
  - Category (checkboxes)
  - Price range (custom slider, not native)
  - Material (checkboxes)
  - Availability (In stock / All)
- **Sort options:** Newest, Price: Low → High, Price: High → Low, Bestselling
- **Interaction:** Filters apply instantly with layout animation (items reflow with 400ms stagger)

### Product Grid
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │          │  │          │  │          │      │
│  │ [Image]  │  │ [Image]  │  │ [Image]  │      │
│  │          │  │          │  │          │      │
│  ├──────────┤  ├──────────┤  ├──────────┤      │
│  │ Name     │  │ Name     │  │ Name     │      │
│  │ ₹X,XXX  │  │ ₹X,XXX  │  │ ₹X,XXX  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │          │  │          │  │          │      │
│  │ [Image]  │  │ [Image]  │  │ [Image]  │      │
│  │          │  │          │  │          │      │
│  ├──────────┤  ├──────────┤  ├──────────┤      │
│  │ Name     │  │ Name     │  │ Name     │      │
│  │ ₹X,XXX  │  │ ₹X,XXX  │  │ ₹X,XXX  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                 │
│           [ Load More ]                         │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Grid:** 3 columns desktop, 2 columns tablet, 1 column mobile (with large images)
- **Card style:** No borders, no shadows, no rounded corners
- **Image ratio:** 4:5 (portrait, product-centric)
- **Card content:** Product name (Inter Medium), Price (Inter Regular), Category tag (caption style, uppercase)
- **Hover effects:**
  1. Image swaps to alternate angle (crossfade 400ms)
  2. Subtle "Quick View" text fades in at image bottom
  3. Product name color transitions to `--gik-earth`
- **Pagination:** "Load More" button (not infinite scroll — preserves footer and intentional browsing)
- **Animation:** Products fade in with stagger on initial load and filter changes

### Category Pages (/shop/utility, /shop/align, /shop/panel)
- Same grid layout as main shop
- **Hero banner at top:** Full-width editorial image specific to category with:
  - Category name (large display text)
  - One-line category philosophy
  - Example: GIK Align™ → "Sacred objects for the conscious home"
- **Category accent color** subtly appears in active filter states and hover accents

---

## 3.3 PRODUCT DETAIL PAGE (/shop/{category}/{slug})

The PDP is the most critical revenue page. It must feel like reading a luxury magazine feature, not a product listing.

### Section 1: Product Hero
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ┌────────────────────┐  PRODUCT NAME           │
│  │                    │  Category™               │
│  │                    │                         │
│  │   [Main Product    │  "Brief poetic line      │
│  │    Image]          │   about this object"     │
│  │                    │                         │
│  │                    │  ₹12,500                 │
│  │                    │  Tax included. Free ship. │
│  │                    │                         │
│  │                    │  Qty: [ - 1 + ]          │
│  │                    │                         │
│  │                    │  [ ADD TO CART ]          │
│  │                    │                         │
│  ├────────────────────┤  ♡ Save  ↗ Share         │
│  │ ○  ○  ○  ○        │                         │
│  └────────────────────┘  SKU: GIK-UTL-0042      │
│                          Est. Delivery: 5-7 days │
│                          In Stock ●              │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Layout:** 55% image gallery left, 45% product info right (sticky on scroll)
- **Image gallery:**
  - Main image with zoom on hover (lens-style or full-image zoom)
  - Thumbnail strip below (4-6 images)
  - Swipe on mobile
  - Images: product on surface, product in context, material detail, dimensions overlay
- **Product info (sticky on desktop):**
  - Category label (uppercase caption)
  - Product name (Cormorant Garamond, `--text-h2`)
  - Poetic one-liner (italic Cormorant)
  - Price (Inter Medium, large)
  - Tax/shipping note (caption, muted)
  - Quantity selector (minimal +/- buttons)
  - Add to Cart (primary button, full width in info column)
  - Wishlist heart + Share icons
  - SKU, delivery estimate, stock status
- **Animation:** Info content fades in with 150ms stagger. "Add to Cart" has micro-animation on click (button compresses, text morphs to checkmark, then reverts).

### Section 2: Material Story
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  THE MATERIAL                                   │
│                                                 │
│  ┌──────────────┐  This piece is crafted from   │
│  │              │  100% post-consumer recycled   │
│  │  [Macro      │  teak wood, sourced from       │
│  │   texture    │  decommissioned furniture in   │
│  │   image]     │  South India.                  │
│  │              │                               │
│  └──────────────┘  Every grain tells a story of  │
│                    a past life, reborn with       │
│                    intention.                     │
│                                                 │
│  Material: Recycled Teak                         │
│  Origin: South India                             │
│  Process: Hand-sanded, natural oil finish        │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Layout:** 50/50 split, alternating image/text
- **Content:** Material macro photography + storytelling prose + specs
- **Animation:** Image parallax on scroll, text fades in

### Section 3: Dimensions & Details
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  DIMENSIONS                                     │
│                                                 │
│       ┌─────────────────┐                       │
│       │                 │  Length: 45 cm         │
│       │  [Technical     │  Width:  30 cm         │
│       │   drawing or    │  Height: 12 cm         │
│       │   clean photo   │  Weight: 2.4 kg        │
│       │   with dims]    │                       │
│       │                 │  Package: Recycled      │
│       └─────────────────┘  kraft box              │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Layout:** Clean technical illustration or annotated product photo
- **Style:** Minimal line drawing aesthetic, dimensions called out with thin leader lines

### Section 4: Spiritual/Sustainability Narrative (Conditional)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │  THE SACRED SIGNIFICANCE                │    │
│  │                                         │    │
│  │  In Vaastu Shastra, [object] placed     │    │
│  │  in the [direction] brings [benefit].   │    │
│  │                                         │    │
│  │  This piece has been designed to         │    │
│  │  harmonize with the energy of your      │    │
│  │  living space.                           │    │
│  │                                         │    │
│  │  Recommended placement: North-East       │    │
│  │  Best for: Meditation room, entrance    │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Conditional:** Only appears for GIK Align™ products
- **Background:** `--gik-linen` with subtle sacred geometry watermark
- **Style:** Reverent, informational, not preachy

### Section 5: Delivery & Care
- Expandable accordion sections:
  - **Shipping & Delivery** — Estimated timeline, free shipping threshold
  - **Care Instructions** — How to maintain the product
  - **Return Policy** — 7-day return window, conditions

### Section 6: Related Products
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  YOU MAY ALSO APPRECIATE                        │
│                                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │      │  │      │  │      │  │      │       │
│  │[Img] │  │[Img] │  │[Img] │  │[Img] │       │
│  │      │  │      │  │      │  │      │       │
│  ├──────┤  ├──────┤  ├──────┤  ├──────┤       │
│  │Name  │  │Name  │  │Name  │  │Name  │       │
│  │Price │  │Price │  │Price │  │Price │       │
│  └──────┘  └──────┘  └──────┘  └──────┘       │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Layout:** 4-column horizontal scroll
- **Title:** "You May Also Appreciate" (not "Related Products" — language matters)
- **Interaction:** Same hover behavior as shop grid

---

## 3.4 CART PAGE (/cart)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  YOUR SELECTION                                 │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ [Img]  Product Name       Qty  ₹12,500   │  │
│  │        Category™ · SKU    [-1+]  Remove   │  │
│  ├───────────────────────────────────────────┤  │
│  │ [Img]  Product Name       Qty  ₹8,200    │  │
│  │        Category™ · SKU    [-1+]  Remove   │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────┐                        │
│  │ Coupon code   Apply │                        │
│  └─────────────────────┘                        │
│                                                 │
│  Subtotal:           ₹20,700                    │
│  Shipping:           Complimentary               │
│  GST (18%):          ₹3,726                     │
│  ──────────────────────────────                  │
│  Total:              ₹24,426                    │
│                                                 │
│  [ PROCEED TO CHECKOUT ]                        │
│                                                 │
│  [ Continue Shopping → ]                        │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Title:** "Your Selection" (not "Cart" — elevate the language)
- **Layout:** Clean list view, not a table
- **Interaction:** Quantity changes animate the price. Remove slides item out with 300ms ease.
- **Empty state:** Beautiful illustration + "Your selection is empty. Begin exploring." with CTA to shop.
- **Animation:** Price updates with counting animation

---

## 3.5 CHECKOUT PAGE (/checkout)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  CHECKOUT                                       │
│                                                 │
│  ┌─────────────────────┐ ┌───────────────────┐  │
│  │                     │ │ ORDER SUMMARY     │  │
│  │ ① INFORMATION       │ │                   │  │
│  │   Email             │ │ [img] Item  ₹XXX  │  │
│  │   Phone             │ │ [img] Item  ₹XXX  │  │
│  │                     │ │                   │  │
│  │ ② SHIPPING          │ │ Subtotal   ₹XXX  │  │
│  │   Full name         │ │ Shipping   Free   │  │
│  │   Address           │ │ GST        ₹XXX  │  │
│  │   City, State, PIN  │ │ ─────────────────│  │
│  │                     │ │ Total      ₹XXX  │  │
│  │ ③ PAYMENT           │ │                   │  │
│  │   ○ UPI             │ └───────────────────┘  │
│  │   ○ Card            │                        │
│  │   ○ Net Banking     │                        │
│  │   ○ Wallet          │                        │
│  │                     │                        │
│  │ [ PLACE ORDER ]     │                        │
│  │                     │                        │
│  └─────────────────────┘                        │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Layout:** 60/40 split — form left, order summary right (summary sticky)
- **Guest checkout:** Enabled by default, account creation optional post-purchase
- **Progress:** Numbered steps (①②③), not a progress bar
- **Form style:** Bottom-border inputs, floating labels, inline validation
- **Payment:** Razorpay integration with UPI, Card, Net Banking, Wallet options
- **Animation:** Smooth step transitions, order summary updates live
- **Trust signals:** SSL badge, secure payment text, return policy reminder (all subtle, never cluttering)
- **Confirmation page:** Full-screen thank you with order details, animated checkmark, "What to expect" timeline

---

## 3.6 ABOUT / THE STORY (/story/about)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  [Full-bleed cinematic image of workshop]       │
│                                                 │
│  THE GIK STORY                                  │
│                                                 │
└─────────────────────────────────────────────────┘
│                                                 │
│    "We believe that every discarded material     │
│     holds the potential for beauty."             │
│                                                 │
│    [Long-form editorial narrative — origin       │
│     story, mission, values, told in elegant      │
│     prose with interspersed full-width images]   │
│                                                 │
│    ┌─────────────────────────────────────┐       │
│    │  [Image: Artisan at work]           │       │
│    └─────────────────────────────────────┘       │
│                                                 │
│    [Continued narrative...]                      │
│                                                 │
│    OUR VALUES                                    │
│    ┌────────┐  ┌────────┐  ┌────────┐           │
│    │Kindness│  │Sustain.│  │Sacred  │           │
│    │        │  │        │  │Craft   │           │
│    └────────┘  └────────┘  └────────┘           │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Style:** Long-form editorial, magazine feature layout
- **Scroll:** Parallax images, text reveals on scroll
- **Typography:** Generous use of Cormorant Garamond for narrative, Inter for factual content

---

## 3.7 SUSTAINABILITY PAGE (/sustainability)

### Material Journey Section (Interactive)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  THE JOURNEY OF A MATERIAL                      │
│                                                 │
│  ○─────────○─────────○─────────○─────────○      │
│  Source    Collect   Process   Craft     You     │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │  [Animated illustration/photo of        │    │
│  │   current step in the journey]          │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  "Discarded furniture from South Indian homes   │
│   begins its journey at our collection centers." │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Interaction:** Scroll-driven timeline — each scroll step advances the material journey
- **Visuals:** Each step has a dedicated image/illustration that crossfades
- **Impact numbers:** Animated counters throughout
- **Download:** Option to download the full sustainability report (PDF)

---

## 3.8 JOURNAL / BLOG (/journal)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  THE GIK JOURNAL                                │
│                                                 │
│  [Design]  [Living]  [Sustainability]  [Sacred] │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │  [Full-width featured article image]    │    │
│  │                                         │    │
│  │  CATEGORY · 8 MIN READ                  │    │
│  │  Article Title Goes Here                │    │
│  │  Brief excerpt text...                  │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ [Image]  │  │ [Image]  │  │ [Image]  │      │
│  │ Category │  │ Category │  │ Category │      │
│  │ Title    │  │ Title    │  │ Title    │      │
│  │ Excerpt  │  │ Excerpt  │  │ Excerpt  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Layout:** Featured article hero + 3-column grid below
- **Categories:** Horizontal text tabs with animated underline
- **Article pages:** Long-form editorial with pull quotes, full-bleed images, and related articles
- **Read time:** Displayed on each card
- **Style:** Kinfolk/Cereal magazine aesthetic

---

## 3.9 CONTACT (/contact)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  GET IN TOUCH                                   │
│                                                 │
│  ┌────────────────────┐  GENERAL INQUIRIES      │
│  │                    │  hello@godiskind.in      │
│  │  Name              │                         │
│  │  _______________   │  TRADE PROGRAM           │
│  │                    │  trade@godiskind.in      │
│  │  Email             │                         │
│  │  _______________   │  CUSTOM ORDERS           │
│  │                    │  custom@godiskind.in     │
│  │  Subject           │                         │
│  │  _______________   │  FOLLOW US               │
│  │                    │  Instagram               │
│  │  Message           │  Pinterest               │
│  │  _______________   │  LinkedIn                │
│  │  _______________   │                         │
│  │                    │                         │
│  │  [ SEND MESSAGE ]  │                         │
│  │                    │                         │
│  └────────────────────┘                         │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Layout:** 60/40 — form left, contact details right
- **Style:** Minimal form, bottom-border inputs
- **Confirmation:** Inline success message with animated checkmark

---

## 3.10 ACCOUNT (/account)

- **Login:** Minimal — email + password, or OTP login
- **Register:** Name, email, phone, password — single column
- **Dashboard:** Clean sidebar navigation
  - Orders (list with status badges)
  - Addresses (card-based management)
  - Wishlist (grid identical to shop)
  - Profile settings
- **Style:** Functional but maintaining the brand's minimal aesthetic

---

## 3.11 TRADE PROGRAM (/trade)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  [Full-bleed image: Luxury interior project]    │
│                                                 │
│  THE GIK TRADE PROGRAM                          │
│  For Architects & Interior Designers            │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  BENEFITS                                       │
│  • Trade pricing (20% below retail)             │
│  • Priority access to new collections           │
│  • Custom order capabilities                    │
│  • Dedicated account manager                    │
│  • Project consultation                         │
│                                                 │
│  [ APPLY FOR TRADE ACCESS ]                     │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Purpose:** Attract architects and interior designers
- **Application form:** Company, portfolio link, project type, annual volume
- **Style:** Premium, exclusive — feels like joining a private club

---

# 4. UNIQUE PREMIUM FEATURES

## 4.1 Interactive Material Journey
- Scroll-driven storytelling experience showing how a recycled material transforms into a GIK product
- 5 stages: Source → Collection → Processing → Crafting → Your Home
- Each stage has macro photography, narrative text, and ambient sound (optional)
- Located on Sustainability page and embedded in select PDP pages

## 4.2 Spiritual Alignment Guide (GIK Align™)
- Interactive quiz: "Find Your Sacred Object"
- 5-7 questions about home layout, life goals, preferred energy, room purpose
- Based on Vaastu Shastra principles
- Output: Personalized product recommendations with placement guidance
- Shareable result card ("Your Sacred Profile")
- Drives engagement and reduces decision paralysis for spiritual products

## 4.3 Room Visualizer (Phase 2 — Future)
- Upload a photo of your room
- AR/AI overlay of GIK products in the space
- Adjustable positioning and scaling
- Save and share configurations
- Technology: WebAR or Three.js-based

## 4.4 The Founder's Letter
- Monthly handwritten-style letter from the founder
- Displayed as an elegant scroll/card on the homepage (rotated monthly)
- Archive accessible in The Story section
- Creates personal connection with the brand

## 4.5 Limited Edition Drops
- Dedicated section with countdown timer (designed elegantly, not like a flash sale)
- "Notify Me" functionality for upcoming drops
- Each drop has its own editorial landing page with the creation story
- Shows edition number (e.g., "23 of 50")
- Creates scarcity and exclusivity

## 4.6 Designer Collaboration Pages
- Template for featuring guest designer/artist collaborations
- Full editorial layout: designer bio, inspiration, process, collection
- Joint branding (GIK × Designer Name)
- Limited availability with unique packaging story

## 4.7 "The Making Of" Video Segments
- Short (30-60 sec) cinematic videos embedded in product pages
- Shows the artisan crafting the specific product
- Autoplay on scroll (muted), click to unmute
- Reinforces the handmade, sustainable narrative

## 4.8 Gift Curation Service
- "Curate a Gift" feature
- Select occasion, budget, recipient's taste
- AI/manual curation of a gift set with luxury packaging
- Add a personalized message
- Premium checkout flow with gift wrapping option

---

# 5. MOTION & INTERACTION SYSTEM

## 5.1 Core Animation Principles
- **Intention:** Every animation must serve a purpose — guide, inform, or delight
- **Restraint:** Animations should be felt, not noticed. If you can describe the animation, it's too much.
- **Fluidity:** Use cubic-bezier easing curves, never linear. Default: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- **Duration scale:** Micro (150ms) → Standard (300ms) → Emphasis (500ms) → Cinematic (800ms+)

## 5.2 Page Transitions
- **Between pages:** Smooth fade with slight upward shift (opacity 0→1, translateY 20px→0, 400ms)
- **Shop filter changes:** Items fade out (200ms), reflow, fade in with stagger (300ms + 50ms per item)
- **Product page entry:** Image expands from grid position to full PDP layout (shared element transition)

## 5.3 Hover States
- **Product cards:** Image crossfades to alt image, card lifts 4px with soft shadow
- **Buttons:** Background color shifts with 300ms ease, slight scale (1.01x)
- **Navigation links:** Underline slides in from left (width 0→100%, 250ms)
- **Ghost buttons:** Underline offset animates from 8px to 4px
- **Cards:** translateY(-4px), subtle box-shadow appears (0 8px 32px rgba(0,0,0,0.06))

## 5.4 Scroll Animations
- **Text reveals:** Elements fade up (translateY 30px→0, opacity 0→1) when entering viewport
- **Image parallax:** Background images translate at 0.85x scroll speed
- **Number counters:** Count from 0 to target with easeOutExpo over 1.5s
- **Stagger groups:** Each child element delays 80-120ms after previous
- **Hero parallax:** Hero image scales from 1.0 to 0.95 as you scroll past

## 5.5 Microinteractions
- **Add to Cart:** Button compresses (scaleX 0.95), text fades to checkmark icon, expands back. Cart icon in nav shows +1 badge with bounce.
- **Wishlist heart:** Outline → filled with 300ms scale bounce (1.0 → 1.3 → 1.0)
- **Quantity selector:** Number rolls up/down (slot machine effect)
- **Form inputs:** Label floats up on focus with color change. Bottom border transitions from stone to void.
- **Newsletter submit:** Button text morphs to "Welcome to GIK" with confetti-free elegance (checkmark + text change)
- **Share button:** Minimal popover with icon row, smooth scale-in

## 5.6 Loading Animation
- **Initial page load:** "GIK" monogram fades in center screen, then expands outward as content loads behind
- **Image placeholders:** Shimmer effect in `--gik-linen` color (not gray — stays on-brand)
- **Route transitions:** Thin progress bar at very top of page in `--gik-earth` color
- **Product images:** Blur-up technique (tiny blurred placeholder → sharp image loads in)

## 5.7 Add-to-Cart Animation
```
Step 1: Button press → scale to 0.95 (100ms)
Step 2: Button text fades out (150ms)
Step 3: Checkmark icon fades in + button scales to 1.0 (200ms)
Step 4: Text changes to "Added" (holds 800ms)
Step 5: Reverts to "Add to Cart" (300ms fade)
Step 6: Nav cart icon receives subtle +1 badge bounce
```

---

# 6. DESIGN LANGUAGE RULES

## 6.1 Grid System
```
Desktop (1440px canvas):
  - 12-column grid
  - Column width: 72px
  - Gutter: 24px
  - Margins: 80px (left/right)
  - Content max-width: 1280px

Tablet (768px):
  - 8-column grid
  - Gutter: 20px
  - Margins: 40px

Mobile (375px):
  - 4-column grid
  - Gutter: 16px
  - Margins: 20px
```

## 6.2 Spacing Scale
```
--space-xs:   4px
--space-sm:   8px
--space-md:   16px
--space-lg:   24px
--space-xl:   32px
--space-2xl:  48px
--space-3xl:  64px
--space-4xl:  96px
--space-5xl:  128px
--space-6xl:  200px   (section padding)
--space-hero: 240px+  (hero sections)
```
**Rule:** Minimum section padding is `--space-4xl` (96px). Hero sections use `--space-hero`. Never go below `--space-lg` for internal component padding.

## 6.3 Buttons
| Type | Height | Padding | Font | Radius | Style |
|------|--------|---------|------|--------|-------|
| Primary | 56px | 32px horizontal | Inter 12px uppercase, +0.15em tracking | 0 | Black fill, white text |
| Secondary | 56px | 32px horizontal | Inter 12px uppercase, +0.15em tracking | 0 | Transparent, 1px border |
| Ghost | auto | 0 | Inter 14px, normal case | 0 | Text + animated underline |
| Small | 40px | 20px horizontal | Inter 11px uppercase | 0 | Same styles as above |

**Rule:** Maximum one primary button per viewport. Never stack two primary buttons.

## 6.4 Cards
- **Product card:** No border, no shadow, no radius. Image (4:5) + Name + Price. Padding: 0 external, 16px between image and text.
- **Editorial card:** No border, no shadow. Image (16:9 or 3:4) + Category tag + Title + Excerpt. 24px internal spacing.
- **Feature card:** `--gik-linen` background, 48px padding, icon or number + heading + description.

**Rule:** Cards never have border-radius. Cards never have drop shadows in rest state (only on hover, and only subtle: `0 8px 32px rgba(0,0,0,0.06)`).

## 6.5 Imagery Rules
- Product images: Always on neutral surface (stone, linen, concrete, wood). Never white background. Never lifestyle-cluttered.
- Lifestyle images: Minimal interiors only. Max 2 objects in frame. Natural lighting.
- All images must be optimized: WebP format, responsive srcset, lazy loading.
- Maximum image weight: 200KB for thumbnails, 500KB for hero images.
- Aspect ratios are sacred — never stretch, never crop arbitrarily.

## 6.6 Icons
- **Style:** Custom line icons, 1.5px stroke, rounded caps
- **Size:** 20px (small), 24px (default), 32px (large)
- **Color:** Always `--gik-void` or `--gik-stone`
- **Usage:** Sparingly — only for functional UI (cart, search, menu, heart, share, close)
- **No decorative icons.** The brand speaks through typography and imagery, not iconography.

## 6.7 Navigation
### Desktop
```
┌─────────────────────────────────────────────────┐
│  GIK          Shop  Story  Journal     🔍 ♡ 🛒  │
└─────────────────────────────────────────────────┘
```
- **Left:** Brand wordmark "GIK" in spaced uppercase
- **Center:** Main navigation links (max 4)
- **Right:** Search, Wishlist, Cart icons
- **Behavior:** Transparent on hero, becomes `--gik-canvas` with backdrop blur on scroll
- **Height:** 72px desktop, 56px mobile
- **Position:** Fixed top

### Mobile
- Hamburger icon (custom: two horizontal lines, not three)
- Opens full-screen overlay with black background
- Navigation links stagger in from left (Cormorant Garamond, large)
- Secondary links and social at bottom

---

# 7. MOBILE EXPERIENCE STRATEGY

## 7.1 Philosophy
Mobile is not a scaled-down desktop — it's the **primary** experience. 70%+ of traffic will be mobile. The luxury feel must be preserved through:

## 7.2 Key Mobile Adaptations

### Touch-Optimized Targets
- All tappable elements: minimum 48px × 48px
- Generous padding around interactive elements
- Swipe gestures for image galleries (not just dots)

### Navigation
- Two-line hamburger → full-screen overlay
- Sticky bottom bar for key actions on PDP: [Add to Cart] always visible
- Back-to-top: subtle, appears after 2 screen-lengths of scroll

### Product Grid
- Single column with large images (80% viewport width)
- Horizontal scroll for "Related Products" sections
- Pull-to-refresh on shop pages

### Typography
- Headlines scale down but remain impactful (clamp values ensure this)
- Body text remains 16px minimum (never smaller for readability)
- Generous line-height maintained

### Imagery
- Full-bleed images on mobile (no margins on hero sections)
- Image galleries: swipe with haptic feedback indication
- Lazy loading with blur-up placeholders

### Performance
- Critical CSS inlined for above-the-fold content
- Images served at appropriate resolution (no 2x images on slow connections)
- Skeleton screens match brand colors (`--gik-linen` shimmer)
- Target: Lighthouse score 90+ on mobile

### Gestures
- Swipe left/right: Image galleries
- Pull down: Refresh product listings
- Long press: Quick add to wishlist (with haptic)
- Pinch to zoom: Product detail images

### Bottom Sheet Pattern
- Cart preview: slides up from bottom
- Filter panel: slides up from bottom
- Share options: slides up from bottom
- Replaces modals and dropdowns for mobile

---

# 8. ADMIN / CMS EDITABLE AREAS

## 8.1 Homepage
| Section | Editable Fields |
|---------|----------------|
| Hero Banner | Image/video, headline, subline, CTA text, CTA link |
| Philosophy Quote | Quote text, attribution |
| Featured Collections | Select 3 collections to feature, images auto-pulled |
| Featured Products | Select 2-3 hero products |
| Sustainability Numbers | 4 statistics (number + label each) |
| Journal Preview | Auto-pulled from latest, or manually pin articles |
| Newsletter | Heading text, description text |
| Founder's Letter | Letter text, date, signature image |

## 8.2 Shop & Products
| Area | Editable Fields |
|------|----------------|
| Category Banners | Hero image, title, tagline per category |
| Products | Title, SKU, price, discount price, description, material info, dimensions, images (up to 8), category, tags, stock, spiritual narrative (Align™), care instructions |
| Variants | Size, color, material variants with individual pricing/stock |
| Collections | Create/edit collections, assign products, set featured image |
| Limited Editions | Toggle limited status, set edition count, add countdown |

## 8.3 Content Pages
| Page | Editable Fields |
|------|----------------|
| About / Story | Full rich-text content, images, values section |
| Sustainability | Journey steps (image + text each), impact numbers |
| Journal Posts | Title, category, featured image, body (rich text), author, read time |
| Contact | Department emails, social links |
| Trade Program | Benefits list, application form fields |

## 8.4 Global Elements
| Element | Editable Fields |
|---------|----------------|
| Navigation | Menu items, links, order |
| Footer | Column links, tagline, social links |
| Announcement Bar | Toggle on/off, message text, link |
| SEO | Meta title, description, OG image per page |
| Policies | Shipping, returns, privacy, terms (rich text) |

## 8.5 Marketing & Promotions
| Feature | Editable Fields |
|---------|----------------|
| Discount Codes | Code, type (% or flat), min order, expiry, usage limit |
| Banner Promotions | Show/hide promo bar, text, link |
| Email Templates | Order confirmation, shipping, welcome (basic customization) |

---

# 9. FUTURE SCALABILITY

## 9.1 Handling 5,000+ Products
- **Architecture:** Headless CMS + API-driven frontend ensures database can scale independently
- **Search:** Implement Algolia or Typesense for instant, faceted search across thousands of SKUs
- **Filtering:** Server-side filtering with URL-based state (shareable filtered views)
- **Pagination:** "Load More" with infinite scroll option, backed by cursor-based pagination
- **Image CDN:** All product images served via CDN (Cloudinary/imgix) with automatic format selection and responsive sizing

## 9.2 New Product Categories
- **Modular category template:** Each category uses the same structural template but with unique:
  - Hero image/video
  - Category accent color
  - Optional custom sections (e.g., spiritual narrative for Align™)
- **Adding a new category:** Create in admin → assign accent color → upload hero → products auto-populate
- **Subcategories:** Architecture supports nested categories (e.g., GIK Utility™ → Kitchen → Lighting)

## 9.3 International Expansion (Phase 2+)
- **Multi-currency:** Price stored in base currency (INR), converted at display time
- **Multi-language:** i18n-ready architecture from day one (all strings externalized)
- **Regional shipping:** Shipping rules engine supports zone-based rates
- **Tax compliance:** GST for India, VAT for EU, configurable per region

## 9.4 Technology Scalability
- **Frontend:** Component-based architecture (React/Next.js) — every UI element is a reusable component
- **Backend:** Modular microservices or serverless functions — payment, shipping, inventory, auth as separate services
- **Database:** PostgreSQL or MongoDB with read replicas for high traffic
- **Caching:** Redis layer for product catalog, session management
- **CDN:** Full static asset delivery via CloudFront or similar
- **Monitoring:** Application performance monitoring (APM) for proactive scaling

## 9.5 Feature Expansion Roadmap
| Phase | Features |
|-------|----------|
| Phase 1 (Launch) | Core ecommerce, 3 categories, journal, sustainability page |
| Phase 2 (3 months) | Spiritual alignment quiz, designer collaborations, gift curation |
| Phase 3 (6 months) | Mobile app, AR room visualizer, AI recommendations |
| Phase 4 (12 months) | Multi-language, international shipping, loyalty program |
| Phase 5 (18 months) | Marketplace (curated third-party artisans), subscription boxes |

## 9.6 Performance at Scale
- **Target metrics maintained at 5,000+ products:**
  - Page load: < 3s (first contentful paint < 1.5s)
  - Time to interactive: < 3.5s
  - Lighthouse Performance: 90+
  - Core Web Vitals: All green
- **Strategies:**
  - Static generation for product pages (ISR — regenerate on update)
  - Edge caching for API responses
  - Image optimization pipeline (auto WebP/AVIF, responsive srcset)
  - Code splitting per route
  - Prefetching for likely next pages

---

# 10. IMPLEMENTATION NOTES

## 10.1 Recommended Tech Stack
| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | **Next.js 14+ (App Router)** | SSR/SSG, ISR, excellent DX, React ecosystem |
| Styling | **Tailwind CSS** | Utility-first, consistent spacing, responsive |
| Animation | **Framer Motion** | Production-ready React animations |
| CMS | **Sanity** or **Strapi** | Headless, customizable, real-time preview |
| Database | **PostgreSQL** (via Supabase or PlanetScale) | Relational, scalable, well-supported |
| Auth | **NextAuth.js** or **Clerk** | OAuth + credential auth, session management |
| Payments | **Razorpay** | Indian market support, UPI, all payment modes |
| Shipping | **Shiprocket API** | Indian logistics, auto AWB, tracking |
| Search | **Algolia** or **Typesense** | Instant search, faceted filtering |
| Image CDN | **Cloudinary** | Auto-optimization, transformations, responsive |
| Hosting | **Vercel** | Edge deployment, excellent Next.js support |
| Email | **Resend** or **Mailchimp** | Transactional + marketing emails |
| Analytics | **Google Analytics 4 + Meta Pixel** | As specified in BRD |
| Monitoring | **Vercel Analytics + Sentry** | Performance + error tracking |

## 10.2 File Structure (Suggested)
```
/app
  /(shop)
    /shop/page.tsx
    /shop/[category]/page.tsx
    /shop/[category]/[slug]/page.tsx
  /(content)
    /story/page.tsx
    /sustainability/page.tsx
    /journal/page.tsx
    /journal/[slug]/page.tsx
  /(account)
    /account/page.tsx
    /cart/page.tsx
    /checkout/page.tsx
  /layout.tsx
  /page.tsx (home)
/components
  /ui (buttons, inputs, cards, etc.)
  /layout (nav, footer, grid)
  /shop (product card, filters, etc.)
  /home (hero, featured, etc.)
/lib
  /api (API route handlers)
  /db (database queries)
  /utils (helpers)
/styles
  /globals.css (Tailwind + custom properties)
```

---

# APPENDIX A: LANGUAGE & TONE GUIDE

The words used on the website are as important as the design.

| Instead of... | Use... |
|---------------|--------|
| Cart | Your Selection |
| Related Products | You May Also Appreciate |
| Add to Cart | Add to Selection |
| Subscribe | Join the Community |
| Blog | The Journal |
| About Us | The Story |
| Best Sellers | Most Loved |
| New Arrivals | Just Arrived |
| Sale | A Considered Offering |
| Contact Us | Get in Touch |
| FAQ | Common Questions |
| Free Shipping | Complimentary Delivery |
| Reviews | Stories from Our Community |
| Filter | Refine |
| Sort | Arrange |
| Out of Stock | Currently Unavailable — Notify Me |
| Buy Now | Make It Yours |

---

# APPENDIX B: ACCESSIBILITY REQUIREMENTS

- WCAG 2.1 AA compliance minimum
- All images have descriptive alt text
- Color contrast ratios: 4.5:1 for body text, 3:1 for large text
- Keyboard navigation support for all interactive elements
- Focus states: visible, on-brand (2px `--gik-earth` outline, 4px offset)
- Screen reader landmarks and ARIA labels
- Reduced motion: respect `prefers-reduced-motion` — disable parallax and complex animations
- Font sizes never below 14px

---

*This document serves as the complete design system and experience blueprint for the GOD IS KIND (GIK) website. Every design decision, interaction, and page structure defined here should create a cohesive, luxury digital experience that reflects the brand's values of sustainability, spirituality, and sacred minimalism.*

**Designed with intention. Every pixel matters.**
