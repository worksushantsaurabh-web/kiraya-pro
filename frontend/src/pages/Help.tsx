import { motion } from 'framer-motion';
import { ChevronLeft, MessageCircle, Mail, HelpCircle, MessageSquare } from 'lucide-react';
import { useLocation } from 'wouter';

export function Help() {
  const [, setLocation] = useLocation();

  const handleWhatsApp = () => {
    window.open('https://wa.me/916388908970?text=Hello%20Kiraya%20Pro%20Support!', '_blank');
  };

  const handleEmail = () => {
    window.location.href = 'mailto:support@kirayapro.com?subject=Support%20Request%20-%20Kiraya%20Pro';
  };

  const FAQS = [
    { q: 'How do I add a property?', a: 'Go to the Properties page and click "Add New". Enter your property name, address, and total units to get started.' },
    { q: 'Can I add multiple caretakers?', a: 'Yes! The Pragati (Pro) and Anant (Custom) plans allow you to add and manage multiple caretakers for your properties.' },
    { q: 'How are rent reminders sent?', a: 'Rent reminders are automatically triggered based on the rent date. They are sent via WhatsApp and SMS directly to the tenant.' },
    { q: 'Is my data secure?', a: 'We take security seriously. All your property and tenant data is encrypted and stored securely using Firebase industry standards.' },
    { q: 'How do I upgrade my plan?', a: 'You can upgrade anytime by visiting the Pricing section in your account settings and choosing a plan that fits your needs.' },
    { q: 'Can I delete a property?', a: 'Yes, landlords can delete a property. Note that this will also remove all associated tenant records and rent history for that property.' },
    { q: 'What is the tenant limit for the Free plan?', a: 'The Aarambh (Free) plan allows up to 1 property and 5 tenants. For more, consider our Starter or Pro plans.' }
  ];

  return (
    <div className="bg-white min-h-screen pb-24">
      <div className="px-6 pt-12 pb-8 flex items-center space-x-4 sticky top-0 bg-white/90 backdrop-blur-md z-30 border-b border-slate-50">
        <button 
          onClick={() => setLocation('/settings')}
          className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-black active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-black">Help Centre</h2>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-0.5">We are here to help</p>
        </div>
      </div>

      <div className="p-6">
        <div className="u-card bg-black p-8 text-white mb-10 overflow-hidden relative shadow-2xl shadow-black/20 rounded-[40px]">
           <div className="relative z-10">
              <h3 className="text-2xl font-black tracking-tight mb-2 uppercase italic leading-none">Direct Support</h3>
              <p className="text-white/60 font-bold text-sm mb-8 leading-relaxed">Chat with our dedicated support team on WhatsApp for instant assistance.</p>
              <button 
                onClick={handleWhatsApp}
                className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-[15px] flex items-center justify-center space-x-3 active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/30"
              >
                <MessageCircle size={20} />
                <span>Chat on WhatsApp</span>
              </button>
           </div>
           <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12">
              <HelpCircle size={180} />
           </div>
        </div>

        <h3 className="text-[22px] font-extrabold text-black tracking-tight px-1 mb-6">Frequently Asked Questions</h3>
        <div className="space-y-4 mb-12">
          {FAQS.map((faq, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="u-card !p-6"
            >
               <h4 className="font-black text-black text-[16px] mb-2">{faq.q}</h4>
               <p className="text-slate-500 font-bold text-[14px] leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 pb-12">
           <button onClick={handleEmail} className="u-card flex flex-col items-center py-6 text-center group active:scale-95 transition-all outline-none">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                 <Mail size={22} />
              </div>
              <span className="text-[13px] font-black text-black uppercase tracking-widest leading-none">Email</span>
           </button>
           <button onClick={handleWhatsApp} className="u-card flex flex-col items-center py-6 text-center group active:scale-95 transition-all outline-none">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                 <MessageSquare size={22} />
              </div>
              <span className="text-[13px] font-black text-black uppercase tracking-widest leading-none">Chat</span>
           </button>
        </div>
      </div>
    </div>
  );
}
