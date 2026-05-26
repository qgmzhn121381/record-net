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
    <div className="modal-overlay" onClick={onClose}>
      <div className="share-container" onClick={(e) => e.stopPropagation()}>
        <div ref={cardRef} className="share-card">
          <div className="share-mood">{record.mood}</div>
          <h3 className="share-title">{record.title}</h3>
          <p className="share-date">{record.eventDate} {record.weather}</p>
          <p className="share-days">
            {days >= 0 ? `已过 ${days} 天` : `还有 ${Math.abs(days)} 天`}
          </p>
          <span className="share-category">{record.category}</span>
          <p className="share-watermark">来自记录网</p>
        </div>

        <div className="share-actions">
          <button onClick={handleDownload} className="share-download">下载图片</button>
          <button onClick={onClose} className="share-close">关闭</button>
        </div>
      </div>
    </div>
  );
}
