"use client"

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { syncService } from '@/lib/sync-service';
import { getPendingTransactionsCount } from '@/lib/db';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';

export function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<{ synced: number; failed: number } | null>(null);

  // Monitor online status
  useEffect(() => {
    const unsubscribe = syncService.onOnlineStatusChange((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  // Update pending count periodically
  useEffect(() => {
    const updateCounts = async () => {
      const count = await getPendingTransactionsCount();
      setPendingCount(count);
    };

    updateCounts();
    const interval = setInterval(updateCounts, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Manual sync handler
  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    setSyncProgress(0);
    setLastSyncResult(null);

    try {
      const result = await syncService.syncPendingTransactions((synced, total) => {
        setSyncProgress((synced / total) * 100);
      });

      setLastSyncResult(result);
      setPendingCount(0);
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Online/Offline Indicator */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={isOnline ? "default" : "destructive"}
              className={`flex items-center gap-1 ${
                isOnline
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}
            >
              {isOnline ? (
                <>
                  <Cloud className="h-3 w-3" />
                  <span className="text-xs">Online</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-3 w-3" />
                  <span className="text-xs">Offline</span>
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOnline ? 'Connected to server' : 'Working offline - data will sync when online'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Pending Transactions */}
      {pendingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                <AlertCircle className="h-3 w-3 mr-1" />
                {pendingCount} pending
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{pendingCount} transaction{pendingCount !== 1 ? 's' : ''} waiting to sync</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Sync Progress */}
      {isSyncing && (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
          <div className="w-24">
            <Progress value={syncProgress} className="h-2" />
          </div>
          <span className="text-xs text-white/60">{Math.round(syncProgress)}%</span>
        </div>
      )}

      {/* Last Sync Result */}
      {lastSyncResult && !isSyncing && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={
                  lastSyncResult.failed === 0
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                }
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Synced {lastSyncResult.synced}
                {lastSyncResult.failed > 0 && ` (${lastSyncResult.failed} failed)`}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last sync: {lastSyncResult.synced} successful, {lastSyncResult.failed} failed</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Manual Sync Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing || pendingCount === 0}
              className="h-8 w-8 p-0 rounded-lg hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{pendingCount === 0 ? 'No pending transactions' : 'Sync now'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
