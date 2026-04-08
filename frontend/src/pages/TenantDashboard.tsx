import { useEffect, useState } from 'react';
import { Home, AlertCircle, MessageSquare, ChevronRight, Bell, ShieldCheck, Loader2, Phone, User as UserIcon, Copy, Check } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/client';
import { useLocation } from 'wouter';

export function TenantDashboard() {
  const { user, refreshUser } = useAuthStore();
  const [, setLocation] = useLocation();
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refreshUser(); // Sync name/profile
        const [tenantsRes, compRes] = await Promise.all([
          api.get('/tenants'),
          api.get('/complaints'),
        ]);
        
        if (tenantsRes.data.length > 0) {
          setTenantInfo(tenantsRes.data[0]);
        }
        setComplaints(compRes.data);
      } catch (_err) {
        console.error("Dashboard fetch error", _err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshUser]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-black" /></div>;

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex justify-between items-center bg-white sticky top-0 z-30 decoration-slate-50 decoration-b">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] opacity-80">Tenant Member</span>
          <h2 className="text-3xl font-extrabold mt-0.5 tracking-tight text-black">
            Hi, {(tenantInfo?.name || user?.name || 'Member').split(' ')[0]}!
          </h2>
        </motion.div>
        <div className="flex space-x-3">
          <button className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-black active:scale-90 transition-transform"><Bell size={20} /></button>
          <div onClick={() => setLocation('/settings')} className="w-11 h-11 bg-black rounded-full flex items-center justify-center text-white font-extrabold text-sm border-2 border-slate-50 cursor-pointer overflow-hidden">
             {user?.imageUrl ? (
               <img src={user.imageUrl} className="w-full h-full object-cover" />
             ) : (
               (tenantInfo?.name || user?.name || '?').charAt(0)
             )}
          </div>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="px-6 py-4">
        <div className="u-card bg-black p-8 text-white relative overflow-hidden h-[240px] flex flex-col justify-center shadow-2xl shadow-black/20">
           <div className="relative z-10 scale-105 transform origin-left">
              <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Living at</p>
              <h3 className="text-[32px] font-black tracking-tighter leading-none mb-3 underline decoration-white/20 underline-offset-8">
                {tenantInfo?.property?.name || 'Your Property'}
              </h3>
              <p className="text-white/50 text-[13px] font-bold mb-4 flex items-center space-x-2">
                 <span className="text-white/80">Room {tenantInfo?.roomNumber || 'N/A'}</span>
                 <span className="opacity-30">•</span>
                 <span className="line-clamp-1 truncate italic opacity-60 max-w-[180px]">{tenantInfo?.property?.address}</span>
              </p>
              
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  const text = `${tenantInfo?.property?.name || ''}, Room ${tenantInfo?.roomNumber || ''}, ${tenantInfo?.property?.address || ''}`;
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`mb-6 flex items-center space-x-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${copied ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-white/5 text-white/40 border-white/5'}`}
              >
                {copied ? <Check size={10} /> : <Copy size={10} />}
                <span>{copied ? 'Address Copied!' : 'Copy Full Address'}</span>
              </motion.button>

              <div className="flex space-x-4">
                 <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/5 backdrop-blur-md">
                    <p className="text-[10px] font-extrabold opacity-40 uppercase tracking-widest mb-1">Monthly Rent</p>
                    <p className="text-xl font-extrabold">₹{tenantInfo?.rentAmount || 0}</p>
                 </div>
                 <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/5 backdrop-blur-md">
                    <p className="text-[10px] font-extrabold opacity-40 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-xl font-extrabold uppercase">{tenantInfo?.rentStatus || 'PAID'}</p>
                 </div>
              </div>
           </div>
           <div className="absolute right-[-40px] bottom-[-40px] opacity-[0.08] rotate-12">
              <Home size={220} strokeWidth={1} />
           </div>
        </div>
      </div>

      {/* Issues Section */}
      <div className="px-6 py-6">
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className="text-[22px] font-extrabold text-black tracking-tight leading-none">Your Requests</h3>
          <button className="text-black font-extrabold text-[12px] uppercase tracking-widest opacity-60" onClick={() => setLocation('/complaints')}>View All</button>
        </div>

        <div className="space-y-4">
           {complaints.length === 0 ? (
             <div className="u-card !bg-emerald-50 !border-emerald-100 !p-8 flex flex-col items-center text-center">
                <ShieldCheck size={48} className="text-emerald-500 mb-4" />
                <h4 className="font-extrabold text-emerald-900 text-lg">No Active Issues</h4>
                <p className="text-emerald-800/60 font-bold text-sm mt-1">Your home is in perfect condition.</p>
             </div>
           ) : (
             complaints.slice(0, 3).map((comp: any) => (
               <div key={comp.id} onClick={() => setLocation('/complaints')} className="u-card flex items-center !p-5 cursor-pointer active:scale-[0.98] transition-all">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 ${comp.status === 'OPEN' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                    <AlertCircle size={24} />
                  </div>
                  <div className="ml-5 flex-1">
                    <p className="font-extrabold text-black text-[16px] leading-tight">{comp.title}</p>
                    <p className="text-[13px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{comp.status} • {new Date(comp.createdAt).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-200" />
               </div>
             ))
           )}
        </div>
      </div>

      {/* Caretaker Support Section */}
      {tenantInfo?.property?.assignments?.length > 0 && (
        <div className="px-6 py-4">
          <div className="bg-slate-50 rounded-[36px] p-8 border border-slate-100 relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-6">
                   <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center text-indigo-500 shadow-sm overflow-hidden text-sm uppercase font-black">
                      {tenantInfo.property.assignments[0].caretaker?.imageUrl ? (
                        <img src={tenantInfo.property.assignments[0].caretaker.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={32} />
                      )}
                   </div>
                   <div>
                      <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1.5">Property Caretaker</p>
                      <p className="text-xl font-extrabold text-black">{tenantInfo.property.assignments[0].caretaker?.name}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <a 
                     href={`tel:${tenantInfo.property.assignments[0].caretaker?.phone}`}
                     className="flex items-center justify-center space-x-3 py-4 bg-black text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-95 shadow-lg shadow-black/10"
                   >
                     <Phone size={16} />
                     <span>Call</span>
                   </a>
                   <a 
                     href={`https://wa.me/${tenantInfo.property.assignments[0].caretaker?.phone?.replace(/\+/g, '')}`}
                     target="_blank"
                     className="flex items-center justify-center space-x-3 py-4 bg-emerald-100 text-emerald-700 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-emerald-200 transition-all active:scale-95 border border-emerald-200"
                   >
                     <MessageSquare size={16} />
                     <span>WhatsApp</span>
                   </a>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Need Assistance Section */}
      <div className="px-6 py-2">
         <button onClick={() => setLocation('/complaints')} className="w-full bg-white border-2 border-slate-100 p-6 rounded-[32px] flex items-center justify-between group active:bg-slate-50 transition-all">
            <div className="flex items-center space-x-4">
               <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-rose-500 transition-colors">
                  <MessageSquare size={24} />
               </div>
               <div className="text-left">
                  <p className="font-extrabold text-[16px]">Need assistance?</p>
                  <p className="text-[13px] font-bold opacity-60">Raise a maintenance request</p>
               </div>
            </div>
            <ChevronRight size={20} className="text-slate-300 group-hover:text-black transition-colors" />
         </button>
      </div>
    </div>
  );
}
