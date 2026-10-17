import { useEffect, useState } from 'react';

export default function ScoreWheel({ value, size = 190, stroke = 14, caption }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(value), 80);
    return () => clearTimeout(t);
  }, [value]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`Accuracy ${Math.round(value)} percent`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF2FF" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#4F46E5" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * shown) / 100} style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-extrabold tracking-tight">{Math.round(value)}%</div>
        {caption && <div className="mt-0.5 text-xs text-slate-500">{caption}</div>}
      </div>
    </div>
  );
}
