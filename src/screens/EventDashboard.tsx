import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Lock, ShoppingBag, Plus, Users, MapPin, Shield, AlertCircle, Calendar, ChevronRight } from 'lucide-react';

const EVENT_ID = '22222222-2222-2222-2222-222222222222';

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
}

interface EventLock {
  id: string;
  user_id: string;
  event_id: string;
  color: string;
  silhouette: string;
  created_at: string;
  profiles?: { username: string };
}

export function EventDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [lockCount, setLockCount] = useState(0);
  const [recentLocks, setRecentLocks] = useState<EventLock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const { data: ev } = await supabase
          .from('events').select('*').eq('id', EVENT_ID).single();
        setEvent(ev ?? null);

        const { data: locks, error: locksError } = await supabase
          .from('locks')
          .select('*, profiles(username)')
          .eq('event_id', EVENT_ID)
          .order('created_at', { ascending: false })
          .limit(5);

        if (locksError) {
          console.error('Locks fetch error:', locksError);
        } else {
          setRecentLocks((locks ?? []) as EventLock[]);
          setLockCount((locks ?? []).length);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (user) { load(); } else { setLoading(false); }
  }, [user, retryKey]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-lavender animate-pulse"/>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-cream pb-24 px-4 pt-6">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-start">
        <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0"/>
        <div>
          <p className="text-red-800 font-semibold text-sm mb-1">Error loading dashboard</p>
          <p className="text-red-700 text-xs mb-3">{error}</p>
          <button
            type="button"
            onClick={() => { setError(null); setLoading(true); setRetryKey(k => k + 1); }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream pb-28">

      {/* ── Gradient hero — compact, Lock In CTA lives inside it ── */}
      <div className="bg-gradient-to-br from-blush to-lavender px-5 pt-5 pb-8 relative overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/10 -translate-y-16 translate-x-16 pointer-events-none"/>
        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-white/15 translate-y-12 -translate-x-8 pointer-events-none"/>

        <div className="relative">
          {/* Welcome */}
          {profile && (
            <p className="text-plum/55 text-xs font-medium mb-3">
              Welcome back,{' '}
              <span className="text-plum font-bold">@{profile.username}</span>
            </p>
          )}

          {/* Event name */}
          <h1 className="font-display text-2xl font-bold text-plum leading-snug mb-2">
            {event?.name ?? 'Your Prom Event'}
          </h1>

          {/* Date pill */}
          {event?.date && (
            <div className="bg-white/55 backdrop-blur-sm rounded-2xl px-3.5 py-2 inline-flex items-center gap-2 mb-2">
              <Calendar size={12} className="text-plum/55"/>
              <p className="text-plum font-semibold text-xs">{formatDate(event.date)}</p>
            </div>
          )}

          {/* Location */}
          {event?.location && (
            <p className="text-plum/45 text-xs mb-5 flex items-center gap-1.5 font-medium">
              <MapPin size={11}/>{event.location}
            </p>
          )}

          {/* Lock In CTA — frosted glass card inside the gradient */}
          <button
            type="button"
            onClick={() => navigate('/lock')}
            className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-3xl p-5 flex items-center gap-4 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-14 h-14 rounded-3xl bg-primary/25 flex items-center justify-center flex-shrink-0">
              <Lock size={24} className="text-plum"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-plum text-base leading-tight mb-1">Lock In My Look</p>
              <p className="text-plum/50 text-xs leading-relaxed">Check for dupes · Claim your unique look</p>
            </div>
            <ChevronRight size={16} className="text-plum/35 flex-shrink-0"/>
          </button>
        </div>
      </div>

      {/* ── Cream content sheet — slides up with rounded top ── */}
      <div className="bg-cream rounded-t-3xl -mt-5 px-4 pt-6 flex flex-col gap-4">

        {/* Stats — single unified card */}
        <div className="bg-white rounded-3xl shadow-soft border border-primary/10 flex overflow-hidden">
          <div className="flex-1 text-center py-6">
            <p className="text-5xl font-bold text-primary leading-none mb-2">{lockCount}</p>
            <p className="text-plum/35 text-[10px] font-bold uppercase tracking-widest">Looks Locked</p>
          </div>
          <div className="w-px bg-plum/6 my-5"/>
          <div className="flex-1 text-center py-6 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center">
              <Users size={20} className="text-primary"/>
            </div>
            <p className="text-plum/35 text-[10px] font-bold uppercase tracking-widest">Your School</p>
          </div>
        </div>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/vault')}
            className="bg-white rounded-3xl shadow-soft border border-primary/10 flex flex-col items-center gap-3 py-7 active:scale-[0.97] transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-blush flex items-center justify-center">
              <ShoppingBag size={22} className="text-plum/60"/>
            </div>
            <span className="text-plum font-semibold text-sm">Browse Vault</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/new-listing')}
            className="bg-white rounded-3xl shadow-soft border border-primary/10 flex flex-col items-center gap-3 py-7 active:scale-[0.97] transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-sage flex items-center justify-center">
              <Plus size={22} className="text-plum/60"/>
            </div>
            <span className="text-plum font-semibold text-sm">List a Dress</span>
          </button>
        </div>

        {/* Safety note */}
        <div className="bg-sage/50 rounded-3xl px-5 py-4 flex items-center gap-3">
          <Shield size={14} className="text-plum/45 flex-shrink-0"/>
          <p className="text-plum/55 text-xs leading-relaxed">
            Buddy system for meetups · Never share your address · Stay safe
          </p>
        </div>

        {/* Recently locked */}
        <div className="pb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
              <Lock size={12} className="text-primary"/>
            </div>
            <h3 className="font-display text-base font-semibold text-plum">Recently Locked</h3>
          </div>

          {recentLocks.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-soft border border-primary/10 text-center py-10 px-6">
              <div className="w-14 h-14 rounded-full bg-blush flex items-center justify-center mx-auto mb-3">
                <Lock size={24} className="text-primary"/>
              </div>
              <p className="font-display font-semibold text-plum text-base mb-1">No looks locked yet</p>
              <p className="text-plum/40 text-xs mb-5 leading-relaxed">Be the first to lock in your look!</p>
              <button
                type="button"
                onClick={() => navigate('/lock')}
                className="px-7 py-3 bg-gradient-to-r from-primary to-lavender text-plum rounded-2xl text-sm font-bold shadow-soft inline-block"
              >
                Lock In Now
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-soft border border-primary/10 overflow-hidden divide-y divide-plum/4">
              {recentLocks.map((lock) => (
                <div key={lock.id} className="flex items-center gap-3.5 px-5 py-5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blush to-lavender flex items-center justify-center flex-shrink-0 font-bold text-plum text-sm">
                    {lock.profiles?.username?.slice(0, 2).toUpperCase() ?? '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-plum text-sm">@{lock.profiles?.username ?? 'someone'}</p>
                    <p className="text-plum/35 text-xs mt-0.5 truncate">{lock.color} · {lock.silhouette}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="bg-sage text-plum text-[9px] font-bold px-2.5 py-1 rounded-full">Locked</span>
                    <span className="text-plum/25 text-[10px]">{timeAgo(lock.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
