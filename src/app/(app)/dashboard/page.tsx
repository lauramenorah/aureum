'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Banknote,
} from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import PortfolioChart from '@/components/charts/PortfolioChart';
import { useStore } from '@/store/useStore';
import SandboxFundModal from '@/components/sandbox/SandboxFundModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BalanceItem {
  asset: string;
  available: string;
  trading: string;
}

interface TickerItem {
  market: string;
  best_bid: { price: string };
  best_ask: { price: string };
  snapshot_at: string;
  today: {
    open: string;
    high: string;
    low: string;
    volume: string;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ASSET_META: Record<string, { label: string; color: string }> = {
  BTC: { label: 'Bitcoin', color: '#F7931A' },
  ETH: { label: 'Ethereum', color: '#627EEA' },
  USD: { label: 'US Dollar', color: '#00D4AA' },
  USDP: { label: 'Pax Dollar', color: '#00A86B' },
  PYUSD: { label: 'PayPal USD', color: '#003087' },
  USDG: { label: 'Global Dollar', color: '#7B5EA7' },
  USDL: { label: 'Lift Dollar', color: '#4A90D9' },
  PAXG: { label: 'Pax Gold', color: '#F5A623' },
};

const QUICK_ACTIONS = [
  { icon: ArrowDownToLine, label: 'Deposit', href: '/deposit', accent: '#00D4AA' },
  { icon: ArrowUpFromLine, label: 'Withdraw', href: '/withdraw', accent: '#FF5B5B' },
  { icon: TrendingUp, label: 'Trade', href: '/trade', accent: '#7B5EA7' },
  { icon: ArrowLeftRight, label: 'Convert', href: '/convert', accent: '#F5A623' },
];

// Map assets to approximate USD price (stables = 1, BTC/ETH/PAXG from tickers)
function getUsdPrice(asset: string, tickers: TickerItem[] | undefined): number {
  if (['USD', 'USDP', 'PYUSD', 'USDG', 'USDL'].includes(asset)) return 1;
  const market = `${asset}USD`;
  const t = tickers?.find((tk) => tk.market === market);
  if (t) {
    const bid = parseFloat(t.best_bid?.price || '0');
    const ask = parseFloat(t.best_ask?.price || '0');
    return (bid + ask) / 2 || 0;
  }
  return 0;
}

function get24hChange(asset: string, tickers: TickerItem[] | undefined): number | null {
  if (['USD', 'USDP', 'PYUSD', 'USDG', 'USDL'].includes(asset)) return 0;
  const market = `${asset}USD`;
  const t = tickers?.find((tk) => tk.market === market);
  if (t) {
    const open = parseFloat(t.today?.open || '0');
    const mid = (parseFloat(t.best_bid?.price || '0') + parseFloat(t.best_ask?.price || '0')) / 2;
    if (open > 0) return ((mid - open) / open) * 100;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Mock data generators
// ---------------------------------------------------------------------------

function generateMockChartData(baseValue: number): { date: string; value: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let current = baseValue;
  return days.map((day) => {
    current += (Math.random() - 0.48) * baseValue * 0.02;
    return { date: day, value: Math.max(0, current) };
  });
}

const MOCK_ACTIVITY = [
  { id: '1', type: 'Deposit', asset: 'BTC', amount: '+0.005 BTC', status: 'COMPLETED', time: '2 min ago' },
  { id: '2', type: 'Trade', asset: 'ETH', amount: '-1.2 ETH', status: 'COMPLETED', time: '18 min ago' },
  { id: '3', type: 'Withdraw', asset: 'USD', amount: '-$500.00', status: 'PENDING', time: '1 hr ago' },
  { id: '4', type: 'Convert', asset: 'USDP', amount: '+200 USDP', status: 'COMPLETED', time: '3 hr ago' },
  { id: '5', type: 'Deposit', asset: 'PAXG', amount: '+0.1 PAXG', status: 'COMPLETED', time: '5 hr ago' },
  { id: '6', type: 'Trade', asset: 'BTC', amount: '+0.01 BTC', status: 'FAILED', time: '8 hr ago' },
  { id: '7', type: 'Withdraw', asset: 'ETH', amount: '-0.5 ETH', status: 'COMPLETED', time: '12 hr ago' },
  { id: '8', type: 'Deposit', asset: 'USD', amount: '+$1,000.00', status: 'COMPLETED', time: '1 day ago' },
];

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  FAILED: 'error',
};

const ACTIVITY_ICONS: Record<string, typeof ArrowDownToLine> = {
  Deposit: ArrowDownToLine,
  Withdraw: ArrowUpFromLine,
  Trade: TrendingUp,
  Convert: ArrowLeftRight,
};

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const activeProfile = useStore((s) => s.activeProfile);
  const profileId = activeProfile?.id;
  const [fundModalOpen, setFundModalOpen] = useState(false);

  // Fetch balances
  const {
    data: balancesData,
    isLoading: balancesLoading,
  } = useQuery({
    queryKey: ['balances', profileId],
    queryFn: async () => {
      if (!profileId) return { items: [] };
      const res = await fetch(`/api/paxos/balances?profile_id=${profileId}`);
      if (!res.ok) throw new Error('Failed to load balances');
      return res.json();
    },
    enabled: !!profileId,
  });

  // Fetch tickers
  const {
    data: tickersData,
    isLoading: tickersLoading,
  } = useQuery({
    queryKey: ['tickers'],
    queryFn: async () => {
      const res = await fetch('/api/paxos/pricing?endpoint=tickers');
      if (!res.ok) throw new Error('Failed to load tickers');
      return res.json();
    },
    refetchInterval: 15000,
  });

  const tickers: TickerItem[] = useMemo(() => tickersData?.items ?? tickersData?.tickers ?? [], [tickersData]);
  const balances: BalanceItem[] = useMemo(() => balancesData?.items ?? [], [balancesData]);

  // Compute totals
  const { totalUsd, assetCards } = useMemo(() => {
    let total = 0;
    const cards = Object.keys(ASSET_META).map((asset) => {
      const bal = balances.find((b) => b.asset === asset);
      const available = parseFloat(bal?.available || '0');
      const price = getUsdPrice(asset, tickers);
      const usdValue = available * price;
      const change = get24hChange(asset, tickers);
      total += usdValue;
      return { asset, available, usdValue, change, ...ASSET_META[asset] };
    });
    return { totalUsd: total, assetCards: cards };
  }, [balances, tickers]);

  // Determine portfolio 24h change (weighted average of non-stable assets)
  const portfolio24hChange = useMemo(() => {
    if (tickers.length === 0) return null;
    let weightedChange = 0;
    let totalNonStable = 0;
    for (const ac of assetCards) {
      if (ac.change !== null && ac.change !== 0 && ac.usdValue > 0) {
        weightedChange += ac.change * ac.usdValue;
        totalNonStable += ac.usdValue;
      }
    }
    return totalNonStable > 0 ? weightedChange / totalNonStable : 0;
  }, [assetCards, tickers]);

  const chartData = useMemo(() => generateMockChartData(totalUsd || 10000), [totalUsd]);

  const isLoading = balancesLoading || tickersLoading;

  return (
    <PageWrapper title="Dashboard">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* ---------------------------------------------------------------- */}
        {/* Hero Card                                                        */}
        {/* ---------------------------------------------------------------- */}
        <motion.div variants={fadeUp}>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-gradient-to-br from-[#1B1E36] to-[#0D0E1A] p-6 md:p-8">
            <p className="mb-1 text-sm text-[#8892B0]">Total Portfolio Value</p>
            {isLoading ? (
              <Skeleton className="mb-2 h-10 w-48" />
            ) : (
              <h2 className="font-mono text-4xl font-bold text-white">
                ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            )}
            {portfolio24hChange !== null && !isLoading && (
              <div className="mt-2 flex items-center gap-1">
                {portfolio24hChange >= 0 ? (
                  <ArrowUpRight size={16} className="text-[#00D4AA]" />
                ) : (
                  <ArrowDownRight size={16} className="text-[#FF5B5B]" />
                )}
                <span
                  className={`text-sm font-medium ${
                    portfolio24hChange >= 0 ? 'text-[#00D4AA]' : 'text-[#FF5B5B]'
                  }`}
                >
                  {portfolio24hChange >= 0 ? '+' : ''}
                  {portfolio24hChange.toFixed(2)}% (24h)
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ---------------------------------------------------------------- */}
        {/* Quick Actions                                                    */}
        {/* ---------------------------------------------------------------- */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {QUICK_ACTIONS.map(({ icon: Icon, label, href, accent }) => (
              <Link key={href} href={href}>
                <div className="flex flex-col items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#13152A] p-4 transition-colors hover:bg-[#1B1E36]">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${accent}15` }}
                  >
                    <Icon size={20} style={{ color: accent }} />
                  </div>
                  <span className="text-sm font-medium text-white">{label}</span>
                </div>
              </Link>
            ))}
            {/* Sandbox fund button */}
            <button onClick={() => setFundModalOpen(true)}>
              <div className="flex flex-col items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 transition-colors hover:bg-yellow-500/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/15">
                  <Banknote size={20} className="text-yellow-400" />
                </div>
                <span className="text-sm font-medium text-yellow-400">Fund</span>
              </div>
            </button>
          </div>
          <SandboxFundModal open={fundModalOpen} onClose={() => setFundModalOpen(false)} />
        </motion.div>

        {/* ---------------------------------------------------------------- */}
        {/* Asset Breakdown Grid                                             */}
        {/* ---------------------------------------------------------------- */}
        <motion.div variants={fadeUp}>
          <h3 className="mb-4 text-lg font-semibold text-white">Assets</h3>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" rounded="rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {assetCards.map((ac) => (
                <motion.div key={ac.asset} variants={fadeUp}>
                  <Card hover>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: `${ac.color}20`, color: ac.color }}
                      >
                        {ac.asset.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{ac.label}</p>
                        <p className="text-xs text-[#8892B0]">{ac.asset}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="font-mono text-lg font-semibold text-white">
                        {ac.available.toLocaleString('en-US', {
                          minimumFractionDigits: ac.asset === 'BTC' ? 8 : 2,
                          maximumFractionDigits: ac.asset === 'BTC' ? 8 : 6,
                        })}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[#8892B0]">
                          ${ac.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {ac.change !== null && (
                          <span
                            className={`text-xs font-medium ${
                              ac.change >= 0 ? 'text-[#00D4AA]' : 'text-[#FF5B5B]'
                            }`}
                          >
                            {ac.change >= 0 ? '+' : ''}
                            {ac.change.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ---------------------------------------------------------------- */}
        {/* 7-Day Portfolio Chart                                            */}
        {/* ---------------------------------------------------------------- */}
        <motion.div variants={fadeUp}>
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-white">Portfolio (7 Days)</h3>
            <PortfolioChart data={chartData} height={280} />
          </Card>
        </motion.div>

        {/* ---------------------------------------------------------------- */}
        {/* Recent Activity                                                  */}
        {/* ---------------------------------------------------------------- */}
        <motion.div variants={fadeUp}>
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <Link
                href="/history"
                className="flex items-center gap-1 text-sm text-[#7B5EA7] transition-colors hover:text-[#9B7BC7]"
              >
                View All
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="divide-y divide-[rgba(255,255,255,0.06)]">
              {MOCK_ACTIVITY.map((tx) => {
                const TxIcon = ACTIVITY_ICONS[tx.type] || Clock;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B1E36]">
                        <TxIcon size={16} className="text-[#8892B0]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{tx.type}</p>
                        <p className="text-xs text-[#8892B0]">{tx.asset}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm text-white">{tx.amount}</span>
                      <Badge
                        variant={STATUS_VARIANT[tx.status] ?? 'neutral'}
                        size="sm"
                      >
                        {tx.status === 'COMPLETED' && <CheckCircle2 size={10} className="mr-1" />}
                        {tx.status === 'PENDING' && <Clock size={10} className="mr-1" />}
                        {tx.status === 'FAILED' && <XCircle size={10} className="mr-1" />}
                        {tx.status}
                      </Badge>
                      <span className="hidden text-xs text-[#8892B0] sm:inline">{tx.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
