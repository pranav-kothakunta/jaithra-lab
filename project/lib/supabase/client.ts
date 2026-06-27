import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let browserSupabase: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase browser environment variables are not configured.');
  }

  if (!browserSupabase) {
    browserSupabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  return browserSupabase;
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = Reflect.get(client, prop, client);

    return typeof value === 'function' ? value.bind(client) : value;
  },
});
