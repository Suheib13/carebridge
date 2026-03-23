import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  AlertTriangle,
  Activity,
  Mic,
  MicOff,
  Volume2,
  Loader2,
  Info,
  WifiOff,
} from 'lucide-react';
import Navbar from '../components/Navbar';

interface SymptomResult {
  severity: 'Low' | 'Moderate' | 'Emergency';
  summary: string;
  causes: string[];
  advice: string[];
}

export default function AiCheck() {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const initialSymptomsRef = useRef('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        const base = initialSymptomsRef.current.trim();
        const newText = currentTranscript.trim();
        setSymptoms(base ? base + ' ' + newText : newText);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        initialSymptomsRef.current = symptoms;
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        setError('Voice input is not supported in this browser.');
      }
    }
  };

  const handleCheck = async () => {
    if (!symptoms.trim()) {
      setError('Please enter your symptoms first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setAiUnavailable(false);

    try {
      const response = await fetch('/api/ai-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.unavailable) {
          setAiUnavailable(true);
          return;
        }
        throw new Error(data.error || 'Failed to analyze symptoms.');
      }

      setResult(data as SymptomResult);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const readAloud = () => {
    if (!result) return;
    window.speechSynthesis.cancel();
    const text = `Severity level is ${result.severity}. ${result.summary} Possible causes include ${result.causes.join(', ')}. Advice: ${result.advice.join('. ')}. Please remember, I am an AI, not a doctor. Seek professional medical help if needed.`;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen pb-28 md:pb-12 text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

        {/* AI Unavailable Banner */}
        {aiUnavailable && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex gap-4 items-start relative z-10"
          >
            <WifiOff className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-1">
                AI Guidance Temporarily Unavailable
              </h3>
              <p className="text-sm text-amber-200/80 font-light leading-relaxed">
                Our AI health guide is temporarily offline. If you are experiencing a medical
                emergency, please{' '}
                <a href="tel:112" className="font-bold underline">
                  call emergency services (112/911)
                </a>{' '}
                immediately. For non-emergency advice, please consult your doctor or a pharmacist.
              </p>
            </div>
          </motion.div>
        )}

        {/* Medical Disclaimer */}
        <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 flex gap-4 items-start relative z-10 backdrop-blur-sm">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white/70 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-widest mb-1">
              A Gentle Reminder
            </h3>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-light">
              I am an AI, here to guide you, not to heal you. I cannot replace a real doctor. If
              this is an emergency, please call for help right away.
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden mb-6 relative z-10"
        >
          <div className="p-5 sm:p-10 relative z-10">
            <label htmlFor="symptoms" className="block text-xl sm:text-2xl font-serif text-white mb-2">
              How are you feeling today?
            </label>
            <p className="text-sm sm:text-base text-white/60 mb-5 font-light">
              Tell me what's wrong. The more you share, the better I can understand.
            </p>

            <div className="relative">
              <textarea
                id="symptoms"
                rows={4}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="block w-full rounded-2xl bg-black/40 border-white/10 shadow-inner text-white focus:border-white/50 focus:ring-white/50 text-base sm:text-lg py-4 px-5 pr-16 border transition-all resize-none font-light placeholder-white/30"
                placeholder="e.g. I have a headache and fever since this morning..."
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute bottom-4 right-4 p-3 rounded-xl transition-all shadow-lg ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                    : 'bg-white/10 text-white/80 border border-white/10 hover:bg-white/20 hover:text-white'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>

            {isListening && (
              <p className="mt-3 text-sm text-red-400 flex items-center gap-2 font-light">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse inline-block" />
                Listening… speak clearly
              </p>
            )}

            {error && (
              <p className="mt-4 text-sm text-red-400 flex items-center gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCheck}
                disabled={loading || !symptoms.trim()}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-transparent rounded-xl text-sm font-bold uppercase tracking-widest text-black bg-white hover:bg-white/90 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5" />
                    Understand My Symptoms
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden relative z-10"
          >
            <div
              className={`p-5 sm:p-10 border-b border-white/10 ${
                result.severity === 'Emergency'
                  ? 'bg-red-500/10'
                  : result.severity === 'Moderate'
                  ? 'bg-white/10'
                  : 'bg-white/5'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">
                    What This Might Be
                  </h3>
                  <div className="flex items-center gap-4">
                    {result.severity === 'Emergency' && (
                      <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
                    )}
                    {result.severity === 'Moderate' && (
                      <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    )}
                    {result.severity === 'Low' && (
                      <Info className="w-8 h-8 sm:w-10 sm:h-10 text-white/70" />
                    )}
                    <span
                      className={`text-3xl sm:text-4xl font-serif ${
                        result.severity === 'Emergency'
                          ? 'text-red-400'
                          : result.severity === 'Moderate'
                          ? 'text-white'
                          : 'text-white/70'
                      }`}
                    >
                      {result.severity}
                    </span>
                  </div>
                </div>
                <button
                  onClick={readAloud}
                  className="p-3 bg-white/5 rounded-xl shadow-sm border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  title="Read aloud"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {result.severity === 'Emergency' && (
                <a
                  href="tel:112"
                  className="mt-5 flex items-center justify-center gap-3 bg-red-500 hover:bg-red-400 text-white font-bold uppercase tracking-widest text-sm py-4 px-6 rounded-2xl transition-all active:scale-95 w-full"
                >
                  Call Emergency Services (112)
                </a>
              )}
            </div>

            <div className="p-5 sm:p-10 space-y-8">
              <p className="text-base sm:text-lg text-white/80 font-light leading-relaxed">
                {result.summary}
              </p>

              <div>
                <h4 className="text-lg sm:text-xl font-serif text-white mb-4 flex items-center gap-3">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white/70" />
                  What Could Be Happening
                </h4>
                <ul className="space-y-3">
                  {result.causes.map((cause, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-white/80 font-light text-base sm:text-lg">
                      <span className="text-white/70 mt-1.5 text-sm shrink-0">◆</span>
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-white/10">
                <h4 className="text-lg sm:text-xl font-serif text-white mb-5 flex items-center gap-3">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white/70" />
                  What You Should Do Next
                </h4>
                <ul className="space-y-3">
                  {result.advice.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-4 bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/5 text-white/80 font-light"
                    >
                      <span className="flex-shrink-0 w-8 h-8 bg-white/10 text-white border border-white/20 rounded-xl flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </span>
                      <span className="mt-1 text-sm sm:text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
