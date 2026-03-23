import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';
import { Building2, Plus, MapPin, Star, ChevronRight, X, Loader2, Camera, Trash2, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/client';
import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function Properties() {
  const { user } = useAuthStore();
  const isLandlord = user?.role === 'LANDLORD';
  const isCaretaker = user?.role === 'CARETAKER';
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const [form, setForm] = useState({
    name: '',
    address: '',
    units: '1',
    imageUrl: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties');
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure? This will delete all tenants, rent records, and assignments for this property. This action is irreversible.")) return;
    try {
      await api.delete(`/properties/${id}`);
      fetchProperties();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete");
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
      const storageRef = ref(storage, `properties/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setForm(f => ({ ...f, imageUrl: url }));
    } catch (error: any) {
      console.error("Storage Error:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address) return;
    
    try {
      await api.post('/properties', {
        name: form.name,
        address: form.address,
        units: parseInt(form.units),
        imageUrl: form.imageUrl
      });
      fetchProperties();
      setShowAdd(false);
      setForm({ name: '', address: '', units: '1', imageUrl: '' });
    } catch(err: any) {
      console.error(err);
      if (err.response?.status === 403 && err.response?.data?.error?.includes('Limit reached')) {
        setLimitError(err.response.data.error);
      } else {
        alert(`Property error: ${err.response?.data?.error || err.message}`);
      }
    }
  };

  const getImage = (prop: any, index: number) => {
    if (prop.imageUrl) return prop.imageUrl;
    const fallbacks = [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=40&w=200',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=40&w=200',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=40&w=200',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=40&w=200'
    ];
    return fallbacks[index % fallbacks.length];
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="bg-white min-h-screen pb-24 relative">
      <div className="px-6 pt-12 pb-6 border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur-md z-30">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-black line-clamp-1">
              {user?.role === 'TENANT' ? 'My Residence' : (isCaretaker ? 'Assigned Sites' : 'Properties')}
            </h2>
            <p className="text-slate-400 font-bold text-[13px] mt-1.5 uppercase tracking-wider">
              {user?.role === 'TENANT' ? 'Property Details' : (isCaretaker ? 'Your Managed Units' : `${properties.length} Active Listings`)}
            </p>
          </div>
          {isLandlord && (
            <motion.button 
              onClick={() => setShowAdd(true)}
              whileTap={{ scale: 0.95 }}
              className="bg-black text-white px-5 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-black/10 active:bg-slate-900"
            >
              <Plus size={20} />
              <span className="text-sm">Add New</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {properties.length === 0 && (
          <div className="bg-slate-50/50 rounded-[32px] p-12 text-center border-2 border-dashed border-slate-100 mt-10">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
              <Building2 size={32} className="text-slate-300" />
            </div>
            {user?.role === 'TENANT' ? (
              <>
                <h3 className="text-xl font-extrabold text-black">No Property Linked</h3>
                <p className="text-slate-400 font-medium text-[15px] mt-2 mb-8">No landlord has created your profile in their property data yet. Please contact your landlord to link your account.</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-extrabold text-black">Start Onboarding</h3>
                <p className="text-slate-400 font-medium text-[15px] mt-2 mb-8">{isCaretaker ? 'You have not been assigned any properties yet. Please contact the landlord.' : 'Add your first property to start managing tenants and tracking rent.'}</p>
                {isLandlord && <button onClick={() => setShowAdd(true)} className="u-btn-primary mx-auto">Add Property</button>}
              </>
            )}
          </div>
        )}
        
        {properties.map((prop, index) => (
          <motion.div 
            key={prop.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`u-card !p-0 overflow-hidden cursor-pointer transition-all duration-300 ${selectedId === prop.id ? 'ring-2 ring-black shadow-2xl' : 'hover:shadow-lg'}`}
            onClick={() => setSelectedId(selectedId === prop.id ? null : prop.id)}
          >
            {/* Property image banner */}
            <div className="h-40 w-full overflow-hidden relative">
              <img src={getImage(prop, index)} className="w-full h-full object-cover" alt={prop.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-[10px] font-extrabold text-white/80 uppercase tracking-widest">Verified</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white leading-tight line-clamp-1">{prop.name}</h3>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className="text-[10px] font-extrabold px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white uppercase tracking-widest border border-white/10">
                    {prop.units} Units
                  </span>
                  {isLandlord && (
                    <button 
                      onClick={(e) => handleDelete(e, prop.id)}
                      className="p-2 bg-rose-500/20 backdrop-blur-md rounded-full text-rose-200 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex p-4 items-center justify-between border-b border-slate-50">
              <div className="flex items-center text-slate-400 text-[13px] font-bold space-x-1.5 flex-1">
                <MapPin size={14} strokeWidth={3} className="shrink-0 text-slate-300" />
                <span className="truncate">{prop.address}</span>
              </div>
              <button className="p-2 text-slate-300">
                <ChevronRight size={20} className={`transition-transform duration-300 ${selectedId === prop.id ? 'rotate-90 text-black' : ''}`} />
              </button>
            </div>

            {/* Occupancy Stats */}
            <div className="px-5 py-4 bg-slate-50/50 flex items-center justify-between">
              <div className="flex space-x-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Occupied</p>
                  <p className="text-[15px] font-black text-emerald-600">{prop.tenants?.length || 0} Flats</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Vacant</p>
                  <p className="text-[15px] font-black text-rose-500">
                    {Math.max(0, (prop.units || 1) - (prop.tenants?.length || 0))} Flats
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Capacity</p>
                <p className="text-[15px] font-black text-black">{prop.units || 1} Total</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Property Modal */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[70] max-w-[480px] mx-auto overflow-y-auto max-h-[90vh] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10">
                <h3 className="text-2xl font-extrabold tracking-tight">Add Property</h3>
                <button onClick={() => { setShowAdd(false); setLimitError(null); }} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center active:rotate-90 transition-transform">
                  <X size={24} />
                </button>
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
                {/* Photo Upload */}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Property Photo</label>
                  <input type="file" accept="image/*" className="hidden" id="property-upload" onChange={handleFileUpload} />
                  <label htmlFor="property-upload" className={`flex flex-col items-center justify-center w-full rounded-[32px] cursor-pointer transition-all overflow-hidden ${form.imageUrl ? 'h-48 border-0' : 'h-36 border-2 border-dashed border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
                    {uploading ? (
                      <div className="flex flex-col items-center space-y-3">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                        <span className="text-slate-400 font-extrabold text-[12px] uppercase tracking-[0.2em]">Processing...</span>
                      </div>
                    ) : form.imageUrl ? (
                      <div className="w-full h-full relative group">
                        <img src={form.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-extrabold text-sm">Change Photo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-3 text-slate-400">
                        <Camera size={36} />
                        <span className="font-extrabold text-[12px] uppercase tracking-[0.2em]">Upload Photo</span>
                      </div>
                    )}
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Property Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Royal Villas" 
                    className="u-input"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Address</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sector 43, Gurgaon" 
                    className="u-input"
                    value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Number of Units</label>
                  <input 
                    type="number" 
                    placeholder="1" 
                    className="u-input"
                    value={form.units}
                    onChange={e => setForm({...form, units: e.target.value})}
                  />
                </div>

                <button type="submit" disabled={uploading} className="u-btn-primary w-full !py-5 text-lg shadow-xl shadow-black/20">
                  Confirm Addition
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
