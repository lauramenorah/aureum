import { NextRequest, NextResponse } from 'next/server';
import { getPaxosClient } from '@/lib/paxos/client';

export async function GET(request: NextRequest) {
  try {
    const paxos = getPaxosClient();
    const { searchParams } = new URL(request.url);

    const market = searchParams.get('market');
    const type = searchParams.get('type');

    if (!market) {
      return NextResponse.json(
        { error: 'market query parameter is required' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'type query parameter is required (tickers, order-book, recent-executions)' },
        { status: 400 }
      );
    }

    const validTypes = ['tickers', 'order-book', 'recent-executions'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'type') {
        params[key] = value;
      }
    });

    const data = await paxos.get(`/markets/${market}/${type}`, params);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error },
      { status: error.status || 500 }
    );
  }
}
