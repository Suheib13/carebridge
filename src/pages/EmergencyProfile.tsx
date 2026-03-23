import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Droplet,
  AlertTriangle,
  Activity,
  Pill,
  Phone,
  MapPin,
  Loader2,
  HeartPulse,
  User,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import Logo from '../components/Logo';

const BLOOD_COLORS: Record<string, string> = {
  'A+': 'bg-red-500/20 text-red-300 border-red-500/30',
  'A-': 'bg-red-500/20 text-red-300 border-red-500/30',
  'B+': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'B-': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'AB+': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'AB-': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'O+': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'O-': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | undefined;
}) {
  const empty = !value?.trim();
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
      <span className="text-white/40 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-medium mb-1">{label}</p>
        <p className={`text-sm leading-relaxed font-light ${empty ? 'italic text-white/30' : 'text-white/85'}`}>
          {empty ? 'Not provided' : value}
        </p>
      </div>
    </div>
  );
}

export default function EmergencyProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else {
          setProfile(data);
          // Log this scan silently
          supabase.from('qr_scans').insert({ profile_id: id }).then(() => {});
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white px-6 text-center gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h1 className="text-2xl font-semibold">Profile Not Found</h1>
        <p className="text-white/50 font-light">This emergency profile does not exist or has been removed.</p>
        <Link to="/" className="mt-2 text-sm text-white/40 hover:text-white transition-colors underline">Go to CareBridge</Link>
      </div>
    );
  }

  const bloodClass = BLOOD_COLORS[profile.blood_type] ?? 'bg-white/10 text-white/70 border-white/20';

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-12">
      {/* Emergency Banner */}
      <div className="bg-red-600 px-4 py-3 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2">
          <HeartPulse className="w-4 h-4" />
          Emergency Medical Profile — Handle with Care
        </p>
      </div>

      {/* Header */}
      <header className="bg-black/60 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/">
            <Logo className="h-7 w-auto" />
          </Link>
          <span className="text-xs text-white/40 font-light uppercase tracking-widest">Emergency ID</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-8 space-y-6">
        {/* Patient identity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-white/60" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-medium mb-0.5">Patient</p>
            <h1 className="text-2xl font-semibold text-white">{profile.full_name || 'Unknown'}</h1>
          </div>
          {profile.blood_type && (
            <div className={`ml-auto px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 ${bloodClass}`}>
              <Droplet className="w-4 h-4" />
              {profile.blood_type}
            </div>
          )}
        </motion.div>

        {/* Health details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <InfoCard
            icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
            label="Allergies"
            value={profile.allergies}
          />
          <InfoCard
            icon={<Activity className="w-4 h-4 text-blue-400" />}
            label="Medical Conditions"
            value={profile.conditions}
          />
          <InfoCard
            icon={<Pill className="w-4 h-4 text-purple-400" />}
            label="Current Medications"
            value={profile.medications}
          />
          <InfoCard
            icon={<Phone className="w-4 h-4 text-emerald-400" />}
            label="Emergency Contacts"
            value={profile.emergency_contacts}
          />
        </motion.div>

        {/* Find Hospital CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            to="/hospital-finder"
            className="flex items-center justify-center gap-3 w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-sm rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-900/40"
          >
            <MapPin className="w-5 h-5" />
            Find Nearest Hospital
          </Link>
        </motion.div>

        <div className="text-center pt-2 space-y-1">
          {profile.updated_at && (
            <p className="text-xs text-white/35 font-light">
              Profile last updated: <span className="text-white/50 font-medium">{new Date(profile.updated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </p>
          )}
          <p className="text-xs text-white/20 font-light">Powered by CareBridge · For emergency use only</p>
        </div>
      </main>
    </div>
  );
}
