'use client';

import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

export default function StepIndicator({ currentStep, totalSteps = 6 }: StepIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="mb-8">
      {/* Desktop indicator */}
      <div className="hidden md:flex items-center justify-center">
        {steps.map((step, idx) => {
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isFuture = step > currentStep;

          return (
            <div key={step} className="flex items-center">
              {/* Step circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                  ${isCompleted ? 'bg-[#00D4AA] text-white' : ''}
                  ${isCurrent ? 'bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] text-white animate-pulse' : ''}
                  ${isFuture ? 'bg-[#1B1E36] border border-[rgba(255,255,255,0.06)] text-[#4A5568]' : ''}
                `}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step}
              </div>

              {/* Connecting line */}
              {idx < steps.length - 1 && (
                <div
                  className={`
                    w-12 lg:w-16 h-0.5 transition-colors duration-300
                    ${step < currentStep ? 'bg-[#00D4AA]' : 'bg-[#1B1E36]'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile indicator */}
      <div className="md:hidden">
        <p className="text-[#8892B0] text-sm text-center mb-3">
          Step {currentStep} of {totalSteps}
        </p>
        <div className="h-1 bg-[#1B1E36] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7B5EA7] to-[#9B59F5] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
