import { useEffect, useState } from 'react';
import { Building2, Users, AlertCircle, TrendingUp, ChevronRight, Activity, Loader2, Bell, X, CheckCircle2, Crown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/client';
import { useLocation } from 'wouter';

interface DashboardStats {
  properties: number;
  tenants: number;
  complaints: number;
  overdue: number;
  caretakers: any[];
}

interface StatItem {
  title: string;
  icon: LucideIcon;
  color: string;
  count: number;
  path: string;
}

export function Dashboard() {
  const { user, refreshUser } = useAuthStore();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [data, setData] = useState<DashboardStats>({
    properties: 0,
    tenants: 0,
    complaints: 0,
    overdue: 0,
    caretakers: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refreshUser(); // Sync name/role
        const [propsRes, tenantsRes, compRes, caretakersRes] = await Promise.all([
          api.get('/properties').catch(() => ({ data: [] })),
          api.get('/tenants').catch(() => ({ data: [] })),
          api.get('/complaints').catch(() => ({ data: [] })),
          api.get('/caretakers').catch(() => ({ data: [] })),
        ]);
        
        setData({
          properties: propsRes.data.length,
          tenants: tenantsRes.data.length,
          complaints: compRes.data.filter((c: any) => c.status === 'OPEN').length,
          overdue: tenantsRes.data.filter((t: any) => t.rentStatus === 'OVERDUE').length,
          caretakers: caretakersRes.data
        });
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshUser]);

  const stats: StatItem[] = [
    { title: 'Properties', icon: Building2, color: 'text-indigo-600', count: data.properties, path: '/properties' },
    { title: 'Tenants', icon: Users, color: 'text-emerald-600', count: data.tenants, path: '/tenants' },
    { title: 'Issues', icon: AlertCircle, color: 'text-rose-600', count: data.complaints, path: '/complaints' },
    { title: 'Overdue', icon: TrendingUp, color: 'text-amber-600', count: data.overdue, path: '/tenants' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header UC Style */}
      <div className="px-6 pt-12 pb-10 flex justify-between items-center bg-white sticky top-0 z-40">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <span className="text-slate-400 font-bold text-[10px] tracking-[0.2em] uppercase opacity-70 block mb-1">
             {user?.role === 'CARETAKER' ? `Staff Account • Authorized Access` : 'Official Landlord Portal'}
          </span>
          <h2 className="text-[32px] font-black tracking-tighter text-black leading-none uppercase">
            {user?.name || (user?.role === 'LANDLORD' ? 'Admin Profile' : 'Staff Profile')}
          </h2>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-[12px] font-extrabold text-indigo-500 uppercase tracking-widest">
              {user?.role === 'CARETAKER' ? `Managing ${user?.assignments?.length || 0} Units` : 'System Management Active'}
            </span>
            {user?.role === 'LANDLORD' && (
              <span 
                onClick={() => setLocation('/pricing')}
                className="flex items-center space-x-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-tighter border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <Crown size={10} />
                <span>{user?.subscriptionPlan || 'AARAMBH'} {user?.subscriptionDuration && `(${user.subscriptionDuration})`}</span>
              </span>
            )}
          </div>
        </motion.div>
        <div className="flex space-x-3">
          <button 
             onClick={() => setShowNotifications(true)}
             className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-black active:scale-90 transition-transform relative"
          >
            <Bell size={20} />
            {(data.overdue > 0 || data.complaints > 0) && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-full"></span>
            )}
          </button>
          <div 
            onClick={() => setLocation('/settings')} 
            className="w-11 h-11 bg-black rounded-full flex items-center justify-center text-white font-extrabold text-sm border-2 border-slate-50 cursor-pointer active:scale-90 transition-transform bg-cover bg-center overflow-hidden"
            style={user?.imageUrl ? { backgroundImage: `url(${user.imageUrl})` } : {}}
          >
            {!user?.imageUrl && user?.name?.charAt(0)}
          </div>
        </div>
      </div>

      {/* Hero Stats Section */}
      <div className="px-6 py-2">
        <div className="u-card grid grid-cols-2 gap-6 !p-6">
          {stats.map((stat, i) => (
            <motion.div 
               key={stat.title} 
               onClick={() => setLocation(stat.path)}
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               transition={{ delay: i * 0.1 }}
               className="flex flex-col space-y-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex items-center space-x-2">
                <stat.icon size={16} className={stat.color} strokeWidth={3} />
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">{stat.title}</span>
              </div>
              <p className="text-2xl font-extrabold text-black">{stat.count}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Action Banner */}
      <div className="px-6 py-4">
        <div 
           onClick={() => setLocation('/complaints')}
           className="relative overflow-hidden bg-black rounded-[36px] p-8 text-white h-44 flex flex-col justify-center cursor-pointer active:scale-[0.98] transition-all"
        >
          <div className="relative z-10">
            <h3 className="text-2xl font-extrabold leading-[1.15] mb-4 text-white">You have {data.complaints} pending issues to resolve.</h3>
            <span className="text-white font-bold text-sm flex items-center space-x-2">
               <span>Go to Activity Feed</span>
               <ChevronRight size={16} />
            </span>
          </div>
          <div className="absolute right-[-10px] bottom-[-20px] opacity-20">
            <Activity size={160} strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* Simplified Recent Action List */}
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className="text-[22px] font-extrabold text-black tracking-tight leading-none">Recent Updates</h3>
          <button className="text-black font-extrabold text-[12px] uppercase tracking-widest opacity-60">Refresh</button>
        </div>
        
        <div className="space-y-4">
          <div onClick={() => setLocation('/properties')} className="flex items-center p-5 bg-slate-50 border border-slate-100 rounded-[32px] group active:bg-slate-100 transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm shrink-0 border border-slate-50">
              <Building2 size={24} />
            </div>
            <div className="ml-5 flex-1">
              <p className="font-extrabold text-black text-[16px]">Property Sync</p>
              <p className="text-[13px] font-medium text-slate-400">All {data.properties} properties updated.</p>
            </div>
            <ChevronRight size={20} className="text-slate-200 group-active:text-black" />
          </div>

          <div onClick={() => setLocation('/tenants')} className="flex items-center p-5 bg-slate-50 border border-slate-100 rounded-[32px] group active:bg-slate-100 transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm shrink-0 border border-slate-50">
              <TrendingUp size={24} />
            </div>
            <div className="ml-5 flex-1">
              <p className="font-extrabold text-black text-[16px]">Rent Collection</p>
              <p className="text-[13px] font-medium text-slate-400">{data.overdue} overdue payments detected.</p>
            </div>
            <ChevronRight size={20} className="text-slate-200 group-active:text-black" />
          </div>
        </div>
      </div>

      {/* New Management Team Section */}
      {user?.role === 'LANDLORD' && (
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-6 px-1">
            <h3 className="text-[22px] font-extrabold text-black tracking-tight leading-none">Management Team</h3>
            <button onClick={() => setLocation('/caretakers')} className="text-black font-extrabold text-[12px] uppercase tracking-widest opacity-60">View All</button>
          </div>
          
          <div className="space-y-4">
            {data.caretakers.length === 0 ? (
              <div onClick={() => setLocation('/caretakers')} className="p-8 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[36px] text-center cursor-pointer active:scale-[0.98] transition-all">
                 <Users size={32} className="mx-auto text-slate-200 mb-3" />
                 <p className="text-slate-400 font-bold text-sm uppercase tracking-tighter">Add your first staff member</p>
              </div>
            ) : (
              data.caretakers.slice(0, 2).map((ct: any) => (
                <div key={ct.id} className="flex items-center p-4 bg-white border border-slate-100 rounded-[32px] shadow-sm">
                   <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-sm shrink-0">
                      <img src={ct.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ct.id}`} className="w-full h-full object-cover" />
                   </div>
                   <div className="ml-4 flex-1">
                      <p className="font-extrabold text-black text-[15px]">{ct.name}</p>
                      <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Active Caretaker</p>
                   </div>
                   <button 
                     onClick={async (e) => {
                       e.stopPropagation();
                       if (confirm(`Revoke access for ${ct.name}?`)) {
                         try {
                           await api.delete(`/caretakers/${ct.id}`);
                           window.location.reload(); // Quick refresh for dashboard
                         } catch (_err) {
                           alert("Failed to revoke");
                         }
                       }
                     }}
                     className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100 active:scale-95 transition-all"
                   >
                     Revoke
                   </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Account Tip Banner */}
      <div className="px-6 py-4">
         <div className="bg-amber-50 rounded-[32px] p-6 border border-amber-100 flex items-start space-x-4">
            <div className="w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-400/20">
               <AlertCircle size={20} />
            </div>
            <div>
               <h4 className="font-extrabold text-amber-900 text-[15px]">Verify your profile</h4>
               <p className="text-amber-800/60 text-[13px] font-bold mt-1 leading-relaxed">Complete your profile to unlock automated Whatsapp reminders for your tenants.</p>
            </div>
         </div>
      </div>

      {/* Notifications Tray */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotifications(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[70] max-w-[480px] mx-auto overflow-y-auto max-h-[80vh]">
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-white py-2 z-10">
                <h3 className="text-2xl font-extrabold tracking-tight">Inbox</h3>
                <button onClick={() => setShowNotifications(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><X size={24} /></button>
              </div>

              <div className="space-y-5">
                {data.overdue > 0 && (
                  <div className="flex items-start space-x-4 p-5 bg-rose-50/50 border border-rose-100 rounded-[32px]">
                    <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0"><AlertCircle size={20} /></div>
                    <div>
                      <p className="font-extrabold text-black text-[15px]">Awaiting Rent</p>
                      <p className="text-[13px] font-bold text-rose-600/60 mt-0.5">{data.overdue} tenants missed their rent day.</p>
                    </div>
                  </div>
                )}
                
                {data.complaints > 0 && (
                  <div className="flex items-start space-x-4 p-5 bg-black/5 rounded-[32px]">
                    <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white shrink-0"><Activity size={20} /></div>
                    <div>
                      <p className="font-extrabold text-black text-[15px]">Tenant Request</p>
                      <p className="text-[13px] font-bold text-slate-400 mt-0.5">Someone just logged a maintenance issue.</p>
                    </div>
                  </div>
                )}

                {(data.overdue === 0 && data.complaints === 0) && (
                  <div className="py-12 text-center">
                    <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                    <p className="font-extrabold text-black text-lg">You're all caught up!</p>
                    <p className="text-slate-400 font-bold text-sm mt-1">No new notifications at the moment.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
