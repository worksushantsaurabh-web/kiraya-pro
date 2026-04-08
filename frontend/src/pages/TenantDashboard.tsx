import { useEffect, useState } from 'react';
import { AlertCircle, MessageSquare, ChevronRight, Bell, ShieldCheck, Loader2, Phone, User as UserIcon, Copy, Check, MapPin, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';
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

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-black opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Profile</p>
      </div>
    </div>
  );

  return (
    <div className="bg-[#fcfcfd] min-h-screen pb-32">
      {/* Premium Header */}
      <div className="px-6 pt-14 pb-6 flex justify-between items-center bg-white/70 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100/50">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center space-x-2 mb-1">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] opacity-80">Active Residency</span>
          </div>
          <h2 className="text-[28px] font-black tracking-tighter text-black leading-none uppercase">
            Hi, {(tenantInfo?.name || user?.name || 'Member').split(' ')[0]}
          </h2>
        </motion.div>
        <div className="flex items-center space-x-4">
          <button className="w-12 h-12 bg-slate-100/50 border border-slate-200/50 rounded-2xl flex items-center justify-center text-black active:scale-90 transition-transform relative group">
            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>
          <motion.div 
            whileTap={{ scale: 0.9 }}
            onClick={() => setLocation('/settings')} 
            className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white p-0.5 shadow-xl shadow-black/10 cursor-pointer overflow-hidden ring-2 ring-slate-100"
          >
             {user?.imageUrl ? (
               <img src={user.imageUrl} className="w-full h-full object-cover rounded-[14px]" />
             ) : (
               <span className="font-black text-sm">{(tenantInfo?.name || user?.name || '?').charAt(0)}</span>
             )}
          </motion.div>
        </div>
      </div>

      {/* Hero Residence Section */}
      <div className="px-6 py-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group h-[280px] rounded-[48px] overflow-hidden shadow-2xl shadow-indigo-900/10"
        >
           {/* Dynamic Background with Mesh Gradient */}
           <div className="absolute inset-0 bg-[#050505]" />
           <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[100%] bg-indigo-600/30 blur-[120px] rounded-full" />
           <div className="absolute bottom-[-30%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/20 blur-[100px] rounded-full" />
           
           <div className="absolute inset-0 p-10 flex flex-col justify-between">
              <div className="relative z-10">
                 <div className="flex items-center space-x-2 mb-4">
                   <div className="bg-indigo-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-indigo-500/30">
                     <p className="text-indigo-400 font-black text-[9px] uppercase tracking-[0.3em]">Official Address</p>
                   </div>
                 </div>
                 
                 <h3 className="text-[36px] font-black tracking-tight text-white leading-[1.1] mb-2 drop-shadow-sm">
                   {tenantInfo?.property?.name || 'Loading Home...'}
                 </h3>
                 
                 <div className="flex items-center space-x-3 text-white/50 text-[14px] font-bold">
                    <div className="flex items-center space-x-1">
                       <MapPin size={14} className="text-white/30" />
                       <span className="text-white/70">Room {tenantInfo?.roomNumber || 'N/A'}</span>
                    </div>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <p className="italic font-medium truncate max-w-[150px] opacity-60">{tenantInfo?.property?.address}</p>
                 </div>
              </div>

              <div className="relative z-10 flex items-center justify-between">
                 <div className="flex space-x-3">
                    <div className="bg-white/5 backdrop-blur-xl px-5 py-3 rounded-[24px] border border-white/10 hover:bg-white/10 transition-colors">
                       <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Rent Amount</p>
                       <p className="text-xl font-black text-white">₹{tenantInfo?.rentAmount || 0}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl px-5 py-3 rounded-[24px] border border-white/10 hover:bg-white/10 transition-colors">
                       <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Status</p>
                       <div className="flex items-center space-x-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${tenantInfo?.rentStatus === 'PAID' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                          <p className="text-xl font-black text-white uppercase tracking-tighter">{tenantInfo?.rentStatus || 'PAID'}</p>
                       </div>
                    </div>
                 </div>

                 <motion.button 
                   whileHover={{ scale: 1.1, rotate: 5 }}
                   whileTap={{ scale: 0.9 }}
                   onClick={async () => {
                     const text = `${tenantInfo?.property?.name}, Room ${tenantInfo?.roomNumber}, ${tenantInfo?.property?.address}`;
                     await navigator.clipboard.writeText(text);
                     setCopied(true);
                     setTimeout(() => setCopied(false), 2000);
                   }}
                   className={`w-12 h-12 flex items-center justify-center rounded-2xl backdrop-blur-xl border transition-all ${copied ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/10 border-white/20 text-white'}`}
                 >
                   {copied ? <Check size={20} /> : <Copy size={20} />}
                 </motion.button>
              </div>
           </div>
           
           <div className="absolute right-[-60px] top-[-20px] opacity-[0.03] scale-150 rotate-[-15deg] pointer-events-none">
              <Zap size={300} strokeWidth={1} />
           </div>
        </motion.div>
      </div>

      {/* Smart Quick Actions Section */}
      <div className="px-6 py-4 grid grid-cols-2 gap-4">
         <motion.div 
           whileTap={{ scale: 0.95 }}
           onClick={() => setLocation('/complaints')}
           className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-sm flex flex-col space-y-4 cursor-pointer hover:bg-slate-50 transition-all border-b-4 border-b-rose-500/10"
         >
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
               <AlertCircle size={22} />
            </div>
            <div>
               <h4 className="font-extrabold text-[15px] text-black">Log Issue</h4>
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Maintenance</p>
            </div>
         </motion.div>

         <motion.div 
           whileTap={{ scale: 0.95 }}
           onClick={() => setLocation('/settings')}
           className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-sm flex flex-col space-y-4 cursor-pointer hover:bg-slate-50 transition-all border-b-4 border-b-indigo-500/10"
         >
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner">
               <UserIcon size={22} />
            </div>
            <div>
               <h4 className="font-extrabold text-[15px] text-black">My Profile</h4>
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Self Service</p>
            </div>
         </motion.div>
      </div>

      {/* Interactive Issues List */}
      <div className="px-6 py-6">
        <div className="flex justify-between items-center mb-6 px-1">
          <div className="flex flex-col">
            <h3 className="text-[22px] font-black text-black tracking-tight leading-none uppercase italic">Recent Board</h3>
            <div className="w-10 h-1 bg-indigo-500 rounded-full mt-2" />
          </div>
          <motion.button 
            whileHover={{ x: 3 }}
            className="flex items-center space-x-1.5 text-black font-black text-[10px] uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity" 
            onClick={() => setLocation('/complaints')}
          >
            <span>History</span>
            <ChevronRight size={14} />
          </motion.button>
        </div>

        <div className="space-y-4">
           {complaints.length === 0 ? (
             <div className="bg-emerald-50/30 rounded-[40px] border-2 border-dashed border-emerald-100/50 p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10 mb-6">
                  <ShieldCheck size={32} />
                </div>
                <h4 className="font-black text-emerald-900 text-lg uppercase">All is well</h4>
                <p className="text-emerald-800/60 font-bold text-[13px] mt-2 leading-relaxed">No pending maintenance issues. Enjoy your stay!</p>
             </div>
           ) : (
             complaints.slice(0, 2).map((comp: any, idx: number) => (
               <motion.div 
                 key={comp.id} 
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 onClick={() => setLocation('/complaints')} 
                 className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
               >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border relative z-10 ${comp.status === 'OPEN' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <AlertCircle size={24} />
                  </div>
                  <div className="ml-5 flex-1 relative z-10">
                    <p className="font-extrabold text-black text-[16px] leading-tight mb-1">{comp.title}</p>
                    <div className="flex items-center space-x-2">
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${comp.status === 'OPEN' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                         {comp.status}
                       </span>
                       <span className="text-[11px] font-bold text-slate-400 tracking-tighter">{new Date(comp.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-200 group-hover:text-black transition-colors" />
               </motion.div>
             ))
           )}
        </div>
      </div>

      {/* Premium Caretaker Hub */}
      {tenantInfo?.property?.assignments?.length > 0 && (
        <div className="px-6 py-4">
          <div className="bg-white rounded-[48px] p-8 border border-slate-100 shadow-2xl shadow-indigo-900/5 relative overflow-hidden">
             {/* Decorative Background for Section */}
             <div className="absolute top-[-20%] right-[-10%] w-[150px] h-[150px] bg-indigo-50 blur-[50px] rounded-full pointer-events-none" />
             
             <div className="relative z-10">
                <div className="flex items-center space-x-5 mb-8">
                   <div className="w-20 h-20 rounded-[28px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-inner overflow-hidden relative">
                      {tenantInfo.property.assignments[0].caretaker?.imageUrl ? (
                        <img src={tenantInfo.property.assignments[0].caretaker.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={36} />
                      )}
                      {/* Online Status Badge */}
                      <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full shadow-sm" />
                   </div>
                   <div>
                      <div className="flex items-center space-x-1.5 mb-1.5">
                         <ShieldCheck size={12} className="text-indigo-500 font-black" />
                         <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] leading-none">Verified Caretaker</p>
                      </div>
                      <p className="text-2xl font-black text-black tracking-tighter">{tenantInfo.property.assignments[0].caretaker?.name}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <motion.a 
                     whileHover={{ y: -5 }}
                     whileTap={{ scale: 0.95 }}
                     href={`tel:${tenantInfo.property.assignments[0].caretaker?.phone}`}
                     className="flex items-center justify-center space-x-3 py-4.5 bg-black text-white rounded-[24px] text-[12px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl shadow-black/10 h-16"
                   >
                     <Phone size={18} />
                     <span>Call</span>
                   </motion.a>
                   <motion.a 
                     whileHover={{ y: -5 }}
                     whileTap={{ scale: 0.95 }}
                     href={`https://wa.me/${tenantInfo.property.assignments[0].caretaker?.phone?.replace(/\+/g, '')}`}
                     target="_blank"
                     className="flex items-center justify-center space-x-3 py-4.5 bg-emerald-100 text-emerald-800 rounded-[24px] text-[12px] font-black uppercase tracking-[0.2em] hover:bg-emerald-200 transition-all border border-emerald-200 h-16"
                   >
                     <MessageSquare size={18} />
                     <span>Chat</span>
                   </motion.a>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Floating Support Trigger */}
      <div className="fixed bottom-10 left-6 right-6 z-50">
         <motion.button 
           whileHover={{ y: -5, scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           onClick={() => setLocation('/complaints')} 
           className="w-full bg-black text-white p-6 rounded-[32px] flex items-center justify-between shadow-2xl shadow-black/40 group overflow-hidden"
         >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center space-x-4 relative z-10">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-rose-400 group-hover:rotate-12 transition-transform">
                  <Zap size={24} />
               </div>
               <div className="text-left">
                  <p className="font-black text-[16px] uppercase tracking-tighter">Need Support?</p>
                  <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Instant Maintenance Request</p>
               </div>
            </div>
            <ChevronRight size={24} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
         </motion.button>
      </div>
    </div>
  );
}
