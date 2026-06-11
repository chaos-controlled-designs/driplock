import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, DRESS_SIZES } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save, Lock, ChevronDown } from 'lucide-react';

const SCHOOLS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Georgetown Exempted Village High School' },
  { id: '00000000-0000-0000-0000-000000000001', name: 'Lakewood High School' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Westfield High School' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Riverside High School' },
];

const GRADES = ['9th', '10th', '11th', '12th'];

export function Profile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  // ── Create-profile state (shown when no profile exists yet) ──────────
  const [username,    setUsername]    = useState('');
  const [schoolId,    setSchoolId]    = useState('');
  const [grade,       setGrade]       = useState('');
  const [creating,    setCreating]    = useState(false);
  const [createError, setCreateError] = useState('');

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
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword,  setChangingPassword]  = useState(false);
  const [passwordSaved,     setPasswordSaved]     = useState(false);
  const [passwordError,     setPasswordError]     = useState('');

  useEffect(() => {
    if (profile) {
      setBio(profile.bio ?? '');
      setDressSize(profile.usual_dress_size ?? '');
      setBust(profile.bust_inches?.toString() ?? '');
      setWaist(profile.waist_inches?.toString() ?? '');
      setHips(profile.hips_inches?.toString() ?? '');
    }
  }, [profile]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!username.trim() || !schoolId || !grade) {
      setCreateError('Please fill in all fields.'); return;
    }
    if (!user) return;
    setCreating(true);
    setCreateError('');
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      username: username.trim(),
      school_id: schoolId,
      grade,
      safety_agreed: true,
    });
    if (error) { setCreateError(error.message); setCreating(false); return; }
    await refreshProfile();
    setCreating(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveError('');
    const { error } = await supabase
      .from('profiles')
      .update({
        bio: bio.trim() || null,
        usual_dress_size: dressSize || null,
        bust_inches:  bust  ? parseInt(bust)  : null,
        waist_inches: waist ? parseInt(waist) : null,
        hips_inches:  hips  ? parseInt(hips)  : null,
      })
      .eq('id', profile.id);
    if (error) { setSaveError(error.message); setSaving(false); return; }
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in both fields.'); return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.'); return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.'); return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordError(error.message); setChangingPassword(false); return; }
    setNewPassword('');
    setConfirmPassword('');
    setChangingPassword(false);
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  // ── No profile yet → show setup screen ──────────────────────────────
  if (!profile) {
    return (
      <div className="min-h-screen pb-10" style={{ backgroundColor: '#FDF8F5' }}>

        <div style={{ background: 'linear-gradient(135deg, #F5D5CF, #F2D9D9)', padding: '48px 20px 32px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #E8847A, #f87171)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 28, marginBottom: 16,
          }}>
            ✨
          </div>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 24, fontWeight: 700, color: '#2D1B35', margin: '0 0 6px' }}>
            Complete Your Profile
          </h2>
          <p style={{ color: 'rgba(45,27,53,0.6)', fontSize: 14, margin: 0 }}>
            One last step before you dive in!
          </p>
        </div>

        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {createError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: 12, color: '#DC2626', fontSize: 13 }}>
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
            <p style={{ color: 'rgba(45,27,53,0.4)', fontSize: 11, marginTop: 4 }}>
              No real name needed — only your username is shown
            </p>
          </div>

          <div>
            <label className="label">Your School <span className="text-primary">*</span></label>
            <div style={{ position: 'relative' }}>
              <select
                value={schoolId}
                onChange={e => setSchoolId(e.target.value)}
                className="input"
                style={{ appearance: 'none', paddingRight: 40 }}
              >
                <option value="">Select your school</option>
                {SCHOOLS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(45,27,53,0.4)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <label className="label">Grade <span className="text-primary">*</span></label>
            <div style={{ position: 'relative' }}>
              <select
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className="input"
                style={{ appearance: 'none', paddingRight: 40 }}
              >
                <option value="">Select your grade</option>
                {GRADES.map(g => <option key={g} value={g}>{g} Grade</option>)}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(45,27,53,0.4)', pointerEvents: 'none' }} />
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary"
          >
            {creating ? 'Setting up...' : 'Complete Setup ✨'}
          </button>

        </div>
      </div>
    );
  }

  // ── Profile exists → show edit screen ───────────────────────────────
  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#FDF8F5' }}>

      <div style={{ background: 'linear-gradient(135deg, #F5D5CF, #F2D9D9)', padding: '48px 20px 32px' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(45,27,53,0.6)', fontSize: 14, fontWeight: 500, marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={16}/> Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #E8847A, #f87171)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 20 }}>
            {profile.username?.slice(0, 2).toUpperCase() ?? '??'}
          </div>
          <div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 20, fontWeight: 700, color: '#2D1B35', margin: 0 }}>
              @{profile.username}
            </h2>
            <p style={{ color: 'rgba(45,27,53,0.6)', fontSize: 14, margin: 0 }}>{profile.grade} grade</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {saved && (
          <div style={{ background: '#D4E8D4', borderRadius: 16, padding: 12, textAlign: 'center', color: '#2D1B35', fontWeight: 600, fontSize: 14 }}>
            ✓ Profile saved!
          </div>
        )}

        {saveError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: 12, color: '#DC2626', fontSize: 13 }}>
            {saveError}
          </div>
        )}

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

        <div>
          <label className="label">My Usual Dress Size</label>
          <p style={{ color: 'rgba(45,27,53,0.4)', fontSize: 11, marginBottom: 8 }}>Autofills when you create a listing</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DRESS_SIZES.map(s => (
              <button
                type="button"
                key={s}
                onClick={() => setDressSize(s)}
                style={{
                  padding: '6px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                  border: dressSize === s ? '1px solid #E8847A' : '1px solid rgba(45,27,53,0.1)',
                  background: dressSize === s ? '#E8847A' : 'white',
                  color: dressSize === s ? 'white' : '#2D1B35',
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">My Measurements (inches)</label>
          <p style={{ color: 'rgba(45,27,53,0.4)', fontSize: 11, marginBottom: 8 }}>Helps buyers know if a dress will fit</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Bust',  value: bust,  setter: setBust },
              { label: 'Waist', value: waist, setter: setWaist },
              { label: 'Hips',  value: hips,  setter: setHips },
            ].map(m => (
              <div key={m.label}>
                <p style={{ color: 'rgba(45,27,53,0.4)', fontSize: 10, fontWeight: 600, marginBottom: 4 }}>{m.label}"</p>
                <input
                  type="number"
                  placeholder="e.g. 34"
                  value={m.value}
                  onChange={e => m.setter(e.target.value)}
                  className="input"
                  style={{ textAlign: 'center' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(212,232,212,0.3)', borderRadius: 16, padding: 16 }}>
          <p style={{ fontWeight: 600, color: '#2D1B35', fontSize: 12, marginBottom: 4 }}>🛡️ Your Privacy</p>
          <p style={{ color: 'rgba(45,27,53,0.6)', fontSize: 12, lineHeight: 1.5 }}>
            Measurements are only visible when you post a listing. Your real name, email, and school are never shown.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Save size={16}/>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>

        <div style={{ height: 1, background: 'rgba(45,27,53,0.08)', margin: '8px 0' }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Lock size={16} color="#E8847A"/>
            <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, color: '#2D1B35', margin: 0 }}>
              Change Password
            </h3>
          </div>

          {passwordSaved && (
            <div style={{ background: '#D4E8D4', borderRadius: 16, padding: 12, textAlign: 'center', color: '#2D1B35', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
              ✓ Password updated!
            </div>
          )}

          {passwordError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: 12, color: '#DC2626', fontSize: 13, marginBottom: 12 }}>
              {passwordError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
            style={{
              width: '100%', padding: '14px', borderRadius: 16, marginTop: 12,
              background: '#2D1B35', color: 'white', fontWeight: 600, fontSize: 14,
              border: 'none', cursor: 'pointer', opacity: changingPassword ? 0.5 : 1,
            }}
          >
            {changingPassword ? 'Updating...' : '🔒 Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
