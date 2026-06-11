import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Lock, ChevronDown, Zap, Shield } from 'lucide-react';

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

const PRIMARY   = '#f8a8c2';
const PRIMARY_L = '#c4b5fd';
const PLUM      = '#374151';

interface PeerLock {
  user_id: string;
  profiles?: { username: string } | { username: string }[];
}

function getUsername(peer: PeerLock): string {
  if (!peer.profiles) return '?';
  const p = Array.isArray(peer.profiles) ? peer.profiles[0] : peer.profiles;
  return p?.username ?? '?';
}

// ── sub-components ───────────────────────────────────────────────────────────

function SelectField({
  label, value, onChange, options, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: PRIMARY, marginBottom: 6,
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <select
          title={label}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', appearance: 'none', padding: '12px 40px 12px 16px',
            borderRadius: 14,
            border: value ? `2px solid ${PRIMARY}` : '2px solid #e5e7eb',
            background: value ? '#fde8f0' : '#fff',
            fontSize: 14, fontWeight: value ? 600 : 400,
            color: value ? PLUM : 'rgba(55,65,81,0.35)',
            cursor: 'pointer', outline: 'none',
            transition: 'border-color 0.2s, background 0.2s',
            boxShadow: value ? '0 0 0 3px rgba(248,168,194,0.15)' : 'none',
          }}
        >
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={16} style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          color: PRIMARY, pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}

function SilhouetteGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: PRIMARY, marginBottom: 8,
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
                padding: '10px 6px', borderRadius: 12, fontSize: 12,
                fontWeight: 700,
                border: sel ? `2px solid ${PRIMARY}` : '2px solid #f0ebe8',
                background: sel ? PRIMARY : '#fff',
                color: sel ? PLUM : 'rgba(55,65,81,0.65)',
                cursor: 'pointer', transition: 'all 0.18s ease',
                boxShadow: sel ? '0 4px 14px rgba(248,168,194,0.4)' : '0 1px 3px rgba(0,0,0,0.06)',
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

// ── main component ───────────────────────────────────────────────────────────

