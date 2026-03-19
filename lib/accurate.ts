import crypto from 'crypto';

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
    throw new Error(
      'ACCURATE_API_TOKEN and ACCURATE_SIGNATURE_SECRET must be set'
    );
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

  if (!res.ok) {
    console.error('❌ HTTP Error:', res.status, res.statusText);
    throw new Error(`Token verification failed: ${text}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error('❌ Failed to parse JSON response');
    throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
  }


  if (!data.s) {
    console.error('❌ Verification failed. Full response:', data);

    // Check for specific error messages
    if (data.error) {
      throw new Error(
        `API Error: ${data.error} - ${data.error_description || ''}`
      );
    }

    throw new Error(`Token verification failed: ${JSON.stringify(data)}`);
  }

  return data.d;
}

export async function accurateFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const apiToken = process.env.ACCURATE_API_TOKEN!;
  const signatureSecret = process.env.ACCURATE_SIGNATURE_SECRET!;

  if (!apiToken || !signatureSecret) {
    throw new Error(
      'ACCURATE_API_TOKEN and ACCURATE_SIGNATURE_SECRET must be set'
    );
  }

  // First, verify token to get the correct host
  const tokenData = await verifyApiToken();
  const host = tokenData.database?.host || tokenData['data usaha']?.host;

  if (!host) {
    throw new Error('Could not get host from token verification');
  }

  // Build full URL
  const url = `${host}${endpoint}`;

  // Generate timestamp and signature
  const timestamp = getCurrentTimestamp();
  const signature = generateSignature(timestamp, signatureSecret);


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
    console.error('❌ API Error:', text);

    try {
      const error = JSON.parse(text);
      throw new Error(JSON.stringify(error, null, 2));
    } catch {
      throw new Error(text);
    }
  }

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    console.warn('⚠️ Response is not JSON:', text.substring(0, 100));
    return text;
  }
}
let cachedHost: string | null = null;

export async function getHost(): Promise<string> {
  if (cachedHost) return cachedHost;
  const tokenData = await verifyApiToken();
  cachedHost = tokenData.database?.host || tokenData['data usaha']?.host;
  if (!cachedHost) throw new Error('Could not get host');
  return cachedHost;
}
