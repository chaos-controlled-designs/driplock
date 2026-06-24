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

interface Trends {
  total: number;
  topColors: [string, number][];
  topSilhouettes: [string, number][];
}

function computeTrends(locks: SchoolLock[]): Trends | null {
  if (locks.length === 0) return null;
  const colors: Record<string, number> = {};
  const silhouettes: Record<string, number> = {};
  for (const lock of locks) {
    colors[lock.color] = (colors[lock.color] ?? 0) + 1;
    silhouettes[lock.silhouette] = (silhouettes[lock.silhouette] ?? 0) + 1;
  }
  const topColors     = Object.entries(colors).sort(([, a], [, b]) => b - a).slice(0, 3) as [string, number][];
  const topSilhouettes = Object.entries(silhouettes).sort(([, a], [, b]) => b - a).slice(0, 3) as [string, number][];
  return { total: locks.length, topColors, topSilhouettes };
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
    <div className="min-h-screen bg-cream flex flex-col pb-28">
      {/* Hero header */}
      <div className="px-6 pt-8 pb-10 rounded-b-[32px] text-center bg-[linear-gradient(150deg,#fff0eb_0%,#ffd4c4_55%,#e8c8f0_100%)]">
        <div className="w-20 h-20 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-glow border border-white/80">
          <Sparkles size={34} className="text-plum" />
        </div>
        <h2 className="font-display text-2xl font-bold text-plum mb-1.5">My School's Looks</h2>
        <p className="text-plum/60 text-sm leading-relaxed max-w-[270px] mx-auto">
          See every dress already locked in at <strong>{schoolName}</strong> — anonymized so you know what's taken.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 bg-plum/10 rounded-full px-3 py-1.5">
          <Lock size={10} className="text-plum/50" />
          <span className="text-plum/60 text-[11px] font-semibold">VIP exclusive</span>
        </div>
      </div>

      {/* Blurred preview */}
      <div className="px-5 pt-5 flex flex-col gap-3">
        <p className="text-plum/40 text-[11px] font-semibold uppercase tracking-wider text-center mb-1">
          Preview — unlock to see your school
        </p>
        {[
          { color: 'Blush Pink', sil: 'A-Line',    t: '2h ago', swatch: 'bg-[linear-gradient(135deg,#f0a8b8cc_0%,#f0a8b888_100%)]' },
          { color: 'Navy',       sil: 'Mermaid',   t: '5h ago', swatch: 'bg-[linear-gradient(135deg,#081848cc_0%,#08184888_100%)]' },
          { color: 'Gold',       sil: 'Ball Gown', t: '1d ago', swatch: 'bg-[linear-gradient(135deg,#c8a040cc_0%,#c8a04088_100%)]' },
        ].map((look, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-white rounded-2xl shadow-soft px-4 py-3.5 blur-[2.5px] opacity-55 select-none"
          >
            <div className={`w-11 h-11 rounded-xl flex-shrink-0 shadow-soft ${look.swatch}`} />
            <div className="flex-1 text-left">
              <p className="text-plum font-semibold text-sm">{look.color} {look.sil}</p>
              <p className="text-plum/40 text-xs mt-0.5">Locked {look.t} · Anonymous</p>
            </div>
            <Lock size={13} className="text-plum/25 flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-5 pt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowVIPModal(true)}
          className="w-full py-4 rounded-2xl font-bold text-plum text-base active:scale-[0.98] transition-all bg-[linear-gradient(135deg,#ffc1b8_0%,#e8c0f0_100%)] shadow-[0_6px_28px_rgba(255,193,184,0.50)]"
        >
          <Sparkles size={16} className="inline mr-2 -mt-0.5" />
          Unlock My School's Looks — from $6.99
        </button>
        <button
          type="button"
          onClick={() => navigate('/event')}
          className="btn-secondary"
        >
          Maybe Later
        </button>
        <p className="text-plum/30 text-[10px] text-center leading-relaxed">
          Secure checkout via Stripe · Looks are fully anonymized
        </p>
      </div>

      <VIPModal open={showVIPModal} onClose={() => setShowVIPModal(false)} userId={user?.id} />
    </div>
  );

  // ── VIP view ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream pb-28">

      {/* Header */}
      <div className="bg-[linear-gradient(150deg,#fff0eb_0%,#ffd4c4_55%,#ffc1b8_100%)] px-5 pt-5 pb-7 rounded-b-[28px]">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-plum/60" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-plum/50">VIP Exclusive</p>
        </div>
        <h1 className="font-display text-2xl font-bold text-plum leading-tight">
          {schoolName.split(' ')[0]}'s Looks
        </h1>
        <p className="text-plum/55 text-sm mt-0.5">
          Anonymized locked looks · School Trend Radar
        </p>
      </div>

      <div className="px-5 pt-5">

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="flex flex-col gap-3 mt-2">
            {/* Radar skeleton */}
            <div className="bg-white rounded-3xl shadow-medium p-4 animate-pulse">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-primary/15" />
                <div className="h-3 w-32 bg-plum/10 rounded-full" />
              </div>
              <div className="flex gap-2 mb-4">
                <div className="flex-1 h-16 bg-cream rounded-2xl" />
                <div className="flex-1 h-16 bg-cream rounded-2xl" />
                <div className="flex-1 h-16 bg-cream rounded-2xl" />
              </div>
              <div className="space-y-2">
                <div className="h-5 bg-plum/5 rounded-full w-4/5" />
                <div className="h-5 bg-plum/5 rounded-full w-1/2" />
                <div className="h-5 bg-plum/5 rounded-full w-1/3" />
              </div>
            </div>
            {/* Feed skeletons */}
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-[72px] animate-pulse shadow-soft" />
            ))}
          </div>
        )}

        {/* ── Error state ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-3">
            <span className="text-base mt-px">⚠️</span>
            <div>
              <p className="text-red-700 text-xs font-bold mb-0.5">Couldn't load school data</p>
              <p className="text-red-600/70 text-[11px] leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && locks.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock size={24} className="text-primary/50" />
            </div>
            <p className="font-semibold text-plum text-base mb-1">No looks locked yet</p>
            <p className="text-plum/45 text-sm leading-relaxed max-w-[240px]">
              Be the first! Once girls at {schoolName} start locking in, their looks will show up here.
            </p>
            <div className="mt-4 bg-white rounded-2xl shadow-soft px-4 py-3 text-center max-w-[260px]">
              <p className="text-plum/40 text-[11px] leading-relaxed">
                Trend Radar will light up with color stats and silhouette breakdowns as more locks come in.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && locks.length > 0 && (() => {
          const trends = computeTrends(locks);

          return (
            <div className="flex flex-col gap-3">

              {/* ── School Trend Radar card ── */}
              {trends && (
                <div className="bg-white rounded-3xl shadow-medium overflow-hidden">
                  {/* Card header */}
                  <div className="bg-[linear-gradient(135deg,#fff0eb_0%,#f5e6ff_100%)] px-4 pt-4 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-soft">
                        <Sparkles size={14} className="text-plum" />
                      </div>
                      <div>
                        <p className="font-bold text-plum text-sm leading-tight">School Trend Radar</p>
                        <p className="text-plum/40 text-[10px]">This season at {schoolName.split(' ')[0]}</p>
                      </div>
                    </div>
                    <div className="bg-plum/8 rounded-full px-2.5 py-1">
                      <span className="text-plum/50 text-[10px] font-bold">LIVE</span>
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-3">
                    {/* Stat pills */}
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 bg-cream rounded-2xl px-3 py-2.5 text-center">
                        <p className="font-bold text-plum text-xl leading-tight">{trends.total}</p>
                        <p className="text-plum/40 text-[10px] mt-0.5">Looks locked</p>
                      </div>
                      <div className="flex-1 bg-cream rounded-2xl px-3 py-2.5 text-center">
                        <p className="font-bold text-plum text-sm leading-tight truncate">{trends.topSilhouettes[0]?.[0] ?? '—'}</p>
                        <p className="text-plum/40 text-[10px] mt-0.5">Top silhouette</p>
                      </div>
                      <div className="flex-1 bg-cream rounded-2xl px-3 py-2.5 text-center">
                        <p className="font-bold text-plum text-sm leading-tight truncate">{trends.topColors[0]?.[0] ?? '—'}</p>
                        <p className="text-plum/40 text-[10px] mt-0.5">Trending color</p>
                      </div>
                    </div>

                    {/* Top Colors breakdown */}
                    <p className="text-plum/40 text-[10px] font-bold uppercase tracking-wider mb-2.5">Top Colors This Week</p>
                    <div className="flex flex-col gap-2.5">
                      {trends.topColors.map(([color, count], i) => {
                        const pct = Math.round((count / trends.total) * 100);
                        return (
                          <div key={color} className="flex items-center gap-2.5">
                            <span className="text-plum/25 text-[10px] font-bold w-3 flex-shrink-0">{i + 1}</span>
                            <div
                              className="w-5 h-5 rounded-md flex-shrink-0 shadow-soft"
                              style={{ background: colorToGradient(color) }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-plum text-xs font-semibold truncate">{color}</span>
                                <span className="text-plum/40 text-[10px] ml-2 flex-shrink-0">{pct}%</span>
                              </div>
                              <div className="h-1.5 bg-cream rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-primary to-lavender transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Silhouette breakdown */}
                    {trends.topSilhouettes.length > 1 && (
                      <>
                        <div className="h-px bg-plum/6 my-3" />
                        <p className="text-plum/40 text-[10px] font-bold uppercase tracking-wider mb-2.5">Silhouette Breakdown</p>
                        <div className="flex gap-2 flex-wrap">
                          {trends.topSilhouettes.map(([sil, count]) => {
                            const pct = Math.round((count / trends.total) * 100);
                            return (
                              <div key={sil} className="bg-lavender/20 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                                <span className="text-plum text-[11px] font-semibold">{sil}</span>
                                <span className="text-plum/40 text-[10px]">{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    <p className="text-plum/25 text-[10px] mt-3 leading-relaxed">
                      Anonymized · updates as more girls lock in their looks
                    </p>
                  </div>
                </div>
              )}

              {/* ── Individual locks feed ── */}
              <p className="text-plum/40 text-[11px] font-bold uppercase tracking-wider mt-1">
                All Locked Looks ({locks.length})
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
        );
        })()}
      </div>
    </div>
  );
}
