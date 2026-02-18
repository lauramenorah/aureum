'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Pencil, FileText, Loader2, AlertCircle } from 'lucide-react';
import StepIndicator from '@/components/onboarding/StepIndicator';
import { useOnboardingStore } from '@/store/useOnboardingStore';

function maskTaxId(id: string): string {
  if (!id || id.length < 4) return '****';
  return '***-**-' + id.slice(-4);
}

// Generate a random valid-format SSN for sandbox when user doesn't provide one
function randomSSN(): string {
  const area = Math.floor(Math.random() * 899) + 1; // 001-899
  const group = Math.floor(Math.random() * 99) + 1; // 01-99
  const serial = Math.floor(Math.random() * 9999) + 1; // 0001-9999
  return `${String(area).padStart(3, '0')}-${String(group).padStart(2, '0')}-${String(serial).padStart(4, '0')}`;
}

// Convert country codes or names to ISO 3166-1 alpha-3 (Paxos requires alpha-3)
function toAlpha3(input: string): string {
  if (!input) return input;
  if (input.length === 3 && input === input.toUpperCase()) return input; // Already alpha-3

  // Alpha-2 → alpha-3
  const codeMap: Record<string, string> = {
    US: 'USA', GB: 'GBR', CA: 'CAN', AU: 'AUS', DE: 'DEU',
    FR: 'FRA', JP: 'JPN', IN: 'IND', BR: 'BRA', MX: 'MEX',
    CN: 'CHN', KR: 'KOR', IT: 'ITA', ES: 'ESP', NL: 'NLD',
    CH: 'CHE', SE: 'SWE', NO: 'NOR', DK: 'DNK', FI: 'FIN',
    IE: 'IRL', NZ: 'NZL', SG: 'SGP', HK: 'HKG', IL: 'ISR',
    AT: 'AUT', BE: 'BEL', PT: 'PRT', PL: 'POL', CZ: 'CZE',
    RO: 'ROU', HU: 'HUN', GR: 'GRC', TW: 'TWN', TH: 'THA',
    PH: 'PHL', MY: 'MYS', ID: 'IDN', VN: 'VNM', ZA: 'ZAF',
    AE: 'ARE', SA: 'SAU', AR: 'ARG', CL: 'CHL', CO: 'COL',
    PE: 'PER', NG: 'NGA', KE: 'KEN', EG: 'EGY', PK: 'PAK',
  };
  if (input.length === 2) return codeMap[input.toUpperCase()] || input;

  // Full country name → alpha-3
  const nameMap: Record<string, string> = {
    'united states': 'USA', 'united kingdom': 'GBR', 'canada': 'CAN',
    'australia': 'AUS', 'germany': 'DEU', 'france': 'FRA',
    'japan': 'JPN', 'south korea': 'KOR', 'singapore': 'SGP',
    'india': 'IND', 'brazil': 'BRA', 'mexico': 'MEX',
    'netherlands': 'NLD', 'switzerland': 'CHE', 'sweden': 'SWE',
    'norway': 'NOR', 'denmark': 'DNK', 'ireland': 'IRL',
    'new zealand': 'NZL', 'portugal': 'PRT', 'spain': 'ESP',
    'italy': 'ITA', 'belgium': 'BEL', 'austria': 'AUT',
    'finland': 'FIN', 'hong kong': 'HKG', 'taiwan': 'TWN',
    'israel': 'ISR', 'united arab emirates': 'ARE',
    'china': 'CHN', 'south africa': 'ZAF', 'saudi arabia': 'SAU',
    'argentina': 'ARG', 'chile': 'CHL', 'colombia': 'COL',
    'peru': 'PER', 'nigeria': 'NGA', 'kenya': 'KEN',
    'egypt': 'EGY', 'pakistan': 'PAK',
  };
  return nameMap[input.toLowerCase()] || input;
}

