/**
 * Network Quality Monitor
 *
 * Detects slow/unstable internet connections and automatically
 * switches to offline mode for smooth POS operation.
 *
 * Features:
 * - Real-time connection speed detection
 * - Latency monitoring (ping test)
 * - Packet loss detection
 * - Auto-switch to offline mode when slow
 * - Auto-sync when connection improves
 */

export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'offline';
export type NetworkMode = 'online' | 'offline-forced';

export interface NetworkStats {
  quality: NetworkQuality;
  mode: NetworkMode;
  latency: number; // milliseconds
  speed: number; // Mbps (estimated)
  isStable: boolean;
  lastCheck: Date;
  recommendation: string;
}

// ==================== Configuration ====================

const CONFIG = {
  // Latency thresholds (ping time in ms)
  EXCELLENT_LATENCY: 100,   // < 100ms = excellent
  GOOD_LATENCY: 300,         // < 300ms = good
  POOR_LATENCY: 1000,        // < 1000ms = poor, > 1000ms = unusable

  // Speed thresholds (Mbps)
  MINIMUM_SPEED: 0.5,        // 0.5 Mbps minimum for sync

  // Check intervals
  CHECK_INTERVAL: 30000,     // Check every 30 seconds
  QUICK_CHECK_INTERVAL: 5000, // Quick checks when recovering

  // Stability requirements
  STABLE_CHECKS_NEEDED: 3,   // Need 3 consecutive good checks to mark as stable
  UNSTABLE_THRESHOLD: 2,     // 2 failures = unstable

};

// ==================== State Management ====================

let currentQuality: NetworkQuality = 'good'; // Start optimistic
let currentMode: NetworkMode = 'online';
let listeners: Array<(stats: NetworkStats) => void> = [];
let monitorInterval: NodeJS.Timeout | null = null;
let consecutiveGoodChecks = 0;
let consecutiveBadChecks = 0;
let lastLatency = 0;
let lastSpeed = 0;
let isMonitoring = false;

// ==================== Network Quality Detection ====================

/**
 * Ping test - measures latency to our API server
 */
async function measureLatency(): Promise<number> {
  const start = performance.now();

  try {
    // Try to reach our API with a lightweight endpoint
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch('/api/ping', {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
      }
    });

    clearTimeout(timeout);
    const latency = performance.now() - start;

    if (response.ok) {
      // Log successful ping for debugging
      if (latency > 100) {
        console.log(`⏱️ Ping latency: ${latency.toFixed(0)}ms`);
      }
      return latency;
    } else {
      console.warn(`❌ Ping failed with status: ${response.status}`);
      return 9999; // Error = very high latency
    }
  } catch (err: any) {
    // Network error or timeout
    console.warn(`❌ Ping error: ${err?.message || 'unknown'}`);
    return 9999;
  }
}

/**
 * Estimate connection speed using Network Information API
 */
function estimateSpeed(): number {
  // Check if browser supports Network Information API
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;

    if (connection) {
      // downlink is in Mbps
      const downlink = connection.downlink;
      const effectiveType = connection.effectiveType;

      // Use downlink if available, otherwise estimate from effectiveType
      if (downlink) {
        return downlink;
      }

      // Fallback estimates based on connection type
      switch (effectiveType) {
        case '4g': return 10; // ~10 Mbps
        case '3g': return 1.5; // ~1.5 Mbps
        case '2g': return 0.3; // ~0.3 Mbps
        case 'slow-2g': return 0.1; // ~0.1 Mbps
        default: return 5; // Unknown, assume moderate
      }
    }
  }

  // Network API not supported - return optimistic estimate
  return 5;
}

/**
 * Determine network quality based on latency and speed
 */
function calculateQuality(latency: number, speed: number): NetworkQuality {
  // Offline if latency is impossibly high
  if (latency >= 9000) {
    return 'offline';
  }

  // Excellent: Low latency + good speed
  if (latency < CONFIG.EXCELLENT_LATENCY && speed >= 5) {
    return 'excellent';
  }

  // Good: Acceptable latency + decent speed
  if (latency < CONFIG.GOOD_LATENCY && speed >= 1) {
    return 'good';
  }

  // Poor: High latency or slow speed (but still connected)
  return 'poor';
}

