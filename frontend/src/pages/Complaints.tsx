import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { AlertCircle, CheckCircle, Plus, ChevronRight, MessageSquare, History, X, Loader2, Camera, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/client';
import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function Complaints() {
  const { user } = useAuthStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    tenantId: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [compRes, tenantsRes] = await Promise.all([
        api.get('/complaints'),
        user?.role !== 'TENANT' ? api.get('/tenants') : Promise.resolve({ data: [] })
      ]);
      setComplaints(compRes.data);
      setTenants(tenantsRes.data);
      if (tenantsRes.data.length > 0) {
        setForm(f => ({ ...f, tenantId: tenantsRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!storage.app.options.storageBucket) {
      alert("Firebase Storage Bucket is NOT configured. Check your .env file!");
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `complaints/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setForm(f => ({ ...f, imageUrl: url }));
    } catch (error: any) {
      console.error("Storage Error:", error);
      alert(`Upload failed: ${error.message} (Code: ${error.code})`);
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    
    try {
      const selectedTenant = tenants.find(t => t.id === form.tenantId);
      const propertyId = user?.role === 'TENANT' ? undefined : selectedTenant?.propertyId;

      await api.post('/complaints', {
        title: form.title,
        description: form.description,
        tenantId: user?.role === 'TENANT' ? undefined : form.tenantId,
        propertyId,
        imageUrl: form.imageUrl
      });
      fetchData();
      setShowAdd(false);
      setForm({ title: '', description: '', tenantId: tenants[0]?.id || '', imageUrl: '' });
    } catch(err) {
      alert("Failed to create complaint");
    }
  };

  const markResolved = async (id: string) => {
    try {
      await api.put(`/complaints/${id}`, { status: 'RESOLVED' });
      fetchData();
      setSelectedId(null);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-black" /></div>;

  return (
    <div className="bg-white min-h-screen pb-24 relative">
      <div className="px-6 pt-12 pb-6 border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur-md z-30">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-black line-clamp-1">Activity</h2>
            <p className="text-slate-400 font-bold text-[13px] mt-1.5 uppercase tracking-wider">
              {complaints.filter(c => c.status !== 'RESOLVED').length} Active Issues
            </p>
          </div>
          <motion.button onClick={() => setShowAdd(true)} whileTap={{ scale: 0.95 }} className="bg-black text-white px-5 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-black/10 active:bg-slate-900">
            <Plus size={20} /><span className="text-sm">Log Issue</span>
          </motion.button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {complaints.map((comp, index) => (
          <motion.div key={comp.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={`u-card !p-0 overflow-hidden ${selectedId === comp.id ? 'ring-2 ring-black shadow-xl' : ''} ${comp.status === 'RESOLVED' ? 'opacity-60' : ''}`} onClick={() => setSelectedId(selectedId === comp.id ? null : comp.id)}>
            <div className="flex p-4 items-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 ${comp.status === 'RESOLVED' ? 'bg-slate-50 text-slate-400' : 'bg-rose-50 text-rose-500'}`}>
                {comp.status === 'RESOLVED' ? <History size={28} /> : (comp.imageUrl ? <Camera size={28} /> : <AlertCircle size={28} />)}
              </div>
              <div className="pl-5 flex-1 pr-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest leading-none ${comp.status === 'RESOLVED' ? 'bg-slate-100 text-slate-400' : 'bg-rose-50 text-rose-600'}`}>
                    {comp.status}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-black leading-tight line-clamp-1">{comp.title}</h3>
                <div className="flex items-center text-slate-400 text-[13px] font-bold mt-1.5 space-x-1.5">
                  <span className="truncate">{comp.property?.name || 'Assigned'}</span>
                  <span className="text-slate-200">|</span>
                  <span className="truncate text-black">{comp.tenant?.name || 'Tenant'}</span>
                </div>
              </div>
              <button className="p-2 text-slate-300">
                <ChevronRight size={20} className={`transition-transform duration-300 ${selectedId === comp.id ? 'rotate-90 text-black' : ''}`} />
              </button>
            </div>

            <AnimatePresence>
              {selectedId === comp.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-50/50 border-t border-slate-50 p-6" onClick={e => e.stopPropagation()}>
                  {comp.imageUrl && (
                    <div className="mb-6 h-48 w-full rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
                      <img src={comp.imageUrl} className="w-full h-full object-cover" alt="Issue proof" />
                    </div>
                  )}
                  <div className="bg-white p-5 rounded-[32px] border border-slate-100 mb-6 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2 ml-1">
                       <MessageSquare size={14} className="text-slate-400" />
                       <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Description</span>
                    </div>
                    <p className="text-[14px] font-medium text-black leading-relaxed">{comp.description || 'No detailed description provided.'}</p>
                  </div>
                  {comp.status === 'OPEN' && user?.role !== 'TENANT' && (
                    <button onClick={(e) => { e.stopPropagation(); markResolved(comp.id); }} className="u-btn-primary w-full !py-4 shadow-lg shadow-black/10">
                      <CheckCircle size={20} /><span>Resolve Issue</span>
                    </button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[70] max-w-[480px] mx-auto overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-white py-2 z-10">
                <h3 className="text-2xl font-extrabold tracking-tight">Log Issue</h3>
                <button onClick={() => setShowAdd(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><X size={24} /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-6">
                {user?.role !== 'TENANT' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Select Tenant</label>
                    <select className="u-input w-full" value={form.tenantId} onChange={e => setForm({...form, tenantId: e.target.value})}>
                      {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Title</label>
                  <input type="text" className="u-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Water Leakage" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea className="u-input min-h-[100px] py-4" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Provide more details..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Photo (Optional)</label>
                  <input type="file" accept="image/*" className="hidden" id="issue-upload" onChange={handleFileUpload} />
                  <label htmlFor="issue-upload" className={`flex items-center justify-center space-x-3 w-full p-4 border-2 border-dashed rounded-[24px] cursor-pointer transition-colors ${form.imageUrl ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                    {uploading ? <Loader2 size={24} className="animate-spin text-black" /> : form.imageUrl ? <CheckCircle2 size={24} /> : <Camera size={24} />}
                    <span className="font-bold">{uploading ? 'Uploading...' : form.imageUrl ? 'Photo Attached' : 'Take Photoc / Gallery'}</span>
                  </label>
                </div>
                <button type="submit" disabled={uploading} className="u-btn-primary w-full !py-4 text-lg">Report Issue</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
