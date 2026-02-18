'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  Download,
  Wallet,
  Landmark,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Globe,
  Clock,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useStore } from '@/store/useStore';

/* ──────────────────────────── Constants ──────────────────────────── */

type Asset = 'BTC' | 'ETH' | 'USDP' | 'PYUSD' | 'USDG' | 'USDL' | 'PAXG';

const ASSET_NETWORKS: Record<Asset, string[]> = {
  BTC: ['BITCOIN'],
  ETH: ['ETHEREUM'],
  USDP: ['ETHEREUM', 'SOLANA'],
  PYUSD: ['ETHEREUM', 'SOLANA', 'STELLAR'],
  USDG: ['ETHEREUM', 'SOLANA', 'INK'],
  USDL: ['ETHEREUM'],
  PAXG: ['ETHEREUM'],
};

const ASSETS = Object.keys(ASSET_NETWORKS) as Asset[];

const ASSET_COLORS: Record<Asset, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  USDP: '#00D4AA',
  PYUSD: '#0070E0',
  USDG: '#7B5EA7',
  USDL: '#1DB954',
  PAXG: '#E5B94E',
};

const NETWORK_LABELS: Record<string, string> = {
  BITCOIN: 'Bitcoin',
  ETHEREUM: 'Ethereum',
  SOLANA: 'Solana',
  STELLAR: 'Stellar',
  INK: 'Ink',
};

/* ──────────────────────────── Helpers ──────────────────────────── */

function truncateAddress(addr: string, front = 8, back = 6): string {
  if (!addr || addr.length <= front + back + 3) return addr || '';
  return `${addr.slice(0, front)}...${addr.slice(-back)}`;
}

function formatDate(iso: string): string {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ──────────────────────────── Copy hook ──────────────────────────── */

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = async (text: string, label: string, key?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key ?? text);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return { copiedKey, copy };
}

/* ──────────────────────────── Tab animation ──────────────────────── */

const tabVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
};

/* ──────────────────────────── Component ──────────────────────────── */

