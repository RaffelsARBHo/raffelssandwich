// lib/accurate.ts
import crypto from 'crypto';

// Use globalThis so cached entries survive across requests in the same Next.js process.
const g = globalThis as any;
if (!g.__accurateCache) {
  g.__accurateCache = {
    host: null,
    expiry: 0,
    apiCache: {
      entries: new Map<string, { expiry: number; value: any }>(),
      inFlight: new Map<string, Promise<any>>(),
    },
  };
}

const CACHE_TTL_MS = 55 * 60 * 1000; // 55 minutes

const GET_CACHE_TTL_DEFAULT_MS = 30_000; // conservative: inventory/prices can change frequently
const GET_CACHE_TTL_MAX_ENTRIES = 250;

type AccurateFetchOptions = RequestInit & {
  // Disable caching for this call even if it's a GET.
  accurateCache?: boolean;
  // Override TTL for this call.
  cacheTtlMs?: number;
};

function generateSignature(timestamp: string, signatureSecret: string): string {
  const hmac = crypto.createHmac('sha256', signatureSecret);
  hmac.update(timestamp);
  return hmac.digest('base64');
}

function getCurrentTimestamp(): string {
  const now = new Date();
  const jakartaTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  );
  const day = String(jakartaTime.getDate()).padStart(2, '0');
  const month = String(jakartaTime.getMonth() + 1).padStart(2, '0');
  const year = jakartaTime.getFullYear();
  const hours = String(jakartaTime.getHours()).padStart(2, '0');
  const minutes = String(jakartaTime.getMinutes()).padStart(2, '0');
  const seconds = String(jakartaTime.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export async function verifyApiToken() {
  const apiToken = process.env.ACCURATE_API_TOKEN!;
  const signatureSecret = process.env.ACCURATE_SIGNATURE_SECRET!;

  if (!apiToken || !signatureSecret) {
    throw new Error('ACCURATE_API_TOKEN and ACCURATE_SIGNATURE_SECRET must be set');
  }

  const timestamp = getCurrentTimestamp();
  const signature = generateSignature(timestamp, signatureSecret);

  const res = await fetch('https://account.accurate.id/api/api-token.do', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'X-Api-Timestamp': timestamp,
      'X-Api-Signature': signature,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Token verification failed (HTTP ${res.status}): ${text}`);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from token endpoint: ${text.substring(0, 200)}`);
  }

  if (!data.s) throw new Error(`Token rejected: ${JSON.stringify(data)}`);
  return data.d;
}

export async function getHost(): Promise<string> {
  const cache = g.__accurateCache;
  const now = Date.now();

  if (cache.host && now < cache.expiry) {
    return cache.host;
  }

  const tokenData = await verifyApiToken();
  const host = tokenData.database?.host || tokenData['data usaha']?.host;

  if (!host) throw new Error('Could not get host from token verification');

  cache.host = host;
  cache.expiry = now + CACHE_TTL_MS;
  return host;
}

function ttlForEndpoint(endpoint: string): number {
  // Inventory/prices change frequently; keep these short.
  if (endpoint.includes('/accurate/api/item/detail.do')) return 30_000;
  if (endpoint.includes('/accurate/api/item/list.do')) return 30_000;
  if (endpoint.includes('/accurate/api/sales-invoice/list.do')) return 15_000;
  if (endpoint.includes('/accurate/api/customer/detail.do')) return 60_000;

  // Relatively stable reference data can be cached longer.
  if (endpoint.includes('/accurate/api/branch/list.do')) return 10 * 60_000;
  if (endpoint.includes('/accurate/api/item-category/list.do')) return 10 * 60_000;

  return GET_CACHE_TTL_DEFAULT_MS;
}

function getHeadersObject(h?: RequestInit['headers']): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) return Object.fromEntries(h.entries()) as Record<string, string>;
  return h as Record<string, string>;
}

export async function accurateFetch(endpoint: string, options: AccurateFetchOptions = {}) {
  const apiToken = process.env.ACCURATE_API_TOKEN!;
  const signatureSecret = process.env.ACCURATE_SIGNATURE_SECRET!;

  if (!apiToken || !signatureSecret) {
    throw new Error('ACCURATE_API_TOKEN and ACCURATE_SIGNATURE_SECRET must be set');
  }

  const method = (options.method ?? 'GET').toUpperCase();
  const cacheEnabled = method === 'GET' && options.accurateCache !== false;
  const ttlMs = options.cacheTtlMs ?? ttlForEndpoint(endpoint);

  const cacheKey = `${method}:${endpoint}`;
  const apiCache = g.__accurateCache.apiCache as {
    entries: Map<string, { expiry: number; value: any }>;
    inFlight: Map<string, Promise<any>>;
  };

  const doFetch = async () => {
    const host = await getHost();
    const url = `${host}${endpoint}`;
    const timestamp = getCurrentTimestamp();
    const signature = generateSignature(timestamp, signatureSecret);

    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'X-Api-Timestamp': timestamp,
        'X-Api-Signature': signature,
        ...getHeadersObject(options.headers),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      try {
        throw new Error(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  if (!cacheEnabled || ttlMs <= 0) return doFetch();

  const now = Date.now();
  const cached = apiCache.entries.get(cacheKey);
  if (cached && now < cached.expiry) return cached.value;

  const inflight = apiCache.inFlight.get(cacheKey);
  if (inflight) return inflight;

  const promise = doFetch()
    .then((value) => {
      // Avoid caching unsuccessful Accurate responses.
      if (
        typeof value === 'object' &&
        value !== null &&
        's' in value &&
        (value as any).s === false
      ) {
        return value;
      }

      apiCache.entries.set(cacheKey, { expiry: Date.now() + ttlMs, value });

      // Prevent unbounded memory growth.
      while (apiCache.entries.size > GET_CACHE_TTL_MAX_ENTRIES) {
        const oldestKey = apiCache.entries.keys().next().value as string | undefined;
        if (!oldestKey) break;
        apiCache.entries.delete(oldestKey);
      }

      return value;
    })
    .finally(() => {
      apiCache.inFlight.delete(cacheKey);
    });

  apiCache.inFlight.set(cacheKey, promise);
  return promise;
}