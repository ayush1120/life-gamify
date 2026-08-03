# Security & Access Control

## Authentication
- Google OAuth (optional via Firebase Auth) or Local Owner Session.

---

## Authorization & Cloud Firestore Scope
- Cloud Firestore Security Rules restrict data access to the owner's Google UID (`users/{userId}/...`).
- Local Storage operates in browser scope.

---

## Frequency Limit Enforcement & Coin-Farming Protection
- Logging validations enforce period limits (`maxPerPeriod`) relative to UTC/ISO bounds based on frequency (`daily`, `weekly`, `monthly`).
- Changing habit frequency or `maxPerPeriod` does not retroactively alter or duplicate coins in historical completion logs.

---

## Input & Tag Sanitization
- Custom category tags are trimmed, lowercased, length-capped (max 25 chars), and sanitized against XSS injection.
- Uploaded reward store images are stored locally as sanitized Data URLs (base64) with size limits (max 500KB per image) to prevent browser memory issues.
