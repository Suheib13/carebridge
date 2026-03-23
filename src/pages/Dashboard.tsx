import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Activity,
  Pill,
  Phone,
  Droplet,
  QrCode,
  ArrowLeft,
  ShieldCheck,
  Download,
  Printer,
  ChevronDown,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { QRCodeSVG } from 'qrcode.react';

const PROFILE_FIELDS: { key: keyof Profile; label: string }[] = [
  { key: 'full_name', label: 'Name' },
  { key: 'blood_type', label: 'Blood Type' },
  { key: 'allergies', label: 'Allergies' },
  { key: 'conditions', label: 'Conditions' },
  { key: 'medications', label: 'Medications' },
  { key: 'emergency_contacts', label: 'Emergency Contacts' },
];

function getCompleteness(profile: Profile | null): number {
  if (!profile) return 0;
  const filled = PROFILE_FIELDS.filter(({ key }) => String(profile[key] ?? '').trim()).length;
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'qr'>('profile');
  const [scanCount, setScanCount] = useState(0);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const qrModalRef = React.useRef<SVGSVGElement>(null);
  const qrModalOfflineRef = React.useRef<SVGSVGElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setProfile(data);
        } else {
          setProfile({
            id: user.id,
            full_name: '',
            blood_type: '',
            allergies: '',
            conditions: '',
            medications: '',
            emergency_contacts: '',
            updated_at: '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Still show a blank usable form even if the DB table isn't ready yet
        setProfile({
          id: user.id,
          full_name: '',
          blood_type: '',
          allergies: '',
          conditions: '',
          medications: '',
          emergency_contacts: '',
          updated_at: '',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();

    // Fetch scan stats
    if (user) {
      supabase
        .from('qr_scans')
        .select('scanned_at', { count: 'exact' })
        .eq('profile_id', user.id)
        .order('scanned_at', { ascending: false })
        .limit(1)
        .then(({ data, count }) => {
          setScanCount(count ?? 0);
          setLastScanned(data?.[0]?.scanned_at ?? null);
        });
    }
  }, [user]);

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    setShowConfirm(false);
    setMessage(null);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: profile.full_name,
        blood_type: profile.blood_type,
        allergies: profile.allergies,
        conditions: profile.conditions,
        medications: profile.medications,
        emergency_contacts: profile.emergency_contacts,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setProfile((prev) => (prev ? { ...prev, updated_at: new Date().toISOString() } : null));
      setShowQRModal(true);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || "We couldn't save your details. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  const hasSavedProfile = profile?.updated_at && profile.full_name.trim() !== '';
  const completeness = getCompleteness(profile);

  return (
    <div className="min-h-screen pb-28 md:pb-12 text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="print:hidden relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col gap-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight mb-1">
                  Your Health Hub
                </h2>
                <p className="text-white/60 font-light text-base sm:text-lg">
                  Keep your vital details up to date, and hold your life-saving QR code ready.
                </p>

                {/* Profile Completeness Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-white/50 font-medium uppercase tracking-wider">
                      Profile completeness
                    </span>
                    <span
                      className={`font-bold ${
                        completeness === 100
                          ? 'text-emerald-400'
                          : completeness >= 50
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {completeness}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        completeness === 100
                          ? 'bg-emerald-400'
                          : completeness >= 50
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                      }`}
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                  {completeness < 100 && (
                    <p className="text-xs text-white/40 mt-1 font-light">
                      Fill in all fields for a complete emergency QR code
                    </p>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/10 w-full sm:w-auto backdrop-blur-md shrink-0">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'profile'
                      ? 'bg-white/10 text-white shadow-lg border border-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  My Details
                </button>
                <button
                  onClick={() => setActiveTab('qr')}
                  disabled={!hasSavedProfile}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'qr'
                      ? 'bg-white/10 text-white shadow-lg border border-white/10'
                      : !hasSavedProfile
                      ? 'text-white/30 cursor-not-allowed opacity-50'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  title={!hasSavedProfile ? 'Save your profile first to generate a QR code' : ''}
                >
                  <QrCode className="w-4 h-4" />
                  QR Code
                </button>
              </div>
            </div>
          </motion.div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 sm:p-5 rounded-2xl flex items-start gap-4 border backdrop-blur-md ${
                message.type === 'success'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-white" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
              )}
              <p className="text-sm sm:text-base font-light">{message.text}</p>
            </motion.div>
          )}
        </div>

        {activeTab === 'profile' ? (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleReview}
            className="bg-white/5 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden print:hidden relative z-10"
          >
            <div className="p-6 sm:p-12 space-y-10 relative z-10">
              {/* Who You Are */}
              <div>
                <h3 className="text-lg sm:text-xl font-serif text-white flex items-center gap-3 mb-5">
                  <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white/70" />
                  Who You Are
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="full_name" className="block text-sm font-medium text-white/80 mb-2">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      id="full_name"
                      required
                      value={profile?.full_name || ''}
                      onChange={handleChange}
                      className="block w-full rounded-2xl bg-black/40 border-white/10 text-white focus:border-white/50 focus:ring-white/50 text-base sm:text-lg py-3.5 px-4 border transition-all font-light placeholder-white/30"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="blood_type" className="block text-sm font-medium text-white/80 mb-2">
                      Blood Type
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Droplet className="h-5 w-5 text-white/40" />
                      </div>
                      <select
                        id="blood_type"
                        name="blood_type"
                        value={profile?.blood_type || ''}
                        onChange={handleChange}
                        className="block w-full pl-12 pr-12 rounded-2xl bg-black/40 border-white/10 text-white focus:border-white/50 focus:ring-white/50 text-base sm:text-lg py-3.5 px-4 border transition-all font-light appearance-none"
                      >
                        <option value="" className="bg-slate-900">Select Blood Type</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((t) => (
                          <option key={t} value={t} className="bg-slate-900">
                            {t}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <ChevronDown className="h-5 w-5 text-white/40" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Your Health Story */}
              <div className="border-t border-white/10 pt-8">
                <h3 className="text-lg sm:text-xl font-serif text-white flex items-center gap-3 mb-5">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white/70" />
                  Your Health Story
                </h3>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="allergies" className="block text-sm font-medium text-white/80 mb-2">
                      Things to Avoid (Allergies)
                    </label>
                    <textarea
                      id="allergies"
                      name="allergies"
                      rows={2}
                      value={profile?.allergies || ''}
                      onChange={handleChange}
                      className="block w-full rounded-2xl bg-black/40 border-white/10 text-white focus:border-white/50 focus:ring-white/50 text-base sm:text-lg py-3.5 px-4 border transition-all resize-none font-light placeholder-white/30"
                      placeholder="e.g., Penicillin, Peanuts (Leave blank if none)"
                    />
                  </div>

                  <div>
                    <label htmlFor="conditions" className="block text-sm font-medium text-white/80 mb-2">
                      Ongoing Health Conditions
                    </label>
                    <textarea
                      id="conditions"
                      name="conditions"
                      rows={2}
                      value={profile?.conditions || ''}
                      onChange={handleChange}
                      className="block w-full rounded-2xl bg-black/40 border-white/10 text-white focus:border-white/50 focus:ring-white/50 text-base sm:text-lg py-3.5 px-4 border transition-all resize-none font-light placeholder-white/30"
                      placeholder="e.g., Type 1 Diabetes, Asthma"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="medications"
                      className="block text-sm font-medium text-white/80 flex items-center gap-2 mb-2"
                    >
                      <Pill className="w-4 h-4 text-white/70" />
                      Medicines You Take
                    </label>
                    <textarea
                      id="medications"
                      name="medications"
                      rows={2}
                      value={profile?.medications || ''}
                      onChange={handleChange}
                      className="block w-full rounded-2xl bg-black/40 border-white/10 text-white focus:border-white/50 focus:ring-white/50 text-base sm:text-lg py-3.5 px-4 border transition-all resize-none font-light placeholder-white/30"
                      placeholder="e.g., Lisinopril 10mg daily"
                    />
                  </div>
                </div>
              </div>

              {/* Who to Call */}
              <div className="border-t border-white/10 pt-8">
                <h3 className="text-lg sm:text-xl font-serif text-white flex items-center gap-3 mb-5">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white/70" />
                  Who to Call
                </h3>
                <div>
                  <label htmlFor="emergency_contacts" className="block text-sm font-medium text-white/80 mb-2">
                    Names and Numbers of Your Loved Ones
                  </label>
                  <textarea
                    id="emergency_contacts"
                    name="emergency_contacts"
                    rows={3}
                    value={profile?.emergency_contacts || ''}
                    onChange={handleChange}
                    className="block w-full rounded-2xl bg-black/40 border-white/10 text-white focus:border-white/50 focus:ring-white/50 text-base sm:text-lg py-3.5 px-4 border transition-all resize-none font-light placeholder-white/30"
                    placeholder={`e.g., Jane Doe (Wife): 555-0123\nJohn Smith (Brother): 555-0124`}
                  />
                </div>
              </div>
            </div>

            <div className="bg-black/40 px-6 sm:px-8 py-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-white/50 font-light">
                {profile?.updated_at ? (
                  <span>Last updated: {new Date(profile.updated_at).toLocaleDateString()}</span>
                ) : (
                  <span>Not saved yet</span>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 justify-center py-4 sm:py-3 px-8 rounded-xl text-sm font-bold uppercase tracking-widest text-black bg-white hover:bg-white/90 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto active:scale-95"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Securing...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Secure My Details
                  </>
                )}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative z-10"
          >
            {hasSavedProfile && profile ? (
              <>
                {/* Stale data warning — if not updated in 90 days */}
                {profile.updated_at && (() => {
                  const daysSince = Math.floor((Date.now() - new Date(profile.updated_at).getTime()) / 86400000);
                  return daysSince >= 90 ? (
                    <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-400">Your profile is {daysSince} days old</p>
                        <p className="text-xs text-amber-200/70 font-light mt-0.5">Please review and re-save your details to keep your QR code accurate.</p>
                      </div>
                    </div>
                  ) : null;
                })()}
                <QRCodeGenerator profile={profile} scanCount={scanCount} lastScanned={lastScanned} />
              </>
            ) : null}
          </motion.div>
        )}
      </main>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && profile && (() => {
          const profileUrl = `${window.location.origin}/emergency/${profile.id}`;
          const vcardData = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `N:${profile.full_name.split(' ').reverse().join(';')};;;`,
            `FN:${profile.full_name}`,
            'ORG:CareBridge Emergency Medical Profile',
            `NOTE:BLOOD TYPE: ${profile.blood_type || 'Unknown'}\\nALLERGIES: ${profile.allergies || 'None listed'}\\nCONDITIONS: ${profile.conditions || 'None listed'}\\nMEDICATIONS: ${profile.medications || 'None listed'}\\nEMERGENCY CONTACTS: ${profile.emergency_contacts || 'None listed'}`,
            'END:VCARD',
          ].join('\n');

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
              svgToImage(qrModalRef),
              svgToImage(qrModalOfflineRef),
            ]);
            const qrSize = 200;
            const pad = 32;
            const labelH = 46;
            const headerH = 70;
            const footerH = 44;
            const colW = qrSize + pad * 2;
            const divider = 1;
            const canvas = document.createElement('canvas');
            canvas.width = colW * 2 + divider;
            canvas.height = headerH + labelH + qrSize + pad + footerH;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 17px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CareBridge — Emergency Medical QR', canvas.width / 2, 28);
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText(profile.full_name, canvas.width / 2, 48);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(colW, headerH, divider, canvas.height - headerH - footerH);
            ctx.fillStyle = '#059669';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ONLINE', colW / 2, headerH + 24);
            ctx.fillStyle = '#6b7280';
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText('Opens emergency profile in browser', colW / 2, headerH + 40);
            ctx.drawImage(onlineImg, pad, headerH + labelH, qrSize, qrSize);
            ctx.fillStyle = '#d97706';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('OFFLINE', colW + colW / 2, headerH + 24);
            ctx.fillStyle = '#6b7280';
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText('Saves health details as a phone contact', colW + colW / 2, headerH + 40);
            ctx.drawImage(offlineImg, colW + divider + pad, headerH + labelH, qrSize, qrSize);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Powered by CareBridge · For emergency use only', canvas.width / 2, canvas.height - 14);
            const a = document.createElement('a');
            a.download = `CareBridge_Emergency_QR_${profile.full_name.replace(/\s+/g, '_')}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
          };

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowQRModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 60, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 60, scale: 0.97 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="w-full max-w-2xl bg-[#0e0e0e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Success header */}
                <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white">Details Saved!</h3>
                    <p className="text-xs text-white/50 font-light">Your emergency QR codes are ready.</p>
                  </div>
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* QR Codes side by side */}
                <div className="grid grid-cols-2 divide-x divide-white/10 px-8 sm:px-12 pt-8 pb-6 gap-0">
                  {/* Online QR */}
                  <div className="flex flex-col items-center gap-4 pr-6 sm:pr-8">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Online</span>
                    </div>
                    <p className="text-xs text-white/40 font-light text-center leading-relaxed">
                      Opens emergency profile in browser
                    </p>
                    <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                      <QRCodeSVG
                        ref={qrModalRef}
                        value={profileUrl}
                        size={180}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                  </div>

                  {/* Offline QR */}
                  <div className="flex flex-col items-center gap-4 pl-6 sm:pl-8">
                    <div className="flex items-center gap-2">
                      <WifiOff className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Offline</span>
                    </div>
                    <p className="text-xs text-white/40 font-light text-center leading-relaxed">
                      Saves as phone contact (no internet)
                    </p>
                    <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.06)]">
                      <QRCodeSVG
                        ref={qrModalOfflineRef}
                        value={vcardData}
                        size={180}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-8 sm:px-12 pb-8 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveBoth}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      Save Image
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                    >
                      <Printer className="w-4 h-4" />
                      Print Code
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && profile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Review Your Details</h3>
                  <p className="text-xs text-white/50 font-light">Make sure everything looks right before saving.</p>
                </div>
              </div>

              {/* Detail Rows */}
              <div className="px-6 py-5 space-y-3 max-h-[55vh] overflow-y-auto">
                {[
                  { label: 'Full Name', value: profile.full_name, icon: <UserIcon className="w-4 h-4" /> },
                  { label: 'Blood Type', value: profile.blood_type, icon: <Droplet className="w-4 h-4" /> },
                  { label: 'Allergies', value: profile.allergies, icon: <AlertCircle className="w-4 h-4" /> },
                  { label: 'Conditions', value: profile.conditions, icon: <Activity className="w-4 h-4" /> },
                  { label: 'Medications', value: profile.medications, icon: <Pill className="w-4 h-4" /> },
                  { label: 'Emergency Contacts', value: profile.emergency_contacts, icon: <Phone className="w-4 h-4" /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-start gap-3 bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
                    <span className="text-white/40 mt-0.5 shrink-0">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-medium mb-0.5">{label}</p>
                      <p className="text-sm text-white/80 font-light leading-relaxed whitespace-pre-wrap break-words">
                        {value?.trim() || <span className="italic text-white/30">Not provided</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 pt-4 flex gap-3 border-t border-white/10">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium text-white/70 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest text-black bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
