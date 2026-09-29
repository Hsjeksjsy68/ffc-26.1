import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db, FFC_DATABASE_NAME, firebaseConfig } from './firebase';
import {
  Player,
  ClubEvent,
  AttendanceRecord,
  ChatGroup,
  ChatMessage,
  TechnicalSettings,
  FineRule,
  PlayerFine,
  ClubLogoSettings,
  AccountRequest
} from '../types';
import {
  INITIAL_PLAYERS,
  INITIAL_EVENTS,
  INITIAL_ATTENDANCE,
  INITIAL_CHAT_GROUPS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_FINE_RULES,
  INITIAL_PLAYER_FINES,
  INITIAL_TECHNICAL_SETTINGS
} from '../data/seedData';
import { INITIAL_AVAILABLE_USERS, UserProfile } from '../context/ClubContext';

export interface DataCenterStatus {
  databaseName: string;
  databaseId: string;
  projectId: string;
  status: 'connected' | 'syncing' | 'offline' | 'error';
  lastSynced: string;
  totalRecords: {
    players: number;
    events: number;
    attendance: number;
    messages: number;
    groups: number;
  };
  errorMessage?: string;
}

const COLLECTION_PLAYERS = 'ffc_players';
const COLLECTION_EVENTS = 'ffc_events';
const COLLECTION_ATTENDANCE = 'ffc_attendance';
const COLLECTION_GROUPS = 'ffc_chat_groups';
const COLLECTION_MESSAGES = 'ffc_chat_messages';
const COLLECTION_SYSTEM = 'ffc_system';
const COLLECTION_REQUESTS = 'ffc_account_requests';

// Check if database connection is functional
export const isDbAvailable = (): boolean => {
  return db !== null;
};

