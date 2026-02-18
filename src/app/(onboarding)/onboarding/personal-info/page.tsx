'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import StepIndicator from '@/components/onboarding/StepIndicator';
import { useOnboardingStore } from '@/store/useOnboardingStore';

const nationalities = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  'Japan', 'South Korea', 'Singapore', 'India', 'Brazil', 'Mexico',
  'Netherlands', 'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Ireland',
  'New Zealand', 'Portugal', 'Spain', 'Italy', 'Belgium', 'Austria',
  'Finland', 'Hong Kong', 'Taiwan', 'Israel', 'United Arab Emirates', 'Other',
];

export default function PersonalInfoPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { personInfo, setPersonInfo, setStep } = useOnboardingStore();

  const [form, setForm] = useState({
    first_name: personInfo.first_name || '',
    middle_name: personInfo.middle_name || '',
    last_name: personInfo.last_name || '',
    date_of_birth: personInfo.date_of_birth || '',
    email: personInfo.email || session?.user?.email || '',
    phone: personInfo.phone || '',
    nationality: personInfo.nationality || 'United States',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const isValid = (field: string): boolean | null => {
    if (!touched[field]) return null;
    const value = form[field as keyof typeof form];
    if (field === 'middle_name' || field === 'phone') return value ? true : null;
    return value.trim().length > 0;
  };

  const borderClass = (field: string) => {
    const valid = isValid(field);
    if (valid === null) return 'border-[rgba(255,255,255,0.06)]';
    return valid ? 'border-[#00D4AA]' : 'border-red-500';
  };

  const canContinue =
    form.first_name.trim() &&
    form.last_name.trim() &&
    form.date_of_birth &&
    form.email.trim();

  const handleContinue = () => {
    setPersonInfo(form);
    setStep(3);
    router.push('/onboarding/address');
  };

  const handleBack = () => {
    router.push('/onboarding/identity');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <StepIndicator currentStep={2} />

      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
        Tell us about yourself
      </h2>
      <p className="text-[#8892B0] mb-8">
        We need this information to verify your identity.
      </p>

      <div className="space-y-5">
        {/* Name row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
              First Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              onBlur={() => handleBlur('first_name')}
              placeholder="John"
              className={`w-full bg-[#1B1E36] border ${borderClass('first_name')} rounded-xl px-4 py-3 text-white placeholder-[#4A5568] focus:outline-none focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] transition-colors`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
              Middle Name
            </label>
            <input
              type="text"
              value={form.middle_name}
              onChange={(e) => handleChange('middle_name', e.target.value)}
              onBlur={() => handleBlur('middle_name')}
              placeholder="Optional"
              className={`w-full bg-[#1B1E36] border ${borderClass('middle_name')} rounded-xl px-4 py-3 text-white placeholder-[#4A5568] focus:outline-none focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] transition-colors`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
              Last Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              onBlur={() => handleBlur('last_name')}
              placeholder="Doe"
              className={`w-full bg-[#1B1E36] border ${borderClass('last_name')} rounded-xl px-4 py-3 text-white placeholder-[#4A5568] focus:outline-none focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] transition-colors`}
            />
          </div>
        </div>

        {/* Date of birth */}
        <div>
          <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
            Date of Birth <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={form.date_of_birth}
            onChange={(e) => handleChange('date_of_birth', e.target.value)}
            onBlur={() => handleBlur('date_of_birth')}
            className={`w-full bg-[#1B1E36] border ${borderClass('date_of_birth')} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] transition-colors [color-scheme:dark]`}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="you@example.com"
            className={`w-full bg-[#1B1E36] border ${borderClass('email')} rounded-xl px-4 py-3 text-white placeholder-[#4A5568] focus:outline-none focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] transition-colors`}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
            Phone
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            onBlur={() => handleBlur('phone')}
            placeholder="+1 (555) 123-4567"
            className={`w-full bg-[#1B1E36] border ${borderClass('phone')} rounded-xl px-4 py-3 text-white placeholder-[#4A5568] focus:outline-none focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] transition-colors`}
          />
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
            Nationality
          </label>
          <select
            value={form.nationality}
            onChange={(e) => handleChange('nationality', e.target.value)}
            className="w-full bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] transition-colors appearance-none"
          >
            {nationalities.map((n) => (
              <option key={n} value={n} className="bg-[#1B1E36]">
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={handleBack}
          className="flex-1 border border-[rgba(255,255,255,0.06)] text-[#8892B0] font-semibold rounded-xl py-3 hover:bg-[#1B1E36] transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="flex-1 bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] text-white font-semibold rounded-xl py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
