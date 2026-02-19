'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowLeftRight, Coins } from 'lucide-react';

const features = [
  {
    icon: TrendingUp,
    title: 'Buy & Sell Crypto',
    description: 'Trade Bitcoin, Ethereum, and more at the best prices',
  },
  {
    icon: ArrowLeftRight,
    title: 'Send & Receive Stablecoins',
    description: 'Instant transfers with USDP, PYUSD, USDG, and more',
  },
  {
    icon: Coins,
    title: 'Earn on Your Holdings',
    description: 'Earn USDG rewards just by holding',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      {/* Logo */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] bg-clip-text text-transparent mb-4"
      >
        Aureum
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-[#8892B0] text-lg md:text-xl mb-12 text-center"
      >
        Modern crypto banking. Powered by Paxos.
      </motion.p>

      {/* Feature Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-12"
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="bg-[#13152A] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 hover:shadow-[0_0_40px_rgba(123,94,167,0.15)] transition-shadow duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#7B5EA7]/20 to-[#9B59F5]/20 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-[#9B59F5]" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-[#8892B0] text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="flex flex-col items-center gap-4"
      >
        <button
          onClick={() => router.push('/onboarding/identity')}
          className="bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] text-white font-semibold rounded-xl px-12 py-4 text-lg hover:opacity-90 transition-opacity"
        >
          Get Started
        </button>
        <Link
          href="/sign-in"
          className="text-[#8892B0] hover:text-[#9B59F5] text-sm transition-colors"
        >
          Already have an account? Sign In
        </Link>
      </motion.div>
    </div>
  );
}
