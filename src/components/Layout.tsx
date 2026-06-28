import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Bell, BellRing, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { SubscriptionStatus } from './SubscriptionStatus';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: unreadNotifications = 0 } = useQuery({
    queryKey: ['unread-notifications-header'],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);
      return count || 0;
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Buscar anuncios..."
                className="w-80 pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/search?q=${encodeURIComponent(e.currentTarget.value)}`);
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Premium Status */}
            <div className="hidden lg:flex items-center">
              <SubscriptionStatus />
            </div>

            {/* Notifications */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-slate-800/50"
            >
              {unreadNotifications > 0 ? <BellRing size={20} /> : <Bell size={20} />}
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* User */}
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-medium">
                {profile?.full_name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-sm font-medium text-white">{profile?.full_name || 'Usuario'}</p>
                <p className="text-xs text-slate-500">{profile?.email}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
