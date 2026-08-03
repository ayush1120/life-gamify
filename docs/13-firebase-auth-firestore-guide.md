# 13 - Firebase Authentication & Firestore Database Guide

This guide details the setup for **Google Authentication** and **Firestore Cloud Database Synchronization** in Life-Gamify.

---

## 1. Firebase Console Setup (5 Minutes)

### Step A: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it `life-gamify`.
3. Click **Create Project**.

### Step B: Enable Google Authentication
1. In Firebase Console, go to **Build -> Authentication**.
2. Click **Get Started**.
3. Under **Sign-in method**, select **Google**.
4. Enable Google sign-in, enter your support email, and click **Save**.
5. Under **Settings -> Authorized domains**, add your deployment domain:
   - `ayush1120.github.io`
   - `localhost`

### Step C: Enable Firestore Database
1. Go to **Build -> Firestore Database**.
2. Click **Create database**.
3. Select your database location and start in **Production mode**.

---

## 2. Firestore Security Rules

Copy and paste these security rules into **Firestore Database -> Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User scope: Only authenticated users can access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 3. Database Architecture

User data is strictly isolated under `users/{userId}/`:

```
users/{userId}/
  ├── activities/                (Habit definitions)
  │     └── {habitId}            (Habit object)
  ├── rewardLogs/                (Habit completion history)
  │     └── {logId}              (RewardLog object + retracted status)
  ├── rewardRedemptions/         (Store reward purchase history)
  │     └── {redemptionId}       (RewardRedemption object)
  └── settings/
        └── preferences          (Theme, currency, celebration style)
```

---

## 4. Environment Variables Configuration

Create a `.env.local` file in your project root or add environment variables in your deployment host:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=life-gamify.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=life-gamify
VITE_FIREBASE_STORAGE_BUCKET=life-gamify.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Alternatively, you can paste these credentials directly in the app under **Settings -> Firebase Credentials**.
