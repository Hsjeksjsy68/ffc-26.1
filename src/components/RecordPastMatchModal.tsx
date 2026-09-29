import React, { useState, useEffect } from 'react';
import { useClub } from '../context/ClubContext';
import { ClubEvent, MatchDetails, PlayerMatchPerformance, Position } from '../types';
import { FlamehunterLogo } from './FlamehunterLogo';
import {
  Trophy,
  X,
  Check,
  Plus,
  Minus,
  Star,
  Shield,
  Users,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Award,
  ChevronDown,
  Filter
} from 'lucide-react';

interface RecordPastMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetEvent?: ClubEvent | null;
}

export const RecordPastMatchModal: React.FC<RecordPastMatchModalProps> = ({
  isOpen,
  onClose,
  targetEvent
}) => {
  const { players, recordPastMatchWithStats, events } = useClub();

  // Match details state
  const [matchId, setMatchId] = useState<string>(targetEvent?.id || '');
  const [opponent, setOpponent] = useState<string>(targetEvent?.matchDetails?.opponent || '');
  const [competition, setCompetition] = useState<string>(
    targetEvent?.matchDetails?.competition || 'Premier Metro Cup'
  );
  const [matchDate, setMatchDate] = useState<string>(
    targetEvent?.date || new Date().toISOString().split('T')[0]
  );
  const [matchTime, setMatchTime] = useState<string>(targetEvent?.time || '16:00');
  const [venue, setVenue] = useState<string>(
    targetEvent?.matchDetails?.venue || targetEvent?.location || 'Flame Arena (Main Pitch)'
  );
  const [isHome, setIsHome] = useState<boolean>(targetEvent?.matchDetails?.isHome ?? true);
  const [ourScore, setOurScore] = useState<number>(targetEvent?.matchDetails?.ourScore ?? 3);
  const [opponentScore, setOpponentScore] = useState<number>(
    targetEvent?.matchDetails?.opponentScore ?? 1
  );
  const [customScorers, setCustomScorers] = useState<string>(
    targetEvent?.matchDetails?.scorers?.join(', ') || ''
  );
  const [activePositionFilter, setActivePositionFilter] = useState<'ALL' | Position>('ALL');

  // Player performances mapping (playerId -> performance)
  const [performances, setPerformances] = useState<Record<string, PlayerMatchPerformance>>({});
  const [selectedMOMId, setSelectedMOMId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize performances when modal opens or targetEvent/players change
  useEffect(() => {
    if (!isOpen) return;

    if (targetEvent) {
      setMatchId(targetEvent.id);
      setOpponent(targetEvent.matchDetails?.opponent || '');
      setCompetition(targetEvent.matchDetails?.competition || 'Premier Metro Cup');
      setMatchDate(targetEvent.date);
      setMatchTime(targetEvent.time || '16:00');
      setVenue(targetEvent.matchDetails?.venue || targetEvent.location || 'Flame Arena (Main Pitch)');
      setIsHome(targetEvent.matchDetails?.isHome ?? true);
      setOurScore(targetEvent.matchDetails?.ourScore ?? 3);
      setOpponentScore(targetEvent.matchDetails?.opponentScore ?? 1);
      setCustomScorers(targetEvent.matchDetails?.scorers?.join(', ') || '');
      if (targetEvent.matchDetails?.manOfTheMatchPlayerId) {
        setSelectedMOMId(targetEvent.matchDetails.manOfTheMatchPlayerId);
      }
    } else {
      setMatchId('');
      setOpponent('');
      setCompetition('Premier Metro Cup');
      setMatchDate(new Date().toISOString().split('T')[0]);
      setMatchTime('16:00');
      setVenue('Flame Arena (Main Pitch)');
      setIsHome(true);
      setOurScore(3);
      setOpponentScore(1);
      setCustomScorers('');
      setSelectedMOMId('');
    }

    // Populate default performances for all squad players
    const initialMap: Record<string, PlayerMatchPerformance> = {};
    const existingPerformances = targetEvent?.matchDetails?.playerPerformances || {};
    const existingSquad = targetEvent?.matchDetails?.selectedSquad || [];

    players.forEach((player, index) => {
      if (existingPerformances[player.id]) {
        initialMap[player.id] = { ...existingPerformances[player.id] };
      } else {
        const isSelectedInSquad = existingSquad.includes(player.id);
        const defaultPlayed = isSelectedInSquad || index < 11;
        const defaultStarter = isSelectedInSquad ? index < 11 : index < 11;

        initialMap[player.id] = {
          playerId: player.id,
          playerName: player.name,
          playerNumber: player.number,
          position: player.position,
          played: defaultPlayed,
          isStarter: defaultStarter,
          minutesPlayed: defaultPlayed ? 90 : 0,
          goals: 0,
          assists: 0,
          rating: 7.5,
          cleanSheet: false,
          yellowCards: 0,
          redCards: 0,
          tacklesWon: player.position === 'DEF' ? 3 : player.position === 'MID' ? 2 : 0,
          passAccuracy: 85,
          isMOM: false
        };
      }
    });

    setPerformances(initialMap);
  }, [isOpen, targetEvent, players]);

  if (!isOpen) return null;

  // Toggle played state
  const handleTogglePlayed = (playerId: string) => {
    setPerformances(prev => {
      const current = prev[playerId];
      if (!current) return prev;
      const willPlay = !current.played;
      return {
        ...prev,
        [playerId]: {
          ...current,
          played: willPlay,
          minutesPlayed: willPlay ? (current.minutesPlayed > 0 ? current.minutesPlayed : 90) : 0,
          isStarter: willPlay ? current.isStarter : false
        }
      };
    });
  };

  // Update specific player performance field
  const updatePlayerField = <K extends keyof PlayerMatchPerformance>(
    playerId: string,
    field: K,
    value: PlayerMatchPerformance[K]
  ) => {
    setPerformances(prev => {
      const current = prev[playerId];
      if (!current) return prev;
      return {
        ...prev,
        [playerId]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  // Quick Action: Select starting XI
  const handleSelectStartingXI = () => {
    setPerformances(prev => {
      const next = { ...prev };
      players.forEach((p, idx) => {
        if (next[p.id]) {
          const isFirst11 = idx < 11;
          next[p.id] = {
            ...next[p.id],
            played: isFirst11,
            isStarter: isFirst11,
            minutesPlayed: isFirst11 ? 90 : 0
          };
        }
      });
      return next;
    });
  };

  // Quick Action: Auto Clean Sheet
  const handleAutoCleanSheet = () => {
    const isClean = opponentScore === 0;
    setPerformances(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(pid => {
        const perf = next[pid];
        if (perf.played && (perf.position === 'GK' || perf.position === 'DEF')) {
          next[pid] = { ...perf, cleanSheet: isClean };
        }
      });
      return next;
    });
  };

  // Set Man of the Match
  const handleSetMOM = (playerId: string) => {
    setSelectedMOMId(playerId);
    setPerformances(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(pid => {
        next[pid] = { ...next[pid], isMOM: pid === playerId };
      });
      return next;
    });
  };

  // Calculate totals
  const participatingCount = Object.values(performances).filter(p => p.played).length;
  const totalPlayerGoals = Object.values(performances).reduce(
    (sum, p) => sum + (p.played ? p.goals : 0),
    0
  );
  const totalPlayerAssists = Object.values(performances).reduce(
    (sum, p) => sum + (p.played ? p.assists : 0),
    0
  );

  // Match outcome
  const matchResult: 'WIN' | 'DRAW' | 'LOSS' =
    ourScore > opponentScore ? 'WIN' : ourScore === opponentScore ? 'DRAW' : 'LOSS';

  // Filtered players list
  const filteredPlayers = players.filter(p => {
    if (activePositionFilter === 'ALL') return true;
    return p.position === activePositionFilter;
  });

  // Handle Save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponent.trim()) {
      alert('Please enter an Opponent Club name!');
      return;
    }

    setIsSubmitting(true);

    try {
      // Auto build scorers list if custom text not provided
      const scorersList: string[] = [];
      if (customScorers.trim()) {
        customScorers.split(',').forEach(s => {
          if (s.trim()) scorersList.push(s.trim());
        });
      } else {
        Object.values(performances).forEach(p => {
          if (p.played && p.goals > 0) {
            scorersList.push(`${p.playerName} (${p.goals} goal${p.goals > 1 ? 's' : ''})`);
          }
        });
      }

      const matchDetails: MatchDetails = {
        opponent: opponent.trim(),
        competition: competition.trim() || 'Premier Metro Cup',
        isHome,
        venue: venue.trim() || 'Flame Arena (Main Pitch)',
        kitColor: isHome
          ? 'Home (Flame Crimson & Royal Blue)'
          : 'Away (White Frost & Royal Blue)',
        meetupTime: '14:00',
        ourScore,
        opponentScore,
        scorers: scorersList,
        selectedSquad: Object.values(performances)
          .filter(p => p.played)
          .map(p => p.playerId),
        playerPerformances: performances,
        manOfTheMatchPlayerId: selectedMOMId || undefined,
        statsRecorded: true
      };

      const eventBase = {
        id: matchId || undefined,
        title: `Flamehunter FC vs ${opponent.trim()}`,
        date: matchDate,
        time: matchTime,
        location: venue.trim() || 'Flame Arena (Main Pitch)',
        description: `Official Match Result: Flamehunter FC ${ourScore} - ${opponentScore} ${opponent.trim()} (${competition}). Auto-calculated and recorded to squad player statistics.`
      };

      await recordPastMatchWithStats(eventBase, matchDetails, performances);

      setSuccessMessage(
        `✓ Match Result & Player Stats Saved! Automatically updated stats for ${participatingCount} squad players.`
      );

      setTimeout(() => {
        setSuccessMessage(null);
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to record match stats:', err);
      alert('Error saving match stats. Please check your data and retry.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#F6F5EE] border-4 border-black w-full max-w-4xl shadow-[10px_10px_0px_0px_#000] my-4 sm:my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-[#D71920] text-white p-3.5 sm:p-4 border-b-4 border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-black text-[#FFE600] border-2 border-black shadow-[2px_2px_0px_0px_#FFE600]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white leading-none">
                  RECORD PAST MATCH & SQUAD STATS
                </h3>
                <span className="bg-[#FFE600] text-black text-[10px] font-black px-2 py-0.5 border border-black uppercase">
                  AUTO-UPDATE STATS
                </span>
              </div>
              <p className="text-[11px] font-bold text-neutral-200 uppercase tracking-wide mt-0.5">
                অতীত ম্যাচের ফলাফল, গোল, অ্যাসিস্ট ও রেটিং ইনপুট করুন — সরাসরি প্লেয়ার প্রোফাইলে যুক্ত হবে!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 bg-white text-black border-2 border-black flex items-center justify-center font-black hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_#000]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Match Quick Loader */}
        {events.filter(e => e.type === 'Match').length > 0 && !targetEvent && (
          <div className="bg-white border-b-2 border-black px-4 py-2 flex items-center justify-between text-xs flex-wrap gap-2 shrink-0">
            <span className="font-bold text-neutral-700 uppercase text-[11px] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#D71920]" />
              LOAD PRE-EXISTING SCHEDULED MATCH (OPTIONAL):
            </span>
            <select
              value={matchId}
              onChange={e => {
                const selected = events.find(ev => ev.id === e.target.value);
                if (selected) {
                  setMatchId(selected.id);
                  setOpponent(selected.matchDetails?.opponent || '');
                  setCompetition(selected.matchDetails?.competition || 'Premier Metro Cup');
                  setMatchDate(selected.date);
                  setMatchTime(selected.time);
                  setVenue(selected.matchDetails?.venue || selected.location);
                  setIsHome(selected.matchDetails?.isHome ?? true);
                  if (selected.matchDetails?.ourScore !== undefined) {
                    setOurScore(selected.matchDetails.ourScore);
                  }
                  if (selected.matchDetails?.opponentScore !== undefined) {
                    setOpponentScore(selected.matchDetails.opponentScore);
                  }
                } else {
                  setMatchId('');
                }
              }}
              className="bg-[#F6F5EE] border-2 border-black px-2 py-1 text-xs font-black uppercase focus:outline-none"
            >
              <option value="">-- CREATE BRAND NEW PAST MATCH RESULT --</option>
              {events
                .filter(e => e.type === 'Match')
                .map(m => (
                  <option key={m.id} value={m.id}>
                    {m.date} • {m.title} ({m.status})
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Match Scoreboard & Fixture Information */}
          <div className="bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2 flex-wrap gap-2">
              <h4 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#D71920] inline-block border border-black" />
                1. MATCH FIXTURE & FINAL SCORE (ম্যাচের ফলাফল)
              </h4>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsHome(true)}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase border border-black ${
                    isHome ? 'bg-[#D71920] text-white shadow-[1px_1px_0px_0px_#000]' : 'bg-[#F6F5EE] text-black'
                  }`}
                >
                  🏠 HOME MATCH
                </button>
                <button
                  type="button"
                  onClick={() => setIsHome(false)}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase border border-black ${
                    !isHome ? 'bg-[#0066B2] text-white shadow-[1px_1px_0px_0px_#000]' : 'bg-[#F6F5EE] text-black'
                  }`}
                >
                  ✈️ AWAY MATCH
                </button>
              </div>
            </div>

            {/* Scorecard Hero */}
            <div className="bg-[#F6F5EE] border-3 border-black p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-center">
              {/* Home / Flamehunter */}
              <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <FlamehunterLogo size="xs" />
                  <span className="text-xs font-black uppercase text-[#D71920]">
                    FLAMEHUNTER FC
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOurScore(prev => Math.max(0, prev - 1))}
                    className="w-8 h-8 bg-[#FFE600] border-2 border-black flex items-center justify-center font-black text-base hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={ourScore}
                    onChange={e => setOurScore(parseInt(e.target.value) || 0)}
                    className="w-16 text-3xl font-black text-center bg-white border-2 border-black p-1 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setOurScore(prev => prev + 1)}
                    className="w-8 h-8 bg-[#FFE600] border-2 border-black flex items-center justify-center font-black text-base hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[10px] font-bold text-neutral-600 block mt-1 uppercase">
                  OUR GOALS SCORED
                </span>
              </div>

              {/* Match Result Badge */}
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-xs font-black text-neutral-500 uppercase">VS</span>
                <span
                  className={`text-sm font-black px-4 py-1.5 border-2 border-black uppercase shadow-[2px_2px_0px_0px_#000] ${
                    matchResult === 'WIN'
                      ? 'bg-[#22C55E] text-black'
                      : matchResult === 'DRAW'
                      ? 'bg-[#FFE600] text-black'
                      : 'bg-[#FF4500] text-white'
                  }`}
                >
                  {matchResult === 'WIN' ? '🏆 VICTORY (জয়)' : matchResult === 'DRAW' ? '🤝 DRAW (ড্র)' : '⚠️ DEFEAT (পরাজয়)'}
                </span>
                {opponentScore === 0 && (
                  <span className="text-[10px] font-black bg-[#00E5FF] text-black px-2 py-0.5 border border-black uppercase mt-1">
                    🧤 CLEAN SHEET ACHIEVED!
                  </span>
                )}
              </div>

              {/* Opponent */}
              <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_#000]">
                <div className="text-xs font-black uppercase text-black mb-1 truncate">
                  {opponent ? opponent.toUpperCase() : 'OPPONENT CLUB'}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpponentScore(prev => Math.max(0, prev - 1))}
                    className="w-8 h-8 bg-[#FFE600] border-2 border-black flex items-center justify-center font-black text-base hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={opponentScore}
                    onChange={e => setOpponentScore(parseInt(e.target.value) || 0)}
                    className="w-16 text-3xl font-black text-center bg-white border-2 border-black p-1 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setOpponentScore(prev => prev + 1)}
                    className="w-8 h-8 bg-[#FFE600] border-2 border-black flex items-center justify-center font-black text-base hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[10px] font-bold text-neutral-600 block mt-1 uppercase">
                  OPPONENT GOALS
                </span>
              </div>
            </div>

            {/* Fixture Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-black uppercase mb-1">Opponent Club Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Kings FC"
                  value={opponent}
                  onChange={e => setOpponent(e.target.value)}
                  className="w-full bg-[#F6F5EE] border-2 border-black p-2 font-bold focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1">Competition / Tournament</label>
                <input
                  type="text"
                  placeholder="e.g. Premier Metro Cup"
                  value={competition}
                  onChange={e => setCompetition(e.target.value)}
                  className="w-full bg-[#F6F5EE] border-2 border-black p-2 font-bold focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1">Match Date (অতীত তারিখ)</label>
                <input
                  type="date"
                  required
                  value={matchDate}
                  onChange={e => setMatchDate(e.target.value)}
                  className="w-full bg-[#F6F5EE] border-2 border-black p-2 font-bold focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1">Pitch / Venue</label>
                <input
                  type="text"
                  placeholder="Flame Arena Main Pitch"
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  className="w-full bg-[#F6F5EE] border-2 border-black p-2 font-bold focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Player Performances (Goals, Assists, Rating, Minutes, Cards) */}
          <div className="bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-2">
              <div>
                <h4 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#FFE600] inline-block border border-black" />
                  2. SQUAD MATCH PERFORMANCES (প্লেয়ারদের গোল, অ্যাসিস্ট ও রেটিং)
                </h4>
                <p className="text-[10px] font-bold text-neutral-600 uppercase">
                  {participatingCount} of {players.length} squad members marked as participated
                </p>
              </div>

              {/* Quick Preset Actions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleSelectStartingXI}
                  className="bg-[#FFE600] hover:bg-yellow-400 text-black border border-black px-2 py-1 text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000]"
                >
                  ⚡ SELECT TOP 11
                </button>
                {opponentScore === 0 && (
                  <button
                    type="button"
                    onClick={handleAutoCleanSheet}
                    className="bg-[#00E5FF] hover:bg-cyan-400 text-black border border-black px-2 py-1 text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000]"
                  >
                    🧤 APPLY CLEAN SHEET
                  </button>
                )}
              </div>
            </div>

            {/* Position Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {(['ALL', 'FWD', 'MID', 'DEF', 'GK'] as const).map(pos => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setActivePositionFilter(pos)}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase border border-black transition-all ${
                    activePositionFilter === pos
                      ? 'bg-black text-[#FFE600] shadow-[1px_1px_0px_0px_#FFE600]'
                      : 'bg-[#F6F5EE] text-black hover:bg-neutral-200'
                  }`}
                >
                  {pos === 'ALL' ? 'ALL SQUAD' : pos}
                </button>
              ))}
            </div>

            {/* Players Table / Cards */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredPlayers.map(player => {
                const perf = performances[player.id] || {
                  playerId: player.id,
                  playerName: player.name,
                  playerNumber: player.number,
                  position: player.position,
                  played: false,
                  isStarter: false,
                  minutesPlayed: 0,
                  goals: 0,
                  assists: 0,
                  rating: 7.5,
                  cleanSheet: false,
                  yellowCards: 0,
                  redCards: 0,
                  isMOM: false
                };

                const isMOM = selectedMOMId === player.id || perf.isMOM;

                return (
                  <div
                    key={player.id}
                    className={`border-2 border-black p-2.5 transition-all ${
                      perf.played
                        ? isMOM
                          ? 'bg-[#FFF9C4] border-black shadow-[3px_3px_0px_0px_#FFE600]'
                          : 'bg-[#FAFAF9] shadow-[2px_2px_0px_0px_#000]'
                        : 'bg-neutral-100/60 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                      {/* Left: Player Identity & Played Checkbox */}
                      <div className="flex items-center gap-2.5 min-w-[200px]">
                        <input
                          type="checkbox"
                          id={`played-${player.id}`}
                          checked={perf.played}
                          onChange={() => handleTogglePlayed(player.id)}
                          className="w-4 h-4 accent-[#D71920] border-2 border-black cursor-pointer"
                        />
                        <div
                          className="w-7 h-7 border border-black flex items-center justify-center font-black text-xs shrink-0"
                          style={{
                            backgroundColor: player.avatarBg || '#22C55E',
                            color: '#000'
                          }}
                        >
                          #{player.number}
                        </div>
                        <div>
                          <label
                            htmlFor={`played-${player.id}`}
                            className="text-xs font-black uppercase text-black cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{player.name}</span>
                            <span className="text-[9px] font-black px-1 py-0.2 border border-black bg-white uppercase">
                              {player.position}
                            </span>
                          </label>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-600 uppercase">
                            <span>TOTAL CAREER: {player.stats.goals}G • {player.stats.assists}A • ⭐{player.stats.rating}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Stats Inputs when Played is true */}
                      {perf.played ? (
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          {/* Starter / Sub toggle */}
                          <button
                            type="button"
                            onClick={() => updatePlayerField(player.id, 'isStarter', !perf.isStarter)}
                            className={`text-[10px] font-black px-2 py-1 border border-black uppercase ${
                              perf.isStarter
                                ? 'bg-black text-white'
                                : 'bg-white text-neutral-700'
                            }`}
                          >
                            {perf.isStarter ? 'STARTER' : 'SUB'}
                          </button>

                          {/* Minutes */}
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-[10px] font-black uppercase text-neutral-500">MINS:</span>
                            <input
                              type="number"
                              min="0"
                              max="120"
                              value={perf.minutesPlayed}
                              onChange={e =>
                                updatePlayerField(player.id, 'minutesPlayed', parseInt(e.target.value) || 0)
                              }
                              className="w-12 text-center bg-white border border-black p-1 text-xs font-black"
                            />
                          </div>

                          {/* Goals Stepper */}
                          <div className="flex items-center gap-1 bg-white border border-black px-2 py-1">
                            <span className="text-[10px] font-black uppercase text-[#D71920]">⚽ GOALS:</span>
                            <button
                              type="button"
                              onClick={() =>
                                updatePlayerField(player.id, 'goals', Math.max(0, perf.goals - 1))
                              }
                              className="w-7 h-7 bg-[#F6F5EE] border border-black flex items-center justify-center font-black text-sm hover:bg-neutral-200 active:scale-95 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-black text-sm">{perf.goals}</span>
                            <button
                              type="button"
                              onClick={() => updatePlayerField(player.id, 'goals', perf.goals + 1)}
                              className="w-7 h-7 bg-[#FFE600] border border-black flex items-center justify-center font-black text-sm hover:bg-yellow-400 active:scale-95 cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {/* Assists Stepper */}
                          <div className="flex items-center gap-1 bg-white border border-black px-2 py-1">
                            <span className="text-[10px] font-black uppercase text-[#0066B2]">🎯 ASSISTS:</span>
                            <button
                              type="button"
                              onClick={() =>
                                updatePlayerField(player.id, 'assists', Math.max(0, perf.assists - 1))
                              }
                              className="w-7 h-7 bg-[#F6F5EE] border border-black flex items-center justify-center font-black text-sm hover:bg-neutral-200 active:scale-95 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-black text-sm">{perf.assists}</span>
                            <button
                              type="button"
                              onClick={() => updatePlayerField(player.id, 'assists', perf.assists + 1)}
                              className="w-7 h-7 bg-[#FFE600] border border-black flex items-center justify-center font-black text-sm hover:bg-yellow-400 active:scale-95 cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {/* Match Rating */}
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-[10px] font-black uppercase text-neutral-600">RATING:</span>
                            <select
                              value={perf.rating}
                              onChange={e =>
                                updatePlayerField(player.id, 'rating', parseFloat(e.target.value) || 7.5)
                              }
                              className="bg-white border border-black px-1.5 py-1 text-xs font-black"
                            >
                              <option value="6.0">6.0</option>
                              <option value="6.5">6.5</option>
                              <option value="7.0">7.0</option>
                              <option value="7.5">7.5</option>
                              <option value="8.0">8.0</option>
                              <option value="8.5">8.5</option>
                              <option value="9.0">9.0</option>
                              <option value="9.5">9.5</option>
                              <option value="10.0">10.0</option>
                            </select>
                          </div>

                          {/* Clean sheet for GK/DEF */}
                          {(player.position === 'GK' || player.position === 'DEF') && (
                            <label className="flex items-center gap-1 text-[10px] font-black uppercase cursor-pointer bg-white border border-black px-1.5 py-1">
                              <input
                                type="checkbox"
                                checked={perf.cleanSheet || false}
                                onChange={e =>
                                  updatePlayerField(player.id, 'cleanSheet', e.target.checked)
                                }
                                className="w-3.5 h-3.5 accent-[#00E5FF]"
                              />
                              <span>CLEAN SHEET</span>
                            </label>
                          )}

                          {/* Cards */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                updatePlayerField(
                                  player.id,
                                  'yellowCards',
                                  perf.yellowCards === 0 ? 1 : 0
                                )
                              }
                              title="Yellow Card"
                              className={`w-5 h-6 border border-black text-[9px] font-black ${
                                perf.yellowCards > 0 ? 'bg-[#FFE600]' : 'bg-neutral-200 text-neutral-400'
                              }`}
                            >
                              Y
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updatePlayerField(
                                  player.id,
                                  'redCards',
                                  perf.redCards === 0 ? 1 : 0
                                )
                              }
                              title="Red Card"
                              className={`w-5 h-6 border border-black text-[9px] font-black ${
                                perf.redCards > 0 ? 'bg-[#D71920] text-white' : 'bg-neutral-200 text-neutral-400'
                              }`}
                            >
                              R
                            </button>
                          </div>

                          {/* Man of the Match ⭐ */}
                          <button
                            type="button"
                            onClick={() => handleSetMOM(player.id)}
                            className={`px-2 py-1 border border-black text-[10px] font-black uppercase flex items-center gap-1 ${
                              isMOM
                                ? 'bg-[#FFE600] text-black shadow-[1px_1px_0px_0px_#000]'
                                : 'bg-white text-neutral-500 hover:bg-yellow-100'
                            }`}
                          >
                            <Star className={`w-3 h-3 ${isMOM ? 'fill-black' : ''}`} />
                            <span>{isMOM ? 'MOM' : 'SET MOM'}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-400 uppercase italic">
                          Did not play in this fixture
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Automatic Calculation Verification Bar */}
          <div className="bg-[#FFE600]/30 border-2 border-black p-3 text-xs font-bold text-black uppercase space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                <span>
                  TOTAL GOALS RECORDED ACROSS PLAYERS: <strong>{totalPlayerGoals}</strong> OF{' '}
                  <strong>{ourScore}</strong> TEAM GOALS
                </span>
              </div>
              <span className="text-[11px] font-black">
                TOTAL ASSISTS: {totalPlayerAssists} • PLAYERS UPDATED: {participatingCount}
              </span>
            </div>

            {totalPlayerGoals !== ourScore && (
              <p className="text-[10px] text-[#D71920] font-black">
                ⚠️ Note: Player goals ({totalPlayerGoals}) do not equal total team score ({ourScore}).
                (Remaining goals will be considered own goals or unassigned).
              </p>
            )}
          </div>
        </div>

        {/* Footer & Submit Action Bar */}
        <div className="bg-white border-t-4 border-black p-3.5 sm:p-4 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          {successMessage ? (
            <div className="text-xs font-black text-green-800 uppercase flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>{successMessage}</span>
            </div>
          ) : (
            <div className="text-[11px] font-bold text-neutral-600 uppercase">
              ⚡ Will update {participatingCount} player profiles and save to FFC Data Center database!
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-white hover:bg-neutral-200 border-2 border-black px-4 py-2 text-xs font-black uppercase"
            >
              CANCEL
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !opponent.trim()}
              className="bg-[#22C55E] hover:bg-green-600 disabled:opacity-50 text-black border-2 border-black px-5 py-2 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'SAVING & UPDATING STATS...'
                  : 'SAVE MATCH & UPDATE SQUAD STATS'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
