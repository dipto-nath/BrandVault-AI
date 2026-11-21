import { Storage } from './adapter';
import { FileStorage } from './file-adapter';
import { SupabaseStorage } from './supabase-adapter';

export function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  return Boolean(url && secretKey);
}

// Circuit breaker: once Supabase fails (e.g. ENOTFOUND, timeout, network failure),
// trip the circuit for 5 minutes so subsequent queries don't wait for DNS/network timeouts.
let isSupabaseOfflineUntil = 0;

class ResilientStorage {
  private primary: SupabaseStorage;
  private fallback: FileStorage;

  constructor() {
    this.primary = new SupabaseStorage();
    this.fallback = new FileStorage();
  }

  static create(): Storage {
    const instance = new ResilientStorage();
    return new Proxy(instance as any, {
      get(target, prop, receiver) {
        if (typeof (target.primary as any)[prop] === 'function') {
          return async (...args: any[]) => {
            // If circuit breaker is active, directly use local storage (0ms latency)
            if (Date.now() < isSupabaseOfflineUntil) {
              if (typeof (target.fallback as any)[prop] === 'function') {
                return (target.fallback as any)[prop](...args);
              }
            }

            try {
              // Enforce 1-second max timeout on Supabase queries so they never hang the UI
              let timeoutHandle: any;
              const timeoutPromise = new Promise((_, reject) => {
                timeoutHandle = setTimeout(() => reject(new Error('Supabase query timed out after 1000ms')), 1000);
              });

              const primaryPromise = (target.primary as any)[prop](...args).finally(() => {
                clearTimeout(timeoutHandle);
              });

              const res = await Promise.race([primaryPromise, timeoutPromise]);
              if (res === null && (prop === 'getDemoWorkspace' || prop === 'getWorkspace')) {
                const fbRes = await (target.fallback as any)[prop](...args);
                if (fbRes) return fbRes;
              }
              return res;
            } catch (err: any) {
              const msg = String(err?.message || err);
              // Trip circuit breaker on network/DNS errors or timeout
              if (
                msg.includes('fetch failed') ||
                msg.includes('ENOTFOUND') ||
                msg.includes('ECONNREFUSED') ||
                msg.includes('ETIMEDOUT') ||
                msg.includes('timed out') ||
                msg.includes('NetworkError')
              ) {
                // Trip circuit breaker for 5 minutes
                isSupabaseOfflineUntil = Date.now() + 5 * 60 * 1000;
                console.warn(`[Storage] Supabase unavailable (${msg.slice(0, 60)}). Routing to local fast storage for 5m.`);
                if (typeof (target.fallback as any)[prop] === 'function') {
                  return (target.fallback as any)[prop](...args);
                }
              }
              throw err;
            }
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as unknown as Storage;
  }
}

export function getStorage(): Storage {
  if (hasSupabaseConfig()) {
    return ResilientStorage.create();
  }
  return new FileStorage();
}

export const storage = getStorage();
