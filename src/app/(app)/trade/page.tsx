'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  X,
  ChevronDown,
  Activity,
  BarChart3,
  List,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';
import { formatAmount, formatUSD } from '@/lib/utils/assets';
import type { Order, Execution, Quote } from '@/lib/paxos/types';

// ─── Constants ──────────────────────────────────────────────────────────────

const MARKETS = [
  { value: 'BTCUSD', label: 'BTC / USD', base: 'BTC', quote: 'USD' },
  { value: 'ETHUSD', label: 'ETH / USD', base: 'ETH', quote: 'USD' },
  { value: 'PAXGUSD', label: 'PAXG / USD', base: 'PAXG', quote: 'USD' },
];

const ORDER_MODES = ['Quote', 'Market', 'Limit', 'Stop'] as const;
type OrderMode = (typeof ORDER_MODES)[number];

const TIME_IN_FORCE_OPTIONS = [
  { value: 'GTC', label: 'Good Till Cancel' },
  { value: 'IOC', label: 'Immediate or Cancel' },
  { value: 'FOK', label: 'Fill or Kill' },
];

const MARKET_COLORS: Record<string, string> = {
  BTCUSD: '#F7931A',
  ETHUSD: '#627EEA',
  PAXGUSD: '#F5A623',
};

// ─── Mock chart data ────────────────────────────────────────────────────────

