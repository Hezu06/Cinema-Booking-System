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
      {/* Ticketor Figma signature dual-ticket yellow emblem */}
      <div className={`${iconSizes[size]} relative flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
          <rect x="2.5" y="4" width="8.5" height="16" rx="2.5" fill="#FCFC65" />
          <rect x="13" y="4" width="8.5" height="16" rx="2.5" fill="#FCFC65" />
          {/* Ticket side notches */}
          <circle cx="2.5" cy="12" r="2.2" fill="#08080C" />
          <circle cx="11" cy="12" r="2.2" fill="#08080C" />
          <circle cx="13" cy="12" r="2.2" fill="#08080C" />
          <circle cx="21.5" cy="12" r="2.2" fill="#08080C" />
        </svg>
      </div>
      <span className={`${textSizes[size]} font-bold text-white`}>
        Ticketor
      </span>
    </div>
  );
};
