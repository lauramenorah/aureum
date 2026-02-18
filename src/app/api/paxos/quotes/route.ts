import { NextRequest, NextResponse } from 'next/server';
import { getPaxosClient } from '@/lib/paxos/client';

export async function GET(request: NextRequest) {
  try {
    const paxos = getPaxosClient();
    const { searchParams } = new URL(request.url);

    const params: Record<string, string> = {};
    if (searchParams.get('market')) params.market = searchParams.get('market')!;
    if (searchParams.get('side')) params.side = searchParams.get('side')!;
    if (searchParams.get('amount')) params.amount = searchParams.get('amount')!;
    if (searchParams.get('profile_id')) params.profile_id = searchParams.get('profile_id')!;

    const data = await paxos.get('/quotes', params);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error },
      { status: error.status || 500 }
    );
  }
}
