import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Listing } from '../lib/supabase';
import { useState, useMemo } from 'react';
import { formatPrice } from '../lib/utils';
import { ArrowLeft, MapPin, Heart, Share2, ExternalLink, Calendar, X, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { cn } from '../lib/utils';

export function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('listings').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as Listing;
    },
    enabled: !!id,
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: isFavorite } = useQuery({
    queryKey: ['is-favorite-listing', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('listing_id', id!)
        .eq('user_id', user!.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  const favoriteMutation = useMutation({
    mutationFn: async (add: boolean) => {
      if (add) {
        await supabase.from('favorites').insert({ listing_id: id!, user_id: user!.id });
      } else {
        await supabase.from('favorites').delete().eq('listing_id', id!).eq('user_id', user!.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-favorite-listing', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  // Get images from array or fallback to single image_url
  const images = useMemo(() => {
    if (listing?.images && listing.images.length > 0) {
      return listing.images;
    }
    if (listing?.image_url) {
      return [listing.image_url];
    }
    return ['https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1600'];
  }, [listing]);

  // Get source URL from source_url or fallback to url_original
  const sourceUrl = listing?.source_url || listing?.url_original;

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
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <p className="text-slate-400">Anuncio no encontrado</p>
        <button onClick={() => navigate('/search')} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl">
          Volver a busqueda
        </button>
      </div>
    );
  }

  const openGallery = (index: number) => {
    setCurrentImageIndex(index);
    setShowGallery(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={20} />
        Volver
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div
            className="relative bg-slate-800/50 rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => openGallery(0)}
          >
            <img
              src={images[currentImageIndex]}
              alt={listing.title}
              className="w-full aspect-video object-cover"
            />
            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                      )}
                    />
                  ))}
                </div>
              </>
            )}
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              {listing.source && (
                <span className="px-3 py-1.5 bg-blue-500/90 backdrop-blur text-white text-sm rounded-xl capitalize flex items-center gap-1">
                  <Tag size={14} />
                  {listing.source}
                </span>
              )}
            </div>
            <span className="absolute top-4 right-4 px-3 py-1.5 bg-slate-900/80 backdrop-blur text-white text-sm rounded-xl">
              {listing.type}
            </span>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.slice(0, 6).map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    'flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all',
                    index === currentImageIndex ? 'border-emerald-500' : 'border-transparent hover:border-slate-600'
                  )}
                >
                  <img src={img} alt={`${listing.title} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
              {images.length > 6 && (
                <button
                  onClick={() => openGallery(0)}
                  className="flex-shrink-0 w-20 h-16 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 text-sm"
                >
                  +{images.length - 6}
                </button>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">{listing.title}</h1>
            {listing.location && (
              <div className="flex items-center gap-2 mt-3 text-slate-400">
                <MapPin size={18} />
                <span>{listing.location}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-sm text-slate-400">Precio</p>
            <p className="text-3xl font-bold text-white mt-1">{formatPrice(listing.price)}</p>
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Descripcion</h2>
              <p className="text-slate-400 leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>
          )}

          {/* Details */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Detalles</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <div className="text-slate-500"><Calendar size={20} /></div>
                <div>
                  <p className="text-xs text-slate-500">Publicado</p>
                  <p className="text-sm text-white">{new Date(listing.created_at).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <div className="text-slate-500"><Tag size={20} /></div>
                <div>
                  <p className="text-xs text-slate-500">Categoria</p>
                  <p className="text-sm text-white capitalize">{listing.category}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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

            <button
              onClick={async () => {
                if (navigator.share) {
                  await navigator.share({ title: listing.title, url: window.location.href });
                } else {
                  await navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="w-full py-3 px-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
            >
              <Share2 size={20} />
              Compartir
            </button>

            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
              >
                <ExternalLink size={20} />
                {listing.source ? `Ver en ${listing.source}` : 'Ver en origen'}
              </a>
            )}
          </div>

          {/* Source Info */}
          {listing.source && (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4">
              <p className="text-xs text-slate-500 mb-1">Fuente</p>
              <p className="text-sm text-white capitalize">{listing.source}</p>
              {listing.external_id && (
                <p className="text-xs text-slate-500 mt-2">ID: {listing.external_id}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button onClick={() => setShowGallery(false)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
            <X size={24} />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
          <img src={images[currentImageIndex]} alt={listing.title} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
