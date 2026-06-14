import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, DRESS_SIZES } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save, Lock, ChevronDown, Shield, Calendar } from 'lucide-react';

const GRADES = ['9th', '10th', '11th', '12th'];

const SCHOOL_REGEX = /^[a-zA-Z0-9\s&.,'"-]{5,100}$/;
const SCHOOL_ERROR = "Please type your full official school name (example: Georgetown High School, not GHS or Geo HS). Short abbreviations will break dupe checking.";

export function Profile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  // ── Create-profile state — lazy-initialized from localStorage ──────────
  // Using lazy initializers so localStorage is read exactly once (first render).
  const readSignup = (key: string) => () => {
    try { return JSON.parse(localStorage.getItem('drip_signup') || '{}')[key] ?? ''; }
    catch { return ''; }
  };
  const [username,         setUsername]         = useState<string>(readSignup('username'));
  const [schoolName,       setSchoolName]       = useState<string>(readSignup('school'));
  const [schoolFieldError, setSchoolFieldError] = useState('');
  const [grade,            setGrade]            = useState<string>(readSignup('grade'));
  const [createBio,           setCreateBio]           = useState('');
  const [createSize,          setCreateSize]          = useState('');
  const [createEventType,     setCreateEventType]     = useState('Prom');
  const [createEventDate,     setCreateEventDate]     = useState('');
  const [createEventTime,     setCreateEventTime]     = useState('');
  const [createEventLocation, setCreateEventLocation] = useState('');
  const [creating,            setCreating]            = useState(false);
  const [createError,      setCreateError]      = useState('');

  // hasSignupData drives whether we show the read-only "From signup" card
  const [hasSignupData]    = useState<boolean>(() => {
    try {
      const d = JSON.parse(localStorage.getItem('drip_signup') || '{}');
      return !!(d.username && d.school && d.grade);
    } catch { return false; }
  });

  // ── Edit-profile state ───────────────────────────────────────────────
  const [bio,       setBio]       = useState('');
  const [dressSize, setDressSize] = useState('');
  const [bust,      setBust]      = useState('');
  const [waist,     setWaist]     = useState('');
  const [hips,      setHips]      = useState('');
  const [eventType,     setEventType]     = useState('');
  const [eventDate,     setEventDate]     = useState('');
  const [eventTime,     setEventTime]     = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Password change state ────────────────────────────────────────────
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSaved,    setPasswordSaved]    = useState(false);
  const [passwordError,    setPasswordError]    = useState('');

  useEffect(() => {
    if (profile) {
      setBio(profile.bio ?? '');
      setDressSize(profile.usual_dress_size ?? '');
      setBust(profile.bust_inches?.toString() ?? '');
      setWaist(profile.waist_inches?.toString() ?? '');
      setHips(profile.hips_inches?.toString() ?? '');
      setEventType(profile.event_type ?? 'Prom');
      setEventDate(profile.event_date ?? '');
      setEventTime(profile.event_time ? profile.event_time.slice(0, 5) : '');
      setEventLocation(profile.event_location ?? '');
      // Profile confirmed loaded — safe to clear signup cache now.
      // This is the authoritative cleanup point; SignUp.tsx no longer does it.
      localStorage.removeItem('drip_signup');
    }
  }, [profile]);

  const handleCreate = async (skip = false) => {
    const trimmedSchool = schoolName.trim();
    if (!username.trim() || !trimmedSchool || !grade) {
      setCreateError('Please fill in all required fields.'); return;
    }
    if (!SCHOOL_REGEX.test(trimmedSchool)) {
      setSchoolFieldError(SCHOOL_ERROR); return;
    }
    setSchoolFieldError('');
    if (!user) return;
    setCreating(true); setCreateError('');
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: username.trim(),
      school: trimmedSchool,
      grade,
      safety_agreed: true,
      ...((!skip && createBio.trim())             ? { bio: createBio.trim() }                         : {}),
      ...((!skip && createSize)                   ? { usual_dress_size: createSize }                  : {}),
      event_type: createEventType || 'Prom',
      ...((!skip && createEventDate)              ? { event_date: createEventDate }                   : {}),
      ...((!skip && createEventTime)              ? { event_time: createEventTime }                   : {}),
      ...((!skip && createEventLocation.trim())   ? { event_location: createEventLocation.trim() }   : {}),
    }, { onConflict: 'id' });
    if (error) { setCreateError(error.message); setCreating(false); return; }
    localStorage.removeItem('drip_signup');
    await refreshProfile();
    setCreating(false);
    navigate('/event');
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true); setSaveError('');
    const { error } = await supabase.from('profiles').update({
      bio: bio.trim() || null,
      usual_dress_size: dressSize || null,
      bust_inches:  bust  ? parseInt(bust)  : null,
      waist_inches: waist ? parseInt(waist) : null,
      hips_inches:  hips  ? parseInt(hips)  : null,
      event_type: eventType || 'Prom',
      event_date: eventDate || null,
      event_time: eventTime || null,
      event_location: eventLocation.trim() || null,
    }).eq('id', profile.id);
    if (error) { setSaveError(error.message); setSaving(false); return; }
    await refreshProfile();
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    if (!newPassword || !confirmPassword) { setPasswordError('Please fill in both fields.'); return; }
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordError(error.message); setChangingPassword(false); return; }
    setNewPassword(''); setConfirmPassword('');
    setChangingPassword(false); setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  // ── No profile → setup screen ────────────────────────────────────────
  if (!profile) {
    const displayUsername = username || 'there';
    return (
      <div className="min-h-screen bg-cream pb-12">

        {/* Hero */}
        <div className="bg-gradient-to-br from-blush via-lavender to-blush px-5 pt-14 pb-10 rounded-b-[32px]">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center mb-5 shadow-medium mx-auto">
            {username
              ? <span className="font-bold text-plum text-2xl">{username.slice(0, 2).toUpperCase()}</span>
              : <Lock size={28} className="text-plum"/>
            }
          </div>
          <h2 className="font-display text-2xl font-bold text-plum text-center mb-1">
            Almost there{username ? `, @${username}` : ''}! 💕
          </h2>
          <p className="text-plum/55 text-sm text-center leading-relaxed">
            Add a few optional details to make your profile shine, then you're in.
          </p>
        </div>

        <div className="px-4 pt-6 flex flex-col gap-5">

          {createError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-600 text-xs font-medium">
              {createError}
            </div>
          )}

          {/* ── Locked fields ── */}
          {hasSignupData ? (
            <div className="flex flex-col gap-2">
              {/* Section header */}
              <div className="flex items-center justify-between px-1 mb-1">
                <p className="text-plum/55 text-xs font-semibold">Account details</p>
                <div className="flex items-center gap-1 text-plum/35">
                  <Lock size={10}/>
                  <span className="text-[10px] font-semibold">Set during signup</span>
                </div>
              </div>

              {/* Username row */}
              <div className="flex items-center gap-3 bg-plum/[0.04] border border-plum/10 rounded-2xl px-4 py-3">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-soft">
                  <span className="text-xs font-bold text-primary">@</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-plum/35 font-semibold uppercase tracking-wider mb-0.5">Username</p>
                  <p className="text-plum font-semibold text-sm">@{username}</p>
                </div>
                <Lock size={13} className="text-plum/20 flex-shrink-0"/>
              </div>

              {/* School row */}
              <div className="flex items-center gap-3 bg-plum/[0.04] border border-plum/10 rounded-2xl px-4 py-3">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-soft">
                  <span className="text-sm">🏫</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-plum/35 font-semibold uppercase tracking-wider mb-0.5">School</p>
                  <p className="text-plum font-semibold text-sm truncate">{schoolName}</p>
                </div>
                <Lock size={13} className="text-plum/20 flex-shrink-0"/>
              </div>

              {/* Grade row */}
              <div className="flex items-center gap-3 bg-plum/[0.04] border border-plum/10 rounded-2xl px-4 py-3">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-soft">
                  <span className="text-sm">🎓</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-plum/35 font-semibold uppercase tracking-wider mb-0.5">Grade</p>
                  <p className="text-plum font-semibold text-sm">{grade} Grade</p>
                </div>
                <Lock size={13} className="text-plum/20 flex-shrink-0"/>
              </div>
            </div>
          ) : (
            /* Fallback — no signup data in storage, show editable inputs */
            <>
              <div>
                <label className="label">Username <span className="text-primary">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. glamgirl2026"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">School Name <span className="text-primary">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Georgetown High School"
                  value={schoolName}
                  onChange={e => { setSchoolName(e.target.value); setSchoolFieldError(''); }}
                  className="input"
                  autoCapitalize="words"
                />
                {schoolFieldError && (
                  <p className="text-red-500 text-xs mt-1.5 leading-snug">{schoolFieldError}</p>
                )}
              </div>
              <div>
                <label className="label">Grade <span className="text-primary">*</span></label>
                <div className="relative">
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    className="input appearance-none pr-10"
                    aria-label="Select your grade"
                  >
                    <option value="">Select your grade</option>
                    {GRADES.map(g => <option key={g} value={g}>{g} Grade</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-plum/40 pointer-events-none"/>
                </div>
              </div>
            </>
          )}

          {/* Divider between locked and editable sections */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-plum/8"/>
            <p className="text-plum/30 text-[10px] font-semibold uppercase tracking-wider">Optional extras</p>
            <div className="flex-1 h-px bg-plum/8"/>
          </div>

          {/* ── Bio ── */}
          <div>
            <label className="label">
              About You <span className="text-plum/35 font-normal">(optional)</span>
            </label>
            <textarea
              placeholder={`Junior at ${schoolName || 'your school'}, obsessed with vintage glam and sparkly heels ✨`}
              value={createBio}
              onChange={e => setCreateBio(e.target.value)}
              rows={3}
              maxLength={200}
              className="input resize-none"
            />
            <p className="text-plum/35 text-[11px] mt-1 text-right">{createBio.length}/200</p>
          </div>

          {/* ── Dress size ── */}
          <div>
            <label className="label">
              My Usual Dress Size <span className="text-plum/35 font-normal">(optional)</span>
            </label>
            <p className="text-plum/40 text-[11px] mb-2">Auto-fills when you list a dress</p>
            <div className="flex flex-wrap gap-2">
              {DRESS_SIZES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCreateSize(createSize === s ? '' : s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                    createSize === s
                      ? 'bg-primary border-primary text-plum shadow-soft'
                      : 'bg-white border-primary/20 text-plum/55 hover:border-primary/40'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Your event ── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-plum/8"/>
            <p className="text-plum/30 text-[10px] font-semibold uppercase tracking-wider">Your Event</p>
            <div className="flex-1 h-px bg-plum/8"/>
          </div>

          <div>
            <label className="label">Event Type <span className="text-plum/35 font-normal">(optional)</span></label>
            <div className="flex gap-2">
              {['Prom', 'Homecoming', 'Other'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCreateEventType(createEventType === t ? '' : t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
                    createEventType === t
                      ? 'bg-primary border-primary text-plum shadow-soft'
                      : 'bg-white border-primary/20 text-plum/55 hover:border-primary/40'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="create-event-date" className="label">Date</label>
              <input
                id="create-event-date"
                type="date"
                value={createEventDate}
                onChange={e => setCreateEventDate(e.target.value)}
                title="Event date"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="create-event-time" className="label">Time</label>
              <input
                id="create-event-time"
                type="time"
                value={createEventTime}
                onChange={e => setCreateEventTime(e.target.value)}
                title="Event time"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Venue / Location</label>
            <input
              type="text"
              placeholder="e.g. The Grand Ballroom, Georgetown"
              value={createEventLocation}
              onChange={e => setCreateEventLocation(e.target.value)}
              className="input"
            />
          </div>

          {/* ── Actions ── */}
          <button
            type="button"
            onClick={() => handleCreate(false)}
            disabled={creating}
            className="btn-primary"
          >
            {creating ? 'Setting up...' : 'Complete My Profile →'}
          </button>

          <button
            type="button"
            onClick={() => handleCreate(true)}
            disabled={creating}
            className="w-full py-3 rounded-2xl text-plum/50 text-sm font-medium hover:text-plum transition-all"
          >
            Skip for now
          </button>

        </div>
      </div>
    );
  }

  // ── Profile exists → edit screen ─────────────────────────────────────
  return (
    <div className="min-h-screen pb-10 bg-cream">

      <div className="bg-gradient-to-br from-blush to-lavender px-5 pt-14 pb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-plum/60 text-sm font-medium mb-5"
        >
          <ArrowLeft size={16}/> Back
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center text-plum font-bold text-xl shadow-medium flex-shrink-0">
            {profile.username?.slice(0, 2).toUpperCase() ?? '??'}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-plum mb-0.5">@{profile.username}</h2>
            <p className="text-plum/60 text-sm">{profile.grade} grade</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">

        {saved && (
          <div className="bg-sage rounded-2xl p-3 text-center text-plum font-semibold text-sm">
            Profile saved!
          </div>
        )}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-600 text-xs font-medium">
            {saveError}
          </div>
        )}

        {/* Bio */}
        <div>
          <label className="label">About Me</label>
          <textarea
            placeholder="Tell other girls about your style, fave designers, prom theme..."
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            className="input resize-none"
          />
        </div>

        {/* Dress size */}
        <div>
          <label className="label">My Usual Dress Size</label>
          <p className="text-plum/40 text-[11px] mb-2">Autofills when you create a listing</p>
          <div className="flex flex-wrap gap-2">
            {DRESS_SIZES.map(s => (
              <button
                type="button"
                key={s}
                onClick={() => setDressSize(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  dressSize === s
                    ? 'bg-primary border-primary text-plum shadow-soft'
                    : 'bg-white border-primary/20 text-plum/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Measurements */}
        <div>
          <label className="label">My Measurements (inches)</label>
          <p className="text-plum/40 text-[11px] mb-2">Helps buyers know if a dress will fit</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Bust',  value: bust,  setter: setBust },
              { label: 'Waist', value: waist, setter: setWaist },
              { label: 'Hips',  value: hips,  setter: setHips },
            ].map(m => (
              <div key={m.label}>
                <p className="text-plum/40 text-[10px] font-semibold mb-1">{m.label}"</p>
                <input
                  type="number"
                  placeholder="e.g. 34"
                  value={m.value}
                  onChange={e => m.setter(e.target.value)}
                  className="input text-center"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Privacy note */}
        <div className="bg-sage/50 rounded-2xl p-4 flex gap-3 items-start">
          <Shield size={15} className="text-plum/50 mt-0.5 flex-shrink-0"/>
          <div>
            <p className="text-plum font-semibold text-xs mb-0.5">Your Privacy</p>
            <p className="text-plum/55 text-xs leading-relaxed">
              Measurements only appear when you post a listing. Your real name, email, and school are never shown.
            </p>
          </div>
        </div>

        {/* ── Event details ── */}
        <div className="h-px bg-plum/8"/>
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={15} className="text-primary"/>
          <h3 className="font-display text-base font-semibold text-plum">Your Event</h3>
        </div>

        <div>
          <label className="label">Event Type</label>
          <div className="flex gap-2">
            {['Prom', 'Homecoming', 'Other'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setEventType(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
                  eventType === t
                    ? 'bg-primary border-primary text-plum shadow-soft'
                    : 'bg-white border-primary/20 text-plum/60'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="edit-event-date" className="label">Date</label>
            <input
              id="edit-event-date"
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              title="Event date"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="edit-event-time" className="label">Time</label>
            <input
              id="edit-event-time"
              type="time"
              value={eventTime}
              onChange={e => setEventTime(e.target.value)}
              title="Event time"
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Venue / Location</label>
          <input
            type="text"
            placeholder="e.g. The Grand Ballroom, Georgetown"
            value={eventLocation}
            onChange={e => setEventLocation(e.target.value)}
            className="input"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Save size={16}/>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>

        <div className="h-px bg-plum/8 my-1"/>

        {/* Change password */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-primary"/>
            <h3 className="font-display text-base font-semibold text-plum">Change Password</h3>
          </div>

          {passwordSaved && (
            <div className="bg-sage rounded-2xl p-3 text-center text-plum font-semibold text-sm mb-3">
              Password updated!
            </div>
          )}
          {passwordError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-600 text-xs font-medium mb-3">
              {passwordError}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                placeholder="Type it again"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handlePasswordChange}
            disabled={changingPassword}
            className="w-full py-4 rounded-2xl font-semibold text-sm bg-plum text-white transition-all active:scale-95 disabled:opacity-50 mt-3"
          >
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>

      </div>
    </div>
  );
}
