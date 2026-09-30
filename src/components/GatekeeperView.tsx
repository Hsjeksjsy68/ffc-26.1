import React, { useState } from 'react';
import { useClub, UserProfile } from '../context/ClubContext';
import { FlamehunterLogo } from './FlamehunterLogo';
import { Position } from '../types';
import {
  Lock,
  LogIn,
  UserPlus,
  Shield,
  Key,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck
} from 'lucide-react';

export const GatekeeperView: React.FC = () => {
  const {
    loginUser,
    loginWithGoogle,
    loginWithEmail,
    submitAccountRequest,
    requestAccountWithGoogle,
    accountRequests,
    availableUsers,
    players
  } = useClub();

  const [activeTab, setActiveTab] = useState<'login' | 'request'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Request form state
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPassword, setReqPassword] = useState('');
  const [reqRole, setReqRole] = useState<'player' | 'coach' | 'admin'>('player');
  const [reqPosition, setReqPosition] = useState<Position>('FWD');
  const [reqNumber, setReqNumber] = useState<number>(10);
  const [reqNotes, setReqNotes] = useState('');
  const [requestSuccessMsg, setRequestSuccessMsg] = useState<string | null>(null);
  const [requestErrorMsg, setRequestErrorMsg] = useState<string | null>(null);

  // Handle Direct Google Sign In (for approved members / admin)
  const handleGoogleDirectLogin = async () => {
    setLoginError(null);
    setIsProcessing(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.message && err.message.startsWith('PENDING_APPROVAL:')) {
        setLoginError(err.message.replace('PENDING_APPROVAL:', ''));
      } else if (err.message && err.message.startsWith('ACCOUNT_REJECTED:')) {
        setLoginError(err.message.replace('ACCOUNT_REJECTED:', ''));
      } else if (err.message && err.message.startsWith('GOOGLE_USER_NOT_REGISTERED:')) {
        setLoginError(err.message.replace('GOOGLE_USER_NOT_REGISTERED:', ''));
      } else {
        setLoginError(err.message || 'গুগল লগইন ব্যর্থ হয়েছে।');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Google Request Access (allows requesting an account via Google verification)
  const handleGoogleRequest = async () => {
    setRequestErrorMsg(null);
    setRequestSuccessMsg(null);
    setIsProcessing(true);
    try {
      const res = await requestAccountWithGoogle(reqRole, reqPosition, Number(reqNumber));
      if (res.success) {
        setRequestSuccessMsg(res.message);
      } else {
        setRequestErrorMsg(res.message);
      }
    } catch (err: any) {
      setRequestErrorMsg(err?.message || 'গুগল দিয়ে রিকোয়েস্ট করতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setLoginError('দয়া করে ইমেইল বা ইউজারনেম প্রদান করুন।');
      return;
    }
    setLoginError(null);
    setIsProcessing(true);

    try {
      const norm = loginEmail.trim().toLowerCase();

      // Check if account request is pending
      const pendingReq = accountRequests.find(r => r.email.toLowerCase() === norm && r.status === 'pending');
      if (pendingReq) {
        setLoginError('⏳ আপনার একাউন্টটি বর্তমানে পেন্ডিং আছে (Pending Approval)। ক্লাবের অ্যাডমিন অনুমোদন (Accept) করার পর আপনি লগইন করতে পারবেন।');
        setIsProcessing(false);
        return;
      }

      // Check if account request is rejected
      const rejectedReq = accountRequests.find(r => r.email.toLowerCase() === norm && r.status === 'rejected');
      if (rejectedReq) {
        setLoginError('❌ এই একাউন্ট রিকোয়েস্টটি অ্যাডমিন দ্বারা প্রত্যাখ্যাত (Rejected) হয়েছে। প্রয়োজনে ক্লাবের ম্যানেজমেন্টের সাথে যোগাযোগ করুন।');
        setIsProcessing(false);
        return;
      }

      await loginWithEmail(loginEmail.trim(), loginPassword.trim());
    } catch (err: any) {
      if (err.message && err.message.startsWith('PENDING_APPROVAL:')) {
        setLoginError(err.message.replace('PENDING_APPROVAL:', ''));
      } else if (err.message && err.message.startsWith('ACCOUNT_REJECTED:')) {
        setLoginError(err.message.replace('ACCOUNT_REJECTED:', ''));
      } else {
        setLoginError(err.message || 'লগইন ব্যর্থ হয়েছে। সঠিক ইমেইল বা পাসওয়ার্ড দিয়ে চেষ্টা করুন।');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Account Creation Request Submit
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim() || !reqEmail.trim()) {
      setRequestErrorMsg('দয়া করে নাম এবং ইমেইল পূরণ করুন।');
      return;
    }
    setRequestErrorMsg(null);
    setRequestSuccessMsg(null);
    setIsProcessing(true);

    try {
      const res = await submitAccountRequest({
        name: reqName.trim(),
        email: reqEmail.trim(),
        password: reqPassword.trim(),
        requestedRole: reqRole,
        requestedPosition: reqRole === 'player' ? reqPosition : undefined,
        requestedNumber: reqRole === 'player' ? Number(reqNumber) : undefined,
        notes: reqNotes.trim()
      });

      if (res.success) {
        setRequestSuccessMsg(res.message);
        setReqName('');
        setReqEmail('');
        setReqPassword('');
        setReqNotes('');
      } else {
        setRequestErrorMsg(res.message);
      }
    } catch (err: any) {
      setRequestErrorMsg(err.message || 'রিকোয়েস্ট সাবমিট করতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F5EE] flex flex-col justify-center items-center p-3 sm:p-6 selection:bg-[#FFE600] selection:text-black">
      {/* Container Box */}
      <div className="w-full max-w-lg bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden">
        {/* Top Restricted Security Banner */}
        <div className="bg-[#D71920] text-white border-b-3 border-black p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#FFE600]" />
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase">
              RESTRICTED SQUAD PORTAL • লগইন আবশ্যক
            </span>
          </div>
          <span className="bg-black text-[#FFE600] text-[9px] font-black px-2 py-0.5 border border-black uppercase">
            SECURE ACCESS
          </span>
        </div>

        {/* Club Crest & Title Header */}
        <div className="p-5 sm:p-6 bg-[#F6F7FA] border-b-3 border-black text-center space-y-2">
          <div className="flex justify-center">
            <FlamehunterLogo size="lg" withShadow />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black flex items-center justify-center gap-2">
              <span>FLAMEHUNTER</span>
              <span className="text-[#D71920]">FC</span>
            </h1>
            <p className="text-xs font-bold text-neutral-600 uppercase mt-0.5">
              OFFICIAL SQUAD MANAGEMENT & TACTICS HUB
            </p>
          </div>
          <p className="text-xs font-bold text-neutral-800 bg-[#FFFEEA] border border-black p-2 mt-2">
            🔒 ক্লাবের ডাটাবেস, স্কোয়াড রোস্টার এবং চ্যাট এক্সেস করতে লগইন করুন। কোনো সক্রিয় একাউন্ট না থাকলে নিচে রিকোয়েস্ট পাঠান।
          </p>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="grid grid-cols-2 border-b-3 border-black bg-neutral-100">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`py-3 text-xs sm:text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-black border-b-4 border-[#D71920] shadow-inner'
                : 'text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <LogIn className="w-4 h-4 text-[#D71920]" />
            <span>১. লগইন করুন (SIGN IN)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('request');
              setRequestErrorMsg(null);
              setRequestSuccessMsg(null);
            }}
            className={`py-3 text-xs sm:text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'request'
                ? 'bg-white text-black border-b-4 border-[#0084FF] shadow-inner'
                : 'text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <UserPlus className="w-4 h-4 text-[#0084FF]" />
            <span>২. একাউন্ট রিকোয়েস্ট (REQUEST)</span>
          </button>
        </div>

        {/* TAB 1: LOGIN FORM */}
        {activeTab === 'login' && (
          <div className="p-5 sm:p-6 space-y-4">
            {loginError && (
              <div className="bg-[#FFF1F2] border-2 border-[#D71920] p-3 text-xs font-bold text-[#D71920] flex items-start gap-2 shadow-[2px_2px_0px_0px_#000]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-snug">{loginError}</p>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  ইমেইল / ইউজারনেম (EMAIL / USERNAME)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    required
                    placeholder="example@gmail.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full bg-[#F6F5EE] border-2 border-black pl-9 pr-3 py-2 text-xs sm:text-sm font-bold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  পাসওয়ার্ড / পিন (PASSWORD / PIN)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-[#F6F5EE] border-2 border-black pl-9 pr-10 py-2 text-xs sm:text-sm font-bold focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#D71920] hover:bg-red-700 text-white border-3 border-black py-2.5 px-4 text-xs sm:text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{isProcessing ? 'লগইন হচ্ছে...' : 'লগইন করুন (ENTER HUB)'}</span>
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('request');
                  setRequestErrorMsg(null);
                  setRequestSuccessMsg(null);
                }}
                className="text-xs font-black uppercase text-[#0084FF] hover:underline cursor-pointer"
              >
                একাউন্ট নেই? নতুন একাউন্ট রিকোয়েস্ট পাঠান ↵
              </button>
            </div>

            <div className="relative my-3 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/20" />
              </div>
              <span className="relative bg-white px-2 text-[10px] font-black uppercase text-neutral-400">
                অথবা গুগল দিয়ে
              </span>
            </div>

            {/* Direct Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleDirectLogin}
              disabled={isProcessing}
              className="w-full bg-white hover:bg-neutral-50 text-black border-2 border-black py-2.5 px-4 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>GOOGLE দিয়ে সাইন ইন (SIGN IN)</span>
            </button>
          </div>
        )}

        {/* TAB 2: REQUEST ACCESS FORM (Approval Workflow) */}
        {activeTab === 'request' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="bg-[#EBF5FF] border-2 border-[#0084FF] p-3 text-xs font-bold text-neutral-800 space-y-1 shadow-[2px_2px_0px_0px_#000]">
              <div className="flex items-center gap-1.5 text-[#0084FF] font-black uppercase">
                <Clock className="w-4 h-4" />
                <span>অ্যাডমিন অনুমোদন আবশ্যক (ADMIN APPROVAL REQUIRED)</span>
              </div>
              <p className="text-[11px] text-neutral-700 leading-normal">
                রিকোয়েস্ট সাবমিট করার পর ক্লাবের অ্যাডমিন রিভিউ করে <strong>অনুমোদন (Accept)</strong> দিলে আপনার একাউন্ট সক্রিয় হবে।
              </p>
            </div>

            {/* Quick Google Request Access Banner */}
            <div className="bg-[#FFFEEA] border-2 border-black p-3.5 shadow-[3px_3px_0px_0px_#000] space-y-2">
              <span className="text-[11px] font-black uppercase text-black block">
                ⚡ দ্রুত ভেরিফাইড রিকোয়েস্ট পাঠান:
              </span>
              <button
                type="button"
                onClick={handleGoogleRequest}
                disabled={isProcessing}
                className="w-full bg-white hover:bg-neutral-100 text-black border-2 border-black py-2.5 px-3 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>GOOGLE দিয়ে একাউন্ট রিকোয়েস্ট পাঠান (REQUEST ACCESS)</span>
              </button>
              <p className="text-[10px] text-neutral-600 font-bold leading-tight">
                * গুগল দিয়ে রিকোয়েস্ট পাঠালে আপনার ভেরিফাইড নাম, ছবি ও ইমেইল সরাসরি ক্লাবের অ্যাডমিনের কাছে চলে যাবে।
              </p>
            </div>

            <div className="relative my-2 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/20" />
              </div>
              <span className="relative bg-white px-2 text-[10px] font-black uppercase text-neutral-400">
                অথবা ম্যানুয়ালি ফর্ম পূরণ করুন
              </span>
            </div>

            {requestSuccessMsg && (
              <div className="bg-[#F0FDF4] border-2 border-[#22C55E] p-3.5 text-xs font-bold text-green-900 flex items-start gap-2 shadow-[2px_2px_0px_0px_#000]">
                <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0" />
                <p className="leading-snug">{requestSuccessMsg}</p>
              </div>
            )}

            {requestErrorMsg && (
              <div className="bg-[#FFF1F2] border-2 border-[#D71920] p-3 text-xs font-bold text-[#D71920] flex items-start gap-2 shadow-[2px_2px_0px_0px_#000]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-snug">{requestErrorMsg}</p>
              </div>
            )}

            <form onSubmit={handleRequestSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  আপনার পূর্ণ নাম (FULL NAME) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={reqName}
                  onChange={e => setReqName(e.target.value)}
                  className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  ইমেইল এড্রেস (EMAIL ADDRESS) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="tanvir@example.com"
                  value={reqEmail}
                  onChange={e => setReqEmail(e.target.value)}
                  className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  পছন্দের পাসওয়ার্ড (PASSWORD) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="নূন্যতম ৬ অক্ষর"
                  value={reqPassword}
                  onChange={e => setReqPassword(e.target.value)}
                  className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-bold focus:bg-white focus:outline-none"
                />
              </div>

              {/* Role Requested */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReqRole('player')}
                  className={`p-2 border-2 border-black text-center text-xs font-black uppercase transition-colors cursor-pointer ${
                    reqRole === 'player' ? 'bg-[#22C55E] text-black shadow-[2px_2px_0px_0px_#000]' : 'bg-[#F6F5EE] text-black'
                  }`}
                >
                  ⚽ প্লেয়ার
                </button>
                <button
                  type="button"
                  onClick={() => setReqRole('coach')}
                  className={`p-2 border-2 border-black text-center text-xs font-black uppercase transition-colors cursor-pointer ${
                    reqRole === 'coach' ? 'bg-[#0084FF] text-white shadow-[2px_2px_0px_0px_#000]' : 'bg-[#F6F5EE] text-black'
                  }`}
                >
                  📋 কোচ
                </button>
                <button
                  type="button"
                  onClick={() => setReqRole('admin')}
                  className={`p-2 border-2 border-black text-center text-xs font-black uppercase transition-colors cursor-pointer ${
                    reqRole === 'admin' ? 'bg-[#D71920] text-white shadow-[2px_2px_0px_0px_#000]' : 'bg-[#F6F5EE] text-black'
                  }`}
                >
                  🛡️ অফিসিয়াল
                </button>
              </div>

              {/* If Player: Position & Jersey Number */}
              {reqRole === 'player' && (
                <div className="grid grid-cols-2 gap-2 bg-[#FFFEEA] p-2 border-2 border-black">
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">পজিশন (POSITION)</label>
                    <select
                      value={reqPosition}
                      onChange={e => setReqPosition(e.target.value as Position)}
                      className="w-full bg-white border border-black p-1 text-xs font-bold"
                    >
                      <option value="GK">GK (গোলকিপার)</option>
                      <option value="DEF">DEF (ডিফেন্ডার)</option>
                      <option value="MID">MID (মিডফিল্ডার)</option>
                      <option value="FWD">FWD (ফরোয়ার্ড)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">জার্সি নম্বর (#NUMBER)</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={reqNumber}
                      onChange={e => setReqNumber(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-black p-1 text-xs font-bold text-center"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  অ্যাডমিনের জন্য বার্তা / নোট (OPTIONAL NOTE)
                </label>
                <input
                  type="text"
                  placeholder="e.g. আমি ডিফেন্সে খেলি, ট্রায়ালে ছিলাম"
                  value={reqNotes}
                  onChange={e => setReqNotes(e.target.value)}
                  className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#0084FF] hover:bg-blue-600 text-white border-3 border-black py-2.5 px-4 text-xs sm:text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isProcessing ? 'পাঠানো হচ্ছে...' : 'অ্যাডমিনের কাছে রিকোয়েস্ট পাঠান ↵'}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="mt-4 text-center text-xs font-bold text-neutral-500 uppercase">
        <span>FLAMEHUNTER FC CLUB PORTAL • SECURITY SYSTEM V3.0</span>
      </div>
    </div>
  );
};
