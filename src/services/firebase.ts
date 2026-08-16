import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocs, 
  getDoc,
  onSnapshot,
  query, 
  Firestore 
} from 'firebase/firestore';
import { Settings, Habit, RewardLog, RewardRedemption, UserProfile, StoreReward } from '../types';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDFG3dnqB_4iphC1wjTOpNW07W7VMs0zeA",
  authDomain: "life-gamify.firebaseapp.com",
  projectId: "life-gamify",
  storageBucket: "life-gamify.firebasestorage.app",
  messagingSenderId: "282331789830",
  appId: "1:282331789830:web:6f1ba97bcfcb3b615e6187",
  measurementId: "G-THJKB4W377"
};

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export const isFirebaseConfigured = (settings?: Settings): boolean => {
  return Boolean(settings || true);
};

export const initFirebase = (settings?: Settings) => {
  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
    firestoreDb = getFirestore(firebaseApp);
    return { app: firebaseApp, db: firestoreDb };
  }

  const apiKey = settings?.firebaseApiKey || import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey;
  const authDomain = settings?.firebaseAuthDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain;
  const projectId = settings?.firebaseProjectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId;
  const storageBucket = settings?.firebaseStorageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket;
  const messagingSenderId = settings?.firebaseMessagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId;
  const appId = settings?.firebaseAppId || import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId;

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

export const onAuthChange = (
  callback: (user: UserProfile | null) => void,
  settings?: Settings
) => {
  const { app } = initFirebase(settings);
  if (!app) {
    callback(null);
    return () => {};
  }
  const auth = getAuth(app);
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isOwner: true
      });
    } else {
      callback(null);
    }
  });
};

export const signInWithGoogle = async (settings?: Settings) => {
  const { app } = initFirebase(settings);
  if (!app) {
    throw new Error('Firebase is not configured.');
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

// Real-Time Firestore Subscriptions (Live Push Sync Across All Devices)
export const subscribeFirestoreHabits = (
  userId: string, 
  callback: (habits: Habit[]) => void
) => {
  if (!firestoreDb) return () => {};
  const q = query(collection(firestoreDb, `users/${userId}/activities`));
  return onSnapshot(q, (snapshot) => {
    const habits = snapshot.docs.map(docSnap => docSnap.data() as Habit);
    habits.sort((a, b) => a.order - b.order);
    callback(habits);
  }, (err) => console.error('Habits snapshot error:', err));
};

export const subscribeFirestoreRewards = (
  userId: string, 
  callback: (rewards: StoreReward[]) => void
) => {
  if (!firestoreDb) return () => {};
  const q = query(collection(firestoreDb, `users/${userId}/rewards`));
  return onSnapshot(q, (snapshot) => {
    const rewards = snapshot.docs.map(docSnap => docSnap.data() as StoreReward);
    // Sort logic optional, fallback to arbitrary or timestamp
    rewards.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    callback(rewards);
  }, (err) => console.error('Rewards snapshot error:', err));
};

export const subscribeFirestoreLogs = (
  userId: string, 
  callback: (logs: RewardLog[]) => void
) => {
  if (!firestoreDb) return () => {};
  const q = query(collection(firestoreDb, `users/${userId}/rewardLogs`));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(docSnap => docSnap.data() as RewardLog);
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    callback(logs);
  }, (err) => console.error('Logs snapshot error:', err));
};

export const subscribeFirestoreRedemptions = (
  userId: string, 
  callback: (redemptions: RewardRedemption[]) => void
) => {
  if (!firestoreDb) return () => {};
  const q = query(collection(firestoreDb, `users/${userId}/rewardRedemptions`));
  return onSnapshot(q, (snapshot) => {
    const redemptions = snapshot.docs.map(docSnap => docSnap.data() as RewardRedemption);
    redemptions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    callback(redemptions);
  }, (err) => console.error('Redemptions snapshot error:', err));
};

export const subscribeFirestoreSettings = (
  userId: string, 
  callback: (settings: Partial<Settings>) => void
) => {
  if (!firestoreDb) return () => {};
  const docRef = doc(firestoreDb, `users/${userId}/settings`, 'preferences');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as Partial<Settings>);
    }
  }, (err) => console.error('Settings snapshot error:', err));
};

// Helper to strip undefined values which crash Firestore setDoc
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanUndefined = <T extends Record<string, any>>(obj: T): T => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
};

// Firestore Sync Write Helpers
export const syncFirestoreHabits = async (userId: string, habits: Habit[]) => {
  if (!firestoreDb) return;
  try {
    const db = firestoreDb;
    const batchList = habits.map(habit => 
      setDoc(doc(db, `users/${userId}/activities`, habit.id), cleanUndefined(habit))
    );
    await Promise.all(batchList);
  } catch (e) {
    console.error('Error syncing habits to Firestore:', e);
  }
};

export const syncFirestoreHabit = async (userId: string, habit: Habit) => {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, `users/${userId}/activities`, habit.id), cleanUndefined(habit));
  } catch (e) {
    console.error('Error syncing single habit to Firestore:', e);
  }
};

