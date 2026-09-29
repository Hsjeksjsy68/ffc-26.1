import React, { useState } from 'react';
import { useClub } from '../context/ClubContext';
import { Player, Position, FitnessStatus, PlayerRole } from '../types';
import { FlamehunterLogo } from './FlamehunterLogo';
import { UserPlus, Search, Trophy, Flame, Shield, Activity, Edit3, X, Check, ArrowUpDown, Trash2 } from 'lucide-react';

export const PlayerStatsView: React.FC = () => {
  const {
    players,
    addPlayer,
    updatePlayer,
    deletePlayer,
    updatePlayerFitness,
    currentUser,
    openPlayerProfile,
    openRecordPastMatchModal
  } = useClub();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'goals' | 'assists' | 'rating' | 'matches' | 'number'>('goals');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [isEditingPlayer, setIsEditingPlayer] = useState(false);

  // New Player Form State
  const [newPlayerData, setNewPlayerData] = useState({
    name: '',
    nickname: '',
    number: 99,
    position: 'MID' as Position,
    role: 'First Team' as PlayerRole,
    age: 23,
    preferredFoot: 'Right' as 'Right' | 'Left' | 'Both',
    fitness: 'Fit' as FitnessStatus,
    avatarBg: '#0066B2',
    accentColor: '#D71920',
    nationality: '',
    phone: '',
    tacticalNotes: '',
    stats: {
      matches: 0,
      starts: 0,
      minutes: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      yellowCards: 0,
      redCards: 0,
      passAccuracy: 80,
      tacklesWon: 0,
      rating: 7.0,
      form: ['W' as const]
    }
  });

  // Calculate team-wide leaders
  const topScorer = [...players].sort((a, b) => b.stats.goals - a.stats.goals)[0];
  const topAssist = [...players].sort((a, b) => b.stats.assists - a.stats.assists)[0];
  const highestRated = [...players].sort((a, b) => b.stats.rating - a.stats.rating)[0];
  const totalGoals = players.reduce((sum, p) => sum + p.stats.goals, 0);

  // Filter & Sort
  const filteredPlayers = players.filter(p => {
    const matchPos = selectedPosition === 'ALL' || p.position === selectedPosition;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.number.toString() === searchQuery;
    return matchPos && matchSearch;
  }).sort((a, b) => {
    if (sortBy === 'goals') return b.stats.goals - a.stats.goals;
    if (sortBy === 'assists') return b.stats.assists - a.stats.assists;
    if (sortBy === 'rating') return b.stats.rating - a.stats.rating;
    if (sortBy === 'matches') return b.stats.matches - a.stats.matches;
    if (sortBy === 'number') return a.number - b.number;
    return 0;
  });

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerData.name.trim()) return;

    addPlayer({
      ...newPlayerData,
      joinedDate: new Date().toISOString().split('T')[0]
    });

    setIsAddingPlayer(false);
    // Reset form
    setNewPlayerData({
      name: '',
      nickname: '',
      number: players.length + 1,
      position: 'MID',
      role: 'First Team',
      age: 22,
      preferredFoot: 'Right',
      fitness: 'Fit',
      avatarBg: '#FF4500',
      accentColor: '#FFE600',
      nationality: '',
      phone: '',
      tacticalNotes: '',
      stats: {
        matches: 0,
        starts: 0,
        minutes: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        yellowCards: 0,
        redCards: 0,
        passAccuracy: 80,
        tacklesWon: 0,
        rating: 7.0,
        form: ['W']
      }
    });
  };

  const handleSaveEditPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    updatePlayer(selectedPlayer.id, selectedPlayer);
    setIsEditingPlayer(false);
  };

  const getFitnessBadge = (fitness: FitnessStatus) => {
    switch (fitness) {
      case 'Fit':
        return <span className="bg-[#22C55E] text-black font-black text-[10px] px-2 py-0.5 border-2 border-black">FIT & READY</span>;
      case 'Minor Knock':
        return <span className="bg-[#FFE600] text-black font-black text-[10px] px-2 py-0.5 border-2 border-black">MINOR KNOCK</span>;
      case 'Injured':
        return <span className="bg-[#FF4500] text-white font-black text-[10px] px-2 py-0.5 border-2 border-black">INJURED (OUT)</span>;
      case 'Rested':
        return <span className="bg-[#00E5FF] text-black font-black text-[10px] px-2 py-0.5 border-2 border-black">RESTED</span>;
      case 'Suspended':
        return <span className="bg-black text-white font-black text-[10px] px-2 py-0.5 border-2 border-black">SUSPENDED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#D71920] border-3 border-black p-3.5 sm:p-4 text-white shadow-[4px_4px_0px_0px_#000]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-black bg-[#FFE600] px-1.5 py-0.5 border border-black">
              TOP SCORER
            </span>
            <FlamehunterLogo size="xs" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black tracking-tight leading-none text-white">
            {topScorer ? topScorer.stats.goals : 0} GOALS
          </div>
          <div className="text-xs font-bold mt-1 text-yellow-100 uppercase truncate">
            {topScorer ? `${topScorer.name} (#${topScorer.number})` : 'N/A'}
          </div>
        </div>

        <div className="bg-[#0066B2] border-3 border-black p-3.5 sm:p-4 text-white shadow-[4px_4px_0px_0px_#000]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider bg-[#FFE600] text-black px-1.5 py-0.5 border border-black">
              TOP ASSISTS
            </span>
            <Trophy className="w-5 h-5 text-[#FFE600]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black tracking-tight leading-none text-white">
            {topAssist ? topAssist.stats.assists : 0} ASSISTS
          </div>
          <div className="text-xs font-bold mt-1 text-blue-100 uppercase truncate">
            {topAssist ? `${topAssist.name} (#${topAssist.number})` : 'N/A'}
          </div>
        </div>

        <div className="bg-[#FFE600] border-3 border-black p-3.5 sm:p-4 text-black shadow-[4px_4px_0px_0px_#000]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider bg-black text-white px-1.5 py-0.5 border border-black">
              HIGHEST RATED
            </span>
            <Activity className="w-5 h-5 text-black" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black tracking-tight leading-none text-black">
            {highestRated ? highestRated.stats.rating.toFixed(1) : '0.0'} / 10
          </div>
          <div className="text-xs font-black mt-1 text-neutral-800 uppercase truncate">
            {highestRated ? `${highestRated.name} (${highestRated.stats.matches} apps)` : 'N/A'}
          </div>
        </div>

        <div className="bg-black border-3 border-black p-3.5 sm:p-4 text-white shadow-[4px_4px_0px_0px_#000]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider bg-[#D71920] text-white px-1.5 py-0.5 border border-black">
              SQUAD TOTALS
            </span>
            <Shield className="w-5 h-5 text-[#FFE600]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black tracking-tight leading-none text-[#FFE600]">
            {totalGoals} GOALS
          </div>
          <div className="text-xs font-bold mt-1 text-neutral-300 uppercase">
            {players.length} REGISTERED PLAYERS
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, Sort & Action */}
      <div className="bg-white border-3 border-black p-3.5 sm:p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Position Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'GK', 'DEF', 'MID', 'FWD'].map(pos => (
            <button
              key={pos}
              id={`filter-pos-${pos}`}
              onClick={() => setSelectedPosition(pos)}
              className={`px-3 py-1.5 border-2 border-black text-xs font-black uppercase transition-all whitespace-nowrap ${
                selectedPosition === pos
                  ? 'bg-black text-[#FFE600] shadow-[2px_2px_0px_0px_#FFE600]'
                  : 'bg-[#F6F5EE] text-black hover:bg-[#FFE600] shadow-[2px_2px_0px_0px_#000]'
              }`}
            >
              {pos === 'ALL' ? 'ALL ROSTER' : pos}
            </button>
          ))}
        </div>

        {/* Search, Sort, Register Button */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              type="text"
              placeholder="SEARCH NAME OR #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F6F5EE] border-2 border-black pl-8 pr-3 py-1.5 text-xs font-bold uppercase placeholder:text-neutral-500 focus:outline-none focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#F6F5EE] border-2 border-black px-2 py-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-black" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-black uppercase focus:outline-none cursor-pointer"
            >
              <option value="goals">GOALS</option>
              <option value="assists">ASSISTS</option>
              <option value="rating">RATING</option>
              <option value="matches">APPEARANCES</option>
              <option value="number">JERSEY #</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => openRecordPastMatchModal()}
            className="flex items-center gap-1.5 bg-[#FFE600] hover:bg-yellow-400 text-black border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            title="Record past match results, goals, assists & ratings to update player stats"
          >
            <Trophy className="w-4 h-4 text-black" />
            <span>⚽ LOG MATCH STATS</span>
          </button>

          <button
            id="register-player-btn"
            onClick={() => setIsAddingPlayer(true)}
            className="flex items-center gap-1.5 bg-[#D71920] hover:bg-[#b01319] text-white border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ REGISTER PLAYER</span>
          </button>
        </div>
      </div>

      {/* Players Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.map(player => (
          <div
            key={player.id}
            id={`player-card-${player.id}`}
            className="bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] transition-all"
          >
            <div>
              {/* Card Top: Number, Position, Role & Fitness */}
              <div className="flex items-start justify-between gap-2 border-b-2 border-black pb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-12 h-12 border-3 border-black font-black text-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#000]"
                      style={{ backgroundColor: player.avatarBg, color: '#fff' }}
                    >
                      #{player.number}
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <FlamehunterLogo size="xs" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-base font-black uppercase text-black">
                        {player.name}
                      </span>
                      {player.role === 'Captain' && (
                        <span className="bg-[#FFE600] text-black font-black text-[9px] px-1.5 py-0.2 border border-black">
                          (C)
                        </span>
                      )}
                      {player.role === 'Vice-Captain' && (
                        <span className="bg-neutral-200 text-black font-black text-[9px] px-1.5 py-0.2 border border-black">
                          (VC)
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-neutral-600 uppercase tracking-tight">
                      "{player.nickname}" • {player.nationality} • {player.age} YRS
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="bg-black text-white font-black text-xs px-2 py-0.5 border-2 border-black">
                    {player.position}
                  </span>
                  {getFitnessBadge(player.fitness)}
                </div>
              </div>

              {/* Stats Matrix */}
              <div className="grid grid-cols-4 gap-2 my-3 bg-[#F6F5EE] p-2 border-2 border-black text-center">
                <div>
                  <div className="text-[10px] font-black uppercase text-neutral-500">GOALS</div>
                  <div className="text-lg font-black text-[#D71920] leading-none mt-0.5">{player.stats.goals}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-neutral-500">ASSISTS</div>
                  <div className="text-lg font-black text-black leading-none mt-0.5">{player.stats.assists}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-neutral-500">APPS</div>
                  <div className="text-lg font-black text-black leading-none mt-0.5">{player.stats.matches}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-neutral-500">RATING</div>
                  <div className="text-lg font-black text-[#22C55E] leading-none mt-0.5">{player.stats.rating.toFixed(1)}</div>
                </div>
              </div>

              {/* Tactical Quick Snippet & Form */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-600">RECENT FORM:</span>
                  <div className="flex items-center gap-1">
                    {player.stats.form.slice(-5).map((f, i) => (
                      <span
                        key={i}
                        className={`text-[9px] font-black px-1 border border-black ${
                          f === 'MOM' ? 'bg-[#FF2A85] text-white' :
                          f === 'W' ? 'bg-[#22C55E] text-black' :
                          f === 'D' ? 'bg-[#FFE600] text-black' : 'bg-red-500 text-white'
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                {player.tacticalNotes && (
                  <p className="text-[11px] font-bold text-neutral-700 bg-neutral-100 p-1.5 border border-black line-clamp-2">
                    💬 {player.tacticalNotes}
                  </p>
                )}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="flex items-center gap-1.5 mt-4 pt-2 border-t-2 border-black">
              <button
                onClick={() => openPlayerProfile(player.id)}
                className="flex-1 bg-[#F6F5EE] hover:bg-[#FFE600] text-black border-2 border-black py-1.5 text-xs font-black uppercase text-center transition-colors shadow-[2px_2px_0px_0px_#000]"
              >
                PROFILE →
              </button>

              {/* Admin / Coach Edit Button */}
              <button
                onClick={() => {
                  setSelectedPlayer(player);
                  setIsEditingPlayer(true);
                }}
                className="bg-white hover:bg-[#FFE600] text-black border-2 border-black px-2 py-1.5 text-xs font-black transition-colors shadow-[2px_2px_0px_0px_#000] flex items-center gap-1"
                title="Edit Player Info, Stats & Directives"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">EDIT</span>
              </button>

              {/* Admin Delete Button */}
              {currentUser.isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to permanently delete player "${player.name}" (#${player.number})?`)) {
                      deletePlayer(player.id);
                    }
                  }}
                  className="bg-white hover:bg-red-600 hover:text-white text-red-600 border-2 border-black p-1.5 text-xs font-black transition-colors shadow-[2px_2px_0px_0px_#000]"
                  title="Delete Player Record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Quick Fitness Toggle */}
              <select
                value={player.fitness}
                onChange={(e) => updatePlayerFitness(player.id, e.target.value as FitnessStatus)}
                className="bg-[#F6F5EE] border-2 border-black text-[10px] font-black px-1 py-1.5 uppercase focus:outline-none cursor-pointer"
                title="Change Fitness Status"
              >
                <option value="Fit">FIT</option>
                <option value="Minor Knock">KNOCK</option>
                <option value="Injured">INJURED</option>
                <option value="Rested">RESTED</option>
                <option value="Suspended">SUSPENDED</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State: Zero Players Registered */}
      {filteredPlayers.length === 0 && (
        <div className="bg-white border-3 border-black p-8 sm:p-12 text-center shadow-[6px_6px_0px_0px_#000] space-y-4 my-6">
          <div className="w-16 h-16 bg-[#FFE600] border-3 border-black mx-auto flex items-center justify-center font-black text-3xl shadow-[3px_3px_0px_0px_#000]">
            ⚽
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black uppercase text-black">NO SQUAD PLAYERS REGISTERED YET</h3>
            <p className="text-xs font-bold text-neutral-600 uppercase mt-1.5 max-w-md mx-auto">
              All baseline demo data has been wiped. You can now manually register your squad players one by one with their names, numbers, positions, and roles.
            </p>
          </div>
          <button
            onClick={() => setIsAddingPlayer(true)}
            className="bg-[#D71920] hover:bg-red-700 text-white border-3 border-black py-3 px-6 text-sm font-black uppercase shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ REGISTER YOUR FIRST PLAYER NOW</span>
          </button>
        </div>
      )}

      {/* Modal: Register New Player */}
      {isAddingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#F6F5EE] border-4 border-black w-full max-w-xl shadow-[8px_8px_0px_0px_#000] p-5 sm:p-6 my-8">
            <div className="flex items-center justify-between border-b-3 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-[#FF4500] text-white p-1 border-2 border-black">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black uppercase text-black">REGISTER NEW SQUAD PLAYER</h3>
              </div>
              <button
                onClick={() => setIsAddingPlayer(false)}
                className="bg-white border-2 border-black p-1 hover:bg-[#FF4500] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlayer} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newPlayerData.name}
                    onChange={(e) => setNewPlayerData({ ...newPlayerData, name: e.target.value })}
                    placeholder="e.g. Kai Sterling"
                    className="w-full bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none focus:bg-[#FFE600]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Nickname</label>
                  <input
                    type="text"
                    value={newPlayerData.nickname}
                    onChange={(e) => setNewPlayerData({ ...newPlayerData, nickname: e.target.value })}
                    placeholder="e.g. The Maestro"
                    className="w-full bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none focus:bg-[#FFE600]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Jersey Number</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={newPlayerData.number}
                    onChange={(e) => setNewPlayerData({ ...newPlayerData, number: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Position</label>
                  <select
                    value={newPlayerData.position}
                    onChange={(e) => setNewPlayerData({ ...newPlayerData, position: e.target.value as Position })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black focus:outline-none"
                  >
                    <option value="GK">GK - Goalkeeper</option>
                    <option value="DEF">DEF - Defender</option>
                    <option value="MID">MID - Midfielder</option>
                    <option value="FWD">FWD - Forward</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Squad Role</label>
                  <select
                    value={newPlayerData.role}
                    onChange={(e) => setNewPlayerData({ ...newPlayerData, role: e.target.value as PlayerRole })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black focus:outline-none"
                  >
                    <option value="First Team">First Team</option>
                    <option value="Substitute">Substitute</option>
                    <option value="Youth Prospect">Youth Prospect</option>
                    <option value="Reserve">Reserve</option>
                    <option value="Vice-Captain">Vice-Captain</option>
                    <option value="Captain">Captain</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Age</label>
                  <input
                    type="number"
                    min="16"
                    max="45"
                    value={newPlayerData.age}
                    onChange={(e) => setNewPlayerData({ ...newPlayerData, age: parseInt(e.target.value) || 20 })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Foot</label>
                  <select
                    value={newPlayerData.preferredFoot}
                    onChange={(e) => setNewPlayerData({ ...newPlayerData, preferredFoot: e.target.value as any })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black focus:outline-none"
                  >
                    <option value="Right">Right</option>
                    <option value="Left">Left</option>
                    <option value="Both">Both (Ambidextrous)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Fitness Status</label>
                  <select
                    value={newPlayerData.fitness}
                    onChange={(e) => setNewPlayerData({ ...newPlayerData, fitness: e.target.value as FitnessStatus })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black focus:outline-none"
                  >
                    <option value="Fit">Fit & Ready</option>
                    <option value="Minor Knock">Minor Knock</option>
                    <option value="Injured">Injured</option>
                    <option value="Rested">Rested</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Nationality</label>
                  <input
                    type="text"
                    value={newPlayerData.nationality}
                    onChange={(e) => setNewPlayerData({ ...newPlayerData, nationality: e.target.value })}
                    placeholder="e.g. England / Brazil"
                    className="w-full bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Card Color Theme</label>
                  <select
                    value={newPlayerData.avatarBg}
                    onChange={(e) => setNewPlayerData({ ...newPlayerData, avatarBg: e.target.value })}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black focus:outline-none"
                  >
                    <option value="#FF4500">Flame Orange (#FF4500)</option>
                    <option value="#FFE600">Volt Yellow (#FFE600)</option>
                    <option value="#22C55E">Lime Cyber (#22C55E)</option>
                    <option value="#00E5FF">Electric Cyan (#00E5FF)</option>
                    <option value="#FF2A85">Hot Pink (#FF2A85)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Phone Number (SMS & Direct Phone Alerts)</label>
                <input
                  type="tel"
                  value={newPlayerData.phone || ''}
                  onChange={(e) => setNewPlayerData({ ...newPlayerData, phone: e.target.value })}
                  placeholder="e.g. +8801705573859"
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Coach Tactical Notes</label>
                <textarea
                  rows={2}
                  value={newPlayerData.tacticalNotes}
                  onChange={(e) => setNewPlayerData({ ...newPlayerData, tacticalNotes: e.target.value })}
                  placeholder="Primary strengths, tactical instructions, key role on set pieces..."
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none focus:bg-[#FFE600]"
                />
              </div>

              <div className="pt-3 border-t-2 border-black flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPlayer(false)}
                  className="bg-white hover:bg-neutral-200 border-2 border-black px-4 py-2 text-xs font-black uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-[#22C55E] hover:bg-[#16a34a] text-black border-2 border-black px-5 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
                >
                  CONFIRM & REGISTER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Full Player Profile / Dossier & Stats Editor */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#F6F5EE] border-4 border-black w-full max-w-2xl shadow-[8px_8px_0px_0px_#000] p-5 sm:p-6 my-8">
            <div className="flex items-start justify-between border-b-3 border-black pb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="w-14 h-14 border-3 border-black font-black text-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_#000]"
                    style={{ backgroundColor: selectedPlayer.avatarBg, color: '#fff' }}
                  >
                    #{selectedPlayer.number}
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    <FlamehunterLogo size="xs" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black uppercase text-black">{selectedPlayer.name}</h3>
                    <span className="bg-[#0066B2] text-white text-xs font-black px-2 py-0.5 border border-black">
                      {selectedPlayer.position}
                    </span>
                  </div>
                  <p className="text-xs font-black text-neutral-600 uppercase">
                    "{selectedPlayer.nickname}" • {selectedPlayer.role} • {selectedPlayer.nationality}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingPlayer(!isEditingPlayer)}
                  className={`border-2 border-black px-3 py-1 text-xs font-black uppercase transition-colors ${
                    isEditingPlayer ? 'bg-[#FFE600] text-black' : 'bg-white hover:bg-black hover:text-white'
                  }`}
                >
                  {isEditingPlayer ? 'CANCEL EDIT' : 'EDIT STATS'}
                </button>
                <button
                  onClick={() => {
                    setSelectedPlayer(null);
                    setIsEditingPlayer(false);
                  }}
                  className="bg-white border-2 border-black p-1 hover:bg-[#FF4500] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Content */}
            {!isEditingPlayer ? (
              <div className="mt-4 space-y-4">
                {/* Main Stats Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-white border-2 border-black p-3 text-center">
                  <div className="border-r border-black/20 pr-1">
                    <div className="text-[10px] font-black text-neutral-500 uppercase">MATCHES</div>
                    <div className="text-xl font-black text-black">{selectedPlayer.stats.matches}</div>
                  </div>
                  <div className="border-r border-black/20 pr-1">
                    <div className="text-[10px] font-black text-neutral-500 uppercase">MINUTES</div>
                    <div className="text-xl font-black text-black">{selectedPlayer.stats.minutes}'</div>
                  </div>
                  <div className="border-r border-black/20 pr-1">
                    <div className="text-[10px] font-black text-neutral-500 uppercase">GOALS</div>
                    <div className="text-xl font-black text-[#FF4500]">{selectedPlayer.stats.goals}</div>
                  </div>
                  <div className="border-r border-black/20 pr-1">
                    <div className="text-[10px] font-black text-neutral-500 uppercase">ASSISTS</div>
                    <div className="text-xl font-black text-black">{selectedPlayer.stats.assists}</div>
                  </div>
                  <div className="border-r border-black/20 pr-1">
                    <div className="text-[10px] font-black text-neutral-500 uppercase">TACKLES</div>
                    <div className="text-xl font-black text-black">{selectedPlayer.stats.tacklesWon}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-neutral-500 uppercase">RATING</div>
                    <div className="text-xl font-black text-[#22C55E]">{selectedPlayer.stats.rating.toFixed(1)}</div>
                  </div>
                </div>

                {/* Technical Attributes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-[#F6F5EE] border-2 border-black p-2">
                    <span className="text-[10px] font-black text-neutral-500 uppercase block">PASS ACCURACY</span>
                    <span className="text-base font-black text-black">{selectedPlayer.stats.passAccuracy}%</span>
                  </div>
                  <div className="bg-[#F6F5EE] border-2 border-black p-2">
                    <span className="text-[10px] font-black text-neutral-500 uppercase block">DISCIPLINE</span>
                    <span className="text-base font-black text-black">
                      🟨 {selectedPlayer.stats.yellowCards} | 🟥 {selectedPlayer.stats.redCards}
                    </span>
                  </div>
                  <div className="bg-[#F6F5EE] border-2 border-black p-2">
                    <span className="text-[10px] font-black text-neutral-500 uppercase block">PREFERRED FOOT</span>
                    <span className="text-base font-black text-black">{selectedPlayer.preferredFoot}</span>
                  </div>
                  <div className="bg-[#F6F5EE] border-2 border-black p-2">
                    <span className="text-[10px] font-black text-neutral-500 uppercase block">FITNESS STATUS</span>
                    <span className="text-xs font-black uppercase text-[#FF4500]">{selectedPlayer.fitness}</span>
                  </div>
                </div>

                {/* Tactical Brief */}
                <div className="bg-white border-2 border-black p-3 space-y-2">
                  <div className="text-xs font-black uppercase flex items-center gap-1.5 text-black">
                    <Flame className="w-4 h-4 text-[#FF4500]" />
                    COACHING & TACTICAL DOSSIER
                  </div>
                  <p className="text-xs font-bold text-neutral-800 leading-relaxed bg-[#F6F5EE] p-2.5 border border-black">
                    {selectedPlayer.tacticalNotes || 'No specific tactical dossier filed. Standard unit drills apply.'}
                  </p>
                </div>

                {/* Danger zone actions */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">
                    JOINED FLAMEHUNTER: {selectedPlayer.joinedDate}
                  </span>
                  {currentUser.isAdmin && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove ${selectedPlayer.name} from Flamehunter FC roster?`)) {
                          deletePlayer(selectedPlayer.id);
                          setSelectedPlayer(null);
                        }
                      }}
                      className="bg-red-100 hover:bg-[#FF4500] hover:text-white text-[#FF4500] border-2 border-black px-3 py-1 text-xs font-black uppercase transition-colors"
                    >
                      DELETE PLAYER RECORD
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Comprehensive Admin Edit Mode */
              <form onSubmit={handleSaveEditPlayer} className="mt-4 space-y-4">
                <div className="bg-[#FFE600] border-2 border-black p-2 text-xs font-black uppercase text-black flex items-center justify-between">
                  <span>⚡ EDITING PLAYER: {selectedPlayer.name} (#{selectedPlayer.number})</span>
                  <span className="text-[10px] bg-black text-white px-1.5 py-0.5">ADMIN MODE</span>
                </div>

                {/* Identity & Squad Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 border-2 border-black">
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={selectedPlayer.name}
                      onChange={(e) => setSelectedPlayer({ ...selectedPlayer, name: e.target.value })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Nickname / Display</label>
                    <input
                      type="text"
                      value={selectedPlayer.nickname || ''}
                      onChange={(e) => setSelectedPlayer({ ...selectedPlayer, nickname: e.target.value })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Squad Number (#) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="99"
                      value={selectedPlayer.number}
                      onChange={(e) => setSelectedPlayer({ ...selectedPlayer, number: parseInt(e.target.value) || 1 })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                    />
                  </div>
                </div>

                {/* Tactical Position & Condition */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 border-2 border-black">
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Position *</label>
                    <select
                      value={selectedPlayer.position}
                      onChange={(e) => setSelectedPlayer({ ...selectedPlayer, position: e.target.value as Position })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                    >
                      <option value="GK">Goalkeeper (GK)</option>
                      <option value="DEF">Defender (DEF)</option>
                      <option value="MID">Midfielder (MID)</option>
                      <option value="FWD">Forward / Striker (FWD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Squad Role</label>
                    <select
                      value={selectedPlayer.role}
                      onChange={(e) => setSelectedPlayer({ ...selectedPlayer, role: e.target.value as PlayerRole })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                    >
                      <option value="Captain">Captain (C)</option>
                      <option value="Vice-Captain">Vice-Captain (VC)</option>
                      <option value="First Team">First Team</option>
                      <option value="Substitute">Substitute</option>
                      <option value="Youth Prospect">Youth Prospect</option>
                      <option value="Reserve">Reserve</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Fitness Condition</label>
                    <select
                      value={selectedPlayer.fitness}
                      onChange={(e) => setSelectedPlayer({ ...selectedPlayer, fitness: e.target.value as FitnessStatus })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                    >
                      <option value="Fit">Fit & Ready</option>
                      <option value="Minor Knock">Minor Knock</option>
                      <option value="Injured">Injured (Out)</option>
                      <option value="Rested">Rested</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Preferred Foot</label>
                    <select
                      value={selectedPlayer.preferredFoot}
                      onChange={(e) => setSelectedPlayer({ ...selectedPlayer, preferredFoot: e.target.value as 'Right' | 'Left' | 'Both' })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                    >
                      <option value="Right">Right Foot</option>
                      <option value="Left">Left Foot</option>
                      <option value="Both">Both Feet (Ambidextrous)</option>
                    </select>
                  </div>
                </div>

                {/* Additional Demographics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3 border-2 border-black">
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Age</label>
                    <input
                      type="number"
                      min="14"
                      max="55"
                      value={selectedPlayer.age}
                      onChange={(e) => setSelectedPlayer({ ...selectedPlayer, age: parseInt(e.target.value) || 20 })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Nationality</label>
                    <input
                      type="text"
                      value={selectedPlayer.nationality || ''}
                      onChange={(e) => setSelectedPlayer({ ...selectedPlayer, nationality: e.target.value })}
                      placeholder="e.g. Bangladesh"
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={selectedPlayer.phone || ''}
                      onChange={(e) => setSelectedPlayer({ ...selectedPlayer, phone: e.target.value })}
                      placeholder="e.g. +880 1700-000000"
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black"
                    />
                  </div>
                </div>

                {/* Stats Matrix */}
                <div className="bg-white p-3 border-2 border-black">
                  <span className="text-[10px] font-black uppercase text-neutral-600 block mb-2">
                    SEASON PERFORMANCE STATISTICS
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[9px] font-black uppercase mb-0.5">Goals</label>
                      <input
                        type="number"
                        min="0"
                        value={selectedPlayer.stats.goals}
                        onChange={(e) => setSelectedPlayer({
                          ...selectedPlayer,
                          stats: { ...selectedPlayer.stats, goals: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1 text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase mb-0.5">Assists</label>
                      <input
                        type="number"
                        min="0"
                        value={selectedPlayer.stats.assists}
                        onChange={(e) => setSelectedPlayer({
                          ...selectedPlayer,
                          stats: { ...selectedPlayer.stats, assists: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1 text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase mb-0.5">Appearances</label>
                      <input
                        type="number"
                        min="0"
                        value={selectedPlayer.stats.matches}
                        onChange={(e) => setSelectedPlayer({
                          ...selectedPlayer,
                          stats: { ...selectedPlayer.stats, matches: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1 text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase mb-0.5">Match Rating</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1.0"
                        max="10.0"
                        value={selectedPlayer.stats.rating}
                        onChange={(e) => setSelectedPlayer({
                          ...selectedPlayer,
                          stats: { ...selectedPlayer.stats, rating: parseFloat(e.target.value) || 7.0 }
                        })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1 text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase mb-0.5">Minutes Played</label>
                      <input
                        type="number"
                        min="0"
                        value={selectedPlayer.stats.minutes}
                        onChange={(e) => setSelectedPlayer({
                          ...selectedPlayer,
                          stats: { ...selectedPlayer.stats, minutes: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1 text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase mb-0.5">Pass Acc %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={selectedPlayer.stats.passAccuracy}
                        onChange={(e) => setSelectedPlayer({
                          ...selectedPlayer,
                          stats: { ...selectedPlayer.stats, passAccuracy: parseInt(e.target.value) || 80 }
                        })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1 text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase mb-0.5">Yellow Cards</label>
                      <input
                        type="number"
                        min="0"
                        value={selectedPlayer.stats.yellowCards}
                        onChange={(e) => setSelectedPlayer({
                          ...selectedPlayer,
                          stats: { ...selectedPlayer.stats, yellowCards: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1 text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase mb-0.5">Red Cards</label>
                      <input
                        type="number"
                        min="0"
                        value={selectedPlayer.stats.redCards}
                        onChange={(e) => setSelectedPlayer({
                          ...selectedPlayer,
                          stats: { ...selectedPlayer.stats, redCards: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full bg-[#F6F5EE] border-2 border-black p-1 text-xs font-black"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-1">Coaching Directives & Tactical Notes</label>
                  <textarea
                    rows={2}
                    value={selectedPlayer.tacticalNotes || ''}
                    onChange={(e) => setSelectedPlayer({ ...selectedPlayer, tacticalNotes: e.target.value })}
                    placeholder="Tactical instructions, pitch positioning, coaching points..."
                    className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t-2 border-black">
                  {currentUser.isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Permanently delete player "${selectedPlayer.name}" from database?`)) {
                          deletePlayer(selectedPlayer.id);
                          setSelectedPlayer(null);
                          setIsEditingPlayer(false);
                        }
                      }}
                      className="bg-red-100 hover:bg-red-600 hover:text-white text-red-700 border-2 border-black px-3 py-2 text-xs font-black uppercase transition-colors shadow-[2px_2px_0px_0px_#000] flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>DELETE PLAYER</span>
                    </button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setIsEditingPlayer(false)}
                      className="bg-white border-2 border-black px-4 py-2 text-xs font-black uppercase hover:bg-neutral-200"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      className="bg-[#22C55E] hover:bg-green-400 text-black border-2 border-black px-5 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                    >
                      SAVE PLAYER
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
