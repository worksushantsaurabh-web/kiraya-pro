import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Megaphone, Plus, X, Loader2, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/client';

export function Notices() {
  const { user } = useAuthStore();
  const isLandlord = user?.role === 'LANDLORD';
  const [notices, setNotices] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: '',
    body: '',
    priority: 'NORMAL'
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.body) return;
    try {
      await api.post('/notices', form);
      fetchNotices();
      setShowAdd(false);
      setForm({ title: '', body: '', priority: 'NORMAL' });
    } catch (err) {
      alert("Failed to post notice");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notices/${id}`);
      fetchNotices();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const priorityConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    URGENT: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500', label: 'Urgent' },
    NORMAL: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', label: 'Update' },
    LOW: { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400', label: 'Info' },
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-black" /></div>;

  return (
    <div className="bg-white min-h-screen pb-24 relative">
      <div className="px-6 pt-12 pb-6 border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur-md z-30">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-black line-clamp-1">Notice Board</h2>
            <p className="text-slate-400 font-bold text-[13px] mt-1.5 uppercase tracking-wider">
              {notices.length} Announcements
            </p>
          </div>
          {isLandlord && (
            <motion.button onClick={() => setShowAdd(true)} whileTap={{ scale: 0.95 }} className="bg-black text-white px-5 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-black/10 h-12">
              <Plus size={20} /><span className="text-sm">Post</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {notices.length === 0 && (
          <div className="bg-slate-50/50 rounded-[32px] p-12 text-center border-2 border-dashed border-slate-100 mt-6">
            <Megaphone size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-xl font-extrabold text-black">No Announcements</h3>
            <p className="text-slate-400 font-medium text-[14px] mt-2">
              {isLandlord ? 'Post your first notice to keep tenants informed.' : 'No updates from your landlord yet.'}
            </p>
          </div>
        )}

        {notices.map((notice, index) => {
          const config = priorityConfig[notice.priority] || priorityConfig.NORMAL;
          return (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`u-card !p-0 overflow-hidden ${notice.priority === 'URGENT' ? 'ring-1 ring-rose-200' : ''}`}
            >
              {/* Priority stripe */}
              <div className={`h-1.5 w-full ${config.dot}`} />
              
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.15em] ${config.bg} ${config.text}`}>
                      {config.label}
                    </span>
                    <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1">
                      <Clock size={10} />
                      <span>{timeAgo(notice.createdAt)}</span>
                    </span>
                  </div>
                  {isLandlord && (
                    <button onClick={() => handleDelete(notice.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <h3 className="text-[18px] font-extrabold text-black leading-tight mb-2">{notice.title}</h3>
                <p className="text-[14px] font-medium text-slate-500 leading-relaxed">{notice.body}</p>
                <p className="text-[11px] font-bold text-slate-300 mt-4 uppercase tracking-widest">— {notice.landlord?.name || 'Management'}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Post Notice Modal */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[70] max-w-[480px] mx-auto overflow-y-auto max-h-[90vh] shadow-2xl">
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10">
                <h3 className="text-2xl font-extrabold tracking-tight">Post Notice</h3>
                <button onClick={() => setShowAdd(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center active:rotate-90 transition-transform"><X size={24} /></button>
              </div>
              <form onSubmit={handlePost} className="space-y-6 pb-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['LOW', 'NORMAL', 'URGENT'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({ ...form, priority: p })}
                        className={`py-3.5 rounded-2xl text-[12px] font-extrabold uppercase tracking-widest border-2 transition-all ${
                          form.priority === p
                            ? p === 'URGENT' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' : p === 'NORMAL' ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-400 border-slate-100'
                        }`}
                      >
                        {p === 'LOW' ? 'Info' : p === 'NORMAL' ? 'Update' : 'Urgent'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Title</label>
                  <input type="text" className="u-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Water Supply Update" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Message</label>
                  <textarea className="u-input min-h-[120px] py-4" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Write your announcement here..." />
                </div>
                <button type="submit" className="u-btn-primary w-full !py-5 text-lg shadow-xl shadow-black/20">
                  <Megaphone size={20} /><span>Broadcast Notice</span>
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
