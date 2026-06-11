import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Notification, Listing, Alert } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { formatPrice, formatRelativeDate, cn } from '../lib/utils';
import { Bell, BellOff, MapPin, Eye, CheckCheck, Trash2, ExternalLink, Euro } from 'lucide-react';

const LISTING_TYPES = [
  { value: 'terreno', label: 'Terreno' },
  { value: 'vivienda', label: 'Vivienda' },
  { value: 'local', label: 'Local Comercial' },
  { value: 'nave', label: 'Nave Industrial' },
  { value: 'otros', label: 'Otros' },
];

export function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, listings(*), alerts(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Notification & { listings: Listing | null; alerts: Alert | null })[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await supabase.from('notifications').delete().eq('id', notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    navigate(`/listing/${notification.listing_id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            <Bell className="text-emerald-400" size={28} />
            Notificaciones
          </h1>
          <p className="text-slate-400 mt-1">
            {notifications.length === 0
              ? 'Sin notificaciones'
              : `${unreadCount} sin leer de ${notifications.length} totales`}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCheck size={18} />
            Marcar todas como leidas
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-slate-800/50 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-slate-700 rounded w-1/3 mb-4" />
              <div className="h-4 bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-slate-800/30 rounded-2xl p-12 text-center border border-dashed border-slate-700">
          <BellOff className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-medium text-white mb-2">Sin notificaciones</h3>
          <p className="text-slate-400 mb-4">Crea alertas para recibir notificaciones de nuevas oportunidades</p>
          <button
            onClick={() => navigate('/alerts')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
          >
            Crear alerta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'bg-slate-800/50 backdrop-blur-xl border rounded-2xl p-4 transition-all cursor-pointer hover:border-slate-600',
                notification.is_read ? 'border-slate-700/50' : 'border-emerald-500/50 bg-emerald-500/5'
              )}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex gap-4">
                {/* Listing Image */}
                <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-700">
                  <img
                    src={(notification.listings?.images && notification.listings.images.length > 0)
                      ? notification.listings.images[0]
                      : notification.listings?.image_url || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt={notification.listings?.title || 'Listing'}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
                        )}
                        <p className="text-xs text-slate-400">
                          {formatRelativeDate(notification.created_at)}
                        </p>
                      </div>
                      <h3 className="font-medium text-white line-clamp-2">
                        {notification.listings?.title || 'Anuncio no disponible'}
                      </h3>
                      {notification.listings?.location && (
                        <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-sm">
                          <MapPin size={14} />
                          <span className="truncate">{notification.listings.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-lg font-bold text-white">
                          {formatPrice(notification.listings?.price || 0)}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300">
                          {notification.listings?.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Alert Info */}
                  {notification.alerts && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-1">Coincide con tu alerta:</p>
                      <div className="flex flex-wrap gap-2">
                        {notification.alerts.type && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs">
                            {LISTING_TYPES.find((t) => t.value === notification.alerts?.type)?.label || notification.alerts.type}
                          </span>
                        )}
                        {notification.alerts.max_price && (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs flex items-center gap-1">
                            <Euro size={10} />
                            Hasta {formatPrice(notification.alerts.max_price)}
                          </span>
                        )}
                        {notification.alerts.location && (
                          <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 rounded text-xs flex items-center gap-1">
                            <MapPin size={10} />
                            {notification.alerts.location}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationClick(notification);
                    }}
                    className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
                    title="Ver anuncio"
                  >
                    <Eye size={18} />
                  </button>
                  {notification.listings?.url_original && (
                    <a
                      href={notification.listings.url_original}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
                      title="Ver en origen"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(notification.id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700/50"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
