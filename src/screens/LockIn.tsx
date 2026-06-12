import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Lock, ChevronDown, Shield, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';

const EVENT_ID = '22222222-2222-2222-2222-222222222222';

const SILHOUETTES = [
  'A-Line', 'Ball Gown', 'Bodycon', 'Empire Waist',
  'Fit & Flare', 'Sheath', 'Wrap', 'Slip Dress',
  'Mermaid', 'High-Low', 'Midi', 'Mini',
];

const COLORS = [
  'Black', 'White', 'Ivory', 'Champagne', 'Gold', 'Silver',
  'Blush Pink', 'Hot Pink', 'Fuchsia', 'Red', 'Burgundy', 'Coral',
  'Lavender', 'Purple', 'Royal Blue', 'Navy', 'Cobalt', 'Teal',
  'Emerald', 'Sage Green', 'Mint', 'Sky Blue', 'Yellow', 'Orange', 'Other',
];

const PRIMARY   = '#ffc1b8';
const PRIMARY_L = '#ffd4c4';
const PLUM      = '#3f2a2a';

interface PeerLock {
  user_id: string;
  profiles?: { username: string } | { username: string }[];
}

function getUsername(peer: PeerLock): string {
  if (!peer.profiles) return '?';
  const p = Array.isArray(peer.profiles) ? peer.profiles[0] : peer.profiles;
  return p?.username ?? '?';
}

// ── Color dropdown ─────────────────────────────────────────────
function ColorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="label mb-3">Dress Color</p>
      <div style={{ position: 'relative' }}>
        <select
          title="Dress Color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', appearance: 'none',
            padding: '17px 52px 17px 20px', borderRadius: 20,
            border: value ? `2.5px solid ${PRIMARY}` : '2px solid rgba(255,193,184,0.25)',
            background: value ? '#fff0eb' : '#fff',
            fontSize: 15, fontWeight: value ? 700 : 400,
            color: value ? PLUM : 'rgba(63,42,42,0.35)',
            cursor: 'pointer', outline: 'none', transition: 'all 0.2s',
            boxShadow: value ? '0 0 0 3px rgba(255,193,184,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <option value="">Choose your dress color</option>
          {COLORS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={17} style={{
          position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)',
          color: value ? PRIMARY : 'rgba(63,42,42,0.30)', pointerEvents: 'none',
        }}/>
        {value && (
          <CheckCircle2 size={16} style={{
            position: 'absolute', right: 46, top: '50%', transform: 'translateY(-50%)',
            color: PRIMARY,
          }}/>
        )}
      </div>
    </div>
  );
}

