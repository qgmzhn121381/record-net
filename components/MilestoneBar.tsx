'use client';

interface MilestoneBarProps {
  milestones: { title: string; days: number }[];
}

export default function MilestoneBar({ milestones }: MilestoneBarProps) {
  if (milestones.length === 0) return null;

  return (
    <div className="milestone-bar">
      {milestones.map((m, i) => (
        <div key={i} className="milestone-card">
          <span className="milestone-sparkle">✨</span>
          <p>🎉 今天是你「{m.title}」的第 <strong>{m.days}</strong> 天！</p>
          <span className="milestone-sparkle">✨</span>
        </div>
      ))}
    </div>
  );
}
