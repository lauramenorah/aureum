import { NextRequest, NextResponse } from 'next/server';
import { getPaxosClient } from '@/lib/paxos/client';

export async function GET(request: NextRequest) {
  try {
    const paxos = getPaxosClient();
    const { searchParams } = new URL(request.url);

    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => { params[key] = value; });

    const data = await paxos.get('/transfer/crypto-destination-addresses', params);
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

    // Paxos uses PUT to /transfer/crypto-destination-address (singular)
    // It creates the address if it doesn't exist
    const payload: Record<string, string> = {
      crypto_network: body.crypto_network,
      address: body.address,
    };
    if (body.name) payload.nickname = body.name;
    if (body.profile_id) payload.profile_id = body.profile_id;

    const data = await paxos.put('/transfer/crypto-destination-address', payload);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    const status = error.status || 500;
    let message = error.detail || error.message || error.title || 'Failed to save address';
    if (status === 403) {
      message = 'Insufficient API permissions to save destination addresses. The transfer:write_crypto_destination_address scope is required.';
    }
    return NextResponse.json(
      { error: message, details: error },
      { status }
    );
  }
}
