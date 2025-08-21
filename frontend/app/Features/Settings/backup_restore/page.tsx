/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import NavigationBar from "@/app/components/navigation/navigation";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import { FaDatabase } from "react-icons/fa";
import { useRef, useState, useRef as useReactRef } from "react";
import CryptoJS from "crypto-js";
import { useBackupRestoreAPI } from "./hook/use-BackupRestoreAPI";
import { supabase } from "@/app/utils/Server/supabaseClient";
import { useRouter } from "next/navigation";
import { routes } from "@/app/routes/routes";
import { FaEyeSlash, FaEye } from "react-icons/fa";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { FaGoogleDrive, FaDownload } from "react-icons/fa";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/app/context/AuthContext";
import { MdCancel, MdSave } from "react-icons/md";
import { FiAlertTriangle, FiSave } from "react-icons/fi";

// Extend Window type to include __backupPassword, gapi, and google
declare global {
  interface Window {
    __backupPassword?: string;
    gapi?: any;
    google?: any;
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const GoogleDriveIntegration = ({
  onSuccess,
  backingUp,
}: {
  onSuccess: (tr: any) => void;
  backingUp: boolean;
}) => {
  const login = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/drive.file",
    onSuccess,
    onError: console.error,
  });

  return (
    <button
      disabled={backingUp}
      onClick={() => login()}
      className={`w-full flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all duration-200 ${
        backingUp
          ? "bg-blue-400/50 cursor-not-allowed text-blue-200 border-2 border-blue-400/50"
          : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white border-2 border-blue-500/70 hover:border-blue-400/70"
      }`}
      type="button"
    >
      <FaGoogleDrive />
      {backingUp ? "Uploading..." : "Backup to Google Drive"}
    </button>
  );
};

