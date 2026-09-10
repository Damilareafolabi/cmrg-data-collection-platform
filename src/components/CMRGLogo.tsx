import React from 'react';

interface CMRGLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'white';
  showRC?: boolean;
  className?: string;
}

export const CMRGLogo: React.FC<CMRGLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showRC = true,
  className = ''
}) => {
  // Dimensions based on size
  const scale = {
    sm: { text: 'text-lg', rc: 'text-[9px]', square: 'w-1.5 h-1.5', gap: 'gap-0.5', shift: 'ml-1.5' },
    md: { text: 'text-2xl', rc: 'text-[11px]', square: 'w-2 h-2', gap: 'gap-0.5', shift: 'ml-2' },
    lg: { text: 'text-4xl', rc: 'text-xs', square: 'w-3 h-3', gap: 'gap-1', shift: 'ml-3' },
    xl: { text: 'text-5xl', rc: 'text-sm', square: 'w-3.5 h-3.5', gap: 'gap-1', shift: 'ml-4' },
  }[size];

  const textColor = {
    dark: 'text-black',
    white: 'text-white',
    light: 'text-slate-900',
  }[variant];

  const rcColor = {
    dark: 'text-black',
    white: 'text-white/80',
    light: 'text-slate-700',
  }[variant];

  // The 11 squares in top row, 11 in bottom row staggered
  const squares = Array.from({ length: 11 });

  return (
    <div className={`inline-flex flex-col select-none font-sans ${className}`}>
      {/* Top Header with RC Number */}
      <div className="flex items-baseline justify-between w-full">
        <div className={`font-black tracking-tight leading-none ${scale.text} ${textColor}`}>
          CMRG Ltd.
        </div>
        {showRC && (
          <span className={`font-black tracking-wider uppercase ml-2 ${scale.rc} ${rcColor}`}>
            RC378525
          </span>
        )}
      </div>

      {/* Signature Staggered Red Squares Pattern */}
      <div className="flex flex-col mt-1.5 space-y-0.5">
        {/* Row 1 */}
        <div className={`flex items-center ${scale.gap}`}>
          {squares.map((_, i) => (
            <span
              key={`r1-${i}`}
              className={`${scale.square} bg-[#FF2D20] rounded-[1px] transition-transform duration-200 hover:scale-125`}
            />
          ))}
        </div>
        {/* Row 2 - Staggered offset to right */}
        <div className={`flex items-center ${scale.gap} ${scale.shift}`}>
          {squares.map((_, i) => (
            <span
              key={`r2-${i}`}
              className={`${scale.square} bg-[#FF2D20] rounded-[1px] transition-transform duration-200 hover:scale-125`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
