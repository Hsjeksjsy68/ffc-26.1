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
  Position,
  MediaAuditItem
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
  deleteAccountRequestFromDataCenter,
  saveMediaAuditItemToDataCenter,
  deleteMediaAuditItemFromDataCenter
} from '../lib/firestoreService';
import { collection, onSnapshot, deleteDoc } from 'firebase/firestore';

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
  linkedCoachRole?: string;
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
  requestAccountWithGoogle: (
    requestedRole?: 'player' | 'coach' | 'admin',
    requestedPosition?: Position,
    requestedNumber?: number
  ) => Promise<{
    success: boolean;
    message: string;
    googleProfile?: { name: string; email: string; photoURL?: string };
    isAlreadyApprovedOrAdmin?: boolean;
  }>;
  approveAccountRequest: (
    requestId: string,
    linkOption?: string | { type: 'player' | 'coach' | 'none'; targetPlayerId?: string; coachRole?: string }
  ) => Promise<void>;
  rejectAccountRequest: (requestId: string, reason?: string) => Promise<void>;
  deleteAccountRequest: (requestId: string) => Promise<void>;
  linkPlayerToUser: (playerId: string, userId: string | null) => Promise<void>;
  linkUserToCoach: (userId: string, coachRole: string | null) => Promise<void>;
  updatePlayerPhoto: (playerId: string, photoDataUrl: string) => Promise<void>;
  updateUserProfilePhoto: (photoDataUrl: string) => Promise<void>;

  // Media Audit Vault (Central live media telemetry for Admin)
  mediaAuditItems: MediaAuditItem[];
  recordMediaUpload: (item: Omit<MediaAuditItem, 'id' | 'timestamp' | 'isoDate'>) => Promise<MediaAuditItem>;
  deleteMediaAuditItem: (id: string) => Promise<void>;

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
  deleteChatGroup: (groupId: string) => Promise<{ success: boolean; message: string }>;
  resetAllChats: () => Promise<{ success: boolean; message: string }>;
  clearGroupMessages: (groupId: string) => Promise<{ success: boolean; message: string }>;
  sendChatMessage: (
    groupId: string,
    text: string,
    options?: {
      isAnnouncement?: boolean;
      tacticalTag?: string;
      media?: {
        type: 'image' | 'video';
        url: string;
        name: string;
        size?: number;
      };
    }
  ) => void;
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

  // 1. Super Admin: strictly match president email wwwrakibcom071@gmail.com
  if (norm === 'wwwrakibcom071@gmail.com') {
    return {
      id: uid || 'admin_rakib',
      name: displayName || 'Abdur Rakib (Club President)',
      role: 'Club President & Super Admin',
      avatarBg: '#D71920',
      isAdmin: true,
      userType: 'admin',
      pin: 'takebarm#',
      email: 'wwwrakibcom071@gmail.com',
      badgeNumber: 100,
      department: 'Executive Board',
      lastLogin: new Date().toLocaleTimeString(),
      photoURL,
      firebaseUid: uid,
      authProvider: photoURL ? 'google' : 'password'
    };
  }

  // 2. Any other user (standard squad member, requires admin approval)
  const cleanName = displayName || (norm.split('@')[0] ? norm.split('@')[0].toUpperCase() : 'Squad Member');
  return {
    id: uid || `player_${Date.now()}`,
    name: cleanName,
    role: 'Squad Member',
    avatarBg: '#22C55E',
    isAdmin: false,
    userType: 'player',
    pin: '',
    email: email.trim(),
    badgeNumber: 9,
    department: 'Squad Member',
    lastLogin: new Date().toLocaleTimeString(),
    photoURL,
    firebaseUid: uid,
    authProvider: photoURL ? 'google' : 'password'
  };
}

export const SUPER_ADMIN_USER: UserProfile = {
  id: 'admin_rakib',
  name: 'Abdur Rakib (Club President)',
  role: 'Club President & Super Admin',
  avatarBg: '#D71920',
  isAdmin: true,
  userType: 'admin',
  badgeNumber: 100,
  email: 'wwwrakibcom071@gmail.com',
  pin: 'takebarm#',
  department: 'Executive Board',
  status: 'active'
};

export const INITIAL_AVAILABLE_USERS: UserProfile[] = [
  SUPER_ADMIN_USER
];

export const isMarcusVance = (m: any): boolean => {
  if (!m) return false;
  const name = (m.senderName || '').toLowerCase();
  const id = (m.senderId || '').toLowerCase();
  return name.includes('marcus') || name.includes('vance') || id.includes('marcus') || id.includes('vance');
};

export const isMarcusGroup = (g: any): boolean => {
  if (!g) return false;
  const name = (g.name || '').toLowerCase();
  const creator = (g.createdByName || '').toLowerCase();
  const creatorId = (g.createdBy || '').toLowerCase();
  return name.includes('marcus') || name.includes('vance') || creator.includes('marcus') || creator.includes('vance') || creatorId.includes('marcus') || creatorId.includes('vance');
};

