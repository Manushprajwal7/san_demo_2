import { createClient as createClientComponent } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// This is a client-side only client
export function createClient() {
  return createClientComponent<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  );
}

// This is a server-side client that can bypass RLS
export function createServiceRoleClient() {
  return createClientComponent<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
