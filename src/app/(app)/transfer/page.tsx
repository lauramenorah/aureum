'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  Send,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import type { Profile, Balance, Transfer } from '@/lib/paxos/types';
import { ASSETS, formatAmount } from '@/lib/utils/assets';

type TabKey = 'internal' | 'external';

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------
async function fetchProfiles(): Promise<{ items: Profile[] }> {
  const res = await fetch('/api/paxos/profiles');
  if (!res.ok) throw new Error('Failed to load profiles');
  return res.json();
}

async function fetchBalances(profileId: string): Promise<{ items: Balance[] }> {
  const res = await fetch(`/api/paxos/balances?profile_id=${profileId}`);
  if (!res.ok) throw new Error('Failed to load balances');
  return res.json();
}

async function fetchTransfers(): Promise<{ items: Transfer[] }> {
  const res = await fetch('/api/paxos/transfers?limit=50');
  if (!res.ok) throw new Error('Failed to load transfers');
  return res.json();
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
function statusBadge(status: string) {
  const map: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; icon: React.ReactNode }> = {
    COMPLETED: { variant: 'success', icon: <CheckCircle2 size={12} /> },
    APPROVED: { variant: 'success', icon: <CheckCircle2 size={12} /> },
    PENDING: { variant: 'warning', icon: <Clock size={12} /> },
    FAILED: { variant: 'error', icon: <XCircle size={12} /> },
  };
  const cfg = map[status] || { variant: 'neutral' as const, icon: <AlertCircle size={12} /> };
  return (
    <Badge variant={cfg.variant} size="sm">
      <span className="flex items-center gap-1">
        {cfg.icon}
        {status}
      </span>
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function TransferPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>('internal');
  const [showConfirm, setShowConfirm] = useState(false);

  // Internal transfer state
  const [srcProfile, setSrcProfile] = useState('');
  const [dstProfile, setDstProfile] = useState('');
  const [asset, setAsset] = useState('');
  const [amount, setAmount] = useState('');

  // External transfer state
  const [extDstId, setExtDstId] = useState('');
  const [extAsset, setExtAsset] = useState('');
  const [extAmount, setExtAmount] = useState('');

  // Queries
  const profilesQ = useQuery({ queryKey: ['profiles'], queryFn: fetchProfiles });
  const profiles = profilesQ.data?.items ?? [];

  const srcBalancesQ = useQuery({
    queryKey: ['balances', srcProfile],
    queryFn: () => fetchBalances(srcProfile),
    enabled: !!srcProfile,
  });
  const srcBalances = srcBalancesQ.data?.items ?? [];

  const transfersQ = useQuery({ queryKey: ['transfers'], queryFn: fetchTransfers });
  const transfers = transfersQ.data?.items ?? [];

  // Poll PENDING transfers every 3s
  const hasPending = transfers.some((t) => t.status === 'PENDING');
  useEffect(() => {
    if (!hasPending) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    }, 3000);
    return () => clearInterval(interval);
  }, [hasPending, queryClient]);

  // Available balance for selected source/asset
  const selectedBalance = srcBalances.find((b) => b.asset === asset);

  // Asset options
  const assetOptions = Object.keys(ASSETS).map((a) => ({ value: a, label: `${a} - ${ASSETS[a as keyof typeof ASSETS].name}` }));

  // Mutations
  const internalMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/paxos/internal-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_profile_id: srcProfile,
          destination_profile_id: dstProfile,
          asset,
          amount,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Transfer failed');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Internal transfer submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      setSrcProfile('');
      setDstProfile('');
      setAsset('');
      setAmount('');
      setShowConfirm(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setShowConfirm(false);
    },
  });

  const externalMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/paxos/paxos-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_profile_id: extDstId,
          asset: extAsset,
          amount: extAmount,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Transfer failed');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('External transfer submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      setExtDstId('');
      setExtAsset('');
      setExtAmount('');
      setShowConfirm(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setShowConfirm(false);
    },
  });

  const isInternal = tab === 'internal';
  const transferReady = isInternal
    ? srcProfile && dstProfile && srcProfile !== dstProfile && asset && Number(amount) > 0
    : extDstId && extAsset && Number(extAmount) > 0;

  const handleConfirm = () => {
    if (isInternal) {
      internalMut.mutate();
    } else {
      externalMut.mutate();
    }
  };

  const profileName = (id: string) => profiles.find((p) => p.id === id)?.nickname || id.slice(0, 8);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-[rgba(255,255,255,0.06)] bg-[#0D0E1A] px-4 py-4 md:px-6">
        <h1 className="text-xl font-semibold text-white">Transfer</h1>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'internal' as TabKey, label: 'Between My Profiles', icon: <ArrowLeftRight size={16} /> },
            { key: 'external' as TabKey, label: 'To Another Entity', icon: <Send size={16} /> },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                tab === t.key
                  ? 'bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] text-white shadow-[0_0_20px_rgba(155,89,245,0.2)]'
                  : 'bg-[#13152A] border border-[rgba(255,255,255,0.06)] text-[#8892B0] hover:text-white hover:bg-[#1B1E36]',
              ].join(' ')}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Transfer Form */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Card>
            <AnimatePresence mode="wait">
              {isInternal ? (
                <motion.div
                  key="internal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Source Profile"
                      name="srcProfile"
                      placeholder="Select source profile"
                      options={profiles.map((p) => ({ value: p.id, label: p.nickname || p.id.slice(0, 12) }))}
                      value={srcProfile}
                      onChange={(e) => {
                        setSrcProfile(e.target.value);
                        setAsset('');
                        setAmount('');
                      }}
                      required
                    />
                    <Select
                      label="Destination Profile"
                      name="dstProfile"
                      placeholder="Select destination profile"
                      options={profiles.filter((p) => p.id !== srcProfile).map((p) => ({ value: p.id, label: p.nickname || p.id.slice(0, 12) }))}
                      value={dstProfile}
                      onChange={(e) => setDstProfile(e.target.value)}
                      required
                    />
                  </div>

                  <Select
                    label="Asset"
                    name="asset"
                    placeholder="Select asset"
                    options={assetOptions}
                    value={asset}
                    onChange={(e) => {
                      setAsset(e.target.value);
                      setAmount('');
                    }}
                    required
                  />

                  <div>
                    <Input
                      label="Amount"
                      name="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                    {selectedBalance && (
                      <p className="mt-1.5 text-xs text-[#8892B0]">
                        Available: <span className="text-[#00D4AA] font-medium">{formatAmount(selectedBalance.available, asset)}</span> {asset}
                        <button
                          type="button"
                          className="ml-2 text-[#9B59F5] hover:text-[#B07AF5] text-xs underline"
                          onClick={() => setAmount(selectedBalance.available)}
                        >
                          Max
                        </button>
                      </p>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={!transferReady}
                    onClick={() => setShowConfirm(true)}
                  >
                    <ArrowLeftRight size={18} />
                    Transfer
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="external"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <Input
                    label="Destination Profile ID"
                    name="extDstId"
                    placeholder="Enter the destination profile ID"
                    value={extDstId}
                    onChange={(e) => setExtDstId(e.target.value)}
                    required
                  />

                  <Select
                    label="Asset"
                    name="extAsset"
                    placeholder="Select asset"
                    options={assetOptions}
                    value={extAsset}
                    onChange={(e) => setExtAsset(e.target.value)}
                    required
                  />

                  <Input
                    label="Amount"
                    name="extAmount"
                    type="number"
                    placeholder="0.00"
                    value={extAmount}
                    onChange={(e) => setExtAmount(e.target.value)}
                    required
                  />

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={!transferReady}
                    onClick={() => setShowConfirm(true)}
                  >
                    <Send size={18} />
                    Transfer
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Confirmation Modal */}
        <Modal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          title="Confirm Transfer"
        >
          <div className="space-y-4">
            <div className="bg-[#1B1E36] rounded-xl p-4 space-y-3">
              {isInternal ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8892B0]">Type</span>
                    <span className="text-white">Internal Transfer</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8892B0]">From</span>
                    <span className="text-white">{profileName(srcProfile)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8892B0]">To</span>
                    <span className="text-white">{profileName(dstProfile)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8892B0]">Amount</span>
                    <span className="text-white font-medium">{amount} {asset}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8892B0]">Type</span>
                    <span className="text-white">External Transfer</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8892B0]">To Profile</span>
                    <span className="text-white font-mono text-xs">{extDstId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8892B0]">Amount</span>
                    <span className="text-white font-medium">{extAmount} {extAsset}</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-xs text-[#8892B0]">
              Please review the details above. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                loading={internalMut.isPending || externalMut.isPending}
                onClick={handleConfirm}
              >
                Confirm Transfer
              </Button>
            </div>
          </div>
        </Modal>

        {/* Transfer History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Transfer History</h2>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['transfers'] })}
              className="text-[#8892B0] hover:text-white transition-colors p-2 rounded-lg hover:bg-[#1B1E36]"
            >
              <RefreshCw size={16} className={transfersQ.isFetching ? 'animate-spin' : ''} />
            </button>
          </div>

          <Card padding="p-0">
            {transfersQ.isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : transfers.length === 0 ? (
              <div className="p-12 text-center">
                <ArrowLeftRight size={48} className="mx-auto text-[#1B1E36] mb-4" />
                <p className="text-[#8892B0]">No transfers yet</p>
                <p className="text-xs text-[#4A5568] mt-1">Create your first transfer above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)]">
                      <th className="text-left font-medium text-[#8892B0] px-6 py-3">Date</th>
                      <th className="text-left font-medium text-[#8892B0] px-6 py-3">Type</th>
                      <th className="text-left font-medium text-[#8892B0] px-6 py-3">Asset</th>
                      <th className="text-right font-medium text-[#8892B0] px-6 py-3">Amount</th>
                      <th className="text-left font-medium text-[#8892B0] px-6 py-3">From / To</th>
                      <th className="text-center font-medium text-[#8892B0] px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((t) => (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[#1B1E36]/40 transition-colors"
                      >
                        <td className="px-6 py-4 text-[#8892B0] whitespace-nowrap">
                          {new Date(t.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="info" size="sm">{t.type || 'TRANSFER'}</Badge>
                        </td>
                        <td className="px-6 py-4 text-white font-medium">{t.asset}</td>
                        <td className="px-6 py-4 text-right text-white font-mono">
                          {formatAmount(t.amount, t.asset)}
                        </td>
                        <td className="px-6 py-4 text-[#8892B0] whitespace-nowrap">
                          <span className="font-mono text-xs">
                            {t.profile_id?.slice(0, 8)}
                          </span>
                          <ArrowRight size={12} className="inline mx-1.5 text-[#4A5568]" />
                          <span className="font-mono text-xs">
                            {t.destination_address?.slice(0, 8) || '---'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">{statusBadge(t.status)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
