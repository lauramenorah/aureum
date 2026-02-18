'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Shield } from 'lucide-react';
import StepIndicator from '@/components/onboarding/StepIndicator';
import { useOnboardingStore, TaxIdType } from '@/store/useOnboardingStore';

const taxIdTypes: { value: TaxIdType; label: string; description: string }[] = [
  { value: 'SSN', label: 'SSN', description: 'Social Security Number' },
  { value: 'ITIN', label: 'ITIN', description: 'Individual Taxpayer ID' },
  { value: 'EIN', label: 'EIN', description: 'Employer Identification Number' },
  { value: 'FOREIGN_TIN', label: 'Foreign TIN', description: 'Foreign Tax ID' },
  { value: 'NONE', label: 'None', description: 'I don\'t have a Tax ID' },
];

const taxCountries = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'OTHER', name: 'Other' },
];

export default function TaxDetailsPage() {
  const router = useRouter();
  const { taxInfo, setTaxInfo, setStep } = useOnboardingStore();

  const [taxIdType, setTaxIdType] = useState<TaxIdType>(taxInfo.tax_id_type || 'SSN');
  const [taxId, setTaxId] = useState(taxInfo.tax_id || '');
  const [taxCountry, setTaxCountry] = useState(taxInfo.tax_country || 'US');
  const [showTaxId, setShowTaxId] = useState(false);

  const canContinue = taxIdType === 'NONE' || (taxId.trim().length > 0 && taxCountry);

  const handleContinue = () => {
    setTaxInfo({
      tax_id_type: taxIdType,
      tax_id: taxId,
      tax_country: taxCountry,
    });
    setStep(5);
    router.push('/onboarding/documents');
  };

  const handleBack = () => {
    router.push('/onboarding/address');
  };

  const inputClass =
    'w-full bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white placeholder-[#4A5568] focus:outline-none focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] transition-colors';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <StepIndicator currentStep={4} />

      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
        Tax information
      </h2>
      <p className="text-[#8892B0] mb-8">
        Required for regulatory compliance.
      </p>

      <div className="space-y-6">
        {/* Tax ID Type */}
        <div>
          <label className="block text-sm font-medium text-[#8892B0] mb-3">
            Tax ID Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {taxIdTypes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTaxIdType(t.value)}
                className={`
                  p-3 rounded-xl border-2 text-left transition-all duration-200
                  ${
                    taxIdType === t.value
                      ? 'border-[#7B5EA7] bg-[#1B1E36] shadow-[0_0_20px_rgba(123,94,167,0.15)]'
                      : 'border-[rgba(255,255,255,0.06)] bg-[#13152A] hover:border-[rgba(255,255,255,0.12)]'
                  }
                `}
              >
                <span className="text-white font-medium text-sm block">{t.label}</span>
                <span className="text-[#8892B0] text-xs">{t.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tax ID Input */}
        {taxIdType !== 'NONE' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
              Tax ID Number <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showTaxId ? 'text' : 'password'}
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder={
                  taxIdType === 'SSN'
                    ? 'XXX-XX-XXXX'
                    : taxIdType === 'EIN'
                    ? 'XX-XXXXXXX'
                    : 'Enter your Tax ID'
                }
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowTaxId(!showTaxId)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5568] hover:text-[#8892B0] transition-colors"
              >
                {showTaxId ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Tax Country */}
        <div>
          <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
            Tax Country <span className="text-red-400">*</span>
          </label>
          <select
            value={taxCountry}
            onChange={(e) => setTaxCountry(e.target.value)}
            className={`${inputClass} appearance-none`}
          >
            {taxCountries.map((c) => (
              <option key={c.code} value={c.code} className="bg-[#1B1E36]">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Privacy Note */}
        <div className="flex items-start gap-3 bg-[#13152A] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <Shield className="w-5 h-5 text-[#00D4AA] mt-0.5 flex-shrink-0" />
          <p className="text-[#8892B0] text-sm leading-relaxed">
            Your tax information is encrypted and never shared with third parties.
            We collect this only for regulatory compliance.
          </p>
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
