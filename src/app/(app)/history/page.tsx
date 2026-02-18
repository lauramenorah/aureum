'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  ArrowLeftRight,
  Send,
  Clock,
  ChevronRight,
  Download,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';
import { formatUSD } from '@/lib/utils/assets';
import type {
  Transfer,
  Order,
  StablecoinConversion,
  Execution,
} from '@/lib/paxos/types';

// ─── Constants ──────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { key: 'all', label: 'All', icon: FileText },
  { key: 'deposits', label: 'Deposits', icon: ArrowDownToLine },
  { key: 'withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
  { key: 'trades', label: 'Trades', icon: TrendingUp },
  { key: 'conversions', label: 'Conversions', icon: ArrowLeftRight },
  { key: 'transfers', label: 'Transfers', icon: Send },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]['key'];

// ─── Unified Transaction Type ───────────────────────────────────────────────

interface UnifiedTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'conversion' | 'transfer';
  asset: string;
  amount: string;
  usdValue: string;
  status: string;
  date: string;
  direction: 'in' | 'out' | 'neutral';
  details: Record<string, string>;
  raw: Transfer | Order | StablecoinConversion | Execution;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTypeIcon(type: UnifiedTransaction['type']) {
  switch (type) {
    case 'deposit':
      return ArrowDownToLine;
    case 'withdrawal':
      return ArrowUpFromLine;
    case 'trade':
      return TrendingUp;
    case 'conversion':
      return ArrowLeftRight;
    case 'transfer':
      return Send;
  }
}

function getTypeColor(type: UnifiedTransaction['type']) {
  switch (type) {
    case 'deposit':
      return '#00D4AA';
    case 'withdrawal':
      return '#FF5B5B';
    case 'trade':
      return '#7B5EA7';
    case 'conversion':
      return '#F5A623';
    case 'transfer':
      return '#627EEA';
  }
}

function getStatusBadgeVariant(
  status: string
): 'success' | 'warning' | 'error' | 'neutral' | 'info' {
  const upper = status.toUpperCase();
  if (upper === 'COMPLETED' || upper === 'FILLED' || upper === 'APPROVED')
    return 'success';
  if (
    upper === 'PENDING' ||
    upper === 'OPEN' ||
    upper === 'PARTIALLY_FILLED'
  )
    return 'warning';
  if (upper === 'FAILED' || upper === 'CANCELLED' || upper === 'EXPIRED')
    return 'error';
  return 'neutral';
}

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function normalizeTransfers(transfers: Transfer[]): UnifiedTransaction[] {
  return transfers.map((t) => {
    const isDeposit =
      t.direction === 'CREDIT' ||
      t.type?.toLowerCase().includes('deposit') ||
      t.direction === 'IN';
    const isWithdrawal =
      t.direction === 'DEBIT' ||
      t.type?.toLowerCase().includes('withdraw') ||
      t.direction === 'OUT';

    let txType: UnifiedTransaction['type'] = 'transfer';
    if (isDeposit) txType = 'deposit';
    else if (isWithdrawal) txType = 'withdrawal';

    return {
      id: t.id,
      type: txType,
      asset: t.asset,
      amount: t.amount,
      usdValue: t.asset === 'USD' ? t.amount : t.amount,
      status: t.status,
      date: t.created_at,
      direction: isDeposit ? 'in' : 'out',
      details: {
        'Transfer ID': t.id,
        Type: t.type || 'N/A',
        Direction: t.direction || 'N/A',
        'Destination Address': t.destination_address || 'N/A',
        Fee: t.fee || '0',
        'Created At': new Date(t.created_at).toLocaleString(),
        'Updated At': t.updated_at
          ? new Date(t.updated_at).toLocaleString()
          : 'N/A',
      },
      raw: t,
    };
  });
}

function normalizeOrders(orders: Order[]): UnifiedTransaction[] {
  return orders
    .filter((o) => o.status === 'FILLED' || o.status === 'PARTIALLY_FILLED')
    .map((o) => ({
      id: o.id,
      type: 'trade' as const,
      asset: o.market?.replace('USD', '') || 'BTC',
      amount: o.amount || o.base_amount || '0',
      usdValue: o.quote_amount || o.amount || '0',
      status: o.status,
      date: o.created_at,
      direction: o.side === 'BUY' ? ('in' as const) : ('out' as const),
      details: {
        'Order ID': o.id,
        Market: o.market,
        Side: o.side,
        Type: o.type,
        Price: o.price || 'Market',
        Amount: o.amount,
        'Base Amount': o.base_amount || 'N/A',
        'Quote Amount': o.quote_amount || 'N/A',
        Status: o.status,
        'Time in Force': o.time_in_force || 'N/A',
        'Created At': new Date(o.created_at).toLocaleString(),
      },
      raw: o,
    }));
}

