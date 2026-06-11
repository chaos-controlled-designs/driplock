import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, User, Heart, HelpCircle, Lock,
  LogOut, ChevronRight, Shield, Star,
} from 'lucide-react';

const SCHOOLS: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'Georgetown Exempted Village High School',
  '00000000-0000-0000-0000-000000000001': 'Lakewood High School',
  '00000000-0000-0000-0000-000000000002': 'Westfield High School',
  '00000000-0000-0000-0000-000000000003': 'Riverside High School',
};

export function Settings() {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();

  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSaved,    setPasswordSaved]    = useState(false);
  const [passwordError,    setPasswordError]    = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? user?.email?.slice(0, 2).toUpperCase() ?? '??';
  const schoolName = profile?.school_id ? (SCHOOLS[profile.school_id] ?? 'Unknown School') : null;

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
    setShowPasswordForm(false);
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: '#FDF8F5' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #F5D5CF, #E8D5F5)', padding: '48px 20px 28px' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(45,27,53,0.6)', fontSize: 14, fontWeight: 500, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={16}/> Back
        </button>

        {/* Profile card in header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #E8847A, #f87171)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 22,
            boxShadow: '0 4px 16px rgba(232,132,122,0.35)',
          }}>
            {initials}
          </div>
          <div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 22, fontWeight: 700, color: '#2D1B35', margin: '0 0 2px' }}>
              @{profile?.username ?? 'Set up your profile'}
            </h2>
            {profile?.grade && (
              <span style={{
                display: 'inline-block', background: 'rgba(232,132,122,0.15)',
                color: '#E8847A', fontSize: 11, fontWeight: 700,
                borderRadius: 99, padding: '2px 10px', marginBottom: 2,
              }}>
                {profile.grade} Grade
              </span>
            )}
            {schoolName && (
              <p style={{ color: 'rgba(45,27,53,0.5)', fontSize: 12, margin: '4px 0 0' }}>{schoolName}</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Password saved toast */}
        {passwordSaved && (
          <div style={{ background: '#D4E8D4', borderRadius: 16, padding: 12, textAlign: 'center', color: '#2D1B35', fontWeight: 600, fontSize: 14 }}>
            ✓ Password updated!
          </div>
        )}

        {/* ACCOUNT section */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(45,27,53,0.4)', marginBottom: 2 }}>
          Account
        </p>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {[
            { icon: User,      label: 'Edit Profile',   sub: 'Update username, size, measurements', path: '/profile' },
            { icon: Heart,     label: 'My Favorites',   sub: 'Saved dresses from The Vault',        path: '/favorites' },
            { icon: Star,      label: 'My Listings',    sub: 'Dresses you\'ve listed for sale',     path: '/market' },
          ].map(({ icon: Icon, label, sub, path }, i) => (
            <button
              type="button"
              key={label}
              onClick={() => navigate(path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
                borderTop: i > 0 ? '1px solid rgba(45,27,53,0.06)' : 'none',
                textAlign: 'left',
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(232,132,122,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color="#E8847A"/>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: '#2D1B35', fontSize: 14, margin: 0 }}>{label}</p>
                <p style={{ color: 'rgba(45,27,53,0.45)', fontSize: 12, margin: '1px 0 0' }}>{sub}</p>
              </div>
              <ChevronRight size={16} color="rgba(45,27,53,0.25)"/>
            </button>
          ))}
        </div>

        {/* SECURITY section */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(45,27,53,0.4)', marginTop: 4, marginBottom: 2 }}>
          Security
        </p>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setShowPasswordForm(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(45,27,53,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lock size={18} color="#2D1B35"/>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, color: '#2D1B35', fontSize: 14, margin: 0 }}>Change Password</p>
              <p style={{ color: 'rgba(45,27,53,0.45)', fontSize: 12, margin: '1px 0 0' }}>Update your account password</p>
            </div>
            <ChevronRight size={16} color="rgba(45,27,53,0.25)" style={{ transform: showPasswordForm ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}/>
          </button>

          {showPasswordForm && (
            <div style={{ borderTop: '1px solid rgba(45,27,53,0.06)', padding: '16px' }}>
              {passwordError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', color: '#DC2626', fontSize: 13, marginBottom: 12 }}>
                  {passwordError}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                  <label className="label">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Type it again"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="btn-primary"
                  style={{ marginTop: 4 }}
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SUPPORT section */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(45,27,53,0.4)', marginTop: 4, marginBottom: 2 }}>
          Safety & Support
        </p>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {[
            { icon: Shield,   label: 'Safety Rules',  sub: 'Buddy system, meetup rules & more', path: '/help' },
            { icon: HelpCircle, label: 'Help & FAQ',  sub: 'How renting, locking, and fees work', path: '/help' },
          ].map(({ icon: Icon, label, sub, path }, i) => (
            <button
              type="button"
              key={label}
              onClick={() => navigate(path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
                borderTop: i > 0 ? '1px solid rgba(45,27,53,0.06)' : 'none',
                textAlign: 'left',
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(212,232,212,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color="#4a7c4e"/>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: '#2D1B35', fontSize: 14, margin: 0 }}>{label}</p>
                <p style={{ color: 'rgba(45,27,53,0.45)', fontSize: 12, margin: '1px 0 0' }}>{sub}</p>
              </div>
              <ChevronRight size={16} color="rgba(45,27,53,0.25)"/>
            </button>
          ))}
        </div>

        {/* Contact */}
        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <p style={{ fontWeight: 600, color: '#2D1B35', fontSize: 13, margin: '0 0 4px' }}>Need help? We're here 💕</p>
          <a href="mailto:support@driplock.app" style={{ color: '#E8847A', fontWeight: 600, fontSize: 13, textDecoration: 'underline' }}>
            support@driplock.app
          </a>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '15px', borderRadius: 18,
            background: '#FEF2F2', border: '1px solid #FECACA',
            color: '#DC2626', fontWeight: 700, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer', marginTop: 4,
          }}
        >
          <LogOut size={16}/>
          Sign Out
        </button>

        <p style={{ textAlign: 'center', color: 'rgba(45,27,53,0.25)', fontSize: 11, marginTop: 4 }}>
          DripLock · Version 1.0 · Made for girls, by girls 💗
        </p>
      </div>
    </div>
  );
}
