import React, { useState, useRef, useEffect } from 'react';
import { useClub } from '../context/ClubContext';
import { ChatGroup, ChatMessage } from '../types';
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
  X,
  Smartphone
} from 'lucide-react';

export const ChatAndGroupsView: React.FC = () => {
  const {
    chatGroups,
    chatMessages,
    createChatGroup,
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
  const [activeTab, setActiveTab] = useState<'groups' | 'direct'>('groups');
  const [selectedDmPlayerId, setSelectedDmPlayerId] = useState<string | null>(null);

  // New Group Form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('Flame');
  const [newGroupColor, setNewGroupColor] = useState('#FF4500');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeGroup = chatGroups.find(g => g.id === activeGroupId);
  const activeMessages = chatMessages.filter(m => m.groupId === activeGroupId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeGroupId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendChatMessage(activeGroupId, inputText.trim(), {
      isAnnouncement: isAnnouncement && (currentUser.isAdmin || currentUser.role.includes('Captain')),
      tacticalTag: tacticalTag || undefined
    });

    setInputText('');
    setIsAnnouncement(false);
    setTacticalTag('');
  };

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
  };

  const toggleMemberSelection = (playerId: string) => {
    setSelectedMembers(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
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

  // Start Direct Message with a Player
  const startDmWithPlayer = (player: typeof players[0]) => {
    // Check if DM group already exists
    const existingDm = chatGroups.find(g =>
      g.isDirectMessage && g.memberIds.includes(player.id) && g.memberIds.includes(currentUser.id)
    );

    if (existingDm) {
      setActiveGroupId(existingDm.id);
    } else {
      const newDm = createChatGroup(
        `💬 ${player.name} & ${currentUser.name}`,
        `Direct message chat between ${player.name} and ${currentUser.name}`,
        [currentUser.id, player.id],
        'MessageSquare',
        player.avatarBg
      );
      // Mark as DM
      newDm.isDirectMessage = true;
      setActiveGroupId(newDm.id);
    }
    setActiveTab('groups');
  };

  return (
    <div className="space-y-3">
      {/* Mobile Channel Quick Selector Chips (Horizontal Swiper for Phones) */}
      <div className="lg:hidden bg-white border-2 border-black p-2 flex items-center gap-1.5 overflow-x-auto shadow-[2px_2px_0px_0px_#000]">
        <button
          type="button"
          onClick={() => setIsCreatingGroup(true)}
          className="bg-[#22C55E] text-black border border-black px-2 py-1 text-[10px] font-black uppercase shrink-0 flex items-center gap-1 shadow-[1px_1px_0px_0px_#000] cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>NEW</span>
        </button>
        {chatGroups.map(group => {
          const isActive = group.id === activeGroupId;
          return (
            <button
              key={group.id}
              onClick={() => setActiveGroupId(group.id)}
              className={`px-2.5 py-1 text-[10px] font-black uppercase whitespace-nowrap border border-black shrink-0 flex items-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-black text-[#FFE600] shadow-[1px_1px_0px_0px_#FFE600]'
                  : 'bg-[#F6F5EE] text-black hover:bg-neutral-200'
              }`}
            >
              <span>{group.name}</span>
            </button>
          );
        })}
      </div>

      {/* Neo-Brutalist Layout: Channels List + Chat Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-230px)] min-h-[500px] lg:h-[720px]">
        
        {/* Left Sidebar: Groups & Direct Messages (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-4 bg-white border-3 border-black p-3.5 shadow-[4px_4px_0px_0px_#000] flex-col justify-between">
          <div>
            {/* Header + Create Group Button */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#FFE600] border-2 border-black flex items-center justify-center font-black">
                  💬
                </div>
                <h3 className="font-black uppercase text-sm text-black">COMMUNICATIONS</h3>
              </div>

              <button
                id="create-group-btn"
                onClick={() => setIsCreatingGroup(true)}
                className="bg-[#22C55E] hover:bg-[#16a34a] text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1"
                title="Create a new Squad Group"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>NEW GROUP</span>
              </button>
            </div>

            {/* Sub-tabs: Squad Channels vs Direct Messages */}
            <div className="grid grid-cols-2 gap-1 my-3 bg-[#F6F5EE] p-1 border-2 border-black">
              <button
                onClick={() => setActiveTab('groups')}
                className={`py-1 text-xs font-black uppercase transition-all ${
                  activeTab === 'groups' ? 'bg-black text-[#FFE600]' : 'text-black hover:bg-white'
                }`}
              >
                SQUAD GROUPS ({chatGroups.length})
              </button>
              <button
                onClick={() => setActiveTab('direct')}
                className={`py-1 text-xs font-black uppercase transition-all ${
                  activeTab === 'direct' ? 'bg-black text-[#FFE600]' : 'text-black hover:bg-white'
                }`}
              >
                1-ON-1 PLAYERS
              </button>
            </div>

            {/* Group Channel List */}
            {activeTab === 'groups' ? (
              <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                {chatGroups.map(group => {
                  const isActive = group.id === activeGroupId;
                  return (
                    <button
                      key={group.id}
                      id={`group-item-${group.id}`}
                      onClick={() => setActiveGroupId(group.id)}
                      className={`w-full text-left p-2.5 border-2 border-black transition-all flex items-start gap-2.5 ${
                        isActive
                          ? 'bg-[#FFE600] shadow-[3px_3px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                          : 'bg-[#F6F5EE] hover:bg-white shadow-[2px_2px_0px_0px_#000]'
                      }`}
                    >
                      <div
                        className="w-8 h-8 border-2 border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_#000]"
                        style={{ backgroundColor: group.accentColor, color: '#000' }}
                      >
                        {getGroupIcon(group.icon)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-black truncate">
                            {group.name}
                          </span>
                          {group.isChannel && (
                            <span className="text-[9px] bg-black text-white px-1 font-black">
                              ALL
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-neutral-600 truncate mt-0.5">
                          {group.description}
                        </p>
                        <span className="text-[10px] font-black text-neutral-800 flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3" />
                          {group.memberIds.length} SQUAD MEMBERS
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Direct Message Squad List */
              <div className="space-y-1.5 overflow-y-auto max-h-[500px] pr-1">
                <p className="text-[11px] font-bold text-neutral-600 mb-2 uppercase">
                  Select a player to open direct chat:
                </p>
                {players.map(p => (
                  <button
                    key={p.id}
                    onClick={() => startDmWithPlayer(p)}
                    className="w-full text-left p-2 bg-[#F6F5EE] hover:bg-[#FFE600] border-2 border-black flex items-center justify-between transition-colors shadow-[2px_2px_0px_0px_#000]"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 border-2 border-black font-black text-xs flex items-center justify-center text-white"
                        style={{ backgroundColor: p.avatarBg }}
                      >
                        #{p.number}
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase text-black">{p.name}</div>
                        <div className="text-[10px] font-bold text-neutral-600 uppercase">
                          {p.position} • {p.role}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-white border border-black px-1.5 py-0.5">
                      CHAT
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Status Footer */}
          <div className="border-t-2 border-black pt-2 mt-2 bg-[#F6F5EE] p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 border border-black rounded-none bg-[#22C55E]"
                title="Online & Ready"
              />
              <span className="text-[11px] font-black uppercase text-black">
                {currentUser.name}
              </span>
            </div>
            <span className="text-[10px] font-bold text-neutral-600 uppercase">
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Right Pane: Active Group / Chat Box */}
        <div className="lg:col-span-8 bg-[#F6F5EE] border-3 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between overflow-hidden">
          
          {/* Active Chat Header */}
          {activeGroup && (
            <div className="bg-white border-b-3 border-black p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]"
                  style={{ backgroundColor: activeGroup.accentColor }}
                >
                  {getGroupIcon(activeGroup.icon)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black uppercase text-black">{activeGroup.name}</h4>
                    {activeGroup.isChannel && (
                      <span className="bg-[#FF4500] text-white text-[9px] font-black px-1.5 py-0.5 border border-black">
                        OFFICIAL SQUAD
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-neutral-600 truncate max-w-md">
                    {activeGroup.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openNotificationModal}
                  title="Configure notifications to your phone or send broadcast"
                  className="flex items-center gap-1.5 text-xs font-black uppercase bg-[#FFE600] hover:bg-black hover:text-[#FFE600] text-black border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_0px_#000] transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-black" />
                  <span className="hidden sm:inline">PHONE ALERT</span>
                </button>
                <div className="hidden sm:flex items-center gap-1 text-xs font-black uppercase bg-[#F6F5EE] border-2 border-black px-2 py-1">
                  <Users className="w-3.5 h-3.5 text-black" />
                  <span>{activeGroup.memberIds.length} IN ROOM</span>
                </div>
              </div>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {activeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white border-2 border-dashed border-black">
                <MessageSquare className="w-10 h-10 text-neutral-400 mb-2" />
                <h5 className="font-black uppercase text-base">NO MESSAGES IN THIS CHANNEL YET</h5>
                <p className="text-xs font-bold text-neutral-600 mt-1 max-w-sm">
                  Start the discussion! Share tactical notes, drill reminders, or pre-match encouragement.
                </p>
              </div>
            ) : (
              activeMessages.map(msg => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    id={`message-bubble-${msg.id}`}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {/* Official Announcement Banner */}
                    {msg.isAnnouncement && (
                      <div className="mb-1 flex items-center gap-1.5 bg-[#FF4500] text-white text-[10px] font-black px-2 py-0.5 border-2 border-black uppercase shadow-[2px_2px_0px_0px_#000]">
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

                    {/* Sender Label */}
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-xs font-black uppercase text-black">{msg.senderName}</span>
                      <span className="text-[10px] font-bold text-neutral-600 uppercase">
                        ({msg.senderRole}) • {msg.timestamp}
                      </span>
                    </div>

                    {/* Message Body */}
                    <div
                      className={`max-w-xl p-3 border-3 border-black text-xs font-bold leading-relaxed shadow-[3px_3px_0px_0px_#000] ${
                        msg.isAnnouncement
                          ? 'bg-[#FFFEEA] border-[#FF4500]'
                          : isMe
                          ? 'bg-[#FFE600] text-black'
                          : 'bg-white text-black'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {/* Reactions Bar */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {Object.entries(msg.reactions).map(([emoji, userList]) => (
                        <button
                          key={emoji}
                          onClick={() => reactToMessage(msg.id, emoji)}
                          className={`text-xs font-black px-2 py-0.5 border border-black flex items-center gap-1 transition-all ${
                            userList.includes(currentUser.name)
                              ? 'bg-black text-[#FFE600]'
                              : 'bg-white hover:bg-neutral-100 text-black'
                          }`}
                          title={`Reacted by: ${userList.join(', ')}`}
                        >
                          <span>{emoji}</span>
                          <span>{userList.length}</span>
                        </button>
                      ))}

                      {/* Quick Add Reaction Pills */}
                      <div className="opacity-70 hover:opacity-100 flex items-center gap-0.5 ml-1">
                        {['🔥', '⚽', '👏', '💯', '🛡️'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => reactToMessage(msg.id, emoji)}
                            className="bg-white hover:bg-[#FFE600] border border-black text-[11px] px-1 py-0.2"
                            title={`Add ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input & Tactical Shortcut Toolbar */}
          <div className="bg-white border-t-3 border-black p-3">
            {/* Quick Tactical Snippets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-[10px] font-black uppercase">
              <span className="text-neutral-500 shrink-0">QUICK NOTES:</span>
              <button
                type="button"
                onClick={() => setInputText('⚠️ Reminder: Arrive 45 mins early for tactical chalk-talk.')}
                className="bg-[#F6F5EE] hover:bg-[#FFE600] border border-black px-2 py-0.5 whitespace-nowrap"
              >
                ⏰ Arrival Notice
              </button>
              <button
                type="button"
                onClick={() => setInputText('🔥 High-press intensity from min 1. Win second balls!')}
                className="bg-[#F6F5EE] hover:bg-[#FFE600] border border-black px-2 py-0.5 whitespace-nowrap"
              >
                ⚡ High-Press Trigger
              </button>
              <button
                type="button"
                onClick={() => setInputText('🛡️ Backline: Stay compact, don’t step out without cover.')}
                className="bg-[#F6F5EE] hover:bg-[#FFE600] border border-black px-2 py-0.5 whitespace-nowrap"
              >
                🛡️ Defense Compactness
              </button>
              <button
                type="button"
                onClick={() => setInputText('🚗 Carpool update: Who needs a lift to the stadium?')}
                className="bg-[#F6F5EE] hover:bg-[#FFE600] border border-black px-2 py-0.5 whitespace-nowrap"
              >
                🚗 Carpool Ping
              </button>
            </div>

            {/* Input Bar Form */}
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`MESSAGE #${activeGroup?.name.toUpperCase() || 'CHANNEL'}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-[#F6F5EE] border-2 border-black p-2.5 text-xs font-bold focus:outline-none focus:bg-white"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-[#FF4500] hover:bg-[#e03d00] disabled:bg-neutral-300 disabled:cursor-not-allowed text-white border-2 border-black px-4 py-2.5 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">SEND</span>
                </button>
              </div>

              {/* Toggles for Official Announcement & Tactical Tag */}
              {(currentUser.isAdmin || currentUser.role.includes('Captain')) && (
                <div className="flex items-center justify-between text-xs font-bold pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnnouncement}
                      onChange={(e) => setIsAnnouncement(e.target.checked)}
                      className="accent-black w-4 h-4 border-2 border-black"
                    />
                    <span className="text-[11px] font-black uppercase text-black">
                      📢 PIN AS OFFICIAL SQUAD ANNOUNCEMENT
                    </span>
                  </label>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase text-neutral-500">TACTICAL TAG:</span>
                    <input
                      type="text"
                      placeholder="e.g. MATCHDAY ORDER"
                      value={tacticalTag}
                      onChange={(e) => setTacticalTag(e.target.value.toUpperCase())}
                      className="bg-[#F6F5EE] border border-black px-1.5 py-0.5 text-[10px] font-black uppercase w-32"
                    />
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Modal: Create Squad Group */}
      {isCreatingGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#F6F5EE] border-4 border-black w-full max-w-lg shadow-[8px_8px_0px_0px_#000] p-5 sm:p-6 my-8">
            <div className="flex items-center justify-between border-b-3 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-[#FFE600] p-1 border-2 border-black">
                  <Users className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-xl font-black uppercase text-black">CREATE NEW SQUAD GROUP</h3>
              </div>
              <button
                onClick={() => setIsCreatingGroup(false)}
                className="bg-white border-2 border-black p-1 hover:bg-[#FF4500] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. 🎯 Set Piece Specialists / 🏃 Sprints Crew"
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Group Description</label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Purpose of this group..."
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Icon Style</label>
                  <select
                    value={newGroupIcon}
                    onChange={(e) => setNewGroupIcon(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                  >
                    <option value="Flame">🔥 Flame</option>
                    <option value="Zap">⚡ Zap</option>
                    <option value="Shield">🛡️ Shield</option>
                    <option value="Car">🚗 Carpool</option>
                    <option value="Trophy">🏆 Trophy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Badge Accent Color</label>
                  <select
                    value={newGroupColor}
                    onChange={(e) => setNewGroupColor(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2 text-xs font-black"
                  >
                    <option value="#FF4500">Flame Orange (#FF4500)</option>
                    <option value="#FFE600">Volt Yellow (#FFE600)</option>
                    <option value="#22C55E">Lime Cyber (#22C55E)</option>
                    <option value="#00E5FF">Cyan (#00E5FF)</option>
                    <option value="#FF2A85">Hot Pink (#FF2A85)</option>
                  </select>
                </div>
              </div>

              {/* Pick Group Members */}
              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  Select Squad Members ({selectedMembers.length} selected)
                </label>
                <div className="bg-white border-2 border-black p-2 max-h-40 overflow-y-auto space-y-1">
                  {players.map(p => {
                    const isSelected = selectedMembers.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-1.5 border cursor-pointer text-xs font-bold transition-colors ${
                          isSelected ? 'bg-[#FFE600] border-black font-black' : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMemberSelection(p.id)}
                            className="accent-black w-4 h-4"
                          />
                          <span>
                            #{p.number} {p.name} ({p.position})
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-600 uppercase">{p.role}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t-2 border-black flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingGroup(false)}
                  className="bg-white border-2 border-black px-4 py-2 text-xs font-black uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-[#22C55E] text-black border-2 border-black px-5 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                >
                  CREATE SQUAD GROUP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
