import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Wifi, WifiOff } from 'lucide-react';
import { Profile } from '../types';

interface QRCodeGeneratorProps {
  profile: Profile;
  scanCount?: number;
  lastScanned?: string | null;
}

export default function QRCodeGenerator({ profile, scanCount = 0, lastScanned }: QRCodeGeneratorProps) {
  const onlineRef = useRef<SVGSVGElement>(null);
  const offlineRef = useRef<SVGSVGElement>(null);

  const profileUrl = `${window.location.origin}${import.meta.env.BASE_URL}emergency/${profile.id}`;

  const vcardData = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${profile.full_name.split(' ').reverse().join(';')};;;`,
    `FN:${profile.full_name}`,
    'ORG:CareBridge Emergency Medical Profile',
    `NOTE:BLOOD TYPE: ${profile.blood_type || 'Unknown'}\\nALLERGIES: ${profile.allergies || 'None listed'}\\nCONDITIONS: ${profile.conditions || 'None listed'}\\nMEDICATIONS: ${profile.medications || 'None listed'}\\nEMERGENCY CONTACTS: ${profile.emergency_contacts || 'None listed'}`,
    'END:VCARD',
  ].join('\n');

  // Convert one SVG ref to an Image promise
  const svgToImage = (ref: React.RefObject<SVGSVGElement | null>): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      if (!ref.current) return reject('No SVG');
      const svg = new XMLSerializer().serializeToString(ref.current);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    });

  const handleSaveBoth = async () => {
    const [onlineImg, offlineImg] = await Promise.all([
      svgToImage(onlineRef),
      svgToImage(offlineRef),
    ]);

    const qrSize = 240;
    const pad = 40;
    const labelH = 50;
    const headerH = 80;
    const footerH = 50;
    const colW = qrSize + pad * 2;
    const divider = 1;

    const canvas = document.createElement('canvas');
    canvas.width = colW * 2 + divider;
    canvas.height = headerH + labelH + qrSize + pad + footerH;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CareBridge — Emergency Medical QR', canvas.width / 2, 32);
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(profile.full_name, canvas.width / 2, 56);

    // Divider between columns
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(colW, headerH, divider, canvas.height - headerH - footerH);

    // --- Online QR (left) ---
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📶  ONLINE', colW / 2, headerH + 28);
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Opens emergency profile in browser', colW / 2, headerH + 46);
    ctx.drawImage(onlineImg, pad, headerH + labelH, qrSize, qrSize);

    // --- Offline QR (right) ---
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📵  OFFLINE', colW + colW / 2, headerH + 28);
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Saves health details as a phone contact', colW + colW / 2, headerH + 46);
    ctx.drawImage(offlineImg, colW + divider + pad, headerH + labelH, qrSize, qrSize);

    // Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Powered by CareBridge · For emergency use only', canvas.width / 2, canvas.height - 18);

    const a = document.createElement('a');
    a.download = `CareBridge_Emergency_QR_${profile.full_name.replace(/\s+/g, '_')}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  const qrCardClass = 'flex flex-col items-center gap-4';

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden">

      {/* QR codes side by side */}
      <div className="p-6 sm:p-10 grid grid-cols-2 gap-6 sm:gap-10 divide-x divide-white/10">

        {/* Online QR */}
        <div className={qrCardClass}>
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">Online</span>
          </div>
          <p className="text-xs text-white/40 font-light text-center leading-relaxed">
            Scanner has internet · opens emergency profile
          </p>
          <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.08)]">
            <QRCodeSVG ref={onlineRef} value={profileUrl} size={160} level="M" includeMargin={true} />
          </div>
        </div>

        {/* Offline QR */}
        <div className={`${qrCardClass} pl-6 sm:pl-10`}>
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400 uppercase tracking-widest">Offline</span>
          </div>
          <p className="text-xs text-white/40 font-light text-center leading-relaxed">
            No internet · saves as phone contact
          </p>
          <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.06)]">
            <QRCodeSVG ref={offlineRef} value={vcardData} size={160} level="M" includeMargin={true} />
          </div>
        </div>

      </div>

      {/* Scan stats */}
      <div className="px-6 sm:px-10 pb-4 flex items-center justify-between text-xs text-white/40 font-light print:hidden">
        <span>
          🔍 Scanned <span className="text-white/70 font-semibold">{scanCount}</span> {scanCount === 1 ? 'time' : 'times'}
        </span>
        <span>
          {lastScanned
            ? <>Last scanned: <span className="text-white/60">{new Date(lastScanned).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span></>
            : 'Not yet scanned'}
        </span>
      </div>

      {/* Single action row */}
      <div className="px-6 sm:px-10 pb-8 flex gap-3 print:hidden">
        <button
          onClick={handleSaveBoth}
          className="flex-1 inline-flex items-center justify-center gap-2 py-4 border border-white/10 rounded-xl text-sm font-bold uppercase tracking-widest text-white/80 bg-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          <Download className="w-5 h-5" />
          Save Image
        </button>
        <button
          onClick={() => window.print()}
          className="flex-1 inline-flex items-center justify-center gap-2 py-4 border border-white/10 rounded-xl text-sm font-bold uppercase tracking-widest text-white/80 bg-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          <Printer className="w-5 h-5" />
          Print Code
        </button>
      </div>

    </div>
  );
}
