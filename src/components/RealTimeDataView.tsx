import React, { useState, useEffect } from 'react';
import { useClub } from '../context/ClubContext';
import { db, firebaseConfig } from '../lib/firebase';
import { MediaAuditItem } from '../types';
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
  Lock,
  Camera,
  Film,
  Download,
  Trash2,
  Maximize2,
  Eye,
  Search,
  Filter,
  Clock,
  User,
  MapPin,
  X
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
    canAccessLiveData,
    mediaAuditItems,
    deleteMediaAuditItem
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

  const [activeCollection, setActiveCollection] = useState<'players' | 'events' | 'attendance' | 'messages' | 'groups' | 'system' | 'media'>('players');
  const [viewMode, setViewMode] = useState<'cards' | 'json'>('cards');
  const [copied, setCopied] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [isSimulatingGoal, setIsSimulatingGoal] = useState(false);
  const [testResultFeedback, setTestResultFeedback] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(24);

  // Media Audit Vault states
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'chat' | 'profile'>('all');
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [selectedPreviewMedia, setSelectedPreviewMedia] = useState<MediaAuditItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
      case 'media':
        return mediaAuditItems;
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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
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
          <div className="text-[10px] font-bold opacity-80 uppercase tracking-tight">`ffc_players`</div>
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
          <div className="text-[10px] font-bold opacity-80 uppercase tracking-tight">`ffc_events`</div>
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
          <div className="text-[10px] font-bold opacity-80 uppercase tracking-tight">`ffc_attendance`</div>
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
          <div className="text-[10px] font-bold opacity-80 uppercase tracking-tight">`ffc_system`</div>
        </div>

        <div
          onClick={() => setActiveCollection('media')}
          className={`cursor-pointer p-3 border-3 border-black transition-all ${
            activeCollection === 'media'
              ? 'bg-[#FF4500] text-white shadow-[4px_4px_0px_0px_#000]'
              : 'bg-white text-black hover:bg-[#F6F5EE] shadow-[2px_2px_0px_0px_#000]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-black uppercase">
            <span className="flex items-center gap-1">
              <Camera className="w-4 h-4" />
              <span>MEDIA VAULT</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-[#FFE600]" />
          </div>
          <div className="text-2xl font-black mt-2">{mediaAuditItems.length}</div>
          <div className="text-[10px] font-bold opacity-80 uppercase tracking-tight">`ffc_media_vault`</div>
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
                  {activeCollection === 'media' && 'ffc_media_vault'}
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

              {/* ========================================================
                  MEDIA VAULT & LIVE AUDIT EXPLORER (ADMIN LIVE DATA)
                 ======================================================== */}
              {activeCollection === 'media' && (
                <div className="space-y-4">
                  {/* Media Vault Banner & Control Filter Bar */}
                  <div className="bg-[#FFFEEA] border-2 border-black p-3.5 space-y-3 shadow-[2px_2px_0px_0px_#000]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-[#D71920] tracking-wider block">
                          CENTRAL LIVE MEDIA VAULT & TELEMETRY AUDIT
                        </span>
                        <h4 className="text-sm font-black uppercase text-black">
                          গ্লোবাল ক্লাউড মিডিয়া অডিট ও ডিজিটাল ভল্ট
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-black">
                        <span className="bg-black text-[#FFE600] px-2 py-0.5 border border-black">
                          মোট: {mediaAuditItems.length} ফাইল
                        </span>
                        <span className="bg-[#0066B2] text-white px-2 py-0.5 border border-black">
                          📷 {mediaAuditItems.filter(m => m.type === 'image').length}
                        </span>
                        <span className="bg-[#D71920] text-white px-2 py-0.5 border border-black">
                          🎥 {mediaAuditItems.filter(m => m.type === 'video').length}
                        </span>
                      </div>
                    </div>

                    {/* Filter Pills & Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-black/20">
                      {/* Filter Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setMediaFilter('all')}
                          className={`px-2 py-1 text-[10px] font-black uppercase border border-black cursor-pointer ${
                            mediaFilter === 'all'
                              ? 'bg-black text-[#FFE600] shadow-[1px_1px_0px_0px_#000]'
                              : 'bg-white text-black hover:bg-neutral-100'
                          }`}
                        >
                          সব মিডিয়া ({mediaAuditItems.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaFilter('image')}
                          className={`px-2 py-1 text-[10px] font-black uppercase border border-black cursor-pointer ${
                            mediaFilter === 'image'
                              ? 'bg-[#0066B2] text-white shadow-[1px_1px_0px_0px_#000]'
                              : 'bg-white text-black hover:bg-neutral-100'
                          }`}
                        >
                          📷 ছবি ({mediaAuditItems.filter(m => m.type === 'image').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaFilter('video')}
                          className={`px-2 py-1 text-[10px] font-black uppercase border border-black cursor-pointer ${
                            mediaFilter === 'video'
                              ? 'bg-[#D71920] text-white shadow-[1px_1px_0px_0px_#000]'
                              : 'bg-white text-black hover:bg-neutral-100'
                          }`}
                        >
                          🎥 ভিডিও ({mediaAuditItems.filter(m => m.type === 'video').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaFilter('chat')}
                          className={`px-2 py-1 text-[10px] font-black uppercase border border-black cursor-pointer ${
                            mediaFilter === 'chat'
                              ? 'bg-[#22C55E] text-black shadow-[1px_1px_0px_0px_#000]'
                              : 'bg-white text-black hover:bg-neutral-100'
                          }`}
                        >
                          💬 চ্যাট মিডিয়া ({mediaAuditItems.filter(m => m.contextType === 'chat').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaFilter('profile')}
                          className={`px-2 py-1 text-[10px] font-black uppercase border border-black cursor-pointer ${
                            mediaFilter === 'profile'
                              ? 'bg-[#FFE600] text-black shadow-[1px_1px_0px_0px_#000]'
                              : 'bg-white text-black hover:bg-neutral-100'
                          }`}
                        >
                          👤 প্রোফাইল/প্লেয়ার ({mediaAuditItems.filter(m => m.contextType === 'player_profile' || m.contextType === 'user_avatar').length})
                        </button>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input
                          type="text"
                          placeholder="আপলোডার বা লোকেশন খুঁজুন..."
                          value={mediaSearchQuery}
                          onChange={e => setMediaSearchQuery(e.target.value)}
                          className="bg-white border-2 border-black pl-8 pr-3 py-1 text-xs font-bold text-black focus:outline-none w-full sm:w-56"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filtered Media List */}
                  {(() => {
                    const filtered = mediaAuditItems.filter(item => {
                      if (mediaFilter === 'image' && item.type !== 'image') return false;
                      if (mediaFilter === 'video' && item.type !== 'video') return false;
                      if (mediaFilter === 'chat' && item.contextType !== 'chat') return false;
                      if (mediaFilter === 'profile' && !['player_profile', 'user_avatar'].includes(item.contextType)) return false;

                      if (mediaSearchQuery.trim()) {
                        const q = mediaSearchQuery.toLowerCase();
                        const nameMatch = item.name.toLowerCase().includes(q);
                        const uploaderMatch = item.uploadedBy.name.toLowerCase().includes(q) || (item.uploadedBy.email || '').toLowerCase().includes(q);
                        const destMatch = item.destination.toLowerCase().includes(q);
                        return nameMatch || uploaderMatch || destMatch;
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="bg-white border-2 border-black p-8 text-center shadow-[2px_2px_0px_0px_#000]">
                          <div className="w-12 h-12 rounded-full bg-neutral-100 border-2 border-black flex items-center justify-center mx-auto mb-2">
                            <Camera className="w-6 h-6 text-neutral-400" />
                          </div>
                          <h5 className="font-black text-sm uppercase text-black">কোনো মিডিয়া ফাইল পাওয়া যায়নি</h5>
                          <p className="text-xs font-bold text-neutral-500 mt-1">
                            চ্যাটে ফটো/ভিডিও শেয়ার করলে বা প্লেয়ার প্রোফাইল ছবি আপলোড করলে লাইভ এখানে অডিট হিসেবে সংরক্ষিত হবে।
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {filtered.map(item => (
                          <div
                            key={item.id}
                            className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_#000] flex flex-col justify-between gap-3 hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
                          >
                            {/* Top Details & Context Badges */}
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 border border-black uppercase flex items-center gap-1 ${
                                  item.type === 'video' ? 'bg-[#D71920] text-white' : 'bg-[#0066B2] text-white'
                                }`}>
                                  {item.type === 'video' ? <Film className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                                  <span>{item.type === 'video' ? 'ভিডিও ফাইল' : 'ছবি'}</span>
                                </span>

                                <span className="text-[10px] font-black bg-[#FFE600] text-black px-2 py-0.5 border border-black uppercase">
                                  {item.contextType === 'chat'
                                    ? '💬 চ্যাট মেসেজ'
                                    : item.contextType === 'player_profile'
                                    ? '⚽ প্লেয়ার প্রোফাইল'
                                    : '👤 অ্যাকাউন্ট অবতার'}
                                </span>
                              </div>

                              {/* Media Thumbnail / Preview Box */}
                              <div className="relative border-2 border-black bg-black rounded overflow-hidden aspect-video flex items-center justify-center group mb-2.5">
                                {item.type === 'video' ? (
                                  <video
                                    src={item.url}
                                    controls
                                    preload="metadata"
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <img
                                    src={item.url}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                )}
                                {item.type === 'image' && (
                                  <div
                                    onClick={() => setSelectedPreviewMedia(item)}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white font-black text-xs uppercase gap-1"
                                  >
                                    <Maximize2 className="w-4 h-4" />
                                    <span>বড় করে দেখুন</span>
                                  </div>
                                )}
                              </div>

                              {/* Who uploaded it (কে আপলোড করেছে) */}
                              <div className="bg-[#F8FAFC] border border-black p-2 space-y-1.5 text-xs font-bold mb-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-black text-neutral-500 flex items-center gap-1">
                                    <User className="w-3 h-3 text-[#0066B2]" />
                                    <span>আপলোডার (UPLOADED BY):</span>
                                  </span>
                                  <span className={`text-[9px] font-black px-1.5 py-0.2 border border-black uppercase ${
                                    item.uploadedBy.userType === 'admin'
                                      ? 'bg-[#D71920] text-white'
                                      : item.uploadedBy.userType === 'coach'
                                      ? 'bg-[#0066B2] text-white'
                                      : 'bg-[#22C55E] text-black'
                                  }`}>
                                    {item.uploadedBy.role || item.uploadedBy.userType || 'MEMBER'}
                                  </span>
                                </div>
                                <div className="text-black font-black flex items-center gap-1.5">
                                  <span>{item.uploadedBy.name}</span>
                                  {item.uploadedBy.email && (
                                    <span className="text-[10px] text-neutral-500 font-normal">
                                      ({item.uploadedBy.email})
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* When uploaded (কবে ও কখন আপলোড করেছে) & Where (কোথায় আপলোড করেছে) */}
                              <div className="space-y-1 text-[11px] font-bold text-neutral-700 bg-neutral-50 p-2 border border-black/40">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-[#D71920] shrink-0" />
                                  <span className="text-neutral-500">কখন আপলোড:</span>
                                  <strong className="text-black font-black">{item.timestamp}</strong>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                                  <span className="text-neutral-500">কোথায় আপলোড:</span>
                                  <strong className="text-black font-black truncate">{item.destination}</strong>
                                </div>

                                <div className="text-[10px] text-neutral-500 font-mono pt-1 border-t border-neutral-200 flex items-center justify-between">
                                  <span className="truncate max-w-[180px]">{item.name}</span>
                                  {item.size && (
                                    <span>{(item.size / (1024 * 1024)).toFixed(2)} MB</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions: Download, Fullscreen, Delete */}
                            <div className="flex items-center justify-between pt-2 border-t border-black/20">
                              <button
                                type="button"
                                onClick={() => setSelectedPreviewMedia(item)}
                                className="bg-[#F0F2F5] hover:bg-neutral-200 text-black border border-black px-2 py-1 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>ফুল ভিউ</span>
                              </button>

                              <div className="flex items-center gap-1.5">
                                <a
                                  href={item.url}
                                  download={item.name}
                                  className="bg-[#FFE600] hover:bg-yellow-400 text-black border border-black px-2 py-1 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>ডাউনলোড</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm(`⚠️ আপনি কি নিশ্চিত যে আপনি '${item.name}' মিডিয়া ফাইলটি ক্লাউড ভল্ট থেকে মুছে ফেলতে চান?`)) {
                                      await deleteMediaAuditItem(item.id);
                                    }
                                  }}
                                  className="bg-[#FFF1F2] hover:bg-[#D71920] hover:text-white text-[#D71920] border border-black px-2 py-1 text-[10px] font-black uppercase cursor-pointer"
                                  title="Delete from Media Vault"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
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

      {/* ========================================================
          FULLSCREEN MEDIA PREVIEW & AUDIT DOSSIER MODAL
         ======================================================== */}
      {selectedPreviewMedia && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white border-4 border-black w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[10px_10px_0px_0px_#FFE600] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-black text-white p-3 sm:p-4 border-b-4 border-black flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`text-[10px] font-black px-2 py-0.5 border border-white uppercase flex items-center gap-1 ${
                  selectedPreviewMedia.type === 'video' ? 'bg-[#D71920]' : 'bg-[#0066B2]'
                }`}>
                  {selectedPreviewMedia.type === 'video' ? <Film className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                  <span>{selectedPreviewMedia.type === 'video' ? 'ভিডিও অডিট' : 'ফটো অডিট'}</span>
                </span>
                <h4 className="text-sm sm:text-base font-black uppercase text-white truncate max-w-[280px] sm:max-w-md">
                  {selectedPreviewMedia.name}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPreviewMedia(null)}
                className="w-8 h-8 bg-white text-black hover:bg-[#D71920] hover:text-white border-2 border-white flex items-center justify-center font-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#FFE600]"
                title="Close Preview"
              >
                ✕
              </button>
            </div>

            {/* Media Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Media Player Box */}
              <div className="bg-black border-3 border-black p-2 flex items-center justify-center max-h-[50vh] overflow-hidden">
                {selectedPreviewMedia.type === 'video' ? (
                  <video
                    src={selectedPreviewMedia.url}
                    controls
                    autoPlay
                    className="max-h-[46vh] max-w-full mx-auto object-contain"
                  />
                ) : (
                  <img
                    src={selectedPreviewMedia.url}
                    alt={selectedPreviewMedia.name}
                    className="max-h-[46vh] max-w-full object-contain mx-auto"
                  />
                )}
              </div>

              {/* Comprehensive Audit Telemetry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Who uploaded (কে আপলোড করেছে) */}
                <div className="bg-[#EFF6FF] border-2 border-black p-3 space-y-1.5 shadow-[2px_2px_0px_0px_#000]">
                  <span className="text-[10px] font-black uppercase text-[#0066B2] flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>কে আপলোড করেছে (UPLOADER):</span>
                  </span>
                  <div className="text-sm font-black text-black">
                    {selectedPreviewMedia.uploadedBy.name}
                  </div>
                  <div className="text-xs text-neutral-600 truncate">
                    {selectedPreviewMedia.uploadedBy.email || 'No email registered'}
                  </div>
                  <span className={`inline-block text-[9px] font-black px-1.5 py-0.2 border border-black uppercase ${
                    selectedPreviewMedia.uploadedBy.userType === 'admin'
                      ? 'bg-[#D71920] text-white'
                      : selectedPreviewMedia.uploadedBy.userType === 'coach'
                      ? 'bg-[#0066B2] text-white'
                      : 'bg-[#22C55E] text-black'
                  }`}>
                    {selectedPreviewMedia.uploadedBy.role || selectedPreviewMedia.uploadedBy.userType}
                  </span>
                </div>

                {/* 2. When uploaded (কবে ও কখন আপলোড করেছে) */}
                <div className="bg-[#FFFEEA] border-2 border-black p-3 space-y-1.5 shadow-[2px_2px_0px_0px_#000]">
                  <span className="text-[10px] font-black uppercase text-[#D71920] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>কবে ও কখন আপলোড (TIMESTAMP):</span>
                  </span>
                  <div className="text-sm font-black text-black">
                    {selectedPreviewMedia.timestamp}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    {selectedPreviewMedia.isoDate ? new Date(selectedPreviewMedia.isoDate).toUTCString() : 'N/A'}
                  </div>
                  <span className="inline-block text-[9px] font-black bg-black text-[#FFE600] px-1.5 py-0.2 border border-black uppercase">
                    CLOUD VERIFIED
                  </span>
                </div>

                {/* 3. Where uploaded (কোথায় আপলোড করেছে) */}
                <div className="bg-[#F0FDF4] border-2 border-black p-3 space-y-1.5 shadow-[2px_2px_0px_0px_#000]">
                  <span className="text-[10px] font-black uppercase text-[#22C55E] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>কোথায় আপলোড করেছে (DESTINATION):</span>
                  </span>
                  <div className="text-xs font-black text-black truncate">
                    {selectedPreviewMedia.destination}
                  </div>
                  <div className="text-[10px] text-neutral-600">
                    কনটেক্সট: <strong className="uppercase">{selectedPreviewMedia.contextType}</strong>
                  </div>
                  {selectedPreviewMedia.size && (
                    <div className="text-[10px] font-mono text-neutral-500">
                      সাইজ: {(selectedPreviewMedia.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-neutral-100 border-t-3 border-black p-3 sm:p-4 flex items-center justify-between gap-3">
              <a
                href={selectedPreviewMedia.url}
                download={selectedPreviewMedia.name}
                className="bg-[#22C55E] hover:bg-green-600 text-black border-2 border-black px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ডাউনলোড করুন (DOWNLOAD)</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(`⚠️ আপনি কি নিশ্চিত যে আপনি '${selectedPreviewMedia.name}' ফাইলটি স্থায়ীভাবে মুছে ফেলতে চান?`)) {
                      await deleteMediaAuditItem(selectedPreviewMedia.id);
                      setSelectedPreviewMedia(null);
                    }
                  }}
                  className="bg-[#FFF1F2] hover:bg-[#D71920] hover:text-white text-[#D71920] border-2 border-black px-3.5 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>মুছে ফেলুন (DELETE)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPreviewMedia(null)}
                  className="bg-black hover:bg-neutral-800 text-white border-2 border-black px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                >
                  বন্ধ করুন (CLOSE)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
