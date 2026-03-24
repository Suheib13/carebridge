import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartPulse, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  MapPin, 
  Pill, 
  QrCode, 
  Bot, 
  Clock,
  ChevronRight,
  CheckCircle2,
  Apple,
  Moon,
  Dumbbell
} from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const HEALTH_TIPS = [
  {
    title: "Drink Water",
    desc: "Sip water throughout the day. Staying hydrated keeps your body humming, your skin glowing, and your mind sharp.",
    icon: <HeartPulse className="w-6 h-6 text-emerald-400" />,
    image: "https://i.postimg.cc/7Lycd1Pz/image.png"
  },
  {
    title: "Keep Moving",
    desc: "Find time to move. A brisk walk or a light jog keeps your heart happy, strong, and resilient against daily stress.",
    icon: <Dumbbell className="w-6 h-6 text-amber-400" />,
    image: "https://i.postimg.cc/ZqKPW0VB/image.png"
  },
  {
    title: "Rest Easy",
    desc: "Embrace a good night's sleep. Quality rest heals your body, boosts your immune system, and clears your mind for tomorrow.",
    icon: <Moon className="w-6 h-6 text-blue-400" />,
    image: "https://i.postimg.cc/qM4qT5n9/image.png"
  },
  {
    title: "Eat Fresh",
    desc: "Fill your plate with color. Fresh greens and whole foods fuel your day with natural energy and essential nutrients.",
    icon: <Apple className="w-6 h-6 text-red-400" />,
    image: "https://i.postimg.cc/3Js2Fn92/image.png"
  },
  {
    title: "Breathe Deep",
    desc: "Pause for a moment. A few deep breaths can melt away stress, lower your heart rate, and bring you immediate peace.",
    icon: <Activity className="w-6 h-6 text-purple-400" />,
    image: "https://i.postimg.cc/43mb1dx8/image.png"
  },
  {
    title: "Check In",
    desc: "Visit your doctor regularly. Catching things early is the best way to stay well and maintain long-term health.",
    icon: <ShieldCheck className="w-6 h-6 text-teal-400" />,
    image: "https://i.postimg.cc/1t8jNvJJ/image.png"
  }
];

const FEATURES = [
  {
    id: 'qr',
    title: 'A Scan That Saves Lives.',
    desc: 'One simple QR code holds your vital health details. Anyone can scan it instantly, even without internet.',
    icon: <QrCode className="w-6 h-6 text-white" />,
    color: 'bg-emerald-600',
    image: 'https://i.postimg.cc/tJrV6zTK/Chat-GPT-Image-Mar-4-2026-09-31-13-PM.png'
  },
  {
    id: 'ai',
    title: 'Your Health Guide, Always Awake.',
    desc: 'Tell us how you feel. Our smart assistant gently guides you to understand what might be wrong.',
    icon: <Bot className="w-6 h-6 text-white" />,
    color: 'bg-amber-600',
    image: 'https://i.postimg.cc/ZqDFk44n/image.png'
  },
  {
    id: 'hospital',
    title: 'Care When You Need It.',
    desc: 'Find the closest hospitals in a heartbeat. We guide you there, step by step.',
    icon: <MapPin className="w-6 h-6 text-white" />,
    color: 'bg-blue-600',
    image: 'https://i.postimg.cc/7L6PGy7b/Chat-GPT-Image-Mar-4-2026-09-36-59-PM.png'
  },
  {
    id: 'meds',
    title: 'Right Pill, Right Time.',
    desc: 'Friendly nudges remind you to take your medicine. Never miss a dose again.',
    icon: <Pill className="w-6 h-6 text-white" />,
    color: 'bg-indigo-600',
    image: 'https://i.postimg.cc/5NYvXGjS/image.png'
  }
];

