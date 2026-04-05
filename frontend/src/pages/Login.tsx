import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowRight, CheckCircle, Smartphone, Building2, Shield, Users, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, googleProvider } from '@/firebase';
import { signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { api } from '@/api/client';

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

export function Login() {
  const [, setLocation] = useLocation();
  const setUser = useAuthStore(state => state.setUser);
  const [role, setRole] = useState<'LANDLORD' | 'CARETAKER' | 'TENANT'>('LANDLORD');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'LOGIN' | 'OTP'>('LOGIN');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // Clean up reCAPTCHA on component unmount to prevent memory leaks/ID collisions
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const setupRecaptcha = () => {
    // Check if instance already exists and the container is still in the DOM
    if (window.recaptchaVerifier) return;

    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        console.log('Recaptcha resolved');
      },
      'expired-callback': () => {
        window.recaptchaVerifier?.clear();
        window.recaptchaVerifier = null;
      }
    });
  };

  const handlePhoneLogin = async () => {
    if (!phone || phone.length < 10) return;
    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      window.confirmationResult = confirmationResult;
      setStep('OTP');
    } catch (error: any) {
      console.error("Phone Login Error:", error);
      alert(error.message || 'Login failed. Please try again.');
      // Reset recaptcha on error so user can try again
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length < 6) return;
    setLoading(true);
    try {
      const result = await window.confirmationResult.confirm(otp);
      const { user: fbUser } = result;
      
      // Get token BEFORE calling your API so the request is authorized
      const token = await fbUser.getIdToken();
      localStorage.setItem('token', token);

      const { data } = await api.post('/users', {
        firebaseUid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName,
        phone: fbUser.phoneNumber,
        role: role
      });
      
      setUser(data);
      setLocation('/dashboard'); // Direct user to the app
    } catch (error: any) {
      console.error("OTP Error:", error);
      alert('Invalid OTP. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { user: fbUser } = result;
      
      const token = await fbUser.getIdToken();
      localStorage.setItem('token', token);

      const { data } = await api.post('/users', {
        firebaseUid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName,
        imageUrl: fbUser.photoURL,
        role: role
      });
      
      setUser(data);
      setLocation('/dashboard');
    } catch (error: any) {
      console.error("Google Login Error:", error);
      alert(`Google Login failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      <div className="w-full max-w-[440px] relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mb-10">
          <div className="flex flex-col items-center">
            {/* Added / for absolute path to public folder */}
            <div className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center shadow-xl border border-slate-100 overflow-hidden mb-6 p-2">
               <img src="/logo.png" alt="Kiraya Pro" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-black text-3xl font-black tracking-tight leading-none uppercase">Kiraya Pro</h1>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3 opacity-60">Professional Management</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="u-card !p-8 !rounded-[42px] bg-white">
          <div className="flex bg-slate-50 p-1 rounded-[22px] mb-8 overflow-hidden">
            {(['LANDLORD', 'CARETAKER', 'TENANT'] as const).map(r => {
              const Icon = r === 'LANDLORD' ? Building2 : r === 'CARETAKER' ? Shield : Users;
              const label = r === 'LANDLORD' ? 'Owner' : r === 'CARETAKER' ? 'Staff' : 'Tenant';
              
              return (
                <button 
                  key={r} 
                  onClick={() => setRole(r)} 
                  className={`flex-1 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-tight transition-all duration-300 ${role === r ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-black/60'}`}
                >
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Icon size={14}/>
                    <span>{label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {step === 'LOGIN' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Mobile</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center text-slate-300 transition-colors duration-300"><Smartphone size={18}/></div>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} 
                    placeholder="98765 43210" 
                    className="u-input !pl-14" 
                  />
                </div>
              </div>

              <button 
                onClick={handlePhoneLogin} 
                disabled={loading || phone.length < 10} 
                className="u-btn-primary w-full !py-5 text-lg group disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Enter Portal</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                  </div>
                )}
              </button>

              <div id="recaptcha-container" />

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-50" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Secure Single Sign On</span></div>
              </div>

              <button onClick={handleGoogleLogin} disabled={loading} className="u-btn-secondary w-full !py-4.5 !border-slate-100 hover:!border-slate-200">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-3" alt="Google" />
                <span className="text-sm font-bold">Sign in with Google</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-black"><Shield size={28}/></div>
                <h2 className="text-black text-2xl font-black tracking-tight">Verify Identity</h2>
                <p className="text-slate-400 text-sm font-bold mt-2 uppercase tracking-tight">Enter 6-digit OTP</p>
              </motion.div>
              
              <div className="space-y-2">
                <input 
                  type="text" 
                  maxLength={6} 
                  value={otp} 
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} 
                  placeholder="000 000" 
                  className="u-input text-center text-3xl font-black tracking-[0.5em] placeholder:text-slate-100 !py-7" 
                />
              </div>

              <button 
                onClick={verifyOtp} 
                disabled={loading || otp.length < 6} 
                className="u-btn-primary w-full !py-5 text-lg disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Verify OTP</span>}
              </button>
              
              <button 
                onClick={() => setStep('LOGIN')} 
                className="w-full text-slate-300 text-[10px] font-black uppercase tracking-widest hover:text-black transition-colors"
              >
                Change Number
              </button>
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.6 }}
          className="mt-12 flex flex-col items-center space-y-10"
        >
          <div className="flex items-center space-x-12 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {[
              { icon: Shield, label: 'Secure' },
              { icon: Sparkles, label: 'Premium' },
              { icon: CheckCircle, label: 'Pro' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <item.icon size={18} className="text-black" />
                <span className="text-[9px] font-black text-black uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.1em] leading-relaxed max-w-[280px] mx-auto">
              By continuing, you agree to our <br/>
              <Link href="/terms" className="text-slate-400 hover:text-black transition-colors underline decoration-slate-200 underline-offset-4">Terms of service</Link>
              <span className="mx-2">&</span>
              <Link href="/privacy" className="text-slate-400 hover:text-black transition-colors underline decoration-slate-200 underline-offset-4">Privacy Policy</Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}