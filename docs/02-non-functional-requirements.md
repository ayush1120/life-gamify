# Non-Functional Requirements

## Cost
- Target monthly cost: $0.
- Free hosting on GitHub Pages.

---

## Architecture
- Static client-side web application (Vite + React + TypeScript + Tailwind CSS).
- Offline-first LocalStorage persistence with optional Firebase Firestore sync.

---

## Usability & Media Performance
- Image upload support for Store Rewards stored efficiently as client Data URLs / compressed Base64 strings.
- Mobile-first touch targets and 1-tap logging.
- Sub-second UI updates for habit completion and store purchases.

---

## Security
- Single-user access control via Firebase Security Rules when cloud sync is active.
- Data export/import in open JSON format for user data portability.
