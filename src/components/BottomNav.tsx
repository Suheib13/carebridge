import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bot, MapPin, Bell } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/ai-check', icon: Bot, label: 'AI Check' },
  { to: '/hospital-finder', icon: MapPin, label: 'Hospitals' },
  { to: '/medications', icon: Bell, label: 'Reminders' },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/85 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl transition-all min-w-[64px] active:scale-95 ${
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/45 hover:text-white/80'
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
