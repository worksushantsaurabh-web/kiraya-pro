import { motion } from 'framer-motion';
import { ChevronLeft, Scale, ShieldCheck, FileText } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';

export function Terms() {
  const [, setLocation] = useLocation();
  const { user } = useAuthStore();

  const sections = [
    {
      title: '1. Acceptance of Terms',
      icon: <ShieldCheck size={20} className="text-emerald-600" />,
      content: 'By accessing or using Kiraya Pro, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.'
    },
    {
      title: '2. Use License',
      icon: <Scale size={20} className="text-indigo-600" />,
      content: 'Permission is granted to use Kiraya Pro for personal or business property management. This is the grant of a license, not a transfer of title.'
    },
    {
      title: '3. Subscription & Payments',
      icon: <FileText size={20} className="text-amber-600" />,
      content: 'Subscriptions are billed monthly or annually based on your choice. Fees are non-refundable except as required by law. We use Razorpay for secure payment processing.'
    },
    {
      title: '4. Data Accuracy',
      icon: <FileText size={20} className="text-blue-600" />,
      content: 'Users are responsible for the accuracy of property and tenant data entered into the system. Kiraya Pro is not liable for errors in rent calculations based on user input.'
    }
  ];

  return (
    <div className="bg-white min-h-screen pb-12">
      <div className="px-6 pt-12 pb-8 flex items-center space-x-4 sticky top-0 bg-white/90 backdrop-blur-md z-30 border-b border-slate-50">
        <button 
          onClick={() => setLocation(user ? '/settings' : '/login')}
          className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-black active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-black">Terms of Service</h2>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-0.5">Last updated March 2026</p>
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

        <div className="pt-8 border-t border-slate-50">
          <p className="text-xs text-slate-400 font-bold leading-relaxed text-center italic">
            "Managing rentals should be professional, secure, and transparent."
          </p>
        </div>
      </div>
    </div>
  );
}
