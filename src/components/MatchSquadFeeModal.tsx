import React, { useState } from 'react';
import { useClub } from '../context/ClubContext';
import { ClubEvent, Player } from '../types';
import { sendPhonePushAlert } from '../utils/phoneNotification';
import {
  Users,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Smartphone,
  Banknote,
  X,
  UserCheck,
  Shield,
  HelpCircle
} from 'lucide-react';

interface MatchSquadFeeModalProps {
  event: ClubEvent;
  onClose: () => void;
}

export const MatchSquadFeeModal: React.FC<MatchSquadFeeModalProps> = ({ event, onClose }) => {
  const {
    players,
    currentUser,
    setMatchSquadSelection,
    setMatchFee,
    recordFeePayment,
    technicalSettings
  } = useClub();

  const matchDetails = event.matchDetails;
  const initialSquad = matchDetails?.selectedSquad || [];
  const currentFee = matchDetails?.matchFee ?? 200;
  const nagadNumber = matchDetails?.nagadNumber || '01705573859';
  const feePayments = matchDetails?.feePayments || {};

  const [activeTab, setActiveTab] = useState<'squad' | 'fee' | 'pay'>('squad');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(initialSquad);
  const [feeAmountInput, setFeeAmountInput] = useState<number>(currentFee);

  // Player payment form state
  const [paymentMethod, setPaymentMethod] = useState<'nagad' | 'cash'>('nagad');
  const [trxIdInput, setTrxIdInput] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [hasCopiedNagad, setHasCopiedNagad] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Admin player fee edit
  const [adminTargetPlayerId, setAdminTargetPlayerId] = useState<string | null>(null);

  // Copy Nagad Number
  const handleCopyNagad = () => {
    navigator.clipboard.writeText(nagadNumber);
    setHasCopiedNagad(true);
    setTimeout(() => setHasCopiedNagad(false), 2500);
  };

  // Toggle player selection for squad
  const togglePlayerInSquad = (playerId: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  // Quick select Starting XI
  const handleSelectStartingXI = () => {
    const startingPlayerIds = Object.values(technicalSettings.startingXI).filter(Boolean);
    const combined = Array.from(new Set([...selectedPlayerIds, ...startingPlayerIds]));
    setSelectedPlayerIds(combined);
  };

  // Quick select all fit players
  const handleSelectAllFit = () => {
    const fitPlayerIds = players.filter(p => p.fitness === 'Fit').map(p => p.id);
    setSelectedPlayerIds(fitPlayerIds);
  };

  // Save Squad Selection
  const handleSaveSquad = () => {
    setMatchSquadSelection(event.id, selectedPlayerIds);
    setPaymentSuccessMsg(`Match squad updated! (${selectedPlayerIds.length} players selected)`);
    setTimeout(() => setPaymentSuccessMsg(''), 3000);
  };

  // Save Match Fee
  const handleSaveFee = (e: React.FormEvent) => {
    e.preventDefault();
    setMatchFee(event.id, feeAmountInput);
    setPaymentSuccessMsg(`Match fee set to ৳${feeAmountInput}`);
    setTimeout(() => setPaymentSuccessMsg(''), 3000);
  };

  // Logged-in player payment submission
  const handleSubmitPlayerPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.id) return;

    recordFeePayment(event.id, currentUser.id, {
      isPaid: true,
      method: paymentMethod,
      trxId: paymentMethod === 'nagad' ? trxIdInput || 'MANUAL-NAGAD' : undefined,
      note: paymentNote || (paymentMethod === 'nagad' ? 'Nagad payment' : 'Cash in hand to coach'),
      amount: currentFee
    });

    // Notify phone
    sendPhonePushAlert({
      title: 'Match Fee Confirmed ৳' + currentFee,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: paymentMethod === 'nagad'
        ? `Paid ৳${currentFee} via Nagad (TrxID: ${trxIdInput || 'Confirmed'}). Reference 01705573859.`
        : `Registered cash in hand (৳${currentFee}) to coach for match vs ${matchDetails?.opponent || 'Opponent'}.`,
      avatarBg: currentUser.avatarBg
    });

    setPaymentSuccessMsg(`Payment registered successfully via ${paymentMethod === 'nagad' ? 'Nagad' : 'Cash'}!`);
    setTrxIdInput('');
    setPaymentNote('');
    setTimeout(() => setPaymentSuccessMsg(''), 3000);
  };

  // Admin record payment for any player
  const handleAdminRecordPayment = (playerId: string, isPaid: boolean, method: 'nagad' | 'cash') => {
    recordFeePayment(event.id, playerId, {
      isPaid,
      method,
      amount: currentFee,
      trxId: method === 'nagad' ? 'ADMIN-VERIFIED' : undefined,
      note: isPaid ? `Marked paid by ${currentUser.name}` : undefined
    });
    setAdminTargetPlayerId(null);
  };

  // Find player's payment status
  const myPayment = currentUser.id ? feePayments[currentUser.id] : null;
  const isMyPlayerSelected = currentUser.id ? selectedPlayerIds.includes(currentUser.id) : false;

  // Selected player objects
  const selectedPlayersList = players.filter(p => selectedPlayerIds.includes(p.id));
  const totalPaidCount = selectedPlayersList.filter(p => feePayments[p.id]?.isPaid).length;
  const totalCollectedAmount = totalPaidCount * currentFee;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white border-4 border-black w-full max-w-2xl shadow-[8px_8px_0px_0px_#000] my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-black text-white p-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#FFE600] border-2 border-white flex items-center justify-center text-black font-black shadow-[2px_2px_0px_0px_#FFF]">
              ⚽
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-[#FFE600] tracking-wider block">
                MATCH SQUAD & FEES MANAGEMENT
              </span>
              <h3 className="font-black text-base sm:text-lg uppercase text-white leading-tight">
                {event.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="bg-white text-black hover:bg-[#D71920] hover:text-white border-2 border-white p-1.5 transition-colors font-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b-3 border-black bg-[#F6F5EE]">
          <button
            onClick={() => setActiveTab('squad')}
            className={`flex-1 py-2.5 px-3 text-xs font-black uppercase flex items-center justify-center gap-1.5 border-r-2 border-black transition-all ${
              activeTab === 'squad'
                ? 'bg-[#FFE600] text-black shadow-[inset_0_-3px_0_0_#000]'
                : 'hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>SELECTED SQUAD ({selectedPlayerIds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('fee')}
            className={`flex-1 py-2.5 px-3 text-xs font-black uppercase flex items-center justify-center gap-1.5 border-r-2 border-black transition-all ${
              activeTab === 'fee'
                ? 'bg-[#00E5FF] text-black shadow-[inset_0_-3px_0_0_#000]'
                : 'hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>FEE & PAYMENT STATUS (৳{currentFee})</span>
          </button>

          <button
            onClick={() => setActiveTab('pay')}
            className={`flex-1 py-2.5 px-3 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'pay'
                ? 'bg-[#22C55E] text-black shadow-[inset_0_-3px_0_0_#000]'
                : 'hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>PAY NAGAD / CASH</span>
          </button>
        </div>

        {/* Success Alert Banner */}
        {paymentSuccessMsg && (
          <div className="bg-[#22C55E] text-black border-b-2 border-black px-4 py-2 text-xs font-black flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{paymentSuccessMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[68vh] overflow-y-auto space-y-6">
          {/* TAB 1: SQUAD SELECTION */}
          {activeTab === 'squad' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F6F5EE] border-2 border-black p-3 shadow-[2px_2px_0px_0px_#000]">
                <div>
                  <h4 className="font-black text-sm uppercase text-black">
                    SELECT PLAYERS FOR THIS MATCH
                  </h4>
                  <p className="text-[11px] font-bold text-neutral-600">
                    Currently selected: <strong className="text-black">{selectedPlayerIds.length} players</strong>
                  </p>
                </div>

                {currentUser.isAdmin && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSelectStartingXI}
                      className="bg-black text-[#FFE600] border-2 border-black px-2 py-1 text-[10px] font-black uppercase hover:bg-neutral-800"
                    >
                      + ADD STARTING XI
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllFit}
                      className="bg-white text-black border-2 border-black px-2 py-1 text-[10px] font-black uppercase hover:bg-neutral-100"
                    >
                      SELECT ALL FIT
                    </button>
                  </div>
                )}
              </div>

              {/* Player Checkbox Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                {players.map(player => {
                  const isSelected = selectedPlayerIds.includes(player.id);
                  const isPaid = feePayments[player.id]?.isPaid;
                  const paymentInfo = feePayments[player.id];

                  return (
                    <div
                      key={player.id}
                      onClick={() => {
                        if (currentUser.isAdmin) {
                          togglePlayerInSquad(player.id);
                        }
                      }}
                      className={`border-2 border-black p-2.5 flex items-center justify-between gap-2 transition-all ${
                        currentUser.isAdmin ? 'cursor-pointer hover:bg-neutral-50' : ''
                      } ${
                        isSelected
                          ? 'bg-[#FFFEEA] shadow-[2px_2px_0px_0px_#000]'
                          : 'bg-white opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-8 h-8 border border-black flex items-center justify-center font-black text-xs shrink-0"
                          style={{ backgroundColor: player.avatarBg }}
                        >
                          #{player.number}
                        </div>
                        <div className="truncate">
                          <span className="font-black text-xs text-black block truncate">
                            {player.name}
                          </span>
                          <span className="text-[10px] font-bold text-neutral-500 uppercase">
                            {player.position} • {player.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected && (
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 border border-black uppercase ${
                              isPaid ? 'bg-[#22C55E] text-black' : 'bg-[#FF4500] text-white'
                            }`}
                          >
                            {isPaid ? `PAID (${paymentInfo?.method.toUpperCase()})` : 'UNPAID'}
                          </span>
                        )}

                        {currentUser.isAdmin ? (
                          <div
                            className={`w-5 h-5 border-2 border-black flex items-center justify-center text-xs font-black ${
                              isSelected ? 'bg-black text-white' : 'bg-white text-transparent'
                            }`}
                          >
                            ✓
                          </div>
                        ) : isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {currentUser.isAdmin && (
                <button
                  type="button"
                  onClick={handleSaveSquad}
                  className="w-full bg-[#FFE600] hover:bg-yellow-300 text-black border-3 border-black py-2.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
                >
                  SAVE MATCH SQUAD SELECTION ({selectedPlayerIds.length} PLAYERS)
                </button>
              )}
            </div>
          )}

          {/* TAB 2: MATCH FEE & ROSTER STATUS */}
          {activeTab === 'fee' && (
            <div className="space-y-4">
              {/* Fee Admin Control Box */}
              <div className="bg-[#FFFEEA] border-3 border-black p-3.5 shadow-[3px_3px_0px_0px_#000] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-600 block">
                    CURRENT MATCH PARTICIPATION FEE
                  </span>
                  <div className="text-2xl font-black text-black">
                    ৳{currentFee} <span className="text-xs text-neutral-600 font-bold">PER PLAYER</span>
                  </div>
                </div>

                {currentUser.isAdmin && (
                  <form onSubmit={handleSaveFee} className="flex items-center gap-2">
                    <span className="text-xs font-black">৳</span>
                    <input
                      type="number"
                      value={feeAmountInput}
                      onChange={(e) => setFeeAmountInput(Number(e.target.value))}
                      className="w-24 bg-white border-2 border-black px-2 py-1 text-sm font-black text-black text-center focus:outline-none"
                      min={0}
                      step={50}
                    />
                    <button
                      type="submit"
                      className="bg-black text-[#FFE600] border-2 border-black px-3 py-1 text-xs font-black uppercase hover:bg-neutral-800 shadow-[1px_1px_0px_0px_#000]"
                    >
                      UPDATE FEE
                    </button>
                  </form>
                )}
              </div>

              {/* Fee Collection Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-white border-2 border-black p-2 text-center shadow-[2px_2px_0px_0px_#000]">
                  <span className="text-[9px] font-black uppercase text-neutral-500 block">
                    SELECTED PLAYERS
                  </span>
                  <span className="text-lg font-black text-black">{selectedPlayersList.length}</span>
                </div>
                <div className="bg-white border-2 border-black p-2 text-center shadow-[2px_2px_0px_0px_#000]">
                  <span className="text-[9px] font-black uppercase text-neutral-500 block">
                    PAID PLAYERS
                  </span>
                  <span className="text-lg font-black text-[#16A34A]">{totalPaidCount} / {selectedPlayersList.length}</span>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-white border-2 border-black p-2 text-center shadow-[2px_2px_0px_0px_#000]">
                  <span className="text-[9px] font-black uppercase text-neutral-500 block">
                    COLLECTED TOTAL
                  </span>
                  <span className="text-lg font-black text-[#0066B2]">৳{totalCollectedAmount}</span>
                </div>
              </div>

              {/* Roster Payment Breakdown Table */}
              <div className="space-y-2">
                <h5 className="font-black text-xs uppercase text-black">
                  SQUAD PAYMENT STATUS LIST:
                </h5>

                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {selectedPlayersList.length === 0 ? (
                    <p className="text-xs font-bold text-neutral-500 py-3 text-center border-2 border-dashed border-neutral-300">
                      No players selected for this match yet. Switch to the "SELECTED SQUAD" tab to pick players.
                    </p>
                  ) : (
                    selectedPlayersList.map(player => {
                      const payment = feePayments[player.id];
                      const isPaid = payment?.isPaid;

                      return (
                        <div
                          key={player.id}
                          className="bg-white border-2 border-black p-2 flex items-center justify-between gap-2 shadow-[1px_1px_0px_0px_#000]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-7 h-7 border border-black flex items-center justify-center font-black text-[11px] shrink-0"
                              style={{ backgroundColor: player.avatarBg }}
                            >
                              #{player.number}
                            </div>
                            <div className="truncate">
                              <span className="font-black text-xs text-black block truncate">
                                {player.name}
                              </span>
                              {payment?.paidAt && (
                                <span className="text-[9px] font-bold text-neutral-500 block">
                                  {payment.method === 'nagad' ? `Nagad (Trx: ${payment.trxId || 'Verified'})` : 'Cash in Hand'} • {payment.paidAt}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 border border-black uppercase ${
                                isPaid ? 'bg-[#22C55E] text-black' : 'bg-[#FF4500] text-white'
                              }`}
                            >
                              {isPaid ? `PAID (${payment?.method.toUpperCase()})` : 'UNPAID'}
                            </span>

                            {currentUser.isAdmin && (
                              <div className="flex items-center gap-1">
                                {!isPaid ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleAdminRecordPayment(player.id, true, 'nagad')}
                                      className="bg-[#D71920] text-white border border-black px-1.5 py-0.5 text-[9px] font-black uppercase hover:bg-red-700"
                                      title="Mark paid via Nagad"
                                    >
                                      NAGAD
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAdminRecordPayment(player.id, true, 'cash')}
                                      className="bg-[#22C55E] text-black border border-black px-1.5 py-0.5 text-[9px] font-black uppercase hover:bg-green-600"
                                      title="Mark paid in cash"
                                    >
                                      CASH
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAdminRecordPayment(player.id, false, 'cash')}
                                    className="bg-neutral-200 text-neutral-800 border border-black px-1.5 py-0.5 text-[9px] font-black uppercase hover:bg-neutral-300"
                                    title="Revoke / mark unpaid"
                                  >
                                    RESET
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAY MATCH FEE (NAGAD OR CASH) */}
          {activeTab === 'pay' && (
            <div className="space-y-4">
              {/* Prominent Nagad Number Box with One-click Copy */}
              <div className="bg-[#FFE600] border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-black flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#D71920]" />
                    <span>OFFICIAL CLUB NAGAD NUMBER</span>
                  </span>
                  <span className="text-[10px] font-black bg-[#D71920] text-white px-2 py-0.5 uppercase border border-black">
                    PERSONAL
                  </span>
                </div>

                <div className="bg-white border-2 border-black p-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-500 block uppercase">
                      SEND MONEY / CASH IN TO:
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-black tracking-wider">
                      {nagadNumber}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyNagad}
                    className={`border-2 border-black px-3 py-1.5 text-xs font-black uppercase transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000] ${
                      hasCopiedNagad
                        ? 'bg-[#22C55E] text-black'
                        : 'bg-[#FFE600] text-black hover:bg-yellow-400'
                    }`}
                  >
                    {hasCopiedNagad ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>COPY NUMBER</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] font-bold text-black/80">
                  📌 Instructions: Send <strong>৳{currentFee}</strong> to <strong>{nagadNumber}</strong>. Put your jersey number in the reference. Then enter your Transaction ID below.
                </p>
              </div>

              {/* Current User Payment Form */}
              <form onSubmit={handleSubmitPlayerPayment} className="bg-white border-3 border-black p-4 shadow-[3px_3px_0px_0px_#000] space-y-3">
                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                  <span className="font-black text-xs uppercase text-black">
                    PAYING FOR: <strong>{currentUser.name}</strong> ({currentUser.role})
                  </span>
                  <span className="text-sm font-black text-black">
                    AMOUNT: ৳{currentFee}
                  </span>
                </div>

                {/* Choose Payment Method */}
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-600 block mb-1">
                    CHOOSE HOW YOU WANT TO PAY:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('nagad')}
                      className={`p-2.5 border-2 border-black text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'nagad'
                          ? 'bg-[#D71920] text-white shadow-[2px_2px_0px_0px_#000]'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>1. NAGAD (01705573859)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-2.5 border-2 border-black text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'cash'
                          ? 'bg-[#22C55E] text-black shadow-[2px_2px_0px_0px_#000]'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>2. CASH IN HAND</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Fields based on method */}
                {paymentMethod === 'nagad' ? (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[10px] font-black uppercase text-neutral-600 block">
                        NAGAD TRANSACTION ID (TRXID):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9M82KL9X (from Nagad SMS)"
                        value={trxIdInput}
                        onChange={(e) => setTrxIdInput(e.target.value.toUpperCase())}
                        className="w-full bg-[#F6F5EE] border-2 border-black px-3 py-2 text-xs font-black uppercase focus:outline-none focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-neutral-600 block">
                        SENDER PHONE NUMBER / NOTE (OPTIONAL):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Paid from 017XXXXXXXX"
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        className="w-full bg-[#F6F5EE] border-2 border-black px-3 py-1.5 text-xs font-bold focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#FFFEEA] border-2 border-black p-3 space-y-1">
                    <span className="font-black text-xs text-black block uppercase">
                      💵 CASH IN HAND DIRECT PAYMENT
                    </span>
                    <p className="text-[11px] font-bold text-neutral-700">
                      You are confirming that you will hand over <strong>৳{currentFee} in cash</strong> directly to the Head Coach or Team Manager at meetup before kickoff.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full py-3 border-3 border-black text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                    paymentMethod === 'nagad'
                      ? 'bg-[#D71920] hover:bg-red-700 text-white'
                      : 'bg-[#22C55E] hover:bg-green-500 text-black'
                  }`}
                >
                  {paymentMethod === 'nagad'
                    ? `CONFIRM NAGAD PAYMENT (৳${currentFee})`
                    : `CONFIRM CASH IN HAND (৳${currentFee})`}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F6F5EE] border-t-3 border-black p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-600">
            <Shield className="w-4 h-4 text-black" />
            <span>Nagad Official: <strong>{nagadNumber}</strong></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-black text-white hover:bg-neutral-800 border-2 border-black px-4 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
