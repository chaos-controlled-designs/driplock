import { X, Calendar, Lock, ShoppingBag, Store,
         MessageCircle, User, HelpCircle,
         LogOut, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

const items = [
  { path: '/event',     label: 'Event Dashboard', Icon: Calendar,      bg: 'bg-blush' },
  { path: '/lock',      label: 'Lock In My Look',  Icon: Lock,          bg: 'bg-lavender' },
  { path: '/vault',     label: 'The Vault',        Icon: ShoppingBag,   bg: 'bg-sage' },
  { path: '/market',    label: 'Cash In',           Icon: Store,         bg: 'bg-blush' },
  { path: '/chats',     label: 'Chats',             Icon: MessageCircle, bg: 'bg-lavender' },
  { path: '/favorites', label: 'My Favorites',      Icon: Heart,         bg: 'bg-blush' },
  { path: '/settings',  label: 'Settings & Profile', Icon: User,          bg: 'bg-sage' },
  { path: '/help',      label: 'Help & FAQ',        Icon: HelpCircle,    bg: 'bg-lavender' },
];

export function HamburgerMenu({ isOpen, onClose, onNavigate }: Props) {
  const { profile, signOut } = useAuth();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-plum/40 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-cream z-50 flex flex-col
        shadow-2xl transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-blush to-lavender px-5 pt-12 pb-6 flex items-start justify-between">
          <div>
            <p className="font-display text-xl font-bold text-plum">DripLock</p>
            {profile && (
              <>
                <p className="text-plum text-sm font-semibold mt-1">@{profile.username}</p>
                <p className="text-plum/50 text-xs">{profile.grade} grade</p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="w-8 h-8 bg-white/60 rounded-full flex items-center justify-center"
          >
            <X size={16} className="text-plum"/>
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-auto px-4 py-4 flex flex-col gap-2">
          {items.map((item) => (
            <button
              type="button"
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`${item.bg} rounded-2xl px-4 py-3 flex items-center gap-3 text-left transition-all active:scale-95 w-full`}
            >
              <item.Icon size={18} className="text-plum"/>
              <span className="font-semibold text-plum text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Sign out */}
        <div className="px-4 pb-8">
          <button
            type="button"
            onClick={async () => { await signOut(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-ivory text-plum/50 text-sm font-semibold transition-all active:scale-95"
          >
            <LogOut size={16}/>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}