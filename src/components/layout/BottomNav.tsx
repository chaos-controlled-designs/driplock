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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-cream/95 backdrop-blur-sm border-t border-plum/5 flex items-center px-2 py-2">
      {tabs.map((tab) => {
        const isActive = active === tab.id;

        if (tab.isCenter) return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-1 flex flex-col items-center -mt-6"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-glow transition-all ${isActive ? 'bg-plum scale-110' : 'bg-gradient-to-br from-primary to-rose-400'}`}>
              <Lock size={22} color="white" />
            </div>
            <span className={`text-[10px] font-semibold mt-1 ${isActive ? 'text-plum' : 'text-plum/40'}`}>
              {tab.label}
            </span>
          </button>
        );

        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-1 flex flex-col items-center gap-1 py-1"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-blush' : ''}`}>
              {tab.Icon && <tab.Icon size={18} color={isActive ? '#E8847A' : '#2D1B3580'} />}
            </div>
            <span className={`text-[10px] font-semibold ${isActive ? 'text-primary' : 'text-plum/40'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}