import React from 'react';
import { Calendar, Users, MessageSquare, CheckSquare, Shield, Trophy, Radio } from 'lucide-react';
import { useClub } from '../context/ClubContext';

interface MobileBottomNavProps {
  activeTab: 'stats' | 'schedules' | 'chat' | 'attendance' | 'admin' | 'realtime';
  setActiveTab: (tab: 'stats' | 'schedules' | 'chat' | 'attendance' | 'admin' | 'realtime') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, events, canAccessLiveData } = useClub();

  const upcomingMatches = events.filter(e => e.type === 'Match' && (e.status === 'Upcoming' || e.status === 'Live')).length;

  const baseNavItems: {
    id: 'schedules' | 'stats' | 'chat' | 'attendance' | 'admin' | 'realtime';
    label: string;
    subLabel: string;
    icon: React.ReactNode;
    badge?: number | string;
  }[] = [
    {
      id: 'schedules',
      label: 'MATCHES',
      subLabel: 'ফি ও সূচি',
      icon: <Calendar className="w-4 h-4" />,
      badge: upcomingMatches > 0 ? upcomingMatches : undefined
    },
    {
      id: 'stats',
      label: 'SQUAD',
      subLabel: 'প্লেয়ার',
      icon: <Users className="w-4 h-4" />
    },
    {
      id: 'chat',
      label: 'CHAT',
      subLabel: 'মেসেজ',
      icon: <MessageSquare className="w-4 h-4" />
    },
    {
      id: 'attendance',
      label: 'ATTEND',
      subLabel: 'উপস্থিতি',
      icon: <CheckSquare className="w-4 h-4" />
    },
    {
      id: 'admin',
      label: 'TACTICS',
      subLabel: 'কৌশল',
      icon: <Shield className="w-4 h-4" />
    }
  ];

  const navItems = canAccessLiveData
    ? [
        ...baseNavItems,
        {
          id: 'realtime' as const,
          label: 'LIVE',
          subLabel: 'রিয়েলটাইম',
          icon: <Radio className="w-4 h-4 text-[#D71920]" />,
          badge: '●'
        }
      ]
    : baseNavItems;

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      style={{ paddingBottom: 'max(0.45rem, env(safe-area-inset-bottom))' }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-3 border-black shadow-[0px_-4px_20px_rgba(0,0,0,0.15)] px-1 pt-1"
    >
      <div className={`grid ${canAccessLiveData ? 'grid-cols-6' : 'grid-cols-5'} gap-0.5`}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                  try { navigator.vibrate(10); } catch {}
                }
                setActiveTab(item.id);
              }}
              className={`relative flex flex-col items-center justify-center py-2 px-1 min-h-[58px] rounded-none transition-all active:scale-90 cursor-pointer ${
                isActive
                  ? 'bg-black text-[#FFE600] font-black'
                  : 'bg-transparent text-neutral-800 hover:bg-[#F6F5EE]'
              }`}
            >
              {/* Active top line indicator */}
              {isActive && (
                <div className="absolute top-0 left-1 right-1 h-1 bg-[#D71920]" />
              )}

              <div className="relative">
                {item.icon}
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-[#D71920] text-white text-[9px] font-black px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center border border-white">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] tracking-tight leading-none mt-1 font-black uppercase truncate max-w-full">
                {item.label}
              </span>
              <span className={`text-[8px] leading-tight opacity-75 truncate max-w-full ${
                isActive ? 'text-[#FFE600]' : 'text-neutral-500'
              }`}>
                {item.subLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
