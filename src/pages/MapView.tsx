import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatNumber, getPropertyTypeLabel, getValuationColor, getValuationLabel, cn } from '../lib/utils';
import { MapPin, Building2, Star, Navigation, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';

const SPAIN_CENTER = { lat: 40.4168, lng: -3.7038 };

export function MapView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [center, setCenter] = useState(SPAIN_CENTER);
  const [zoom, setZoom] = useState(6);

  const propertyId = searchParams.get('property');

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, provinces(name), municipalities(name)')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('published_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data || [];
    },
  });

  const validProperties = properties.filter(
    (p: any) => p.latitude != null && p.longitude != null && !isNaN(p.latitude) && !isNaN(p.longitude)
  );

  if (isLoading) {
    return (
      <div className="h-[calc(100vh+32px)] -m-4 lg:-m-8 bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  const getMarkerPosition = (lat: number, lng: number) => {
    const x = ((lng + 9.3) / (3.2 + 9.3)) * 100;
    const y = ((43.7 - lat) / (43.7 - 36.0)) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  return (
    <div className="h-[calc(100vh+32px)] -m-4 lg:-m-8 relative">
      <div className="absolute inset-0 bg-slate-800 rounded-lg overflow-hidden">
        {validProperties.length > 0 ? (
          <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Map container */}
            <div className="absolute inset-4 rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
              {/* Markers */}
              {validProperties.map((property: any) => {
                const pos = getMarkerPosition(property.latitude, property.longitude);
                const isSelected = selectedProperty?.id === property.id;

                return (
                  <button
                    key={property.id}
                    className="absolute z-10 group"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                    onClick={() => setSelectedProperty(isSelected ? null : property)}
                  >
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center transition-all transform',
                      isSelected ? 'bg-emerald-500 scale-125 ring-4 ring-emerald-500/30' :
                      property.valuation === 'excelente' ? 'bg-emerald-500 hover:scale-110' :
                      property.valuation === 'buena' ? 'bg-blue-500 hover:scale-110' :
                      property.valuation === 'sobrevalorado' ? 'bg-red-500 hover:scale-110' : 'bg-slate-500 hover:scale-110'
                    )}>
                      <MapPin className="text-white" size={12} />
                    </div>

                    {/* Tooltip */}
                    {isSelected && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
                        <div className="bg-slate-900 rounded-lg px-3 py-2 shadow-xl border border-slate-700/50 min-w-[180px]">
                          <p className="text-white text-sm font-medium truncate">{property.title}</p>
                          <p className="text-emerald-400 text-sm mt-1">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.price)}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{property.surface_m2} m²</p>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stats Overlay */}
            <div className="absolute top-8 left-8 bg-slate-900/90 backdrop-blur rounded-xl p-4 border border-slate-700/50 shadow-xl">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-white font-medium">{formatNumber(validProperties.length)}</span>
                <span className="text-slate-400">propiedades en el mapa</span>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 left-8 flex flex-col gap-2">
              <button onClick={() => setZoom((z) => Math.min(12, z + 1))} className="w-10 h-10 bg-slate-900/90 backdrop-blur rounded-lg text-white flex items-center justify-center hover:bg-slate-800 transition-colors border border-slate-700/50">
                <ZoomIn size={18} />
              </button>
              <button onClick={() => setZoom((z) => Math.max(4, z - 1))} className="w-10 h-10 bg-slate-900/90 backdrop-blur rounded-lg text-white flex items-center justify-center hover:bg-slate-800 transition-colors border border-slate-700/50">
                <ZoomOut size={18} />
              </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-8 right-8 bg-slate-900/90 backdrop-blur rounded-xl p-3 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-2">Valoración</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-xs text-white">Excelente</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-xs text-white">Buena</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-500" /><span className="text-xs text-white">Normal</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-xs text-white">Sobrevalorado</span></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MapPin className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-400">No hay propiedades con ubicación disponible</p>
            </div>
          </div>
        )}
      </div>

      {/* Property Detail Slide-over */}
      {selectedProperty && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 shadow-2xl z-10 flex flex-col">
          <button onClick={() => setSelectedProperty(null)} className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin size={18} />
              <span className="text-sm">Detalle de propiedad</span>
            </div>
            <span className="text-slate-400 hover:text-white transition-colors">Cerrar</span>
          </button>

          <div className="flex-1 overflow-y-auto p-4">
            <img
              src={selectedProperty.images?.[0] || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800'}
              alt={selectedProperty.title}
              className="w-full aspect-video object-cover rounded-xl"
            />

            <div className={`mt-3 inline-flex px-2 py-1 rounded-lg text-xs font-medium border ${getValuationColor(selectedProperty.valuation)}`}>
              {getValuationLabel(selectedProperty.valuation)}
            </div>

            <h3 className="text-lg font-medium text-white mt-3">{selectedProperty.title}</h3>
            <div className="flex items-center gap-1.5 mt-2 text-slate-400 text-sm">
              <MapPin size={14} />
              <span>{selectedProperty.municipalities?.name || selectedProperty.provinces?.name || 'Sin ubicación'}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-800/50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Precio</p>
                <p className="text-lg font-bold text-white">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(selectedProperty.price)}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Superficie</p>
                <p className="text-lg font-bold text-white">{new Intl.NumberFormat('es-ES').format(selectedProperty.surface_m2)} m²</p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/property/${selectedProperty.id}`)}
              className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/25"
            >
              Ver detalle completo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
