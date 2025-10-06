"use client";
import { FaDatabase, FaEye, FaEyeSlash } from "react-icons/fa";
import { useRef, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useBackupSchedule,
  updateBackupSchedule,
} from "./hook/useBackupSchedule";
import { useBackupRestoreAPI } from "./hook/use-BackupRestoreAPI";

import ResponsiveMain from "@/app/components/ResponsiveMain";
import NavigationBar from "@/app/components/navigation/navigation";

export default function BackupRestorePage() {
  // Modal state for password entry
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingRestoreFilename, setPendingRestoreFilename] = useState<
    string | null
  >(null);
  const { backup, restore, restoreLocal, listBackups } = useBackupRestoreAPI();
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

  // React Query client for cache invalidation
  const queryClient = useQueryClient();

  // Fetch backup history from Supabase Storage
  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const files = await listBackups();
        // Filter out Supabase placeholder files
        const filtered = Array.isArray(files)
          ? files.filter((f) => f !== ".emptyFolderPlaceholder")
          : [];
        setHistory(filtered);
      } catch (err) {
        setHistory([]);
      }
      setHistoryLoading(false);
    };
    fetchHistory();
  }, []);

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
  const { deleteBackup } = useBackupRestoreAPI();
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
      <NavigationBar />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Backup and Restore main content"
          tabIndex={-1}
        >
          <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full">
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
              {/* Manual Backup */}
              <section className="mb-8" aria-label="Manual Backup">
                <span className="text-lg font-semibold text-yellow-300 mb-1">
                  Manual Backup
                </span>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <button
                    className={`bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2 rounded-lg font-semibold shadow transition-all duration-200 flex items-center gap-2 ${
                      isBackingUp ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    onClick={handleBackup}
                    disabled={isBackingUp}
                    title="Download a backup of your data now"
                    aria-label="Backup Now"
                  >
                    {isBackingUp ? "Backing up..." : "Download Backup"}
                  </button>

                  <span className="text-lg font-semibold text-yellow-300 mb-1">
                    Restore Backup
                  </span>
                  <button
                    className={`bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2 rounded-lg font-semibold shadow transition-all duration-200 flex items-center gap-2 ${
                      isRestoring ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    onClick={handleLocalRestoreClick}
                    disabled={isRestoring}
                    title="Restore from a local backup file"
                    aria-label="Restore from Local Backup"
                  >
                    {isRestoring ? "Restoring..." : "Restore from Local Backup"}
                  </button>
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
                </div>
                {restoreMsg && (
                  <div className="text-green-400 text-sm mt-2 animate-fade-in">
                    {restoreMsg}
                  </div>
                )}
              </section>

              {/* Automatic Backup Settings */}
              <section className="mb-8" aria-label="Automatic Backup Settings">
                <span className="text-lg font-semibold text-yellow-300 mb-1 block">
                  Automatic Backup Settings
                </span>
                <div className="flex items-center mb-4">
                  <label className="mr-4">Enable Automatic Backup</label>
                  <input
                    type="checkbox"
                    checked={autoBackup}
                    onChange={() => setAutoBackup((prev) => !prev)}
                    className="w-6 h-6 accent-yellow-400 border-2 border-yellow-400 rounded focus:ring-2 focus:ring-yellow-300 outline-none"
                    style={{ accentColor: "#FFD600" }}
                    title="Enable or disable automatic backups"
                    aria-label="Enable automatic backup"
                    disabled={scheduleLoading}
                  />
                  <button
                    className="ml-4 px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold"
                    onClick={handleSaveSchedule}
                    disabled={scheduleLoading}
                  >
                    Save
                  </button>
                  {scheduleMsg && (
                    <span className="ml-4 text-green-400 text-sm animate-fade-in">
                      {scheduleMsg}
                    </span>
                  )}
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
                      className={`px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                        !autoBackup
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : "bg-gray-800 text-white"
                      }`}
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
                      className={`px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                        !autoBackup || frequency !== "weekly"
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : "bg-gray-800 text-white"
                      }`}
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
                      className={`px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                        !autoBackup || frequency !== "monthly"
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : "bg-gray-800 text-white"
                      }`}
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
                      className="text-yellow-100 w-40 pr-2"
                      htmlFor="timeofday-select"
                    >
                      Time:
                    </label>
                    <input
                      id="timeofday-select"
                      type="time"
                      className={`px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                        !autoBackup
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : "bg-gray-800 text-white"
                      }`}
                      value={timeOfDay}
                      onChange={(e) => setTimeOfDay(e.target.value)}
                      disabled={!autoBackup}
                      aria-disabled={!autoBackup}
                    />
                  </div>
                </div>
              </section>
              {/* Backup History Section */}
              <section className="mb-8" aria-label="Backup History">
                <span className="text-lg font-semibold text-yellow-300 mb-1 block">
                  Backup History
                </span>
                <div className="overflow-x-auto rounded-lg border border-gray-800/50 bg-gray-900/80 mt-2">
                  <table className="min-w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gray-800 text-yellow-300">
                        <th className="px-4 py-2">Filename</th>
                        <th className="px-4 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyLoading && (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-4 py-2 text-yellow-200 text-center"
                          >
                            Loading...
                          </td>
                        </tr>
                      )}
                      {!historyLoading && history.length === 0 && (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-4 py-2 text-gray-400 text-center"
                          >
                            No backups found.
                          </td>
                        </tr>
                      )}
                      {!historyLoading &&
                        history.length > 0 &&
                        history.map((filename: string) => (
                          <tr
                            key={filename}
                            className="border-t border-gray-700"
                          >
                            <td className="px-4 py-2">{filename}</td>
                            <td className="px-4 py-2 flex gap-2">
                              <button
                                className="bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-300 text-xs font-semibold"
                                onClick={() => handleHistoryRestore(filename)}
                                disabled={isRestoring}
                              >
                                Restore
                              </button>
                              <button
                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-400 text-xs font-semibold"
                                onClick={() => handleRemoveBackup(filename)}
                                disabled={removingBackup === filename}
                              >
                                {removingBackup === filename
                                  ? "Removing..."
                                  : "Remove"}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-gray-400 text-xs mt-2">
                  * This table lists your recent Supabase backups.
                </p>
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
