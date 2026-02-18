'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import SandboxBanner from './SandboxBanner';
import { useStore } from '@/store/useStore';

interface AppShellProps {
  children: React.ReactNode;
}

const isSandbox = process.env.NEXT_PUBLIC_IS_SANDBOX === 'true';

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const activeProfile = useStore((s) => s.activeProfile);
  const setActiveProfile = useStore((s) => s.setActiveProfile);

  // Initialize active profile from session if not already set
  useEffect(() => {
    const profileId = (session?.user as any)?.profile_id;
    if (profileId && !activeProfile) {
      setActiveProfile({
        id: profileId,
        account_id: (session?.user as any)?.account_id || '',
        nickname: 'Default',
        type: 'DEFAULT',
      });
    }
  }, [session, activeProfile, setActiveProfile]);

  return (
    <div className="min-h-screen bg-[#0D0E1A]">
      {/* Sandbox banner */}
      {isSandbox && <SandboxBanner />}

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 z-40 h-screen w-60 md:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main content area */}
      <div className="min-h-screen pb-20 md:ml-60 md:pb-0">{children}</div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
