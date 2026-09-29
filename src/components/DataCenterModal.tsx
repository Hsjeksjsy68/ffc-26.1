import React, { useState } from 'react';
import { useClub } from '../context/ClubContext';
import { FFC_DATABASE_NAME, firebaseConfig } from '../lib/firebase';
import {
  Database,
  Server,
  Cloud,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  X,
  Layers,
  ShieldCheck,
  Calendar,
  Users,
  MessageSquare,
  Activity,
  HardDrive,
  Radio,
  Zap
} from 'lucide-react';

interface DataCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRealTime?: () => void;
}

export const DataCenterModal: React.FC<DataCenterModalProps> = ({ isOpen, onClose, onOpenRealTime }) => {
  const {
    players,
    events,
    attendanceRecords,
    chatMessages,
    chatGroups,
    resetAllData,
    dbStatus,
    syncWithDataCenter,
    realtimePulse,
    canAccessLiveData,
    canResetData
  } = useClub();

  const [isResetting, setIsResetting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  if (!isOpen || !canAccessLiveData) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setFeedbackMsg('Syncing current club state with FFC DATA CENTER...');
    try {
      await syncWithDataCenter();
      setIsSyncing(false);
      setFeedbackMsg('FFC DATA CENTER is fully synchronized!');
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setIsSyncing(false);
      setFeedbackMsg('Sync encountered an issue. Check connection.');
      setTimeout(() => setFeedbackMsg(''), 3000);
    }
  };

  const handleResetData = async () => {
    const confirmed = window.confirm(
      '⚠️ ARE YOU ABSOLUTELY SURE?\n\nThis will RESET all data in "FFC DATA CENTER" database (including players, match schedules, chat messages, fees, and attendance) and re-initialize clean default Flamehunter FC records.'
    );
    if (!confirmed) return;

    setIsResetting(true);
    setFeedbackMsg('Wiping and re-initializing FFC DATA CENTER...');
    try {
      await resetAllData();
      setFeedbackMsg('SUCCESS: FFC DATA CENTER data has been completely reset!');
      setTimeout(() => {
        setFeedbackMsg('');
        setIsResetting(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      setFeedbackMsg('Error during database reset. Check console.');
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F6F7FA] border-4 border-black w-full max-w-2xl max-h-[92vh] flex flex-col shadow-[8px_8px_0px_0px_#000] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0066B2] text-white border-b-4 border-black p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFE600] text-black border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#000]">
              <Database className="w-5 h-5 text-[#D71920]" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-[#FFE600] tracking-wider flex items-center gap-1.5">
                <Cloud className="w-3 h-3" />
                <span>CLOUD STORAGE BACKBONE</span>
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                <span>{FFC_DATABASE_NAME}</span>
                <span className="bg-[#22C55E] text-black text-[10px] px-2 py-0.5 border border-black font-black">
                  CONNECTED
                </span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-white text-black hover:bg-[#D71920] hover:text-white border-2 border-black p-1.5 transition-colors shadow-[2px_2px_0px_0px_#000]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="bg-[#FFE600] text-black border-b-2 border-black px-4 py-2 text-xs font-black uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 animate-spin text-[#D71920]" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Database Specs Card */}
          <div className="bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <span className="text-xs font-black uppercase text-neutral-600 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-[#0066B2]" />
                DATABASE SPECIFICATIONS
              </span>
              <span className="text-[10px] font-black bg-[#22C55E]/20 text-[#15803d] border border-[#15803d] px-2 py-0.5 uppercase flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                LIVE PERSISTENCE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#F6F7FA] p-2.5 border-2 border-black">
                <span className="text-[10px] font-black text-neutral-500 uppercase block">DATABASE NAME</span>
                <span className="text-sm font-black text-[#D71920]">{FFC_DATABASE_NAME}</span>
              </div>
              <div className="bg-[#F6F7FA] p-2.5 border-2 border-black">
                <span className="text-[10px] font-black text-neutral-500 uppercase block">ENGINE</span>
                <span className="text-sm font-black text-black">Google Cloud Firestore</span>
              </div>
              <div className="bg-[#F6F7FA] p-2.5 border-2 border-black sm:col-span-2">
                <span className="text-[10px] font-black text-neutral-500 uppercase block">DATABASE ID</span>
                <code className="text-xs font-mono font-bold text-[#0066B2] break-all">
                  {firebaseConfig.firestoreDatabaseId}
                </code>
              </div>
              <div className="bg-[#F6F7FA] p-2.5 border-2 border-black sm:col-span-2">
                <span className="text-[10px] font-black text-neutral-500 uppercase block">PROJECT ID</span>
                <code className="text-xs font-mono font-bold text-black">
                  {firebaseConfig.projectId}
                </code>
              </div>
            </div>
          </div>

          {/* Collection Status Counters */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#D71920]" />
              COLLECTIONS & RECORD COUNTERS
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center justify-between text-neutral-600 mb-1">
                  <span className="text-[10px] font-black uppercase">PLAYERS</span>
                  <Users className="w-3.5 h-3.5 text-[#0066B2]" />
                </div>
                <div className="text-lg font-black text-black">{players.length}</div>
                <div className="text-[9px] font-bold text-neutral-500">ffc_players</div>
              </div>

              <div className="bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center justify-between text-neutral-600 mb-1">
                  <span className="text-[10px] font-black uppercase">MATCHES & EVENTS</span>
                  <Calendar className="w-3.5 h-3.5 text-[#D71920]" />
                </div>
                <div className="text-lg font-black text-black">{events.length}</div>
                <div className="text-[9px] font-bold text-neutral-500">ffc_events</div>
              </div>

              <div className="bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center justify-between text-neutral-600 mb-1">
                  <span className="text-[10px] font-black uppercase">ATTENDANCE</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                </div>
                <div className="text-lg font-black text-black">{attendanceRecords.length}</div>
                <div className="text-[9px] font-bold text-neutral-500">ffc_attendance</div>
              </div>

              <div className="bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center justify-between text-neutral-600 mb-1">
                  <span className="text-[10px] font-black uppercase">CHAT MESSAGES</span>
                  <MessageSquare className="w-3.5 h-3.5 text-[#FFE600]" />
                </div>
                <div className="text-lg font-black text-black">{chatMessages.length}</div>
                <div className="text-[9px] font-bold text-neutral-500">ffc_chat_messages</div>
              </div>

              <div className="bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center justify-between text-neutral-600 mb-1">
                  <span className="text-[10px] font-black uppercase">CHAT CHANNELS</span>
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-600" />
                </div>
                <div className="text-lg font-black text-black">{chatGroups.length}</div>
                <div className="text-[9px] font-bold text-neutral-500">ffc_chat_groups</div>
              </div>

              <div className="bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center justify-between text-neutral-600 mb-1">
                  <span className="text-[10px] font-black uppercase">SETTINGS & TACTICS</span>
                  <HardDrive className="w-3.5 h-3.5 text-[#0066B2]" />
                </div>
                <div className="text-lg font-black text-[#22C55E]">ACTIVE</div>
                <div className="text-[9px] font-bold text-neutral-500">ffc_system</div>
              </div>
            </div>
          </div>

          {/* Live Real-Time Telemetry Quick Action */}
          {onOpenRealTime && (
            <div className="bg-black text-white p-3 border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[3px_3px_0px_0px_#FFE600]">
              <div className="flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-[#D71920] animate-pulse" />
                <div>
                  <div className="text-xs font-black uppercase text-[#FFE600] flex items-center gap-1.5">
                    <span>LIVE EVENT TELEMETRY STREAM</span>
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  </div>
                  <div className="text-[11px] text-neutral-300 font-bold">
                    Watch real-time Firestore synchronization pulses ({realtimePulse} pulses recorded)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenRealTime}
                className="bg-[#FFE600] hover:bg-white text-black border-2 border-white px-3.5 py-1.5 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#D71920] shrink-0 active:translate-x-0.5 active:translate-y-0.5"
              >
                <Zap className="w-3.5 h-3.5 text-[#D71920]" />
                <span>OPEN REAL-TIME VIEW</span>
              </button>
            </div>
          )}

          {/* Database Control Actions */}
          <div className="bg-[#FFE600]/25 border-3 border-black p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D71920]" />
              <span className="text-xs font-black uppercase text-black">
                DATABASE CONTROLS & RESET
              </span>
            </div>

            <p className="text-xs font-bold text-neutral-700 leading-relaxed">
              All changes in the squad roster, schedules, fee payments, attendance records, and team chat channels are saved directly in <strong>{FFC_DATABASE_NAME}</strong>. If you need to re-initialize or clear previous test data, use the reset option below.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex-1 bg-white hover:bg-neutral-100 text-black border-2 border-black px-4 py-2.5 text-xs font-black uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#0066B2]' : ''}`} />
                <span>{isSyncing ? 'SYNCING...' : 'SYNC FFC DATA CENTER'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetData}
                disabled={isResetting}
                className="flex-1 bg-[#D71920] hover:bg-red-700 text-white border-2 border-black px-4 py-2.5 text-xs font-black uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
              >
                <Trash2 className={`w-4 h-4 ${isResetting ? 'animate-bounce' : ''}`} />
                <span>{isResetting ? 'RESETTING...' : 'RESET ALL DATA IN FFC DATA CENTER'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Close */}
        <div className="bg-white border-t-2 border-black p-3 flex items-center justify-between">
          <div className="text-[11px] font-black uppercase text-neutral-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
            <span>STATUS: {dbStatus || 'ONLINE & SYNCHRONIZED'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-black hover:bg-neutral-800 text-white border-2 border-black px-5 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#FFE600]"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
