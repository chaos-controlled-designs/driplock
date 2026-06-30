import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      if (authError.message.toLowerCase().includes('email not confirmed')) {
        setError('Check your inbox and click the confirmation link before signing in.');
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }
    navigate('/event');
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError('Enter your email above, then tap Forgot Password.'); return; }
    setResetLoading(true); setError('');
    await supabase.auth.resetPasswordForEmail(email.trim());
    setResetLoading(false);
    setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col px-6 pt-12 pb-8">
      <button type="button" onClick={() => navigate('/')} className="text-plum/50 text-sm font-medium mb-8 text-left">← Back</button>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-plum mb-1">Welcome Back</h1>
        <p className="text-plum/50 text-sm">Sign in to your DripLock account</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4 text-red-600 text-xs font-medium">{error}</div>}
      {resetSent && (
        <div className="bg-sage/40 border border-sage rounded-2xl p-3 mb-4 text-plum text-xs font-medium">
          Password reset email sent! Check your inbox.
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label className="label">Email</label>
          <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className="input"/>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className="input pr-12"/>
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-plum/40">
              {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetLoading}
            className="text-primary text-xs font-semibold mt-1.5 text-right w-full"
          >
            {resetLoading ? 'Sending…' : 'Forgot password?'}
          </button>
        </div>
      </div>

      <button type="button" onClick={handleLogin} disabled={loading} className="btn-primary mb-4">
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <p className="text-center text-plum/40 text-sm">
        Don't have an account?{' '}
        <button type="button" onClick={() => navigate('/signup')} className="text-primary font-semibold">Sign Up Free</button>
      </p>
    </div>
  );
}