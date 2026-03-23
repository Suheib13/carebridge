import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsConfirmation(false);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Handle email not confirmed separately with a helpful action
      if (
        error.message.toLowerCase().includes('email not confirmed') ||
        error.message.toLowerCase().includes('not confirmed')
      ) {
        setNeedsConfirmation(true);
      } else if (error.message.toLowerCase().includes('invalid login credentials')) {
        setError('Wrong email or password. Please try again.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResendLoading(false);
    if (!error) {
      setResendSent(true);
    } else {
      setError('Could not resend email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-900/10 blur-[120px]" />
      </div>

      <div className="absolute top-6 left-6 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <Logo className="h-14 w-auto" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-center text-4xl font-serif text-white tracking-wide"
        >
          Welcome Back
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-center text-sm text-white/60"
        >
          New here?{' '}
          <Link
            to="/signup"
            className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Start your journey
          </Link>
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-white/10">

          {/* Email confirmation needed */}
          {needsConfirmation ? (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
                <Mail className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-serif text-white mb-2">Confirm Your Email</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  You signed up but haven't confirmed your email yet. Please check your inbox for a
                  confirmation link, then come back to log in.
                </p>
              </div>

              {resendSent ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-3 px-4">
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmation email sent! Check your inbox.
                </div>
              ) : (
                <button
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-50 transition-all"
                >
                  {resendLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Resend Confirmation Email'
                  )}
                </button>
              )}

              <button
                onClick={() => setNeedsConfirmation(false)}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                ← Try logging in again
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80">
                  Your Email
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-white/40" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-3 py-3 bg-black/20 border border-white/10 rounded-xl placeholder-white/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-white/80">
                    Your Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-white/40" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-3 py-3 bg-black/20 border border-white/10 rounded-xl placeholder-white/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-black bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
