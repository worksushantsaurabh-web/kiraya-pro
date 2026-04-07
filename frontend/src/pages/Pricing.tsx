import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, X, Sparkles, Zap, Shield, Crown, Star } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocation } from 'wouter';
import { api } from '@/api/client';

export function Pricing() {
  const { user, setUser } = useAuthStore();
  const [, setLocation] = useLocation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (plan: any) => {
    if (!user) return alert("Please login first");
    
    // Calculate price based on billing cycle
    const price = billingCycle === 'yearly' ? (plan.yearlyPrice || plan.price) : plan.price;

    if (price === 0) {
      await api.post('/payments/verify', { 
        plan: plan.id, 
        status: 'free',
        duration: 'forever'
      });
      setUser({ ...user, subscriptionPlan: plan.id });
      alert("Plan activated successfully!");
      return setLocation('/');
    }

    if (price === 'Contact') {
      return alert("Please contact us at support@kirayapro.com for custom pricing.");
    }

    const res = await loadRazorpay();
    if (!res) return alert("Failed to load Razorpay SDK");

    try {
      const order = await api.post('/payments/create-order', {
        amount: price,
        plan: plan.id
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.data.amount,
        currency: order.data.currency,
        name: "Kiraya Pro",
        description: `${plan.name} - ${billingCycle} subscription`,
        order_id: order.data.id,
        handler: async (response: any) => {
          const verify = await api.post('/payments/verify', {
            ...response,
            plan: plan.id,
            duration: billingCycle
          });
          if (verify.data.status === 'ok') {
            setUser({ ...user, subscriptionPlan: plan.id });
            alert("Payment successful! Your plan is now active.");
            setLocation('/');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone
        },
        theme: { color: "#000000" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Failed to initiate payment");
    }
  };

  const plans = [
    {
      id: 'AARAMBH',
      name: 'Aarambh',
      price: 0,
      yearlyPrice: 0,
      tag: 'Free forever',
      description: 'Perfect for small landlords starting out.',
      icon: <Zap size={24} className="text-emerald-500" />,
      color: 'bg-emerald-50/50 border-emerald-100',
      accent: 'emerald',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
      limits: '1 Property / 5 Tenants',
      features: ['WhatsApp Reminders', '1 Caretaker Account', 'Basic Document Storage', 'Email Support']
    },
    {
      id: 'VISTAR',
      name: 'Vistar',
      price: 199,
      yearlyPrice: 1990,
      tag: 'Most Flexible',
      description: 'Ideal for those looking to expand their portfolio.',
      icon: <Sparkles size={24} className="text-indigo-500" />,
      color: 'bg-indigo-50/50 border-indigo-100',
      accent: 'indigo',
      btn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200',
      limits: '2 Properties / 10 Tenants',
      features: ['Everything in Aarambh', 'Custom WhatsApp Templates', 'SMS Notifications', 'Priority Support']
    },
    {
      id: 'PRAGATI',
      name: 'Pragati',
      price: 1499,
      yearlyPrice: 14990,
      tag: 'Best Value',
      description: 'Our most popular plan for professional landlords.',
      isPopular: true,
      icon: <Shield size={24} className="text-black" />,
      color: 'bg-slate-50 border-slate-200',
      accent: 'slate',
      btn: 'bg-black hover:bg-slate-800 text-white shadow-slate-300',
      limits: '5 Properties / 30 Tenants',
      features: ['Everything in Vistar', 'Unlimited Caretakers', 'Smart Rent Collection', 'Professional Invoicing']
    },
    {
      id: 'ANANT',
      name: 'Anant',
      price: 'Contact',
      yearlyPrice: 'Contact',
      tag: 'For Enterprise',
      description: 'Scalable solutions for property management firms.',
      icon: <Crown size={24} className="text-amber-500" />,
      color: 'bg-amber-50/50 border-amber-100',
      accent: 'amber',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
      limits: 'Unlimited Everything',
      features: ['Everything in Pragati', 'API Access', 'Custom White-labeling', 'Dedicated Account Manager']
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Background patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-black rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        <div className="px-6 pt-12 pb-8 flex justify-between items-center max-w-5xl mx-auto w-full">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900">Choose Your Plan</h2>
            <p className="text-slate-500 font-bold text-sm mt-1.5 uppercase tracking-wider">Simple pricing for property management</p>
          </div>
          <button 
            onClick={() => setLocation('/')} 
            className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-900 border border-slate-200 active:scale-90 transition-all shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* Improved Toggle */}
        <div className="flex flex-col items-center mt-4 mb-12">
          <div className="bg-slate-200/50 p-1 rounded-2xl flex items-center space-x-1 backdrop-blur-sm border border-slate-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-8 py-2.5 rounded-xl font-black text-sm transition-all ${billingCycle === 'monthly' ? 'bg-white text-black shadow-lg shadow-black/5' : 'text-slate-500 hover:bg-white/40'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-8 py-2.5 rounded-xl font-black text-sm transition-all flex items-center space-x-2 ${billingCycle === 'yearly' ? 'bg-white text-black shadow-lg shadow-black/5' : 'text-slate-500 hover:bg-white/40'}`}
            >
              <span>Yearly</span>
              <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-black animate-pulse">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="px-6 pb-24 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {plans.map((plan, i) => (
            <motion.div 
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className={`rounded-[40px] p-7 md:p-8 border ${plan.color} relative overflow-hidden flex flex-col shadow-xl shadow-slate-200/50 bg-white group hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-500`}
            >
               {plan.isPopular && (
                 <div className="absolute top-6 right-[-35px] bg-black text-white px-10 py-1.5 rotate-45 text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-1.5 min-w-[140px]">
                   <Star size={10} fill="currentColor" /> Popular
                 </div>
               )}
               
               <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 group-hover:scale-110 transition-transform duration-500 shrink-0`}>
                     {plan.icon}
                  </div>
                  <div className="text-right ml-4">
                     <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-50 whitespace-nowrap`}>{plan.tag}</p>
                     <h3 className="text-2xl font-black tracking-tight text-slate-900 leading-none">{plan.name}</h3>
                  </div>
               </div>

               <p className="text-slate-500 text-[13px] font-medium mb-6 leading-relaxed">
                 {plan.description}
               </p>

               <div className="mb-8">
                  <div className="flex items-baseline space-x-1.5">
                     <AnimatePresence mode="wait">
                       <motion.div
                         key={billingCycle}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         className="flex items-baseline"
                       >
                         {typeof plan.price === 'number' ? (
                           <div className="flex items-baseline min-w-0">
                              <span className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 truncate">
                                ₹{billingCycle === 'yearly' ? plan.yearlyPrice : plan.price}
                              </span>
                              <span className="text-slate-400 font-bold text-sm ml-1 shrink-0">
                                {billingCycle === 'yearly' ? '/year' : '/month'}
                              </span>
                           </div>
                         ) : (
                           <span className="text-3xl font-black tracking-tighter text-slate-900">{plan.price}</span>
                         )}
                       </motion.div>
                     </AnimatePresence>
                  </div>
                  <div className="mt-3 flex items-center gap-2 overflow-hidden">
                    <div className="h-1 w-1 rounded-full bg-slate-300 shrink-0" />
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight italic opacity-70 whitespace-nowrap truncate">{plan.limits}</p>
                  </div>
               </div>

               <div className="space-y-4 mb-20 flex-grow">
                  {plan.features.map(f => (
                     <div key={f} className="flex items-start space-x-3">
                        <div className={`shrink-0 mt-1 w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 text-slate-900`}>
                           <Check size={10} strokeWidth={4} />
                        </div>
                        <span className="text-[14px] font-bold text-slate-700 tracking-tight leading-tight">{f}</span>
                     </div>
                  ))}
               </div>

               <button 
                  onClick={() => handlePayment(plan)}
                  disabled={user?.subscriptionPlan === plan.id}
                  className={`w-full py-5 rounded-2xl font-black text-[15px] transition-all active:scale-[0.98] flex items-center justify-center space-x-3 shadow-2xl relative z-10 ${plan.btn} ${user?.subscriptionPlan === plan.id ? 'opacity-40 grayscale cursor-not-allowed shadow-none' : ''}`}
               >
                  <span>{user?.subscriptionPlan === plan.id ? 'Current Plan' : plan.price === 0 ? 'Start Free' : plan.price === 'Contact' ? 'Contact Sales' : 'Upgrade Now'}</span>
                  {user?.subscriptionPlan !== plan.id && <ChevronRight size={18} />}
               </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
