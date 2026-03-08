/**
 * Ping Endpoint
 *
 * Lightweight endpoint for network quality testing.
 * Returns minimal response for latency measurement.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { ok: true, timestamp: Date.now() },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    }
  );
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
