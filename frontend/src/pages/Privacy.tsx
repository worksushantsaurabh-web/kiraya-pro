import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Lock, Eye, Mail } from 'lucide-react';
import { useLocation } from 'wouter';

export function Privacy() {
  const [, setLocation] = useLocation();

  const sections = [
    {
      title: '1. Information Collection',
      icon: <Eye size={20} className="text-emerald-600" />,
      content: 'We collect name, email, phone number, and property details necessary for property management services.'
    },
    {
      title: '2. Data Security',
      icon: <Lock size={20} className="text-indigo-600" />,
      content: 'Your data is encrypted and stored in secure Firebase environments. We do not store full credit card details on our servers.'
    },
    {
      title: '3. Data Usage',
      icon: <Shield size={20} className="text-amber-600" />,
      content: 'We use your data strictly to facilitate rental management, rent reminders, and activity reporting between landlords and tenants.'
    },
    {
      title: '4. Contact Us',
      icon: <Mail size={20} className="text-blue-600" />,
      content: 'If you have any questions about this Privacy Policy, please contact us at privacy@kirayapro.com.'
    }
  ];

  return (
    <div className="bg-white min-h-screen pb-12">
      <div className="px-6 pt-12 pb-8 flex items-center space-x-4 sticky top-0 bg-white/90 backdrop-blur-md z-30 border-b border-slate-50">
        <button 
          onClick={() => setLocation('/settings')}
          className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-black active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-black">Privacy Policy</h2>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-0.5">Your data is safe with us</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {sections.map((section, i) => (
          <motion.div 
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                {section.icon}
              </div>
              <h3 className="font-black text-lg text-black tracking-tight">{section.title}</h3>
            </div>
            <p className="text-slate-500 font-medium text-[15px] leading-relaxed pl-1">
              {section.content}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
