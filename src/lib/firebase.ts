import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

export const firebaseConfig = {
  projectId: "reflected-composite-wvxch",
  appId: "1:545725310653:web:8750deab5087fe48b079d4",
  apiKey: "AIzaSyAqK1BSQbZrlhjMu-Dbmz1ghWmeG3aq9T0",
  authDomain: "reflected-composite-wvxch.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-flamehunterfcman-0604ab2f-6e89-452e-b209-1871124eeb9d",
  storageBucket: "reflected-composite-wvxch.firebasestorage.app",
  messagingSenderId: "545725310653",
  measurementId: "",
  oAuthClientId: "545725310653-8mcp9ag7l4di592bavlqvb22nalgh0pk.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

export const FFC_DATABASE_NAME = 'FFC DATA CENTER';

let appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);

let firestoreDb: Firestore | null = null;
try {
  if (appInstance) {
    // initializeFirestore with long-polling prevents "@firebase/firestore: Could not reach Cloud Firestore backend"
    // which occurs when WebChannel streaming is restricted or disconnected in iframe/cloud run preview environments
    firestoreDb = initializeFirestore(
      appInstance,
      {
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: true
      },
      firebaseConfig.firestoreDatabaseId || undefined
    );
  }
} catch (initErr) {
  try {
    firestoreDb = firebaseConfig.firestoreDatabaseId
      ? getFirestore(appInstance, firebaseConfig.firestoreDatabaseId)
      : getFirestore(appInstance);
  } catch (err) {
    console.warn('[FFC DATA CENTER] Fallback to default Firestore:', err);
    try {
      firestoreDb = getFirestore(appInstance);
    } catch (finalErr) {
      console.error('[FFC DATA CENTER] Firestore critical init error:', finalErr);
    }
  }
}

export const db = firestoreDb;

let authInstance: Auth | null = null;
try {
  if (appInstance) {
    authInstance = getAuth(appInstance);
  }
} catch (err) {
  console.error('[FFC DATA CENTER] Failed to initialize Firebase Auth:', err);
}

export const auth = authInstance;
