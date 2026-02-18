'use client';

import TopBar from './TopBar';

interface PageWrapperProps {
  title: string;
  children: React.ReactNode;
  onToggleSidebar?: () => void;
}

export default function PageWrapper({
  title,
  children,
  onToggleSidebar,
}: PageWrapperProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title={title} onToggleSidebar={onToggleSidebar} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
        {children}
      </main>
    </div>
  );
}
