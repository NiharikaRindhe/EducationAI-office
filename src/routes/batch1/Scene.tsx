import React from 'react';

/**
 * The world the Batch 1 portal sits in.
 *
 * Everything here is decorative and inert — drawn as SVG rather than emoji so
 * it renders identically on the Windows lab machines, the odd Android tablet
 * and a teacher's phone, and so it stays crisp when a scene element is scaled
 * up. It is deliberately BEHIND the app frame and never intercepts a tap.
 */
export const Scene: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
    {/* Sky */}
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(180deg,#BFE9FF 0%,#D8F1FF 42%,#E9F8FF 68%,#F2FBFF 100%)' }}
    />

    {/* Sun, top right. Still — a spinning one pulled the eye off the content. */}
    <div
      className="absolute rounded-full"
      style={{
        top: -70, right: -60, width: 240, height: 240,
        background: 'radial-gradient(circle at 40% 40%, rgba(255,247,196,.95), rgba(255,224,110,.55) 52%, rgba(255,224,110,0) 72%)',
      }}
    />

    {/* Clouds. Two drift, the rest hold still so the motion stays gentle. */}
    <Cloud className="cloud-drift" style={{ top: '9%', left: '-12%' }} scale={1} />
    <Cloud className="cloud-drift-rtl" style={{ top: '26%', right: '-10%' }} scale={0.75} />
    <Cloud style={{ top: '4%', left: '32%' }} scale={0.6} opacity={0.65} />
    <Cloud style={{ top: '18%', left: '72%' }} scale={0.5} opacity={0.5} />

    {/* Rolling hills — three layers, far to near. */}
    <svg
      className="absolute bottom-0 left-0 w-full"
      style={{ height: 260 }}
      viewBox="0 0 1440 260"
      preserveAspectRatio="none"
    >
      <path d="M0 150 C 220 96, 420 176, 660 140 C 900 104, 1140 168, 1440 118 L1440 260 L0 260 Z" fill="#BEEBA0" />
      <path d="M0 186 C 260 140, 470 208, 760 176 C 1030 146, 1230 200, 1440 164 L1440 260 L0 260 Z" fill="#95DE72" />
      <path d="M0 224 C 300 194, 560 240, 880 218 C 1140 200, 1300 232, 1440 214 L1440 260 L0 260 Z" fill="#74CC52" />
    </svg>

    {/* A school on the left of the hill. */}
    <svg className="absolute" style={{ bottom: 78, left: '2.5%', width: 140, height: 118 }} viewBox="0 0 140 118">
      <rect x="18" y="46" width="104" height="64" rx="7" fill="#FFD79A" />
      <rect x="18" y="46" width="104" height="12" rx="6" fill="#FFC46B" />
      <path d="M70 16 L128 48 L12 48 Z" fill="#F2A65A" />
      <rect x="66" y="2" width="4" height="18" rx="2" fill="#9A6A3C" />
      <path d="M70 3 L92 10 L70 17 Z" fill="#FF6B6B" />
      <rect x="58" y="74" width="24" height="36" rx="4" fill="#8C5A2B" />
      <circle cx="70" cy="36" r="8" fill="#FFF6DC" />
      <circle cx="70" cy="36" r="1.6" fill="#8C5A2B" />
      <rect x="30" y="66" width="18" height="18" rx="4" fill="#BFE9FF" />
      <rect x="92" y="66" width="18" height="18" rx="4" fill="#BFE9FF" />
    </svg>

    {/* Trees on the right. */}
    <Tree style={{ bottom: 84, right: '4%' }} scale={1} />
    <Tree style={{ bottom: 104, right: '12%' }} scale={0.66} />

    {/* Path winding over the near hill. */}
    <svg className="absolute" style={{ bottom: 0, left: '18%', width: '46%', height: 130 }} viewBox="0 0 600 130" preserveAspectRatio="none">
      <path d="M270 130 C 250 88, 330 66, 318 30 C 312 12, 300 6, 292 0" stroke="#FBE9B8" strokeWidth="26" fill="none" strokeLinecap="round" opacity="0.85" />
    </svg>
  </div>
);

const Cloud: React.FC<{
  className?: string;
  style?: React.CSSProperties;
  scale?: number;
  opacity?: number;
}> = ({ className = '', style, scale = 1, opacity = 0.92 }) => (
  <div className={`absolute ${className}`} style={{ ...style, transform: `scale(${scale})`, opacity }}>
    <div className="relative bg-white rounded-full" style={{ width: 132, height: 38 }}>
      <div className="absolute bg-white rounded-full" style={{ width: 58, height: 58, top: -28, left: 20 }} />
      <div className="absolute bg-white rounded-full" style={{ width: 42, height: 42, top: -18, left: 66 }} />
    </div>
  </div>
);

const Tree: React.FC<{ style?: React.CSSProperties; scale?: number }> = ({ style, scale = 1 }) => (
  <svg
    className="absolute"
    style={{ ...style, width: 96 * scale, height: 118 * scale }}
    viewBox="0 0 96 118"
  >
    <rect x="42" y="72" width="12" height="42" rx="5" fill="#A9713F" />
    <circle cx="48" cy="46" r="30" fill="#5FBF52" />
    <circle cx="28" cy="60" r="20" fill="#6ECB5E" />
    <circle cx="68" cy="60" r="20" fill="#54B348" />
    <circle cx="48" cy="30" r="18" fill="#7AD86A" />
  </svg>
);
