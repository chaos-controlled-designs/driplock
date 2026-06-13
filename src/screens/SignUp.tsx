import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronDown, Eye, EyeOff, Users, MapPin, Lock, MessageCircle, Shield } from 'lucide-react';

const GRADES = ['9th', '10th', '11th', '12th'];

const SCHOOL_REGEX = /^[a-zA-Z0-9\s&.,'"-]{5,100}$/;
const SCHOOL_ERROR = "Please type your full official school name (example: Georgetown High School, not GHS or Geo HS). Short abbreviations will break dupe checking.";

const SAFETY_RULES = [
  { Icon: Users,         title: 'Buddy System Required', desc: 'Always bring a friend to any in-person meetup. Never go alone.' },
  { Icon: MapPin,        title: 'Public Places Only',     desc: 'Meet in public — a mall, coffee shop, or other busy location.' },
  { Icon: EyeOff,        title: 'No Home Addresses',      desc: 'Never share your home address. Use shipping through the app.' },
  { Icon: Lock,          title: 'Username Only',          desc: 'Your real name is never shown. Only your username is visible.' },
  { Icon: MessageCircle, title: 'Keep it in the App',     desc: 'All communication stays inside DripLock.' },
];

export function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [grade, setGrade] = useState('');
  const [schoolName,      setSchoolName]      = useState('');
  const [schoolFieldError, setSchoolFieldError] = useState('');
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
      const trimmed = schoolName.trim();
      if (!trimmed || !grade) {
        setError('Please fill in your school name and grade.'); return;
      }
      if (!SCHOOL_REGEX.test(trimmed)) {
        setSchoolFieldError(SCHOOL_ERROR); return;
      }
      setSchoolFieldError('');
      // Persist for Profile.tsx create-mode pre-fill (survives email-confirm redirect)
      localStorage.setItem('drip_signup', JSON.stringify({
        username: username.trim(),
        school: schoolName.trim(),
        grade,
      }));
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

    if (!data.session) {
      setLoading(false);
      setError('Account created! Check your email for a confirmation link, then come back and log in.');
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: username.trim(),
        school: schoolName.trim(),
        grade,
        safety_agreed: true,
      });
      if (profileError) { setError(profileError.message); setLoading(false); return; }
      // Don't clear localStorage here — Profile.tsx clears it once AuthContext
      // confirms the profile is loaded, preventing a race-condition blank form.
    }

    navigate('/event');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12 pb-8 bg-cream">

      <button
        type="button"
        onClick={() => step === 1 ? navigate('/') : setStep(s => s - 1)}
        className="text-plum/50 text-sm font-medium mb-6 text-left bg-transparent border-none cursor-pointer"
      >
        ← Back
      </button>

      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 rounded-full flex-1 transition-all ${i <= step ? 'bg-primary' : 'bg-plum/10'}`} />
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <>
          <h1 className="font-display text-3xl font-bold text-plum mb-1">Create Account</h1>
          <p className="text-plum/50 text-sm mb-8">Join thousands of girls locking in their looks</p>

          {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4 text-red-600 text-xs font-medium">{error}</div>}

          <div className="flex flex-col gap-4 mb-8">
            <div>
              <label className="label">Username</label>
              <input type="text" placeholder="e.g. glamgirl2026" value={username} onChange={e => setUsername(e.target.value)} className="input" />
              <p className="text-plum/40 text-[11px] mt-1">No real name needed — just your username is shown</p>
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} className="input pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-plum/40">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button type="button" onClick={handleNext} className="btn-primary">Continue</button>
          <p className="text-center text-plum/40 text-sm mt-4">
            Already have an account?{' '}
            <button type="button" onClick={() => navigate('/login')} className="text-primary font-semibold bg-transparent border-none cursor-pointer">Log In</button>
          </p>
        </>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <>
          <h1 className="font-display text-3xl font-bold text-plum mb-1">Your School</h1>
          <p className="text-plum/50 text-sm mb-8">Select your school and grade to join your event</p>

          {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4 text-red-600 text-xs font-medium">{error}</div>}

          <div className="flex flex-col gap-4 mb-8">
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
              <label className="label">Grade</label>
              <div className="relative">
                <select value={grade} onChange={e => setGrade(e.target.value)} className="input appearance-none pr-10" aria-label="Select your grade">
                  <option value="">Select your grade</option>
                  {GRADES.map(g => <option key={g} value={g}>{g} Grade</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-plum/40 pointer-events-none" />
              </div>
            </div>
          </div>

          <button type="button" onClick={handleNext} className="btn-primary">Continue</button>
        </>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={20} className="text-plum/70"/>
            <h1 className="font-display text-3xl font-bold text-plum">Stay Safe</h1>
          </div>
          <p className="text-plum/50 text-sm mb-6">Please read and agree before joining DripLock.</p>

          <div className="flex flex-col gap-2 mb-6">
            {SAFETY_RULES.map(rule => (
              <div key={rule.title} className="card flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-sage/50 flex items-center justify-center flex-shrink-0">
                  <rule.Icon size={15} className="text-plum/60"/>
                </div>
                <div>
                  <p className="font-semibold text-plum text-sm">{rule.title}</p>
                  <p className="text-plum/50 text-xs mt-0.5">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4 text-red-600 text-xs font-medium">{error}</div>}

          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={safetyChecked}
              onChange={e => setSafetyChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-primary"
            />
            <span className="text-plum/70 text-sm leading-relaxed">
              I have read and agree to the DripLock safety rules. I am a current high school student.
            </span>
          </label>

          <button type="button" onClick={handleSignUp} disabled={loading || !safetyChecked} className="btn-primary">
            {loading ? 'Creating your account...' : 'Join DripLock'}
          </button>
        </>
      )}
    </div>
  );
}
