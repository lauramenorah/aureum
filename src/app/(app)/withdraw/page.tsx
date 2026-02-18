'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowUpRight,
  Wallet,
  Landmark,
  Check,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Clock,
  Info,
  Plus,
  Minus,
  X,
  Shield,
  Building2,
  CreditCard,
  Bookmark,
  CheckCircle2,
  Circle,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

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

const ALL_ASSETS = Object.keys(ASSET_NETWORKS) as Asset[];

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

function formatUsd(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatCrypto(value: string | number, asset: string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return `0 ${asset}`;
  const decimals = asset === 'BTC' ? 8 : asset === 'ETH' ? 6 : 2;
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: decimals })} ${asset}`;
}

/* ──────────────────────────── Tab animation ──────────────────────── */

const tabVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
};

/* ──────────────────────────── Status tracker ──────────────────────── */

const STATUS_STEPS = ['PENDING', 'PROCESSING', 'COMPLETED'] as const;

function StatusTracker({ status }: { status: string }) {
  const normalizedStatus = status?.toUpperCase() || 'PENDING';
  const isFailed = normalizedStatus === 'FAILED' || normalizedStatus === 'CANCELLED';

  const currentIdx = isFailed
    ? -1
    : STATUS_STEPS.findIndex((s) => s === normalizedStatus);

  return (
    <div className="mt-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#8892B0]">
        Transfer Status
      </p>

      {isFailed ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#FF5B5B]/20 bg-[#FF5B5B]/5 px-4 py-3">
          <X className="h-5 w-5 text-[#FF5B5B]" />
          <span className="text-sm font-medium text-[#FF5B5B]">
            Transfer {normalizedStatus.toLowerCase()}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <React.Fragment key={step}>
                <div className="flex items-center gap-2">
                  <div
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                      isCompleted
                        ? 'bg-[#00D4AA]'
                        : 'border border-[rgba(255,255,255,0.1)] bg-[#1B1E36]',
                    ].join(' ')}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : (
                      <Circle className="h-4 w-4 text-[#4A5568]" />
                    )}
                  </div>
                  <span
                    className={[
                      'text-xs font-medium capitalize',
                      isCompleted ? 'text-white' : 'text-[#4A5568]',
                      isCurrent ? 'animate-pulse' : '',
                    ].join(' ')}
                  >
                    {step.toLowerCase()}
                  </span>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div
                    className={[
                      'h-0.5 flex-1',
                      idx < currentIdx ? 'bg-[#00D4AA]' : 'bg-[rgba(255,255,255,0.06)]',
                    ].join(' ')}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── Main Component ──────────────────────── */

export default function WithdrawPage() {
  const [activeTab, setActiveTab] = useState<'crypto' | 'fiat'>('crypto');

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7B5EA7] to-[#9B59F5]">
          <ArrowUpRight className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Withdraw Funds</h1>
          <p className="text-sm text-[#8892B0]">Send crypto or wire fiat to external accounts</p>
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
                  layoutId="withdraw-tab-indicator"
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
            <CryptoWithdrawTab />
          </motion.div>
        ) : (
          <motion.div key="fiat" variants={tabVariants} initial="initial" animate="animate" exit="exit">
            <FiatWithdrawTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   CRYPTO WITHDRAWAL TAB
   ════════════════════════════════════════════════════════════════════ */

function CryptoWithdrawTab() {
  const queryClient = useQueryClient();

  const [selectedAsset, setSelectedAsset] = useState<Asset | ''>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressNickname, setAddressNickname] = useState('');
  const [amount, setAmount] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Submitted transfer for status tracking
  const [submittedTransfer, setSubmittedTransfer] = useState<any>(null);

  // Networks for the selected asset
  const availableNetworks = useMemo(
    () => (selectedAsset ? ASSET_NETWORKS[selectedAsset] : []),
    [selectedAsset],
  );

  /* ── Fetch balances ── */
  const { data: balancesData } = useQuery({
    queryKey: ['balances'],
    queryFn: async () => {
      const res = await fetch('/api/paxos/balances?profile_id=default');
      if (!res.ok) throw new Error('Failed to load balances');
      return res.json();
    },
  });

  const balances: any[] = balancesData?.items || [];

  const getBalance = (asset: string): string => {
    const b = balances.find(
      (bal: any) => bal.asset?.toUpperCase() === asset?.toUpperCase(),
    );
    return b?.available || b?.total || '0';
  };

  /* ── Fetch saved destination addresses ── */
  const { data: savedAddressesData } = useQuery({
    queryKey: ['crypto-destination-addresses'],
    queryFn: async () => {
      const res = await fetch('/api/paxos/crypto-destination-addresses');
      if (!res.ok) throw new Error('Failed to load saved addresses');
      return res.json();
    },
  });

  const savedAddresses: any[] = savedAddressesData?.items || [];

  /* ── Fee estimate ── */
  const feeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/paxos/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: selectedAsset,
          crypto_network: selectedNetwork,
          amount: amount,
          destination_address: destinationAddress,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to estimate fee');
      }
      return res.json();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  /* ── Submit withdrawal ── */
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const body: any = {
        asset: selectedAsset,
        crypto_network: selectedNetwork,
        amount: amount,
        destination_address: destinationAddress,
      };

      const res = await fetch('/api/paxos/crypto-withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Withdrawal failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Withdrawal submitted!');
      setShowConfirmModal(false);
      setSubmittedTransfer(data);
      queryClient.invalidateQueries({ queryKey: ['balances'] });

      // Save address if requested
      if (saveAddress && addressNickname) {
        fetch('/api/paxos/crypto-destination-addresses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: destinationAddress,
            crypto_network: selectedNetwork,
            asset: selectedAsset,
            name: addressNickname,
          }),
        })
          .then(() => {
            toast.success('Address saved!');
            queryClient.invalidateQueries({
              queryKey: ['crypto-destination-addresses'],
            });
          })
          .catch(() => {
            toast.error('Failed to save address');
          });
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  /* ── Polling transfer status ── */
  const { data: transferStatus } = useQuery({
    queryKey: ['transfer-status', submittedTransfer?.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/paxos/transfers?limit=1&type=CRYPTO_WITHDRAWAL`,
      );
      if (!res.ok) throw new Error('Failed to check status');
      const data = await res.json();
      return data?.items?.[0] || submittedTransfer;
    },
    enabled: !!submittedTransfer,
    refetchInterval: (query) => {
      const status = query.state.data?.status?.toUpperCase();
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
        return false;
      }
      return 5000;
    },
  });

  const handleAssetChange = (asset: Asset) => {
    setSelectedAsset(asset);
    const nets = ASSET_NETWORKS[asset];
    setSelectedNetwork(nets.length === 1 ? nets[0] : '');
    feeMutation.reset();
  };

  const handleMaxAmount = () => {
    if (selectedAsset) {
      setAmount(getBalance(selectedAsset));
    }
  };

  const feeData = feeMutation.data;
  const totalDeducted =
    feeData && amount
      ? (parseFloat(amount) + parseFloat(feeData.fee || feeData.amount || '0')).toFixed(8)
      : '';

  const canEstimateFee =
    selectedAsset && selectedNetwork && destinationAddress && amount && parseFloat(amount) > 0;

  const canSubmit = canEstimateFee && feeData;

  return (
    <div className="space-y-6">
      {/* ── Submitted transfer status ── */}
      {submittedTransfer && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-[#00D4AA]/15 shadow-[0_0_40px_rgba(0,212,170,0.08)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Withdrawal Submitted</h3>
              <Badge variant="success" size="sm">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Sent
              </Badge>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-[#1B1E36] px-4 py-3">
                <p className="text-xs text-[#8892B0]">Amount</p>
                <p className="mt-0.5 font-mono text-white">
                  {formatCrypto(submittedTransfer.amount || amount, (submittedTransfer.asset || selectedAsset) as string)}
                </p>
              </div>
              <div className="rounded-xl bg-[#1B1E36] px-4 py-3">
                <p className="text-xs text-[#8892B0]">Destination</p>
                <p className="mt-0.5 font-mono text-xs text-white">
                  {truncateAddress(submittedTransfer.destination_address || destinationAddress)}
                </p>
              </div>
            </div>

            <StatusTracker
              status={
                transferStatus?.status || submittedTransfer?.status || 'PENDING'
              }
            />

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSubmittedTransfer(null);
                  setAmount('');
                  setDestinationAddress('');
                  feeMutation.reset();
                }}
              >
                New Withdrawal
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Withdrawal form ── */}
      {!submittedTransfer && (
        <>
          <Card>
            <h3 className="mb-4 text-base font-semibold text-white">Withdrawal Details</h3>

            <div className="space-y-5">
              {/* Asset & Network selectors */}
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
                      {ALL_ASSETS.map((a) => {
                        const bal = getBalance(a);
                        return (
                          <option key={a} value={a}>
                            {a} {bal !== '0' ? `(${bal} available)` : ''}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8892B0]" />
                  </div>
                </div>

                {/* Network selector */}
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-[#8892B0]">
                    Network
                  </label>
                  <div className="relative">
                    <select
                      value={selectedNetwork}
                      onChange={(e) => {
                        setSelectedNetwork(e.target.value);
                        feeMutation.reset();
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

              {/* Destination address */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-[#8892B0]">Destination Address</label>
                  {savedAddresses.length > 0 && (
                    <button
                      onClick={() => setUseSavedAddress(!useSavedAddress)}
                      className="flex items-center gap-1 text-xs text-[#7B5EA7] transition-colors hover:text-[#9B59F5]"
                    >
                      <Bookmark className="h-3 w-3" />
                      {useSavedAddress ? 'Enter manually' : 'Use saved'}
                    </button>
                  )}
                </div>

                {useSavedAddress && savedAddresses.length > 0 ? (
                  <div className="relative">
                    <select
                      value={destinationAddress}
                      onChange={(e) => setDestinationAddress(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-3 pr-10 text-white outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
                    >
                      <option value="" disabled>
                        Select saved address
                      </option>
                      {savedAddresses.map((sa: any, idx: number) => (
                        <option
                          key={sa.id || idx}
                          value={sa.address || sa.crypto_address || ''}
                        >
                          {sa.name || sa.nickname || truncateAddress(sa.address || sa.crypto_address || '')}{' '}
                          ({sa.asset || ''} - {NETWORK_LABELS[sa.crypto_network] || sa.crypto_network || ''})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8892B0]" />
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter wallet address"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-3 font-mono text-sm text-white placeholder-[#4A5568] outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
                  />
                )}

                {/* Save address checkbox */}
                {!useSavedAddress && destinationAddress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 space-y-2"
                  >
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="h-4 w-4 rounded border-[rgba(255,255,255,0.06)] bg-[#1B1E36] text-[#7B5EA7] focus:ring-[#7B5EA7]"
                      />
                      <span className="text-sm text-[#8892B0]">Save this address</span>
                    </label>

                    {saveAddress && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                      >
                        <input
                          type="text"
                          placeholder="Nickname (e.g. My Ledger)"
                          value={addressNickname}
                          onChange={(e) => setAddressNickname(e.target.value)}
                          className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-2.5 text-sm text-white placeholder-[#4A5568] outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Amount input */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-[#8892B0]">Amount</label>
                  {selectedAsset && (
                    <span className="text-xs text-[#4A5568]">
                      Available:{' '}
                      <span className="text-[#8892B0]">
                        {formatCrypto(getBalance(selectedAsset), selectedAsset)}
                      </span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      if (val.split('.').length <= 2) {
                        setAmount(val);
                        feeMutation.reset();
                      }
                    }}
                    className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-4 pr-20 font-mono text-2xl text-white placeholder-[#4A5568] outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
                  />
                  <button
                    onClick={handleMaxAmount}
                    disabled={!selectedAsset}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-[#7B5EA7]/20 px-3 py-1.5 text-xs font-semibold text-[#7B5EA7] transition-colors hover:bg-[#7B5EA7]/30 disabled:opacity-40"
                  >
                    MAX
                  </button>
                </div>

                {/* Amount validation */}
                {amount && selectedAsset && parseFloat(amount) > parseFloat(getBalance(selectedAsset)) && (
                  <p className="mt-1.5 text-sm text-[#FF5B5B]">
                    Insufficient balance
                  </p>
                )}
              </div>

              {/* Fee estimate button */}
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                disabled={!canEstimateFee}
                loading={feeMutation.isPending}
                onClick={() => feeMutation.mutate()}
              >
                Get Fee Estimate
              </Button>
            </div>
          </Card>

          {/* ── Fee estimate result ── */}
          <AnimatePresence>
            {feeData && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
              >
                <Card className="border-[#7B5EA7]/15">
                  <h3 className="mb-3 text-sm font-semibold text-white">Fee Estimate</h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-[#1B1E36] px-4 py-3">
                      <span className="text-sm text-[#8892B0]">Network Fee</span>
                      <span className="font-mono text-sm text-white">
                        {formatCrypto(
                          feeData.fee || feeData.amount || '0',
                          (selectedAsset || '') as string,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[#1B1E36] px-4 py-3">
                      <span className="text-sm text-[#8892B0]">You Send</span>
                      <span className="font-mono text-sm text-white">
                        {formatCrypto(amount, (selectedAsset || '') as string)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-[#7B5EA7]/20 bg-[#7B5EA7]/5 px-4 py-3">
                      <span className="text-sm font-medium text-white">Total Deducted</span>
                      <span className="font-mono text-sm font-semibold text-white">
                        {formatCrypto(totalDeducted, (selectedAsset || '') as string)}
                      </span>
                    </div>
                    {feeData.estimated_arrival && (
                      <div className="flex items-center gap-2 pt-1 text-xs text-[#8892B0]">
                        <Clock className="h-3.5 w-3.5" />
                        Estimated arrival: {feeData.estimated_arrival}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      disabled={!canSubmit}
                      onClick={() => setShowConfirmModal(true)}
                    >
                      <Shield className="h-4 w-4" />
                      Review & Confirm
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Confirm modal ── */}
          <Modal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            title="Confirm Withdrawal"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-[#1B1E36] px-4 py-3">
                  <span className="text-sm text-[#8892B0]">Asset</span>
                  <span className="flex items-center gap-1.5 font-medium text-white">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          ASSET_COLORS[selectedAsset as Asset] || '#7B5EA7',
                      }}
                    />
                    {selectedAsset}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#1B1E36] px-4 py-3">
                  <span className="text-sm text-[#8892B0]">Network</span>
                  <span className="text-sm text-white">
                    {NETWORK_LABELS[selectedNetwork] || selectedNetwork}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#1B1E36] px-4 py-3">
                  <span className="text-sm text-[#8892B0]">Amount</span>
                  <span className="font-mono text-sm font-semibold text-white">
                    {formatCrypto(amount, (selectedAsset || '') as string)}
                  </span>
                </div>

                <div className="rounded-xl bg-[#1B1E36] px-4 py-3">
                  <span className="text-sm text-[#8892B0]">Destination</span>
                  <p className="mt-1 break-all font-mono text-xs text-white">
                    {destinationAddress}
                  </p>
                </div>

                {feeData && (
                  <div className="flex items-center justify-between rounded-xl bg-[#1B1E36] px-4 py-3">
                    <span className="text-sm text-[#8892B0]">Network Fee</span>
                    <span className="font-mono text-sm text-[#F5A623]">
                      {formatCrypto(
                        feeData.fee || feeData.amount || '0',
                        (selectedAsset || '') as string,
                      )}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-xl border border-[#7B5EA7]/20 bg-[#7B5EA7]/5 px-4 py-3">
                  <span className="text-sm font-medium text-white">Total Deducted</span>
                  <span className="font-mono text-sm font-bold text-white">
                    {formatCrypto(totalDeducted, (selectedAsset || '') as string)}
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 rounded-xl border border-[#F5A623]/20 bg-[#F5A623]/5 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#F5A623]" />
                <p className="text-xs leading-relaxed text-[#F5A623]">
                  This action cannot be undone. Please verify the destination address and network
                  are correct before confirming.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  loading={withdrawMutation.isPending}
                  onClick={() => withdrawMutation.mutate()}
                >
                  Confirm Withdrawal
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   FIAT (WIRE) WITHDRAWAL TAB
   ════════════════════════════════════════════════════════════════════ */

function FiatWithdrawTab() {
  const queryClient = useQueryClient();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittedTransfer, setSubmittedTransfer] = useState<any>(null);

  // New bank account form
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    beneficiary_name: '',
    account_number: '',
    routing_number: '',
    account_type: 'CHECKING' as 'CHECKING' | 'SAVINGS',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
  });

  /* ── Fetch balances ── */
  const { data: balancesData } = useQuery({
    queryKey: ['balances'],
    queryFn: async () => {
      const res = await fetch('/api/paxos/balances?profile_id=default');
      if (!res.ok) throw new Error('Failed to load balances');
      return res.json();
    },
  });

  const balances: any[] = balancesData?.items || [];

  const usdBalance = (() => {
    const b = balances.find((bal: any) => bal.asset?.toUpperCase() === 'USD');
    return b?.available || b?.total || '0';
  })();

  /* ── Fetch fiat accounts ── */
  const {
    data: fiatAccountsData,
    isLoading: loadingAccounts,
    error: accountsError,
  } = useQuery({
    queryKey: ['fiat-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/paxos/fiat-accounts');
      if (!res.ok) throw new Error('Failed to load bank accounts');
      return res.json();
    },
  });

  const fiatAccounts: any[] = fiatAccountsData?.items || [];

  const selectedAccount = fiatAccounts.find(
    (a: any) => (a.id || a.fiat_account_id) === selectedAccountId,
  );

  /* ── Add bank account ── */
  const addAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/paxos/fiat-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bankForm,
          fiat_network_instructions: {
            wire: {
              account_number: bankForm.account_number,
              routing_number: bankForm.routing_number,
            },
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add bank account');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Bank account added!');
      setShowAddForm(false);
      setBankForm({
        bank_name: '',
        beneficiary_name: '',
        account_number: '',
        routing_number: '',
        account_type: 'CHECKING',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
      });
      queryClient.invalidateQueries({ queryKey: ['fiat-accounts'] });
      setSelectedAccountId(data.id || data.fiat_account_id || '');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  /* ── Submit fiat withdrawal ── */
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/paxos/fiat-withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          asset: 'USD',
          fiat_account_id: selectedAccountId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Withdrawal failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Wire withdrawal submitted!');
      setShowConfirmModal(false);
      setSubmittedTransfer(data);
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  /* ── Polling transfer status ── */
  const { data: transferStatus } = useQuery({
    queryKey: ['fiat-transfer-status', submittedTransfer?.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/paxos/transfers?limit=1&type=FIAT_WITHDRAWAL`,
      );
      if (!res.ok) throw new Error('Failed to check status');
      const data = await res.json();
      return data?.items?.[0] || submittedTransfer;
    },
    enabled: !!submittedTransfer,
    refetchInterval: (query) => {
      const status = query.state.data?.status?.toUpperCase();
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
        return false;
      }
      return 5000;
    },
  });

  const updateBankForm = (key: string, value: string) => {
    setBankForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit = selectedAccountId && amount && parseFloat(amount) > 0;

  return (
    <div className="space-y-6">
      {/* ── Submitted transfer status ── */}
      {submittedTransfer && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-[#00D4AA]/15 shadow-[0_0_40px_rgba(0,212,170,0.08)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Wire Withdrawal Submitted</h3>
              <Badge variant="success" size="sm">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Sent
              </Badge>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-[#1B1E36] px-4 py-3">
                <p className="text-xs text-[#8892B0]">Amount</p>
                <p className="mt-0.5 font-mono text-lg font-semibold text-white">
                  {formatUsd(submittedTransfer.amount || amount)}
                </p>
              </div>
              <div className="rounded-xl bg-[#1B1E36] px-4 py-3">
                <p className="text-xs text-[#8892B0]">Destination</p>
                <p className="mt-0.5 text-sm text-white">
                  {selectedAccount?.bank_name || 'Bank account'}{' '}
                  {selectedAccount?.account_number
                    ? `****${selectedAccount.account_number.slice(-4)}`
                    : ''}
                </p>
              </div>
            </div>

            <StatusTracker
              status={
                transferStatus?.status || submittedTransfer?.status || 'PENDING'
              }
            />

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSubmittedTransfer(null);
                  setAmount('');
                  setSelectedAccountId('');
                }}
              >
                New Withdrawal
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Main form ── */}
      {!submittedTransfer && (
        <>
          {/* ── Saved bank accounts ── */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Bank Accounts</h2>
              <button
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ['fiat-accounts'] })
                }
                className="flex items-center gap-1.5 text-xs text-[#8892B0] transition-colors hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>

            {loadingAccounts ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i}>
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : accountsError ? (
              <Card>
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-[#FF5B5B]" />
                  <p className="text-sm text-[#FF5B5B]">Failed to load accounts</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      queryClient.invalidateQueries({ queryKey: ['fiat-accounts'] })
                    }
                  >
                    Try Again
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                {fiatAccounts.length === 0 && !showAddForm ? (
                  <Card>
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <Building2 className="h-10 w-10 text-[#4A5568]" />
                      <div>
                        <p className="text-sm text-[#8892B0]">No bank accounts added</p>
                        <p className="text-xs text-[#4A5568]">
                          Add a bank account to start withdrawing fiat
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddForm(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Add Bank Account
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {fiatAccounts.map((acct: any, idx: number) => {
                      const acctId = acct.id || acct.fiat_account_id || `acct-${idx}`;
                      const isSelected = selectedAccountId === acctId;

                      return (
                        <button
                          key={acctId}
                          onClick={() => setSelectedAccountId(acctId)}
                          className={[
                            'rounded-2xl border p-4 text-left transition-all',
                            isSelected
                              ? 'border-[#7B5EA7] bg-[#7B5EA7]/5 shadow-[0_0_20px_rgba(123,94,167,0.15)]'
                              : 'border-[rgba(255,255,255,0.06)] bg-[#13152A] hover:border-[rgba(255,255,255,0.12)]',
                          ].join(' ')}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={[
                                  'flex h-10 w-10 items-center justify-center rounded-xl',
                                  isSelected
                                    ? 'bg-[#7B5EA7]/20'
                                    : 'bg-[#1B1E36]',
                                ].join(' ')}
                              >
                                <Building2
                                  className={[
                                    'h-5 w-5',
                                    isSelected ? 'text-[#7B5EA7]' : 'text-[#8892B0]',
                                  ].join(' ')}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {acct.bank_name || 'Bank Account'}
                                </p>
                                <p className="text-xs text-[#8892B0]">
                                  {acct.account_number
                                    ? `****${acct.account_number.slice(-4)}`
                                    : acct.beneficiary_name || '--'}
                                </p>
                              </div>
                            </div>
                            <div
                              className={[
                                'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                                isSelected
                                  ? 'border-[#7B5EA7] bg-[#7B5EA7]'
                                  : 'border-[#4A5568]',
                              ].join(' ')}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <Badge variant="neutral" size="sm">
                              {acct.account_type || 'Checking'}
                            </Badge>
                            {acct.routing_number && (
                              <span className="text-xs text-[#4A5568]">
                                Routing: ****{acct.routing_number.slice(-4)}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {/* Add new account card */}
                    <button
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="flex min-h-[120px] items-center justify-center gap-2 rounded-2xl border border-dashed border-[rgba(255,255,255,0.1)] bg-[#13152A]/50 text-sm text-[#8892B0] transition-all hover:border-[#7B5EA7]/40 hover:text-white"
                    >
                      {showAddForm ? (
                        <>
                          <Minus className="h-4 w-4" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Add Account
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Add bank account form ── */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card>
                  <h3 className="mb-4 text-base font-semibold text-white">Add Bank Account</h3>

                  <div className="space-y-4">
                    {/* Bank name and beneficiary */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#8892B0]">
                          Bank Name <span className="text-[#FF5B5B]">*</span>
                        </label>
                        <input
                          type="text"
                          value={bankForm.bank_name}
                          onChange={(e) => updateBankForm('bank_name', e.target.value)}
                          placeholder="e.g. Chase Bank"
                          className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-3 text-white placeholder-[#4A5568] outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#8892B0]">
                          Beneficiary Name <span className="text-[#FF5B5B]">*</span>
                        </label>
                        <input
                          type="text"
                          value={bankForm.beneficiary_name}
                          onChange={(e) => updateBankForm('beneficiary_name', e.target.value)}
                          placeholder="Full legal name"
                          className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-3 text-white placeholder-[#4A5568] outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
                        />
                      </div>
                    </div>

                    {/* Account and routing */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#8892B0]">
                          Account Number <span className="text-[#FF5B5B]">*</span>
                        </label>
                        <input
                          type="text"
                          value={bankForm.account_number}
                          onChange={(e) =>
                            updateBankForm(
                              'account_number',
                              e.target.value.replace(/\D/g, ''),
                            )
                          }
                          placeholder="Account number"
                          className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-3 font-mono text-white placeholder-[#4A5568] outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#8892B0]">
                          Routing Number (ABA/SWIFT) <span className="text-[#FF5B5B]">*</span>
                        </label>
                        <input
                          type="text"
                          value={bankForm.routing_number}
                          onChange={(e) => updateBankForm('routing_number', e.target.value)}
                          placeholder="Routing number"
                          className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-3 font-mono text-white placeholder-[#4A5568] outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
                        />
                      </div>
                    </div>

                    {/* Account type toggle */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#8892B0]">
                        Account Type
                      </label>
                      <div className="flex gap-2">
                        {(['CHECKING', 'SAVINGS'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => updateBankForm('account_type', type)}
                            className={[
                              'flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
                              bankForm.account_type === type
                                ? 'border-[#7B5EA7] bg-[#7B5EA7]/10 text-white'
                                : 'border-[rgba(255,255,255,0.06)] bg-[#1B1E36] text-[#8892B0] hover:text-white',
                            ].join(' ')}
                          >
                            {type === 'CHECKING' ? (
                              <CreditCard className="mr-2 inline h-4 w-4" />
                            ) : (
                              <Building2 className="mr-2 inline h-4 w-4" />
                            )}
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Address fields */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#8892B0]">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={bankForm.address_line_1}
                        onChange={(e) => updateBankForm('address_line_1', e.target.value)}
                        placeholder="Street address"
                        className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-3 text-white placeholder-[#4A5568] outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#8892B0]">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={bankForm.address_line_2}
                        onChange={(e) => updateBankForm('address_line_2', e.target.value)}
                        placeholder="Apt, suite, etc. (optional)"
                        className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-3 text-white placeholder-[#4A5568] outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#8892B0]">
                          City
                        </label>
                        <input
                          type="text"
                          value={bankForm.city}
                          onChange={(e) => updateBankForm('city', e.target.value)}
                          placeholder="City"
                          className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-3 text-white placeholder-[#4A5568] outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#8892B0]">
                          State
                        </label>
                        <input
                          type="text"
                          value={bankForm.state}
                          onChange={(e) => updateBankForm('state', e.target.value)}
                          placeholder="State"
                          className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-3 text-white placeholder-[#4A5568] outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#8892B0]">
                          ZIP / Postal
                        </label>
                        <input
                          type="text"
                          value={bankForm.postal_code}
                          onChange={(e) => updateBankForm('postal_code', e.target.value)}
                          placeholder="Postal code"
                          className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-3 text-white placeholder-[#4A5568] outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
                        />
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={addAccountMutation.isPending}
                      disabled={
                        !bankForm.bank_name ||
                        !bankForm.beneficiary_name ||
                        !bankForm.account_number ||
                        !bankForm.routing_number
                      }
                      onClick={() => addAccountMutation.mutate()}
                    >
                      Save Bank Account
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Amount input ── */}
          <Card>
            <h3 className="mb-4 text-base font-semibold text-white">Withdrawal Amount</h3>

            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-[#8892B0]">Amount (USD)</label>
              <span className="text-xs text-[#4A5568]">
                Available:{' '}
                <span className="text-[#8892B0]">{formatUsd(usdBalance)}</span>
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xl text-[#8892B0]">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  if (val.split('.').length <= 2) {
                    setAmount(val);
                  }
                }}
                className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] py-4 pl-10 pr-20 font-mono text-2xl text-white placeholder-[#4A5568] outline-none transition-all focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7]"
              />
              <button
                onClick={() => setAmount(usdBalance)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-[#7B5EA7]/20 px-3 py-1.5 text-xs font-semibold text-[#7B5EA7] transition-colors hover:bg-[#7B5EA7]/30"
              >
                MAX
              </button>
            </div>

            {amount && parseFloat(amount) > parseFloat(usdBalance) && (
              <p className="mt-1.5 text-sm text-[#FF5B5B]">Insufficient balance</p>
            )}

            {/* Selected account preview */}
            {selectedAccount && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7B5EA7]/10">
                  <Building2 className="h-4 w-4 text-[#7B5EA7]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    {selectedAccount.bank_name || 'Bank Account'}
                  </p>
                  <p className="text-xs text-[#8892B0]">
                    {selectedAccount.account_type || 'Checking'} ****
                    {selectedAccount.account_number?.slice(-4) || '----'}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#4A5568]" />
              </motion.div>
            )}

            <div className="mt-4">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!canSubmit}
                onClick={() => setShowConfirmModal(true)}
              >
                <Shield className="h-4 w-4" />
                Confirm & Submit
              </Button>
            </div>
          </Card>

          {/* ── Confirm modal ── */}
          <Modal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            title="Confirm Wire Withdrawal"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-[#1B1E36] px-4 py-3">
                  <span className="text-sm text-[#8892B0]">Amount</span>
                  <span className="font-mono text-lg font-bold text-white">
                    {formatUsd(amount)}
                  </span>
                </div>

                <div className="rounded-xl bg-[#1B1E36] px-4 py-3">
                  <span className="text-sm text-[#8892B0]">Destination</span>
                  <div className="mt-1 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#8892B0]" />
                    <div>
                      <p className="text-sm text-white">
                        {selectedAccount?.bank_name || 'Bank Account'}
                      </p>
                      <p className="text-xs text-[#8892B0]">
                        {selectedAccount?.account_type || 'Checking'} ****
                        {selectedAccount?.account_number?.slice(-4) || '----'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#1B1E36] px-4 py-3">
                  <span className="text-sm text-[#8892B0]">Method</span>
                  <span className="text-sm text-white">Wire Transfer</span>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 rounded-xl border border-[#F5A623]/20 bg-[#F5A623]/5 p-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#F5A623]" />
                <p className="text-xs leading-relaxed text-[#F5A623]">
                  Wire withdrawals typically take 1-3 business days to arrive. Make sure the
                  bank account details are correct, as incorrect details may delay or reject the transfer.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  loading={withdrawMutation.isPending}
                  onClick={() => withdrawMutation.mutate()}
                >
                  Confirm Withdrawal
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
