'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1B1E36',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
        },
        success: {
          iconTheme: {
            primary: '#00D4AA',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#FF5B5B',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}
