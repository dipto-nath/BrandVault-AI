import { createClient } from '@supabase/supabase-js';

// Strict 400ms timeout fetch for Supabase so network/DNS hiccups never hang server requests
const fetchWithTimeout: typeof fetch = (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 400);
  
  // Forward existing abort signal if present
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
};

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!;
  return createClient(
    url,
    key,
    {
      auth: { persistSession: false },
      global: {
        fetch: fetchWithTimeout,
      },
    }
  );
}
