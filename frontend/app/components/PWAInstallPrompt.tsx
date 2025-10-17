"use client";

import React, { useState } from "react";
import { useInstallPrompt } from "@/app/hooks/usePWA";
import { FaDownload, FaTimes, FaMobile, FaDesktop } from "react-icons/fa";


const PWAInstallPrompt: React.FC = () => {

  const { showPrompt, handleInstall, dismissPrompt, canInstall, isInstalled } = useInstallPrompt();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showInstallTimeout, setShowInstallTimeout] = useState(false);

  // Always check standalone mode at render time
  const [isStandalone, setIsStandalone] = useState(false);
  React.useEffect(() => {
    const checkStandalone = () => {
      setIsStandalone(
        typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
   ("standalone" in window.navigator && (window.navigator as any).standalone === true))
      );
    };
    checkStandalone();
    window.addEventListener("resize", checkStandalone);
    return () => window.removeEventListener("resize", checkStandalone);
  }, []);

  if (!showPrompt || isInstalled || isStandalone || !canInstall) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    setShowInstallTimeout(false);
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      if (canInstall) {
        // Set a timeout to exit installing state if user does not interact
        timeoutId = setTimeout(() => {
          setIsInstalling(false);
          setShowInstallTimeout(true);
        }, 10000); // 10 seconds
        await handleInstall();
      } else {
        showManualInstallInstructions();
      }
    } catch (error) {
      showManualInstallInstructions();
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsInstalling(false);
    }
  };

  const showManualInstallInstructions = () => {
    alert(`To install this app:\n\nChrome/Edge (Desktop):\n1. Click the install icon in the address bar (⊕)\n2. Or go to Menu (⋮) > \"Install Cardiac Delights\"\n\nChrome (Mobile):\n1. Tap the menu (⋮) button\n2. Select \"Add to Home Screen\"\n\nSafari (iOS):\n1. Tap the share button (□↗)\n2. Select \"Add to Home Screen\"\n\nFirefox:\n1. Tap the menu (☰) button  \n2. Select \"Install\"\n\nYou can also bookmark this page for easy access.`);
  };

  return (
    <>
      {/* Main Install Banner */}
      <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-xl border border-yellow-400/30 rounded-2xl shadow-2xl z-[9999]">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                <FaDownload className="text-black text-lg" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  Install Cardiac Delights
                </h3>
                <p className="text-gray-300 text-sm">Get the full experience</p>
              </div>
            </div>
            <button
              onClick={dismissPrompt}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg flex-shrink-0"
              aria-label="Dismiss install prompt"
              title="Close"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Benefits */}
          <div className="mb-4">
            <p className="text-gray-300 text-sm mb-2">
              Why install Cardiac Delights?
            </p>
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
              onClick={handleInstallClick}
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
            {showInstallTimeout && (
              <div className="text-xs text-yellow-300 mt-2 w-full text-center">
                If you don't see the install prompt, check your browser menu or try again.
              </div>
            )}
            <button
              onClick={() => setShowDetails(true)}
              className="px-4 py-2.5 border border-gray-600 text-gray-300 rounded-xl hover:border-gray-500 hover:text-white transition-colors text-sm"
            >
              Learn More
            </button>
            <button
              onClick={dismissPrompt}
              className="px-3 py-2.5 border border-gray-600 text-gray-400 rounded-xl hover:border-red-500 hover:text-red-400 transition-colors text-sm"
              aria-label="Dismiss install prompt"
              title="Dismiss"
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Installation Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-yellow-400/30 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center">
                    <FaDownload className="text-black text-lg" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-xl">
                      Install Cardiac Delights
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Get the best restaurant management experience
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {/* Benefits Section */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-4">
                  Why Install Our App?
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-green-400 text-sm">📱</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        Native App Experience
                      </p>
                      <p className="text-gray-400 text-sm">
                        Full-screen app without browser UI for distraction-free
                        management
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-400 text-sm">⚡</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Lightning Fast</p>
                      <p className="text-gray-400 text-sm">
                        Cached resources mean instant loading and smooth
                        performance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-purple-400 text-sm">📡</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Works Offline</p>
                      <p className="text-gray-400 text-sm">
                        Continue working even without internet - changes sync
                        automatically
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-yellow-400 text-sm">🔔</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        Smart Notifications
                      </p>
                      <p className="text-gray-400 text-sm">
                        Get alerts for low stock, expiring items, and important
                        updates
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Specific Instructions */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-4">
                  Installation Guide
                </h3>
                <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <FaMobile className="text-yellow-400 mt-1" />
                    <div>
                      <p className="text-white font-medium">
                        Mobile (Chrome/Safari)
                      </p>
                      <p className="text-gray-400 text-sm">
                        Tap "Install" when prompted, or use the browser menu →
                        "Add to Home Screen"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaDesktop className="text-yellow-400 mt-1" />
                    <div>
                      <p className="text-white font-medium">
                        Desktop (Chrome/Edge)
                      </p>
                      <p className="text-gray-400 text-sm">
                        Click the install icon in the address bar, or use the
                        browser menu → "Install Cardiac Delights"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    handleInstallClick();
                  }}
                  disabled={isInstalling}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold py-3 px-4 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isInstalling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Installing...
                    </>
                  ) : (
                    <>
                      <FaDownload size={16} />
                      Install App
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:border-gray-500 hover:text-white transition-colors"
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

export default PWAInstallPrompt;
