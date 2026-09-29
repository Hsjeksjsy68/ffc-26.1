import { Player, ClubEvent, AttendanceRecord, ChatGroup, ChatMessage, FineRule, PlayerFine, TechnicalSettings } from '../types';

// Reset: Empty squad players roster ready for manual entry
export const INITIAL_PLAYERS: Player[] = [];

// Reset: Empty club fixtures & events ready for manual scheduling
export const INITIAL_EVENTS: ClubEvent[] = [];

// Reset: Empty attendance ledger
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

// Standard club chat channels
export const INITIAL_CHAT_GROUPS: ChatGroup[] = [
  {
    id: 'grp-1',
    name: 'Official Squad Channel',
    description: 'General team announcements, schedules and team announcements.',
    isChannel: true,
    memberIds: [],
    icon: '📣',
    accentColor: '#D71920',
    createdAt: '2025-01-01'
  },
  {
    id: 'grp-2',
    name: 'Tactics & Match Analysis',
    description: 'Formation strategy, set-piece roles, and match analysis.',
    isChannel: true,
    memberIds: [],
    icon: '📋',
    accentColor: '#0066B2',
    createdAt: '2025-01-01'
  },
  {
    id: 'grp-3',
    name: 'Matchday & Travel Hub',
    description: 'Bus meetup times, pitch directions, and kit confirmations.',
    isChannel: true,
    memberIds: [],
    icon: '🚌',
    accentColor: '#FFE600',
    createdAt: '2025-01-01'
  }
];

// Reset: Empty chat message history
export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];

// Standard disciplinary fine rulebook (ready for manual fines)
export const INITIAL_FINE_RULES: FineRule[] = [
  { id: 'fr-1', offense: 'Late to Training Session (<15 mins)', amount: 15, description: 'Failure to be on pitch ready with boots by designated whistle time.' },
  { id: 'fr-2', offense: 'Late to Matchday Meetup', amount: 30, description: 'Tardiness to match day locker room briefing.' },
  { id: 'fr-3', offense: 'Wrong Training Kit / Missing Shinguards', amount: 10, description: 'Not wearing designated team jersey or missing protective equipment.' },
  { id: 'fr-4', offense: 'Unexcused Absence from Training', amount: 40, description: 'No prior notification to coach or captain before session start.' },
  { id: 'fr-5', offense: 'Dissent Yellow Card / Reckless Red Card', amount: 25, description: 'Disciplinary caution caused by verbal altercation with match officials.' },
  { id: 'fr-6', offense: 'Phone Ringing in Tactical Briefing Room', amount: 10, description: 'Loud interruption during coach video meetings.' }
];

// Reset: Empty player fines ledger
export const INITIAL_PLAYER_FINES: PlayerFine[] = [];

// Clean technical setup ready for custom player placement
export const INITIAL_TECHNICAL_SETTINGS: TechnicalSettings = {
  pitchFormat: '11-a-side',
  pitchPlayerCount: 11,
  formation: '4-3-3',
  playingStyle: 'High Press Heavy Metal',
  teamMentality: 'Attacking',
  tempo: 'High (Direct)',
  defensiveLine: 'High Line',
  startingXI: {},
  captainId: '',
  viceCaptainId: '',
  penaltyTakerId: '',
  freeKickTakerId: '',
  cornerTakerId: '',
  stadiumName: 'Flame Arena (Capacity 4,500)',
  headCoach: 'Head Coach',
  tacticalNotes: 'Manual squad configuration active. Add players to roster to assign starting lineup and set piece takers.'
};
