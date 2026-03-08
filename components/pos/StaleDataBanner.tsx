"use client"

import { Clock } from 'lucide-react';

interface StaleDataBannerProps {
  isStale: boolean;
  lastSyncedAt: Date | null;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function StaleDataBanner({ isStale, lastSyncedAt }: StaleDataBannerProps) {
  if (!isStale || !lastSyncedAt) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 mb-3 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 text-xs">
      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
      <span>Data may be outdated - last synced {formatTimeAgo(lastSyncedAt)}</span>
    </div>
  );
}
