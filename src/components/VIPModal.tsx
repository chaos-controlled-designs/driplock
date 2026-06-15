import { Sparkles, X, Eye, Zap, Clock, Camera, Star } from 'lucide-react';

const VIP_STRIPE_SINGLE = 'https://buy.stripe.com/7sY7sEecB9879CJ3SWgYU03';
const VIP_STRIPE_SEASON = 'https://buy.stripe.com/28EdR25G55VV2ah9dggYU04';

const SINGLE_FEATURES = [
  { Icon: Eye,    text: "My School's Looks — see every look locked at your school" },
  { Icon: Zap,    text: 'Boosted listing — shown first in The Vault' },
  { Icon: Clock,  text: '24-hour early access to new dress listings' },
  { Icon: Camera, text: '10 photos per listing (free accounts get 6)' },
];

const SEASON_FEATURES = [
  { Icon: Star,     text: 'Everything in One Event' },
  { Icon: Sparkles, text: 'Covers BOTH Prom + Homecoming' },
  { Icon: Zap,      text: 'VIP active all school year long' },
];

interface VIPModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
}

export function VIPModal({ open, onClose, userId }: VIPModalProps) {
  if (!open) return null;

  const goToStripe = (base: string) => {
    window.location.href = `${base}?client_reference_id=${userId ?? ''}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(63,42,42,0.40)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] mx-auto bg-cream rounded-t-[32px] shadow-strong"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-plum/15" />
        </div>

        <div className="px-5 pt-3 pb-10">

          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-lavender flex items-center justify-center shadow-soft">
                  <Sparkles size={16} className="text-plum" />
                </div>
                <h2 className="font-display text-xl font-bold text-plum">Unlock VIP Lock</h2>
              </div>
              <p className="text-plum/50 text-xs ml-0.5">See your school's looks · get seen first · earn more</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-plum/8 flex items-center justify-center flex-shrink-0 mt-0.5"
            >
              <X size={15} className="text-plum/50" />
            </button>
          </div>

          {/* Plan 1 — One Event */}
          <button
            type="button"
            onClick={() => goToStripe(VIP_STRIPE_SINGLE)}
            className="w-full bg-white rounded-2xl border border-primary/20 shadow-soft px-4 py-4 mb-3 text-left active:scale-[0.985] transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-plum/35 mb-0.5">One Event</p>
                <p className="font-display text-2xl font-bold text-plum">$6.99</p>
              </div>
              <div className="bg-gradient-to-r from-primary to-lavender rounded-xl px-3 py-1.5 text-plum text-xs font-bold">
                Get VIP →
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {SINGLE_FEATURES.map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Icon size={10} className="text-plum/60" />
                  </div>
                  <p className="text-plum/60 text-xs leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </button>

          {/* Plan 2 — Full Season */}
          <button
            type="button"
            onClick={() => goToStripe(VIP_STRIPE_SEASON)}
            className="w-full bg-plum rounded-2xl shadow-strong px-4 py-4 mb-4 text-left active:scale-[0.985] transition-all relative overflow-hidden"
          >
            <div className="absolute top-3 right-3 bg-primary rounded-full px-2 py-0.5 text-[9px] font-bold text-plum tracking-wide">
              BEST VALUE
            </div>
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-0.5">Full Season</p>
              <p className="font-display text-2xl font-bold text-white">$11.99</p>
            </div>
            <div className="flex flex-col gap-1.5 mb-3">
              {SEASON_FEATURES.map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/12 flex items-center justify-center flex-shrink-0">
                    <Icon size={10} className="text-white/60" />
                  </div>
                  <p className="text-white/65 text-xs leading-snug">{text}</p>
                </div>
              ))}
            </div>
            <div className="w-full bg-gradient-to-r from-primary to-lavender rounded-xl py-2 text-plum text-xs font-bold text-center">
              Get VIP — Full Season ✨
            </div>
          </button>

          <p className="text-plum/30 text-[10px] text-center">
            Secure checkout via Stripe · Non-refundable once activated
          </p>

        </div>
      </div>
    </div>
  );
}
