'use client';

import { TestTube } from 'lucide-react';

export default function SandboxBanner() {
  return (
    <div className="border-b border-accent-gold/20 bg-accent-gold/10 py-1 text-center">
      <div className="flex items-center justify-center gap-2">
        <TestTube size={14} className="text-accent-gold" />
        <span className="text-xs font-medium text-accent-gold">
          SANDBOX MODE
        </span>
      </div>
    </div>
  );
}
