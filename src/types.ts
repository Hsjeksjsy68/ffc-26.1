export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export type PlayerRole = 'Captain' | 'Vice-Captain' | 'First Team' | 'Substitute' | 'Reserve' | 'Youth Prospect';

export type FitnessStatus = 'Fit' | 'Minor Knock' | 'Injured' | 'Rested' | 'Suspended';

export interface PlayerStats {
  matches: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  passAccuracy: number; // percentage e.g. 86
  tacklesWon: number;
  rating: number; // e.g. 7.8
  form: ('W' | 'D' | 'L' | 'MOM')[];
}

export interface Player {
  id: string;
  name: string;
  nickname: string;
  number: number;
  position: Position;
  role: PlayerRole;
  age: number;
  preferredFoot: 'Right' | 'Left' | 'Both';
  fitness: FitnessStatus;
  joinedDate: string;
  stats: PlayerStats;
  avatarBg: string; // neo-brutalist vibrant color
  accentColor: string;
  nationality: string;
  phone?: string;
  tacticalNotes?: string;
}

export type EventType = 'Match' | 'Training' | 'Briefing' | 'Club Event';
export type EventStatus = 'Upcoming' | 'Live' | 'Completed' | 'Cancelled';

export type PitchFormat = '5-a-side' | '7-a-side' | '8-a-side' | '9-a-side' | '11-a-side' | 'custom';

export type UserType = 'admin' | 'coach' | 'player';

export interface MatchFeePayment {
  isPaid: boolean;
  method: 'nagad' | 'cash';
  paidAt?: string;
  trxId?: string;
  note?: string;
  amount: number;
}

export interface PlayerMatchPerformance {
  playerId: string;
  playerName: string;
  playerNumber: number;
  position: Position;
  played: boolean;
  isStarter?: boolean;
  minutesPlayed: number;
  goals: number;
  assists: number;
  rating: number; // e.g. 7.5
  cleanSheet?: boolean;
  yellowCards: number;
  redCards: number;
  tacklesWon?: number;
  passAccuracy?: number;
  isMOM?: boolean; // Man of the Match
  notes?: string;
}

export interface MatchDetails {
  opponent: string;
  competition: string;
  isHome: boolean;
  venue: string;
  kitColor: 'Home (Flame Crimson & Royal Blue)' | 'Away (White Frost & Royal Blue)' | 'Third (Volt Gold & Blue)' | 'Home (Flame Red & Black)' | 'Away (Neon Volt & Charcoal)' | 'Third (Cyber Cyan)' | string;
  meetupTime: string;
  ourScore?: number;
  opponentScore?: number;
  scorers?: string[];
  referee?: string;
  // Match Squad & Fee fields
  selectedSquad?: string[]; // Player IDs selected for this match
  matchFee?: number; // Fee amount per player in BDT (৳) e.g. 200
  feeCurrency?: string; // '৳' or 'BDT'
  nagadNumber?: string; // '01705573859'
  feePayments?: Record<string, MatchFeePayment>; // playerId -> payment details
  playerPerformances?: Record<string, PlayerMatchPerformance>; // playerId -> performance in this match
  manOfTheMatchPlayerId?: string;
  statsRecorded?: boolean;
}

export interface TrainingDetails {
  focusDrills: string[];
  intensity: 'Low (Recovery)' | 'Medium' | 'High (Match Prep)' | 'Intense (Physical)';
  coachInCharge: string;
  equipmentNeeded: string[];
}

export interface ClubEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  status: EventStatus;
  description: string;
  matchDetails?: MatchDetails;
  trainingDetails?: TrainingDetails;
  rsvpRequired: boolean;
}

export type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent';

export interface AttendanceRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  eventType: EventType;
  date: string;
  records: Record<string, AttendanceStatus>; // playerId -> status
  lateReasons?: Record<string, string>;
  selfCheckIns?: Record<string, { timestamp: string; note?: string; status: AttendanceStatus }>; // logged-in player self check-in
  notes?: string;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  reactions: Record<string, string[]>; // emoji -> [playerNames]
  isAnnouncement?: boolean;
  tacticalTag?: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  isChannel: boolean; // public channel vs custom private group
  isDirectMessage?: boolean;
  memberIds: string[];
  icon: string;
  accentColor: string;
  createdAt: string;
}

export type FormationType =
  | '4-3-3'
  | '4-2-3-1'
  | '3-5-2'
  | '4-4-2'
  | '5-3-2'
  | '1-2-1'
  | '2-2'
  | '1-1-2'
  | '2-3-1'
  | '3-2-1'
  | '2-2-2'
  | '3-3-1'
  | '2-4-1'
  | '3-2-2'
  | '2-3-2'
  | '3-3-2'
  | '3-4-1'
  | '2-4-2'
  | 'custom';

export interface FineRule {
  id: string;
  offense: string;
  amount: number;
  description: string;
}

export interface PlayerFine {
  id: string;
  playerId: string;
  playerName: string;
  ruleId: string;
  offense: string;
  amount: number;
  date: string;
  isPaid: boolean;
  note?: string;
}

export interface RealtimeEventLog {
  id: string;
  timestamp: string;
  collection: string;
  action: 'READ' | 'WRITE' | 'SYNC' | 'PING';
  summary: string;
  count?: number;
}

export interface TechnicalSettings {
  pitchFormat?: PitchFormat;
  pitchPlayerCount?: number; // e.g. 5, 7, 8, 9, 11, or custom count
  customPlayerCount?: number; // for custom format (e.g. 1 to 11)
  customPositions?: Record<string, { x: number; y: number }>; // slotKey -> percentage coordinates {x, y}
  formation: FormationType | string;
  playingStyle: 'High Press Heavy Metal' | 'Possession & Overload' | 'Quick Counter-Attack' | 'Low Block & Strike';
  teamMentality: 'Ultra-Attacking' | 'Attacking' | 'Balanced' | 'Defensive';
  tempo: 'High (Direct)' | 'Standard' | 'Patient (Tiki-Taka)';
  defensiveLine: 'High Line' | 'Mid Block' | 'Deep Low Block';
  startingXI: Record<string, string>; // slotKey (e.g. 'GK', 'LB', 'CB1') -> playerId
  captainId: string;
  viceCaptainId: string;
  penaltyTakerId: string;
  freeKickTakerId: string;
  cornerTakerId: string;
  stadiumName: string;
  headCoach: string;
  tacticalNotes: string;
}

export interface ClubLogoSettings {
  type: 'vector' | 'custom' | 'image';
  customUrl?: string;
  customFileName?: string;
  lastUpdated?: string;
}
