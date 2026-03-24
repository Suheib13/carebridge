import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bell, MapPin, Bot, LogOut } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Health Hub', icon: LayoutDashboard },
  { to: '/medications', label: 'Reminders', icon: Bell },
  { to: '/hospital-finder', label: 'Hospitals', icon: MapPin },
  { to: '/ai-check', label: 'AI Triage', icon: Bot },
];

export default function Navbar() {
  const { signOut } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 shrink-0 sticky top-0 z-50 print:hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">

          {/* Left — Logo */}
          <div className="flex-1 flex items-center">
            <Link to="/" className="hover:opacity-80 transition-opacity shrink-0">
              <Logo className="h-10 w-auto" />
            </Link>
          </div>

          {/* Center — App name (mobile) / Nav tabs (desktop) */}
          <Link to="/" className="md:hidden text-xl font-salsa text-white tracking-wide">
            CareBridge
          </Link>
          <nav className="hidden md:flex items-center gap-1.5">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    active
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right — Sign out */}
          <div className="flex-1 flex items-center justify-end">
            <button
              onClick={signOut}
              className="hidden md:flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-sm font-medium text-white/60 bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
            {/* Mobile — icon only */}
            <button
              onClick={signOut}
              className="md:hidden p-2 border border-white/10 rounded-xl text-white/70 bg-white/5 hover:bg-white/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
