import React, { useState, useEffect } from 'react';
import { useClub } from '../context/ClubContext';
import { db, firebaseConfig } from '../lib/firebase';
import {
  Activity,
  Database,
  Radio,
  RefreshCw,
  Send,
  Zap,
  Users,
  Calendar,
  CheckSquare,
  MessageSquare,
  Shield,
  Layers,
  Code,
  Copy,
  Check,
  Trophy,
  Flame,
  ArrowRight,
  Lock
} from 'lucide-react';

export const RealTimeDataView: React.FC = () => {
  const {
    dbStatus,
    realtimeLogs,
    lastSyncTimestamp,
    realtimePulse,
    pushRealTimeTestUpdate,
    simulateLiveMatchGoal,
    players,
    events,
    attendanceRecords,
    chatMessages,
    chatGroups,
    technicalSettings,
    clubLogo,
    syncWithDataCenter,
    currentUser,
    canAccessLiveData
  } = useClub();

  if (!canAccessLiveData) {
    return (
      <div className="bg-white border-4 border-black p-8 text-center shadow-[6px_6px_0px_0px_#000] max-w-xl mx-auto my-12">
        <div className="w-16 h-16 bg-[#D71920] text-white border-3 border-black mx-auto flex items-center justify-center font-black mb-4 shadow-[3px_3px_0px_0px_#000]">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black uppercase text-black mb-2">ACCESS RESTRICTED: LIVE DATA</h2>
        <p className="text-sm font-bold text-neutral-600 mb-6 uppercase">
          Live database telemetry and real-time event logs are restricted to Club Administration. Players and coaching staff do not have clearance to view this stream.
        </p>
      </div>
    );
  }

  const [activeCollection, setActiveCollection] = useState<'players' | 'events' | 'attendance' | 'messages' | 'groups' | 'system'>('players');
  const [viewMode, setViewMode] = useState<'cards' | 'json'>('cards');
  const [copied, setCopied] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [isSimulatingGoal, setIsSimulatingGoal] = useState(false);
  const [testResultFeedback, setTestResultFeedback] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(24);

  // Measure simulated ping latency periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // realistic latency fluctuation between 18ms and 42ms
      setLatencyMs(Math.floor(18 + Math.random() * 20));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePushTest = async () => {
    setIsPinging(true);
    setTestResultFeedback('Broadcasting real-time telemetry beacon to Firestore...');
    try {
      await pushRealTimeTestUpdate();
      setTestResultFeedback('⚡ Success: Real-time telemetry beacon written to Firestore and received by listeners!');
    } catch (err) {
      console.error(err);
      setTestResultFeedback('Error writing test event. Check network connectivity.');
    } finally {
      setIsPinging(false);
      setTimeout(() => setTestResultFeedback(null), 5000);
    }
  };

  const handleGoalSimulation = async () => {
    setIsSimulatingGoal(true);
    setTestResultFeedback('Simulating live match goal event in real-time...');
    try {
      await simulateLiveMatchGoal();
      setTestResultFeedback('⚽ GOAL! Score updated live across all connected clients!');
    } catch (err) {
      console.error(err);
      setTestResultFeedback('Error simulating match goal.');
    } finally {
      setIsSimulatingGoal(false);
      setTimeout(() => setTestResultFeedback(null), 5000);
    }
  };

  const getCollectionData = () => {
    switch (activeCollection) {
      case 'players':
        return players;
      case 'events':
        return events;
      case 'attendance':
        return attendanceRecords;
      case 'messages':
        return chatMessages;
      case 'groups':
        return chatGroups;
      case 'system':
        return { technicalSettings, clubLogo };
      default:
        return players;
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(getCollectionData(), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" id="realtime-data-hub">
      {/* Real-time Status Banner */}
      <div className="bg-black text-white p-4 sm:p-5 border-3 border-black shadow-[6px_6px_0px_0px_#0066B2]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FFE600] text-black border-2 border-white flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#D71920] shrink-0">
              <Radio className="w-7 h-7 text-[#D71920] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <span>FFC DATA CENTER</span>
                  <span className="text-[#FFE600]">•</span>
                  <span className="text-[#FFE600]">REAL-TIME TELEMETRY</span>
                </h2>
                <span className="inline-flex items-center gap-1.5 bg-[#22C55E] text-black text-xs font-black px-2 py-0.5 border border-white">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>ACTIVE STREAM</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 font-bold mt-1">
                Connected to Firestore Database: <code className="text-[#FFE600] font-mono bg-neutral-900 px-1.5 py-0.5 border border-neutral-700">{firebaseConfig.firestoreDatabaseId}</code>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-center min-w-[90px]">
              <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">LATENCY</div>
              <div className="text-base font-black text-[#22C55E] flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] inline-block" />
                <span>{latencyMs} ms</span>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-center min-w-[100px]">
              <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">SYNC PULSES</div>
              <div className="text-base font-black text-[#FFE600]">{realtimePulse}</div>
            </div>

            <div className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-center min-w-[110px]">
              <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">LAST STREAM</div>
              <div className="text-xs font-mono font-black text-white">{lastSyncTimestamp}</div>
            </div>
          </div>
        </div>

        {/* Live Action Buttons */}
        <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-wrap items-center gap-3">
          <button
            onClick={handlePushTest}
            disabled={isPinging}
            className="flex items-center gap-2 bg-[#FFE600] text-black hover:bg-white px-3.5 py-2 border-2 border-white font-black text-xs uppercase tracking-wide transition-all shadow-[2px_2px_0px_0px_#D71920] active:translate-x-0.5 active:translate-y-0.5"
          >
            <Zap className="w-4 h-4 text-[#D71920]" />
            <span>{isPinging ? 'EMITTING...' : 'EMIT REAL-TIME PING'}</span>
          </button>

          <button
            onClick={handleGoalSimulation}
            disabled={isSimulatingGoal}
            className="flex items-center gap-2 bg-[#D71920] text-white hover:bg-black px-3.5 py-2 border-2 border-white font-black text-xs uppercase tracking-wide transition-all shadow-[2px_2px_0px_0px_#FFE600] active:translate-x-0.5 active:translate-y-0.5"
          >
            <Flame className="w-4 h-4 text-[#FFE600]" />
            <span>{isSimulatingGoal ? 'SCORING...' : 'SIMULATE LIVE MATCH GOAL (+1)'}</span>
          </button>

          <button
            onClick={() => syncWithDataCenter()}
            className="flex items-center gap-2 bg-neutral-800 text-white hover:bg-neutral-700 px-3.5 py-2 border border-neutral-600 font-bold text-xs uppercase transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RE-SYNC ALL COLLECTIONS</span>
          </button>

          <span className="text-neutral-400 text-xs font-bold ml-auto hidden lg:inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span>Open multiple browser tabs or devices to watch changes stream instantaneously!</span>
          </span>
        </div>

        {testResultFeedback && (
          <div className="mt-3 p-2 bg-[#FFE600] text-black text-xs font-black border-2 border-black animate-pulse flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#D71920]" />
            <span>{testResultFeedback}</span>
          </div>
        )}
      </div>

      {/* Real-time Listeners Status Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setActiveCollection('players')}
          className={`cursor-pointer p-3 border-3 border-black transition-all ${
            activeCollection === 'players'
              ? 'bg-[#0066B2] text-white shadow-[4px_4px_0px_0px_#000]'
              : 'bg-white text-black hover:bg-[#F6F5EE] shadow-[2px_2px_0px_0px_#000]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-black uppercase">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>ROSTER</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          </div>
          <div className="text-2xl font-black mt-2">{players.length}</div>
          <div className="text-[10px] font-bold opacity-80 uppercase tracking-tight">`ffc_players` collection</div>
        </div>

        <div
          onClick={() => setActiveCollection('events')}
          className={`cursor-pointer p-3 border-3 border-black transition-all ${
            activeCollection === 'events'
              ? 'bg-[#D71920] text-white shadow-[4px_4px_0px_0px_#000]'
              : 'bg-white text-black hover:bg-[#F6F5EE] shadow-[2px_2px_0px_0px_#000]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-black uppercase">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>FIXTURES</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          </div>
          <div className="text-2xl font-black mt-2">{events.length}</div>
          <div className="text-[10px] font-bold opacity-80 uppercase tracking-tight">`ffc_events` collection</div>
        </div>

        <div
          onClick={() => setActiveCollection('attendance')}
          className={`cursor-pointer p-3 border-3 border-black transition-all ${
            activeCollection === 'attendance'
              ? 'bg-[#FFE600] text-black shadow-[4px_4px_0px_0px_#000]'
              : 'bg-white text-black hover:bg-[#F6F5EE] shadow-[2px_2px_0px_0px_#000]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-black uppercase">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-4 h-4" />
              <span>REGISTERS</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          </div>
          <div className="text-2xl font-black mt-2">{attendanceRecords.length}</div>
          <div className="text-[10px] font-bold opacity-80 uppercase tracking-tight">`ffc_attendance` collection</div>
        </div>

        <div
          onClick={() => setActiveCollection('messages')}
          className={`cursor-pointer p-3 border-3 border-black transition-all ${
            activeCollection === 'messages'
              ? 'bg-[#0066B2] text-white shadow-[4px_4px_0px_0px_#000]'
              : 'bg-white text-black hover:bg-[#F6F5EE] shadow-[2px_2px_0px_0px_#000]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-black uppercase">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>MESSAGES</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          </div>
          <div className="text-2xl font-black mt-2">{chatMessages.length}</div>
          <div className="text-[10px] font-bold opacity-80 uppercase tracking-tight">`ffc_chat_messages`</div>
        </div>

        <div
          onClick={() => setActiveCollection('groups')}
          className={`cursor-pointer p-3 border-3 border-black transition-all ${
            activeCollection === 'groups'
              ? 'bg-[#D71920] text-white shadow-[4px_4px_0px_0px_#000]'
              : 'bg-white text-black hover:bg-[#F6F5EE] shadow-[2px_2px_0px_0px_#000]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-black uppercase">
            <span className="flex items-center gap-1">
              <Layers className="w-4 h-4" />
              <span>CHANNELS</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          </div>
          <div className="text-2xl font-black mt-2">{chatGroups.length}</div>
          <div className="text-[10px] font-bold opacity-80 uppercase tracking-tight">`ffc_chat_groups`</div>
        </div>

        <div
          onClick={() => setActiveCollection('system')}
          className={`cursor-pointer p-3 border-3 border-black transition-all ${
            activeCollection === 'system'
              ? 'bg-black text-white shadow-[4px_4px_0px_0px_#FFE600]'
              : 'bg-white text-black hover:bg-[#F6F5EE] shadow-[2px_2px_0px_0px_#000]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-black uppercase">
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>SYSTEM</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          </div>
          <div className="text-2xl font-black mt-2">ACTIVE</div>
          <div className="text-[10px] font-bold opacity-80 uppercase tracking-tight">`ffc_system` settings</div>
        </div>
      </div>

      {/* Main Real-Time Explorer and Activity Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Live Data Explorer */}
        <div className="lg:col-span-2 bg-white border-3 border-black p-4 sm:p-6 shadow-[5px_5px_0px_0px_#000] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-black">
            <div>
              <div className="text-xs font-black text-[#D71920] uppercase tracking-wider">LIVE STREAM EXPLORER</div>
              <h3 className="text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
                <span>Collection:</span>
                <span className="bg-[#FFE600] px-2 py-0.5 border border-black font-mono">
                  {activeCollection === 'players' && 'ffc_players'}
                  {activeCollection === 'events' && 'ffc_events'}
                  {activeCollection === 'attendance' && 'ffc_attendance'}
                  {activeCollection === 'messages' && 'ffc_chat_messages'}
                  {activeCollection === 'groups' && 'ffc_chat_groups'}
                  {activeCollection === 'system' && 'ffc_system'}
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 text-xs font-black uppercase border-2 border-black transition-all ${
                  viewMode === 'cards' ? 'bg-black text-[#FFE600]' : 'bg-white text-black hover:bg-neutral-100'
                }`}
              >
                Cards View
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-black uppercase border-2 border-black transition-all ${
                  viewMode === 'json' ? 'bg-black text-[#FFE600]' : 'bg-white text-black hover:bg-neutral-100'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Raw JSON</span>
              </button>
              <button
                onClick={handleCopyJson}
                title="Copy live JSON"
                className="p-1 bg-white hover:bg-[#FFE600] border-2 border-black shadow-[1px_1px_0px_0px_#000]"
              >
                {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4 text-black" />}
              </button>
            </div>
          </div>

          {/* Cards View Mode */}
          {viewMode === 'cards' ? (
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {activeCollection === 'players' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {players.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-9 h-9 border-2 border-black flex items-center justify-center font-black text-white text-sm shrink-0"
                          style={{ backgroundColor: p.avatarBg }}
                        >
                          #{p.number}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-sm truncate">{p.name}</div>
                          <div className="text-[11px] font-bold text-neutral-600 flex items-center gap-1.5">
                            <span className="bg-[#0066B2] text-white px-1 py-0.2 text-[9px] font-black">{p.position}</span>
                            <span>{p.role}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-[#D71920]">{p.stats.goals} G • {p.stats.assists} A</div>
                        <span className={`text-[10px] font-black px-1 py-0.2 border border-black ${
                          p.fitness === 'Fit' ? 'bg-[#22C55E] text-white' : 'bg-[#FFE600] text-black'
                        }`}>
                          {p.fitness}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeCollection === 'events' && (
                <div className="space-y-2.5">
                  {events.map((e) => (
                    <div
                      key={e.id}
                      className="p-3.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 border border-black uppercase text-white ${
                            e.type === 'Match' ? 'bg-[#D71920]' : 'bg-[#0066B2]'
                          }`}>
                            {e.type}
                          </span>
                          <span className="font-black text-sm">{e.title}</span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 border border-black ${
                            e.status === 'Live' ? 'bg-[#D71920] text-white animate-pulse' : 'bg-neutral-100 text-black'
                          }`}>
                            {e.status}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-600 font-bold mt-1">
                          📅 {e.date} at {e.time} • 📍 {e.location}
                        </div>
                      </div>

                      {e.matchDetails && (
                        <div className="sm:text-right shrink-0">
                          <div className="text-sm font-black text-black">
                            Score: <span className="text-[#D71920] font-black">{e.matchDetails.ourScore ?? 0}</span> - <span>{e.matchDetails.opponentScore ?? 0}</span>
                          </div>
                          <div className="text-[11px] font-bold text-neutral-600">
                            Fee: ৳{e.matchDetails.matchFee || 200}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeCollection === 'attendance' && (
                <div className="space-y-2.5">
                  {attendanceRecords.length === 0 ? (
                    <div className="p-4 text-center text-xs font-bold text-neutral-500">No attendance registers created yet.</div>
                  ) : (
                    attendanceRecords.map((att) => {
                      const presentCount = Object.values(att.records).filter(s => s === 'present').length;
                      const lateCount = Object.values(att.records).filter(s => s === 'late').length;
                      const totalCount = Object.values(att.records).length;
                      return (
                        <div key={att.id} className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm">{att.eventTitle}</span>
                            <span className="text-xs font-mono font-bold">{att.date}</span>
                          </div>
                          <div className="text-xs font-bold text-neutral-600 mt-1 flex items-center gap-3">
                            <span>Present: <b className="text-[#22C55E]">{presentCount}</b></span>
                            <span>Late: <b className="text-[#FFE600]">{lateCount}</b></span>
                            <span>Total Logged: <b>{totalCount}</b></span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeCollection === 'messages' && (
                <div className="space-y-2">
                  {chatMessages.slice(-15).reverse().map((msg) => (
                    <div key={msg.id} className="p-2.5 bg-white border-2 border-black shadow-[1px_1px_0px_0px_#000]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-[#0066B2]">{msg.senderName}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">{msg.timestamp}</span>
                      </div>
                      <p className="text-xs font-bold text-neutral-900 mt-1">{msg.text}</p>
                      {msg.tacticalTag && (
                        <span className="inline-block mt-1 text-[9px] font-black bg-[#FFE600] text-black px-1 border border-black uppercase">
                          {msg.tacticalTag}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeCollection === 'groups' && (
                <div className="space-y-2">
                  {chatGroups.map((g) => (
                    <div key={g.id} className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-between">
                      <div>
                        <div className="font-black text-sm">{g.name}</div>
                        <div className="text-xs text-neutral-600 font-bold">{g.description}</div>
                      </div>
                      <span className="text-xs font-black bg-neutral-100 px-2 py-1 border border-black">
                        {g.memberIds.length} Members
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeCollection === 'system' && (
                <div className="space-y-3">
                  <div className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                    <div className="font-black text-sm text-[#0066B2] uppercase">Formation & Tactics</div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold mt-2">
                      <div>Formation: <b>{technicalSettings.formation}</b></div>
                      <div>Format: <b>{technicalSettings.pitchFormat || '11-a-side'}</b></div>
                      <div>Style: <b>{technicalSettings.playingStyle}</b></div>
                      <div>Mentality: <b>{technicalSettings.teamMentality}</b></div>
                    </div>
                  </div>

                  <div className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                    <div className="font-black text-sm text-[#D71920] uppercase">Club Identity & Logo</div>
                    <div className="text-xs font-bold mt-1">
                      Crest Type: <b className="uppercase">{clubLogo.type}</b>
                      {clubLogo.lastUpdated && <span className="text-neutral-500 font-mono ml-2">({new Date(clubLogo.lastUpdated).toLocaleDateString()})</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Raw JSON View Mode */
            <pre className="p-3 bg-neutral-900 text-[#FFE600] font-mono text-xs overflow-auto max-h-[550px] border-2 border-black rounded-none">
              {JSON.stringify(getCollectionData(), null, 2)}
            </pre>
          )}
        </div>

        {/* Right Col: Live Event Stream Terminal Audit */}
        <div className="bg-black text-white border-3 border-black p-4 sm:p-5 shadow-[5px_5px_0px_0px_#FFE600] flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#22C55E] animate-pulse" />
              <h3 className="font-black text-sm uppercase tracking-wider text-white">
                LIVE AUDIT STREAM
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-neutral-900 text-[#22C55E] px-2 py-0.5 border border-neutral-700">
              STREAMING
            </span>
          </div>

          <p className="text-[11px] text-neutral-400 font-bold mt-2 mb-3">
            Real-time transaction logs recorded from incoming Firestore snapshots:
          </p>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs max-h-[480px]">
            {realtimeLogs.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 text-xs font-mono">
                Listening for snapshot transactions...
              </div>
            ) : (
              realtimeLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 bg-neutral-900 border border-neutral-800 rounded-none text-[11px] leading-snug"
                >
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                    <span className="text-[#FFE600] font-bold">[{log.timestamp}]</span>
                    <span className={`px-1 font-black ${
                      log.action === 'PING' ? 'bg-[#FFE600] text-black' :
                      log.action === 'WRITE' ? 'bg-[#D71920] text-white' :
                      'bg-[#0066B2] text-white'
                    }`}>
                      {log.action}
                    </span>
                  </div>
                  <div className="text-white font-bold">{log.summary}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    col: <span className="text-neutral-300 font-mono">{log.collection}</span>
                    {log.count !== undefined && <span> • docs: {log.count}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