function normalizeConversions(
  conversions: StablecoinConversion[]
): UnifiedTransaction[] {
  return conversions.map((c) => ({
    id: c.id,
    type: 'conversion' as const,
    asset: `${c.from_asset} > ${c.to_asset}`,
    amount: c.amount,
    usdValue: c.amount,
    status: c.status,
    date: c.created_at,
    direction: 'neutral' as const,
    details: {
      'Conversion ID': c.id,
      'From Asset': c.from_asset,
      'To Asset': c.to_asset,
      Amount: c.amount,
      Status: c.status,
      'Created At': new Date(c.created_at).toLocaleString(),
    },
    raw: c,
  }));
}

function generateCSV(transactions: UnifiedTransaction[]): string {
  const headers = [
    'Date',
    'Type',
    'Asset',
    'Amount',
    'Direction',
    'Status',
    'ID',
  ];
  const rows = transactions.map((t) => [
    new Date(t.date).toISOString(),
    t.type,
    t.asset,
    t.amount,
    t.direction,
    t.status,
    t.id,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Transaction Row Component ──────────────────────────────────────────────

function TransactionRow({
  tx,
  isExpanded,
  onToggle,
}: {
  tx: UnifiedTransaction;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = getTypeIcon(tx.type);
  const color = getTypeColor(tx.type);

  return (
    <motion.div
      layout
      className="border-b border-[rgba(255,255,255,0.03)] last:border-0"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-4 py-4 hover:bg-[#1B1E36]/30 transition-colors text-left"
      >
        {/* Icon */}
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={18} style={{ color }} />
        </div>

        {/* Left: Type + Asset */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white capitalize">
            {tx.type}
          </p>
          <p className="text-xs text-[#8892B0] truncate">{tx.asset}</p>
        </div>

        {/* Center: Amount */}
        <div className="text-right mr-4">
          <p
            className={cn(
              'text-sm font-mono font-medium',
              tx.direction === 'in'
                ? 'text-[#00D4AA]'
                : tx.direction === 'out'
                  ? 'text-[#FF5B5B]'
                  : 'text-white'
            )}
          >
            {tx.direction === 'in' ? '+' : tx.direction === 'out' ? '-' : ''}
            {tx.amount}
          </p>
          {tx.usdValue !== tx.amount && (
            <p className="text-xs text-[#4A5568] font-mono">
              {formatUSD(tx.usdValue)}
            </p>
          )}
        </div>

        {/* Right: Status + Date */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <Badge variant={getStatusBadgeVariant(tx.status)} size="sm">
              {tx.status}
            </Badge>
            <p className="text-xs text-[#4A5568] mt-1">
              {relativeDate(tx.date)}
            </p>
          </div>
          <ChevronRight
            size={16}
            className={cn(
              'text-[#4A5568] transition-transform shrink-0',
              isExpanded && 'rotate-90'
            )}
          />
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-[72px]">
              <div className="rounded-xl bg-[#0D0E1A] p-4 space-y-2">
                {Object.entries(tx.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-[#4A5568]">{key}</span>
                    <span className="text-[#8892B0] font-mono text-xs max-w-[200px] truncate">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function HistoryPage() {
  // ── State ────────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<FilterKey>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(20);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: transfersData, isLoading: transfersLoading } = useQuery({
    queryKey: ['history-transfers'],
    queryFn: async () => {
      const res = await fetch('/api/paxos/transfers?limit=100');
      if (!res.ok) throw new Error('Failed to fetch transfers');
      return res.json();
    },
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['history-orders'],
    queryFn: async () => {
      const res = await fetch('/api/paxos/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
  });

  const { data: conversionsData, isLoading: conversionsLoading } = useQuery({
    queryKey: ['history-conversions'],
    queryFn: async () => {
      const res = await fetch('/api/paxos/stablecoin-conversions');
      if (!res.ok) throw new Error('Failed to fetch conversions');
      return res.json();
    },
  });

  const isLoading = transfersLoading || ordersLoading || conversionsLoading;

  // ── Normalize and combine ────────────────────────────────────────────────

  const allTransactions = useMemo(() => {
    const transfers: Transfer[] =
      Array.isArray(transfersData?.items) ? transfersData.items : Array.isArray(transfersData) ? transfersData : [];
    const orders: Order[] =
      Array.isArray(ordersData?.items) ? ordersData.items : Array.isArray(ordersData) ? ordersData : [];
    const conversions: StablecoinConversion[] =
      Array.isArray(conversionsData?.items) ? conversionsData.items : Array.isArray(conversionsData) ? conversionsData : [];

    const normalized: UnifiedTransaction[] = [
      ...normalizeTransfers(transfers),
      ...normalizeOrders(orders),
      ...normalizeConversions(conversions),
    ];

    // Sort by date descending
    normalized.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return normalized;
  }, [transfersData, ordersData, conversionsData]);

  // ── Filter ───────────────────────────────────────────────────────────────

  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

    // Type filter
    if (filter !== 'all') {
      const typeMap: Record<string, string[]> = {
        deposits: ['deposit'],
        withdrawals: ['withdrawal'],
        trades: ['trade'],
        conversions: ['conversion'],
        transfers: ['transfer'],
      };
      const allowedTypes = typeMap[filter] || [];
      filtered = filtered.filter((t) => allowedTypes.includes(t.type));
    }

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter((t) => new Date(t.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((t) => new Date(t.date) <= to);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.asset.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q) ||
          t.status.toLowerCase().includes(q) ||
          t.amount.includes(q)
      );
    }

    return filtered;
  }, [allTransactions, filter, dateFrom, dateTo, searchQuery]);

  // ── Paginated display ────────────────────────────────────────────────────
  const displayedTransactions = filteredTransactions.slice(0, displayCount);
  const hasMore = displayCount < filteredTransactions.length;

  // ── Export CSV ───────────────────────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }
    const csv = generateCSV(filteredTransactions);
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `neobank-history-${date}.csv`);
    toast.success(
      `Exported ${filteredTransactions.length} transactions`
    );
  }, [filteredTransactions]);

  // ── Stat counts ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = allTransactions.length;
    const completed = allTransactions.filter(
      (t) =>
        t.status === 'COMPLETED' ||
        t.status === 'FILLED' ||
        t.status === 'APPROVED'
    ).length;
    const pending = allTransactions.filter(
      (t) =>
        t.status === 'PENDING' ||
        t.status === 'OPEN' ||
        t.status === 'PARTIALLY_FILLED'
    ).length;
    const failed = allTransactions.filter(
      (t) =>
        t.status === 'FAILED' ||
        t.status === 'CANCELLED' ||
        t.status === 'EXPIRED'
    ).length;
    return { total, completed, pending, failed };
  }, [allTransactions]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">History</h1>
          <p className="text-[#8892B0] text-sm">
            View and export your complete transaction history.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleExportCSV}
          disabled={filteredTransactions.length === 0}
        >
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: 'Total',
            value: stats.total,
            icon: FileText,
            color: '#8892B0',
          },
          {
            label: 'Completed',
            value: stats.completed,
            icon: CheckCircle2,
            color: '#00D4AA',
          },
          {
            label: 'Pending',
            value: stats.pending,
            icon: Clock,
            color: '#F5A623',
          },
          {
            label: 'Failed',
            value: stats.failed,
            icon: XCircle,
            color: '#FF5B5B',
          },
        ].map((stat) => (
          <Card key={stat.label} padding="p-4">
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xs text-[#4A5568]">{stat.label}</p>
                <p className="text-lg font-bold text-white font-mono">
                  {stat.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <Card className="mb-6">
        {/* Tab filters */}
        <div className="flex gap-1 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
          {FILTER_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setFilter(tab.key);
                  setDisplayCount(20);
                }}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-all shrink-0',
                  isActive
                    ? 'text-white border-b-2 border-[#7B5EA7] bg-[#1B1E36]'
                    : 'text-[#8892B0] hover:text-white hover:bg-[#1B1E36]/50'
                )}
              >
                <TabIcon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search + Date filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[rgba(255,255,255,0.06)]">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5568]"
            />
            <input
              type="text"
              placeholder="Search by ID, asset, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D0E1A] border border-[rgba(255,255,255,0.06)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#4A5568] focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] outline-none transition-all"
            />
          </div>

          {/* Date from */}
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5568] pointer-events-none"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-[#0D0E1A] border border-[rgba(255,255,255,0.06)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] outline-none transition-all [color-scheme:dark]"
              title="From date"
            />
          </div>

          {/* Date to */}
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5568] pointer-events-none"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-[#0D0E1A] border border-[rgba(255,255,255,0.06)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] outline-none transition-all [color-scheme:dark]"
              title="To date"
            />
          </div>

          {/* Clear filters */}
          {(dateFrom || dateTo || searchQuery) && (
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSearchQuery('');
              }}
              className="text-sm text-[#8892B0] hover:text-white transition-colors whitespace-nowrap px-3 py-2"
            >
              Clear
            </button>
          )}
        </div>
      </Card>

      {/* Transaction list */}
      <Card padding="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" rounded="rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton height="16px" width="120px" />
                  <Skeleton height="12px" width="80px" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton height="16px" width="80px" />
                  <Skeleton height="12px" width="60px" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#4A5568]">
            <Clock size={48} className="mb-4 opacity-40" />
            <p className="text-base font-medium mb-1 text-[#8892B0]">
              No transactions found
            </p>
            <p className="text-sm">
              {filter !== 'all'
                ? `No ${filter} match your current filters.`
                : 'Your transaction history will appear here.'}
            </p>
            {(dateFrom || dateTo || searchQuery) && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setSearchQuery('');
                  setFilter('all');
                }}
                className="mt-4 text-sm text-[#7B5EA7] hover:text-[#9B59F5] transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <span className="text-xs text-[#4A5568]">
                Showing {displayedTransactions.length} of{' '}
                {filteredTransactions.length} transactions
              </span>
            </div>

            {/* Transaction rows */}
            <div>
              {displayedTransactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  isExpanded={expandedId === tx.id}
                  onToggle={() =>
                    setExpandedId(expandedId === tx.id ? null : tx.id)
                  }
                />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="p-4 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={() => setDisplayCount((prev) => prev + 20)}
                >
                  <Loader2 size={14} />
                  Load More ({filteredTransactions.length - displayCount}{' '}
                  remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
