/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  FaSearch,
  FaGoogle,
  FaCloudUploadAlt,
  FaBoxes,
  FaSort,
  FaChartLine,
  FaCalendarAlt,
  FaDownload,
  FaFilter,
} from "react-icons/fa";
import {
  MdWarning,
  MdCheckCircle,
  MdAssessment,
  MdTrendingUp,
  MdTrendingDown,
} from "react-icons/md";
import {
  FiTrendingUp,
  FiBarChart,
  FiPieChart,
  FiActivity,
} from "react-icons/fi";
import { TbReportAnalytics } from "react-icons/tb";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import NavigationBar from "@/app/components/navigation/navigation";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import dayjs from "dayjs";
import { useInventoryReportAPI } from "./hook/use-inventoryreport";
import axiosInstance from "@/app/lib/axios";

import { useAuth } from "@/app/context/AuthContext";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

interface InventoryItem {
  id?: number;
  name: string;
  inStock: number;
  wastage: number;
  stock: string;
  report_date: string;
  category: string;
  expiration_date?: string;
  batch_id?: string;
  created_at?: string;
  updated?: string;
  [key: string]: string | number | undefined;
}

const GoogleSheetIntegration = ({
  onSuccess,
  exporting,
}: {
  onSuccess: (tr: any) => void;
  exporting: boolean;
}) => {
  const login = useGoogleLogin({
    scope:
      "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
    onSuccess,
    onError: console.error,
  });

  return (
    <button
      disabled={exporting}
      onClick={() => login()}
      className={`w-full flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all duration-200 ${
        exporting
          ? "bg-blue-400/50 cursor-not-allowed text-blue-200 border-2 border-blue-400/50"
          : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white border-2 border-blue-500/70 hover:border-blue-400/70"
      }`}
      type="button"
    >
      <FaGoogle />
      {exporting ? "Exporting..." : "Export to Google Sheets"}
    </button>
  );
};

