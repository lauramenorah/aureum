// Paxos OAuth2 token fetching and refresh

let cachedToken: { access_token: string; expires_at: number } | null = null;

export async function getPaxosAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at - 60000) {
    return cachedToken.access_token;
  }

  const res = await fetch(process.env.PAXOS_AUTH_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.PAXOS_CLIENT_ID!,
      client_secret: process.env.PAXOS_CLIENT_SECRET!,
      scope: [
        'funding:read_profile',
        'funding:write_profile',
        'transfer:read_transfer',
        'transfer:read_deposit_address',
        'transfer:write_deposit_address',
        'transfer:write_internal_transfer',
        'transfer:write_crypto_withdrawal',
        'transfer:write_fiat_withdrawal',
        'transfer:read_fiat_account',
        'transfer:write_fiat_account',
        'transfer:read_fiat_deposit_instructions',
        'transfer:write_fiat_deposit_instructions',
        'identity:read_identity',
        'identity:write_identity',
        'identity:read_account',
        'identity:write_account',
        'exchange:read_order',
        'exchange:write_order',
        'exchange:read_quote',
        'exchange:write_quote_execution',
        'conversion:read_conversion_stablecoin',
        'conversion:write_conversion_stablecoin',
      ].join(' '),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Paxos auth failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.access_token;
}
