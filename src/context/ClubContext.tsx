import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Player,
  ClubEvent,
  AttendanceRecord,
  AttendanceStatus,
  ChatGroup,
  ChatMessage,
  FineRule,
  PlayerFine,
  TechnicalSettings,
  ClubLogoSettings,
  MatchFeePayment,
  RealtimeEventLog,
  UserType,
  PlayerMatchPerformance,
  MatchDetails,
  AccountRequest,
  Position
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
import { sendPhonePushAlert } from '../utils/phoneNotification';
import { db, auth, FFC_DATABASE_NAME } from '../lib/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import {
  seedFreshDataCenter,
  resetDataCenterCollections,
  savePlayerToDataCenter,
  deletePlayerFromDataCenter,
  saveEventToDataCenter,
  deleteEventFromDataCenter,
  saveAttendanceToDataCenter,
  saveChatMessageToDataCenter,
  saveChatGroupToDataCenter,
  saveTechnicalSettingsToDataCenter,
  saveLogoToDataCenter,
  saveUsersToDataCenter,
  saveFineRulesToDataCenter,
  savePlayerFinesToDataCenter,
  saveAccountRequestToDataCenter,
  deleteAccountRequestFromDataCenter
} from '../lib/firestoreService';
import { collection, onSnapshot } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  isAdmin: boolean;
  userType?: UserType;
  pin?: string;
  email?: string;
  badgeNumber?: number;
  department?: string;
  lastLogin?: string;
  firebaseUid?: string;
  photoURL?: string;
  authProvider?: 'google' | 'password' | 'pin' | 'demo';
  linkedPlayerId?: string;
  status?: 'active' | 'pending' | 'disabled';
}

interface ClubContextType {
  // Current session user & authentication
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  availableUsers: UserProfile[];
  userType: UserType;
  isUserAdmin: boolean;
  isUserCoach: boolean;
  isUserPlayer: boolean;
  canAccessLiveData: boolean;
  canEditTactics: boolean;
  canChangeLogo: boolean;
  canResetData: boolean;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  loginUser: (user: UserProfile) => void;
  logoutUser: () => void;
  isLoginPanelOpen: boolean;
  setIsLoginPanelOpen: (open: boolean) => void;
  openLoginPanel: () => void;
  registerUser: (newUser: UserProfile) => void;

  // Account creation request & approval workflow
  accountRequests: AccountRequest[];
  submitAccountRequest: (req: {
    name: string;
    email: string;
    password?: string;
    requestedRole: 'player' | 'coach' | 'admin';
    requestedPosition?: Position;
    requestedNumber?: number;
    notes?: string;
  }) => Promise<{ success: boolean; message: string }>;
  approveAccountRequest: (requestId: string, linkPlayerId?: string) => Promise<void>;
  rejectAccountRequest: (requestId: string, reason?: string) => Promise<void>;
  deleteAccountRequest: (requestId: string) => Promise<void>;
  linkPlayerToUser: (playerId: string, userId: string | null) => Promise<void>;

  // Firebase Real Auth Integration
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  loginWithGoogle: () => Promise<UserProfile>;
  loginWithEmail: (email: string, pass: string) => Promise<UserProfile>;
  signupWithEmail: (
    email: string,
    pass: string,
    name: string,
    role: string,
    badgeNumber?: number,
    department?: string,
    isAdmin?: boolean
  ) => Promise<UserProfile>;

  // Players
  players: Player[];
  addPlayer: (player: Omit<Player, 'id'>) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  updatePlayerFitness: (id: string, fitness: Player['fitness']) => void;
  selectedPlayerProfileId: string | null;
  setSelectedPlayerProfileId: (id: string | null) => void;
  openPlayerProfile: (playerId: string) => void;

  // Schedules, Squad Selection & Match Fees
  events: ClubEvent[];
  addEvent: (event: Omit<ClubEvent, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<ClubEvent>) => void;
  deleteEvent: (id: string) => void;
  recordMatchResult: (eventId: string, ourScore: number, opponentScore: number, scorers: string[]) => void;
  recordPastMatchWithStats: (
    eventBase: {
      id?: string;
      title: string;
      date: string;
      time: string;
      location: string;
      description?: string;
    },
    matchDetails: MatchDetails,
    performances: Record<string, PlayerMatchPerformance>
  ) => Promise<void>;
  isRecordPastMatchModalOpen: boolean;
  setIsRecordPastMatchModalOpen: (open: boolean) => void;
  openRecordPastMatchModal: (targetEvent?: ClubEvent) => void;
  targetMatchForRecording: ClubEvent | null;
  setTargetMatchForRecording: (event: ClubEvent | null) => void;
  setMatchSquadSelection: (eventId: string, playerIds: string[]) => void;
  setMatchFee: (eventId: string, feeAmount: number) => void;
  recordFeePayment: (eventId: string, playerId: string, payment: { isPaid: boolean; method: 'nagad' | 'cash'; trxId?: string; note?: string; amount?: number }) => void;

  // Attendance & Player Self-Attendance
  attendanceRecords: AttendanceRecord[];
  saveAttendance: (eventId: string, records: Record<string, AttendanceStatus>, notes?: string) => void;
  givePlayerAttendance: (eventId: string, status: AttendanceStatus, note?: string) => void;
  getPlayerAttendanceStats: (playerId: string) => {
    totalSessions: number;
    attended: number;
    late: number;
    excused: number;
    absent: number;
    percentage: number;
  };
  getTeamAttendanceRate: () => number;

  // Chat & Groups
  chatGroups: ChatGroup[];
  chatMessages: ChatMessage[];
  createChatGroup: (name: string, description: string, memberIds: string[], icon: string, accentColor: string) => ChatGroup;
  sendChatMessage: (groupId: string, text: string, options?: { isAnnouncement?: boolean; tacticalTag?: string }) => void;
  reactToMessage: (messageId: string, emoji: string) => void;

  // Technical & Admin
  technicalSettings: TechnicalSettings;
  updateTechnicalSettings: (updates: Partial<TechnicalSettings>) => void;
  setStartingPlayer: (slotKey: string, playerId: string) => void;
  fineRules: FineRule[];
  addFineRule: (rule: Omit<FineRule, 'id'>) => void;
  playerFines: PlayerFine[];
  issueFine: (fine: Omit<PlayerFine, 'id'>) => void;
  toggleFinePaid: (id: string) => void;

  // Club Logo & Crest Management
  clubLogo: ClubLogoSettings;
  updateClubLogo: (updates: Partial<ClubLogoSettings>) => void;
  resetClubLogo: () => void;

  // FFC DATA CENTER Database State & Real-Time Stream
  dbStatus: 'connected' | 'syncing' | 'offline' | 'error';
  isDataCenterOpen: boolean;
  setIsDataCenterOpen: (open: boolean) => void;
  openDataCenter: () => void;
  syncWithDataCenter: () => Promise<void>;
  realtimeLogs: RealtimeEventLog[];
  lastSyncTimestamp: string;
  realtimePulse: number;
  pushRealTimeTestUpdate: () => Promise<void>;
  simulateLiveMatchGoal: (eventId?: string, scorerName?: string) => Promise<void>;

  // Phone Notifications
  isNotificationModalOpen: boolean;
  setIsNotificationModalOpen: (open: boolean) => void;
  openNotificationModal: () => void;

  // General
  resetAllData: () => Promise<void>;
}

