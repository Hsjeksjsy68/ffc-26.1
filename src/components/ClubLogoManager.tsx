import React, { useState, useRef } from 'react';
import { useClub } from '../context/ClubContext';
import { FlamehunterLogo } from './FlamehunterLogo';
import { Upload, Link, Check, RotateCcw, AlertTriangle, Shield, Sparkles, Image as ImageIcon, Eye, Trash2 } from 'lucide-react';

export const ClubLogoManager: React.FC = () => {
  const { clubLogo, updateClubLogo, resetClubLogo, currentUser, setCurrentUser, availableUsers, isUserAdmin, canChangeLogo } = useClub();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTab, setSelectedTab] = useState<'upload' | 'url' | 'presets'>('upload');
  
  // Pending changes state for live preview before saving
  const [pendingType, setPendingType] = useState<'vector' | 'custom' | 'image'>(clubLogo.type);
  const [pendingUrl, setPendingUrl] = useState<string>(clubLogo.customUrl || '');
  const [pendingFileName, setPendingFileName] = useState<string>(clubLogo.customFileName || '');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successNotification, setSuccessNotification] = useState(false);

  const isAdmin = isUserAdmin || canChangeLogo;

  // Handle local image file upload
  const handleFileChange = (file: File) => {
    setErrorMessage('');
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    // Limit size to ~5MB to avoid localStorage overflow
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size is too large (max 5MB). Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        // Compress/resize slightly if image is very large
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedUrl = canvas.toDataURL('image/png', 0.9);
              setPendingType('custom');
              setPendingUrl(compressedUrl);
              setPendingFileName(file.name);
              return;
            }
          }
          setPendingType('custom');
          setPendingUrl(result);
          setPendingFileName(file.name);
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isAdmin) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    setErrorMessage('');
    if (!urlInput.trim()) {
      setErrorMessage('Please enter an image URL.');
      return;
    }
    setPendingType('custom');
    setPendingUrl(urlInput.trim());
    setPendingFileName('Web Image Link');
  };

  const handleSaveLogo = () => {
    if (!isAdmin) return;
    updateClubLogo({
      type: pendingType,
      customUrl: pendingUrl,
      customFileName: pendingFileName
    });
    setSuccessNotification(true);
    setTimeout(() => setSuccessNotification(false), 3500);
  };

  const handleResetToDefault = () => {
    if (!isAdmin) return;
    resetClubLogo();
    setPendingType('vector');
    setPendingUrl('');
    setPendingFileName('');
    setUrlInput('');
    setSuccessNotification(true);
    setTimeout(() => setSuccessNotification(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border-3 border-black p-4 sm:p-5 shadow-[4px_4px_0px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#D71920] border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_0px_#000]">
            <Shield className="w-6 h-6 text-[#FFE600]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black uppercase tracking-tight text-black">
                CLUB LOGO & OFFICIAL CREST STUDIO
              </h3>
              <span className="bg-[#0066B2] text-white text-[10px] font-black px-2 py-0.5 border border-black uppercase">
                ADMIN LEVEL
              </span>
            </div>
            <p className="text-xs font-bold text-neutral-600 uppercase mt-0.5">
              CUSTOMIZE THE EMBLEM SHOWN ON THE HEADER, PLAYER CARDS, MATCHDAYS & PITCH
            </p>
          </div>
        </div>

        {/* Current User Admin Indicator */}
        <div className="flex items-center gap-2 bg-[#F6F5EE] border-2 border-black p-2 text-xs">
          <span className="font-bold text-neutral-600 uppercase">ACCESS:</span>
          {isAdmin ? (
            <span className="bg-[#22C55E] text-black font-black px-2 py-0.5 border border-black flex items-center gap-1">
              <Check className="w-3 h-3" /> AUTHORIZED ADMIN ({currentUser.name})
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="bg-[#FF4500] text-white font-black px-2 py-0.5 border border-black flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> READ ONLY ({currentUser.name})
              </span>
              <button
                onClick={() => {
                  const coach = availableUsers.find(u => u.isAdmin);
                  if (coach) setCurrentUser(coach);
                }}
                className="bg-[#FFE600] text-black font-black px-2 py-0.5 border border-black hover:bg-black hover:text-white transition-all uppercase text-[10px]"
              >
                SWITCH TO ADMIN
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {successNotification && (
        <div className="bg-[#22C55E] border-3 border-black p-3.5 text-black font-black uppercase text-xs sm:text-sm shadow-[4px_4px_0px_0px_#000] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 bg-black text-white p-0.5" />
            <span>FLAMEHUNTER FC CREST UPDATED GLOBALLY ACROSS ALL SQUAD INTERFACES!</span>
          </div>
          <button
            onClick={() => setSuccessNotification(false)}
            className="text-black font-black text-xs hover:underline"
          >
            DISMISS ✕
          </button>
        </div>
      )}

      {/* Main Grid: Left is Logo Customizer, Right is Live Multi-Size Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000] space-y-4">
            
            {/* Method Selection Tabs */}
            <div className="flex items-center gap-2 border-b-2 border-black pb-3">
              <button
                id="tab-logo-upload"
                onClick={() => setSelectedTab('upload')}
                className={`px-3 py-2 border-2 border-black text-xs font-black uppercase flex items-center gap-1.5 transition-all ${
                  selectedTab === 'upload'
                    ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]'
                    : 'bg-[#F6F5EE] text-black hover:bg-neutral-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>UPLOAD FILE</span>
              </button>
              <button
                id="tab-logo-url"
                onClick={() => setSelectedTab('url')}
                className={`px-3 py-2 border-2 border-black text-xs font-black uppercase flex items-center gap-1.5 transition-all ${
                  selectedTab === 'url'
                    ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]'
                    : 'bg-[#F6F5EE] text-black hover:bg-neutral-200'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                <span>IMAGE URL</span>
              </button>
              <button
                id="tab-logo-presets"
                onClick={() => setSelectedTab('presets')}
                className={`px-3 py-2 border-2 border-black text-xs font-black uppercase flex items-center gap-1.5 transition-all ${
                  selectedTab === 'presets'
                    ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]'
                    : 'bg-[#F6F5EE] text-black hover:bg-neutral-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>CLUB PRESETS</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-[#FF4500] text-white p-2.5 border-2 border-black text-xs font-black uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Tab 1: Drag & Drop File Upload */}
            {selectedTab === 'upload' && (
              <div className="space-y-3">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (isAdmin) setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (isAdmin && fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className={`border-3 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#0066B2] bg-blue-50 scale-[1.01]'
                      : 'border-black bg-[#F6F5EE] hover:bg-yellow-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                      <Upload className="w-6 h-6 text-black" />
                    </div>
                    <span className="text-sm font-black uppercase text-black">
                      DRAG & DROP CLUB LOGO HERE
                    </span>
                    <span className="text-xs font-bold text-neutral-600 uppercase">
                      OR CLICK TO BROWSE FILES (PNG, JPG, SVG, WEBP UP TO 5MB)
                    </span>
                  </div>
                </div>

                {pendingFileName && pendingType === 'custom' && (
                  <div className="bg-[#FFE600] border-2 border-black p-2.5 flex items-center justify-between text-xs font-black uppercase">
                    <span className="truncate">SELECTED FILE: {pendingFileName}</span>
                    <button
                      onClick={() => {
                        setPendingType(clubLogo.type);
                        setPendingUrl(clubLogo.customUrl || '');
                        setPendingFileName('');
                      }}
                      className="text-black hover:text-red-700 font-black"
                    >
                      CLEAR
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: URL Input */}
            {selectedTab === 'url' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    ENTER DIRECT IMAGE URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 bg-[#F6F5EE] border-2 border-black p-2 text-xs font-bold focus:outline-none focus:bg-white"
                    />
                    <button
                      onClick={handleApplyUrl}
                      className="bg-[#0066B2] text-white border-2 border-black px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] hover:bg-blue-700 active:translate-x-0.5 active:translate-y-0.5"
                    >
                      PREVIEW
                    </button>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-neutral-600 uppercase">
                  💡 Tip: Use a square or circular transparent PNG or high-res JPG for the best appearance on jerseys and match cards.
                </p>
              </div>
            )}

            {/* Tab 3: Presets */}
            {selectedTab === 'presets' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => {
                    setPendingType('vector');
                    setPendingUrl('');
                    setPendingFileName('Official Vector Crest');
                  }}
                  className={`border-3 border-black p-3 cursor-pointer transition-all flex items-center gap-3 ${
                    pendingType === 'vector' ? 'bg-[#FFE600] shadow-[3px_3px_0px_0px_#000]' : 'bg-[#F6F5EE] hover:bg-white'
                  }`}
                >
                  <FlamehunterLogo size="md" overrideType="vector" />
                  <div>
                    <span className="font-black uppercase text-xs block text-black">
                      OFFICIAL VECTOR CREST
                    </span>
                    <span className="text-[10px] font-bold text-neutral-600 uppercase">
                      Eagle Emblem • XXMMII • Crimson & Blue
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setPendingType('image');
                    setPendingUrl('/flamehunter_fc_logo.jpg');
                    setPendingFileName('High-Res Crest Photo');
                  }}
                  className={`border-3 border-black p-3 cursor-pointer transition-all flex items-center gap-3 ${
                    pendingType === 'image' ? 'bg-[#FFE600] shadow-[3px_3px_0px_0px_#000]' : 'bg-[#F6F5EE] hover:bg-white'
                  }`}
                >
                  <FlamehunterLogo size="md" overrideType="image" />
                  <div>
                    <span className="font-black uppercase text-xs block text-black">
                      PHOTO CREST GRAPHIC
                    </span>
                    <span className="text-[10px] font-bold text-neutral-600 uppercase">
                      Circular High-Res Matchday Badge
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t-2 border-black flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleResetToDefault}
                disabled={!isAdmin}
                className="flex items-center gap-1.5 bg-[#F6F5EE] hover:bg-neutral-200 disabled:opacity-50 text-black border-2 border-black px-3.5 py-2 text-xs font-black uppercase transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESTORE FACTORY CREST</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="save-club-logo-btn"
                  onClick={handleSaveLogo}
                  disabled={!isAdmin}
                  className="flex items-center gap-2 bg-[#D71920] hover:bg-[#b5141a] disabled:opacity-50 text-white border-2 border-black px-5 py-2.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>APPLY & SAVE CLUB LOGO</span>
                </button>
              </div>
            </div>

            {!isAdmin && (
              <div className="bg-yellow-50 border-2 border-black p-2.5 text-xs font-bold text-neutral-800 uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D71920] shrink-0" />
                <span>Club branding is restricted to Club President / Admin. Switch to Admin in the top-right persona bar to modify and save official logos.</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Multi-Size Context Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-black" />
                <h4 className="text-xs font-black uppercase text-black">
                  LIVE MULTI-CONTEXT PREVIEW
                </h4>
              </div>
              <span className="text-[10px] font-black uppercase bg-[#0066B2] text-white px-1.5 py-0.5 border border-black">
                {pendingType === 'custom' ? 'CUSTOM UPLOAD' : pendingType === 'image' ? 'PHOTO BADGE' : 'VECTOR EMBLEM'}
              </span>
            </div>

            {/* Primary Large Crest Display */}
            <div className="bg-[#0066B2] p-6 border-3 border-black flex flex-col items-center justify-center text-white relative shadow-[inset_0_0_0_2px_#000]">
              <div className="mb-3 transform hover:scale-105 transition-transform">
                <FlamehunterLogo
                  size="2xl"
                  withShadow
                  overrideType={pendingType}
                  overrideUrl={pendingUrl}
                />
              </div>
              <div className="text-center">
                <div className="text-lg font-black uppercase tracking-wider text-white">
                  FLAMEHUNTER FC
                </div>
                <div className="text-[10px] font-black uppercase text-[#FFE600] tracking-widest mt-0.5">
                  VICTORIA PER IGNEM • EST. 2002
                </div>
              </div>
            </div>

            {/* Application Context Renders */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-neutral-600 block">
                HOW IT WILL APPEAR IN APP MODULES:
              </span>

              {/* 1. Header Simulation */}
              <div className="bg-[#F6F7FA] border-2 border-black p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FlamehunterLogo
                    size="sm"
                    overrideType={pendingType}
                    overrideUrl={pendingUrl}
                  />
                  <div>
                    <div className="text-xs font-black uppercase text-black leading-tight">
                      FLAMEHUNTER <span className="text-[#D71920]">FC</span>
                    </div>
                    <div className="text-[9px] font-bold text-neutral-600 uppercase">
                      HEADER NAVIGATION BAR
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase bg-[#FFE600] text-black px-1.5 py-0.5 border border-black">
                  NAV BAR
                </span>
              </div>

              {/* 2. Next Matchday Hero Simulation */}
              <div className="bg-[#D71920] border-2 border-black p-2.5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <FlamehunterLogo
                    size="sm"
                    withShadow
                    overrideType={pendingType}
                    overrideUrl={pendingUrl}
                  />
                  <div>
                    <div className="text-xs font-black uppercase tracking-tight leading-tight">
                      VS METRO TITANS
                    </div>
                    <div className="text-[9px] font-bold text-yellow-100 uppercase">
                      MATCHDAY FIXTURE BANNER
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase bg-black text-[#FFE600] px-1.5 py-0.5 border border-black">
                  MATCHDAY
                </span>
              </div>

              {/* 3. Player Card Badge Simulation */}
              <div className="bg-white border-2 border-black p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-9 h-9 bg-[#0066B2] border-2 border-black text-white font-black text-xs flex items-center justify-center">
                      #10
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <FlamehunterLogo
                        size="xs"
                        overrideType={pendingType}
                        overrideUrl={pendingUrl}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase text-black leading-tight">
                      MARCUS VANCE
                    </div>
                    <div className="text-[9px] font-bold text-neutral-600 uppercase">
                      SQUAD DOSSIER CREST BADGE
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase bg-[#F6F5EE] text-black px-1.5 py-0.5 border border-black">
                  ROSTER
                </span>
              </div>
            </div>

            {/* Logo Metadata Box */}
            <div className="bg-[#F6F5EE] border-2 border-black p-3 text-[11px] font-bold text-neutral-700 space-y-1">
              <div className="flex justify-between">
                <span className="uppercase text-neutral-500">CURRENT STATUS:</span>
                <span className="font-black uppercase text-black">
                  {clubLogo.type === 'custom' ? 'CUSTOM LOGO' : clubLogo.type === 'image' ? 'PHOTO GRAPHIC' : 'VECTOR CREST'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase text-neutral-500">LAST MODIFIED:</span>
                <span className="font-black text-black">
                  {clubLogo.lastUpdated ? new Date(clubLogo.lastUpdated).toLocaleDateString() : 'INITIAL BUILD'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
