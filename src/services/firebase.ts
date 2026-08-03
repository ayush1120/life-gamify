import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  Firestore 
} from 'firebase/firestore';
import { Settings, Habit, RewardLog, RewardRedemption } from '../types';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export const isFirebaseConfigured = (settings?: Settings): boolean => {
  if (settings?.firebaseApiKey && settings?.firebaseProjectId) return true;
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
};

export const initFirebase = (settings?: Settings) => {
  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
    firestoreDb = getFirestore(firebaseApp);
    return { app: firebaseApp, db: firestoreDb };
  }

  const apiKey = settings?.firebaseApiKey || import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = settings?.firebaseAuthDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = settings?.firebaseProjectId || import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = settings?.firebaseStorageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = settings?.firebaseMessagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = settings?.firebaseAppId || import.meta.env.VITE_FIREBASE_APP_ID;

  if (!apiKey || !projectId) {
    return { app: null, db: null };
  }

  try {
    firebaseApp = initializeApp({
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId
    });
    firestoreDb = getFirestore(firebaseApp);
    return { app: firebaseApp, db: firestoreDb };
  } catch (e) {
    console.warn('Firebase initialization warning:', e);
    return { app: null, db: null };
  }
};

export const signInWithGoogle = async (settings?: Settings) => {
  const { app } = initFirebase(settings);
  if (!app) {
    throw new Error('Firebase is not configured. Please add your credentials in Settings or use Local Mode.');
  }
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
};

export const logoutFirebase = async () => {
  if (!firebaseApp) return;
  const auth = getAuth(firebaseApp);
  await signOut(auth);
};

// Firestore sync helpers
export const syncFirestoreHabits = async (userId: string, habits: Habit[]) => {
  if (!firestoreDb) return;
  try {
    for (const habit of habits) {
      await setDoc(doc(firestoreDb, `users/${userId}/activities`, habit.id), habit);
    }
  } catch (e) {
    console.error('Error syncing habits to Firestore:', e);
  }
};

export const fetchFirestoreHabits = async (userId: string): Promise<Habit[]> => {
  if (!firestoreDb) return [];
  try {
    const q = query(collection(firestoreDb, `users/${userId}/activities`));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Habit);
  } catch (e) {
    console.error('Error fetching habits from Firestore:', e);
    return [];
  }
};

export const syncFirestoreRewardLog = async (userId: string, log: RewardLog) => {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, `users/${userId}/rewardLogs`, log.id), log);
  } catch (e) {
    console.error('Error syncing log to Firestore:', e);
  }
};

export const syncFirestoreRedemption = async (userId: string, redemption: RewardRedemption) => {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, `users/${userId}/rewardRedemptions`, redemption.id), redemption);
  } catch (e) {
    console.error('Error syncing redemption to Firestore:', e);
  }
};

export const syncFirestoreSettings = async (userId: string, settings: Settings) => {
  if (!firestoreDb) return;
  try {
    // Sync preferences (theme, celebration style, currency, audio) to Firestore
    const prefSettings = { ...settings };
    delete prefSettings.firebaseApiKey;
    delete prefSettings.firebaseAuthDomain;
    delete prefSettings.firebaseProjectId;
    delete prefSettings.firebaseStorageBucket;
    delete prefSettings.firebaseMessagingSenderId;
    delete prefSettings.firebaseAppId;
    await setDoc(doc(firestoreDb, `users/${userId}/settings`, 'preferences'), prefSettings);
  } catch (e) {
    console.error('Error syncing settings to Firestore:', e);
  }
};

