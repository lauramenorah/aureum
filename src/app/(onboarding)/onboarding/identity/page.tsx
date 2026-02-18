'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Building2 } from 'lucide-react';
import StepIndicator from '@/components/onboarding/StepIndicator';
import { useOnboardingStore, IdentityType } from '@/store/useOnboardingStore';

const options: { type: IdentityType; icon: typeof User; title: string; description: string }[] = [
  {
    type: 'PERSON',
    icon: User,
    title: 'Individual',
    description: "I'm opening a personal account",
  },
  {
    type: 'INSTITUTION',
    icon: Building2,
    title: 'Institution',
    description: "I'm opening a business account",
  },
];

export default function IdentityPage() {
  const router = useRouter();
  const { identityType, setIdentityType, setStep } = useOnboardingStore();

  const handleContinue = () => {
    setStep(2);
    router.push('/onboarding/personal-info');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <StepIndicator currentStep={1} />

      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
        What best describes you?
      </h2>
      <p className="text-[#8892B0] mb-8">
        Select the type of account you&apos;d like to open.
      </p>

      {/* Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = identityType === option.type;

          return (
            <button
              key={option.type}
              onClick={() => setIdentityType(option.type)}
              className={`
                relative p-6 rounded-2xl border-2 text-left transition-all duration-300
                ${
                  isSelected
                    ? 'border-[#7B5EA7] shadow-[0_0_40px_rgba(123,94,167,0.2)] bg-[#1B1E36]'
                    : 'border-[rgba(255,255,255,0.06)] bg-[#13152A] hover:border-[rgba(255,255,255,0.12)]'
                }
              `}
            >
              <div
                className={`
                  w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors
                  ${isSelected ? 'bg-[#7B5EA7]/20' : 'bg-[#1B1E36]'}
                `}
              >
                <Icon
                  className={`w-7 h-7 ${isSelected ? 'text-[#9B59F5]' : 'text-[#4A5568]'}`}
                />
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">{option.title}</h3>
              <p className="text-[#8892B0] text-sm">{option.description}</p>

              {/* Selection dot */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[#9B59F5]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        className="w-full bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] text-white font-semibold rounded-xl py-3 hover:opacity-90 transition-opacity"
      >
        Continue
      </button>
    </motion.div>
  );
}
