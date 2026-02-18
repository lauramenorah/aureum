import { NextRequest, NextResponse } from 'next/server';
import { getPaxosClient } from '@/lib/paxos/client';

export async function GET(request: NextRequest) {
  try {
    const paxos = getPaxosClient();
    const { searchParams } = new URL(request.url);

    const params: Record<string, string> = {};
    if (searchParams.get('profile_id')) params.profile_id = searchParams.get('profile_id')!;
    if (searchParams.get('type')) params.type = searchParams.get('type')!;
    if (searchParams.get('limit')) params.limit = searchParams.get('limit')!;
    if (searchParams.get('cursor')) params.cursor = searchParams.get('cursor')!;

    const data = await paxos.get('/transfer/transfers', params);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error },
      { status: error.status || 500 }
    );
  }
}
