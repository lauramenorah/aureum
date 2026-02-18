'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  Plus,
  Copy,
  Check,
  Globe,
  Tag,
  Calendar,
  Wallet,
  ClipboardPaste,
  X,
  TrendingUp,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import type { MonitoringAddress, Network } from '@/lib/paxos/types';

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------
async function fetchMonitoringAddresses(): Promise<{ items: MonitoringAddress[] }> {
  const res = await fetch('/api/paxos/monitoring-addresses');
  if (!res.ok) throw new Error('Failed to load monitoring addresses');
  return res.json();
}

const EARN_NETWORKS: { value: Network; label: string }[] = [
  { value: 'ETHEREUM', label: 'Ethereum' },
  { value: 'SOLANA', label: 'Solana' },
  { value: 'INK', label: 'Ink' },
  { value: 'XLAYER', label: 'XLayer' },
];

// ---------------------------------------------------------------------------
// Truncate address
// ---------------------------------------------------------------------------
function truncateAddress(addr: string) {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function EarnPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('');
  const [nickname, setNickname] = useState('');

  const addressesQ = useQuery({ queryKey: ['monitoring-addresses'], queryFn: fetchMonitoringAddresses });
  const addresses = addressesQ.data?.items ?? [];

  const addMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/paxos/monitoring-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, network, nickname }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add address');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Monitoring address added successfully');
      queryClient.invalidateQueries({ queryKey: ['monitoring-addresses'] });
      setAddress('');
      setNetwork('');
      setNickname('');
      setShowForm(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setAddress(text);
    } catch {
      toast.error('Failed to read clipboard');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-[rgba(255,255,255,0.06)] bg-[#0D0E1A] px-4 py-4 md:px-6">
        <h1 className="text-xl font-semibold text-white">Earn</h1>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6 space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7B5EA7]/30 via-[#13152A] to-[#9B59F5]/20 border border-[#7B5EA7]/20 p-8 md:p-10">
            {/* Decorative background circles */}
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#7B5EA7]/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#9B59F5]/10 blur-3xl" />

            <div className="relative flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7B5EA7] to-[#9B59F5] shadow-lg shadow-[#7B5EA7]/30">
                <Coins size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Earn USDG Rewards
                </h2>
                <p className="text-[#8892B0] max-w-2xl leading-relaxed">
                  Hold USDG on monitored Ethereum, Solana, Ink, or XLayer addresses to earn rewards
                  automatically. Simply add your wallet address below and rewards accrue based on your
                  eligible balance.
                </p>
              </div>
              <div className="hidden md:flex flex-col items-center gap-1">
                <TrendingUp size={40} className="text-[#00D4AA]" />
                <span className="text-xs text-[#8892B0]">Auto-earning</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Monitored Addresses */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Monitored Addresses</h3>
            <Button
              variant={showForm ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? 'Cancel' : 'Add Address'}
            </Button>
          </div>

          {/* Inline Add Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <Card className="mb-4 border-[#7B5EA7]/20">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addMut.mutate();
                    }}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <Input
                        label="Wallet Address"
                        name="address"
                        placeholder="0x... or base58 address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={handlePaste}
                        className="absolute right-3 top-[34px] text-[#8892B0] hover:text-white transition-colors p-1 rounded hover:bg-[#232745]"
                        title="Paste from clipboard"
                      >
                        <ClipboardPaste size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Network"
                        name="network"
                        placeholder="Select network"
                        options={EARN_NETWORKS}
                        value={network}
                        onChange={(e) => setNetwork(e.target.value)}
                        required
                      />
                      <Input
                        label="Nickname"
                        name="nickname"
                        placeholder="e.g. My Ledger"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => setShowForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        loading={addMut.isPending}
                        disabled={!address || !network}
                      >
                        Save Address
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Addresses List */}
          {addressesQ.isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" rounded="rounded-2xl" />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <Card className="text-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-[#1B1E36] flex items-center justify-center">
                  <Wallet size={36} className="text-[#4A5568]" />
                </div>
                <div>
                  <p className="text-white font-medium mb-1">No monitored addresses</p>
                  <p className="text-[#8892B0] text-sm">
                    Add your first address to start earning USDG rewards
                  </p>
                </div>
                {!showForm && (
                  <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
                    <Plus size={16} />
                    Add Your First Address
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr, idx) => (
                <motion.div
                  key={addr.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card hover className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-mono text-sm">
                          {truncateAddress(addr.address)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(addr.address, addr.id)}
                          className="text-[#8892B0] hover:text-white transition-colors p-1 rounded hover:bg-[#1B1E36]"
                        >
                          {copiedId === addr.id ? (
                            <Check size={14} className="text-[#00D4AA]" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#8892B0]">
                        <span className="flex items-center gap-1">
                          <Globe size={12} />
                          <Badge variant="info" size="sm">{addr.network}</Badge>
                        </span>
                        {addr.nickname && (
                          <span className="flex items-center gap-1">
                            <Tag size={12} />
                            {addr.nickname}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(addr.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">Monitoring</Badge>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Reward Statements (Placeholder) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Reward Statements</h3>
            <span className="text-xs text-[#8892B0] flex items-center gap-1">
              <Calendar size={12} />
              Statements update monthly
            </span>
          </div>

          <Card padding="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left font-medium text-[#8892B0] px-6 py-3">Period</th>
                    <th className="text-right font-medium text-[#8892B0] px-6 py-3">Eligible Balance</th>
                    <th className="text-right font-medium text-[#8892B0] px-6 py-3">Reward Amount</th>
                    <th className="text-center font-medium text-[#8892B0] px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Placeholder rows */}
                  <tr>
                    <td colSpan={4}>
                      <div className="py-16 text-center">
                        <FileText size={40} className="mx-auto text-[#1B1E36] mb-3" />
                        <p className="text-[#8892B0] text-sm">No reward statements yet</p>
                        <p className="text-xs text-[#4A5568] mt-1">
                          Statements will appear here once your first reward period completes
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
