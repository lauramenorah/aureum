'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, AlertTriangle, FileWarning, HelpCircle } from 'lucide-react';
import { useOnboardingStore } from '@/store/useOnboardingStore';

interface DenialInfo {
  reason: string;
  details: string;
}

const guidanceCards: Record<string, { icon: typeof AlertTriangle; title: string; description: string }> = {
  DOCUMENT_ISSUE: {
    icon: FileWarning,
    title: 'Document Issue',
    description: 'Please re-upload clear photos of your government-issued ID. Make sure all four corners are visible and the text is legible.',
  },
  INFO_MISMATCH: {
    icon: AlertTriangle,
    title: 'Information Mismatch',
    description: 'The information you provided does not match your identity documents. Please review and correct your personal details.',
  },
  DEFAULT: {
    icon: HelpCircle,
    title: 'Verification Failed',
    description: 'We were unable to verify your identity. Please review your information and try again, or contact support for assistance.',
  },
};

export default function DeniedPage() {
  const router = useRouter();
  const { identityId } = useOnboardingStore();
  const [denial, setDenial] = useState<DenialInfo>({ reason: '', details: '' });

  useEffect(() => {
    const fetchDenialReason = async () => {
      if (!identityId) return;

      try {
        const res = await fetch(`/api/paxos/identities?id=${identityId}`);
        if (res.ok) {
          const data = await res.json();
          setDenial({
            reason: data.summary?.reason || data.reason || 'VERIFICATION_FAILED',
            details: data.summary?.details || data.details || 'Your identity verification was not successful.',
          });
        }
      } catch {
        // Use default reason
        setDenial({
          reason: 'VERIFICATION_FAILED',
          details: 'Your identity verification was not successful. Please try again.',
        });
      }
    };

    fetchDenialReason();
  }, [identityId]);

  const guidance = guidanceCards[denial.reason] || guidanceCards.DEFAULT;
  const GuidanceIcon = guidance.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[70vh] flex flex-col items-center justify-center text-center"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 w-24 h-24 rounded-full bg-red-500 opacity-20 blur-xl" />
        <XCircle className="w-24 h-24 text-red-400 relative" strokeWidth={1.5} />
      </motion.div>

      {/* Heading */}
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
        Application Needs Attention
      </h2>

      {/* Status badge */}
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 mb-6">
        DENIED
      </span>

      {/* Denial reason */}
      {denial.details && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 w-full max-w-md mb-6">
          <p className="text-red-300 text-sm leading-relaxed">{denial.details}</p>
        </div>
      )}

      {/* Guidance card */}
      <div className="bg-[#13152A] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 w-full max-w-md mb-8">
        <div className="flex items-start gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-[#1B1E36] flex items-center justify-center flex-shrink-0">
            <GuidanceIcon className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">{guidance.title}</h3>
            <p className="text-[#8892B0] text-sm leading-relaxed">{guidance.description}</p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={() => router.push('/onboarding/review')}
          className="flex-1 bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] text-white font-semibold rounded-xl py-3.5 hover:opacity-90 transition-opacity"
        >
          Update & Resubmit
        </button>
        <button
          onClick={() => window.open('mailto:support@aureum.com', '_blank')}
          className="flex-1 border border-[rgba(255,255,255,0.06)] text-[#8892B0] font-semibold rounded-xl py-3.5 hover:bg-[#1B1E36] hover:text-white transition-colors"
        >
          Contact Support
        </button>
      </div>
    </motion.div>
  );
}
