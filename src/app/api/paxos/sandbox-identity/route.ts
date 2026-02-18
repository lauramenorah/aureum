import { NextRequest, NextResponse } from 'next/server';
import { getPaxosClient } from '@/lib/paxos/client';

export async function POST(request: NextRequest) {
  try {
    const paxos = getPaxosClient();
    const body = await request.json();

    const { identity_id } = body;
    if (!identity_id) {
      return NextResponse.json(
        { error: 'identity_id is required in the request body' },
        { status: 400 }
      );
    }

    const data = await paxos.put(`/identity/identities/${identity_id}/sandbox-status`, {
      id_verification_status: 'APPROVED',
      sanctions_verification_status: 'APPROVED',
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error },
      { status: error.status || 500 }
    );
  }
}
