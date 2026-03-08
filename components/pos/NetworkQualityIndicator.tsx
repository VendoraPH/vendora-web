"use client"

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WifiOff, Signal, SignalLow, SignalMedium, SignalHigh, RefreshCw, Info } from 'lucide-react';
import { networkMonitor, type NetworkStats, type NetworkQuality } from '@/lib/network-quality-monitor';

export function NetworkQualityIndicator() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Subscribe to network quality changes
    const unsubscribe = networkMonitor.onChange((newStats) => {
      setStats(newStats);
    });

    return unsubscribe;
  }, []);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await networkMonitor.check();
    } finally {
      setTimeout(() => setIsChecking(false), 500);
    }
  };

  if (!stats) {
    return (
      <Badge variant="outline" className="bg-gray-500/20 text-gray-400 dark:text-[#9898b8] border-gray-500/30">
        <Signal className="h-3 w-3 mr-1" />
        Checking...
      </Badge>
    );
  }

  const { quality, latency, speed, isStable, recommendation } = stats;

  // Get appropriate icon and colors
  const Icon = getQualityIcon(quality);
  const colors = getQualityColors(quality);

  return (
    <div className="flex items-center gap-2">
      {/* Quality Badge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`${colors.bg} ${colors.text} ${colors.border} cursor-pointer`}
            >
              <Icon className="h-3 w-3 mr-1" />
              <span className="text-xs capitalize">{quality}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p className="font-semibold">{recommendation}</p>
              <p>Latency: {networkMonitor.formatLatency(latency)}</p>
              <p>Speed: {networkMonitor.formatSpeed(speed)}</p>
              <p>Status: {isStable ? 'Stable ✓' : 'Checking...'}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Detailed Info Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-white/10"
          >
            <Info className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-[#201836] border-white/10 text-white">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Network Status</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleManualCheck}
                disabled={isChecking}
                className="h-7 px-2"
              >
                <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Quality Indicator */}
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${colors.text}`} />
              <div className="flex-1">
                <div className="font-medium capitalize">{quality} Connection</div>
                <div className="text-xs text-white/60">{recommendation}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Latency:</span>
                <span className={`font-mono ${getLatencyColor(latency)}`}>
                  {networkMonitor.formatLatency(latency)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/60">Speed:</span>
                <span className="font-mono">{networkMonitor.formatSpeed(speed)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/60">Stability:</span>
                <span className={isStable ? 'text-green-400' : 'text-yellow-400'}>
                  {isStable ? '✓ Stable' : '⋯ Checking'}
                </span>
              </div>
            </div>

            {/* Signal Strength Visual */}
            <div className="pt-2 border-t border-white/10">
              <SignalStrengthBar quality={quality} />
            </div>

            {/* Recommendations */}
            {quality === 'poor' && (
              <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-2 text-xs">
                <p className="text-orange-400 font-medium mb-1">⚠️ Slow Connection</p>
                <p className="text-white/70">
                  Working offline for smooth operation. Will auto-sync when connection improves.
                </p>
              </div>
            )}

            {quality === 'excellent' && isStable && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-2 text-xs">
                <p className="text-green-400 font-medium mb-1">✓ Optimal Connection</p>
                <p className="text-white/70">
                  Syncing normally. All transactions will upload immediately.
                </p>
              </div>
            )}

            {quality === 'offline' && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs">
                <p className="text-red-400 font-medium mb-1">📴 No Connection</p>
                <p className="text-white/70">
                  POS continues working offline. All transactions saved locally.
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ==================== Helper Components ====================

function SignalStrengthBar({ quality }: { quality: NetworkQuality }) {
  const bars = 5;
  const activeBars = quality === 'excellent' ? 5
    : quality === 'good' ? 4
      : quality === 'poor' ? 2
        : 0;

  return (
    <div className="flex items-center gap-1">
      <Signal className="h-3 w-3 text-white/40" />
      <div className="flex gap-0.5 items-end h-4">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-t transition-all ${i < activeBars
              ? quality === 'excellent'
                ? 'bg-green-500'
                : quality === 'good'
                  ? 'bg-blue-500'
                  : 'bg-orange-500'
              : 'bg-white/10'
              }`}
            style={{ height: `${((i + 1) / bars) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ==================== Helper Functions ====================

function getQualityIcon(quality: NetworkQuality) {
  switch (quality) {
    case 'excellent':
      return SignalHigh;
    case 'good':
      return SignalMedium;
    case 'poor':
      return SignalLow;
    case 'offline':
      return WifiOff;
    default:
      return Signal;
  }
}

function getQualityColors(quality: NetworkQuality) {
  switch (quality) {
    case 'excellent':
      return {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        border: 'border-green-500/30'
      };
    case 'good':
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/30'
      };
    case 'poor':
      return {
        bg: 'bg-orange-500/20',
        text: 'text-orange-400',
        border: 'border-orange-500/30'
      };
    case 'offline':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/30'
      };
    default:
      return {
        bg: 'bg-gray-500/20',
        text: 'text-gray-400',
        border: 'border-gray-500/30'
      };
  }
}

function getLatencyColor(latency: number): string {
  if (latency < 100) return 'text-green-400';
  if (latency < 300) return 'text-blue-400';
  if (latency < 800) return 'text-orange-400';
  return 'text-red-400';
}
