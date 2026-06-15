import { useQuery } from '@tanstack/react-query';
import { supabase, Listing, Favorite } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { formatPrice, formatNumber } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';

type FavoriteWithListing = Favorite & { listings?: Listing | null };
import {
  TrendingUp,
  Bell,
  Heart,
  Building2,
  MapPin,
  Eye,
  ArrowRight,

} from 'lucide-react';

export function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        { count: totalListings },
        { count: favorites },
        { count: activeAlerts },
      ] = await Promise.all([
        supabase.from('listings').select('id', { count: 'exact', head: true }),
        supabase.from('favorites').select('id', { count: 'exact', head: true }),
        supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      return {
        totalListings: totalListings || 0,
        favorites: favorites || 0,
        activeAlerts: activeAlerts || 0,
      };
    },
  });

  const { data: recentListings = [] } = useQuery({
    queryKey: ['recent-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as Listing[];
    },
  });

  const { data: favorites = [] } = useQuery<FavoriteWithListing[]>({
    queryKey: ['dashboard-favorites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*, listings(*)')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      return (data as FavoriteWithListing[]) || [];
    },
  });

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Bienvenido, {profile?.full_name?.split(' ')[0] || 'Usuario'}
          </h1>
          <p className="text-slate-400 mt-1">Tu panel de oportunidades inmobiliarias</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/search"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <Eye size={18} />
            Explorar
          </Link>
          <Link
            to="/alerts"
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25"
          >
            <Bell size={18} />
            Nueva Alerta
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Building2 className="text-blue-400" size={20} />
            </div>
            <span className="text-xs text-slate-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats?.totalListings ? formatNumber(stats.totalListings) : '...'}
          </p>
          <p className="text-sm text-slate-400 mt-1">Anuncios</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
              <Heart className="text-pink-400" size={20} />
            </div>
            <span className="text-xs text-slate-500">Guardados</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats?.favorites !== undefined ? formatNumber(stats.favorites) : '...'}
          </p>
          <p className="text-sm text-slate-400 mt-1">Favoritos</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Bell className="text-emerald-400" size={20} />
            </div>
            <span className="text-xs text-slate-500">Activas</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats?.activeAlerts !== undefined ? formatNumber(stats.activeAlerts) : '...'}
          </p>
          <p className="text-sm text-slate-400 mt-1">Alertas</p>
        </div>
      </div>

      {/* Recent Listings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="text-emerald-400" size={20} />
            Anuncios Recientes
          </h2>
          <Link to="/search" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentListings.length > 0 ? (
            recentListings.map((listing) => {
              const imageUrl = (listing.images && listing.images.length > 0)
                ? listing.images[0]
                : listing.image_url || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800';

              return (
                <button
                  key={listing.id}
                  onClick={() => navigate(`/listing/${listing.id}`)}
                  className="group bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden text-left transition-all hover:border-slate-600"
                >
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt={listing.title}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {listing.source && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500/80 text-white text-xs rounded-lg capitalize">
                        {listing.source}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-white line-clamp-2 group-hover:text-emerald-400 transition-colors">
                      {listing.title}
                    </h3>
                    {listing.location && (
                      <div className="flex items-center gap-1.5 mt-2 text-slate-400 text-sm">
                        <MapPin size={14} />
                        <span className="truncate">{listing.location}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-lg font-bold text-white">{formatPrice(listing.price)}</p>
                      <span className="text-xs text-slate-500 px-2 py-1 bg-slate-700/50 rounded-lg">{listing.type}</span>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="col-span-full bg-slate-800/30 rounded-2xl p-8 text-center border border-dashed border-slate-700">
              <Building2 className="mx-auto text-slate-600 mb-3" size={40} />
              <p className="text-slate-400">No hay anuncios disponibles</p>
              <Link to="/search" className="mt-3 inline-block text-emerald-400 hover:text-emerald-300 text-sm">
                Ver todos los anuncios
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Favorites */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Heart className="text-pink-400" size={20} />
            Tus Favoritos
          </h2>
          <Link to="/favorites" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {favorites.length > 0 ? (
            favorites.map((fav) => {
              const imageUrl = (fav.listing?.images && fav.listing.images.length > 0)
                ? fav.listing.images[0]
                : fav.listing?.image_url || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800';

              return (
                <button
                  key={fav.id}
                  onClick={() => navigate(`/listing/${fav.listing?.id}`)}
                  className="group bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden text-left transition-all hover:border-slate-600"
                >
                  <img
                    src={imageUrl}
                    alt={fav.listing?.title}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-white truncate">{fav.listing?.title}</h3>
                    <p className="text-sm text-emerald-400 mt-1">{formatPrice(fav.listing?.price || 0)}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="col-span-full bg-slate-800/30 rounded-2xl p-8 text-center border border-dashed border-slate-700">
              <Heart className="mx-auto text-slate-600 mb-3" size={40} />
              <p className="text-slate-400">Aún no has guardado anuncios</p>
              <Link to="/search" className="mt-3 inline-block text-emerald-400 hover:text-emerald-300 text-sm">
                Explorar anuncios
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
