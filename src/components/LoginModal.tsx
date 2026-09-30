import React, { useState } from 'react';
import { useClub, UserProfile, determineProfileFromEmail } from '../context/ClubContext';
import { FlamehunterLogo } from './FlamehunterLogo';
import {
  Shield,
  ClipboardList,
  User,
  Lock,
  Key,
  CheckCircle2,
  AlertTriangle,
  X,
  LogIn,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type LoginRoleType = 'admin' | 'coach' | 'player';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    loginUser,
    logoutUser,
    loginWithGoogle,
    loginWithEmail,
    players
  } = useClub();

  // Mode: 'email' (Email & Pass / Google Login) or 'roles' (Direct 3-Role Selection)
  const [activeTab, setActiveTab] = useState<'email' | 'roles'>('email');

  // Email & Password login state
  const [emailInput, setEmailInput] = useState<string>('abdurrakibbinnashir@gmail.com');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Role selector state
  const [selectedRole, setSelectedRole] = useState<LoginRoleType>(
    currentUser.userType === 'coach'
      ? 'coach'
      : currentUser.userType === 'player'
      ? 'player'
      : 'admin'
  );
  const [pinInput, setPinInput] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Derive dynamic role detection from email
  const detectedProfile = determineProfileFromEmail(emailInput);

  // Preset accounts for the 3 distinct types
  const adminProfile: UserProfile = {
    id: 'admin',
    name: 'Abdur Rakib (Club President)',
    role: 'Club President & Super Admin',
    avatarBg: '#D71920',
    isAdmin: true,
    userType: 'admin',
    pin: '2002',
    email: 'abdurrakibbinnashir@gmail.com',
    badgeNumber: 100,
    department: 'Executive Board',
    lastLogin: 'Active session'
  };

  const coachProfile: UserProfile = {
    id: 'coach',
    name: 'Head Coach',
    role: 'Head Coach & Tactics Master',
    avatarBg: '#0066B2',
    isAdmin: false,
    userType: 'coach',
    pin: '1920',
    email: 'coach@flamehunter.fc',
    badgeNumber: 0,
    department: 'Management & Tactics',
    lastLogin: 'Active session'
  };

  const getPlayerProfile = (): UserProfile => {
    const targetPlayer = players.find(p => p.id === selectedPlayerId) || players[0];
    if (targetPlayer) {
      return {
        id: targetPlayer.id,
        name: targetPlayer.name,
        role: `${targetPlayer.role} (#${targetPlayer.number})`,
        avatarBg: targetPlayer.avatarBg || '#22C55E',
        isAdmin: false,
        userType: 'player',
        pin: '1234',
        badgeNumber: targetPlayer.number,
        department: 'First Team Squad',
        lastLogin: 'Active session'
      };
    }
    return {
      id: 'player_squad',
      name: 'Squad Player',
      role: 'First Team Squad Member',
      avatarBg: '#22C55E',
      isAdmin: false,
      userType: 'player',
      pin: '1234',
      badgeNumber: 9,
      department: 'First Team Squad',
      lastLogin: 'Active session'
    };
  };

  // Handle Email & Password Login with Auto-Role Detection
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMsg('Please enter an email address.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const user = await loginWithEmail(emailInput.trim(), passwordInput.trim());
      setSuccessMsg(
        `✓ LOGGED IN AS ${user.name.toUpperCase()} (${(user.userType || 'player').toUpperCase()})`
      );
      setTimeout(() => {
        setSuccessMsg(null);
        setIsProcessing(false);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Email login failed:', err);
      // Fallback with auto-detected role
      loginUser(detectedProfile);
      setSuccessMsg(
        `✓ LOGGED IN AS ${detectedProfile.name.toUpperCase()} (${(detectedProfile.userType || 'player').toUpperCase()})`
      );
      setTimeout(() => {
        setSuccessMsg(null);
        setIsProcessing(false);
        onClose();
      }, 700);
    }
  };

  // Handle Google Login with Auto-Role Detection
  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const user = await loginWithGoogle();
      setSuccessMsg(
        `✓ SIGNED IN WITH GOOGLE: ${user.name.toUpperCase()} (${(user.userType || 'player').toUpperCase()})`
      );
      setTimeout(() => {
        setSuccessMsg(null);
        setIsProcessing(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Google sign in error:', err);
      setErrorMsg('Google login was cancelled or encountered an issue. Used local session.');
      setIsProcessing(false);
    }
  };

  // Handle Role-based Login
  const handleRoleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    let targetUser: UserProfile;
    let expectedPin: string;

    if (selectedRole === 'admin') {
      targetUser = adminProfile;
      expectedPin = '2002';
    } else if (selectedRole === 'coach') {
      targetUser = coachProfile;
      expectedPin = '1920';
    } else {
      targetUser = getPlayerProfile();
      expectedPin = '1234';
    }

    if (pinInput.trim() && pinInput.trim() !== expectedPin) {
      setErrorMsg(`Invalid PIN for ${selectedRole.toUpperCase()}. (Default: ${expectedPin})`);
      return;
    }

    loginUser(targetUser);
    setSuccessMsg(
      `✓ AUTHENTICATED AS ${targetUser.name.toUpperCase()} (${targetUser.role.toUpperCase()})`
    );
    setTimeout(() => {
      setSuccessMsg(null);
      setPinInput('');
      onClose();
    }, 700);
  };

  // 1-Tap Quick Switch
  const handleQuickLogin = (role: LoginRoleType) => {
    setErrorMsg(null);
    let targetUser: UserProfile;
    if (role === 'admin') {
      targetUser = adminProfile;
    } else if (role === 'coach') {
      targetUser = coachProfile;
    } else {
      targetUser = getPlayerProfile();
    }

    loginUser(targetUser);
    setSuccessMsg(`✓ SWITCHED TO ${targetUser.name.toUpperCase()}`);
    setTimeout(() => {
      setSuccessMsg(null);
      setPinInput('');
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      {/* Single Neo-Brutalist Login Box */}
      <div className="bg-white border-4 border-black w-full max-w-lg shadow-[10px_10px_0px_0px_#000] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0066B2] text-white p-4 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlamehunterLogo size="sm" withShadow />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                  FLAMEHUNTER FC
                </span>
                <span className="bg-[#FFE600] text-black text-[10px] font-black px-1.5 py-0.2 border border-black uppercase">
                  UNIFIED LOGIN BOX
                </span>
              </div>
              <p className="text-[11px] font-bold text-neutral-200 uppercase tracking-wide">
                EMAIL & PASS • GOOGLE SIGN-IN • AUTO-ROLE DETECTION
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 bg-white text-black border-2 border-black flex items-center justify-center font-black hover:bg-[#D71920] hover:text-white transition-colors shadow-[2px_2px_0px_0px_#000] cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Session Status Banner */}
        <div className="bg-[#F6F5EE] border-b-2 border-black px-4 py-2 flex items-center justify-between text-xs">
          <span className="font-bold text-neutral-600 uppercase text-[11px]">
            CURRENT ACTIVE SESSION:
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full border border-black"
              style={{ backgroundColor: currentUser.avatarBg }}
            />
            <span className="font-black uppercase text-black">
              {currentUser.name} ({currentUser.userType?.toUpperCase() || 'MEMBER'})
            </span>
          </div>
        </div>

        {/* Tab Switcher: Email / Google Login vs Role Selector */}
        <div className="grid grid-cols-2 border-b-3 border-black bg-neutral-100">
          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              setErrorMsg(null);
            }}
            className={`py-2.5 px-3 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'email'
                ? 'bg-white text-black border-b-3 border-[#0066B2] shadow-[inset_0px_-3px_0px_#0066B2]'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
            }`}
          >
            <Mail className="w-4 h-4 text-[#0066B2]" />
            <span>EMAIL & GOOGLE LOGIN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('roles');
              setErrorMsg(null);
            }}
            className={`py-2.5 px-3 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-white text-black border-b-3 border-[#D71920] shadow-[inset_0px_-3px_0px_#D71920]'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
            }`}
          >
            <Shield className="w-4 h-4 text-[#D71920]" />
            <span>ROLE CARDS (3 ROLES)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* TAB 1: Email & Password / Google Sign In with Auto-Role Detection */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              {/* Google 1-Click Sign-In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isProcessing}
                className="w-full bg-white hover:bg-neutral-100 text-black border-3 border-black py-2.5 px-4 font-black text-xs uppercase shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>CONTINUE WITH GOOGLE (AUTO-DETECT ROLE)</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t-2 border-neutral-300" />
                <span className="text-[10px] font-black uppercase text-neutral-500 bg-white px-2">
                  OR SIGN IN WITH EMAIL
                </span>
                <div className="flex-1 border-t-2 border-neutral-300" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-800 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. abdurrakibbinnashir@gmail.com"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      className="w-full bg-[#F6F5EE] border-2 border-black pl-8 pr-3 py-2 text-xs font-bold text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_#000]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-neutral-800 mb-1">
                    Password (Optional / Demo PIN)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password or leave blank for instant login"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      className="w-full bg-[#F6F5EE] border-2 border-black pl-8 pr-9 py-2 text-xs font-bold text-black focus:bg-white focus:outline-none shadow-[2px_2px_0px_0px_#000]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-black"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Live Auto-Detected Role Indicator */}
                <div
                  className={`p-3 border-2 border-black space-y-1 transition-all ${
                    detectedProfile.userType === 'admin'
                      ? 'bg-red-50 border-[#D71920]'
                      : detectedProfile.userType === 'coach'
                      ? 'bg-blue-50 border-[#0066B2]'
                      : 'bg-green-50 border-[#22C55E]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-black" />
                      AUTO-DETECTED ROLE BY EMAIL:
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 border border-black uppercase text-white ${
                        detectedProfile.userType === 'admin'
                          ? 'bg-[#D71920]'
                          : detectedProfile.userType === 'coach'
                          ? 'bg-[#0066B2]'
                          : 'bg-[#22C55E] text-black'
                      }`}
                    >
                      {detectedProfile.userType?.toUpperCase() || 'PLAYER'}
                    </span>
                  </div>
                  <p className="text-xs font-black uppercase text-black">
                    {detectedProfile.name} • {detectedProfile.role}
                  </p>
                  <p className="text-[10px] font-bold text-neutral-600">
                    {detectedProfile.userType === 'admin'
                      ? '✓ Full admin privileges, crest management, telemetry, and match control.'
                      : detectedProfile.userType === 'coach'
                      ? '✓ Tactical pitch board, draggable formations, starting XI, and match directives.'
                      : '✓ Squad profile, match schedule, fees, and chat. (Tactics are strictly View-Only).'}
                  </p>
                </div>

                {/* Submit Email Login */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-[#0066B2] hover:bg-blue-700 text-white border-3 border-black py-2.5 px-4 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {isProcessing
                      ? 'AUTHENTICATING...'
                      : `LOG IN AS ${(detectedProfile.userType || 'player').toUpperCase()} ↵`}
                  </span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Direct 3-Role Cards Selector */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-2">
                  CHOOSE ACCOUNT TYPE (ONLY 3 ROLES):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Role 1: ADMIN */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('admin');
                      setErrorMsg(null);
                    }}
                    className={`p-3 border-3 border-black text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      selectedRole === 'admin'
                        ? 'bg-[#D71920] text-white shadow-[4px_4px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_0px_#000]'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-wider">ADMIN</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1 py-0.2 border border-black ${
                        selectedRole === 'admin'
                          ? 'bg-black text-[#FFE600]'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      FULL CONTROL
                    </span>
                  </button>

                  {/* Role 2: COACH */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('coach');
                      setErrorMsg(null);
                    }}
                    className={`p-3 border-3 border-black text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      selectedRole === 'coach'
                        ? 'bg-[#0066B2] text-white shadow-[4px_4px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_0px_#000]'
                    }`}
                  >
                    <ClipboardList className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-wider">COACH</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1 py-0.2 border border-black ${
                        selectedRole === 'coach'
                          ? 'bg-[#FFE600] text-black'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      TACTICS & XI
                    </span>
                  </button>

                  {/* Role 3: PLAYER */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('player');
                      setErrorMsg(null);
                    }}
                    className={`p-3 border-3 border-black text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      selectedRole === 'player'
                        ? 'bg-[#22C55E] text-black shadow-[4px_4px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_0px_#000]'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-wider">PLAYER</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1 py-0.2 border border-black ${
                        selectedRole === 'player'
                          ? 'bg-black text-white'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      VIEW ONLY TACTICS
                    </span>
                  </button>
                </div>
              </div>

              {/* Active Role Details Box */}
              <div className="bg-[#F6F7FA] border-2 border-black p-3.5 space-y-3">
                {selectedRole === 'admin' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-black/20 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#D71920] text-white border-2 border-black flex items-center justify-center font-black text-xs">
                          #100
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase text-black">
                            Abdur Rakib (Club President)
                          </h4>
                          <p className="text-[10px] font-bold text-neutral-600 uppercase">
                            Executive Club Director
                          </p>
                        </div>
                      </div>
                      <span className="bg-[#D71920] text-white text-[9px] font-black px-1.5 py-0.5 border border-black uppercase">
                        SUPER ADMIN
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-neutral-700 space-y-1 uppercase">
                      <p>✓ Complete tactical & formation privileges</p>
                      <p>✓ Crest studio, database resets, and live telemetry clearance</p>
                      <p>
                        ✓ Default PIN:{' '}
                        <strong className="text-black font-black">2002</strong>
                      </p>
                    </div>
                  </div>
                )}

                {selectedRole === 'coach' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-black/20 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#0066B2] text-white border-2 border-black flex items-center justify-center font-black text-xs">
                          📋
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase text-black">
                            Head Coach & Tactics Master
                          </h4>
                          <p className="text-[10px] font-bold text-neutral-600 uppercase">
                            Management & Tactics Department
                          </p>
                        </div>
                      </div>
                      <span className="bg-[#0066B2] text-white text-[9px] font-black px-1.5 py-0.5 border border-black uppercase">
                        TACTICS MASTER
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-neutral-700 space-y-1 uppercase">
                      <p>✓ Drag player positions freely anywhere on pitch</p>
                      <p>✓ Change match formations (4-3-3, 3-5-2, 8-a-side) & Starting XI</p>
                      <p>✓ Edit coaching directives, playing style & set-piece duties</p>
                      <p>
                        ✓ Default PIN:{' '}
                        <strong className="text-black font-black">1920</strong>
                      </p>
                    </div>
                  </div>
                )}

                {selectedRole === 'player' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-black/20 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#22C55E] text-black border-2 border-black flex items-center justify-center font-black text-xs">
                          ⚽
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase text-black">
                            Squad Player Persona
                          </h4>
                          <p className="text-[10px] font-bold text-neutral-600 uppercase">
                            First Team Roster
                          </p>
                        </div>
                      </div>
                      <span className="bg-[#FFE600] text-black text-[9px] font-black px-1.5 py-0.5 border border-black uppercase">
                        VIEW ONLY TACTICS
                      </span>
                    </div>

                    {/* Squad Player Picker */}
                    <div>
                      <label
                        htmlFor="modal-player-select"
                        className="block text-[11px] font-black uppercase text-black mb-1"
                      >
                        CHOOSE YOUR SQUAD PLAYER:
                      </label>
                      <select
                        id="modal-player-select"
                        value={selectedPlayerId}
                        onChange={e => setSelectedPlayerId(e.target.value)}
                        className="w-full bg-white border-2 border-black px-2.5 py-1.5 text-xs font-black uppercase focus:outline-none shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                      >
                        {players.map(p => (
                          <option key={p.id} value={p.id}>
                            #{p.number} {p.name} ({p.position} • {p.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-[#FFE600]/30 border border-black p-2 text-[10px] font-bold text-black uppercase space-y-0.5">
                      <div className="flex items-center gap-1 font-black text-[#D71920]">
                        <Eye className="w-3.5 h-3.5" />
                        <span>STRICT TACTICAL RULE ENFORCED:</span>
                      </div>
                      <p>
                        Players can ONLY VIEW tactics, formations, and starting XI. Players cannot change
                        or add tactics.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Form with optional PIN input */}
              <form onSubmit={handleRoleLogin} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black uppercase text-neutral-700 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-black" />
                      <span>ACCESS PIN (OPTIONAL OR PRE-FILLED)</span>
                    </label>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">
                      {selectedRole === 'admin'
                        ? 'PIN: 2002'
                        : selectedRole === 'coach'
                        ? 'PIN: 1920'
                        : 'PIN: 1234'}
                    </span>
                  </div>
                  <input
                    type="password"
                    placeholder={
                      selectedRole === 'admin'
                        ? 'Enter 2002 or click Log In'
                        : selectedRole === 'coach'
                        ? 'Enter 1920 or click Log In'
                        : 'Enter 1234 or click Log In'
                    }
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    maxLength={6}
                    className="w-full bg-white border-2 border-black p-2 text-sm font-black tracking-widest text-center focus:outline-none shadow-[2px_2px_0px_0px_#000]"
                  />
                </div>

                {/* Primary Login Button */}
                <button
                  type="submit"
                  className={`w-full py-3 border-3 border-black text-xs sm:text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'bg-[#D71920] text-white hover:bg-red-700'
                      : selectedRole === 'coach'
                      ? 'bg-[#0066B2] text-white hover:bg-blue-700'
                      : 'bg-[#22C55E] text-black hover:bg-green-400'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>LOG IN AS {selectedRole.toUpperCase()} ↵</span>
                </button>
              </form>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-[#D71920] text-white p-2 border-2 border-black text-xs font-black flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="bg-[#22C55E] text-black p-2 border-2 border-black text-xs font-black flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick 1-Tap Switch Footer Buttons */}
          <div className="pt-2 border-t-2 border-black space-y-1.5">
            <span className="text-[10px] font-black uppercase text-neutral-500 block">
              1-TAP DIRECT SWITCH (FAST TESTING & DEMO):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="bg-white hover:bg-[#D71920] hover:text-white text-black border-2 border-black py-1.5 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-colors cursor-pointer"
              >
                🛡️ ADMIN
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('coach')}
                className="bg-white hover:bg-[#0066B2] hover:text-white text-black border-2 border-black py-1.5 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-colors cursor-pointer"
              >
                📋 COACH
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('player')}
                className="bg-white hover:bg-[#22C55E] hover:text-black text-black border-2 border-black py-1.5 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-colors cursor-pointer"
              >
                ⚽ PLAYER
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  onClose();
                }}
                className="w-full bg-[#FFF1F2] hover:bg-[#D71920] hover:text-white text-[#D71920] border-2 border-black py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🚪 LOG OUT (লগআউট করুন)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
