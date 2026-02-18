import { NextRequest, NextResponse } from 'next/server';
import { getPaxosClient } from '@/lib/paxos/client';

export async function GET(request: NextRequest) {
  try {
    const paxos = getPaxosClient();
    const { searchParams } = new URL(request.url);

    const endpoint = searchParams.get('endpoint');
    if (!endpoint) {
      return NextResponse.json(
        { error: 'endpoint query parameter is required (prices, tickers, historical_prices)' },
        { status: 400 }
      );
    }

    const validEndpoints = ['prices', 'tickers', 'historical_prices'];
    if (!validEndpoints.includes(endpoint)) {
      return NextResponse.json(
        { error: `Invalid endpoint. Must be one of: ${validEndpoints.join(', ')}` },
        { status: 400 }
      );
    }

    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        params[key] = value;
      }
    });

    const path = endpoint === 'historical_prices'
      ? '/pricing/historical-prices'
      : `/pricing/${endpoint}`;

    const data = await paxos.get(path, params);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error },
      { status: error.status || 500 }
    );
  }
}
