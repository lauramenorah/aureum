import { NextRequest, NextResponse } from 'next/server';
import { getPaxosClient } from '@/lib/paxos/client';

export async function GET(request: NextRequest) {
  try {
    const paxos = getPaxosClient();
    const { searchParams } = new URL(request.url);

    const profileId = searchParams.get('profile_id');
    if (!profileId) {
      return NextResponse.json(
        { error: 'profile_id query parameter is required' },
        { status: 400 }
      );
    }

    const data = await paxos.get(`/profiles/${profileId}/balances`);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error },
      { status: error.status || 500 }
    );
  }
}
