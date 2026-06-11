import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Profile type
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

// Listing type (anuncios)
export interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  location: string | null;
  type: string;
  category: string; // 'property', 'vehicle', 'land'
  source: string | null; // e.g., 'idealista', 'fotocasa'
  external_id: string | null;
  url_original: string | null; // deprecated, use source_url
  source_url: string | null;
  image_url: string | null; // deprecated, use images
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

// Alert type (alertas)
export interface Alert {
  id: string;
  user_id: string;
  type: string | null;
  category: string | null; // 'property', 'vehicle', 'land'
  max_price: number | null;
  location: string | null;
  keywords: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Favorite type (favoritos)
export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing?: Listing;
}

// Notification type (notificaciones)
export interface Notification {
  id: string;
  user_id: string;
  listing_id: string;
  alert_id: string;
  is_read: boolean;
  created_at: string;
  listing?: Listing;
  alert?: Alert;
}
