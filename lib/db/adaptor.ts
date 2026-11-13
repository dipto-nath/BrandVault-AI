import { Storage } from './adapter';
import { FileStorage } from './file-adapter';
import { SupabaseStorage } from './supabase-adapter';

export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getStorage(): Storage {
  if (hasSupabaseConfig()) {
    return new SupabaseStorage();
  }
  return new FileStorage();
}

export const storage = getStorage();
