'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Banknote, Loader2, Check, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/store/useStore';
import { useQueryClient } from '@tanstack/react-query';

interface FundOption {
  asset: string;
  amount: string;
  label: string;
  crypto_network?: string;
  color: string;
}

const FUND_OPTIONS: FundOption[] = [
  { asset: 'USD', amount: '10000', label: '$10,000 USD', color: '#00D4AA' },
  { asset: 'USD', amount: '50000', label: '$50,000 USD', color: '#00D4AA' },
  { asset: 'BTC', amount: '0.5', label: '0.5 BTC', crypto_network: 'BITCOIN', color: '#F7931A' },
  { asset: 'BTC', amount: '1', label: '1 BTC', crypto_network: 'BITCOIN', color: '#F7931A' },
  { asset: 'ETH', amount: '5', label: '5 ETH', crypto_network: 'ETHEREUM', color: '#627EEA' },
  { asset: 'ETH', amount: '10', label: '10 ETH', crypto_network: 'ETHEREUM', color: '#627EEA' },
  { asset: 'PAXG', amount: '2', label: '2 PAXG', crypto_network: 'ETHEREUM', color: '#E5B94E' },
  { asset: 'USDP', amount: '10000', label: '10,000 USDP', crypto_network: 'ETHEREUM', color: '#00D4AA' },
];

export default function SandboxFundModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const activeProfile = useStore((s) => s.activeProfile);
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [funded, setFunded] = useState<Set<string>>(new Set());

  const handleFund = async (option: FundOption) => {
    if (!activeProfile?.id) {
      toast.error('No active profile');
      return;
    }

    const key = `${option.asset}-${option.amount}`;
    setLoading(key);

    try {
      const res = await fetch('/api/paxos/sandbox-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: activeProfile.id,
          asset: option.asset,
          amount: option.amount,
          crypto_network: option.crypto_network,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fund account');
      }

      setFunded((prev) => new Set(prev).add(key));
      toast.success(`Funded ${option.label}!`);
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to fund');
    } finally {
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          >
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#13152A] p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
                  <Zap className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Sandbox Fund</h2>
                  <p className="text-xs text-[#8892B0]">Add test assets to your account</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-[#8892B0] transition-colors hover:bg-[#1B1E36] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Fund options grid */}
            <div className="grid grid-cols-2 gap-3">
              {FUND_OPTIONS.map((option) => {
                const key = `${option.asset}-${option.amount}`;
                const isLoading = loading === key;
                const isFunded = funded.has(key);

                return (
                  <button
                    key={key}
                    onClick={() => handleFund(option)}
                    disabled={isLoading || loading !== null}
                    className="group relative flex flex-col items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-4 transition-all hover:border-[rgba(255,255,255,0.12)] hover:bg-[#1B1E36]/80 disabled:opacity-50"
                  >
                    {/* Asset dot */}
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                    <span className="text-sm font-semibold text-white">{option.label}</span>

                    {/* Status overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#1B1E36]/90">
                        <Loader2 className="h-5 w-5 animate-spin text-yellow-400" />
                      </div>
                    )}
                    {isFunded && !isLoading && (
                      <div className="absolute right-2 top-2">
                        <Check className="h-4 w-4 text-[#00D4AA]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom amount */}
            <CustomFundForm profileId={activeProfile?.id} onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['balances'] });
            }} />

            {/* Note */}
            <p className="mt-4 text-center text-xs text-[#4A5568]">
              Sandbox funds are for testing only and have no real value.
            </p>
          </motion.div>
          </motion.div>
      )}
    </AnimatePresence>
  );
}

function CustomFundForm({ profileId, onSuccess }: { profileId?: string; onSuccess: () => void }) {
  const [asset, setAsset] = useState('USD');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const CRYPTO_NETWORKS: Record<string, string> = {
    BTC: 'BITCOIN',
    ETH: 'ETHEREUM',
    PAXG: 'ETHEREUM',
    USDP: 'ETHEREUM',
    PYUSD: 'ETHEREUM',
    USDG: 'ETHEREUM',
    USDL: 'ETHEREUM',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !amount) return;

    setLoading(true);
    try {
      const body: Record<string, string> = { profile_id: profileId, asset, amount };
      if (CRYPTO_NETWORKS[asset]) {
        body.crypto_network = CRYPTO_NETWORKS[asset];
      }

      const res = await fetch('/api/paxos/sandbox-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fund');
      }

      toast.success(`Funded ${amount} ${asset}!`);
      setAmount('');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to fund');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-2">
      <div className="flex-1">
        <label className="mb-1 block text-xs text-[#8892B0]">Custom Amount</label>
        <div className="flex gap-2">
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="w-24 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0D0E1A] px-2 py-2 text-sm text-white outline-none"
          >
            {['USD', 'BTC', 'ETH', 'PAXG', 'USDP', 'PYUSD', 'USDG', 'USDL'].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="min-w-0 flex-1 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0D0E1A] px-3 py-2 text-sm text-white outline-none placeholder:text-[#4A5568] focus:border-[#7B5EA7]"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || !amount}
        className="flex items-center gap-1.5 rounded-lg bg-yellow-500/20 px-4 py-2 text-sm font-medium text-yellow-400 transition-colors hover:bg-yellow-500/30 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
        Fund
      </button>
    </form>
  );
}
