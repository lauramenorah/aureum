'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useOnboardingStore } from '@/store/useOnboardingStore';

export default function ApprovedPage() {
  const router = useRouter();
  const { accountId, profileId, reset } = useOnboardingStore();

  useEffect(() => {
    // Fire confetti on mount
    const launchConfetti = async () => {
      try {
        const confetti = (await import('canvas-confetti')).default;
        // First burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7B5EA7', '#9B59F5', '#00D4AA', '#FFD700'],
        });
        // Second burst with delay
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#7B5EA7', '#9B59F5', '#00D4AA'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#7B5EA7', '#9B59F5', '#00D4AA'],
          });
        }, 300);
      } catch {
        // canvas-confetti not available, fail silently
      }
    };

    launchConfetti();

    // Clear the onboarding store
    reset();
  }, [reset]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-[70vh] flex flex-col items-center justify-center text-center"
    >
      {/* Check icon with glow */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 w-24 h-24 rounded-full bg-[#00D4AA] opacity-20 blur-xl" />
        <CheckCircle className="w-24 h-24 text-[#00D4AA] relative" strokeWidth={1.5} />
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-3xl md:text-4xl font-bold text-white mb-3"
      >
        You&apos;re all set!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-[#8892B0] text-lg mb-10 max-w-md"
      >
        Your identity has been verified. Your account is ready.
      </motion.p>

      {/* Account Details Card */}
      {(accountId || profileId) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-[#13152A] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 w-full max-w-md mb-10"
        >
          <h3 className="text-white font-semibold mb-4">Account Details</h3>
          {accountId && (
            <div className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-[#8892B0] text-sm">Account ID</span>
              <span className="text-white text-sm font-mono">
                {accountId.length > 16 ? accountId.slice(0, 8) + '...' + accountId.slice(-8) : accountId}
              </span>
            </div>
          )}
          {profileId && (
            <div className="flex justify-between py-2">
              <span className="text-[#8892B0] text-sm">Profile ID</span>
              <span className="text-white text-sm font-mono">
                {profileId.length > 16 ? profileId.slice(0, 8) + '...' + profileId.slice(-8) : profileId}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
      >
        <button
          onClick={() => router.push('/deposit')}
          className="flex-1 bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] text-white font-semibold rounded-xl py-3.5 hover:opacity-90 transition-opacity"
        >
          Fund Your Account
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex-1 border border-[rgba(255,255,255,0.06)] text-[#8892B0] font-semibold rounded-xl py-3.5 hover:bg-[#1B1E36] hover:text-white transition-colors"
        >
          Explore the App
        </button>
      </motion.div>
    </motion.div>
  );
}
