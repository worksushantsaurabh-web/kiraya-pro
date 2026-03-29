import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Shield, Plus, X, Loader2, Trash2, Building2, CheckCircle2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/client';
import { useLocation } from 'wouter';
import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  imageUrl?: string;
  assignments?: { propertyId: string }[];
}

interface Property {
  id: string;
  name: string;
}

export function Caretakers() {
  const { user } = useAuthStore();
  const [, ] = useLocation();

  const [caretakers, setCaretakers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', email: '', imageUrl: '' });
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProps, setSelectedProps] = useState<string[]>([]);

  useEffect(() => {
    if (user?.role === 'LANDLORD') {
      fetchCaretakers();
      fetchProperties();
    }
  }, [user?.role]);

  if (user?.role !== 'LANDLORD') {
    return <div className="p-20 text-center font-bold text-slate-400">Access Restricted</div>;
  }

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties');
      setProperties(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchCaretakers = async () => {
    try {
      const res = await api.get('/caretakers');
      setCaretakers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setForm(prev => ({ ...prev, imageUrl: url }));
    } catch (err) {
      console.error("Upload error", err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || selectedProps.length === 0) {
      alert("Please enter a name and select at least one property");
      return;
    }
    try {
      await api.post('/caretakers', { ...form, propertyIds: selectedProps });
      fetchCaretakers();
      setShowAdd(false);
      setForm({ name: '', phone: '', email: '', imageUrl: '' });
      setSelectedProps([]);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add caretaker");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this caretaker? This will revoke their access to all assigned properties.")) return;
    try {
      await api.delete(`/caretakers/${id}`);
      fetchCaretakers();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Could not remove caretaker. They might have active dependencies.";
      alert(msg);
      console.error("Delete failed:", err);
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-black" /></div>;

  return (
    <div className="bg-white min-h-screen pb-24 relative">
       {/* New Premium Header */}
      <div className="px-6 pt-12 pb-6 border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur-md z-30">
        <div className="flex justify-between items-end">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] opacity-80">Management Team</span>
            <h2 className="text-3xl font-extrabold mt-1 tracking-tight text-black">Caretakers</h2>
          </motion.div>
          {user?.role === 'LANDLORD' && (
            <motion.button 
              onClick={() => setShowAdd(true)} 
              whileTap={{ scale: 0.95 }} 
              className="bg-black text-white px-6 py-3.5 rounded-2xl font-bold flex items-center space-x-2 shadow-xl shadow-black/10 transition-all active:bg-slate-900"
            >
              <Plus size={20} /><span className="text-sm">Add New Staff</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {caretakers.length === 0 && (
          <div className="bg-slate-50/50 rounded-[40px] p-16 text-center border-2 border-dashed border-slate-100 mt-6">
            <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
               <Shield size={40} className="text-slate-200" />
            </div>
            <h3 className="text-2xl font-extrabold text-black tracking-tight">Expand Your Team</h3>
            <p className="text-slate-400 font-medium text-[15px] mt-3 max-w-[260px] mx-auto leading-relaxed">Assign caretakers to specific properties to help you manage tenants and log issues.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5">
          {caretakers.map((ct, index) => (
            <motion.div
              key={ct.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="u-card !p-0 overflow-hidden bg-white border border-slate-100 shadow-sm"
            >
              <div className="p-6 pb-4">
                <div className="flex items-start">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border-2 border-white shadow-md overflow-hidden ring-4 ring-slate-50">
                    <img 
                      src={ct.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(ct.name || ct.id)}&backgroundColor=f8fafc`} 
                      className="w-full h-full object-cover" 
                      alt={ct.name} 
                    />
                  </div>
                  <div className="pl-5 flex-1 pt-1">
                    <div className="flex justify-between items-start">
                       <div>
                          <h3 className="text-[19px] font-extrabold text-black leading-tight tracking-tight">{ct.name}</h3>
                          <div className="flex items-center space-x-3 mt-2">
                             {ct.phone && <span className="text-[12px] font-bold text-slate-400">{ct.phone}</span>}
                             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">Staff</span>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Property Assignments Section */}
                <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                         <Building2 size={10} className="text-slate-300" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authorized Sites</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {ct.assignments && ct.assignments.length > 0 ? (
                            ct.assignments.map((a: any) => (
                              <span key={a.propertyId} className="bg-slate-900 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                {properties.find(p => p.id === a.propertyId)?.name || 'Property'}
                              </span>
                            ))
                          ) : (
                            <span className="text-[12px] font-bold text-slate-300 italic">No assigned sites</span>
                          )}
                      </div>
                   </div>
                   
                   <button 
                     onClick={() => handleDelete(ct.id)} 
                     className="ml-4 px-5 py-3 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all flex items-center space-x-2 shrink-0 border-none outline-none"
                   >
                     <Trash2 size={14} />
                     <span>Revoke Access</span>
                   </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Caretaker Modal */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 220 }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[70] max-w-[500px] mx-auto overflow-y-auto max-h-[92vh] shadow-2xl">
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-white py-2 z-10">
                <div>
                   <h3 className="text-2xl font-extrabold tracking-tight">Onboard Staff</h3>
                   <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Authorized Access Profile</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="w-11 h-11 bg-slate-50 rounded-full flex items-center justify-center active:rotate-90 transition-transform"><X size={24} /></button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6 pb-6">
                {/* Image Upload Area */}
                <div className="flex flex-col items-center justify-center mb-6">
                   <div className="relative group">
                      <div className="w-28 h-28 bg-slate-100 rounded-[32px] overflow-hidden border-4 border-slate-50 flex items-center justify-center shadow-inner">
                         {form.imageUrl ? (
                           <img src={form.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                         ) : (
                           <Shield size={40} className="text-slate-300" />
                         )}
                         {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>}
                      </div>
                      <label className="absolute bottom-[-10px] right-[-10px] w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-xl hover:scale-110 active:scale-95 transition-all">
                         <Camera size={20} />
                         <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                      </label>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Staff Full Name</label>
                    <input type="text" className="u-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rahul Sharma" required />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Work Phone</label>
                      <input type="tel" className="u-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91..." required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Corporate Email (Optional)</label>
                      <input type="email" className="u-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="staff@example.com" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                     <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Assign Authorized Sites</label>
                     <span className="text-[10px] font-black text-slate-300 uppercase">{selectedProps.length} selected</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                    {properties.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProps(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                        className={`flex items-center p-5 rounded-2xl border-2 transition-all group ${
                          selectedProps.includes(p.id) ? 'bg-black text-white border-black shadow-lg shadow-black/10' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200'
                        }`}
                      >
                        <Building2 size={20} className={`mr-4 ${selectedProps.includes(p.id) ? 'text-white' : 'text-slate-300 group-hover:text-black'}`} />
                        <span className="flex-1 text-left font-extrabold text-[15px]">{p.name}</span>
                        {selectedProps.includes(p.id) && <CheckCircle2 size={20} className="text-white" />}
                      </button>
                    ))}
                    {properties.length === 0 && <p className="text-center py-4 text-slate-400 text-sm font-bold">No properties found. Please add a property first.</p>}
                  </div>
                </div>

                <div className="bg-indigo-50/50 border border-indigo-100 rounded-[28px] p-5">
                  <p className="text-[12px] font-bold text-indigo-700 leading-relaxed">
                    <span className="font-extrabold uppercase tracking-tighter mr-1 shadow-sm px-1.5 py-0.5 bg-indigo-100 rounded-md">Staff Permissions</span> 
                    Caretakers can manage tenants and requests on their assigned sites. They cannot create properties or delete other staff members.
                  </p>
                </div>

                <button type="submit" className="u-btn-primary w-full !py-6 text-lg shadow-2xl shadow-black/20 group">
                  <Shield size={24} className="group-active:scale-90 transition-transform" />
                  <span className="ml-2">Confirm Staff Onboarding</span>
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
