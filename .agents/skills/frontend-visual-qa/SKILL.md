---
name: frontend-visual-qa
description: >-
  Rendered Frontend and Browser Output Visual QA Gate. Use this skill when auditing,
  verifying, or diagnosing visual rendering, responsive layouts (mobile, tablet, desktop),
  overflow/clipping issues, typography wrapping, touch target sizing, dark/light themes,
  and state/route transitions in web user interfaces.
---

# Frontend Visual QA (Rendered UI Quality Gate)

A specialized quality assurance protocol for auditing rendered frontend user interfaces, responsive layouts, and browser output.

## Core Philosophy: Audit-Only by Default

1. **Evidence Over Assumptions**: Verify actual rendered dimensions, viewport adaptations, DOM geometry, and visual hierarchy rather than guessing from source code alone.
2. **Comprehensive Viewport Testing**: Always audit across mobile (320px, 375px, 414px), tablet (768px), and desktop (1024px+) widths.
3. **Non-Destructive Diagnosis**: Identify root causes (CSS flex/grid constraints, overflow clipping, pointer-events deadzones) and present concrete, actionable fixes.

---

## 1. Visual QA Audit Checklist

### A. Layout & Responsiveness
- [ ] **Horizontal Overflow**: No unintended horizontal scrollbars or elements protruding outside the viewport.
- [ ] **Adaptive Navigation**: Top and bottom bars remain compact, fixed, and fit within safe-area boundaries (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
- [ ] **Flex/Grid Wrapping**: Flex containers have appropriate `flex-wrap` or `min-w-0` on flex children to prevent text overflow.
- [ ] **Dynamic Content Resizing**: Lists, cards, and modal dialogs resize gracefully across screen sizes from 320px to 1440px.

### B. Typography & Text Clipping
- [ ] **Text Truncation**: Text strings have `truncate` or `line-clamp-*` where intended, with clear fallback tooltips or accessible titles.
- [ ] **No Text Collision**: Numerical counters, badges, and button labels do not overlap adjacent icons or text.
- [ ] **Font Sizing**: Font scale remains legible on high-DPI mobile screens without requiring manual zoom.

### C. Touch, Interaction & Stacking Context
- [ ] **Touch Target Size**: Interactive buttons, chips, and icons meet minimum touch target recommendations (≥ 44x44px or padded touch zones).
- [ ] **Invisible Overlays**: No transparent or zero-opacity containers intercepting pointer events over underlying clickable controls (use `pointer-events-none` on overlay wrappers and `pointer-events-auto` on active children).
- [ ] **Z-Index Stacking Order**: Modals, slide-out sheets, floating action buttons (FAB), and fixed navigation bars maintain correct hierarchy without clipping underneath relative parents.

### D. Visual Polish & Themes
- [ ] **Theme Consistency**: Both Dark and Light theme palettes maintain compliant color contrast ratios (WCAG AA) for all text and iconography.
- [ ] **Pill & Card Styling**: Borders, glassmorphism backgrounds (`backdrop-blur`), and shadows render smoothly without visual banding.
- [ ] **Layout Shifts (CLS)**: Dynamic list changes, favorite toggles, and deletion transitions use smooth layout animations (e.g. Framer Motion `<motion.div layout>`) to avoid jarring scroll jumps.

---

## 2. Step-by-Step QA Execution Protocol

### Step 1: Baseline Verification
1. Verify the project builds cleanly:
   ```bash
   npm run build
   ```
2. Verify all automated unit/integration tests pass:
   ```bash
   npm run test
   ```

### Step 2: Responsive Viewport Inspection
Audit the target page across standard device profiles:
- **Ultra-Compact Mobile** (320px — e.g. Galaxy Fold outer screen)
- **Standard Mobile** (360px - 390px — e.g. iPhone SE, iPhone 14)
- **Large Mobile** (414px - 430px — e.g. iPhone 15 Pro Max)
- **Tablet / Desktop** (768px, 1024px, 1280px)

### Step 3: Interactive & State Flow Audit
- Test all interactive states: Normal, Hover, Active, Disabled, Loading (`<Loader2 animate-spin>`), and Empty states.
- Verify modals and drawers lock scroll properly and close cleanly without leaving phantom overlay backdrops.
- Test SPA navigation to confirm scroll positions reset to top (`window.scrollTo(0, 0)`) when switching tabs.

---

## 3. Standard Defect Report Template

When conducting a Visual QA review, format findings using this structure:

```markdown
### 🔍 Frontend Visual QA Report

**Scope**: [Page or Component Name]
**Tested Viewports**: [320px, 375px, 768px, 1280px]

#### Findings Summary:
- 🔴 **Blocker (P0)**: [e.g. Button unclickable due to overlay, content completely cut off]
- 🟡 **Layout / Visual (P1)**: [e.g. Element clipping on 360px width, text wrapping issue]
- 🟢 **Polish (P2)**: [e.g. Spacing adjustment, transition smoothness]

#### Defect Details & Root Cause:
- **Location**: `src/components/MyComponent.tsx:L45`
- **Symptom**: [What is visually broken]
- **Root Cause**: [Why it happens in CSS/DOM layout]
- **Recommended Fix**:
  ```tsx
  // Proposed CSS / Tailwind adjustments
  ```
```
