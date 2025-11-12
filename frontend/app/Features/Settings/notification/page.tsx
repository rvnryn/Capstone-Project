"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/app/utils/Server/supabaseClient";
import { useNotificationSettingsAPI } from "./hook/use-NotificationSettingsAPI";
import NavigationBar from "@/app/components/navigation/navigation";
import { FaBell, FaInfoCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { routes } from "@/app/routes/routes";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { MdCancel, MdSave } from "react-icons/md";
import { FiAlertTriangle, FiSave } from "react-icons/fi";

export default function NotificationSettings() {
  const { user, role, loading: authLoading } = useAuth();
  // Auth check: show loading spinner or redirect to login if not authenticated
  const router = useRouter();
  useEffect(() => {
    // Only redirect if context is hydrated and user/role are missing
    if (!authLoading && (!role || !user)) {
      router.push(routes.login);
    }
  }, [authLoading, role, user, router]);
  if (authLoading || !user) {
    return (
      <section className="text-white font-poppins w-full min-h-screen flex items-center justify-center">
        <span style={{ color: "#facc15", fontSize: 24 }}>Loading...</span>
      </section>
    );
  }
  // --- Offline/Cache State ---
  const [isOnline, setIsOnline] = useState(true);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const cacheKey = "notification_settings_cache";
  // --- Notification Settings State ---
  // Use settings from API hook
  // Use userId from context
  const userId = user?.user_id || user?.id || null;
  const [userError, setUserError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  // New states for toggle confirmation
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<{
    type: "lowStock" | "expiration" | "transfer";
    value: boolean;
  } | null>(null);

  // Helper to compare settings
  const isSettingsChanged = () => {
    if (!settings) return false;
    return (
      settings.low_stock_enabled !== lowStockEnabled ||
      JSON.stringify(settings.low_stock_method) !==
        JSON.stringify(lowStockMethod) ||
      settings.expiration_enabled !== expirationEnabled ||
      settings.expiration_days !== expirationDays ||
      JSON.stringify(settings.expiration_method) !==
        JSON.stringify(expirationMethod) ||
      settings.transfer_enabled !== transferEnabled ||
      JSON.stringify(settings.transfer_method) !==
        JSON.stringify(transferMethod)
    );
  };
  // Intercept navigation to settings (side nav or cancel)
  const handleCancel = () => {
    if (isSettingsChanged()) {
      setShowUnsavedModal(true);
      setPendingRoute(routes.settings);
    } else {
      setShowCancelModal(true);
    }
  };
  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    router.push(routes.settings);
  };

  // Confirm navigation with unsaved changes
  const handleConfirmUnsaved = () => {
    setShowUnsavedModal(false);
    if (pendingRoute) {
      router.push(pendingRoute);
      setPendingRoute(null);
    }
  };
  const handleCancelUnsaved = () => {
    setShowUnsavedModal(false);
    setPendingRoute(null);
  };

  const handleToggleRequest = (
    type: "lowStock" | "expiration" | "transfer",
    value: boolean
  ) => {
    setPendingToggle({ type, value });
    setShowToggleModal(true);
  };

  const handleSave = () => setShowSaveModal(true);
  const handleConfirmSave = async () => {
    setShowSaveModal(false);
    setSaving(true);
    if (!userId) {
      alert(userError || "User not loaded. Please wait.");
      setSaving(false);
      return;
    }
    const newSettings = {
      user_id: Number(userId),
      low_stock_enabled: lowStockEnabled,
      low_stock_method: lowStockMethod,
      expiration_enabled: expirationEnabled,
      expiration_days: expirationDays,
      expiration_method: expirationMethod,
      transfer_enabled: transferEnabled,
      transfer_method: transferMethod,
    };

    const ok = await updateSettings(newSettings);
    setSaving(false);
    if (ok) {
      // Clear cache after saving
      if (typeof window !== "undefined") {
        localStorage.removeItem(cacheKey);
      }
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 2000);
      // Refetch settings from backend after save
      fetchSettings();
      router.push(routes.settings);
    } else {
      alert("Failed to save notification settings");
    }
  };
  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const {
    settings,
    fetchSettings,
    updateSettings,
    loading: settingsLoading,
  } = useNotificationSettingsAPI(userId as number);

  useEffect(() => {
    console.log("[NotificationSettings] userId:", userId);
  }, [userId]);

  useEffect(() => {
    console.log("[NotificationSettings] fetched settings:", settings);
  }, [settings]);

  // Add local state for settings to allow setSettings usage
  const [localSettings, setSettings] = useState(settings);

  // Keep localSettings in sync with API settings
  useEffect(() => {
    setSettings(settings);
  }, [settings]);

  // Fetch notification settings with offline/cache logic
  useEffect(() => {
    setUserError(null);
    setOfflineError(null);
    if (!isOnline) {
      // Try to load from cache
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const data = JSON.parse(cached);
            if (data.settings) setSettings(data.settings);
            setOfflineError(null);
            return;
          } catch {}
        }
      }
      setOfflineError(
        "You are offline and no cached notification settings are available. Please connect to the internet to view or edit notification settings."
      );
      return;
    }
    // If no userId, show error
    if (!userId) {
      setUserError("No user ID found. Please log in.");
      return;
    }
    // Always fetch latest settings from backend when online
    fetchSettings();
  }, [isOnline, userId, fetchSettings]);

  // Cache notification settings on change (when online)
  useEffect(() => {
    if (isOnline && userId && settings) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            userId,
            settings,
          })
        );
      }
    }
  }, [isOnline, userId, settings]);
  // Sync UI state with backend settings from API hook
  useEffect(() => {
    if (localSettings) {
      setLowStockEnabled(Boolean(localSettings.low_stock_enabled));
      setExpirationDays(Number(localSettings.expiration_days));
      setLowStockMethod(
        Array.isArray(localSettings.low_stock_method)
          ? localSettings.low_stock_method
          : [localSettings.low_stock_method]
      );
      setExpirationEnabled(Boolean(localSettings.expiration_enabled));
      setExpirationMethod(
        Array.isArray(localSettings.expiration_method)
          ? localSettings.expiration_method
          : [localSettings.expiration_method]
      );
      setTransferEnabled(Boolean(localSettings.transfer_enabled ?? true));
      setTransferMethod(
        Array.isArray(localSettings.transfer_method)
          ? localSettings.transfer_method
          : [localSettings.transfer_method || "inapp"]
      );
    }
  }, [localSettings]);

  // UI state for toggles and methods
  const [lowStockEnabled, setLowStockEnabled] = useState(true);
  const [lowStockMethod, setLowStockMethod] = useState<string[]>(["inapp"]);
  const [expirationEnabled, setExpirationEnabled] = useState(true);
  const [expirationDays, setExpirationDays] = useState(3);
  const [expirationMethod, setExpirationMethod] = useState<string[]>(["inapp"]);
  const [transferEnabled, setTransferEnabled] = useState(true);
  const [transferMethod, setTransferMethod] = useState<string[]>(["inapp"]);

  const handleConfirmToggle = () => {
    if (!pendingToggle) return;
    if (pendingToggle.type === "lowStock")
      setLowStockEnabled(pendingToggle.value);
    if (pendingToggle.type === "expiration")
      setExpirationEnabled(pendingToggle.value);
    if (pendingToggle.type === "transfer")
      setTransferEnabled(pendingToggle.value);
    setShowToggleModal(false);
    setPendingToggle(null);
  };
  const handleCancelToggle = () => {
    setShowToggleModal(false);
    setPendingToggle(null);
  };

  const handleSidebarNavigate = (path: string) => {
    if (isSettingsChanged()) {
      setShowUnsavedModal(true);
      setPendingRoute(path);
      return false;
    }
    return true;
  };

  if (offlineError) {
    return (
      <section className="text-white font-poppins w-full min-h-screen">
        <NavigationBar onNavigate={handleSidebarNavigate} />
        <ResponsiveMain>
          <main className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="text-red-400 font-bold text-lg">
                {offlineError}
              </div>
              <button
                className="mt-4 px-6 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </main>
        </ResponsiveMain>
      </section>
    );
  }

  return (
    <section className="text-white font-poppins">
      <NavigationBar
        onNavigate={handleSidebarNavigate}
        showCancelModal={showCancelModal}
        showSaveModal={showSaveModal}
        showToggleModal={showToggleModal}
        showUnsavedModal={showUnsavedModal}
      />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Notification Settings main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            <article className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-xl xs:rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full">
              <header className="flex flex-col space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 xs:gap-3 sm:gap-4 md:gap-6">
                  <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                      <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-1.5 xs:p-2 sm:p-3 rounded-full">
                        <FaBell className="text-black text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                        Notification Settings
                      </h1>
                      <p className="text-gray-400 text-xs xs:text-sm sm:text-base mt-0.5 xs:mt-1">
                        Manage your notification preferences
                      </p>
                    </div>
                  </div>
                  <nav
                    aria-label="Notification actions"
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start"
                  >
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="group flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base w-full sm:w-auto shadow-lg hover:shadow-yellow-400/25 order-1"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">Saving...</span>
                          <span className="sm:hidden">Save</span>
                        </>
                      ) : (
                        <>
                          <MdSave className="material-icons w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                          <span className="hidden sm:inline">Save</span>
                          <span className="sm:hidden">Save</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="group flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 cursor-pointer text-sm sm:text-base w-full sm:w-auto order-2"
                    >
                      <MdCancel className="material-icons w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-300" />
                      <span className="hidden sm:inline">Cancel</span>
                      <span className="sm:hidden">Cancel</span>
                    </button>
                  </nav>
                </div>
              </header>

              <div className="relative mb-3 xs:mb-4 sm:mb-6 md:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-2 xs:px-3 sm:px-4 text-yellow-400/70 text-xs xs:text-sm">
                    Notification Preferences
                  </span>
                </div>
              </div>

              <form className="flex flex-col gap-10 flex-1 justify-center">
                {/* Stock Alert */}
                <section
                  className={`bg-gradient-to-br from-[#151a23] to-[#1a2030] rounded-xl xs:rounded-2xl p-4 xs:p-6 sm:p-8 flex flex-col gap-6 shadow-lg w-full border border-yellow-500/20 ${
                    !lowStockEnabled ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 p-3 rounded-lg">
                        <svg
                          className="w-6 h-6 text-yellow-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-yellow-400">
                        Stock Alert
                      </h3>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lowStockEnabled}
                        onChange={() =>
                          handleToggleRequest("lowStock", !lowStockEnabled)
                        }
                        className="sr-only"
                      />
                      <span
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                          lowStockEnabled ? "bg-yellow-400" : "bg-gray-700"
                        }`}
                      >
                        <span
                          className={`bg-white w-5 h-5 rounded-full shadow-md transform transition ${
                            lowStockEnabled ? "translate-x-6" : ""
                          }`}
                        />
                      </span>
                      <span className="ml-2 text-base font-semibold text-yellow-400">
                        {lowStockEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                  </div>
                  <p className="text-gray-300 text-base mb-2">
                    Get notified about all stock level issues
                  </p>

                  {/* Alert Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Out of Stock */}
                    <div className="bg-gradient-to-br from-[#1a2030] to-[#0f1419] rounded-lg p-5 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 p-2.5 rounded-lg flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm mb-1">
                            Out of Stock
                          </h4>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Items completely depleted (0 quantity)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Critical Stock */}
                    <div className="bg-gradient-to-br from-[#1a2030] to-[#0f1419] rounded-lg p-5 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 p-2.5 rounded-lg flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm mb-1">
                            Critical Stock
                          </h4>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Items at or below 50% of threshold
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Low Stock */}
                    <div className="bg-gradient-to-br from-[#1a2030] to-[#0f1419] rounded-lg p-5 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-2.5 rounded-lg flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-orange-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm mb-1">
                            Low Stock
                          </h4>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Items between 50-100% of threshold
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Expiration Alert */}
                <section
                  className={`bg-gradient-to-br from-[#151a23] to-[#1a2030] rounded-xl xs:rounded-2xl p-4 xs:p-6 sm:p-8 flex flex-col gap-6 shadow-lg w-full border border-yellow-500/20 ${
                    !expirationEnabled ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 p-3 rounded-lg">
                        <svg
                          className="w-6 h-6 text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-red-400">
                        Expiration Alert
                      </h3>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={expirationEnabled}
                        onChange={() =>
                          handleToggleRequest("expiration", !expirationEnabled)
                        }
                        className="sr-only"
                      />
                      <span
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                          expirationEnabled ? "bg-red-400" : "bg-gray-700"
                        }`}
                      >
                        <span
                          className={`bg-white w-5 h-5 rounded-full shadow-md transform transition ${
                            expirationEnabled ? "translate-x-6" : ""
                          }`}
                        />
                      </span>
                      <span className="ml-2 text-base font-semibold text-red-400">
                        {expirationEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                  </div>
                  <p className="text-gray-300 text-base mb-2">
                    Get notified{" "}
                    <span className="font-semibold text-red-400">
                      {expirationDays}
                    </span>{" "}
                    day(s) before items expire
                  </p>

                  {/* Expiration Settings Card */}
                  <div className="bg-gradient-to-br from-[#1a2030] to-[#0f1419] rounded-lg p-6 border border-yellow-500/30">
                    <div className="flex flex-col gap-5">
                      {/* Days Input Section */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-2.5 rounded-lg flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <label
                              htmlFor="expirationDays"
                              className="text-white font-semibold text-sm mb-1 block"
                            >
                              Notification Window
                            </label>
                            <p className="text-gray-400 text-xs">
                              Days before expiration
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            id="expirationDays"
                            type="number"
                            min={1}
                            max={365}
                            value={expirationDays}
                            onChange={(e) =>
                              setExpirationDays(Number(e.target.value))
                            }
                            className="w-20 bg-gray-800 text-white text-center rounded-lg px-3 py-2.5 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none text-base font-semibold transition-colors"
                            disabled={!expirationEnabled}
                          />
                          <span className="text-gray-400 text-sm font-medium">
                            days
                          </span>
                        </div>
                      </div>

                      {/* Info Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-700/50">
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div>
                            <p className="text-white text-xs font-medium">
                              Prevent Waste
                            </p>
                            <p className="text-gray-400 text-xs">
                              Use items before expiry
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div>
                            <p className="text-white text-xs font-medium">
                              Stay Informed
                            </p>
                            <p className="text-gray-400 text-xs">
                              Track expiration dates
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Transfer Notifications */}
                <section
                  className={`bg-gradient-to-br from-[#151a23] to-[#1a2030] rounded-xl xs:rounded-2xl p-4 xs:p-6 sm:p-8 flex flex-col gap-6 shadow-lg w-full border border-blue-500/20 ${
                    !transferEnabled ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-3 rounded-lg">
                        <svg
                          className="w-6 h-6 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-blue-400">
                        Transfer Notifications
                      </h3>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transferEnabled}
                        onChange={() =>
                          handleToggleRequest("transfer", !transferEnabled)
                        }
                        className="sr-only"
                      />
                      <span
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                          transferEnabled ? "bg-blue-400" : "bg-gray-700"
                        }`}
                      >
                        <span
                          className={`bg-white w-5 h-5 rounded-full shadow-md transform transition ${
                            transferEnabled ? "translate-x-6" : ""
                          }`}
                        />
                      </span>
                      <span className="ml-2 text-base font-semibold text-blue-400">
                        {transferEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                  </div>
                  <p className="text-gray-300 text-base mb-2">
                    Get notified when automatic inventory transfers occur
                  </p>

                  {/* Transfer Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* Today's Inventory Card */}
                    <div className="bg-gradient-to-br from-[#1a2030] to-[#0f1419] rounded-lg p-5 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 p-2.5 rounded-lg flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm mb-1">
                            Today's Inventory
                          </h4>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Transfer from surplus to today's stock
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700/50">
                        <svg
                          className="w-4 h-4 text-emerald-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-emerald-400 text-xs font-medium">
                          6:00 AM Daily
                        </span>
                      </div>
                    </div>

                    {/* Master Inventory Card */}
                    <div className="bg-gradient-to-br from-[#1a2030] to-[#0f1419] rounded-lg p-5 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-2.5 rounded-lg flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm mb-1">
                            Master Inventory
                          </h4>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Transfer top selling items to stock
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700/50">
                        <svg
                          className="w-4 h-4 text-purple-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-purple-400 text-xs font-medium">
                          6:00 AM Daily
                        </span>
                      </div>
                    </div>

                    {/* Surplus Inventory Card */}
                    <div className="bg-gradient-to-br from-[#1a2030] to-[#0f1419] rounded-lg p-5 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 md:col-span-2 xl:col-span-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 p-2.5 rounded-lg flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-amber-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm mb-1">
                            Surplus Inventory
                          </h4>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Transfer unsold items to surplus
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700/50">
                        <svg
                          className="w-4 h-4 text-amber-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-amber-400 text-xs font-medium">
                          10:00 PM Daily
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </form>
            </article>
          </div>
        </main>
        {/* Success Message */}
        {saveMessage && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <div className="flex items-center gap-2 xs:gap-3">
              <span className="font-medium xs:font-semibold text-xs xs:text-sm sm:text-base leading-tight">
                {saveMessage}
              </span>
            </div>
          </div>
        )}

        {/* Save Confirmation Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl text-center space-y-8 max-w-md w-full border border-gray-700/50">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-full flex items-center justify-center">
                <FiSave className="w-8 h-8 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-400 font-poppins">
                Save Confirmation
              </h2>
              <p className="text-gray-300">
                Are you sure you want to save the changes?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleConfirmSave}
                  className="px-8 py-3 rounded-lg border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-semibold transition-all cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-8 py-3 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-semibold transition-all cursor-pointer"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl text-center space-y-8 max-w-md w-full border border-gray-700/50">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-red-400/20 to-red-500/20 rounded-full flex items-center justify-center">
                <MdCancel className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-400 font-poppins">
                Cancel Confirmation
              </h2>
              <p className="text-gray-300">Are you sure you want to cancel?</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleConfirmCancel}
                  className="px-8 py-3 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-semibold transition-all cursor-pointer"
                >
                  Yes, Cancel
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-8 py-3 rounded-lg border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-semibold transition-all cursor-pointer"
                >
                  No, Go Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unsaved Changes Modal */}
        {showUnsavedModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl text-center space-y-8 max-w-md w-full border border-gray-700/50">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-orange-400/20 to-orange-500/20 rounded-full flex items-center justify-center">
                <FiAlertTriangle className="w-8 h-8 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-400 font-poppins">
                Unsaved Changes
              </h2>
              <p className="text-gray-300">
                You have unsaved changes. Are you sure you want to leave without
                saving?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleConfirmUnsaved}
                  className="px-8 py-3 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-semibold transition-all order-2 sm:order-1 cursor-pointer"
                >
                  Leave Without Saving
                </button>
                <button
                  onClick={handleCancelUnsaved}
                  className="px-8 py-3 rounded-lg border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-semibold transition-all order-1 sm:order-2 cursor-pointer"
                >
                  Stay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Confirmation Modal */}
        {showToggleModal && pendingToggle && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl text-center space-y-8 max-w-md w-full border border-gray-700/50">
              <h2 className="text-2xl font-bold text-yellow-400 font-poppins">
                {pendingToggle.value ? "Enable" : "Disable"} Confirmation
              </h2>
              <p className="text-gray-300">
                Are you sure you want to{" "}
                {pendingToggle.value ? "enable" : "disable"}{" "}
                {pendingToggle.type === "lowStock"
                  ? "Low Stock Alert"
                  : pendingToggle.type === "expiration"
                  ? "Expiration Alert"
                  : "Restocking Alert"}
                ?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleConfirmToggle}
                  className="px-8 py-3 rounded-lg border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-semibold transition-all order-2 sm:order-1 cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={handleCancelToggle}
                  className="px-8 py-3 rounded-lg border border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white font-semibold transition-all order-1 sm:order-2 cursor-pointer"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
}
