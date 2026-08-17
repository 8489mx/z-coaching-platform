import React from 'react';

export default function ZCoachingLogo({ size = 56 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', margin: '0 auto' }}
    >
      <defs>
        <linearGradient id="zBadgeBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#372896" />
          <stop offset="60%" stopColor="#261c6a" />
          <stop offset="100%" stopColor="#181145" />
        </linearGradient>
        <linearGradient id="zAccentGleam" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0e7ff" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c7d2fe" />
        </linearGradient>
        <linearGradient id="dumbbellPlate" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      {/* Luxury Athletic Rounded Badge */}
      <rect x="4" y="4" width="92" height="92" rx="24" fill="url(#zBadgeBg)" />
      <rect x="5.5" y="5.5" width="89" height="89" rx="22.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />

      {/* Left Dumbbell Weight Plates (Athletic Iron) */}
      <rect x="16" y="30" width="6" height="40" rx="3" fill="url(#dumbbellPlate)" opacity="0.9" />
      <rect x="24" y="37" width="5" height="26" rx="2.5" fill="url(#zAccentGleam)" opacity="0.8" />

      {/* Right Dumbbell Weight Plates (Athletic Iron) */}
      <rect x="78" y="30" width="6" height="40" rx="3" fill="url(#dumbbellPlate)" opacity="0.9" />
      <rect x="71" y="37" width="5" height="26" rx="2.5" fill="url(#zAccentGleam)" opacity="0.8" />

      {/* Central Barbell Bar */}
      <rect x="29" y="47" width="42" height="6" rx="3" fill="rgba(255,255,255,0.25)" />

      {/* Stylized Dynamic Athletic 'Z' Emblem (Layered in 3D Motion) */}
      {/* Top Bar of Z */}
      <path 
        d="M32 26H67C68.6569 26 70 27.3431 70 29C70 30.6569 68.6569 32 67 32H44L68.8 62.5C70 64 69.2 66 67.5 66H31C29.3431 66 28 64.6569 28 63C28 61.3431 29.3431 60 31 60H54L29.2 29.5C28 28 28.8 26 30.5 26H32Z" 
        fill="url(#zAccentGleam)" 
      />

      {/* Athletic Speed Notch Highlight */}
      <circle cx="50" cy="50" r="3.5" fill="#818cf8" />
      <circle cx="50" cy="50" r="1.5" fill="#ffffff" />
    </svg>
  );
}
