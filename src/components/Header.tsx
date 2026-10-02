import React from 'react';
import { useClub } from '../context/ClubContext';
import { FlamehunterLogo } from './FlamehunterLogo';
import { Flame, Trophy, Calendar, MessageSquare, CheckSquare, ShieldAlert, Users, RotateCcw, Sparkles, Database, Radio, Zap, Smartphone, Bell, Activity, LogIn, LogOut, User, Shield, ClipboardList } from 'lucide-react';

interface HeaderProps {
  activeTab: 'stats' | 'schedules' | 'chat' | 'attendance' | 'admin' | 'realtime';
  setActiveTab: (tab: 'stats' | 'schedules' | 'chat' | 'attendance' | 'admin' | 'realtime') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentUser,
    openLoginPanel,
    logoutUser,
    getTeamAttendanceRate,
    players,
    events,
    resetAllData,
    clubLogo,
    openDataCenter,
    openNotificationModal,
    dbStatus,
    canAccessLiveData,
    canResetData,
    canChangeLogo
  } = useClub();
  const attendanceRate = getTeamAttendanceRate();
  const upcomingMatches = events.filter(e => e.type === 'Match' && e.status === 'Upcoming');
  const nextMatch = upcomingMatches[0];

  return (
    <header className="w-full bg-[#F6F7FA] border-b-2 sm:border-b-4 border-black">
      {/* Mobile Native App Bar (Ultra-clean, compact, phone-native feel) */}
      <div className="md:hidden bg-white border-b-2 border-black px-3 py-2 flex items-center justify-between sticky top-0 z-30 shadow-[0px_2px_8px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2">
          <FlamehunterLogo size="xs" withShadow />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm uppercase tracking-tight text-black leading-none">
                FLAMEHUNTER <span className="text-[#D71920]">FC</span>
              </span>
              <span className="text-[9px] bg-black text-[#FFE600] px-1 font-bold">
                {players.length}P
              </span>
            </div>
            <span className="text-[9px] font-bold text-neutral-500 uppercase block mt-0.5">
              {nextMatch ? `VS ${nextMatch.matchDetails?.opponent?.substring(0, 12) || 'MATCH'}` : 'OFFICIAL SQUAD APP'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Notification Bell */}
          <button
            type="button"
            onClick={openNotificationModal}
            className="w-8 h-8 bg-[#F6F5EE] border-2 border-black flex items-center justify-center text-black active:bg-[#FFE600] shadow-[1px_1px_0px_0px_#000] cursor-pointer"
            title="Phone Alerts"
          >
            <Smartphone className="w-4 h-4 text-[#22C55E]" />
          </button>

          {/* User Account / Role Switcher Pill */}
          <button
            type="button"
            onClick={openLoginPanel}
            className="flex items-center gap-1.5 bg-[#F6F5EE] hover:bg-[#FFE600] border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.name}
                className="w-5 h-5 border border-black object-cover"
              />
            ) : (
              <div
                className="w-5 h-5 border border-black flex items-center justify-center font-black text-[10px] text-white"
                style={{ backgroundColor: currentUser.avatarBg || '#D71920' }}
              >
                {currentUser.name.charAt(0)}
              </div>
            )}
            <span className={`text-[9px] font-black px-1 py-0.2 border border-black uppercase text-white ${
              currentUser.userType === 'admin'
                ? 'bg-[#D71920]'
                : currentUser.userType === 'coach'
                ? 'bg-[#0066B2]'
                : 'bg-[#22C55E] text-black'
            }`}>
              {currentUser.userType === 'admin' ? 'ADMIN' : currentUser.userType === 'coach' ? 'COACH' : 'PLAYER'}
            </span>
          </button>

          {/* Direct Mobile Logout Button */}
          <button
            type="button"
            onClick={logoutUser}
            className="bg-[#D71920] hover:bg-red-700 text-white border-2 border-black px-2 py-1 text-[9px] font-black uppercase shadow-[1px_1px_0px_0px_#000] flex items-center gap-1 cursor-pointer active:scale-95"
            title="Log out and return to Login Screen"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden xs:inline">LOGOUT</span>
          </button>
        </div>
      </div>

      {/* Desktop Neo-Brutalist Ticker Banner in Official Flamehunter Blue & Gold */}
      <div className="hidden md:flex bg-[#0066B2] text-white border-b-2 border-black py-1.5 px-4 overflow-x-auto whitespace-nowrap text-xs sm:text-sm font-black tracking-wider uppercase items-center justify-between gap-4">
        <div className="flex items-center gap-6 animate-none">
          <span className="flex items-center gap-1.5">
            <FlamehunterLogo size="xs" />
            <span className="text-white">FLAMEHUNTER FC</span>
            <span className="text-[#FFE600]">• OFFICIAL CLUB HUB</span>
          </span>
          <span className="bg-[#D71920] text-white px-2 py-0.5 border-2 border-black shadow-[1px_1px_0px_0px_#000]">
            LEAGUE 1ST [14W-2D-2L]
          </span>
          <span className="hidden md:inline bg-black text-[#FFE600] px-2 py-0.5 border border-black">
            ATTENDANCE RECORD: <strong className="underline">{attendanceRate}%</strong>
          </span>
          {nextMatch && (
            <span className="hidden sm:inline bg-white text-black px-2 py-0.5 border border-black font-black">
              NEXT MATCH: VS {nextMatch.matchDetails?.opponent?.toUpperCase() || nextMatch.title.toUpperCase()} ({nextMatch.date})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* FFC DATA CENTER Direct Status and Control Button (Admin Only - Hidden from coach and players) */}
          {canAccessLiveData && (
            <button
              onClick={openDataCenter}
              title="Open FFC DATA CENTER Database Hub to view status, sync, or reset"
              className="flex items-center gap-1.5 text-[11px] bg-[#FFE600] text-black hover:bg-white border-2 border-black px-2.5 py-0.5 font-black transition-all shadow-[1px_1px_0px_0px_#000]"
            >
              <Database className="w-3.5 h-3.5 text-[#D71920]" />
              <span>FFC DATA CENTER</span>
              <span className={`w-2 h-2 rounded-full border border-black ${dbStatus === 'connected' ? 'bg-[#22C55E]' : dbStatus === 'syncing' ? 'bg-[#0066B2] animate-ping' : 'bg-[#D71920]'}`} />
            </button>
          )}

          {canChangeLogo && (
            <button
              onClick={() => setActiveTab('admin')}
              title="Configure or upload official club logo in Admin panel"
              className="flex items-center gap-1 text-[11px] bg-white text-black hover:bg-[#FFE600] border-2 border-black px-2 py-0.5 font-bold transition-all shadow-[1px_1px_0px_0px_#000]"
            >
              <Sparkles className="w-3 h-3 text-[#D71920]" />
              <span className="hidden sm:inline">
                {clubLogo.type === 'custom' ? 'CUSTOM CREST' : clubLogo.type === 'image' ? 'PHOTO CREST' : 'CREST STUDIO'}
              </span>
            </button>
          )}

          {/* Phone Push Notifications Hub Button */}
          <button
            onClick={openNotificationModal}
            title="Configure notifications to your phone (system lock screen alerts & squad SMS)"
            className="flex items-center gap-1.5 text-[11px] bg-white text-black hover:bg-[#FFE600] border-2 border-black px-2 py-0.5 font-black transition-all shadow-[1px_1px_0px_0px_#000]"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#22C55E]" />
            <span className="hidden sm:inline">PHONE ALERTS</span>
          </button>

          {canResetData && (
            <button
              onClick={openDataCenter}
              title="Reset or manage database data in FFC DATA CENTER"
              className="flex items-center gap-1 text-[11px] bg-white text-black hover:bg-[#D71920] hover:text-white border-2 border-black px-2 py-0.5 font-bold transition-all shadow-[1px_1px_0px_0px_#000]"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">RESET / DATA</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Main Brand & Identity Row */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Official Club Crest & Title */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div
              className="relative group cursor-pointer"
              onClick={() => setActiveTab('admin')}
              title="Click to open Club Logo & Crest Studio in Admin"
            >
              <FlamehunterLogo
                size="xl"
                withShadow
                className="hover:scale-105 transition-transform"
              />
              <div className="absolute -bottom-1.5 -right-2 bg-black text-[#FFE600] text-[9px] font-black px-1.5 py-0.5 border-2 border-black uppercase tracking-tight shadow-[1px_1px_0px_0px_#000] flex items-center gap-1 group-hover:bg-[#D71920] group-hover:text-white transition-colors">
                <span>EST. 2002</span>
                <span className="hidden group-hover:inline">• EDIT CREST</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                  <span>FLAMEHUNTER</span>
                  <span className="text-[#D71920]">FC</span>
                </h1>
                <span className="bg-[#0066B2] text-white font-black text-xs px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                  SQUAD: {players.length} PLAYERS
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-neutral-800 tracking-wide uppercase mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="bg-[#D71920] text-white text-[10px] font-black px-1.5 py-0.2 border border-black">
                  VICTORIA PER IGNEM
                </span>
                <span className="text-neutral-400">•</span>
                <span className="text-[#0066B2] font-black">FIRST TEAM & ACADEMY MANAGER</span>
              </p>
            </div>
          </div>

          {/* Active User Role Badge & Single Login Box Launcher */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-2 bg-white border-3 border-black p-1.5 shadow-[4px_4px_0px_0px_#000]">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-8 h-8 border-2 border-black object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 border-2 border-black flex items-center justify-center font-black text-xs text-white shrink-0"
                  style={{ backgroundColor: currentUser.avatarBg || '#0066B2' }}
                >
                  {currentUser.badgeNumber ? `#${currentUser.badgeNumber}` : currentUser.name.charAt(0)}
                </div>
              )}
              <div className="flex flex-col pr-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-black px-1.5 py-0.2 border border-black uppercase ${
                    currentUser.userType === 'admin'
                      ? 'bg-[#D71920] text-white'
                      : currentUser.userType === 'coach'
                      ? 'bg-[#0066B2] text-white'
                      : 'bg-[#22C55E] text-black'
                  }`}>
                    {currentUser.userType === 'admin'
                      ? '🛡️ ADMIN'
                      : currentUser.userType === 'coach'
                      ? '📋 COACH'
                      : '⚽ PLAYER'}
                  </span>
                  <span className="text-xs font-black uppercase text-black truncate max-w-[120px] sm:max-w-[160px]">
                    {currentUser.name}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-neutral-600 uppercase truncate">
                  {currentUser.role}
                </span>
              </div>
            </div>

            {/* Switch Role Button */}
            <button
              id="header-open-login-box-btn"
              type="button"
              onClick={openLoginPanel}
              title="Open switch role dialog"
              className="bg-[#FFE600] hover:bg-yellow-300 text-black border-3 border-black px-2.5 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-black" />
              <span>SWITCH ROLE</span>
            </button>

            {/* Direct Logout Button */}
            <button
              type="button"
              onClick={logoutUser}
              title="Log out from account and lock portal"
              className="bg-[#D71920] hover:bg-red-700 text-white border-3 border-black px-3 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-white" />
              <span>LOGOUT (লগআউট)</span>
            </button>
          </div>
        </div>

        {/* Neo-Brutalist Navigation Hard Tabs (Desktop Only) */}
        <nav className={`mt-5 hidden md:grid grid-cols-2 sm:grid-cols-3 ${canAccessLiveData ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-2 sm:gap-3`} aria-label="Main Navigation">
          <button
            id="tab-btn-stats"
            onClick={() => setActiveTab('stats')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 border-3 border-black text-xs sm:text-sm font-black uppercase tracking-wide transition-all ${
              activeTab === 'stats'
                ? 'bg-[#0066B2] text-white shadow-[4px_4px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white text-black hover:bg-[#FFE600] shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ROSTER</span>
          </button>

          <button
            id="tab-btn-schedules"
            onClick={() => setActiveTab('schedules')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 border-3 border-black text-xs sm:text-sm font-black uppercase tracking-wide transition-all ${
              activeTab === 'schedules'
                ? 'bg-[#D71920] text-white shadow-[4px_4px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white text-black hover:bg-[#FFE600] shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>SCHEDULES</span>
          </button>

          <button
            id="tab-btn-chat"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 border-3 border-black text-xs sm:text-sm font-black uppercase tracking-wide transition-all ${
              activeTab === 'chat'
                ? 'bg-[#0066B2] text-white shadow-[4px_4px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white text-black hover:bg-[#FFE600] shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>CHAT & GROUPS</span>
          </button>

          <button
            id="tab-btn-attendance"
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 border-3 border-black text-xs sm:text-sm font-black uppercase tracking-wide transition-all ${
              activeTab === 'attendance'
                ? 'bg-[#FFE600] text-black shadow-[4px_4px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white text-black hover:bg-[#FFE600] shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>ATTENDANCE</span>
          </button>

          <button
            id="tab-btn-admin"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 border-3 border-black text-xs sm:text-sm font-black uppercase tracking-wide transition-all ${
              activeTab === 'admin'
                ? 'bg-[#D71920] text-white shadow-[4px_4px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white text-black hover:bg-[#FFE600] shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>TACTICS</span>
          </button>

          {canAccessLiveData && (
            <button
              id="tab-btn-realtime"
              onClick={() => setActiveTab('realtime')}
              className={`relative flex items-center justify-center gap-1.5 py-2.5 px-3 border-3 border-black text-xs sm:text-sm font-black uppercase tracking-wide transition-all ${
                activeTab === 'realtime'
                  ? 'bg-black text-[#FFE600] shadow-[4px_4px_0px_0px_#22C55E] translate-x-[-1px] translate-y-[-1px]'
                  : 'bg-[#FFE600] text-black hover:bg-black hover:text-[#FFE600] shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
              }`}
            >
              <Radio className="w-4 h-4 text-[#D71920] animate-pulse" />
              <span>LIVE DATA</span>
              <span className="w-2 h-2 rounded-full bg-[#22C55E] border border-black animate-ping" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
