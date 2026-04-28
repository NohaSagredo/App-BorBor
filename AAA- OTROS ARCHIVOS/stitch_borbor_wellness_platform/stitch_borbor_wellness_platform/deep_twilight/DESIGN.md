---
name: Deep Twilight
colors:
  surface: '#141218'
  surface-dim: '#141218'
  surface-bright: '#3b383e'
  surface-container-lowest: '#0f0d13'
  surface-container-low: '#1d1b20'
  surface-container: '#211f24'
  surface-container-high: '#2b292f'
  surface-container-highest: '#36343a'
  on-surface: '#e6e0e9'
  on-surface-variant: '#cbc4d2'
  inverse-surface: '#e6e0e9'
  inverse-on-surface: '#322f35'
  outline: '#948e9c'
  outline-variant: '#494551'
  surface-tint: '#cfbcff'
  primary: '#cfbcff'
  on-primary: '#381e72'
  primary-container: '#6750a4'
  on-primary-container: '#e0d2ff'
  inverse-primary: '#6750a4'
  secondary: '#cdc0e9'
  on-secondary: '#342b4b'
  secondary-container: '#4d4465'
  on-secondary-container: '#bfb2da'
  tertiary: '#e7c365'
  on-tertiary: '#3e2e00'
  tertiary-container: '#c9a74d'
  on-tertiary-container: '#503d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#cfbcff'
  on-primary-fixed: '#22005d'
  on-primary-fixed-variant: '#4f378a'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#cdc0e9'
  on-secondary-fixed: '#1f1635'
  on-secondary-fixed-variant: '#4b4263'
  tertiary-fixed: '#ffdf93'
  tertiary-fixed-dim: '#e7c365'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#141218'
  on-background: '#e6e0e9'
  surface-variant: '#36343a'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is built on a "Deep Twilight" aesthetic, blending the precision of clinical health technology with the soothing, expansive atmosphere of a midnight sky. It targets a premium demographic seeking a holistic yet scientifically-backed approach to pelvic health.

The visual direction is **Glassmorphism**, characterized by translucent surfaces that appear to float over bioluminescent energy sources. The brand personality is:
- **Premium & Expensive:** High-contrast typography and generous negative space create a luxury feel.
- **Clinical yet Approachable:** Precise layouts and data visualizations are softened by organic glows and fluid animations.
- **Calming & High-Tech:** The dark color palette reduces eye strain, while neon accents suggest state-of-the-art biofeedback technology.

## Colors

The palette is centered on a deep obsidian and navy void, allowing the accent colors to appear "emissive" or self-illuminated. 

- **The Void:** Backgrounds utilize a subtle gradient from `#070A13` to `#0B0F19` to provide depth without pure black.
- **Bioluminescence:** Accent colors are paired by gender-specific profiles but follow the same luminosity rules. Use gradients (e.g., `accent_mujer_primary` to `accent_mujer_secondary`) for active states, progress rings, and data peaks.
- **The Glass:** All UI surfaces use varying degrees of white transparency. Never use solid gray for cards; always use translucent white with a backdrop blur.

## Typography

This design system leverages **Plus Jakarta Sans** for its modern, geometric clarity. The hierarchy relies on extreme contrast between large, tight-tracked headlines and spacious, legible body text.

- **Headlines:** Use Bold or ExtraBold weights. Tighten letter-spacing as font size increases to emphasize the "high-tech" premium feel.
- **Labels:** Use uppercase with increased tracking for secondary metadata or section headers to differentiate from body content.
- **Contrast:** Maintain high contrast by using pure white for primary content and a muted slate-blue (`#94A3B8`) for secondary information.

## Layout & Spacing

The layout follows a **fluid grid** model optimized for mobile-first interactions. It prioritizes vertical rhythm and "breathability" to evoke a sense of calm.

- **Rhythm:** All margins and paddings are multiples of 8px.
- **Container:** Standard horizontal safe-area is 24px.
- **Information Density:** Keep density low. Information should be grouped into discrete glass cards with at least 16px of separation between them to avoid visual clutter.

## Elevation & Depth

Depth is not communicated through traditional shadows, but through **light and blur**.

1.  **Z-Index 0 (Background):** Deep gradients with faint, large radial glows of accent colors (10% opacity) in the corners.
2.  **Z-Index 1 (Surfaces):** Glassmorphic cards with `backdrop-blur-xl` and a 1px border of `rgba(255,255,255,0.1)`.
3.  **Z-Index 2 (Interactive Elements):** Buttons and active chips. These should emit a "glow" using a multi-layered box-shadow: one sharp shadow for definition and one diffused, colored shadow to simulate light emission.
4.  **Animations:** Use "fluid" easing (e.g., `cubic-bezier(0.23, 1, 0.32, 1)`). Transitions between states should feel like light fading in or liquid moving, never abrupt.

## Shapes

The shape language is sophisticated and soft, moving away from sharp clinical angles toward organic, human-centric forms.

- **Primary Cards:** Use `rounded-xl` (24px) for main containers.
- **Buttons/Inputs:** Use `rounded-lg` (16px) to maintain a consistent language.
- **Interactive Indicators:** Small elements like progress dots or selection pips should be fully rounded (pill-shaped).
- **Icons:** Use thin-stroke (1.5px to 2px) icons with rounded caps to match the typography's softness.

## Components

- **Glass Cards:** The core container. Must have a subtle top-to-bottom linear gradient (white/08 to white/03) and a 1px border.
- **Action Buttons:** 
    - *Primary:* Filled with a gradient of the chosen accent color. Adds a 15px colored glow on hover/active.
    - *Secondary:* Glass background with white/10 border.
- **Training Rings:** For pelvic floor exercises, use thick-stroke circular progress bars with glowing tips to indicate tension and release.
- **Selection Chips:** Pill-shaped. Unselected: transparent with border. Selected: glows with the accent color.
- **Input Fields:** Minimalist. Only a bottom border or a very faint glass background. When focused, the border glows with the accent color.
- **Holistic Charts:** Data visualizations using smooth spline curves rather than jagged lines, with gradients filling the area beneath the curve.