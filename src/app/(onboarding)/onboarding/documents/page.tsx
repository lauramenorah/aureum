'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, X, FileText, CreditCard, BookOpen, Home } from 'lucide-react';
import StepIndicator from '@/components/onboarding/StepIndicator';
import { useOnboardingStore } from '@/store/useOnboardingStore';

const documentTypes = [
  { value: 'PASSPORT', label: 'Passport', icon: BookOpen },
  { value: 'DRIVERS_LICENSE', label: "Driver's License", icon: CreditCard },
  { value: 'NATIONAL_ID', label: 'National ID', icon: CreditCard },
  { value: 'RESIDENCE_PERMIT', label: 'Residence Permit', icon: Home },
];

const needsBack = ['DRIVERS_LICENSE', 'NATIONAL_ID'];

interface FilePreview {
  file: File;
  preview: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { documents, setDocuments, setStep } = useOnboardingStore();

  const [docType, setDocType] = useState(documents.document_type || 'PASSPORT');
  const [frontFile, setFrontFile] = useState<FilePreview | null>(null);
  const [backFile, setBackFile] = useState<FilePreview | null>(null);
  const [selfieFile, setSelfieFile] = useState<FilePreview | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File, target: 'front' | 'back' | 'selfie') => {
      const preview = URL.createObjectURL(file);
      const fp: FilePreview = { file, preview };
      if (target === 'front') setFrontFile(fp);
      else if (target === 'back') setBackFile(fp);
      else setSelfieFile(fp);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, target: 'front' | 'back' | 'selfie') => {
      e.preventDefault();
      setDragOver(null);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file, target);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, target: 'front' | 'back' | 'selfie') => {
      const file = e.target.files?.[0];
      if (file) handleFile(file, target);
    },
    [handleFile]
  );

  const removeFile = (target: 'front' | 'back' | 'selfie') => {
    if (target === 'front') {
      if (frontFile) URL.revokeObjectURL(frontFile.preview);
      setFrontFile(null);
    } else if (target === 'back') {
      if (backFile) URL.revokeObjectURL(backFile.preview);
      setBackFile(null);
    } else {
      if (selfieFile) URL.revokeObjectURL(selfieFile.preview);
      setSelfieFile(null);
    }
  };

  const canContinue = !!frontFile;

  const handleContinue = () => {
    setDocuments({
      document_type: docType,
      front_file: frontFile?.file,
      back_file: backFile?.file,
      selfie_file: selfieFile?.file,
    });
    setStep(6);
    router.push('/onboarding/review');
  };

  const handleBack = () => {
    router.push('/onboarding/tax-details');
  };

  const handleSkip = () => {
    setDocuments({ document_type: docType });
    setStep(6);
    router.push('/onboarding/review');
  };

  const UploadZone = ({
    label,
    target,
    file,
    required = false,
    subtitle,
  }: {
    label: string;
    target: 'front' | 'back' | 'selfie';
    file: FilePreview | null;
    required?: boolean;
    subtitle?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-[#8892B0] mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
        {subtitle && <span className="text-[#4A5568] ml-1">({subtitle})</span>}
      </label>

      {file ? (
        <div className="relative bg-[#1B1E36] border border-[#00D4AA] rounded-xl p-4 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.preview}
            alt={label}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{file.file.name}</p>
            <p className="text-[#8892B0] text-xs">
              {(file.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={() => removeFile(target)}
            className="text-[#4A5568] hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(target);
          }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => handleDrop(e, target)}
          className={`
            flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
            ${
              dragOver === target
                ? 'border-[#7B5EA7] bg-[#7B5EA7]/10'
                : 'border-[rgba(255,255,255,0.06)] bg-[#13152A] hover:border-[rgba(255,255,255,0.12)]'
            }
          `}
        >
          <Upload className="w-8 h-8 text-[#4A5568]" />
          <div className="text-center">
            <p className="text-white text-sm font-medium">
              Drop your file here or <span className="text-[#9B59F5]">browse</span>
            </p>
            <p className="text-[#4A5568] text-xs mt-1">PNG, JPG, or PDF up to 10MB</p>
          </div>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleInputChange(e, target)}
            className="hidden"
          />
        </label>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <StepIndicator currentStep={5} />

      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
        Verify your identity
      </h2>
      <p className="text-[#8892B0] mb-8">
        Upload a government-issued ID to verify your identity.
      </p>

      <div className="space-y-6">
        {/* Document Type Selector */}
        <div>
          <label className="block text-sm font-medium text-[#8892B0] mb-3">
            Document Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {documentTypes.map((dt) => {
              const Icon = dt.icon;
              const isSelected = docType === dt.value;
              return (
                <button
                  key={dt.value}
                  onClick={() => {
                    setDocType(dt.value);
                    if (!needsBack.includes(dt.value)) {
                      setBackFile(null);
                    }
                  }}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                    ${
                      isSelected
                        ? 'border-[#7B5EA7] bg-[#1B1E36] shadow-[0_0_20px_rgba(123,94,167,0.15)]'
                        : 'border-[rgba(255,255,255,0.06)] bg-[#13152A] hover:border-[rgba(255,255,255,0.12)]'
                    }
                  `}
                >
                  <Icon
                    className={`w-6 h-6 ${isSelected ? 'text-[#9B59F5]' : 'text-[#4A5568]'}`}
                  />
                  <span
                    className={`text-xs font-medium text-center ${
                      isSelected ? 'text-white' : 'text-[#8892B0]'
                    }`}
                  >
                    {dt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Zones */}
        <UploadZone label="Front of Document" target="front" file={frontFile} required />

        {needsBack.includes(docType) && (
          <UploadZone label="Back of Document" target="back" file={backFile} required />
        )}

        <UploadZone
          label="Selfie"
          target="selfie"
          file={selfieFile}
          subtitle="Recommended"
        />

        {/* File type hint */}
        <div className="flex items-center gap-2 text-[#4A5568] text-xs">
          <FileText className="w-4 h-4" />
          <span>Accepted formats: PNG, JPG, PDF. Max size: 10MB per file.</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 mt-8">
        <div className="flex gap-4">
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
        <button
          onClick={handleSkip}
          className="text-[#8892B0] hover:text-[#9B59F5] text-sm transition-colors text-center"
        >
          Skip for now
        </button>
      </div>
    </motion.div>
  );
}
