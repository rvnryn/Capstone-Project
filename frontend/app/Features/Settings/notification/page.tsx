"use client";

import { useEffect, useState } from "react";
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
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
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
    type: "lowStock" | "expiration";
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
        JSON.stringify(expirationMethod)
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
    type: "lowStock" | "expiration",
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
      user_id: userId,
      low_stock_enabled: lowStockEnabled,
      low_stock_method: lowStockMethod,
      expiration_enabled: expirationEnabled,
      expiration_days: expirationDays,
      expiration_method: expirationMethod,
    };

    const ok = await updateSettings(newSettings);
    setSaving(false);
    if (ok) {
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 2000);
      router.push(routes.settings);
    } else {
      alert("Failed to save notification settings");
    }
  };
  useEffect(() => {
    async function fetchUserId() {
      console.log("fetchUserId called");
      setUserError(null);
      const session = await supabase.auth.getSession();
      console.log("Session result:", session);
      if (!session.data.session) {
        setUserError("No session found. Please log in.");
        router.push(routes.login); // Redirect to login page
        return;
      }
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      console.log("Supabase getUser result:", user, authError);
      if (authError) {
        console.error("Supabase Auth error:", authError);
        setUserError("Failed to fetch user from Supabase Auth.");
        setUserId(null);
        return;
      }
      if (user?.id) {
        // Query users table for numeric id
        const { data, error } = await supabase
          .from("users")
          .select("user_id")
          .eq("auth_id", user.id)
          .single();
        if (!error && data && data.user_id) {
          setUserId(data.user_id);
        } else {
          // Auto-create user if not found
          const insertRes = await supabase
            .from("users")
            .insert([
              {
                auth_id: user.id,
                name:
                  user.user_metadata?.full_name ||
                  user.user_metadata?.display_name ||
                  user.email ||
                  "Unknown",
                username:
                  user.user_metadata?.user_name ||
                  user.user_metadata?.username ||
                  user.email ||
                  "user" + Math.floor(Math.random() * 100000),
                email: user.email || null,
                user_role: "User",
                status: "active",
                created_at: new Date().toISOString(),
              },
            ])
            .select("user_id")
            .single();
          if (!insertRes.error && insertRes.data && insertRes.data.user_id) {
            setUserId(insertRes.data.user_id);
          } else {
            console.error("User insert error:", insertRes.error, insertRes);
            setUserError(
              "Failed to create user in users table. Please contact support."
            );
            setUserId(null);
          }
        }
      } else {
        setUserError("No authenticated user found. Please log in again.");
        setUserId(null);
      }
    }
    fetchUserId();
  }, []);
  const { settings, fetchSettings, updateSettings, loading } =
    useNotificationSettingsAPI(userId as number);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (userId) {
      fetchSettings();
    }
  }, [userId, fetchSettings]);

  // Sync UI state with backend settings
  useEffect(() => {
    if (settings) {
      setLowStockEnabled(settings.low_stock_enabled);
      setLowStockMethod(settings.low_stock_method);
      setExpirationEnabled(settings.expiration_enabled);
      setExpirationDays(settings.expiration_days);
      setExpirationMethod(settings.expiration_method);
    }
  }, [settings]);

  // UI state for toggles and methods
  const [lowStockEnabled, setLowStockEnabled] = useState(true);
  const [lowStockMethod, setLowStockMethod] = useState<string[]>(["inapp"]);
  const [expirationEnabled, setExpirationEnabled] = useState(true);
  const [expirationDays, setExpirationDays] = useState(3);
  const [expirationMethod, setExpirationMethod] = useState<string[]>(["inapp"]);

  const handleConfirmToggle = () => {
    if (!pendingToggle) return;
    if (pendingToggle.type === "lowStock")
      setLowStockEnabled(pendingToggle.value);
    if (pendingToggle.type === "expiration")
      setExpirationEnabled(pendingToggle.value);
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
                {/* Low Stock Alert */}
                <section
                  className={`bg-[#151a23] rounded-xl xs:rounded-2xl p-4 xs:p-6 sm:p-8 flex flex-col gap-6 shadow-lg w-full ${
                    !lowStockEnabled ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-yellow-400">
                      Low Stock Alert
                    </h3>
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
                    Get notified when ingredients or supplies are running low so
                    you can reorder before you run out.
                  </p>
                  <div className="mt-2">
                    <span className="text-yellow-400 text-sm">
                      Tip: Enable both Email and In-App notifications for
                      maximum awareness.
                    </span>
                  </div>
                </section>

                {/* Expiration Alert */}
                <section
                  className={`bg-[#151a23] rounded-xl xs:rounded-2xl p-4 xs:p-6 sm:p-8 flex flex-col gap-6 shadow-lg w-full ${
                    !expirationEnabled ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-yellow-400">
                      Expiration Alert
                    </h3>
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
                          expirationEnabled ? "bg-yellow-400" : "bg-gray-700"
                        }`}
                      >
                        <span
                          className={`bg-white w-5 h-5 rounded-full shadow-md transform transition ${
                            expirationEnabled ? "translate-x-6" : ""
                          }`}
                        />
                      </span>
                      <span className="ml-2 text-base font-semibold text-yellow-400">
                        {expirationEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                  </div>
                  <p className="text-gray-300 text-base mb-2">
                    Get notified{" "}
                    <span className="font-semibold text-yellow-400">
                      {expirationDays}
                    </span>{" "}
                    day(s) before ingredients or products expire, so you can use
                    or replace them in time.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <label
                      htmlFor="expirationDays"
                      className="text-gray-200 text-base"
                    >
                      Days before expiration:
                    </label>
                    <input
                      id="expirationDays"
                      type="number"
                      min={1}
                      max={365}
                      value={expirationDays}
                      onChange={(e) =>
                        setExpirationDays(Number(e.target.value))
                      }
                      className="w-24 bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-yellow-400 text-base"
                      disabled={!expirationEnabled}
                    />
                    <span className="text-gray-400 text-sm">
                      (Set how many days in advance you want to be notified)
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-yellow-400 text-sm">
                      Tip: Enable both Email and In-App notifications for
                      maximum awareness.
                    </span>
                  </div>
                </section>
              </form>
            </article>
          </div>
        </main>
        {saveMessage && (
          <div
            className="mt-8 text-green-400 text-center font-semibold animate-fade-in"
            role="status"
          >
            {saveMessage}
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
