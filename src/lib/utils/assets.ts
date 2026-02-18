// Asset metadata and helper utilities

export const ASSETS = {
  BTC: { name: 'Bitcoin', color: '#F7931A', decimals: 8, networks: ['BITCOIN'] },
  ETH: { name: 'Ethereum', color: '#627EEA', decimals: 8, networks: ['ETHEREUM'] },
  USD: { name: 'US Dollar', color: '#00D4AA', decimals: 2, networks: [] },
  USDP: { name: 'Pax Dollar', color: '#00A86B', decimals: 2, networks: ['ETHEREUM', 'SOLANA'] },
  PYUSD: { name: 'PayPal USD', color: '#003087', decimals: 2, networks: ['ETHEREUM', 'SOLANA', 'STELLAR'] },
  USDG: { name: 'Global Dollar', color: '#7B5EA7', decimals: 2, networks: ['ETHEREUM', 'SOLANA', 'INK'] },
  USDL: { name: 'Lift Dollar', color: '#4A90D9', decimals: 2, networks: ['ETHEREUM'] },
  PAXG: { name: 'PAX Gold', color: '#F5A623', decimals: 4, networks: ['ETHEREUM'] },
} as const;

export type AssetKey = keyof typeof ASSETS;

export const STABLECOIN_PAIRS: [string, string][] = [
  ['USD', 'USDP'], ['USD', 'PYUSD'], ['USD', 'USDG'], ['USD', 'USDL'],
  ['USDP', 'PYUSD'], ['USDP', 'USDG'], ['USDP', 'USDL'],
];

export function formatAmount(amount: string | number, asset: string): string {
  const decimals = ASSETS[asset as AssetKey]?.decimals ?? 2;
  return Number(amount).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatUSD(amount: string | number): string {
  return Number(amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function isSandbox(): boolean {
  return (process.env.NEXT_PUBLIC_PAXOS_BASE_URL || process.env.PAXOS_BASE_URL || '').includes('sandbox');
}
