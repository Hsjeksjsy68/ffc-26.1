import React, { useState } from 'react';
import { useClub } from '../context/ClubContext';
import { Player, FitnessStatus, PlayerRole, Position } from '../types';
import { FlamehunterLogo } from './FlamehunterLogo';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Shield,
  Flame,
  Trophy,
  Activity,
  Calendar,
  DollarSign,
  ClipboardList,
  Edit3,
  Check,
  X,
  AlertTriangle,
  Award,
  Zap,
  Target,
  UserCheck,
  Phone,
  Clock,
  Shirt
} from 'lucide-react';

interface PlayerProfilePageProps {
  playerId: string;
  onBack: () => void;
}

export const PlayerProfilePage: React.FC<PlayerProfilePageProps> = ({ playerId, onBack }) => {
  const {
    players,
    updatePlayer,
    deletePlayer,
    updatePlayerFitness,
    attendanceRecords,
    events,
    playerFines,
    toggleFinePaid,
    issueFine,
    fineRules,
    technicalSettings,
    currentUser,
    openPlayerProfile
  } = useClub();

  const [activeProfileTab, setActiveProfileTab] = useState<'stats' | 'attendance' | 'discipline' | 'tactics'>('stats');
  const [isEditing, setIsEditing] = useState(false);
  const [showFineModal, setShowFineModal] = useState(false);
  const [fineAmount, setFineAmount] = useState<number>(15);
  const [fineOffense, setFineOffense] = useState('Late to Training / Team Briefing');
  const [fineNote, setFineNote] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Find player
  const playerIndex = players.findIndex(p => p.id === playerId);
  const player = players[playerIndex] || players[0];

  // Editable Form State
  const [editForm, setEditForm] = useState<Player>({ ...player });

  // Update edit form when player changes
  React.useEffect(() => {
    if (player) {
      setEditForm({ ...player });
    }
  }, [player?.id]);

  if (!player) {
    return (
      <div className="bg-white border-3 border-black p-8 text-center shadow-[4px_4px_0px_0px_#000]">
        <h3 className="text-xl font-black uppercase text-black">PLAYER NOT FOUND</h3>
        <p className="text-xs font-bold text-neutral-600 mt-2">The selected player record does not exist or was removed.</p>
        <button
          onClick={onBack}
          className="mt-4 bg-[#FFE600] border-2 border-black px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
        >
          ← RETURN TO SQUAD ROSTER
        </button>
      </div>
    );
  }

  // Previous & Next player navigation
  const prevPlayer = players[(playerIndex - 1 + players.length) % players.length];
  const nextPlayer = players[(playerIndex + 1) % players.length];

  // Attendance stats for this player
  const playerAttendanceList = events.map(event => {
    const record = attendanceRecords.find(r => r.eventId === event.id);
    const status = record?.records[player.id] || 'Excused';
    return {
      event,
      status,
      notes: record?.notes
    };
  }).sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime());

  const totalSessions = playerAttendanceList.length;
  const attendedSessions = playerAttendanceList.filter(item => item.status === 'Present').length;
  const lateSessions = playerAttendanceList.filter(item => item.status === 'Late').length;
  const excusedSessions = playerAttendanceList.filter(item => item.status === 'Excused').length;
  const absentSessions = playerAttendanceList.filter(item => item.status === 'Absent').length;
  const attendanceRate = totalSessions > 0 ? Math.round(((attendedSessions + lateSessions * 0.5) / totalSessions) * 100) : 100;

  // Fines for this player
  const playerFinesList = playerFines.filter(f => f.playerId === player.id);
  const totalFines = playerFinesList.reduce((sum, f) => sum + f.amount, 0);
  const paidFines = playerFinesList.filter(f => f.isPaid).reduce((sum, f) => sum + f.amount, 0);
  const unpaidFines = totalFines - paidFines;

  // Set-piece role check
  const isPenaltyTaker = technicalSettings.penaltyTakerId === player.id;
  const isFreeKickTaker = technicalSettings.freeKickTakerId === player.id;
  const isCornerTaker = technicalSettings.cornerTakerId === player.id;
  const isCaptain = technicalSettings.captainId === player.id;
  const isViceCaptain = technicalSettings.viceCaptainId === player.id;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlayer(player.id, editForm);
    setIsEditing(false);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 3000);
  };

  const handleCreateFine = (e: React.FormEvent) => {
    e.preventDefault();
    issueFine({
      playerId: player.id,
      playerName: player.name,
      ruleId: 'custom',
      offense: fineOffense,
      amount: fineAmount,
      date: new Date().toISOString().split('T')[0],
      isPaid: false,
      note: fineNote || undefined
    });
    setShowFineModal(false);
    setFineNote('');
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 3000);
  };

  const getFitnessBadge = (fitness: FitnessStatus) => {
    switch (fitness) {
      case 'Fit':
        return <span className="bg-[#22C55E] text-black text-xs font-black px-2.5 py-1 border-2 border-black uppercase shadow-[1px_1px_0px_0px_#000]">FIT & READY ✓</span>;
      case 'Minor Knock':
        return <span className="bg-[#FFE600] text-black text-xs font-black px-2.5 py-1 border-2 border-black uppercase shadow-[1px_1px_0px_0px_#000]">MINOR KNOCK ⚠️</span>;
      case 'Injured':
        return <span className="bg-[#FF4500] text-white text-xs font-black px-2.5 py-1 border-2 border-black uppercase shadow-[1px_1px_0px_0px_#000]">INJURED (SQUAD MEDICAL) ✕</span>;
      case 'Rested':
        return <span className="bg-[#00E5FF] text-black text-xs font-black px-2.5 py-1 border-2 border-black uppercase shadow-[1px_1px_0px_0px_#000]">RESTED</span>;
      case 'Suspended':
        return <span className="bg-black text-white text-xs font-black px-2.5 py-1 border-2 border-black uppercase shadow-[1px_1px_0px_0px_#000]">SUSPENDED 🟥</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Switcher Navigation */}
      <div className="bg-white border-3 border-black p-3 sm:p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            id="back-to-roster-btn"
            className="bg-[#FFE600] hover:bg-yellow-300 text-black border-2 border-black px-3.5 py-1.5 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO SQUAD ROSTER</span>
          </button>
          <span className="text-xs font-bold text-neutral-400 hidden sm:inline">/</span>
          <span className="text-xs font-black uppercase text-black hidden sm:inline">
            PLAYER DOSSIER: #{player.number} {player.name.toUpperCase()}
          </span>
        </div>

        {/* Quick Player Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 justify-between sm:justify-end">
          <button
            onClick={() => openPlayerProfile(prevPlayer.id)}
            title={`Go to previous player: #${prevPlayer.number} ${prevPlayer.name}`}
            className="bg-[#F6F5EE] hover:bg-neutral-200 text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase flex items-center gap-1 shadow-[2px_2px_0px_0px_#000]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">#{prevPlayer.number} {prevPlayer.name.split(' ')[0]}</span>
            <span className="sm:hidden">PREV</span>
          </button>

          {/* Jump to player dropdown */}
          <select
            value={player.id}
            onChange={(e) => openPlayerProfile(e.target.value)}
            className="bg-white border-2 border-black px-2 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer"
          >
            {players.map(p => (
              <option key={p.id} value={p.id}>
                #{p.number} {p.name} ({p.position})
              </option>
            ))}
          </select>

          <button
            onClick={() => openPlayerProfile(nextPlayer.id)}
            title={`Go to next player: #${nextPlayer.number} ${nextPlayer.name}`}
            className="bg-[#F6F5EE] hover:bg-neutral-200 text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase flex items-center gap-1 shadow-[2px_2px_0px_0px_#000]"
          >
            <span className="hidden sm:inline">#{nextPlayer.number} {nextPlayer.name.split(' ')[0]}</span>
            <span className="sm:hidden">NEXT</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Success alert message */}
      {saveFeedback && (
        <div className="bg-[#22C55E] border-3 border-black p-3 text-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_#000] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 bg-black text-white p-0.5" />
            <span>PLAYER PROFILE & DOSSIER SAVED TO FLAMEHUNTER FC DATABASE!</span>
          </div>
          <button onClick={() => setSaveFeedback(false)} className="text-black font-black text-xs hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Hero Player Dossier Card */}
      <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] p-5 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Identity Left Column */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
            {/* Massive Jersey Badge */}
            <div className="relative shrink-0">
              <div
                className="w-24 h-28 sm:w-28 sm:h-32 border-4 border-black flex flex-col items-center justify-between p-2 shadow-[4px_4px_0px_0px_#000] select-none"
                style={{ backgroundColor: player.avatarBg, color: '#fff' }}
              >
                <span className="text-[11px] font-black uppercase tracking-widest text-black bg-white px-2 border border-black">
                  {player.position}
                </span>
                <span className="text-4xl sm:text-5xl font-black tracking-tighter drop-shadow-[2px_2px_0px_#000]">
                  #{player.number}
                </span>
                <span className="text-[9px] font-black tracking-widest uppercase text-yellow-300">
                  FLAMEHUNTER
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2">
                <FlamehunterLogo size="sm" withShadow />
              </div>
            </div>

            {/* Names, Nickname & Badges */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
                  {player.name}
                </h2>
                {player.nickname && (
                  <span className="text-base sm:text-lg font-black text-[#D71920] italic uppercase">
                    "{player.nickname}"
                  </span>
                )}
              </div>

              {/* Roles & Badges Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-black text-white text-xs font-black px-2.5 py-0.5 border-2 border-black uppercase tracking-wider">
                  {player.role}
                </span>

                {isCaptain && (
                  <span className="bg-[#FFE600] text-black text-xs font-black px-2 py-0.5 border border-black uppercase flex items-center gap-1">
                    <Award className="w-3 h-3" /> OFFICIAL CAPTAIN
                  </span>
                )}

                {isViceCaptain && (
                  <span className="bg-[#00E5FF] text-black text-xs font-black px-2 py-0.5 border border-black uppercase">
                    VICE-CAPTAIN
                  </span>
                )}

                <span className="bg-[#F6F5EE] text-black text-xs font-bold px-2 py-0.5 border border-black uppercase">
                  🌍 {player.nationality || 'International'}
                </span>

                <span className="bg-[#F6F5EE] text-black text-xs font-bold px-2 py-0.5 border border-black uppercase">
                  AGE: {player.age} YRS
                </span>

                <span className="bg-[#F6F5EE] text-black text-xs font-bold px-2 py-0.5 border border-black uppercase">
                  PREF: {player.preferredFoot} FOOT
                </span>

                {player.phone && (
                  <a
                    href={`tel:${player.phone}`}
                    className="bg-[#22C55E] text-black text-xs font-black px-2 py-0.5 border border-black uppercase flex items-center gap-1 hover:bg-black hover:text-white transition-colors"
                    title="Direct mobile phone contact"
                  >
                    <Phone className="w-3 h-3" />
                    <span>PHONE: {player.phone}</span>
                  </a>
                )}
              </div>

              {/* Set-Piece Duties */}
              {(isPenaltyTaker || isFreeKickTaker || isCornerTaker) && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-black uppercase text-neutral-500">DUTIES:</span>
                  {isPenaltyTaker && (
                    <span className="bg-[#D71920] text-white text-[10px] font-black px-1.5 py-0.5 border border-black uppercase">
                      🎯 PENALTIES (#1)
                    </span>
                  )}
                  {isFreeKickTaker && (
                    <span className="bg-[#0066B2] text-white text-[10px] font-black px-1.5 py-0.5 border border-black uppercase">
                      ⚡ DIRECT FREE KICKS
                    </span>
                  )}
                  {isCornerTaker && (
                    <span className="bg-[#FFE600] text-black text-[10px] font-black px-1.5 py-0.5 border border-black uppercase">
                      🚩 CORNER SET-PIECES
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fitness & Action Right Column */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 w-full lg:w-auto pt-2 lg:pt-0 border-t-2 lg:border-t-0 border-black">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-neutral-500">FITNESS:</span>
              <div className="flex items-center gap-1">
                {getFitnessBadge(player.fitness)}
                <select
                  value={player.fitness}
                  onChange={(e) => updatePlayerFitness(player.id, e.target.value as FitnessStatus)}
                  title="Change fitness condition"
                  className="bg-[#F6F5EE] border-2 border-black text-[10px] font-black p-1 uppercase cursor-pointer hover:bg-neutral-200"
                >
                  <option value="Fit">FIT</option>
                  <option value="Minor Knock">KNOCK</option>
                  <option value="Injured">INJURED</option>
                  <option value="Rested">RESTED</option>
                  <option value="Suspended">SUSPENDED</option>
                </select>
              </div>
            </div>

            {/* Quick Actions Button Group */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="edit-player-profile-btn"
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3.5 py-1.5 text-xs font-black uppercase border-2 border-black flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 ${
                  isEditing ? 'bg-[#FFE600] text-black' : 'bg-white hover:bg-black hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'CLOSE EDITOR' : 'EDIT STATS & PROFILE'}</span>
              </button>

              {currentUser.isAdmin && (
                <button
                  onClick={() => setShowFineModal(true)}
                  className="px-3.5 py-1.5 text-xs font-black uppercase border-2 border-black bg-[#FF4500] hover:bg-red-700 text-white flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>LEVY FINE</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Form Trend Banner */}
        <div className="mt-5 pt-4 border-t-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black uppercase text-neutral-600">LAST 5 MATCHES FORM:</span>
            <div className="flex items-center gap-1.5">
              {player.stats.form.slice(-5).map((f, i) => (
                <span
                  key={i}
                  className={`text-[10px] font-black px-2 py-0.5 border-2 border-black ${
                    f === 'MOM' ? 'bg-[#FF2A85] text-white shadow-[1px_1px_0px_0px_#000]' :
                    f === 'W' ? 'bg-[#22C55E] text-black shadow-[1px_1px_0px_0px_#000]' :
                    f === 'D' ? 'bg-[#FFE600] text-black shadow-[1px_1px_0px_0px_#000]' :
                    'bg-[#FF4500] text-white shadow-[1px_1px_0px_0px_#000]'
                  }`}
                  title={f === 'MOM' ? 'Man of the Match' : f === 'W' ? 'Win' : f === 'D' ? 'Draw' : 'Loss'}
                >
                  {f === 'MOM' ? '★ MOM' : f}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-neutral-600">
            <span>📅 REGISTERED: <strong className="text-black">{player.joinedDate}</strong></span>
            <span>⏱️ AVG RATING: <strong className="text-black bg-[#FFE600] px-1.5 py-0.5 border border-black">{player.stats.rating.toFixed(1)} / 10.0</strong></span>
          </div>
        </div>
      </div>

      {/* Edit Form Modal / Drawer if Active */}
      {isEditing && (
        <div className="bg-[#FFFEEA] border-3 border-black p-5 sm:p-6 shadow-[5px_5px_0px_0px_#000] animate-in fade-in">
          <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-black" />
              <h3 className="text-lg font-black uppercase text-black">
                EDIT DOSSIER: #{player.number} {player.name}
              </h3>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-white border-2 border-black p-1 hover:bg-[#FF4500] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Identity row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Nickname</label>
                <input
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Jersey Number</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={editForm.number}
                  onChange={(e) => setEditForm({ ...editForm, number: parseInt(e.target.value) || 1 })}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                />
              </div>
            </div>

            {/* Position, Role, Age, Foot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Position</label>
                <select
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value as Position })}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                >
                  <option value="GK">GK - Goalkeeper</option>
                  <option value="DEF">DEF - Defender</option>
                  <option value="MID">MID - Midfielder</option>
                  <option value="FWD">FWD - Forward / Striker</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Squad Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as PlayerRole })}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                >
                  <option value="Captain">Captain</option>
                  <option value="Vice-Captain">Vice-Captain</option>
                  <option value="First Team">First Team</option>
                  <option value="Substitute">Substitute</option>
                  <option value="Youth Prospect">Youth Prospect</option>
                  <option value="Reserve">Reserve</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Age</label>
                <input
                  type="number"
                  min="15"
                  max="45"
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || 20 })}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Preferred Foot</label>
                <select
                  value={editForm.preferredFoot}
                  onChange={(e) => setEditForm({ ...editForm, preferredFoot: e.target.value as any })}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                >
                  <option value="Right">Right Foot</option>
                  <option value="Left">Left Foot</option>
                  <option value="Both">Both (Ambidextrous)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Phone (SMS / Direct Alerts)</label>
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g. +8801705573859"
                  className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                />
              </div>
            </div>

            {/* Performance Stats Editable Row */}
            <div className="p-3 bg-white border-2 border-black space-y-2">
              <span className="text-xs font-black uppercase text-black block">SEASON STATS CALIBRATION:</span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500">Matches</label>
                  <input
                    type="number"
                    value={editForm.stats.matches}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      stats: { ...editForm.stats, matches: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full bg-[#F6F5EE] border border-black p-1 text-xs font-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500">Starts</label>
                  <input
                    type="number"
                    value={editForm.stats.starts}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      stats: { ...editForm.stats, starts: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full bg-[#F6F5EE] border border-black p-1 text-xs font-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500">Minutes</label>
                  <input
                    type="number"
                    value={editForm.stats.minutes}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      stats: { ...editForm.stats, minutes: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full bg-[#F6F5EE] border border-black p-1 text-xs font-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500">Goals</label>
                  <input
                    type="number"
                    value={editForm.stats.goals}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      stats: { ...editForm.stats, goals: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full bg-[#F6F5EE] border border-black p-1 text-xs font-black text-[#D71920]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500">Assists</label>
                  <input
                    type="number"
                    value={editForm.stats.assists}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      stats: { ...editForm.stats, assists: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full bg-[#F6F5EE] border border-black p-1 text-xs font-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500">Match Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="10.0"
                    value={editForm.stats.rating}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      stats: { ...editForm.stats, rating: parseFloat(e.target.value) || 7.0 }
                    })}
                    className="w-full bg-[#F6F5EE] border border-black p-1 text-xs font-black text-[#22C55E]"
                  />
                </div>
              </div>
            </div>

            {/* Tactical Notes & Card Color */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase mb-1">Coach Tactical Directives</label>
                <textarea
                  rows={2}
                  value={editForm.tacticalNotes || ''}
                  onChange={(e) => setEditForm({ ...editForm, tacticalNotes: e.target.value })}
                  placeholder="Tactical duties, pressing triggers, set-piece roles..."
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Card Accent Theme</label>
                <select
                  value={editForm.avatarBg}
                  onChange={(e) => setEditForm({ ...editForm, avatarBg: e.target.value })}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                >
                  <option value="#D71920">Flame Crimson (#D71920)</option>
                  <option value="#0066B2">Royal Blue (#0066B2)</option>
                  <option value="#FFE600">Volt Yellow (#FFE600)</option>
                  <option value="#22C55E">Pitch Green (#22C55E)</option>
                  <option value="#FF4500">Blaze Orange (#FF4500)</option>
                  <option value="#000000">Stealth Black (#000000)</option>
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t-2 border-black flex items-center justify-between">
              {currentUser.isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Permanently remove ${player.name} from Flamehunter FC roster?`)) {
                      deletePlayer(player.id);
                      onBack();
                    }
                  }}
                  className="bg-red-50 hover:bg-[#FF4500] hover:text-white text-[#FF4500] border-2 border-black px-3 py-1.5 text-xs font-black uppercase transition-all"
                >
                  DELETE PLAYER RECORD
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-white hover:bg-neutral-200 border-2 border-black px-4 py-2 text-xs font-black uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-[#22C55E] hover:bg-[#16a34a] text-black border-2 border-black px-5 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
                >
                  SAVE CHANGES
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Main Multi-Tab Navigation */}
      <div className="flex items-center gap-2 border-b-3 border-black pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveProfileTab('stats')}
          className={`px-4 py-2 border-2 border-black text-xs font-black uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeProfileTab === 'stats'
              ? 'bg-[#FFE600] text-black shadow-[3px_3px_0px_0px_#000]'
              : 'bg-white text-black hover:bg-[#F6F5EE]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-[#D71920]" />
          <span>MATCH & PERFORMANCE STATS</span>
        </button>

        <button
          onClick={() => setActiveProfileTab('attendance')}
          className={`px-4 py-2 border-2 border-black text-xs font-black uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeProfileTab === 'attendance'
              ? 'bg-[#0066B2] text-white shadow-[3px_3px_0px_0px_#000]'
              : 'bg-white text-black hover:bg-[#F6F5EE]'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>INDIVIDUAL ATTENDANCE ({attendanceRate}%)</span>
        </button>

        <button
          onClick={() => setActiveProfileTab('discipline')}
          className={`px-4 py-2 border-2 border-black text-xs font-black uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeProfileTab === 'discipline'
              ? 'bg-[#FF4500] text-white shadow-[3px_3px_0px_0px_#000]'
              : 'bg-white text-black hover:bg-[#F6F5EE]'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>DISCIPLINE & FINES ({playerFinesList.length})</span>
        </button>

        <button
          onClick={() => setActiveProfileTab('tactics')}
          className={`px-4 py-2 border-2 border-black text-xs font-black uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeProfileTab === 'tactics'
              ? 'bg-[#22C55E] text-black shadow-[3px_3px_0px_0px_#000]'
              : 'bg-white text-black hover:bg-[#F6F5EE]'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>COACH DIRECTIVES</span>
        </button>
      </div>

      {/* Tab 1: Stats & Performance Matrix */}
      {activeProfileTab === 'stats' && (
        <div className="space-y-6">
          {/* Top Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-white border-3 border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-neutral-500 block">MATCHES PLAYED</span>
              <span className="text-3xl font-black text-black block mt-1">{player.stats.matches}</span>
              <span className="text-[10px] font-bold text-neutral-600 block mt-0.5">({player.stats.starts} Starts)</span>
            </div>

            <div className="bg-[#FFFEEA] border-3 border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-neutral-500 block">GOALS SCORED</span>
              <span className="text-3xl font-black text-[#D71920] block mt-1">{player.stats.goals}</span>
              <span className="text-[10px] font-bold text-neutral-600 block mt-0.5">
                {player.stats.matches > 0 ? (player.stats.goals / player.stats.matches).toFixed(2) : '0'} / Game
              </span>
            </div>

            <div className="bg-white border-3 border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-neutral-500 block">ASSISTS</span>
              <span className="text-3xl font-black text-[#0066B2] block mt-1">{player.stats.assists}</span>
              <span className="text-[10px] font-bold text-neutral-600 block mt-0.5">Key Playmaker</span>
            </div>

            <div className="bg-white border-3 border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-neutral-500 block">MINUTES ON PITCH</span>
              <span className="text-3xl font-black text-black block mt-1">{player.stats.minutes}'</span>
              <span className="text-[10px] font-bold text-neutral-600 block mt-0.5">
                Avg {player.stats.matches > 0 ? Math.round(player.stats.minutes / player.stats.matches) : 0}' / Match
              </span>
            </div>

            <div className="bg-white border-3 border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-neutral-500 block">PASS ACCURACY</span>
              <span className="text-3xl font-black text-black block mt-1">{player.stats.passAccuracy}%</span>
              <span className="text-[10px] font-bold text-[#22C55E] block mt-0.5">High Efficiency</span>
            </div>

            <div className="bg-[#22C55E] border-3 border-black p-3.5 text-black shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-neutral-800 block">SEASON RATING</span>
              <span className="text-3xl font-black text-black block mt-1">{player.stats.rating.toFixed(1)}</span>
              <span className="text-[10px] font-black uppercase text-neutral-800 block mt-0.5">OUT OF 10.0</span>
            </div>
          </div>

          {/* Secondary Technical Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Defensive & Discipline Metrics */}
            <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000] space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-black pb-2.5">
                <Shield className="w-5 h-5 text-[#0066B2]" />
                <h4 className="text-sm font-black uppercase text-black">
                  DEFENSIVE WORKRATE & DISCIPLINE
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#F6F5EE] border-2 border-black p-3">
                  <span className="text-[10px] font-black text-neutral-500 uppercase block">TACKLES WON</span>
                  <span className="text-2xl font-black text-black block mt-1">{player.stats.tacklesWon}</span>
                </div>
                <div className="bg-[#F6F5EE] border-2 border-black p-3">
                  <span className="text-[10px] font-black text-neutral-500 uppercase block">CLEAN SHEETS</span>
                  <span className="text-2xl font-black text-black block mt-1">{player.stats.cleanSheets}</span>
                </div>
                <div className="bg-[#F6F5EE] border-2 border-black p-3">
                  <span className="text-[10px] font-black text-neutral-500 uppercase block">YELLOW / RED</span>
                  <span className="text-2xl font-black text-black block mt-1">
                    🟨 {player.stats.yellowCards} | 🟥 {player.stats.redCards}
                  </span>
                </div>
              </div>

              {/* Workrate statement */}
              <div className="bg-[#F6F5EE] border-2 border-black p-3 text-xs font-bold text-neutral-700">
                <span className="font-black uppercase text-black block mb-1">DEFENSIVE ENGAGEMENT RATING:</span>
                <p>
                  {player.position === 'DEF' || player.position === 'GK'
                    ? 'Anchor of Flamehunter defensive block. High ground-duel win rate and vocal commanding presence.'
                    : 'Responsible high-press execution on transition. Drops into midfield structure to defend counter-attacks.'}
                </p>
              </div>
            </div>

            {/* Technical Attribute Sliders / Radar representation */}
            <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000] space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-black pb-2.5">
                <Zap className="w-5 h-5 text-[#FFE600]" />
                <h4 className="text-sm font-black uppercase text-black">
                  FLAMEHUNTER TECHNICAL PROFILE
                </h4>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'ATTACKING THREAT & FINISHING', value: Math.min(100, (player.stats.goals * 12) + 40), color: '#D71920' },
                  { label: 'BALL RETENTION & PASS ACCURACY', value: player.stats.passAccuracy, color: '#0066B2' },
                  { label: 'TACTICAL DISCIPLINE & WORK RATE', value: Math.max(60, 100 - (player.stats.yellowCards * 15)), color: '#22C55E' },
                  { label: 'SET PIECE & DEAD-BALL SPECIALIZATION', value: (isPenaltyTaker || isFreeKickTaker || isCornerTaker) ? 92 : 68, color: '#FFE600' }
                ].map((attr, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-black uppercase">
                      <span>{attr.label}</span>
                      <span>{attr.value}%</span>
                    </div>
                    <div className="w-full bg-[#F6F5EE] border-2 border-black h-4 relative">
                      <div
                        className="h-full border-r-2 border-black transition-all"
                        style={{ width: `${attr.value}%`, backgroundColor: attr.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Individual Attendance */}
      {activeProfileTab === 'attendance' && (
        <div className="space-y-4">
          {/* Attendance Overview Gauge Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-[#0066B2] border-3 border-black p-4 text-white shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-blue-200 block">OVERALL ATTENDANCE</span>
              <span className="text-3xl font-black text-[#FFE600] block mt-1">{attendanceRate}%</span>
              <span className="text-[10px] font-bold text-white block mt-0.5">{attendedSessions}/{totalSessions} SESSIONS</span>
            </div>

            <div className="bg-[#22C55E] border-3 border-black p-4 text-black shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-neutral-800 block">PRESENT</span>
              <span className="text-3xl font-black text-black block mt-1">{attendedSessions}</span>
              <span className="text-[10px] font-bold text-neutral-800 block mt-0.5">ON TIME</span>
            </div>

            <div className="bg-[#FFE600] border-3 border-black p-4 text-black shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-neutral-800 block">LATE ARRIVAL</span>
              <span className="text-3xl font-black text-black block mt-1">{lateSessions}</span>
              <span className="text-[10px] font-bold text-neutral-800 block mt-0.5">UNDER 15 MINS</span>
            </div>

            <div className="bg-[#F6F5EE] border-3 border-black p-4 text-black shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-neutral-500 block">EXCUSED</span>
              <span className="text-3xl font-black text-black block mt-1">{excusedSessions}</span>
              <span className="text-[10px] font-bold text-neutral-600 block mt-0.5">PRIOR NOTICE</span>
            </div>

            <div className="bg-[#FF4500] border-3 border-black p-4 text-white shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-yellow-200 block">UNEXCUSED</span>
              <span className="text-3xl font-black text-white block mt-1">{absentSessions}</span>
              <span className="text-[10px] font-bold text-yellow-100 block mt-0.5">ABSENT</span>
            </div>
          </div>

          {/* Session by Session Attendance Table */}
          <div className="bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
            <div className="p-3 bg-black text-white text-xs font-black uppercase flex items-center justify-between">
              <span>{player.name}'S INDIVIDUAL ROLL-CALL HISTORY</span>
              <span>{playerAttendanceList.length} LOGGED SESSIONS</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F6F5EE] border-b-2 border-black font-black uppercase">
                    <th className="p-3">DATE & TIME</th>
                    <th className="p-3">EVENT / FIXTURE</th>
                    <th className="p-3">TYPE</th>
                    <th className="p-3">LOCATION</th>
                    <th className="p-3 text-right">ATTENDANCE STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-black font-bold">
                  {playerAttendanceList.map(({ event, status }) => (
                    <tr key={event.id} className="hover:bg-[#FFFEEA]">
                      <td className="p-3 text-neutral-600">{event.date} @ {event.time}</td>
                      <td className="p-3 font-black text-black uppercase">{event.title}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 border border-black uppercase ${
                          event.type === 'Match' ? 'bg-[#FF4500] text-white' : 'bg-[#FFE600] text-black'
                        }`}>
                          {event.type}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-600 truncate max-w-[160px]">{event.location}</td>
                      <td className="p-3 text-right">
                        <span className={`text-[10px] font-black px-2 py-1 border border-black uppercase ${
                          status === 'Present' ? 'bg-[#22C55E] text-black' :
                          status === 'Late' ? 'bg-[#FFE600] text-black' :
                          status === 'Excused' ? 'bg-neutral-200 text-black' :
                          'bg-[#FF4500] text-white'
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Disciplinary Ledger & Fines */}
      {activeProfileTab === 'discipline' && (
        <div className="space-y-4">
          {/* Fines Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#FFE600] border-2 border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-neutral-800 block">TOTAL FINES INCURRED</span>
              <span className="text-2xl font-black text-black">${totalFines}</span>
            </div>
            <div className="bg-[#22C55E] border-2 border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-neutral-800 block">PAID FINES</span>
              <span className="text-2xl font-black text-black">${paidFines}</span>
            </div>
            <div className="bg-[#FF4500] border-2 border-black p-3.5 text-white shadow-[3px_3px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-yellow-200 block">OUTSTANDING BALANCE</span>
              <span className="text-2xl font-black text-white">${unpaidFines}</span>
            </div>
          </div>

          {/* Fines Ledger Table */}
          <div className="bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
            <div className="p-3 bg-black text-white text-xs font-black uppercase flex items-center justify-between">
              <span>FLAMEHUNTER DISCIPLINARY LEDGER FOR {player.name}</span>
              {currentUser.isAdmin && (
                <button
                  onClick={() => setShowFineModal(true)}
                  className="bg-[#FFE600] hover:bg-yellow-300 text-black px-2 py-0.5 text-[10px] font-black border border-black uppercase"
                >
                  + ISSUE FINE
                </button>
              )}
            </div>

            {playerFinesList.length === 0 ? (
              <div className="p-8 text-center bg-[#F6F5EE] space-y-2">
                <span className="text-3xl">🛡️</span>
                <h4 className="text-base font-black uppercase text-black">PRISTINE DISCIPLINARY RECORD</h4>
                <p className="text-xs font-bold text-neutral-600">
                  {player.name} has zero disciplinary infractions on file this season.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F6F5EE] border-b-2 border-black font-black uppercase">
                      <th className="p-3">DATE</th>
                      <th className="p-3">INFRACTION / OFFENSE</th>
                      <th className="p-3">FINE LEVIED</th>
                      <th className="p-3 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-black font-bold">
                    {playerFinesList.map(fine => (
                      <tr key={fine.id} className="hover:bg-[#FFFEEA]">
                        <td className="p-3 text-neutral-600">{fine.date}</td>
                        <td className="p-3">
                          <span className="block font-black text-black">{fine.offense}</span>
                          {fine.note && <span className="text-[10px] text-neutral-500 italic block">{fine.note}</span>}
                        </td>
                        <td className="p-3 font-black text-[#D71920]">${fine.amount}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => toggleFinePaid(fine.id)}
                            className={`px-2 py-1 text-[10px] font-black uppercase border border-black transition-all ${
                              fine.isPaid
                                ? 'bg-[#22C55E] text-black'
                                : 'bg-[#FF4500] text-white hover:bg-black'
                            }`}
                            title="Click to toggle Paid/Unpaid"
                          >
                            {fine.isPaid ? 'PAID ✓' : 'UNPAID ✕'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Coach Directives & Tactical Dossier */}
      {activeProfileTab === 'tactics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000] space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-black pb-3">
              <Flame className="w-5 h-5 text-[#D71920]" />
              <h4 className="text-sm font-black uppercase text-black">
                HEAD COACH ROMAN VARGA'S DIRECTIVES
              </h4>
            </div>

            <div className="bg-[#FFFEEA] border-2 border-black p-3.5 space-y-2">
              <span className="text-[10px] font-black uppercase text-neutral-500 block">CONFIDENTIAL DOSSIER</span>
              <p className="text-xs font-bold text-neutral-800 leading-relaxed">
                {player.tacticalNotes || 'Player is performing to technical standards. Emphasize transition speed and positional rotation in next training block.'}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-black block">SYSTEM POSITIONING:</span>
              <div className="bg-[#F6F5EE] border-2 border-black p-3 text-xs font-bold space-y-1">
                <div>• Current Club Formation: <strong className="text-black">{technicalSettings.formation}</strong></div>
                <div>• Preferred Tactical Style: <strong className="text-black">{technicalSettings.playingStyle}</strong></div>
                <div>• Team Mentality: <strong className="text-black">{technicalSettings.teamMentality}</strong></div>
              </div>
            </div>
          </div>

          <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000] space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-black pb-3">
              <Shirt className="w-5 h-5 text-[#0066B2]" />
              <h4 className="text-sm font-black uppercase text-black">
                SQUAD REGISTRATION DETAILS
              </h4>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div className="flex justify-between border-b border-black/20 pb-1.5">
                <span className="text-neutral-500 uppercase">OFFICIAL REGISTRATION:</span>
                <span className="font-black text-black">FLAMEHUNTER SQUAD #{player.number}</span>
              </div>
              <div className="flex justify-between border-b border-black/20 pb-1.5">
                <span className="text-neutral-500 uppercase">NATIONALITY:</span>
                <span className="font-black text-black">{player.nationality || 'United Kingdom'}</span>
              </div>
              <div className="flex justify-between border-b border-black/20 pb-1.5">
                <span className="text-neutral-500 uppercase">JOINED CLUB:</span>
                <span className="font-black text-black">{player.joinedDate}</span>
              </div>
              <div className="flex justify-between border-b border-black/20 pb-1.5">
                <span className="text-neutral-500 uppercase">PREFERRED FOOT:</span>
                <span className="font-black text-black">{player.preferredFoot} Foot</span>
              </div>
              <div className="flex justify-between border-b border-black/20 pb-1.5">
                <span className="text-neutral-500 uppercase">CURRENT SQUAD STATUS:</span>
                <span className="font-black text-[#D71920]">{player.role}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Levy Fine */}
      {showFineModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#F6F5EE] border-4 border-black w-full max-w-md shadow-[8px_8px_0px_0px_#000] p-5 sm:p-6 my-8">
            <div className="flex items-center justify-between border-b-3 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-[#FF4500] text-white p-1 border-2 border-black">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black uppercase text-black">
                  LEVY FINE: #{player.number} {player.name}
                </h3>
              </div>
              <button
                onClick={() => setShowFineModal(false)}
                className="bg-white border-2 border-black p-1 hover:bg-[#FF4500] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFine} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Standard Club Rule</label>
                <select
                  value={fineOffense}
                  onChange={(e) => {
                    setFineOffense(e.target.value);
                    const rule = fineRules.find(r => r.offense === e.target.value);
                    if (rule) setFineAmount(rule.amount);
                  }}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                >
                  {fineRules.map(r => (
                    <option key={r.id} value={r.offense}>
                      {r.offense} (${r.amount})
                    </option>
                  ))}
                  <option value="Custom Infraction">Custom Infraction</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Fine Amount ($)</label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={fineAmount}
                  onChange={(e) => setFineAmount(parseInt(e.target.value) || 10)}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Notes / Incident Report</label>
                <textarea
                  rows={2}
                  value={fineNote}
                  onChange={(e) => setFineNote(e.target.value)}
                  placeholder="e.g. Arrived 20 mins after team bus departure..."
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                />
              </div>

              <div className="pt-3 border-t-2 border-black flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFineModal(false)}
                  className="bg-white hover:bg-neutral-200 border-2 border-black px-4 py-1.5 text-xs font-black uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-[#D71920] hover:bg-red-700 text-white border-2 border-black px-4 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                >
                  CONFIRM & ISSUE FINE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
