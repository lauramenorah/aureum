'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownUp,
  Clock,
  Shield,
  Coins,
  CheckCircle2,
  ChevronDown,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';
import {
  formatAmount,
  formatUSD,
  ASSETS,
  STABLECOIN_PAIRS,
  type AssetKey,
} from '@/lib/utils/assets';
import type { StablecoinConversion, Quote } from '@/lib/paxos/types';
import { useStore } from '@/store/useStore';

// ─── Constants ──────────────────────────────────────────────────────────────

const STABLECOIN_ASSETS: AssetKey[] = ['USD', 'USDP', 'PYUSD', 'USDG', 'USDL'];

type ConvertTab = 'stablecoin' | 'gold';

function getValidTargets(from: AssetKey): AssetKey[] {
  const targets: Set<AssetKey> = new Set();
  for (const [a, b] of STABLECOIN_PAIRS) {
    if (a === from) targets.add(b as AssetKey);
    if (b === from) targets.add(a as AssetKey);
  }
  return Array.from(targets);
}

// ─── Asset Selector Component ───────────────────────────────────────────────

function AssetSelector({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: AssetKey;
  options: AssetKey[];
  onChange: (v: AssetKey) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <label className="block text-sm text-[#8892B0] mb-1.5 font-medium">
        {label}
      </label>
      <div className="relative">
        <button
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={cn(
            'w-full flex items-center justify-between gap-3 bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3.5 text-left transition-all',
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-[#7B5EA7]/40 cursor-pointer'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: ASSETS[value]?.color || '#7B5EA7' }}
            >
              {value.slice(0, 2)}
            </div>
            <div>
              <p className="text-white font-medium">{value}</p>
              <p className="text-xs text-[#8892B0]">{ASSETS[value]?.name}</p>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={cn(
              'text-[#8892B0] transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl bg-[#13152A] border border-[rgba(255,255,255,0.06)] shadow-2xl overflow-hidden"
            >
              {options.map((asset) => (
                <button
                  key={asset}
                  onClick={() => {
                    onChange(asset);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    value === asset
                      ? 'bg-[#1B1E36] text-white'
                      : 'text-[#8892B0] hover:bg-[#1B1E36] hover:text-white'
                  )}
                >
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      backgroundColor: ASSETS[asset]?.color || '#7B5EA7',
                    }}
                  >
                    {asset.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium">{asset}</p>
                    <p className="text-xs text-[#4A5568]">
                      {ASSETS[asset]?.name}
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ConvertPage() {
  const queryClient = useQueryClient();
  const profileId = useStore((s) => s.activeProfile?.id);

  // ── Tab state ────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<ConvertTab>('stablecoin');

  // ── Stablecoin state ─────────────────────────────────────────────────────
  const [fromAsset, setFromAsset] = useState<AssetKey>('USD');
  const [toAsset, setToAsset] = useState<AssetKey>('USDP');
  const [stableAmount, setStableAmount] = useState('');
  const [showStableConfirm, setShowStableConfirm] = useState(false);
  const [conversionResult, setConversionResult] = useState<StablecoinConversion | null>(null);
  const [swapRotation, setSwapRotation] = useState(0);

  // ── Gold state ───────────────────────────────────────────────────────────
  const [goldSide, setGoldSide] = useState<'BUY' | 'SELL'>('BUY');
  const [goldAmount, setGoldAmount] = useState('');
  const [goldQuote, setGoldQuote] = useState<Quote | null>(null);
  const [goldCountdown, setGoldCountdown] = useState(0);
  const [showGoldConfirm, setShowGoldConfirm] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────
  const validTargets = useMemo(() => getValidTargets(fromAsset), [fromAsset]);

  // Auto-fix toAsset if invalid pair
  useEffect(() => {
    if (!validTargets.includes(toAsset)) {
      setToAsset(validTargets[0] || 'USDP');
    }
  }, [fromAsset, validTargets, toAsset]);

  // ── Swap assets ──────────────────────────────────────────────────────────
  const handleSwap = useCallback(() => {
    const newFrom = toAsset;
    const newTo = fromAsset;
    setFromAsset(newFrom);
    setToAsset(newTo);
    setSwapRotation((prev) => prev + 180);
  }, [fromAsset, toAsset]);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: conversionsData, isLoading: conversionsLoading } = useQuery({
    queryKey: ['stablecoin-conversions'],
    queryFn: async () => {
      const res = await fetch('/api/paxos/stablecoin-conversions');
      if (!res.ok) throw new Error('Failed to fetch conversions');
      return res.json();
    },
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const convertMutation = useMutation({
    mutationFn: async (payload: {
      from_asset: string;
      to_asset: string;
      amount: string;
    }) => {
      const res = await fetch('/api/paxos/stablecoin-conversions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          source_asset: payload.from_asset,
          target_asset: payload.to_asset,
          amount: payload.amount,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Conversion failed');
      }
      return res.json() as Promise<StablecoinConversion>;
    },
    onSuccess: (data) => {
      toast.success('Conversion completed');
      setShowStableConfirm(false);
      setConversionResult(data);
      setStableAmount('');
      queryClient.invalidateQueries({ queryKey: ['stablecoin-conversions'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const getGoldQuoteMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({
        market: 'PAXGUSD',
        side: goldSide,
        amount: goldAmount,
      });
      const res = await fetch(`/api/paxos/quotes?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get gold quote');
      }
      return res.json() as Promise<Quote>;
    },
    onSuccess: (data) => {
      setGoldQuote(data);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const executeGoldQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await fetch('/api/paxos/quote-executions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quoteId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to execute gold quote');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Gold trade executed successfully');
      setShowGoldConfirm(false);
      setGoldQuote(null);
      setGoldAmount('');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // ── Gold countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!goldQuote?.expires_at) return;
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor(
          (new Date(goldQuote.expires_at).getTime() - Date.now()) / 1000
        )
      );
      setGoldCountdown(remaining);
      if (remaining <= 0) setGoldQuote(null);
    }, 1000);
    return () => clearInterval(interval);
  }, [goldQuote]);

  // ── Data ─────────────────────────────────────────────────────────────────
  const conversions: StablecoinConversion[] =
    Array.isArray(conversionsData?.items) ? conversionsData.items : Array.isArray(conversionsData) ? conversionsData : [];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Convert</h1>
        <p className="text-[#8892B0] text-sm">
          Instantly convert between stablecoins at 1:1 with zero fees, or trade
          tokenized gold.
        </p>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-1 rounded-xl bg-[#13152A] border border-[rgba(255,255,255,0.06)] p-1 mb-6 max-w-sm">
        <button
          onClick={() => setTab('stablecoin')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all',
            tab === 'stablecoin'
              ? 'bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] text-white shadow-lg'
              : 'text-[#8892B0] hover:text-white'
          )}
        >
          <Coins size={16} />
          Stablecoins
        </button>
        <button
          onClick={() => setTab('gold')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all',
            tab === 'gold'
              ? 'bg-gradient-to-r from-[#F5A623] to-[#D4911F] text-white shadow-lg'
              : 'text-[#8892B0] hover:text-white'
          )}
        >
          <Shield size={16} />
          Gold (PAXG)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Main Panel ────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {/* ── Stablecoin Tab ──────────────────────────────────────── */}
            {tab === 'stablecoin' && (
              <motion.div
                key="stablecoin"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <div className="space-y-5">
                    {/* Info banner */}
                    <div className="flex items-start gap-3 rounded-xl bg-[#7B5EA7]/10 border border-[#7B5EA7]/20 p-3">
                      <Info size={16} className="text-[#9B59F5] mt-0.5 shrink-0" />
                      <p className="text-xs text-[#9B59F5]">
                        All stablecoin conversions are 1:1 with $0.00 fees. Your
                        funds are available instantly.
                      </p>
                    </div>

                    {/* From */}
                    <AssetSelector
                      label="From"
                      value={fromAsset}
                      options={STABLECOIN_ASSETS}
                      onChange={setFromAsset}
                    />

                    {/* Swap button */}
                    <div className="flex justify-center -my-1">
                      <motion.button
                        onClick={handleSwap}
                        animate={{ rotate: swapRotation }}
                        transition={{ duration: 0.3 }}
                        className="p-3 rounded-full bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] text-[#8892B0] hover:text-white hover:border-[#7B5EA7]/40 transition-colors"
                      >
                        <ArrowDownUp size={20} />
                      </motion.button>
                    </div>

                    {/* To */}
                    <AssetSelector
                      label="To"
                      value={toAsset}
                      options={validTargets}
                      onChange={setToAsset}
                    />

                    {/* Amount */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-[#8892B0] font-medium">
                          Amount
                        </label>
                        <span className="text-xs text-[#4A5568]">
                          Available: {formatAmount('10000', fromAsset)}{' '}
                          {fromAsset}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={stableAmount}
                          onChange={(e) =>
                            setStableAmount(
                              e.target.value.replace(/[^0-9.]/g, '')
                            )
                          }
                          placeholder="0.00"
                          className="w-full bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-4 pr-16 text-white font-mono text-2xl placeholder-[#4A5568] focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] outline-none transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8892B0]">
                          {fromAsset}
                        </span>
                      </div>
                    </div>

                    {/* You will receive */}
                    {stableAmount && parseFloat(stableAmount) > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl bg-[#0D0E1A] p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#8892B0]">
                            You will receive
                          </span>
                          <span className="text-lg font-bold font-mono text-white">
                            {formatAmount(stableAmount, toAsset)} {toAsset}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#4A5568]">
                            Conversion fee
                          </span>
                          <span className="text-xs text-[#00D4AA] font-medium">
                            $0.00
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-[#4A5568]">Rate</span>
                          <span className="text-xs text-white font-mono">
                            1 {fromAsset} = 1 {toAsset}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Convert button */}
                    <Button
                      fullWidth
                      size="lg"
                      disabled={
                        !stableAmount || parseFloat(stableAmount) <= 0
                      }
                      onClick={() => setShowStableConfirm(true)}
                    >
                      Convert {fromAsset} to {toAsset}
                    </Button>
                  </div>
                </Card>

                {/* Conversion Result */}
                <AnimatePresence>
                  {conversionResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                    >
                      <Card className="mt-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 rounded-full bg-[#00D4AA]/10 flex items-center justify-center">
                            <CheckCircle2
                              size={20}
                              className="text-[#00D4AA]"
                            />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              Conversion Successful
                            </p>
                            <p className="text-xs text-[#8892B0]">
                              ID: {conversionResult.id}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-xl bg-[#0D0E1A] p-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[#8892B0]">From</span>
                            <span className="text-white font-mono">
                              {conversionResult.amount}{' '}
                              {conversionResult.source_asset || conversionResult.from_asset}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#8892B0]">To</span>
                            <span className="text-white font-mono">
                              {conversionResult.amount}{' '}
                              {conversionResult.target_asset || conversionResult.to_asset}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#8892B0]">Status</span>
                            <Badge variant="success" size="sm">
                              {conversionResult.status}
                            </Badge>
                          </div>
                        </div>
                        <button
                          onClick={() => setConversionResult(null)}
                          className="mt-3 w-full text-sm text-[#8892B0] hover:text-white transition-colors"
                        >
                          Dismiss
                        </button>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── Gold Tab ────────────────────────────────────────────── */}
            {tab === 'gold' && (
              <motion.div
                key="gold"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <div className="space-y-5">
                    {/* Gold info */}
                    <div className="flex items-start gap-3 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/20 p-3">
                      <Shield
                        size={16}
                        className="text-[#F5A623] mt-0.5 shrink-0"
                      />
                      <div className="text-xs text-[#F5A623]">
                        <p className="font-medium mb-1">PAX Gold (PAXG)</p>
                        <p className="text-[#F5A623]/80">
                          Each PAXG token is backed by one fine troy ounce of a
                          London Good Delivery gold bar. Unavailable when London
                          gold market is closed.
                        </p>
                      </div>
                    </div>

                    {/* Buy/Sell toggle */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setGoldSide('BUY')}
                        className={cn(
                          'py-3.5 rounded-xl font-semibold text-sm transition-all',
                          goldSide === 'BUY'
                            ? 'bg-[#00D4AA] text-white shadow-[0_0_20px_rgba(0,212,170,0.3)]'
                            : 'bg-[#1B1E36] text-[#8892B0] hover:text-white'
                        )}
                      >
                        Buy PAXG
                      </button>
                      <button
                        onClick={() => setGoldSide('SELL')}
                        className={cn(
                          'py-3.5 rounded-xl font-semibold text-sm transition-all',
                          goldSide === 'SELL'
                            ? 'bg-[#FF5B5B] text-white shadow-[0_0_20px_rgba(255,91,91,0.3)]'
                            : 'bg-[#1B1E36] text-[#8892B0] hover:text-white'
                        )}
                      >
                        Sell PAXG
                      </button>
                    </div>

                    {/* Amount input */}
                    <div>
                      <label className="block text-sm text-[#8892B0] mb-1.5 font-medium">
                        {goldSide === 'BUY'
                          ? 'Amount (USD)'
                          : 'Amount (PAXG)'}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={goldAmount}
                        onChange={(e) =>
                          setGoldAmount(
                            e.target.value.replace(/[^0-9.]/g, '')
                          )
                        }
                        placeholder="0.00"
                        className="w-full bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-4 text-white font-mono text-2xl placeholder-[#4A5568] focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] outline-none transition-all"
                      />
                    </div>

                    {/* Quote result */}
                    {goldQuote && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl bg-[#0D0E1A] p-4 space-y-3"
                      >
                        <div className="flex justify-between">
                          <span className="text-sm text-[#8892B0]">
                            Guaranteed Price
                          </span>
                          <span className="text-lg font-bold font-mono text-[#F5A623]">
                            {formatUSD(goldQuote.price)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-[#8892B0]">
                            {goldSide === 'BUY'
                              ? 'You will receive'
                              : 'You will receive'}
                          </span>
                          <span className="text-sm font-mono text-white">
                            {goldSide === 'BUY'
                              ? `${(parseFloat(goldAmount || '0') / parseFloat(goldQuote.price)).toFixed(4)} PAXG`
                              : formatUSD(
                                  (
                                    parseFloat(goldAmount || '0') *
                                    parseFloat(goldQuote.price)
                                  ).toFixed(2)
                                )}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <Clock size={14} className="text-[#8892B0]" />
                          <span className="text-[#8892B0]">
                            Expires in{' '}
                            <span
                              className={cn(
                                'font-mono font-medium',
                                goldCountdown <= 5
                                  ? 'text-[#FF5B5B]'
                                  : 'text-white'
                              )}
                            >
                              {goldCountdown}s
                            </span>
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Buttons */}
                    {!goldQuote ? (
                      <Button
                        fullWidth
                        size="lg"
                        disabled={
                          !goldAmount || parseFloat(goldAmount) <= 0
                        }
                        loading={getGoldQuoteMutation.isPending}
                        onClick={() => getGoldQuoteMutation.mutate()}
                        className="bg-gradient-to-r from-[#F5A623] to-[#D4911F] from-transparent to-transparent hover:shadow-[0_0_20px_rgba(245,166,35,0.3)]"
                      >
                        Get Quote
                      </Button>
                    ) : (
                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          fullWidth
                          onClick={() => setGoldQuote(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          fullWidth
                          size="lg"
                          loading={executeGoldQuoteMutation.isPending}
                          onClick={() => setShowGoldConfirm(true)}
                          className="bg-gradient-to-r from-[#F5A623] to-[#D4911F] from-transparent to-transparent hover:shadow-[0_0_20px_rgba(245,166,35,0.3)]"
                        >
                          Execute Trade
                        </Button>
                      </div>
                    )}

                    {/* Gold spot info */}
                    <div className="rounded-xl bg-[#0D0E1A] p-3 flex items-center justify-between">
                      <span className="text-xs text-[#4A5568]">
                        PAXG Spot Price
                      </span>
                      <span className="text-sm font-mono text-[#F5A623] font-medium">
                        {formatUSD(2051.3)}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Conversion History ──────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">
              Conversion History
            </h3>

            {conversionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} height="56px" className="w-full" />
                ))}
              </div>
            ) : conversions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#4A5568]">
                <ArrowDownUp size={40} className="mb-3 opacity-50" />
                <p className="text-sm font-medium mb-1">
                  No conversions yet
                </p>
                <p className="text-xs">
                  Your conversion history will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#4A5568] text-xs border-b border-[rgba(255,255,255,0.06)]">
                      <th className="text-left pb-3 font-medium">Date</th>
                      <th className="text-left pb-3 font-medium">From</th>
                      <th className="text-center pb-3 font-medium" />
                      <th className="text-left pb-3 font-medium">To</th>
                      <th className="text-right pb-3 font-medium">Status</th>
                      <th className="text-right pb-3 font-medium">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversions.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[#1B1E36]/50 transition-colors"
                      >
                        <td className="py-3.5 text-[#8892B0] text-xs whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                              style={{
                                backgroundColor:
                                  ASSETS[(c.source_asset || c.from_asset) as AssetKey]?.color ||
                                  '#7B5EA7',
                              }}
                            >
                              {(c.source_asset || c.from_asset).slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-white font-mono text-sm">
                                {formatAmount(c.amount, (c.source_asset || c.from_asset))}
                              </p>
                              <p className="text-xs text-[#4A5568]">
                                {(c.source_asset || c.from_asset)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-center text-[#4A5568]">
                          <ArrowDownUp size={12} className="inline rotate-90" />
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                              style={{
                                backgroundColor:
                                  ASSETS[(c.target_asset || c.to_asset) as AssetKey]?.color ||
                                  '#7B5EA7',
                              }}
                            >
                              {(c.target_asset || c.to_asset).slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-white font-mono text-sm">
                                {formatAmount(c.amount, (c.target_asset || c.to_asset))}
                              </p>
                              <p className="text-xs text-[#4A5568]">
                                {(c.target_asset || c.to_asset)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-right">
                          <Badge
                            variant={
                              c.status === 'COMPLETED'
                                ? 'success'
                                : c.status === 'PENDING'
                                  ? 'warning'
                                  : c.status === 'FAILED'
                                    ? 'error'
                                    : 'neutral'
                            }
                            size="sm"
                          >
                            {c.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-right">
                          <span className="text-xs text-[#4A5568] font-mono">
                            {c.id.slice(0, 8)}...
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Stablecoin Confirmation Modal ─────────────────────────────── */}
      <Modal
        isOpen={showStableConfirm}
        onClose={() => setShowStableConfirm(false)}
        title="Confirm Conversion"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-[#0D0E1A] p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-[#8892B0]">From</span>
              <span className="text-sm text-white font-mono">
                {stableAmount} {fromAsset}
              </span>
            </div>
            <div className="flex justify-center">
              <ArrowDownUp size={16} className="text-[#4A5568]" />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#8892B0]">To</span>
              <span className="text-sm text-white font-mono">
                {stableAmount} {toAsset}
              </span>
            </div>
            <div className="border-t border-[rgba(255,255,255,0.06)] pt-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#8892B0]">Rate</span>
                <span className="text-sm text-white font-mono">1:1</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-sm text-[#8892B0]">Fee</span>
                <span className="text-sm text-[#00D4AA] font-medium">
                  $0.00
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setShowStableConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              loading={convertMutation.isPending}
              onClick={() =>
                convertMutation.mutate({
                  from_asset: fromAsset,
                  to_asset: toAsset,
                  amount: stableAmount,
                })
              }
            >
              Confirm Conversion
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Gold Confirmation Modal ───────────────────────────────────── */}
      <Modal
        isOpen={showGoldConfirm}
        onClose={() => setShowGoldConfirm(false)}
        title="Confirm Gold Trade"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-[#0D0E1A] p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-[#8892B0]">Side</span>
              <span
                className={cn(
                  'text-sm font-medium',
                  goldSide === 'BUY' ? 'text-[#00D4AA]' : 'text-[#FF5B5B]'
                )}
              >
                {goldSide}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#8892B0]">Market</span>
              <span className="text-sm text-white">PAXG / USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#8892B0]">Amount</span>
              <span className="text-sm text-white font-mono">
                {goldAmount} {goldSide === 'BUY' ? 'USD' : 'PAXG'}
              </span>
            </div>
            {goldQuote && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-[#8892B0]">
                    Guaranteed Price
                  </span>
                  <span className="text-sm text-[#F5A623] font-mono font-bold">
                    {formatUSD(goldQuote.price)}
                  </span>
                </div>
                <div className="border-t border-[rgba(255,255,255,0.06)] pt-3 flex justify-between">
                  <span className="text-sm font-medium text-[#8892B0]">
                    {goldSide === 'BUY'
                      ? 'You will receive'
                      : 'You will receive'}
                  </span>
                  <span className="text-sm font-bold font-mono text-white">
                    {goldSide === 'BUY'
                      ? `${(parseFloat(goldAmount || '0') / parseFloat(goldQuote.price)).toFixed(4)} PAXG`
                      : formatUSD(
                          (
                            parseFloat(goldAmount || '0') *
                            parseFloat(goldQuote.price)
                          ).toFixed(2)
                        )}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setShowGoldConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              loading={executeGoldQuoteMutation.isPending}
              onClick={() => {
                if (goldQuote?.id) {
                  executeGoldQuoteMutation.mutate(goldQuote.id);
                }
              }}
              className="bg-gradient-to-r from-[#F5A623] to-[#D4911F] from-transparent to-transparent"
            >
              Confirm Trade
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
