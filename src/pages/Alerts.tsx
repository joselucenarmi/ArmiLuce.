import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Alert } from '../lib/supabase';
import { cn } from '../lib/utils';


import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  Edit2,
  X,
  Euro,
  MapPin,
  Tag,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'property', label: 'Inmuebles' },
  { value: 'vehicle', label: 'Vehiculos' },
  { value: 'land', label: 'Terrenos' },
];

const LISTING_TYPES = [
  { value: 'terreno', label: 'Terreno' },
  { value: 'vivienda', label: 'Vivienda' },
  { value: 'local', label: 'Local Comercial' },
  { value: 'nave', label: 'Nave Industrial' },
  { value: 'otros', label: 'Otros' },
];

export function Alerts() {
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Alert[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await supabase.from('alerts').delete().eq('id', alertId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ alertId, isActive }: { alertId: string; isActive: boolean }) => {
      await supabase.from('alerts').update({ is_active: isActive }).eq('id', alertId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const getAlertTitle = (alert: Alert) => {
    if (alert.category) {
      return `Alerta: ${CATEGORIES.find(c => c.value === alert.category)?.label || alert.category}`;
    }
    if (alert.type) {
      return `Alerta: ${LISTING_TYPES.find(t => t.value === alert.type)?.label || alert.type}`;
    }
    return 'Alerta general';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Alertas</h1>
          <p className="text-slate-400 mt-1">Recibe notificaciones cuando aparezcan nuevas oportunidades</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25"
        >
          <Plus size={18} />
          Nueva Alerta
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800/50 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-slate-700 rounded w-1/3 mb-4" />
              <div className="h-4 bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-slate-800/30 rounded-2xl p-12 text-center border border-dashed border-slate-700">
          <Bell className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-medium text-white mb-2">Sin alertas activas</h3>
          <p className="text-slate-400 mb-4">Crea una alerta para recibir notificaciones de nuevas oportunidades</p>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors">
            Crear primera alerta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'bg-slate-800/50 backdrop-blur-xl border rounded-2xl p-6 transition-all',
                alert.is_active ? 'border-slate-700/50' : 'border-slate-800 opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      alert.is_active ? 'bg-emerald-500/10' : 'bg-slate-700'
                    )}>
                      {alert.is_active ? <Bell className="text-emerald-400" size={20} /> : <BellOff className="text-slate-400" size={20} />}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{getAlertTitle(alert)}</h3>
                      <p className="text-sm text-slate-400">{alert.is_active ? 'Activa' : 'Pausada'}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {alert.category && (
                      <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-400 flex items-center gap-1">
                        <Tag size={12} />
                        {CATEGORIES.find(c => c.value === alert.category)?.label || alert.category}
                      </span>
                    )}
                    {alert.type && (
                      <span className="px-2 py-1 bg-slate-700/50 rounded-lg text-xs text-slate-300">
                        Tipo: {LISTING_TYPES.find(t => t.value === alert.type)?.label || alert.type}
                      </span>
                    )}
                    {alert.max_price && (
                      <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-1">
                        <Euro size={12} />
                        Hasta {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(alert.max_price)}
                      </span>
                    )}
                    {alert.location && (
                      <span className="px-2 py-1 bg-pink-500/10 border border-pink-500/30 rounded-lg text-xs text-pink-400 flex items-center gap-1">
                        <MapPin size={12} />
                        {alert.location}
                      </span>
                    )}
                    {alert.keywords && (
                      <span className="px-2 py-1 bg-slate-700/50 rounded-lg text-xs text-slate-300">
                        "{alert.keywords}"
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMutation.mutate({ alertId: alert.id, isActive: !alert.is_active })}
                    className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
                  >
                    {alert.is_active ? <BellOff size={18} /> : <Bell size={18} />}
                  </button>
                  <button
                    onClick={() => setEditingAlert(alert)}
                    className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => { if (confirm('Eliminar esta alerta?')) deleteMutation.mutate(alert.id); }}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700/50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAlert) && (
        <AlertModal
          alert={editingAlert}
          onClose={() => { setShowCreateModal(false); setEditingAlert(null); }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingAlert(null);
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
          }}
        />
      )}
    </div>
  );
}

interface AlertModalProps {
  alert?: Alert | null;
  onClose: () => void;
  onSuccess: () => void;
}

function AlertModal({ alert, onClose, onSuccess }: AlertModalProps) {
  const [category, setCategory] = useState(alert?.category || '');
  const [type, setType] = useState(alert?.type || '');
  const [maxPrice, setMaxPrice] = useState(alert?.max_price?.toString() || '');
  const [location, setLocation] = useState(alert?.location || '');
  const [keywords, setKeywords] = useState(alert?.keywords || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      category: category || null,
      type: type || null,
      max_price: maxPrice ? parseFloat(maxPrice) : null,
      location: location || null,
      keywords: keywords || null,
    };

    let error;
    if (alert) {
      ({ error } = await supabase.from('alerts').update(data).eq('id', alert.id));
    } else {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();

      if (!sessionUser) {
        setLoading(false);
        return;
      }

      ({ error } = await supabase.from('alerts').insert({
        ...data,
        user_id: sessionUser.id,
        is_active: true,
      }));
    }

    setLoading(false);
    if (!error) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-800 rounded-2xl border border-slate-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700/50 p-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{alert ? 'Editar Alerta' : 'Nueva Alerta'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">Todas las categorias</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de anuncio</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">Todos los tipos</option>
              {LISTING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Precio maximo</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Ej: 200000"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Ubicacion</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Madrid, Barcelona..."
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Palabras clave</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Ej: piscina, jardin, terraza..."
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : alert ? 'Guardar' : 'Crear Alerta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
