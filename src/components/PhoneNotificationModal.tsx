import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Bell,
  BellRing,
  X,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  MessageCircle,
  Share2,
  ShieldCheck,
  Radio,
  ExternalLink
} from 'lucide-react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendPhonePushAlert,
  schedulePhonePushAlert,
  openSquadSmsComposer,
  openSquadWhatsApp
} from '../utils/phoneNotification';
import { useClub } from '../context/ClubContext';
import { FlamehunterLogo } from './FlamehunterLogo';

interface PhoneNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhoneNotificationModal: React.FC<PhoneNotificationModalProps> = ({ isOpen, onClose }) => {
  const { players, events, currentUser } = useClub();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [customMsg, setCustomMsg] = useState<string>('Matchday lineup and meetup time confirmed. Check in before 13:00!');

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  // Countdown timer for lock-screen test
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished: Fire notification to phone!
      sendPhonePushAlert({
        title: 'Tactical Match Alert',
        senderName: currentUser.name,
        senderRole: currentUser.role,
        text: '🔥 Flamehunter FC Alert: Your phone received this notification outside the app on your lock screen!',
        channelName: 'TEAM BROADCAST'
      });
      setStatusMessage('Notification delivered to your phone! Check your phone lock screen or notification drawer.');
      setCountdown(null);
    }
  }, [countdown, currentUser]);

  if (!isOpen) return null;

  const handleEnablePermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      setStatusMessage('Phone push notifications activated! Lock screen alerts are now enabled.');
      // Send welcome ping to verify
      sendPhonePushAlert({
        title: 'Phone Notifications Activated',
        senderName: 'Flamehunter System',
        text: 'Your phone is successfully paired for Flamehunter FC match and squad alerts.',
        channelName: 'SYSTEM'
      });
    } else if (res === 'denied') {
      setStatusMessage('Permission was blocked in browser settings. Please allow notifications for this site.');
    }
  };

  const handleTestNow = () => {
    if (permission !== 'granted') {
      handleEnablePermission();
      return;
    }
    sendPhonePushAlert({
      title: 'Squad Readiness Ping',
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: 'Tactical update: Next session boots inspection & match fee confirmation.',
      channelName: 'SQUAD CHAT'
    });
    setStatusMessage('Sent directly to your phone notification tray! (Physical phone vibration & audio chime triggered)');
  };

  const handleStartLockScreenTest = () => {
    if (permission !== 'granted') {
      handleEnablePermission();
      return;
    }
    setCountdown(5);
    setStatusMessage('Countdown started (5s)! Lock your phone screen or switch to your home screen now.');
  };

  // Squad phone list
  const playersWithPhones = players.filter(p => p.phone && p.phone.trim().length > 5);
  const nextMatch = events.find(e => e.type === 'Match' && e.status === 'Upcoming');

  const handleSendSquadSms = () => {
    const phoneList = playersWithPhones.map(p => p.phone as string);
    const msg = `[Flamehunter FC] ${customMsg} (From ${currentUser.name})`;
    openSquadSmsComposer(phoneList, msg);
  };

  const handleSendSquadWhatsApp = () => {
    const msg = `🔥 *FLAMEHUNTER FC OFFICIAL ALERT*\n\n${customMsg}\n\n— Sent by ${currentUser.name} (${currentUser.role})`;
    openSquadWhatsApp(msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#F6F7FA] border-4 border-black shadow-[8px_8px_0px_0px_#000] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-[#0066B2] text-white p-4 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#FFE600] p-1.5 border-2 border-black text-black">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <span>PHONE NOTIFICATIONS</span>
                <span className="bg-[#D71920] text-white text-[10px] px-1.5 py-0.5 border border-black">
                  DEVICE ONLY
                </span>
              </h2>
              <p className="text-[11px] font-bold text-blue-100 uppercase">
                System Lock-Screen, Notification Drawer & Squad SMS (No In-App Popups)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white text-black hover:bg-[#D71920] hover:text-white p-1 border-2 border-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Status Box */}
          <div className={`p-3.5 border-3 border-black ${
            permission === 'granted' ? 'bg-[#DCFCE7]' : 'bg-[#FEF3C7]'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {permission === 'granted' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-[#D97706]" />
                )}
                <div>
                  <div className="text-xs font-black uppercase tracking-wide">
                    PHONE STATUS: {permission === 'granted' ? 'ENABLED (READY FOR LOCK SCREEN ALERTS)' : 'PERMISSION REQUIRED'}
                  </div>
                  <div className="text-[11px] font-bold text-neutral-700">
                    {permission === 'granted'
                      ? 'Notifications are delivered to your physical phone notification tray and lock screen.'
                      : 'Grant permission below to deliver alerts directly to your phone hardware.'}
                  </div>
                </div>
              </div>

              {permission !== 'granted' && (
                <button
                  onClick={handleEnablePermission}
                  className="bg-[#22C55E] hover:bg-black hover:text-white text-black px-3 py-1.5 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_#000] shrink-0"
                >
                  ALLOW PHONE ALERTS
                </button>
              )}
            </div>
          </div>

          {/* Feedback message */}
          {statusMessage && (
            <div className="bg-[#FFE600] border-2 border-black p-2.5 text-xs font-black uppercase text-black flex items-center justify-between">
              <span>{statusMessage}</span>
              <button onClick={() => setStatusMessage('')} className="hover:underline font-bold text-[10px]">
                ✕
              </button>
            </div>
          )}

          {/* Countdown Display if Testing Lock Screen */}
          {countdown !== null && (
            <div className="bg-[#D71920] text-white border-3 border-black p-4 text-center animate-pulse">
              <div className="text-3xl font-black">{countdown} SECONDS</div>
              <p className="text-xs font-black uppercase mt-1 text-yellow-200">
                LOCK YOUR PHONE SCREEN OR MINIMIZE APP NOW!
              </p>
              <p className="text-[10px] text-white/90 mt-0.5">
                The alert will pop up on your phone lock screen with sound and vibration.
              </p>
            </div>
          )}

          {/* Action Grid: Test Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-neutral-800 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-[#0066B2]" />
              <span>TEST PHONE DELIVERY (NO IN-APP POPUP)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleTestNow}
                className="bg-white hover:bg-neutral-100 text-black border-2 border-black p-3 text-left font-black flex flex-col justify-between shadow-[2px_2px_0px_0px_#000]"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs uppercase">1. INSTANT PHONE ALERT</span>
                  <Radio className="w-4 h-4 text-[#22C55E]" />
                </div>
                <span className="text-[10px] font-bold text-neutral-600 mt-1">
                  Triggers OS notification shade, vibration & audio chime immediately.
                </span>
              </button>

              <button
                onClick={handleStartLockScreenTest}
                className="bg-[#FFE600] hover:bg-[#FFE600]/80 text-black border-2 border-black p-3 text-left font-black flex flex-col justify-between shadow-[2px_2px_0px_0px_#000]"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs uppercase">2. TEST 5s LOCK SCREEN</span>
                  <Clock className="w-4 h-4 text-[#D71920]" />
                </div>
                <span className="text-[10px] font-bold text-neutral-800 mt-1">
                  Gives you 5 seconds to lock your phone and see it on your lock screen.
                </span>
              </button>
            </div>
          </div>

          {/* Squad Phone Broadcast Section (Direct to Player Phones via SMS / WhatsApp) */}
          <div className="bg-white border-3 border-black p-3.5 space-y-3 shadow-[3px_3px_0px_0px_#000]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase flex items-center gap-1.5 text-black">
                <Send className="w-3.5 h-3.5 text-[#D71920]" />
                <span>BROADCAST TO SQUAD PHONES (SMS / WHATSAPP)</span>
              </span>
              <span className="text-[10px] font-black bg-[#FFE600] text-black px-1.5 py-0.5 border border-black uppercase">
                {playersWithPhones.length} PLAYERS WITH PHONES
              </span>
            </div>

            <textarea
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              rows={2}
              className="w-full bg-[#F6F7FA] border-2 border-black p-2 text-xs font-bold text-black resize-none"
              placeholder="Enter message to send to players' mobile phones..."
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSendSquadSms}
                className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-black hover:text-white px-3 py-2 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>OPEN SMS TO SQUAD PHONES</span>
              </button>

              <button
                onClick={handleSendSquadWhatsApp}
                className="flex-1 bg-[#0066B2] hover:bg-[#004C85] text-white px-3 py-2 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>WHATSAPP SQUAD BROADCAST</span>
              </button>
            </div>
          </div>

          {/* Privacy & Behavioral Guarantee */}
          <div className="bg-[#F6F7FA] border-2 border-neutral-300 p-2 text-[10px] font-bold text-neutral-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0" />
            <span>
              <strong>Guaranteed:</strong> Notifications are handled by your phone's native Operating System. No on-screen popup toasts clutter the app interface.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-neutral-100 p-3 border-t-3 border-black flex justify-between items-center">
          <span className="text-[10px] font-black text-neutral-500 uppercase">
            FLAMEHUNTER FC • PUSH SERVICE V2.1
          </span>
          <button
            onClick={onClose}
            className="bg-black text-white hover:bg-[#FFE600] hover:text-black px-4 py-1.5 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-colors"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
};