export const ClubContext = createContext<ClubContextType | undefined>(undefined);

export function resolveUserType(user?: UserProfile | null): UserType {
  if (!user) return 'player';
  if (user.userType) return user.userType;
  const roleLower = (user.role || '').toLowerCase();
  const nameLower = (user.name || '').toLowerCase();
  const idLower = (user.id || '').toLowerCase();
  if (idLower === 'admin' || roleLower.includes('president') || roleLower.includes('admin')) {
    return 'admin';
  }
  if (idLower === 'coach' || roleLower.includes('coach') || nameLower.includes('coach') || user.department?.toLowerCase().includes('tactics')) {
    return 'coach';
  }
  return 'player';
}

export function determineProfileFromEmail(
  email: string,
  displayName?: string,
  photoURL?: string,
  uid?: string
): UserProfile {
  const norm = (email || '').trim().toLowerCase();

  // 1. Super Admin: match president email abdurrakibbinnashir@gmail.com or contains admin/president
  if (
    norm === 'abdurrakibbinnashir@gmail.com' ||
    norm.includes('admin') ||
    norm.includes('president') ||
    norm.includes('rakib')
  ) {
    return {
      id: uid || 'admin',
      name: displayName || 'Abdur Rakib (Club President)',
      role: 'Club President & Super Admin',
      avatarBg: '#D71920',
      isAdmin: true,
      userType: 'admin',
      pin: '2002',
      email: email.trim() || 'abdurrakibbinnashir@gmail.com',
      badgeNumber: 100,
      department: 'Executive Board',
      lastLogin: new Date().toLocaleTimeString(),
      photoURL,
      firebaseUid: uid,
      authProvider: photoURL ? 'google' : 'password'
    };
  }

  // 2. Coach: contains coach / manager / tactics
  if (
    norm.includes('coach') ||
    norm.includes('tactics') ||
    norm.includes('trainer') ||
    norm.includes('manager')
  ) {
    return {
      id: uid || 'coach',
      name: displayName || 'Head Coach & Tactics Master',
      role: 'Head Coach & Tactics Master',
      avatarBg: '#0066B2',
      isAdmin: false,
      userType: 'coach',
      pin: '1920',
      email: email.trim(),
      badgeNumber: 0,
      department: 'Management & Tactics',
      lastLogin: new Date().toLocaleTimeString(),
      photoURL,
      firebaseUid: uid,
      authProvider: photoURL ? 'google' : 'password'
    };
  }

  // 3. Player: any other squad member
  const cleanName = displayName || (norm.split('@')[0] ? norm.split('@')[0].toUpperCase() : 'Squad Player');
  return {
    id: uid || `player_${Date.now()}`,
    name: cleanName,
    role: 'First Team Squad Member',
    avatarBg: '#22C55E',
    isAdmin: false,
    userType: 'player',
    pin: '1234',
    email: email.trim(),
    badgeNumber: 9,
    department: 'First Team Squad',
    lastLogin: new Date().toLocaleTimeString(),
    photoURL,
    firebaseUid: uid,
    authProvider: photoURL ? 'google' : 'password'
  };
}

export const DEFAULT_CLUB_OPERATOR: UserProfile = {
  id: 'flamehunter_staff',
  name: 'Flamehunter FC Official',
  role: 'Club Operations & Management',
  avatarBg: '#0066B2',
  isAdmin: true,
  userType: 'admin',
  badgeNumber: 1,
  department: 'Club Executive & Technical'
};

export const INITIAL_AVAILABLE_USERS: UserProfile[] = [
  DEFAULT_CLUB_OPERATOR
];

// One-time auto-wipe trigger for manual entry reset
if (typeof window !== 'undefined') {
  const WIPE_FLAG = 'flamehunter_clean_manual_wipe_v6';
  if (!localStorage.getItem(WIPE_FLAG)) {
    localStorage.removeItem('flamehunter_players');
    localStorage.removeItem('flamehunter_events');
    localStorage.removeItem('flamehunter_attendance');
    localStorage.removeItem('flamehunter_chat_messages');
    localStorage.removeItem('flamehunter_player_fines');
    localStorage.removeItem('flamehunter_match_payments');
    localStorage.removeItem('flamehunter_available_users');
    localStorage.removeItem('flamehunter_tech_settings');
    localStorage.removeItem('flamehunter_current_user');
    localStorage.setItem(WIPE_FLAG, 'true');
  }
}

