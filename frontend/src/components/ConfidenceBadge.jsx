export default function ConfidenceBadge({ confidence }) {
  let color = 'bg-red-500/20 text-red-400 border-red-500/30';
  let label = 'Low';

  if (confidence > 80) {
    color = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    label = 'High';
  } else if (confidence > 60) {
    color = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    label = 'Medium';
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className={`badge border ${color}`}>
          {label} — {confidence?.toFixed(1)}%
        </span>
        <span className="text-xs text-dark-400">AI Confidence</span>
      </div>
      <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(confidence || 0, 100)}%`,
            background:
              confidence > 80
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : confidence > 60
                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                : 'linear-gradient(90deg, #ef4444, #f87171)',
          }}
        />
      </div>
    </div>
  );
}
