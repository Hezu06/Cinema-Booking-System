import React from 'react';

interface TicketorLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TicketorLogo: React.FC<TicketorLogoProps> = ({ className = '', size = 'md' }) => {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight text-white select-none ${className}`}>
      {/* Sọt phim - Cinema Popcorn Bucket ("Sọt") with Play ("Phim") emblem */}
      <div className={`${iconSizes[size]} relative flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Popcorn kernels at top */}
          <circle cx="8" cy="6" r="2.8" fill="#FCFC65" />
          <circle cx="12" cy="4.2" r="3.2" fill="#FCFC65" />
          <circle cx="16" cy="6" r="2.8" fill="#FCFC65" />
          <circle cx="10" cy="7" r="2" fill="#FFF9A6" />
          <circle cx="14" cy="7" r="2" fill="#FFF9A6" />
          {/* Cinema Popcorn Bucket ("Sọt") */}
          <path
            d="M5.5 8.5 H18.5 L16.8 20.3 C16.6 21.3 15.7 22 14.7 22 H9.3 C8.3 22 7.4 21.3 7.2 20.3 L5.5 8.5 Z"
            fill="#FCFC65"
          />
          {/* Bucket rim highlight */}
          <rect x="5" y="8" width="14" height="2" rx="1" fill="#FFF9A6" />
          {/* Cinema play triangle cutout ("Phim") */}
          <path d="M11 12.8 L14.5 15 L11 17.2 Z" fill="#08080C" />
          {/* Cinema bucket stripes */}
          <line x1="8.8" y1="11" x2="9.8" y2="21" stroke="#08080C" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="15.2" y1="11" x2="14.2" y2="21" stroke="#08080C" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <span className={`${textSizes[size]} font-extrabold tracking-tight text-white`}>
        Sọt <span className="text-[#FCFC65]">phim</span>
      </span>
    </div>
  );
};

export const SotPhimLogo = TicketorLogo;
