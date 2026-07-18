---
name: License Sathi Core
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#5c3f3f'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#916f6e'
  outline-variant: '#e6bdbc'
  surface-tint: '#bf0030'
  primary: '#b1002c'
  on-primary: '#ffffff'
  primary-container: '#dc143c'
  on-primary-container: '#fff1f0'
  inverse-primary: '#ffb3b3'
  secondary: '#335ab4'
  on-secondary: '#ffffff'
  secondary-container: '#7da0ff'
  on-secondary-container: '#003387'
  tertiary: '#705d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9a900'
  on-tertiary-container: '#4c3f00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad9'
  primary-fixed-dim: '#ffb3b3'
  on-primary-fixed: '#40000a'
  on-primary-fixed-variant: '#920022'
  secondary-fixed: '#dae1ff'
  secondary-fixed-dim: '#b3c5ff'
  on-secondary-fixed: '#001849'
  on-secondary-fixed-variant: '#12419b'
  tertiary-fixed: '#ffe16d'
  tertiary-fixed-dim: '#e9c400'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#544600'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style
The design system is built on the pillars of **Authority, Accessibility, and Encouragement**. As a preparation tool for the Nepal Driving License exam, the UI must feel as official as a government resource while remaining as approachable as a personal tutor.

The style is **Corporate Modern with a Mobile-First focus**. It leverages generous whitespace and a structured grid to reduce cognitive load during study sessions. The visual narrative balances the gravity of the national colors—Crimson and Royal Blue—with a clean, utility-driven interface that ensures users from various digital literacy backgrounds can navigate the exam simulations with confidence.

## Colors
The palette is rooted in the heritage of Nepal, utilizing **Crimson Red** (Primary) for critical actions and brand presence, and **Royal Blue** (Secondary) for navigational elements and links to evoke stability.

- **Primary (Crimson):** Used for primary buttons, branding, and highlighting "Question of the Day."
- **Secondary (Royal Blue):** Used for secondary actions, progress tracking, and information headers.
- **Success/Pass:** A distinct emerald green used for correct answers and "Pass" status results.
- **Error/Fail:** A high-visibility red (distinct from the brand Crimson) used for incorrect answers and "Fail" alerts.
- **Neutral:** A range of slate grays to provide depth and ensure text contrast meets WCAG AA standards.

## Typography
The typography system is designed for dual-script harmony. **Plus Jakarta Sans** provides a modern, geometric feel for headlines that remains legible in both English and Devanagari titles. **Inter** is utilized for body text and exam questions due to its exceptional legibility at small sizes and neutral tone.

- **Legibility:** Maintain a minimum body size of 16px to accommodate users studying on various mobile device qualities.
- **Line Height:** Increased line-height (1.5x for body) is mandatory to prevent crowding when Devanagari script (with its top bars and vowel markers) is used.
- **Weights:** Use Semi-Bold (600) for interactive labels and Medium (500) for sub-headers to create a clear information hierarchy.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for handheld use. A 4px baseline grid ensures consistent vertical rhythm across different mobile screen heights.

- **Mobile (Default):** 4-column grid with 20px side margins. Most exam questions should be housed in a single-column container to maximize focus.
- **Tablet:** 8-column grid with 32px margins. Use side panels for progress tracking while the main content remains centered.
- **Touch Targets:** All interactive elements must maintain a minimum height of 48px to ensure accessibility for all age groups.

## Elevation & Depth
Depth in this design system is used to signify "interactivity" and "focus." It utilizes **Tonal Layers** and **Ambient Shadows** to keep the interface feeling light and modern.

- **Level 0 (Base):** Used for the main background. Surface color: Slate-50.
- **Level 1 (Cards):** Used for exam questions and list items. Soft, 8% opacity black shadow with a 4px blur and 2px Y-offset.
- **Level 2 (Active/Floating):** Used for floating action buttons (like "Submit Exam") and active modals. 12% opacity black shadow with a 12px blur and 6px Y-offset.
- **Inner Depth:** Use a subtle 1px gray-200 border for cards to maintain definition on high-brightness screens.

## Shapes
The shape language uses a **Rounded** philosophy to soften the "official" nature of the app and reduce user anxiety during exam prep.

- **Standard Components:** Buttons, input fields, and small cards use a 12px radius (`rounded-md`).
- **Containers:** Large content blocks and exam modal sheets use a 24px top-radius (`rounded-xl`).
- **Success/Fail Indicators:** Progress bars and status chips use fully rounded (pill-shaped) ends to differentiate them from interactive buttons.

## Components

### Buttons
- **Primary:** Crimson Red background with White text. Bold, 16px text. 12px corner radius.
- **Secondary:** Royal Blue outline with Royal Blue text. Used for "Previous Question" or "View Explanation."
- **Ghost:** Gray text, no border. Used for "Skip" or "Cancel."

### Exam Cards
Cards must feature a clear question header followed by vertically stacked answer options. Each answer option is a radio-style container with a 1px border that turns Royal Blue when selected.

### Progress Indicators
- **Linear Progress:** Used at the top of the exam screen to show completion.
- **Status Chips:** Small, pill-shaped labels (e.g., "Hard," "Medium," "Easy") using secondary color tints.

### Feedback States (Success/Error)
- **Success:** When a user passes a mock test, the screen utilizes a celebratory green background with a subtle confetti overlay.
- **Error:** For incorrect answers during practice, the correct option is highlighted in green, and the user's incorrect choice is highlighted in the Error red with a shake animation.

### Input Fields
Used for registration and search. Features a clear label, 12px corner radius, and a 2px Royal Blue border on focus to provide clear visual feedback.