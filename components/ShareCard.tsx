'use client';

import { useEffect, useRef } from 'react';

interface ShareRecord {
  id: string;
  title: string;
  eventDate: string;
  mood: string;
  weather: string;
  category: string;
}

interface ShareCardProps {
  record: ShareRecord;
  onClose: () => void;
}

declare global {
  interface Window {
    html2canvas?: (element: HTMLElement, options?: { [key: string]: unknown }) => Promise<HTMLCanvasElement>;
  }
}

function getDaysDiff(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ShareCard({ record, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const days = getDaysDiff(record.eventDate);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleDownload = async () => {
    if (!cardRef.current || !window.html2canvas) return;

    try {
      const canvas = await window.html2canvas(cardRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `${record.title}-分享.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch {
      alert('生成图片失败');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-sm">
        <div
          ref={cardRef}
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #581c87 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="text-6xl mb-4">{record.mood}</div>
          <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            {record.title}
          </h3>
          <p className="text-gray-300 mb-2" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
            {record.eventDate} {record.weather}
          </p>
          <p className="text-3xl font-bold mb-2" style={{ fontFamily: 'DM Mono, monospace', color: '#f59e0b' }}>
            {days >= 0 ? `已过 ${days} 天` : `还有 ${Math.abs(days)} 天`}
          </p>
          <div
            className="inline-block px-3 py-1 rounded-full text-sm mb-6"
            style={{ background: '#f9731620', color: '#f97316' }}
          >
            {record.category}
          </div>
          <p className="text-xs text-gray-500">来自记录网</p>
        </div>

        <div className="flex gap-3 mt-4 justify-center">
          <button
            onClick={handleDownload}
            className="px-6 py-2 rounded-lg font-bold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}
          >
            下载图片
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
