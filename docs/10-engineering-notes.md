# Engineering Principles

## 1. Coin Economy Architecture
Habits generate coins (`🪙`), and the Reward Store consumes coins. The system is completely decouplable and extensible.

---

## 2. Store Reward CRUD & Local Image Storage
Store rewards support custom image uploads, converted into optimized Base64 Data URLs so images persist locally without external server dependencies.

---

## 3. Dynamic Multi-Theme System
Theme tokens are managed dynamically (Golden Arcade, Cyber Neon, Cozy Chocolate, Emerald, Sunset, Midnight) applying clean CSS variables and Tailwind classes.

---

## 4. Multiple Celebration Effects
Modular particle triggers (Confetti, Coin Shower, Fireworks, Starburst) allow personalized celebratory moments upon store purchases.

---

## 5. Mobile-First & AI-Friendly
Clean folder structure, TypeScript types, modular components, and self-documenting code.

---

## 6. Image Utilities & Distribution
- The app ships three browser-accessible image utilities: Reward Cover Editor, Image Overlay Studio, and Coin Sprite Slicer.
- Their only in-app discovery point is **Settings → Image Tools**, a collapsed panel. The Overlay Studio is not shown in the primary desktop or mobile navigation.
- `public/slice_cutter.html` is deployed unchanged as a static GitHub Pages asset and runs entirely in the browser. It supports custom cut lines, tile selection/deletion, chroma-key background removal, and transparent PNG downloads.
- `scripts/slice_coins.py`, `scripts/slice_all_sheets.py`, and `scripts/slice_user_coords.py` remain developer-only asset-generation scripts; they are not web application features.
