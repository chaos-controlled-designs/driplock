import { useNavigate } from 'react-router-dom';
import { Shield, ShoppingBag, Lock, Tag } from 'lucide-react';

const STEPS = [
  {
    emoji: '🔒',
    title: 'Lock In Your Look',
    desc: "Enter your dress color and silhouette. We privately check if anyone at your school has the same — only you see the result.",
    bg: 'bg-blush',
  },
  {
    emoji: '👗',
    title: 'Shop The Vault',
    desc: "Browse gorgeous prom dresses from girls at other schools. Rent for a fraction of retail or buy to own — ships nationwide.",
    bg: 'bg-lavender',
  },
  {
    emoji: '💸',
    title: 'Earn From Your Closet',
    desc: "List last year's dress for rent or sale and make your money back. Safe, simple, girl-to-girl.",
    bg: 'bg-sage',
  },
];

const BADGES = [
  { Icon: Shield,      label: 'Safe & Private' },
  { Icon: Lock,        label: 'No Real Names' },
  { Icon: ShoppingBag, label: 'Girls Only' },
  { Icon: Tag,         label: 'Free to Join' },
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream flex flex-col">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-[linear-gradient(150deg,#fff0eb_0%,#ffd4c4_50%,#f5e6ff_100%)] px-6 pt-14 pb-12 flex flex-col items-center text-center">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/25 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/20 pointer-events-none" />

        {/* Logo mark */}
        <div className="relative mb-5">
          <div className="w-24 h-24 rounded-[28px] bg-white/60 backdrop-blur-sm border border-white/80 flex items-center justify-center shadow-[0_8px_32px_rgba(255,193,184,0.40)]">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#3f2a2a" strokeWidth="1.75" strokeLinecap="round">
              <rect x="5" y="11" width="14" height="10" rx="3"/>
              <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
              <circle cx="12" cy="16" r="1.5" fill="#3f2a2a" stroke="none"/>
            </svg>
          </div>
          {/* Live dot */}
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-primary to-lavender border-2 border-white shadow-soft" />
        </div>

        <h1 className="font-display text-5xl font-bold text-plum tracking-tight mb-2">
          Drip<span className="text-primary">Lock</span>
        </h1>
        <p className="text-plum/50 font-semibold text-xs tracking-widest uppercase mb-4">
          Your Prom. Your Look. Protected.
        </p>
        <p className="text-plum/65 text-[15px] leading-relaxed max-w-[300px] mb-8">
          Lock in your dream look, make sure no one shows up in the same dress, and shop gorgeous gowns from girls across the country.
        </p>

        {/* CTAs */}
        <div className="w-full max-w-xs flex flex-col gap-3 mb-8">
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="btn-primary text-base py-4 shadow-[0_6px_24px_rgba(255,193,184,0.50)]"
          >
            Get Started — It's Free
          </button>
          <button type="button" onClick={() => navigate('/login')} className="btn-secondary">
            I Already Have an Account
          </button>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {BADGES.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/70">
              <Icon size={11} className="text-plum/50" />
              <span className="text-plum/60 text-[11px] font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works ── */}
      <div className="bg-cream px-5 pt-8 pb-6">
        <h2 className="font-display text-xl font-bold text-plum text-center mb-1">How It Works</h2>
        <p className="text-plum/40 text-xs text-center mb-6">Three steps. Zero drama.</p>

        <div className="flex flex-col gap-3">
          {STEPS.map((s, i) => (
            <div key={i} className={`${s.bg} rounded-3xl px-5 py-4 flex items-start gap-4`}>
              <div className="w-11 h-11 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-xl shadow-soft">
                {s.emoji}
              </div>
              <div className="flex-1 pt-0.5">
                <h3 className="font-bold text-plum text-sm mb-1">{s.title}</h3>
                <p className="text-plum/60 text-xs leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── VIP teaser ── */}
      <div className="mx-5 mb-5 rounded-3xl overflow-hidden bg-[linear-gradient(135deg,#ffd4c4_0%,#f5e6ff_100%)] px-5 py-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">✨</span>
          <p className="font-bold text-plum text-sm">VIP Membership</p>
          <span className="bg-plum/10 text-plum/60 text-[10px] font-bold px-2 py-0.5 rounded-full">From $6.99</span>
        </div>
        <p className="text-plum/60 text-xs leading-relaxed mb-3">
          See every dress locked in at your school — anonymized. Get early access to new listings and priority placement in the Vault.
        </p>
        <div className="flex flex-wrap gap-2">
          {["👁 School's Looks", "⚡ Boosted Listings", "📸 10 Photos", "⏰ Early Access"].map(b => (
            <span key={b} className="bg-white/60 text-plum/70 text-[11px] font-semibold px-2.5 py-1 rounded-full">{b}</span>
          ))}
        </div>
      </div>

      {/* ── Safety footer ── */}
      <div className="mx-5 mb-5 bg-white rounded-3xl shadow-soft px-5 py-4 flex items-start gap-3">
        <Shield size={18} className="text-primary flex-shrink-0 mt-0.5"/>
        <div>
          <p className="font-bold text-plum text-xs mb-0.5">Built for your safety</p>
          <p className="text-plum/50 text-xs leading-relaxed">
            No real names shown. No addresses shared. Buddy system required for meetups. You're always in control.
          </p>
        </div>
      </div>

      <p className="text-center text-plum/25 text-xs pb-8">© 2026 DripLock · Made for girls, by girls</p>
    </div>
  );
}
