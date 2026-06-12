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

function ColorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.09em',
        textTransform: 'uppercase', color: 'rgba(63,42,42,0.48)', marginBottom: 10,
      }}>Dress Color</label>
      <div style={{ position: 'relative' }}>
        <select
          title="Dress Color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', appearance: 'none',
            padding: '15px 48px 15px 18px',
            borderRadius: 18,
            border: value ? `2px solid ${PRIMARY}` : '2px solid rgba(255,193,184,0.25)',
            background: value ? '#fff0eb' : '#fff',
            fontSize: 14, fontWeight: value ? 700 : 400,
            color: value ? PLUM : 'rgba(63,42,42,0.35)',
            cursor: 'pointer', outline: 'none',
            transition: 'all 0.2s',
            boxShadow: value ? '0 0 0 3px rgba(255,193,184,0.14)' : '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <option value="">Select your dress color</option>
          {COLORS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={16} style={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
          color: value ? PRIMARY : 'rgba(63,42,42,0.30)', pointerEvents: 'none',
        }} />
        {value && (
          <CheckCircle2 size={16} style={{
            position: 'absolute', right: 42, top: '50%', transform: 'translateY(-50%)',
            color: PRIMARY,
          }}/>
        )}
      </div>
    </div>
  );
}

function SilhouetteGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.09em',
        textTransform: 'uppercase', color: 'rgba(63,42,42,0.48)', marginBottom: 12,
      }}>Silhouette</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
        {SILHOUETTES.map(s => {
          const sel = value === s;
          return (
            <button
              type="button"
              key={s}
              onClick={() => onChange(s)}
              style={{
                padding: '14px 8px', borderRadius: 18,
                fontSize: 12, fontWeight: 700,
                border: sel ? `2px solid ${PRIMARY}` : '2px solid rgba(255,193,184,0.20)',
                background: sel ? PRIMARY : '#fafafa',
                color: sel ? PLUM : 'rgba(63,42,42,0.50)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                boxShadow: sel ? '0 4px 16px rgba(255,193,184,0.40)' : '0 1px 3px rgba(0,0,0,0.04)',
                transform: sel ? 'scale(1.04)' : 'scale(1)',
                lineHeight: 1.25,
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

      {/* Selected look card */}
      <div className="w-full max-w-sm bg-white rounded-3xl border border-primary/15 shadow-soft px-6 py-5 mb-4 text-left">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-2">Your Locked Look</p>
        <p className="font-display text-2xl font-bold text-plum">{color}</p>
        <p className="text-plum/45 text-sm mt-1">{silhouette}</p>
      </div>

      {/* Privacy note — uses sage palette, not green */}
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

      {/* Hero header — matches EventDashboard gradient */}
      <div style={{
        background: 'linear-gradient(145deg, #fff0eb 0%, #ffd4c4 55%, #ffc1b8 100%)',
        padding: '36px 22px 52px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -48, right: -48, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -36, left: -24, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }}/>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'rgba(255,255,255,0.40)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)', flexShrink: 0,
          }}>
            <Lock size={30} color={PLUM} />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: PLUM, margin: 0, lineHeight: 1.1 }}>
              Lock In My Look
            </h1>
            <p style={{ color: 'rgba(63,42,42,0.55)', fontSize: 13, margin: '5px 0 0', lineHeight: 1.4 }}>
              Real-time dupe check with your squad
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 18px 120px', marginTop: -24 }}>

        {/* Privacy card */}
        <div style={{
          background: '#fff', borderRadius: 24, padding: '16px 18px', marginBottom: 14,
          display: 'flex', gap: 14, alignItems: 'center',
          boxShadow: '0 4px 20px rgba(255,193,184,0.08)', border: '1.5px solid rgba(255,193,184,0.15)',
        }}>
          <div style={{ background: 'rgba(255,193,184,0.15)', borderRadius: 14, padding: 10, flexShrink: 0 }}>
            <Shield size={18} color={PRIMARY} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: PLUM, fontSize: 13, marginBottom: 2 }}>100% Private</div>
            <div style={{ fontSize: 11.5, color: 'rgba(63,42,42,0.45)', lineHeight: 1.6 }}>
              Your picks are only used to check for dupes. Nobody sees what you chose.
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 18,
            padding: '12px 16px', marginBottom: 14,
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0 }}/>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#991b1b' }}>{error}</span>
          </div>
        )}

        {/* Dupe warning */}
        {dupeUsers.length > 0 && (
          <div style={{
            background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 22,
            padding: '18px 20px', marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AlertCircle size={15} color="#92400e" />
              <p style={{ fontWeight: 800, color: '#92400e', fontSize: 13.5, margin: 0 }}>Possible Dupe Found</p>
            </div>
            <p style={{ color: '#78350f', fontSize: 12.5, margin: '0 0 16px', lineHeight: 1.6 }}>
              {dupeUsers.join(', ')} locked a similar look. Lock anyway or pick something different.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setDupeUsers([])} style={{
                flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid #fcd34d',
                background: '#fff', color: '#92400e', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              }}>Pick Different</button>
              <button type="button" onClick={saveLock} style={{
                flex: 1, padding: '13px', borderRadius: 14, border: 'none',
                background: '#f59e0b', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              }}>Lock Anyway</button>
            </div>
          </div>
        )}

        {/* Form card */}
        <div style={{
          background: '#fff', borderRadius: 28, padding: '30px 24px',
          boxShadow: '0 4px 28px rgba(255,193,184,0.09)',
          border: '1.5px solid rgba(255,193,184,0.14)', marginBottom: 16,
        }}>
          <ColorSelect value={color} onChange={setColor} />
          <SilhouetteGrid value={silhouette} onChange={setSilhouette} />
        </div>

        {/* Squad section */}
        <div style={{
          background: '#fff', borderRadius: 28, padding: '24px 24px 26px',
          boxShadow: '0 4px 28px rgba(255,193,184,0.09)',
          border: '1.5px solid rgba(255,193,184,0.14)', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: PLUM }}>Your Squad</div>
              <div style={{ fontSize: 11.5, color: 'rgba(63,42,42,0.38)', marginTop: 2 }}>
                {peers.length === 0
                  ? 'No one locked in yet — be first!'
                  : `${peers.length} girl${peers.length > 1 ? 's' : ''} locked in`}
              </div>
            </div>
            {/* Subtle VS badge */}
            <div style={{
              background: 'rgba(255,193,184,0.18)', borderRadius: 20,
              padding: '5px 14px', fontSize: 11, fontWeight: 800,
              color: 'rgba(63,42,42,0.45)', letterSpacing: '0.05em',
            }}>VS</div>
          </div>

          {peers.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '20px 0',
              color: 'rgba(63,42,42,0.30)', fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Lock size={13} color="rgba(63,42,42,0.25)" />
              Be the first to lock in!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {peers.map(peer => (
                <div key={peer.user_id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#fff8f0',
                  border: '1.5px solid rgba(255,193,184,0.20)',
                  borderRadius: 18, padding: '12px 16px',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 14, color: PLUM, flexShrink: 0,
                  }}>
                    {getUsername(peer)[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: PLUM }}>@{getUsername(peer)}</div>
                    <div style={{ fontSize: 10.5, color: PRIMARY, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                      <Lock size={9} color={PRIMARY} /> Locked in
                    </div>
                  </div>
                  <ChevronRight size={14} color="rgba(63,42,42,0.20)" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selection preview */}
        {hasInput && (
          <div style={{
            background: 'linear-gradient(135deg, #fff0eb, #ffe8dc)',
            borderRadius: 24, padding: '16px 22px', marginBottom: 16,
            border: '1.5px solid rgba(255,193,184,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: PRIMARY, textTransform: 'uppercase', marginBottom: 5 }}>
                Your Selection
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: PLUM }}>{color}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(63,42,42,0.50)', marginTop: 2 }}>{silhouette}</div>
            </div>
            <CheckCircle2 size={24} color={PRIMARY} />
          </div>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleLock}
          disabled={loading || !hasInput}
          style={{
            width: '100%', padding: '19px', borderRadius: 24, border: 'none',
            background: hasInput
              ? `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`
              : 'rgba(63,42,42,0.08)',
            color: hasInput ? PLUM : 'rgba(63,42,42,0.30)',
            fontSize: 15, fontWeight: 800,
            cursor: hasInput ? 'pointer' : 'not-allowed',
            boxShadow: hasInput ? '0 8px 28px rgba(255,193,184,0.45)' : 'none',
            transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: 16, height: 16, borderRadius: '50%',
                border: '2px solid rgba(63,42,42,0.15)', borderTop: `2px solid ${PLUM}`,
                animation: 'spin 0.7s linear infinite', display: 'inline-block',
              }} />
              Checking for dupes…
            </>
          ) : (
            <><Lock size={17} /> Lock In My Look</>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default LockIn;
