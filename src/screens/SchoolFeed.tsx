import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isVIPActive } from '../lib/supabase';
import { Sparkles, Lock, Clock } from 'lucide-react';
import { VIPModal } from '../components/VIPModal';

const EVENT_ID = '22222222-2222-2222-2222-222222222222';

const COLOR_HEX: Record<string, string> = {
  'Black': '#2d2020',
  'White': '#f5f0ee',
  'Ivory': '#f7f0e0',
  'Champagne': '#e8d0a8',
  'Gold': '#c8a040',
  'Silver': '#9898a8',
  'Blush Pink': '#f0a8b8',
  'Hot Pink': '#e83888',
  'Fuchsia': '#b800a0',
  'Red': '#b80028',
  'Burgundy': '#680020',
  'Coral': '#e85040',
  'Lavender': '#b8a0d8',
  'Purple': '#6800a0',
  'Royal Blue': '#1830a0',
  'Navy': '#081848',
  'Cobalt': '#0030b0',
  'Teal': '#006868',
  'Emerald': '#007838',
  'Sage Green': '#7a9870',
  'Mint': '#58d080',
  'Sky Blue': '#60b0d8',
  'Yellow': '#d8b800',
  'Orange': '#d86000',
  'Other': '#a89880',
};

function colorToGradient(color: string): string {
  const hex = COLOR_HEX[color] ?? '#c8b4a8';
  return `linear-gradient(135deg, ${hex}cc 0%, ${hex}88 100%)`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface SchoolLock {
  color: string;
  silhouette: string;
  designer?: string | null;
  created_at: string;
}

export function SchoolFeed() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [locks, setLocks] = useState<SchoolLock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showVIPModal, setShowVIPModal] = useState(false);

  const isVIP = isVIPActive(profile);
  const schoolName = profile?.school ?? 'Your School';

  useEffect(() => {
    if (!isVIP || !user || !profile?.school) { setLoading(false); return; }

    const load = async () => {
      setLoading(true);
      setError('');

      const { data: peers, error: peersErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('school', profile.school!)
        .neq('id', user.id);

      if (peersErr) { setError(peersErr.message); setLoading(false); return; }

      const peerIds = peers?.map(p => p.id) ?? [];

      if (peerIds.length === 0) {
        setLocks([]);
        setLoading(false);
        return;
      }

      const { data: locksData, error: locksErr } = await supabase
        .from('locks')
        .select('color, silhouette, designer, created_at')
        .eq('event_id', EVENT_ID)
        .in('user_id', peerIds)
        .order('created_at', { ascending: false });

      if (locksErr) { setError(locksErr.message); setLoading(false); return; }

      setLocks(locksData ?? []);
      setLoading(false);
    };

    load();
  }, [isVIP, user, profile]);

  // ── Non-VIP gate ────────────────────────────────────────────────
  if (!isVIP) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center pb-24">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center mb-5 shadow-glow">
        <Lock size={32} className="text-plum" />
      </div>
      <h2 className="font-display text-2xl font-bold text-plum mb-2">My School's Looks</h2>
      <p className="text-plum/55 text-sm mb-1 leading-relaxed max-w-[280px]">
        See every dress locked in at <strong>{schoolName}</strong> — anonymized, so you know what's already taken.
      </p>
      <p className="text-plum/40 text-xs mb-8">VIP members only ✨</p>

      <div className="w-full max-w-[320px] flex flex-col gap-3 mb-6">
        {['Blush Pink A-Line', 'Navy Mermaid', 'Gold Ball Gown'].map((look, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-white rounded-2xl shadow-soft px-4 py-3 blur-[2px] opacity-60 select-none"
          >
            <div
              className="w-10 h-10 rounded-xl flex-shrink-0"
              style={{ background: colorToGradient(look.split(' ')[0]) }}
            />
            <div className="text-left">
              <p className="text-plum font-semibold text-sm">{look}</p>
              <p className="text-plum/40 text-xs">Locked 2h ago · Anonymous</p>
            </div>
            <div className="ml-auto">
              <Lock size={14} className="text-plum/30" />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowVIPModal(true)}
        className="btn-primary mb-3"
      >
        Unlock VIP — from $6.99
      </button>
      <button
        type="button"
        onClick={() => navigate('/event')}
        className="btn-secondary"
      >
        Maybe Later
      </button>

      <VIPModal open={showVIPModal} onClose={() => setShowVIPModal(false)} userId={user?.id} />
    </div>
  );

  // ── VIP view ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream pb-28">

      {/* Header */}
      <div style={{
        background: 'linear-gradient(150deg, #fff0eb 0%, #ffd4c4 55%, #ffc1b8 100%)',
        padding: '20px 20px 28px',
        borderRadius: '0 0 28px 28px',
      }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-plum/60" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-plum/50">VIP Exclusive</p>
        </div>
        <h1 className="font-display text-2xl font-bold text-plum leading-tight">
          {schoolName.split(' ')[0]}'s Looks
        </h1>
        <p className="text-plum/55 text-sm mt-0.5">
          Anonymized locked looks from your school
        </p>
      </div>

      <div className="px-5 pt-5">

        {loading && (
          <div className="flex flex-col gap-3 mt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-[72px] animate-pulse shadow-soft" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-600 text-xs font-medium">
            {error}
          </div>
        )}

        {!loading && !error && locks.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock size={24} className="text-primary/50" />
            </div>
            <p className="font-semibold text-plum text-base mb-1">No looks locked yet</p>
            <p className="text-plum/45 text-sm leading-relaxed max-w-[240px]">
              Be the first! Once other girls at {schoolName} lock in their looks, they'll appear here.
            </p>
          </div>
        )}

        {!loading && !error && locks.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-plum/40 text-xs font-semibold">
              {locks.length} look{locks.length !== 1 ? 's' : ''} locked at your school
            </p>

            {locks.map((lock, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-soft px-4 py-3.5 flex items-center gap-3"
              >
                {/* Color swatch */}
                <div
                  className="w-12 h-12 rounded-xl flex-shrink-0 shadow-soft"
                  style={{ background: colorToGradient(lock.color) }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-plum text-sm truncate">
                    {lock.color} {lock.silhouette}
                  </p>
                  {lock.designer && (
                    <p className="text-plum/40 text-xs truncate">{lock.designer}</p>
                  )}
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={10} className="text-plum/30" />
                    <p className="text-plum/35 text-[10px]">Locked {timeAgo(lock.created_at)}</p>
                  </div>
                </div>

                {/* Lock icon */}
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock size={12} className="text-primary/60" />
                  </div>
                </div>
              </div>
            ))}

            <p className="text-plum/30 text-[10px] text-center pt-2 leading-relaxed">
              Usernames, sizes, and photos are never shown. Anonymized for everyone's privacy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
