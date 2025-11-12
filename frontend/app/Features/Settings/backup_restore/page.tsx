"use client";
import {
  FaDatabase,
  FaEye,
  FaEyeSlash,
  FaDownload,
  FaUpload,
  FaHistory,
  FaClock,
  FaTrash,
} from "react-icons/fa";
import { useRef, useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useBackupSchedule,
  updateBackupSchedule,
} from "./hook/useBackupSchedule";
import { useBackupRestoreAPI } from "./hook/use-BackupRestoreAPI";

import ResponsiveMain from "@/app/components/ResponsiveMain";
import NavigationBar from "@/app/components/navigation/navigation";
import { FiCheck, FiAlertCircle } from "react-icons/fi";
import Pagination from "@/app/components/Pagination";

export default function BackupRestorePage() {
  // Robust offline/cached state
  const [offlineError, setOfflineError] = useState<string | null>(null);
  // Modal state for password entry
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingRestoreFilename, setPendingRestoreFilename] = useState<
    string | null
  >(null);
  const { backup, restore, restoreLocal, listBackups, deleteBackup } =
    useBackupRestoreAPI();
  const [history, setHistory] = useState<string[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState("");
  const [restoreFileName, setRestoreFileName] = useState("");
  const [localRestoreModalOpen, setLocalRestoreModalOpen] = useState(false);
  const [localRestorePassword, setLocalRestorePassword] = useState("");
  const [localRestoreFilename, setLocalRestoreFilename] = useState("");
  const [localRestoreFile, setLocalRestoreFile] = useState<File | null>(null);
  const [restoreError, setRestoreError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { schedule, isLoading: scheduleLoading, refresh } = useBackupSchedule();
  const [autoBackup, setAutoBackup] = useState(false);
  const [frequency, setFrequency] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState("");
  const initialSettingsRef = useRef<any>(null);

  // Pagination state for backup history
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Initialize UI state from backend schedule
  useEffect(() => {
    if (schedule && !scheduleLoading) {
      // If frequency is set, enable autoBackup
      setAutoBackup(!!schedule.frequency);
      setFrequency(schedule.frequency || "");
      setDayOfWeek(schedule.day_of_week || "");
      setDayOfMonth(schedule.day_of_month ? String(schedule.day_of_month) : "");
      setTimeOfDay(schedule.time_of_day || "");
      setScheduleLoaded(true);
    }
  }, [schedule, scheduleLoading]);

  // React Query client for cache invalidation
  const queryClient = useQueryClient();

  // Fetch backup history from Supabase Storage
  useEffect(() => {
    // Robust offline/cached loading logic
    const isCompletelyOffline =
      typeof window !== "undefined" && !navigator.onLine;
    setHistoryLoading(true);
    setOfflineError(null);
    const cacheKey = "cached_backup_history";
    if (isCompletelyOffline) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setHistory(parsed);
        } catch (e) {
          setHistory([]);
        }
      } else {
        setHistory([]);
        setOfflineError("Offline and no cached backup history available.");
      }
      setHistoryLoading(false);
      return;
    }
    // Online: fetch from API
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const files = await listBackups();
        // files may be array of objects (from API), map to filenames
        const fileNames = Array.isArray(files)
          ? (files as Array<{ name: string } | string>)
              .map((f) => {
                if (typeof f === "string") return f;
                if (
                  f &&
                  typeof f === "object" &&
                  "name" in f &&
                  typeof (f as { name: string }).name === "string"
                )
                  return (f as { name: string }).name;
                return "";
              })
              .filter((name) => name && name !== ".emptyFolderPlaceholder")
          : [];
        setHistory(fileNames);
        // Cache backup history
        localStorage.setItem(cacheKey, JSON.stringify(fileNames));
      } catch (err) {
        setHistory([]);
      }
      setHistoryLoading(false);
    };
    fetchHistory();
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return history.slice(startIndex, endIndex);
  }, [history, currentPage, itemsPerPage]);

  // Reset to page 1 when history changes
  useEffect(() => {
    setCurrentPage(1);
  }, [history]);

  // Manual backup handler
  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      // Always use the .env password for backup
      const envPassword = process.env.NEXT_PUBLIC_BACKUP_PASSWORD || "";
      await backup(envPassword);
      setRestoreMsg("Backup completed successfully!");
      setTimeout(() => setRestoreMsg(""), 2000);
    } catch (err: any) {
      setRestoreMsg("Backup failed: " + (err?.message || String(err)));
      setTimeout(() => setRestoreMsg(""), 4000);
    }
    setIsBackingUp(false);
  };

  const handleLocalRestore = async () => {
    if (!localRestoreFile) {
      setRestoreError("Please select a backup file.");
      return;
    }
    setIsRestoring(true);
    setRestoreError("");
    try {
      await restoreLocal(localRestoreFile, localRestorePassword);
      setRestoreMsg("Restore from local backup successful!");
      setTimeout(() => setRestoreMsg(""), 2000);
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setLocalRestoreModalOpen(false);
      setLocalRestorePassword("");
      setLocalRestoreFile(null);
    } catch (err: any) {
      setRestoreError(
        "Restore from local backup failed: " + (err?.message || String(err))
      );
    }
    setIsRestoring(false);
  };

  // State for removing backup
  const [removingBackup, setRemovingBackup] = useState<string | null>(null);

  // Remove backup handler
  const handleRemoveBackup = async (filename: string) => {
    setRemovingBackup(filename);
    try {
      await deleteBackup(filename);
      setHistory((prev) => prev.filter((f) => f !== filename));
    } catch (err: any) {
      setRestoreMsg(
        "Failed to remove backup: " + (err?.message || String(err))
      );
      setTimeout(() => setRestoreMsg(""), 4000);
    }
    setRemovingBackup(null);
  };

  // Restore handler for history table (opens modal)
  const handleHistoryRestore = (filename: string) => {
    setPendingRestoreFilename(filename);
    setModalOpen(true);
  };

  // Modal submit handler
  const handleModalSubmit = async (password: string) => {
    setModalOpen(false);
    if (!pendingRestoreFilename) return;
    setIsRestoring(true);
    setRestoreFileName(pendingRestoreFilename);
    setRestoreError("");
    try {
      // Download backup file from backend
      const response = await fetch(
        `/api/download-backup?filename=${encodeURIComponent(
          pendingRestoreFilename
        )}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download backup file");
      }

      const blob = await response.blob();
      const file = new File([blob], pendingRestoreFilename);
      await restore(password, file);
      setRestoreMsg("Restore successful!");
      setTimeout(() => setRestoreMsg(""), 2000);
      // Invalidate supplier cache so UI updates
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    } catch (err: any) {
      setRestoreError("Restore failed: " + (err?.message || String(err)));
    }
    setIsRestoring(false);
    setPendingRestoreFilename(null);
  };

  // Save handler for automatic backup schedule
  const handleSaveSchedule = async () => {
    try {
      if (!autoBackup) {
        await updateBackupSchedule({
          frequency: "",
          day_of_week: "",
          day_of_month: undefined,
          time_of_day: "",
        });
      } else {
        await updateBackupSchedule({
          frequency,
          day_of_week: frequency === "weekly" ? dayOfWeek : undefined,
          day_of_month:
            frequency === "monthly" ? Number(dayOfMonth) : undefined,
          time_of_day: timeOfDay,
        });
      }
      await refresh();
      initialSettingsRef.current = {
        autoBackup,
        frequency,
        dayOfWeek,
        dayOfMonth,
        timeOfDay,
      };
      setScheduleMsg("Schedule saved successfully!");
      setTimeout(() => setScheduleMsg(""), 2000);
    } catch (err: any) {
      setScheduleMsg(
        "Failed to save schedule: " + (err?.message || String(err))
      );
      setTimeout(() => setScheduleMsg(""), 4000);
    }
  };

  function handleLocalRestoreClick(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): void {
    event.preventDefault();
    setLocalRestoreModalOpen(true);
  }

  return (
    <section className="text-white font-poppins">
      <NavigationBar
        modalOpen={modalOpen}
        localRestoreModalOpen={localRestoreModalOpen}
      />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Backup and Restore main content"
          tabIndex={-1}
        >
          {/* Robust offline/cached error and loading UI */}
          {offlineError && (
            <div className="bg-red-700 text-white p-4 rounded-lg mb-4 text-center">
              {offlineError}
            </div>
          )}
          {historyLoading && !offlineError && (
            <div className="flex justify-center items-center min-h-[120px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-4 text-white">Loading backup history...</span>
            </div>
          )}
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            <article className="bg-gradient-to-br from-gray-900/95 to-black/95 rounded-xl shadow-2xl border border-gray-800/50 p-6 w-full">
              <header className="flex flex-col space-y-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                    <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-2 rounded-full">
                      <FaDatabase className="text-black text-2xl" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                    Backup & Restore
                  </h1>
                </div>
                <p className="text-gray-400 text-base">
                  Manage your backup and restore settings.
                </p>
              </header>
              {/* Manual Backup & Restore */}
              <section className="mb-8" aria-label="Manual Backup">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Backup Card */}
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50 hover:border-yellow-400/30 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-yellow-400/10 p-3 rounded-lg">
                        <FaDownload className="text-yellow-400 text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-300">
                          Create Backup
                        </h3>
                        <p className="text-xs text-gray-400">
                          Download your data instantly
                        </p>
                      </div>
                    </div>
                    <button
                      className={`w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-yellow-400/50 transition-all duration-300 flex items-center justify-center gap-2 ${
                        isBackingUp ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                      onClick={handleBackup}
                      disabled={isBackingUp}
                      title="Download a backup of your data now"
                      aria-label="Backup Now"
                    >
                      <FaDownload className="text-lg" />
                      {isBackingUp ? "Creating Backup..." : "Download Backup"}
                    </button>
                  </div>

                  {/* Restore Card */}
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50 hover:border-yellow-400/30 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-yellow-400/10 p-3 rounded-lg">
                        <FaUpload className="text-yellow-400 text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-300">
                          Restore Backup
                        </h3>
                        <p className="text-xs text-gray-400">
                          Upload a backup file to restore
                        </p>
                      </div>
                    </div>
                    <button
                      className={`w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-yellow-400/50 transition-all duration-300 flex items-center justify-center gap-2 ${
                        isRestoring ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                      onClick={handleLocalRestoreClick}
                      disabled={isRestoring}
                      title="Restore from a local backup file"
                      aria-label="Restore from Local Backup"
                    >
                      <FaUpload className="text-lg" />
                      {isRestoring ? "Restoring..." : "Upload & Restore"}
                    </button>
                  </div>
                </div>
                {/* Modal for restoring from local backup directory */}
                {localRestoreModalOpen && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl text-center space-y-8 max-w-md w-full border-2 border-yellow-400/70">
                      <div className="flex justify-center mb-2 xs:mb-3 sm:mb-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg xs:blur-xl"></div>
                          <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-2 xs:p-3 sm:p-4 rounded-full">
                            <FaDatabase className="text-black text-lg xs:text-xl sm:text-2xl md:text-3xl" />
                          </div>
                        </div>
                      </div>
                      <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                        Restore from Local Backup
                      </h2>
                      <div className="flex flex-col gap-4 items-center">
                        <input
                          type="file"
                          accept=".enc,.json,.gz,.zip,.bak"
                          className="w-full px-4 py-2 rounded-lg bg-gray-900 text-yellow-200 border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-lg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setLocalRestoreFile(e.target.files[0]);
                              setLocalRestoreFilename(e.target.files[0].name);
                            } else {
                              setLocalRestoreFile(null);
                              setLocalRestoreFilename("");
                            }
                          }}
                          autoFocus
                        />
                        <input
                          type="password"
                          className="w-full px-4 py-2 rounded-lg bg-gray-900 text-yellow-200 border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-lg"
                          value={localRestorePassword}
                          onChange={(e) =>
                            setLocalRestorePassword(e.target.value)
                          }
                          placeholder="Password"
                        />
                        <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
                          <button
                            onClick={handleLocalRestore}
                            className="flex items-center justify-center gap-1 xs:gap-2 px-6 py-2 rounded-lg border-2 border-yellow-400/70 text-yellow-400 hover:bg-yellow-400 hover:text-black font-semibold transition-all duration-300 cursor-pointer text-base"
                            disabled={isRestoring}
                          >
                            {isRestoring ? "Restoring..." : "Restore"}
                          </button>
                          <button
                            onClick={() => {
                              setLocalRestoreModalOpen(false);
                              setLocalRestoreFilename("");
                              setLocalRestorePassword("");
                            }}
                            className="flex items-center justify-center gap-1 xs:gap-2 px-6 py-2 rounded-lg border-2 border-gray-500/70 text-gray-400 hover:bg-gray-500 hover:text-white font-semibold transition-all duration-300 cursor-pointer text-base"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {restoreMsg && (
                  <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] animate-fadein">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-green-400/30">
                      <div className="bg-white/20 p-2 rounded-full">
                        <FiCheck className="text-white text-lg" />
                      </div>
                      <span className="font-semibold text-sm">
                        {restoreMsg}
                      </span>
                    </div>
                  </div>
                )}
                {restoreError && (
                  <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] animate-fadein">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-red-400/30">
                      <div className="bg-white/20 p-2 rounded-full">
                        <FiAlertCircle className="text-white text-lg" />
                      </div>
                      <span className="font-semibold text-sm">
                        {restoreError}
                      </span>
                    </div>
                  </div>
                )}
              </section>

              {/* Automatic Backup Settings */}
              <section className="mb-8" aria-label="Automatic Backup Settings">
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-yellow-400/10 p-3 rounded-lg">
                      <FaClock className="text-yellow-400 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-300">
                        Automatic Backup Schedule
                      </h3>
                      <p className="text-xs text-gray-400">
                        Configure automated backup frequency
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/30">
                    <div className="flex items-center gap-3">
                      <label className="text-white font-medium">
                        Enable Automatic Backup
                      </label>
                      <input
                        type="checkbox"
                        checked={autoBackup}
                        onChange={() => setAutoBackup((prev) => !prev)}
                        className="w-5 h-5 accent-yellow-400 border-2 border-yellow-400 rounded focus:ring-2 focus:ring-yellow-300 outline-none cursor-pointer"
                        style={{ accentColor: "#FFD600" }}
                        title="Enable or disable automatic backups"
                        aria-label="Enable automatic backup"
                        disabled={scheduleLoading}
                      />
                    </div>
                    <button
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold shadow-lg hover:shadow-yellow-400/50 transition-all duration-300"
                      onClick={handleSaveSchedule}
                      disabled={scheduleLoading}
                    >
                      Save Schedule
                    </button>
                  </div>
                  {/* Success Message */}
                  {scheduleMsg && (
                    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] animate-fadein">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-green-400/30">
                        <div className="bg-white/20 p-2 rounded-full">
                          <FiCheck className="text-white text-lg" />
                        </div>
                        <span className="font-semibold text-sm">
                          {scheduleMsg}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-yellow-100 text-sm font-medium"
                      htmlFor="frequency-select"
                    >
                      Backup Frequency
                    </label>
                    <select
                      id="frequency-select"
                      className={`px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${
                        !autoBackup
                          ? "bg-gray-700/50 text-gray-400 cursor-not-allowed border-gray-600"
                          : "bg-gray-800/80 text-white border-gray-600 hover:border-yellow-400/50"
                      }`}
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      disabled={!autoBackup}
                      aria-disabled={!autoBackup}
                    >
                      <option value="">Select frequency</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      className="text-yellow-100 text-sm font-medium"
                      htmlFor="timeofday-select"
                    >
                      Time
                    </label>
                    <input
                      id="timeofday-select"
                      type="time"
                      className={`px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${
                        !autoBackup
                          ? "bg-gray-700/50 text-gray-400 cursor-not-allowed border-gray-600"
                          : "bg-gray-800/80 text-white border-gray-600 hover:border-yellow-400/50"
                      }`}
                      value={timeOfDay}
                      onChange={(e) => setTimeOfDay(e.target.value)}
                      disabled={!autoBackup}
                      aria-disabled={!autoBackup}
                    />
                  </div>

                  {frequency === "weekly" && (
                    <div className="flex flex-col gap-2">
                      <label
                        className="text-yellow-100 text-sm font-medium"
                        htmlFor="dayofweek-select"
                      >
                        Day of Week
                      </label>
                      <select
                        id="dayofweek-select"
                        className={`px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${
                          !autoBackup || frequency !== "weekly"
                            ? "bg-gray-700/50 text-gray-400 cursor-not-allowed border-gray-600"
                            : "bg-gray-800/80 text-white border-gray-600 hover:border-yellow-400/50"
                        }`}
                        value={dayOfWeek}
                        onChange={(e) => setDayOfWeek(e.target.value)}
                        disabled={!autoBackup || frequency !== "weekly"}
                        aria-disabled={!autoBackup || frequency !== "weekly"}
                      >
                        <option value="">Select day</option>
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                    </div>
                  )}

                  {frequency === "monthly" && (
                    <div className="flex flex-col gap-2">
                      <label
                        className="text-yellow-100 text-sm font-medium"
                        htmlFor="dayofmonth-select"
                      >
                        Day of Month
                      </label>
                      <select
                        id="dayofmonth-select"
                        className={`px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${
                          !autoBackup || frequency !== "monthly"
                            ? "bg-gray-700/50 text-gray-400 cursor-not-allowed border-gray-600"
                            : "bg-gray-800/80 text-white border-gray-600 hover:border-yellow-400/50"
                        }`}
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(e.target.value)}
                        disabled={!autoBackup || frequency !== "monthly"}
                        aria-disabled={!autoBackup || frequency !== "monthly"}
                      >
                        <option value="">Select day</option>
                        {[...Array(31)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </section>
              {/* Backup History Section */}
              <section className="mb-8" aria-label="Backup History">
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-yellow-400/10 p-3 rounded-lg">
                      <FaHistory className="text-yellow-400 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-300">
                        Backup History
                      </h3>
                      <p className="text-xs text-gray-400">
                        View and manage your backup files
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900/50">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-800/80 border-b border-gray-700/50">
                          <th className="px-6 py-4 text-left text-yellow-300 font-semibold">
                            <div className="flex items-center gap-2">
                              <FaDatabase className="text-yellow-400" />
                              Filename
                            </div>
                          </th>
                          <th className="px-6 py-4 text-right text-yellow-300 font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyLoading && (
                          <tr>
                            <td colSpan={2} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                                <span className="text-gray-400">
                                  Loading backup history...
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                        {!historyLoading && history.length === 0 && (
                          <tr>
                            <td colSpan={2} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <FiAlertCircle className="text-gray-500 text-3xl" />
                                <span className="text-gray-400">
                                  No backups found.
                                </span>
                                <p className="text-xs text-gray-500">
                                  Create your first backup to get started
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                        {!historyLoading &&
                          paginatedHistory.length > 0 &&
                          paginatedHistory.map((filename: string) => (
                            <tr
                              key={filename}
                              className="border-t border-gray-700/30 hover:bg-gray-800/30 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-yellow-400/10 p-2 rounded">
                                    <FaDatabase className="text-yellow-400 text-sm" />
                                  </div>
                                  <span className="text-white font-mono text-sm">
                                    {filename}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2 justify-end">
                                  <button
                                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black px-4 py-2 rounded-lg font-semibold text-xs shadow-lg hover:shadow-yellow-400/50 transition-all duration-300 flex items-center gap-2"
                                    onClick={() =>
                                      handleHistoryRestore(filename)
                                    }
                                    disabled={isRestoring}
                                  >
                                    <FaUpload className="text-xs" />
                                    Restore
                                  </button>
                                  <button
                                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-lg hover:shadow-red-500/50 transition-all duration-300 flex items-center gap-2"
                                    onClick={() => handleRemoveBackup(filename)}
                                    disabled={removingBackup === filename}
                                  >
                                    <FaTrash className="text-xs" />
                                    {removingBackup === filename
                                      ? "Removing..."
                                      : "Remove"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>

                    {/* Pagination for Backup History */}
                    {history.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={history.length}
                        onItemsPerPageChange={setItemsPerPage}
                      />
                    )}
                  </div>
                  <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-700/50">
                    <p className="text-gray-400 text-xs flex items-center gap-2">
                      <FiAlertCircle className="text-yellow-400" />
                      Backup files are stored securely in your Supabase storage
                    </p>
                  </div>
                </div>
              </section>
              {modalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                  <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl text-center space-y-8 max-w-md w-full border-2 border-yellow-400/70">
                    <div className="flex justify-center mb-2 xs:mb-3 sm:mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg xs:blur-xl"></div>
                        <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-2 xs:p-3 sm:p-4 rounded-full">
                          <FaDatabase className="text-black text-lg xs:text-xl sm:text-2xl md:text-3xl" />
                        </div>
                      </div>
                    </div>
                    <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                      Enter Password for Restore
                    </h2>
                    <div className="flex flex-col gap-4 items-center">
                      <input
                        type="password"
                        className="w-full px-4 py-2 rounded-lg bg-gray-900 text-yellow-200 border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-lg"
                        value={restoreFileName}
                        onChange={(e) => setRestoreFileName(e.target.value)}
                        autoFocus
                        placeholder="Password"
                      />
                      <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
                        <button
                          onClick={async () => {
                            setModalOpen(false);
                            await handleModalSubmit(restoreFileName);
                          }}
                          className="flex items-center justify-center gap-1 xs:gap-2 px-6 py-2 rounded-lg border-2 border-yellow-400/70 text-yellow-400 hover:bg-yellow-400 hover:text-black font-semibold transition-all duration-300 cursor-pointer text-base"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => {
                            setModalOpen(false);
                            setPendingRestoreFilename(null);
                          }}
                          className="flex items-center justify-center gap-1 xs:gap-2 px-6 py-2 rounded-lg border-2 border-gray-500/70 text-gray-400 hover:bg-gray-500 hover:text-white font-semibold transition-all duration-300 cursor-pointer text-base"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </article>
          </div>
        </main>
      </ResponsiveMain>
    </section>
  );
}
