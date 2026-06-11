import { X, Calendar, Lock, ShoppingBag, Store,
         MessageCircle, User, HelpCircle,
         LogOut, Heart, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

const PRIMARY_ITEMS = [
  { path: '/event',     label: 'Event Dashboard',   Icon: Calendar,      bg: 'bg-blush' },
  { path: '/lock',      label: 'Lock In My Look',   Icon: Lock,          bg: 'bg-lavender' },
  { path: '/vault',     label: 'The Vault',          Icon: ShoppingBag,   bg: 'bg-sage' },
  { path: '/market',    label: 'Cash In',            Icon: Store,         bg: 'bg-lavender' },
  { path: '/favorites', label: 'My Favorites',       Icon: Heart,         bg: 'bg-blush' },
];

const SECONDARY_ITEMS = [
  { path: '/chats',     label: 'Messages',           Icon: MessageCircle, bg: 'bg-lavender' },
  { path: '/settings',  label: 'Settings & Profile', Icon: User,          bg: 'bg-sage' },
  { path: '/help',      label: 'Help & FAQ',         Icon: HelpCircle,    bg: 'bg-blush' },
];

function NavItem({ item, onNavigate }: { item: typeof PRIMARY_ITEMS[0]; onNavigate: (p: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.path)}
      className="flex items-center gap-3.5 px-3 py-3 rounded-2xl w-full text-left active:scale-[0.97] transition-all hover:bg-blush/60 group"
    >
      <div className={`w-10 h-10 ${item.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
        <item.Icon size={17} className="text-plum/70"/>
      </div>
      <span className="font-semibold text-plum text-sm flex-1">{item.label}</span>
      <ChevronRight size={14} className="text-plum/20 group-hover:text-plum/40 transition-colors"/>
    </button>
  );
}

export function HamburgerMenu({ isOpen, onClose, onNavigate }: Props) {
  const { profile, signOut } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-plum/30 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      <div className={`fixed top-0 left-0 h-full w-[280px] bg-cream z-50 flex flex-col
        shadow-strong transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header with user info */}
        <div className="bg-gradient-to-br from-blush to-lavender px-5 pt-14 pb-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/10 -translate-y-10 translate-x-10"/>

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center font-bold text-plum text-sm shadow-soft flex-shrink-0">
                {profile?.username?.slice(0, 2).toUpperCase() ?? 'DL'}
              </div>
              <div>
                {profile ? (
                  <>
                    <p className="font-display font-bold text-plum text-base leading-tight">DripLock</p>
                    <p className="text-plum/70 text-sm font-semibold mt-0.5">@{profile.username}</p>
                    <p className="text-plum/45 text-xs">{profile.grade} grade</p>
                  </>
                ) : (
                  <p className="font-display text-xl font-bold text-plum">DripLock</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <X size={15} className="text-plum"/>
            </button>
          </div>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-auto px-4 py-4 flex flex-col gap-1">
          {PRIMARY_ITEMS.map(item => (
            <NavItem key={item.path} item={item} onNavigate={onNavigate}/>
          ))}

          <div className="h-px bg-plum/6 my-2 mx-2"/>

          {SECONDARY_ITEMS.map(item => (
            <NavItem key={item.path} item={item} onNavigate={onNavigate}/>
          ))}
        </div>

        {/* Sign out */}
        <div className="px-4 pb-10">
          <button
            type="button"
            onClick={async () => { await signOut(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-ivory border border-plum/6 text-plum/45 text-sm font-semibold transition-all active:scale-95"
          >
            <LogOut size={15}/>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
