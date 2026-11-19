import { Storage } from './adapter';
import { FileStorage } from './file-adapter';
import { SupabaseStorage } from './supabase-adapter';

export function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  return Boolean(url && secretKey);
}

export function getStorage(): Storage {
  if (hasSupabaseConfig()) {
    return new SupabaseStorage();
  }
  return new FileStorage();
}

export const storage = getStorage();
