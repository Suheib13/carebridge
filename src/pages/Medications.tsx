import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Trash2, Pill, Clock, AlertCircle, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Medication } from '../types';

export default function Medications() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [lastNotified, setLastNotified] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load medications from Supabase
  const fetchMedications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .order('time', { ascending: true });
      if (error) throw error;
      setMedications(data ?? []);
    } catch (err) {
      console.error('Error loading medications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMedications();
    if ('Notification' in window) setPermission(Notification.permission);
  }, [fetchMedications]);

  // Sync medication schedule to the Service Worker whenever it changes
  useEffect(() => {
    if (!navigator.serviceWorker?.controller) return;
    navigator.serviceWorker.controller.postMessage({
      type: 'SYNC_SCHEDULE',
      medications,
    });
  }, [medications]);

  // Page-thread fallback: fires notifications when the tab is in the foreground
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime =
        now.getHours().toString().padStart(2, '0') +
        ':' +
        now.getMinutes().toString().padStart(2, '0');

      if (currentTime === lastNotified) return;

      const dueMeds = medications.filter((m) => m.active && m.time === currentTime);
      if (dueMeds.length === 0) return;

      setLastNotified(currentTime);

      if (Notification.permission === 'granted') {
        dueMeds.forEach((med) => {
          new Notification('💊 Medication Reminder — CareBridge', {
            body: `Time to take ${med.name}${med.dosage ? ` · ${med.dosage}` : ''}.`,
            icon: '/vite.svg',
            tag: `carebridge-med-${med.id}`,
          });
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [medications, lastNotified]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications.');
      return;
    }
    const perm = await Notification.requestPermission();
    setPermission(perm);
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !time || !user) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('medications')
        .insert({ user_id: user.id, name, dosage, time, active: true })
        .select()
        .single();
      if (error) throw error;
      setMedications((prev) => [...prev, data].sort((a, b) => a.time.localeCompare(b.time)));
      setName('');
      setDosage('');
      setTime('');
    } catch (err) {
      console.error('Error adding medication:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('medications')
        .update({ active: !currentActive })
        .eq('id', id)
        .eq('user_id', user?.id);
      if (error) throw error;
      setMedications((prev) =>
        prev.map((med) => (med.id === id ? { ...med, active: !currentActive } : med))
      );
    } catch (err) {
      console.error('Error toggling medication:', err);
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);
      if (error) throw error;
      setMedications((prev) => prev.filter((med) => med.id !== id));
    } catch (err) {
      console.error('Error deleting medication:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-white">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Notification permission banner */}
          {permission !== 'granted' && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-widest mb-1">
                    Let Us Remind You
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-200/80 font-light leading-relaxed">
                    Allow notifications so we can nudge you when it's time for your medicine.
                  </p>
                </div>
              </div>
              <button
                onClick={requestNotificationPermission}
                className="shrink-0 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 w-full sm:w-auto"
              >
                Yes, Please
              </button>
            </div>
          )}

          {/* Add Medicine Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden mb-8"
          >
            <div className="p-5 sm:p-8 border-b border-white/10 bg-black/40">
              <h2 className="text-xl sm:text-2xl font-serif text-white">Add a Medicine</h2>
              <p className="text-sm text-white/60 mt-1 font-light">
                Tell us what to remind you about, and when.
              </p>
            </div>
            <form onSubmit={handleAddMedication} className="p-5 sm:p-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                    Name of Medicine
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Pill className="h-5 w-5 text-white/40" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-12 rounded-2xl bg-black/40 border-white/10 text-white focus:border-indigo-500/50 text-base py-3.5 px-4 border transition-all font-light placeholder-white/30"
                      placeholder="e.g., Paracetamol"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dosage" className="block text-sm font-medium text-white/80 mb-2">
                    How Much? (Optional)
                  </label>
                  <input
                    type="text"
                    id="dosage"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="block w-full rounded-2xl bg-black/40 border-white/10 text-white focus:border-indigo-500/50 text-base py-3.5 px-4 border transition-all font-light placeholder-white/30"
                    placeholder="e.g., 500mg"
                  />
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-white/80 mb-2">
                    What Time?
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-white/40" />
                    </div>
                    <input
                      type="time"
                      id="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="block w-full pl-12 rounded-2xl bg-black/40 border-white/10 text-white focus:border-indigo-500/50 text-base py-3.5 px-4 border transition-all font-light [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={!name || !time || saving}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 sm:py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto active:scale-95"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  {saving ? 'Saving...' : 'Save Reminder'}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Medication List */}
          <h3 className="text-xl sm:text-2xl font-serif text-white mb-4">Your Daily Schedule</h3>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-white/40" />
            </div>
          ) : medications.length === 0 ? (
            <div className="text-center py-14 bg-white/5 rounded-[2rem] border border-white/10 border-dashed backdrop-blur-sm">
              <Bell className="w-12 h-12 mx-auto text-white/30 mb-4" />
              <p className="text-white/60 font-light text-base">
                You haven't added any reminders yet.
              </p>
              <p className="text-white/40 font-light text-sm mt-1">
                Add your first medicine above to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {medications.map((med) => (
                <motion.div
                  key={med.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all backdrop-blur-md ${
                    med.active
                      ? 'bg-white/5 border-white/10 hover:border-indigo-500/40 hover:bg-white/8'
                      : 'bg-black/40 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                        med.active
                          ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                          : 'bg-white/5 text-white/40 border-white/10'
                      }`}
                    >
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <h4
                        className={`text-xl sm:text-2xl font-serif ${
                          med.active ? 'text-white' : 'text-white/40 line-through'
                        }`}
                      >
                        {med.time}
                      </h4>
                      <p className="text-sm sm:text-base font-light text-white/60 mt-0.5 truncate">
                        {med.name}
                        {med.dosage && (
                          <span className="text-white/40 ml-1">({med.dosage})</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => toggleActive(med.id, med.active)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        med.active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-white/10 text-white/60 border border-white/10 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {med.active ? 'On' : 'Off'}
                    </button>
                    <button
                      onClick={() => deleteMedication(med.id)}
                      className="p-2.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