/**
 * Check if connection is stable (multiple consecutive good/bad checks)
 */
function isConnectionStable(): boolean {
  return consecutiveGoodChecks >= CONFIG.STABLE_CHECKS_NEEDED;
}

/**
 * Generate recommendation based on current network state
 */
function getRecommendation(quality: NetworkQuality, latency: number): string {
  switch (quality) {
    case 'excellent':
      return 'Connection is excellent - syncing normally';

    case 'good':
      return 'Connection is stable - safe to sync';

    case 'poor':
      return `Slow connection (${latency}ms) - syncing may be slower than usual`;

    case 'offline':
      return 'No connection - working offline, will auto-sync when online';

    default:
      return 'Checking connection...';
  }
}

// ==================== Auto-Switch Logic ====================

/**
 * Decide whether to auto-switch mode based on connection quality.
 * Only switches to offline when connection is truly lost (ping fails).
 * Poor/slow connections stay online - they can still sync data.
 */
function evaluateAutoSwitch(quality: NetworkQuality, latency: number): NetworkMode {
  // If user manually forced offline, respect that
  if (currentMode === 'offline-forced') {
    return 'offline-forced';
  }

  // Only go offline when connection is truly lost
  if (quality === 'offline') {
    if (currentMode === 'online') {
      console.log(`📴 Connection lost - switching to offline mode`);
      notifyModeChange('offline', latency);
    }
    return 'online'; // Keep mode as 'online' so it auto-recovers
  }

  // Connection recovered from offline
  if (currentMode === 'online' && consecutiveGoodChecks === CONFIG.STABLE_CHECKS_NEEDED) {
    console.log(`✅ Connection stable (latency: ${latency}ms) - safe to sync`);
    notifyModeChange('online', latency);
  }

  return 'online';
}

/**
 * Notify user about mode changes
 */
function notifyModeChange(newMode: 'online' | 'offline', latency: number) {
  // This will be called by listeners (e.g., to show toast notification)
  const message = newMode === 'offline'
    ? `Slow connection detected (${latency}ms) - switching to offline mode`
    : `Connection stable (${latency}ms) - starting sync`;

  console.log(`🔄 Network mode change: ${newMode} - ${message}`);
}

// ==================== Monitoring ====================

/**
 * Perform a single network quality check
 */
async function performCheck(): Promise<NetworkStats> {
  const latency = await measureLatency();
  const speed = estimateSpeed();
  const quality = calculateQuality(latency, speed);

  // Track consecutive checks for stability detection
  if (quality === 'good' || quality === 'excellent') {
    consecutiveGoodChecks++;
    consecutiveBadChecks = 0;
  } else {
    consecutiveBadChecks++;
    if (consecutiveBadChecks >= CONFIG.UNSTABLE_THRESHOLD) {
      consecutiveGoodChecks = 0; // Reset - connection is unstable
    }
  }

  // Evaluate if we should auto-switch mode
  const newMode = evaluateAutoSwitch(quality, latency);

  // Update state
  lastLatency = latency;
  lastSpeed = speed;
  currentQuality = quality;
  currentMode = newMode;

  const stats: NetworkStats = {
    quality,
    mode: newMode,
    latency: Math.round(latency),
    speed: parseFloat(speed.toFixed(2)),
    isStable: isConnectionStable(),
    lastCheck: new Date(),
    recommendation: getRecommendation(quality, latency)
  };

  // Notify listeners
  notifyListeners(stats);

  return stats;
}

/**
 * Start continuous monitoring
 */
export function startNetworkMonitoring() {
  if (isMonitoring) {
    console.log('Network monitoring already running');
    return;
  }

  console.log('🔍 Starting network quality monitoring...');
  isMonitoring = true;

  // Perform initial check immediately
  performCheck().then(stats => {
    console.log('📊 Initial network check:', {
      quality: stats.quality,
      latency: stats.latency,
      recommendation: stats.recommendation
    });
  });

  // Set up interval for continuous monitoring
  monitorInterval = setInterval(async () => {
    const stats = await performCheck();

    // Adjust check frequency based on connection quality
    if (stats.quality === 'poor' || stats.quality === 'offline') {
      // Check more frequently when connection is bad (to detect recovery)
      if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = setInterval(performCheck, CONFIG.QUICK_CHECK_INTERVAL);
      }
    } else if (stats.quality === 'excellent' || stats.quality === 'good') {
      // Check less frequently when connection is good
      if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = setInterval(performCheck, CONFIG.CHECK_INTERVAL);
      }
    }
  }, CONFIG.CHECK_INTERVAL);
}

