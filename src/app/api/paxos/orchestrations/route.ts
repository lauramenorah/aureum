import { NextRequest, NextResponse } from 'next/server';
import { getPaxosClient } from '@/lib/paxos/client';

export async function GET(request: NextRequest) {
  try {
    const paxos = getPaxosClient();
    const { searchParams } = new URL(request.url);

    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => { params[key] = value; });

    const data = await paxos.get('/orchestrations', params);
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
    const data = await paxos.post('/orchestrations', body);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error },
      { status: error.status || 500 }
    );
  }
}
