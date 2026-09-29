import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TARGET project credentials — these come from the TARGET's own .env file.
// Never replace them with another project's URL or keys.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Session persistence:
// - Browser / Expo / React Native (window exists): real AsyncStorage (localStorage
//   on web), so the login survives a refresh.
// - Static rendering on the server (no window): no-op storage. AsyncStorage reads
//   `window` at call time and would crash `expo export` / static HTML generation
//   with "window is not defined".
const storage =
  typeof window === 'undefined'
    ? {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
      }
    : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
