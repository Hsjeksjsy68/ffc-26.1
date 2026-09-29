import React, { useState } from 'react';
import { useClub } from '../context/ClubContext';
import { ClubEvent, EventType, EventStatus } from '../types';
import { FlamehunterLogo } from './FlamehunterLogo';
import { MatchSquadFeeModal } from './MatchSquadFeeModal';
import {
  Calendar,
  Plus,
  Trophy,
  Clock,
  MapPin,
  Shirt,
  CheckCircle,
  AlertCircle,
  Dumbbell,
  Users,
  X,
  Search,
  List,
  LayoutGrid,
  ChevronRight,
  Filter,
  Check,
  Smartphone,
  Banknote,
  DollarSign,
  Edit3,
  Trash2
} from 'lucide-react';

interface SchedulesViewProps {
  onGoToAttendance?: (eventId: string) => void;
}

export const SchedulesView: React.FC<SchedulesViewProps> = ({ onGoToAttendance }) => {
  const {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    recordMatchResult,
    openRecordPastMatchModal,
    players,
    currentUser
  } = useClub();

  // Primary filters
  const [activeFilter, setActiveFilter] = useState<'MATCHES' | 'ALL' | 'TRAINING' | 'BRIEFINGS'>('MATCHES');
  const [matchSubFilter, setMatchSubFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [viewMode, setViewMode] = useState<'fixtures' | 'cards'>('fixtures');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);
  const [recordingScoreForEvent, setRecordingScoreForEvent] = useState<ClubEvent | null>(null);
  const [squadFeeModalEvent, setSquadFeeModalEvent] = useState<ClubEvent | null>(null);

  // Edit Event Form state
  const [editEventData, setEditEventData] = useState({
    title: '',
    type: 'Match' as EventType,
    date: '',
    time: '',
    location: '',
    status: 'Upcoming' as EventStatus,
    description: '',
    rsvpRequired: true,
    opponent: '',
    competition: 'Premier Metro Cup',
    isHome: true,
    kitColor: 'Home (Flame Crimson & Royal Blue)',
    meetupTime: '13:30',
    matchFee: 200,
    nagadNumber: '01705573859',
    focusDrills: 'High-Press Transition, 4v4 + 2 Neutrals, Set Pieces',
    intensity: 'High (Match Prep)' as any
  });

  const openEditEventModal = (ev: ClubEvent) => {
    setEditingEvent(ev);
    setEditEventData({
      title: ev.title,
      type: ev.type,
      date: ev.date,
      time: ev.time,
      location: ev.location,
      status: ev.status,
      description: ev.description || '',
      rsvpRequired: ev.rsvpRequired ?? true,
      opponent: ev.matchDetails?.opponent || '',
      competition: ev.matchDetails?.competition || 'Premier Metro Cup',
      isHome: ev.matchDetails?.isHome ?? true,
      kitColor: ev.matchDetails?.kitColor || 'Home (Flame Crimson & Royal Blue)',
      meetupTime: ev.matchDetails?.meetupTime || '13:30',
      matchFee: ev.matchDetails?.matchFee ?? 200,
      nagadNumber: ev.matchDetails?.nagadNumber || '01705573859',
      focusDrills: ev.trainingDetails?.focusDrills?.join(', ') || 'High-Press Transition, 4v4 + 2 Neutrals, Set Pieces',
      intensity: ev.trainingDetails?.intensity || 'High (Match Prep)'
    });
  };

  const handleSaveEditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    const title = editEventData.title.trim() || 
      (editEventData.type === 'Match' ? `Flamehunter FC vs ${editEventData.opponent || 'Opponent'}` : 'Flamehunter Squad Session');

    const updated: ClubEvent = {
      ...editingEvent,
      title,
      type: editEventData.type,
      date: editEventData.date,
      time: editEventData.time,
      location: editEventData.location,
      status: editEventData.status,
      description: editEventData.description,
      rsvpRequired: editEventData.rsvpRequired,
      matchDetails: editEventData.type === 'Match' ? {
        ...(editingEvent.matchDetails || {}),
        opponent: editEventData.opponent || 'Opponent FC',
        competition: editEventData.competition,
        isHome: editEventData.isHome,
        venue: editEventData.location,
        kitColor: editEventData.kitColor,
        meetupTime: editEventData.meetupTime,
        matchFee: editEventData.matchFee,
        nagadNumber: editEventData.nagadNumber,
        selectedSquad: editingEvent.matchDetails?.selectedSquad || [],
        feePayments: editingEvent.matchDetails?.feePayments || {}
      } : undefined,
      trainingDetails: editEventData.type === 'Training' ? {
        focusDrills: editEventData.focusDrills.split(',').map(s => s.trim()).filter(Boolean),
        intensity: editEventData.intensity,
        coachInCharge: editingEvent.trainingDetails?.coachInCharge || 'Head Coach',
        equipmentNeeded: editingEvent.trainingDetails?.equipmentNeeded || ['Flamehunter Bibs', 'Match-spec Balls']
      } : undefined
    };

    updateEvent(editingEvent.id, updated);
    setEditingEvent(null);
  };

  // Score recording modal state
  const [ourScore, setOurScore] = useState<number>(2);
  const [oppScore, setOppScore] = useState<number>(0);
  const [scorerNames, setScorerNames] = useState<string>('');

  // New Event Form state
  const [newEventData, setNewEventData] = useState({
    title: '',
    type: 'Match' as EventType,
    date: new Date().toISOString().split('T')[0],
    time: '15:00',
    location: 'Flame Arena (Main Pitch)',
    status: 'Upcoming' as EventStatus,
    description: '',
    rsvpRequired: true,
    opponent: '',
    competition: 'Premier Metro Cup',
    isHome: true,
    kitColor: 'Home (Flame Crimson & Royal Blue)' as any,
    meetupTime: '13:30',
    matchFee: 200,
    nagadNumber: '01705573859',
    focusDrills: 'High-Press Transition, 4v4 + 2 Neutrals, Set Pieces',
    intensity: 'High (Match Prep)' as any
  });

  // Filter & Search Logic
  const filteredEvents = events.filter(e => {
    // Primary Category
    if (activeFilter === 'MATCHES' && e.type !== 'Match') return false;
    if (activeFilter === 'TRAINING' && e.type !== 'Training') return false;
    if (activeFilter === 'BRIEFINGS' && (e.type !== 'Briefing' && e.type !== 'Club Event')) return false;

    // Match Sub Filter
    if (activeFilter === 'MATCHES') {
      if (matchSubFilter === 'UPCOMING' && e.status !== 'Upcoming' && e.status !== 'Live') return false;
      if (matchSubFilter === 'COMPLETED' && e.status !== 'Completed') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchOpponent = e.matchDetails?.opponent?.toLowerCase().includes(q);
      const matchLocation = e.location.toLowerCase().includes(q);
      const matchComp = e.matchDetails?.competition?.toLowerCase().includes(q);
      return matchTitle || matchOpponent || matchLocation || matchComp;
    }

    return true;
  }).sort((a, b) => {
    // When viewing completed results, sort newest first; otherwise sort chronologically
    if (matchSubFilter === 'COMPLETED') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Calculate Matches record
  const matchEvents = events.filter(e => e.type === 'Match');
  const completedMatches = matchEvents.filter(e => e.status === 'Completed' && e.matchDetails?.ourScore !== undefined);
  const wins = completedMatches.filter(e => (e.matchDetails?.ourScore ?? 0) > (e.matchDetails?.opponentScore ?? 0)).length;
  const draws = completedMatches.filter(e => (e.matchDetails?.ourScore ?? 0) === (e.matchDetails?.opponentScore ?? 0)).length;
  const losses = completedMatches.filter(e => (e.matchDetails?.ourScore ?? 0) < (e.matchDetails?.opponentScore ?? 0)).length;
  const goalsFor = completedMatches.reduce((sum, e) => sum + (e.matchDetails?.ourScore ?? 0), 0);
  const goalsAgainst = completedMatches.reduce((sum, e) => sum + (e.matchDetails?.opponentScore ?? 0), 0);

  const upcomingMatch = events.find(e => e.type === 'Match' && (e.status === 'Upcoming' || e.status === 'Live'));

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventData.title && !newEventData.opponent) return;

    const eventTitle = newEventData.title ||
      (newEventData.type === 'Match' ? `Flamehunter FC vs ${newEventData.opponent}` : 'Club Activity');

    const clubEvent: Omit<ClubEvent, 'id'> = {
      title: eventTitle,
      type: newEventData.type,
      date: newEventData.date,
      time: newEventData.time,
      location: newEventData.location,
      status: newEventData.status,
      description: newEventData.description,
      rsvpRequired: newEventData.rsvpRequired,
      matchDetails: newEventData.type === 'Match' ? {
        opponent: newEventData.opponent || 'Opponent FC',
        competition: newEventData.competition,
        isHome: newEventData.isHome,
        venue: newEventData.location,
        kitColor: newEventData.kitColor,
        meetupTime: newEventData.meetupTime,
        matchFee: newEventData.matchFee || 200,
        nagadNumber: newEventData.nagadNumber || '01705573859',
        selectedSquad: [],
        feePayments: {}
      } : undefined,
      trainingDetails: newEventData.type === 'Training' ? {
        focusDrills: newEventData.focusDrills.split(',').map(s => s.trim()),
        intensity: newEventData.intensity,
        coachInCharge: 'Head Coach',
        equipmentNeeded: ['Flamehunter Bibs', 'Match-spec Balls', 'Cones & Agility Ladders']
      } : undefined
    };

    addEvent(clubEvent);
    setIsAddingEvent(false);
  };

  const handleSaveMatchScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingScoreForEvent) return;

    const scorersList = scorerNames.split(',').map(s => s.trim()).filter(Boolean);
    recordMatchResult(recordingScoreForEvent.id, ourScore, oppScore, scorersList);
    setRecordingScoreForEvent(null);
  };

  // Format date readable: e.g. "SAT 26 SEP"
  const formatScheduleDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const monthName = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const dayNum = d.getDate();
        return { dayName, monthName, dayNum, full: `${dayName}, ${monthName} ${dayNum}` };
      }
    } catch {
      // fallback
    }
    return { dayName: 'MATCH', monthName: '', dayNum: dateStr, full: dateStr };
  };

  return (
    <div className="space-y-6">
      {/* Featured Match Hero Card (if upcoming match exists) */}
      {upcomingMatch && upcomingMatch.matchDetails && (
        <div className="bg-[#D71920] border-4 border-black p-4 sm:p-6 text-white shadow-[6px_6px_0px_0px_#000] relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#FFE600] text-black font-black text-xs px-2.5 py-1 border-2 border-black tracking-wider uppercase shadow-[1px_1px_0px_0px_#000]">
                  ⚡ NEXT OFFICIAL MATCHDAY
                </span>
                <span className="bg-[#0066B2] text-white font-black text-xs px-2.5 py-1 border-2 border-black uppercase shadow-[1px_1px_0px_0px_#000]">
                  {upcomingMatch.matchDetails.competition}
                </span>
                <span className="bg-white text-black font-black text-xs px-2.5 py-1 border-2 border-black uppercase shadow-[1px_1px_0px_0px_#000]">
                  {upcomingMatch.matchDetails.isHome ? '🏠 HOME TIE' : '✈️ AWAY FIXTURE'}
                </span>
              </div>

              {/* Large Fixture Matchup Line */}
              <div className="flex items-center gap-3 sm:gap-6 flex-wrap pt-1">
                <div className="flex items-center gap-3">
                  <FlamehunterLogo size="sm" withShadow />
                  <span className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white drop-shadow-[2px_2px_0px_#000]">
                    FLAMEHUNTER FC
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#FFE600] px-3 py-1 bg-black border-2 border-black">
                  VS
                </div>
                <div className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-[#FFE600] drop-shadow-[2px_2px_0px_#000]">
                  {upcomingMatch.matchDetails.opponent}
                </div>
              </div>

              {/* Easy-read Key Logistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-bold pt-2">
                <div className="flex items-center gap-2 bg-black/70 p-2.5 border-2 border-black">
                  <Clock className="w-4 h-4 text-[#FFE600] shrink-0" />
                  <div>
                    <span className="text-[10px] text-neutral-300 block uppercase">KICKOFF & ARRIVAL</span>
                    <span className="text-white font-black">{upcomingMatch.date} @ {upcomingMatch.time}</span>
                    <span className="text-[#FFE600] text-[10px] block font-black">(MEET: {upcomingMatch.matchDetails.meetupTime})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-black/70 p-2.5 border-2 border-black">
                  <MapPin className="w-4 h-4 text-[#FFE600] shrink-0" />
                  <div>
                    <span className="text-[10px] text-neutral-300 block uppercase">PITCH VENUE</span>
                    <span className="text-white font-black truncate block">{upcomingMatch.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-black/70 p-2.5 border-2 border-black">
                  <Shirt className="w-4 h-4 text-[#FFE600] shrink-0" />
                  <div>
                    <span className="text-[10px] text-neutral-300 block uppercase">OFFICIAL KIT</span>
                    <span className="text-white font-black truncate block">{upcomingMatch.matchDetails.kitColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Match Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0">
              <button
                onClick={() => setRecordingScoreForEvent(upcomingMatch)}
                className="bg-[#FFE600] hover:bg-yellow-300 text-black border-3 border-black px-4 py-2.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
              >
                LOG MATCH RESULT
              </button>
              {onGoToAttendance && (
                <button
                  onClick={() => onGoToAttendance(upcomingMatch.id)}
                  className="bg-white hover:bg-neutral-100 text-black border-3 border-black px-4 py-2.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
                >
                  📋 ROLL-CALL ATTENDANCE
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Season Matches Performance Banner */}
      <div className="bg-[#0066B2] border-3 border-black p-3.5 sm:p-4 text-white shadow-[4px_4px_0px_0px_#000] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-[#FFE600] shrink-0" />
          <div>
            <span className="text-xs font-black uppercase text-blue-200 block">
              FLAMEHUNTER FC OFFICIAL SEASON RECORD
            </span>
            <span className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
              {completedMatches.length} PLAYED: <strong className="text-[#FFE600]">{wins} WINS</strong> • {draws} DRAWS • {losses} LOSSES
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-xs font-black uppercase flex-wrap">
          <span className="bg-black text-[#FFE600] px-2.5 py-1 border border-black">
            GOALS: {goalsFor} FOR / {goalsAgainst} AGAINST
          </span>
          <span className="bg-[#22C55E] text-black px-2.5 py-1 border border-black">
            WIN RATE: {completedMatches.length > 0 ? Math.round((wins / completedMatches.length) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Easy-to-Read Controls Bar */}
      <div className="bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
        {/* Row 1: Primary Category Tabs & Add Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Primary tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'MATCHES', label: '⚽ MATCH SCHEDULES', badge: matchEvents.length },
              { id: 'TRAINING', label: '🏋️ TRAININGS', badge: events.filter(e => e.type === 'Training').length },
              { id: 'BRIEFINGS', label: '📋 EVENTS & BRIEFINGS', badge: events.filter(e => e.type === 'Briefing' || e.type === 'Club Event').length },
              { id: 'ALL', label: 'ALL SCHEDULES', badge: events.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3.5 py-2 border-2 border-black text-xs font-black uppercase whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeFilter === tab.id
                    ? 'bg-black text-[#FFE600] shadow-[2px_2px_0px_0px_#FFE600]'
                    : 'bg-[#F6F5EE] text-black hover:bg-[#FFE600] shadow-[2px_2px_0px_0px_#000]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 border ${
                  activeFilter === tab.id ? 'bg-[#FFE600] text-black border-black' : 'bg-white text-black border-black'
                }`}>
                  {tab.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => openRecordPastMatchModal()}
              className="flex items-center justify-center gap-1.5 bg-[#FFE600] hover:bg-yellow-400 text-black border-2 border-black px-3.5 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
              title="Record goals, assists, player ratings, clean sheets & cards for any past match — automatically updates player statistics!"
            >
              <Trophy className="w-4 h-4 text-black shrink-0" />
              <span>⚽ RECORD PAST MATCH & STATS</span>
            </button>
            <button
              onClick={() => setIsAddingEvent(true)}
              className="flex items-center justify-center gap-1.5 bg-[#22C55E] hover:bg-[#16a34a] text-black border-2 border-black px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ NEW FIXTURE</span>
            </button>
          </div>
        </div>

        {/* Row 2: Match Sub-filters (if matches active), Search, and View Mode Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t-2 border-black">
          {/* Sub Filters for Matches */}
          {activeFilter === 'MATCHES' ? (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] font-black uppercase text-neutral-500 mr-1 hidden sm:inline">VIEW:</span>
              {[
                { id: 'ALL', label: 'ALL MATCHES' },
                { id: 'UPCOMING', label: 'UPCOMING FIXTURES' },
                { id: 'COMPLETED', label: 'PAST RESULTS' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setMatchSubFilter(sub.id as any)}
                  className={`px-2.5 py-1 text-[11px] font-black uppercase border-2 border-black transition-all ${
                    matchSubFilter === sub.id
                      ? 'bg-[#D71920] text-white shadow-[1px_1px_0px_0px_#000]'
                      : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs font-bold text-neutral-600">
              Showing {filteredEvents.length} {activeFilter.toLowerCase()} entries
            </div>
          )}

          {/* Search input and View Mode Switcher */}
          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search opponent or venue..."
                className="w-full bg-[#F6F5EE] border-2 border-black pl-8 pr-2 py-1.5 text-xs font-bold focus:outline-none focus:bg-[#FFFEEA]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-xs font-black text-neutral-500 hover:text-black"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Easy-read Layout Toggle */}
            <div className="flex items-center border-2 border-black bg-[#F6F5EE] p-0.5 shadow-[2px_2px_0px_0px_#000] shrink-0">
              <button
                onClick={() => setViewMode('fixtures')}
                title="Table List Layout (Easiest to Read)"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase transition-all ${
                  viewMode === 'fixtures'
                    ? 'bg-black text-[#FFE600]'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">EASY-READ LIST</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                title="Grid Cards Layout"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase transition-all ${
                  viewMode === 'cards'
                    ? 'bg-black text-[#FFE600]'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CARDS</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Fixtures & Schedules Display */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white border-3 border-black p-8 text-center shadow-[4px_4px_0px_0px_#000] space-y-3">
          <Calendar className="w-10 h-10 mx-auto text-neutral-400" />
          <h4 className="text-base font-black uppercase text-black">
            {events.length === 0 ? 'NO MATCHES OR EVENTS SCHEDULED YET' : 'NO SCHEDULED EVENTS FOUND'}
          </h4>
          <p className="text-xs font-bold text-neutral-600 max-w-md mx-auto">
            {events.length === 0
              ? 'The schedule is completely clear and ready for your manual fixtures. Click "+ NEW EVENT" above to create your first match or training session.'
              : `No events match your current filter criteria (${activeFilter} • ${searchQuery || 'No search'}).`}
          </p>
          {events.length === 0 ? (
            <button
              onClick={() => setIsAddingEvent(true)}
              className="bg-[#D71920] hover:bg-red-700 text-white border-3 border-black px-5 py-2.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ CREATE FIRST EVENT</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveFilter('ALL');
                setMatchSubFilter('ALL');
                setSearchQuery('');
              }}
              className="bg-[#FFE600] border-2 border-black px-4 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
            >
              RESET ALL FILTERS
            </button>
          )}
        </div>
      ) : viewMode === 'fixtures' ? (
        /* EASY-TO-READ FIXTURE ROW LAYOUT */
        <div className="space-y-3">
          {filteredEvents.map(event => {
            const dateObj = formatScheduleDate(event.date);
            const isMatch = event.type === 'Match';
            const isCompleted = event.status === 'Completed';
            const isLive = event.status === 'Live';
            const isHome = event.matchDetails?.isHome ?? true;
            const ourScore = event.matchDetails?.ourScore;
            const oppScore = event.matchDetails?.opponentScore;

            let resultLabel: 'WIN' | 'DRAW' | 'LOSS' | null = null;
            if (isCompleted && ourScore !== undefined && oppScore !== undefined) {
              if (ourScore > oppScore) resultLabel = 'WIN';
              else if (ourScore === oppScore) resultLabel = 'DRAW';
              else resultLabel = 'LOSS';
            }

            return (
              <div
                key={event.id}
                id={`fixture-row-${event.id}`}
                className={`border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] transition-all hover:translate-x-0.5 ${
                  isCompleted
                    ? 'bg-[#FAFAF9]'
                    : isMatch
                    ? 'bg-white'
                    : event.type === 'Training'
                    ? 'bg-[#FFFEEA]'
                    : 'bg-[#F0FDF4]'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                  {/* Column 1: Date & Time Pill */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="bg-black text-white border-2 border-black w-20 py-2 text-center shadow-[2px_2px_0px_0px_#FFE600] shrink-0">
                      <span className="text-[10px] font-black uppercase text-[#FFE600] block leading-none">
                        {dateObj.dayName}
                      </span>
                      <span className="text-xl font-black block leading-none mt-1">
                        {dateObj.dayNum}
                      </span>
                      <span className="text-[9px] font-bold text-neutral-300 uppercase block leading-none mt-1">
                        {dateObj.monthName}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 border border-black uppercase ${
                          event.type === 'Match' ? 'bg-[#D71920] text-white' :
                          event.type === 'Training' ? 'bg-[#FFE600] text-black' :
                          'bg-[#0066B2] text-white'
                        }`}>
                          {event.type}
                        </span>

                        <span className={`text-[10px] font-black px-2 py-0.5 border border-black uppercase ${
                          isCompleted ? 'bg-[#22C55E] text-black' :
                          isLive ? 'bg-[#FF2A85] text-white' : 'bg-black text-white'
                        }`}>
                          {event.status}
                        </span>
                      </div>

                      <div className="text-xs font-black text-black flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{event.time} KICKOFF</span>
                      </div>
                      {event.matchDetails?.meetupTime && (
                        <div className="text-[10px] font-bold text-neutral-600">
                          Meet: <strong className="text-black">{event.matchDetails.meetupTime}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: The Core Fixture / Matchup (Highest Readability) */}
                  <div className="flex-1 min-w-0">
                    {isMatch && event.matchDetails ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Home vs Away Indicator */}
                          <span className={`text-[10px] font-black px-2 py-0.5 border border-black uppercase ${
                            isHome ? 'bg-[#D71920] text-white' : 'bg-[#0066B2] text-white'
                          }`}>
                            {isHome ? '🏠 HOME' : '✈️ AWAY'}
                          </span>

                          <span className="text-xs font-black text-neutral-600 uppercase">
                            {event.matchDetails.competition}
                          </span>
                        </div>

                        {/* Matchup Teams & Big Score Display */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
                          {/* Home Team */}
                          <div className={`flex items-center gap-2 font-black uppercase text-base sm:text-lg ${
                            isHome ? 'text-black' : 'text-neutral-700'
                          }`}>
                            {isHome ? (
                              <>
                                <FlamehunterLogo size="xs" />
                                <span className="truncate">FLAMEHUNTER FC</span>
                              </>
                            ) : (
                              <span className="truncate">{event.matchDetails.opponent}</span>
                            )}
                          </div>

                          {/* Center Score or VS */}
                          <div className="shrink-0 px-2">
                            {isCompleted && ourScore !== undefined && oppScore !== undefined ? (
                              <div className="flex items-center gap-2">
                                <div className="bg-black text-white px-3 py-1 border-2 border-black font-mono font-black text-lg sm:text-xl tracking-widest shadow-[2px_2px_0px_0px_#000]">
                                  {isHome ? `${ourScore} - ${oppScore}` : `${oppScore} - ${ourScore}`}
                                </div>
                                {resultLabel && (
                                  <span className={`text-xs font-black px-2 py-1 border-2 border-black uppercase shadow-[1px_1px_0px_0px_#000] ${
                                    resultLabel === 'WIN' ? 'bg-[#22C55E] text-black' :
                                    resultLabel === 'DRAW' ? 'bg-[#FFE600] text-black' :
                                    'bg-[#FF4500] text-white'
                                  }`}>
                                    {resultLabel}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="bg-[#F6F5EE] border-2 border-black px-2.5 py-0.5 text-xs font-black text-neutral-700">
                                VS
                              </span>
                            )}
                          </div>

                          {/* Away Team */}
                          <div className={`flex items-center gap-2 font-black uppercase text-base sm:text-lg ${
                            !isHome ? 'text-black' : 'text-neutral-700'
                          }`}>
                            {!isHome ? (
                              <>
                                <FlamehunterLogo size="xs" />
                                <span className="truncate">FLAMEHUNTER FC</span>
                              </>
                            ) : (
                              <span className="truncate">{event.matchDetails.opponent}</span>
                            )}
                          </div>
                        </div>

                        {/* Match Results & Performance Summary if completed */}
                        {isCompleted && (
                          <div className="space-y-1.5 pt-1">
                            {event.matchDetails.scorers && event.matchDetails.scorers.length > 0 && (
                              <div className="text-xs font-bold text-neutral-800 bg-white p-1.5 border border-black flex items-center gap-1.5 flex-wrap">
                                <span className="text-black font-black flex items-center gap-1">
                                  <span>⚽ SCORERS:</span>
                                </span>
                                <span>{event.matchDetails.scorers.join(', ')}</span>
                              </div>
                            )}

                            {/* Additional stats from player performances */}
                            {event.matchDetails.playerPerformances && (
                              <div className="flex items-center gap-2 flex-wrap text-[10px] font-black uppercase">
                                {event.matchDetails.manOfTheMatchPlayerId && (
                                  <span className="bg-[#FFE600] text-black px-2 py-0.5 border border-black flex items-center gap-1 shadow-[1px_1px_0px_0px_#000]">
                                    ⭐ MOM: {players.find(p => p.id === event.matchDetails?.manOfTheMatchPlayerId)?.name || 'Squad Star'}
                                  </span>
                                )}
                                {(event.matchDetails.opponentScore === 0) && (
                                  <span className="bg-[#00E5FF] text-black px-2 py-0.5 border border-black flex items-center gap-1 shadow-[1px_1px_0px_0px_#000]">
                                    🧤 CLEAN SHEET
                                  </span>
                                )}
                                <span className="bg-white text-neutral-700 px-2 py-0.5 border border-black">
                                  📊 {Object.values(event.matchDetails.playerPerformances).filter(p => p.played).length} SQUAD PARTICIPANTS LOGGED
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Match Squad & Match Fee Section */}
                        <div className="mt-2.5 pt-2 border-t border-dashed border-neutral-300 space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Selected Squad Badge */}
                              <button
                                type="button"
                                onClick={() => setSquadFeeModalEvent(event)}
                                className="bg-black text-[#FFE600] border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1 hover:bg-neutral-800 shadow-[1px_1px_0px_0px_#000]"
                              >
                                <Users className="w-3 h-3" />
                                <span>SQUAD: {event.matchDetails.selectedSquad?.length || 0} SELECTED</span>
                              </button>

                              {/* Match Fee Badge */}
                              <span className="bg-[#00E5FF] text-black border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1 shadow-[1px_1px_0px_0px_#000]">
                                <Banknote className="w-3 h-3" />
                                <span>FEE: ৳{event.matchDetails.matchFee ?? 200}</span>
                              </span>

                              {/* Nagad badge */}
                              <span className="bg-[#FFE600] text-black border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1 shadow-[1px_1px_0px_0px_#000]">
                                <Smartphone className="w-3 h-3 text-[#D71920]" />
                                <span>NAGAD: {event.matchDetails.nagadNumber || '01705573859'}</span>
                              </span>
                            </div>

                            {/* Squad & Fees Action Button */}
                            <button
                              type="button"
                              onClick={() => setSquadFeeModalEvent(event)}
                              className="text-[11px] font-black text-black bg-[#FFE600] hover:bg-yellow-400 border-2 border-black px-2.5 py-1 uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>SQUAD & PAY FEE</span>
                            </button>
                          </div>

                          {/* Selected Player Chips preview */}
                          {event.matchDetails.selectedSquad && event.matchDetails.selectedSquad.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-black text-neutral-500 uppercase">SELECTED:</span>
                              {event.matchDetails.selectedSquad.slice(0, 7).map(pid => {
                                const p = players.find(player => player.id === pid);
                                if (!p) return null;
                                const isPaid = event.matchDetails?.feePayments?.[p.id]?.isPaid;
                                return (
                                  <span
                                    key={p.id}
                                    className={`text-[9px] font-black px-1.5 py-0.5 border border-black uppercase flex items-center gap-1 ${
                                      isPaid ? 'bg-[#22C55E] text-black' : 'bg-white text-black'
                                    }`}
                                    title={isPaid ? `${p.name} - Fee Paid` : `${p.name} - Fee Pending`}
                                  >
                                    <span>#{p.number} {p.name.split(' ')[1] || p.name}</span>
                                    {isPaid && <Check className="w-2.5 h-2.5" />}
                                  </span>
                                );
                              })}
                              {event.matchDetails.selectedSquad.length > 7 && (
                                <button
                                  type="button"
                                  onClick={() => setSquadFeeModalEvent(event)}
                                  className="text-[9px] font-black text-neutral-600 bg-neutral-100 hover:bg-neutral-200 px-1.5 py-0.5 border border-black uppercase"
                                >
                                  +{event.matchDetails.selectedSquad.length - 7} MORE...
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold text-neutral-500 italic flex items-center justify-between">
                              <span>Squad not announced yet.</span>
                              {currentUser.isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setSquadFeeModalEvent(event)}
                                  className="text-[10px] font-black text-[#D71920] underline uppercase"
                                >
                                  Select Match Squad Now
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Training / Briefing Title & Content */
                      <div className="space-y-1">
                        <h4 className="text-base sm:text-lg font-black uppercase text-black leading-tight">
                          {event.title}
                        </h4>
                        <p className="text-xs font-bold text-neutral-700 leading-relaxed">
                          {event.description}
                        </p>
                        {event.trainingDetails && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] font-black uppercase bg-[#FFE600] px-1.5 py-0.5 border border-black">
                              INTENSITY: {event.trainingDetails.intensity}
                            </span>
                            {event.trainingDetails.focusDrills.map((drill, idx) => (
                              <span key={idx} className="bg-white border border-black text-[10px] font-bold px-1.5 py-0.5">
                                • {drill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Venue & Kit line */}
                    <div className="flex items-center gap-3 text-xs font-bold text-neutral-600 mt-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                        <span className="text-black">{event.location}</span>
                      </span>
                      {event.matchDetails?.kitColor && (
                        <span className="flex items-center gap-1">
                          <Shirt className="w-3.5 h-3.5 text-black shrink-0" />
                          <span>Kit: {event.matchDetails.kitColor}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Action Buttons */}
                  <div className="flex flex-wrap lg:flex-col items-stretch sm:items-center justify-start lg:justify-end gap-2 shrink-0 pt-2.5 lg:pt-0 border-t-2 lg:border-t-0 border-black w-full lg:w-auto">
                    {onGoToAttendance && (
                      <button
                        onClick={() => onGoToAttendance(event.id)}
                        className="bg-[#F6F5EE] hover:bg-[#22C55E] hover:text-black text-black border-2 border-black px-3 py-1.5 text-xs font-black uppercase transition-colors shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 whitespace-nowrap flex-1 sm:flex-initial"
                      >
                        📋 ATTENDANCE
                      </button>
                    )}

                    {isMatch && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSquadFeeModalEvent(event)}
                          className="bg-[#00E5FF] hover:bg-cyan-400 text-black border-2 border-black px-3 py-1.5 text-xs font-black uppercase transition-colors shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 whitespace-nowrap flex-1 sm:flex-initial"
                        >
                          👥 SQUAD & FEES (৳{event.matchDetails?.matchFee ?? 200})
                        </button>
                        <button
                          type="button"
                          onClick={() => openRecordPastMatchModal(event)}
                          className="bg-[#FFE600] hover:bg-yellow-300 text-black border-2 border-black px-3 py-1.5 text-xs font-black uppercase transition-colors shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 whitespace-nowrap flex items-center justify-center gap-1 cursor-pointer flex-1 sm:flex-initial"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>{isCompleted ? '📊 STATS / EDIT' : '⚽ LOG SCORE & STATS'}</span>
                        </button>
                      </>
                    )}

                    {/* Admin Actions */}
                    {currentUser.isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditEventModal(event)}
                          className="bg-white hover:bg-[#FFE600] text-black border-2 border-black px-2.5 py-1.5 text-xs font-black uppercase transition-colors shadow-[2px_2px_0px_0px_#000] flex items-center gap-1 whitespace-nowrap"
                          title="Edit Schedule & Fixture Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>EDIT</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Permanently delete event "${event.title}" from schedules?`)) {
                              deleteEvent(event.id);
                            }
                          }}
                          className="bg-white hover:bg-[#FF4500] hover:text-white text-[#FF4500] border-2 border-black p-1.5 text-xs font-black transition-colors shadow-[2px_2px_0px_0px_#000]"
                          title="Delete schedule item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map(event => (
            <div
              key={event.id}
              className={`border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between transition-all ${
                event.status === 'Completed'
                  ? 'bg-neutral-50'
                  : event.type === 'Match'
                  ? 'bg-white'
                  : 'bg-[#FFFEEA]'
              }`}
            >
              <div>
                {/* Event Header */}
                <div className="flex items-start justify-between gap-2 border-b-2 border-black pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black px-2 py-0.5 border-2 border-black uppercase ${
                      event.type === 'Match' ? 'bg-[#D71920] text-white' :
                      event.type === 'Training' ? 'bg-[#FFE600] text-black' :
                      'bg-[#0066B2] text-white'
                    }`}>
                      {event.type}
                    </span>
                    <span className="text-xs font-black text-black">
                      {event.date} @ {event.time}
                    </span>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 border border-black uppercase ${
                    event.status === 'Completed' ? 'bg-[#22C55E] text-black' :
                    event.status === 'Live' ? 'bg-[#FF2A85] text-white' : 'bg-black text-white'
                  }`}>
                    {event.status}
                  </span>
                </div>

                {/* Match Details or Event Title */}
                <div className="mt-3">
                  {event.type === 'Match' && event.matchDetails ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="bg-[#FFE600] px-1.5 py-0.5 border border-black uppercase">
                          {event.matchDetails.isHome ? '🏠 HOME FIXTURE' : '✈️ AWAY FIXTURE'}
                        </span>
                        <span className="text-neutral-600 uppercase">{event.matchDetails.competition}</span>
                      </div>

                      <div className="bg-[#F6F5EE] border-2 border-black p-3 text-center space-y-2">
                        <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-black uppercase">
                          <span>{event.matchDetails.isHome ? 'FLAMEHUNTER FC' : event.matchDetails.opponent}</span>
                          <span className="text-[#D71920]">VS</span>
                          <span>{event.matchDetails.isHome ? event.matchDetails.opponent : 'FLAMEHUNTER FC'}</span>
                        </div>

                        {event.status === 'Completed' && event.matchDetails.ourScore !== undefined && (
                          <div className="bg-black text-white p-2 border-2 border-black">
                            <span className="text-[10px] font-black uppercase text-[#FFE600] block">FINAL SCORE</span>
                            <span className="text-2xl font-black tracking-widest text-white">
                              {event.matchDetails.ourScore} - {event.matchDetails.opponentScore}
                            </span>
                            {event.matchDetails.scorers && (
                              <div className="text-[11px] font-bold text-neutral-300 mt-1">
                                ⚽ {event.matchDetails.scorers.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-lg font-black uppercase text-black leading-tight">
                        {event.title}
                      </h4>
                      <p className="text-xs font-bold text-neutral-700 mt-1 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  )}

                  {/* Location & Kit */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                    <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t-2 border-black flex items-center gap-2">
                {onGoToAttendance && (
                  <button
                    onClick={() => onGoToAttendance(event.id)}
                    className="flex-1 bg-[#F6F5EE] hover:bg-[#22C55E] hover:text-black text-black border-2 border-black py-1.5 text-xs font-black uppercase transition-colors shadow-[2px_2px_0px_0px_#000]"
                  >
                    📋 ATTENDANCE LOG
                  </button>
                )}

                {event.type === 'Match' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSquadFeeModalEvent(event)}
                      className="bg-[#00E5FF] hover:bg-cyan-300 text-black border-2 border-black px-2.5 py-1.5 text-xs font-black uppercase transition-colors shadow-[2px_2px_0px_0px_#000]"
                    >
                      👥 SQUAD & FEES (৳{event.matchDetails?.matchFee ?? 200})
                    </button>
                    <button
                      type="button"
                      onClick={() => openRecordPastMatchModal(event)}
                      className="bg-[#FFE600] hover:bg-yellow-300 text-black border-2 border-black px-3 py-1.5 text-xs font-black uppercase transition-colors shadow-[2px_2px_0px_0px_#000] flex items-center gap-1 cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{event.status === 'Completed' ? 'STATS / EDIT' : 'LOG SCORE'}</span>
                    </button>
                  </>
                )}

                {/* Admin Actions */}
                {currentUser.isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditEventModal(event)}
                      className="bg-white hover:bg-[#FFE600] text-black border-2 border-black px-2 py-1.5 text-xs font-black uppercase transition-colors shadow-[2px_2px_0px_0px_#000] flex items-center gap-1"
                      title="Edit Schedule"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">EDIT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Permanently delete event "${event.title}"?`)) {
                          deleteEvent(event.id);
                        }
                      }}
                      className="bg-white hover:bg-[#FF4500] hover:text-white text-[#FF4500] border-2 border-black p-1.5 text-xs font-black transition-colors shadow-[2px_2px_0px_0px_#000]"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Schedule Event */}
      {isAddingEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#F6F5EE] border-4 border-black w-full max-w-xl shadow-[8px_8px_0px_0px_#000] p-5 sm:p-6 my-8">
            <div className="flex items-center justify-between border-b-3 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-[#FFE600] p-1 border-2 border-black">
                  <Calendar className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-xl font-black uppercase text-black">SCHEDULE NEW FIXTURE OR EVENT</h3>
              </div>
              <button
                onClick={() => setIsAddingEvent(false)}
                className="bg-white border-2 border-black p-1 hover:bg-[#FF4500] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Event Type *</label>
                  <select
                    value={newEventData.type}
                    onChange={(e) => setNewEventData({ ...newEventData, type: e.target.value as EventType })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                  >
                    <option value="Match">⚽ Official Match</option>
                    <option value="Training">🏋️ Training Session</option>
                    <option value="Briefing">📋 Tactical Briefing</option>
                    <option value="Club Event">🎉 Club & Team Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Title</label>
                  <input
                    type="text"
                    value={newEventData.title}
                    onChange={(e) => setNewEventData({ ...newEventData, title: e.target.value })}
                    placeholder={newEventData.type === 'Match' ? 'e.g. Flamehunter FC vs Rivals' : 'e.g. Speed & Agility Session'}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                  />
                </div>
              </div>

              {newEventData.type === 'Match' && (
                <div className="bg-white border-2 border-black p-3 space-y-3">
                  <span className="text-xs font-black uppercase text-[#D71920] block">
                    MATCHDAY SPECIFICATIONS
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Opponent Club *</label>
                      <input
                        type="text"
                        required={newEventData.type === 'Match'}
                        value={newEventData.opponent}
                        onChange={(e) => setNewEventData({ ...newEventData, opponent: e.target.value })}
                        placeholder="e.g. Ironbridge United"
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Competition</label>
                      <input
                        type="text"
                        value={newEventData.competition}
                        onChange={(e) => setNewEventData({ ...newEventData, competition: e.target.value })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Venue</label>
                      <select
                        value={newEventData.isHome ? 'Home' : 'Away'}
                        onChange={(e) => setNewEventData({ ...newEventData, isHome: e.target.value === 'Home' })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                      >
                        <option value="Home">Home (Flame Arena)</option>
                        <option value="Away">Away Fixture</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Kit Selection</label>
                      <select
                        value={newEventData.kitColor}
                        onChange={(e) => setNewEventData({ ...newEventData, kitColor: e.target.value as any })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                      >
                        <option value="Home (Flame Crimson & Royal Blue)">Home (Flame Crimson & Royal Blue)</option>
                        <option value="Away (White Frost & Royal Blue)">Away (White Frost & Royal Blue)</option>
                        <option value="Third (Volt Gold & Blue)">Third (Volt Gold & Blue)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Meetup Time</label>
                      <input
                        type="time"
                        value={newEventData.meetupTime}
                        onChange={(e) => setNewEventData({ ...newEventData, meetupTime: e.target.value })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                      />
                    </div>
                  </div>
                </div>
              )}

              {newEventData.type === 'Training' && (
                <div className="bg-white border-2 border-black p-3 space-y-3">
                  <span className="text-xs font-black uppercase text-[#22C55E] block">
                    TRAINING SESSION METRICS
                  </span>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Key Focus Drills (comma separated)</label>
                    <input
                      type="text"
                      value={newEventData.focusDrills}
                      onChange={(e) => setNewEventData({ ...newEventData, focusDrills: e.target.value })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Session Intensity</label>
                    <select
                      value={newEventData.intensity}
                      onChange={(e) => setNewEventData({ ...newEventData, intensity: e.target.value as any })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                    >
                      <option value="Low (Recovery)">Low (Recovery & Mobility)</option>
                      <option value="Medium">Medium</option>
                      <option value="High (Match Prep)">High (Tactical Match Prep)</option>
                      <option value="Intense (Physical)">Intense (Physical & Sprints)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newEventData.date}
                    onChange={(e) => setNewEventData({ ...newEventData, date: e.target.value })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Kickoff / Start Time *</label>
                  <input
                    type="time"
                    required
                    value={newEventData.time}
                    onChange={(e) => setNewEventData({ ...newEventData, time: e.target.value })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Status</label>
                  <select
                    value={newEventData.status}
                    onChange={(e) => setNewEventData({ ...newEventData, status: e.target.value as EventStatus })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Live">Live / Today</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Location / Pitch *</label>
                <input
                  type="text"
                  required
                  value={newEventData.location}
                  onChange={(e) => setNewEventData({ ...newEventData, location: e.target.value })}
                  placeholder="e.g. Flame Arena Pitch 1"
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Brief Description / Squad Instructions</label>
                <textarea
                  rows={2}
                  value={newEventData.description}
                  onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                  placeholder="Arrival notes, tactical emphasis, parking info..."
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                />
              </div>

              <div className="pt-3 border-t-2 border-black flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingEvent(false)}
                  className="bg-white border-2 border-black px-4 py-2 text-xs font-black uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-[#FFE600] hover:bg-yellow-400 text-black border-2 border-black px-5 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                >
                  PUBLISH SCHEDULE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Match Result */}
      {recordingScoreForEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F6F5EE] border-4 border-black w-full max-w-lg shadow-[8px_8px_0px_0px_#000] p-5 sm:p-6">
            <div className="flex items-center justify-between border-b-3 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-[#FF4500] text-white p-1 border-2 border-black">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black uppercase text-black">RECORD OFFICIAL MATCH RESULT</h3>
              </div>
              <button
                onClick={() => setRecordingScoreForEvent(null)}
                className="bg-white border-2 border-black p-1 hover:bg-[#FF4500] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMatchScore} className="mt-4 space-y-4">
              <p className="text-xs font-bold text-neutral-700 uppercase">
                FIXTURE: {recordingScoreForEvent.title}
              </p>

              {/* Score Inputs */}
              <div className="bg-white border-3 border-black p-4 grid grid-cols-3 items-center text-center gap-2">
                <div>
                  <label className="block text-xs font-black uppercase text-[#D71920] mb-1">
                    FLAMEHUNTER
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    value={ourScore}
                    onChange={(e) => setOurScore(parseInt(e.target.value) || 0)}
                    className="w-20 mx-auto text-3xl font-black text-center bg-[#F6F5EE] border-2 border-black p-2"
                  />
                </div>

                <div className="text-2xl font-black text-neutral-400">VS</div>

                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1 truncate">
                    {recordingScoreForEvent.matchDetails?.opponent || 'OPPONENT'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    value={oppScore}
                    onChange={(e) => setOppScore(parseInt(e.target.value) || 0)}
                    className="w-20 mx-auto text-3xl font-black text-center bg-[#F6F5EE] border-2 border-black p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  Goalscorers & Minutes (comma separated)
                </label>
                <input
                  type="text"
                  value={scorerNames}
                  onChange={(e) => setScorerNames(e.target.value)}
                  placeholder="e.g. Striker Name (34'), Midfielder Name (78')"
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                />
                <span className="text-[10px] font-bold text-neutral-500 mt-1 block">
                  Tip: Pick registered squad forwards ({players.slice(0, 4).map(p => p.name).join(', ')})
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setRecordingScoreForEvent(null)}
                  className="bg-white border-2 border-black px-4 py-2 text-xs font-black uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-[#22C55E] text-black border-2 border-black px-5 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                >
                  SUBMIT RESULT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Schedule / Fixture (Admin) */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#F6F5EE] border-4 border-black w-full max-w-xl shadow-[8px_8px_0px_0px_#000] p-5 sm:p-6 my-8">
            <div className="flex items-center justify-between border-b-3 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-[#FFE600] p-1 border-2 border-black">
                  <Edit3 className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-black leading-tight">
                    EDIT SCHEDULED EVENT
                  </h3>
                  <p className="text-[10px] font-bold text-neutral-600 uppercase">
                    UPDATE FIXTURE TIMINGS, VENUE, SQUAD FEES & DETAILS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="bg-white hover:bg-black hover:text-white border-2 border-black p-1 text-xs font-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {/* Event Type & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Event Category *</label>
                  <select
                    value={editEventData.type}
                    onChange={(e) => setEditEventData({ ...editEventData, type: e.target.value as EventType })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black uppercase"
                  >
                    <option value="Match">Official Match / Fixture</option>
                    <option value="Training">Training / Practice Session</option>
                    <option value="Briefing">Tactical Briefing / Meeting</option>
                    <option value="Event">Club Social / Other Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Match / Event Status *</label>
                  <select
                    value={editEventData.status}
                    onChange={(e) => setEditEventData({ ...editEventData, status: e.target.value as EventStatus })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black uppercase"
                  >
                    <option value="Upcoming">Upcoming (Scheduled)</option>
                    <option value="Live">Live (In Progress)</option>
                    <option value="Completed">Completed (Final Result)</option>
                    <option value="Postponed">Postponed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Title / Summary */}
              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  Event Title {editEventData.type === 'Match' && '(Leave blank to auto-generate)'}
                </label>
                <input
                  type="text"
                  value={editEventData.title}
                  onChange={(e) => setEditEventData({ ...editEventData, title: e.target.value })}
                  placeholder={editEventData.type === 'Match' ? 'e.g. Flamehunter FC vs Dhaka Titans' : 'e.g. Morning High-Intensity Drill'}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={editEventData.date}
                    onChange={(e) => setEditEventData({ ...editEventData, date: e.target.value })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Kickoff / Start Time *</label>
                  <input
                    type="time"
                    required
                    value={editEventData.time}
                    onChange={(e) => setEditEventData({ ...editEventData, time: e.target.value })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-xs font-black uppercase mb-1">Pitch / Venue Location *</label>
                <input
                  type="text"
                  required
                  value={editEventData.location}
                  onChange={(e) => setEditEventData({ ...editEventData, location: e.target.value })}
                  placeholder="e.g. Fortis Downtown Arena Pitch 1, Dhaka"
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                />
              </div>

              {/* Match Specific Fields */}
              {editEventData.type === 'Match' && (
                <div className="bg-white border-2 border-black p-3 space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                    <span className="text-xs font-black uppercase text-[#D71920]">FIXTURE SPECIFICS</span>
                    <span className="text-[10px] font-black bg-[#FFE600] px-1.5 py-0.5 border border-black">MATCH DAY</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Opponent Club Name *</label>
                      <input
                        type="text"
                        required
                        value={editEventData.opponent}
                        onChange={(e) => setEditEventData({ ...editEventData, opponent: e.target.value })}
                        placeholder="e.g. Dhaka Titans FC"
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Competition / League</label>
                      <input
                        type="text"
                        value={editEventData.competition}
                        onChange={(e) => setEditEventData({ ...editEventData, competition: e.target.value })}
                        placeholder="Premier Metro Cup"
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Side</label>
                      <select
                        value={editEventData.isHome ? 'home' : 'away'}
                        onChange={(e) => setEditEventData({ ...editEventData, isHome: e.target.value === 'home' })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                      >
                        <option value="home">Home (FFC)</option>
                        <option value="away">Away</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Squad Meetup</label>
                      <input
                        type="time"
                        value={editEventData.meetupTime}
                        onChange={(e) => setEditEventData({ ...editEventData, meetupTime: e.target.value })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Match Fee (৳ BDT)</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={editEventData.matchFee}
                        onChange={(e) => setEditEventData({ ...editEventData, matchFee: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Kit Color Choice</label>
                      <input
                        type="text"
                        value={editEventData.kitColor}
                        onChange={(e) => setEditEventData({ ...editEventData, kitColor: e.target.value })}
                        placeholder="Home (Flame Crimson & Royal Blue)"
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Nagad Receiver Number</label>
                      <input
                        type="text"
                        value={editEventData.nagadNumber}
                        onChange={(e) => setEditEventData({ ...editEventData, nagadNumber: e.target.value })}
                        placeholder="01705573859"
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Training Specific Fields */}
              {editEventData.type === 'Training' && (
                <div className="bg-white border-2 border-black p-3 space-y-3">
                  <div>
                    <label className="block text-xs font-black uppercase mb-1">Training Intensity</label>
                    <select
                      value={editEventData.intensity}
                      onChange={(e) => setEditEventData({ ...editEventData, intensity: e.target.value })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                    >
                      <option value="Low (Recovery)">Low (Recovery & Light Stretching)</option>
                      <option value="Medium">Medium (Tactical Drills & Possession)</option>
                      <option value="High (Match Prep)">High (Match Prep & High Pressing)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase mb-1">Drills (Comma-separated)</label>
                    <input
                      type="text"
                      value={editEventData.focusDrills}
                      onChange={(e) => setEditEventData({ ...editEventData, focusDrills: e.target.value })}
                      placeholder="High-Press Transition, 4v4 + 2 Neutrals, Set Pieces"
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Notes / Description */}
              <div>
                <label className="block text-xs font-black uppercase mb-1">Tactical Briefing / Event Notes</label>
                <textarea
                  rows={2}
                  value={editEventData.description}
                  onChange={(e) => setEditEventData({ ...editEventData, description: e.target.value })}
                  placeholder="Instructions for squad arrival, warm-up drills, match strategies..."
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t-2 border-black">
                {currentUser.isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Permanently delete event "${editingEvent.title}" from schedules?`)) {
                        deleteEvent(editingEvent.id);
                        setEditingEvent(null);
                      }
                    }}
                    className="bg-red-100 hover:bg-red-600 hover:text-white text-red-700 border-2 border-black px-3 py-2 text-xs font-black uppercase transition-colors shadow-[2px_2px_0px_0px_#000] flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>DELETE EVENT</span>
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    className="bg-white border-2 border-black px-4 py-2 text-xs font-black uppercase hover:bg-neutral-200"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="bg-[#22C55E] hover:bg-green-400 text-black border-2 border-black px-5 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                  >
                    SAVE CHANGES
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Match Squad & Fee Management */}
      {squadFeeModalEvent && (
        <MatchSquadFeeModal
          event={squadFeeModalEvent}
          onClose={() => setSquadFeeModalEvent(null)}
        />
      )}
    </div>
  );
};
