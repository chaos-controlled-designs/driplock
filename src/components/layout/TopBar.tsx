import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const initials = profile?.username?.slice(0, 2).toUpperCase()
    ?? user?.email?.slice(0, 2).toUpperCase()
    ?? '??';

  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-white/95 backdrop-blur-md border-b border-primary/10 px-5 py-3.5 flex items-center justify-between shadow-soft">

      <button
        type="button"
        aria-label="Open menu"
        onClick={onMenuClick}
        className="w-10 h-10 rounded-2xl bg-blush flex items-center justify-center transition-all active:scale-90"
      >
        <Menu size={19} className="text-plum"/>
      </button>

      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center shadow-soft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3f2a2a" strokeWidth="2.5" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="10" rx="3"/>
            <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
            <circle cx="12" cy="16" r="1.5" fill="#3f2a2a" stroke="none"/>
          </svg>
        </div>
        <span className="font-display text-xl font-bold text-plum tracking-tight">
          Drip<span className="text-primary">Lock</span>
        </span>
      </div>

      <button
        type="button"
        aria-label="Open settings"
        onClick={() => navigate('/settings')}
        className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-lavender flex items-center justify-center text-plum text-xs font-bold shadow-soft transition-all active:scale-90"
      >
        {initials}
      </button>
    </header>
  );
}
