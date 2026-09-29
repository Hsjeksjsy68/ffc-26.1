import React, { useContext } from 'react';
import { ClubContext } from '../context/ClubContext';

interface FlamehunterLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  variant?: 'badge' | 'crest' | 'icon' | 'image';
  withShadow?: boolean;
  useImage?: boolean;
  overrideType?: 'vector' | 'custom' | 'image';
  overrideUrl?: string;
}

export const FlamehunterLogo: React.FC<FlamehunterLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'crest',
  withShadow = false,
  useImage = false,
  overrideType,
  overrideUrl,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const clubContext = useContext(ClubContext);
  const clubLogo = clubContext?.clubLogo;

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24 sm:w-28 sm:h-28',
    '2xl': 'w-32 h-32 sm:w-36 sm:h-36',
    custom: '',
  };

  const shadowClass = withShadow ? 'shadow-[4px_4px_0px_0px_#000]' : '';

  // Determine which logo source to render
  const effectiveType = overrideType || (useImage ? 'image' : clubLogo?.type || 'vector');
  const effectiveCustomUrl = overrideUrl || clubLogo?.customUrl;

  // 1. Custom Uploaded Logo Image
  if (effectiveType === 'custom' && effectiveCustomUrl && !imageError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center flex-shrink-0 select-none rounded-full overflow-hidden border-3 border-black bg-white ${sizeClasses[size]} ${shadowClass} ${className}`}
        title="Flamehunter FC Club Crest • Custom Identity"
      >
        <img
          src={effectiveCustomUrl}
          alt="Flamehunter FC Club Crest"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // 2. High-Res Photo Crest
  if ((effectiveType === 'image' || variant === 'image') && !imageError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center flex-shrink-0 select-none rounded-full overflow-hidden border-3 border-black bg-[#0066B2] ${sizeClasses[size]} ${shadowClass} ${className}`}
        title="Flamehunter FC Crest • Victoria Per Ignem (Est. 2002 / XXMMII)"
      >
        <img
          src="/flamehunter_fc_logo.jpg"
          alt="Flamehunter FC Official Crest"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // 3. Official Vector SVG Crest (Always reliable, high-fidelity)
  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${sizeClasses[size]} ${shadowClass} ${className}`}
      title="Flamehunter FC Crest • Victoria Per Ignem (Est. 2002 / XXMMII)"
    >
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full drop-shadow-sm overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top text arc for 'FLAMEHUNTER FC' */}
          <path
            id="flamehunter-top-arc"
            d="M 68,200 A 132,132 0 1,1 332,200"
            fill="none"
          />
          {/* Bottom text arc for 'XXMMII' */}
          <path
            id="flamehunter-bottom-arc"
            d="M 100,200 A 100,100 0 0,0 300,200"
            fill="none"
          />

          {/* Clip path for center striped roundel */}
          <clipPath id="center-circle-clip">
            <circle cx="200" cy="200" r="92" />
          </clipPath>
        </defs>

        {/* Outer Black Neo-Brutalist Keyline */}
        <circle cx="200" cy="200" r="195" fill="#0066B2" stroke="#000000" strokeWidth="8" />

        {/* Outer White Divider Ring */}
        <circle cx="200" cy="200" r="182" fill="none" stroke="#FFFFFF" strokeWidth="4" />

        {/* Wide Crimson Red Ring Banner */}
        <circle cx="200" cy="200" r="140" fill="#D71920" stroke="#000000" strokeWidth="6" />

        {/* White Border Around Inner Field */}
        <circle cx="200" cy="200" r="98" fill="none" stroke="#FFFFFF" strokeWidth="6" />

        {/* Center Roundel with Athletic Diagonal Stripes (Red & Royal Blue) */}
        <g clipPath="url(#center-circle-clip)">
          {/* Base fill Royal Blue */}
          <rect x="50" y="50" width="300" height="300" fill="#0066B2" />
          {/* Diagonal Crimson Red Stripes */}
          <path
            d="
              M 80,60 L 140,60 L 320,340 L 260,340 Z
              M 170,60 L 230,60 L 410,340 L 350,340 Z
              M -10,60 L 50,60 L 230,340 L 170,340 Z
              M -100,60 L -40,60 L 140,340 L 80,340 Z
              M 260,60 L 320,60 L 500,340 L 440,340 Z
            "
            fill="#D71920"
          />
          {/* Subtle stripe inner shadows for depth */}
          <circle cx="200" cy="200" r="92" fill="none" stroke="#000000" strokeWidth="6" />
        </g>

        {/* Inner Circle Black Border */}
        <circle cx="200" cy="200" r="92" fill="none" stroke="#000000" strokeWidth="6" />

        {/* White Stylized Eagle / Falcon Head Profile (Facing Left) */}
        <g transform="translate(112, 116) scale(0.88)">
          {/* Eagle Head Outer Silhouette */}
          <path
            d="
              M 118,22
              C 92,20 66,35 48,56
              C 36,70 28,88 18,104
              C 14,110 5,116 0,122
              C 12,126 26,128 39,122
              C 31,130 18,137 8,142
              C 22,142 38,137 49,128
              C 40,140 28,154 16,162
              C 32,159 48,149 59,137
              C 54,152 44,168 32,178
              C 48,172 65,159 74,144
              C 84,160 102,176 122,185
              C 140,172 152,152 158,130
              C 165,104 162,75 148,52
              C 140,38 130,26 118,22 Z
            "
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Eagle Beak Hook & Mouth Line */}
          <path
            d="M 18,104 C 8,112 2,122 0,122 C 14,124 28,122 39,114"
            fill="#FFE600"
            stroke="#000000"
            strokeWidth="4"
          />

          {/* Eagle Eye Socket & Piercing Pupil */}
          <circle cx="56" cy="82" r="7" fill="#000000" />
          <circle cx="58" cy="80" r="3" fill="#FFE600" />
          <path
            d="M 44,76 C 52,72 66,74 72,82"
            fill="none"
            stroke="#000000"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Feather Definition Ridges */}
          <path
            d="
              M 78,56 C 92,68 108,82 124,88
              M 92,94 C 108,106 126,118 140,120
              M 74,116 C 88,126 104,136 120,138
            "
            fill="none"
            stroke="#000000"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>

        {/* Circular Arched Text: Top - 'FLAMEHUNTER FC' */}
        <text
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2"
          fontSize="29"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="4"
        >
          <textPath
            href="#flamehunter-top-arc"
            startOffset="50%"
            textAnchor="middle"
          >
            FLAMEHUNTER FC
          </textPath>
        </text>

        {/* Circular Arched Text: Bottom - 'XXMMII' (Est. 2002) */}
        <text
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2"
          fontSize="24"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="6"
        >
          <textPath
            href="#flamehunter-bottom-arc"
            startOffset="50%"
            textAnchor="middle"
          >
            XXMMII
          </textPath>
        </text>

        {/* Decorative Five-pointed Stars on Left & Right Flanks */}
        {/* Left Star */}
        <g transform="translate(68, 192) scale(0.7)">
          <polygon
            points="15,0 19.6,9.3 29.8,10.8 22.4,18 24.2,28.2 15,23.4 5.8,28.2 7.6,18 0.2,10.8 10.4,9.3"
            fill="#FFE600"
            stroke="#000000"
            strokeWidth="3"
          />
        </g>
        {/* Right Star */}
        <g transform="translate(312, 192) scale(0.7)">
          <polygon
            points="15,0 19.6,9.3 29.8,10.8 22.4,18 24.2,28.2 15,23.4 5.8,28.2 7.6,18 0.2,10.8 10.4,9.3"
            fill="#FFE600"
            stroke="#000000"
            strokeWidth="3"
          />
        </g>
      </svg>
    </div>
  );
};
