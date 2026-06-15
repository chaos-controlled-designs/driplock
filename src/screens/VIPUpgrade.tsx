import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isVIPActive } from '../lib/supabase';
import { ArrowLeft, Sparkles, CheckCircle2, RefreshCw, Lock } from 'lucide-react';
import { VIPModal } from '../components/VIPModal';

export function VIPUpgrade() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();

  const [justActivated, setJustActivated] = useState(false);
  const [activating, setActivating]       = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const [zipCode, setZipCode]             = useState(profile?.zip_code ?? '');
  const [zipSaved, setZipSaved]           = useState(false);
  const [showModal, setShowModal]         = useState(false);

  const alreadyVIP = isVIPActive(profile);

  // When Stripe redirects back with ?activated=1, auto-refresh to pick up the webhook update
  useEffect(() => {
    if (searchParams.get('activated') === '1') {
      setJustActivated(true);
      setActivating(true);
      refreshProfile().then(() => setActivating(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const saveZip = async () => {
    if (!zipCode.trim() || !user) return;
    await supabase.from('profiles').update({ zip_code: zipCode.trim() }).eq('id', user.id);
    setZipSaved(true);
  };

  // ── Activating loader (Stripe just redirected back) ─────────────
  if (justActivated && activating) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center mb-6 shadow-glow">
        <RefreshCw size={32} className="text-plum animate-spin" />
      </div>
      <h2 className="font-display text-2xl font-bold text-plum mb-2">Activating VIP…</h2>
      <p className="text-plum/55 text-sm leading-relaxed max-w-[260px]">
        Payment received — confirming your membership. Just a moment.
      </p>
    </div>
  );

  // ── Already VIP (pre-existing or just activated) ─────────────────
  if (alreadyVIP) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      {/* Celebration ring */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center shadow-glow">
          <Sparkles size={40} className="text-plum" />
        </div>
        {justActivated && (
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center shadow-soft">
            <CheckCircle2 size={18} className="text-white" />
          </div>
        )}
      </div>

      {justActivated && (
        <div className="bg-sage/50 rounded-2xl border border-sage px-4 py-3 mb-5 max-w-[300px]">
          <p className="font-bold text-plum text-sm">VIP activated! 🎉</p>
          <p className="text-plum/60 text-xs mt-0.5">Welcome to the VIP experience</p>
        </div>
      )}

      <h2 className="font-display text-2xl font-bold text-plum mb-1">You're VIP ✨</h2>
      <p className="text-plum/60 text-sm mb-1">
        {profile?.vip_status === 'season' ? 'Full Season' : 'One Event'} — active
      </p>
      {profile?.vip_expiry && (
        <p className="text-plum/35 text-xs mb-8">
          Expires {new Date(profile.vip_expiry).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      )}

      <button type="button" onClick={() => navigate('/school')} className="btn-primary mb-3">
        View My School's Looks
      </button>
      <button type="button" onClick={() => navigate('/event')} className="btn-secondary">
        Go to Dashboard
      </button>
    </div>
  );

  // ── Payment received but webhook not yet processed ───────────────
  if (justActivated && !activating && !alreadyVIP) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-lavender/60 flex items-center justify-center mb-5 shadow-soft">
        <Lock size={32} className="text-plum/60" />
      </div>
      <h2 className="font-display text-xl font-bold text-plum mb-2">Almost there…</h2>
      <p className="text-plum/55 text-sm leading-relaxed max-w-[270px] mb-6">
        Your payment was received. VIP activation usually takes a few seconds — tap below to check.
      </p>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="btn-primary mb-3"
      >
        {refreshing
          ? <><RefreshCw size={16} className="inline animate-spin mr-2" />Checking…</>
          : 'Check VIP Status'}
      </button>
      <button type="button" onClick={() => navigate('/event')} className="btn-secondary">
        Go to Dashboard
      </button>
    </div>
  );

  // ── Default: upgrade page ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream pb-12">

      {/* Header */}
      <div style={{
        background: 'linear-gradient(150deg, #fff0eb 0%, #ffd4c4 55%, #ffc1b8 100%)',
        padding: '52px 24px 40px',
        borderRadius: '0 0 32px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -48, right: -48, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -32, left: -24, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-plum/60 text-sm font-medium mb-6"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center border border-white/60 shadow-soft">
            <Sparkles size={24} className="text-plum" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-plum/50 mb-0.5">Exclusive Membership</p>
            <h1 className="font-display text-2xl font-bold text-plum leading-tight">VIP Lock</h1>
          </div>
        </div>
        <p className="text-plum/65 text-sm leading-relaxed max-w-[300px]">
          See what your school is wearing. Get seen first. The ultimate prom edge.
        </p>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-5">

        {/* What you get — summary cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: '👁', title: "School's Looks", desc: 'See your school — anonymized' },
            { emoji: '⚡', title: 'Boosted Listing', desc: 'Appear first in The Vault' },
            { emoji: '⏰', title: 'Early Access',    desc: '24h before everyone else' },
            { emoji: '📸', title: '10 Photos',       desc: 'More angles per listing' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl shadow-soft px-3.5 py-3">
              <p className="text-lg mb-1">{emoji}</p>
              <p className="font-semibold text-plum text-xs">{title}</p>
              <p className="text-plum/45 text-[11px] leading-snug">{desc}</p>
            </div>
          ))}
        </div>

        {/* Zip code boost */}
        <div className="bg-white rounded-2xl shadow-soft px-4 py-4">
          <p className="font-semibold text-plum text-sm mb-0.5">Surrounding Schools Boost</p>
          <p className="text-plum/50 text-xs mb-3 leading-relaxed">
            Enter your zip code to boost visibility to girls at nearby schools too.
          </p>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Your zip code"
              value={zipCode}
              onChange={e => { setZipCode(e.target.value); setZipSaved(false); }}
              onBlur={saveZip}
              className="input flex-1 text-sm"
              maxLength={10}
            />
            {zipSaved && (
              <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
            )}
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-full py-4 rounded-2xl font-bold text-plum text-base shadow-glow active:scale-[0.98] transition-all"
          style={{ background: 'linear-gradient(135deg, #ffc1b8, #ffd4c4)' }}
        >
          <Sparkles size={16} className="inline mr-2" />
          Choose Your Plan — from $6.99
        </button>

        <p className="text-plum/30 text-[10px] text-center leading-relaxed">
          Secure checkout via Stripe · Non-refundable once activated · Cancel anytime
        </p>

        {/* Already paid? */}
        <div className="bg-lavender/25 rounded-2xl border border-primary/12 px-4 py-3.5">
          <p className="font-semibold text-plum text-sm mb-0.5">Already paid?</p>
          <p className="text-plum/55 text-xs mb-2 leading-relaxed">
            VIP activates within seconds via Stripe. Tap below to refresh your status.
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-primary font-semibold text-xs"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Checking…' : 'Check VIP Status'}
          </button>
        </div>

      </div>

      {/* VIP Plan Modal */}
      <VIPModal open={showModal} onClose={() => setShowModal(false)} userId={user?.id} />
    </div>
  );
}
