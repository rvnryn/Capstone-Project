"use client";

import React, { useState, useEffect } from "react";
import { useInstallPrompt } from "@/app/hooks/usePWA";
import { FaDownload, FaTimes, FaMobile, FaDesktop } from "react-icons/fa";

interface PWAInstallBannerProps {
  className?: string;
}

const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  className = "",
}) => {
  const { showPrompt, handleInstall, dismissPrompt, canInstall, isInstalled } =
    useInstallPrompt();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  // Remove forceShow, use shouldShowBanner logic instead
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [swRegistered, setSwRegistered] = useState<boolean>(false);
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Focus management: save previous focus, focus modal, trap focus while open, restore on close
  useEffect(() => {
    let previousActive: Element | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDetails) return;
      if (e.key === "Tab") {
        const modal = modalRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
      if (e.key === "Escape") {
        setShowDetails(false);
      }
    };

    if (showDetails) {
      previousActive = document.activeElement;
      setTimeout(() => modalRef.current?.focus(), 0);
      document.addEventListener("keydown", handleKeyDown);
      // prevent background from scrolling while modal open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      if (previousActive && (previousActive as HTMLElement).focus) {
        (previousActive as HTMLElement).focus();
      }
    };
  }, [showDetails]);

  // Capture beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      console.log("📱 beforeinstallprompt event captured in banner");
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredInstallPrompt = e;
    };

    const handleAppInstalled = () => {
      console.log("📱 App was installed - cleaning up prompts");
  setDeferredPrompt(null);
  (window as any).deferredInstallPrompt = null;
  setShowFallback(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Quick service worker registration check for debugging
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        setSwRegistered(!!reg);
      });
      navigator.serviceWorker.addEventListener?.("controllerchange", () => {
        navigator.serviceWorker.getRegistration().then((reg) => {
          setSwRegistered(!!reg);
        });
      });
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Banner should show if:
  // - not installed
  // - not in standalone mode
  // - not dismissed (or dismissed more than 24h ago)
  // - install prompt is available
  const isAppInstalled =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true);

  let dismissed = false;
  let dismissedTime = null;
  if (typeof window !== "undefined") {
    dismissed = localStorage.getItem("pwa-install-dismissed") === "true";
    dismissedTime = localStorage.getItem("pwa-install-dismissed-time");
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (dismissedTime && parseInt(dismissedTime) < twentyFourHoursAgo) {
      localStorage.removeItem("pwa-install-dismissed");
      dismissed = false;
    }
  }

  const hasPrompt = !!(deferredPrompt || (typeof window !== "undefined" && (window as any).deferredInstallPrompt));
  const shouldShowBanner =
    !isAppInstalled &&
    !isInstalled &&
    !dismissed &&
    hasPrompt;

  if (!shouldShowBanner) return null;

  const handleDismiss = () => {
    console.log("Dismissing PWA banner");

    // Hide all banner states
    setShowFallback(false);
  // no-op, removed forceShow

    // Call the hook's dismiss function
    dismissPrompt();

    // Store dismissal in localStorage
    localStorage.setItem("pwa-install-dismissed", "true");
    localStorage.setItem("pwa-install-dismissed-time", Date.now().toString());
  };
  // Wrapper that attempts hook install first, then falls back to window.deferredInstallPrompt
  const doInstall = async () => {
    setIsInstalling(true);
    try {
      // First try the window-level prompt (must be called from user gesture)
      const winPrompt = (window as any).deferredInstallPrompt;
      if (winPrompt) {
        console.log("Calling window.deferredInstallPrompt.prompt() from banner");
        try {
          await winPrompt.prompt();
          const choice = await winPrompt.userChoice;
          console.log("window prompt userChoice:", choice);
          try {
            (window as any).deferredInstallPrompt = null;
          } catch {}
          if (choice && choice.outcome === "accepted") {
            setShowDetails(false);
            return true;
          }
          return false;
        } catch (err) {
          console.warn("window.deferredInstallPrompt.prompt() failed:", err);
          // fall through to hook attempt
        }
      }

      // If window prompt isn't available or failed, try the hook-based installer
      console.log("Falling back to hook-based install()");
      const success = await handleInstall();
      if (success) {
        setShowDetails(false);
      }
      return success;
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <>
      {/* Main Install Banner */}
      <div
        role="region"
        aria-label="PWA install prompt"
        className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-xl border border-yellow-400/30 rounded-2xl shadow-2xl z-[9999] ${className}`}
      >
        <div className="p-4">
          {/* Debug pill - shows why install may not be available in dev */}
          <div className="flex justify-end mb-2">
            <div className="text-xs text-gray-300 bg-black/30 px-2 py-0.5 rounded-lg">
              <span className="mr-2">SW: {swRegistered ? "registered" : "no"}</span>
              <span>Prompt: {(deferredPrompt || (window as any).deferredInstallPrompt) ? "ready" : "none"}</span>
            </div>
          </div>
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                <FaDownload className="text-black text-lg" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Install App</h3>
                <p className="text-gray-300 text-sm">Get the full experience</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDismiss();
              }}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg flex-shrink-0"
              aria-label="Dismiss install prompt"
              title="Close"
            >
              <FaTimes size={18} />
            </button>
          </div>
          {/* Benefits */}
          <div className="mb-4">
            <p className="text-gray-300 text-sm mb-2">Why install Cardiac Delights?</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-green-400">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Works offline
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                Faster loading
              </div>
              <div className="flex items-center gap-2 text-purple-400">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                Push notifications
              </div>
              <div className="flex items-center gap-2 text-yellow-400">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                App shortcuts
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={doInstall}
              disabled={isInstalling}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold py-2.5 px-4 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Installing...
                </>
              ) : (
                <>
                  <FaDownload size={14} />
                  Install Now
                </>
              )}
            </button>
            <button
              onClick={() => setShowDetails(true)}
              className="px-4 py-2.5 border border-gray-600 text-gray-300 rounded-xl hover:border-gray-500 hover:text-white transition-colors text-sm"
              aria-controls="pwa-install-modal"
              aria-expanded={showDetails}
            >
              Learn More
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDismiss();
              }}
              className="px-3 py-2.5 border border-gray-600 text-gray-400 rounded-xl hover:border-red-500 hover:text-red-400 transition-colors text-sm"
              title="Dismiss"
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>
      </div>
      {/* Detailed Installation Modal */}
      {showDetails && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-modal-title"
          aria-describedby="pwa-install-modal-desc"
        >
          <div
            id="pwa-install-modal"
            className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-yellow-400/30 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            tabIndex={-1}
            ref={modalRef}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center">
                    <FaDownload className="text-black text-lg" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-xl" id="pwa-install-modal-title">
                      Install Cardiac Delights
                    </h2>
                    <p className="text-gray-400 text-sm" id="pwa-install-modal-desc">
                      Get the best restaurant management experience
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                  aria-label="Close installation details"
                  title="Close"
                  tabIndex={0}
                >
                  <FaTimes size={20} aria-hidden="true" />
                </button>
                {/* Visible keyboard hint for accessibility */}
                <span className="ml-2 text-xs text-gray-400 hidden sm:inline" aria-hidden="true">Esc to close</span>
              </div>
              {/* screen-reader live region for install status */}
              <div aria-live="polite" className="sr-only" id="pwa-install-status">
                {isInstalling ? "Installing the app" : deferredPrompt ? "Install available" : ""}
              </div>

              {/* Benefits Section */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-4">Why Install Our App?</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-green-400 text-sm" aria-hidden="true">📱</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Native App Experience</p>
                      <p className="text-gray-400 text-sm">Full-screen app without browser UI for distraction-free management</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-400 text-sm" aria-hidden="true">⚡</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Lightning Fast</p>
                      <p className="text-gray-400 text-sm">Cached resources mean instant loading and smooth performance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-purple-400 text-sm" aria-hidden="true">📡</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Works Offline</p>
                      <p className="text-gray-400 text-sm">Continue working even without internet - changes sync automatically</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-yellow-400 text-sm" aria-hidden="true">🔔</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Smart Notifications</p>
                      <p className="text-gray-400 text-sm">Get alerts for low stock, expiring items, and important updates</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Platform Specific Instructions */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-4">Installation Guide</h3>
                <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <FaMobile className="text-yellow-400 mt-1" aria-hidden="true" />
                    <div>
                      <p className="text-white font-medium">Mobile (Chrome/Safari)</p>
                      <p className="text-gray-400 text-sm">Tap "Install" when prompted, or use the browser menu → "Add to Home Screen"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaDesktop className="text-yellow-400 mt-1" aria-hidden="true" />
                    <div>
                      <p className="text-white font-medium">Desktop (Chrome/Edge)</p>
                      <p className="text-gray-400 text-sm">Click the install icon in the address bar, or use the browser menu → "Install Cardiac Delights"</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    doInstall();
                  }}
                  disabled={isInstalling}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold py-3 px-4 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  aria-label="Install Cardiac Delights app"
                  tabIndex={0}
                >
                  {isInstalling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                      Installing...
                    </>
                  ) : (
                    <>
                      <FaDownload size={16} aria-hidden="true" />
                      Install App
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:border-gray-500 hover:text-white transition-colors"
                  aria-label="Maybe later, close installation details"
                  tabIndex={0}
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallBanner;
