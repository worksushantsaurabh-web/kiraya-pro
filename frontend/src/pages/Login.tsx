import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowRight, CheckCircle, Smartphone, Building2, Shield, Users, Sparkles } from 'lucide-react';
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

  const setupRecaptcha = () => {
    // Clear any existing verifier to avoid "element removed" or "already rendered" errors
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (_e) {}
    }
    
    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.innerHTML = '';
    }
    
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible'
    });
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    try {
      setupRecaptcha();
      const confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setStep('OTP');
    } catch (error: any) {
      console.error("Firebase Auth Error:", error);
      alert(`Failed to send OTP: ${error.message || 'Unknown error'}. 
      
Hint: If you just migrated, make sure to:
1. Enable "Phone" in Firebase Console > Authentication.
2. Add "localhost" to "Authorized domains" in Firebase Settings.`);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await (window as any).confirmationResult.confirm(otp);
      const { user: fbUser } = result;
      
      const { data } = await api.post('/users', {
        firebaseUid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName || 'User',
        phone: fbUser.phoneNumber,
        role: role
      });
      
      setUser(data);
      setLocation('/');
    } catch (error: any) {
      console.error("OTP Verification Logic Error", error);
      alert(`Login failed: ${error.response?.data?.error || error.message || 'Verification error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const { user: fbUser } = result;
      
      const { data } = await api.post('/users', {
        firebaseUid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName,
        role: role
      });
      
      setUser(data);
      setLocation('/');
    } catch (error: any) {
      console.error("Error logging in with Google:", error);
      alert(`Google Login failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { key: 'LANDLORD' as const, label: 'Owner', icon: Building2 },
    { key: 'CARETAKER' as const, label: 'Caretaker', icon: Shield },
    { key: 'TENANT' as const, label: 'Tenant', icon: Users },
  ];

  const features = [
    'Track rent payments automatically',
    'Manage unlimited properties',
    'Send WhatsApp reminders',
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col justify-end relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000" 
          alt="Premium Architecture"
          className="w-full h-full object-cover opacity-50 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
      </div>

      {/* Brand Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-8 pt-16 pb-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-white rounded-[20px] flex items-center justify-center shadow-2xl shadow-white/10 overflow-hidden">
               <img src="/logo.png" alt="Kiraya Pro" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <h1 className="text-white text-3xl font-extrabold tracking-tighter leading-none">Kiraya Pro</h1>
              <p className="text-white/40 text-[11px] font-extrabold uppercase tracking-[0.3em] mt-0.5">Property Management</p>
            </div>
          </div>
        </motion.div>

        {/* Feature Pills */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.6 }}
          className="space-y-3 mt-6"
        >
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.15 }}
              className="flex items-center space-x-3"
            >
              <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Sparkles size={12} className="text-white/80" />
              </div>
              <span className="text-white/70 font-bold text-[14px]">{f}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Login Bottom Sheet */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 120, delay: 0.3 }}
        className="bg-white rounded-t-[44px] px-8 pt-6 pb-12 z-20 relative shadow-[0_-30px_80px_rgba(0,0,0,0.5)]"
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />

        {/* Role Selector: Card Style */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {roles.map(r => (
            <motion.button 
              key={r.key}
              onClick={() => setRole(r.key)}
              whileTap={{ scale: 0.95 }}
              className={`relative flex flex-col items-center py-5 rounded-[24px] border-2 transition-all duration-300 ${
                role === r.key 
                  ? 'bg-black text-white border-black shadow-xl shadow-black/20' 
                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
              }`}
            >
              <r.icon size={22} strokeWidth={2.5} className="mb-2" />
              <span className="text-[12px] font-extrabold uppercase tracking-widest">{r.label}</span>
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'LOGIN' ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h2 className="text-[26px] font-extrabold text-black tracking-tight mb-1 leading-tight">Get Started</h2>
              <p className="text-slate-400 font-bold mb-8 text-[14px]">Choose your role and sign in securely</p>
              
              {/* Google Login: Primary CTA */}
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 bg-white py-5 rounded-[20px] border-2 border-slate-100 font-extrabold text-black text-[16px] mb-4 active:scale-[0.98] transition-all hover:border-black hover:shadow-lg group"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
              </button>

              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                <span className="relative px-4 bg-white text-slate-300 text-[10px] font-extrabold uppercase tracking-[0.3em]">or use phone</span>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-colors">
                    <Smartphone size={20} />
                  </div>
                  <input 
                    type="tel" 
                    placeholder="+91 98765 43210" 
                    className="u-input !pl-14 !py-5 !text-[16px] !border-slate-100 focus:!border-black"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="u-btn-primary w-full !py-5 group"
                >
                  <span className="text-[15px]">{loading ? 'Sending OTP...' : 'Send Verification Code'}</span>
                  {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>

              <p className="mt-8 text-center text-slate-300 text-[11px] font-bold leading-relaxed px-4">
                By continuing, you agree to our <span className="text-black underline underline-offset-2">Terms</span> and <span className="text-black underline underline-offset-2">Privacy Policy</span>.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button 
                onClick={() => setStep('LOGIN')}
                className="text-black font-extrabold text-[13px] mb-6 flex items-center space-x-2 active:opacity-60 transition-opacity"
              >
                <ArrowRight size={16} className="rotate-180" />
                <span>Change number</span>
              </button>

              <h2 className="text-[26px] font-extrabold text-black tracking-tight mb-1 leading-tight">Verify Phone</h2>
              <p className="text-slate-400 font-bold mb-8 text-[14px]">Enter the 6-digit code sent to <span className="text-black">{phone}</span></p>
              
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <input 
                  type="text" 
                  placeholder="• • • • • •" 
                  maxLength={6}
                  className="u-input text-center text-3xl tracking-[16px] font-extrabold !py-6 !border-slate-100 focus:!border-black"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="u-btn-primary w-full !py-5"
                >
                  <span className="text-[15px]">{loading ? 'Verifying...' : 'Verify & Login'}</span>
                  {!loading && <CheckCircle size={20} />}
                </button>

                <p className="text-center text-slate-400 text-[13px] font-bold">
                  Didn't get it? <button type="button" onClick={() => setStep('LOGIN')} className="text-black font-extrabold underline underline-offset-2">Resend</button>
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div id="recaptcha-container"></div>
    </div>
  );
}
