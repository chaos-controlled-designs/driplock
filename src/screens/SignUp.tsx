import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';

const GRADES = ['9th', '10th', '11th', '12th'];

// Hardcoded schools matching exact IDs seeded in Supabase
const SCHOOLS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Georgetown Exempted Village High School', city: 'Georgetown', state: 'OH' },
  { id: '00000000-0000-0000-0000-000000000001', name: 'Lakewood High School', city: 'Lakewood', state: 'OH' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Westfield High School', city: 'Westfield', state: 'NJ' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Riverside High School', city: 'Riverside', state: 'CA' },
];

export function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [grade, setGrade] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [safetyChecked, setSafetyChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (step === 1) {
      if (!username.trim() || !email.trim() || !password.trim()) {
        setError('Please fill in all fields.'); return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.'); return;
      }
    }
    if (step === 2) {
      if (!schoolId || !grade) {
        setError('Please select your school and grade.'); return;
      }
    }
    setError('');
    setStep(s => s + 1);
  };

  const handleSignUp = async () => {
    if (!safetyChecked) { setError('Please agree to the safety rules.'); return; }
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }

    // Email confirmation is ON — no session yet, can't write profile
    if (!data.session) {
      setLoading(false);
      setError('Account created! Check your email for a confirmation link, then come back and log in.');
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: username.trim(),
        school_id: schoolId,
        grade,
        safety_agreed: true,
      });
      if (profileError) { setError(profileError.message); setLoading(false); return; }
    }

    navigate('/event');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12 pb-8" style={{ backgroundColor: '#FDF8F5' }}>

      <button
        type="button"
        onClick={() => step === 1 ? navigate('/') : setStep(s => s - 1)}
        style={{ color: 'rgba(45,27,53,0.5)', fontSize: 14, fontWeight: 500, marginBottom: 24, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ← Back
      </button>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            height: 6, borderRadius: 99, flex: 1,
            backgroundColor: i <= step ? '#E8847A' : 'rgba(45,27,53,0.1)',
            transition: 'all 0.3s'
          }} />
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 28, fontWeight: 700, color: '#2D1B35', marginBottom: 4 }}>
            Create Account
          </h1>
          <p style={{ color: 'rgba(45,27,53,0.5)', fontSize: 14, marginBottom: 32 }}>
            Join thousands of girls locking in their looks
          </p>

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: 12, marginBottom: 16, color: '#DC2626', fontSize: 13 }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
            <div>
              <label className="label">Username</label>
              <input type="text" placeholder="e.g. glamgirl2026" value={username} onChange={e => setUsername(e.target.value)} className="input" />
              <p style={{ color: 'rgba(45,27,53,0.4)', fontSize: 11, marginTop: 4 }}>No real name needed — just your username is shown</p>
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} className="input" style={{ paddingRight: 48 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(45,27,53,0.4)' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button type="button" onClick={handleNext} className="btn-primary">Continue</button>
          <p style={{ textAlign: 'center', color: 'rgba(45,27,53,0.4)', fontSize: 13, marginTop: 16 }}>
            Already have an account?{' '}
            <button type="button" onClick={() => navigate('/login')} style={{ color: '#E8847A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Log In</button>
          </p>
        </>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 28, fontWeight: 700, color: '#2D1B35', marginBottom: 4 }}>
            Your School
          </h1>
          <p style={{ color: 'rgba(45,27,53,0.5)', fontSize: 14, marginBottom: 32 }}>
            Select your school and grade to join your event
          </p>

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: 12, marginBottom: 16, color: '#DC2626', fontSize: 13 }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
            <div>
              <label className="label">Your School</label>
              <div style={{ position: 'relative' }}>
                <select value={schoolId} onChange={e => setSchoolId(e.target.value)} className="input" style={{ appearance: 'none', paddingRight: 40 }}>
                  <option value="">Select your school</option>
                  {SCHOOLS.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.city}, {s.state}</option>
                  ))}
                </select>
                <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(45,27,53,0.4)', pointerEvents: 'none' }} />
              </div>
            </div>

            <div>
              <label className="label">Grade</label>
              <div style={{ position: 'relative' }}>
                <select value={grade} onChange={e => setGrade(e.target.value)} className="input" style={{ appearance: 'none', paddingRight: 40 }}>
                  <option value="">Select your grade</option>
                  {GRADES.map(g => <option key={g} value={g}>{g} Grade</option>)}
                </select>
                <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(45,27,53,0.4)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          <button type="button" onClick={handleNext} className="btn-primary">Continue</button>
        </>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 28, fontWeight: 700, color: '#2D1B35', marginBottom: 4 }}>
            Stay Safe 🛡️
          </h1>
          <p style={{ color: 'rgba(45,27,53,0.5)', fontSize: 14, marginBottom: 24 }}>
            Please read and agree before joining DripLock.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {[
              { icon: '👯', title: 'Buddy System Required', desc: 'Always bring a friend to any in-person meetup. Never go alone.' },
              { icon: '📍', title: 'Public Places Only', desc: 'Meet in public — a mall, coffee shop, or other busy location.' },
              { icon: '🚫', title: 'No Home Addresses', desc: 'Never share your home address. Use shipping through the app.' },
              { icon: '🔒', title: 'Username Only', desc: 'Your real name is never shown. Only your username is visible.' },
              { icon: '💬', title: 'Keep it in the App', desc: 'All communication stays inside DripLock.' },
            ].map(rule => (
              <div key={rule.title} className="card" style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{rule.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, color: '#2D1B35', fontSize: 13 }}>{rule.title}</p>
                  <p style={{ color: 'rgba(45,27,53,0.5)', fontSize: 12, marginTop: 2 }}>{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: 12, marginBottom: 16, color: '#DC2626', fontSize: 13 }}>{error}</div>}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 24 }}>
            <input type="checkbox" checked={safetyChecked} onChange={e => setSafetyChecked(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: '#E8847A' }} />
            <span style={{ color: 'rgba(45,27,53,0.7)', fontSize: 13, lineHeight: 1.5 }}>
              I have read and agree to the DripLock safety rules. I am a current high school student.
            </span>
          </label>

          <button type="button" onClick={handleSignUp} disabled={loading || !safetyChecked} className="btn-primary">
            {loading ? 'Creating your account...' : 'Join DripLock 🎀'}
          </button>
        </>
      )}
    </div>
  );
}