import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, DRESS_SIZES } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save, Lock, ChevronDown, Shield } from 'lucide-react';

const GRADES = ['9th', '10th', '11th', '12th'];

const SCHOOL_REGEX = /^[a-zA-Z0-9\s&.,'"-]{5,100}$/;
const SCHOOL_ERROR = "Please type your full official school name (example: Georgetown High School, not GHS or Geo HS). Short abbreviations will break dupe checking.";

export function Profile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  // ── Create-profile state (pre-filled from localStorage if available) ──
  const signupData = (() => { try { return JSON.parse(localStorage.getItem('drip_signup') || '{}'); } catch { return {}; } })();
  const [username,         setUsername]         = useState<string>(signupData.username ?? '');
  const [schoolName,       setSchoolName]       = useState<string>(signupData.school   ?? '');
  const [schoolFieldError, setSchoolFieldError] = useState('');
  const [grade,            setGrade]            = useState<string>(signupData.grade    ?? '');
  const [createBio,        setCreateBio]        = useState('');
  const [createSize,       setCreateSize]       = useState('');
  const [creating,         setCreating]         = useState(false);
  const [createError,      setCreateError]      = useState('');

  const hasSignupData = !!(signupData.username && signupData.school && signupData.grade);

  // ── Edit-profile state ───────────────────────────────────────────────
  const [bio,       setBio]       = useState('');
  const [dressSize, setDressSize] = useState('');
  const [bust,      setBust]      = useState('');
  const [waist,     setWaist]     = useState('');
  const [hips,      setHips]      = useState('');
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
      ...((!skip && createBio.trim())  ? { bio: createBio.trim() }           : {}),
      ...((!skip && createSize)        ? { usual_dress_size: createSize }    : {}),
    }, { onConflict: 'id' });
    if (error) { setCreateError(error.message); setCreating(false); return; }
    localStorage.removeItem('drip_signup');
    await refreshProfile();
    setCreating(false);
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

          {/* ── From signup (read-only when data exists) ── */}
          {hasSignupData ? (
            <div className="bg-white rounded-3xl border border-primary/15 shadow-soft px-4 py-4">
              <p className="text-plum/40 text-[10px] font-bold uppercase tracking-widest mb-3">From your signup</p>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">@</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-plum/40 font-semibold uppercase tracking-wider">Username</p>
                    <p className="text-plum font-semibold text-sm">@{username}</p>
                  </div>
                </div>
                <div className="h-px bg-plum/5"/>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">🏫</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-plum/40 font-semibold uppercase tracking-wider">School · Grade</p>
                    <p className="text-plum font-semibold text-sm">{schoolName} · {grade}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* No localStorage data — show editable fields */
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
