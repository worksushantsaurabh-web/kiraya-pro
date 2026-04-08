import { useAuthStore } from '@/store/useAuthStore';
import { User, Shield, CreditCard, ChevronRight, LogOut, Building2, HelpCircle, Zap, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { api } from '@/api/client';

export function Settings() {
  const { user, setUser } = useAuthStore();
  const [, setLocation] = useLocation();
  const [showEdit, setShowEdit] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    imageUrl: user?.imageUrl || ''
  });

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    setLocation('/login');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${user?.id || Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setEditForm(f => ({ ...f, imageUrl: url }));
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const res = await api.put('/users/me', editForm);
      setUser(res.data);
      setShowEdit(false);
    } catch (err: any) {
      alert("Failed to update: " + err.message);
    }
  };

  const sections = [
    {
      title: 'Profile & Identity',
      items: [
        { icon: User, label: 'Edit Profile', value: user?.name, action: () => setShowEdit(true) },
        ...(user?.role !== 'TENANT' ? [{ icon: Zap, label: 'Subscription Plan', value: `${user?.subscriptionPlan || 'FREE'} ${user?.subscriptionDuration ? `(${user.subscriptionDuration})` : ''}`, action: () => setLocation('/pricing') }] : []),
        { icon: LogOut, label: 'Logout', value: 'Switch Account', action: handleLogout, danger: true }
      ]
    },
    {
      title: 'Management',
      items: [
        { icon: Building2, label: 'Properties', value: 'Manage active units', action: () => setLocation('/properties') },
        { icon: CreditCard, label: 'Rent Records', value: 'History & Status', action: () => setLocation('/tenants') },
        ...(user?.role === 'LANDLORD' ? [{ icon: Shield, label: 'Manage Caretakers', value: 'Add or remove caretakers', action: () => setLocation('/caretakers') }] : [])
      ]
    },
    {
       title: 'Legal & Support',
       items: [
         { icon: Shield, label: 'Privacy Policy', value: 'Data handling', action: () => setLocation('/privacy') },
         { icon: FileText, label: 'Terms of Service', value: 'User agreement', action: () => setLocation('/terms') },
         { icon: HelpCircle, label: 'Help Center', value: 'FAQs & Support', action: () => setLocation('/help') }
       ]
    }
  ];

  return (
    <div className="bg-white min-h-screen pb-24 relative">
      <div className="px-6 pt-12 pb-8 border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur-md z-30">
        <h2 className="text-3xl font-extrabold tracking-tight text-black line-clamp-1">Account</h2>
        <p className="text-slate-400 font-bold text-[13px] mt-1.5 uppercase tracking-wider">Settings & Preferences</p>
      </div>

      <div className="p-6">
        <div className="u-card !p-8 flex flex-col items-center bg-black/5 border-none shadow-none mb-10 overflow-hidden relative">
           <div className="w-28 h-28 bg-black rounded-[40px] flex items-center justify-center text-white text-4xl font-extrabold mb-6 shadow-2xl shadow-black/20 ring-4 ring-white relative z-10 transition-transform hover:rotate-6 active:scale-90 overflow-hidden bg-cover bg-center" 
                style={user?.imageUrl ? { backgroundImage: `url(${user.imageUrl})` } : {}}>
             {!user?.imageUrl && user?.name?.charAt(0)}
           </div>
           <div className="text-center relative z-10">
              <h3 className="font-extrabold text-[24px] text-black tracking-tight leading-tight mb-2 uppercase">{user?.role}</h3>
              <p className="text-slate-500 font-bold text-[14px] flex items-center justify-center space-x-2">
                <span className="opacity-60">{user?.name}</span>
              </p>
           </div>
           <div className="absolute right-[-40px] bottom-[-40px] opacity-[0.03] rotate-12 scale-150">
             <User size={180} />
           </div>
        </div>

        <div className="space-y-10 mb-12">
          {sections.map(section => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.2em] ml-2 opacity-80">{section.title}</h4>
              <div className="u-card !p-2 space-y-1 overflow-hidden">
                {section.items.map(item => (
                  <button 
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center p-4 rounded-[24px] hover:bg-slate-50 active:bg-slate-100 transition-all text-left outline-none group active:scale-[0.98]"
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 ${item.danger ? 'bg-rose-50 text-rose-500' : 'bg-white text-black'}`}>
                      <item.icon size={20} />
                    </div>
                    <div className="ml-5 flex-1 pr-2">
                      <p className={`font-extrabold text-[16px] tracking-tight ${item.danger ? 'text-rose-600' : 'text-black'}`}>{item.label}</p>
                      <p className="text-[12px] font-bold text-slate-400 opacity-80 leading-snug">{item.value}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-200 group-hover:text-black group-active:text-black transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pb-8 border-t border-slate-50 pt-10">
           <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest leading-loose">Kiraya Pro v2.4.0 (Beta)</p>
           <p className="text-[10px] font-bold text-slate-300 mt-2 italic px-8">Designed with precision for professional management.</p>
        </div>
      </div>

      <AnimatePresence>
        {showEdit && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEdit(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[70] max-w-[480px] mx-auto overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-white py-2 z-10">
                <h3 className="text-2xl font-extrabold tracking-tight">Edit Profile</h3>
                <button onClick={() => setShowEdit(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><CloseIcon size={24} /></button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="flex justify-center mb-10">
                  <div className="relative group">
                    <input type="file" id="profile-pic" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    <label htmlFor="profile-pic" className={`w-32 h-32 rounded-[40px] flex items-center justify-center cursor-pointer transition-all border-4 border-slate-100 overflow-hidden bg-cover bg-center ${uploading ? 'opacity-50' : ''}`}
                           style={editForm.imageUrl ? { backgroundImage: `url(${editForm.imageUrl})` } : { backgroundColor: '#f1f5f9' }}>
                       {uploading ? <Loader2 size={32} className="animate-spin text-black" /> : !editForm.imageUrl && <User size={48} className="text-slate-300" />}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest">Change Photo</div>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input type="text" className="u-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Rahul Singh..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input type="tel" className="u-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="+91..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input type="email" className="u-input" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="rahul@example.com" />
                </div>
                <button type="submit" className="u-btn-primary w-full !py-4 text-lg">Save Changes</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple CloseIcon component
const CloseIcon = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
