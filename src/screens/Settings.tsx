import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, User, Heart, HelpCircle, Lock,
  LogOut, ChevronRight, Shield, Tag, Mail,
} from 'lucide-react';

const SCHOOLS: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'Georgetown Exempted Village High School',
  '00000000-0000-0000-0000-000000000001': 'Lakewood High School',
  '00000000-0000-0000-0000-000000000002': 'Westfield High School',
  '00000000-0000-0000-0000-000000000003': 'Riverside High School',
};

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-plum/40 mt-3 mb-1.5 px-1">
      {children}
    </p>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();

  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSaved,    setPasswordSaved]    = useState(false);
  const [passwordError,    setPasswordError]    = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const initials    = profile?.username?.slice(0, 2).toUpperCase() ?? user?.email?.slice(0, 2).toUpperCase() ?? '??';
  const schoolName  = profile?.school ?? (profile?.school_id ? (SCHOOLS[profile.school_id] ?? null) : null);

  const handlePasswordChange = async () => {
    setPasswordError('');
    if (!newPassword || !confirmPassword) { setPasswordError('Please fill in both fields.'); return; }
    if (newPassword.length < 6)           { setPasswordError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword)  { setPasswordError('Passwords do not match.'); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordError(error.message); setChangingPassword(false); return; }
    setNewPassword(''); setConfirmPassword('');
    setChangingPassword(false); setShowPasswordForm(false);
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  return (
    <div className="min-h-screen bg-cream pb-16">

      {/* Header */}
      <div className="bg-gradient-to-br from-blush to-lavender px-5 pt-14 pb-7">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-plum/60 text-sm font-medium mb-5"
        >
          <ArrowLeft size={16}/> Back
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center text-plum font-bold text-xl shadow-medium flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-plum mb-1">
              @{profile?.username ?? 'Set up your profile'}
            </h2>
            {profile?.grade && (
              <span className="inline-block bg-white/60 text-plum text-xs font-semibold rounded-full px-3 py-0.5 mb-0.5">
                {profile.grade} Grade
              </span>
            )}
            {schoolName && (
              <p className="text-plum/50 text-xs">{schoolName}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4 flex flex-col">

        {passwordSaved && (
          <div className="bg-sage rounded-2xl px-4 py-3 text-center text-plum font-semibold text-sm mb-3">
            Password updated successfully
          </div>
        )}

        {/* ACCOUNT */}
        <SectionLabel>Account</SectionLabel>
        <div className="card p-0 overflow-hidden">
          {[
            { icon: User,  label: 'Edit Profile',  sub: 'Username, measurements & dress size', path: '/profile' },
            { icon: Heart, label: 'My Favorites',  sub: 'Saved dresses from The Vault',         path: '/favorites' },
            { icon: Tag,   label: 'My Listings',   sub: 'Dresses you have listed for sale',     path: '/market' },
          ].map(({ icon: Icon, label, sub, path }, i) => (
            <button
              type="button"
              key={label}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-blush/40 transition-colors ${i > 0 ? 'border-t border-primary/10' : ''}`}
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon size={17} className="text-primary"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-plum text-sm">{label}</p>
                <p className="text-plum/45 text-xs mt-0.5 truncate">{sub}</p>
              </div>
              <ChevronRight size={15} className="text-plum/25 flex-shrink-0"/>
            </button>
          ))}
        </div>

        {/* SECURITY */}
        <SectionLabel>Security</SectionLabel>
        <div className="card p-0 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPasswordForm(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-blush/40 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-plum/6 flex items-center justify-center flex-shrink-0">
              <Lock size={17} className="text-plum/60"/>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-plum text-sm">Change Password</p>
              <p className="text-plum/45 text-xs mt-0.5">Update your account password</p>
            </div>
            <ChevronRight
              size={15}
              className={`text-plum/25 flex-shrink-0 transition-transform duration-200 ${showPasswordForm ? 'rotate-90' : ''}`}
            />
          </button>

          {showPasswordForm && (
            <div className="border-t border-primary/10 p-4 flex flex-col gap-3">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-600 text-xs font-medium">
                  {passwordError}
                </div>
              )}
              <div>
                <label className="label">New Password</label>
                <input type="password" placeholder="At least 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input"/>
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input type="password" placeholder="Type it again" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input"/>
              </div>
              <button type="button" onClick={handlePasswordChange} disabled={changingPassword} className="btn-primary mt-1">
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          )}
        </div>

        {/* SUPPORT */}
        <SectionLabel>Safety & Support</SectionLabel>
        <div className="card p-0 overflow-hidden">
          {[
            { icon: Shield,     label: 'Safety Rules', sub: 'Buddy system, meetup rules and more', path: '/help' },
            { icon: HelpCircle, label: 'Help & FAQ',   sub: 'How renting, locking, and fees work', path: '/help' },
          ].map(({ icon: Icon, label, sub, path }, i) => (
            <button
              type="button"
              key={label}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-sage/40 transition-colors ${i > 0 ? 'border-t border-primary/10' : ''}`}
            >
              <div className="w-9 h-9 rounded-xl bg-sage flex items-center justify-center flex-shrink-0">
                <Icon size={17} className="text-plum/60"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-plum text-sm">{label}</p>
                <p className="text-plum/45 text-xs mt-0.5 truncate">{sub}</p>
              </div>
              <ChevronRight size={15} className="text-plum/25 flex-shrink-0"/>
            </button>
          ))}
        </div>

        {/* Contact */}
        <div className="card text-center mt-3">
          <p className="text-plum/50 text-sm mb-1.5">Need help?</p>
          <a
            href="mailto:support@driplock.app"
            className="text-primary font-semibold text-sm flex items-center justify-center gap-1.5"
          >
            <Mail size={14}/>
            support@driplock.app
          </a>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 border border-red-200 text-red-500 font-semibold text-sm mt-3 active:scale-95 transition-all"
        >
          <LogOut size={16}/>
          Sign Out
        </button>

        <p className="text-center text-plum/25 text-xs mt-4">DripLock · Version 1.0</p>
      </div>
    </div>
  );
}
