import React, { useState, useRef } from 'react';
import { useClub } from '../context/ClubContext';
import { FormationType, PitchFormat } from '../types';
import { FlamehunterLogo } from './FlamehunterLogo';
import { ClubLogoManager } from './ClubLogoManager';
import {
  Shield,
  Award,
  DollarSign,
  AlertTriangle,
  Settings,
  ClipboardList,
  Check,
  RotateCcw,
  Sliders,
  Flame,
  X,
  Move,
  Lock,
  Eye,
  Plus,
  Minus,
  Undo2
} from 'lucide-react';

export const AdminTechnicalView: React.FC = () => {
  const {
    technicalSettings,
    updateTechnicalSettings,
    setStartingPlayer,
    players,
    fineRules,
    addFineRule,
    playerFines,
    issueFine,
    toggleFinePaid,
    currentUser,
    resetAllData,
    userType,
    isUserAdmin,
    isUserCoach,
    isUserPlayer,
    canEditTactics,
    canChangeLogo,
    canResetData
  } = useClub();

  const [activeAdminTab, setActiveAdminTab] = useState<'tactics' | 'fines' | 'logo' | 'settings'>('tactics');
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);

  // Drag & free player positioning state
  const [draggingSlot, setDraggingSlot] = useState<string | null>(null);
  const [dragCoords, setDragCoords] = useState<{ x: number; y: number } | null>(null);
  const pitchContainerRef = useRef<HTMLDivElement>(null);
  const dragStartPosRef = useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });
  const hasMovedRef = useRef<boolean>(false);

  // New Fine Form state
  const [selectedPlayerForFine, setSelectedPlayerForFine] = useState(players[0]?.id || '');
  const [selectedRuleForFine, setSelectedRuleForFine] = useState(fineRules[0]?.id || '');
  const [customFineAmount, setCustomFineAmount] = useState<number>(fineRules[0]?.amount || 15);
  const [fineNote, setFineNote] = useState('');
  const [fineSuccessMessage, setFineSuccessMessage] = useState(false);

  // Helper to dynamically build slots for custom player amount on pitch
  const getCustomSlots = (count: number) => {
    const safeCount = Math.max(1, Math.min(11, count));
    const slots: { key: string; name: string; x: number; y: number }[] = [
      { key: 'GK', name: 'GK', x: 50, y: 88 }
    ];
    const outfield = safeCount - 1;
    if (outfield <= 0) return slots;

    const defCount = Math.ceil(outfield * 0.4);
    const attCount = Math.max(1, Math.floor((outfield - defCount) * 0.4));
    const midCount = outfield - defCount - attCount;

    for (let i = 0; i < defCount; i++) {
      const step = 76 / (defCount + 1);
      const x = Math.round(12 + step * (i + 1));
      const name = defCount === 1 ? 'CB' : i === 0 ? 'LB' : i === defCount - 1 ? 'RB' : `CB${i}`;
      slots.push({ key: `DEF_${i + 1}`, name, x, y: 72 });
    }

    for (let i = 0; i < midCount; i++) {
      const step = 76 / (midCount + 1);
      const x = Math.round(12 + step * (i + 1));
      const name = midCount === 1 ? 'CM' : i === 0 ? 'LM' : i === midCount - 1 ? 'RM' : `CM${i}`;
      slots.push({ key: `MID_${i + 1}`, name, x, y: 46 });
    }

    for (let i = 0; i < attCount; i++) {
      const step = 76 / (attCount + 1);
      const x = Math.round(12 + step * (i + 1));
      const name = attCount === 1 ? 'ST' : attCount === 2 ? `ST${i + 1}` : i === 0 ? 'LW' : i === attCount - 1 ? 'RW' : 'ST';
      slots.push({ key: `FWD_${i + 1}`, name, x, y: 20 });
    }

    return slots;
  };

  // Pitch Formats and Formation Slot Definitions
  const formationLayouts: Record<
    FormationType,
    { label: string; format: PitchFormat; playerCount: number; slots: { key: string; name: string; x: number; y: number }[] }
  > = {
    // 11-a-side Formations (11 Players)
    '4-3-3': {
      label: '4-3-3 Attacking Wing Play',
      format: '11-a-side',
      playerCount: 11,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'LB', name: 'LB', x: 18, y: 70 },
        { key: 'CB1', name: 'CB', x: 38, y: 72 },
        { key: 'CB2', name: 'CB', x: 62, y: 72 },
        { key: 'RB', name: 'RB', x: 82, y: 70 },
        { key: 'DM', name: 'DM', x: 50, y: 52 },
        { key: 'CM1', name: 'CM', x: 32, y: 40 },
        { key: 'CM2', name: 'CM', x: 68, y: 40 },
        { key: 'LW', name: 'LW', x: 20, y: 20 },
        { key: 'ST', name: 'ST', x: 50, y: 15 },
        { key: 'RW', name: 'RW', x: 80, y: 20 }
      ]
    },
    '4-2-3-1': {
      label: '4-2-3-1 Modern Double Pivot',
      format: '11-a-side',
      playerCount: 11,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'LB', name: 'LB', x: 18, y: 70 },
        { key: 'CB1', name: 'CB', x: 38, y: 72 },
        { key: 'CB2', name: 'CB', x: 62, y: 72 },
        { key: 'RB', name: 'RB', x: 82, y: 70 },
        { key: 'DM1', name: 'DM', x: 36, y: 54 },
        { key: 'DM2', name: 'DM', x: 64, y: 54 },
        { key: 'CAM', name: 'CAM', x: 50, y: 36 },
        { key: 'LW', name: 'LW', x: 20, y: 25 },
        { key: 'RW', name: 'RW', x: 80, y: 25 },
        { key: 'ST', name: 'ST', x: 50, y: 15 }
      ]
    },
    '3-5-2': {
      label: '3-5-2 Wingbacks & Twin Strikers',
      format: '11-a-side',
      playerCount: 11,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'CB1', name: 'CB', x: 25, y: 72 },
        { key: 'CB2', name: 'CB', x: 50, y: 74 },
        { key: 'CB3', name: 'CB', x: 75, y: 72 },
        { key: 'LWB', name: 'LWB', x: 14, y: 46 },
        { key: 'CM1', name: 'CM', x: 36, y: 48 },
        { key: 'DM', name: 'DM', x: 50, y: 56 },
        { key: 'CM2', name: 'CM', x: 64, y: 48 },
        { key: 'RWB', name: 'RWB', x: 86, y: 46 },
        { key: 'ST1', name: 'ST', x: 36, y: 18 },
        { key: 'ST2', name: 'ST', x: 64, y: 18 }
      ]
    },
    '4-4-2': {
      label: '4-4-2 Classic Flat Structure',
      format: '11-a-side',
      playerCount: 11,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'LB', name: 'LB', x: 18, y: 70 },
        { key: 'CB1', name: 'CB', x: 38, y: 72 },
        { key: 'CB2', name: 'CB', x: 62, y: 72 },
        { key: 'RB', name: 'RB', x: 82, y: 70 },
        { key: 'LM', name: 'LM', x: 18, y: 44 },
        { key: 'CM1', name: 'CM', x: 38, y: 46 },
        { key: 'CM2', name: 'CM', x: 62, y: 46 },
        { key: 'RM', name: 'RM', x: 82, y: 44 },
        { key: 'ST1', name: 'ST', x: 36, y: 18 },
        { key: 'ST2', name: 'ST', x: 64, y: 18 }
      ]
    },
    '5-3-2': {
      label: '5-3-2 Fortified Counter',
      format: '11-a-side',
      playerCount: 11,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'LWB', name: 'LWB', x: 14, y: 64 },
        { key: 'CB1', name: 'CB', x: 32, y: 74 },
        { key: 'CB2', name: 'CB', x: 50, y: 76 },
        { key: 'CB3', name: 'CB', x: 68, y: 74 },
        { key: 'RWB', name: 'RWB', x: 86, y: 64 },
        { key: 'CM1', name: 'CM', x: 30, y: 44 },
        { key: 'DM', name: 'DM', x: 50, y: 52 },
        { key: 'CM2', name: 'CM', x: 70, y: 44 },
        { key: 'ST1', name: 'ST', x: 38, y: 18 },
        { key: 'ST2', name: 'ST', x: 62, y: 18 }
      ]
    },
    // 8-a-side Formations (8 Players)
    '3-3-1': {
      label: '8-a-side Classic Wing (3-3-1)',
      format: '8-a-side',
      playerCount: 8,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'LB', name: 'LB', x: 22, y: 70 },
        { key: 'CB', name: 'CB', x: 50, y: 74 },
        { key: 'RB', name: 'RB', x: 78, y: 70 },
        { key: 'LM', name: 'LM', x: 22, y: 44 },
        { key: 'CM', name: 'CM', x: 50, y: 46 },
        { key: 'RM', name: 'RM', x: 78, y: 44 },
        { key: 'ST', name: 'ST', x: 50, y: 18 }
      ]
    },
    '2-4-1': {
      label: '8-a-side Midfield Overload (2-4-1)',
      format: '8-a-side',
      playerCount: 8,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'CB1', name: 'CB', x: 34, y: 72 },
        { key: 'CB2', name: 'CB', x: 66, y: 72 },
        { key: 'LM', name: 'LM', x: 18, y: 46 },
        { key: 'DM', name: 'DM', x: 50, y: 56 },
        { key: 'AM', name: 'AM', x: 50, y: 36 },
        { key: 'RM', name: 'RM', x: 82, y: 46 },
        { key: 'ST', name: 'ST', x: 50, y: 16 }
      ]
    },
    '3-2-2': {
      label: '8-a-side Twin Strikers (3-2-2)',
      format: '8-a-side',
      playerCount: 8,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'LCB', name: 'CB', x: 24, y: 72 },
        { key: 'CB', name: 'CB', x: 50, y: 74 },
        { key: 'RCB', name: 'CB', x: 76, y: 72 },
        { key: 'CM1', name: 'CM', x: 36, y: 46 },
        { key: 'CM2', name: 'CM', x: 64, y: 46 },
        { key: 'ST1', name: 'ST', x: 36, y: 18 },
        { key: 'ST2', name: 'ST', x: 64, y: 18 }
      ]
    },
    '2-3-2': {
      label: '8-a-side High Press (2-3-2)',
      format: '8-a-side',
      playerCount: 8,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'CB1', name: 'CB', x: 35, y: 72 },
        { key: 'CB2', name: 'CB', x: 65, y: 72 },
        { key: 'LM', name: 'LM', x: 20, y: 46 },
        { key: 'CM', name: 'CM', x: 50, y: 48 },
        { key: 'RM', name: 'RM', x: 80, y: 46 },
        { key: 'ST1', name: 'ST', x: 36, y: 18 },
        { key: 'ST2', name: 'ST', x: 64, y: 18 }
      ]
    },
    // Custom Player Amount & Freeboard
    'custom': {
      label: `Custom Squad Layout (${technicalSettings.customPlayerCount || 8} Players)`,
      format: 'custom',
      playerCount: technicalSettings.customPlayerCount || 8,
      slots: getCustomSlots(technicalSettings.customPlayerCount || 8)
    },
    // 5-a-side Formations (5 Players)
    '1-2-1': {
      label: '5-a-side Diamond (1-2-1)',
      format: '5-a-side',
      playerCount: 5,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'CB', name: 'CB', x: 50, y: 68 },
        { key: 'LM', name: 'LM', x: 22, y: 44 },
        { key: 'RM', name: 'RM', x: 78, y: 44 },
        { key: 'ST', name: 'ST', x: 50, y: 20 }
      ]
    },
    '2-2': {
      label: '5-a-side Box (2-2)',
      format: '5-a-side',
      playerCount: 5,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'LB', name: 'LB', x: 30, y: 68 },
        { key: 'RB', name: 'RB', x: 70, y: 68 },
        { key: 'ST1', name: 'ST', x: 32, y: 24 },
        { key: 'ST2', name: 'ST', x: 68, y: 24 }
      ]
    },
    '1-1-2': {
      label: '5-a-side Attack (1-1-2)',
      format: '5-a-side',
      playerCount: 5,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'CB', name: 'CB', x: 50, y: 70 },
        { key: 'CM', name: 'CM', x: 50, y: 45 },
        { key: 'ST1', name: 'ST', x: 34, y: 20 },
        { key: 'ST2', name: 'ST', x: 66, y: 20 }
      ]
    },
    // 7-a-side Formations (7 Players)
    '2-3-1': {
      label: '7-a-side Modern (2-3-1)',
      format: '7-a-side',
      playerCount: 7,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'LB', name: 'LB', x: 25, y: 72 },
        { key: 'RB', name: 'RB', x: 75, y: 72 },
        { key: 'LM', name: 'LM', x: 20, y: 45 },
        { key: 'CM', name: 'CM', x: 50, y: 48 },
        { key: 'RM', name: 'RM', x: 80, y: 45 },
        { key: 'ST', name: 'ST', x: 50, y: 18 }
      ]
    },
    '3-2-1': {
      label: '7-a-side Solid (3-2-1)',
      format: '7-a-side',
      playerCount: 7,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'LCB', name: 'CB', x: 22, y: 72 },
        { key: 'CB', name: 'CB', x: 50, y: 74 },
        { key: 'RCB', name: 'CB', x: 78, y: 72 },
        { key: 'CM1', name: 'CM', x: 35, y: 45 },
        { key: 'CM2', name: 'CM', x: 65, y: 45 },
        { key: 'ST', name: 'ST', x: 50, y: 18 }
      ]
    },
    '2-2-2': {
      label: '7-a-side Balanced (2-2-2)',
      format: '7-a-side',
      playerCount: 7,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'LB', name: 'LB', x: 28, y: 70 },
        { key: 'RB', name: 'RB', x: 72, y: 70 },
        { key: 'CM1', name: 'CM', x: 35, y: 45 },
        { key: 'CM2', name: 'CM', x: 65, y: 45 },
        { key: 'ST1', name: 'ST', x: 35, y: 20 },
        { key: 'ST2', name: 'ST', x: 65, y: 20 }
      ]
    },
    // 9-a-side Formations (9 Players)
    '3-3-2': {
      label: '9-a-side Classic (3-3-2)',
      format: '9-a-side',
      playerCount: 9,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'LB', name: 'LB', x: 20, y: 72 },
        { key: 'CB', name: 'CB', x: 50, y: 74 },
        { key: 'RB', name: 'RB', x: 80, y: 72 },
        { key: 'LM', name: 'LM', x: 20, y: 46 },
        { key: 'CM', name: 'CM', x: 50, y: 48 },
        { key: 'RM', name: 'RM', x: 80, y: 46 },
        { key: 'ST1', name: 'ST', x: 36, y: 18 },
        { key: 'ST2', name: 'ST', x: 64, y: 18 }
      ]
    },
    '3-4-1': {
      label: '9-a-side Wide Midfield (3-4-1)',
      format: '9-a-side',
      playerCount: 9,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'LB', name: 'LB', x: 20, y: 72 },
        { key: 'CB', name: 'CB', x: 50, y: 74 },
        { key: 'RB', name: 'RB', x: 80, y: 72 },
        { key: 'LM', name: 'LM', x: 18, y: 45 },
        { key: 'CM1', name: 'CM', x: 38, y: 48 },
        { key: 'CM2', name: 'CM', x: 62, y: 48 },
        { key: 'RM', name: 'RM', x: 82, y: 45 },
        { key: 'ST', name: 'ST', x: 50, y: 18 }
      ]
    },
    '2-4-2': {
      label: '9-a-side Attacking (2-4-2)',
      format: '9-a-side',
      playerCount: 9,
      slots: [
        { key: 'GK', name: 'GK', x: 50, y: 88 },
        { key: 'CB1', name: 'CB', x: 35, y: 72 },
        { key: 'CB2', name: 'CB', x: 65, y: 72 },
        { key: 'LM', name: 'LM', x: 18, y: 46 },
        { key: 'CM1', name: 'CM', x: 38, y: 48 },
        { key: 'CM2', name: 'CM', x: 62, y: 48 },
        { key: 'RM', name: 'RM', x: 82, y: 46 },
        { key: 'ST1', name: 'ST', x: 36, y: 18 },
        { key: 'ST2', name: 'ST', x: 64, y: 18 }
      ]
    }
  };

  const activePitchFormat: PitchFormat = technicalSettings.pitchFormat || '11-a-side';
  const formationKey = (technicalSettings.formation as FormationType) || '4-3-3';
  const currentFormation = formationLayouts[formationKey] || formationLayouts['4-3-3'];
  const pitchPlayerCount = currentFormation.playerCount;

  // Calculate pitch occupancy
  const assignedSlots = currentFormation.slots.filter(s => technicalSettings.startingXI[s.key]);
  const assignedPlayerIds = new Set(Object.values(technicalSettings.startingXI).filter(Boolean));
  const benchPlayers = players.filter(p => !assignedPlayerIds.has(p.id));

  // Pointer drag event handlers for free positioning
  const handlePointerDown = (slotKey: string, e: React.PointerEvent) => {
    if (!canEditTactics) return; // Players cannot drag
    e.preventDefault();
    e.stopPropagation();
    hasMovedRef.current = false;
    dragStartPosRef.current = { clientX: e.clientX, clientY: e.clientY };

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}

    setDraggingSlot(slotKey);
    const slot = currentFormation.slots.find(s => s.key === slotKey);
    const currentX = technicalSettings.customPositions?.[slotKey]?.x ?? slot?.x ?? 50;
    const currentY = technicalSettings.customPositions?.[slotKey]?.y ?? slot?.y ?? 50;
    setDragCoords({ x: currentX, y: currentY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingSlot || !pitchContainerRef.current || !canEditTactics) return;
    const dist = Math.hypot(e.clientX - dragStartPosRef.current.clientX, e.clientY - dragStartPosRef.current.clientY);
    if (dist > 5) {
      hasMovedRef.current = true;
    }

    const rect = pitchContainerRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.round(Math.max(6, Math.min(94, rawX)));
    const clampedY = Math.round(Math.max(6, Math.min(94, rawY)));

    setDragCoords({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = (slotKey: string, e: React.PointerEvent) => {
    if (!canEditTactics) {
      setSelectedSlotKey(slotKey);
      return;
    }

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}

    if (hasMovedRef.current && dragCoords) {
      // Free movement saved!
      updateTechnicalSettings({
        customPositions: {
          ...(technicalSettings.customPositions || {}),
          [slotKey]: { x: dragCoords.x, y: dragCoords.y }
        }
      });
    } else {
      // Tap without drag: toggle player assignment drawer
      setSelectedSlotKey(prev => (prev === slotKey ? null : slotKey));
    }

    setDraggingSlot(null);
    setDragCoords(null);
  };

  // Reset custom coordinates back to standard formation grid
  const handleResetPositions = () => {
    updateTechnicalSettings({ customPositions: {} });
  };

  // Adjust custom player count on the pitch
  const handleCustomPlayerCountChange = (delta: number) => {
    const current = technicalSettings.customPlayerCount || 8;
    const newCount = Math.max(1, Math.min(11, current + delta));
    updateTechnicalSettings({
      pitchFormat: 'custom',
      formation: 'custom',
      customPlayerCount: newCount,
      pitchPlayerCount: newCount
    });
  };

  // Change pitch format & default formation
  const handlePitchFormatChange = (newFormat: PitchFormat) => {
    let defaultFormationForFormat: FormationType = '4-3-3';
    let targetCount = 11;
    if (newFormat === '5-a-side') {
      defaultFormationForFormat = '1-2-1';
      targetCount = 5;
    } else if (newFormat === '7-a-side') {
      defaultFormationForFormat = '2-3-1';
      targetCount = 7;
    } else if (newFormat === '8-a-side') {
      defaultFormationForFormat = '3-3-1';
      targetCount = 8;
    } else if (newFormat === '9-a-side') {
      defaultFormationForFormat = '3-3-2';
      targetCount = 9;
    } else if (newFormat === '11-a-side') {
      defaultFormationForFormat = '4-3-3';
      targetCount = 11;
    } else if (newFormat === 'custom') {
      defaultFormationForFormat = 'custom';
      targetCount = technicalSettings.customPlayerCount || 8;
    }

    updateTechnicalSettings({
      pitchFormat: newFormat,
      pitchPlayerCount: targetCount,
      formation: defaultFormationForFormat,
      customPlayerCount: newFormat === 'custom' ? (technicalSettings.customPlayerCount || 8) : technicalSettings.customPlayerCount
    });
  };

  // Quick auto-populate starting lineup
  const handleAutoPopulatePitch = () => {
    const newStartingXI: Record<string, string> = { ...technicalSettings.startingXI };
    const usedIds = new Set<string>();

    currentFormation.slots.forEach(slot => {
      // Find eligible player
      const eligible = players.find(p => !usedIds.has(p.id) && p.fitness === 'Fit');
      if (eligible) {
        newStartingXI[slot.key] = eligible.id;
        usedIds.add(eligible.id);
      }
    });

    updateTechnicalSettings({ startingXI: newStartingXI });
  };

  // Clear pitch slots
  const handleClearPitch = () => {
    const cleared: Record<string, string> = {};
    currentFormation.slots.forEach(s => {
      cleared[s.key] = '';
    });
    updateTechnicalSettings({ startingXI: cleared });
  };

  // Handle issuing fine
  const handleIssueFine = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPlayer = players.find(p => p.id === selectedPlayerForFine);
    const targetRule = fineRules.find(r => r.id === selectedRuleForFine);

    if (!targetPlayer) return;

    issueFine({
      playerId: targetPlayer.id,
      playerName: targetPlayer.name,
      ruleId: targetRule?.id || 'custom',
      offense: targetRule?.offense || 'General Infraction',
      amount: customFineAmount,
      date: new Date().toISOString().split('T')[0],
      isPaid: false,
      note: fineNote || undefined
    });

    setFineNote('');
    setFineSuccessMessage(true);
    setTimeout(() => setFineSuccessMessage(false), 3000);
  };

  // Total fines calculations
  const totalFinesIssued = playerFines.reduce((sum, f) => sum + f.amount, 0);
  const totalFinesPaid = playerFines.filter(f => f.isPaid).reduce((sum, f) => sum + f.amount, 0);
  const totalFinesUnpaid = totalFinesIssued - totalFinesPaid;

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation */}
      <div className="bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF2A85] border-2 border-black flex items-center justify-center font-black text-white shadow-[2px_2px_0px_0px_#000]">
            ⚙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black uppercase text-base text-black leading-tight">
                TACTICAL BOARD & SQUAD DISCIPLINE
              </h3>
              <span className={`text-[10px] font-black px-2 py-0.2 border border-black uppercase ${
                isUserAdmin
                  ? 'bg-[#D71920] text-white'
                  : isUserCoach
                  ? 'bg-[#0066B2] text-white'
                  : 'bg-[#FFE600] text-black'
              }`}>
                {isUserAdmin
                  ? 'ADMIN CLEARANCE'
                  : isUserCoach
                  ? 'COACH CLEARANCE (TACTICS UNLOCKED)'
                  : 'SQUAD PLAYER (VIEW ONLY)'}
              </span>
            </div>
            <p className="text-[11px] font-bold text-neutral-600 uppercase">
              {!canEditTactics
                ? 'TACTICAL BRIEFING • STARTING XI • SQUAD FINES (PLAYERS CAN ONLY VIEW TACTICS)'
                : 'TACTICAL EDITOR • FREE DRAG POSITIONING • STARTING XI • MATCH PREP'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
          <button
            id="admin-tab-tactics"
            onClick={() => setActiveAdminTab('tactics')}
            className={`px-3 py-1.5 border-2 border-black text-xs font-black uppercase transition-all whitespace-nowrap ${
              activeAdminTab === 'tactics'
                ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]'
                : 'bg-[#F6F5EE] text-black hover:bg-neutral-200'
            }`}
          >
            ⚽ TACTICAL PITCH & XI {!canEditTactics && '(VIEW ONLY)'}
          </button>
          <button
            id="admin-tab-fines"
            onClick={() => setActiveAdminTab('fines')}
            className={`px-3 py-1.5 border-2 border-black text-xs font-black uppercase transition-all whitespace-nowrap ${
              activeAdminTab === 'fines'
                ? 'bg-[#FF4500] text-white shadow-[2px_2px_0px_0px_#000]'
                : 'bg-[#F6F5EE] text-black hover:bg-neutral-200'
            }`}
          >
            💰 FINES & DISCIPLINE
          </button>
          {canChangeLogo && (
            <button
              id="admin-tab-logo"
              onClick={() => setActiveAdminTab('logo')}
              className={`px-3 py-1.5 border-2 border-black text-xs font-black uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeAdminTab === 'logo'
                  ? 'bg-[#D71920] text-white shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-[#F6F5EE] text-black hover:bg-neutral-200'
              }`}
            >
              <span>🛡️ CLUB LOGO & CREST</span>
            </button>
          )}
          {!isUserPlayer && (
            <button
              id="admin-tab-settings"
              onClick={() => setActiveAdminTab('settings')}
              className={`px-3 py-1.5 border-2 border-black text-xs font-black uppercase transition-all whitespace-nowrap ${
                activeAdminTab === 'settings'
                  ? 'bg-[#00E5FF] text-black shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-[#F6F5EE] text-black hover:bg-neutral-200'
              }`}
            >
              📋 CLUB DIRECTIVES
            </button>
          )}
        </div>
      </div>

      {activeAdminTab === 'tactics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tactical Football Pitch Board (Left Column) */}
          <div className="lg:col-span-7 bg-white border-3 border-black p-4 sm:p-5 shadow-[4px_4px_0px_0px_#000]">
            
            {/* Role Guidance Banner */}
            {!canEditTactics ? (
              <div className="bg-[#0066B2] text-white border-2 border-black p-3 mb-3 shadow-[2px_2px_0px_0px_#000] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Eye className="w-5 h-5 text-[#FFE600] shrink-0" />
                  <div>
                    <span className="text-xs font-black uppercase tracking-wide block">
                      FLAMEHUNTER FC TACTICAL BOARD • READ ONLY
                    </span>
                    <span className="text-[10px] font-bold text-neutral-200 uppercase">
                      Players can view starting XI, pitch positions & tactical duties. Modifying or adding tactics is strictly restricted.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-[#FFE600] text-black px-2.5 py-1 border border-black uppercase shrink-0 shadow-[1px_1px_0px_0px_#000]">
                  READ ONLY
                </span>
              </div>
            ) : (
              <div className="bg-[#FFE600] text-black border-2 border-black p-2 mb-3 shadow-[2px_2px_0px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Move className="w-4 h-4 text-[#D71920] shrink-0" />
                  <span className="text-xs font-black uppercase">
                    COACH FREE POSITIONING: Drag any player freely anywhere across the pitch!
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleResetPositions}
                    className="bg-white hover:bg-black hover:text-white text-black border border-black px-2 py-0.5 text-[10px] font-black uppercase transition-colors flex items-center gap-1 shadow-[1px_1px_0px_0px_#000]"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>RESET GRID</span>
                  </button>
                </div>
              </div>
            )}

            {/* Format & Player Amount Controls */}
            <div className="border-b-2 border-black pb-3 mb-4 space-y-3">
              {/* Pitch Format Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-500 block">
                    PITCH SQUAD FORMAT & CAPACITY
                  </span>
                  {canEditTactics ? (
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {(['5-a-side', '7-a-side', '8-a-side', '9-a-side', '11-a-side', 'custom'] as PitchFormat[]).map((fmt) => {
                        const count = fmt === '5-a-side' ? 5 : fmt === '7-a-side' ? 7 : fmt === '8-a-side' ? 8 : fmt === '9-a-side' ? 9 : fmt === '11-a-side' ? 11 : (technicalSettings.customPlayerCount || 8);
                        const isActive = activePitchFormat === fmt;
                        return (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => handlePitchFormatChange(fmt)}
                            className={`px-2 py-1 text-xs font-black uppercase border-2 border-black transition-all ${
                              isActive
                                ? 'bg-[#00E5FF] text-black shadow-[2px_2px_0px_0px_#000]'
                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 cursor-pointer'
                            }`}
                          >
                            {fmt === 'custom' ? `CUSTOM (${count}P)` : `${count}P (${fmt.toUpperCase()})`}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-[#00E5FF] text-black px-3 py-1 text-xs font-black uppercase border-2 border-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000]">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{activePitchFormat === 'custom' ? `CUSTOM (${pitchPlayerCount}P)` : `${pitchPlayerCount}P (${activePitchFormat.toUpperCase()})`}</span>
                      </span>
                      <span className="text-[10px] font-bold text-neutral-600 uppercase">
                        (LOCKED — VIEW ONLY FOR PLAYERS)
                      </span>
                    </div>
                  )}
                </div>

                {/* Player Amount on Pitch Status Box */}
                <div className="bg-[#FFE600] border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_0px_#000] text-right">
                  <span className="text-[9px] font-black uppercase text-black/70 block">
                    PLAYERS ON PITCH
                  </span>
                  <span className="text-base font-black text-black">
                    {assignedSlots.length} / {pitchPlayerCount} ACTIVE
                  </span>
                </div>
              </div>

              {/* Custom Player Amount Stepper (when custom is selected) */}
              {activePitchFormat === 'custom' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F6F7FA] border-2 border-black p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-black">
                      CUSTOM PLAYERS ON PITCH (1 to 11):
                    </span>
                    <span className="text-xs font-bold text-neutral-600">
                      Coach can add or remove player slots dynamically
                    </span>
                  </div>
                  {canEditTactics && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCustomPlayerCountChange(-1)}
                        disabled={(technicalSettings.customPlayerCount || 8) <= 1}
                        className="w-7 h-7 bg-white border-2 border-black font-black text-xs hover:bg-[#FFE600] flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none shadow-[1px_1px_0px_0px_#000]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="bg-black text-[#FFE600] px-3 py-1 border-2 border-black font-black text-xs min-w-[50px] text-center">
                        {technicalSettings.customPlayerCount || 8} PLAYERS
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCustomPlayerCountChange(1)}
                        disabled={(technicalSettings.customPlayerCount || 8) >= 11}
                        className="w-7 h-7 bg-white border-2 border-black font-black text-xs hover:bg-[#FFE600] flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none shadow-[1px_1px_0px_0px_#000]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Formation Dropdown & Pitch Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-dashed border-neutral-300">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase text-black whitespace-nowrap">
                    FORMATION:
                  </span>
                  {canEditTactics ? (
                    <select
                      id="formation-select"
                      value={formationKey}
                      onChange={(e) => updateTechnicalSettings({ formation: e.target.value as FormationType })}
                      className="bg-white border-2 border-black px-2.5 py-1 text-xs font-black uppercase focus:outline-none shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                    >
                      <optgroup label="8-A-SIDE FORMATIONS (8 PLAYERS)">
                        <option value="3-3-1">3-3-1 (CLASSIC 8S - 8P)</option>
                        <option value="2-4-1">2-4-1 (MIDFIELD OVERLOAD - 8P)</option>
                        <option value="3-2-2">3-2-2 (TWIN STRIKERS - 8P)</option>
                        <option value="2-3-2">2-3-2 (HIGH PRESS - 8P)</option>
                      </optgroup>
                      <optgroup label="11-A-SIDE FORMATIONS (11 PLAYERS)">
                        <option value="4-3-3">4-3-3 (WING PLAY - 11P)</option>
                        <option value="4-2-3-1">4-2-3-1 (DOUBLE PIVOT - 11P)</option>
                        <option value="3-5-2">3-5-2 (WINGBACKS - 11P)</option>
                        <option value="4-4-2">4-4-2 (FLAT SYSTEM - 11P)</option>
                        <option value="5-3-2">5-3-2 (FORTIFIED - 11P)</option>
                      </optgroup>
                      <optgroup label="7-A-SIDE FORMATIONS (7 PLAYERS)">
                        <option value="2-3-1">2-3-1 (MODERN 7S - 7P)</option>
                        <option value="3-2-1">3-2-1 (SOLID 7S - 7P)</option>
                        <option value="2-2-2">2-2-2 (BALANCED 7S - 7P)</option>
                      </optgroup>
                      <optgroup label="5-A-SIDE FORMATIONS (5 PLAYERS)">
                        <option value="1-2-1">1-2-1 (DIAMOND - 5P)</option>
                        <option value="2-2">2-2 (BOX SYSTEM - 5P)</option>
                        <option value="1-1-2">1-1-2 (ATTACK SYSTEM - 5P)</option>
                      </optgroup>
                      <optgroup label="9-A-SIDE FORMATIONS (9 PLAYERS)">
                        <option value="3-3-2">3-3-2 (CLASSIC 9S - 9P)</option>
                        <option value="3-4-1">3-4-1 (WIDE 9S - 9P)</option>
                        <option value="2-4-2">2-4-2 (ATTACK 9S - 9P)</option>
                      </optgroup>
                      <optgroup label="CUSTOM SQUAD">
                        <option value="custom">CUSTOM FREE POSITIONING</option>
                      </optgroup>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 bg-[#FFE600] text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]">
                      <Lock className="w-3.5 h-3.5 text-black" />
                      <span>{formationLayouts[formationKey]?.label || formationKey.toUpperCase()}</span>
                    </div>
                  )}
                </div>

                {/* Quick Pitch Action Buttons */}
                {canEditTactics && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAutoPopulatePitch}
                      className="bg-[#16A34A] text-white border-2 border-black px-2.5 py-1 text-[11px] font-black uppercase hover:bg-green-700 shadow-[1px_1px_0px_0px_#000]"
                    >
                      ⚡ AUTO-FILL PITCH
                    </button>
                    <button
                      type="button"
                      onClick={handleClearPitch}
                      className="bg-neutral-200 text-black border-2 border-black px-2 py-1 text-[11px] font-black uppercase hover:bg-neutral-300 shadow-[1px_1px_0px_0px_#000]"
                    >
                      CLEAR
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Neo-Brutalist Football Pitch */}
            <div
              ref={pitchContainerRef}
              onPointerMove={handlePointerMove}
              className="relative w-full h-[460px] sm:h-[540px] bg-[#16A34A] border-4 border-black shadow-[inset_0_0_0_2px_#000] overflow-hidden select-none touch-none"
            >
              {/* Pitch Markings */}
              <div className="absolute inset-2 border-2 border-white/80 pointer-events-none" />
              {/* Half-way line */}
              <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-white/80 -translate-y-1/2 pointer-events-none" />
              {/* Center Circle */}
              <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white/80 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <div className="opacity-25 scale-75 pointer-events-none">
                  <FlamehunterLogo size="lg" />
                </div>
              </div>
              {/* Center Spot */}
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              {/* Top Penalty Box (Opponent End) */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-52 h-24 border-2 border-white/80 pointer-events-none" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-10 border-2 border-white/80 pointer-events-none" />
              {/* Bottom Penalty Box (Our Goal) */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-52 h-24 border-2 border-white/80 pointer-events-none" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-10 border-2 border-white/80 pointer-events-none" />

              {/* Pitch Badge Watermark & Player Amount Header */}
              <div className="absolute top-3 left-3 bg-black/80 px-2 py-1 text-white border border-white font-black text-[10px] uppercase tracking-widest pointer-events-none flex items-center gap-1.5">
                <FlamehunterLogo size="xs" />
                <span>PITCH CAPACITY: {pitchPlayerCount} PLAYERS</span>
              </div>

              {/* Interactive Player Position Nodes (Free Drag & Positioning for Coach) */}
              {currentFormation.slots.map((slot: { key: string; name: string; x: number; y: number }) => {
                const assignedPlayerId = technicalSettings.startingXI[slot.key];
                const player = players.find(p => p.id === assignedPlayerId);
                const isSelected = selectedSlotKey === slot.key;
                const isBeingDragged = draggingSlot === slot.key;
                const isGk = slot.name === 'GK';

                // Real-time dragged coordinates or custom/default slot coordinates
                const currentSlotX = isBeingDragged && dragCoords ? dragCoords.x : (technicalSettings.customPositions?.[slot.key]?.x ?? slot.x);
                const currentSlotY = isBeingDragged && dragCoords ? dragCoords.y : (technicalSettings.customPositions?.[slot.key]?.y ?? slot.y);

                return (
                  <div
                    key={slot.key}
                    onPointerDown={(e) => handlePointerDown(slot.key, e)}
                    onPointerUp={(e) => handlePointerUp(slot.key, e)}
                    style={{
                      left: `${currentSlotX}%`,
                      top: `${currentSlotY}%`,
                      touchAction: 'none'
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group select-none ${
                      isBeingDragged
                        ? 'z-40 scale-120 cursor-grabbing'
                        : isSelected
                        ? 'z-30 scale-110 cursor-pointer'
                        : canEditTactics
                        ? 'z-20 hover:scale-105 cursor-grab active:cursor-grabbing'
                        : 'z-20 cursor-pointer'
                    }`}
                  >
                    {/* Position Jersey Box */}
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 border-2 border-black flex items-center justify-center font-black text-[10px] sm:text-xs transition-all shadow-[2px_2px_0px_0px_#000] relative ${
                        isBeingDragged
                          ? 'bg-[#00E5FF] text-black ring-4 ring-black animate-pulse'
                          : isSelected
                          ? 'bg-[#FFE600] text-black ring-3 ring-black'
                          : player
                          ? isGk
                            ? 'bg-[#0066B2] text-white'
                            : 'bg-[#D71920] text-white'
                          : 'bg-white text-black'
                      }`}
                    >
                      {player ? `#${player.number}` : slot.name}
                      {canEditTactics && (
                        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-black text-[#FFE600] rounded-full flex items-center justify-center text-[8px]">
                          <Move className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Name Pill */}
                    <span className="mt-1 bg-black text-white text-[8px] sm:text-[9px] font-black px-1 sm:px-1.5 py-0.5 border border-white tracking-tight uppercase whitespace-nowrap shadow-[1px_1px_0px_0px_#000] max-w-[68px] sm:max-w-none truncate text-center block">
                      {player ? player.name.split(' ')[1] || player.name : `EMPTY (${slot.name})`}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] font-bold text-neutral-600 uppercase mt-3">
              {canEditTactics
                ? '💡 Coach: Drag any position node to position players freely anywhere on pitch. Tap a slot to reassign squad player.'
                : '👁️ Squad View: Click any position to view tactical slot details.'}
            </p>
          </div>

          {/* Tactical Config & Squad Selection (Right Column) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Slot Assigning Drawer (when a slot is clicked) */}
            {selectedSlotKey && (
              <div className="bg-[#FFE600] border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                  <span className="text-xs font-black uppercase text-black">
                    {canEditTactics ? 'ASSIGN PLAYER TO SLOT:' : 'SLOT DETAILS:'} <strong>{selectedSlotKey}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedSlotKey(null)}
                    className="bg-white border border-black p-0.5 hover:bg-black hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {canEditTactics ? (
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-white p-2 border-2 border-black">
                    {players.length === 0 ? (
                      <p className="p-3 text-xs font-bold text-neutral-600 uppercase text-center">
                        No registered squad players yet. Register players in the "SQUAD" tab first to assign them here.
                      </p>
                    ) : (
                      players.map(p => {
                        const isCurrent = technicalSettings.startingXI[selectedSlotKey] === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              setStartingPlayer(selectedSlotKey, p.id);
                              setSelectedSlotKey(null);
                            }}
                            className={`w-full text-left p-1.5 border text-xs font-bold flex items-center justify-between transition-colors ${
                              isCurrent
                                ? 'bg-black text-[#FFE600] font-black'
                                : 'bg-[#F6F5EE] hover:bg-[#FFE600] text-black border-neutral-300'
                            }`}
                          >
                            <span>
                              #{p.number} {p.name} ({p.position})
                            </span>
                            <span className="text-[10px] uppercase">{p.fitness}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-3 border-2 border-black text-xs font-bold space-y-1">
                    {(() => {
                      const assignedId = technicalSettings.startingXI[selectedSlotKey];
                      const assignedPlayer = players.find(p => p.id === assignedId);
                      if (assignedPlayer) {
                        return (
                          <div>
                            <p className="font-black text-sm">#{assignedPlayer.number} {assignedPlayer.name}</p>
                            <p className="text-neutral-600 uppercase">Position: {assignedPlayer.position} • Fitness: {assignedPlayer.fitness}</p>
                            <p className="text-[11px] text-neutral-500 mt-2">Assigned by the Head Coach.</p>
                          </div>
                        );
                      }
                      return (
                        <p className="text-neutral-500 italic">This tactical slot is currently unoccupied.</p>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Tactical Style & Mentality Form */}
            <div className="bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#FF4500]" />
                  <h4 className="text-xs font-black uppercase text-black">TACTICAL INSTRUCTIONS</h4>
                </div>
                {!canEditTactics && (
                  <span className="bg-[#FFE600] text-black text-[9px] font-black px-2 py-0.5 border border-black uppercase flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    VIEW ONLY
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">
                  PLAYING STYLE & PRESSING DOCTRINE
                </label>
                {canEditTactics ? (
                  <select
                    value={technicalSettings.playingStyle}
                    onChange={(e) => updateTechnicalSettings({ playingStyle: e.target.value as any })}
                    className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-black uppercase focus:outline-none"
                  >
                    <option value="High Press Heavy Metal">🔥 High Press Heavy Metal (Intense Counter-Press)</option>
                    <option value="Possession & Overload">⚡ Possession & Overload (Tiki-Taka)</option>
                    <option value="Quick Counter-Attack">🏃 Quick Counter-Attack (Direct Transitions)</option>
                    <option value="Low Block & Strike">🛡️ Low Block & Strike (Pragmatic Fortress)</option>
                  </select>
                ) : (
                  <div className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-black uppercase text-black flex items-center justify-between">
                    <span>{technicalSettings.playingStyle}</span>
                    <span className="text-[9px] bg-black text-white px-1.5 py-0.5 font-bold">SET BY COACH</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">
                    TEAM MENTALITY
                  </label>
                  {canEditTactics ? (
                    <select
                      value={technicalSettings.teamMentality}
                      onChange={(e) => updateTechnicalSettings({ teamMentality: e.target.value as any })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-black uppercase"
                    >
                      <option value="Ultra-Attacking">Ultra-Attacking</option>
                      <option value="Attacking">Attacking</option>
                      <option value="Balanced">Balanced</option>
                      <option value="Defensive">Defensive</option>
                    </select>
                  ) : (
                    <div className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-black uppercase text-black">
                      {technicalSettings.teamMentality}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">
                    DEFENSIVE LINE
                  </label>
                  {canEditTactics ? (
                    <select
                      value={technicalSettings.defensiveLine}
                      onChange={(e) => updateTechnicalSettings({ defensiveLine: e.target.value as any })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-black uppercase"
                    >
                      <option value="High Line">High Offside Line</option>
                      <option value="Mid Block">Compact Mid Block</option>
                      <option value="Deep Low Block">Deep Low Block</option>
                    </select>
                  ) : (
                    <div className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-black uppercase text-black">
                      {technicalSettings.defensiveLine}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Set Pieces & Leadership Assignments */}
            <div className="bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#FFE600]" />
                  <h4 className="text-xs font-black uppercase text-black">LEADERSHIP & SET-PIECE TAKERS</h4>
                </div>
                {!canEditTactics && (
                  <span className="bg-[#FFE600] text-black text-[9px] font-black px-2 py-0.5 border border-black uppercase flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    COACH ROLES
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">
                    👑 TEAM CAPTAIN
                  </label>
                  {canEditTactics ? (
                    <select
                      value={technicalSettings.captainId}
                      onChange={(e) => updateTechnicalSettings({ captainId: e.target.value })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-bold uppercase"
                    >
                      {players.map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.number} {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black uppercase text-black">
                      {(() => {
                        const captain = players.find(p => p.id === technicalSettings.captainId);
                        return captain ? `#${captain.number} ${captain.name}` : 'None Assigned';
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">
                    🥈 VICE-CAPTAIN
                  </label>
                  {canEditTactics ? (
                    <select
                      value={technicalSettings.viceCaptainId}
                      onChange={(e) => updateTechnicalSettings({ viceCaptainId: e.target.value })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-bold uppercase"
                    >
                      {players.map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.number} {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-[#F6F5EE] border-2 border-black p-1.5 text-xs font-black uppercase text-black">
                      {(() => {
                        const vc = players.find(p => p.id === technicalSettings.viceCaptainId);
                        return vc ? `#${vc.number} ${vc.name}` : 'None Assigned';
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-[9px] font-black uppercase text-neutral-500 mb-1">
                    🎯 PENALTIES
                  </label>
                  {canEditTactics ? (
                    <select
                      value={technicalSettings.penaltyTakerId}
                      onChange={(e) => updateTechnicalSettings({ penaltyTakerId: e.target.value })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1 text-[11px] font-bold"
                    >
                      {players.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name.split(' ')[0]} (#{p.number})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-[#F6F5EE] border-2 border-black p-1 text-[11px] font-black truncate">
                      {(() => {
                        const p = players.find(x => x.id === technicalSettings.penaltyTakerId);
                        return p ? `${p.name.split(' ')[0]} (#${p.number})` : 'Unassigned';
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-neutral-500 mb-1">
                    ⚡ FREE KICKS
                  </label>
                  {canEditTactics ? (
                    <select
                      value={technicalSettings.freeKickTakerId}
                      onChange={(e) => updateTechnicalSettings({ freeKickTakerId: e.target.value })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1 text-[11px] font-bold"
                    >
                      {players.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name.split(' ')[0]} (#{p.number})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-[#F6F5EE] border-2 border-black p-1 text-[11px] font-black truncate">
                      {(() => {
                        const p = players.find(x => x.id === technicalSettings.freeKickTakerId);
                        return p ? `${p.name.split(' ')[0]} (#${p.number})` : 'Unassigned';
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-neutral-500 mb-1">
                    🚩 CORNERS
                  </label>
                  {canEditTactics ? (
                    <select
                      value={technicalSettings.cornerTakerId}
                      onChange={(e) => updateTechnicalSettings({ cornerTakerId: e.target.value })}
                      className="w-full bg-[#F6F5EE] border-2 border-black p-1 text-[11px] font-bold"
                    >
                      {players.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name.split(' ')[0]} (#{p.number})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-[#F6F5EE] border-2 border-black p-1 text-[11px] font-black truncate">
                      {(() => {
                        const p = players.find(x => x.id === technicalSettings.cornerTakerId);
                        return p ? `${p.name.split(' ')[0]} (#${p.number})` : 'Unassigned';
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'fines' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Issue Fine Form or Player Disciplinary Schedule (Left Column) */}
          <div className="lg:col-span-5 bg-white border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000]">
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4">
              <div className="bg-[#FF4500] text-white p-1 border-2 border-black">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="text-base font-black uppercase text-black">
                {isUserPlayer ? 'CLUB DISCIPLINE CODE & FINES' : 'ISSUE DISCIPLINARY SQUAD FINE'}
              </h4>
            </div>

            {isUserPlayer ? (
              <div className="space-y-4">
                <div className="bg-[#FFE600] p-3 border-2 border-black text-xs font-bold space-y-1 shadow-[2px_2px_0px_0px_#000]">
                  <p className="font-black uppercase text-black">SQUAD NOTICE:</p>
                  <p className="text-neutral-800">
                    Fines are managed by the Head Coach and Club Staff. All collected fines contribute to team end-of-season equipment and charity.
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-600 block mb-2">OFFICIAL FINE TARIFFS:</span>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {fineRules.map(rule => (
                      <div key={rule.id} className="bg-[#F6F5EE] border-2 border-black p-2 flex items-center justify-between text-xs font-bold">
                        <span className="uppercase">{rule.offense}</span>
                        <span className="bg-[#D71920] text-white font-black px-2 py-0.5 border border-black">${rule.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : players.length === 0 ? (
              <div className="bg-[#F6F5EE] border-2 border-black p-4 text-center space-y-2">
                <p className="text-xs font-black uppercase text-black">NO SQUAD PLAYERS REGISTERED</p>
                <p className="text-[11px] font-bold text-neutral-600">
                  Register your squad players in the "SQUAD" tab first before issuing disciplinary fines.
                </p>
              </div>
            ) : (
              <form onSubmit={handleIssueFine} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Select Squad Player *</label>
                  <select
                    value={selectedPlayerForFine}
                    onChange={(e) => setSelectedPlayerForFine(e.target.value)}
                    className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-black uppercase"
                  >
                    {players.map(p => (
                      <option key={p.id} value={p.id}>
                        #{p.number} {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-1">Standard Offense Rule</label>
                  <select
                    value={selectedRuleForFine}
                    onChange={(e) => {
                      const ruleId = e.target.value;
                      setSelectedRuleForFine(ruleId);
                      const rule = fineRules.find(r => r.id === ruleId);
                      if (rule) setCustomFineAmount(rule.amount);
                    }}
                    className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-black uppercase"
                  >
                    {fineRules.map(rule => (
                      <option key={rule.id} value={rule.id}>
                        {rule.offense} (${rule.amount})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-1">Fine Amount ($ USD)</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={customFineAmount}
                    onChange={(e) => setCustomFineAmount(parseInt(e.target.value) || 10)}
                    className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-1">Incident Note</label>
                  <textarea
                    rows={2}
                    value={fineNote}
                    onChange={(e) => setFineNote(e.target.value)}
                    placeholder="Details of incident (e.g. 15 mins late to team bus, unwashed home kit)..."
                    className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-bold"
                  />
                </div>

                {fineSuccessMessage && (
                  <div className="bg-[#22C55E] text-black font-black text-xs p-2 border-2 border-black flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> FINE RECORDED IN SQUAD DISCIPLINE LOG!
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#FF4500] hover:bg-[#e03d00] text-white border-2 border-black py-2.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  CONFIRM & LEVY FINE
                </button>
              </form>
            )}
          </div>

          {/* Fines Ledger & Totals (Right Column) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Fine Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#FFE600] border-2 border-black p-3 shadow-[3px_3px_0px_0px_#000]">
                <span className="text-[10px] font-black uppercase text-neutral-800 block">TOTAL FINES</span>
                <span className="text-xl font-black text-black">${totalFinesIssued}</span>
              </div>
              <div className="bg-[#22C55E] border-2 border-black p-3 shadow-[3px_3px_0px_0px_#000]">
                <span className="text-[10px] font-black uppercase text-neutral-800 block">COLLECTED</span>
                <span className="text-xl font-black text-black">${totalFinesPaid}</span>
              </div>
              <div className="bg-[#FF4500] border-2 border-black p-3 text-white shadow-[3px_3px_0px_0px_#000]">
                <span className="text-[10px] font-black uppercase text-yellow-200 block">OUTSTANDING</span>
                <span className="text-xl font-black text-white">${totalFinesUnpaid}</span>
              </div>
            </div>

            {/* Fines Table */}
            <div className="bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
              <div className="p-3 bg-black text-white text-xs font-black uppercase flex items-center justify-between">
                <span>FLAMEHUNTER DISCIPLINE LEDGER</span>
                <span>{playerFines.length} INFRACTIONS</span>
              </div>

              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F6F5EE] border-b-2 border-black font-black uppercase">
                      <th className="p-2.5">DATE</th>
                      <th className="p-2.5">PLAYER</th>
                      <th className="p-2.5">OFFENSE</th>
                      <th className="p-2.5">AMOUNT</th>
                      <th className="p-2.5 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-black font-bold">
                    {playerFines.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center bg-[#FAFAF9] text-neutral-600 font-bold uppercase">
                          No disciplinary fines recorded. Squad record is 100% clean!
                        </td>
                      </tr>
                    ) : (
                      playerFines.map(fine => (
                      <tr key={fine.id} className="hover:bg-[#FFFEEA]">
                        <td className="p-2.5 text-neutral-600">{fine.date}</td>
                        <td className="p-2.5 font-black uppercase">{fine.playerName}</td>
                        <td className="p-2.5">
                          <span className="block text-black font-bold">{fine.offense}</span>
                          {fine.note && <span className="text-[10px] text-neutral-500 italic block">{fine.note}</span>}
                        </td>
                        <td className="p-2.5 font-black text-black">${fine.amount}</td>
                        <td className="p-2.5 text-right">
                          {isUserPlayer ? (
                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black inline-block ${
                              fine.isPaid ? 'bg-[#22C55E] text-black' : 'bg-[#FF4500] text-white'
                            }`}>
                              {fine.isPaid ? 'PAID ✓' : 'UNPAID'}
                            </span>
                          ) : (
                            <button
                              onClick={() => toggleFinePaid(fine.id)}
                              className={`px-2 py-1 text-[10px] font-black uppercase border border-black transition-all ${
                                fine.isPaid
                                  ? 'bg-[#22C55E] text-black'
                                  : 'bg-[#FF4500] text-white hover:bg-black'
                              }`}
                              title="Click to toggle Paid/Unpaid"
                            >
                              {fine.isPaid ? 'PAID ✓' : 'UNPAID ✕'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'logo' && canChangeLogo && (
        <ClubLogoManager />
      )}

      {activeAdminTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Club Identity & Venue Config */}
          <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000] space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-black pb-3">
              <Flame className="w-5 h-5 text-[#FF4500]" />
              <h4 className="text-sm font-black uppercase text-black">CLUB TECHNICAL PROFILE</h4>
            </div>

            {/* Official Club Crest Quick Card */}
            <div className="bg-[#0066B2] text-white p-3.5 border-2 border-black flex items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#000]">
              <div className="flex items-center gap-3">
                <FlamehunterLogo size="sm" withShadow />
                <div>
                  <span className="font-black uppercase text-xs block text-white">OFFICIAL CLUB EMBLEM</span>
                  <span className="text-[10px] font-bold text-[#FFE600] uppercase">DYNAMICALLY PROPAGATED TO ALL VIEWS</span>
                </div>
              </div>
              <button
                onClick={() => setActiveAdminTab('logo')}
                className="bg-[#FFE600] text-black hover:bg-white border-2 border-black px-2.5 py-1 text-[11px] font-black uppercase transition-all shadow-[1px_1px_0px_0px_#000]"
              >
                CHANGE LOGO →
              </button>
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1">Home Ground & Pitch</label>
              <input
                type="text"
                value={technicalSettings.stadiumName}
                onChange={(e) => updateTechnicalSettings({ stadiumName: e.target.value })}
                className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1">Head Coach</label>
              <input
                type="text"
                value={technicalSettings.headCoach}
                onChange={(e) => updateTechnicalSettings({ headCoach: e.target.value })}
                className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1">
                Head Coach Directives & Season Mission
              </label>
              <textarea
                rows={4}
                value={technicalSettings.tacticalNotes}
                onChange={(e) => updateTechnicalSettings({ tacticalNotes: e.target.value })}
                className="w-full bg-[#F6F5EE] border-2 border-black p-2 text-xs font-bold leading-relaxed"
              />
            </div>
          </div>

          {/* Technical Data Maintenance */}
          <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000] space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4">
                <Settings className="w-5 h-5 text-black" />
                <h4 className="text-sm font-black uppercase text-black">SYSTEM DATA & MAINTENANCE</h4>
              </div>

              <div className="space-y-3 text-xs font-bold text-neutral-800">
                <div className="bg-[#F6F5EE] p-3 border-2 border-black">
                  <span className="font-black uppercase block mb-1">EXPORT SQUAD TACTICAL SHEET (JSON)</span>
                  <p className="text-[11px] text-neutral-600 mb-2">
                    Download complete rosters, stats, schedules, and attendance records as a backup.
                  </p>
                  <button
                    onClick={() => {
                      const exportObj = {
                        club: 'Flamehunter FC',
                        exportedAt: new Date().toISOString(),
                        players,
                        technicalSettings,
                        playerFines
                      };
                      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute('href', dataStr);
                      downloadAnchor.setAttribute('download', 'flamehunter_fc_squad_data.json');
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                    className="bg-[#FFE600] hover:bg-yellow-300 text-black border-2 border-black px-3 py-1.5 font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                  >
                    EXPORT DATA FILE
                  </button>
                </div>

                <div className="bg-red-50 p-3 border-2 border-black">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-[#FF4500] uppercase block">
                      DANGER ZONE: RESET TO FACTORY DEMO
                    </span>
                    {!canResetData && (
                      <span className="bg-black text-[#FFE600] text-[9px] font-black px-1.5 py-0.5 uppercase border border-black flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> ADMIN ONLY
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-600 mb-2">
                    Reverts all changes to the original Flamehunter FC seed data (squad roster, schedules, chats, fines).
                  </p>
                  {canResetData ? (
                    <button
                      onClick={() => {
                        if (window.confirm('Reset all club data to original Flamehunter FC seed data?')) {
                          resetAllData();
                        }
                      }}
                      className="bg-white hover:bg-black hover:text-white text-black border-2 border-black px-3 py-1.5 font-black uppercase shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      RESET DEMO DATA
                    </button>
                  ) : (
                    <div className="bg-neutral-100 border border-neutral-300 p-2 text-[11px] font-bold text-neutral-600 uppercase flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>Data reset clearance is restricted to Club Administrator.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-[10px] font-bold text-neutral-500 uppercase pt-4 border-t-2 border-black">
              FLAMEHUNTER FC ADMIN BUILD V2.4 • NEO-BRUTALIST PRODUCTION SUITE
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
