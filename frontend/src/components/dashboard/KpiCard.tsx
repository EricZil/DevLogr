import React from 'react';

interface KpiCardProps {
  title: string;
  /* Main value shown large inside the card */
  value: string | number;
  /**
   * Optional numeric diff that will be rendered as +x% or -x% below the value.
   * Positive numbers render green, negative render red.
   */
  diff?: number;
  /**
   * If provided the component renders a radial progress ring instead of the default icon.
   * Should be 0-100.
   */
  progress?: number;
  /** Optional custom icon (ReactNode) rendered in the top-right corner when no progress is supplied. */
  icon?: React.ReactNode;
  /** Extra Tailwind class names */
  className?: string;
  /** Optional sparkline data points (0-100). If provided and no progress, renders sparkline instead of icon. */
  sparklineData?: number[];
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  diff,
  progress,
  icon,
  className = '',
  sparklineData,
}) => {
  // Progress ring dimensions
  const radius = 28;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const dashOffset = progress !== undefined
    ? circumference - (progress / 100) * circumference
    : 0;

  const diffColor = diff !== undefined ? (diff >= 0 ? 'text-emerald-400' : 'text-rose-400') : '';

  return (
    <div
      className={`relative col-span-12 sm:col-span-6 lg:col-span-3 flex flex-col justify-between rounded-2xl p-6
                  bg-white/5 backdrop-blur-md ring-1 ring-inset ring-white/10 shadow-sm transition
                  hover:shadow-md hover:scale-[1.02] ${className}`}
    >
      {/* Title */}
      <p className="text-sm font-medium text-gray-300 truncate">{title}</p>

      {/* Value & diff */}
      <div className="mt-2 flex items-end gap-2">
        <span className="text-3xl font-semibold text-white leading-none">{value}</span>
        {diff !== undefined && (
          <span className={`text-sm leading-none ${diffColor}`}>{diff >= 0 ? '+' : ''}{diff}%</span>
        )}
      </div>

      {/* Icon or progress ring */}
      <div className="absolute right-4 bottom-4 h-12 w-24 flex items-center justify-center">
        {progress !== undefined ? (
          <svg
            width={radius * 2}
            height={radius * 2}
            className="transform -rotate-90"
          >
            <circle
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              fill="transparent"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={stroke}
            />
            <circle
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              fill="transparent"
              stroke="#647eff"
              strokeWidth={stroke}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
        ) : sparklineData && sparklineData.length > 1 ? (
          // Sparkline SVG
          <svg width="96" height="32" viewBox="0 0 96 32" fill="none" stroke="#647eff" strokeWidth="2" className="opacity-70">
            {(() => {
              const max = Math.max(...sparklineData);
              const min = Math.min(...sparklineData);
              const range = max - min || 1;
              const points = sparklineData.map((v, i) => {
                const x = (i / (sparklineData.length - 1)) * 96;
                const y = 32 - ((v - min) / range) * 24 - 4; // padding 4px
                return `${x},${y}`;
              }).join(' ');
              return <polyline points={points} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
            })()}
          </svg>
        ) : (
          icon
        )}
      </div>
    </div>
  );
};

export default KpiCard; 