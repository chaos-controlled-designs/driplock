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

      {/* Hero — tall gradient banner with decorative circles */}
      <div className="bg-gradient-to-br from-blush to-lavender px-5 pt-7 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-52 h-52 rounded-full bg-primary/10 -translate-y-20 translate-x-16"/>
        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-white/15 translate-y-14 -translate-x-10"/>

        <div className="relative">
          {profile && (
            <p className="text-plum/55 text-xs font-medium mb-4 tracking-wide">
              Welcome back,{' '}
              <span className="text-plum font-bold">@{profile.username}</span>
            </p>
          )}
          <h1 className="font-display text-3xl font-bold text-plum mb-3 leading-tight">
            {event?.name ?? 'Your Prom Event'}
          </h1>
          {event?.date && (
            <div className="bg-white/55 backdrop-blur-sm rounded-2xl px-4 py-2.5 inline-flex items-center gap-2">
              <Calendar size={13} className="text-plum/60"/>
              <p className="text-plum font-semibold text-sm">{formatDate(event.date)}</p>
            </div>
          )}
          {event?.location && (
            <p className="text-plum/50 text-xs mt-3 flex items-center gap-1.5 font-medium">
              <MapPin size={12}/>{event.location}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 -mt-12 flex flex-col gap-3">

        {/* Lock In — hero CTA card, most prominent element */}
        <button
          type="button"
          onClick={() => navigate('/lock')}
          className="w-full bg-gradient-to-r from-primary to-lavender rounded-3xl shadow-strong p-5 flex items-center gap-4 active:scale-[0.98] transition-all text-left"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/40 flex items-center justify-center flex-shrink-0">
            <Lock size={26} className="text-plum"/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-plum text-base leading-tight mb-0.5">Lock In My Look</p>
            <p className="text-plum/55 text-xs leading-relaxed">Check for dupes · Claim your unique look</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/35 flex items-center justify-center flex-shrink-0">
            <ChevronRight size={16} className="text-plum"/>
          </div>
        </button>

        {/* Stats — single unified card */}
        <div className="bg-white rounded-3xl shadow-soft border border-primary/10 flex overflow-hidden">
          <div className="flex-1 text-center py-5 px-3">
            <p className="text-4xl font-bold text-primary leading-none mb-1.5">{lockCount}</p>
            <p className="text-plum/40 text-[11px] font-semibold uppercase tracking-wider">Looks Locked</p>
          </div>
          <div className="w-px bg-plum/6 my-4"/>
          <div className="flex-1 text-center py-5 px-3 flex flex-col items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-blush flex items-center justify-center mb-1.5">
              <Users size={20} className="text-primary"/>
            </div>
            <p className="text-plum/40 text-[11px] font-semibold uppercase tracking-wider">Your School</p>
          </div>
        </div>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/vault')}
            className="bg-white rounded-2xl shadow-soft border border-primary/10 flex flex-col items-center gap-2.5 py-6 active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-blush flex items-center justify-center">
              <ShoppingBag size={22} className="text-plum/65"/>
            </div>
            <span className="text-plum font-semibold text-sm">Browse Vault</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/new-listing')}
            className="bg-white rounded-2xl shadow-soft border border-primary/10 flex flex-col items-center gap-2.5 py-6 active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-sage flex items-center justify-center">
              <Plus size={22} className="text-plum/65"/>
            </div>
            <span className="text-plum font-semibold text-sm">List a Dress</span>
          </button>
        </div>

        {/* Safety note — compact horizontal strip */}
        <div className="bg-sage/50 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Shield size={14} className="text-plum/50 flex-shrink-0"/>
          <p className="text-plum/55 text-xs leading-relaxed">
            Buddy system for meetups · Never share your address · Stay safe
          </p>
        </div>

        {/* Recently locked */}
        <div>
          <div className="flex items-center gap-2 mb-3 mt-1">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
              <Lock size={12} className="text-primary"/>
            </div>
            <h3 className="font-display text-base font-semibold text-plum">Recently Locked</h3>
          </div>

          {recentLocks.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-soft border border-primary/10 text-center py-12 px-6">
              <div className="w-16 h-16 rounded-full bg-blush flex items-center justify-center mx-auto mb-4">
                <Lock size={26} className="text-primary"/>
              </div>
              <p className="font-display font-semibold text-plum text-base mb-1.5">No looks locked yet</p>
              <p className="text-plum/45 text-xs mb-6 leading-relaxed">Be the first to lock in your look for this event!</p>
              <button
                type="button"
                onClick={() => navigate('/lock')}
                className="px-8 py-3 bg-gradient-to-r from-primary to-lavender text-plum rounded-2xl text-sm font-bold shadow-soft inline-block"
              >
                Lock In Now
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-soft border border-primary/10 overflow-hidden divide-y divide-plum/4">
              {recentLocks.map((lock) => (
                <div key={lock.id} className="flex items-center gap-3.5 px-5 py-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blush to-lavender flex items-center justify-center flex-shrink-0 font-bold text-plum text-sm shadow-soft">
                    {lock.profiles?.username?.slice(0, 2).toUpperCase() ?? '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-plum text-sm leading-tight">@{lock.profiles?.username ?? 'someone'}</p>
                    <p className="text-plum/40 text-xs mt-0.5 truncate">
                      {lock.color} · {lock.silhouette}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="bg-sage text-plum text-[9px] font-bold px-2.5 py-1 rounded-full">
                      Locked
                    </span>
                    <span className="text-plum/30 text-[10px]">{timeAgo(lock.created_at)}</span>
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
