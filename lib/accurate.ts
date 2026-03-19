// lib/accurate.ts
import crypto from 'crypto';

// ✅ Use globalThis to persist cache across requests in Next.js
// Module-level vars get reset in serverless — globalThis persists in the same process
const g = globalThis as any;
if (!g.__accurateCache) {
  g.__accurateCache = { host: null, expiry: 0 };
}

const CACHE_TTL_MS = 55 * 60 * 1000; // 55 minutes

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
    return cache.host; // ✅ Return cached host without any API call
  }

  console.log('🔄 Refreshing Accurate host from token...');
  const tokenData = await verifyApiToken();
  const host = tokenData.database?.host || tokenData['data usaha']?.host;

  if (!host) throw new Error('Could not get host from token verification');

  cache.host = host;
  cache.expiry = now + CACHE_TTL_MS;
  console.log('✅ Host cached:', host);
  return host;
}

export async function accurateFetch(endpoint: string, options: RequestInit = {}) {
  const apiToken = process.env.ACCURATE_API_TOKEN!;
  const signatureSecret = process.env.ACCURATE_SIGNATURE_SECRET!;

  if (!apiToken || !signatureSecret) {
    throw new Error('ACCURATE_API_TOKEN and ACCURATE_SIGNATURE_SECRET must be set');
  }

  const host = await getHost();
  const url = `${host}${endpoint}`;
  const timestamp = getCurrentTimestamp();
  const signature = generateSignature(timestamp, signatureSecret);

  console.log('📡 accurateFetch:', url);

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'X-Api-Timestamp': timestamp,
      'X-Api-Signature': signature,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('❌ Accurate API HTTP error:', res.status, text.substring(0, 300));
    try {
      throw new Error(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
  }

  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (!json.s) {
      console.warn('⚠️ Accurate s:false —', JSON.stringify(json).substring(0, 200));
    }
    return json;
  } catch {
    console.warn('⚠️ Response is not JSON:', text.substring(0, 100));
    return text;
  }
}