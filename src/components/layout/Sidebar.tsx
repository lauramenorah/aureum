'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  ArrowLeftRight,
  Send,
  Clock,
  Coins,
  BarChart3,
  Users,
  UserCircle,
  Settings,
} from 'lucide-react';

const navLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ArrowDownToLine, label: 'Deposit', href: '/deposit' },
  { icon: ArrowUpFromLine, label: 'Withdraw', href: '/withdraw' },
  { icon: TrendingUp, label: 'Trade', href: '/trade' },
  { icon: ArrowLeftRight, label: 'Convert', href: '/convert' },
  { icon: Send, label: 'Transfer', href: '/transfer' },
  { icon: Clock, label: 'History', href: '/history' },
  { icon: Coins, label: 'Earn', href: '/earn' },
  { icon: BarChart3, label: 'Market', href: '/market' },
  { icon: Users, label: 'Accounts', href: '/accounts' },
  { icon: UserCircle, label: 'Profiles', href: '/profiles' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

const isSandbox = process.env.NEXT_PUBLIC_IS_SANDBOX === 'true';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#0D0E1A] md:flex">
      {/* Brand */}
      <div className="flex h-16 items-center px-6">
        <span className="bg-gradient-to-r from-accent-purple to-accent-violet bg-clip-text text-xl font-bold text-transparent">
          NeoBank
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navLinks.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                isActive
                  ? 'border-l-2 border-accent-purple bg-bg-tertiary text-white'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[rgba(255,255,255,0.06)] px-4 py-4">
        {isSandbox && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-accent-gold/10 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-gold" />
            <span className="text-xs font-medium text-accent-gold">
              Sandbox Mode
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
