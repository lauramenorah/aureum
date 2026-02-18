'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { RefreshCw, Loader2, Zap } from 'lucide-react';
import { useOnboardingStore } from '@/store/useOnboardingStore';

export default function PendingPage() {
  const router = useRouter();
  const { identityId } = useOnboardingStore();
  const [status, setStatus] = useState<string>('PENDING');
  const [checking, setChecking] = useState(false);
  const [sandboxApproving, setSandboxApproving] = useState(false);

  const isSandbox =
    typeof window !== 'undefined' &&
    (process.env.NEXT_PUBLIC_PAXOS_BASE_URL?.includes('sandbox') ?? false);

  const checkStatus = useCallback(async () => {
    if (!identityId) return;
    setChecking(true);

    try {
      const res = await fetch(`/api/paxos/identities?id=${identityId}`);
      if (res.ok) {
        const data = await res.json();
        const newStatus = data.status || data.summary?.status || 'PENDING';
        setStatus(newStatus);

        if (newStatus === 'APPROVED') {
          router.push('/onboarding/approved');
          return;
        }
        if (newStatus === 'DENIED') {
          router.push('/onboarding/denied');
          return;
        }
      }
    } catch {
      // Silently fail polling
    } finally {
      setChecking(false);
    }
  }, [identityId, router]);

  // Auto-poll every 5 seconds
  useEffect(() => {
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleSandboxApprove = async () => {
    if (!identityId) return;
    setSandboxApproving(true);

    try {
      const res = await fetch('/api/paxos/sandbox-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity_id: identityId }),
      });

      if (res.ok) {
        router.push('/onboarding/approved');
      }
    } catch {
      // Silently fail
    } finally {
      setSandboxApproving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[70vh] flex flex-col items-center justify-center text-center"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
        Application Submitted!
      </h2>

      {/* Animated Orb */}
      <div className="relative my-10">
        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] opacity-20 absolute inset-0 animate-ping" />
        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] opacity-40 animate-pulse flex items-center justify-center relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-[#13152A] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 w-full max-w-md mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <p className="text-white font-semibold">Reviewing your identity</p>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            {status}
          </span>
        </div>
        <p className="text-[#8892B0] text-sm">
          This typically takes a few minutes. We&apos;ll update this page automatically.
        </p>
      </div>

      {/* Manual refresh */}
      <button
        onClick={checkStatus}
        disabled={checking}
        className="flex items-center gap-2 text-[#8892B0] hover:text-white text-sm transition-colors mb-8"
      >
        <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
        Check status
      </button>

      {/* Sandbox Shortcut */}
      {isSandbox && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <p className="text-yellow-400 font-medium text-sm">Sandbox Mode</p>
          </div>
          <p className="text-[#8892B0] text-xs mb-3">
            Running in sandbox? Approve this identity instantly for testing.
          </p>
          <button
            onClick={handleSandboxApprove}
            disabled={sandboxApproving}
            className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-medium text-sm rounded-xl py-2.5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sandboxApproving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Approving...
              </>
            ) : (
              'Approve Instantly'
            )}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
