interface ScanProgressBarProps {
  scanned: number;
  capped?: boolean;
}

export function ScanProgressBar({ scanned, capped }: ScanProgressBarProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Animated indeterminate bar */}
      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-[scan_1.4s_ease-in-out_infinite]"
          style={{ width: '40%', animation: 'scan 1.4s ease-in-out infinite' }} />
      </div>
      <p className="text-xs text-gray-400 text-center">
        {capped
          ? `Capped at ${scanned.toLocaleString()} files`
          : `Scanning… ${scanned.toLocaleString()} file${scanned !== 1 ? 's' : ''} found`}
      </p>
      <style>{`
        @keyframes scan {
          0%   { transform: translateX(-100%); width: 40%; }
          50%  { width: 60%; }
          100% { transform: translateX(280%); width: 40%; }
        }
      `}</style>
    </div>
  );
}
