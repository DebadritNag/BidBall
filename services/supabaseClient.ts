import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: any = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase environment variables not configured. Database features will be disabled.');
  // Create a dummy client that won't crash
  const dummyChain = () => ({
    select: () => dummyChain(),
    insert: () => dummyChain(),
    update: () => dummyChain(),
    delete: () => dummyChain(),
    eq: () => dummyChain(),
    single: async () => ({ data: null, error: null }),
    then: async () => ({ data: null, error: null }),
  });
  
  supabaseClient = {
    from: () => dummyChain(),
    auth: { 
      signUp: async () => ({ data: null, error: null }), 
      signIn: async () => ({ data: null, error: null }), 
      signOut: async () => ({ error: null }), 
      getUser: async () => ({ data: null, error: null }), 
      getSession: async () => ({ data: null, error: null }), 
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) 
    },
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) })
  };
}

export const supabase = supabaseClient;
