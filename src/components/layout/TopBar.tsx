'use client';

import { useState } from 'react';
import { Bell, Menu, ChevronDown } from 'lucide-react';

interface TopBarProps {
  title: string;
  onToggleSidebar?: () => void;
}

export default function TopBar({ title, onToggleSidebar }: TopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#0D0E1A]/80 px-6 backdrop-blur-md">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-white md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-white"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {/* Notification dot */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-purple" />
        </button>

        {/* Profile selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-white"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-purple/20 text-xs font-medium text-accent-purple">
              P
            </div>
            <span className="hidden sm:inline">Primary</span>
            <ChevronDown size={14} />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-[rgba(255,255,255,0.06)] bg-bg-secondary p-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition-colors hover:bg-bg-tertiary"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-purple/20 text-xs font-medium text-accent-purple">
                    P
                  </div>
                  Primary
                </button>
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-white"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-violet/20 text-xs font-medium text-accent-violet">
                    S
                  </div>
                  Savings
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
