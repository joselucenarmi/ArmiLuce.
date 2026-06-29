import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, Listing } from '../lib/supabase';
import { formatPrice, formatNumber, cn } from '../lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  MapPin,
  Grid,
  List,
  Building2,
} from 'lucide-react';

import { getAllCategoryOptions, getTypesForCategory } from '../lib/filters/catalog';

const LISTING_TYPES = [
  { value: 'terreno', label: 'Terreno' },
  { value: 'vivienda', label: 'Vivienda' },
  { value: 'local', label: 'Local Comercial' },
  { value: 'nave', label: 'Nave Industrial' },
  { value: 'otros', label: 'Otros' },
] as const;



const SORT_OPTIONS = [
  { value: 'created_at', label: 'Mas recientes' },
  { value: 'price', label: 'Precio: Menor a Mayor' },
  { value: 'price-desc', label: 'Precio: Mayor a Menor' },
];

export function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [page, setPage] = useState(0);
  const pageSize = 12;

  const { data, isLoading } = useQuery({
    queryKey: ['listings-search', query, categories, types, priceMin, priceMax, location, source, sortBy, page],
    queryFn: async () => {
      let q = supabase.from('listings').select('*', { count: 'exact' });

      if (query) {
        q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);
      }
      if (categories.length > 0) {
        q = q.in('category', categories);
      }
      if (types.length > 0) {
        q = q.in('type', types);
      }
      if (priceMin) {
        q = q.gte('price', parseFloat(priceMin));
      }
      if (priceMax) {
        q = q.lte('price', parseFloat(priceMax));
      }
      if (location) {
        q = q.ilike('location', `%${location}%`);
      }
      if (source) {
        q = q.ilike('source', `%${source}%`);
      }

      switch (sortBy) {
        case 'price':
          q = q.order('price', { ascending: true });
          break;
        case 'price-desc':
          q = q.order('price', { ascending: false });
          break;
        default:
          q = q.order('created_at', { ascending: false });
      }

      const { data, error, count } = await q.range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw error;
      return { listings: data as Listing[], count: count || 0 };
    },
  });

  const listings = data?.listings || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const toggleArrayFilter = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string, current: string[]) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setCategories([]);
    setTypes([]);
    setPriceMin('');
    setPriceMax('');
    setLocation('');
    setSource('');
    setPage(0);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (query) count++;
    if (categories.length > 0) count++;
    if (types.length > 0) count++;
    if (priceMin || priceMax) count++;
    if (location) count++;
    if (source) count++;
    return count;
  }, [query, categories, types, priceMin, priceMax, location, source]);

  const getListingImage = (listing: Listing) => {
    if (listing.images && listing.images.length > 0) {
      return listing.images[0];
    }
    return listing.image_url || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Buscar Anuncios</h1>
          <p className="text-slate-400 mt-1">
            {isLoading ? 'Buscando...' : `${formatNumber(totalCount)} anuncios encontrados`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'px-4 py-2 rounded-xl border transition-all flex items-center gap-2',
              showFilters
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-800/50 border-slate-700/50 text-white hover:border-slate-600'
            )}
          >
            <SlidersHorizontal size={18} />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-emerald-500 text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

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

      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por titulo, descripcion o ubicacion..."
          className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Filtros</h3>
            <button onClick={clearFilters} className="text-sm text-slate-400 hover:text-white transition-colors">
              Limpiar todos
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {getAllCategoryOptions().map((cat) => (

                  <button
                    key={cat.value}
                    onClick={() => toggleArrayFilter(setCategories, cat.value, categories)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-all',
                      categories.includes(cat.value)
                        ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-900/50 border border-slate-700/50 text-slate-400 hover:border-slate-600'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Tipo</label>
              <div className="flex flex-wrap gap-2">
                {(
                  categories.length === 1
                    ? getTypesForCategory(categories[0] as import('../lib/filters/catalog').ListingCategory)
                    : LISTING_TYPES
                ).map((type) => (
                  <button
                    key={type.value}
                    onClick={() => toggleArrayFilter(setTypes, type.value, types)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-all',
                      types.includes(type.value)
                        ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-900/50 border border-slate-700/50 text-slate-400 hover:border-slate-600'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Precio</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Max"
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Ubicacion</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ciudad, zona..."
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>

            {/* Source */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Fuente</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="idealista, fotocasa..."
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-slate-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                  <div className="h-6 bg-slate-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-slate-800/30 rounded-2xl p-12 text-center border border-dashed border-slate-700">
            <Building2 className="mx-auto text-slate-600 mb-4" size={48} />
            <h3 className="text-lg font-medium text-white mb-2">Sin resultados</h3>
            <p className="text-slate-400">Prueba a ajustar los filtros de busqueda</p>
            <button onClick={clearFilters} className="mt-4 px-4 py-2 text-emerald-400 hover:text-emerald-300 transition-colors">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className={cn(viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3')}>
            {listings.map((listing) => (
              <button
                key={listing.id}
                onClick={() => navigate(`/listing/${listing.id}`)}
                className="group bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden text-left transition-all hover:border-slate-600 hover:shadow-lg hover:shadow-emerald-500/5"
              >
                <div className="relative">
                  <img
                    src={getListingImage(listing)}
                    alt={listing.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {listing.source && (
                      <span className="px-2 py-1 bg-blue-500/80 backdrop-blur text-white text-xs rounded-lg capitalize">
                        {listing.source}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span className="px-2 py-1 bg-slate-900/80 backdrop-blur text-white text-xs rounded-lg">
                      {listing.type}
                    </span>
                  </div>
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
                    <p className="text-xl font-bold text-white">{formatPrice(listing.price)}</p>
                    {listing.images && listing.images.length > 1 && (
                      <span className="text-xs text-slate-500">{listing.images.length} fotos</span>
                    )}
                  </div>
                  {listing.description && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">{listing.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-600 transition-colors"
            >
              Anterior
            </button>
            <span className="text-slate-400 text-sm">
              Pagina {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-600 transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