export default function ReportInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const { user } = useAuth();
  const [pastInventory, setPastInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [groupedView] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [period, setPeriod] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "asc",
  });
  const { fetchLogs, saveLogs } = useInventoryReportAPI();

  // Fetch current inventory and auto-save if not already logged for today
  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().slice(0, 10);
        // Check if today's log already exists
        const logs = await fetchLogs(today);
        // Always display master inventory for today
        const masterRes = await axiosInstance.get("/api/inventory");
        const masterInventory = masterRes.data;
        console.log("masterInventory from /api/inventory:", masterInventory);

        setInventory(
          masterInventory.map((item: any) => {
            // Use created_at as the batch date since it's available
            const batchDate = item.created_at;

            return {
              id: item.item_id || item.id,
              name: item.item_name || item.name,
              inStock: today < item.expiration_date ? item.stock_quantity : 0,
              wastage: today >= item.expiration_date ? item.stock_quantity : 0,
              stock: item.stock_status,
              report_date: today,
              category: item.category,
              expiration_date: item.expiration_date,
              batch_id: batchDate
                ? new Date(batchDate).toLocaleDateString()
                : `Batch-${item.item_id || "Unknown"}`,
              created_at: item.created_at,
            };
          })
        );
        // Only save today's log if it does not already exist
        if (!logs || logs.length === 0) {
          console.log("masterInventory items for logEntries:");
          masterInventory.forEach((item: any, idx: number) => {
            console.log(`Item[${idx}]:`, item);
          });
          if (!user || !user.user_id) {
            console.error(
              "Cannot save logs: user_id is missing from AuthContext user object."
            );
            return;
          }
          const logEntries = masterInventory
            .filter((item: any) => item.item_id != null)
            .map((item: any) => ({
              item_id: Number(item.item_id),
              remaining_stock:
                today < item.expiration_date
                  ? parseInt(item.stock_quantity, 10)
                  : 0,
              action_date: new Date(today).toISOString(),
              user_id: Number(user.user_id),
              status: String(item.stock_status),
              wastage:
                today >= item.expiration_date
                  ? parseInt(item.stock_quantity, 10)
                  : 0,
            }));
          console.log("logEntries to be saved:", logEntries);
          try {
            await saveLogs(logEntries);
          } catch (err: any) {
            if (err.response) {
              console.error(
                "saveLogs error:",
                err.response.data,
                err.response.status
              );
            } else {
              console.error("saveLogs error:", err);
            }
          }
        } else {
          console.log("Today's log already exists, not saving.", logs);
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    }
    load();
  }, [fetchLogs, saveLogs, user]);

  // Fetch past inventory log when date is filtered
  useEffect(() => {
    async function loadPast() {
      if (reportDate) {
        try {
          const logs = await fetchLogs(reportDate);
          setPastInventory(
            logs.map((item: any) => {
              // Use created_at as the batch date
              const batchDate = item.created_at;

              return {
                id: item.item_id || item.id,
                name: item.item_name || item.name,
                inStock: item.remaining_stock,
                wastage: item.action_quantity ?? 0,
                stock: item.action_type,
                report_date: item.action_date ?? "",
                category: item.category,
                expiration_date: item.expiration_date,
                batch_id: batchDate
                  ? new Date(batchDate).toLocaleDateString()
                  : `Batch-${item.item_id || "Unknown"}`,
                created_at: item.created_at,
              };
            })
          );
        } catch (error) {
          console.error("Error fetching past inventory:", error);
        }
      } else {
        setPastInventory([]);
      }
    }
    loadPast();
  }, [reportDate, fetchLogs]);

  const matchesPeriod = useCallback(
    (dateStr: string) => {
      if (period === "all" || !dateStr) return true;
      const date = dayjs(dateStr);
      const now = dayjs();
      if (period === "weekly") {
        return date.isAfter(now.subtract(7, "day"), "day");
      }
      if (period === "monthly") {
        return date.isAfter(now.startOf("month"));
      }
      if (period === "yearly") {
        return date.isAfter(now.startOf("year"));
      }
      return true;
    },
    [period]
  );

  // Choose data source based on filter
  const dataSource = useMemo(() => {
    if (reportDate) {
      // Filter pastInventory by selected date
      return pastInventory.filter((item) => item.report_date === reportDate);
    }
    // For "weekly", "monthly", "yearly", use current inventory
    if (period !== "all") {
      return inventory.filter((item) => matchesPeriod(item.report_date));
    }
    return inventory;
  }, [inventory, pastInventory, reportDate, period, matchesPeriod]);

  const dates = useMemo(
    () =>
      [
        ...new Set([...inventory, ...pastInventory].map((i) => i.report_date)),
      ].filter(Boolean),
    [inventory, pastInventory]
  );

  const filtered = useMemo(() => {
    return dataSource.filter((item) => {
      const matchesCategory = categoryFilter
        ? item.category === categoryFilter
        : true;
      const matchesSearch = searchQuery
        ? Object.values(item)
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true;
      return matchesCategory && matchesSearch;
    });
  }, [dataSource, searchQuery, categoryFilter]);

  const excelValues = useMemo(
    () => [
      [
        "Item ID",
        "Name",
        "Batch ID",
        "Category",
        "In Stock",
        "Wastage",
        "Expiration Date",
        "Stock Status",
        "Report Date",
      ],
      ...filtered.map((i) => [
        i.id || "N/A",
        i.name || "Unknown Item",
        i.batch_id || "N/A",
        i.category || "No Category",
        i.inStock || 0,
        i.wastage || 0,
        i.expiration_date
          ? new Date(i.expiration_date).toLocaleDateString()
          : "N/A",
        i.stock || "Unknown",
        i.report_date ? new Date(i.report_date).toLocaleDateString() : "N/A",
      ]),
    ],
    [filtered]
  );

  const exportExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(excelValues);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `Inventory_Report_${formatDate()}.xlsx`);
    setExportSuccess(true);
    setShowPopup(false);
  };

  const formatDate = () =>
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const appendToSheet = async (token: string, sheetId: string) => {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: excelValues }),
      }
    );
  };

  const createSheet = async (token: string) => {
    const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: { title: `Inventory Report ${formatDate()}` },
        sheets: [{ properties: { title: "Sheet1" } }],
      }),
    });
    const json = await res.json();
    return json.spreadsheetId;
  };

  const handleGoogle = async (resp: any) => {
    setIsExporting(true);
    const token = resp.access_token;
    const sheetId = await createSheet(token);
    await appendToSheet(token, sheetId);
    setIsExporting(false);
    setExportSuccess(true);
    setShowPopup(false);
  };

  const handleClear = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setReportDate("");
    setPeriod("all");
    setSortConfig({ key: "", direction: "asc" });
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const clearCategory = () => {
    setCategoryFilter("");
  };

  const clearDate = () => {
    setReportDate("");
  };

  const clearPeriod = () => {
    setPeriod("all");
  };

  const requestSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedData = useMemo(() => {
    const data = filtered; // Use individual items, not grouped
    if (!sortConfig.key) return data;
    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }
      return sortConfig.direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    // Debug: Log the first few items to see their structure
    if (sorted.length > 0) {
      console.log("First sorted item:", sorted[0]);
      console.log("Item ID:", sorted[0].id);
      console.log("Batch ID:", sorted[0].batch_id);
    }

    return sorted;
  }, [filtered, sortConfig]);

  const handleCloseSuccessPopup = () => {
    setExportSuccess(false);
    setShowPopup(false);
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <section className="min-h-screen bg-blue-600 text-white font-poppins">
        <NavigationBar
          showPopup={showPopup}
          exportSuccess={exportSuccess}
          isExporting={isExporting}
        />
        <ResponsiveMain>
          <main
            className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
            aria-label="Inventory Report main content"
            tabIndex={-1}
          >
            <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
              <section className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-lg 2xs:rounded-xl xs:rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl border border-gray-800/50 p-1 2xs:p-1.5 xs:p-2 sm:p-4 md:p-6 lg:p-8 xl:p-12 w-full overflow-hidden">
                {/* Header Section */}
                <header className="flex flex-col space-y-2 2xs:space-y-3 xs:space-y-4 sm:space-y-6 mb-3 2xs:mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                  {/* Title and Action Row */}
                  <div className="flex flex-col gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg"></div>
                          <div className="relative bg-gradient-to-br from-blue-400 to-blue-500 p-2 sm:p-3 rounded-full">
                            <TbReportAnalytics className="text-black text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text font-poppins">
                            Inventory Analytics Report
                          </h2>
                          <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-1">
                            Comprehensive data analysis and business
                            intelligence
                          </p>
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        {/* Export Button */}
                        <button
                          onClick={() => setShowPopup(true)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-black px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg sm:rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm md:text-base whitespace-nowrap flex-1 sm:flex-none min-h-[44px] touch-manipulation"
                        >
                          <FaDownload className="text-xs sm:text-sm" />
                          <span>Export Report</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Report Summary Cards */}
                  <div className="grid grid-cols-1 2xs:grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-1 2xs:gap-2 xs:gap-2.5 sm:gap-3 md:gap-4">
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-md 2xs:rounded-lg xs:rounded-lg sm:rounded-xl p-1.5 2xs:p-2 xs:p-2.5 sm:p-3 md:p-4">
                      <div className="flex items-center justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-blue-400 text-2xs 2xs:text-xs xs:text-xs sm:text-sm font-medium truncate">
                            Total Items
                          </p>
                          <p className="text-white text-xs 2xs:text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                            {sortedData.length}
                          </p>
                        </div>
                        <FiBarChart className="text-blue-400 text-sm 2xs:text-base xs:text-lg sm:text-xl md:text-2xl flex-shrink-0" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-md 2xs:rounded-lg xs:rounded-lg sm:rounded-xl p-1.5 2xs:p-2 xs:p-2.5 sm:p-3 md:p-4">
                      <div className="flex items-center justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-red-400 text-2xs 2xs:text-xs xs:text-xs sm:text-sm font-medium truncate">
                            Critical Stock
                          </p>
                          <p className="text-white text-xs 2xs:text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                            {
                              sortedData.filter((item) => item.stock === "Low")
                                .length
                            }
                          </p>
                        </div>
                        <MdTrendingDown className="text-red-400 text-sm 2xs:text-base xs:text-lg sm:text-xl md:text-2xl flex-shrink-0" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-md 2xs:rounded-lg xs:rounded-lg sm:rounded-xl p-1.5 2xs:p-2 xs:p-2.5 sm:p-3 md:p-4">
                      <div className="flex items-center justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-yellow-400 text-2xs 2xs:text-xs xs:text-xs sm:text-sm font-medium truncate">
                            Normal Stock
                          </p>
                          <p className="text-white text-xs 2xs:text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                            {
                              sortedData.filter(
                                (item) => item.stock === "Normal"
                              ).length
                            }
                          </p>
                        </div>
                        <FiActivity className="text-yellow-400 text-sm 2xs:text-base xs:text-lg sm:text-xl md:text-2xl flex-shrink-0" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-md 2xs:rounded-lg xs:rounded-lg sm:rounded-xl p-1.5 2xs:p-2 xs:p-2.5 sm:p-3 md:p-4">
                      <div className="flex items-center justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-green-400 text-2xs 2xs:text-xs xs:text-xs sm:text-sm font-medium truncate">
                            Optimal Stock
                          </p>
                          <p className="text-white text-xs 2xs:text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                            {
                              sortedData.filter((item) => item.stock === "High")
                                .length
                            }
                          </p>
                        </div>
                        <MdTrendingUp className="text-green-400 text-sm 2xs:text-base xs:text-lg sm:text-xl md:text-2xl flex-shrink-0" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-md 2xs:rounded-lg xs:rounded-lg sm:rounded-xl p-1.5 2xs:p-2 xs:p-2.5 sm:p-3 md:p-4 col-span-1 2xs:col-span-2 xs:col-span-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-purple-400 text-2xs 2xs:text-xs xs:text-xs sm:text-sm font-medium truncate">
                            Total Value
                          </p>
                          <p className="text-white text-xs 2xs:text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                            {sortedData.reduce(
                              (sum, item) => sum + item.inStock,
                              0
                            )}
                          </p>
                        </div>
                        <FiPieChart className="text-purple-400 text-sm 2xs:text-base xs:text-lg sm:text-xl md:text-2xl flex-shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Report Metadata */}
                  <div className="bg-gray-800/20 backdrop-blur-sm rounded-lg 2xs:rounded-xl xs:rounded-xl p-2 2xs:p-3 xs:p-4 border border-gray-700/30">
                    <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 2xs:gap-3 xs:gap-4">
                      <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 w-full xs:w-auto">
                        <div className="flex items-center gap-1 2xs:gap-1.5 xs:gap-2 text-gray-300">
                          <FaCalendarAlt className="text-blue-400 text-xs 2xs:text-sm flex-shrink-0" />
                          <span className="text-2xs 2xs:text-xs xs:text-sm truncate">
                            Report Generated: {new Date().toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 2xs:gap-1.5 xs:gap-2 text-gray-300">
                          <MdAssessment className="text-blue-400 text-xs 2xs:text-sm flex-shrink-0" />
                          <span className="text-2xs 2xs:text-xs xs:text-sm truncate">
                            Data Points: {sortedData.length}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 2xs:gap-1.5 xs:gap-2 text-2xs 2xs:text-xs xs:text-sm text-gray-400 w-full xs:w-auto justify-end">
                        <span className="truncate">Last Updated:</span>
                        <span className="text-blue-400 font-medium truncate">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Divider */}
                <div className="relative mb-3 2xs:mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700/50"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-gradient-to-br from-gray-900 to-black px-2 2xs:px-3 xs:px-4 text-blue-400/70 text-2xs 2xs:text-xs xs:text-sm flex items-center gap-1 2xs:gap-1.5 xs:gap-2">
                      <FaChartLine className="text-2xs 2xs:text-xs xs:text-sm flex-shrink-0" />
                      <span className="truncate">
                        Advanced Analytics & Filtering
                      </span>
                    </span>
                  </div>
                </div>

                <section className="mb-3 2xs:mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                  {/* Filter Header */}
                  <div className="flex items-center justify-between mb-2 2xs:mb-3 xs:mb-4">
                    <div className="flex items-center gap-1 2xs:gap-2 xs:gap-3">
                      <div className="p-1 2xs:p-1.5 xs:p-2 bg-blue-500/10 rounded-md 2xs:rounded-lg border border-blue-500/20">
                        <FaFilter className="text-blue-400 text-xs 2xs:text-sm" />
                      </div>
                      <h3 className="text-sm 2xs:text-base xs:text-lg font-semibold text-white truncate">
                        Report Filters
                      </h3>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-2 2xs:mb-3 xs:mb-4">
                    <div className="absolute left-2 2xs:left-3 xs:left-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none">
                      <FaSearch className="text-xs 2xs:text-sm" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search inventory items, categories, or status..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400 rounded-lg 2xs:rounded-xl px-6 2xs:px-8 xs:px-12 py-2 2xs:py-3 xs:py-4 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400/50 border border-gray-600/50 hover:border-gray-500 transition-all text-2xs 2xs:text-xs xs:text-sm sm:text-base"
                    />
                    {searchQuery && (
                      <div className="absolute right-2 2xs:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 2xs:gap-2">
                        <button
                          onClick={() => setSearchQuery("")}
                          className="text-gray-400 hover:text-white transition-colors bg-gray-600/50 hover:bg-gray-500/50 rounded-full w-5 h-5 2xs:w-6 2xs:h-6 xs:w-7 xs:h-7 flex items-center justify-center text-xs 2xs:text-sm touch-manipulation"
                          title="Clear search"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Filter Controls */}
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg 2xs:rounded-xl p-2 2xs:p-3 xs:p-4 border border-gray-700/50">
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 2xs:gap-3 xs:gap-4">
                      <div>
                        <label className="flex items-center gap-1 2xs:gap-1.5 xs:gap-2 text-gray-300 text-2xs 2xs:text-xs xs:text-sm font-medium mb-1 2xs:mb-2">
                          <FaBoxes className="text-blue-400 text-2xs 2xs:text-xs flex-shrink-0" />
                          <span className="truncate">Category Filter</span>
                        </label>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md 2xs:rounded-lg px-2 2xs:px-3 py-2 2xs:py-3 border border-gray-600/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 cursor-pointer text-2xs 2xs:text-xs xs:text-sm transition-all min-h-[36px] 2xs:min-h-[40px] xs:min-h-[44px] touch-manipulation"
                        >
                          <option value="">All Categories</option>
                          {[
                            ...new Set(
                              [...inventory, ...pastInventory].map(
                                (i) => i.category
                              )
                            ),
                          ]
                            .filter(Boolean)
                            .map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-1 2xs:gap-1.5 xs:gap-2 text-gray-300 text-2xs 2xs:text-xs xs:text-sm font-medium mb-1 2xs:mb-2">
                          <FaCalendarAlt className="text-blue-400 text-2xs 2xs:text-xs flex-shrink-0" />
                          <span className="truncate">Report Date</span>
                        </label>
                        <select
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md 2xs:rounded-lg px-2 2xs:px-3 py-2 2xs:py-3 border border-gray-600/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 cursor-pointer text-2xs 2xs:text-xs xs:text-sm transition-all min-h-[36px] 2xs:min-h-[40px] xs:min-h-[44px] touch-manipulation"
                        >
                          <option value="">All Dates</option>
                          {dates.map((d) => (
                            <option key={d} value={d}>
                              {new Date(d).toLocaleDateString("en-CA", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              })}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="xs:col-span-2 sm:col-span-1">
                        <label className="flex items-center gap-1 2xs:gap-1.5 xs:gap-2 text-gray-300 text-2xs 2xs:text-xs xs:text-sm font-medium mb-1 2xs:mb-2">
                          <FaChartLine className="text-blue-400 text-2xs 2xs:text-xs flex-shrink-0" />
                          <span className="truncate">Time Period</span>
                        </label>
                        <select
                          value={period}
                          onChange={(e) => setPeriod(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md 2xs:rounded-lg px-2 2xs:px-3 py-2 2xs:py-3 border border-gray-600/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 cursor-pointer text-2xs 2xs:text-xs xs:text-sm transition-all min-h-[36px] 2xs:min-h-[40px] xs:min-h-[44px] touch-manipulation"
                        >
                          <option value="all">All Time</option>
                          <option value="weekly">This Week</option>
                          <option value="monthly">This Month</option>
                          <option value="yearly">This Year</option>
                        </select>
                      </div>
                    </div>

                    {/* Clear All Button inside filter controls */}
                    {(searchQuery ||
                      categoryFilter ||
                      reportDate ||
                      period !== "all" ||
                      sortConfig.key !== "") && (
                      <div className="mt-2 2xs:mt-3 xs:mt-4 pt-2 2xs:pt-3 xs:pt-4 border-t border-gray-700/30">
                        <div className="flex justify-center">
                          <button
                            onClick={handleClear}
                            className="flex items-center gap-1 2xs:gap-1.5 xs:gap-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 2xs:px-3 xs:px-4 py-1.5 2xs:py-2 rounded-md 2xs:rounded-lg border border-red-500/20 hover:border-red-500/30 transition-all duration-200 text-2xs 2xs:text-xs xs:text-sm font-medium min-h-[36px] 2xs:min-h-[40px] xs:min-h-[44px] touch-manipulation"
                          >
                            <span>🗑️</span>
                            <span className="truncate">Clear All Filters</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Filter Summary */}
                    <div className="mt-2 2xs:mt-3 xs:mt-4 pt-2 2xs:pt-3 xs:pt-4 border-t border-gray-700/30">
                      <div className="flex flex-wrap items-center gap-1 2xs:gap-1.5 xs:gap-2 text-2xs 2xs:text-xs xs:text-sm">
                        <span className="text-gray-400 flex-shrink-0">
                          Active Filters:
                        </span>
                        {!searchQuery &&
                        !categoryFilter &&
                        !reportDate &&
                        period === "all" &&
                        sortConfig.key === "" ? (
                          <span className="text-gray-500 italic">None</span>
                        ) : (
                          <>
                            {searchQuery && (
                              <div className="flex items-center gap-0.5 2xs:gap-1 bg-blue-500/20 text-blue-400 px-1 2xs:px-1.5 xs:px-2 py-0.5 2xs:py-1 rounded-sm 2xs:rounded-md border border-blue-500/30 max-w-[120px] 2xs:max-w-[150px] xs:max-w-none">
                                <span className="truncate">
                                  Search: "{searchQuery}"
                                </span>
                                <button
                                  onClick={clearSearch}
                                  className="text-blue-300 hover:text-white transition-colors text-xs 2xs:text-sm touch-manipulation flex-shrink-0"
                                  title="Clear search"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {categoryFilter && (
                              <div className="flex items-center gap-0.5 2xs:gap-1 bg-purple-500/20 text-purple-400 px-1 2xs:px-1.5 xs:px-2 py-0.5 2xs:py-1 rounded-sm 2xs:rounded-md border border-purple-500/30 max-w-[120px] 2xs:max-w-[150px] xs:max-w-none">
                                <span className="truncate">
                                  Category: {categoryFilter}
                                </span>
                                <button
                                  onClick={clearCategory}
                                  className="text-purple-300 hover:text-white transition-colors text-xs 2xs:text-sm touch-manipulation flex-shrink-0"
                                  title="Clear category filter"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {reportDate && (
                              <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-md border border-green-500/30">
                                <span>Date: {reportDate}</span>
                                <button
                                  onClick={clearDate}
                                  className="text-green-300 hover:text-white transition-colors ml-1"
                                  title="Clear date filter"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {period !== "all" && (
                              <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md border border-blue-500/30">
                                <span>Period: {period}</span>
                                <button
                                  onClick={clearPeriod}
                                  className="text-blue-300 hover:text-white transition-colors ml-1"
                                  title="Clear period filter"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {sortConfig.key !== "" && (
                              <div className="flex items-center gap-0.5 2xs:gap-1 bg-gray-500/20 text-gray-400 px-1 2xs:px-1.5 xs:px-2 py-0.5 2xs:py-1 rounded-sm 2xs:rounded-md border border-gray-500/30 max-w-[120px] 2xs:max-w-[150px] xs:max-w-none">
                                <span className="truncate">
                                  Sort: {sortConfig.key} (
                                  {sortConfig.direction === "asc" ? "↑" : "↓"})
                                </span>
                                <button
                                  onClick={() =>
                                    setSortConfig({ key: "", direction: "asc" })
                                  }
                                  className="text-gray-300 hover:text-white transition-colors text-xs 2xs:text-sm touch-manipulation flex-shrink-0"
                                  title="Clear sort"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Table Section - Ultra Responsive */}
                <section className="bg-gray-800/30 backdrop-blur-sm rounded-lg 2xs:rounded-xl xs:rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
                  {/* Ultra Small Screen - Compact Cards */}
                  <div className="hidden">
                    <div className="p-1.5 space-y-1.5">
                      {sortedData.length === 0 ? (
                        <div className="text-center py-6">
                          <FaBoxes className="text-3xl text-gray-600 mx-auto mb-2" />
                          <h3 className="text-gray-400 font-medium mb-1 text-xs">
                            No data
                          </h3>
                          <p className="text-gray-500 text-2xs">
                            Adjust filters
                          </p>
                        </div>
                      ) : (
                        sortedData.map((item, index) => (
                          <div
                            key={item.id ? item.id : `${item.name}-${index}`}
                            className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 rounded p-1.5 border border-gray-700/30 fold-compact"
                          >
                            <div className="flex justify-between items-start gap-1 mb-1">
                              <span
                                className="text-white font-semibold text-2xs truncate flex-1"
                                title={item.name}
                              >
                                {item.name.substring(0, 10)}...
                              </span>
                              <span
                                className={`text-2xs font-bold ${
                                  item.stock === "Low"
                                    ? "text-red-400"
                                    : item.stock === "Normal"
                                    ? "text-blue-400"
                                    : "text-green-400"
                                }`}
                              >
                                {item.stock}
                              </span>
                            </div>
                            <div className="flex justify-between text-2xs text-gray-400">
                              <span>Stock: {item.inStock}</span>
                              <span>{item.category}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Extra Small Screen - Mobile Cards */}
                  <div className="hidden">
                    <div className="p-2 space-y-2">
                      {sortedData.length === 0 ? (
                        <div className="text-center py-8">
                          <FaBoxes className="text-4xl text-gray-600 mx-auto mb-3" />
                          <h3 className="text-gray-400 font-medium mb-1 text-xs">
                            No inventory data
                          </h3>
                          <p className="text-gray-500 text-2xs">
                            Try adjusting filters
                          </p>
                        </div>
                      ) : (
                        sortedData.map((item, index) => (
                          <div
                            key={item.id ? item.id : `${item.name}-${index}`}
                            className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 rounded-lg p-2 border border-gray-700/30 xs-compact"
                          >
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <span
                                  className="text-white font-semibold text-xs truncate block"
                                  title={item.name}
                                >
                                  {item.name}
                                </span>
                                <span className="text-blue-400 text-2xs">
                                  {item.category}
                                </span>
                              </div>
                              <span
                                className={`px-1.5 py-0.5 rounded text-2xs font-bold ${
                                  item.stock === "Low"
                                    ? "bg-red-500/20 text-red-400"
                                    : item.stock === "Normal"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-green-500/20 text-green-400"
                                }`}
                              >
                                {item.stock}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 text-2xs">
                              <div className="bg-blue-500/10 rounded p-1.5">
                                <p className="text-blue-400 mb-0.5">Stock</p>
                                <p className="text-white font-bold">
                                  {item.inStock}
                                </p>
                              </div>
                              <div className="bg-red-500/10 rounded p-1.5">
                                <p className="text-red-400 mb-0.5">Wastage</p>
                                <p className="text-white font-bold">
                                  {item.wastage}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Small Screen and Above - Standard Mobile Cards */}
                  <div className="hidden">
                    {/* Mobile Sort Controls */}
                    <div className="p-2 xs:p-3 border-b border-gray-700/30 bg-gray-800/50">
                      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                        <span className="text-gray-300 text-xs xs:text-sm font-medium flex-shrink-0">
                          Sort:
                        </span>
                        <select
                          value={`${sortConfig.key}-${sortConfig.direction}`}
                          onChange={(e) => {
                            const [key, direction] = e.target.value.split("-");
                            setSortConfig({
                              key,
                              direction: direction as "asc" | "desc",
                            });
                          }}
                          className="bg-gray-700/50 text-white rounded-md xs:rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 border border-gray-600/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-2xs xs:text-xs w-full xs:w-auto min-w-0 touch-target"
                        >
                          <option value="name-asc">Name (A-Z)</option>
                          <option value="name-desc">Name (Z-A)</option>
                          <option value="inStock-asc">Stock (Low-High)</option>
                          <option value="inStock-desc">Stock (High-Low)</option>
                          <option value="category-asc">Category (A-Z)</option>
                          <option value="category-desc">Category (Z-A)</option>
                          <option value="stock-asc">Status (A-Z)</option>
                          <option value="stock-desc">Status (Z-A)</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-2 xs:p-3 space-y-2 xs:space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                      {sortedData.length === 0 ? (
                        <div className="text-center py-8 xs:py-12">
                          <FaBoxes className="text-4xl xs:text-5xl text-gray-600 mx-auto mb-3 xs:mb-4" />
                          <h3 className="text-gray-400 font-medium mb-1 xs:mb-2 text-sm xs:text-base">
                            No inventory data found
                          </h3>
                          <p className="text-gray-500 text-xs xs:text-sm">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      ) : (
                        sortedData.map((item, index) => (
                          <div
                            key={item.id ? item.id : `${item.name}-${index}`}
                            className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-lg xs:rounded-xl p-2 xs:p-3 border border-gray-700/30 hover:border-blue-500/30 transition-all duration-200 touch-manipulation responsive-card"
                          >
                            <div className="flex items-start justify-between mb-2 gap-2">
                              <div className="flex-1 min-w-0">
                                <h3
                                  className="text-white font-semibold text-xs xs:text-sm mb-1 truncate"
                                  title={item.name}
                                >
                                  {item.name}
                                </h3>
                                <div className="flex flex-wrap gap-1 xs:gap-1.5 mb-1 xs:mb-2">
                                  <span className="px-1.5 py-0.5 bg-blue-600/20 rounded text-2xs xs:text-xs font-medium text-blue-300 whitespace-nowrap">
                                    {item.category}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-2xs xs:text-xs font-medium whitespace-nowrap ${
                                      item.stock === "Low"
                                        ? "bg-red-500/20 text-red-400"
                                        : item.stock === "Normal"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-green-500/20 text-green-400"
                                    }`}
                                  >
                                    {item.stock}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 xs:gap-3 mb-2">
                              <div className="bg-blue-500/10 rounded-md xs:rounded-lg p-1.5 xs:p-2 border border-blue-500/20">
                                <p className="text-blue-400 text-2xs xs:text-xs font-medium mb-0.5 truncate">
                                  In Stock
                                </p>
                                <p className="text-white text-sm xs:text-base font-bold">
                                  {item.inStock}
                                </p>
                              </div>
                              <div className="bg-red-500/10 rounded-md xs:rounded-lg p-1.5 xs:p-2 border border-red-500/20">
                                <p className="text-red-400 text-2xs xs:text-xs font-medium mb-0.5 truncate">
                                  Wastage
                                </p>
                                <p className="text-white text-sm xs:text-base font-bold">
                                  {item.wastage}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 xs:gap-3">
                              <div className="bg-purple-500/10 rounded-md xs:rounded-lg p-1.5 xs:p-2 border border-purple-500/20">
                                <p className="text-purple-400 text-2xs xs:text-xs font-medium mb-0.5 truncate">
                                  Batch ID
                                </p>
                                <p className="text-white text-xs xs:text-sm font-mono truncate">
                                  {item.batch_id || "N/A"}
                                </p>
                              </div>
                              <div className="bg-green-500/10 rounded-md xs:rounded-lg p-1.5 xs:p-2 border border-green-500/20">
                                <p className="text-green-400 text-2xs xs:text-xs font-medium mb-0.5 truncate">
                                  Report Date
                                </p>
                                <p className="text-white text-xs xs:text-sm font-mono truncate">
                                  {item.report_date}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Tablet Table View - Medium screens */}
                  <div className="hidden md:block lg:hidden overflow-x-auto">
                    <table className="table-auto w-full text-sm text-left border-collapse min-w-[600px]">
                      <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                        <tr>
                          {[
                            { key: "name", label: "Item" },
                            { key: "category", label: "Category" },
                            { key: "inStock", label: "Stock" },
                            { key: "wastage", label: "Wastage" },
                            { key: "stock", label: "Status" },
                            { key: "report_date", label: "Date" },
                          ].map((col) => (
                            <th
                              key={col.key}
                              onClick={() => requestSort(col.key)}
                              className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 text-left font-semibold cursor-pointer select-none whitespace-nowrap text-xs lg:text-sm xl:text-base transition-colors text-gray-300 hover:text-blue-400 no-select touch-target"
                              scope="col"
                              tabIndex={0}
                              aria-label={`Sort by ${col.label}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{col.label}</span>
                                {sortConfig.key === col.key && (
                                  <span className="text-blue-400 flex-shrink-0">
                                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                                  </span>
                                )}
                                {sortConfig.key !== col.key && (
                                  <FaSort className="text-gray-500 text-xs opacity-50 flex-shrink-0" />
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedData.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-8 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <FaBoxes className="text-4xl text-gray-600" />
                                <div>
                                  <h3 className="text-gray-400 font-medium mb-1 text-sm">
                                    No inventory data found
                                  </h3>
                                  <p className="text-gray-500 text-xs">
                                    Try adjusting your search or filter criteria
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          sortedData.map((item, index) => (
                            <tr
                              key={item.id ? item.id : `${item.name}-${index}`}
                              className={`group border-b border-gray-700/30 hover:bg-gradient-to-r hover:from-blue-400/5 hover:to-blue-500/5 transition-all duration-200 cursor-pointer ${
                                index % 2 === 0
                                  ? "bg-gray-800/20"
                                  : "bg-gray-900/20"
                              }`}
                            >
                              <td className="px-3 py-3 font-medium">
                                <div className="flex flex-col gap-1">
                                  <span
                                    className="text-white group-hover:text-blue-400 transition-colors text-sm font-semibold truncate"
                                    title={item.name}
                                  >
                                    {item.name}
                                  </span>
                                  <span className="text-gray-400 text-xs">
                                    ID: {item.id || "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                                  {item.category}
                                </span>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-center">
                                <span className="text-white font-semibold text-base">
                                  {item.inStock}
                                </span>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-center">
                                <span className="text-red-400 font-semibold text-base">
                                  {item.wastage}
                                </span>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-bold ${
                                    item.stock === "Low"
                                      ? "bg-red-500/20 text-red-400"
                                      : item.stock === "Normal"
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-green-500/20 text-green-400"
                                  }`}
                                >
                                  {item.stock}
                                </span>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-gray-300 text-xs font-mono">
                                {item.report_date}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Desktop Table View - Large screens */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="table-auto w-full text-sm xl:text-base text-left border-collapse min-w-[800px]">
                      <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                        <tr>
                          {[
                            { key: "id", label: "Item ID" },
                            { key: "name", label: "Item Name" },
                            { key: "batch_id", label: "Batch ID" },
                            { key: "category", label: "Category" },
                            { key: "inStock", label: "In Stock" },
                            { key: "wastage", label: "Wastage" },
                            {
                              key: "expiration_date",
                              label: "Expiration Date",
                            },
                            { key: "stock", label: "Status" },
                            { key: "report_date", label: "Report Date" },
                          ].map((col) => (
                            <th
                              key={col.key}
                              onClick={() => requestSort(col.key)}
                              className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 text-left font-semibold cursor-pointer select-none whitespace-nowrap text-xs lg:text-sm xl:text-base transition-colors text-gray-300 hover:text-blue-400 no-select touch-target"
                              scope="col"
                              tabIndex={0}
                              aria-label={`Sort by ${col.label}`}
                            >
                              <div className="flex items-center gap-1.5 lg:gap-2">
                                <span className="truncate">{col.label}</span>
                                {sortConfig.key === col.key && (
                                  <span className="text-blue-400 flex-shrink-0">
                                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                                  </span>
                                )}
                                {sortConfig.key !== col.key && (
                                  <FaSort className="text-gray-500 text-xs opacity-50 flex-shrink-0" />
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={9}
                              className="px-3 lg:px-4 xl:px-6 py-8 lg:py-12 xl:py-16 text-center"
                            >
                              <div className="flex flex-col items-center gap-3 lg:gap-4">
                                <FaBoxes className="text-4xl lg:text-5xl xl:text-6xl text-gray-600" />
                                <div>
                                  <h3 className="text-gray-400 font-medium mb-1 lg:mb-2 text-sm lg:text-base">
                                    No inventory data found
                                  </h3>
                                  <p className="text-gray-500 text-xs lg:text-sm">
                                    Try adjusting your search or filter criteria
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          sortedData.map((item, index) => {
                            console.log(`[Table Render] Item ${index}:`, {
                              id: item.id,
                              name: item.name,
                              batch_id: item.batch_id,
                              raw_item: item,
                            });
                            return (
                              <tr
                                key={
                                  item.id ? item.id : `${item.name}-${index}`
                                }
                                className={`group border-b border-gray-700/30 hover:bg-gradient-to-r hover:from-blue-400/5 hover:to-blue-500/5 transition-all duration-200 cursor-pointer ${
                                  index % 2 === 0
                                    ? "bg-gray-800/20"
                                    : "bg-gray-900/20"
                                }`}
                              >
                                <td className="px-4 xl:px-6 py-4 xl:py-5 font-medium whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <span className="text-blue-400 group-hover:text-blue-300 transition-colors font-mono text-sm">
                                      #{item.id || "N/A"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 xl:px-6 py-4 xl:py-5 font-medium whitespace-nowrap">
                                  <span className="text-white group-hover:text-blue-400 transition-colors">
                                    {item.name || "Unknown Item"}
                                  </span>
                                </td>
                                <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap text-gray-300">
                                  <span className="px-2 py-1 bg-gray-700/50 rounded-lg text-xs font-medium font-mono">
                                    {item.batch_id || "N/A"}
                                  </span>
                                </td>
                                <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap text-gray-300">
                                  <span className="px-2 py-1 bg-gray-700/50 rounded-lg text-xs font-medium">
                                    {item.category}
                                  </span>
                                </td>
                                <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap">
                                  <span className="text-white font-semibold text-lg">
                                    {item.inStock}
                                  </span>
                                </td>
                                <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap text-gray-300">
                                  {item.wastage}
                                </td>
                                <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap">
                                  {item.expiration_date ? (
                                    <div className="flex flex-col">
                                      <span
                                        className={`text-sm font-medium ${
                                          new Date(item.expiration_date) <=
                                          new Date()
                                            ? "text-red-400"
                                            : new Date(item.expiration_date) <=
                                              new Date(
                                                Date.now() +
                                                  7 * 24 * 60 * 60 * 1000
                                              )
                                            ? "text-blue-400"
                                            : "text-green-400"
                                        }`}
                                      >
                                        {new Date(
                                          item.expiration_date
                                        ).toLocaleDateString()}
                                      </span>
                                      <span
                                        className={`text-xs ${
                                          new Date(item.expiration_date) <=
                                          new Date()
                                            ? "text-red-300"
                                            : new Date(item.expiration_date) <=
                                              new Date(
                                                Date.now() +
                                                  7 * 24 * 60 * 60 * 1000
                                              )
                                            ? "text-blue-300"
                                            : "text-green-300"
                                        }`}
                                      >
                                        {new Date(item.expiration_date) <=
                                        new Date()
                                          ? "Expired"
                                          : new Date(item.expiration_date) <=
                                            new Date(
                                              Date.now() +
                                                7 * 24 * 60 * 60 * 1000
                                            )
                                          ? "Expiring Soon"
                                          : "Good"}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-sm">
                                      N/A
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                      item.stock === "Low"
                                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                                        : item.stock === "Normal"
                                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                        : "bg-green-500/20 text-green-400 border-green-500/30"
                                    }`}
                                  >
                                    {item.stock === "Low"
                                      ? "Critical"
                                      : item.stock === "Normal"
                                      ? "Moderate"
                                      : "Sufficient"}
                                  </span>
                                </td>
                                <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap text-gray-300 text-sm">
                                  {new Date(
                                    item.report_date
                                  ).toLocaleDateString()}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden">
                    {/* Mobile Sort Controls */}
                    <div className="p-4 border-b border-gray-700/30 bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm font-medium">
                          Sort by:
                        </span>
                        <select
                          value={`${sortConfig.key}-${sortConfig.direction}`}
                          onChange={(e) => {
                            const [key, direction] = e.target.value.split("-");
                            setSortConfig({
                              key,
                              direction: direction as "asc" | "desc",
                            });
                          }}
                          className="bg-gray-700/50 text-white rounded-lg px-3 py-2 border border-gray-600/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-sm"
                        >
                          <option value="id-asc">Item ID (Low-High)</option>
                          <option value="id-desc">Item ID (High-Low)</option>
                          <option value="name-asc">Name (A-Z)</option>
                          <option value="name-desc">Name (Z-A)</option>
                          <option value="expiration_date-asc">
                            Expiration (Earliest)
                          </option>
                          <option value="expiration_date-desc">
                            Expiration (Latest)
                          </option>
                          <option value="inStock-asc">Stock (Low-High)</option>
                          <option value="inStock-desc">Stock (High-Low)</option>
                          <option value="category-asc">Category (A-Z)</option>
                          <option value="batch_id-asc">Batch ID</option>
                          <option value="stock-asc">Status</option>
                        </select>
                      </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="p-4 space-y-4">
                      {sortedData.length === 0 ? (
                        <div className="text-center py-12">
                          <FaBoxes className="text-6xl text-gray-600 mx-auto mb-4" />
                          <h3 className="text-gray-400 font-medium mb-2">
                            No inventory data found
                          </h3>
                          <p className="text-gray-500 text-sm">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      ) : (
                        sortedData.map((item, index) => (
                          <div
                            key={item.id ? item.id : `${item.name}-${index}`}
                            className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30 hover:border-blue-500/30 transition-all duration-200 touch-manipulation"
                          >
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-1 bg-blue-600/20 rounded-lg text-xs font-medium text-blue-300 font-mono">
                                    ID: #{item.id || "N/A"}
                                  </span>
                                </div>
                                <h3 className="text-white font-semibold text-base mb-1">
                                  {item.name || "Unknown Item"}
                                </h3>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <span className="px-2 py-1 bg-gray-700/50 rounded-lg text-xs font-medium text-gray-300">
                                    {item.category || "No Category"}
                                  </span>
                                  <span className="px-2 py-1 bg-purple-600/20 rounded-lg text-xs font-medium text-purple-300 font-mono">
                                    Batch: {item.batch_id || "N/A"}
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ml-3 ${
                                  item.stock === "Low"
                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                    : item.stock === "Normal"
                                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                    : "bg-green-500/20 text-green-400 border-green-500/30"
                                }`}
                              >
                                {item.stock === "Low"
                                  ? "Critical"
                                  : item.stock === "Normal"
                                  ? "Moderate"
                                  : "Sufficient"}
                              </span>
                            </div>

                            {/* Expiration Alert */}
                            {item.expiration_date && (
                              <div
                                className={`mb-3 p-2 rounded-lg border ${
                                  new Date(item.expiration_date) <= new Date()
                                    ? "bg-red-500/10 border-red-500/30"
                                    : new Date(item.expiration_date) <=
                                      new Date(
                                        Date.now() + 7 * 24 * 60 * 60 * 1000
                                      )
                                    ? "bg-blue-500/10 border-blue-500/30"
                                    : "bg-green-500/10 border-green-500/30"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-gray-400">
                                    Expiration:
                                  </span>
                                  <div className="text-right">
                                    <p
                                      className={`text-sm font-medium ${
                                        new Date(item.expiration_date) <=
                                        new Date()
                                          ? "text-red-400"
                                          : new Date(item.expiration_date) <=
                                            new Date(
                                              Date.now() +
                                                7 * 24 * 60 * 60 * 1000
                                            )
                                          ? "text-yellow-400"
                                          : "text-green-400"
                                      }`}
                                    >
                                      {new Date(
                                        item.expiration_date
                                      ).toLocaleDateString()}
                                    </p>
                                    <p
                                      className={`text-xs ${
                                        new Date(item.expiration_date) <=
                                        new Date()
                                          ? "text-red-300"
                                          : new Date(item.expiration_date) <=
                                            new Date(
                                              Date.now() +
                                                7 * 24 * 60 * 60 * 1000
                                            )
                                          ? "text-yellow-300"
                                          : "text-green-300"
                                      }`}
                                    >
                                      {new Date(item.expiration_date) <=
                                      new Date()
                                        ? "Expired"
                                        : new Date(item.expiration_date) <=
                                          new Date(
                                            Date.now() + 7 * 24 * 60 * 60 * 1000
                                          )
                                        ? "Expiring Soon"
                                        : "Good"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Card Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                                <p className="text-blue-400 text-xs font-medium mb-1">
                                  In Stock
                                </p>
                                <p className="text-white text-lg font-bold">
                                  {item.inStock}
                                </p>
                              </div>
                              <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                                <p className="text-red-400 text-xs font-medium mb-1">
                                  Wastage
                                </p>
                                <p className="text-white text-lg font-bold">
                                  {item.wastage}
                                </p>
                              </div>
                            </div>

                            {/* Card Footer */}
                            <div className="flex items-center justify-between text-sm text-gray-400">
                              <span>Report Date:</span>
                              <span className="text-blue-400 font-medium">
                                {new Date(
                                  item.report_date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              </section>
            </div>

            {/* Enhanced Export Modal */}
            {showPopup && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
                <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-3 sm:space-y-4 md:space-y-6 max-w-xs sm:max-w-sm md:max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl"></div>
                      <div className="relative bg-gradient-to-br from-blue-400 to-blue-500 p-3 sm:p-4 rounded-full">
                        <FaDownload className="text-white text-2xl sm:text-3xl" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text font-poppins">
                    Export Report
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm md:text-base">
                    Download your inventory analytics report in your preferred
                    format
                  </p>

                  {/* Export Statistics */}
                  <div className="bg-gray-800/30 rounded-lg p-3 text-left">
                    <div className="text-xs text-gray-400 mb-2">
                      Report Summary:
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div className="text-gray-300">
                        <span className="text-blue-400 font-semibold">
                          {sortedData.length}
                        </span>{" "}
                        items
                      </div>
                      <div className="text-gray-300">
                        <span className="text-red-400 font-semibold">
                          {
                            sortedData.filter((item) => item.stock === "Low")
                              .length
                          }
                        </span>{" "}
                        critical
                      </div>
                      <div className="text-gray-300">
                        <span className="text-purple-400 font-semibold">
                          {sortedData.reduce(
                            (sum, item) => sum + item.inStock,
                            0
                          )}
                        </span>{" "}
                        total stock
                      </div>
                      <div className="text-gray-300">
                        <span className="text-yellow-400 font-semibold">
                          {sortedData.reduce(
                            (sum, item) => sum + item.wastage,
                            0
                          )}
                        </span>{" "}
                        wastage
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4 pt-2">
                    <button
                      onClick={() => {
                        exportExcel();
                        setExportSuccess(true);
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-semibold px-4 sm:px-6 py-3 rounded-lg sm:rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px] touch-manipulation"
                      type="button"
                    >
                      <span className="text-base sm:text-lg">📊</span> Export to
                      Excel (.xlsx)
                    </button>

                    <GoogleSheetIntegration
                      onSuccess={async (resp: any) => {
                        setIsExporting(true);
                        await handleGoogle(resp);
                        setIsExporting(false);
                        setExportSuccess(true);
                      }}
                      exporting={isExporting}
                    />

                    <button
                      onClick={() => setShowPopup(false)}
                      className="w-full border-2 border-gray-500/70 text-gray-400 hover:bg-gray-500 hover:text-white font-semibold px-4 sm:px-6 py-3 rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base min-h-[44px] touch-manipulation"
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Success Modal */}
            {exportSuccess && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="excel-dialog-title"
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              >
                <form
                  method="dialog"
                  className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full">
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
                        <div className="relative bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-full">
                          <MdCheckCircle className="text-white text-3xl" />
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-green-400 to-green-500 bg-clip-text font-poppins">
                      Export Successful!
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base">
                      Your inventory report has been exported successfully and
                      is ready for download.
                    </p>

                    <button
                      onClick={() => handleCloseSuccessPopup()}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200"
                      type="button"
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Enhanced Loading Modal */}
            {isExporting && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="gsheet-dialog-title"
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              >
                <form
                  method="dialog"
                  className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full">
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
                        <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-full">
                          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text font-poppins">
                      Exporting to Google Sheets...
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base">
                      Please wait while we process your request. This may take a
                      few moments.
                    </p>
                  </div>
                </form>
              </div>
            )}
          </main>
        </ResponsiveMain>
      </section>
    </GoogleOAuthProvider>
  );
}
