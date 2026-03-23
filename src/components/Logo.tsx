import React from 'react';
import { HeartPulse } from 'lucide-react';

export default function Logo({ className = "h-10 w-auto", showText = false }: { className?: string; showText?: boolean }) {
  const logoUrl = "https://i.postimg.cc/BbNPm23Q/image_removebg_preview_(1).png";

  const img = logoUrl ? (
    <img
      src={logoUrl}
      alt="CareBridge Logo"
      className={`object-contain rounded-2xl ${className}`}
      referrerPolicy="no-referrer"
    />
  ) : (
    <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
      <HeartPulse className="w-6 h-6 text-emerald-400" />
    </div>
  );

  if (!showText) return img;

  return (
    <div className="flex items-center gap-3">
      {img}
      <span className="text-2xl font-serif font-semibold text-white tracking-wide">CareBridge</span>
    </div>
  );
}
