'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  ExternalLink,
} from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import BalanceSparkline from '@/components/charts/BalanceSparkline';
import PriceChart from '@/components/charts/PriceChart';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Ticker {
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

const MARKET_META: Record<string, { label: string; base: string; color: string }> = {
  BTCUSD: { label: 'Bitcoin', base: 'BTC', color: '#F7931A' },
  ETHUSD: { label: 'Ethereum', base: 'ETH', color: '#627EEA' },
  PAXGUSD: { label: 'Pax Gold', base: 'PAXG', color: '#F5A623' },
};

const MARKET_ORDER = ['BTCUSD', 'ETHUSD', 'PAXGUSD'];

const TIME_RANGES = ['1D', '1W', '1M'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function midPrice(t: Ticker): number {
  return (parseFloat(t.best_bid?.price || '0') + parseFloat(t.best_ask?.price || '0')) / 2;
}

function change24h(t: Ticker): number {
  const open = parseFloat(t.today?.open || '0');
  const mid = midPrice(t);
  return open > 0 ? ((mid - open) / open) * 100 : 0;
}

function formatUsd(v: number, decimals = 2): string {
  return v.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Generate deterministic-looking mock sparkline data around a price */
function mockSparkline(basePrice: number): number[] {
  const points: number[] = [];
  let p = basePrice;
  for (let i = 0; i < 20; i++) {
    p += (Math.random() - 0.48) * basePrice * 0.005;
    points.push(p);
  }
  return points;
}

/** Generate mock chart data for expanded view */
function mockChartData(
  basePrice: number,
  range: typeof TIME_RANGES[number],
): { date: string; price: number }[] {
  const points: { date: string; price: number }[] = [];
  const count = range === '1D' ? 24 : range === '1W' ? 7 : 30;
  let p = basePrice * (1 - Math.random() * 0.04);

  for (let i = 0; i < count; i++) {
    p += (Math.random() - 0.48) * basePrice * (range === '1D' ? 0.002 : 0.008);
    let label: string;
    if (range === '1D') {
      label = `${i}:00`;
    } else if (range === '1W') {
      label = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7];
    } else {
      label = `Day ${i + 1}`;
    }
    points.push({ date: label, price: Math.max(0, p) });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarketPage() {
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<typeof TIME_RANGES[number]>('1W');

  // Fetch tickers
  const { data: tickersData, isLoading: tickersLoading } = useQuery({
    queryKey: ['market-tickers'],
    queryFn: async () => {
      const res = await fetch('/api/paxos/pricing?endpoint=tickers');
      if (!res.ok) throw new Error('Failed to load tickers');
      return res.json();
    },
    refetchInterval: 10000,
  });

  // Fetch prices
  const { isLoading: pricesLoading } = useQuery({
    queryKey: ['market-prices'],
    queryFn: async () => {
      const res = await fetch('/api/paxos/pricing?endpoint=prices');
      if (!res.ok) throw new Error('Failed to load prices');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const tickers: Ticker[] = useMemo(() => tickersData?.items ?? tickersData?.tickers ?? [], [tickersData]);

  const marketRows = useMemo(() => {
    return MARKET_ORDER.map((market) => {
      const t = tickers.find((tk) => tk.market === market);
      const meta = MARKET_META[market];
      const price = t ? midPrice(t) : 0;
      const pctChange = t ? change24h(t) : 0;
      const high = t ? parseFloat(t.today?.high || '0') : 0;
      const low = t ? parseFloat(t.today?.low || '0') : 0;
      const volume = t ? parseFloat(t.today?.volume || '0') : 0;
      const open = t ? parseFloat(t.today?.open || '0') : 0;
      const sparkline = mockSparkline(price || 100);
      return { market, ...meta, price, pctChange, high, low, volume, open, sparkline };
    });
  }, [tickers]);

  const isLoading = tickersLoading || pricesLoading;

  const toggleExpand = (market: string) => {
    setExpandedMarket((prev) => (prev === market ? null : market));
    setTimeRange('1W');
  };

  return (
    <PageWrapper title="Market">
      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* ---------------------------------------------------------------- */}
        {/* Market Overview Table                                            */}
        {/* ---------------------------------------------------------------- */}
        <motion.div variants={fadeUp}>
          <Card padding="p-0">
            {/* Header */}
            <div className="border-b border-[rgba(255,255,255,0.06)] px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Market Overview</h3>
            </div>

            {isLoading ? (
              <div className="space-y-4 p-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" rounded="rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Column labels */}
                <div className="grid min-w-[640px] grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_60px] items-center gap-2 border-b border-[rgba(255,255,255,0.06)] px-6 py-3 text-xs font-medium text-[#8892B0]">
                  <span>Asset</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">24h Change</span>
                  <span className="text-right">24h High</span>
                  <span className="text-right">24h Low</span>
                  <span className="text-right">Volume</span>
                  <span />
                </div>

                {/* Rows */}
                {marketRows.map((row) => {
                  const isExpanded = expandedMarket === row.market;
                  const positive = row.pctChange >= 0;

                  return (
                    <div key={row.market}>
                      {/* Table row */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(row.market)}
                        className="grid w-full min-w-[640px] grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_60px] items-center gap-2 border-b border-[rgba(255,255,255,0.06)] px-6 py-4 text-left transition-colors hover:bg-[#1B1E36]/40"
                      >
                        {/* Asset */}
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: `${row.color}20`,
                              color: row.color,
                            }}
                          >
                            {row.base.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{row.label}</p>
                            <p className="text-xs text-[#8892B0]">{row.market}</p>
                          </div>
                        </div>

                        {/* Price */}
                        <span className="text-right font-mono text-sm text-white">
                          ${formatUsd(row.price)}
                        </span>

                        {/* 24h Change */}
                        <span
                          className={`flex items-center justify-end gap-1 text-right text-sm font-medium ${
                            positive ? 'text-[#00D4AA]' : 'text-[#FF5B5B]'
                          }`}
                        >
                          {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {positive ? '+' : ''}
                          {row.pctChange.toFixed(2)}%
                        </span>

                        {/* 24h High */}
                        <span className="text-right font-mono text-sm text-[#8892B0]">
                          ${formatUsd(row.high)}
                        </span>

                        {/* 24h Low */}
                        <span className="text-right font-mono text-sm text-[#8892B0]">
                          ${formatUsd(row.low)}
                        </span>

                        {/* Volume */}
                        <span className="text-right font-mono text-sm text-[#8892B0]">
                          {row.volume >= 1000
                            ? `${(row.volume / 1000).toFixed(1)}K`
                            : row.volume.toFixed(2)}
                        </span>

                        {/* Sparkline + chevron */}
                        <div className="flex items-center justify-end gap-2">
                          <BalanceSparkline
                            data={row.sparkline}
                            color={positive ? '#00D4AA' : '#FF5B5B'}
                          />
                          {isExpanded ? (
                            <ChevronUp size={14} className="text-[#8892B0]" />
                          ) : (
                            <ChevronDown size={14} className="text-[#8892B0]" />
                          )}
                        </div>
                      </button>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            key={`expanded-${row.market}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden border-b border-[rgba(255,255,255,0.06)] bg-[#0D0E1A]/60"
                          >
                            <div className="space-y-4 p-6">
                              {/* Time range buttons */}
                              <div className="flex items-center gap-2">
                                {TIME_RANGES.map((tr) => (
                                  <button
                                    key={tr}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTimeRange(tr);
                                    }}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                      timeRange === tr
                                        ? 'bg-[#7B5EA7]/20 text-[#7B5EA7]'
                                        : 'text-[#8892B0] hover:bg-[#1B1E36] hover:text-white'
                                    }`}
                                  >
                                    {tr}
                                  </button>
                                ))}
                              </div>

                              {/* Price chart */}
                              <PriceChart
                                data={mockChartData(row.price, timeRange)}
                                color={row.color}
                                height={260}
                              />

                              {/* 24h stats bar */}
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                                {[
                                  { label: 'Open', value: `$${formatUsd(row.open)}` },
                                  { label: 'High', value: `$${formatUsd(row.high)}` },
                                  { label: 'Low', value: `$${formatUsd(row.low)}` },
                                  {
                                    label: 'Volume',
                                    value:
                                      row.volume >= 1000
                                        ? `${(row.volume / 1000).toFixed(1)}K`
                                        : row.volume.toFixed(2),
                                  },
                                  {
                                    label: 'Change',
                                    value: `${positive ? '+' : ''}${row.pctChange.toFixed(2)}%`,
                                    color: positive ? '#00D4AA' : '#FF5B5B',
                                  },
                                ].map((stat) => (
                                  <div
                                    key={stat.label}
                                    className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#13152A] p-3"
                                  >
                                    <p className="mb-1 text-xs text-[#8892B0]">{stat.label}</p>
                                    <p
                                      className="font-mono text-sm font-semibold"
                                      style={{ color: stat.color || 'white' }}
                                    >
                                      {stat.value}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* Buy button */}
                              <div className="flex justify-end">
                                <Link
                                  href={`/trade?market=${row.market}`}
                                  className="inline-flex items-center gap-2 rounded-xl bg-[#7B5EA7] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B4E97]"
                                >
                                  Buy {row.base}
                                  <ExternalLink size={14} />
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
