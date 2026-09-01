import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  iconOnly?: boolean;
  textColor?: string;
}

export function SmartLotLogo({ className = "h-10", iconOnly = false, textColor = "text-gray-900 dark:text-white", ...props }: LogoProps) {
  if (iconOnly) {
    return <SmartLotLogoIcon className={className} {...props} />;
  }

  return (
    <div className="flex items-center gap-3">
      <SmartLotLogoIcon className={className} {...props} />
      <div className="flex flex-col justify-center select-none">
        <div className="flex items-baseline font-sans leading-none tracking-tight">
          <span className={`text-xl font-bold ${textColor}`}>Smart</span>
          <span className="text-xl font-bold text-[#05BFA5]">Lot</span>
        </div>
        <span className="text-[7px] font-extrabold uppercase tracking-[0.15em] text-gray-400 mt-1 block">
          BUILDINGS • PEOPLE • COMMUNITY
        </span>
      </div>
    </div>
  );
}

export function SmartLotLogoIcon({ className = "w-10 h-10", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Brand color gradients matching the uploaded design */}
        <linearGradient id="leftBuildingGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="midBuildingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="rightBuildingGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#05BFA5" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      {/* Left Building (Small, Blue) */}
      <path
        d="M 15 65 L 15 82 C 15 84 16 85 18 85 L 35 85 C 37 85 38 84 38 82 L 38 72 L 15 65"
        stroke="url(#leftBuildingGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Middle Building (Tall, Cyan-Blue Gradient) */}
      <path
        d="M 45 85 L 45 35 C 45 33 46 32 48 31 L 65 20 C 67 19 68 20 68 22 L 68 85"
        stroke="url(#midBuildingGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Building (Medium, Teal Gradient) */}
      <path
        d="M 75 85 L 75 48 C 75 46 76 45 78 45 L 88 52 C 90 53 91 55 91 57 L 91 85"
        stroke="url(#rightBuildingGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Windows on Right Building */}
      <path
        d="M 80 58 L 84 60"
        stroke="url(#rightBuildingGrad)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M 80 67 L 84 69"
        stroke="url(#rightBuildingGrad)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}


// Animation: Logo Building Silhouette Glow