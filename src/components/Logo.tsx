export function Logo({ className = "h-8", dark = true }: { className?: string; dark?: boolean }) {
  const color = dark ? "#1D2223" : "#FFFFFF";
  return (
    <svg className={className} viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        x="0"
        y="38"
        fontFamily="'Libre Baskerville', 'Baskerville Old Face', serif"
        fontSize="36"
        fontWeight="400"
        fill={color}
        letterSpacing="6"
      >
        REXOR
      </text>
    </svg>
  );
}

export function LogoMark({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <span className="font-heading text-2xl font-bold text-brand-900 leading-none">R</span>
    </div>
  );
}
