export function Ring({ value, size = 64 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  const radius = size / 2 - 5;
  const c = 2 * Math.PI * radius;
  const dash = (pct / 100) * c;

  const stroke = pct >= 60 ? "#3ecf8e" : pct >= 50 ? "#f0c040" : "#f75a5a";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#232840" strokeWidth="5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-bold">{Math.round(pct)}%</span>
    </div>
  );
}