export default function Landing() {
  const [currentTip, setCurrentTip] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % HEALTH_TIPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen text-white font-sans selection:bg-white/30 selection:text-white overflow-x-hidden relative">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo showText={true} />
          </Link>
          
          {/* Quick Access Buttons in Header */}
          <div className="hidden lg:flex items-center gap-10">
            <Link to="/login" className="text-xs font-medium text-white/70 hover:text-white uppercase tracking-[0.2em] transition-colors">AI Triage</Link>
            <Link to="/login" className="text-xs font-medium text-white/70 hover:text-white uppercase tracking-[0.2em] transition-colors">Find Hospital</Link>
            <Link to="/login" className="text-xs font-medium text-white/70 hover:text-white uppercase tracking-[0.2em] transition-colors">Reminders</Link>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <ThemeToggle />
            <Link to="/login" className="text-xs font-medium text-white/70 hover:text-white uppercase tracking-[0.2em] transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link to="/signup" className="hidden sm:inline-flex px-8 py-3.5 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/90 transition-all rounded-xl whitespace-nowrap">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://i.postimg.cc/qM7YyMqZ/image.png" 
            alt="Hero Background"
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          {/* Dark overlay for text readability and luxury feel */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#050505]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-[#050505]/50 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full pt-20 flex flex-col items-start">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl border border-white/20 text-white/90 text-[10px] sm:text-xs font-medium uppercase tracking-[0.3em] mb-8 backdrop-blur-md bg-white/5">
              <span className="w-1.5 h-1.5 rounded-xl bg-emerald-500 animate-pulse" />
              Your Health, Secured
            </div>
            
            <h1 className="text-[38px] sm:text-[58px] md:text-[72px] lg:text-[87px] font-salsa font-normal text-white tracking-[0.5px] leading-[1.05] mb-8">
              Let your health speak,<br/>
              <span className="italic text-white/60 font-salsa">when words fail you.</span>
            </h1>
            
            <div className="w-24 h-[1px] bg-white/30 mb-8" />
            
            <p className="text-base sm:text-lg md:text-xl text-emerald-50/70 mb-12 leading-relaxed max-w-2xl font-light tracking-wide">
              Carry your vital health story wherever you go. One quick scan reveals what matters most, saving precious time when every second counts.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center w-full sm:w-auto">
              <Link to="/signup" className="group relative inline-flex items-center justify-center gap-4 px-10 py-5 bg-white text-black text-xs uppercase tracking-[0.2em] font-semibold overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl w-full sm:w-auto">
                <span className="relative z-10 flex items-center gap-3">
                  Create Free Profile
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-xl" />
              </Link>
              
              <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 text-xs uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors relative after:absolute after:bottom-2 after:left-8 after:right-8 after:h-[1px] after:bg-white/30 after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 rounded-xl w-full sm:w-auto border border-white/10 sm:border-transparent">
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="border-y border-white/10 py-20 px-6 lg:px-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-[28px] sm:text-[42px] md:text-[60px] lg:text-[87px] font-salsa font-normal text-white/90 tracking-[0.5px] leading-tight">
            "When moments matter, <br className="hidden md:block"/>
            <span className="italic text-white/70 font-salsa">clarity is the cure.</span>"
          </h2>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto mb-24">
          <h2 className="text-[38px] sm:text-[55px] md:text-[70px] lg:text-[87px] font-salsa font-normal text-white mb-8 tracking-[0.5px] leading-[1.1]">Crafted for care.<br/><span className="italic text-emerald-100/60">Made for you.</span></h2>
          <p className="text-xl text-emerald-50/70 font-light leading-relaxed">Simple tools to keep you safe, sound, and ready for whatever comes your way.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {FEATURES.map((feature, index) => (
            <motion.div 
              key={feature.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="group relative"
            >
              <div className="aspect-[4/5] overflow-hidden relative mb-8 rounded-2xl">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-1000" />
                <div className={`absolute top-8 left-8 w-16 h-16 bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/20 rounded-xl`}>
                  {feature.icon}
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-salsa text-white mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-emerald-50/70 leading-relaxed font-light text-lg">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Health Tips Carousel */}
      <section className="py-24 relative px-6 lg:px-12 border-t border-white/10 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
            <div>
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl border border-white/20 text-white/80 text-xs font-medium uppercase tracking-[0.2em] mb-8 backdrop-blur-md">
                <Activity className="w-4 h-4" />
                Lifestyle & Wellness
              </div>
              <h2 className="text-[38px] sm:text-[55px] md:text-[70px] lg:text-[87px] font-salsa font-normal text-white tracking-[0.5px]">Daily Health Insights</h2>
            </div>
            <div className="flex gap-4">
              {HEALTH_TIPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTip(idx)}
                  className={`h-1 transition-all duration-700 ease-out ${
                    idx === currentTip ? 'bg-white w-16' : 'bg-white/20 w-8 hover:bg-white/40'
                  }`}
                  aria-label={`Go to tip ${idx + 1}`}
                />
              ))}
            </div>
          </div>
          
          <div className="relative aspect-[16/9] md:aspect-[21/9]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTip}
                initial={{ opacity: 0, filter: "blur(20px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(20px)" }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex flex-col md:flex-row overflow-hidden rounded-2xl"
              >
                <div className="w-full md:w-2/3 h-full relative">
                  <img 
                    src={HEALTH_TIPS[currentTip].image} 
                    alt={HEALTH_TIPS[currentTip].title}
                    className="w-full h-full object-contain bg-black/40"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent md:hidden pointer-events-none" />
                </div>
                <div className="w-full md:w-1/3 h-full bg-[#0a0a0a] p-10 md:p-16 flex flex-col justify-center border-l border-white/10 rounded-r-2xl">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center mb-10 rounded-xl">
                    {HEALTH_TIPS[currentTip].icon}
                  </div>
                  <h3 className="text-4xl md:text-5xl font-salsa text-white mb-6 tracking-tight">{HEALTH_TIPS[currentTip].title}</h3>
                  <p className="text-xl text-emerald-50/70 font-light leading-relaxed">{HEALTH_TIPS[currentTip].desc}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="border border-white/10 p-16 md:p-24 text-center relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://i.postimg.cc/QxdWgvpH/image.png"
              alt="Secure Health Profile"
              className="w-full h-full object-cover opacity-40"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          <div className="relative z-10">
            <h2 className="text-[38px] sm:text-[55px] md:text-[70px] lg:text-[87px] font-salsa font-normal text-white mb-10 tracking-[0.5px] leading-[1.1]">Ready to hold your <br/><span className="italic text-emerald-100/60">health in hand?</span></h2>
            <p className="text-xl md:text-2xl text-emerald-50/70 mb-16 max-w-3xl mx-auto font-light leading-relaxed">Step into CareBridge today. Keep your vital story safe, simple, and always close by.</p>
            <Link to="/signup" className="inline-flex items-center justify-center gap-4 px-12 py-6 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-white/90 transition-all rounded-2xl">
              Start Your Journey
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900/80 border-t border-white/10 py-12 px-6 lg:px-12 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo showText={true} />
          </Link>
          <p className="text-white/40 text-sm font-light tracking-wide">
            © {new Date().getFullYear()} CareBridge. All rights reserved.
          </p>
          <div className="flex gap-10 text-xs font-medium text-white/40 uppercase tracking-[0.2em]">
            <a href="mailto:carebridge.qr@gmail.com" className="hover:text-white transition-colors">Contact: carebridge.qr@gmail.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
