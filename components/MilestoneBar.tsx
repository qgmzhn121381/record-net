'use client';

interface MilestoneBarProps {
  milestones: { title: string; days: number }[];
}

export default function MilestoneBar({ milestones }: MilestoneBarProps) {
  if (milestones.length === 0) return null;

  return (
    <div className="mb-6">
      {milestones.map((m, i) => (
        <div
          key={i}
          className="mb-2 rounded-xl p-4 text-center"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #ec4899 100%)',
          }}
        >
          <p className="text-white font-bold text-lg" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
            🎉 今天是你「{m.title}」的第 <span style={{ fontFamily: 'DM Mono, monospace' }}>{m.days}</span> 天！
          </p>
        </div>
      ))}
    </div>
  );
}
