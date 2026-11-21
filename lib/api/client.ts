/**
 * Client for communicating with the BrandVault FastAPI backend.
 */

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brandvault-ai-r8fr.onrender.com';

export interface ApiClientOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function backendFetch<T = any>(
  path: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { token, params, headers, ...rest } = options;

  let url = `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const query = searchParams.toString();
    if (query) {
      url += (url.includes('?') ? '&' : '?') + query;
    }
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Abort after 3.5s timeout by default to avoid hanging on cold-start or sleeping backends
  const timeoutSignal = AbortSignal.timeout(3500);
  const fetchSignal = rest.signal || timeoutSignal;

  const response = await fetch(url, {
    ...rest,
    signal: fetchSignal,
    headers: reqHeaders,
  });

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    const message = (errorData && (errorData.detail || errorData.message)) || `API Error: ${response.status} ${response.statusText}`;
    throw new ApiError(message, response.status, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const backendApi = backendFetch;
