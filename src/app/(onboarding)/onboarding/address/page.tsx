'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import StepIndicator from '@/components/onboarding/StepIndicator';
import { useOnboardingStore } from '@/store/useOnboardingStore';

const countries = [
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'KR', 'SG', 'IN',
  'BR', 'MX', 'NL', 'CH', 'SE', 'NO', 'DK', 'IE', 'NZ', 'PT',
  'ES', 'IT', 'BE', 'AT', 'FI', 'HK', 'TW', 'IL', 'AE',
];

const countryLabels: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia',
  DE: 'Germany', FR: 'France', JP: 'Japan', KR: 'South Korea', SG: 'Singapore',
  IN: 'India', BR: 'Brazil', MX: 'Mexico', NL: 'Netherlands', CH: 'Switzerland',
  SE: 'Sweden', NO: 'Norway', DK: 'Denmark', IE: 'Ireland', NZ: 'New Zealand',
  PT: 'Portugal', ES: 'Spain', IT: 'Italy', BE: 'Belgium', AT: 'Austria',
  FI: 'Finland', HK: 'Hong Kong', TW: 'Taiwan', IL: 'Israel', AE: 'United Arab Emirates',
};

export default function AddressPage() {
  const router = useRouter();
  const { address, setAddress, setStep } = useOnboardingStore();

  const [form, setForm] = useState({
    street1: address.street1 || '',
    street2: address.street2 || '',
    city: address.city || '',
    state: address.state || '',
    postal_code: address.postal_code || '',
    country: address.country || 'US',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canContinue =
    form.street1.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.postal_code.trim() &&
    form.country;

  const handleContinue = () => {
    setAddress(form);
    setStep(4);
    router.push('/onboarding/tax-details');
  };

  const handleBack = () => {
    router.push('/onboarding/personal-info');
  };

  const inputClass =
    'w-full bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white placeholder-[#4A5568] focus:outline-none focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] transition-colors';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <StepIndicator currentStep={3} />

      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
        Where do you live?
      </h2>
      <p className="text-[#8892B0] mb-8">
        Your residential address is required for identity verification.
      </p>

      <div className="space-y-5">
        {/* Street 1 */}
        <div>
          <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
            Street Address <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.street1}
            onChange={(e) => handleChange('street1', e.target.value)}
            placeholder="123 Main Street"
            className={inputClass}
          />
        </div>

        {/* Street 2 */}
        <div>
          <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
            Street Address Line 2
          </label>
          <input
            type="text"
            value={form.street2}
            onChange={(e) => handleChange('street2', e.target.value)}
            placeholder="Apt, Suite, Unit (optional)"
            className={inputClass}
          />
        </div>

        {/* City + State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
              City <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="New York"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
              State / Province <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="NY"
              className={inputClass}
            />
          </div>
        </div>

        {/* Postal + Country */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
              Postal Code <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.postal_code}
              onChange={(e) => handleChange('postal_code', e.target.value)}
              placeholder="10001"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
              Country <span className="text-red-400">*</span>
            </label>
            <select
              value={form.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className={`${inputClass} appearance-none`}
            >
              {countries.map((c) => (
                <option key={c} value={c} className="bg-[#1B1E36]">
                  {countryLabels[c] || c}
                </option>
              ))}
            </select>
          </div>
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