export default function ReviewPage() {
  const router = useRouter();
  const store = useOnboardingStore();
  const {
    personInfo,
    address,
    taxInfo,
    documents,
    termsAccepted,
    setTermsAccepted,
    setIdentityId,
    setAccountId,
    setProfileId,
  } = store;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!termsAccepted) return;
    setError('');
    setLoading(true);

    try {
      // Create identity — Paxos requires address inside person_details,
      // alpha-3 country codes, verifier_type, cip_id fields, and a ref_id
      const countryAlpha3 = toAlpha3(address.country);
      const nationalityAlpha3 = toAlpha3(personInfo.nationality || address.country);
      const cipIdType = taxInfo.tax_id_type === 'NONE' || taxInfo.tax_id_type === 'FOREIGN_TIN'
        ? 'SSN' : taxInfo.tax_id_type;

      const identityBody: Record<string, unknown> = {
        person_details: {
          verifier_type: 'PAXOS',
          first_name: personInfo.first_name,
          ...(personInfo.middle_name && { middle_name: personInfo.middle_name }),
          last_name: personInfo.last_name,
          date_of_birth: personInfo.date_of_birth,
          email: personInfo.email,
          ...(personInfo.phone && { phone_number: personInfo.phone }),
          nationality: nationalityAlpha3,
          cip_id: taxInfo.tax_id || randomSSN(),
          cip_id_type: cipIdType,
          cip_id_country: toAlpha3(taxInfo.tax_country || address.country),
          address: {
            country: countryAlpha3,
            address1: address.street1,
            ...(address.street2 && { address2: address.street2 }),
            city: address.city,
            province: address.state,
            zip_code: address.postal_code,
          },
        },
        ref_id: crypto.randomUUID(),
      };

      const cipCountry = toAlpha3(taxInfo.tax_country || address.country);
      const cipId = (identityBody.person_details as Record<string, unknown>).cip_id as string;

      // US-based identities MUST include tax_details (Paxos rejects tax_details_not_required for USA)
      if (taxInfo.tax_id) {
        identityBody.tax_details = [{
          tax_payer_country: cipCountry,
          tax_payer_id: taxInfo.tax_id,
        }];
      } else if (cipCountry === 'USA') {
        identityBody.tax_details = [{
          tax_payer_country: 'USA',
          tax_payer_id: cipId,
        }];
      } else {
        identityBody.tax_details_not_required = true;
      }

      const identityRes = await fetch('/api/paxos/identities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(identityBody),
      });

      let identityId: string;
      if (identityRes.ok) {
        const identityData = await identityRes.json();
        identityId = identityData.id;
      } else if (identityRes.status === 409) {
        // Identity already exists — use the existing one
        const errData = await identityRes.json().catch(() => ({}));
        identityId = errData.details?.meta?.existing?.id || errData.meta?.existing?.id;
        if (!identityId) throw new Error('Identity already exists but could not retrieve ID');
      } else {
        const errData = await identityRes.json().catch(() => ({}));
        throw new Error(errData.error || errData.detail || 'Failed to create identity');
      }
      setIdentityId(identityId);

      // Auto-approve identity via sandbox API
      await fetch('/api/paxos/sandbox-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity_id: identityId }),
      });

      // Create account — Paxos requires body wrapped in "account" object
      const accountRes = await fetch('/api/paxos/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: { identity_id: identityId },
          create_profile: true,
        }),
      });

      let accountId: string | undefined;
      let profileId: string | undefined;

      if (accountRes.ok) {
        const accountData = await accountRes.json();
        accountId = accountData.id;
        profileId = accountData.profile_id;
        setAccountId(accountData.id);
        if (accountData.profile_id) {
          setProfileId(accountData.profile_id);
        }
      } else if (accountRes.status === 409) {
        // Account already exists for this identity — proceed to next step
      } else {
        const errData = await accountRes.json().catch(() => ({}));
        throw new Error(errData.error || errData.detail || 'Failed to create account');
      }

      // Update server-side onboarding status so middleware allows dashboard access
      await fetch('/api/auth/update-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity_id: identityId,
          account_id: accountId,
          profile_id: profileId,
        }),
      });

      // Hard navigation to ensure the browser sends the updated session cookie
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/onboarding/documents');
  };

  const SectionCard = ({
    title,
    editPath,
    children,
  }: {
    title: string;
    editPath: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-[#13152A] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">{title}</h3>
        <button
          onClick={() => router.push(editPath)}
          className="flex items-center gap-1.5 text-[#9B59F5] hover:text-[#B07AF5] text-sm font-medium transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Edit
        </button>
      </div>
      {children}
    </div>
  );

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-1.5">
      <span className="text-[#8892B0] text-sm">{label}</span>
      <span className="text-white text-sm font-medium text-right">{value || '-'}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <StepIndicator currentStep={6} />

      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
        Review your information
      </h2>
      <p className="text-[#8892B0] mb-8">
        Please verify everything is correct before submitting.
      </p>

      <div className="space-y-4">
        {/* Personal Info */}
        <SectionCard title="Personal Information" editPath="/onboarding/personal-info">
          <InfoRow
            label="Name"
            value={[personInfo.first_name, personInfo.middle_name, personInfo.last_name]
              .filter(Boolean)
              .join(' ')}
          />
          <InfoRow label="Date of Birth" value={personInfo.date_of_birth} />
          <InfoRow label="Email" value={personInfo.email} />
          <InfoRow label="Phone" value={personInfo.phone} />
          <InfoRow label="Nationality" value={personInfo.nationality} />
        </SectionCard>

        {/* Address */}
        <SectionCard title="Address" editPath="/onboarding/address">
          <InfoRow label="Street" value={[address.street1, address.street2].filter(Boolean).join(', ')} />
          <InfoRow label="City" value={address.city} />
          <InfoRow label="State / Province" value={address.state} />
          <InfoRow label="Postal Code" value={address.postal_code} />
          <InfoRow label="Country" value={address.country} />
        </SectionCard>

        {/* Tax Details */}
        <SectionCard title="Tax Details" editPath="/onboarding/tax-details">
          <InfoRow label="Tax ID Type" value={taxInfo.tax_id_type} />
          {taxInfo.tax_id_type !== 'NONE' && (
            <>
              <InfoRow label="Tax ID" value={maskTaxId(taxInfo.tax_id)} />
              <InfoRow label="Tax Country" value={taxInfo.tax_country} />
            </>
          )}
        </SectionCard>

        {/* Documents */}
        <SectionCard title="Documents" editPath="/onboarding/documents">
          <InfoRow label="Document Type" value={documents.document_type} />
          <div className="flex flex-wrap gap-2 mt-2">
            {documents.front_file && (
              <span className="inline-flex items-center gap-1.5 bg-[#1B1E36] px-3 py-1.5 rounded-lg text-xs text-[#8892B0]">
                <FileText className="w-3.5 h-3.5" />
                Front uploaded
              </span>
            )}
            {documents.back_file && (
              <span className="inline-flex items-center gap-1.5 bg-[#1B1E36] px-3 py-1.5 rounded-lg text-xs text-[#8892B0]">
                <FileText className="w-3.5 h-3.5" />
                Back uploaded
              </span>
            )}
            {documents.selfie_file && (
              <span className="inline-flex items-center gap-1.5 bg-[#1B1E36] px-3 py-1.5 rounded-lg text-xs text-[#8892B0]">
                <FileText className="w-3.5 h-3.5" />
                Selfie uploaded
              </span>
            )}
            {!documents.front_file && !documents.back_file && !documents.selfie_file && (
              <span className="text-[#4A5568] text-xs">No documents uploaded</span>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Terms */}
      <div className="mt-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-[rgba(255,255,255,0.06)] bg-[#1B1E36] accent-[#9B59F5]"
          />
          <span className="text-[#8892B0] text-sm leading-relaxed">
            I agree to the{' '}
            <span className="text-[#9B59F5] hover:underline cursor-pointer">Terms of Service</span>{' '}
            and{' '}
            <span className="text-[#9B59F5] hover:underline cursor-pointer">Privacy Policy</span>
          </span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={handleBack}
          disabled={loading}
          className="flex-1 border border-[rgba(255,255,255,0.06)] text-[#8892B0] font-semibold rounded-xl py-3 hover:bg-[#1B1E36] transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!termsAccepted || loading}
          className="flex-1 bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] text-white font-semibold rounded-xl py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting your application...
            </>
          ) : (
            'Submit Application'
          )}
        </button>
      </div>
    </motion.div>
  );
}
