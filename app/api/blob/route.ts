import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';

export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.searchParams.get('path');
  if (!pathname) {
    return NextResponse.json({ error: 'missing path' }, { status: 400 });
  }

  const result = await get(pathname, { access: 'private' });
  if (!result || result.statusCode === 304) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType,
      'Content-Length': String(result.blob.size),
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
