# Security & Access Control

## Authentication
- Google OAuth (optional via Firebase Auth) or Local Owner Session.

---

## Authorization
- Cloud Firestore Security Rules restrict data access to the owner's Google UID or Email.
- Local Storage operates in browser scope.

---

## Image Safety
- Uploaded reward store images are stored locally as sanitized Data URLs (base64) with size limits (max 500KB per image) to prevent browser memory issues.
