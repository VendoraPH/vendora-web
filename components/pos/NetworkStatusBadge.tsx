"use client"

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { NetworkQuality } from '@/lib/network-quality-monitor';

interface NetworkStatusBadgeProps {
  isOnline: boolean;
  networkQuality: NetworkQuality;
  pendingCount: number;
  isSyncing: boolean;
  onSync?: () => void;
}

const qualityConfig: Record<NetworkQuality, { color: string; bg: string; label: string }> = {
  excellent: { color: 'text-green-400', bg: 'bg-green-400', label: 'Online' },
  good: { color: 'text-green-400', bg: 'bg-green-400', label: 'Online' },
  poor: { color: 'text-yellow-400', bg: 'bg-yellow-400', label: 'Weak' },
  offline: { color: 'text-red-400', bg: 'bg-red-400', label: 'Offline' },
};

export function NetworkStatusBadge({
  isOnline,
  networkQuality,
  pendingCount,
  isSyncing,
  onSync,
}: NetworkStatusBadgeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use offline state during SSR to prevent hydration mismatch
  const quality = mounted && isOnline ? networkQuality : 'offline';
  const config = qualityConfig[quality];
  const displayPendingCount = mounted ? pendingCount : 0;
  const displayIsSyncing = mounted ? isSyncing : false;
  const displayIsOnline = mounted ? isOnline : false;

  return (
    <div className="flex items-center gap-2">
      {/* Status indicator */}
      <button
        onClick={onSync}
        disabled={!displayIsOnline || displayIsSyncing || displayPendingCount === 0}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition-colors disabled:opacity-70 disabled:cursor-default"
        title={
          displayIsSyncing
            ? 'Syncing...'
            : displayPendingCount > 0
              ? `${displayPendingCount} pending - click to sync`
              : config.label
        }
      >
        {/* Dot indicator */}
        <span className={`w-2 h-2 rounded-full ${config.bg} ${quality !== 'offline' ? 'animate-pulse' : ''}`} />

        {/* Icon */}
        {displayIsSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 text-white/80 animate-spin" />
        ) : displayIsOnline ? (
          <Wifi className={`w-3.5 h-3.5 ${config.color}`} />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-red-400" />
        )}

        {/* Label (desktop only) */}
        <span className={`hidden lg:inline text-xs ${config.color}`}>
          {displayIsSyncing ? 'Syncing' : config.label}
        </span>

        {/* Pending count badge */}
        {displayPendingCount > 0 && !displayIsSyncing && (
          <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-orange-500 rounded-full">
            {displayPendingCount > 99 ? '99+' : displayPendingCount}
          </span>
        )}
      </button>
    </div>
  );
}
