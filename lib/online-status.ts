/**
 * Shared online status state.
 * Extracted to break the circular dependency between sync-service and local-first-service.
 */

let _isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let _listeners: Array<(online: boolean) => void> = [];

export function getOnlineStatus(): boolean {
  return _isOnline;
}

export function setOnlineStatus(online: boolean): void {
  _isOnline = online;
  _listeners.forEach(cb => cb(online));
}

export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  _listeners.push(callback);
  callback(_isOnline);
  return () => {
    _listeners = _listeners.filter(cb => cb !== callback);
  };
}
