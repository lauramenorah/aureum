'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  User,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Shield,
  MapPin,
  FileText,
  Upload,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  EyeOff,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Identity, Account } from '@/lib/paxos/types';

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------
async function fetchIdentities(): Promise<{ items: Identity[] }> {
  const res = await fetch('/api/paxos/identities');
  if (!res.ok) throw new Error('Failed to load identities');
  return res.json();
}

async function fetchAccounts(): Promise<{ items: Account[] }> {
  const res = await fetch('/api/paxos/accounts');
  if (!res.ok) throw new Error('Failed to load accounts');
  return res.json();
}

async function fetchAccountMembers(accountId: string): Promise<{ items: { id: string; account_id: string; identity_id: string; role: string }[] }> {
  const res = await fetch(`/api/paxos/account-members?account_id=${accountId}`);
  if (!res.ok) throw new Error('Failed to load members');
  return res.json();
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
function identityStatusBadge(status: string) {
  const map: Record<string, { variant: 'success' | 'warning' | 'error' | 'info'; icon: React.ReactNode; desc: string }> = {
    APPROVED: { variant: 'success', icon: <CheckCircle2 size={12} />, desc: 'Identity verified and approved' },
    PENDING: { variant: 'warning', icon: <Clock size={12} />, desc: 'Awaiting verification review' },
    DENIED: { variant: 'error', icon: <XCircle size={12} />, desc: 'Identity verification failed' },
    DISABLED: { variant: 'error', icon: <AlertCircle size={12} />, desc: 'Identity has been disabled' },
  };
  const cfg = map[status] || { variant: 'info' as const, icon: <AlertCircle size={12} />, desc: status };
  return { badge: cfg, statusDescription: cfg.desc };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [expandedIdentity, setExpandedIdentity] = useState<string | null>(null);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [showTax, setShowTax] = useState(false);
  const [addMemberModal, setAddMemberModal] = useState<string | null>(null);
  const [newMemberIdentityId, setNewMemberIdentityId] = useState('');

  const identitiesQ = useQuery({ queryKey: ['identities'], queryFn: fetchIdentities });
  const identities = identitiesQ.data?.items ?? [];

  const accountsQ = useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts });
  const accounts = accountsQ.data?.items ?? [];

  const addMemberMut = useMutation({
    mutationFn: async ({ accountId, identityId }: { accountId: string; identityId: string }) => {
      const res = await fetch('/api/paxos/account-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, identity_id: identityId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add member');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Member added successfully');
      queryClient.invalidateQueries({ queryKey: ['account-members'] });
      setAddMemberModal(null);
      setNewMemberIdentityId('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMemberMut = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch('/api/paxos/account-members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove member');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['account-members'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleIdentity = (id: string) => {
    setExpandedIdentity(expandedIdentity === id ? null : id);
    setShowTax(false);
  };

  const isLoading = identitiesQ.isLoading || accountsQ.isLoading;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-[rgba(255,255,255,0.06)] bg-[#0D0E1A] px-4 py-4 md:px-6">
        <h1 className="text-xl font-semibold text-white">Accounts & Identity</h1>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6 space-y-8">
        {/* Identities Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield size={20} className="text-[#7B5EA7]" />
              Identities
            </h2>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/onboarding/welcome'}>
              <Plus size={16} />
              Create Identity
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" rounded="rounded-2xl" />
              ))}
            </div>
          ) : identities.length === 0 ? (
            <Card className="text-center py-16">
              <Users size={48} className="mx-auto text-[#1B1E36] mb-4" />
              <p className="text-[#8892B0]">No identities found</p>
              <p className="text-xs text-[#4A5568] mt-1">Create an identity to get started</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {identities.map((identity, idx) => {
                const isExpanded = expandedIdentity === identity.id;
                const { badge, statusDescription } = identityStatusBadge(identity.status);
                const name = identity.type === 'PERSON'
                  ? `${identity.person_details?.first_name || ''} ${identity.person_details?.last_name || ''}`.trim()
                  : identity.institution_details?.name || 'Unnamed';

                return (
                  <motion.div
                    key={identity.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="overflow-hidden">
                      {/* Summary row */}
                      <button
                        onClick={() => toggleIdentity(identity.id)}
                        className="w-full flex items-center gap-4 text-left"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1B1E36]">
                          {identity.type === 'PERSON' ? (
                            <User size={22} className="text-[#9B59F5]" />
                          ) : (
                            <Building2 size={22} className="text-[#F5A623]" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium truncate">{name || 'Unnamed'}</span>
                            <Badge variant={identity.type === 'PERSON' ? 'info' : 'warning'} size="sm">
                              {identity.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#8892B0]">
                            <Badge variant={badge.variant} size="sm">
                              <span className="flex items-center gap-1">{badge.icon} {identity.status}</span>
                            </Badge>
                            <span className="font-mono">{identity.id.slice(0, 12)}...</span>
                          </div>
                        </div>

                        <div className="text-[#8892B0]">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </button>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-4">
                              {/* Status explanation */}
                              <div className="bg-[#1B1E36] rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                  {badge.icon}
                                  <span className="text-sm font-medium text-white">Status: {identity.status}</span>
                                </div>
                                <p className="text-xs text-[#8892B0]">{statusDescription}</p>
                              </div>

                              {/* Personal / Institution Info */}
                              {identity.type === 'PERSON' && identity.person_details && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <InfoRow label="First Name" value={identity.person_details.first_name} />
                                  <InfoRow label="Last Name" value={identity.person_details.last_name} />
                                  <InfoRow label="Email" value={identity.person_details.email} />
                                  <InfoRow label="Date of Birth" value={identity.person_details.date_of_birth} />
                                  {identity.person_details.nationality && (
                                    <InfoRow label="Nationality" value={identity.person_details.nationality} />
                                  )}
                                  {identity.person_details.phone && (
                                    <InfoRow label="Phone" value={identity.person_details.phone} />
                                  )}
                                </div>
                              )}

                              {identity.type === 'INSTITUTION' && identity.institution_details && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <InfoRow label="Name" value={identity.institution_details.name} />
                                  <InfoRow label="Entity Type" value={identity.institution_details.entity_type} />
                                  <InfoRow label="Registration Number" value={identity.institution_details.registration_number} />
                                  <InfoRow label="Country" value={identity.institution_details.country_of_incorporation} />
                                  {identity.institution_details.website && (
                                    <InfoRow label="Website" value={identity.institution_details.website} />
                                  )}
                                </div>
                              )}

                              {/* Address */}
                              {identity.address && (
                                <div>
                                  <h4 className="text-sm font-medium text-[#8892B0] mb-2 flex items-center gap-1.5">
                                    <MapPin size={14} />
                                    Address
                                  </h4>
                                  <div className="bg-[#1B1E36] rounded-xl p-4 text-sm text-white">
                                    <p>{identity.address.street1}</p>
                                    {identity.address.street2 && <p>{identity.address.street2}</p>}
                                    <p>
                                      {identity.address.city}, {identity.address.state} {identity.address.postal_code}
                                    </p>
                                    <p>{identity.address.country}</p>
                                  </div>
                                </div>
                              )}

                              {/* Tax Info (masked) */}
                              {identity.tax_details && (
                                <div>
                                  <h4 className="text-sm font-medium text-[#8892B0] mb-2 flex items-center gap-1.5">
                                    <FileText size={14} />
                                    Tax Information
                                  </h4>
                                  <div className="bg-[#1B1E36] rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="space-y-1">
                                        <div className="text-xs text-[#8892B0]">Tax ID Type</div>
                                        <div className="text-sm text-white">{identity.tax_details.tax_id_type}</div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-xs text-[#8892B0]">Tax ID</div>
                                        <div className="text-sm text-white font-mono flex items-center gap-2">
                                          {showTax
                                            ? identity.tax_details.tax_id
                                            : `***-**-${identity.tax_details.tax_id.slice(-4)}`}
                                          <button
                                            onClick={() => setShowTax(!showTax)}
                                            className="text-[#8892B0] hover:text-white transition-colors"
                                          >
                                            {showTax ? <EyeOff size={14} /> : <Eye size={14} />}
                                          </button>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-xs text-[#8892B0]">Country</div>
                                        <div className="text-sm text-white">{identity.tax_details.tax_country}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Documents Section */}
                              <div>
                                <h4 className="text-sm font-medium text-[#8892B0] mb-2 flex items-center gap-1.5">
                                  <FileText size={14} />
                                  Documents
                                </h4>
                                <div className="bg-[#1B1E36] rounded-xl p-6 text-center">
                                  <Upload size={28} className="mx-auto text-[#4A5568] mb-2" />
                                  <p className="text-sm text-[#8892B0]">Upload identity verification documents</p>
                                  <Button variant="outline" size="sm" className="mt-3">
                                    <Upload size={14} />
                                    Upload Document
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Accounts Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users size={20} className="text-[#00D4AA]" />
              Accounts
            </h2>
          </div>

          {accountsQ.isLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" rounded="rounded-2xl" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <Card className="text-center py-12">
              <Users size={40} className="mx-auto text-[#1B1E36] mb-3" />
              <p className="text-[#8892B0]">No accounts found</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {accounts.map((account, idx) => {
                const isExpanded = expandedAccount === account.id;
                const linkedIdentity = identities.find((i) => i.id === account.identity_id);

                return (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card>
                      <button
                        onClick={() => setExpandedAccount(isExpanded ? null : account.id)}
                        className="w-full flex items-center gap-4 text-left"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1B1E36]">
                          <Users size={22} className="text-[#00D4AA]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium font-mono text-sm">
                              {account.id.slice(0, 16)}...
                            </span>
                            <Badge variant="neutral" size="sm">{account.type || 'STANDARD'}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#8892B0]">
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              Identity: {linkedIdentity
                                ? (linkedIdentity.type === 'PERSON'
                                  ? `${linkedIdentity.person_details?.first_name} ${linkedIdentity.person_details?.last_name}`
                                  : linkedIdentity.institution_details?.name)
                                : account.identity_id.slice(0, 12)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(account.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="text-[#8892B0]">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </button>

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
                              <AccountMembersSection
                                accountId={account.id}
                                onAdd={() => setAddMemberModal(account.id)}
                                onRemove={(memberId) => removeMemberMut.mutate(memberId)}
                                isRemoving={removeMemberMut.isPending}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Add Member Modal */}
        <Modal
          isOpen={!!addMemberModal}
          onClose={() => {
            setAddMemberModal(null);
            setNewMemberIdentityId('');
          }}
          title="Add Account Member"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (addMemberModal && newMemberIdentityId) {
                addMemberMut.mutate({ accountId: addMemberModal, identityId: newMemberIdentityId });
              }
            }}
            className="space-y-4"
          >
            <Input
              label="Identity ID"
              name="memberIdentityId"
              placeholder="Enter the identity ID"
              value={newMemberIdentityId}
              onChange={(e) => setNewMemberIdentityId(e.target.value)}
              required
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setAddMemberModal(null);
                  setNewMemberIdentityId('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={addMemberMut.isPending}
                disabled={!newMemberIdentityId}
              >
                <UserPlus size={16} />
                Add Member
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1B1E36] rounded-xl px-4 py-3">
      <div className="text-xs text-[#8892B0] mb-0.5">{label}</div>
      <div className="text-sm text-white">{value}</div>
    </div>
  );
}

function AccountMembersSection({
  accountId,
  onAdd,
  onRemove,
  isRemoving,
}: {
  accountId: string;
  onAdd: () => void;
  onRemove: (memberId: string) => void;
  isRemoving: boolean;
}) {
  const membersQ = useQuery({
    queryKey: ['account-members', accountId],
    queryFn: () => fetchAccountMembers(accountId),
  });
  const members = membersQ.data?.items ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-[#8892B0]">Account Members</h4>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <UserPlus size={14} />
          Add
        </Button>
      </div>

      {membersQ.isLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="bg-[#1B1E36] rounded-xl p-4 text-center">
          <p className="text-sm text-[#8892B0]">No additional members</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-[#1B1E36] rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div>
                <span className="text-sm text-white font-mono">{member.identity_id.slice(0, 16)}...</span>
                <span className="ml-2"><Badge variant="neutral" size="sm">{member.role || 'MEMBER'}</Badge></span>
              </div>
              <button
                onClick={() => onRemove(member.id)}
                disabled={isRemoving}
                className="text-[#FF5B5B] hover:text-red-400 transition-colors p-1 rounded hover:bg-[#FF5B5B]/10 disabled:opacity-50"
              >
                <UserMinus size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
