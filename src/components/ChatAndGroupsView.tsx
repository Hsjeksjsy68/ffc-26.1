import React, { useState, useRef, useEffect } from 'react';
import { useClub } from '../context/ClubContext';
import { ChatGroup, ChatMessage, Player } from '../types';
import {
  MessageSquare,
  Plus,
  Send,
  Users,
  Flame,
  Zap,
  Shield,
  Car,
  Trophy,
  Smile,
  AlertTriangle,
  Check,
  CheckCheck,
  X,
  Smartphone,
  Search,
  Phone,
  Video,
  Info,
  ThumbsUp,
  Heart,
  Camera,
  Mic,
  Paperclip,
  ChevronLeft,
  Sparkles,
  MoreVertical,
  Volume2,
  Trash2,
  RotateCcw,
  Lock,
  ShieldAlert,
  Film,
  Maximize2,
  Download,
  Image as ImageIcon
} from 'lucide-react';

export interface ChatAndGroupsViewProps {
  isDedicatedPage?: boolean;
  onBackToHub?: () => void;
}

export const ChatAndGroupsView: React.FC<ChatAndGroupsViewProps> = ({ isDedicatedPage = false, onBackToHub }) => {
  const {
    chatGroups,
    chatMessages,
    createChatGroup,
    deleteChatGroup,
    resetAllChats,
    clearGroupMessages,
    sendChatMessage,
    reactToMessage,
    players,
    currentUser,
    openNotificationModal
  } = useClub();

  const [activeGroupId, setActiveGroupId] = useState<string>(chatGroups[0]?.id || 'grp-1');
  const [inputText, setInputText] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [tacticalTag, setTacticalTag] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTacticalDrawer, setShowTacticalDrawer] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [callModalType, setCallModalType] = useState<'audio' | 'video' | null>(null);

  // Deletion & Reset Modal States
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState<ChatGroup | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mobile state: 'list' (shows conversations list) vs 'chat' (shows active thread)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('chat');

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('Flame');
  const [newGroupColor, setNewGroupColor] = useState('#0084FF');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  // Attached media state (photo or video before sending)
  const [selectedMedia, setSelectedMedia] = useState<{
    file: File;
    type: 'image' | 'video';
    url: string;
    name: string;
    size: number;
  } | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [previewModalMedia, setPreviewModalMedia] = useState<{
    type: 'image' | 'video';
    url: string;
    name?: string;
  } | null>(null);

  const isMarcusMsg = (m: ChatMessage) => {
    const sName = (m.senderName || '').toLowerCase();
    const sId = (m.senderId || '').toLowerCase();
    return sName.includes('marcus') || sName.includes('vance') || sId.includes('marcus') || sId.includes('vance');
  };

  const activeGroup = chatGroups.find(g => g.id === activeGroupId) || chatGroups[0];
  const activeMessages = chatMessages.filter(m => m.groupId === activeGroupId && !isMarcusMsg(m));

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeGroupId]);

  // Standard Messenger Emojis for quick reactions
  const messengerReactions = ['❤️', '👍', '😂', '😮', '😢', '🔥', '⚽', '👏'];

  const handleMediaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      setActionNotice({ type: 'error', text: '⚠️ শুধুমাত্র ছবি (Image) বা ভিডিও (Video) ফাইল নির্বাচন করুন।' });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setActionNotice({ type: 'error', text: '⚠️ ফাইলের সাইজ সর্বোচ্চ ২৫ মেগাবাইট (25MB) হতে পারবে।' });
      return;
    }

    setIsUploadingMedia(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedMedia({
        file,
        type: isVideo ? 'video' : 'image',
        url: dataUrl,
        name: file.name,
        size: file.size
      });
      setIsUploadingMedia(false);
    };
    reader.onerror = () => {
      setActionNotice({ type: 'error', text: 'ফাইল রিড করতে ব্যর্থ হয়েছে।' });
      setIsUploadingMedia(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendMessage = (textToSend?: string) => {
    const content = textToSend !== undefined ? textToSend : inputText.trim();
    if (!content && !selectedMedia) return;

    const defaultText = selectedMedia
      ? selectedMedia.type === 'video'
        ? '🎥 [ভিডিও বার্তা]'
        : '📷 [ছবি শেয়ার করা হয়েছে]'
      : '';

    sendChatMessage(activeGroupId, content || defaultText, {
      isAnnouncement: isAnnouncement && (currentUser.isAdmin || currentUser.role.includes('Captain')),
      tacticalTag: tacticalTag || undefined,
      media: selectedMedia ? {
        type: selectedMedia.type,
        url: selectedMedia.url,
        name: selectedMedia.name,
        size: selectedMedia.size
      } : undefined
    });

    setInputText('');
    setSelectedMedia(null);
    setIsAnnouncement(false);
    setTacticalTag('');
    setShowEmojiPicker(false);
    setShowTacticalDrawer(false);
    inputRef.current?.focus();
  };

  // Quick Thumbs Up (Messenger staple!)
  const handleQuickLike = () => {
    handleSendMessage('👍');
  };

  // Quick Voice Note Simulation
  const handleSendVoiceNote = () => {
    const durations = ['0:14', '0:26', '0:42', '1:05'];
    const randomDuration = durations[Math.floor(Math.random() * durations.length)];
    handleSendMessage(`🎙️ [Voice Message • ${randomDuration}] Tactical drill briefing from ${currentUser.name}`);
  };

  // Quick Photo Simulation
  const handleSendPhoto = () => {
    handleSendMessage(`📸 [Matchday Photo] Squad pitch setup and formation chalkboard ready! ⚽`);
  };

  // Handle Group Deletion Execution
  const handleExecuteDeleteGroup = async () => {
    if (!deleteConfirmGroup) return;
    const res = await deleteChatGroup(deleteConfirmGroup.id);
    if (res.success) {
      setActionNotice({ type: 'success', text: res.message });
      if (activeGroupId === deleteConfirmGroup.id) {
        const remaining = chatGroups.filter(g => g.id !== deleteConfirmGroup.id);
        if (remaining.length > 0) {
          setActiveGroupId(remaining[0].id);
        }
      }
    } else {
      setActionNotice({ type: 'error', text: res.message });
    }
    setDeleteConfirmGroup(null);
  };

  // Handle Reset All Chats Execution
  const handleExecuteResetAllChats = async () => {
    const res = await resetAllChats();
    if (res.success) {
      setActionNotice({ type: 'success', text: res.message });
      setActiveGroupId('grp-1');
    } else {
      setActionNotice({ type: 'error', text: res.message });
    }
    setIsResetConfirmOpen(false);
  };

  // Handle Clear Message History Execution
  const handleExecuteClearMessages = async (groupId: string) => {
    const res = await clearGroupMessages(groupId);
    if (res.success) {
      setActionNotice({ type: 'success', text: res.message });
    } else {
      setActionNotice({ type: 'error', text: res.message });
    }
  };

  // Create Group Submit
  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const created = createChatGroup(
      newGroupName.trim(),
      newGroupDesc.trim() || 'Flamehunter tactical squad unit',
      selectedMembers,
      newGroupIcon,
      newGroupColor
    );

    setActiveGroupId(created.id);
    setIsCreatingGroup(false);
    setNewGroupName('');
    setNewGroupDesc('');
    setSelectedMembers([]);
    setMobileView('chat');
  };

  const toggleMemberSelection = (playerId: string) => {
    setSelectedMembers(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  // Start 1-on-1 DM with a player
  const startDmWithPlayer = (player: Player) => {
    const existingDm = chatGroups.find(
      g => g.isDirectMessage && g.memberIds.includes(player.id) && g.memberIds.includes(currentUser.id)
    );

    if (existingDm) {
      setActiveGroupId(existingDm.id);
    } else {
      const newDm = createChatGroup(
        `${player.name}`,
        `Direct conversation between ${currentUser.name} and ${player.name}`,
        [currentUser.id, player.id],
        'MessageSquare',
        player.avatarBg || '#0084FF'
      );
      newDm.isDirectMessage = true;
      setActiveGroupId(newDm.id);
    }
    setMobileView('chat');
  };

  const getGroupIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'Shield': return <Shield className="w-4 h-4" />;
      case 'Car': return <Car className="w-4 h-4" />;
      case 'Trophy': return <Trophy className="w-4 h-4" />;
      default: return <Flame className="w-4 h-4" />;
    }
  };

  // Filter conversations
  const filteredGroups = chatGroups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`w-full flex flex-col bg-white overflow-hidden ${
      isDedicatedPage
        ? 'h-full flex-1 min-h-0 border-0 sm:border-3 sm:border-black sm:shadow-[4px_4px_0px_0px_#000]'
        : 'h-[calc(100vh-210px)] min-h-[480px] max-h-[800px] border-3 sm:border-4 border-black shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000]'
    }`}>
      {/* Top Messenger App Header Banner (Shown only inside regular hub tabs) */}
      {!isDedicatedPage && (
        <div className="shrink-0 bg-[#0084FF] text-white px-3 sm:px-4 py-2 border-b-3 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white text-[#0084FF] rounded-full flex items-center justify-center font-black shadow-[1px_1px_0px_0px_#000]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm uppercase tracking-tight text-white">
                  FLAMEHUNTER MESSENGER
                </span>
                <span className="bg-[#FFE600] text-black text-[9px] font-black px-1.5 py-0.2 border border-black uppercase">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openNotificationModal}
              className="flex items-center gap-1 text-[11px] bg-white hover:bg-[#FFE600] text-black border-2 border-black px-2.5 py-1 font-black shadow-[1px_1px_0px_0px_#000] cursor-pointer"
              title="Configure notifications to your phone"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="hidden sm:inline">PHONE ALERTS</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Messenger Grid: Sidebar + Active Chat */}
      <div className="flex-1 min-h-0 h-full grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* ========================================================
            LEFT COLUMN: CHATS LIST & ACTIVE NOW (MESSENGER SIDEBAR)
           ======================================================== */}
        <div
          className={`md:col-span-4 lg:col-span-4 border-r-0 md:border-r-3 border-black h-full flex flex-col bg-white overflow-hidden ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Sidebar Top: User Bar & New Group */}
          <div className="p-3 border-b-2 border-black flex items-center justify-between bg-[#F6F7FA]">
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-full border-2 border-black flex items-center justify-center font-black text-xs text-white shadow-[1px_1px_0px_0px_#000]"
                style={{ backgroundColor: currentUser.avatarBg || '#0084FF' }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-black leading-none">Chats</h3>
                <span className="text-[10px] font-bold text-neutral-500 uppercase">
                  {currentUser.name.split(' ')[0]} ({currentUser.userType?.toUpperCase() || 'PLAYER'})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {currentUser.isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="bg-[#FFF1F2] hover:bg-[#D71920] hover:text-white text-[#D71920] border-2 border-black px-2 py-1 text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  title="Admin: Reset all chats and messages"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">RESET</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCreatingGroup(true)}
                className="w-8 h-8 bg-[#22C55E] hover:bg-green-500 text-black border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                title="Create New Squad Group"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messenger Search Bar */}
          <div className="p-2.5 border-b-2 border-neutral-200 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search Messenger & Squad..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#F0F2F5] rounded-full border border-black/30 pl-8 pr-3 py-1.5 text-xs font-bold text-black focus:outline-none focus:bg-white focus:border-black"
              />
            </div>
          </div>

          {/* Messenger "Active Now" Horizontal Story / Player Avatars */}
          <div className="p-2.5 border-b-2 border-neutral-200 bg-white overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-3">
              {/* My Status Bubble */}
              <div className="flex flex-col items-center shrink-0 cursor-pointer">
                <div className="relative">
                  <div
                    className="w-11 h-11 rounded-full border-2 border-black flex items-center justify-center text-white font-black text-xs shadow-[2px_2px_0px_0px_#000]"
                    style={{ backgroundColor: currentUser.avatarBg || '#0084FF' }}
                  >
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-white" />
                </div>
                <span className="text-[10px] font-black uppercase text-black mt-1 truncate max-w-[54px]">
                  You
                </span>
              </div>

              {/* Online Squad Players (Messenger Active Friends) */}
              {players.slice(0, 10).map(player => (
                <div
                  key={player.id}
                  onClick={() => startDmWithPlayer(player)}
                  className="flex flex-col items-center shrink-0 cursor-pointer group"
                  title={`Start 1-on-1 chat with ${player.name}`}
                >
                  <div className="relative group-hover:scale-105 transition-transform">
                    <div
                      className="w-11 h-11 rounded-full border-2 border-black flex items-center justify-center text-white font-black text-xs shadow-[2px_2px_0px_0px_#000]"
                      style={{ backgroundColor: player.avatarBg || '#0084FF' }}
                    >
                      #{player.number}
                    </div>
                    {/* Green Active Dot */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-white animate-pulse" />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-800 uppercase mt-1 truncate max-w-[54px] group-hover:text-[#0084FF]">
                    {player.nickname || player.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation List (Messenger Threads) */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-neutral-100">
            {filteredGroups.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 text-xs font-bold uppercase">
                No chats found matching "{searchQuery}"
              </div>
            ) : (
              filteredGroups.map(group => {
                const isActive = group.id === activeGroupId;
                const isProtected = group.isAdminGroup || group.isChannel || group.createdBy === 'admin' || group.createdBy === 'flamehunter_staff';
                const canDelete = currentUser.isAdmin || (!isProtected && (group.createdBy === currentUser.id || group.createdBy === currentUser.email));
                const lastMsg = chatMessages
                  .filter(m => m.groupId === group.id && !isMarcusMsg(m))
                  .slice(-1)[0];

                return (
                  <div
                    key={group.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveGroupId(group.id);
                      setMobileView('chat');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveGroupId(group.id);
                        setMobileView('chat');
                      }
                    }}
                    className={`w-full p-3 flex items-center gap-3 text-left transition-colors cursor-pointer select-none ${
                      isActive
                        ? 'bg-[#EBF5FF] border-l-4 border-[#0084FF]'
                        : 'hover:bg-[#F2F4F7]'
                    }`}
                  >
                    {/* Thread Avatar with Active Dot */}
                    <div className="relative shrink-0">
                      <div
                        className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-black text-white shadow-[2px_2px_0px_0px_#000]"
                        style={{ backgroundColor: group.accentColor || '#0084FF' }}
                      >
                        {group.isDirectMessage ? (
                          <span className="text-sm font-black">{group.name.charAt(0)}</span>
                        ) : (
                          getGroupIcon(group.icon)
                        )}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#22C55E] rounded-full border-2 border-white" />
                    </div>

                    {/* Thread Name & Last Message */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-black uppercase truncate ${
                          isActive ? 'text-[#0084FF]' : 'text-black'
                        }`}>
                          {group.name}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] font-bold text-neutral-400 shrink-0 ml-1">
                            {lastMsg.timestamp.split(' ')[0]}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-neutral-600 truncate max-w-[150px]">
                          {lastMsg ? (
                            <span>
                              {lastMsg.senderName.split(' ')[0]}: {lastMsg.text}
                            </span>
                          ) : (
                            <span className="italic text-neutral-400">No messages yet</span>
                          )}
                        </p>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {group.isChannel && (
                            <span className="bg-[#FFE600] text-black text-[8px] font-black px-1 py-0.2 border border-black uppercase shrink-0">
                              SQUAD
                            </span>
                          )}
                          {isProtected ? (
                            <span
                              title="অফিশিয়াল অ্যাডমিন চ্যানেল • সুরক্ষিত"
                              className="flex items-center gap-0.5 bg-neutral-200 text-neutral-600 text-[8px] font-black px-1 py-0.5 border border-neutral-300 uppercase shrink-0"
                            >
                              <Lock className="w-2.5 h-2.5 text-[#D71920]" />
                            </span>
                          ) : canDelete ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmGroup(group);
                              }}
                              className="p-1 text-neutral-400 hover:text-[#D71920] hover:bg-white border border-transparent hover:border-black rounded transition-colors cursor-pointer shrink-0"
                              title="Delete this group"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: ACTIVE CHAT CONVERSATION (MESSENGER ROOM)
           ======================================================== */}
        <div
          className={`md:col-span-8 lg:col-span-8 flex flex-col bg-[#F0F2F5] h-full overflow-hidden ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Active Conversation Top Bar (Messenger Header) */}
          <div className="shrink-0 bg-white border-b-2 sm:border-b-3 border-black px-3 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-between shadow-[0_2px_4px_rgba(0,0,0,0.04)] z-10">
            <div className="flex items-center gap-2.5">
              {/* Back button on mobile */}
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className="md:hidden w-8 h-8 bg-neutral-100 border-2 border-black flex items-center justify-center hover:bg-neutral-200 active:scale-95 cursor-pointer mr-1"
                title="Back to all chats"
              >
                <ChevronLeft className="w-5 h-5 text-black" />
              </button>

              {/* Active Contact Avatar */}
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-black text-white shadow-[2px_2px_0px_0px_#000]"
                  style={{ backgroundColor: activeGroup.accentColor || '#0084FF' }}
                >
                  {getGroupIcon(activeGroup.icon)}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-white" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black uppercase text-black leading-tight">
                    {activeGroup.name}
                  </h4>
                  {activeGroup.isChannel && (
                    <span className="bg-[#D71920] text-white text-[9px] font-black px-1.5 py-0.2 border border-black uppercase">
                      OFFICIAL
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  <span>Active now</span>
                  <span>•</span>
                  <span>{activeGroup.memberIds.length} members</span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons (Messenger Audio Call, Video Call, Alerts, Info) */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setCallModalType('audio')}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-[#0084FF] hover:text-white text-black border-2 border-black flex items-center justify-center transition-all cursor-pointer shadow-[1px_1px_0px_0px_#000]"
                title="Start Audio Tactical Call"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCallModalType('video')}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-[#0084FF] hover:text-white text-black border-2 border-black flex items-center justify-center transition-all cursor-pointer shadow-[1px_1px_0px_0px_#000]"
                title="Start Video Chalkboard Room"
              >
                <Video className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={openNotificationModal}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-[#FFE600] text-black border-2 border-black flex items-center justify-center transition-all cursor-pointer shadow-[1px_1px_0px_0px_#000]"
                title="Send Instant Phone Alert"
              >
                <Smartphone className="w-4 h-4 text-[#22C55E]" />
              </button>

              <button
                type="button"
                onClick={() => setShowGroupDetails(!showGroupDetails)}
                className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center transition-all cursor-pointer shadow-[1px_1px_0px_0px_#000] ${
                  showGroupDetails ? 'bg-black text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-black'
                }`}
                title="Group details and participants"
              >
                <Info className="w-4 h-4" />
              </button>

              {/* Delete Group Button if user is allowed (or locked indicator if admin group) */}
              {(() => {
                const isActiveProtected = activeGroup.isAdminGroup || activeGroup.isChannel || activeGroup.createdBy === 'admin' || activeGroup.createdBy === 'flamehunter_staff';
                const canDeleteActive = currentUser.isAdmin || (!isActiveProtected && (activeGroup.createdBy === currentUser.id || activeGroup.createdBy === currentUser.email));

                if (canDeleteActive) {
                  return (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmGroup(activeGroup)}
                      className="w-8 h-8 rounded-full bg-[#FFF1F2] hover:bg-[#D71920] hover:text-white text-[#D71920] border-2 border-black flex items-center justify-center transition-all cursor-pointer shadow-[1px_1px_0px_0px_#000]"
                      title="Delete this group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  );
                } else if (isActiveProtected) {
                  return (
                    <span
                      className="hidden sm:flex items-center gap-1 bg-neutral-100 text-neutral-600 border border-neutral-400 px-2 py-1 text-[9px] font-black uppercase rounded shadow-[1px_1px_0px_0px_#000]"
                      title="Official Admin Channel • Protected from deletion"
                    >
                      <Lock className="w-3 h-3 text-[#D71920]" />
                      <span>OFFICIAL</span>
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Group Details Drawer (Toggled via Info icon) */}
          {showGroupDetails && (
            <div className="bg-[#FFFEEA] border-b-3 border-black p-3 text-xs font-bold animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <span className="font-black uppercase text-black flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#0084FF]" />
                  <span>GROUP PARTICIPANTS ({activeGroup.memberIds.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowGroupDetails(false)}
                  className="text-neutral-500 hover:text-black font-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-neutral-600 mb-2">{activeGroup.description}</p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {activeGroup.memberIds.map(memId => {
                  const p = players.find(player => player.id === memId);
                  return (
                    <span
                      key={memId}
                      className="bg-white border border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1 shadow-[1px_1px_0px_0px_#000]"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                      <span>{p ? p.name : memId}</span>
                    </span>
                  );
                })}
              </div>

              {/* Creator & Admin Status */}
              <div className="mt-3 pt-2 border-t border-black/10 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] text-neutral-600">
                  {activeGroup.isAdminGroup ? '🛡️ তৈরি করেছেন: ক্লাবের অফিশিয়াল অ্যাডমিন (Official)' : `👤 তৈরি করেছেন: ${activeGroup.createdByName || 'ক্লাব মেম্বার'}`}
                </span>
                <div className="flex items-center gap-2">
                  {(currentUser.isAdmin || activeGroup.createdBy === currentUser.id) && (
                    <button
                      type="button"
                      onClick={() => handleExecuteClearMessages(activeGroup.id)}
                      className="bg-white hover:bg-neutral-100 text-black border border-black px-2 py-1 text-[10px] font-bold uppercase cursor-pointer"
                    >
                      🧹 Clear Messages
                    </button>
                  )}
                  {(() => {
                    const isActiveProtected = activeGroup.isAdminGroup || activeGroup.isChannel || activeGroup.createdBy === 'admin' || activeGroup.createdBy === 'flamehunter_staff';
                    const canDeleteActive = currentUser.isAdmin || (!isActiveProtected && (activeGroup.createdBy === currentUser.id || activeGroup.createdBy === currentUser.email));
                    return canDeleteActive ? (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmGroup(activeGroup)}
                        className="bg-[#FFF1F2] hover:bg-[#D71920] hover:text-white text-[#D71920] border border-black px-2 py-1 text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete Group</span>
                      </button>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              MESSAGES STREAM (AUTHENTIC MESSENGER BUBBLES)
             ======================================================== */}
          <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-3">
            {activeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-[#EBF5FF] border-2 border-black flex items-center justify-center text-[#0084FF] mb-3 shadow-[3px_3px_0px_0px_#000]">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h5 className="font-black uppercase text-base text-black">
                  SAY HI TO {activeGroup.name.toUpperCase()}! 👋
                </h5>
                <p className="text-xs font-bold text-neutral-500 mt-1 max-w-sm">
                  Send a tactical note, pre-match plan, or tap the thumbs-up to break the ice.
                </p>
                <button
                  type="button"
                  onClick={handleQuickLike}
                  className="mt-4 bg-[#0084FF] text-white border-2 border-black px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <ThumbsUp className="w-4 h-4 fill-white" />
                  <span>SEND QUICK THUMBS UP</span>
                </button>
              </div>
            ) : (
              activeMessages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser.id;
                const isSingleEmoji = msg.text.trim() === '👍' || (msg.text.length <= 4 && /[\u{1F300}-\u{1FAFF}]/u.test(msg.text));
                const isHovered = hoveredMessageId === msg.id;

                return (
                  <div
                    key={msg.id}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                    className={`flex flex-col relative ${isMe ? 'items-end' : 'items-start'} group`}
                  >
                    {/* Pinned Club Announcement Header */}
                    {msg.isAnnouncement && (
                      <div className="mb-1 flex items-center gap-1.5 bg-[#FF4500] text-white text-[10px] font-black px-2 py-0.5 border border-black uppercase shadow-[2px_2px_0px_0px_#000]">
                        <AlertTriangle className="w-3 h-3 text-[#FFE600]" />
                        <span>PINNED CLUB ANNOUNCEMENT</span>
                      </div>
                    )}

                    {/* Tactical Tag */}
                    {msg.tacticalTag && (
                      <div className="mb-1 bg-black text-[#FFE600] text-[9px] font-black px-1.5 py-0.5 border border-black uppercase">
                        ⚡ {msg.tacticalTag}
                      </div>
                    )}

                    {/* Message Bubble + Sender Layout */}
                    <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${
                      isMe ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      {/* Avatar for others */}
                      {!isMe && (
                        <div
                          className="w-7 h-7 rounded-full border border-black flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-[1px_1px_0px_0px_#000]"
                          style={{ backgroundColor: '#0084FF' }}
                          title={msg.senderName}
                        >
                          {msg.senderName.charAt(0)}
                        </div>
                      )}

                      <div className="relative">
                        {/* Sender Name above message for others */}
                        {!isMe && (
                          <span className="text-[10px] font-black uppercase text-neutral-600 block mb-0.5 px-1">
                            {msg.senderName}
                          </span>
                        )}

                        {/* Floating Messenger Emoji Reaction Bar on Hover / Focus */}
                        <div
                          className={`absolute -top-8 ${isMe ? 'right-0' : 'left-0'} z-20 bg-white border-2 border-black rounded-full px-2 py-0.5 shadow-[3px_3px_0px_0px_#000] flex items-center gap-1 transition-all ${
                            isHovered ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'
                          }`}
                        >
                          {messengerReactions.map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => reactToMessage(msg.id, emoji)}
                              className="hover:scale-130 active:scale-95 transition-transform text-sm p-0.5 cursor-pointer"
                              title={`React with ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        {/* The Messenger Bubble */}
                        {isSingleEmoji && !msg.mediaUrl ? (
                          <div className="text-4xl sm:text-5xl p-1 select-none animate-bounce-short">
                            {msg.text}
                          </div>
                        ) : (
                          <div
                            className={`p-3 text-xs sm:text-sm font-medium leading-relaxed border-2 border-black shadow-[2px_2px_0px_0px_#000] ${
                              isMe
                                ? 'bg-[#0084FF] text-white rounded-2xl rounded-br-xs'
                                : 'bg-white text-neutral-900 rounded-2xl rounded-bl-xs'
                            }`}
                          >
                            {/* Attached Media (Photo / Video) */}
                            {msg.mediaUrl && (
                              <div className="mb-2 overflow-hidden rounded border-2 border-black bg-black/10">
                                {msg.mediaType === 'video' ? (
                                  <div className="relative bg-black rounded overflow-hidden">
                                    <video
                                      src={msg.mediaUrl}
                                      controls
                                      preload="metadata"
                                      className="w-full max-h-72 object-contain rounded"
                                    />
                                    {msg.mediaName && (
                                      <div className="p-1.5 bg-neutral-900 text-white text-[10px] font-mono flex items-center justify-between border-t border-neutral-700">
                                        <span className="truncate flex items-center gap-1">
                                          <Film className="w-3.5 h-3.5 text-[#FFE600] shrink-0" />
                                          <span className="truncate">{msg.mediaName}</span>
                                        </span>
                                        {msg.mediaSize && (
                                          <span className="text-neutral-400 shrink-0 ml-2">
                                            {(msg.mediaSize / (1024 * 1024)).toFixed(1)} MB
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="relative group/media cursor-pointer rounded overflow-hidden border border-black bg-black">
                                    <img
                                      src={msg.mediaUrl}
                                      alt={msg.mediaName || 'Uploaded photo'}
                                      onClick={() => setPreviewModalMedia({ type: 'image', url: msg.mediaUrl!, name: msg.mediaName })}
                                      className="w-full max-h-72 object-cover hover:scale-102 transition-transform duration-200"
                                    />
                                    <div
                                      onClick={() => setPreviewModalMedia({ type: 'image', url: msg.mediaUrl!, name: msg.mediaName })}
                                      className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 flex items-center justify-center transition-opacity text-white font-black text-xs uppercase gap-1"
                                    >
                                      <Maximize2 className="w-4 h-4" />
                                      <span>বড় করে দেখুন</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                          </div>
                        )}

                        {/* Messenger Reactions overlapping bubble badge */}
                        {Object.keys(msg.reactions || {}).length > 0 && (
                          <div
                            className={`absolute -bottom-2.5 ${
                              isMe ? 'right-2' : 'left-2'
                            } bg-white border border-black rounded-full px-1.5 py-0.2 text-[10px] font-black flex items-center gap-0.5 shadow-[1px_1px_0px_0px_#000] z-10 cursor-pointer`}
                          >
                            {Object.entries(msg.reactions).map(([emoji, userList]) => (
                              <span key={emoji} title={`${emoji} by ${userList.join(', ')}`}>
                                {emoji} {userList.length > 1 && userList.length}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timestamp & Status tick */}
                    <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-neutral-400 px-1">
                      <span>{msg.timestamp}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-[#0084FF]" />}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Tactical Tag Suggestions Drawer */}
          {showTacticalDrawer && (
            <div className="bg-[#FFFEEA] border-t-2 border-black p-2.5 text-xs font-bold animate-fadeIn space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-black flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#0084FF]" />
                  <span>TACTICAL & MATCH DIRECTIVES:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowTacticalDrawer(false)}
                  className="text-neutral-500 hover:text-black font-black"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  '⚡ URGENT MATCH ALERT',
                  '🎯 STARTING XI BRIEFING',
                  '🛡️ DEFENSIVE FORMATION',
                  '👟 BRING BOTH HOME & AWAY KITS',
                  '⏰ 45 MIN PRE-MATCH MEETUP'
                ].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setTacticalTag(tag);
                      setShowTacticalDrawer(false);
                      inputRef.current?.focus();
                    }}
                    className={`text-[10px] font-black px-2 py-1 border border-black uppercase transition-colors cursor-pointer ${
                      tacticalTag === tag ? 'bg-black text-[#FFE600]' : 'bg-white hover:bg-neutral-100 text-black'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {currentUser.isAdmin && (
                <div className="pt-1 flex items-center gap-2">
                  <label className="text-[10px] font-black uppercase text-black flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnnouncement}
                      onChange={e => setIsAnnouncement(e.target.checked)}
                      className="accent-[#FF4500]"
                    />
                    <span>📢 PIN THIS AS OFFICIAL SQUAD ANNOUNCEMENT</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Quick Emoji Popover */}
          {showEmojiPicker && (
            <div className="bg-white border-t-2 border-black p-2.5 grid grid-cols-8 gap-2 animate-fadeIn">
              {['⚽', '🔥', '👍', '❤️', '😂', '👏', '🏆', '🧤', '💯', '🏃', '🎯', '⚡', '💪', '🤝', '⏰', '🎉'].map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setInputText(prev => prev + emoji);
                    inputRef.current?.focus();
                  }}
                  className="text-xl p-1 hover:scale-125 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* ========================================================
              MESSENGER BOTTOM INPUT BAR (STICKY, PILL-SHAPED)
             ======================================================== */}
          <div className="shrink-0 bg-white border-t-2 sm:border-t-3 border-black p-2 sm:p-2.5">
            {/* Selected Media Preview Tray */}
            {selectedMedia && (
              <div className="mb-2 bg-[#FFFEEA] border-2 border-black p-2 flex items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#000] animate-fadeIn">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {selectedMedia.type === 'image' ? (
                    <img
                      src={selectedMedia.url}
                      alt={selectedMedia.name}
                      className="w-12 h-12 object-cover border-2 border-black shadow-[1px_1px_0px_0px_#000] shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-black text-[#FFE600] border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_0px_#000] shrink-0">
                      <Film className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase bg-[#0084FF] text-white px-1.5 py-0.5 border border-black inline-block">
                      {selectedMedia.type === 'video' ? '🎥 ভিডিও সিলেক্টেড' : '📷 ছবি সিলেক্টেড'}
                    </span>
                    <p className="text-xs font-black text-black truncate mt-0.5">{selectedMedia.name}</p>
                    <span className="text-[10px] font-bold text-neutral-500">
                      {(selectedMedia.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMedia(null)}
                  className="w-7 h-7 bg-white text-black hover:bg-[#D71920] hover:text-white border-2 border-black flex items-center justify-center font-black shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                  title="Remove media"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5 sm:gap-2"
            >
              {/* Hidden file input for Photo / Video attachment */}
              <input
                ref={mediaFileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleMediaFileSelect}
              />

              {/* Left Action Buttons (Plus menu, Photos, Videos, Mic) */}
              <button
                type="button"
                onClick={() => setShowTacticalDrawer(!showTacticalDrawer)}
                className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-[1px_1px_0px_0px_#000] ${
                  showTacticalDrawer ? 'bg-black text-[#FFE600]' : 'bg-neutral-100 hover:bg-neutral-200 text-black'
                }`}
                title="Tactical tags and announcement directives"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => mediaFileInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-blue-100 text-black border-2 border-black flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-[1px_1px_0px_0px_#000]"
                title="ছবি আপলোড করুন (Upload Photo)"
              >
                <Camera className="w-4 h-4 text-[#0084FF]" />
              </button>

              <button
                type="button"
                onClick={() => mediaFileInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-red-100 text-black border-2 border-black flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-[1px_1px_0px_0px_#000]"
                title="ভিডিও আপলোড করুন (Upload Video)"
              >
                <Video className="w-4 h-4 text-[#D71920]" />
              </button>

              <button
                type="button"
                onClick={handleSendVoiceNote}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-black border-2 border-black flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-[1px_1px_0px_0px_#000]"
                title="Send Voice Note"
              >
                <Mic className="w-4 h-4 text-neutral-600" />
              </button>

              {/* Pill-shaped Messenger Text Input Container */}
              <div className="flex-1 relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={selectedMedia ? "ক্যাপশন লিখুন (ঐচ্ছিক)..." : "Type a message (Aa)..."}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="w-full bg-[#F0F2F5] rounded-full border-2 border-black pl-3.5 pr-9 py-2 text-xs sm:text-sm font-medium text-black focus:outline-none focus:bg-white shadow-[1px_1px_0px_0px_#000]"
                />

                {/* Emoji toggle inside input pill */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-2.5 text-neutral-500 hover:text-black cursor-pointer"
                  title="Insert emoji"
                >
                  <Smile className="w-4 h-4 text-[#0084FF]" />
                </button>
              </div>

              {/* Right Action: Messenger Thumbs Up or Blue Send Button */}
              {inputText.trim().length > 0 || selectedMedia ? (
                <button
                  type="submit"
                  className="w-9 h-9 rounded-full bg-[#0084FF] hover:bg-blue-600 text-white border-2 border-black flex items-center justify-center transition-transform active:scale-95 shrink-0 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickLike}
                  className="w-9 h-9 rounded-full bg-white hover:bg-blue-50 text-[#0084FF] border-2 border-black flex items-center justify-center transition-transform active:scale-125 shrink-0 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                  title="Send Thumbs Up (👍)"
                >
                  <ThumbsUp className="w-4 h-4 fill-[#0084FF]" />
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ========================================================
          CALL MODAL SIMULATION (AUDIO / VIDEO ROOM)
         ======================================================== */}
      {callModalType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-4 border-black w-full max-w-sm shadow-[8px_8px_0px_0px_#000] p-5 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#0084FF] text-white border-3 border-black mx-auto flex items-center justify-center shadow-[3px_3px_0px_0px_#000] animate-pulse">
              {callModalType === 'audio' ? <Phone className="w-8 h-8" /> : <Video className="w-8 h-8" />}
            </div>

            <div>
              <h4 className="text-base font-black uppercase text-black">
                {callModalType === 'audio' ? 'TACTICAL AUDIO BRIEFING' : 'TACTICAL VIDEO ROOM'}
              </h4>
              <p className="text-xs font-bold text-neutral-600 mt-1 uppercase">
                Calling all members of {activeGroup.name}...
              </p>
            </div>

            <div className="bg-[#F0F2F5] border-2 border-black p-3 text-xs font-bold text-neutral-700">
              <span>🟢 Live encrypted channel • {activeGroup.memberIds.length} connected</span>
            </div>

            <button
              type="button"
              onClick={() => setCallModalType(null)}
              className="w-full bg-[#D71920] hover:bg-red-700 text-white border-2 border-black py-2.5 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] active:scale-95 cursor-pointer"
            >
              END CALL
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          CREATE NEW GROUP MODAL
         ======================================================== */}
      {isCreatingGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-4 border-black w-full max-w-md shadow-[8px_8px_0px_0px_#000] overflow-hidden">
            <div className="bg-[#0084FF] text-white p-3.5 border-b-3 border-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-white" />
                <h4 className="font-black uppercase text-sm text-white">CREATE SQUAD CHAT GROUP</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingGroup(false)}
                className="w-7 h-7 bg-white text-black border-2 border-black flex items-center justify-center hover:bg-[#D71920] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Forwards & Finishing Drills"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full bg-[#F0F2F5] border-2 border-black p-2 text-xs font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Description / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Attackers tactical room for upcoming derby"
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  className="w-full bg-[#F0F2F5] border-2 border-black p-2 text-xs font-bold focus:bg-white focus:outline-none"
                />
              </div>

              {/* Members Selection */}
              <div>
                <label className="block text-xs font-black uppercase mb-1">Select Squad Members</label>
                <div className="max-h-36 overflow-y-auto border-2 border-black p-2 bg-[#F6F7FA] space-y-1">
                  {players.map(p => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer hover:bg-white p-1"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(p.id)}
                        onChange={() => toggleMemberSelection(p.id)}
                        className="accent-[#0084FF]"
                      />
                      <span>#{p.number} {p.name} ({p.position})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingGroup(false)}
                  className="px-3 py-1.5 border-2 border-black font-black text-xs uppercase hover:bg-neutral-100"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#22C55E] hover:bg-green-500 text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:scale-95"
                >
                  CREATE GROUP ↵
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {deleteConfirmGroup && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-4 border-black p-5 sm:p-6 max-w-md w-full shadow-[8px_8px_0px_0px_#000]">
            <div className="flex items-center gap-2 text-[#D71920] mb-3">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="font-black text-base uppercase text-black">
                গ্রুপ ডিলিট নিশ্চিতকরণ (DELETE GROUP)
              </h3>
            </div>

            <p className="text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed mb-4">
              আপনি কি নিশ্চিত যে আপনি <span className="text-[#D71920] font-black">"{deleteConfirmGroup.name}"</span> গ্রুপটি চিরতরে মুছে ফেলতে চান?
              <br />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                ⚠️ এই গ্রুপের সমস্ত মেসেজ ও মিডিয়া হিস্ট্রি স্থায়ীভাবে ডিলিট হয়ে যাবে।
              </span>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black/10">
              <button
                type="button"
                onClick={() => setDeleteConfirmGroup(null)}
                className="px-4 py-2 border-2 border-black text-xs font-black uppercase hover:bg-neutral-100 cursor-pointer"
              >
                বাতিল (CANCEL)
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteGroup}
                className="px-4 py-2 bg-[#D71920] hover:bg-red-700 text-white border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>হ্যাঁ, ডিলিট করুন (DELETE)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset All Chats Confirmation Modal (Admin Only) */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-4 border-black p-5 sm:p-6 max-w-md w-full shadow-[8px_8px_0px_0px_#000]">
            <div className="flex items-center gap-2 text-[#D71920] mb-3">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <h3 className="font-black text-base uppercase text-black">
                সব চ্যাট রিসেট (RESET ALL CHATS)
              </h3>
            </div>

            <div className="bg-[#FFF1F2] border-2 border-[#D71920] p-3 text-xs font-bold text-[#D71920] mb-4 space-y-1">
              <div className="flex items-center gap-1.5 font-black uppercase">
                <ShieldAlert className="w-4 h-4" />
                <span>সতর্কতা: ক্লাবের সম্পূর্ণ চ্যাট মুছে যাবে</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                এটি ক্লাবের মেম্বারদের তৈরি সব কাস্টম গ্রুপ এবং সমস্ত চ্যাট মেসেজ হিস্ট্রি মুছে দিয়ে ৩টি অফিশিয়াল ক্লাব চ্যানেলকে ফ্যাক্টরি ডিফল্ট অবস্থায় ফিরিয়ে আনবে।
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black/10">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 border-2 border-black text-xs font-black uppercase hover:bg-neutral-100 cursor-pointer"
              >
                বাতিল (CANCEL)
              </button>
              <button
                type="button"
                onClick={handleExecuteResetAllChats}
                className="px-4 py-2 bg-[#D71920] hover:bg-red-700 text-white border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>হ্যাঁ, সব রিসেট করুন (RESET ALL)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Lightbox Fullscreen Modal */}
      {previewModalMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative max-w-4xl max-h-[90vh] bg-black border-4 border-white shadow-[10px_10px_0px_0px_#FFE600] flex flex-col items-center justify-center p-2">
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between pb-2 px-2 text-white">
              <span className="text-xs font-mono font-bold text-neutral-300 truncate max-w-md">
                {previewModalMedia.name || 'Media Asset'}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewModalMedia.url}
                  download={previewModalMedia.name || 'chat_media'}
                  className="bg-[#FFE600] hover:bg-yellow-400 text-black border border-black px-2.5 py-1 text-xs font-black uppercase flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ডাউনলোড</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalMedia(null)}
                  className="bg-[#D71920] hover:bg-red-700 text-white border border-white px-2.5 py-1 text-xs font-black uppercase cursor-pointer"
                >
                  ✕ বন্ধ করুন
                </button>
              </div>
            </div>

            {/* Media Body */}
            {previewModalMedia.type === 'video' ? (
              <video
                src={previewModalMedia.url}
                controls
                autoPlay
                className="max-h-[75vh] max-w-full object-contain"
              />
            ) : (
              <img
                src={previewModalMedia.url}
                alt={previewModalMedia.name || 'Full view'}
                className="max-h-[75vh] max-w-full object-contain"
              />
            )}
          </div>
        </div>
      )}

      {/* Action Notice Toast */}
      {actionNotice && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-short">
          <div
            className={`border-3 border-black p-3.5 text-xs font-black uppercase shadow-[4px_4px_0px_0px_#000] flex items-center gap-2 ${
              actionNotice.type === 'success'
                ? 'bg-[#22C55E] text-black'
                : 'bg-[#D71920] text-white'
            }`}
          >
            <span>{actionNotice.text}</span>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="ml-2 bg-black text-white hover:bg-neutral-800 w-5 h-5 flex items-center justify-center text-xs font-black cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