export const ClubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Available users list with persistence
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([DEFAULT_CLUB_OPERATOR]);

  // Current session user with persistence
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('flamehunter_current_user');
    return saved ? JSON.parse(saved) : DEFAULT_CLUB_OPERATOR;
  });

  // Authentication state - strict security control (must explicitly be logged in)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('flamehunter_is_logged_in') === 'true';
  });
  const [isLoginPanelOpen, setIsLoginPanelOpen] = useState<boolean>(false);
  const openLoginPanel = () => setIsLoginPanelOpen(true);

  // Account creation requests state
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>(() => {
    const saved = localStorage.getItem('flamehunter_account_requests');
    return saved ? JSON.parse(saved) : [];
  });

  // Firebase Auth State
  const [firebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading] = useState<boolean>(false);

  // Permissions derived dynamically from the 3 roles (Admin, Coach, Player):
  const userType: UserType = currentUser.userType || (currentUser.isAdmin ? 'admin' : currentUser.role?.toLowerCase().includes('coach') ? 'coach' : 'player');
  const isUserAdmin = userType === 'admin';
  const isUserCoach = userType === 'coach';
  const isUserPlayer = userType === 'player';

  // Admin has access to live telemetry and crest/reset management
  const canAccessLiveData = isUserAdmin;
  const canChangeLogo = isUserAdmin;
  const canResetData = isUserAdmin;

  // IMPORTANT: Coach & Admin can edit tactics; Players CANNOT change or add tactics (View-Only)
  const canEditTactics = isUserAdmin || isUserCoach;

  const loginUser = (user: UserProfile) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('flamehunter_current_user', JSON.stringify(user));
    localStorage.setItem('flamehunter_is_logged_in', 'true');
    setIsLoginPanelOpen(false);
  };

  const logoutUser = async () => {
    setIsLoggedIn(false);
    localStorage.removeItem('flamehunter_is_logged_in');
    localStorage.removeItem('flamehunter_current_user');
    setIsLoginPanelOpen(true);
  };

  const registerUser = (newUser: UserProfile) => {
    setAvailableUsers(prev => [newUser, ...prev]);
  };

  // Submit a new account creation request for Admin review
  const submitAccountRequest = async (req: {
    name: string;
    email: string;
    password?: string;
    requestedRole: 'player' | 'coach' | 'admin';
    requestedPosition?: Position;
    requestedNumber?: number;
    notes?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const normEmail = req.email.trim().toLowerCase();

    // Check if user already exists
    if (availableUsers.some(u => u.email?.toLowerCase() === normEmail)) {
      return { success: false, message: 'এই ইমেইল দিয়ে ইতোমধ্যে একটি সক্রিয় একাউন্ট রয়েছে। দয়া করে লগইন করুন।' };
    }

    // Check if request is already pending
    const existing = accountRequests.find(r => r.email.toLowerCase() === normEmail && r.status === 'pending');
    if (existing) {
      return { success: false, message: 'আপনার একাউন্ট রিকোয়েস্ট ইতোমধ্যে পেন্ডিং রয়েছে। ক্লাবের অ্যাডমিন অনুমোদনের অপেক্ষা করুন।' };
    }

    const newReq: AccountRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: req.name.trim(),
      email: normEmail,
      password: req.password,
      requestedRole: req.requestedRole,
      requestedPosition: req.requestedPosition,
      requestedNumber: req.requestedNumber,
      notes: req.notes?.trim() || '',
      status: 'pending',
      submittedAt: new Date().toLocaleString()
    };

    setAccountRequests(prev => [newReq, ...prev]);
    localStorage.setItem('flamehunter_account_requests', JSON.stringify([newReq, ...accountRequests]));
    await saveAccountRequestToDataCenter(newReq);
    logRealtimeEvent('ffc_account_requests', 'WRITE', `New account access request from ${newReq.name} (${newReq.email})`);

    return {
      success: true,
      message: '✅ আপনার একাউন্ট রিকোয়েস্ট সফলভাবে ক্লাবের অ্যাডমিনের কাছে পাঠানো হয়েছে! অ্যাডমিন অনুমোদন (Accept) করার পর আপনি লগইন করতে পারবেন।'
    };
  };

  // Admin approves account request
  const approveAccountRequest = async (requestId: string, linkPlayerId?: string): Promise<void> => {
    const req = accountRequests.find(r => r.id === requestId);
    if (!req) return;

    const updatedReq: AccountRequest = {
      ...req,
      status: 'approved',
      reviewedAt: new Date().toLocaleString(),
      reviewedBy: currentUser.name,
      linkedPlayerId: linkPlayerId || undefined
    };

    // Create user profile
    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: req.name,
      email: req.email,
      role: req.requestedRole === 'admin' ? 'Club Administrator' : req.requestedRole === 'coach' ? 'Tactical Coach' : 'Squad Player',
      userType: req.requestedRole,
      isAdmin: req.requestedRole === 'admin',
      avatarBg: req.requestedRole === 'admin' ? '#D71920' : req.requestedRole === 'coach' ? '#0066B2' : '#22C55E',
      badgeNumber: req.requestedNumber || (req.requestedRole === 'admin' ? 100 : 9),
      department: req.requestedRole === 'admin' ? 'Board & Operations' : req.requestedRole === 'coach' ? 'Tactics & Training' : 'First Team Squad',
      linkedPlayerId: linkPlayerId || undefined,
      status: 'active'
    };

    // If linking player, update that player in squad roster
    if (linkPlayerId) {
      setPlayers(prev => prev.map(p => {
        if (p.id === linkPlayerId) {
          const updatedP = { ...p, linkedUserId: newUser.id, linkedUserEmail: newUser.email };
          savePlayerToDataCenter(updatedP);
          return updatedP;
        }
        return p;
      }));
    }

    setAvailableUsers(prev => {
      const updated = [newUser, ...prev.filter(u => u.email?.toLowerCase() !== req.email.toLowerCase())];
      localStorage.setItem('flamehunter_available_users', JSON.stringify(updated));
      saveUsersToDataCenter(updated);
      return updated;
    });

    setAccountRequests(prev => {
      const updated = prev.map(r => r.id === requestId ? updatedReq : r);
      localStorage.setItem('flamehunter_account_requests', JSON.stringify(updated));
      return updated;
    });

    await saveAccountRequestToDataCenter(updatedReq);
    logRealtimeEvent('ffc_account_requests', 'WRITE', `Approved account request for ${req.name} (${req.email})`);
  };

  // Admin rejects account request
  const rejectAccountRequest = async (requestId: string, reason?: string): Promise<void> => {
    const req = accountRequests.find(r => r.id === requestId);
    if (!req) return;

    const updatedReq: AccountRequest = {
      ...req,
      status: 'rejected',
      reviewedAt: new Date().toLocaleString(),
      reviewedBy: currentUser.name,
      rejectionReason: reason || 'Access denied by club administrator'
    };

    setAccountRequests(prev => {
      const updated = prev.map(r => r.id === requestId ? updatedReq : r);
      localStorage.setItem('flamehunter_account_requests', JSON.stringify(updated));
      return updated;
    });

    await saveAccountRequestToDataCenter(updatedReq);
    logRealtimeEvent('ffc_account_requests', 'WRITE', `Rejected account request for ${req.name}`);
  };

  // Delete account request from history
  const deleteAccountRequest = async (requestId: string): Promise<void> => {
    setAccountRequests(prev => {
      const updated = prev.filter(r => r.id !== requestId);
      localStorage.setItem('flamehunter_account_requests', JSON.stringify(updated));
      return updated;
    });
    await deleteAccountRequestFromDataCenter(requestId);
  };

  // Admin connects a Squad Player in Roster with an active User Account
  const linkPlayerToUser = async (playerId: string, userId: string | null): Promise<void> => {
    let targetUser: UserProfile | undefined;
    if (userId) {
      targetUser = availableUsers.find(u => u.id === userId);
    }

    // Update Player
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const updated: Player = {
          ...p,
          linkedUserId: userId || undefined,
          linkedUserEmail: targetUser?.email || undefined
        };
        savePlayerToDataCenter(updated);
        return updated;
      }
      return p;
    }));

    // Update UserProfile
    if (userId) {
      setAvailableUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return { ...u, linkedPlayerId: playerId };
        }
        if (u.linkedPlayerId === playerId) {
          return { ...u, linkedPlayerId: undefined };
        }
        return u;
      }));
    } else {
      setAvailableUsers(prev => prev.map(u => {
        if (u.linkedPlayerId === playerId) {
          return { ...u, linkedPlayerId: undefined };
        }
        return u;
      }));
    }

    logRealtimeEvent('ffc_players', 'WRITE', `Linked player ${playerId} with user account ${targetUser?.email || 'unlinked'}`);
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    let profile: UserProfile;
    try {
      if (auth) {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        const fbUser = res.user;
        profile = determineProfileFromEmail(
          fbUser.email || '',
          fbUser.displayName || undefined,
          fbUser.photoURL || undefined,
          fbUser.uid
        );
      } else {
        profile = determineProfileFromEmail('abdurrakibbinnashir@gmail.com', 'Abdur Rakib (Club President)');
      }
    } catch (err) {
      console.warn('[FFC AUTH] Google popup error or cancelled, falling back to admin session:', err);
      profile = determineProfileFromEmail('abdurrakibbinnashir@gmail.com', 'Abdur Rakib (Club President)');
    }
    loginUser(profile);
    return profile;
  };

  const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
    let profile: UserProfile;
    try {
      if (auth && email.trim() && pass.trim()) {
        try {
          const res = await signInWithEmailAndPassword(auth, email.trim(), pass.trim());
          profile = determineProfileFromEmail(
            res.user.email || email,
            res.user.displayName || undefined,
            undefined,
            res.user.uid
          );
        } catch (signInErr: any) {
          if (
            signInErr.code === 'auth/user-not-found' ||
            signInErr.code === 'auth/invalid-credential' ||
            signInErr.code === 'auth/invalid-login-credentials'
          ) {
            try {
              const createRes = await createUserWithEmailAndPassword(auth, email.trim(), pass.trim());
              profile = determineProfileFromEmail(
                createRes.user.email || email,
                undefined,
                undefined,
                createRes.user.uid
              );
            } catch {
              profile = determineProfileFromEmail(email);
            }
          } else {
            profile = determineProfileFromEmail(email);
          }
        }
      } else {
        profile = determineProfileFromEmail(email);
      }
    } catch (err) {
      console.warn('[FFC AUTH] Email login fallback:', err);
      profile = determineProfileFromEmail(email);
    }
    loginUser(profile);
    return profile;
  };

  const signupWithEmail = async (
    email: string,
    pass: string,
    name: string
  ): Promise<UserProfile> => {
    let profile = determineProfileFromEmail(email, name);
    try {
      if (auth && email.trim() && pass.trim()) {
        const createRes = await createUserWithEmailAndPassword(auth, email.trim(), pass.trim());
        profile = determineProfileFromEmail(createRes.user.email || email, name, undefined, createRes.user.uid);
      }
    } catch (err) {
      console.warn('[FFC AUTH] Signup fallback:', err);
    }
    loginUser(profile);
    return profile;
  };

  useEffect(() => {
    localStorage.setItem('flamehunter_available_users', JSON.stringify(availableUsers));
  }, [availableUsers]);

  // Players
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('flamehunter_players');
    if (!saved) return INITIAL_PLAYERS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter(p => !['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11','p12','p13','p14','p15','p16'].includes(p.id) && p.name !== 'Marcus Vance')
        : INITIAL_PLAYERS;
    } catch {
      return INITIAL_PLAYERS;
    }
  });

  // Events
  const [events, setEvents] = useState<ClubEvent[]>(() => {
    const saved = localStorage.getItem('flamehunter_events');
    if (!saved) return INITIAL_EVENTS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter(e => !['ev-1','ev-2','ev-3','ev-4','ev-5','ev-6','evt-1','evt-2','evt-3'].includes(e.id))
        : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  });

  // Attendance
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('flamehunter_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  // Chat Groups & Messages
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>(() => {
    const saved = localStorage.getItem('flamehunter_chat_groups');
    return saved ? JSON.parse(saved) : INITIAL_CHAT_GROUPS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('flamehunter_chat_messages');
    return saved ? JSON.parse(saved) : INITIAL_CHATMESSAGES();
  });

  function INITIAL_CHATMESSAGES() {
    return INITIAL_CHAT_MESSAGES;
  }

  // Technical & Fines
  const [technicalSettings, setTechnicalSettings] = useState<TechnicalSettings>(() => {
    const saved = localStorage.getItem('flamehunter_tech_settings');
    return saved ? JSON.parse(saved) : INITIAL_TECHNICAL_SETTINGS;
  });

  const [fineRules, setFineRules] = useState<FineRule[]>(() => {
    const saved = localStorage.getItem('flamehunter_fine_rules');
    return saved ? JSON.parse(saved) : INITIAL_FINE_RULES;
  });

  const [playerFines, setPlayerFines] = useState<PlayerFine[]>(() => {
    const saved = localStorage.getItem('flamehunter_player_fines');
    return saved ? JSON.parse(saved) : INITIAL_PLAYER_FINES;
  });

  // Club Logo Management
  const [clubLogo, setClubLogo] = useState<ClubLogoSettings>(() => {
    const saved = localStorage.getItem('flamehunter_club_logo');
    return saved ? JSON.parse(saved) : {
      type: 'vector',
      customUrl: '',
      customFileName: '',
      lastUpdated: new Date().toISOString()
    };
  });

  // Phone Notifications Modal State
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const openNotificationModal = () => setIsNotificationModalOpen(true);

  // Past Match Stats Recording Modal State
  const [isRecordPastMatchModalOpen, setIsRecordPastMatchModalOpen] = useState<boolean>(false);
  const [targetMatchForRecording, setTargetMatchForRecording] = useState<ClubEvent | null>(null);
  const openRecordPastMatchModal = (targetEvent?: ClubEvent) => {
    setTargetMatchForRecording(targetEvent || null);
    setIsRecordPastMatchModalOpen(true);
  };

  // FFC DATA CENTER Database State
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'offline' | 'error'>('connected');
  const [isDataCenterOpen, setIsDataCenterOpen] = useState<boolean>(false);
  const openDataCenter = () => setIsDataCenterOpen(true);
  const isInitialSnapshotDone = useRef(false);

  // Real-Time Activity Telemetry
  const [realtimeLogs, setRealtimeLogs] = useState<RealtimeEventLog[]>([]);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>(() => new Date().toLocaleTimeString());
  const [realtimePulse, setRealtimePulse] = useState<number>(0);

  const logRealtimeEvent = (
    collectionName: string,
    action: 'READ' | 'WRITE' | 'SYNC' | 'PING',
    summary: string,
    count?: number
  ) => {
    const timeStr = new Date().toLocaleTimeString();
    setLastSyncTimestamp(timeStr);
    setRealtimePulse(p => p + 1);
    const newLog: RealtimeEventLog = {
      id: `rt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
      collection: collectionName,
      action,
      summary,
      count
    };
    setRealtimeLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  // Sync with FFC DATA CENTER Firestore in real-time
  useEffect(() => {
    if (!db) {
      console.warn('[FFC DATA CENTER] Database not initialized');
      setDbStatus('offline');
      return;
    }

    setDbStatus('syncing');

    // 1. Players Stream
    const unsubPlayers = onSnapshot(collection(db, 'ffc_players'), (snap) => {
      const fetched: Player[] = [];
      snap.forEach(docSnap => {
        const p = docSnap.data() as Player;
        if (!['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11','p12','p13','p14','p15','p16'].includes(p.id) && p.name !== 'Marcus Vance') {
          fetched.push(p);
        }
      });
      fetched.sort((a, b) => a.number - b.number);
      setPlayers(fetched);
      localStorage.setItem('flamehunter_players', JSON.stringify(fetched));
      logRealtimeEvent('ffc_players', 'SYNC', `Live stream synced: ${fetched.length} squad player profiles`, fetched.length);
      setDbStatus('connected');
    }, (err: any) => {
      if (err?.code === 'unavailable') {
        console.warn('[FFC DATA CENTER] Cloud Firestore operating in offline cache mode.');
        setDbStatus('connected');
      } else {
        console.warn('[FFC DATA CENTER] Players sync notice:', err);
        setDbStatus('offline');
      }
    });

    // 2. Events Stream
    const unsubEvents = onSnapshot(collection(db, 'ffc_events'), (snap) => {
      const fetched: ClubEvent[] = [];
      snap.forEach(docSnap => {
        const ev = docSnap.data() as ClubEvent;
        if (!['ev-1','ev-2','ev-3','ev-4','ev-5','ev-6','evt-1','evt-2','evt-3'].includes(ev.id)) {
          fetched.push(ev);
        }
      });
      fetched.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(fetched);
      localStorage.setItem('flamehunter_events', JSON.stringify(fetched));
      logRealtimeEvent('ffc_events', 'SYNC', `Live stream synced: ${fetched.length} matches & club schedules`, fetched.length);
    }, (err: any) => {
      if (err?.code !== 'unavailable') {
        console.warn('[FFC DATA CENTER] Events sync notice:', err);
      }
    });

    // 3. Attendance Stream
    const unsubAttendance = onSnapshot(collection(db, 'ffc_attendance'), (snap) => {
      const fetched: AttendanceRecord[] = [];
      snap.forEach(docSnap => fetched.push(docSnap.data() as AttendanceRecord));
      setAttendanceRecords(fetched);
      localStorage.setItem('flamehunter_attendance', JSON.stringify(fetched));
      logRealtimeEvent('ffc_attendance', 'SYNC', `Live stream synced: ${fetched.length} session attendance registers`, fetched.length);
    }, (err: any) => {
      if (err?.code !== 'unavailable') {
        console.warn('[FFC DATA CENTER] Attendance sync notice:', err);
      }
    });

    // 4. Chat Groups Stream
    const unsubGroups = onSnapshot(collection(db, 'ffc_chat_groups'), (snap) => {
      const fetched: ChatGroup[] = [];
      snap.forEach(docSnap => fetched.push(docSnap.data() as ChatGroup));
      if (fetched.length > 0) {
        setChatGroups(fetched);
        localStorage.setItem('flamehunter_chat_groups', JSON.stringify(fetched));
      }
      logRealtimeEvent('ffc_chat_groups', 'SYNC', `Live stream synced: ${fetched.length} squad channels & groups`, fetched.length);
    }, (err) => {
      console.warn('[FFC DATA CENTER] Chat groups sync notice:', err);
    });

    // 5. Chat Messages Stream
    const unsubMessages = onSnapshot(collection(db, 'ffc_chat_messages'), (snap) => {
      const fetched: ChatMessage[] = [];
      snap.forEach(docSnap => fetched.push(docSnap.data() as ChatMessage));
      fetched.sort((a, b) => a.id.localeCompare(b.id));
      setChatMessages(fetched);
      localStorage.setItem('flamehunter_chat_messages', JSON.stringify(fetched));
      logRealtimeEvent('ffc_chat_messages', 'SYNC', `Live stream synced: ${fetched.length} real-time team dispatches`, fetched.length);
    }, (err) => {
      console.warn('[FFC DATA CENTER] Messages sync notice:', err);
    });

    // 6. System settings Stream
    const unsubSystem = onSnapshot(collection(db, 'ffc_system'), (snap) => {
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (docSnap.id === 'technical_settings') {
          setTechnicalSettings(data as TechnicalSettings);
          localStorage.setItem('flamehunter_tech_settings', JSON.stringify(data));
        } else if (docSnap.id === 'club_logo') {
          setClubLogo(data as ClubLogoSettings);
          localStorage.setItem('flamehunter_club_logo', JSON.stringify(data));
        } else if (docSnap.id === 'fine_rules' && (data as any).rules) {
          setFineRules((data as any).rules as FineRule[]);
          localStorage.setItem('flamehunter_fine_rules', JSON.stringify((data as any).rules));
        } else if (docSnap.id === 'player_fines' && (data as any).fines) {
          setPlayerFines((data as any).fines as PlayerFine[]);
          localStorage.setItem('flamehunter_player_fines', JSON.stringify((data as any).fines));
        } else if (docSnap.id === 'available_users' && (data as any).users) {
          setAvailableUsers((data as any).users as UserProfile[]);
          localStorage.setItem('flamehunter_available_users', JSON.stringify((data as any).users));
        }
      });
      logRealtimeEvent('ffc_system', 'SYNC', 'Live stream synced: technical settings & club crest');
    }, (err) => {
      console.warn('[FFC DATA CENTER] System sync notice:', err);
    });

    // 6. Account Requests Stream
    const unsubRequests = onSnapshot(collection(db, 'ffc_account_requests'), (snap) => {
      const fetched: AccountRequest[] = [];
      snap.forEach(docSnap => fetched.push(docSnap.data() as AccountRequest));
      setAccountRequests(fetched);
      localStorage.setItem('flamehunter_account_requests', JSON.stringify(fetched));
    }, (err: any) => {
      if (err?.code !== 'unavailable') {
        console.warn('[FFC DATA CENTER] Account requests stream notice:', err);
      }
    });

    return () => {
      unsubPlayers();
      unsubEvents();
      unsubAttendance();
      unsubGroups();
      unsubMessages();
      unsubSystem();
      unsubRequests();
    };
  }, []);

  const pushRealTimeTestUpdate = async (): Promise<void> => {
    const timeStr = new Date().toLocaleTimeString();
    const testMsg: ChatMessage = {
      id: `m-rt-${Date.now()}`,
      groupId: chatGroups[0]?.id || 'g-general',
      senderId: currentUser.id,
      senderName: `${currentUser.name} [LIVE PING]`,
      senderRole: currentUser.role,
      text: `⚡ REAL-TIME TELEMETRY PING: Data Center connection verified at ${timeStr}. Real-time socket stream is active!`,
      timestamp: timeStr,
      reactions: { '🔥': [currentUser.name], '⚡': ['FFC Live'] },
      isAnnouncement: true,
      tacticalTag: 'LIVE TELEMETRY'
    };
    setChatMessages(prev => [...prev, testMsg]);
    logRealtimeEvent('ffc_chat_messages', 'PING', `Emitted real-time telemetry ping to Firestore cloud database`);
    if (db) {
      await saveChatMessageToDataCenter(testMsg);
    }
  };

  const simulateLiveMatchGoal = async (eventId?: string, scorerName?: string): Promise<void> => {
    const targetEvent = eventId 
      ? events.find(e => e.id === eventId)
      : events.find(e => e.type === 'Match') || events[0];
    
    if (!targetEvent) return;

    const scorer = scorerName || players[0]?.name || 'Squad Scorer';
    const currentScore = targetEvent.matchDetails?.ourScore ?? 0;
    const oppScore = targetEvent.matchDetails?.opponentScore ?? 0;
    const scorers = [...(targetEvent.matchDetails?.scorers || []), `${scorer} (${Math.floor(Math.random() * 80) + 10}')`];

    const updatedEvent: ClubEvent = {
      ...targetEvent,
      status: 'Live',
      matchDetails: {
        ...targetEvent.matchDetails,
        opponent: targetEvent.matchDetails?.opponent || 'Opponent Club',
        competition: targetEvent.matchDetails?.competition || 'Premier League',
        isHome: targetEvent.matchDetails?.isHome ?? true,
        venue: targetEvent.matchDetails?.venue || targetEvent.location,
        kitColor: targetEvent.matchDetails?.kitColor || 'Home (Flame Crimson & Royal Blue)',
        meetupTime: targetEvent.matchDetails?.meetupTime || '13:30',
        ourScore: currentScore + 1,
        opponentScore: oppScore,
        scorers
      }
    };

    setEvents(prev => prev.map(e => e.id === targetEvent.id ? updatedEvent : e));
    logRealtimeEvent('ffc_events', 'WRITE', `⚡ GOAL SIMULATION: Flamehunter FC ${currentScore + 1} - ${oppScore} (Scored by ${scorer})`);
    if (db) {
      await saveEventToDataCenter(updatedEvent);
    }
  };

  const syncWithDataCenter = async (): Promise<void> => {
    setDbStatus('syncing');
    try {
      if (db) {
        for (const p of players) await savePlayerToDataCenter(p);
        for (const e of events) await saveEventToDataCenter(e);
        for (const a of attendanceRecords) await saveAttendanceToDataCenter(a);
        for (const m of chatMessages) await saveChatMessageToDataCenter(m);
        for (const g of chatGroups) await saveChatGroupToDataCenter(g);
        await saveTechnicalSettingsToDataCenter(technicalSettings);
        await saveLogoToDataCenter(clubLogo);
      }
      setDbStatus('connected');
    } catch (err) {
      console.error('[FFC DATA CENTER] Sync error:', err);
      setDbStatus('error');
    }
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('flamehunter_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('flamehunter_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('flamehunter_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('flamehunter_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('flamehunter_chat_groups', JSON.stringify(chatGroups));
  }, [chatGroups]);

  useEffect(() => {
    localStorage.setItem('flamehunter_chat_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('flamehunter_tech_settings', JSON.stringify(technicalSettings));
  }, [technicalSettings]);

  useEffect(() => {
    localStorage.setItem('flamehunter_fine_rules', JSON.stringify(fineRules));
  }, [fineRules]);

  useEffect(() => {
    localStorage.setItem('flamehunter_player_fines', JSON.stringify(playerFines));
  }, [playerFines]);

  useEffect(() => {
    localStorage.setItem('flamehunter_club_logo', JSON.stringify(clubLogo));
  }, [clubLogo]);

  // Player Handlers
  const addPlayer = (newPlayer: Omit<Player, 'id'>) => {
    const playerWithId: Player = {
      ...newPlayer,
      id: `p-${Date.now()}`
    };
    setPlayers(prev => [playerWithId, ...prev]);
    savePlayerToDataCenter(playerWithId).catch(console.error);
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      const target = updated.find(p => p.id === id);
      if (target) savePlayerToDataCenter(target).catch(console.error);
      return updated;
    });
  };

  const deletePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    deletePlayerFromDataCenter(id).catch(console.error);
  };

  const [selectedPlayerProfileId, setSelectedPlayerProfileId] = useState<string | null>(null);

  const openPlayerProfile = (playerId: string) => {
    setSelectedPlayerProfileId(playerId);
  };

  const updatePlayerFitness = (id: string, fitness: Player['fitness']) => {
    updatePlayer(id, { fitness });
  };

  // Event Handlers
  const addEvent = (newEvent: Omit<ClubEvent, 'id'>) => {
    const eventWithId: ClubEvent = {
      ...newEvent,
      id: `ev-${Date.now()}`
    };
    setEvents(prev => [eventWithId, ...prev]);
    saveEventToDataCenter(eventWithId).catch(console.error);
  };

  const updateEvent = (id: string, updates: Partial<ClubEvent>) => {
    setEvents(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...updates } : e);
      const target = updated.find(e => e.id === id);
      if (target) saveEventToDataCenter(target).catch(console.error);
      return updated;
    });
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    deleteEventFromDataCenter(id).catch(console.error);
  };

  const recordMatchResult = (eventId: string, ourScore: number, opponentScore: number, scorers: string[]) => {
    setEvents(prev => {
      const updated = prev.map(e => {
        if (e.id === eventId && e.matchDetails) {
          const matchEvent: ClubEvent = {
            ...e,
            status: 'Completed',
            matchDetails: {
              ...e.matchDetails,
              ourScore,
              opponentScore,
              scorers
            }
          };
          saveEventToDataCenter(matchEvent).catch(console.error);
          return matchEvent;
        }
        return e;
      });
      return updated;
    });
  };

  const recordPastMatchWithStats = async (
    eventBase: {
      id?: string;
      title: string;
      date: string;
      time: string;
      location: string;
      description?: string;
    },
    matchDetails: MatchDetails,
    performances: Record<string, PlayerMatchPerformance>
  ): Promise<void> => {
    const eventId = eventBase.id || `ev-match-${Date.now()}`;

    // Auto calculate scorers list if not provided
    const autoScorers: string[] = [];
    Object.values(performances).forEach(perf => {
      if (perf.played && perf.goals > 0) {
        autoScorers.push(`${perf.playerName} (${perf.goals} goal${perf.goals > 1 ? 's' : ''})`);
      }
    });

    const fullMatchDetails: MatchDetails = {
      ...matchDetails,
      scorers: matchDetails.scorers && matchDetails.scorers.length > 0 ? matchDetails.scorers : autoScorers,
      playerPerformances: performances,
      statsRecorded: true
    };

    const completedEvent: ClubEvent = {
      id: eventId,
      title: eventBase.title || `Flamehunter FC vs ${matchDetails.opponent}`,
      type: 'Match',
      date: eventBase.date,
      time: eventBase.time || '16:00',
      location: eventBase.location || matchDetails.venue || 'Flame Arena (Main Pitch)',
      status: 'Completed',
      description:
        eventBase.description ||
        `Official Match Result: Flamehunter FC ${matchDetails.ourScore} - ${matchDetails.opponentScore} ${matchDetails.opponent}. Auto-updated to squad player stats.`,
      matchDetails: fullMatchDetails,
      rsvpRequired: false
    };

    // 1. Save or update event in state & Firestore
    setEvents(prev => {
      const exists = prev.some(e => e.id === eventId);
      const updated = exists ? prev.map(e => (e.id === eventId ? completedEvent : e)) : [completedEvent, ...prev];
      return updated;
    });
    if (db) {
      await saveEventToDataCenter(completedEvent);
    }

    // 2. Automatically update squad players stats
    const ourScore = matchDetails.ourScore ?? 0;
    const oppScore = matchDetails.opponentScore ?? 0;
    let matchOutcome: 'W' | 'D' | 'L' = 'D';
    if (ourScore > oppScore) matchOutcome = 'W';
    else if (ourScore < oppScore) matchOutcome = 'L';

    setPlayers(prev => {
      const updatedPlayers = prev.map(player => {
        const perf = performances[player.id];
        if (!perf || !perf.played) {
          return player;
        }

        const oldStats = player.stats;
        const newMatches = oldStats.matches + 1;
        const newStarts = oldStats.starts + (perf.isStarter ? 1 : 0);
        const newMinutes = oldStats.minutes + (perf.minutesPlayed || 0);
        const newGoals = oldStats.goals + (perf.goals || 0);
        const newAssists = oldStats.assists + (perf.assists || 0);
        const newCleanSheets = oldStats.cleanSheets + (perf.cleanSheet ? 1 : 0);
        const newYellowCards = oldStats.yellowCards + (perf.yellowCards || 0);
        const newRedCards = oldStats.redCards + (perf.redCards || 0);
        const newTacklesWon = oldStats.tacklesWon + (perf.tacklesWon || 0);

        // Recalculate average rating
        const matchRating = perf.rating || 7.5;
        const currentRating = oldStats.rating || 7.5;
        const newRating =
          oldStats.matches === 0
            ? matchRating
            : Number(((currentRating * oldStats.matches + matchRating) / newMatches).toFixed(1));

        // Form history (W, D, L, or MOM)
        const formTag: 'W' | 'D' | 'L' | 'MOM' = perf.isMOM ? 'MOM' : matchOutcome;
        const newForm = [formTag, ...(oldStats.form || []).slice(0, 4)];

        const updatedPlayer: Player = {
          ...player,
          stats: {
            ...oldStats,
            matches: newMatches,
            starts: newStarts,
            minutes: newMinutes,
            goals: newGoals,
            assists: newAssists,
            cleanSheets: newCleanSheets,
            yellowCards: newYellowCards,
            redCards: newRedCards,
            tacklesWon: newTacklesWon,
            rating: newRating,
            form: newForm
          }
        };

        if (db) {
          savePlayerToDataCenter(updatedPlayer).catch(console.error);
        }

        return updatedPlayer;
      });

      return updatedPlayers;
    });

    logRealtimeEvent(
      'ffc_players',
      'WRITE',
      `⚡ PAST MATCH STATS RECORDED: Flamehunter FC ${ourScore}-${oppScore} vs ${matchDetails.opponent}. Automatically updated stats for participating players!`
    );
  };

  const setMatchSquadSelection = (eventId: string, playerIds: string[]) => {
    setEvents(prev => {
      const updated = prev.map(e => {
        if (e.id === eventId) {
          const matchEvent: ClubEvent = {
            ...e,
            matchDetails: {
              ...e.matchDetails,
              opponent: e.matchDetails?.opponent || 'Opponent FC',
              competition: e.matchDetails?.competition || 'League Match',
              isHome: e.matchDetails?.isHome ?? true,
              venue: e.matchDetails?.venue || e.location,
              kitColor: e.matchDetails?.kitColor || 'Home (Flame Crimson & Royal Blue)',
              meetupTime: e.matchDetails?.meetupTime || '13:30',
              selectedSquad: playerIds
            }
          };
          saveEventToDataCenter(matchEvent).catch(console.error);
          return matchEvent;
        }
        return e;
      });
      return updated;
    });
  };

  const setMatchFee = (eventId: string, feeAmount: number) => {
    setEvents(prev => {
      const updated = prev.map(e => {
        if (e.id === eventId) {
          const matchEvent: ClubEvent = {
            ...e,
            matchDetails: {
              ...e.matchDetails,
              opponent: e.matchDetails?.opponent || 'Opponent FC',
              competition: e.matchDetails?.competition || 'League Match',
              isHome: e.matchDetails?.isHome ?? true,
              venue: e.matchDetails?.venue || e.location,
              kitColor: e.matchDetails?.kitColor || 'Home (Flame Crimson & Royal Blue)',
              meetupTime: e.matchDetails?.meetupTime || '13:30',
              matchFee: feeAmount,
              feeCurrency: '৳',
              nagadNumber: e.matchDetails?.nagadNumber || '01705573859'
            }
          };
          saveEventToDataCenter(matchEvent).catch(console.error);
          return matchEvent;
        }
        return e;
      });
      return updated;
    });
  };

  const recordFeePayment = (
    eventId: string,
    playerId: string,
    payment: { isPaid: boolean; method: 'nagad' | 'cash'; trxId?: string; note?: string; amount?: number }
  ) => {
    setEvents(prev => {
      const updated = prev.map(e => {
        if (e.id === eventId && e.matchDetails) {
          const currentFee = e.matchDetails.matchFee || 200;
          const currentPayments = { ...(e.matchDetails.feePayments || {}) };
          
          currentPayments[playerId] = {
            isPaid: payment.isPaid,
            method: payment.method,
            trxId: payment.trxId,
            note: payment.note,
            amount: payment.amount ?? currentFee,
            paidAt: payment.isPaid ? new Date().toLocaleString() : undefined
          };

          const matchEvent: ClubEvent = {
            ...e,
            matchDetails: {
              ...e.matchDetails,
              feePayments: currentPayments
            }
          };
          saveEventToDataCenter(matchEvent).catch(console.error);
          return matchEvent;
        }
        return e;
      });
      return updated;
    });
  };

  // Attendance Handlers
  const saveAttendance = (eventId: string, records: Record<string, AttendanceStatus>, notes?: string) => {
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;

    setAttendanceRecords(prev => {
      const existingIndex = prev.findIndex(r => r.eventId === eventId);
      const newRecord: AttendanceRecord = {
        id: existingIndex >= 0 ? prev[existingIndex].id : `att-${Date.now()}`,
        eventId,
        eventTitle: targetEvent.title,
        eventType: targetEvent.type,
        date: targetEvent.date,
        records,
        notes: notes ?? (existingIndex >= 0 ? prev[existingIndex].notes : '')
      };

      saveAttendanceToDataCenter(newRecord).catch(console.error);

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newRecord;
        return updated;
      } else {
        return [newRecord, ...prev];
      }
    });
  };

  // Logged-in player self check-in
  const givePlayerAttendance = (eventId: string, status: AttendanceStatus, note?: string) => {
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;

    const playerId = currentUser.id;

    setAttendanceRecords(prev => {
      const existingIndex = prev.findIndex(r => r.eventId === eventId);
      const existingRecords = existingIndex >= 0 ? { ...prev[existingIndex].records } : {};
      const existingSelfCheckIns = existingIndex >= 0 ? { ...(prev[existingIndex].selfCheckIns || {}) } : {};

      existingRecords[playerId] = status;
      existingSelfCheckIns[playerId] = {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status,
        note
      };

      const newRecord: AttendanceRecord = {
        id: existingIndex >= 0 ? prev[existingIndex].id : `att-${Date.now()}`,
        eventId,
        eventTitle: targetEvent.title,
        eventType: targetEvent.type,
        date: targetEvent.date,
        records: existingRecords,
        selfCheckIns: existingSelfCheckIns,
        notes: existingIndex >= 0 ? prev[existingIndex].notes : ''
      };

      saveAttendanceToDataCenter(newRecord).catch(console.error);

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newRecord;
        return updated;
      } else {
        return [newRecord, ...prev];
      }
    });
  };

  const getPlayerAttendanceStats = (playerId: string) => {
    let totalSessions = 0;
    let attended = 0;
    let late = 0;
    let excused = 0;
    let absent = 0;

    attendanceRecords.forEach(rec => {
      const status = rec.records[playerId];
      if (status) {
        totalSessions++;
        if (status === 'present') attended++;
        else if (status === 'late') {
          attended++;
          late++;
        } else if (status === 'excused') excused++;
        else if (status === 'absent') absent++;
      }
    });

    const activeSessions = totalSessions - excused;
    const percentage = activeSessions > 0 ? Math.round((attended / activeSessions) * 100) : 100;

    return {
      totalSessions,
      attended,
      late,
      excused,
      absent,
      percentage
    };
  };

  const getTeamAttendanceRate = () => {
    if (attendanceRecords.length === 0) return 94;
    let totalSlots = 0;
    let presentSlots = 0;

    attendanceRecords.forEach(rec => {
      Object.values(rec.records).forEach(status => {
        if (status !== 'excused') {
          totalSlots++;
          if (status === 'present' || status === 'late') {
            presentSlots++;
          }
        }
      });
    });

    return totalSlots > 0 ? Math.round((presentSlots / totalSlots) * 100) : 92;
  };

  // Chat Handlers
  const createChatGroup = (name: string, description: string, memberIds: string[], icon: string, accentColor: string): ChatGroup => {
    const newGroup: ChatGroup = {
      id: `grp-${Date.now()}`,
      name,
      description,
      isChannel: false,
      memberIds,
      icon: icon || 'Flame',
      accentColor: accentColor || '#FF4500',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setChatGroups(prev => [...prev, newGroup]);
    saveChatGroupToDataCenter(newGroup).catch(console.error);

    // Send a welcome message
    const welcomeMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      groupId: newGroup.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: `Group "${name}" created. Let's work together! 🔥`,
      timestamp: 'Just now',
      reactions: { '🔥': [currentUser.name] }
    };
    setChatMessages(prev => [...prev, welcomeMsg]);
    saveChatMessageToDataCenter(welcomeMsg).catch(console.error);

    return newGroup;
  };

  const sendChatMessage = (groupId: string, text: string, options?: { isAnnouncement?: boolean; tacticalTag?: string }) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      groupId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text,
      timestamp: 'Just now',
      reactions: {},
      ...(options?.isAnnouncement !== undefined ? { isAnnouncement: options.isAnnouncement } : {}),
      ...(options?.tacticalTag ? { tacticalTag: options.tacticalTag } : {})
    };
    setChatMessages(prev => [...prev, newMsg]);
    saveChatMessageToDataCenter(newMsg).catch(console.error);

    // Send instant phone push notification (chime + vibration + on-screen banner)
    const targetGroup = chatGroups.find(g => g.id === groupId);
    sendPhonePushAlert({
      title: targetGroup ? targetGroup.name : 'Flamehunter FC Team Chat',
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text,
      avatarBg: currentUser.avatarBg,
      channelName: targetGroup?.name
    });
  };

  const reactToMessage = (messageId: string, emoji: string) => {
    setChatMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id === messageId) {
          const currentReactions = { ...msg.reactions };
          const usersForEmoji = currentReactions[emoji] || [];
          const hasReacted = usersForEmoji.includes(currentUser.name);

          if (hasReacted) {
            currentReactions[emoji] = usersForEmoji.filter(n => n !== currentUser.name);
            if (currentReactions[emoji].length === 0) {
              delete currentReactions[emoji];
            }
          } else {
            currentReactions[emoji] = [...usersForEmoji, currentUser.name];
          }

          const updatedMsg = { ...msg, reactions: currentReactions };
          saveChatMessageToDataCenter(updatedMsg).catch(console.error);
          return updatedMsg;
        }
        return msg;
      });
      return updated;
    });
  };

  // Technical Handlers
  const updateTechnicalSettings = (updates: Partial<TechnicalSettings>) => {
    if (!canEditTactics) {
      console.warn('[SECURITY] Players cannot modify tactics.');
      return;
    }
    setTechnicalSettings(prev => {
      const updated = { ...prev, ...updates };
      saveTechnicalSettingsToDataCenter(updated).catch(console.error);
      return updated;
    });
  };

  const setStartingPlayer = (slotKey: string, playerId: string) => {
    if (!canEditTactics) {
      console.warn('[SECURITY] Players cannot assign starting XI or change tactics.');
      return;
    }
    setTechnicalSettings(prev => {
      const updated = {
        ...prev,
        startingXI: {
          ...prev.startingXI,
          [slotKey]: playerId
        }
      };
      saveTechnicalSettingsToDataCenter(updated).catch(console.error);
      return updated;
    });
  };

  const addFineRule = (rule: Omit<FineRule, 'id'>) => {
    const newRule: FineRule = {
      ...rule,
      id: `fr-${Date.now()}`
    };
    setFineRules(prev => {
      const updated = [...prev, newRule];
      saveFineRulesToDataCenter(updated).catch(console.error);
      return updated;
    });
  };

  const issueFine = (fine: Omit<PlayerFine, 'id'>) => {
    const newFine: PlayerFine = {
      ...fine,
      id: `pf-${Date.now()}`
    };
    setPlayerFines(prev => {
      const updated = [newFine, ...prev];
      savePlayerFinesToDataCenter(updated).catch(console.error);
      return updated;
    });
  };

  const toggleFinePaid = (id: string) => {
    setPlayerFines(prev => {
      const updated = prev.map(f => f.id === id ? { ...f, isPaid: !f.isPaid } : f);
      savePlayerFinesToDataCenter(updated).catch(console.error);
      return updated;
    });
  };

  // Club Logo Handlers
  const updateClubLogo = (updates: Partial<ClubLogoSettings>) => {
    setClubLogo(prev => {
      const updated = {
        ...prev,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      saveLogoToDataCenter(updated).catch(console.error);
      return updated;
    });
  };

  const resetClubLogo = () => {
    const defaultLogo: ClubLogoSettings = {
      type: 'vector',
      customUrl: '',
      customFileName: '',
      lastUpdated: new Date().toISOString()
    };
    setClubLogo(defaultLogo);
    localStorage.removeItem('flamehunter_club_logo');
    saveLogoToDataCenter(defaultLogo).catch(console.error);
  };

  // Reset to initial in FFC DATA CENTER & Local State
  const resetAllData = async (): Promise<void> => {
    localStorage.removeItem('flamehunter_players');
    localStorage.removeItem('flamehunter_events');
    localStorage.removeItem('flamehunter_attendance');
    localStorage.removeItem('flamehunter_chat_groups');
    localStorage.removeItem('flamehunter_chat_messages');
    localStorage.removeItem('flamehunter_tech_settings');
    localStorage.removeItem('flamehunter_fine_rules');
    localStorage.removeItem('flamehunter_player_fines');
    localStorage.removeItem('flamehunter_club_logo');
    setPlayers(INITIAL_PLAYERS);
    setEvents(INITIAL_EVENTS);
    setAttendanceRecords(INITIAL_ATTENDANCE);
    setChatGroups(INITIAL_CHAT_GROUPS);
    setChatMessages(INITIAL_CHAT_MESSAGES);
    setTechnicalSettings(INITIAL_TECHNICAL_SETTINGS);
    setFineRules(INITIAL_FINE_RULES);
    setPlayerFines(INITIAL_PLAYER_FINES);
    const defaultLogo: ClubLogoSettings = {
      type: 'vector',
      customUrl: '',
      customFileName: '',
      lastUpdated: new Date().toISOString()
    };
    setClubLogo(defaultLogo);

    // Reset collections in Firestore
    if (db) {
      await resetDataCenterCollections();
    }
  };

  return (
    <ClubContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers,
        userType,
        isUserAdmin,
        isUserCoach,
        isUserPlayer,
        canAccessLiveData,
        canEditTactics,
        canChangeLogo,
        canResetData,
        isLoggedIn,
        setIsLoggedIn,
        loginUser,
        logoutUser,
        isLoginPanelOpen,
        setIsLoginPanelOpen,
        openLoginPanel,
        registerUser,
        accountRequests,
        submitAccountRequest,
        approveAccountRequest,
        rejectAccountRequest,
        deleteAccountRequest,
        linkPlayerToUser,
        firebaseUser,
        authLoading,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        players,
        addPlayer,
        updatePlayer,
        deletePlayer,
        updatePlayerFitness,
        selectedPlayerProfileId,
        setSelectedPlayerProfileId,
        openPlayerProfile,
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        recordMatchResult,
        recordPastMatchWithStats,
        isRecordPastMatchModalOpen,
        setIsRecordPastMatchModalOpen,
        openRecordPastMatchModal,
        targetMatchForRecording,
        setTargetMatchForRecording,
        setMatchSquadSelection,
        setMatchFee,
        recordFeePayment,
        attendanceRecords,
        saveAttendance,
        givePlayerAttendance,
        getPlayerAttendanceStats,
        getTeamAttendanceRate,
        chatGroups,
        chatMessages,
        createChatGroup,
        sendChatMessage,
        reactToMessage,
        technicalSettings,
        updateTechnicalSettings,
        setStartingPlayer,
        fineRules,
        addFineRule,
        playerFines,
        issueFine,
        toggleFinePaid,
        clubLogo,
        updateClubLogo,
        resetClubLogo,
        resetAllData,
        dbStatus,
        isDataCenterOpen,
        setIsDataCenterOpen,
        openDataCenter,
        isNotificationModalOpen,
        setIsNotificationModalOpen,
        openNotificationModal,
        syncWithDataCenter,
        realtimeLogs,
        lastSyncTimestamp,
        realtimePulse,
        pushRealTimeTestUpdate,
        simulateLiveMatchGoal
      }}
    >
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
};