export default function BackupRestorePage() {
  // State to hold Google Drive access token for restore
  const [gDriveAccessToken, setGDriveAccessToken] = useState<string | null>(
    null
  );
  if (!CLIENT_ID) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center bg-black text-yellow-400 font-bold text-2xl p-8">
        <FaGoogleDrive className="text-5xl mb-4" />
        Google OAuth Error: NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.
        <br />
        Please set it in your .env.local and restart the server.
      </section>
    );
  }

  const { backup, restore, backupToDrive, restoreFromDrive } =
    useBackupRestoreAPI();
  const router = useRouter();
  // Unsaved changes modal state
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  // Declare all settings state variables BEFORE using them
  const [autoBackup, setAutoBackup] = useState(false);
  const [frequency, setFrequency] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");

  // Track initial settings for change detection
  const initialSettingsRef = useReactRef<any>(null);
  const [initialSettingsSet, setInitialSettingsSet] = useState(false);

  // Remove useGoogleLogin from here. Instead, handle Google Drive backup inside GoogleDriveIntegration below.
  // Load settings from localStorage on first render
  if (!initialSettingsSet) {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("backupRestoreSettings")
        : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAutoBackup(!!parsed.autoBackup);
        setFrequency(parsed.frequency || "");
        setDayOfWeek(parsed.dayOfWeek || "");
        setDayOfMonth(parsed.dayOfMonth || "");
        setTimeOfDay(parsed.timeOfDay || "");
        initialSettingsRef.current = {
          autoBackup: !!parsed.autoBackup,
          frequency: parsed.frequency || "",
          dayOfWeek: parsed.dayOfWeek || "",
          dayOfMonth: parsed.dayOfMonth || "",
          timeOfDay: parsed.timeOfDay || "",
        };
      } catch {
        initialSettingsRef.current = {
          autoBackup,
          frequency,
          dayOfWeek,
          dayOfMonth,
          timeOfDay,
        };
      }
    } else {
      initialSettingsRef.current = {
        autoBackup,
        frequency,
        dayOfWeek,
        dayOfMonth,
        timeOfDay,
      };
    }
    setInitialSettingsSet(true);
  }

  const { isMenuOpen, isMobile } = useNavigation();
  // Removed selectedBackup, not used in new restore logic
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [loading] = useState(false); // Simulate loading if needed
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreFileName, setRestoreFileName] = useState("");
  const [restoreError, setRestoreError] = useState("");
  // Password modal state
  // Restore flow state
  const [showRestoreSourceModal, setShowRestoreSourceModal] = useState(false);
  const [restoreSource, setRestoreSource] = useState<null | "local" | "gdrive">(
    null
  );
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(
    null
  );
  const [pendingGDriveFileId, setPendingGDriveFileId] = useState<string | null>(
    null
  );
  // Boolean for password modal visibility
  const [showPasswordModalType, setShowPasswordModalType] = useState<
    null | "backup" | "restore" | "history-restore"
  >(null);
  const showPasswordModal = !!showPasswordModalType;
  const [passwordInput, setPasswordInput] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);
  // Search/filter state for backup history
  const [historySearch, setHistorySearch] = useState("");
  const [historyDate, setHistoryDate] = useState("");
  // Fetch backup history from Supabase
  const fetchBackupHistory = async (search = "", date = "") => {
    let query = supabase
      .from("backup_history")
      .select("id, created_at, description, encrypted_data, size")
      .order("created_at", { ascending: false });
    if (search) {
      query = query.ilike("description", `%${search}%`);
    }
    if (date) {
      query = query
        .gte("created_at", date + "T00:00:00")
        .lte("created_at", date + "T23:59:59");
    }
    const { data, error } = await query;
    if (!error) setBackupHistory(data || []);
  };

  // Helper to check if settings have changed
  const isSettingsChanged = () => {
    if (!initialSettingsRef.current) return false;
    return (
      initialSettingsRef.current.autoBackup !== autoBackup ||
      initialSettingsRef.current.frequency !== frequency ||
      initialSettingsRef.current.dayOfWeek !== dayOfWeek ||
      initialSettingsRef.current.dayOfMonth !== dayOfMonth ||
      initialSettingsRef.current.timeOfDay !== timeOfDay
    );
  };

  const handleSidebarNavigate = (route: string) => {
    if (isSettingsChanged()) {
      setShowUnsavedModal(true);
      setPendingRoute(route);
      return false;
    }
    return true;
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

  // Open backup history modal
  const handleShowHistory = async () => {
    setHistorySearch("");
    setHistoryDate("");
    await fetchBackupHistory();
    setShowHistoryModal(true);
  };

  // Handle search/filter
  const handleHistorySearch = async () => {
    await fetchBackupHistory(historySearch, historyDate);
  };

  const handleClearHistoryFilters = async () => {
    setHistorySearch("");
    setHistoryDate("");
    await fetchBackupHistory();
  };

  // When user selects a backup from history to restore
  const handleHistoryRestore = (history: any) => {
    setSelectedHistory(history);
    setPasswordInput("");
    setShowPasswordModalType("history-restore");
  };

  // Restore from backup history (after password entered)
  const doHistoryRestoreWithPassword = async (
    password: string,
    history: any
  ) => {
    setIsRestoring(true);
    setRestoreFileName(`History: ${history.description || history.id}`);
    setRestoreError("");
    try {
      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(history.encrypted_data, password);
      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedStr) {
        setIsRestoring(false);
        setRestoreError("Incorrect password or corrupted backup file.");
        return;
      }
      const json = JSON.parse(decryptedStr);
      // Restore settings
      if (json.settings) {
        setAutoBackup(!!json.settings.autoBackup);
        setFrequency(json.settings.frequency || "");
        setDayOfWeek(json.settings.dayOfWeek || "");
        setDayOfMonth(json.settings.dayOfMonth || "");
        setTimeOfDay(json.settings.timeOfDay || "");
      }
      // Restore all tables
      const tables = [
        "backup_history",
        "food_trend_ingredients",
        "food_trend_menu",
        "food_trends",
        "ingredients",
        "inventory",
        "inventory_log",
        "inventory_settings",
        "inventory_surplus",
        "inventory_today",
        "menu",
        "menu_ingredients",
        "notification",
        "notification_settings",
        "order_items",
        "orders",
        "past_inventory_log",
        "past_order_items",
        "past_user_activity_log",
        "suppliers",
        "user_activity_log",
        "users",
      ];
      const restoreErrors = [];
      for (const table of tables) {
        if (Array.isArray(json[table]) && json[table].length > 0) {
          const { error } = await supabase
            .from(table)
            .upsert(json[table], { onConflict: undefined });
          if (error) restoreErrors.push(`${table}: ${error.message}`);
        }
      }
      setIsRestoring(false);
      if (restoreErrors.length > 0) {
        setRestoreError(
          "Some tables failed to restore: " + restoreErrors.join(", ")
        );
      } else {
        setRestoreMsg("Restore successful!");
        setTimeout(() => setRestoreMsg(""), 2000);
      }
    } catch {
      setIsRestoring(false);
      setRestoreError(
        "Invalid backup file or decryption failed. Please select a valid encrypted backup and enter the correct password."
      );
    }
    setShowHistoryModal(false);
    setSelectedHistory(null);
  };
  const [showPopup, setShowBackupChoiceModal] = useState(false);
  const [backupResultMsg, setBackupResultMsg] = useState("");
  const [backupPassword, setBackupPassword] = useState<string>("");

  // Start backup: ask for password
  const handleBackup = () => {
    setShowPasswordModalType("backup");
  };

  // Called when user submits password for backup
  const doBackupWithPassword = async (password: string) => {
    setShowPasswordModalType(null);
    setBackupPassword(password);
    setShowBackupChoiceModal(true);
  };

  // Local backup: download file
  const handleLocalBackup = async () => {
    setShowBackupChoiceModal(false);
    setIsBackingUp(true);
    try {
      // Pass password to backup function
      await backup(backupPassword);
      setBackupResultMsg("Backup downloaded successfully!");
      setTimeout(() => setBackupResultMsg(""), 4000);
    } catch (err: any) {
      setBackupResultMsg(
        "Local backup failed: " + (err?.message || String(err))
      );
      setTimeout(() => setBackupResultMsg(""), 4000);
    }
    setIsBackingUp(false);
    setBackupPassword("");
  };

  // Real restore: upload a JSON file
  // New restore handler: ask for source first
  const handleRestore = () => {
    setRestoreError("");
    setShowRestoreSourceModal(true);
  };

  // Local file selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setPendingRestoreFile(file);
    setShowRestoreSourceModal(false);
    setPasswordInput("");
    setShowPasswordModalType("restore");
  };

  // Google Drive file selected (fileId from Picker)
  const handleGDriveFileSelect = async (fileId: string) => {
    setPendingGDriveFileId(fileId);
    setShowRestoreSourceModal(false);
    setPasswordInput("");
    setShowPasswordModalType("restore");
  };

  // Google Picker integration for restore
  const openGoogleDrivePicker = async () => {
    try {
      // Load Picker API if not loaded
      if (!window.google || !window.google.picker) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://apis.google.com/js/api.js";
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
        await new Promise((resolve) => {
          if (window.gapi) {
            window.gapi.load("picker", resolve);
          } else {
            resolve(undefined);
          }
        });
      }

      // Use Google Identity Services for OAuth
      if (
        !window.google ||
        !window.google.accounts ||
        !window.google.accounts.oauth2
      ) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // Get OAuth token using GIS
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "https://www.googleapis.com/auth/drive.readonly",
        callback: (tokenResponse: any) => {
          if (!tokenResponse || !tokenResponse.access_token) {
            setRestoreError("Google authentication failed. Please try again.");
            return;
          }
          const oauthToken = tokenResponse.access_token;
          setGDriveAccessToken(oauthToken); // <-- Save token for later
          // Build Picker
          const picker = new window.google.picker.PickerBuilder()
            .addView(window.google.picker.ViewId.DOCS)
            .setOAuthToken(oauthToken)
            .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
            .setCallback((data: any) => {
              if (data.action === window.google.picker.Action.PICKED) {
                const fileId = data.docs[0].id;
                setPendingGDriveFileId(fileId);
                setGDriveAccessToken(oauthToken); // Ensure token is set
                setShowRestoreSourceModal(false);
                setPasswordInput("");
                setShowPasswordModalType("restore");
              } else if (data.action === window.google.picker.Action.CANCEL) {
                setRestoreError("Google Drive Picker cancelled.");
              } else if (data.action === window.google.picker.Action.ERROR) {
                setRestoreError(
                  "Google Drive Picker error. See console for details."
                );
                console.dir(data);
              }
            })
            .build();
          picker.setVisible(true);
        },
      });
      tokenClient.requestAccessToken();
    } catch (err: any) {
      let msg = "Google Picker error: ";
      if (err && err.message) {
        msg += err.message;
      } else if (typeof err === "string") {
        msg += err;
      } else {
        msg += "Unknown error.";
      }
      setRestoreError(msg);
      console.error("Google Picker error:", err);
    }
  };

  // Called when user submits password for restore
  const doRestoreWithPassword = async (password: string) => {
    setIsRestoring(true);
    setRestoreError("");
    try {
      if (restoreSource === "local" && pendingRestoreFile) {
        setRestoreFileName(pendingRestoreFile.name);
        // Only check JSON validity for plain .json files
        if (
          pendingRestoreFile.name.endsWith(".json") &&
          !pendingRestoreFile.name.endsWith(".json.enc")
        ) {
          const text = await pendingRestoreFile.text();
          try {
            JSON.parse(text);
          } catch {
            throw new Error("Backup file is not valid JSON.");
          }
        }
        await restore(password, pendingRestoreFile);
        setRestoreMsg("Restore successful!");
        setTimeout(() => setRestoreMsg(""), 2000);
      } else if (restoreSource === "gdrive" && pendingGDriveFileId) {
        // Call backend API to restore from Google Drive
        setRestoreFileName("Google Drive File: " + pendingGDriveFileId);
        if (!gDriveAccessToken) {
          setRestoreError(
            "Google Drive access token missing. Please re-authenticate."
          );
          setIsRestoring(false);
          return;
        }
        await restoreFromDrive(gDriveAccessToken, pendingGDriveFileId);
        setRestoreMsg("Restore from Google Drive successful!");
        setTimeout(() => setRestoreMsg(""), 2000);
      }
    } catch (err: any) {
      setRestoreError("Restore failed: " + (err?.message || String(err)));
    }
    setIsRestoring(false);
    setPendingRestoreFile(null);
    setPendingGDriveFileId(null);
    setRestoreSource(null);
  };

  const handleSave = () => setShowSaveModal(true);
  const handleCancel = () => setShowCancelModal(true);
  const handleConfirmSave = () => {
    setShowSaveModal(false);
    setSaveMessage("Settings saved successfully!");
    setTimeout(() => setSaveMessage(""), 2000);
    // Save settings to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "backupRestoreSettings",
        JSON.stringify({
          autoBackup,
          frequency,
          dayOfWeek,
          dayOfMonth,
          timeOfDay,
        })
      );
    }
    // Reset initial settings to current after save
    initialSettingsRef.current = {
      autoBackup,
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeOfDay,
    };
    router.push(routes.settings); // Redirect to settings page after save
  };
  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    // Reset all settings to initial values
    if (initialSettingsRef.current) {
      setAutoBackup(initialSettingsRef.current.autoBackup);
      setFrequency(initialSettingsRef.current.frequency);
      setDayOfWeek(initialSettingsRef.current.dayOfWeek);
      setDayOfMonth(initialSettingsRef.current.dayOfMonth);
      setTimeOfDay(initialSettingsRef.current.timeOfDay);
    }
    setRestoreMsg("");
    router.push(routes.settings); // Redirect to settings page
  };

  // Password modal for backup/restore
  const PasswordModal = ({
    mode,
    onSubmit,
    onCancel,
    loading,
    passwordInput,
    setPasswordInput,
  }: {
    mode: "backup" | "restore";
    onSubmit: (password: string) => void;
    onCancel: () => void;
    loading?: boolean;
    passwordInput: string;
    setPasswordInput: React.Dispatch<React.SetStateAction<string>>;
  }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl text-center space-y-8 max-w-md w-full border border-gray-700/50">
          <h2 className="text-2xl font-bold text-yellow-400 font-poppins">
            {mode === "backup"
              ? "Set Backup Password"
              : "Enter Backup Password"}
          </h2>
          <p className="text-gray-300">
            {mode === "backup"
              ? "Enter a password to encrypt your backup file."
              : "Enter the password to decrypt and restore your backup."}
          </p>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full px-4 py-2 rounded border border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-yellow-500"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 hover:text-yellow-300 cursor-pointer text-xl focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <button
              className="px-8 py-3 rounded-lg border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-semibold transition-all cursor-pointer"
              onClick={() => onSubmit(passwordInput)}
              disabled={loading || !passwordInput}
            >
              {mode === "backup" ? "Encrypt & Download" : "Decrypt & Restore"}
            </button>
            <button
              className="px-8 py-3 rounded-lg border border-gray-400 text-gray-400 hover:bg-gray-400 hover:text-black font-semibold transition-all cursor-pointer"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  function formatSize(bytes: number): string {
    if (!bytes || isNaN(bytes)) return "-";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <section className="text-white font-poppins">
        <NavigationBar
          onNavigate={handleSidebarNavigate}
          showSaveModal={showSaveModal}
          showCancelModal={showCancelModal}
          showUnsavedModal={showUnsavedModal}
          showPopup={showPopup}
          showRestoreSourceModal={showRestoreSourceModal}
          showPasswordModal={showPasswordModal}
          isBackingUp={isBackingUp}
          isRestoring={isRestoring}
          backupResultMsg={backupResultMsg}
        />
        <ResponsiveMain>
          <main
            className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
            aria-label="Backup & Restore main content"
            tabIndex={-1}
          >
            <div className="max-w-full xs:max-w-full sm:max-w-1xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto w-full">
              <article className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-xl xs:rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full">
                <header className="flex flex-col space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 xs:gap-3 sm:gap-4 md:gap-6">
                    <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                        <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-1.5 xs:p-2 sm:p-3 rounded-full">
                          <FaDatabase className="text-black text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl" />
                        </div>
                      </div>
                      <div>
                        <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                          Backup & Restore
                        </h1>
                        <p className="text-gray-400 text-xs xs:text-sm sm:text-base mt-0.5 xs:mt-1">
                          Manage your backup and restore settings, history, and
                          data recovery.
                        </p>
                      </div>
                    </div>
                    <nav
                      aria-label="Backup & Restore actions"
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start"
                    >
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isBackingUp || isRestoring}
                        className="group flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base w-full sm:w-auto shadow-lg hover:shadow-yellow-400/25 order-1"
                      >
                        {isBackingUp || isRestoring ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                            <span className="hidden sm:inline">Saving...</span>
                            <span className="sm:hidden">Save</span>
                          </>
                        ) : (
                          <>
                            <MdSave className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                            <span className="hidden sm:inline">
                              Save Changes
                            </span>
                            <span className="sm:hidden">Save</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="group flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 cursor-pointer text-sm sm:text-base w-full sm:w-auto order-2"
                      >
                        <MdCancel className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-300" />
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
                      Backup & Restore Settings
                    </span>
                  </div>
                </div>
                {/* Manual Backup */}
                <section className="mb-6 sm:mb-8" aria-label="Manual Backup">
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-lg font-semibold text-yellow-300 mb-1">
                      Manual Backup
                    </span>
                    <button
                      className={`bg-yellow-400 hover:bg-yellow-300 focus:ring-4 focus:ring-yellow-200 text-black px-6 py-2 rounded-lg font-semibold shadow transition-all duration-200 flex items-center gap-2 ${
                        isBackingUp ? "opacity-60 cursor-not-allowed" : ""
                      } outline-none`}
                      onClick={handleBackup}
                      disabled={isBackingUp}
                      title="Download a backup of your data now"
                      aria-label="Backup Now"
                    >
                      {isBackingUp ? (
                        <span
                          className="animate-spin h-5 w-5 border-2 border-t-2 border-yellow-600 border-t-white rounded-full"
                          aria-label="Backing up"
                        ></span>
                      ) : (
                        <span>Download Backup</span>
                      )}
                    </button>
                    <span className="text-yellow-200 text-xs ml-1">
                      Instantly download a backup of your current data as a JSON
                      file.
                    </span>
                  </div>
                </section>
                {/* Automatic Backup Settings */}
                <section
                  className="mb-6 sm:mb-8"
                  aria-label="Automatic Backup Settings"
                >
                  <span className="text-lg font-semibold text-yellow-300 mb-1 block">
                    Automatic Backup Settings
                  </span>
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl font-semibold text-white mr-4">
                      Set Automatic Backup
                    </h2>
                    <input
                      type="checkbox"
                      checked={autoBackup}
                      onChange={() => {
                        setAutoBackup((prev) => {
                          const newState = !prev;
                          if (!newState) {
                            setFrequency("");
                            setDayOfWeek("");
                            setDayOfMonth("");
                            setTimeOfDay("");
                          }
                          return newState;
                        });
                      }}
                      className="w-6 h-6 accent-yellow-400 border-2 border-yellow-400 rounded focus:ring-2 focus:ring-yellow-300 outline-none"
                      style={{ accentColor: "#FFD600" }}
                      title="Enable or disable automatic backups"
                      aria-label="Enable automatic backup"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 max-w-xl">
                    <div className="flex items-center">
                      <label
                        className="text-yellow-100 w-40"
                        htmlFor="frequency-select"
                      >
                        Backup Frequency:
                      </label>
                      <select
                        id="frequency-select"
                        className="bg-gray-800 text-white px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        disabled={!autoBackup}
                        aria-disabled={!autoBackup}
                      >
                        <option value="">-</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label
                        className="text-yellow-100 w-40"
                        htmlFor="dayofweek-select"
                      >
                        Day of Week:
                      </label>
                      <select
                        id="dayofweek-select"
                        className="bg-gray-800 text-white px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        value={dayOfWeek}
                        onChange={(e) => setDayOfWeek(e.target.value)}
                        disabled={!autoBackup || frequency !== "weekly"}
                        aria-disabled={!autoBackup || frequency !== "weekly"}
                      >
                        <option value="">-</option>
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label
                        className="text-yellow-100 w-40"
                        htmlFor="dayofmonth-select"
                      >
                        Day of Month:
                      </label>
                      <select
                        id="dayofmonth-select"
                        className="bg-gray-800 text-white px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(e.target.value)}
                        disabled={!autoBackup || frequency !== "monthly"}
                        aria-disabled={!autoBackup || frequency !== "monthly"}
                      >
                        <option value="">-</option>
                        {[...Array(31)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label
                        className="text-yellow-100 w-40"
                        htmlFor="timeofday-select"
                      >
                        Time of Day:
                      </label>
                      <select
                        id="timeofday-select"
                        className="bg-gray-800 text-white px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        value={timeOfDay}
                        onChange={(e) => setTimeOfDay(e.target.value)}
                        disabled={!autoBackup}
                        aria-disabled={!autoBackup}
                      >
                        <option value="">-</option>
                        <option value="00:00">12:00 AM</option>
                        <option value="06:00">6:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="18:00">6:00 PM</option>
                      </select>
                    </div>
                  </div>
                </section>
                {/* Restore from backup */}
                <section className="mb-6 sm:mb-8" aria-label="Restore Data">
                  <span className="text-lg font-semibold text-yellow-300 mb-1 block">
                    Restore Data
                  </span>
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Restore from backup
                  </h2>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button
                      className={`bg-yellow-400 hover:bg-yellow-300 focus:ring-4 focus:ring-yellow-200 text-black px-6 py-2 rounded-lg font-semibold shadow transition-all duration-200 flex items-center gap-2 ${
                        isRestoring ? "opacity-60 cursor-not-allowed" : ""
                      } outline-none`}
                      disabled={isRestoring}
                      onClick={handleRestore}
                      title="Upload and restore from a backup file"
                      aria-label="Upload and restore from a backup file"
                    >
                      {isRestoring ? (
                        <span
                          className="animate-spin h-5 w-5 border-2 border-t-2 border-yellow-600 border-t-white rounded-full"
                          aria-label="Restoring"
                        ></span>
                      ) : (
                        <span>Upload & Restore</span>
                      )}
                    </button>
                    {restoreFileName && !isRestoring && (
                      <span className="text-xs text-yellow-200">
                        {restoreFileName}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 ml-40">
                    <span id="restore-warning" className="text-xs text-red-400">
                      Warning: Restoring will overwrite current data.
                    </span>
                    {restoreError && (
                      <div className="text-red-400 text-xs mt-1">
                        {restoreError}
                      </div>
                    )}
                    {restoreMsg && (
                      <div className="text-green-400 text-sm mt-2 ml-40 animate-fade-in">
                        {restoreMsg}
                      </div>
                    )}
                  </div>
                </section>
                {/* Backup History */}
                <section className="mb-6 sm:mb-8" aria-label="Backup History">
                  <div className="flex justify-start mt-8">
                    <button
                      className="bg-yellow-400 hover:bg-yellow-300 focus:ring-4 focus:ring-yellow-200 text-black px-6 py-2 rounded-lg font-semibold shadow transition-all duration-200 outline-none"
                      title="View backup history"
                      aria-label="View backup history"
                      onClick={handleShowHistory}
                    >
                      Backup History
                    </button>
                  </div>
                  {/* Backup History Modal */}
                  {showHistoryModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
                      <div className="bg-black p-8 rounded-3xl shadow-2xl text-center space-y-8 max-w-4xl w-full border-2 border-yellow-400">
                        <div className="flex items-center justify-between mb-2">
                          <h2 className="text-3xl font-bold text-yellow-400 font-poppins">
                            Backup History
                          </h2>
                          <button
                            className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2 rounded-xl font-semibold ml-4"
                            onClick={() => setShowHistoryModal(false)}
                            disabled={isRestoring}
                          >
                            Back
                          </button>
                        </div>
                        <hr className="border-yellow-400 border-t-2 mb-4" />
                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                          <input
                            type="text"
                            className="bg-gray-900 text-white px-4 py-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            placeholder="Search"
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleHistorySearch();
                            }}
                          />
                          <input
                            type="date"
                            className="bg-gray-900 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            value={historyDate}
                            onChange={(e) => setHistoryDate(e.target.value)}
                          />
                          <button
                            className="text-yellow-400 underline text-sm ml-2"
                            onClick={handleClearHistoryFilters}
                            disabled={isRestoring}
                          >
                            [Clear Filter]
                          </button>
                          <button
                            className="bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded font-semibold ml-2"
                            onClick={handleHistorySearch}
                            disabled={isRestoring}
                          >
                            Search
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-left text-sm text-gray-200 border border-yellow-400">
                            <thead>
                              <tr className="bg-gray-900">
                                <th className="px-4 py-2 text-yellow-300">
                                  Backup Time
                                </th>
                                <th className="px-4 py-2 text-yellow-300">
                                  Backup Size
                                </th>
                                <th className="px-4 py-2 text-yellow-300">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {backupHistory.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={3}
                                    className="px-4 py-4 text-center text-gray-400"
                                  >
                                    No backup history found.
                                  </td>
                                </tr>
                              ) : (
                                backupHistory.map((history) => (
                                  <tr
                                    key={history.id}
                                    className="border-b border-yellow-400/30"
                                  >
                                    <td className="px-4 py-2">
                                      {new Date(
                                        history.created_at
                                      ).toLocaleString("en-US", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit",
                                        second: "2-digit",
                                        hour12: true,
                                      })}
                                    </td>
                                    <td className="px-4 py-2">
                                      {history.size
                                        ? formatSize(history.size)
                                        : "-"}
                                    </td>
                                    <td className="px-4 py-2">
                                      <button
                                        className="bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-1 rounded font-semibold mr-2"
                                        onClick={() =>
                                          handleHistoryRestore(history)
                                        }
                                        disabled={isRestoring}
                                      >
                                        Restore
                                      </button>
                                      <button
                                        className="bg-gray-700 hover:bg-gray-600 text-yellow-300 px-4 py-1 rounded font-semibold"
                                        onClick={() =>
                                          alert("Archive not implemented")
                                        }
                                        disabled={isRestoring}
                                      >
                                        Archive
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </article>
            </div>
          </main>
          {saveMessage && (
            <div
              className="mt-8 text-green-400 text-center font-semibold animate-fade-in"
              role="status"
              tabIndex={0}
              aria-live="polite"
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
                <p className="text-gray-300">
                  Are you sure you want to cancel?
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={handleConfirmCancel}
                    className="px-8 py-3 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-semibold transition-all order-2 sm:order-1 cursor-pointer"
                  >
                    Yes, Cancel
                  </button>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="px-8 py-3 rounded-lg border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-semibold transition-all order-1 sm:order-2 cursor-pointer"
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
                  You have unsaved changes. Are you sure you want to leave
                  without saving?
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
          {/* Password Modal */}
          {showPasswordModal && (
            <PasswordModal
              mode={
                showPasswordModalType === "history-restore"
                  ? "restore"
                  : showPasswordModalType
              }
              loading={isBackingUp || isRestoring}
              passwordInput={passwordInput}
              setPasswordInput={setPasswordInput}
              onSubmit={async (password) => {
                setShowPasswordModalType(null);
                setPasswordInput("");
                if (showPasswordModalType === "backup") {
                  await doBackupWithPassword(password);
                } else if (showPasswordModalType === "restore") {
                  await doRestoreWithPassword(password);
                } else if (
                  showPasswordModalType === "history-restore" &&
                  selectedHistory
                ) {
                  await doHistoryRestoreWithPassword(password, selectedHistory);
                }
              }}
              onCancel={() => {
                setShowPasswordModalType(null);
                setPasswordInput("");
                setPendingRestoreFile(null);
                setPendingGDriveFileId(null);
                setIsBackingUp(false);
                setIsRestoring(false);
                setSelectedHistory(null);
                setRestoreSource(null);
              }}
            />
          )}
          {/* Enhanced Backup Choice Modal */}
          {showPopup && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
              <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-3 sm:space-y-4 md:space-y-6 max-w-xs sm:max-w-sm md:max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl"></div>
                    <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 sm:p-4 rounded-full">
                      <FaDownload className="text-black text-2xl sm:text-3xl" />
                    </div>
                  </div>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                  Backup Data
                </h3>
                <p className="text-gray-300 text-xs sm:text-sm md:text-base">
                  Choose where you want to save your backup file.
                </p>
                <div className="space-y-3 sm:space-y-4 pt-2">
                  <GoogleDriveIntegration
                    onSuccess={async (resp: any) => {
                      setIsBackingUp(true);
                      try {
                        // Send access_token as JSON in POST body
                        const fileId = await backupToDrive(
                          resp.access_token,
                          backupPassword
                        );
                        setBackupResultMsg(
                          `Backup uploaded to Google Drive! File ID: ${fileId}`
                        );
                        setTimeout(() => setBackupResultMsg(""), 4000);
                      } catch (error: any) {
                        const errData = error?.response?.data;
                        setBackupResultMsg(
                          "Google Drive backup failed: " +
                            (errData?.detail ||
                              errData?.message ||
                              error.message ||
                              String(error))
                        );
                        setTimeout(() => setBackupResultMsg(""), 4000);
                      }
                      setIsBackingUp(false);
                      setShowBackupChoiceModal(false);
                      setBackupPassword("");
                    }}
                    backingUp={isBackingUp}
                  />
                  <button
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-semibold px-4 sm:px-6 py-3 rounded-lg sm:rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px] touch-manipulation cursor-pointer"
                    onClick={handleLocalBackup}
                    disabled={isBackingUp}
                    type="button"
                  >
                    <FaDownload className="text-xl" />
                    Local Download
                  </button>
                  <button
                    className="w-full border-2 border-gray-500/70 text-gray-400 hover:bg-gray-500 hover:text-white font-semibold px-4 sm:px-6 py-3 rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base min-h-[44px] touch-manipulation cursor-pointer"
                    onClick={() => setShowBackupChoiceModal(false)}
                    disabled={isBackingUp}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Enhanced Backup Success Modal */}
          {backupResultMsg && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="backup-success-title"
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl"></div>
                    <div className="relative bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 rounded-full">
                      <FaDatabase className="text-white text-3xl" />
                    </div>
                  </div>
                </div>
                <h3
                  id="backup-success-title"
                  className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins"
                >
                  Backup Successful!
                </h3>
                <p className="text-gray-300 text-sm sm:text-base">
                  {backupResultMsg}
                </p>
                <button
                  onClick={() => setBackupResultMsg("")}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200"
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Backup Loading Modal */}
          {isBackingUp && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="backup-loading-title"
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl"></div>
                    <div className="relative bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 rounded-full">
                      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  </div>
                </div>
                <h3
                  id="backup-loading-title"
                  className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins"
                >
                  Backing Up Data...
                </h3>
                <p className="text-gray-300 text-sm sm:text-base">
                  Please wait while we process your backup. This may take a few
                  moments.
                </p>
              </div>
            </div>
          )}

          {/* Enhanced Restore Loading Modal */}
          {isRestoring && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="restore-loading-title"
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl"></div>
                    <div className="relative bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 rounded-full">
                      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  </div>
                </div>
                <h3
                  id="restore-loading-title"
                  className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins"
                >
                  Restoring Data...
                </h3>
                <p className="text-gray-300 text-sm sm:text-base">
                  Please wait while we restore your backup. This may take a few
                  moments.
                </p>
              </div>
            </div>
          )}

          {/* Restore Source Modal */}
          {showRestoreSourceModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
              <div className="bg-black p-8 rounded-3xl shadow-2xl text-center space-y-8 max-w-md w-full border-2 border-gray-400">
                <h2 className="text-2xl font-bold text-yellow-400 font-poppins">
                  Select Backup Source
                </h2>
                <p className="text-gray-300">Where is your backup file?</p>
                <div className="flex flex-col gap-4 mt-4">
                  <button
                    className="px-8 py-3 rounded-lg border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-semibold transition-all cursor-pointer"
                    onClick={() => {
                      setRestoreSource("local");
                      setShowRestoreSourceModal(false);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    Local File
                  </button>
                  <button
                    className="px-8 py-3 rounded-lg border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black font-semibold transition-all cursor-pointer"
                    onClick={async () => {
                      setRestoreSource("gdrive");
                      setShowRestoreSourceModal(false);
                      await openGoogleDrivePicker();
                    }}
                  >
                    Google Drive
                  </button>
                  <button
                    className="px-8 py-3 rounded-lg border border-gray-400 text-gray-400 hover:bg-gray-400 hover:text-black font-semibold transition-all cursor-pointer"
                    onClick={() => setShowRestoreSourceModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            id="restore-file"
            type="file"
            accept="application/json,.json,.gz,.enc"
            className="hidden"
            onChange={handleFileChange}
            aria-describedby="restore-warning"
          />
        </ResponsiveMain>
      </section>
    </GoogleOAuthProvider>
  );
}
