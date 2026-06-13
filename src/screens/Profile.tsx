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

  // ── Create-profile state ─────────────────────────────────────────────
  const [username,         setUsername]         = useState('');
  const [schoolName,       setSchoolName]       = useState('');
  const [schoolFieldError, setSchoolFieldError] = useState('');
  const [grade,            setGrade]            = useState('');
  const [creating,         setCreating]         = useState(false);
  const [createError,      setCreateError]      = useState('');

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

  const handleCreate = async () => {
    const trimmedSchool = schoolName.trim();
    if (!username.trim() || !trimmedSchool || !grade) {
      setCreateError('Please fill in all fields.'); return;
    }
    if (!SCHOOL_REGEX.test(trimmedSchool)) {
      setSchoolFieldError(SCHOOL_ERROR); return;
    }
    setSchoolFieldError('');
    if (!user) return;
    setCreating(true); setCreateError('');
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, username: username.trim(), school: trimmedSchool,
      grade, safety_agreed: true,
    }, { onConflict: 'id' });
    if (error) { setCreateError(error.message); setCreating(false); return; }
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
    return (
      <div className="min-h-screen pb-10 bg-cream">
        <div className="bg-gradient-to-br from-blush to-lavender px-5 pt-14 pb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center mb-4 shadow-medium">
            <Lock size={26} className="text-plum"/>
          </div>
          <h2 className="font-display text-2xl font-bold text-plum mb-1">Complete Your Profile</h2>
          <p className="text-plum/60 text-sm">One quick step before you dive in!</p>
        </div>

        <div className="px-4 pt-5 flex flex-col gap-4">
          {createError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-600 text-xs font-medium">
              {createError}
            </div>
          )}

          <div>
            <label className="label">Username <span className="text-primary">*</span></label>
            <input
              type="text"
              placeholder="e.g. glamgirl2026"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="input"
            />
            <p className="text-plum/40 text-[11px] mt-1">No real name needed — only your username is shown</p>
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
            <p className="text-plum/40 text-[11px] mt-1">Type your full official school name</p>
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

          <button type="button" onClick={handleCreate} disabled={creating} className="btn-primary">
            {creating ? 'Setting up...' : 'Complete Setup'}
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
