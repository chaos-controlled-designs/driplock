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
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.09em',
        textTransform: 'uppercase', color: PRIMARY, marginBottom: 8,
      }}>Dress Color</label>
      <div style={{ position: 'relative' }}>
        <select
          title="Dress Color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', appearance: 'none',
            padding: '14px 44px 14px 18px',
            borderRadius: 16,
            border: value ? `2px solid ${PRIMARY}` : '2px solid rgba(255,193,184,0.25)',
            background: value ? '#fff0eb' : '#fff',
            fontSize: 14, fontWeight: value ? 700 : 400,
            color: value ? PLUM : 'rgba(63,42,42,0.30)',
            cursor: 'pointer', outline: 'none',
            transition: 'all 0.2s',
            boxShadow: value ? '0 0 0 3px rgba(255,193,184,0.14)' : '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <option value="">Select your color</option>
          {COLORS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={16} style={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
          color: PRIMARY, pointerEvents: 'none',
        }} />
        {value && (
          <CheckCircle2 size={16} style={{
            position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
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
        textTransform: 'uppercase', color: PRIMARY, marginBottom: 10,
      }}>Silhouette</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {SILHOUETTES.map(s => {
          const sel = value === s;
          return (
            <button
              type="button"
              key={s}
              onClick={() => onChange(s)}
              style={{
                padding: '11px 6px', borderRadius: 14,
                fontSize: 11.5, fontWeight: 700,
                border: sel ? `2px solid ${PRIMARY}` : '2px solid rgba(255,193,184,0.20)',
                background: sel ? PRIMARY : '#fafafa',
                color: sel ? PLUM : 'rgba(63,42,42,0.50)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                boxShadow: sel ? '0 4px 16px rgba(255,193,184,0.40)' : '0 1px 3px rgba(0,0,0,0.04)',
                transform: sel ? 'scale(1.04)' : 'scale(1)',
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

  // ── Success screen ────────────────────────────────────────────────────────
  if (locked) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #fff8f0 0%, #fff0eb 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 88, height: 88, borderRadius: '50%',
        background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24, boxShadow: '0 12px 40px rgba(255,193,184,0.40)',
      }}>
        <CheckCircle2 size={40} color={PLUM} />
      </div>

      <h2 style={{ fontSize: 28, fontWeight: 800, color: PLUM, margin: '0 0 8px' }}>Look Locked!</h2>
      <p style={{ color: 'rgba(63,42,42,0.50)', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
        No dupes detected — your look is uniquely yours.
      </p>

      <div style={{
        background: '#fff', borderRadius: 24, padding: '20px 28px',
        width: '100%', maxWidth: 360, marginBottom: 16,
        border: '1.5px solid rgba(255,193,184,0.22)',
        boxShadow: '0 4px 24px rgba(255,193,184,0.10)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: PRIMARY, textTransform: 'uppercase', marginBottom: 8 }}>
          Your Locked Look
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: PLUM }}>{color}</div>
        <div style={{ fontSize: 14, color: 'rgba(63,42,42,0.45)', marginTop: 2 }}>{silhouette}</div>
      </div>

      <div style={{
        background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 20,
        padding: '14px 20px', width: '100%', maxWidth: 360, marginBottom: 32, textAlign: 'left',
      }}>
        <div style={{ fontWeight: 700, color: '#166534', fontSize: 13, marginBottom: 4 }}>Privacy protected</div>
        <div style={{ fontSize: 12, color: '#15803d', lineHeight: 1.6 }}>
          Only the dupe-check runs on your details. Peers only see you're locked — not what you chose.
        </div>
      </div>

      <button type="button" onClick={() => navigate('/event')} style={{
        padding: '16px 32px', borderRadius: 18, fontSize: 14, fontWeight: 700,
        background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`,
        color: PLUM, border: 'none', cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(255,193,184,0.42)',
        width: '100%', maxWidth: 360, marginBottom: 12,
      }}>Back to Dashboard</button>

      <button type="button" onClick={() => { setLocked(false); setColor(''); setSilhouette(''); }} style={{
        padding: '14px 32px', borderRadius: 18, fontSize: 14, fontWeight: 700,
        background: '#fff', color: 'rgba(63,42,42,0.60)',
        border: '1.5px solid rgba(255,193,184,0.28)', cursor: 'pointer',
        width: '100%', maxWidth: 360,
      }}>Lock Another Look</button>
    </div>
  );

  // ── Main screen ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#fff8f0' }}>

      {/* Hero header */}
      <div style={{
        background: `linear-gradient(135deg, ${PRIMARY_L} 0%, ${PRIMARY} 100%)`,
        padding: '32px 20px 48px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }}/>
        <div style={{ position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}/>

        {/* Lock icon display */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 10 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: 'rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <Lock size={28} color={PLUM} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: PLUM, margin: 0, lineHeight: 1.1 }}>
              Lock In My Look
            </h1>
            <p style={{ color: 'rgba(63,42,42,0.55)', fontSize: 12.5, margin: '4px 0 0', lineHeight: 1.4 }}>
              Real-time dupe check with your squad
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px 110px', marginTop: -20 }}>

        {/* Privacy card */}
        <div style={{
          background: '#fff', borderRadius: 22, padding: '14px 16px', marginBottom: 14,
          display: 'flex', gap: 12, alignItems: 'center',
          boxShadow: '0 4px 20px rgba(255,193,184,0.08)', border: '1.5px solid rgba(255,193,184,0.15)',
        }}>
          <div style={{ background: 'rgba(255,193,184,0.15)', borderRadius: 12, padding: 8, flexShrink: 0 }}>
            <Shield size={16} color={PRIMARY} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: PLUM, fontSize: 12.5, marginBottom: 2 }}>100% Private</div>
            <div style={{ fontSize: 11, color: 'rgba(63,42,42,0.45)', lineHeight: 1.6 }}>
              Your picks are only used to check for dupes. Nobody sees what you chose.
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 16,
            padding: '10px 14px', marginBottom: 14,
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <AlertCircle size={14} color="#dc2626"/>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#991b1b' }}>{error}</span>
          </div>
        )}

        {dupeUsers.length > 0 && (
          <div style={{
            background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 18,
            padding: '16px 18px', marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <AlertCircle size={14} color="#92400e" />
              <p style={{ fontWeight: 700, color: '#92400e', fontSize: 13, margin: 0 }}>Possible Dupe Found</p>
            </div>
            <p style={{ color: '#78350f', fontSize: 12, margin: '0 0 14px', lineHeight: 1.6 }}>
              {dupeUsers.join(', ')} locked a similar look. Lock anyway or pick something different.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setDupeUsers([])} style={{
                flex: 1, padding: '11px', borderRadius: 12, border: '1.5px solid #fcd34d',
                background: '#fff', color: '#92400e', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>Pick Different</button>
              <button type="button" onClick={saveLock} style={{
                flex: 1, padding: '11px', borderRadius: 12, border: 'none',
                background: '#f59e0b', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>Lock Anyway</button>
            </div>
          </div>
        )}

        {/* Form card */}
        <div style={{
          background: '#fff', borderRadius: 28, padding: '28px 22px',
          boxShadow: '0 4px 28px rgba(255,193,184,0.09)', border: '1.5px solid rgba(255,193,184,0.14)', marginBottom: 16,
        }}>
          <ColorSelect value={color} onChange={setColor} />
          <SilhouetteGrid value={silhouette} onChange={setSilhouette} />
        </div>

        {/* Squad section */}
        <div style={{
          background: '#fff', borderRadius: 28, padding: '22px 22px 24px',
          boxShadow: '0 4px 28px rgba(255,193,184,0.09)', border: '1.5px solid rgba(255,193,184,0.14)', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: PLUM }}>Your Squad</div>
              <div style={{ fontSize: 11, color: 'rgba(63,42,42,0.38)', marginTop: 1 }}>
                {peers.length === 0
                  ? 'No one locked in yet — be first!'
                  : `${peers.length} girl${peers.length > 1 ? 's' : ''} locked in`}
              </div>
            </div>
            <div style={{
              background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`,
              borderRadius: 10, padding: '5px 14px',
              fontSize: 12, fontWeight: 800, color: PLUM,
            }}>VS</div>
          </div>

          {peers.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '16px 0',
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
                  background: '#fafafa', border: '1.5px solid rgba(255,193,184,0.18)',
                  borderRadius: 16, padding: '11px 14px',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 13, color: PLUM, flexShrink: 0,
                  }}>
                    {getUsername(peer)[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: PLUM }}>@{getUsername(peer)}</div>
                    <div style={{ fontSize: 10, color: PRIMARY, display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
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
            background: `linear-gradient(135deg, #fff0eb, #ffe8dc)`,
            borderRadius: 20, padding: '14px 20px', marginBottom: 16,
            border: '1.5px solid rgba(255,193,184,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: PRIMARY, textTransform: 'uppercase', marginBottom: 4 }}>
                Your Selection
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: PLUM }}>{color}</div>
              <div style={{ fontSize: 12, color: 'rgba(63,42,42,0.50)', marginTop: 1 }}>{silhouette}</div>
            </div>
            <CheckCircle2 size={22} color={PRIMARY} />
          </div>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleLock}
          disabled={loading || !hasInput}
          style={{
            width: '100%', padding: '18px', borderRadius: 22, border: 'none',
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