/**
 * Recursively remove `undefined` properties so Firestore setDoc does not throw
 * "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Seed initial clean records into FFC DATA CENTER
export async function seedFreshDataCenter(): Promise<void> {
  if (!db) {
    console.warn('[FFC DATA CENTER] Database not initialized; falling back to local memory.');
    return;
  }

  const batch = writeBatch(db);

  // 1. Players
  for (const player of INITIAL_PLAYERS) {
    const ref = doc(db, COLLECTION_PLAYERS, player.id);
    batch.set(ref, cleanFirestoreData(player));
  }

  // 2. Events
  for (const event of INITIAL_EVENTS) {
    const ref = doc(db, COLLECTION_EVENTS, event.id);
    batch.set(ref, cleanFirestoreData(event));
  }

  // 3. Attendance
  for (const record of INITIAL_ATTENDANCE) {
    const ref = doc(db, COLLECTION_ATTENDANCE, record.id);
    batch.set(ref, cleanFirestoreData(record));
  }

  // 4. Chat Groups
  for (const group of INITIAL_CHAT_GROUPS) {
    const ref = doc(db, COLLECTION_GROUPS, group.id);
    batch.set(ref, cleanFirestoreData(group));
  }

  // 5. Chat Messages
  for (const msg of INITIAL_CHAT_MESSAGES) {
    const ref = doc(db, COLLECTION_MESSAGES, msg.id);
    batch.set(ref, cleanFirestoreData(msg));
  }

  // 6. System settings
  const techRef = doc(db, COLLECTION_SYSTEM, 'technical_settings');
  batch.set(techRef, cleanFirestoreData(INITIAL_TECHNICAL_SETTINGS));

  const fineRulesRef = doc(db, COLLECTION_SYSTEM, 'fine_rules');
  batch.set(fineRulesRef, cleanFirestoreData({ rules: INITIAL_FINE_RULES }));

  const playerFinesRef = doc(db, COLLECTION_SYSTEM, 'player_fines');
  batch.set(playerFinesRef, cleanFirestoreData({ fines: INITIAL_PLAYER_FINES }));

  const logoRef = doc(db, COLLECTION_SYSTEM, 'club_logo');
  batch.set(logoRef, cleanFirestoreData({
    type: 'vector',
    customUrl: '',
    customFileName: '',
    lastUpdated: new Date().toISOString()
  }));

  const usersRef = doc(db, COLLECTION_SYSTEM, 'available_users');
  batch.set(usersRef, cleanFirestoreData({ users: INITIAL_AVAILABLE_USERS }));

  // Database metadata
  const metaRef = doc(db, COLLECTION_SYSTEM, 'database_meta');
  batch.set(metaRef, cleanFirestoreData({
    name: FFC_DATABASE_NAME,
    databaseId: firebaseConfig.firestoreDatabaseId,
    createdAt: new Date().toISOString(),
    lastReset: new Date().toISOString(),
    status: 'ACTIVE'
  }));

  await batch.commit();
  console.log('[FFC DATA CENTER] Successfully seeded fresh database records.');
}

// Reset all data in FFC DATA CENTER
export async function resetDataCenterCollections(): Promise<void> {
  if (!db) return;

  const collectionsToWipe = [
    COLLECTION_PLAYERS,
    COLLECTION_EVENTS,
    COLLECTION_ATTENDANCE,
    COLLECTION_GROUPS,
    COLLECTION_MESSAGES,
    COLLECTION_SYSTEM
  ];

  for (const colName of collectionsToWipe) {
    try {
      const snap = await getDocs(collection(db, colName));
      const batch = writeBatch(db);
      snap.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    } catch (err) {
      console.warn(`[FFC DATA CENTER] Error clearing collection ${colName}:`, err);
    }
  }

  // Reseed with fresh baseline
  await seedFreshDataCenter();
}

// Save single player
export async function savePlayerToDataCenter(player: Player): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTION_PLAYERS, player.id), cleanFirestoreData(player));
  } catch (err) {
    console.error('[FFC DATA CENTER] Failed to save player:', err);
  }
}

// Delete player
export async function deletePlayerFromDataCenter(playerId: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, COLLECTION_PLAYERS, playerId));
  } catch (err) {
    console.error('[FFC DATA CENTER] Failed to delete player:', err);
  }
}

// Save event
export async function saveEventToDataCenter(event: ClubEvent): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTION_EVENTS, event.id), cleanFirestoreData(event));
  } catch (err) {
    console.error('[FFC DATA CENTER] Failed to save event:', err);
  }
}

// Delete event
export async function deleteEventFromDataCenter(eventId: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, COLLECTION_EVENTS, eventId));
  } catch (err) {
    console.error('[FFC DATA CENTER] Failed to delete event:', err);
  }
}

// Save attendance record
export async function saveAttendanceToDataCenter(record: AttendanceRecord): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTION_ATTENDANCE, record.id), cleanFirestoreData(record));
  } catch (err) {
    console.error('[FFC DATA CENTER] Failed to save attendance:', err);
  }
}

// Save chat message
export async function saveChatMessageToDataCenter(msg: ChatMessage): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTION_MESSAGES, msg.id), cleanFirestoreData(msg));
  } catch (err) {
    console.error('[FFC DATA CENTER] Failed to save message:', err);
  }
}

// Save chat group
export async function saveChatGroupToDataCenter(group: ChatGroup): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTION_GROUPS, group.id), cleanFirestoreData(group));
  } catch (err) {
    console.error('[FFC DATA CENTER] Failed to save chat group:', err);
  }
}

// Save technical settings
export async function saveTechnicalSettingsToDataCenter(settings: TechnicalSettings): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTION_SYSTEM, 'technical_settings'), cleanFirestoreData(settings));
  } catch (err) {
    console.error('[FFC DATA CENTER] Failed to save technical settings:', err);
  }
}

// Save logo settings
export async function saveLogoToDataCenter(logo: ClubLogoSettings): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTION_SYSTEM, 'club_logo'), cleanFirestoreData(logo));
  } catch (err) {
    console.error('[FFC DATA CENTER] Failed to save logo:', err);
  }
}

// Save users
export async function saveUsersToDataCenter(users: UserProfile[]): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTION_SYSTEM, 'available_users'), cleanFirestoreData({ users }));
  } catch (err) {
    console.error('[FFC DATA CENTER] Failed to save users:', err);
  }
}

// Save fine rules
export async function saveFineRulesToDataCenter(rules: FineRule[]): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTION_SYSTEM, 'fine_rules'), cleanFirestoreData({ rules }));
  } catch (err) {
    console.error('[FFC DATA CENTER] Failed to save fine rules:', err);
  }
}

// Save player fines
export async function savePlayerFinesToDataCenter(fines: PlayerFine[]): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTION_SYSTEM, 'player_fines'), cleanFirestoreData({ fines }));
  } catch (err) {
    console.error('[FFC DATA CENTER] Failed to save player fines:', err);
  }
}

// Save or update an account registration request
export async function saveAccountRequestToDataCenter(req: AccountRequest): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTION_REQUESTS, req.id), cleanFirestoreData(req));
  } catch (err) {
    console.error('[FFC DATA CENTER] Failed to save account request:', err);
  }
}

// Delete an account request
export async function deleteAccountRequestFromDataCenter(id: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, COLLECTION_REQUESTS, id));
  } catch (err) {
    console.error('[FFC DATA CENTER] Failed to delete account request:', err);
  }
}
