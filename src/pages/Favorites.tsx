import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Listing, Favorite } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { formatPrice, formatNumber, cn } from '../lib/utils';
import { Heart, Trash2, Search, Grid, List, MapPin, Calendar } from 'lucide-react';

type FavoriteWithListing = Favorite & { listings?: Listing | null };

export function Favorites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('created_at');
  const [query, setQuery] = useState('');

  const { data: favorites = [], isLoading } = useQuery<FavoriteWithListing[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*, listings(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as FavoriteWithListing[]) || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      await supabase.from('favorites').delete().eq('id', favoriteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const filteredFavorites = favorites.filter((fav) => {
    if (!query) return true;
    const searchLower = query.toLowerCase();
    return fav.listings?.title?.toLowerCase().includes(searchLower) ||
           fav.listings?.location?.toLowerCase().includes(searchLower);
  });

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    switch (sortBy) {
      case 'price': return (a.listings?.price || 0) - (b.listings?.price || 0);
      case 'price-desc': return (b.listings?.price || 0) - (a.listings?.price || 0);
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            <Heart className="text-pink-400" size={28} />
            Favoritos
          </h1>
          <p className="text-slate-400 mt-1">{formatNumber(favorites.length)} anuncios guardados</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en favoritos..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
          >
            <option value="created_at">Recientes</option>
            <option value="price">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
          </select>

          <div className="flex bg-slate-800/50 border border-slate-700/50 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-2 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white')}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-2 rounded-lg transition-colors', viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white')}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-slate-800/50 rounded-2xl overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-slate-700" />
            </div>
          ))}
        </div>
      ) : sortedFavorites.length === 0 ? (
        <div className="bg-slate-800/30 rounded-2xl p-12 text-center border border-dashed border-slate-700">
          <Heart className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-medium text-white mb-2">{query ? 'Sin resultados' : 'Sin favoritos aún'}</h3>
          <p className="text-slate-400 mb-4">{query ? 'No se encontraron anuncios' : 'Guarda anuncios para revisar más tarde'}</p>
          {query ? (
            <button onClick={() => setQuery('')} className="px-4 py-2 text-emerald-400 hover:text-emerald-300 transition-colors">
              Limpiar búsqueda
            </button>
          ) : (
            <button onClick={() => navigate('/search')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors">
              Explorar anuncios
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFavorites.map((fav) => (
            <FavoriteCard
              key={fav.id}
              favorite={fav}
              listing={fav.listings ?? null}
              onRemove={() => deleteMutation.mutate(fav.id)}
              onClick={() => navigate(`/listing/${fav.listings?.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedFavorites.map((fav) => (
            <FavoriteListItem
              key={fav.id}
              favorite={fav}
              listing={fav.listings ?? null}
              onRemove={() => deleteMutation.mutate(fav.id)}
              onClick={() => navigate(`/listing/${fav.listings?.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FavoriteCard({ favorite, listing, onRemove, onClick }: { favorite: FavoriteWithListing; listing: Listing | null; onRemove: () => void; onClick: () => void }) {
  const image = (listing?.images && listing.images.length > 0)
    ? listing.images[0]
    : listing?.image_url || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="relative cursor-pointer group" onClick={onClick}>
        <img
          src={image}
          alt={listing?.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-3 right-3 px-2 py-1 bg-slate-900/80 backdrop-blur text-white text-xs rounded-lg">
          {listing?.type}
        </span>
      </div>

      <div className="p-4">
        <button onClick={onClick} className="text-left w-full">
          <h3 className="font-medium text-white line-clamp-2 hover:text-emerald-400 transition-colors">
            {listing?.title}
          </h3>
        </button>
        {listing?.location && (
          <div className="flex items-center gap-1.5 mt-2 text-slate-400 text-sm">
            <MapPin size={14} />
            <span className="truncate">{listing.location}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <p className="text-lg font-bold text-white">{formatPrice(listing?.price || 0)}</p>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar size={12} />
            Guardado hace {Math.ceil((Date.now() - new Date(favorite.created_at).getTime()) / (1000 * 60 * 60 * 24))}d
          </p>
          <button
            onClick={onRemove}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700/50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FavoriteListItem({ favorite, listing, onRemove, onClick }: { favorite: FavoriteWithListing; listing: Listing | null; onRemove: () => void; onClick: () => void }) {
  const image = (listing?.images && listing.images.length > 0)
    ? listing.images[0]
    : listing?.image_url || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <button onClick={onClick} className="md:w-64 flex-shrink-0">
          <img src={image} alt={listing?.title} className="w-full h-40 md:h-full object-cover" />
        </button>
        <div className="flex-1 p-4 md:p-6">
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300">
              {listing?.type}
            </span>
          </div>
          <button onClick={onClick} className="text-left">
            <h3 className="text-lg font-medium text-white hover:text-emerald-400 transition-colors">
              {listing?.title}
            </h3>
          </button>
          {listing?.location && (
            <div className="flex items-center gap-1.5 mt-2 text-slate-400 text-sm">
              <MapPin size={14} />
              <span>{listing.location}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div>
              <p className="text-2xl font-bold text-white">{formatPrice(listing?.price || 0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700/50">
            <button
              onClick={onRemove}
              className="px-3 py-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700/50 text-sm flex items-center gap-1"
            >
              <Trash2 size={14} />
              Eliminar
            </button>
            <span className="text-xs text-slate-500">
              Guardado hace {Math.ceil((Date.now() - new Date(favorite.created_at).getTime()) / (1000 * 60 * 60 * 24))} días
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
