'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  ArrowLeftRight,
  Clock,
  MoreHorizontal,
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  Coins,
  BarChart3,
  Users,
  UserCircle,
  Settings,
  X,
} from 'lucide-react';

const primaryTabs = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: TrendingUp, label: 'Trade', href: '/trade' },
  { icon: ArrowLeftRight, label: 'Convert', href: '/convert' },
  { icon: Clock, label: 'History', href: '/history' },
];

const moreLinks = [
  { icon: ArrowDownToLine, label: 'Deposit', href: '/deposit' },
  { icon: ArrowUpFromLine, label: 'Withdraw', href: '/withdraw' },
  { icon: Send, label: 'Transfer', href: '/transfer' },
  { icon: Coins, label: 'Earn', href: '/earn' },
  { icon: BarChart3, label: 'Market', href: '/market' },
  { icon: Users, label: 'Accounts', href: '/accounts' },
  { icon: UserCircle, label: 'Profiles', href: '/profiles' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isMoreActive = moreLinks.some(
    (link) => pathname === link.href || pathname.startsWith(link.href + '/')
  );

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgba(255,255,255,0.06)] bg-[#0D0E1A] pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex items-center justify-around">
          {primaryTabs.map(({ icon: Icon, label, href }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + '/');

            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors ${
                  isActive ? 'text-accent-purple' : 'text-text-muted'
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors ${
              isMoreActive || drawerOpen
                ? 'text-accent-purple'
                : 'text-text-muted'
            }`}
          >
            <MoreHorizontal size={20} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Slide-up drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Slide-up drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transform rounded-t-2xl border-t border-[rgba(255,255,255,0.06)] bg-bg-secondary pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-out md:hidden ${
          drawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drawer handle and header */}
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold text-white">More</span>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-lg p-1 text-text-secondary transition-colors hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer drag handle */}
        <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-[rgba(255,255,255,0.1)]" />

        {/* Links grid */}
        <div className="grid grid-cols-4 gap-2 px-4 pb-6">
          {moreLinks.map(({ icon: Icon, label, href }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + '/');

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={`flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-xs transition-colors ${
                  isActive
                    ? 'bg-bg-tertiary text-accent-purple'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-white'
                }`}
              >
                <Icon size={22} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