export function LockIn() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [color,     setColor]     = useState('');
  const [silhouette, setSilhouette] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [locked,    setLocked]    = useState(false);
  const [error,     setError]     = useState('');
  const [dupeUsers, setDupeUsers] = useState<string[]>([]);
  const [peers,     setPeers]     = useState<PeerLock[]>([]);

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
    setLocked(true);
    setLoading(false);
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

  // ── success screen ────────────────────────────────────────────────────────
  if (locked) return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(160deg, #fdf4f8 0%, #fde8f0 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 20px', textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, boxShadow: '0 8px 32px rgba(248,168,194,0.4)', fontSize: 36,
      }}>✓</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: PLUM, margin: '0 0 6px' }}>
        Look Locked! 🎀
      </h2>
      <p style={{ color: PRIMARY, fontSize: 14, marginBottom: 24 }}>
        No dupes detected — your look is uniquely yours.
      </p>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '18px 24px',
        width: '100%', maxWidth: 360, marginBottom: 14,
        border: '1.5px solid rgba(248,168,194,0.2)', textAlign: 'left',
        boxShadow: '0 4px 24px rgba(248,168,194,0.08)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: PRIMARY, textTransform: 'uppercase', marginBottom: 6 }}>
          Your locked look
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: PLUM }}>
          {color} · {silhouette}
        </div>
      </div>
      <div style={{
        background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 20,
        padding: '14px 20px', width: '100%', maxWidth: 360, marginBottom: 28, textAlign: 'left',
      }}>
        <div style={{ fontWeight: 700, color: '#166534', fontSize: 13, marginBottom: 4 }}>✓ Privacy protected</div>
        <div style={{ fontSize: 12, color: '#15803d', lineHeight: 1.6 }}>
          Only the dupe-check logic can see your color & silhouette. Peers only see you're locked in.
        </div>
      </div>
      <button type="button" onClick={() => navigate('/event')} style={{
        padding: '14px 32px', borderRadius: 14, fontSize: 14, fontWeight: 700,
        background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`,
        color: PLUM, border: 'none', cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(248,168,194,0.45)', marginBottom: 12,
        width: '100%', maxWidth: 360,
      }}>Back to Dashboard</button>
      <button type="button" onClick={() => { setLocked(false); setColor(''); setSilhouette(''); }} style={{
        padding: '12px 32px', borderRadius: 14, fontSize: 14, fontWeight: 700,
        background: '#fff', color: PRIMARY,
        border: '2px solid rgba(248,168,194,0.25)', cursor: 'pointer',
        width: '100%', maxWidth: 360,
      }}>Lock Another Look</button>
    </div>
  );

  // ── main screen ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#fdf4f8' }}>

      {/* header */}
      <div style={{
        background: `linear-gradient(135deg, ${PLUM} 0%, ${PRIMARY} 100%)`,
        padding: '28px 20px 36px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: '#ffffff18' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -10, width: 80, height: 80, borderRadius: '50%', background: '#ffffff12' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ background: '#ffffff22', borderRadius: 10, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
            <Zap size={18} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Lock In Your Look</h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
          See how your pick stacks up against your squad — in real time.
        </p>
      </div>

      <div style={{ padding: '0 16px 100px', marginTop: -18 }}>

        {/* privacy card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '14px 16px', marginBottom: 16,
          display: 'flex', gap: 12, alignItems: 'flex-start',
          boxShadow: '0 4px 24px rgba(248,168,194,0.08)', border: '1.5px solid rgba(248,168,194,0.15)',
        }}>
          <div style={{ background: 'rgba(248,168,194,0.12)', borderRadius: 10, padding: 7, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <Shield size={16} color={PRIMARY} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: PLUM, fontSize: 12, marginBottom: 2 }}>100% Private</div>
            <div style={{ fontSize: 11, color: 'rgba(55,65,81,0.5)', lineHeight: 1.6 }}>
              Your picks are only used to check for dupes. Nobody sees what you selected.
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 14,
            padding: '10px 14px', marginBottom: 14, fontSize: 12, fontWeight: 600, color: '#991b1b',
          }}>{error}</div>
        )}

        {/* dupe warning */}
        {dupeUsers.length > 0 && (
          <div style={{
            background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 14,
            padding: '14px 16px', marginBottom: 14,
          }}>
            <p style={{ fontWeight: 700, color: '#92400e', fontSize: 13, margin: '0 0 6px' }}>⚠️ Possible Dupe Found</p>
            <p style={{ color: '#78350f', fontSize: 12, margin: '0 0 12px', lineHeight: 1.5 }}>
              {dupeUsers.join(', ')} locked a similar look. Lock anyway or pick something different.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setDupeUsers([])} style={{
                flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #fcd34d',
                background: '#fff', color: '#92400e', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>Pick Different</button>
              <button type="button" onClick={saveLock} style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                background: '#f59e0b', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>Lock Anyway</button>
            </div>
          </div>
        )}

        {/* form card */}
        <div style={{
          background: '#fff', borderRadius: 24, padding: '22px 18px',
          boxShadow: '0 4px 32px rgba(248,168,194,0.08)', border: '1.5px solid rgba(248,168,194,0.15)', marginBottom: 16,
        }}>
          <SelectField label="Dress Color" value={color} onChange={setColor} options={COLORS} placeholder="Select your color" />
          <SilhouetteGrid value={silhouette} onChange={setSilhouette} />
        </div>

        {/* who's locked in */}
        <div style={{
          background: '#fff', borderRadius: 24, padding: '18px 18px 20px',
          boxShadow: '0 4px 32px rgba(248,168,194,0.08)', border: '1.5px solid rgba(248,168,194,0.15)', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`,
              borderRadius: 10, padding: '5px 12px',
              fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.05em',
            }}>VS</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: PLUM }}>Your Squad</div>
              <div style={{ fontSize: 11, color: 'rgba(55,65,81,0.4)' }}>
                {peers.length === 0 ? 'No one locked in yet — be first!' : `${peers.length} girl${peers.length > 1 ? 's' : ''} locked in`}
              </div>
            </div>
          </div>

          {peers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(55,65,81,0.35)', fontSize: 13 }}>
              🔒 Be the first to lock in!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {peers.map(peer => (
                <div key={peer.user_id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'rgba(248,168,194,0.06)', border: '1.5px solid rgba(248,168,194,0.18)',
                  borderRadius: 14, padding: '10px 14px',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0,
                  }}>
                    {getUsername(peer)[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: PLUM }}>@{getUsername(peer)}</div>
                    <div style={{ fontSize: 11, color: PRIMARY }}>🔒 Locked in</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* selection summary */}
        {hasInput && (
          <div style={{
            background: 'linear-gradient(135deg, #fde8f0, #f3e8ff)',
            borderRadius: 18, padding: '14px 18px', marginBottom: 16,
            border: '1.5px solid rgba(248,168,194,0.3)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: PRIMARY, textTransform: 'uppercase', marginBottom: 4 }}>
              Your selection
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: PLUM }}>{color} · {silhouette}</div>
          </div>
        )}

        {/* lock button */}
        <button
          type="button"
          onClick={handleLock}
          disabled={loading || !hasInput}
          style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: hasInput ? `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})` : '#e5e7eb',
            color: hasInput ? PLUM : 'rgba(55,65,81,0.35)',
            fontSize: 15, fontWeight: 800, cursor: hasInput ? 'pointer' : 'not-allowed',
            boxShadow: hasInput ? '0 8px 24px rgba(248,168,194,0.45)' : 'none',
            transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: 16, height: 16, borderRadius: '50%',
                border: '2px solid #ffffff55', borderTop: '2px solid #fff',
                animation: 'spin 0.7s linear infinite', display: 'inline-block',
              }} />
              Checking for dupes…
            </>
          ) : (
            <><Lock size={16} /> Lock In My Look</>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default LockIn;
