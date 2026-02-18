import { NextRequest, NextResponse } from 'next/server';
import { getPaxosClient } from '@/lib/paxos/client';

export async function POST(request: NextRequest) {
  try {
    const paxos = getPaxosClient();
    const body = await request.json();

    const { profile_id, asset, amount, crypto_network } = body;
    if (!profile_id || !asset || !amount) {
      return NextResponse.json(
        { error: 'profile_id, asset, and amount are required' },
        { status: 400 }
      );
    }

    const payload: Record<string, string> = { asset, amount };
    if (crypto_network) {
      payload.crypto_network = crypto_network;
    }

    const data = await paxos.post(`/sandbox/profiles/${profile_id}/deposit`, payload);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error },
      { status: error.status || 500 }
    );
  }
}
