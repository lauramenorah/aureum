import { NextRequest, NextResponse } from 'next/server';
import { getPaxosClient } from '@/lib/paxos/client';

export async function GET(request: NextRequest) {
  try {
    const paxos = getPaxosClient();
    const { searchParams } = new URL(request.url);

    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => { params[key] = value; });

    const data = await paxos.get('/identity/identities', params);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const paxos = getPaxosClient();
    const body = await request.json();
    console.log('[identities POST] Request body:', JSON.stringify(body, null, 2));
    const data = await paxos.post('/identity/identities', body);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('[identities POST] Error:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error },
      { status: error.status || 500 }
    );
  }
}
