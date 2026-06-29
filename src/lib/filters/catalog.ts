export type ListingCategory = 'vehicle' | 'property' | 'land';

export type FilterKey =
  | 'category'
  | 'type'
  | 'max_price'
  | 'location'
  | 'keywords'
  | 'query'
  | 'priceMin'
  | 'priceMax'
  | 'source'
  | 'sortBy';

export type FilterTarget = 'search' | 'alerts';

export type FilterDefinition = {
  key: FilterKey;
  label: string;
  target: FilterTarget;
  supported: true;
};

export type CategoryDefinition = {
  category: ListingCategory;
  label: string;
  filters: FilterDefinition[];
  types: { value: string; label: string }[];
};

/**
 * Fuente única de filtros por categoría.
 *
 * Fase 1: únicamente incluye filtros soportados por la base de datos.
 * (No añade campos avanzados como marca/modelo/etc.)
 */
export const CATEGORIES: CategoryDefinition[] = [
  {
    category: 'vehicle',
    label: 'Vehiculos',
    // Importante: en fase 1 limitamos lo que existe en DB.
    // Hoy no hay filtros avanzados por vehículo: solo `type` (cuando aplique) y el resto es genérico.
    types: [
      { value: 'otros', label: 'Otros' },
    ],
    filters: [
      // Search
      { key: 'category', label: 'Categoria', target: 'search', supported: true },
      { key: 'type', label: 'Tipo', target: 'search', supported: true },
      { key: 'priceMin', label: 'Precio minimo', target: 'search', supported: true },
      { key: 'priceMax', label: 'Precio maximo', target: 'search', supported: true },
      { key: 'location', label: 'Ubicacion', target: 'search', supported: true },
      { key: 'source', label: 'Fuente', target: 'search', supported: true },
      { key: 'sortBy', label: 'Ordenar por', target: 'search', supported: true },
      { key: 'query', label: 'Busqueda', target: 'search', supported: true },

      // Alerts
      { key: 'category', label: 'Categoria', target: 'alerts', supported: true },
      { key: 'type', label: 'Tipo de anuncio', target: 'alerts', supported: true },
      { key: 'max_price', label: 'Precio maximo', target: 'alerts', supported: true },
      { key: 'location', label: 'Ubicacion', target: 'alerts', supported: true },
      { key: 'keywords', label: 'Palabras clave', target: 'alerts', supported: true },
    ],
  },
  {
    category: 'property',
    label: 'Inmuebles',
    types: [
      { value: 'vivienda', label: 'Vivienda' },
      { value: 'local', label: 'Local Comercial' },
      { value: 'otros', label: 'Otros' },
    ],
    filters: [
      // Search
      { key: 'category', label: 'Categoria', target: 'search', supported: true },
      { key: 'type', label: 'Tipo', target: 'search', supported: true },
      { key: 'priceMin', label: 'Precio minimo', target: 'search', supported: true },
      { key: 'priceMax', label: 'Precio maximo', target: 'search', supported: true },
      { key: 'location', label: 'Ubicacion', target: 'search', supported: true },
      { key: 'source', label: 'Fuente', target: 'search', supported: true },
      { key: 'sortBy', label: 'Ordenar por', target: 'search', supported: true },
      { key: 'query', label: 'Busqueda', target: 'search', supported: true },

      // Alerts
      { key: 'category', label: 'Categoria', target: 'alerts', supported: true },
      { key: 'type', label: 'Tipo de anuncio', target: 'alerts', supported: true },
      { key: 'max_price', label: 'Precio maximo', target: 'alerts', supported: true },
      { key: 'location', label: 'Ubicacion', target: 'alerts', supported: true },
      { key: 'keywords', label: 'Palabras clave', target: 'alerts', supported: true },
    ],
  },
  {
    category: 'land',
    label: 'Terrenos',
    types: [
      { value: 'terreno', label: 'Terreno' },
      { value: 'otros', label: 'Otros' },
    ],
    filters: [
      // Search
      { key: 'category', label: 'Categoria', target: 'search', supported: true },
      { key: 'type', label: 'Tipo', target: 'search', supported: true },
      { key: 'priceMin', label: 'Precio minimo', target: 'search', supported: true },
      { key: 'priceMax', label: 'Precio maximo', target: 'search', supported: true },
      { key: 'location', label: 'Ubicacion', target: 'search', supported: true },
      { key: 'source', label: 'Fuente', target: 'search', supported: true },
      { key: 'sortBy', label: 'Ordenar por', target: 'search', supported: true },
      { key: 'query', label: 'Busqueda', target: 'search', supported: true },

      // Alerts
      { key: 'category', label: 'Categoria', target: 'alerts', supported: true },
      { key: 'type', label: 'Tipo de anuncio', target: 'alerts', supported: true },
      { key: 'max_price', label: 'Precio maximo', target: 'alerts', supported: true },
      { key: 'location', label: 'Ubicacion', target: 'alerts', supported: true },
      { key: 'keywords', label: 'Palabras clave', target: 'alerts', supported: true },
    ],
  },
];

export function getCategoryDefinition(category: ListingCategory): CategoryDefinition {
  const def = CATEGORIES.find((c) => c.category === category);
  if (!def) throw new Error(`Unknown category: ${category}`);
  return def;
}

export function getAllCategoryOptions(): { value: ListingCategory; label: string }[] {
  return CATEGORIES.map((c) => ({ value: c.category, label: c.label }));
}

export function getTypesForCategory(category: ListingCategory | '' | null | undefined): { value: string; label: string }[] {
  if (!category) {
    // Si no hay categoría, mostramos los tipos globales compatibles con la UI actual.
    // Esto preserva el comportamiento existente (filtro por tipos sin categoría previa).
    return [
      { value: 'terreno', label: 'Terreno' },
      { value: 'vivienda', label: 'Vivienda' },
      { value: 'local', label: 'Local Comercial' },
      { value: 'nave', label: 'Nave Industrial' },
      { value: 'otros', label: 'Otros' },
    ];
  }

  return getCategoryDefinition(category).types;
}