export default function DepositPage() {
  const [activeTab, setActiveTab] = useState<'crypto' | 'fiat'>('crypto');

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7B5EA7] to-[#9B59F5]">
          <Download className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Deposit Funds</h1>
          <p className="text-sm text-[#8892B0]">Add crypto or fiat to your account</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="relative mb-8 flex gap-0 border-b border-[rgba(255,255,255,0.06)]">
        {(['crypto', 'fiat'] as const).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors',
                active ? 'text-white' : 'text-[#8892B0] hover:text-white/70',
              ].join(' ')}
            >
              {tab === 'crypto' ? (
                <Wallet className="h-4 w-4" />
              ) : (
                <Landmark className="h-4 w-4" />
              )}
              {tab === 'crypto' ? 'Crypto' : 'Fiat Wire'}
              {active && (
                <motion.div
                  layoutId="deposit-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#7B5EA7] to-[#00D4AA]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'crypto' ? (
          <motion.div key="crypto" variants={tabVariants} initial="initial" animate="animate" exit="exit">
            <CryptoDepositTab />
          </motion.div>
        ) : (
          <motion.div key="fiat" variants={tabVariants} initial="initial" animate="animate" exit="exit">
            <FiatDepositTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   CRYPTO DEPOSIT TAB
   ════════════════════════════════════════════════════════════════════ */

function CryptoDepositTab() {
  const queryClient = useQueryClient();
  const { copiedKey, copy } = useCopy();
  const activeProfile = useStore((s) => s.activeProfile);

  const [selectedAsset, setSelectedAsset] = useState<Asset | ''>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');

  // Networks for the selected asset
  const availableNetworks = useMemo(
    () => (selectedAsset ? ASSET_NETWORKS[selectedAsset] : []),
    [selectedAsset],
  );

  // Auto-select network when asset changes
  const handleAssetChange = (asset: Asset) => {
    setSelectedAsset(asset);
    const nets = ASSET_NETWORKS[asset];
    setSelectedNetwork(nets.length === 1 ? nets[0] : '');
    generateMutation.reset();
  };

  /* ── Fetch existing addresses ── */
  const {
    data: existingAddresses,
    isLoading: loadingAddresses,
    error: addressesError,
  } = useQuery({
    queryKey: ['deposit-addresses', activeProfile?.id],
    queryFn: async () => {
      const params = activeProfile?.id ? `?profile_id=${activeProfile.id}` : '';
      const res = await fetch(`/api/paxos/deposit-addresses${params}`);
      if (!res.ok) throw new Error('Failed to load deposit addresses');
      return res.json();
    },
    enabled: !!activeProfile?.id,
  });

  /* ── Generate new address ── */
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/paxos/deposit-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: activeProfile?.id,
          crypto_network: selectedNetwork,
          asset: selectedAsset,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate deposit address');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Deposit address generated!');
      queryClient.invalidateQueries({ queryKey: ['deposit-addresses'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const generatedAddress = generateMutation.data;

  const addressItems: any[] = existingAddresses?.items || [];

  return (
    <div className="space-y-6">
      {/* ── Selectors ── */}
      <Card>
        <div className="grid gap-5 md:grid-cols-2">
          {/* Asset selector */}
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-[#8892B0]">Asset</label>
            <div className="relative">
              <select
                value={selectedAsset}
                onChange={(e) => handleAssetChange(e.target.value as Asset)}
                className="w-full appearance-none rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-3 pr-10 text-white outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
              >
                <option value="" disabled>
                  Select asset
                </option>
                {ASSETS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8892B0]" />
            </div>
          </div>

          {/* Network selector */}
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-[#8892B0]">Network</label>
            <div className="relative">
              <select
                value={selectedNetwork}
                onChange={(e) => {
                  setSelectedNetwork(e.target.value);
                  generateMutation.reset();
                }}
                disabled={!selectedAsset}
                className={[
                  'w-full appearance-none rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-3 pr-10 text-white outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]',
                  !selectedAsset ? 'cursor-not-allowed opacity-50' : '',
                ].join(' ')}
              >
                <option value="" disabled>
                  {selectedAsset ? 'Select network' : 'Select asset first'}
                </option>
                {availableNetworks.map((n) => (
                  <option key={n} value={n}>
                    {NETWORK_LABELS[n] || n}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8892B0]" />
            </div>
          </div>
        </div>

        {/* Generate button */}
        <div className="mt-5">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!selectedAsset || !selectedNetwork}
            loading={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            Generate Deposit Address
          </Button>
        </div>
      </Card>

      {/* ── Generated address result ── */}
      <AnimatePresence>
        {generatedAddress && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <Card className="overflow-hidden border-[#7B5EA7]/20 shadow-[0_0_40px_rgba(123,94,167,0.1)]">
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                {/* QR Code */}
                <div className="flex-shrink-0 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#13152A] p-4">
                  <QRCodeSVG
                    value={generatedAddress.address || generatedAddress.crypto_address || ''}
                    size={160}
                    fgColor="#fff"
                    bgColor="#13152A"
                    level="M"
                  />
                </div>

                {/* Address details */}
                <div className="min-w-0 flex-1 space-y-4 text-center md:text-left">
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#8892B0]">
                      Deposit Address
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 break-all rounded-lg bg-[#1B1E36] px-3 py-2 font-mono text-sm text-white">
                        {generatedAddress.address || generatedAddress.crypto_address || '--'}
                      </code>
                      <button
                        onClick={() =>
                          copy(
                            generatedAddress.address || generatedAddress.crypto_address || '',
                            'Address',
                            'gen-address',
                          )
                        }
                        className="flex-shrink-0 rounded-lg p-2 text-[#8892B0] transition-colors hover:bg-[#1B1E36] hover:text-white"
                      >
                        {copiedKey === 'gen-address' ? (
                          <Check className="h-4 w-4 text-[#00D4AA]" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Network badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info" size="sm">
                      <Globe className="mr-1 h-3 w-3" />
                      {NETWORK_LABELS[generatedAddress.crypto_network || selectedNetwork] ||
                        generatedAddress.crypto_network ||
                        selectedNetwork}
                    </Badge>
                    <Badge
                      variant="neutral"
                      size="sm"
                    >
                      {generatedAddress.asset || selectedAsset}
                    </Badge>
                  </div>

                  {/* Warning */}
                  <div className="flex items-start gap-2 rounded-xl border border-[#F5A623]/20 bg-[#F5A623]/5 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#F5A623]" />
                    <p className="text-xs leading-relaxed text-[#F5A623]">
                      Only send <strong>{generatedAddress.asset || selectedAsset}</strong> on the{' '}
                      <strong>
                        {NETWORK_LABELS[generatedAddress.crypto_network || selectedNetwork] ||
                          generatedAddress.crypto_network ||
                          selectedNetwork}
                      </strong>{' '}
                      network. Sending other assets or using the wrong network may result in permanent loss.
                    </p>
                  </div>

                  {/* Memo (if present) */}
                  {(generatedAddress.destination_tag || generatedAddress.memo) && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#8892B0]">
                        Memo / Destination Tag
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="rounded-lg bg-[#1B1E36] px-3 py-2 font-mono text-sm text-white">
                          {generatedAddress.destination_tag || generatedAddress.memo}
                        </code>
                        <button
                          onClick={() =>
                            copy(
                              generatedAddress.destination_tag || generatedAddress.memo || '',
                              'Memo',
                              'gen-memo',
                            )
                          }
                          className="rounded-lg p-2 text-[#8892B0] transition-colors hover:bg-[#1B1E36] hover:text-white"
                        >
                          {copiedKey === 'gen-memo' ? (
                            <Check className="h-4 w-4 text-[#00D4AA]" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Existing addresses table ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Existing Addresses</h2>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['deposit-addresses'] })}
            className="flex items-center gap-1.5 text-xs text-[#8892B0] transition-colors hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {loadingAddresses ? (
          <Card>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </Card>
        ) : addressesError ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertTriangle className="h-8 w-8 text-[#FF5B5B]" />
              <p className="text-sm text-[#FF5B5B]">Failed to load addresses</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['deposit-addresses'] })}
              >
                Try Again
              </Button>
            </div>
          </Card>
        ) : addressItems.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Wallet className="h-8 w-8 text-[#4A5568]" />
              <p className="text-sm text-[#8892B0]">No deposit addresses yet</p>
              <p className="text-xs text-[#4A5568]">Generate your first address above</p>
            </div>
          </Card>
        ) : (
          <Card padding="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)] text-xs uppercase tracking-wider text-[#8892B0]">
                    <th className="px-6 py-3 font-medium">Asset</th>
                    <th className="px-6 py-3 font-medium">Network</th>
                    <th className="px-6 py-3 font-medium">Address</th>
                    <th className="px-6 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {addressItems.map((addr: any, idx: number) => (
                    <tr
                      key={addr.id || idx}
                      className="border-b border-[rgba(255,255,255,0.04)] transition-colors last:border-0 hover:bg-[#1B1E36]/40"
                    >
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 font-medium text-white"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor:
                                ASSET_COLORS[addr.asset as Asset] || '#7B5EA7',
                            }}
                          />
                          {addr.asset}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#8892B0]">
                        {NETWORK_LABELS[addr.crypto_network] || addr.crypto_network || '--'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs text-white/80">
                            {truncateAddress(addr.address || addr.crypto_address || '')}
                          </code>
                          <button
                            onClick={() =>
                              copy(
                                addr.address || addr.crypto_address || '',
                                'Address',
                                `addr-${addr.id || idx}`,
                              )
                            }
                            className="rounded p-1 text-[#4A5568] transition-colors hover:text-white"
                          >
                            {copiedKey === `addr-${addr.id || idx}` ? (
                              <Check className="h-3.5 w-3.5 text-[#00D4AA]" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#8892B0]">
                        {formatDate(addr.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   FIAT (WIRE) DEPOSIT TAB
   ════════════════════════════════════════════════════════════════════ */

function FiatDepositTab() {
  const queryClient = useQueryClient();
  const { copiedKey, copy } = useCopy();

  /* ── Fetch existing instructions ── */
  const {
    data: existingInstructions,
    isLoading: loadingInstructions,
    error: instructionsError,
  } = useQuery({
    queryKey: ['fiat-deposit-instructions'],
    queryFn: async () => {
      const res = await fetch('/api/paxos/fiat-deposit-instructions');
      if (!res.ok) throw new Error('Failed to load wire instructions');
      return res.json();
    },
  });

  /* ── Request new instructions ── */
  const instructionsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/paxos/fiat-deposit-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to get wire instructions');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Wire instructions generated!');
      queryClient.invalidateQueries({ queryKey: ['fiat-deposit-instructions'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const wireData = instructionsMutation.data;

  const wireFields: { label: string; key: string }[] = [
    { label: 'Bank Name', key: 'bank_name' },
    { label: 'Routing Number', key: 'routing_number' },
    { label: 'Account Number', key: 'account_number' },
    { label: 'Beneficiary Name', key: 'beneficiary_name' },
    { label: 'Beneficiary Address', key: 'beneficiary_address' },
    { label: 'Memo / Reference', key: 'memo' },
    { label: 'Reference ID', key: 'reference_id' },
  ];

  const instructionItems: any[] = existingInstructions?.items || [];

  return (
    <div className="space-y-6">
      {/* ── Get wire instructions ── */}
      <Card>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7B5EA7]/20 to-[#00D4AA]/20">
            <Landmark className="h-7 w-7 text-[#00D4AA]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Wire Deposit</h2>
            <p className="mt-1 text-sm text-[#8892B0]">
              Get your unique bank wire instructions to deposit USD into your account.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            loading={instructionsMutation.isPending}
            onClick={() => instructionsMutation.mutate()}
          >
            Get Wire Instructions
          </Button>
        </div>
      </Card>

      {/* ── Wire details result ── */}
      <AnimatePresence>
        {wireData && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <Card className="relative overflow-hidden border-[#00D4AA]/15 shadow-[0_0_60px_rgba(0,212,170,0.06)]">
              {/* Subtle glow accent */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#00D4AA]/5 blur-3xl" />

              <h3 className="mb-4 text-base font-semibold text-white">Wire Transfer Details</h3>

              <div className="space-y-3">
                {wireFields.map(({ label, key }) => {
                  const value = wireData[key];
                  if (!value) return null;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[#1B1E36] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-[#8892B0]">{label}</p>
                        <p className="mt-0.5 break-all font-mono text-sm text-white">{value}</p>
                      </div>
                      <button
                        onClick={() => copy(value, label, `wire-${key}`)}
                        className="flex-shrink-0 rounded-lg p-2 text-[#8892B0] transition-colors hover:bg-[#13152A] hover:text-white"
                      >
                        {copiedKey === `wire-${key}` ? (
                          <Check className="h-4 w-4 text-[#00D4AA]" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Note */}
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#00D4AA]/10 bg-[#00D4AA]/5 p-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#00D4AA]" />
                <p className="text-xs leading-relaxed text-[#00D4AA]">
                  ACH and RTP deposits arrive automatically once the wire is processed by your bank.
                  Domestic wires typically settle same day; international wires may take 1-3 business days.
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Previous instructions table ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Previous Instructions</h2>
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ['fiat-deposit-instructions'] })
            }
            className="flex items-center gap-1.5 text-xs text-[#8892B0] transition-colors hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {loadingInstructions ? (
          <Card>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </Card>
        ) : instructionsError ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertTriangle className="h-8 w-8 text-[#FF5B5B]" />
              <p className="text-sm text-[#FF5B5B]">Failed to load instructions</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ['fiat-deposit-instructions'] })
                }
              >
                Try Again
              </Button>
            </div>
          </Card>
        ) : instructionItems.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Landmark className="h-8 w-8 text-[#4A5568]" />
              <p className="text-sm text-[#8892B0]">No previous wire instructions</p>
              <p className="text-xs text-[#4A5568]">
                Request wire instructions above to get started
              </p>
            </div>
          </Card>
        ) : (
          <Card padding="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)] text-xs uppercase tracking-wider text-[#8892B0]">
                    <th className="px-6 py-3 font-medium">Bank</th>
                    <th className="px-6 py-3 font-medium">Account Number</th>
                    <th className="px-6 py-3 font-medium">Reference</th>
                    <th className="px-6 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {instructionItems.map((inst: any, idx: number) => (
                    <tr
                      key={inst.id || idx}
                      className="border-b border-[rgba(255,255,255,0.04)] transition-colors last:border-0 hover:bg-[#1B1E36]/40"
                    >
                      <td className="px-6 py-4 text-white">
                        {inst.bank_name || '--'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs text-white/80">
                            {inst.account_number
                              ? `****${inst.account_number.slice(-4)}`
                              : '--'}
                          </code>
                          {inst.account_number && (
                            <button
                              onClick={() =>
                                copy(inst.account_number, 'Account Number', `inst-acct-${idx}`)
                              }
                              className="rounded p-1 text-[#4A5568] transition-colors hover:text-white"
                            >
                              {copiedKey === `inst-acct-${idx}` ? (
                                <Check className="h-3.5 w-3.5 text-[#00D4AA]" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#8892B0]">
                        {inst.memo || inst.reference_id || '--'}
                      </td>
                      <td className="px-6 py-4 text-[#8892B0]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(inst.created_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
