import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, ChevronRight, X, Loader2, Calendar, MessageSquare, History, IndianRupee, Phone, MapPin, Building2, Trash2, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/client';
import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface Tenant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  rentStatus: string;
  rentAmount: number;
  rentDay: number;
  idProofUrl?: string;
  property?: {
    name: string;
  };
  hometown?: string;
  roomNumber?: string;
}

interface Property {
  id: string;
  name: string;
}

interface RentRecord {
  id: string;
  amount: number;
  paidDate: string;
}

export function Tenants() {
  const { user } = useAuthStore();
  const isTenant = user?.role === 'TENANT';
  const canManage = user?.role === 'LANDLORD' || user?.role === 'CARETAKER';
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rentRecords, setRentRecords] = useState<RentRecord[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [, setLocation] = useLocation();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    propertyId: '',
    rentAmount: '',
    rentDay: '1',
    idProofUrl: '',
    hometown: '',
    roomNumber: ''
  });

  const fetchData = useCallback(async () => {
    try {
      if (isTenant) {
        const [recordsRes, propsRes] = await Promise.all([
          api.get('/rent-records'),
          api.get('/properties')
        ]);
        setRentRecords(recordsRes.data);
        setProperties(propsRes.data);
      } else {
        const [tenantsRes, propsRes] = await Promise.all([
          api.get('/tenants'),
          api.get('/properties')
        ]);
        setTenants(tenantsRes.data);
        setProperties(propsRes.data);
        if (propsRes.data.length > 0) {
          setForm(f => ({ ...f, propertyId: propsRes.data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isTenant]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `id_proofs/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setForm(f => ({ ...f, idProofUrl: url }));
    } catch (error: any) {
      console.error("FULL Storage Error:", error);
      const serverResponse = error.serverResponse || error.message || "Unknown server response";
      alert(`Upload failed: ${serverResponse}. 
      
      Common fixes:
      1. Enable the 'Storage' tab in the Google Cloud console for this project.
      2. Set Firebase Rules: 'allow read, write: if true;' for temporary testing.`);
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tenants', {
        ...form,
        rentAmount: parseFloat(form.rentAmount),
        rentDay: parseInt(form.rentDay)
      });
      fetchData();
      setShowAdd(false);
      setForm({ name: '', phone: '', email: '', propertyId: properties[0]?.id || '', rentAmount: '', rentDay: '1', idProofUrl: '', hometown: '', roomNumber: '' });
    } catch(err: any) {
      console.error("Add Tenant Error:", err);
      if (err.response?.status === 403 && err.response?.data?.error?.includes('Limit reached')) {
        setLimitError(err.response.data.error);
      } else {
        const msg = err.response?.data?.error || err.message || 'Unknown error';
        alert(`Failed to add tenant: ${msg}`);
      }
    }
  };

  const updateRentStatus = async (id: string, status: string) => {
    try {
      await api.put(`/tenants/${id}`, { rentStatus: status });
      fetchData();
    } catch {
      alert("Failed to update status");
    }
  };

  const deleteTenant = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this tenant? This will delete all their records.")) return;
    try {
      await api.delete(`/tenants/${id}`);
      fetchData();
      setSelectedId(null);
    } catch {
      alert("Failed to delete tenant");
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-black" /></div>;

  // Tenant View: Rent Records History
  if (isTenant) {
    return (
      <div className="bg-white min-h-screen pb-24 relative">
        <div className="px-6 pt-12 pb-6 border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur-md z-30">
          <h2 className="text-3xl font-extrabold tracking-tight text-black line-clamp-1">Rent Records</h2>
          <p className="text-slate-400 font-bold text-[13px] mt-1.5 uppercase tracking-wider">Your Payment History</p>
        </div>

        <div className="p-6 space-y-4">
          {rentRecords.length === 0 ? (
            <div className="bg-slate-50/50 rounded-[32px] p-12 text-center border-2 border-dashed border-slate-100 mt-10">
              <History size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-xl font-extrabold text-black">No Records Yet</h3>
              <p className="text-slate-400 font-medium text-[14px] mt-2">Your rent payments will appear here once marked paid by the landlord.</p>
            </div>
          ) : (
            rentRecords.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="u-card bg-white border border-slate-100 flex items-center justify-between p-5"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                    <IndianRupee size={20} />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-extrabold text-black">Rent Paid</h4>
                    <div className="flex items-center space-x-2 text-slate-400 text-[11px] font-bold mt-0.5 uppercase tracking-wider">
                      <Calendar size={10} />
                      <span>{new Date(record.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-black">₹{record.amount}</p>
                  <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full uppercase tracking-tighter">SUCCESS</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Landlord/Caretaker View: Tenants List
  return (
    <div className="bg-white min-h-screen pb-24 relative">
      <div className="px-6 pt-12 pb-6 border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur-md z-30">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-black line-clamp-1">Tenants</h2>
            <p className="text-slate-400 font-bold text-[13px] mt-1.5 uppercase tracking-wider">
              {tenants.length} Active Members
            </p>
          </div>
          {canManage && (
            <motion.button onClick={() => setShowAdd(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-black text-white px-5 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-black/10 transition-shadow hover:shadow-xl active:bg-slate-900 leading-none h-12">
              <Plus size={20} /><span className="text-sm">Invite</span>
            </motion.button>
          )}
        </div>
      </div>
      
      {/* Filters Bar */}
      {canManage && (
        <div className="px-6 py-4 bg-slate-50 flex items-center space-x-3 sticky top-[105px] z-20 border-b border-slate-100/50">
          <div className="flex-1">
            <select 
              value={filterProperty} 
              onChange={e => setFilterProperty(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-black uppercase tracking-tight outline-none focus:border-black transition-colors"
            >
              <option value="all">All Properties</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-black uppercase tracking-tight outline-none focus:border-black transition-colors"
            >
              <option value="all">Any Status</option>
              <option value="PAID">Paid Only</option>
              <option value="OVERDUE">With Dues</option>
            </select>
          </div>
        </div>
      )}

      <div className="p-6 space-y-5">
        {tenants
          .filter(t => filterProperty === 'all' || (t.property as any)?.id === filterProperty)
          .filter(t => filterStatus === 'all' || t.rentStatus === filterStatus)
          .map((tenant, index) => (
          <motion.div 
            key={tenant.id} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`u-card !p-0 overflow-hidden cursor-pointer transition-all duration-300 ${selectedId === tenant.id ? 'ring-2 ring-black shadow-2xl scale-[1.02]' : 'hover:shadow-lg'}`} 
            onClick={() => setSelectedId(selectedId === tenant.id ? null : tenant.id)}
          >
            <div className="flex p-4 items-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 border-2 border-slate-100 shadow-lg overflow-hidden">
                {tenant.idProofUrl ? (
                   <img src={tenant.idProofUrl} className="w-full h-full object-cover" alt="ID" />
                ) : (
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(tenant.name || tenant.id)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`} className="w-full h-full object-cover" alt={tenant.name} />
                )}
              </div>
              <div className="pl-5 flex-1 pr-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest leading-none ${tenant.rentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {tenant.rentStatus}
                  </span>
                </div>
                <h3 className="text-[17px] font-extrabold text-black leading-tight line-clamp-1">{tenant.name}</h3>
                <p className="text-slate-400 font-bold text-[11px] mt-1 opacity-80 uppercase tracking-tighter">{tenant.property?.name} • Due on {tenant.rentDay}th</p>
              </div>
              <div className="flex items-center space-x-2">
                {tenant.rentStatus === 'OVERDUE' && (
                  <motion.button 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    onClick={(e) => {
                       e.stopPropagation();
                       const msg = `Hi ${tenant.name}, your rent for ${tenant.property?.name} is overdue. 

Rent Amount: ₹${tenant.rentAmount}
Due Date: ${tenant.rentDay}th of this month.

Please pay at the earliest.
- KirayaPro`;
                       window.open(`https://wa.me/${tenant.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-sm border border-emerald-100 hover:bg-emerald-600 hover:text-white"
                  >
                    <MessageSquare size={18} />
                  </motion.button>
                )}
                <button className="p-2 text-slate-300 group">
                   <ChevronRight size={22} className={`transition-all duration-500 ${selectedId === tenant.id ? 'rotate-90 text-black' : 'group-hover:text-slate-400'}`} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {selectedId === tenant.id && (
                <motion.div 
                   initial={{ height: 0, opacity: 0 }} 
                   animate={{ height: "auto", opacity: 1 }} 
                   exit={{ height: 0, opacity: 0 }} 
                   transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                   className="bg-slate-50/70 border-t border-slate-50 p-6" 
                   onClick={e => e.stopPropagation()}
                >
                  {/* Detailed Profile View */}
                  <div className="space-y-6 mb-8">
                    {/* ID Proof Section */}
                    {tenant.idProofUrl ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verified ID Document</p>
                          <button 
                            onClick={() => window.open(tenant.idProofUrl, '_blank')}
                            className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-tight hover:bg-indigo-600 hover:text-white transition-colors"
                          >
                            Open Fullscreen
                          </button>
                        </div>
                        <div 
                          onClick={() => window.open(tenant.idProofUrl, '_blank')}
                          className="relative group rounded-[32px] overflow-hidden border-2 border-white shadow-xl aspect-video bg-black/5 cursor-zoom-in"
                        >
                          <img src={tenant.idProofUrl} className="w-full h-full object-cover grayscale-[0.3] hover:grayscale-0 transition-all duration-700 hover:scale-105" alt="ID Proof" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-white text-xs uppercase tracking-[0.2em] backdrop-blur-[2px]">
                            Tap to View Original
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity Document</p>
                          <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-md uppercase tracking-tight">Missing Document</span>
                        </div>
                        <div className="bg-white border-2 border-dashed border-slate-100 rounded-[32px] p-10 text-center hover:border-indigo-400 transition-colors group cursor-pointer relative overflow-hidden">
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploading(true);
                            try {
                              const storageRef = ref(storage, `id_proofs/${Date.now()}_${file.name}`);
                              const snapshot = await uploadBytes(storageRef, file);
                              const url = await getDownloadURL(snapshot.ref);
                              await api.put(`/tenants/${tenant.id}`, { idProofUrl: url });
                              fetchData();
                            } catch (err: unknown) {
                              console.error("Storage Error:", err);
                              const errMsg = err instanceof Error ? err.message : 'Unknown error';
                              alert(`Upload failed: ${errMsg}`);
                            } finally {
                              setUploading(false);
                            }
                          }} />
                          <div className="flex flex-col items-center space-y-3 group-hover:scale-110 transition-transform duration-500">
                             <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                <Plus size={32} />
                             </div>
                             <div>
                                <h4 className="text-[13px] font-black text-black uppercase tracking-wider">No ID proof uploaded</h4>
                                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Tap to Browse & Upload</p>
                             </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {/* Room Number Detail */}
                      <div className="bg-white p-5 rounded-[28px] border border-slate-100/50 shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <Building2 size={12} className="text-slate-300" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Room / Flat</p>
                        </div>
                        <p className="text-[14px] font-black text-black">{tenant.roomNumber || 'N/A'}</p>
                      </div>

                      {/* Rent Detail */}
                      <div className="bg-white p-5 rounded-[28px] border border-slate-100/50 shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <IndianRupee size={12} className="text-slate-300" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Rent</p>
                        </div>
                        <p className="text-[14px] font-black text-black">₹{tenant.rentAmount}</p>
                      </div>

                      {/* Contact Detail */}
                      <div className="bg-white p-5 rounded-[28px] border border-slate-100/50 shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <Phone size={12} className="text-slate-300" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</p>
                        </div>
                        <p className="text-[14px] font-black text-black">{tenant.phone || 'Not Shared'}</p>
                      </div>

                      {/* Address Detail */}
                      <div className="bg-white p-5 rounded-[28px] border border-slate-100/50 shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin size={12} className="text-slate-300" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Perm. Address</p>
                        </div>
                        <p className="text-[14px] font-black text-black leading-tight line-clamp-2">{tenant.hometown || 'Not Provided'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {canManage && (
                    <div className="flex space-x-4">
                       <button onClick={() => updateRentStatus(tenant.id, 'PAID')} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-extrabold text-[15px] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">Mark Paid</button>
                       <button onClick={() => deleteTenant(tenant.id)} className="w-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border-2 border-rose-100 active:scale-95 transition-all">
                          <Trash2 size={24} />
                       </button>
                       <button onClick={() => updateRentStatus(tenant.id, 'OVERDUE')} className="flex-1 bg-white border-2 border-slate-100 text-black py-4 rounded-2xl font-extrabold text-[15px] active:scale-95 transition-all hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100">Send Notice</button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[70] max-w-[480px] mx-auto overflow-y-auto max-h-[90vh] shadow-2xl">
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10">
                <h3 className="text-2xl font-extrabold tracking-tight">Invite Tenant</h3>
                <button onClick={() => { setShowAdd(false); setLimitError(null); }} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center active:rotate-90 transition-transform"><X size={24} /></button>
              </div>

              {limitError && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-8 p-6 bg-rose-50 border-2 border-rose-100 rounded-[32px] overflow-hidden relative"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                      <Crown size={20} className="text-rose-500" />
                    </div>
                    <div>
                      <h4 className="text-rose-900 font-extrabold text-[15px] mb-1">Upgrade Required</h4>
                      <p className="text-rose-600/80 text-[13px] font-bold leading-relaxed mb-4">{limitError}</p>
                      <button 
                         onClick={() => setLocation('/pricing')}
                         className="bg-rose-500 text-white px-5 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-wider shadow-lg shadow-rose-500/30 hover:bg-rose-600 active:scale-95 transition-all"
                      >
                         View Plans & Upgrade
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              <form onSubmit={handleAdd} className="space-y-6 pb-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Property</label>
                  <select className="u-input w-full cursor-pointer" value={form.propertyId} onChange={e => setForm({...form, propertyId: e.target.value})}>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input type="text" className="u-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Rahul Singh..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Room / Flat</label>
                    <input type="text" className="u-input" value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})} placeholder="e.g. A-101" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Rent Amount</label>
                    <input type="number" className="u-input" value={form.rentAmount} onChange={e => setForm({...form, rentAmount: e.target.value})} placeholder="15000" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Rent Day</label>
                  <input type="number" min="1" max="31" className="u-input" value={form.rentDay} onChange={e => setForm({...form, rentDay: e.target.value})} placeholder="1" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Tenant Phone</label>
                  <input type="tel" className="u-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Permanent Address</label>
                  <input type="text" className="u-input" value={form.hometown} onChange={e => setForm({...form, hometown: e.target.value})} placeholder="Full address from ID proof..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">ID Proof (Photo)</label>
                  <input type="file" accept="image/*" className="hidden" id="id-upload" onChange={handleFileUpload} />
                  <label htmlFor="id-upload" className={`flex flex-col items-center justify-center space-y-3 w-full p-8 border-2 border-dashed rounded-[32px] cursor-pointer transition-all ${form.idProofUrl ? 'bg-black border-black text-white shadow-xl shadow-black/20' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                    {uploading ? (
                      <Loader2 size={32} className="animate-spin text-indigo-500" />
                    ) : form.idProofUrl ? (
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg">
                        <img src={form.idProofUrl} className="w-full h-full object-cover" alt="Preview" />
                      </div>
                    ) : (
                      <Plus size={32} />
                    )}
                    <span className="font-extrabold text-[12px] uppercase tracking-[0.2em] leading-none">
                      {uploading ? 'Processing...' : form.idProofUrl ? 'ID Captured' : 'Select ID Proof'}
                    </span>
                  </label>
                </div>
                <button type="submit" disabled={uploading} className="u-btn-primary w-full !py-5 text-lg shadow-xl shadow-black/20">Send Invitation</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
