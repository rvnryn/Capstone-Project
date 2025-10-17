"use client";

import React, { useState, useEffect } from "react";
import { FaDownload, FaTimes, FaInfoCircle } from "react-icons/fa";

interface ManualPWABannerProps {
  className?: string;
  show?: boolean;
}

const ManualPWABanner: React.FC<ManualPWABannerProps> = ({
  className = "",
  show = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show manual banner if requested and not dismissed
    const dismissed =
      localStorage.getItem("manual-pwa-install-dismissed") === "true";
    const isPWA = window.matchMedia("(display-mode: standalone)").matches;

    if (show && !dismissed && !isPWA) {
      setIsVisible(true);
    }
  }, [show]);

  const handleManualInstall = async () => {
    setIsInstalling(true);
    // Analytics stub - fire an event for install attempt
    try {
      (window as any).__pwa_analytics?.track?.('pwa_install_attempt');
    } catch {}

    try {
      // Check if there's a deferred prompt available
      const deferredPrompt = (window as any).deferredPrompt;

      if (deferredPrompt) {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          console.log("PWA installed via deferred prompt");
          setIsVisible(false);
        }
      } else {
        // Show manual installation instructions
        alert(`To install this app:

Chrome/Edge (Desktop):
1. Click the install icon in the address bar
2. Or go to Menu > Install "Cardiac Delights"

Chrome (Mobile):
1. Tap the menu (⋮) button
2. Select "Add to Home Screen"

Safari (iOS):
1. Tap the share button
2. Select "Add to Home Screen"

Firefox:
1. Tap the menu (☰) button
2. Select "Install"

You can also bookmark this page and access it from your browser's bookmarks.`);
      }
    } catch (error) {
      console.error("Manual install failed:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const dismissBanner = () => {
    setIsVisible(false);
    localStorage.setItem("manual-pwa-install-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-gradient-to-r from-blue-900/95 to-indigo-900/95 backdrop-blur-xl border border-blue-400/30 rounded-2xl shadow-2xl z-[9999] ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-pwa-banner-title"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") dismissBanner();
      }}
    >
      <div className="p-4" tabIndex={0} ref={modalRef}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <FaDownload className="text-white text-lg" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg" id="manual-pwa-banner-title">
                Install App (Manual)
              </h3>
              <p className="text-gray-300 text-sm">
                Get the full PWA experience
              </p>
            </div>
          </div>
          <button
            onClick={dismissBanner}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Dismiss install prompt"
            title="Close"
            tabIndex={0}
          >
            <FaTimes size={16} aria-hidden="true" />
          </button>
          <span className="ml-2 text-xs text-gray-300 hidden sm:inline" aria-hidden="true">Esc to close</span>
        </div>

        {/* Info */}
        <div className="mb-4 flex items-start gap-2">
          <FaInfoCircle
            className="text-blue-400 mt-0.5 flex-shrink-0"
            size={14}
            aria-hidden="true"
          />
          <p className="text-gray-300 text-sm">
            This is a manual install banner for testing PWA functionality when
            the browser doesn't trigger the automatic install prompt.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleManualInstall}
          disabled={isInstalling}
          aria-live="polite"
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl hover:from-blue-400 hover:to-indigo-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          aria-label="Install Cardiac Delights app manually"
          tabIndex={0}
        >
          {isInstalling ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
              Installing...
            </>
          ) : (
            <>
              <FaDownload size={14} aria-hidden="true" />
              Install App Manually
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ManualPWABanner;
