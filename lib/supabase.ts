import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Server-side Supabase client with connection pooling
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey || supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'Connection': 'keep-alive',
      },
    },
  })
}

// Optimized client for bulk operations
export const createBulkOperationClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey || supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'Connection': 'keep-alive',
        'Prefer': 'return=minimal',
      },
    },
  })
}
