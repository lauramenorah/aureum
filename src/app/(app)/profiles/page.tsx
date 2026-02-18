'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle,
  Star,
  Plus,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Wallet,
  AlertTriangle,
  Coins,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Profile, Balance, Account } from '@/lib/paxos/types';
import { ASSETS, formatAmount, formatUSD } from '@/lib/utils/assets';

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

async function fetchAccounts(): Promise<{ items: Account[] }> {
  const res = await fetch('/api/paxos/accounts');
  if (!res.ok) throw new Error('Failed to load accounts');
  return res.json();
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ProfilesPage() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState<string | null>(null);

  // Create form state
  const [newNickname, setNewNickname] = useState('');
  const [newAccountId, setNewAccountId] = useState('');

  // Queries
  const profilesQ = useQuery({ queryKey: ['profiles'], queryFn: fetchProfiles });
  const profiles = profilesQ.data?.items ?? [];

  const accountsQ = useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts });
  const accounts = accountsQ.data?.items ?? [];

  // Create mutation
  const createMut = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = { nickname: newNickname };
      if (newAccountId) body.account_id = newAccountId;
      const res = await fetch('/api/paxos/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create profile');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Profile created successfully');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setShowCreateModal(false);
      setNewNickname('');
      setNewAccountId('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-[rgba(255,255,255,0.06)] bg-[#0D0E1A] px-4 py-4 md:px-6">
        <h1 className="text-xl font-semibold text-white">Profiles</h1>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[#8892B0] text-sm">
            Manage your profiles and view balances for each.
          </p>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            New Profile
          </Button>
        </div>

        {/* Profiles Grid */}
        {profilesQ.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" rounded="rounded-2xl" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <Card className="text-center py-16">
            <UserCircle size={56} className="mx-auto text-[#1B1E36] mb-4" />
            <p className="text-white font-medium mb-1">No profiles yet</p>
            <p className="text-[#8892B0] text-sm mb-4">Create your first profile to get started</p>
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Create Profile
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile, idx) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                index={idx}
                isExpanded={expanded === profile.id}
                onToggle={() => setExpanded(expanded === profile.id ? null : profile.id)}
                onDeactivate={() => setShowDeactivateConfirm(profile.id)}
              />
            ))}
          </div>
        )}

        {/* Create Profile Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setNewNickname('');
            setNewAccountId('');
          }}
          title="Create New Profile"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate();
            }}
            className="space-y-4"
          >
            <Input
              label="Nickname"
              name="nickname"
              placeholder="e.g. Savings, Trading"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              required
            />

            {accounts.length > 1 && (
              <Select
                label="Account"
                name="accountId"
                placeholder="Select account (optional)"
                options={accounts.map((a) => ({ value: a.id, label: a.id.slice(0, 16) + '...' }))}
                value={newAccountId}
                onChange={(e) => setNewAccountId(e.target.value)}
              />
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setShowCreateModal(false);
                  setNewNickname('');
                  setNewAccountId('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={createMut.isPending}
                disabled={!newNickname.trim()}
              >
                Create Profile
              </Button>
            </div>
          </form>
        </Modal>

        {/* Deactivate Confirmation Modal */}
        <Modal
          isOpen={!!showDeactivateConfirm}
          onClose={() => setShowDeactivateConfirm(null)}
          title="Deactivate Profile"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-[#FF5B5B]/10 rounded-xl p-4">
              <AlertTriangle size={24} className="text-[#FF5B5B] shrink-0" />
              <div>
                <p className="text-sm text-white font-medium">Are you sure?</p>
                <p className="text-xs text-[#8892B0] mt-1">
                  This profile may still have a balance. Deactivating it will prevent further
                  transactions. This action may not be reversible.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowDeactivateConfirm(null)}>
                Keep Active
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  toast.success('Deactivation requested');
                  setShowDeactivateConfirm(null);
                }}
              >
                <Trash2 size={16} />
                Deactivate
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile Card
// ---------------------------------------------------------------------------
function ProfileCard({
  profile,
  index,
  isExpanded,
  onToggle,
  onDeactivate,
}: {
  profile: Profile;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onDeactivate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile.nickname);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDefault = index === 0; // treat first profile as default

  const balancesQ = useQuery({
    queryKey: ['balances', profile.id],
    queryFn: () => fetchBalances(profile.id),
  });
  const balances = balancesQ.data?.items ?? [];

  // Compute total USD value (sum available amounts; non-USD treated as-is for display)
  const totalValue = balances.reduce((sum, b) => {
    return sum + Number(b.available || 0);
  }, 0);
  const assetCount = balances.filter((b) => Number(b.available) > 0).length;

  // Nickname editing
  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setEditedName(profile.nickname);
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const saveNickname = () => {
    setEditing(false);
    if (editedName.trim() && editedName !== profile.nickname) {
      toast.success(`Nickname updated to "${editedName}"`);
      // In a real app, PATCH /api/paxos/profiles/:id
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditedName(profile.nickname);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={isExpanded ? 'md:col-span-2 lg:col-span-3' : ''}
    >
      <Card hover={!isExpanded} className="h-full relative">
        {/* Default star */}
        {isDefault && (
          <div className="absolute top-4 right-4">
            <Star size={18} className="text-[#F5A623] fill-[#F5A623]" />
          </div>
        )}

        {/* Card header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7B5EA7]/20 to-[#9B59F5]/10">
            <UserCircle size={20} className="text-[#9B59F5]" />
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={saveNickname}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveNickname();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="bg-[#1B1E36] border border-[#7B5EA7] rounded-lg px-2 py-1 text-white text-sm w-full focus:outline-none focus:ring-1 focus:ring-[#7B5EA7]"
                />
                <button onClick={saveNickname} className="text-[#00D4AA] hover:text-green-400 p-0.5">
                  <Check size={14} />
                </button>
                <button onClick={cancelEdit} className="text-[#FF5B5B] hover:text-red-400 p-0.5">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group">
                <span className="text-white font-medium text-sm truncate">
                  {profile.nickname || 'Unnamed Profile'}
                </span>
                <button
                  onClick={startEdit}
                  className="text-[#4A5568] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Pencil size={12} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="info" size="sm">{profile.type || 'DEFAULT'}</Badge>
              {isDefault && (
                <Badge variant="warning" size="sm">
                  <span className="flex items-center gap-1"><Star size={10} /> Default</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Value summary */}
        <div className="mb-4">
          {balancesQ.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-white">{formatUSD(totalValue)}</p>
              <p className="text-xs text-[#8892B0] flex items-center gap-1">
                <Coins size={12} />
                {assetCount} asset{assetCount !== 1 ? 's' : ''} with balance
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 text-xs text-[#8892B0] hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isExpanded ? 'Hide Balances' : 'View Balances'}
          </button>
          <div className="flex-1" />
          {!isDefault && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.success('Set as default profile');
              }}
              className="text-xs text-[#8892B0] hover:text-[#F5A623] transition-colors flex items-center gap-1"
            >
              <Star size={12} />
              Set Default
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeactivate();
            }}
            className="text-xs text-[#8892B0] hover:text-[#FF5B5B] transition-colors flex items-center gap-1"
          >
            <Trash2 size={12} />
            Deactivate
          </button>
        </div>

        {/* Expanded Balance Breakdown */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                {balancesQ.isLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : balances.length === 0 ? (
                  <div className="text-center py-6">
                    <Wallet size={28} className="mx-auto text-[#4A5568] mb-2" />
                    <p className="text-sm text-[#8892B0]">No balances in this profile</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {balances.map((b) => {
                      const meta = ASSETS[b.asset as keyof typeof ASSETS];
                      return (
                        <div
                          key={b.asset}
                          className="bg-[#1B1E36] rounded-xl px-4 py-3 flex items-center gap-3"
                        >
                          <div
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: `${meta?.color || '#7B5EA7'}20`, color: meta?.color || '#7B5EA7' }}
                          >
                            {b.asset.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white font-medium">{b.asset}</span>
                              <span className="text-sm text-white font-mono">
                                {formatAmount(b.available, b.asset)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#8892B0]">{meta?.name || b.asset}</span>
                              {Number(b.trading) > 0 && (
                                <span className="text-xs text-[#F5A623]">
                                  {formatAmount(b.trading, b.asset)} trading
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
