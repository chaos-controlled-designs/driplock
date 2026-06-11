import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  school_id: string;
  grade?: string;
  bio?: string;
  usual_dress_size?: string;
  bust_inches?: number;
  waist_inches?: number;
  hips_inches?: number;
  created_at: string;
};

export type Listing = {
  id: string;
  user_id: string;
  title: string;
  designer?: string;
  color?: string;
  silhouette?: string;
  dress_size: string;
  bust_inches?: number;
  waist_inches?: number;
  hips_inches?: number;
  condition: string;
  category: string;
  listing_type: 'rent' | 'sell' | 'both';
  price_cents?: number;
  rental_price_cents?: number;
  deposit_cents?: number;
  ships: boolean;
  local_meetup: boolean;
  description?: string;
  photo_urls: string[];
  is_available: boolean;
  created_at: string;
  profiles?: Profile;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export const CONDITIONS = [
  { value: 'new_with_tags',    label: '🏷️ New with tags — never worn' },
  { value: 'new_without_tags', label: '✨ New without tags — worn once' },
  { value: 'like_new',         label: '💫 Like new — excellent condition' },
  { value: 'good',             label: '👍 Good — minor signs of wear' },
  { value: 'fair',             label: '🔧 Fair — visible wear, priced accordingly' },
];

export const SILHOUETTES = ['A-Line', 'Ball Gown', 'Mermaid', 'Trumpet', 'Sheath', 'Empire', 'Two-Piece'];

export const DRESS_SIZES = ['00', '0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20'];