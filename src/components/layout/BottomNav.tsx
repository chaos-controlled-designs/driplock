import { Home, Lock, ShoppingBag, Tag, MessageCircle } from 'lucide-react';

type Tab = 'event' | 'lock' | 'vault' | 'market' | 'chats';

const tabs = [
  { id: 'event'  as Tab, label: 'Home',    Icon: Home },
  { id: 'vault'  as Tab, label: 'Vault',   Icon: ShoppingBag },
  { id: 'lock'   as Tab, label: 'Lock In', isCenter: true },
  { id: 'market' as Tab, label: 'Cash In', Icon: Tag },
  { id: 'chats'  as Tab, label: 'Chats',   Icon: MessageCircle },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-white border-t border-primary/15 flex items-end px-3 pt-2.5 pb-6">
      {tabs.map((tab) => {
        const isActive = active === tab.id;

        if (tab.isCenter) return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-1 flex flex-col items-center -mt-7"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
              isActive
                ? 'bg-plum scale-105 shadow-strong'
                : 'bg-gradient-to-br from-primary to-lavender shadow-glow'
            }`}>
              <Lock size={24} color={isActive ? 'white' : '#3f2a2a'} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-semibold mt-1.5 tracking-tight ${isActive ? 'text-plum' : 'text-plum/35'}`}>
              {tab.label}
            </span>
          </button>
        );

        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-1 flex flex-col items-center gap-1 py-0.5 transition-all active:scale-90"
          >
            {tab.Icon && (
              <tab.Icon
                size={21}
                color={isActive ? '#d06050' : 'rgba(63,42,42,0.30)'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
            )}
            <span className={`text-[10px] font-semibold tracking-tight ${isActive ? 'text-[#d06050]' : 'text-plum/35'}`}>
              {tab.label}
            </span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#d06050] -mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
