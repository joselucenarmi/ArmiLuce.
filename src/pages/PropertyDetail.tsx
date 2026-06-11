import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useState } from 'react';
import { formatPrice, formatNumber, getPropertyTypeLabel, getValuationColor, getValuationLabel, cn } from '../lib/utils';
import {
  ArrowLeft,
  MapPin,
  TrendingDown,
  Heart,
  Share2,
  ExternalLink,
  Bed,
  Bath,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [notes, setNotes] = useState('');

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, provinces(name), municipalities(name, avg_price_m2)')
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: { user } } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: isFavorite } = useQuery({
    queryKey: ['is-favorite', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('favorites')
        .select('id, notes')
        .eq('property_id', id!)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (data) setNotes(data.notes || '');
      return !!data;
    },
    enabled: !!user && !!id,
  });

  const favoriteMutation = useMutation({
    mutationFn: async (add: boolean) => {
      if (add) {
        await supabase.from('favorites').insert({ property_id: id!, user_id: user!.id, notes });
      } else {
        await supabase.from('favorites').delete().eq('property_id', id!).eq('user_id', user!.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-favorite', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 rounded-2xl overflow-hidden animate-pulse">
            <div className="w-full aspect-video bg-slate-700" />
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-800 rounded animate-pulse" />
            <div className="h-4 bg-slate-800 rounded animate-pulse w-2/3" />
            <div className="h-6 bg-slate-800 rounded animate-pulse w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <AlertTriangle className="mx-auto text-slate-600 mb-4" size={48} />
        <h2 className="text-xl font-semibold text-white mb-2">Propiedad no encontrada</h2>
        <button onClick={() => navigate('/search')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors">
          Volver a búsqueda
        </button>
      </div>
    );
  }

  const images = property.images?.length > 0
    ? property.images
    : ['https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1600'];

  const avgPriceM2Zone = property.municipalities?.avg_price_m2 || 0;
  const priceDiff = avgPriceM2Zone > 0 ? ((property.price_m2 - avgPriceM2Zone) / avgPriceM2Zone) * 100 : 0;
  const features = property.features as Record<string, unknown> || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={20} />
        Volver
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left - Images & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div
            className="relative bg-slate-800/50 rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => setShowGallery(true)}
          >
            <img
              src={images[currentImageIndex]}
              alt={property.title}
              className="w-full aspect-video object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % images.length); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl text-sm font-medium border ${getValuationColor(property.valuation)}`}>
              {getValuationLabel(property.valuation)}
            </div>
            {property.discount_percentage > 0 && (
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-red-500/90 backdrop-blur text-white text-sm font-medium rounded-xl flex items-center gap-1.5">
                <TrendingDown size={16} />
                -{property.discount_percentage}%
              </div>
            )}
          </div>

          {/* Title & Location */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">{property.title}</h1>
            <div className="flex items-center gap-2 mt-3 text-slate-400">
              <MapPin size={18} />
              <span>
                {property.address && `${property.address}, `}
                {property.municipalities?.name || property.provinces?.name || 'Sin ubicación'}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-sm text-slate-400">Precio</p>
              <p className="text-2xl font-bold text-white mt-1">{formatPrice(property.price)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-sm text-slate-400">Superficie</p>
              <p className="text-2xl font-bold text-white mt-1">{formatNumber(property.surface_m2)} m²</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-sm text-slate-400">Precio/m²</p>
              <p className="text-2xl font-bold text-white mt-1">{formatPrice(property.price_m2)}</p>
            </div>
            {property.estimated_profitability > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-sm text-emerald-400">Rentabilidad Est.</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{property.estimated_profitability}%</p>
              </div>
            )}
          </div>

          {/* Features */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Características</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <div className="text-slate-500"><ExternalLink size={20} /></div>
                <div>
                  <p className="text-xs text-slate-500">Tipo</p>
                  <p className="text-sm text-white">{getPropertyTypeLabel(property.property_type)}</p>
                </div>
              </div>
              {features.bedrooms && (
                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <Bed className="text-slate-500" size={20} />
                  <div>
                    <p className="text-xs text-slate-500">Habitaciones</p>
                    <p className="text-sm text-white">{features.bedrooms}</p>
                  </div>
                </div>
              )}
              {features.bathrooms && (
                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <Bath className="text-slate-500" size={20} />
                  <div>
                    <p className="text-xs text-slate-500">Baños</p>
                    <p className="text-sm text-white">{features.bathrooms}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <Calendar className="text-slate-500" size={20} />
                <div>
                  <p className="text-xs text-slate-500">Publicado</p>
                  <p className="text-sm text-white">{new Date(property.published_at).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Descripción</h2>
              <p className="text-slate-400 leading-relaxed">{property.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Valuation Panel */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              Valoración
            </h3>

            <div className={`p-4 rounded-xl border ${getValuationColor(property.valuation)}`}>
              <div className="flex items-center gap-2">
                {property.valuation === 'excelente' && <CheckCircle className="text-emerald-400" size={24} />}
                {property.valuation === 'buena' && <CheckCircle className="text-blue-400" size={24} />}
                {property.valuation === 'normal' && <Info className="text-slate-400" size={24} />}
                {property.valuation === 'sobrevalorado' && <AlertTriangle className="text-red-400" size={24} />}
                <span className="font-medium">{getValuationLabel(property.valuation)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Precio actual</span>
                <span className="text-white font-medium">{formatPrice(property.price_m2)}/m²</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Media de la zona</span>
                <span className="text-white font-medium">{formatPrice(avgPriceM2Zone)}/m²</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Diferencia</span>
                <span className={cn('font-medium', priceDiff < 0 ? 'text-emerald-400' : priceDiff > 0 ? 'text-red-400' : 'text-slate-400')}>
                  {priceDiff < 0 ? '' : '+'}{priceDiff.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 space-y-4">
            <button
              onClick={() => {
                if (!user) { navigate('/auth'); return; }
                favoriteMutation.mutate(!isFavorite);
              }}
              disabled={favoriteMutation.isPending}
              className={cn(
                'w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                isFavorite
                  ? 'bg-pink-500/10 border border-pink-500/50 text-pink-400 hover:bg-pink-500/20'
                  : 'bg-slate-700/50 border border-slate-600/50 text-white hover:bg-slate-700'
              )}
            >
              <Heart className={isFavorite ? 'fill-current' : ''} size={20} />
              {isFavorite ? 'Guardado' : 'Guardar'}
            </button>

            {isFavorite && (
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Notas personales</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Añade notas sobre esta propiedad..."
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm resize-none"
                  rows={3}
                />
              </div>
            )}

            <button
              onClick={async () => {
                if (navigator.share) {
                  await navigator.share({ title: property.title, url: window.location.href });
                } else {
                  await navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="w-full py-3 px-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
            >
              <Share2 size={20} />
              Compartir
            </button>

            {property.external_url && (
              <a
                href={property.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
              >
                <ExternalLink size={20} />
                Ver en origen
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Full Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </button>
          <button
            onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={32} />
          </button>
          <img
            src={images[currentImageIndex]}
            alt={property.title}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
