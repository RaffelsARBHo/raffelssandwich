// app/api/accurate/image/route.ts
import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get('path');

    if (!imagePath) {
      return new NextResponse('Missing image path', { status: 400 });
    }

    const apiToken = process.env.ACCURATE_API_TOKEN!;
    const signatureSecret = process.env.ACCURATE_SIGNATURE_SECRET!;

    if (!apiToken || !signatureSecret) {
      return new NextResponse('Server configuration error', { status: 500 });
    }

    // Generate auth headers
    const timestamp = getCurrentTimestamp();
    const signature = generateSignature(timestamp, signatureSecret);

    // Construct full image URL
    const baseUrl = process.env.ACCURATE_BASE_URL || 'https://zeus.accurate.id';
    const imageUrl = imagePath.startsWith('http') ? imagePath : `${baseUrl}${imagePath}`;

    // Fetch image with authentication
    const response = await fetch(imageUrl, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'X-Api-Timestamp': timestamp,
        'X-Api-Signature': signature,
      },
    });

    if (!response.ok) {
      console.error('❌ Image fetch failed:', response.status, response.statusText);
      return new NextResponse('Image not found', { status: 404 });
    }

    // Get image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return image with caching headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('❌ Image proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}