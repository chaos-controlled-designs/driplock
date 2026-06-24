import { Home, Lock, ShoppingBag, Tag, MessageCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isVIPActive } from '../../lib/supabase';

export type Tab = 'event' | 'lock' | 'vault' | 'market' | 'chats' | 'school';

const tabs = [
  { id: 'event'  as Tab, label: 'Home',     Icon: Home },
  { id: 'vault'  as Tab, label: 'Vault',    Icon: ShoppingBag },
  { id: 'lock'   as Tab, label: 'Lock In',  isCenter: true },
  { id: 'market' as Tab, label: 'Cash In',  Icon: Tag },
  { id: 'chats'  as Tab, label: 'Messages', Icon: MessageCircle },
  { id: 'school' as Tab, label: 'School',   Icon: Sparkles },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  const { profile } = useAuth();
  const isVIP = isVIPActive(profile);

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-white rounded-t-[28px] border-t border-primary/10 shadow-[0_-4px_24px_rgba(255,193,184,0.12)] flex items-end px-2 pt-2.5 pb-6">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const isLockedSchool = tab.id === 'school' && !isVIP;

        if (tab.isCenter) return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-1 flex flex-col items-center -mt-7"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isActive
                ? 'bg-plum scale-105 shadow-strong'
                : 'bg-gradient-to-br from-primary to-lavender shadow-glow'
            }`}>
              <Lock size={22} color={isActive ? 'white' : '#3f2a2a'} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-semibold mt-1.5 tracking-tight ${isActive ? 'text-plum' : 'text-plum/35'}`}>
              {tab.label}
            </span>
          </button>
        );

        const isVIPSchool = tab.id === 'school' && isVIP;

        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-1 flex flex-col items-center gap-1 py-0.5 transition-all active:scale-90"
          >
            {/* Icon area */}
            <div className="relative">
              {/* VIP school tab: glowing swatch behind the icon */}
              {isVIPSchool && (
                <div className={`absolute inset-0 -m-1.5 rounded-xl ${
                  isActive
                    ? 'bg-gradient-to-br from-primary/40 to-lavender/40'
                    : 'bg-gradient-to-br from-primary/15 to-lavender/15'
                }`} />
              )}

              {tab.Icon && (
                <tab.Icon
                  size={20}
                  color={
                    isActive && isVIPSchool
                      ? '#b060a0'
                      : isActive
                      ? '#d06050'
                      : isLockedSchool
                      ? 'rgba(63,42,42,0.18)'
                      : isVIPSchool
                      ? '#c070b0'
                      : 'rgba(63,42,42,0.30)'
                  }
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              )}

              {/* Non-VIP lock badge */}
              {isLockedSchool && (
                <div className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-plum/20 flex items-center justify-center">
                  <Lock size={7} color="rgba(63,42,42,0.45)" />
                </div>
              )}

              {/* VIP dot — signals premium content available */}
              {isVIPSchool && !isActive && (
                <div className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-gradient-to-br from-primary to-lavender" />
              )}
            </div>

            <span className={`text-[9px] font-semibold tracking-tight ${
              isActive && isVIPSchool
                ? 'text-[#b060a0]'
                : isActive
                ? 'text-[#d06050]'
                : isLockedSchool
                ? 'text-plum/20'
                : isVIPSchool
                ? 'text-[#c070b0]'
                : 'text-plum/35'
            }`}>
              {isVIPSchool ? 'My School' : tab.label}
            </span>

            {isActive && !isLockedSchool && (
              <span className={`w-1.5 h-1.5 rounded-full -mt-0.5 ${
                isVIPSchool ? 'bg-[#b060a0]' : 'bg-[#d06050]'
              }`} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
