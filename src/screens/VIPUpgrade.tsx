import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isVIPActive } from '../lib/supabase';
import { ArrowLeft, Sparkles, CheckCircle2, RefreshCw, Lock } from 'lucide-react';
import { VIPModal } from '../components/VIPModal';

const POLL_INTERVAL_MS = 2000;
const POLL_MAX         = 22; // 22 × 2 s = 44 s

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

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const alreadyVIP = isVIPActive(profile);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  // Start polling when Stripe redirects back with ?activated=1
  useEffect(() => {
    if (searchParams.get('activated') !== '1') return;
    setJustActivated(true);
    setActivating(true);
    pollCountRef.current = 0;

    const tick = async () => {
      await refreshProfile();
      pollCountRef.current += 1;
      if (pollCountRef.current >= POLL_MAX) {
        stopPolling();
        setActivating(false); // fall through to "Almost there…" screen
      }
    };

    tick(); // check immediately on landing
    pollTimerRef.current = setInterval(tick, POLL_INTERVAL_MS);

    return stopPolling;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop polling the moment VIP activates, then auto-redirect to dashboard
  useEffect(() => {
    if (!justActivated || !alreadyVIP) return;
    stopPolling();
    setActivating(false);
    const t = setTimeout(() => navigate('/school'), 3000);
    return () => clearTimeout(t);
  }, [alreadyVIP, justActivated]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Polling / activating state ───────────────────────────────────
  if (justActivated && activating) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center mb-6 shadow-glow">
        <RefreshCw size={32} className="text-plum animate-spin" />
      </div>
      <h2 className="font-display text-2xl font-bold text-plum mb-2">Activating VIP…</h2>
      <p className="text-plum/55 text-sm leading-relaxed max-w-[260px]">
        Payment received — confirming your membership. This takes just a few seconds.
      </p>
    </div>
  );

  // ── Success screen (VIP confirmed) ───────────────────────────────
  if (alreadyVIP) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center shadow-glow">
          <Sparkles size={40} className="text-plum" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center shadow-soft">
          <CheckCircle2 size={18} className="text-white" />
        </div>
      </div>

      {justActivated && (
        <div className="bg-sage/50 rounded-2xl border border-sage px-4 py-3 mb-5 max-w-[300px]">
          <p className="font-bold text-plum text-sm">VIP activated! 🎉</p>
          <p className="text-plum/60 text-xs mt-0.5">Redirecting you to School Looks…</p>
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

  // ── Webhook not yet processed — manual retry fallback ────────────
  if (justActivated && !activating && !alreadyVIP) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-lavender/60 flex items-center justify-center mb-5 shadow-soft">
        <Lock size={32} className="text-plum/60" />
      </div>
      <h2 className="font-display text-xl font-bold text-plum mb-2">Still processing…</h2>
      <p className="text-plum/55 text-sm leading-relaxed max-w-[270px] mb-6">
        Your payment was received but VIP hasn't activated yet. Tap below to refresh, or try again in a minute.
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

  // ── Default: upgrade / marketing page ───────────────────────────
  return (
    <div className="min-h-screen bg-cream pb-12">

      {/* Header */}
      <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-cream via-lavender to-primary pt-[52px] px-6 pb-10">
        <div className="absolute -top-12 -right-12 w-[200px] h-[200px] rounded-full bg-white/[.18] pointer-events-none" />
        <div className="absolute -bottom-8 -left-6 w-[130px] h-[130px] rounded-full bg-white/10 pointer-events-none" />

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

        {/* Benefit cards */}
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
          className="w-full py-4 rounded-2xl font-bold text-plum text-base shadow-glow active:scale-[0.98] transition-all bg-gradient-to-br from-primary to-lavender"
        >
          <Sparkles size={16} className="inline mr-2" />
          Choose Your Plan — from $6.99
        </button>

        <p className="text-plum/30 text-[10px] text-center leading-relaxed">
          Secure checkout via Stripe · Non-refundable once activated
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

      <VIPModal open={showModal} onClose={() => setShowModal(false)} userId={user?.id} />
    </div>
  );
}
