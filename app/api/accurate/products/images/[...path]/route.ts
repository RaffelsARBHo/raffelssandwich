//app/api/accurate/images/[...path]/route.ts
import { NextResponse } from 'next/server';
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

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const imagePath = params.path.join('/');
    
    const apiToken = process.env.ACCURATE_API_TOKEN!;
    const signatureSecret = process.env.ACCURATE_SIGNATURE_SECRET!;

    if (!apiToken || !signatureSecret) {
      return NextResponse.json(
        { error: 'API credentials not configured' },
        { status: 500 }
      );
    }

    // Construct the full image URL (using zeus.accurate.id based on your logs)
    const imageUrl = `https://zeus.accurate.id/accurate/files/${imagePath}`;
    
    // Generate authentication headers
    const timestamp = getCurrentTimestamp();
    const signature = generateSignature(timestamp, signatureSecret);

    // Fetch the image with authentication
    const response = await fetch(imageUrl, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'X-Api-Timestamp': timestamp,
        'X-Api-Signature': signature,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Image not found', status: response.status },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch image', details: err.message },
      { status: 500 }
    );
  }
}