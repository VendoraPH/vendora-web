"use client"

import { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import type { NetworkQuality } from '@/lib/network-quality-monitor';

interface OfflineBannerProps {
  isOnline: boolean;
  networkQuality: NetworkQuality;
  pendingCount: number;
}

export function OfflineBanner({ isOnline, networkQuality, pendingCount }: OfflineBannerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Don't render during SSR to avoid hydration mismatch
  // (network quality is only known after client-side check)
  if (!mounted) return null;
  if (isOnline) return null;

  const isOffline = !isOnline || networkQuality === 'offline';

  return (
    <div
      className={`
        flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium
        ${isOffline
          ? 'bg-red-600/90 text-white'
          : 'bg-yellow-500/90 text-yellow-950'
        }
      `}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>
            You're offline. Changes will sync when connection returns.
            {pendingCount > 0 && ` (${pendingCount} pending)`}
          </span>
        </>
      ) : (
        <>
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Weak connection detected. Some features may be slow.</span>
        </>
      )}
    </div>
  );
}
