import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Lock, ShoppingBag, Plus, Users, MapPin, Shield, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-cream pb-24">

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-blush to-lavender px-5 pt-6 pb-8">
        {profile && (
          <p className="text-plum/60 text-xs font-medium mb-3">
            Welcome back, <span className="text-plum font-semibold">@{profile.username}</span>
          </p>
        )}
        <h2 className="font-display text-2xl font-bold text-plum mb-1">
          {event?.name ?? 'Your Prom Event'}
        </h2>
        {event?.date && (
          <p className="text-plum/60 text-sm">{formatDate(event.date)}</p>
        )}
        {event?.location && (
          <p className="text-plum/50 text-xs mt-1.5 flex items-center gap-1">
            <MapPin size={11}/> {event.location}
          </p>
        )}
      </div>

      <div className="px-4 -mt-4">

        {/* Stats */}
        <div className="flex gap-3 mb-4">
          <div className="card flex-1 text-center py-4">
            <p className="text-3xl font-bold text-primary mb-0.5">{lockCount}</p>
            <p className="text-plum/50 text-xs font-medium">Looks Locked</p>
          </div>
          <div className="card flex-1 text-center py-4">
            <div className="flex justify-center mb-0.5">
              <Users size={28} className="text-primary"/>
            </div>
            <p className="text-plum/50 text-xs font-medium">Your School</p>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={() => navigate('/lock')}
          className="w-full bg-gradient-to-r from-primary to-lavender text-plum font-semibold py-4 rounded-2xl shadow-soft flex items-center justify-center gap-2 mb-3 active:scale-95 transition-all"
        >
          <Lock size={18}/>
          Lock In My Look
        </button>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => navigate('/vault')}
            className="card flex items-center gap-2 justify-center py-3 active:scale-95 transition-all"
          >
            <ShoppingBag size={16} className="text-primary"/>
            <span className="text-plum font-semibold text-sm">Browse Vault</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/new-listing')}
            className="card flex items-center gap-2 justify-center py-3 active:scale-95 transition-all"
          >
            <Plus size={16} className="text-primary"/>
            <span className="text-plum font-semibold text-sm">List a Dress</span>
          </button>
        </div>

        {/* Safety reminder */}
        <div className="bg-sage rounded-2xl p-4 flex gap-3 mb-5">
          <Shield size={16} className="text-plum/50 mt-0.5 flex-shrink-0"/>
          <div>
            <p className="font-semibold text-plum text-xs mb-0.5">Safety Reminder</p>
            <p className="text-plum/55 text-xs leading-relaxed">
              Always bring a friend to meetups. Never share your home address. Stay safe.
            </p>
          </div>
        </div>

        {/* Recent locks */}
        <div className="flex items-center gap-2 mb-3">
          <Lock size={15} className="text-primary"/>
          <h3 className="font-display text-base font-semibold text-plum">Recently Locked</h3>
        </div>

        {recentLocks.length === 0 ? (
          <div className="card text-center py-8">
            <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center mx-auto mb-3">
              <ShoppingBag size={22} className="text-primary"/>
            </div>
            <p className="font-semibold text-plum text-sm mb-1">No looks locked yet</p>
            <p className="text-plum/50 text-xs mb-4">Be the first to lock in your look</p>
            <button
              type="button"
              onClick={() => navigate('/lock')}
              className="px-6 py-2 bg-gradient-to-r from-primary to-lavender text-plum rounded-xl text-sm font-semibold shadow-soft"
            >
              Lock In Now
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentLocks.map((lock) => (
              <div key={lock.id} className="card flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blush to-lavender flex items-center justify-center flex-shrink-0 font-bold text-plum text-sm">
                  {lock.profiles?.username?.slice(0, 2).toUpperCase() ?? '??'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-plum text-sm">@{lock.profiles?.username ?? 'someone'}</p>
                  <p className="text-plum/50 text-xs truncate">
                    {lock.color} · {lock.silhouette} · {timeAgo(lock.created_at)}
                  </p>
                </div>
                <span className="bg-sage text-plum/70 text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0">
                  Locked
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