// One-time auto-wipe trigger for manual entry reset & strict auth lockout
if (typeof window !== 'undefined') {
  const SECURITY_RESET_V9 = 'flamehunter_enforce_auth_lockout_v9';
  if (!localStorage.getItem(SECURITY_RESET_V9)) {
    localStorage.removeItem('flamehunter_is_logged_in');
    localStorage.removeItem('flamehunter_current_user');
    localStorage.removeItem('flamehunter_available_users');
    localStorage.setItem(SECURITY_RESET_V9, 'true');
  }

  // Purge any cached messages from Marcus Vance immediately
  try {
    const rawMsgs = localStorage.getItem('flamehunter_chat_messages');
    if (rawMsgs) {
      const parsed = JSON.parse(rawMsgs);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(m => !isMarcusVance(m));
        localStorage.setItem('flamehunter_chat_messages', JSON.stringify(cleaned));
      }
    }
  } catch {}
}

export const ClubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Available users list with persistence
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('flamehunter_available_users');
    return saved ? JSON.parse(saved) : [SUPER_ADMIN_USER];
  });

  // Current session user with persistence
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('flamehunter_current_user');
    return saved ? JSON.parse(saved) : SUPER_ADMIN_USER;
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

  // Media Audit Vault (Central live media telemetry for Admin)
  const [mediaAuditItems, setMediaAuditItems] = useState<MediaAuditItem[]>(() => {
    const saved = localStorage.getItem('flamehunter_media_vault');
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

  // Admin approves account request with optional linking to Player or Coach
  const approveAccountRequest = async (
    requestId: string,
    linkOption?: string | { type: 'player' | 'coach' | 'none'; targetPlayerId?: string; coachRole?: string }
  ): Promise<void> => {
    const req = accountRequests.find(r => r.id === requestId);
    if (!req) return;

    let linkType: 'player' | 'coach' | 'none' = 'none';
    let targetPlayerId: string | undefined;
    let coachRole: string | undefined;

    if (typeof linkOption === 'string') {
      if (linkOption) {
        linkType = 'player';
        targetPlayerId = linkOption;
      }
    } else if (linkOption) {
      linkType = linkOption.type;
      targetPlayerId = linkOption.targetPlayerId;
      coachRole = linkOption.coachRole;
    } else if (req.linkedPlayerId) {
      linkType = 'player';
      targetPlayerId = req.linkedPlayerId;
    } else if (req.requestedRole === 'coach') {
      linkType = 'coach';
      coachRole = 'Tactical Head Coach';
    }

    const updatedReq: AccountRequest = {
      ...req,
      status: 'approved',
      reviewedAt: new Date().toLocaleString(),
      reviewedBy: currentUser.name,
      linkedPlayerId: linkType === 'player' ? targetPlayerId : undefined,
      linkedCoachRole: linkType === 'coach' ? (coachRole || 'Tactical Coach') : undefined,
      linkType
    };

    const finalUserType: UserType = (linkType === 'coach' || req.requestedRole === 'coach')
      ? 'coach'
      : req.requestedRole === 'admin'
      ? 'admin'
      : 'player';

    const finalRole = linkType === 'coach'
      ? (coachRole || 'Head Coach & Tactics Master')
      : finalUserType === 'admin'
      ? 'Club Administrator'
      : 'First Team Squad Member';

    // Create user profile
    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: req.name,
      email: req.email,
      role: finalRole,
      userType: finalUserType,
      isAdmin: finalUserType === 'admin',
      avatarBg: finalUserType === 'admin' ? '#D71920' : finalUserType === 'coach' ? '#0066B2' : '#22C55E',
      badgeNumber: req.requestedNumber || (finalUserType === 'admin' ? 100 : 9),
      department: finalUserType === 'admin' ? 'Board & Operations' : finalUserType === 'coach' ? 'Tactics & Training' : 'First Team Squad',
      linkedPlayerId: linkType === 'player' ? targetPlayerId : undefined,
      linkedCoachRole: linkType === 'coach' ? (coachRole || 'Tactical Coach') : undefined,
      status: 'active',
      photoURL: req.photoURL
    };

    // If linking player, update that player in squad roster
    if (linkType === 'player' && targetPlayerId) {
      setPlayers(prev => prev.map(p => {
        if (p.id === targetPlayerId) {
          const updatedP = {
            ...p,
            linkedUserId: newUser.id,
            linkedUserEmail: newUser.email,
            photoUrl: req.photoURL || p.photoUrl
          };
          savePlayerToDataCenter(updatedP);
          return updatedP;
        }
        return p;
      }));
    }

    if (linkType === 'coach' && coachRole?.toLowerCase().includes('head coach')) {
      updateTechnicalSettings({ headCoach: newUser.name });
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
    logRealtimeEvent('ffc_account_requests', 'WRITE', `Approved account request for ${req.name} (${req.email}) linked as ${linkType}`);
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
          return {
            ...u,
            linkedPlayerId: playerId,
            linkedCoachRole: undefined,
            userType: 'player'
          };
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

  // Admin connects a User Account with Coaching Staff
  const linkUserToCoach = async (userId: string, coachRole: string | null): Promise<void> => {
    const targetUser = availableUsers.find(u => u.id === userId);
    if (!targetUser) return;

    const isUnlinking = coachRole === null;
    const newRole = coachRole || 'Head Coach & Tactics Master';

    setAvailableUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          userType: isUnlinking ? 'player' : 'coach',
          role: isUnlinking ? 'Squad Member' : newRole,
          department: isUnlinking ? 'General Squad' : 'Management & Tactics',
          linkedCoachRole: isUnlinking ? undefined : newRole,
          linkedPlayerId: isUnlinking ? u.linkedPlayerId : undefined
        };
      }
      return u;
    }));

    if (currentUser.id === userId) {
      const updatedCurr = {
        ...currentUser,
        userType: isUnlinking ? ('player' as UserType) : ('coach' as UserType),
        role: isUnlinking ? 'Squad Member' : newRole,
        department: isUnlinking ? 'General Squad' : 'Management & Tactics',
        linkedCoachRole: isUnlinking ? undefined : newRole,
        linkedPlayerId: isUnlinking ? currentUser.linkedPlayerId : undefined
      };
      setCurrentUser(updatedCurr);
      localStorage.setItem('flamehunter_current_user', JSON.stringify(updatedCurr));
    }

    if (!isUnlinking && newRole.toLowerCase().includes('head coach')) {
      updateTechnicalSettings({ headCoach: targetUser.name });
    }

    logRealtimeEvent('ffc_users', 'WRITE', `${isUnlinking ? 'Unlinked' : 'Assigned'} coach role "${newRole}" to ${targetUser.name}`);
  };

  // Record media upload across any module (chat, profile, player, etc.)
  const recordMediaUpload = async (
    item: Omit<MediaAuditItem, 'id' | 'timestamp' | 'isoDate'>
  ): Promise<MediaAuditItem> => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullTimestamp = `${formattedDate}, ${formattedTime}`;

    const newItem: MediaAuditItem = {
      ...item,
      id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: fullTimestamp,
      isoDate: now.toISOString()
    };

    setMediaAuditItems(prev => [newItem, ...prev]);
    localStorage.setItem('flamehunter_media_vault', JSON.stringify([newItem, ...mediaAuditItems]));
    await saveMediaAuditItemToDataCenter(newItem);
    logRealtimeEvent(
      'ffc_media_vault',
      'WRITE',
      `New ${item.type.toUpperCase()} uploaded by ${item.uploadedBy.name} to "${item.destination}"`
    );

    return newItem;
  };

  // Delete media item from media vault
  const deleteMediaAuditItem = async (id: string): Promise<void> => {
    setMediaAuditItems(prev => {
      const updated = prev.filter(m => m.id !== id);
      localStorage.setItem('flamehunter_media_vault', JSON.stringify(updated));
      return updated;
    });
    await deleteMediaAuditItemFromDataCenter(id);
    logRealtimeEvent('ffc_media_vault', 'WRITE', `Deleted media audit item ${id}`);
  };

  // Update Player custom photo
  const updatePlayerPhoto = async (playerId: string, photoDataUrl: string): Promise<void> => {
    const targetPlayer = players.find(p => p.id === playerId);
    if (!targetPlayer) return;

    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const updated = { ...p, photoUrl: photoDataUrl };
        savePlayerToDataCenter(updated);
        return updated;
      }
      return p;
    }));

    if (currentUser.linkedPlayerId === playerId) {
      const updatedUser = { ...currentUser, photoURL: photoDataUrl };
      setCurrentUser(updatedUser);
      localStorage.setItem('flamehunter_current_user', JSON.stringify(updatedUser));
      setAvailableUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    }

    await recordMediaUpload({
      type: 'image',
      url: photoDataUrl,
      name: `${targetPlayer.name.replace(/\s+/g, '_')}_profile.jpg`,
      destination: `Player Profile: #${targetPlayer.number} ${targetPlayer.name}`,
      contextType: 'player_profile',
      uploadedBy: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        userType: currentUser.userType
      }
    });

    logRealtimeEvent('ffc_players', 'WRITE', `Updated profile picture for #${targetPlayer.number} ${targetPlayer.name}`);
  };

  // Update User Profile Photo
  const updateUserProfilePhoto = async (photoDataUrl: string): Promise<void> => {
    const updatedUser = { ...currentUser, photoURL: photoDataUrl };
    setCurrentUser(updatedUser);
    localStorage.setItem('flamehunter_current_user', JSON.stringify(updatedUser));
    setAvailableUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    if (currentUser.linkedPlayerId) {
      setPlayers(prev => prev.map(p => {
        if (p.id === currentUser.linkedPlayerId) {
          const updated = { ...p, photoUrl: photoDataUrl };
          savePlayerToDataCenter(updated);
          return updated;
        }
        return p;
      }));
    }

    await recordMediaUpload({
      type: 'image',
      url: photoDataUrl,
      name: `${currentUser.name.replace(/\s+/g, '_')}_avatar.jpg`,
      destination: `User Account: ${currentUser.name} (${currentUser.role})`,
      contextType: 'user_avatar',
      uploadedBy: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        userType: currentUser.userType
      }
    });

    logRealtimeEvent('ffc_users', 'WRITE', `Updated profile photo for ${currentUser.name}`);
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    if (!auth) {
      throw new Error('Firebase Auth চালু নেই।');
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const res = await signInWithPopup(auth, provider);
    const fbUser = res.user;
    const gEmail = (fbUser.email || '').trim().toLowerCase();
    const gName = fbUser.displayName || gEmail.split('@')[0] || 'User';

    // 1. Check if Super Admin wwwrakibcom071@gmail.com
    if (gEmail === 'wwwrakibcom071@gmail.com') {
      const adminProfile: UserProfile = {
        id: 'admin_rakib',
        name: 'Abdur Rakib (Club President)',
        role: 'Club President & Super Admin',
        avatarBg: '#D71920',
        isAdmin: true,
        userType: 'admin',
        pin: 'takebarm#',
        email: 'wwwrakibcom071@gmail.com',
        badgeNumber: 100,
        department: 'Executive Board',
        lastLogin: new Date().toLocaleTimeString(),
        photoURL: fbUser.photoURL || undefined,
        firebaseUid: fbUser.uid,
        authProvider: 'google',
        status: 'active'
      };
      loginUser(adminProfile);
      return adminProfile;
    }

    // 2. Check if pending request
    const pendingReq = accountRequests.find(r => r.email.toLowerCase() === gEmail && r.status === 'pending');
    if (pendingReq) {
      throw new Error('PENDING_APPROVAL: আপনার গুগল একাউন্টটি বর্তমানে পেন্ডিং আছে (Pending Approval)। ক্লাবের অ্যাডমিন অনুমোদন (Accept) করার পর আপনি লগইন করতে পারবেন।');
    }

    // 3. Check if rejected
    const rejectedReq = accountRequests.find(r => r.email.toLowerCase() === gEmail && r.status === 'rejected');
    if (rejectedReq) {
      throw new Error('ACCOUNT_REJECTED: এই গুগল একাউন্টের রিকোয়েস্টটি ক্লাবের অ্যাডমিন দ্বারা প্রত্যাখ্যাত (Rejected) হয়েছে।');
    }

    // 4. Check if approved in availableUsers
    const matchedUser = availableUsers.find(u => u.email?.toLowerCase() === gEmail);
    if (matchedUser) {
      loginUser(matchedUser);
      return matchedUser;
    }

    // 5. Check if approved in accountRequests
    const approvedReq = accountRequests.find(r => r.email.toLowerCase() === gEmail && r.status === 'approved');
    if (approvedReq) {
      const approvedUser: UserProfile = {
        id: approvedReq.id,
        name: approvedReq.name,
        email: approvedReq.email,
        role: approvedReq.requestedRole === 'admin' ? 'Club Administrator' : approvedReq.requestedRole === 'coach' ? 'Tactical Coach' : 'Squad Player',
        userType: approvedReq.requestedRole,
        isAdmin: approvedReq.requestedRole === 'admin',
        avatarBg: approvedReq.requestedRole === 'admin' ? '#D71920' : approvedReq.requestedRole === 'coach' ? '#0066B2' : '#22C55E',
        badgeNumber: approvedReq.requestedNumber || 9,
        department: 'Approved Member',
        status: 'active',
        photoURL: fbUser.photoURL || undefined
      };
      loginUser(approvedUser);
      return approvedUser;
    }

    // 6. User has not requested or been approved yet
    throw new Error('GOOGLE_USER_NOT_REGISTERED: এই গুগল একাউন্ট দিয়ে কোনো অনুমোদিত ক্লাব একাউন্ট নেই। ক্লাবে যুক্ত হতে নিচে "Google দিয়ে একাউন্ট রিকোয়েস্ট পাঠান" অপশন ব্যবহার করুন।');
  };

  // Allow users to request an account using their verified Google identity
  const requestAccountWithGoogle = async (
    requestedRole: 'player' | 'coach' | 'admin' = 'player',
    requestedPosition: Position = 'FWD',
    requestedNumber: number = 10
  ): Promise<{
    success: boolean;
    message: string;
    googleProfile?: { name: string; email: string; photoURL?: string };
    isAlreadyApprovedOrAdmin?: boolean;
  }> => {
    try {
      if (!auth) {
        return { success: false, message: 'Firebase Auth চালু নেই।' };
      }
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(auth, provider);
      const fbUser = res.user;
      const gEmail = (fbUser.email || '').trim().toLowerCase();
      const gName = fbUser.displayName || gEmail.split('@')[0] || 'Google Member';
      const gPhoto = fbUser.photoURL || undefined;

      // 1. If Super Admin wwwrakibcom071@gmail.com
      if (gEmail === 'wwwrakibcom071@gmail.com') {
        const adminProfile: UserProfile = {
          id: 'admin_rakib',
          name: 'Abdur Rakib (Club President)',
          role: 'Club President & Super Admin',
          avatarBg: '#D71920',
          isAdmin: true,
          userType: 'admin',
          pin: 'takebarm#',
          email: 'wwwrakibcom071@gmail.com',
          badgeNumber: 100,
          department: 'Executive Board',
          lastLogin: new Date().toLocaleTimeString(),
          photoURL: gPhoto,
          status: 'active'
        };
        loginUser(adminProfile);
        return {
          success: true,
          message: '👑 স্বাগতম প্রেসিডেন্ট আব্দুর রাকিব! গুগল ভেরিফিকেশন সফল হয়েছে।',
          googleProfile: { name: gName, email: gEmail, photoURL: gPhoto },
          isAlreadyApprovedOrAdmin: true
        };
      }

      // 2. If already approved user in availableUsers
      const existingUser = availableUsers.find(u => u.email?.toLowerCase() === gEmail);
      if (existingUser) {
        loginUser(existingUser);
        return {
          success: true,
          message: `স্বাগতম ${existingUser.name}! আপনার অনুমোদিত একাউন্টে সরাসরি লগইন হয়েছে।`,
          googleProfile: { name: gName, email: gEmail, photoURL: gPhoto },
          isAlreadyApprovedOrAdmin: true
        };
      }

      // 3. If request is already approved
      const approvedReq = accountRequests.find(r => r.email.toLowerCase() === gEmail && r.status === 'approved');
      if (approvedReq) {
        const approvedUser: UserProfile = {
          id: approvedReq.id,
          name: approvedReq.name,
          email: approvedReq.email,
          role: approvedReq.requestedRole === 'admin' ? 'Club Administrator' : approvedReq.requestedRole === 'coach' ? 'Tactical Coach' : 'Squad Player',
          userType: approvedReq.requestedRole,
          isAdmin: approvedReq.requestedRole === 'admin',
          avatarBg: approvedReq.requestedRole === 'admin' ? '#D71920' : approvedReq.requestedRole === 'coach' ? '#0066B2' : '#22C55E',
          badgeNumber: approvedReq.requestedNumber || 9,
          department: 'Approved Member',
          status: 'active',
          photoURL: gPhoto
        };
        loginUser(approvedUser);
        return {
          success: true,
          message: `স্বাগতম ${approvedUser.name}! আপনার অনুমোদিত একাউন্টে লগইন সম্পন্ন হয়েছে।`,
          googleProfile: { name: gName, email: gEmail, photoURL: gPhoto },
          isAlreadyApprovedOrAdmin: true
        };
      }

      // 4. If request is already pending
      const pendingReq = accountRequests.find(r => r.email.toLowerCase() === gEmail && r.status === 'pending');
      if (pendingReq) {
        return {
          success: false,
          message: `⏳ আপনার গুগল একাউন্ট (${gEmail}) দিয়ে ইতোমধ্যে রিকোয়েস্ট জমা দেওয়া আছে। অ্যাডমিন অনুমোদন (Accept) করার পর আপনি লগইন করতে পারবেন।`
        };
      }

      // 5. Create new Google Verified Account Request
      const newReq: AccountRequest = {
        id: `req_g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: gName,
        email: gEmail,
        password: '',
        requestedRole,
        requestedPosition: requestedRole === 'player' ? requestedPosition : undefined,
        requestedNumber: requestedRole === 'player' ? requestedNumber : undefined,
        notes: 'Google Account Verified Request',
        status: 'pending',
        submittedAt: new Date().toLocaleString(),
        photoURL: gPhoto,
        isGoogleVerified: true
      };

      setAccountRequests(prev => [newReq, ...prev]);
      localStorage.setItem('flamehunter_account_requests', JSON.stringify([newReq, ...accountRequests]));
      await saveAccountRequestToDataCenter(newReq);
      logRealtimeEvent('ffc_account_requests', 'WRITE', `Google verified account request submitted by ${gName} (${gEmail})`);

      return {
        success: true,
        message: `✅ গুগল একাউন্ট (${gEmail}) সফলভাবে ভেরিফাই হয়েছে এবং ক্লাবের অ্যাডমিনের কাছে রিকোয়েস্ট পাঠানো হয়েছে! অ্যাডমিন অনুমোদন করার পর আপনি সরাসরি গুগল দিয়ে ঢুকতে পারবেন।`,
        googleProfile: { name: gName, email: gEmail, photoURL: gPhoto }
      };
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        return { success: false, message: 'গুগল সাইন-ইন পপআপ উইন্ডো বন্ধ করা হয়েছে।' };
      }
      return { success: false, message: err?.message || 'গুগল একাউন্ট ভেরিফিকেশন ব্যর্থ হয়েছে।' };
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Check if an account request is pending approval
    const pendingReq = accountRequests.find(r => r.email.toLowerCase() === cleanEmail && r.status === 'pending');
    if (pendingReq) {
      throw new Error('PENDING_APPROVAL: আপনার একাউন্টটি বর্তমানে পেন্ডিং আছে (Pending Approval)। ক্লাবের অ্যাডমিন অনুমোদন (Accept) করার পর আপনি লগইন করতে পারবেন।');
    }

    // 2. Check if an account request was rejected
    const rejectedReq = accountRequests.find(r => r.email.toLowerCase() === cleanEmail && r.status === 'rejected');
    if (rejectedReq) {
      throw new Error('ACCOUNT_REJECTED: এই একাউন্ট রিকোয়েস্টটি ক্লাবের অ্যাডমিন দ্বারা প্রত্যাখ্যাত (Rejected) হয়েছে। প্রয়োজনে ক্লাবের ম্যানেজমেন্টের সাথে যোগাযোগ করুন।');
    }

    // 3. Super Admin President: strictly wwwrakibcom071@gmail.com with password takebarm#
    if (cleanEmail === 'wwwrakibcom071@gmail.com') {
      if (!cleanPass) {
        throw new Error('দয়া করে অ্যাডমিন পাসওয়ার্ড প্রদান করুন।');
      }
      if (cleanPass !== 'takebarm#') {
        throw new Error('ভুল পাসওয়ার্ড! ক্লাবের অ্যাডমিন পাসওয়ার্ড সঠিক নয়।');
      }
      const adminProfile: UserProfile = {
        id: 'admin_rakib',
        name: 'Abdur Rakib (Club President)',
        role: 'Club President & Super Admin',
        avatarBg: '#D71920',
        isAdmin: true,
        userType: 'admin',
        pin: 'takebarm#',
        email: 'wwwrakibcom071@gmail.com',
        badgeNumber: 100,
        department: 'Executive Board',
        lastLogin: new Date().toLocaleTimeString(),
        status: 'active'
      };
      loginUser(adminProfile);
      return adminProfile;
    }

    // 4. Look for user in availableUsers (which stores all approved accounts)
    const matchedUser = availableUsers.find(u => u.email?.toLowerCase() === cleanEmail || u.id === cleanEmail);
    if (matchedUser) {
      const reqForUser = accountRequests.find(r => r.email.toLowerCase() === cleanEmail);
      if (reqForUser && reqForUser.password && cleanPass) {
        if (reqForUser.password.trim() !== cleanPass) {
          throw new Error('ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিয়ে চেষ্টা করুন।');
        }
      }
      loginUser(matchedUser);
      return matchedUser;
    }

    // 5. Look for approved request in accountRequests
    const approvedReq = accountRequests.find(r => r.email.toLowerCase() === cleanEmail && r.status === 'approved');
    if (approvedReq) {
      if (approvedReq.password && cleanPass && approvedReq.password.trim() !== cleanPass) {
        throw new Error('ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিয়ে চেষ্টা করুন।');
      }
      const approvedUser: UserProfile = {
        id: approvedReq.id,
        name: approvedReq.name,
        email: approvedReq.email,
        role: approvedReq.requestedRole === 'admin' ? 'Club Administrator' : approvedReq.requestedRole === 'coach' ? 'Tactical Coach' : 'Squad Player',
        userType: approvedReq.requestedRole,
        isAdmin: approvedReq.requestedRole === 'admin',
        avatarBg: approvedReq.requestedRole === 'admin' ? '#D71920' : approvedReq.requestedRole === 'coach' ? '#0066B2' : '#22C55E',
        badgeNumber: approvedReq.requestedNumber || 9,
        department: 'Approved Member',
        status: 'active'
      };
      loginUser(approvedUser);
      return approvedUser;
    }

    // 6. If the account does not exist or has not been approved, strictly block login!
    throw new Error('USER_NOT_FOUND: এই ইমেইল দিয়ে কোনো অনুমোদিত সক্রিয় একাউন্ট পাওয়া যায়নি। ক্লাবে যুক্ত হতে নিচে "একাউন্ট রিকোয়েস্ট" করুন। অ্যাডমিন অনুমোদন (Accept) করলে আপনি লগইন করতে পারবেন।');
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
    if (!saved) return INITIAL_CHAT_GROUPS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(g => !isMarcusGroup(g)) : INITIAL_CHAT_GROUPS;
    } catch {
      return INITIAL_CHAT_GROUPS;
    }
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('flamehunter_chat_messages');
    if (!saved) return INITIAL_CHAT_MESSAGES;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(m => !isMarcusVance(m)) : INITIAL_CHAT_MESSAGES;
    } catch {
      return INITIAL_CHAT_MESSAGES;
    }
  });

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
      snap.forEach(docSnap => {
        const g = docSnap.data() as ChatGroup;
        if (isMarcusGroup(g)) {
          deleteDoc(docSnap.ref).catch(() => {});
          return;
        }
        fetched.push(g);
      });
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
      snap.forEach(docSnap => {
        const msg = docSnap.data() as ChatMessage;
        if (isMarcusVance(msg)) {
          // Permanently delete Marcus Vance mock messages from Firestore database
          deleteDoc(docSnap.ref).catch(() => {});
          return;
        }
        fetched.push(msg);
      });
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

    // 7. Media Vault Stream
    const unsubMedia = onSnapshot(collection(db, 'ffc_media_vault'), (snap) => {
      const fetched: MediaAuditItem[] = [];
      snap.forEach(docSnap => fetched.push(docSnap.data() as MediaAuditItem));
      fetched.sort((a, b) => (b.isoDate || '').localeCompare(a.isoDate || ''));
      setMediaAuditItems(fetched);
      localStorage.setItem('flamehunter_media_vault', JSON.stringify(fetched));
      logRealtimeEvent('ffc_media_vault', 'SYNC', `Live stream synced: ${fetched.length} media vault assets`, fetched.length);
    }, (err: any) => {
      if (err?.code !== 'unavailable') {
        console.warn('[FFC DATA CENTER] Media vault stream notice:', err);
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
      unsubMedia();
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
    const isCurrentUserAdmin = currentUser.isAdmin || currentUser.userType === 'admin';
    const newGroup: ChatGroup = {
      id: `grp-${Date.now()}`,
      name,
      description,
      isChannel: false,
      memberIds,
      icon: icon || 'Flame',
      accentColor: accentColor || '#FF4500',
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      isAdminGroup: isCurrentUserAdmin
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

    logRealtimeEvent('ffc_chat_groups', 'WRITE', `Created group "${newGroup.name}" by ${currentUser.name}`);
    return newGroup;
  };

  // Delete a chat group (Users can delete groups they created; Admin can delete any non-protected group; Admin-created groups cannot be deleted by regular users)
  const deleteChatGroup = async (groupId: string): Promise<{ success: boolean; message: string }> => {
    const targetGroup = chatGroups.find(g => g.id === groupId);
    if (!targetGroup) {
      return { success: false, message: 'গ্রুপটি খুঁজে পাওয়া যায়নি।' };
    }

    const isUserAdmin = currentUser.isAdmin || currentUser.userType === 'admin';
    const isProtected = targetGroup.isAdminGroup || targetGroup.isChannel || targetGroup.createdBy === 'admin' || targetGroup.createdBy === 'flamehunter_staff';
    const isCreator = targetGroup.createdBy === currentUser.id || targetGroup.createdBy === currentUser.email;

    // RULE 1: Admin created official groups CANNOT be removed by normal users
    if (isProtected && !isUserAdmin) {
      return {
        success: false,
        message: '🔒 এটি ক্লাবের অফিশিয়াল অ্যাডমিন চ্যানেল। সাধারণ মেম্বাররা অ্যাডমিনের তৈরি গ্রুপ ডিলিট করতে পারবেন না!'
      };
    }

    // RULE 2: Normal users can only delete groups that they created
    if (!isUserAdmin && !isCreator) {
      return {
        success: false,
        message: '⚠️ আপনি শুধুমাত্র আপনার নিজের তৈরি করা গ্রুপ ডিলিট করতে পারবেন।'
      };
    }

    // Proceed to delete group from state & localStorage
    setChatGroups(prev => {
      const updated = prev.filter(g => g.id !== groupId);
      localStorage.setItem('flamehunter_chat_groups', JSON.stringify(updated));
      return updated;
    });

    // Remove all associated chat messages
    setChatMessages(prev => {
      const updated = prev.filter(m => m.groupId !== groupId);
      localStorage.setItem('flamehunter_chat_messages', JSON.stringify(updated));
      return updated;
    });

    if (db) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'ffc_chat_groups', groupId));
      } catch (err) {
        console.warn('Error deleting group from firestore:', err);
      }
    }

    logRealtimeEvent('ffc_chat_groups', 'WRITE', `Deleted group "${targetGroup.name}" by ${currentUser.name}`);
    return { success: true, message: `✅ গ্রুপ "${targetGroup.name}" সফলভাবে ডিলিট করা হয়েছে!` };
  };

  // Admin action: Reset all chats (clears all messages, restores official protected channels)
  const resetAllChats = async (): Promise<{ success: boolean; message: string }> => {
    const isUserAdmin = currentUser.isAdmin || currentUser.userType === 'admin';
    if (!isUserAdmin) {
      return {
        success: false,
        message: '⚠️ শুধুমাত্র ক্লাবের অ্যাডমিন সমস্ত চ্যাট হিস্ট্রি ও গ্রুপ রিসেট করতে পারবেন।'
      };
    }

    const defaultGroups: ChatGroup[] = INITIAL_CHAT_GROUPS.map(g => ({
      ...g,
      isAdminGroup: true,
      createdBy: 'admin',
      createdByName: 'Flamehunter FC Official'
    }));

    setChatGroups(defaultGroups);
    setChatMessages([]);
    localStorage.setItem('flamehunter_chat_groups', JSON.stringify(defaultGroups));
    localStorage.setItem('flamehunter_chat_messages', JSON.stringify([]));

    if (db) {
      try {
        for (const g of defaultGroups) {
          await saveChatGroupToDataCenter(g);
        }
      } catch (err) {
        console.warn('Error saving reset groups to firestore:', err);
      }
    }

    logRealtimeEvent('ffc_chat_messages', 'WRITE', `All chat messages and user groups reset to official defaults by ${currentUser.name}`);
    return {
      success: true,
      message: '✅ সমস্ত চ্যাট ও মেসেজ সফলভাবে রিসেট করা হয়েছে এবং অফিশিয়াল চ্যানেলগুলো পুনঃস্থাপন করা হয়েছে!'
    };
  };

  // Clear messages for a specific group
  const clearGroupMessages = async (groupId: string): Promise<{ success: boolean; message: string }> => {
    const targetGroup = chatGroups.find(g => g.id === groupId);
    const isUserAdmin = currentUser.isAdmin || currentUser.userType === 'admin';
    const isCreator = targetGroup?.createdBy === currentUser.id;

    if (!isUserAdmin && !isCreator) {
      return { success: false, message: '⚠️ আপনি এই গ্রুপের মেসেজ ক্লিয়ার করার অনুমতি রাখেন না।' };
    }

    setChatMessages(prev => {
      const updated = prev.filter(m => m.groupId !== groupId);
      localStorage.setItem('flamehunter_chat_messages', JSON.stringify(updated));
      return updated;
    });

    logRealtimeEvent('ffc_chat_messages', 'WRITE', `Cleared message history for group "${targetGroup?.name || groupId}" by ${currentUser.name}`);
    return { success: true, message: '✅ এই চ্যাটের সমস্ত মেসেজ মুছে ফেলা হয়েছে।' };
  };

  const sendChatMessage = (
    groupId: string,
    text: string,
    options?: {
      isAnnouncement?: boolean;
      tacticalTag?: string;
      media?: {
        type: 'image' | 'video';
        url: string;
        name: string;
        size?: number;
      };
    }
  ) => {
    const targetGroup = chatGroups.find(g => g.id === groupId);
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
      ...(options?.tacticalTag ? { tacticalTag: options.tacticalTag } : {}),
      ...(options?.media
        ? {
            mediaType: options.media.type,
            mediaUrl: options.media.url,
            mediaName: options.media.name,
            mediaSize: options.media.size
          }
        : {})
    };
    setChatMessages(prev => [...prev, newMsg]);
    saveChatMessageToDataCenter(newMsg).catch(console.error);

    // If message includes media, record to Media Audit Vault
    if (options?.media) {
      recordMediaUpload({
        type: options.media.type,
        url: options.media.url,
        name: options.media.name,
        size: options.media.size,
        destination: `চ্যাট: ${targetGroup?.name || groupId}`,
        contextType: 'chat',
        uploadedBy: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          userType: currentUser.userType
        }
      }).catch(console.error);
    }

    // Send instant phone push notification (chime + vibration + on-screen banner)
    sendPhonePushAlert({
      title: targetGroup ? targetGroup.name : 'Flamehunter FC Team Chat',
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: options?.media ? `[${options.media.type.toUpperCase()}] ${text || options.media.name}` : text,
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
        requestAccountWithGoogle,
        approveAccountRequest,
        rejectAccountRequest,
        deleteAccountRequest,
        linkPlayerToUser,
        linkUserToCoach,
        updatePlayerPhoto,
        updateUserProfilePhoto,
        mediaAuditItems,
        recordMediaUpload,
        deleteMediaAuditItem,
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
        deleteChatGroup,
        resetAllChats,
        clearGroupMessages,
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
