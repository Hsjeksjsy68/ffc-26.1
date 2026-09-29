import React, { useState, useEffect } from 'react';
import { useClub } from '../context/ClubContext';
import { AttendanceStatus, ClubEvent } from '../types';
import { sendPhonePushAlert } from '../utils/phoneNotification';
import {
  CheckSquare,
  Clock,
  XCircle,
  AlertCircle,
  Users,
  Check,
  Save,
  Award,
  FileText,
  ChevronDown,
  UserCheck,
  CheckCircle,
  Smartphone
} from 'lucide-react';

interface AttendanceViewProps {
  initialEventId?: string;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ initialEventId }) => {
  const {
    events,
    players,
    attendanceRecords,
    saveAttendance,
    givePlayerAttendance,
    getPlayerAttendanceStats,
    getTeamAttendanceRate,
    openPlayerProfile,
    currentUser
  } = useClub();

  // Find valid events for attendance (Matches & Trainings)
  const trackableEvents = events.filter(e => e.type === 'Match' || e.type === 'Training');
  const defaultEventId = initialEventId || trackableEvents[0]?.id || '';

  const [selectedEventId, setSelectedEventId] = useState<string>(defaultEventId);
  const [activeTab, setActiveTab] = useState<'session' | 'leaderboard'>('session');
  const [sessionRecords, setSessionRecords] = useState<Record<string, AttendanceStatus>>({});
  const [sessionNotes, setSessionNotes] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  // Check-in state
  const [selectedCheckInPlayerId, setSelectedCheckInPlayerId] = useState<string>(players[0]?.id || '');
  const [selfStatusChoice, setSelfStatusChoice] = useState<AttendanceStatus>('present');
  const [selfNote, setSelfNote] = useState('');
  const [selfSuccessMsg, setSelfSuccessMsg] = useState('');

  const currentEvent = events.find(e => e.id === selectedEventId);
  const currentAttendanceRecord = attendanceRecords.find(r => r.eventId === selectedEventId);
  const activeCheckInPlayer = players.find(p => p.id === (selectedCheckInPlayerId || players[0]?.id)) || players[0];
  const mySelfCheckIn = activeCheckInPlayer ? currentAttendanceRecord?.selfCheckIns?.[activeCheckInPlayer.id] : null;

  // Load existing records for the chosen event, or default all to 'present'
  useEffect(() => {
    if (!selectedEventId) return;
    const existing = attendanceRecords.find(r => r.eventId === selectedEventId);
    if (existing) {
      setSessionRecords({ ...existing.records });
      setSessionNotes(existing.notes || '');
    } else {
      // Default to empty or present
      const initial: Record<string, AttendanceStatus> = {};
      players.forEach(p => {
        initial[p.id] = 'present';
      });
      setSessionRecords(initial);
      setSessionNotes('');
    }
  }, [selectedEventId, attendanceRecords, players]);

  // Update a single player's status
  const setPlayerStatus = (playerId: string, status: AttendanceStatus) => {
    setSessionRecords(prev => ({
      ...prev,
      [playerId]: status
    }));
  };

  // Bulk actions
  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    players.forEach(p => {
      updated[p.id] = status;
    });
    setSessionRecords(updated);
  };

  // Save changes
  const handleSave = () => {
    if (!selectedEventId) return;
    saveAttendance(selectedEventId, sessionRecords, sessionNotes);
    setSaveSuccessMessage(true);
    setTimeout(() => setSaveSuccessMessage(false), 3000);
  };

  // Player Check-In Action
  const handleSelfCheckIn = (status: AttendanceStatus) => {
    if (!selectedEventId) return;
    const targetPlayer = activeCheckInPlayer || players[0];
    if (!targetPlayer) return;

    givePlayerAttendance(selectedEventId, status, selfNote);
    setPlayerStatus(targetPlayer.id, status);
    setSelfSuccessMsg(`Attendance registered for #${targetPlayer.number} ${targetPlayer.name} as ${status.toUpperCase()}!`);
    sendPhonePushAlert({
      title: 'Attendance Confirmed',
      senderName: targetPlayer.name,
      senderRole: targetPlayer.role,
      text: `Check-in recorded as ${status.toUpperCase()}${selfNote ? ` ("${selfNote}")` : ''} for ${currentEvent?.title || 'session'}.`,
      avatarBg: targetPlayer.avatarBg
    });
    setTimeout(() => setSelfSuccessMsg(''), 3500);
  };

  // Metrics for selected session
  const totalSlots = players.length;
  const presentCount = Object.values(sessionRecords).filter(s => s === 'present').length;
  const lateCount = Object.values(sessionRecords).filter(s => s === 'late').length;
  const excusedCount = Object.values(sessionRecords).filter(s => s === 'excused').length;
  const absentCount = Object.values(sessionRecords).filter(s => s === 'absent').length;

  const validAttendees = presentCount + lateCount;
  const activeAttendees = totalSlots - excusedCount;
  const sessionRate = activeAttendees > 0 ? Math.round((validAttendees / activeAttendees) * 100) : 100;

  // Leaderboard data
  const playerStatsList = players.map(player => ({
    player,
    ...getPlayerAttendanceStats(player.id)
  })).sort((a, b) => b.percentage - a.percentage);

  if (events.length === 0) {
    return (
      <div className="bg-white border-3 border-black p-8 sm:p-12 text-center shadow-[6px_6px_0px_0px_#000] space-y-4 my-6">
        <div className="w-16 h-16 bg-[#FFE600] border-3 border-black mx-auto flex items-center justify-center font-black text-3xl shadow-[3px_3px_0px_0px_#000]">
          📋
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black uppercase text-black">NO EVENTS TO TRACK ATTENDANCE FOR</h3>
          <p className="text-xs font-bold text-neutral-600 uppercase mt-1.5 max-w-md mx-auto">
            All baseline data has been wiped. Please create your matches or training sessions in the "MATCHES" tab to take attendance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Control: Session Picker & View Switcher */}
      <div className="bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Event Selector Dropdown */}
        <div className="flex-1">
          <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">
            SELECT EVENT / FIXTURE TO TRACK:
          </label>
          <div className="relative">
            <select
              id="attendance-event-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-[#F6F5EE] border-2 border-black p-2.5 text-xs font-black uppercase focus:outline-none focus:bg-[#FFE600] cursor-pointer"
            >
              {trackableEvents.map(evt => (
                <option key={evt.id} value={evt.id}>
                  [{evt.type.toUpperCase()}] {evt.date} • {evt.title} ({evt.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Switcher: Single Event vs Season Standings */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('session')}
            className={`px-3 py-2 border-2 border-black text-xs font-black uppercase transition-all ${
              activeTab === 'session'
                ? 'bg-black text-[#FFE600] shadow-[2px_2px_0px_0px_#FFE600]'
                : 'bg-[#F6F5EE] text-black hover:bg-[#FFE600] shadow-[2px_2px_0px_0px_#000]'
            }`}
          >
            📋 SESSION SHEET
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-2 border-2 border-black text-xs font-black uppercase transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-black text-[#FFE600] shadow-[2px_2px_0px_0px_#FFE600]'
                : 'bg-[#F6F5EE] text-black hover:bg-[#FFE600] shadow-[2px_2px_0px_0px_#000]'
            }`}
          >
            🏆 SEASON STANDINGS
          </button>
        </div>
      </div>

      {activeTab === 'session' ? (
        <>
          {/* Active Session Summary Banner */}
          {currentEvent && (
            <div className="bg-[#FFE600] border-4 border-black p-4 sm:p-5 shadow-[6px_6px_0px_0px_#000]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-black text-white font-black text-xs px-2 py-0.5 border border-black uppercase">
                      {currentEvent.type}
                    </span>
                    <span className="bg-white text-black font-black text-xs px-2 py-0.5 border border-black uppercase">
                      {currentEvent.date} @ {currentEvent.time}
                    </span>
                    <span className="text-xs font-black text-black uppercase">
                      📍 {currentEvent.location}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black uppercase text-black mt-2">
                    {currentEvent.title}
                  </h3>
                  <p className="text-xs font-bold text-neutral-800 mt-0.5">
                    {currentEvent.description}
                  </p>
                </div>

                {/* Event Attendance Metric Box */}
                <div className="bg-white border-3 border-black p-3 text-center shadow-[3px_3px_0px_0px_#000] shrink-0 min-w-[200px]">
                  <div className="text-[10px] font-black uppercase text-neutral-600">SESSION ATTENDANCE</div>
                  <div className="text-3xl font-black text-black mt-0.5">
                    {sessionRate}%
                  </div>
                  <div className="text-[10px] font-black text-neutral-800 uppercase mt-1">
                    {validAttendees} of {activeAttendees} ACTIVE ATTENDEES
                  </div>
                </div>
              </div>

              {/* Status Counters Breakdown Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t-2 border-black">
                <div className="bg-white border-2 border-black p-2 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-600">PRESENT:</span>
                  <span className="text-base font-black text-[#22C55E] bg-black px-2 py-0.5">
                    {presentCount}
                  </span>
                </div>
                <div className="bg-white border-2 border-black p-2 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-600">LATE:</span>
                  <span className="text-base font-black text-black bg-[#FFE600] px-2 py-0.5 border border-black">
                    {lateCount}
                  </span>
                </div>
                <div className="bg-white border-2 border-black p-2 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-600">EXCUSED:</span>
                  <span className="text-base font-black text-black bg-[#00E5FF] px-2 py-0.5 border border-black">
                    {excusedCount}
                  </span>
                </div>
                <div className="bg-white border-2 border-black p-2 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-600">ABSENT:</span>
                  <span className="text-base font-black text-white bg-[#FF4500] px-2 py-0.5 border border-black">
                    {absentCount}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Player Quick Check-In Portal (Open for All Players) */}
          <div className="bg-white border-4 border-black p-4 sm:p-5 shadow-[6px_6px_0px_0px_#000] space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#22C55E] border-2 border-black flex items-center justify-center font-black text-black text-sm shadow-[2px_2px_0px_0px_#000]">
                  👤
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-[#D71920] tracking-wider block">
                    SQUAD CHECK-IN PORTAL
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <label htmlFor="check-in-player-select" className="text-xs font-black uppercase text-black">
                      CHECK IN FOR:
                    </label>
                    <select
                      id="check-in-player-select"
                      value={selectedCheckInPlayerId || players[0]?.id || ''}
                      onChange={(e) => setSelectedCheckInPlayerId(e.target.value)}
                      className="bg-[#FFE600] border-2 border-black text-xs font-black px-2 py-1 uppercase focus:outline-none cursor-pointer"
                    >
                      {players.map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.number} {p.name} ({p.position})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {mySelfCheckIn ? (
                <div className="bg-[#22C55E] border-2 border-black px-3 py-1.5 text-black font-black text-xs uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000]">
                  <Check className="w-4 h-4" />
                  <span>RECORDED AS {mySelfCheckIn.status.toUpperCase()} @ {mySelfCheckIn.timestamp}</span>
                </div>
              ) : (
                <div className="bg-[#FFE600] border-2 border-black px-3 py-1 text-black font-black text-[11px] uppercase flex items-center gap-1 shadow-[1px_1px_0px_0px_#000]">
                  <AlertCircle className="w-3.5 h-3.5 text-black" />
                  <span>STATUS PENDING</span>
                </div>
              )}
            </div>

            {/* Self-Checkin Success Alert */}
            {selfSuccessMsg && (
              <div className="bg-[#22C55E] text-black border-2 border-black px-3 py-1.5 text-xs font-black flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{selfSuccessMsg}</span>
              </div>
            )}

            {/* Check-in Buttons & Note */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase text-neutral-600 block">
                CHOOSE YOUR STATUS FOR THIS SESSION:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelfStatusChoice('present');
                    handleSelfCheckIn('present');
                  }}
                  className={`p-2.5 border-2 border-black text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${
                    (mySelfCheckIn?.status === 'present' || (!mySelfCheckIn && selfStatusChoice === 'present'))
                      ? 'bg-[#22C55E] text-black shadow-[3px_3px_0px_0px_#000]'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>1. I AM PRESENT (ON TIME)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelfStatusChoice('late');
                    handleSelfCheckIn('late');
                  }}
                  className={`p-2.5 border-2 border-black text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${
                    (mySelfCheckIn?.status === 'late' || (!mySelfCheckIn && selfStatusChoice === 'late'))
                      ? 'bg-[#FFE600] text-black shadow-[3px_3px_0px_0px_#000]'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>2. RUNNING LATE (&lt;15 MIN)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelfStatusChoice('excused');
                    handleSelfCheckIn('excused');
                  }}
                  className={`p-2.5 border-2 border-black text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${
                    (mySelfCheckIn?.status === 'excused' || (!mySelfCheckIn && selfStatusChoice === 'excused'))
                      ? 'bg-[#00E5FF] text-black shadow-[3px_3px_0px_0px_#000]'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>3. EXCUSED / ABSENT</span>
                </button>
              </div>

              {/* Note input and trigger */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <input
                  type="text"
                  value={selfNote}
                  onChange={(e) => setSelfNote(e.target.value)}
                  placeholder="Optional note for coach Roman (e.g. ETA 10m, university exam, muscle soreness...)"
                  className="flex-1 bg-[#F6F5EE] border-2 border-black px-3 py-2 text-xs font-bold focus:outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleSelfCheckIn(selfStatusChoice)}
                  className="bg-black hover:bg-neutral-800 text-[#FFE600] border-2 border-black px-5 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#FFE600] active:translate-x-0.5 active:translate-y-0.5 whitespace-nowrap"
                >
                  {mySelfCheckIn ? '🔄 UPDATE MY ATTENDANCE' : '⚡ CONFIRM MY ATTENDANCE'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Bulk Action Bar */}
          <div className="bg-white border-3 border-black p-3 shadow-[4px_4px_0px_0px_#000] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase text-neutral-500">QUICK FILL:</span>
              <button
                type="button"
                onClick={() => handleMarkAll('present')}
                className="bg-[#22C55E] hover:bg-[#16a34a] text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
              >
                ✅ MARK ALL PRESENT
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('absent')}
                className="bg-[#F6F5EE] hover:bg-neutral-200 text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
              >
                RESET / CLEAR
              </button>
            </div>

            <div className="flex items-center gap-2">
              {saveSuccessMessage && (
                <span className="bg-[#22C55E] text-black font-black text-xs px-2.5 py-1 border-2 border-black flex items-center gap-1 animate-pulse">
                  <Check className="w-3.5 h-3.5" /> SAVED TO SYSTEM!
                </span>
              )}

              <button
                type="button"
                onClick={handleSave}
                className="bg-[#FF4500] hover:bg-[#e03d00] text-white border-2 border-black px-4 py-1.5 text-xs font-black uppercase flex items-center gap-1.5 shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
              >
                <Save className="w-4 h-4" />
                <span>SAVE ATTENDANCE LOG</span>
              </button>
            </div>
          </div>

          {/* Individual Player Attendance Roster Table */}
          <div className="bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="attendance-roster-table">
                <thead>
                  <tr className="bg-black text-white text-xs font-black uppercase tracking-wider">
                    <th className="p-3 border-b-2 border-black">#</th>
                    <th className="p-3 border-b-2 border-black">PLAYER</th>
                    <th className="p-3 border-b-2 border-black hidden sm:table-cell">POSITION</th>
                    <th className="p-3 border-b-2 border-black hidden md:table-cell">FITNESS</th>
                    <th className="p-3 border-b-2 border-black text-right sm:text-center">ATTENDANCE STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black text-xs font-bold">
                  {players.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center bg-[#FAFAF9] text-neutral-600 font-bold uppercase">
                        No registered squad players to track yet. Register players in the "SQUAD" tab first.
                      </td>
                    </tr>
                  ) : (
                    players.map(player => {
                    const status = sessionRecords[player.id] || 'present';
                    return (
                      <tr
                        key={player.id}
                        id={`attendance-row-${player.id}`}
                        className={`hover:bg-[#FFFEEA] transition-colors ${
                          status === 'absent' ? 'bg-red-50' : ''
                        }`}
                      >
                        {/* Jersey Number */}
                        <td className="p-3">
                          <span
                            className="w-7 h-7 border-2 border-black font-black text-xs flex items-center justify-center shadow-[1px_1px_0px_0px_#000]"
                            style={{ backgroundColor: player.avatarBg, color: '#fff' }}
                          >
                            #{player.number}
                          </span>
                        </td>

                        {/* Player Name & Role */}
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => openPlayerProfile(player.id)}
                            className="text-left group"
                          >
                            <div className="font-black uppercase text-black text-sm group-hover:text-[#D71920] group-hover:underline flex items-center gap-1">
                              <span>{player.name}</span>
                              <span className="text-[10px] text-neutral-400 group-hover:text-[#D71920]">→</span>
                            </div>
                            <div className="text-[10px] text-neutral-500 font-bold uppercase">
                              "{player.nickname}" • {player.role}
                            </div>
                          </button>
                          {currentAttendanceRecord?.selfCheckIns?.[player.id] && (
                            <div className="inline-flex items-center gap-1 bg-[#22C55E]/15 text-[#15803d] border border-[#15803d] px-1.5 py-0.5 text-[9px] font-black uppercase mt-1">
                              <UserCheck className="w-3 h-3" />
                              <span>Self-Checked ({currentAttendanceRecord.selfCheckIns[player.id].status}) @ {currentAttendanceRecord.selfCheckIns[player.id].timestamp}</span>
                              {currentAttendanceRecord.selfCheckIns[player.id].note && (
                                <span className="italic text-neutral-600 font-bold">"{currentAttendanceRecord.selfCheckIns[player.id].note}"</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Position */}
                        <td className="p-3 hidden sm:table-cell">
                          <span className="bg-[#F6F5EE] border border-black px-1.5 py-0.5 text-[10px] font-black uppercase">
                            {player.position}
                          </span>
                        </td>

                        {/* Fitness */}
                        <td className="p-3 hidden md:table-cell">
                          <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 border border-black ${
                            player.fitness === 'Fit' ? 'bg-[#22C55E] text-black' :
                            player.fitness === 'Minor Knock' ? 'bg-[#FFE600] text-black' :
                            'bg-[#FF4500] text-white'
                          }`}>
                            {player.fitness}
                          </span>
                        </td>

                        {/* 4 Status Toggle Buttons */}
                        <td className="p-3">
                          <div className="flex items-center justify-end sm:justify-center gap-1 sm:gap-1.5">
                            {/* Present */}
                            <button
                              type="button"
                              onClick={() => setPlayerStatus(player.id, 'present')}
                              className={`px-2.5 py-1.5 border-2 border-black text-[11px] font-black uppercase transition-all ${
                                status === 'present'
                                  ? 'bg-[#22C55E] text-black shadow-[2px_2px_0px_0px_#000] scale-105'
                                  : 'bg-[#F6F5EE] text-neutral-500 hover:bg-neutral-200'
                              }`}
                            >
                              PRESENT
                            </button>

                            {/* Late */}
                            <button
                              type="button"
                              onClick={() => setPlayerStatus(player.id, 'late')}
                              className={`px-2.5 py-1.5 border-2 border-black text-[11px] font-black uppercase transition-all ${
                                status === 'late'
                                  ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000] scale-105'
                                  : 'bg-[#F6F5EE] text-neutral-500 hover:bg-neutral-200'
                              }`}
                            >
                              LATE
                            </button>

                            {/* Excused */}
                            <button
                              type="button"
                              onClick={() => setPlayerStatus(player.id, 'excused')}
                              className={`px-2.5 py-1.5 border-2 border-black text-[11px] font-black uppercase transition-all ${
                                status === 'excused'
                                  ? 'bg-[#00E5FF] text-black shadow-[2px_2px_0px_0px_#000] scale-105'
                                  : 'bg-[#F6F5EE] text-neutral-500 hover:bg-neutral-200'
                              }`}
                            >
                              EXCUSED
                            </button>

                            {/* Absent */}
                            <button
                              type="button"
                              onClick={() => setPlayerStatus(player.id, 'absent')}
                              className={`px-2.5 py-1.5 border-2 border-black text-[11px] font-black uppercase transition-all ${
                                status === 'absent'
                                  ? 'bg-[#FF4500] text-white shadow-[2px_2px_0px_0px_#000] scale-105'
                                  : 'bg-[#F6F5EE] text-neutral-500 hover:bg-neutral-200'
                              }`}
                            >
                              ABSENT
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>

            {/* Session Notes Footer */}
            <div className="p-4 bg-[#F6F5EE] border-t-3 border-black space-y-2">
              <label className="block text-xs font-black uppercase text-black">
                📝 SESSION NOTES / ATTENDANCE DISCIPLINE LOG:
              </label>
              <textarea
                rows={2}
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Document specific late arrivals, traffic issues, medical clearances, or team warnings..."
                className="w-full bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-[#22C55E] hover:bg-[#16a34a] text-black border-2 border-black px-4 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                >
                  SAVE NOTES & ATTENDANCE
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Season Attendance Standings & Leaderboard View */
        <div className="space-y-4">
          <div className="bg-[#00E5FF] border-3 border-black p-4 text-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="text-xl font-black uppercase">FLAMEHUNTER FC COMMITMENT LEADERBOARD</h4>
              <p className="text-xs font-bold text-neutral-800 mt-0.5">
                Full season tracking across all training sessions and competitive matches.
              </p>
            </div>
            <div className="bg-black text-[#00E5FF] font-black text-sm px-3 py-1.5 border border-black uppercase shadow-[2px_2px_0px_0px_#fff]">
              TEAM RECORD: {getTeamAttendanceRate()}% ATTENDANCE
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playerStatsList.map(({ player, attended, late, excused, absent, percentage }, rank) => {
              const isPerfect = percentage >= 95;
              const isWarning = percentage < 75;

              return (
                <div
                  key={player.id}
                  className="bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between border-b-2 border-black pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 bg-black text-[#FFE600] font-black text-xs flex items-center justify-center">
                          #{rank + 1}
                        </span>
                        <div>
                          <button
                            type="button"
                            onClick={() => openPlayerProfile(player.id)}
                            className="text-left group"
                          >
                            <div className="font-black uppercase text-sm text-black group-hover:text-[#D71920] group-hover:underline">
                              {player.name}
                            </div>
                            <div className="text-[10px] font-bold text-neutral-500 uppercase">
                              #{player.number} • {player.position}
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black leading-none text-black">
                          {percentage}%
                        </div>
                        <span className="text-[9px] font-black text-neutral-500 uppercase">
                          RATE
                        </span>
                      </div>
                    </div>

                    {/* Stats Matrix */}
                    <div className="grid grid-cols-4 gap-1.5 my-3 bg-[#F6F5EE] p-2 border-2 border-black text-center text-xs">
                      <div>
                        <span className="text-[9px] font-black text-neutral-500 block uppercase">ATTENDED</span>
                        <span className="font-black text-[#22C55E]">{attended}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-neutral-500 block uppercase">LATE</span>
                        <span className="font-black text-yellow-600">{late}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-neutral-500 block uppercase">EXCUSED</span>
                        <span className="font-black text-blue-600">{excused}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-neutral-500 block uppercase">ABSENT</span>
                        <span className="font-black text-[#FF4500]">{absent}</span>
                      </div>
                    </div>
                  </div>

                  {/* Commitment Badge */}
                  <div className="pt-2 border-t border-black/20">
                    {isPerfect && (
                      <span className="bg-[#22C55E] text-black font-black text-[10px] px-2 py-0.5 border border-black uppercase block text-center">
                        🔥 100% IRON COMMITMENT
                      </span>
                    )}
                    {!isPerfect && !isWarning && (
                      <span className="bg-[#FFE600] text-black font-black text-[10px] px-2 py-0.5 border border-black uppercase block text-center">
                        ⚡ RELIABLE FIRST-TEAMER
                      </span>
                    )}
                    {isWarning && (
                      <span className="bg-[#FF4500] text-white font-black text-[10px] px-2 py-0.5 border border-black uppercase block text-center">
                        ⚠️ ATTENDANCE CAUTION
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