// ── 2-column silhouette grid — bigger, more tappable buttons ───
function SilhouetteGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="label mb-3">Silhouette</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {SILHOUETTES.map(s => {
          const sel = value === s;
          return (
            <button
              type="button"
              key={s}
              onClick={() => onChange(s)}
              style={{
                padding: '14px 10px', borderRadius: 18,
                fontSize: 12.5, fontWeight: 700, letterSpacing: '0.01em',
                border: sel ? `2.5px solid ${PRIMARY}` : '1.5px solid rgba(255,193,184,0.38)',
                background: sel ? PRIMARY : 'transparent',
                color: sel ? PLUM : 'rgba(63,42,42,0.55)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                boxShadow: sel ? '0 6px 20px rgba(255,193,184,0.45)' : 'none',
                transform: sel ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LockIn() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [color,      setColor]      = useState('');
  const [silhouette, setSilhouette] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [locked,     setLocked]     = useState(false);
  const [error,      setError]      = useState('');
  const [dupeUsers,  setDupeUsers]  = useState<string[]>([]);
  const [peers,      setPeers]      = useState<PeerLock[]>([]);

  const hasInput = color && silhouette;

  useEffect(() => {
    if (!user) return;
    supabase
      .from('locks')
      .select('user_id, profiles(username)')
      .eq('event_id', EVENT_ID)
      .neq('user_id', user.id)
      .limit(10)
      .then(({ data }) => { if (data) setPeers(data as PeerLock[]); });
  }, [user]);

  const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
      p,
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error('Request timed out — tap Retry')), ms)),
    ]);

  const runDupeCheck = async (): Promise<string[]> => {
    const { data, error: err } = await supabase
      .from('locks')
      .select('user_id, profiles(username)')
      .eq('event_id', EVENT_ID)
      .ilike('color', color)
      .ilike('silhouette', silhouette)
      .neq('user_id', user!.id);
    if (err) console.error('Dupe check:', err.message);
    if (!data) return [];
    return data.map((d: PeerLock) => getUsername(d));
  };

  const saveLock = async () => {
    const { error: err } = await supabase.from('locks').insert({
      user_id: user!.id, event_id: EVENT_ID, color, silhouette,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setLocked(true); setLoading(false);
  };

  const handleLock = async () => {
    if (!hasInput) { setError('Pick a color and silhouette first.'); return; }
    if (!user) { setError('You must be signed in.'); return; }
    setError(''); setLoading(true); setDupeUsers([]);
    try {
      const dupes = await withTimeout(runDupeCheck(), 10000);
      if (dupes.length > 0) { setDupeUsers(dupes); setLoading(false); return; }
      await saveLock();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────
  if (locked) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center mb-6 shadow-glow">
        <CheckCircle2 size={44} className="text-plum"/>
      </div>
      <h2 className="font-display text-3xl font-bold text-plum mb-2">Look Locked!</h2>
      <p className="text-plum/50 text-sm mb-8 leading-relaxed max-w-[280px]">
        No dupes detected — your look is uniquely yours.
      </p>
      <div className="w-full max-w-sm bg-white rounded-3xl border border-primary/15 shadow-soft px-6 py-5 mb-4 text-left">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-2">Your Locked Look</p>
        <p className="font-display text-2xl font-bold text-plum">{color}</p>
        <p className="text-plum/45 text-sm mt-1">{silhouette}</p>
      </div>
      <div className="w-full max-w-sm bg-sage/40 rounded-3xl border border-sage px-5 py-4 mb-8 flex items-start gap-3 text-left">
        <Shield size={16} className="text-plum/50 flex-shrink-0 mt-0.5"/>
        <div>
          <p className="font-bold text-plum text-sm mb-1">Privacy protected</p>
          <p className="text-plum/55 text-xs leading-relaxed">
            Only the dupe-check runs on your details. Peers only see you're locked — not what you chose.
          </p>
        </div>
      </div>
      <div className="w-full max-w-sm">
        <button type="button" onClick={() => navigate('/event')} className="btn-primary mb-3">
          Back to Dashboard
        </button>
        <button
          type="button"
          onClick={() => { setLocked(false); setColor(''); setSilhouette(''); }}
          className="btn-secondary"
        >
          Lock Another Look
        </button>
      </div>
    </div>
  );

  // ── Main screen ───────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#fff8f0' }}>

      {/* ── Gradient hero — tall, airy, privacy pill embedded ── */}
      <div style={{
        background: 'linear-gradient(150deg, #fff0eb 0%, #ffd4c4 55%, #ffc1b8 100%)',
        padding: '44px 24px 56px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -64, right: -64, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -44, left: -32, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.09)', pointerEvents: 'none' }}/>

        {/* Frosted glass lock icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 24,
          background: 'rgba(255,255,255,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(63,42,42,0.08)',
          marginBottom: 18,
        }}>
          <Lock size={32} color={PLUM}/>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: PLUM, margin: '0 0 8px', lineHeight: 1.1 }}>
          Lock In My Look
        </h1>
        <p style={{ color: 'rgba(63,42,42,0.60)', fontSize: 14, margin: '0 0 22px', lineHeight: 1.5 }}>
          Real-time dupe check with your squad
        </p>

        {/* Privacy pill — embedded in hero, no separate card */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(255,255,255,0.50)', borderRadius: 50,
          padding: '9px 18px', backdropFilter: 'blur(6px)',
        }}>
          <Shield size={13} color={PLUM}/>
          <span style={{ fontSize: 12, fontWeight: 600, color: PLUM }}>Only you see your choice · 100% private</span>
        </div>
      </div>

      {/* ── Cream content sheet — slides up over the gradient ── */}
      <div className="bg-cream rounded-t-4xl -mt-10 px-5 pt-6 pb-28 flex flex-col gap-5">

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0"/>
            <span className="text-xs font-semibold text-red-800">{error}</span>
          </div>
        )}

        {/* Dupe warning */}
        {dupeUsers.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={15} className="text-amber-700"/>
              <p className="font-bold text-amber-800 text-sm">Possible Dupe Found</p>
            </div>
            <p className="text-amber-700 text-xs mb-4 leading-relaxed">
              {dupeUsers.join(', ')} locked a similar look. Pick something different or lock anyway.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDupeUsers([])}
                className="flex-1 py-3 rounded-2xl border border-amber-200 bg-white text-amber-800 text-xs font-bold active:scale-95 transition-all"
              >
                Pick Different
              </button>
              <button
                type="button"
                onClick={saveLock}
                className="flex-1 py-3 rounded-2xl bg-amber-500 text-white text-xs font-bold active:scale-95 transition-all"
              >
                Lock Anyway
              </button>
            </div>
          </div>
        )}

        {/* ── Form card: color + silhouette in one container ── */}
        <div className="bg-white rounded-3xl shadow-medium p-6 flex flex-col gap-5">
          <ColorSelect value={color} onChange={setColor}/>
          <div className="h-px bg-plum/5"/>
          <SilhouetteGrid value={silhouette} onChange={setSilhouette}/>
        </div>

        {/* ── Squad card ── */}
        <div className="bg-white rounded-3xl shadow-medium">
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-bold text-plum text-sm">Your Squad</p>
                <p className="text-plum/40 text-xs mt-0.5">
                  {peers.length === 0
                    ? 'No one locked in yet — be first!'
                    : `${peers.length} girl${peers.length > 1 ? 's' : ''} locked in`}
                </p>
              </div>
              <div className="bg-blush rounded-full px-3.5 py-1.5 text-xs font-bold text-plum/50">VS</div>
            </div>

            {peers.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-plum/30 text-sm">
                <Lock size={13} className="text-plum/20"/>
                Be the first to lock in!
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {peers.map(peer => (
                  <div key={peer.user_id} className="flex items-center gap-3.5 bg-cream rounded-2xl px-4 py-3.5">
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14, color: PLUM, flexShrink: 0,
                    }}>
                      {getUsername(peer)[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-plum text-sm">@{getUsername(peer)}</p>
                      <div style={{ fontSize: 11, color: PRIMARY, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Lock size={9} color={PRIMARY}/> Locked in
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-plum/20 flex-shrink-0"/>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Selection preview (shown when both are picked) ── */}
        {hasInput && (
          <div className="bg-gradient-to-br from-blush to-lavender rounded-3xl px-6 py-5 flex items-center justify-between border border-primary/20">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-2">Your Selection</p>
              <p className="font-display text-xl font-bold text-plum">{color}</p>
              <p className="text-plum/50 text-sm mt-0.5">{silhouette}</p>
            </div>
            <CheckCircle2 size={28} className="text-primary flex-shrink-0"/>
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="button"
          onClick={handleLock}
          disabled={loading || !hasInput}
          style={{
            width: '100%', padding: '21px', borderRadius: 26, border: 'none',
            background: hasInput
              ? `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`
              : 'rgba(63,42,42,0.08)',
            color: hasInput ? PLUM : 'rgba(63,42,42,0.30)',
            fontSize: 16, fontWeight: 800, letterSpacing: '0.02em',
            cursor: hasInput ? 'pointer' : 'not-allowed',
            boxShadow: hasInput ? '0 8px 32px rgba(255,193,184,0.50)' : 'none',
            transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                border: '2.5px solid rgba(63,42,42,0.15)', borderTop: `2.5px solid ${PLUM}`,
                animation: 'spin 0.7s linear infinite', display: 'inline-block',
              }}/>
              Checking for dupes…
            </>
          ) : (
            <><Lock size={18}/> Lock In My Look</>
          )}
        </button>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default LockIn;