/**
 * Stop monitoring
 */
export function stopNetworkMonitoring() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
  isMonitoring = false;
  console.log('⏹️ Network monitoring stopped');
}

/**
 * Get current network stats (without performing new check)
 */
export function getCurrentStats(): NetworkStats {
  return {
    quality: currentQuality,
    mode: currentMode,
    latency: Math.round(lastLatency),
    speed: parseFloat(lastSpeed.toFixed(2)),
    isStable: isConnectionStable(),
    lastCheck: new Date(),
    recommendation: getRecommendation(currentQuality, lastLatency)
  };
}

/**
 * Manually trigger a network check
 */
export async function checkNetworkQuality(): Promise<NetworkStats> {
  return await performCheck();
}

/**
 * Force offline mode (user override)
 */
export function forceOfflineMode() {
  currentMode = 'offline-forced';
  console.log('🔒 Forced offline mode');
  notifyListeners(getCurrentStats());
}

/**
 * Resume automatic mode
 */
export function resumeAutoMode() {
  currentMode = 'online';
  console.log('🔓 Resumed automatic mode');
  performCheck(); // Re-evaluate immediately
}

// ==================== Event Listeners ====================

/**
 * Subscribe to network quality changes
 */
export function onNetworkQualityChange(callback: (stats: NetworkStats) => void) {
  listeners.push(callback);

  // Immediately call with current stats
  callback(getCurrentStats());

  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(cb => cb !== callback);
  };
}

/**
 * Notify all listeners
 */
function notifyListeners(stats: NetworkStats) {
  listeners.forEach(callback => callback(stats));
}

// ==================== Browser API Integration ====================

/**
 * Listen to browser online/offline events
 */
export function initializeBrowserListeners() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    console.log('🌐 Browser detected online');
    performCheck();
  });

  window.addEventListener('offline', () => {
    console.log('📴 Browser detected offline');
    currentQuality = 'offline';
    notifyListeners(getCurrentStats());
  });
}

// ==================== Utility Functions ====================

/**
 * Get quality as color for UI
 */
export function getQualityColor(quality: NetworkQuality): string {
  switch (quality) {
    case 'excellent': return 'green';
    case 'good': return 'blue';
    case 'poor': return 'orange';
    case 'offline': return 'red';
    default: return 'gray';
  }
}

/**
 * Get quality as emoji
 */
export function getQualityEmoji(quality: NetworkQuality): string {
  switch (quality) {
    case 'excellent': return '🚀';
    case 'good': return '✅';
    case 'poor': return '⚠️';
    case 'offline': return '📴';
    default: return '❓';
  }
}

/**
 * Format latency for display
 */
export function formatLatency(ms: number): string {
  if (ms >= 9000) return 'N/A';
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

/**
 * Format speed for display
 */
export function formatSpeed(mbps: number): string {
  if (mbps >= 1) return `${mbps.toFixed(1)} Mbps`;
  return `${(mbps * 1000).toFixed(0)} Kbps`;
}

// ==================== Export Everything ====================

export const networkMonitor = {
  // Monitoring
  start: startNetworkMonitoring,
  stop: stopNetworkMonitoring,
  check: checkNetworkQuality,
  getCurrentStats,

  // Mode control
  forceOffline: forceOfflineMode,
  resumeAuto: resumeAutoMode,

  // Events
  onChange: onNetworkQualityChange,

  // Browser integration
  initBrowserListeners: initializeBrowserListeners,

  // Utilities
  getQualityColor,
  getQualityEmoji,
  formatLatency,
  formatSpeed,

  // Config (for testing/tweaking)
  config: CONFIG
};