export const deleteFirestoreHabit = async (userId: string, habitId: string) => {
  if (!firestoreDb) return;
  try {
    await deleteDoc(doc(firestoreDb, `users/${userId}/activities`, habitId));
  } catch (e) {
    console.error('Error deleting habit from Firestore:', e);
  }
};

export const fetchFirestoreHabits = async (userId: string): Promise<Habit[]> => {
  if (!firestoreDb) return [];
  try {
    const q = query(collection(firestoreDb, `users/${userId}/activities`));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => docSnap.data() as Habit);
  } catch (e) {
    console.error('Error fetching habits from Firestore:', e);
    return [];
  }
};

export const syncFirestoreRewards = async (userId: string, rewards: StoreReward[]) => {
  if (!firestoreDb) return;
  try {
    const db = firestoreDb;
    const batchList = rewards.map(reward => 
      setDoc(doc(db, `users/${userId}/rewards`, reward.id), cleanUndefined(reward))
    );
    await Promise.all(batchList);
  } catch (e) {
    console.error('Error syncing rewards to Firestore:', e);
  }
};

export const syncFirestoreReward = async (userId: string, reward: StoreReward) => {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, `users/${userId}/rewards`, reward.id), cleanUndefined(reward));
  } catch (e) {
    console.error('Error syncing single reward to Firestore:', e);
  }
};

export const deleteFirestoreReward = async (userId: string, rewardId: string) => {
  if (!firestoreDb) return;
  try {
    await deleteDoc(doc(firestoreDb, `users/${userId}/rewards`, rewardId));
  } catch (e) {
    console.error('Error deleting reward from Firestore:', e);
  }
};

export const fetchFirestoreRewards = async (userId: string): Promise<StoreReward[]> => {
  if (!firestoreDb) return [];
  try {
    const q = query(collection(firestoreDb, `users/${userId}/rewards`));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => docSnap.data() as StoreReward);
  } catch (e) {
    console.error('Error fetching rewards from Firestore:', e);
    return [];
  }
};

export const syncFirestoreRewardLog = async (userId: string, log: RewardLog) => {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, `users/${userId}/rewardLogs`, log.id), cleanUndefined(log));
  } catch (e) {
    console.error('Error syncing log to Firestore:', e);
  }
};

export const deleteFirestoreLog = async (userId: string, logId: string) => {
  if (!firestoreDb) return;
  try {
    await deleteDoc(doc(firestoreDb, `users/${userId}/rewardLogs`, logId));
  } catch (e) {
    console.error('Error deleting log from Firestore:', e);
  }
};

export const fetchFirestoreRewardLogs = async (userId: string): Promise<RewardLog[]> => {
  if (!firestoreDb) return [];
  try {
    const q = query(collection(firestoreDb, `users/${userId}/rewardLogs`));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => docSnap.data() as RewardLog);
  } catch (e) {
    console.error('Error fetching reward logs from Firestore:', e);
    return [];
  }
};

export const syncFirestoreRedemption = async (userId: string, redemption: RewardRedemption) => {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, `users/${userId}/rewardRedemptions`, redemption.id), cleanUndefined(redemption));
  } catch (e) {
    console.error('Error syncing redemption to Firestore:', e);
  }
};

export const deleteFirestoreRedemption = async (userId: string, redemptionId: string) => {
  if (!firestoreDb) return;
  try {
    await deleteDoc(doc(firestoreDb, `users/${userId}/rewardRedemptions`, redemptionId));
  } catch (e) {
    console.error('Error deleting redemption from Firestore:', e);
  }
};

export const fetchFirestoreRedemptions = async (userId: string): Promise<RewardRedemption[]> => {
  if (!firestoreDb) return [];
  try {
    const q = query(collection(firestoreDb, `users/${userId}/rewardRedemptions`));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => docSnap.data() as RewardRedemption);
  } catch (e) {
    console.error('Error fetching redemptions from Firestore:', e);
    return [];
  }
};

export const syncFirestoreSettings = async (userId: string, settings: Settings) => {
  if (!firestoreDb) return;
  try {
    const prefSettings = { ...settings };
    delete prefSettings.firebaseApiKey;
    delete prefSettings.firebaseAuthDomain;
    delete prefSettings.firebaseProjectId;
    delete prefSettings.firebaseStorageBucket;
    delete prefSettings.firebaseMessagingSenderId;
    delete prefSettings.firebaseAppId;
    await setDoc(doc(firestoreDb, `users/${userId}/settings`, 'preferences'), cleanUndefined(prefSettings));
  } catch (e) {
    console.error('Error syncing settings to Firestore:', e);
  }
};

export const fetchFirestoreSettings = async (userId: string): Promise<Partial<Settings> | null> => {
  if (!firestoreDb) return null;
  try {
    const docRef = doc(firestoreDb, `users/${userId}/settings`, 'preferences');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Partial<Settings>;
    }
    return null;
  } catch (e) {
    console.error('Error fetching settings from Firestore:', e);
    return null;
  }
};
