import { motion } from 'framer-motion';
import { Check, ChevronRight, X, Sparkles, Zap, Shield, Crown } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocation } from 'wouter';
import { api } from '@/api/client';

export function Pricing() {
  const { user, setUser } = useAuthStore();
  const [, setLocation] = useLocation();

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
    if (plan.price === 0) {
      await api.post('/payments/verify', { plan: plan.id, status: 'free' });
      setUser({ ...user, subscriptionPlan: plan.id });
      alert("Plan activated successfully!");
      return setLocation('/');
    }

    if (plan.price === 'Contact') {
      return alert("Please contact us at support@kirayapro.com for custom pricing.");
    }

    const res = await loadRazorpay();
    if (!res) return alert("Failed to load Razorpay SDK");

    try {
      const order = await api.post('/payments/create-order', {
        amount: plan.price,
        plan: plan.id
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.data.amount,
        currency: order.data.currency,
        name: "Kiraya Pro",
        description: `Subscription for ${plan.name}`,
        order_id: order.data.id,
        handler: async (response: any) => {
          const verify = await api.post('/payments/verify', {
            ...response,
            plan: plan.id
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
      tag: 'Free',
      icon: <Zap size={24} className="text-emerald-500" />,
      color: 'bg-emerald-50 border-emerald-100 text-emerald-900',
      btn: 'bg-emerald-600 text-white',
      limits: '1 Prop / 5 Tenants',
      features: ['WhatsApp Reminders', '1 Caretaker', 'Document Storage']
    },
    {
      id: 'VISTAR',
      name: 'Vistar',
      price: 199,
      tag: 'Starter',
      icon: <Sparkles size={24} className="text-indigo-500" />,
      color: 'bg-indigo-50 border-indigo-100 text-indigo-900',
      btn: 'bg-indigo-600 text-white',
      limits: '2 Prop / 10 Tenants',
      features: ['Everything in Free', 'Custom WhatsApp Templates', 'SMS Notifications']
    },
    {
      id: 'PRAGATI',
      name: 'Pragati',
      price: 1499,
      tag: 'Pro',
      isPopular: true,
      icon: <Shield size={24} className="text-black" />,
      color: 'bg-slate-50 border-slate-200 text-slate-900',
      btn: 'bg-black text-white',
      limits: '5 Prop / 30 Tenants',
      features: ['Everything in Starter', 'Unlimited Caretakers', 'Priority Support']
    },
    {
      id: 'ANANT',
      name: 'Anant',
      price: 'Contact',
      tag: 'Custom',
      icon: <Crown size={24} className="text-amber-500" />,
      color: 'bg-amber-50 border-amber-100 text-amber-900',
      btn: 'bg-amber-600 text-white',
      limits: 'Unlimited Everything',
      features: ['API Access', 'Custom Branding', 'Dedicated Manager']
    }
  ];

  return (
    <div className="bg-white min-h-screen pb-24">
      <div className="px-6 pt-12 pb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-black">Subscription</h2>
          <p className="text-slate-400 font-bold text-[13px] mt-1.5 uppercase tracking-wider">Scale your rental business</p>
        </div>
        <button onClick={() => setLocation('/')} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-black active:scale-90 transition-transform">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-8">
        {plans.map((plan, i) => (
          <motion.div 
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-[40px] p-8 border-2 ${plan.color} relative overflow-hidden shadow-sm`}
          >
             {plan.isPopular && (
               <div className="absolute top-6 right-[-35px] bg-black text-white px-10 py-1 rotate-45 text-[10px] font-black uppercase tracking-widest">Best Value</div>
             )}
             
             <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50">
                   {plan.icon}
                </div>
                <div className="text-right">
                   <p className="text-[11px] font-black opacity-40 uppercase tracking-[0.2em] mb-1">{plan.tag}</p>
                   <h3 className="text-2xl font-black tracking-tight">{plan.name}</h3>
                </div>
             </div>

             <div className="mb-8">
                <div className="flex items-baseline space-x-1">
                   {typeof plan.price === 'number' ? (
                     <>
                        <span className="text-4xl font-black tracking-tighter">₹{plan.price}</span>
                        <span className="text-slate-400 font-bold text-sm">/year</span>
                     </>
                   ) : (
                     <span className="text-3xl font-black tracking-tighter">{plan.price}</span>
                   )}
                </div>
                <p className="text-[13px] font-extrabold mt-2 opacity-60 uppercase tracking-tighter italic">{plan.limits}</p>
             </div>

             <div className="space-y-4 mb-10">
                {plan.features.map(f => (
                   <div key={f} className="flex items-center space-x-3">
                      <div className="shrink-0 w-5 h-5 bg-white/40 rounded-full flex items-center justify-center border border-black/5">
                         <Check size={12} strokeWidth={4} />
                      </div>
                      <span className="text-[14px] font-bold tracking-tight">{f}</span>
                   </div>
                ))}
             </div>

             <button 
                onClick={() => handlePayment(plan)}
                disabled={user?.subscriptionPlan === plan.id}
                className={`w-full py-5 rounded-2xl font-black text-[15px] transition-all active:scale-[0.98] flex items-center justify-center space-x-3 shadow-xl ${plan.btn} ${user?.subscriptionPlan === plan.id ? 'opacity-40 grayscale cursor-not-allowed shadow-none' : 'shadow-black/10'}`}
             >
                <span>{user?.subscriptionPlan === plan.id ? 'Current Plan' : plan.price === 0 ? 'Start Free' : plan.price === 'Contact' ? 'Contact Sales' : 'Upgrade Now'}</span>
                {user?.subscriptionPlan !== plan.id && <ChevronRight size={18} />}
             </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
