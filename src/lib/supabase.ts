
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis do Supabase não configuradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos TypeScript para as tabelas
export interface Family {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  first_name: string;
  last_name: string;
  birth_date?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  photo_url?: string;
  role: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SystemUser {
  id: string;
  user_id?: string;
  username: string;
  family_id?: string;
  member_id?: string;
  user_type: 'admin' | 'member';
  is_active: boolean;
  is_first_login?: boolean;
  failed_attempts?: number;
  is_blocked?: boolean;
  blocked_at?: string;
  password_hash?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}
