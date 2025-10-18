// Utility to check online/offline status
export function isOnline(): boolean {
  if (typeof window !== "undefined" && typeof window.navigator !== "undefined") {
    return window.navigator.onLine;
  }
  return true; // Assume online in non-browser environments
}
