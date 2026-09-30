import React, { useState, useEffect } from 'react';
import { ClubProvider, useClub } from './context/ClubContext';
import { Header } from './components/Header';
import { PlayerStatsView } from './components/PlayerStatsView';
import { SchedulesView } from './components/SchedulesView';
import { ChatAndGroupsView } from './components/ChatAndGroupsView';
import { AttendanceView } from './components/AttendanceView';
import { AdminTechnicalView } from './components/AdminTechnicalView';
import { FlamehunterLogo } from './components/FlamehunterLogo';
import { PlayerProfilePage } from './components/PlayerProfilePage';
import { DataCenterModal } from './components/DataCenterModal';
import { RealTimeDataView } from './components/RealTimeDataView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PhoneNotificationModal } from './components/PhoneNotificationModal';
import { LoginModal } from './components/LoginModal';
import { RecordPastMatchModal } from './components/RecordPastMatchModal';
import { GatekeeperView } from './components/GatekeeperView';
import { Flame, ShieldCheck, HeartHandshake, Lock, Database, Smartphone } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    currentUser,
    isLoggedIn,
    selectedPlayerProfileId,
    setSelectedPlayerProfileId,
    isDataCenterOpen,
    setIsDataCenterOpen,
    openDataCenter,
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    openNotificationModal,
    isLoginPanelOpen,
    setIsLoginPanelOpen,
    openLoginPanel,
    isRecordPastMatchModalOpen,
    setIsRecordPastMatchModalOpen,
    targetMatchForRecording,
    dbStatus,
    canAccessLiveData
  } = useClub();
  const [activeTab, setActiveTab] = useState<'stats' | 'schedules' | 'chat' | 'attendance' | 'admin' | 'realtime'>('stats');
  const [selectedAttendanceEventId, setSelectedAttendanceEventId] = useState<string | undefined>(undefined);

  // If activeTab is 'realtime' but user has no clearance (coach/player), immediately redirect to 'stats'
  useEffect(() => {
    if (activeTab === 'realtime' && !canAccessLiveData) {
      setActiveTab('stats');
    }
  }, [activeTab, canAccessLiveData]);

  const handleGoToAttendance = (eventId: string) => {
    setSelectedAttendanceEventId(eventId);
    setSelectedPlayerProfileId(null);
    setActiveTab('attendance');
  };

  const handleTabChange = (tab: 'stats' | 'schedules' | 'chat' | 'attendance' | 'admin' | 'realtime') => {
    setSelectedPlayerProfileId(null);
    if (tab === 'realtime' && !canAccessLiveData) {
      setActiveTab('stats');
      return;
    }
    setActiveTab(tab);
  };

  // Strict Web Security Guard: If user is not logged in, enforce Gatekeeper Portal
  if (!isLoggedIn) {
    return <GatekeeperView />;
  }

  // Dedicated Full-Page Chat View (Separate Messenger Page - 100% Viewport Fit)
  if (activeTab === 'chat') {
    return (
      <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#F0F2F5] text-black flex flex-col overflow-hidden selection:bg-[#FFE600] fixed inset-0 z-40">
        {/* Dedicated Chat Page Header */}
        <div className="shrink-0 bg-[#0084FF] text-white border-b-2 sm:border-b-3 border-black px-2.5 sm:px-6 py-2 flex items-center justify-between z-30 shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleTabChange('stats')}
              className="bg-white hover:bg-[#FFE600] text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
              title="Return to Club Hub"
            >
              <span>← CLUB HUB (ক্লাব পেজ)</span>
            </button>
            <div className="flex items-center gap-2">
              <FlamehunterLogo size="xs" withShadow />
              <div>
                <h1 className="text-xs sm:text-base font-black uppercase text-white leading-none">
                  FLAMEHUNTER MESSENGER
                </h1>
                <span className="text-[10px] font-bold text-blue-100 uppercase hidden md:inline">
                  OFFICIAL SQUAD CHAT ROOM
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black text-[#FFE600] px-2 py-1 border border-black text-xs font-black uppercase">
              <div
                className="w-4 h-4 rounded-full border border-black flex items-center justify-center font-black text-[9px] text-white"
                style={{ backgroundColor: currentUser.avatarBg || '#D71920' }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <span className="truncate max-w-[80px] sm:max-w-[150px]">{currentUser.name}</span>
            </div>

            <button
              type="button"
              onClick={openNotificationModal}
              className="w-8 h-8 bg-white hover:bg-[#FFE600] text-black border-2 border-black flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_0px_#000]"
              title="Phone Alerts"
            >
              <Smartphone className="w-4 h-4 text-[#22C55E]" />
            </button>
          </div>
        </div>

        {/* Dedicated Full Page Chat Body - 100% of remaining viewport height */}
        <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto p-0 sm:p-2 sm:pb-3 overflow-hidden flex flex-col">
          <ChatAndGroupsView isDedicatedPage={true} onBackToHub={() => handleTabChange('stats')} />
        </main>

        {/* Global Modals */}
        <PhoneNotificationModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
        />
        <LoginModal
          isOpen={isLoginPanelOpen}
          onClose={() => setIsLoginPanelOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FA] text-black flex flex-col justify-between selection:bg-[#FFE600] relative">
      {/* Navigation Header */}
      <div>
        <Header activeTab={activeTab} setActiveTab={handleTabChange} />

        {/* Main Tab Viewport */}
        <main className="max-w-7xl mx-auto px-2.5 sm:px-6 py-3 sm:py-6 pb-28 md:pb-8 w-full overflow-x-hidden">
          {selectedPlayerProfileId ? (
            <PlayerProfilePage
              playerId={selectedPlayerProfileId}
              onBack={() => setSelectedPlayerProfileId(null)}
            />
          ) : (
            <>
              {activeTab === 'stats' && <PlayerStatsView />}
              {activeTab === 'schedules' && <SchedulesView onGoToAttendance={handleGoToAttendance} />}
              {activeTab === 'attendance' && <AttendanceView initialEventId={selectedAttendanceEventId} />}
              {activeTab === 'admin' && <AdminTechnicalView />}
              {activeTab === 'realtime' && (
                canAccessLiveData ? (
                  <RealTimeDataView />
                ) : (
                  <div className="bg-white border-4 border-black p-8 text-center shadow-[6px_6px_0px_0px_#000] max-w-xl mx-auto my-12">
                    <div className="w-16 h-16 bg-[#D71920] text-white border-3 border-black mx-auto flex items-center justify-center font-black mb-4 shadow-[3px_3px_0px_0px_#000]">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black uppercase text-black mb-2">ACCESS RESTRICTED: LIVE DATA</h2>
                    <p className="text-sm font-bold text-neutral-600 mb-6 uppercase">
                      Live database telemetry and real-time event logs are restricted to Club Administration. Players and coaching staff do not have clearance to view this stream.
                    </p>
                    <button
                      onClick={() => setActiveTab('stats')}
                      className="bg-[#FFE600] text-black border-2 border-black font-black uppercase px-4 py-2 hover:bg-black hover:text-[#FFE600] shadow-[2px_2px_0px_0px_#000] transition-all"
                    >
                      RETURN TO SQUAD ROSTER
                    </button>
                  </div>
                )
              )}
            </>
          )}
        </main>
      </div>

      {/* FFC DATA CENTER Database Management Modal - Restricted to Admin Clearance */}
      {canAccessLiveData && (
        <DataCenterModal
          isOpen={isDataCenterOpen}
          onClose={() => setIsDataCenterOpen(false)}
          onOpenRealTime={() => {
            setIsDataCenterOpen(false);
            setSelectedPlayerProfileId(null);
            setActiveTab('realtime');
          }}
        />
      )}

      {/* Phone Notifications & Lock-Screen Setup Modal */}
      <PhoneNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      {/* Single Login Box for Admin, Coach, and Player */}
      <LoginModal
        isOpen={isLoginPanelOpen}
        onClose={() => setIsLoginPanelOpen(false)}
      />

      {/* Past Match & Squad Stats Auto-Record Modal */}
      <RecordPastMatchModal
        isOpen={isRecordPastMatchModalOpen}
        onClose={() => setIsRecordPastMatchModalOpen(false)}
        targetEvent={targetMatchForRecording}
      />

      {/* Mobile Sticky Bottom Navigation (Phone optimized) */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Neo-Brutalist Global Footer */}
      <footer className="w-full bg-white border-t-4 border-black py-6 px-4 sm:px-6 mt-12 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FlamehunterLogo size="sm" withShadow />
            <div>
              <span className="font-black text-sm uppercase text-black tracking-tight flex items-center gap-1.5">
                <span>FLAMEHUNTER</span>
                <span className="text-[#D71920]">FC</span>
                <span className="text-[10px] bg-black text-[#FFE600] px-1 font-mono">EST. 2002 • XXMMII</span>
              </span>
              <p className="text-[10px] font-bold text-neutral-600 uppercase">
                "VICTORIA PER IGNEM" — VICTORY THROUGH THE FLAME • ALL RIGHTS RESERVED
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-black uppercase flex-wrap">
            {canAccessLiveData && (
              <button
                onClick={openDataCenter}
                title="Open FFC DATA CENTER Control Hub"
                className="flex items-center gap-1.5 bg-[#FFE600] text-black hover:bg-black hover:text-white px-2.5 py-1 border-2 border-black font-black transition-all shadow-[2px_2px_0px_0px_#000]"
              >
                <Database className="w-3.5 h-3.5 text-[#D71920]" />
                <span>FFC DATA CENTER</span>
                <span className={`w-2 h-2 rounded-full border border-black ${dbStatus === 'connected' ? 'bg-[#22C55E]' : dbStatus === 'syncing' ? 'bg-[#0066B2] animate-ping' : 'bg-[#D71920]'}`} />
              </button>
            )}
            <span className="bg-[#0066B2] text-white px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              PREMIER DIVISION LEADERS
            </span>
            <span className="bg-[#D71920] text-white px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              HOME: FLAME ARENA
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ClubProvider>
      <MainContent />
    </ClubProvider>
  );
}
