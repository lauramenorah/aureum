'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Building,
  CreditCard,
  Wallet,
  Shield,
  Activity,
  Plus,
  Trash2,
  Copy,
  Check,
  Tag,
  AlertTriangle,
  Info,
  Clock,
  Server,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import type { FiatAccount, PaxosEvent } from '@/lib/paxos/types';
import { isSandbox } from '@/lib/utils/assets';

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------
async function fetchFiatAccounts(): Promise<{ items: FiatAccount[] }> {
  const res = await fetch('/api/paxos/fiat-accounts');
  if (!res.ok) throw new Error('Failed to load fiat accounts');
  return res.json();
}

async function fetchCryptoAddresses(): Promise<{ items: { id: string; address: string; network: string; nickname: string; profile_id: string }[] }> {
  const res = await fetch('/api/paxos/crypto-destination-addresses');
  if (!res.ok) throw new Error('Failed to load crypto addresses');
  return res.json();
}

async function fetchEvents(cursor?: string): Promise<{ items: PaxosEvent[]; next_page_cursor?: string }> {
  const params = new URLSearchParams({ limit: '20' });
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`/api/paxos/events?${params}`);
  if (!res.ok) throw new Error('Failed to load events');
  return res.json();
}

function truncateAddr(addr: string) {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [showBankForm, setShowBankForm] = useState(false);
  const [showCryptoForm, setShowCryptoForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'fiat' | 'crypto'; id: string } | null>(null);
  const [eventsCursor, setEventsCursor] = useState<string | undefined>();
  const [allEvents, setAllEvents] = useState<PaxosEvent[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bank form state
  const [bankName, setBankName] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountType, setAccountType] = useState<'CHECKING' | 'SAVINGS'>('CHECKING');

  // Crypto form state
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('');
  const [cryptoNickname, setCryptoNickname] = useState('');

  // Queries
  const fiatQ = useQuery({ queryKey: ['fiat-accounts'], queryFn: fetchFiatAccounts });
  const fiatAccounts = fiatQ.data?.items ?? [];

  const cryptoQ = useQuery({ queryKey: ['crypto-addresses'], queryFn: fetchCryptoAddresses });
  const cryptoAddresses = cryptoQ.data?.items ?? [];

  const eventsQ = useQuery({
    queryKey: ['events', eventsCursor],
    queryFn: () => fetchEvents(eventsCursor),
  });

  // Accumulate events on load more
  const currentEvents = eventsQ.data?.items ?? [];
  const displayEvents = eventsCursor ? [...allEvents, ...currentEvents] : currentEvents;
  const hasMoreEvents = !!eventsQ.data?.next_page_cursor;

  // Mutations
  const addFiatMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/paxos/fiat-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_name: bankName,
          beneficiary_name: beneficiary,
          account_number: accountNumber,
          routing_number: routingNumber,
          account_type: accountType,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add bank account');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Bank account added successfully');
      queryClient.invalidateQueries({ queryKey: ['fiat-accounts'] });
      resetBankForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addCryptoMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/paxos/crypto-destination-addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: cryptoAddress,
          network: cryptoNetwork,
          nickname: cryptoNickname,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save address');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Crypto address saved successfully');
      queryClient.invalidateQueries({ queryKey: ['crypto-addresses'] });
      resetCryptoForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetBankForm = () => {
    setShowBankForm(false);
    setBankName('');
    setBeneficiary('');
    setAccountNumber('');
    setRoutingNumber('');
    setAccountType('CHECKING');
  };

  const resetCryptoForm = () => {
    setShowCryptoForm(false);
    setCryptoAddress('');
    setCryptoNetwork('');
    setCryptoNickname('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLoadMore = () => {
    if (eventsQ.data?.next_page_cursor) {
      setAllEvents(displayEvents);
      setEventsCursor(eventsQ.data.next_page_cursor);
    }
  };

  const sandboxMode = isSandbox();
  const apiBaseUrl = process.env.NEXT_PUBLIC_PAXOS_BASE_URL || 'https://api.paxos.com';
  const maskedUrl = apiBaseUrl.replace(/^(https?:\/\/[^/]+)(.*)$/, (_, host) => {
    return host.slice(0, 20) + '...' + host.slice(-8);
  });

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-[rgba(255,255,255,0.06)] bg-[#0D0E1A] px-4 py-4 md:px-6">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <Settings size={22} />
          Settings
        </h1>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6 space-y-8">
        {/* ─── Bank Accounts ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building size={20} className="text-[#00D4AA]" />
              Bank Accounts
            </h2>
            <Button
              variant={showBankForm ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setShowBankForm(!showBankForm)}
            >
              {showBankForm ? 'Cancel' : <><Plus size={16} /> Add Bank Account</>}
            </Button>
          </div>

          {/* Add form */}
          <AnimatePresence>
            {showBankForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="mb-4 border-[#7B5EA7]/20">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addFiatMut.mutate();
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Bank Name"
                        name="bankName"
                        placeholder="e.g. Chase, Wells Fargo"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        required
                      />
                      <Input
                        label="Beneficiary Name"
                        name="beneficiary"
                        placeholder="Account holder name"
                        value={beneficiary}
                        onChange={(e) => setBeneficiary(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Account Number"
                        name="accountNumber"
                        placeholder="XXXXXXXXXX"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required
                      />
                      <Input
                        label="Routing Number"
                        name="routingNumber"
                        placeholder="XXXXXXXXX"
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                        required
                      />
                      <div>
                        <label className="block text-sm text-[#8892B0] mb-1.5 font-medium">Account Type</label>
                        <div className="flex gap-2">
                          {(['CHECKING', 'SAVINGS'] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setAccountType(type)}
                              className={[
                                'flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all border',
                                accountType === type
                                  ? 'bg-[#7B5EA7]/20 border-[#7B5EA7] text-white'
                                  : 'bg-[#1B1E36] border-[rgba(255,255,255,0.06)] text-[#8892B0] hover:text-white',
                              ].join(' ')}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="secondary" onClick={resetBankForm}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        loading={addFiatMut.isPending}
                        disabled={!bankName || !beneficiary || !accountNumber || !routingNumber}
                      >
                        Save Bank Account
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bank accounts list */}
          {fiatQ.isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" rounded="rounded-2xl" />
              ))}
            </div>
          ) : fiatAccounts.length === 0 ? (
            <Card className="text-center py-10">
              <CreditCard size={36} className="mx-auto text-[#4A5568] mb-3" />
              <p className="text-[#8892B0] text-sm">No bank accounts saved</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {fiatAccounts.map((acct, idx) => (
                <motion.div
                  key={acct.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card hover className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00D4AA]/10">
                      <Building size={18} className="text-[#00D4AA]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{acct.bank_name}</span>
                        <Badge variant="neutral" size="sm">{acct.account_type}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#8892B0] mt-0.5">
                        <span>{acct.beneficiary_name}</span>
                        <span className="font-mono">****{acct.account_number.slice(-4)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'fiat', id: acct.id })}
                      className="text-[#8892B0] hover:text-[#FF5B5B] transition-colors p-2 rounded-lg hover:bg-[#FF5B5B]/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ─── Saved Crypto Addresses ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Wallet size={20} className="text-[#F5A623]" />
              Saved Crypto Addresses
            </h2>
            <Button
              variant={showCryptoForm ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setShowCryptoForm(!showCryptoForm)}
            >
              {showCryptoForm ? 'Cancel' : <><Plus size={16} /> Add Address</>}
            </Button>
          </div>

          {/* Add crypto form */}
          <AnimatePresence>
            {showCryptoForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="mb-4 border-[#7B5EA7]/20">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addCryptoMut.mutate();
                    }}
                    className="space-y-4"
                  >
                    <Input
                      label="Address"
                      name="cryptoAddress"
                      placeholder="0x... or base58 address"
                      value={cryptoAddress}
                      onChange={(e) => setCryptoAddress(e.target.value)}
                      required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Network"
                        name="cryptoNetwork"
                        placeholder="Select network"
                        options={[
                          { value: 'BITCOIN', label: 'Bitcoin' },
                          { value: 'ETHEREUM', label: 'Ethereum' },
                          { value: 'SOLANA', label: 'Solana' },
                          { value: 'STELLAR', label: 'Stellar' },
                          { value: 'INK', label: 'Ink' },
                          { value: 'XLAYER', label: 'XLayer' },
                        ]}
                        value={cryptoNetwork}
                        onChange={(e) => setCryptoNetwork(e.target.value)}
                        required
                      />
                      <Input
                        label="Nickname"
                        name="cryptoNickname"
                        placeholder="e.g. My Metamask"
                        value={cryptoNickname}
                        onChange={(e) => setCryptoNickname(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="secondary" onClick={resetCryptoForm}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        loading={addCryptoMut.isPending}
                        disabled={!cryptoAddress || !cryptoNetwork}
                      >
                        Save Address
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Crypto addresses list */}
          {cryptoQ.isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" rounded="rounded-2xl" />
              ))}
            </div>
          ) : cryptoAddresses.length === 0 ? (
            <Card className="text-center py-10">
              <Wallet size={36} className="mx-auto text-[#4A5568] mb-3" />
              <p className="text-[#8892B0] text-sm">No saved crypto addresses</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {cryptoAddresses.map((addr, idx) => (
                <motion.div
                  key={addr.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card hover className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5A623]/10">
                      <Wallet size={18} className="text-[#F5A623]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono text-sm">{truncateAddr(addr.address)}</span>
                        <button
                          onClick={() => copyToClipboard(addr.address, addr.id)}
                          className="text-[#8892B0] hover:text-white transition-colors"
                        >
                          {copiedId === addr.id ? <Check size={12} className="text-[#00D4AA]" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#8892B0] mt-0.5">
                        <Badge variant="info" size="sm">{addr.network}</Badge>
                        {addr.nickname && (
                          <span className="flex items-center gap-1">
                            <Tag size={10} />
                            {addr.nickname}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'crypto', id: addr.id })}
                      className="text-[#8892B0] hover:text-[#FF5B5B] transition-colors p-2 rounded-lg hover:bg-[#FF5B5B]/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ─── Transfer Limits (display only) ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield size={20} className="text-[#7B5EA7]" />
              Transfer Limits
            </h2>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left font-medium text-[#8892B0] pb-3">Asset</th>
                    <th className="text-right font-medium text-[#8892B0] pb-3">Daily Limit</th>
                    <th className="text-right font-medium text-[#8892B0] pb-3">Monthly Limit</th>
                    <th className="text-right font-medium text-[#8892B0] pb-3">Per Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { asset: 'BTC', daily: '10 BTC', monthly: '50 BTC', per: '5 BTC' },
                    { asset: 'ETH', daily: '100 ETH', monthly: '500 ETH', per: '50 ETH' },
                    { asset: 'USD', daily: '$100,000', monthly: '$500,000', per: '$50,000' },
                    { asset: 'USDG', daily: '$100,000', monthly: '$500,000', per: '$50,000' },
                    { asset: 'PAXG', daily: '50 PAXG', monthly: '200 PAXG', per: '25 PAXG' },
                  ].map((row) => (
                    <tr key={row.asset} className="border-b border-[rgba(255,255,255,0.04)]">
                      <td className="py-3 text-white font-medium">{row.asset}</td>
                      <td className="py-3 text-right text-[#8892B0]">{row.daily}</td>
                      <td className="py-3 text-right text-[#8892B0]">{row.monthly}</td>
                      <td className="py-3 text-right text-[#8892B0]">{row.per}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-2 bg-[#1B1E36] rounded-xl px-4 py-3">
              <Info size={16} className="text-[#8892B0] shrink-0" />
              <p className="text-xs text-[#8892B0]">
                Need higher limits? Contact support to request an increase based on your account history and verification level.
              </p>
            </div>
          </Card>
        </motion.section>

        {/* ─── Recent Events ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity size={20} className="text-[#9B59F5]" />
              Recent Events
            </h2>
          </div>

          <Card padding="p-0">
            {eventsQ.isLoading && displayEvents.length === 0 ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : displayEvents.length === 0 ? (
              <div className="p-12 text-center">
                <Activity size={40} className="mx-auto text-[#1B1E36] mb-3" />
                <p className="text-[#8892B0]">No events recorded</p>
              </div>
            ) : (
              <div>
                {displayEvents.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="flex items-center gap-4 px-6 py-4 border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[#1B1E36]/40 transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#9B59F5]/10">
                      <Activity size={16} className="text-[#9B59F5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <EventTypeBadge type={event.type} />
                      </div>
                      <p className="text-xs text-[#8892B0] truncate">
                        {typeof event.data === 'string'
                          ? event.data
                          : event.data
                            ? JSON.stringify(event.data).slice(0, 100)
                            : 'No additional details'}
                      </p>
                    </div>
                    <div className="text-xs text-[#8892B0] whitespace-nowrap flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(event.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </motion.div>
                ))}

                {/* Load more button */}
                {hasMoreEvents && (
                  <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)]">
                    <Button
                      variant="ghost"
                      fullWidth
                      loading={eventsQ.isFetching}
                      onClick={handleLoadMore}
                    >
                      Load More Events
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.section>

        {/* ─── Environment Info ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Server size={20} className="text-[#8892B0]" />
              Environment Info
            </h2>
          </div>

          <Card>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div
                  className={[
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    sandboxMode ? 'bg-[#F5A623]/10' : 'bg-[#00D4AA]/10',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'h-3 w-3 rounded-full animate-pulse',
                      sandboxMode ? 'bg-[#F5A623]' : 'bg-[#00D4AA]',
                    ].join(' ')}
                  />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {sandboxMode ? 'Sandbox Mode' : 'Production'}
                  </p>
                  <p className="text-xs text-[#8892B0]">
                    {sandboxMode
                      ? 'You are using the Paxos sandbox environment. No real funds are involved.'
                      : 'Connected to the Paxos production environment.'}
                  </p>
                </div>
              </div>

              <div className="md:ml-auto bg-[#1B1E36] rounded-xl px-4 py-3">
                <div className="text-xs text-[#8892B0] mb-0.5">API Base URL</div>
                <div className="text-sm text-white font-mono flex items-center gap-2">
                  {maskedUrl}
                  <button
                    onClick={() => copyToClipboard(apiBaseUrl, 'api-url')}
                    className="text-[#8892B0] hover:text-white transition-colors"
                  >
                    {copiedId === 'api-url' ? <Check size={12} className="text-[#00D4AA]" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Confirm Deletion"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-[#FF5B5B]/10 rounded-xl p-4">
              <AlertTriangle size={24} className="text-[#FF5B5B] shrink-0" />
              <p className="text-sm text-[#8892B0]">
                Are you sure you want to delete this {deleteConfirm?.type === 'fiat' ? 'bank account' : 'crypto address'}?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  toast.success(
                    `${deleteConfirm?.type === 'fiat' ? 'Bank account' : 'Crypto address'} deleted`
                  );
                  if (deleteConfirm?.type === 'fiat') {
                    queryClient.invalidateQueries({ queryKey: ['fiat-accounts'] });
                  } else {
                    queryClient.invalidateQueries({ queryKey: ['crypto-addresses'] });
                  }
                  setDeleteConfirm(null);
                }}
              >
                <Trash2 size={16} />
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event type badge helper
// ---------------------------------------------------------------------------
function EventTypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    TRANSFER: 'info',
    ORDER: 'success',
    DEPOSIT: 'success',
    WITHDRAWAL: 'warning',
    IDENTITY: 'info',
    ACCOUNT: 'neutral',
  };

  // Find first matching key in the event type string
  const matchedKey = Object.keys(colorMap).find((k) => type.toUpperCase().includes(k));
  const variant = matchedKey ? colorMap[matchedKey] : 'neutral';

  return <Badge variant={variant} size="sm">{type.replace(/_/g, ' ')}</Badge>;
}
