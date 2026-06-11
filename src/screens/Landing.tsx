import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream flex flex-col">

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center mb-6 shadow-glow">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#3f2a2a" strokeWidth="1.8" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="10" rx="3"/>
            <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
            <circle cx="12" cy="16" r="1.5" fill="#3f2a2a" stroke="none"/>
          </svg>
        </div>

        <h1 className="font-display text-5xl font-bold text-plum mb-2 tracking-tight">
          Drip<span className="text-primary">Lock</span>
        </h1>
        <p className="text-gold font-semibold text-sm tracking-widest uppercase mb-6">
          Your Prom. Your Look. Protected.
        </p>
        <p className="text-plum/60 text-base leading-relaxed max-w-xs mb-10">
          Lock in your dream dress, make sure no one at your school shows up in the same look, and shop gorgeous gowns from girls across the country.
        </p>

        <div className="w-full max-w-xs flex flex-col gap-3 mb-10">
          <button type="button" onClick={() => navigate('/signup')} className="btn-primary">
            Get Started — It's Free
          </button>
          <button type="button" onClick={() => navigate('/login')} className="btn-secondary">
            I Already Have an Account
          </button>
        </div>

        <div className="flex items-center gap-8 text-plum/40">
          {['Safe & Private', 'Girls Only', 'All Schools'].map((b) => (
            <div key={b} className="flex flex-col items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"/>
              <span className="text-[10px] font-semibold uppercase tracking-wider">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-ivory px-6 py-8 rounded-t-3xl shadow-medium">
        <h2 className="font-display text-xl font-semibold text-plum text-center mb-6">How It Works</h2>
        <div className="flex flex-col gap-3 mb-6">
          {[
            { n: '01', title: 'Lock In Your Look', desc: 'Enter your dress color and silhouette. We privately check if anyone at your school event has the same — only you see the result.', bg: 'bg-blush' },
            { n: '02', title: 'Shop The Vault', desc: 'Browse prom dresses from girls at other schools. Rent for a fraction of the price or buy to own — with shipping available nationwide.', bg: 'bg-lavender' },
            { n: '03', title: 'Earn From Your Closet', desc: "List last year's dress for rent or sale and make your money back. Safe, simple, and girl-to-girl.", bg: 'bg-sage' },
          ].map((s) => (
            <div key={s.n} className={`${s.bg} rounded-2xl p-4 flex gap-4`}>
              <span className="font-display text-2xl font-bold text-primary/30">{s.n}</span>
              <div>
                <h3 className="font-semibold text-plum text-sm mb-1">{s.title}</h3>
                <p className="text-plum/60 text-xs leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-soft">
          <Shield size={18} className="text-primary flex-shrink-0 mt-0.5"/>
          <div>
            <p className="font-semibold text-plum text-xs mb-0.5">Built for your safety</p>
            <p className="text-plum/50 text-xs leading-relaxed">No real names shown. No addresses shared. Buddy system required for meetups. You're always in control.</p>
          </div>
        </div>

        <p className="text-center text-plum/30 text-xs mt-6">© 2026 DripLock · Made for girls, by girls</p>
      </div>
    </div>
  );
}