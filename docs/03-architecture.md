# Proposed Architecture

Frontend Architecture:
React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion + Canvas Confetti + Web Audio API

↓

Data Persistence Layer:
LocalStorage (Default Offline/Guest Mode) <-> Firebase Cloud Firestore (Optional Cloud Sync)

↓

Hosting:
GitHub Pages (Static Web Hosting)

---

Technology Stack:
- Framework: React 18, TypeScript, Vite
- Styling: Tailwind CSS v3, Glassmorphism, Theme Tokens
- Icons: Lucide React + Emoji System
- FX: Framer Motion (micro-animations), Canvas Confetti (celebrations), Web Audio API (synthesized audio)
- Storage & Sync: LocalStorage + Firebase Auth / Firestore
- Media: Base64 / Local File Image Uploader for Reward Store items

---

## Image Tool Access

Image-editing utilities are intentionally accessed only from **Settings → Image Tools**. The collapsed panel links to:
- **Reward Cover Editor** — upload, crop, replace, or remove a Reward Store cover image.
- **Image Overlay Studio** — apply opacity gradients, colour overlays, shapes, and export a PNG.
- **Coin Sprite Slicer** — split a coin or sprite sheet into transparent PNG tiles and optionally remove a chroma-key background.

The Sprite Slicer is a standalone static page at `public/slice_cutter.html`; it is opened from Settings in a separate tab so it remains available on GitHub Pages without any server-side processing.
