import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';
import { Home, Building2, Users, AlertCircle, UserCircle, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  const user = useAuthStore(state => state.user);
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/properties', icon: Building2, label: 'Properties', hidden: user?.role === 'TENANT' },
    { path: '/notices', icon: Megaphone, label: 'Notices' },
    { path: '/tenants', icon: Users, label: 'Tenants', hidden: user?.role === 'TENANT' },
    { path: '/complaints', icon: AlertCircle, label: 'Activity' },
    { path: '/settings', icon: UserCircle, label: 'Account' },
  ].filter(i => !i.hidden);

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden relative pb-[80px]">
      <div className="flex-1 overflow-y-auto w-full max-w-[480px] mx-auto bg-white relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation: UC Style */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 pb-safe z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-[480px] mx-auto flex justify-around items-center h-[76px]">
          {navItems.map((item) => {
            const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="flex flex-col items-center justify-center space-y-1 w-full"
              >
                <motion.div
                  initial={false}
                  animate={{ scale: isActive ? 1 : 0.95 }}
                >
                  <Icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-colors duration-200 ${isActive ? 'text-black' : 'text-slate-300'}`} 
                  />
                </motion.div>
                <span className={`text-[10px] font-bold tracking-tight uppercase leading-none transition-colors duration-200 ${isActive ? 'text-black' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