function generateChartData(market: string) {
  const basePrice =
    market === 'BTCUSD' ? 67500 : market === 'ETHUSD' ? 3250 : 2050;
  const now = Date.now();
  return Array.from({ length: 48 }, (_, i) => {
    const variance = (Math.random() - 0.5) * basePrice * 0.03;
    const trend = Math.sin(i / 8) * basePrice * 0.01;
    return {
      time: new Date(now - (47 - i) * 30 * 60 * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      price: +(basePrice + variance + trend).toFixed(2),
    };
  });
}

function generateOrderBook(market: string) {
  const mid =
    market === 'BTCUSD' ? 67500 : market === 'ETHUSD' ? 3250 : 2050;
  const spread = mid * 0.0005;
  const bids = Array.from({ length: 10 }, (_, i) => {
    const price = +(mid - spread - i * spread * 0.5).toFixed(2);
    const amount = +(Math.random() * 2 + 0.01).toFixed(6);
    return { price, amount, total: +(price * amount).toFixed(2) };
  });
  const asks = Array.from({ length: 10 }, (_, i) => {
    const price = +(mid + spread + i * spread * 0.5).toFixed(2);
    const amount = +(Math.random() * 2 + 0.01).toFixed(6);
    return { price, amount, total: +(price * amount).toFixed(2) };
  });
  return { bids, asks, midPrice: mid };
}

function generateRecentTrades(market: string) {
  const mid =
    market === 'BTCUSD' ? 67500 : market === 'ETHUSD' ? 3250 : 2050;
  const now = Date.now();
  return Array.from({ length: 20 }, (_, i) => ({
    id: `trade-${i}`,
    price: +(mid + (Math.random() - 0.5) * mid * 0.002).toFixed(2),
    amount: +(Math.random() * 1.5 + 0.001).toFixed(6),
    side: Math.random() > 0.5 ? ('BUY' as const) : ('SELL' as const),
    time: new Date(now - i * 15000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  }));
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function TradePage() {
  const queryClient = useQueryClient();

  // ── State ────────────────────────────────────────────────────────────────
  const [market, setMarket] = useState('BTCUSD');
  const [mode, setMode] = useState<OrderMode>('Quote');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [timeInForce, setTimeInForce] = useState('GTC');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [quoteCountdown, setQuoteCountdown] = useState(30);
  const [bottomTab, setBottomTab] = useState<
    'open' | 'order-history' | 'trade-history'
  >('open');
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);

  const selectedMarket = MARKETS.find((m) => m.value === market)!;
  const marketColor = MARKET_COLORS[market] || '#7B5EA7';

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: tickerData } = useQuery({
    queryKey: ['ticker', market],
    queryFn: async () => {
      const res = await fetch(
        `/api/paxos/market-data?market=${market}&type=tickers`
      );
      if (!res.ok) throw new Error('Failed to fetch ticker');
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: quoteData, refetch: refetchQuote } = useQuery({
    queryKey: ['quote', market, side, amount],
    queryFn: async () => {
      if (!amount || mode !== 'Quote') return null;
      const params = new URLSearchParams({
        market,
        side,
        amount,
      });
      const res = await fetch(`/api/paxos/quotes?${params}`);
      if (!res.ok) throw new Error('Failed to fetch quote');
      return res.json() as Promise<Quote>;
    },
    enabled: mode === 'Quote' && !!amount,
    refetchInterval: mode === 'Quote' && amount ? 1000 : false,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await fetch('/api/paxos/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
  });

  const { data: executionsData, isLoading: executionsLoading } = useQuery({
    queryKey: ['executions'],
    queryFn: async () => {
      const res = await fetch('/api/paxos/executions');
      if (!res.ok) throw new Error('Failed to fetch executions');
      return res.json();
    },
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const executeQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await fetch('/api/paxos/quote-executions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quoteId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to execute quote');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Quote executed successfully');
      setShowConfirmModal(false);
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (orderPayload: Record<string, unknown>) => {
      const res = await fetch('/api/paxos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to place order');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Order placed successfully');
      setShowConfirmModal(false);
      setAmount('');
      setPrice('');
      setStopPrice('');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/paxos/orders?id=${orderId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to cancel order');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // ── Quote countdown ──────────────────────────────────────────────────────

  useEffect(() => {
    if (mode !== 'Quote' || !quoteData?.expires_at) return;
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor(
          (new Date(quoteData.expires_at).getTime() - Date.now()) / 1000
        )
      );
      setQuoteCountdown(remaining);
      if (remaining <= 0) refetchQuote();
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, quoteData, refetchQuote]);

  // ── Chart / Order Book data ──────────────────────────────────────────────

  const chartData = useMemo(() => generateChartData(market), [market]);
  const orderBook = useMemo(() => generateOrderBook(market), [market]);
  const recentTrades = useMemo(() => generateRecentTrades(market), [market]);

  const ticker = tickerData || {
    last_price: market === 'BTCUSD' ? '67523.45' : market === 'ETHUSD' ? '3248.72' : '2051.30',
    open: market === 'BTCUSD' ? '66800.00' : market === 'ETHUSD' ? '3190.00' : '2040.00',
    high: market === 'BTCUSD' ? '68100.00' : market === 'ETHUSD' ? '3310.00' : '2065.00',
    low: market === 'BTCUSD' ? '66500.00' : market === 'ETHUSD' ? '3170.00' : '2035.00',
    volume: market === 'BTCUSD' ? '12453.78' : market === 'ETHUSD' ? '98234.12' : '4521.56',
    change_24h: market === 'BTCUSD' ? '1.08' : market === 'ETHUSD' ? '1.84' : '0.55',
  };

  const changePositive = parseFloat(ticker.change_24h) >= 0;

  // ── Confirm handler ──────────────────────────────────────────────────────

  const handleConfirm = useCallback(() => {
    if (mode === 'Quote' && quoteData?.id) {
      executeQuoteMutation.mutate(quoteData.id);
    } else {
      const orderPayload: Record<string, unknown> = {
        market,
        side,
        amount,
        type: mode.toUpperCase(),
      };
      if (mode === 'Limit' || mode === 'Stop') {
        orderPayload.price = price;
      }
      if (mode === 'Stop') {
        orderPayload.stop_price = stopPrice;
      }
      if (mode === 'Limit') {
        orderPayload.time_in_force = timeInForce;
      }
      placeOrderMutation.mutate(orderPayload);
    }
  }, [
    mode,
    quoteData,
    market,
    side,
    amount,
    price,
    stopPrice,
    timeInForce,
    executeQuoteMutation,
    placeOrderMutation,
  ]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const orders: Order[] = Array.isArray(ordersData?.items) ? ordersData.items : Array.isArray(ordersData) ? ordersData : [];
  const executions: Execution[] = Array.isArray(executionsData?.items) ? executionsData.items : Array.isArray(executionsData) ? executionsData : [];
  const openOrders = orders.filter(
    (o) => o.status === 'OPEN' || o.status === 'PARTIALLY_FILLED'
  );
  const closedOrders = orders.filter(
    (o) =>
      o.status === 'FILLED' ||
      o.status === 'CANCELLED' ||
      o.status === 'EXPIRED'
  );

  const maxBidTotal = Math.max(...orderBook.bids.map((b) => b.total), 1);
  const maxAskTotal = Math.max(...orderBook.asks.map((a) => a.total), 1);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Trade</h1>
          {/* Market selector */}
          <div className="relative">
            <button
              onClick={() => setMarketDropdownOpen(!marketDropdownOpen)}
              className="flex items-center gap-2 rounded-xl bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] px-4 py-2.5 text-white hover:bg-[#232745] transition-colors"
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: marketColor }}
              />
              <span className="font-medium">{selectedMarket.label}</span>
              <ChevronDown
                size={16}
                className={cn(
                  'text-[#8892B0] transition-transform',
                  marketDropdownOpen && 'rotate-180'
                )}
              />
            </button>
            <AnimatePresence>
              {marketDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 z-50 mt-2 w-56 rounded-xl bg-[#13152A] border border-[rgba(255,255,255,0.06)] shadow-2xl overflow-hidden"
                >
                  {MARKETS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => {
                        setMarket(m.value);
                        setMarketDropdownOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                        market === m.value
                          ? 'bg-[#1B1E36] text-white'
                          : 'text-[#8892B0] hover:bg-[#1B1E36] hover:text-white'
                      )}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: MARKET_COLORS[m.value] || '#7B5EA7',
                        }}
                      />
                      <span className="font-medium">{m.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Live price */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-2xl font-bold font-mono text-white">
            {formatUSD(ticker.last_price)}
          </span>
          <Badge variant={changePositive ? 'success' : 'error'} size="sm">
            {changePositive ? (
              <TrendingUp size={12} className="mr-1" />
            ) : (
              <TrendingDown size={12} className="mr-1" />
            )}
            {changePositive ? '+' : ''}
            {ticker.change_24h}%
          </Badge>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Panel: Order Entry ─────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            {/* Mode toggle */}
            <div className="flex gap-1 rounded-xl bg-[#0D0E1A] p-1 mb-6">
              {ORDER_MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
                    mode === m
                      ? 'bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] text-white shadow-lg'
                      : 'bg-transparent text-[#8892B0] hover:text-white'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* ── Quote Mode ────────────────────────────────────────── */}
            {mode === 'Quote' && (
              <motion.div
                key="quote"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Prices */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#0D0E1A] p-4 text-center">
                    <p className="text-xs text-[#8892B0] mb-1">Buy Price</p>
                    <p className="text-lg font-bold font-mono text-[#00D4AA]">
                      {quoteData?.price && side === 'BUY'
                        ? formatUSD(quoteData.price)
                        : formatUSD(
                            (
                              parseFloat(ticker.last_price) * 1.001
                            ).toFixed(2)
                          )}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#0D0E1A] p-4 text-center">
                    <p className="text-xs text-[#8892B0] mb-1">Sell Price</p>
                    <p className="text-lg font-bold font-mono text-[#FF5B5B]">
                      {quoteData?.price && side === 'SELL'
                        ? formatUSD(quoteData.price)
                        : formatUSD(
                            (
                              parseFloat(ticker.last_price) * 0.999
                            ).toFixed(2)
                          )}
                    </p>
                  </div>
                </div>

                {/* Countdown */}
                {quoteData && (
                  <div className="flex items-center justify-center gap-2 text-sm text-[#8892B0]">
                    <Clock size={14} />
                    <span>
                      Expires in{' '}
                      <span
                        className={cn(
                          'font-mono font-medium',
                          quoteCountdown <= 5
                            ? 'text-[#FF5B5B]'
                            : 'text-white'
                        )}
                      >
                        {quoteCountdown}s
                      </span>
                    </span>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="block text-sm text-[#8892B0] mb-1.5 font-medium">
                    Amount ({selectedMarket.base})
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/[^0-9.]/g, ''))
                    }
                    placeholder="0.00"
                    className="w-full bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-4 text-white font-mono text-2xl placeholder-[#4A5568] focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] outline-none transition-all"
                  />
                </div>

                {/* Buy/Sell toggle */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSide('BUY')}
                    className={cn(
                      'py-3.5 rounded-xl font-semibold text-sm transition-all',
                      side === 'BUY'
                        ? 'bg-[#00D4AA] text-white shadow-[0_0_20px_rgba(0,212,170,0.3)]'
                        : 'bg-[#1B1E36] text-[#8892B0] hover:text-white'
                    )}
                  >
                    Buy {selectedMarket.base}
                  </button>
                  <button
                    onClick={() => setSide('SELL')}
                    className={cn(
                      'py-3.5 rounded-xl font-semibold text-sm transition-all',
                      side === 'SELL'
                        ? 'bg-[#FF5B5B] text-white shadow-[0_0_20px_rgba(255,91,91,0.3)]'
                        : 'bg-[#1B1E36] text-[#8892B0] hover:text-white'
                    )}
                  >
                    Sell {selectedMarket.base}
                  </button>
                </div>

                {/* Execute button */}
                <Button
                  fullWidth
                  size="lg"
                  disabled={!amount || parseFloat(amount) <= 0}
                  onClick={() => setShowConfirmModal(true)}
                  className={cn(
                    side === 'BUY'
                      ? 'bg-[#00D4AA] hover:bg-[#00D4AA]/80 from-transparent to-transparent'
                      : 'bg-[#FF5B5B] hover:bg-[#FF5B5B]/80 from-transparent to-transparent'
                  )}
                >
                  {side === 'BUY' ? 'Buy' : 'Sell'} {selectedMarket.base}
                </Button>
              </motion.div>
            )}

            {/* ── Market / Limit / Stop Mode ────────────────────────── */}
            {mode !== 'Quote' && (
              <motion.div
                key="order"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Side toggle */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSide('BUY')}
                    className={cn(
                      'py-3 rounded-xl font-semibold text-sm transition-all',
                      side === 'BUY'
                        ? 'bg-[#00D4AA] text-white shadow-[0_0_20px_rgba(0,212,170,0.3)]'
                        : 'bg-[#1B1E36] text-[#8892B0] hover:text-white'
                    )}
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => setSide('SELL')}
                    className={cn(
                      'py-3 rounded-xl font-semibold text-sm transition-all',
                      side === 'SELL'
                        ? 'bg-[#FF5B5B] text-white shadow-[0_0_20px_rgba(255,91,91,0.3)]'
                        : 'bg-[#1B1E36] text-[#8892B0] hover:text-white'
                    )}
                  >
                    SELL
                  </button>
                </div>

                {/* Price (limit/stop) */}
                {(mode === 'Limit' || mode === 'Stop') && (
                  <div>
                    <label className="block text-sm text-[#8892B0] mb-1.5 font-medium">
                      {mode === 'Stop' ? 'Limit Price' : 'Price'} (USD)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) =>
                        setPrice(e.target.value.replace(/[^0-9.]/g, ''))
                      }
                      placeholder="0.00"
                      className="w-full bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white font-mono text-lg placeholder-[#4A5568] focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] outline-none transition-all"
                    />
                  </div>
                )}

                {/* Stop price (stop only) */}
                {mode === 'Stop' && (
                  <div>
                    <label className="block text-sm text-[#8892B0] mb-1.5 font-medium">
                      Stop Price (USD)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={stopPrice}
                      onChange={(e) =>
                        setStopPrice(e.target.value.replace(/[^0-9.]/g, ''))
                      }
                      placeholder="0.00"
                      className="w-full bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white font-mono text-lg placeholder-[#4A5568] focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] outline-none transition-all"
                    />
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="block text-sm text-[#8892B0] mb-1.5 font-medium">
                    Amount ({selectedMarket.base})
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/[^0-9.]/g, ''))
                    }
                    placeholder="0.00"
                    className="w-full bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white font-mono text-lg placeholder-[#4A5568] focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] outline-none transition-all"
                  />
                </div>

                {/* Time in force (limit only) */}
                {mode === 'Limit' && (
                  <div>
                    <label className="block text-sm text-[#8892B0] mb-1.5 font-medium">
                      Time in Force
                    </label>
                    <select
                      value={timeInForce}
                      onChange={(e) => setTimeInForce(e.target.value)}
                      className="w-full bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white appearance-none focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] outline-none transition-all cursor-pointer"
                    >
                      {TIME_IN_FORCE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Estimated total */}
                {amount && (mode === 'Market' || price) && (
                  <div className="rounded-xl bg-[#0D0E1A] p-3 flex items-center justify-between">
                    <span className="text-sm text-[#8892B0]">Est. Total</span>
                    <span className="font-mono font-medium text-white">
                      {formatUSD(
                        (
                          parseFloat(amount) *
                          parseFloat(
                            mode === 'Market' ? ticker.last_price : price
                          )
                        ).toFixed(2)
                      )}
                    </span>
                  </div>
                )}

                {/* Place order */}
                <Button
                  fullWidth
                  size="lg"
                  disabled={
                    !amount ||
                    parseFloat(amount) <= 0 ||
                    ((mode === 'Limit' || mode === 'Stop') && !price) ||
                    (mode === 'Stop' && !stopPrice)
                  }
                  onClick={() => setShowConfirmModal(true)}
                >
                  Place {mode} Order
                </Button>
              </motion.div>
            )}
          </Card>

          {/* Available balance placeholder */}
          <Card padding="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8892B0]">Available Balance</span>
              <span className="font-mono text-white font-medium">
                {side === 'BUY'
                  ? formatUSD(10000)
                  : `${formatAmount('1.5', selectedMarket.base)} ${selectedMarket.base}`}
              </span>
            </div>
          </Card>
        </div>

        {/* ── Right Panel: Market Data ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Price Chart */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#8892B0]">
                Price Chart
              </h3>
              <div className="flex items-center gap-2 text-xs text-[#8892B0]">
                <Activity size={14} />
                <span>24H</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="chartGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={marketColor}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={marketColor}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4A5568', fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4A5568', fontSize: 11 }}
                    tickFormatter={(val: number) =>
                      val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`
                    }
                    width={60}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#13152A',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                    formatter={(value) => [formatUSD(value as number), 'Price']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={marketColor}
                    strokeWidth={2}
                    fill="url(#chartGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 24h Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Open', value: formatUSD(ticker.open) },
              { label: 'High', value: formatUSD(ticker.high) },
              { label: 'Low', value: formatUSD(ticker.low) },
              {
                label: 'Volume',
                value: `${parseFloat(ticker.volume).toLocaleString()} ${selectedMarket.base}`,
              },
              {
                label: '24h Change',
                value: `${changePositive ? '+' : ''}${ticker.change_24h}%`,
                color: changePositive ? 'text-[#00D4AA]' : 'text-[#FF5B5B]',
              },
            ].map((stat) => (
              <Card key={stat.label} padding="p-4">
                <p className="text-xs text-[#8892B0] mb-1">{stat.label}</p>
                <p
                  className={cn(
                    'text-sm font-mono font-medium',
                    stat.color || 'text-white'
                  )}
                >
                  {stat.value}
                </p>
              </Card>
            ))}
          </div>

          {/* Order Book + Recent Trades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Order Book */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[#8892B0] flex items-center gap-2">
                  <BarChart3 size={14} />
                  Order Book
                </h3>
                <span className="text-xs font-mono text-white">
                  Spread:{' '}
                  {(
                    orderBook.asks[0].price - orderBook.bids[0].price
                  ).toFixed(2)}
                </span>
              </div>

              {/* Header */}
              <div className="grid grid-cols-3 text-xs text-[#4A5568] mb-2 px-1">
                <span>Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
              </div>

              {/* Asks (reversed so lowest ask is at bottom) */}
              <div className="space-y-0.5 mb-2">
                {[...orderBook.asks].reverse().map((ask, i) => (
                  <div
                    key={`ask-${i}`}
                    className="relative grid grid-cols-3 text-xs font-mono py-1 px-1 rounded"
                  >
                    <div
                      className="absolute inset-0 bg-[#FF5B5B]/8 rounded"
                      style={{
                        width: `${(ask.total / maxAskTotal) * 100}%`,
                        right: 0,
                        left: 'auto',
                      }}
                    />
                    <span className="relative text-[#FF5B5B]">
                      {ask.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <span className="relative text-right text-[#8892B0]">
                      {ask.amount.toFixed(4)}
                    </span>
                    <span className="relative text-right text-[#8892B0]">
                      {ask.total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mid price */}
              <div className="text-center py-2 border-y border-[rgba(255,255,255,0.06)]">
                <span className="text-sm font-mono font-bold text-white">
                  {formatUSD(orderBook.midPrice)}
                </span>
              </div>

              {/* Bids */}
              <div className="space-y-0.5 mt-2">
                {orderBook.bids.map((bid, i) => (
                  <div
                    key={`bid-${i}`}
                    className="relative grid grid-cols-3 text-xs font-mono py-1 px-1 rounded"
                  >
                    <div
                      className="absolute inset-0 bg-[#00D4AA]/8 rounded"
                      style={{
                        width: `${(bid.total / maxBidTotal) * 100}%`,
                        right: 0,
                        left: 'auto',
                      }}
                    />
                    <span className="relative text-[#00D4AA]">
                      {bid.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <span className="relative text-right text-[#8892B0]">
                      {bid.amount.toFixed(4)}
                    </span>
                    <span className="relative text-right text-[#8892B0]">
                      {bid.total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Trades */}
            <Card>
              <h3 className="text-sm font-medium text-[#8892B0] flex items-center gap-2 mb-4">
                <List size={14} />
                Recent Trades
              </h3>
              <div className="grid grid-cols-4 text-xs text-[#4A5568] mb-2 px-1">
                <span>Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Side</span>
                <span className="text-right">Time</span>
              </div>
              <div className="space-y-0.5 max-h-[360px] overflow-y-auto scrollbar-hide">
                {recentTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="grid grid-cols-4 text-xs font-mono py-1.5 px-1 hover:bg-[#1B1E36] rounded transition-colors"
                  >
                    <span
                      className={
                        trade.side === 'BUY'
                          ? 'text-[#00D4AA]'
                          : 'text-[#FF5B5B]'
                      }
                    >
                      {trade.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-right text-[#8892B0]">
                      {trade.amount.toFixed(4)}
                    </span>
                    <span
                      className={cn(
                        'text-right font-medium',
                        trade.side === 'BUY'
                          ? 'text-[#00D4AA]'
                          : 'text-[#FF5B5B]'
                      )}
                    >
                      {trade.side}
                    </span>
                    <span className="text-right text-[#4A5568]">
                      {trade.time}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Bottom Panel: Orders ──────────────────────────────────────── */}
      <Card className="mt-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[rgba(255,255,255,0.06)] pb-3">
          {(
            [
              { key: 'open', label: 'Open Orders', count: openOrders.length },
              { key: 'order-history', label: 'Order History' },
              { key: 'trade-history', label: 'Trade History' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setBottomTab(tab.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                bottomTab === tab.key
                  ? 'text-white bg-[#1B1E36]'
                  : 'text-[#8892B0] hover:text-white'
              )}
            >
              {tab.label}
              {'count' in tab && tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-[#7B5EA7] px-1.5 py-0.5 text-xs text-white">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Open Orders */}
        {bottomTab === 'open' && (
          <div className="overflow-x-auto">
            {ordersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height="48px" className="w-full" />
                ))}
              </div>
            ) : openOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#4A5568]">
                <AlertTriangle size={32} className="mb-3" />
                <p className="text-sm">No open orders</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#4A5568] text-xs border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left pb-3 font-medium">Market</th>
                    <th className="text-left pb-3 font-medium">Side</th>
                    <th className="text-left pb-3 font-medium">Type</th>
                    <th className="text-right pb-3 font-medium">Price</th>
                    <th className="text-right pb-3 font-medium">Amount</th>
                    <th className="text-right pb-3 font-medium">Filled</th>
                    <th className="text-right pb-3 font-medium">Status</th>
                    <th className="text-right pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {openOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[#1B1E36]/50 transition-colors"
                    >
                      <td className="py-3 text-white font-medium">
                        {order.market}
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            'font-medium',
                            order.side === 'BUY'
                              ? 'text-[#00D4AA]'
                              : 'text-[#FF5B5B]'
                          )}
                        >
                          {order.side}
                        </span>
                      </td>
                      <td className="py-3 text-[#8892B0]">{order.type}</td>
                      <td className="py-3 text-right font-mono text-white">
                        {order.price ? formatUSD(order.price) : 'Market'}
                      </td>
                      <td className="py-3 text-right font-mono text-white">
                        {order.amount}
                      </td>
                      <td className="py-3 text-right">
                        <Badge
                          variant={
                            order.status === 'PARTIALLY_FILLED'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {order.status === 'PARTIALLY_FILLED' ? 'Partial' : '0%'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Badge variant="info" size="sm">
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => cancelOrderMutation.mutate(order.id)}
                          className="text-[#FF5B5B] hover:text-[#FF5B5B]/80 transition-colors"
                          title="Cancel Order"
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Order History */}
        {bottomTab === 'order-history' && (
          <div className="overflow-x-auto">
            {ordersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height="48px" className="w-full" />
                ))}
              </div>
            ) : closedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#4A5568]">
                <Clock size={32} className="mb-3" />
                <p className="text-sm">No order history</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#4A5568] text-xs border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left pb-3 font-medium">Date</th>
                    <th className="text-left pb-3 font-medium">Market</th>
                    <th className="text-left pb-3 font-medium">Side</th>
                    <th className="text-left pb-3 font-medium">Type</th>
                    <th className="text-right pb-3 font-medium">Price</th>
                    <th className="text-right pb-3 font-medium">Amount</th>
                    <th className="text-right pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {closedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[#1B1E36]/50 transition-colors"
                    >
                      <td className="py-3 text-[#8892B0] text-xs">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-white font-medium">
                        {order.market}
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            'font-medium',
                            order.side === 'BUY'
                              ? 'text-[#00D4AA]'
                              : 'text-[#FF5B5B]'
                          )}
                        >
                          {order.side}
                        </span>
                      </td>
                      <td className="py-3 text-[#8892B0]">{order.type}</td>
                      <td className="py-3 text-right font-mono text-white">
                        {order.price ? formatUSD(order.price) : 'Market'}
                      </td>
                      <td className="py-3 text-right font-mono text-white">
                        {order.amount}
                      </td>
                      <td className="py-3 text-right">
                        <Badge
                          variant={
                            order.status === 'FILLED'
                              ? 'success'
                              : order.status === 'CANCELLED'
                                ? 'error'
                                : 'warning'
                          }
                          size="sm"
                        >
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Trade History */}
        {bottomTab === 'trade-history' && (
          <div className="overflow-x-auto">
            {executionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height="48px" className="w-full" />
                ))}
              </div>
            ) : executions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#4A5568]">
                <TrendingUp size={32} className="mb-3" />
                <p className="text-sm">No trade history</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#4A5568] text-xs border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left pb-3 font-medium">Date</th>
                    <th className="text-left pb-3 font-medium">Market</th>
                    <th className="text-left pb-3 font-medium">Side</th>
                    <th className="text-right pb-3 font-medium">Price</th>
                    <th className="text-right pb-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((exec) => (
                    <tr
                      key={exec.id}
                      className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[#1B1E36]/50 transition-colors"
                    >
                      <td className="py-3 text-[#8892B0] text-xs">
                        {new Date(exec.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 text-white font-medium">
                        {exec.market}
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            'font-medium',
                            exec.side === 'BUY'
                              ? 'text-[#00D4AA]'
                              : 'text-[#FF5B5B]'
                          )}
                        >
                          {exec.side}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-white">
                        {formatUSD(exec.price)}
                      </td>
                      <td className="py-3 text-right font-mono text-white">
                        {exec.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>

      {/* ── Confirmation Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Order"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-[#0D0E1A] p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-[#8892B0]">Side</span>
              <span
                className={cn(
                  'text-sm font-medium',
                  side === 'BUY' ? 'text-[#00D4AA]' : 'text-[#FF5B5B]'
                )}
              >
                {side}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#8892B0]">Market</span>
              <span className="text-sm text-white font-medium">
                {selectedMarket.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#8892B0]">Type</span>
              <span className="text-sm text-white">
                {mode === 'Quote' ? 'Quote Execution' : mode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#8892B0]">Amount</span>
              <span className="text-sm text-white font-mono">
                {amount} {selectedMarket.base}
              </span>
            </div>
            {mode === 'Quote' && quoteData?.price && (
              <div className="flex justify-between">
                <span className="text-sm text-[#8892B0]">
                  Guaranteed Price
                </span>
                <span className="text-sm text-white font-mono">
                  {formatUSD(quoteData.price)}
                </span>
              </div>
            )}
            {(mode === 'Limit' || mode === 'Stop') && price && (
              <div className="flex justify-between">
                <span className="text-sm text-[#8892B0]">Limit Price</span>
                <span className="text-sm text-white font-mono">
                  {formatUSD(price)}
                </span>
              </div>
            )}
            {mode === 'Stop' && stopPrice && (
              <div className="flex justify-between">
                <span className="text-sm text-[#8892B0]">Stop Price</span>
                <span className="text-sm text-white font-mono">
                  {formatUSD(stopPrice)}
                </span>
              </div>
            )}
            <div className="border-t border-[rgba(255,255,255,0.06)] pt-3 flex justify-between">
              <span className="text-sm font-medium text-[#8892B0]">
                Estimated Total
              </span>
              <span className="text-sm font-bold font-mono text-white">
                {formatUSD(
                  (
                    parseFloat(amount || '0') *
                    parseFloat(
                      mode === 'Quote' && quoteData?.price
                        ? quoteData.price
                        : mode === 'Market'
                          ? ticker.last_price
                          : price || ticker.last_price
                    )
                  ).toFixed(2)
                )}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              loading={
                executeQuoteMutation.isPending || placeOrderMutation.isPending
              }
              onClick={handleConfirm}
              className={cn(
                side === 'BUY'
                  ? 'bg-[#00D4AA] hover:bg-[#00D4AA]/80 from-transparent to-transparent'
                  : 'bg-[#FF5B5B] hover:bg-[#FF5B5B]/80 from-transparent to-transparent'
              )}
            >
              Confirm {side === 'BUY' ? 'Buy' : 'Sell'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
