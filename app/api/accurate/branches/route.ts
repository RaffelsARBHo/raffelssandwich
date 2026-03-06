// app/api/accurate/branches/route.ts
import { accurateFetch } from '@/lib/accurate';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await accurateFetch('/accurate/api/branch/list.do?fields=id,number,name', {
      method: 'GET',
    });

    console.log('📥 Branches response:', JSON.stringify(response, null, 2));

    if (!response.s) {
      return NextResponse.json(
        { success: false, error: response.d },
        { status: 400 }
      );
    }

    console.log('📥 Branches data:', JSON.stringify(response.d, null, 2));

    return NextResponse.json({
      success: true,
      branches: response.d,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}