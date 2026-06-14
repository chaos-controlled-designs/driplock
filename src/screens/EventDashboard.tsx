import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Lock, ShoppingBag, Plus, Users, MapPin, Shield, AlertCircle,
  Calendar, ChevronRight, Edit2, X, Save, Check,
} from 'lucide-react';

const EVENT_ID = '22222222-2222-2222-2222-222222222222';
const EVENT_TYPES = ['Prom', 'Homecoming', 'Other'] as const;

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
  const { profile, user, refreshProfile } = useAuth();

  const [lockCount,   setLockCount]   = useState(0);
  const [schoolCount, setSchoolCount] = useState(0);
  const [recentLocks, setRecentLocks] = useState<EventLock[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [retryKey,    setRetryKey]    = useState(0);

  // Edit-event sheet state
  const [editing,       setEditing]       = useState(false);
  const [editEventType, setEditEventType] = useState('Prom');
  const [editDate,      setEditDate]      = useState('');
  const [editTime,      setEditTime]      = useState('');
  const [editLocation,  setEditLocation]  = useState('');
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState('');
  const [saveDone,      setSaveDone]      = useState(false);

  const schoolName = profile?.school ?? null;

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);

        // ── Total lock count ──────────────────────────────────────────
        const { count: total } = await supabase
          .from('locks')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', EVENT_ID);
        setLockCount(total ?? 0);

        // ── Recent 5 locks for the feed ───────────────────────────────
        const { data: locks, error: locksError } = await supabase
          .from('locks')
          .select('*, profiles(username)')
          .eq('event_id', EVENT_ID)
          .order('created_at', { ascending: false })
          .limit(5);
        if (!locksError) setRecentLocks((locks ?? []) as EventLock[]);

        // ── School-specific count ─────────────────────────────────────
        if (profile?.school) {
          const { data: schoolProfiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('school', profile.school);

          if (schoolProfiles && schoolProfiles.length > 0) {
            const { count: sc } = await supabase
              .from('locks')
              .select('id', { count: 'exact', head: true })
              .eq('event_id', EVENT_ID)
              .in('user_id', schoolProfiles.map((p: { id: string }) => p.id));
            setSchoolCount(sc ?? 0);
          }
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (user) { load(); } else { setLoading(false); }
  }, [user, profile, retryKey]);

  const handleSaveEvent = async () => {
    if (!user) return;
    setSaving(true); setSaveError('');
    const { error: err } = await supabase
      .from('profiles')
      .update({
        event_type: editEventType || 'Prom',
        event_date: editDate || null,
        event_time: editTime || null,
        event_location: editLocation.trim() || null,
      })
      .eq('id', user.id);
    setSaving(false);
    if (err) { setSaveError(err.message); return; }
    await refreshProfile();
    setSaveDone(true);
    setTimeout(() => { setSaveDone(false); setEditing(false); }, 1200);
  };

  const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatEventTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  const eventType = profile?.event_type || 'Prom';
  const displayEventName = schoolName
    ? `${schoolName} ${eventType}`
    : `Your ${eventType}`;

  const openEdit = () => {
    setEditEventType(profile?.event_type || 'Prom');
    setEditDate(profile?.event_date || '');
    setEditTime(profile?.event_time ? profile.event_time.slice(0, 5) : '');
    setEditLocation(profile?.event_location || '');
    setEditing(true);
    setSaveError('');
    setSaveDone(false);
  };

  const shortSchool = schoolName
    ? (schoolName.length > 22 ? schoolName.slice(0, 20) + '…' : schoolName)
    : 'Your School';

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

      {/* ── Gradient hero ── */}
      <div className="bg-gradient-to-br from-blush to-lavender px-5 pt-6 pb-10 relative overflow-hidden rounded-b-[28px]">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/10 -translate-y-16 translate-x-16 pointer-events-none"/>
        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-white/15 translate-y-12 -translate-x-8 pointer-events-none"/>

        <div className="relative">
          {profile && (
            <p className="text-plum/55 text-xs font-medium mb-3">
              Welcome back, <span className="text-plum font-bold">@{profile.username}</span>
            </p>
          )}

          {/* Event name — school + event type */}
          <h1 className="font-display text-2xl font-bold text-plum leading-snug mb-2">
            {displayEventName}
          </h1>

          {/* Date + time pill */}
          {profile?.event_date ? (
            <div className="bg-white/55 backdrop-blur-sm rounded-2xl px-3.5 py-2 inline-flex items-center gap-2 mb-1 ring-1 ring-white/40">
              <Calendar size={12} className="text-plum/55"/>
              <p className="text-plum font-semibold text-xs">
                {formatEventDate(profile.event_date)}
                {profile.event_time ? ` · ${formatEventTime(profile.event_time)}` : ''}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={openEdit}
              className="bg-white/40 backdrop-blur-sm rounded-2xl px-3.5 py-2 inline-flex items-center gap-2 mb-1 ring-1 ring-white/30 active:scale-95 transition-all"
            >
              <Calendar size={12} className="text-plum/40"/>
              <p className="text-plum/50 font-semibold text-xs">Set event date →</p>
            </button>
          )}

          {profile?.event_location && (
            <p className="text-plum/45 text-xs flex items-center gap-1.5 font-medium mb-1">
              <MapPin size={11}/>{profile.event_location}
            </p>
          )}

          {/* Edit CTA */}
          <button
            type="button"
            onClick={openEdit}
            className="mt-2 mb-5 flex items-center gap-1.5 text-plum/55 text-xs font-semibold active:scale-95 transition-all hover:text-plum/80"
          >
            <Edit2 size={12}/>
            Edit event type, date &amp; location
          </button>

          {/* Lock In CTA */}
          <button
            type="button"
            onClick={() => navigate('/lock')}
            className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-3xl p-5 flex items-center gap-4 active:scale-[0.98] transition-all duration-200 text-left hover:bg-white/65 hover:border-white/80 hover:shadow-soft"
          >
            <div className="w-14 h-14 rounded-3xl bg-white/60 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-soft ring-1 ring-white/50">
              <Lock size={26} className="text-plum"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-plum text-base leading-tight mb-1">Lock In My Look</p>
              <p className="text-plum/55 text-[13px] leading-relaxed">Check for dupes · Claim your unique look</p>
            </div>
            <ChevronRight size={16} className="text-plum/35 flex-shrink-0"/>
          </button>
        </div>
      </div>

      {/* ── Cream content ── */}
      <div className="bg-cream rounded-t-4xl -mt-6 px-5 pt-7 flex flex-col gap-5">

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl shadow-medium flex flex-col items-center justify-center py-7">
            <p className="text-5xl font-bold text-primary leading-none mb-2">{lockCount}</p>
            <p className="text-plum/35 text-[10px] font-bold uppercase tracking-widest">Looks Locked</p>
          </div>

          <div className="bg-white rounded-3xl shadow-medium flex flex-col items-center justify-center py-6 px-3 text-center gap-1.5">
            <div className="w-10 h-10 rounded-2xl bg-blush flex items-center justify-center">
              <Users size={18} className="text-primary"/>
            </div>
            <p className="text-3xl font-bold text-plum leading-none">{schoolCount}</p>
            <p className="text-plum/40 text-[9px] font-bold uppercase tracking-wider leading-snug line-clamp-2">
              {shortSchool}
            </p>
          </div>
        </div>

        {/* School count banner */}
        <div className="bg-lavender/40 rounded-3xl px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white/70 flex items-center justify-center flex-shrink-0">
            <Users size={17} className="text-primary"/>
          </div>
          <p className="text-plum text-sm leading-snug flex-1">
            {schoolCount === 0 ? (
              schoolName
                ? <>Be the first girl from <span className="font-bold">{schoolName}</span> to lock in for {eventType.toLowerCase()}!</>
                : `Be the first to lock in for ${eventType.toLowerCase()}!`
            ) : (
              schoolName
                ? <><span className="font-bold text-primary">{schoolCount}</span> girl{schoolCount === 1 ? '' : 's'} from <span className="font-bold">{schoolName}</span> {schoolCount === 1 ? 'has' : 'have'} locked in for {eventType.toLowerCase()}</>
                : <><span className="font-bold text-primary">{schoolCount}</span> girl{schoolCount === 1 ? '' : 's'} locked in for {eventType.toLowerCase()}</>
            )}
          </p>
        </div>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => navigate('/vault')}
            className="bg-white rounded-3xl shadow-medium flex flex-col items-center gap-3 py-8 active:scale-[0.97] transition-all duration-200 hover:shadow-strong hover:-translate-y-0.5"
          >
            <div className="w-14 h-14 rounded-3xl bg-blush flex items-center justify-center">
              <ShoppingBag size={24} className="text-plum/60"/>
            </div>
            <span className="text-plum font-semibold text-sm">Browse Vault</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/new-listing')}
            className="bg-white rounded-3xl shadow-medium flex flex-col items-center gap-3 py-8 active:scale-[0.97] transition-all duration-200 hover:shadow-strong hover:-translate-y-0.5"
          >
            <div className="w-14 h-14 rounded-3xl bg-sage flex items-center justify-center">
              <Plus size={24} className="text-plum/60"/>
            </div>
            <span className="text-plum font-semibold text-sm">List a Dress</span>
          </button>
        </div>

        {/* Safety note */}
        <div className="bg-sage/50 rounded-3xl px-5 py-4 flex items-center gap-3 shadow-soft">
          <Shield size={14} className="text-plum/45 flex-shrink-0"/>
          <p className="text-plum/55 text-xs leading-relaxed">
            Buddy system for meetups · Never share your address · Stay safe
          </p>
        </div>

        {/* Recently locked feed */}
        <div className="pb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
              <Lock size={12} className="text-primary"/>
            </div>
            <h3 className="font-display text-base font-semibold text-plum">Recently Locked</h3>
          </div>

          {recentLocks.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-medium text-center py-10 px-6">
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
            <div className="bg-white rounded-3xl shadow-medium overflow-hidden divide-y divide-plum/4">
              {recentLocks.map(lock => (
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

      {/* ── Edit Event Sheet ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-plum/25 backdrop-blur-sm"
            onClick={() => setEditing(false)}
          />
          <div className="relative bg-white rounded-t-[32px] px-5 pt-6 pb-10 z-10">
            <div className="flex items-center justify-between mb-5">
              <p className="font-bold text-plum text-base">Edit Event Details</p>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setEditing(false)}
                className="w-8 h-8 rounded-full bg-cream flex items-center justify-center"
              >
                <X size={16} className="text-plum/50"/>
              </button>
            </div>

            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4 text-red-600 text-xs font-medium">
                {saveError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Event type chips */}
              <div>
                <label className="label">Event Type</label>
                <div className="flex gap-2">
                  {EVENT_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditEventType(t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
                        editEventType === t
                          ? 'bg-primary border-primary text-plum shadow-soft'
                          : 'bg-white border-primary/20 text-plum/55'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-event-date" className="label">Date</label>
                  <input
                    id="edit-event-date"
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    title="Event date"
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="edit-event-time" className="label">Time</label>
                  <input
                    id="edit-event-time"
                    type="time"
                    value={editTime}
                    onChange={e => setEditTime(e.target.value)}
                    title="Event time"
                    className="input"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="label">Location / Venue</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder="The Grand Ballroom, Georgetown, OH"
                  className="input"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveEvent}
              disabled={saving || saveDone}
              className="btn-primary mt-5 flex items-center justify-center gap-2"
            >
              {saveDone
                ? <><Check size={16}/> Saved!</>
                : saving
                  ? 'Saving...'
                  : <><Save size={16}/> Save Event Details</>}
            </button>

            <p className="text-plum/35 text-[10px] text-center mt-3 leading-relaxed">
              Changes are saved to your profile and shown on your dashboard.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
