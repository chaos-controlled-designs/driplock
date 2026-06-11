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
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-white/90 backdrop-blur-sm border-b border-primary/15 px-4 py-3 flex items-center justify-between">
      <button
        type="button"
        aria-label="Open menu"
        onClick={onMenuClick}
        className="w-9 h-9 rounded-full bg-ivory flex items-center justify-center shadow-soft text-plum"
      >
        <Menu size={18} />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-violet-300 flex items-center justify-center shadow-glow">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="10" rx="3"/>
            <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
            <circle cx="12" cy="16" r="1.5" fill="white" stroke="none"/>
          </svg>
        </div>
        <span className="font-display text-xl font-bold text-plum">
          Drip<span className="text-primary">Lock</span>
        </span>
      </div>

      <button
        type="button"
        aria-label="Open settings"
        onClick={() => navigate('/settings')}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-300 flex items-center justify-center shadow-glow text-plum text-xs font-bold"
      >
        {initials}
      </button>
    </header>
  );
}
