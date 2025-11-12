"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/app/utils/Server/supabaseClient";
import dayjs from "dayjs";
import { useInventoryReportAPI } from "./hook/use-inventoryreport";

// Define InventoryItem interface (should match backend shape)
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
  batch_id_display?: string; // For display purposes (may have different format)
  created_at?: string;
  updated?: string;
  unit_cost?: number; // Cost per unit
  total_value?: number; // Calculated: inStock * unit_cost
  [key: string]: string | number | undefined;
}
import { TbReportAnalytics } from "react-icons/tb";
import { MdAssessment } from "react-icons/md";
import { MdCheckCircle } from "react-icons/md";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import NavigationBar from "@/app/components/navigation/navigation";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { saveAs } from "file-saver";
// (Removed duplicate export default and misplaced logic. All logic is inside the main ReportInventory function below.)
import ExcelJS from "exceljs";

import {
  FaSearch,
  FaGoogle,
  FaBoxes,
  FaSort,
  FaChartLine,
  FaCalendarAlt,
  FaDownload,
  FaFilter,
} from "react-icons/fa";
import { BiExport } from "react-icons/bi";
import { useInventoryAnalytics } from "./hooks/useInventoryAnalytics";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import InventoryCharts from "./components/InventoryCharts";
import Pagination from "@/app/components/Pagination";

export default function ReportInventory() {
  // Google OAuth Client ID
  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

  // GoogleSheetIntegration stub (if not imported elsewhere)
  // Accepts onSuccess and exporting props for compatibility
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
      onError: (err) => {
        console.error(err);
        alert(
          "Google authentication failed. Please ensure you grant all requested permissions."
        );
      },
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

  // ...all state declarations above...
  // Helper to reload all inventory and spoilage data
  const reloadAllData = async () => {
    setLoading(true);
    try {
      await load();
      let start = startDate;
      let end = endDate;
      if (!start && !end && period !== "all") {
        const now = dayjs();
        if (period === "today") {
          start = now.format("YYYY-MM-DD");
          end = now.format("YYYY-MM-DD");
        } else if (period === "week") {
          start = now.subtract(7, "day").format("YYYY-MM-DD");
          end = now.format("YYYY-MM-DD");
        } else if (period === "month") {
          start = now.subtract(30, "day").format("YYYY-MM-DD");
          end = now.format("YYYY-MM-DD");
        } else if (period === "year") {
          start = now.subtract(365, "day").format("YYYY-MM-DD");
          end = now.format("YYYY-MM-DD");
        }
      }
      await fetchSpoilageSummary(start, end);
    } finally {
      setLoading(false);
    }
  };

  // Spoilage items state
  const [spoilageItems, setSpoilageItems] = useState<any[]>([]);
  // Spoilage summary state
  const [spoilageSummary, setSpoilageSummary] = useState<number | null>(null);
  const [spoilageLoading, setSpoilageLoading] = useState(false);
  const { fetchSpoilageSummary } = useInventoryReportAPI();

  // Loading state for refresh button
  const [loading, setLoading] = useState(false);

  // Toggle for showing spoilage table separately
  const [showSpoilageTable, setShowSpoilageTable] = useState(false);
  const [spoilageInventory, setSpoilageInventory] = useState<InventoryItem[]>(
    []
  );

  // Additional filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const { user } = useAuth();
  const [pastInventory, setPastInventory] = useState<InventoryItem[]>([]);

  // Cache inventory data in localStorage for backup
  useEffect(() => {
    try {
      localStorage.setItem("inventoryReportCache", JSON.stringify(inventory));
    } catch {}
  }, [inventory]);

  const [historicalInventory, setHistoricalInventory] = useState<
    InventoryItem[]
  >([]);
  const [isHistoricalMode, setIsHistoricalMode] = useState(false);
  const [availableHistoricalDates, setAvailableHistoricalDates] = useState<
    string[]
  >([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Additional filter states
  const [categoryFilter, setCategoryFilter] = useState(""); // <-- Add this line
  const [stockStatusFilter, setStockStatusFilter] = useState("");
  const [expirationFilter, setExpirationFilter] = useState("");
  const [period, setPeriod] = useState<
    "all" | "today" | "week" | "month" | "year" | "custom"
  >("all");

  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "asc",
  });
  const { fetchLogs, saveLogs } = useInventoryReportAPI();

  const [settings, setSettings] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/inventory-settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error("Error fetching inventory settings:", err);
        setSettings([]);
      }
    }
    fetchSettings();
  }, []);

  // Fetch inventory analytics
  const {
    analytics,
    loading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useInventoryAnalytics(startDate, endDate);

  const load = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      // Fetch ALL inventory sources for comprehensive report
      const [masterResponse, todayResponse, surplusResponse, spoilageResponse] =
        await Promise.all([
          fetch("/api/inventory", { method: "GET", headers }), // Master Inventory
          fetch("/api/inventory-today", { method: "GET", headers }), // Today's Inventory
          fetch("/api/inventory-surplus", { method: "GET", headers }), // Surplus Inventory
          fetch("/api/inventory-spoilage", { method: "GET", headers }), // Spoilage Inventory
        ]);

      const masterInventory = masterResponse.ok
        ? await masterResponse.json()
        : [];
      const todayInventory = todayResponse.ok ? await todayResponse.json() : [];
      const surplusInventory = surplusResponse.ok
        ? await surplusResponse.json()
        : [];
      const spoilageInventory = spoilageResponse.ok
        ? await spoilageResponse.json()
        : [];

      console.log("[DEBUG] Raw data from APIs:");
      const masterMS = masterInventory.filter((i: any) =>
        i.item_name?.toLowerCase().includes("magic sarap")
      );
      const surplusMS = surplusInventory.filter((i: any) =>
        i.item_name?.toLowerCase().includes("magic sarap")
      );
      console.log("Master Magic Sarap:", masterMS);
      console.log("Surplus Magic Sarap:", surplusMS);
      if (surplusMS.length > 0) {
        console.log("Surplus Magic Sarap DETAILED:", {
          surplus_id: surplusMS[0].surplus_id,
          item_name: surplusMS[0].item_name,
          quantity_surplus: surplusMS[0].quantity_surplus,
          stock_quantity: surplusMS[0].stock_quantity,
          batch_date: surplusMS[0].batch_date,
          all_fields: Object.keys(surplusMS[0]),
        });
      }

      // Debug spoilage data
      if (spoilageInventory.length > 0) {
        console.log("[DEBUG] First Spoilage Item:", {
          spoilage_id: spoilageInventory[0].spoilage_id,
          item_name: spoilageInventory[0].item_name,
          quantity_spoiled: spoilageInventory[0].quantity_spoiled,
          spoilage_date: spoilageInventory[0].spoilage_date,
          reason: spoilageInventory[0].reason,
          all_fields: Object.keys(spoilageInventory[0]),
        });
      }

      // Helper function to normalize batch_id to YYYY-MM-DD format
      const normalizeBatchId = (
        batchDate: any,
        batchId: any,
        createdAt: any
      ): string => {
        // Priority: batch_date > batch_id > created_at
        const dateValue = batchDate || batchId || createdAt;

        if (!dateValue) return "N/A";

        try {
          // If it's already in YYYY-MM-DD format, return as is
          if (
            typeof dateValue === "string" &&
            /^\d{4}-\d{2}-\d{2}/.test(dateValue)
          ) {
            return dateValue.split("T")[0]; // Remove time part if exists
          }

          // Parse and convert to YYYY-MM-DD
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split("T")[0];
          }

          return dateValue.toString();
        } catch {
          return dateValue?.toString() || "N/A";
        }
      };

      // Combine ONLY active inventory sources (excluding spoilage from table)
      // Group by Item Name and Batch ID to combine quantities from different sources
      const allInventoryItems = [
        // Master Inventory (active stock)
        ...masterInventory.map((item: any) => ({
          id: item.item_id || item.id,
          name: item.item_name || item.name,
          inStock: item.stock_quantity || 0,
          wastage: 0,
          stock: item.stock_status || "Normal",
          report_date: today,
          category: item.category || "Uncategorized",
          expiration_date: item.expiration_date,
          batch_id: normalizeBatchId(
            item.batch_date,
            item.batch_id,
            item.created_at
          ),
          batch_id_display:
            item.batch_date ||
            item.batch_id ||
            (item.created_at
              ? new Date(item.created_at).toLocaleDateString()
              : `Batch-${item.item_id || "Unknown"}`),
          created_at: item.created_at,
          source: "Master",
          unit: item.unit || item.default_unit || "",
          unit_cost: item.unit_cost || 0,
          total_value: (item.stock_quantity || 0) * (item.unit_cost || 0),
        })),

        // Today's Inventory
        ...todayInventory.map((item: any) => ({
          id: item.item_id || item.id,
          name: item.item_name || item.name,
          inStock: item.stock_quantity || 0,
          wastage: 0,
          stock: item.stock_status || "Normal",
          report_date: item.transfer_date || today,
          category: item.category || "Uncategorized",
          expiration_date: item.expiration_date,
          batch_id: normalizeBatchId(
            item.batch_date,
            item.batch_id,
            item.transfer_date
          ),
          batch_id_display: item.batch_date || item.batch_id,
          created_at: item.transfer_date,
          source: "Today",
          unit: item.unit || item.default_unit || "",
          unit_cost: item.unit_cost || 0,
          total_value: (item.stock_quantity || 0) * (item.unit_cost || 0),
        })),

        // Surplus Inventory
        ...surplusInventory.map((item: any) => ({
          id: item.item_id || item.id,
          name: item.item_name || item.name,
          inStock: item.stock_quantity || 0, // Surplus uses stock_quantity, not quantity_surplus
          wastage: 0,
          stock: item.stock_status || "High",
          report_date: item.created_at || today,
          category: item.category || "Uncategorized",
          expiration_date: item.expiration_date,
          batch_id: normalizeBatchId(
            item.batch_date,
            item.batch_id,
            item.created_at
          ),
          batch_id_display: item.batch_date || item.batch_id,
          created_at: item.created_at,
          source: "Surplus",
          unit: item.unit || item.default_unit || "",
          unit_cost: item.unit_cost || 0,
          total_value: (item.stock_quantity || 0) * (item.unit_cost || 0),
        })),
      ];

      // Group by Item Name + Batch ID
      const groupedInventory = new Map<string, any>();

      allInventoryItems.forEach((item) => {
        const key = `${item.name}::${item.batch_id || "N/A"}`;

        // Debug logging for Magic Sarap
        if (item.name?.toLowerCase().includes("magic sarap")) {
          console.log(`[DEBUG] Magic Sarap item:`, {
            name: item.name,
            batch_id: item.batch_id,
            batch_id_display: item.batch_id_display,
            inStock: item.inStock,
            stock_status: item.stock,
            source: item.source,
            key: key,
          });
        }

        if (groupedInventory.has(key)) {
          // Merge quantities if same item and batch
          const existing = groupedInventory.get(key);
          console.log(
            `[DEBUG] Merging ${item.name} - Adding ${item.inStock} to existing ${existing.inStock}`
          );
          existing.inStock += item.inStock;

          // Calculate weighted average unit_cost if both have costs
          if (existing.unit_cost && item.unit_cost) {
            const existingValue =
              (existing.inStock - item.inStock) * existing.unit_cost;
            const newValue = item.inStock * item.unit_cost;
            existing.unit_cost = (existingValue + newValue) / existing.inStock;
          } else if (item.unit_cost) {
            // If existing has no cost but new item does, use new item's cost
            existing.unit_cost = item.unit_cost;
          }

          // Recalculate total_value
          existing.total_value = existing.inStock * (existing.unit_cost || 0);

          // Update report_date to latest
          if (new Date(item.report_date) > new Date(existing.report_date)) {
            existing.report_date = item.report_date;
          }
          // Prefer non-N/A batch_id_display
          if (
            !existing.batch_id_display ||
            existing.batch_id_display === "N/A"
          ) {
            existing.batch_id_display = item.batch_id_display;
          }
        } else {
          // New entry
          groupedInventory.set(key, { ...item });
        }
      });

      // Recalculate stock status based on final merged quantities
      const allInventoryWithStatus = Array.from(groupedInventory.values()).map(
        (item) => {
          // Find the threshold for this item from settings
          const setting = settings.find(
            (s) =>
              (s.name || s.item_name || "").toString().trim().toLowerCase() ===
              (item.name || "").toString().trim().toLowerCase()
          );
          const threshold = Number(setting?.low_stock_threshold) || 10; // fallback to 10

          let newStatus = "Normal";
          if (item.inStock === 0) {
            newStatus = "Out Of Stock";
          } else if (item.inStock <= 0.5 * threshold) {
            newStatus = "Critical";
          } else if (item.inStock <= threshold) {
            newStatus = "Low Stock";
          } else if (item.inStock > threshold) {
            newStatus = "Normal";
          }

          return {
            ...item,
            stock: newStatus,
          };
        }
      );

      // If you need the version without recalculated status, use a different name
      // const allInventory = Array.from(groupedInventory.values());

      // Debug final Magic Sarap entries
      console.log("[DEBUG] Final Magic Sarap entries:");
      allInventoryWithStatus
        .filter((item) => item.name?.toLowerCase().includes("magic sarap"))
        .forEach((item) => {
          console.log(
            `  - Name: ${item.name}, Batch: ${item.batch_id}, Stock: ${item.inStock}, Source: ${item.source}`
          );
        });

      // Store spoilage separately for toggle table view
      const spoilageData = spoilageInventory.map((item: any) => ({
        id: item.spoilage_id || item.id,
        name: item.item_name || item.name,
        inStock: 0,
        wastage: item.quantity_spoiled || 0,
        stock: "Spoiled",
        report_date: item.spoilage_date || today,
        spoilage_date: item.spoilage_date || today, // Dedicated spoilage date field
        category: item.category || "Uncategorized",
        expiration_date: item.expiration_date,
        batch_id: item.batch_date || item.batch_id,
        reason: item.reason || "Expired", // Add reason from API
        created_at: item.spoilage_date,
      }));

      console.log(
        `Loaded ${spoilageInventory.length} spoilage records for analytics`
      );
      console.log(
        `Grouped ${allInventoryItems.length} items into ${allInventoryWithStatus.length} unique entries`
      );
      setInventory(allInventoryWithStatus);
      setSpoilageInventory(spoilageData);
      setSpoilageInventory(spoilageData);

      // No need for pastInventory since we're combining all sources
      setPastInventory([]);

      // Auto-create inventory log if needed (moved from logs logic)
      if (user && user.user_id && masterInventory.length > 0) {
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
            item_name: String(item.item_name || item.name || "Unknown Item"),
            batch_date: item.created_at
              ? new Date(item.created_at).toISOString()
              : new Date().toISOString(),
          }));
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
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  }, [saveLogs, user]);

  // Fetch spoilage summary and items when date range or period changes
  useEffect(() => {
    let isMounted = true;
    async function loadSpoilage() {
      setSpoilageLoading(true);
      try {
        // Use startDate/endDate if set, else use period
        let start = startDate;
        let end = endDate;
        if (!start && !end && period !== "all") {
          // Calculate start/end from period
          const now = dayjs();
          if (period === "today") {
            start = now.format("YYYY-MM-DD");
            end = now.format("YYYY-MM-DD");
          } else if (period === "week") {
            start = now.subtract(7, "day").format("YYYY-MM-DD");
            end = now.format("YYYY-MM-DD");
          } else if (period === "month") {
            start = now.subtract(30, "day").format("YYYY-MM-DD");
            end = now.format("YYYY-MM-DD");
          } else if (period === "year") {
            start = now.subtract(365, "day").format("YYYY-MM-DD");
            end = now.format("YYYY-MM-DD");
          }
        }
        const data: any = await fetchSpoilageSummary(start, end);
        // Save spoilage items for table
        if (Array.isArray(data)) {
          if (isMounted) setSpoilageItems(data);
        } else {
          if (isMounted) setSpoilageItems([]);
        }
        // Sum quantity_spoiled for summary
        let total = 0;
        if (Array.isArray(data)) {
          total = data.reduce(
            (sum, rec) => sum + (rec.quantity_spoiled || 0),
            0
          );
        } else if (typeof data === "number") {
          total = data;
        } else if (data && typeof data.total_quantity_spoiled === "number") {
          total = data.total_quantity_spoiled;
        }
        if (isMounted) setSpoilageSummary(total);
      } catch (e) {
        if (isMounted) {
          setSpoilageSummary(null);
          setSpoilageItems([]);
        }
      } finally {
        if (isMounted) setSpoilageLoading(false);
      }
    }
    loadSpoilage();
    return () => {
      isMounted = false;
    };
  }, [startDate, endDate, period, fetchSpoilageSummary]);

  useEffect(() => {
    load();

    // Helper to reload spoilage summary/items
    const reloadSpoilage = async () => {
      let start = startDate;
      let end = endDate;
      if (!start && !end && period !== "all") {
        const now = dayjs();
        if (period === "today") {
          start = now.format("YYYY-MM-DD");
          end = now.format("YYYY-MM-DD");
        } else if (period === "week") {
          start = now.subtract(7, "day").format("YYYY-MM-DD");
          end = now.format("YYYY-MM-DD");
        } else if (period === "month") {
          start = now.subtract(30, "day").format("YYYY-MM-DD");
          end = now.format("YYYY-MM-DD");
        } else if (period === "year") {
          start = now.subtract(365, "day").format("YYYY-MM-DD");
          end = now.format("YYYY-MM-DD");
        }
      }
      const data = await fetchSpoilageSummary(start, end);
      if (Array.isArray(data)) {
        setSpoilageItems(data);
      } else {
        setSpoilageItems([]);
      }
      let total = 0;
      if (Array.isArray(data)) {
        total = data.reduce((sum, rec) => sum + (rec.quantity_spoiled || 0), 0);
      } else if (typeof data === "number") {
        total = data;
      } else if (data && typeof data.total_quantity_spoiled === "number") {
        total = data.total_quantity_spoiled;
      }
      setSpoilageSummary(total);
    };

    const channel = supabase
      .channel("inventory_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory" },
        async (payload) => {
          await load();
          await reloadSpoilage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, fetchSpoilageSummary, startDate, endDate, period]);

  useEffect(() => {
    async function loadAvailableHistoricalDates() {
      try {
        const allLogs = await fetchLogs();
        if (allLogs && allLogs.length > 0) {
          const dates = [
            ...new Set(
              allLogs
                .map((log: any) =>
                  log.action_date
                    ? new Date(log.action_date).toISOString().slice(0, 10)
                    : null
                )
                .filter(
                  (date: unknown): date is string =>
                    typeof date === "string" && date !== null
                )
            ),
          ].sort((a, b) => (b as string).localeCompare(a as string));
          setAvailableHistoricalDates(dates as string[]);
        }
      } catch (error) {
        console.error("Error fetching available historical dates:", error);
      }
    }
    loadAvailableHistoricalDates();
  }, [fetchLogs]);

  // 💡 Smart Balance: Load historical data only when specific date is selected
  useEffect(() => {
    async function loadHistoricalDataForDate() {
      if (!reportDate) {
        // No specific date selected, use live inventory
        setIsHistoricalMode(false);
        setHistoricalInventory([]);
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      if (reportDate === today) {
        // Selected today, use live inventory
        setIsHistoricalMode(false);
        setHistoricalInventory([]);
        return;
      }

      // Selected a historical date, load historical data
      try {
        setIsHistoricalMode(true);
        const historicalLogs = await fetchLogs(reportDate, reportDate);
        if (historicalLogs && historicalLogs.length > 0) {
          const transformedData = historicalLogs.map((log: any) => ({
            id: log.item_id,
            name: log.item_name || `Item ${log.item_id}`,
            inStock: log.remaining_stock || 0,
            wastage: log.wastage || 0,
            stock: log.status || "Unknown",
            report_date: log.action_date
              ? new Date(log.action_date).toISOString().slice(0, 10)
              : "",
            category: "Historical", // Default category for historical data
            expiration_date: undefined,
            batch_id: log.batch_date
              ? new Date(log.batch_date).toLocaleDateString()
              : `Batch-${log.item_id}`,
            created_at: log.batch_date,
          }));
          setHistoricalInventory(transformedData);
        } else {
          setHistoricalInventory([]);
        }
      } catch (error) {
        console.error("Error loading historical data:", error);
        setHistoricalInventory([]);
      }
    }

    loadHistoricalDataForDate();
  }, [reportDate, fetchLogs]);

  const matchesPeriod = useCallback(
    (dateStr: string) => {
      if (period === "all" || !dateStr) return true;
      const date = dayjs(dateStr);
      const now = dayjs();
      if (period === "today") {
        return date.isSame(now, "day");
      }
      if (period === "week") {
        return date.isAfter(now.subtract(7, "day"), "day");
      }
      if (period === "month") {
        return date.isAfter(now.subtract(30, "day"), "day");
      }
      if (period === "year") {
        return date.isAfter(now.subtract(365, "day"), "day");
      }
      return true;
    },
    [period]
  );

  // 💡 Smart Balance: Choose data source - live inventory or historical data, and append spoilage items
  const dataSource = useMemo(() => {
    // If showing spoilage table, return spoilage inventory only
    if (showSpoilageTable) {
      return spoilageInventory;
    }

    // Otherwise, show active inventory (original logic)
    const baseInventory = inventory;
    // When not in historical mode and period is 'all', include pastInventory (historical logs)
    let sourceData = isHistoricalMode ? historicalInventory : baseInventory;
    if (
      !isHistoricalMode &&
      period === "all" &&
      Array.isArray(pastInventory) &&
      pastInventory.length > 0
    ) {
      // Merge pastInventory and baseInventory, preferring baseInventory for items with the same id+report_date
      const combined = [...pastInventory, ...baseInventory];
      // Build a map to dedupe by id+report_date (prefer later entries from baseInventory)
      const map = new Map<string, any>();
      for (const row of combined) {
        const key = `${row.id || "-"}::${row.report_date || "-"}`;
        // If map already has the key and this row comes from baseInventory (live), overwrite
        if (map.has(key)) {
          const existing = map.get(key);
          // Heuristic: if existing.created_at is older than row.created_at, replace
          const existingCreated = existing.created_at
            ? new Date(existing.created_at).getTime()
            : 0;
          const rowCreated = row.created_at
            ? new Date(row.created_at).getTime()
            : 0;
          if (rowCreated >= existingCreated) map.set(key, row);
        } else {
          map.set(key, row);
        }
      }
      sourceData = Array.from(map.values());
    }
    const mainData =
      period !== "all"
        ? sourceData.filter((item) => matchesPeriod(item.report_date))
        : sourceData;

    // For active inventory table, don't include spoilage items
    // Spoilage is shown in separate table via toggle
    return mainData;
  }, [
    showSpoilageTable,
    spoilageInventory,
    inventory,
    historicalInventory,
    isHistoricalMode,
    period,
    matchesPeriod,
    pastInventory,
  ]);

  const dates = useMemo(() => {
    const invDates = inventory.map((i) => i.report_date).filter(Boolean);
    const pastDates = pastInventory.map((i) => i.report_date).filter(Boolean);
    return [...new Set([...invDates, ...pastDates])].filter(Boolean);
  }, [inventory, pastInventory]);

  // Filter helpers
  const filterByCategory = (item: InventoryItem, category: string) => {
    if (!category) return true;
    return item.category === category;
  };

  const filterByReportDate = (item: InventoryItem, reportDate: string) => {
    if (!reportDate) return true;
    return item.report_date === reportDate;
  };

  const filterByPeriod = (item: InventoryItem, period: string) => {
    if (!period || period === "all") return true;
    if (!item.report_date) return true;
    const today = new Date();
    const itemDate = new Date(item.report_date);
    if (period === "today") {
      return (
        itemDate.getFullYear() === today.getFullYear() &&
        itemDate.getMonth() === today.getMonth() &&
        itemDate.getDate() === today.getDate()
      );
    }
    if (period === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return itemDate >= weekAgo && itemDate <= today;
    }
    if (period === "month") {
      const monthAgo = new Date(today);
      monthAgo.setDate(today.getDate() - 30);
      return itemDate >= monthAgo && itemDate <= today;
    }
    if (period === "year") {
      return itemDate.getFullYear() === today.getFullYear();
    }
    return true;
  };

  const filtered = useMemo(() => {
    return dataSource.filter((item) => {
      // Category filter
      const matchesCategory = filterByCategory(item, categoryFilter);

      // Report date filter (specific date)
      const matchesReportDate = reportDate
        ? dayjs(item.report_date).format("YYYY-MM-DD") === reportDate
        : true;

      // Period filter (time range)
      const matchesPeriod = filterByPeriod(item, period);

      // Search query filter
      const matchesSearch = searchQuery
        ? Object.values(item)
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true;

      // Stock status filter
      const matchesStockStatus = stockStatusFilter
        ? item.stock === stockStatusFilter
        : true;

      // Expiration status filter
      const matchesExpiration = (() => {
        if (!expirationFilter) return true;
        if (!item.expiration_date) return expirationFilter === "no_expiry";

        const expiryDate = new Date(item.expiration_date);
        const now = new Date();
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        switch (expirationFilter) {
          case "expired":
            return expiryDate <= now;
          case "expiring_soon":
            return expiryDate > now && expiryDate <= sevenDaysFromNow;
          case "fresh":
            return expiryDate > sevenDaysFromNow;
          case "no_expiry":
            return false; // Items with expiry date don't match "no_expiry"
          default:
            return true;
        }
      })();

      // Date range filter (custom date range)
      const matchesDateRange = (() => {
        if (!startDate && !endDate) return true;
        const itemDate = dayjs(item.report_date);
        const start = startDate ? dayjs(startDate) : null;
        const end = endDate ? dayjs(endDate) : null;

        if (start && end) {
          return (
            itemDate.isAfter(start.subtract(1, "day")) &&
            itemDate.isBefore(end.add(1, "day"))
          );
        } else if (start) {
          return itemDate.isAfter(start.subtract(1, "day"));
        } else if (end) {
          return itemDate.isBefore(end.add(1, "day"));
        }
        return true;
      })();

      return (
        matchesCategory &&
        matchesReportDate &&
        matchesPeriod &&
        matchesSearch &&
        matchesStockStatus &&
        matchesExpiration &&
        matchesDateRange
      );
    });
  }, [
    dataSource,
    searchQuery,
    categoryFilter,
    stockStatusFilter,
    expirationFilter,
    startDate,
    endDate,
    reportDate,
    period,
    pastInventory,
  ]);

  const excelValues = useMemo(() => {
    // Add spoilage summary row at the top
    const summaryRow = [
      "SPOILAGE SUMMARY",
      spoilageLoading
        ? "..."
        : spoilageSummary !== null
        ? spoilageSummary + " units"
        : "-",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ];
    const headerRow = [
      "#",
      "Item Name",
      "Batch ID",
      "Batch Date",
      "Category",
      "In Stock",
      "Wastage",
      "Expiration Date",
      "Stock Status",
      "Report Date",
    ];
    const dataRows = filtered.map((i) => [
      i.id || "N/A",
      i.name || "Unknown Item",
      i.batch_id || "N/A",
      i.created_at ? new Date(i.created_at).toLocaleDateString() : "N/A",
      i.category || "No Category",
      i.inStock || 0,
      i.wastage || 0,
      i.expiration_date
        ? new Date(i.expiration_date).toLocaleDateString()
        : "N/A",
      i.stock || "Unknown",
      i.report_date ? new Date(i.report_date).toLocaleDateString() : "N/A",
    ]);
    return [summaryRow, headerRow, ...dataRows];
  }, [filtered, spoilageSummary, spoilageLoading]);

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = "Cardiac Delights Inventory System";
    workbook.created = new Date();
    workbook.modified = new Date();

    // ========== MAIN SHEET: INVENTORY REPORT ==========
    const inventorySheet = workbook.addWorksheet("Inventory Report");

    let currentRow = 1;

    // ===== 1. TITLE SECTION =====
    inventorySheet.mergeCells(`A${currentRow}:L${currentRow}`);
    const titleCell = inventorySheet.getCell(`A${currentRow}`);
    titleCell.value = "INVENTORY REPORT";
    titleCell.font = { bold: true, size: 20, color: { argb: "FFFFFFFF" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" },
    };
    inventorySheet.getRow(currentRow).height = 35;
    currentRow += 2;

    // ===== 2. REPORT METADATA =====
    const now = new Date();
    const totalStockValue = filtered.reduce(
      (sum, item) => sum + (item.inStock || 0),
      0
    );

    inventorySheet.getCell(`A${currentRow}`).value = "Report Generated:";
    inventorySheet.getCell(`A${currentRow}`).font = { bold: true };
    inventorySheet.getCell(`B${currentRow}`).value = now.toLocaleString();
    currentRow++;

    inventorySheet.getCell(`A${currentRow}`).value = "Total Items:";
    inventorySheet.getCell(`A${currentRow}`).font = { bold: true };
    inventorySheet.getCell(`B${currentRow}`).value = filtered.length;
    currentRow++;

    inventorySheet.getCell(`A${currentRow}`).value = "Total Stock Value:";
    inventorySheet.getCell(`A${currentRow}`).font = { bold: true };
    inventorySheet.getCell(`B${currentRow}`).value = `${totalStockValue} units`;
    currentRow += 2;

    // ===== 3. FILTER SUMMARY =====
    inventorySheet.mergeCells(`A${currentRow}:L${currentRow}`);
    const filterHeader = inventorySheet.getCell(`A${currentRow}`);
    filterHeader.value = "ACTIVE FILTERS";
    filterHeader.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
    filterHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF6B7280" },
    };
    filterHeader.alignment = { horizontal: "center" };
    inventorySheet.getRow(currentRow).height = 25;
    currentRow++;

    const filterData = [];

    if (searchQuery) filterData.push(["Search Query", searchQuery]);
    if (categoryFilter) filterData.push(["Category", categoryFilter]);
    if (stockStatusFilter) filterData.push(["Stock Status", stockStatusFilter]);
    if (expirationFilter) filterData.push(["Expiration", expirationFilter]);

    // Show date range for time period filter
    if (period !== "all") {
      let rangeLabel = "";
      let rangeValue = "";
      const now = dayjs();
      if (period === "today") {
        rangeLabel = "Date";
        rangeValue = now.format("YYYY-MM-DD");
      } else if (period === "week") {
        rangeLabel = "Date Range";
        rangeValue = `${now
          .subtract(6, "day")
          .format("YYYY-MM-DD")} to ${now.format("YYYY-MM-DD")}`;
      } else if (period === "month") {
        rangeLabel = "Date Range";
        rangeValue = `${now
          .subtract(29, "day")
          .format("YYYY-MM-DD")} to ${now.format("YYYY-MM-DD")}`;
      } else if (period === "year") {
        rangeLabel = "Date Range";
        rangeValue = `${now
          .startOf("year")
          .format("YYYY-MM-DD")} to ${now.format("YYYY-MM-DD")}`;
      } else if (period === "custom" && startDate && endDate) {
        rangeLabel = "Date Range";
        rangeValue = `${startDate} to ${endDate}`;
      } else {
        rangeLabel = "Period";
        rangeValue = period;
      }
      filterData.push([rangeLabel, rangeValue]);
    } else if (startDate && endDate) {
      filterData.push(["Date Range", `${startDate} to ${endDate}`]);
    }

    if (filterData.length > 0) {
      filterData.forEach(([label, value]) => {
        inventorySheet.getCell(`A${currentRow}`).value = label + ":";
        inventorySheet.getCell(`A${currentRow}`).font = { bold: true };
        inventorySheet.getCell(`B${currentRow}`).value = value;
        currentRow++;
      });
    } else {
      inventorySheet.getCell(`A${currentRow}`).value = "No filters applied";
      inventorySheet.getCell(`A${currentRow}`).font = { italic: true };
      currentRow++;
    }
    currentRow++;

    // ===== 4. SUMMARY STATISTICS =====
    inventorySheet.mergeCells(`A${currentRow}:L${currentRow}`);
    const statsHeader = inventorySheet.getCell(`A${currentRow}`);
    statsHeader.value = "SUMMARY STATISTICS";
    statsHeader.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    statsHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" },
    };
    statsHeader.alignment = { horizontal: "center" };
    inventorySheet.getRow(currentRow).height = 28;
    currentRow++;

    // Calculate statistics
    const totalStock = filtered.reduce(
      (sum, item) => sum + (item.inStock || 0),
      0
    );
    const outOfStockCount = filtered.filter(
      (item) => (item.inStock || 0) === 0
    ).length;

    const criticalCount = filtered.filter(
      (item) => item.stock === "Critical"
    ).length;

    const lowStockCount = filtered.filter(
      (item) => item.stock === "Low"
    ).length;

    // Calculate expiration-related stats
    const today = new Date();
    const expiringSoonCount = filtered.filter((item) => {
      if (!item.expiration_date) return false;
      const expDate = new Date(item.expiration_date);
      const daysUntilExpiry = Math.ceil(
        (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
    }).length;

    const expiredCount = filtered.filter((item) => {
      if (!item.expiration_date) return false;
      const expDate = new Date(item.expiration_date);
      return expDate < today;
    }).length;

    // Categories breakdown
    const categories = [
      ...new Set(filtered.map((item) => item.category)),
    ].filter(Boolean);
    const categoryBreakdown = categories.map((cat) => {
      const count = filtered.filter((item) => item.category === cat).length;
      return { category: cat, count };
    });

    // Add statistics rows
    const statsData = [
      ["Metric", "Value"],
      ["Total Items", filtered.length],
      ["Total Stock Quantity", totalStock],
      ["Out of Stock", outOfStockCount],
      ["Critical Stock", criticalCount],
      ["Low Stock", lowStockCount],
      ["Expiring Soon (7 days)", expiringSoonCount],
      ["Expired Items", expiredCount],
    ];

    statsData.forEach((row) => {
      inventorySheet.addRow(row);
    });

    // Style statistics header
    const statsTableHeaderRow = inventorySheet.getRow(currentRow);
    statsTableHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    statsTableHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F2937" },
    };
    currentRow++;

    // Color code statistics values
    for (let i = 0; i < statsData.length - 1; i++) {
      const valueCell = inventorySheet.getCell(`B${currentRow + i}`);
      const metric = statsData[i + 1][0];

      if (metric === "Out of Stock" && outOfStockCount > 0) {
        valueCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEF4444" },
        };
        valueCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      } else if (metric === "Low Stock" && lowStockCount > 0) {
        valueCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF97316" },
        };
        valueCell.font = { bold: true };
      } else if (metric === "Expiring Soon (7 days)" && expiringSoonCount > 0) {
        valueCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF59E0B" },
        };
        valueCell.font = { bold: true };
      } else if (metric === "Expired Items" && expiredCount > 0) {
        valueCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEF4444" },
        };
        valueCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      }
    }

    currentRow += statsData.length;

    // Items by Category
    inventorySheet.getCell(`A${currentRow}`).value = "Items by Category:";
    inventorySheet.getCell(`A${currentRow}`).font = { bold: true, size: 11 };
    currentRow++;

    categoryBreakdown.forEach(({ category, count }) => {
      inventorySheet.getCell(`A${currentRow}`).value = category;
      inventorySheet.getCell(`B${currentRow}`).value = count;
      currentRow++;
    });
    currentRow++;

    // ===== 5. CRITICAL ALERTS SECTION =====
    inventorySheet.mergeCells(`A${currentRow}:L${currentRow}`);
    const alertsHeader = inventorySheet.getCell(`A${currentRow}`);
    alertsHeader.value = "CRITICAL ALERTS";
    alertsHeader.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    alertsHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEF4444" },
    };
    alertsHeader.alignment = { horizontal: "center" };
    inventorySheet.getRow(currentRow).height = 28;
    currentRow++;

    // Out of Stock Items
    const outOfStockItems = filtered.filter(
      (item) => (item.inStock || 0) === 0
    );
    if (outOfStockItems.length > 0) {
      inventorySheet.getCell(`A${currentRow}`).value = "OUT OF STOCK ITEMS:";
      inventorySheet.getCell(`A${currentRow}`).font = {
        bold: true,
        color: { argb: "FFEF4444" },
      };
      currentRow++;

      inventorySheet.addRow(["Item Name", "Category", "Batch ID"]);
      const outOfStockHeaderRow = inventorySheet.getRow(currentRow);
      outOfStockHeaderRow.font = { bold: true };
      outOfStockHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFECACA" },
      };
      currentRow++;

      outOfStockItems.forEach((item) => {
        inventorySheet.addRow([
          item.name || "Unknown",
          item.category || "N/A",
          item.batch_id_display || item.batch_id || "N/A",
        ]);
        currentRow++;
      });
      currentRow++;
    } else {
      inventorySheet.getCell(`A${currentRow}`).value = "No out of stock items";
      inventorySheet.getCell(`A${currentRow}`).font = {
        italic: true,
        color: { argb: "FF10B981" },
      };
      currentRow += 2;
    }

    // Expiring Soon Items
    const expiringSoonItems = filtered.filter((item) => {
      if (!item.expiration_date) return false;
      const expDate = new Date(item.expiration_date);
      const daysUntilExpiry = Math.ceil(
        (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
    });

    if (expiringSoonItems.length > 0) {
      inventorySheet.getCell(`A${currentRow}`).value =
        "EXPIRING SOON (Within 7 Days):";
      inventorySheet.getCell(`A${currentRow}`).font = {
        bold: true,
        color: { argb: "FFF97316" },
      };
      currentRow++;

      inventorySheet.addRow([
        "Item Name",
        "Category",
        "Expiration Date",
        "Days Until Expiry",
      ]);
      const expiringSoonHeaderRow = inventorySheet.getRow(currentRow);
      expiringSoonHeaderRow.font = { bold: true };
      expiringSoonHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFED7AA" },
      };
      currentRow++;

      expiringSoonItems.forEach((item) => {
        const expDate = item.expiration_date
          ? new Date(item.expiration_date)
          : new Date();
        const daysUntilExpiry = Math.ceil(
          (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        inventorySheet.addRow([
          item.name || "Unknown",
          item.category || "N/A",
          expDate.toLocaleDateString(),
          daysUntilExpiry,
        ]);
        currentRow++;
      });
      currentRow++;
    } else {
      inventorySheet.getCell(`A${currentRow}`).value = "No items expiring soon";
      inventorySheet.getCell(`A${currentRow}`).font = {
        italic: true,
        color: { argb: "FF10B981" },
      };
      currentRow += 2;
    }

    // ===== 6. DETAILED INVENTORY DATA =====
    inventorySheet.mergeCells(`A${currentRow}:L${currentRow}`);
    const detailHeader = inventorySheet.getCell(`A${currentRow}`);
    detailHeader.value = "DETAILED INVENTORY DATA";
    detailHeader.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    detailHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" },
    };
    detailHeader.alignment = { horizontal: "center" };
    inventorySheet.getRow(currentRow).height = 28;
    currentRow++;

    // Add column headers
    const headers = [
      "#",
      "Item Name",
      "Category",
      "Batch ID",
      "In Stock",
      "Unit Cost",
      "Total Value",
      "Wastage",
      "Status",
      "Expiration Date",
      "Days Until Expiry",
      "Report Date",
    ];
    inventorySheet.addRow(headers);
    const headerRow = inventorySheet.getRow(currentRow);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 25;
    currentRow++;

    const dataStartRow = currentRow;

    // Add data rows with continuous numbering
    filtered.forEach((item, index) => {
      const expirationDate = item.expiration_date
        ? new Date(item.expiration_date)
        : null;
      const daysUntilExpiry = expirationDate
        ? Math.ceil(
            (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;

      inventorySheet.addRow([
        index + 1, // Continuous numbering: 1, 2, 3, 4...
        item.name || "Unknown Item",
        item.category || "No Category",
        item.batch_id_display || item.batch_id || "N/A",
        item.inStock || 0,
        item.unit_cost ? `₱${Number(item.unit_cost).toFixed(2)}` : "-",
        item.unit_cost && item.inStock
          ? `₱${(Number(item.unit_cost) * Number(item.inStock)).toFixed(2)}`
          : "-",
        item.wastage || 0,
        item.stock || "Unknown",
        expirationDate ? expirationDate.toLocaleDateString() : "N/A",
        daysUntilExpiry !== null ? daysUntilExpiry : "N/A",
        item.report_date
          ? new Date(item.report_date).toLocaleDateString()
          : "N/A",
      ]);
      currentRow++;
    });

    // ===== 7. STYLING =====
    // Add borders to all data cells
    for (let row = dataStartRow; row < currentRow; row++) {
      for (let col = 1; col <= 10; col++) {
        const cell = inventorySheet.getCell(row, col);
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };

        // Alternating row colors
        if ((row - dataStartRow) % 2 === 1) {
          if (!cell.fill || cell.fill.type !== "pattern") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF9FAFB" },
            };
          }
        }
      }

      // Status color coding (column 7)
      const statusCell = inventorySheet.getCell(row, 7);
      const status = statusCell.value;
      if (status === "Low" || (typeof status === "number" && status === 0)) {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEF4444" },
        };
        statusCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      } else if (status === "Normal") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF59E0B" },
        };
        statusCell.font = { bold: true };
      } else if (status === "High") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF3B82F6" },
        };
        statusCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      }

      // Expiration date color coding (column 9)
      const daysCell = inventorySheet.getCell(row, 9);
      const days =
        typeof daysCell.value === "number"
          ? daysCell.value
          : parseInt(daysCell.value as string);
      if (!isNaN(days)) {
        if (days < 0) {
          // Expired
          daysCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEF4444" },
          };
          daysCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        } else if (days <= 7) {
          // Expiring soon
          daysCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF97316" },
          };
          daysCell.font = { bold: true };
        } else {
          // Normal
          daysCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF10B981" },
          };
          daysCell.font = { color: { argb: "FFFFFFFF" } };
        }
      }
    }

    // Set column widths
    inventorySheet.getColumn(1).width = 8; // #
    inventorySheet.getColumn(2).width = 25; // Item Name
    inventorySheet.getColumn(3).width = 20; // Category
    inventorySheet.getColumn(4).width = 15; // Batch ID
    inventorySheet.getColumn(5).width = 12; // In Stock
    inventorySheet.getColumn(6).width = 14; // Unit Cost
    inventorySheet.getColumn(7).width = 14; // Total Value
    inventorySheet.getColumn(8).width = 12; // Wastage
    inventorySheet.getColumn(9).width = 15; // Status
    inventorySheet.getColumn(10).width = 18; // Expiration Date
    inventorySheet.getColumn(11).width = 18; // Days Until Expiry
    inventorySheet.getColumn(12).width = 18; // Report Date

    // ===== 8. FOOTER =====
    currentRow++;
    inventorySheet.mergeCells(`A${currentRow}:L${currentRow}`);
    const footerCell = inventorySheet.getCell(`A${currentRow}`);
    footerCell.value = `Report generated by Cardiac Delights | ${now.toLocaleString()}`;
    footerCell.font = { italic: true, size: 10, color: { argb: "FF6B7280" } };
    footerCell.alignment = { horizontal: "center" };

    // Generate buffer and save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Inventory_Report_Enhanced_${formatDate()}.xlsx`);
    setExportSuccess(true);
    setShowPopup(false);

    // Log export activity
    try {
      const token = localStorage.getItem("token");
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${API_URL}/api/log-export`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report_type: "inventory report",
          record_count: paginatedData.length,
        }),
      });
    } catch (error) {
      console.log("Failed to log export activity:", error);
      // Don't show error to user, just log it
    }
  };

  const formatDate = () =>
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const appendToGoogleSheet = async (
    accessToken: string,
    sheetId: string,
    sheetRange: string,
    data: any[][],
    forecastData: any[][]
  ) => {
    try {
      // Combine main data and forecast data with a blank row and header
      const combined = [...data, [], ["Sales Forecast"], ...forecastData];
      console.log("[Google Export] Appending data to sheet:", combined);
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetRange}:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: combined }),
        }
      );
      const result = await res.json();
      console.log("[Google Export] Append result:", result);
      if (
        result &&
        result.error &&
        result.error.status === "PERMISSION_DENIED"
      ) {
        alert(
          "Google Sheets export failed: Insufficient permissions. Please log out, re-authenticate, and grant all requested permissions."
        );
      }
      setExportSuccess(true);
    } catch (error) {
      console.error("Append failed:", error);
      alert(
        "Google Sheets export failed. Please check your permissions and try again."
      );
    }
  };

  // Define the default sheet range for Google Sheets export
  const SHEET_RANGE = "Sheet1!A1";

  // Create a new Google Sheet and export the inventory report data
  const createGoogleSheet = async (accessToken: string) => {
    console.log("[Google Export] createGoogleSheet called", accessToken);
    try {
      const response = await fetch(
        "https://sheets.googleapis.com/v4/spreadsheets",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: { title: `Inventory Report - ${formatDate()}` },
            sheets: [{ properties: { title: "Sheet1" } }],
          }),
        }
      );
      const sheet = await response.json();
      console.log("[Google Export] Sheet created:", sheet);
      const sheetId = sheet.spreadsheetId;
      // Use excelValues for inventory report export, no forecastTable
      await appendToGoogleSheet(
        accessToken,
        sheetId,
        SHEET_RANGE,
        excelValues,
        []
      );
    } catch (error) {
      console.error("Failed to create sheet:", error);
    }
  };

  const handleGoogleLoginSuccess = (tokenResponse: any) => {
    console.log(
      "[Google Export] handleGoogleLoginSuccess called",
      tokenResponse
    );
    setIsExporting(true);
    setShowPopup(false);
    const accessToken = tokenResponse.access_token;
    createGoogleSheet(accessToken).finally(() => {
      setIsExporting(false);
    });
  };

  // Clear all filters at once
  const handleClear = () => {
    clearSearch();
    clearCategory();
    clearPeriod();
    clearStockStatus();
    clearExpiration();
    clearDateRange();
    clearReportDate();
    clearSort();
  };

  // Individual clear functions for each filter
  const clearSearch = () => {
    setSearchQuery("");
  };

  const clearCategory = () => {
    setCategoryFilter("");
  };

  const clearPeriod = () => {
    setPeriod("all"); // 💡 Smart Balance: Reset to all time
  };

  // Handler for time period changes
  const handleTimePeriodChange = useCallback(
    (newPeriod: "all" | "today" | "week" | "month" | "year" | "custom") => {
      setPeriod(newPeriod);

      const now = dayjs();
      const today = now.format("YYYY-MM-DD");

      switch (newPeriod) {
        case "today":
          setStartDate(today);
          setEndDate(today);
          break;
        case "week":
          setStartDate(now.subtract(7, "day").format("YYYY-MM-DD"));
          setEndDate(today);
          break;
        case "month":
          setStartDate(now.subtract(30, "day").format("YYYY-MM-DD"));
          setEndDate(today);
          break;
        case "year":
          setStartDate(now.subtract(365, "day").format("YYYY-MM-DD"));
          setEndDate(today);
          break;
        case "all":
          setStartDate("");
          setEndDate("");
          break;
        case "custom":
          // Don't change date range, user will set manually
          break;
      }
    },
    []
  );

  const clearStockStatus = () => {
    setStockStatusFilter("");
  };

  const clearExpiration = () => {
    setExpirationFilter("");
  };

  const clearDateRange = () => {
    setStartDate("");
    setEndDate("");
  };

  const clearReportDate = () => {
    setReportDate("");
  };

  const clearSort = () => {
    setSortConfig({ key: "", direction: "asc" });
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
      const aValue = (a as Record<string, any>)[sortConfig.key];
      const bValue = (b as Record<string, any>)[sortConfig.key];
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

  // Pagination - calculate total pages and slice data for current page
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    categoryFilter,
    stockStatusFilter,
    expirationFilter,
    period,
    startDate,
    endDate,
    showSpoilageTable,
  ]);

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
                            Inventory Management Report
                          </h2>
                          <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-1">
                            Real-time stock monitoring and analytics dashboard
                          </p>
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        {/* Refresh Button */}
                        <button
                          onClick={reloadAllData}
                          disabled={loading}
                          className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 text-xs sm:text-sm md:text-base whitespace-nowrap min-h-[44px] touch-manipulation ${
                            loading
                              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700 text-white shadow-lg"
                          }`}
                          title="Refresh inventory data"
                        >
                          <svg
                            className={`w-4 h-4 ${
                              loading ? "animate-spin" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          <span>Refresh</span>
                        </button>
                        {/* Export Button */}
                        <button
                          onClick={async () => {
                            await reloadAllData();
                            setShowPopup(true);
                          }}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-black px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg sm:rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm md:text-base whitespace-nowrap flex-1 sm:flex-none min-h-[44px] touch-manipulation"
                        >
                          <BiExport className="text-xs sm:text-sm" />
                          <span>Export Report</span>
                        </button>
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

                {/* Analytics Dashboard */}
                <div className="mt-6 space-y-6">
                  {analyticsLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                    </div>
                  ) : analyticsError ? (
                    <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6 text-center">
                      <p className="text-red-400 text-lg">{analyticsError}</p>
                      <button
                        onClick={() => refetchAnalytics()}
                        className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 transition-all"
                      >
                        Retry
                      </button>
                    </div>
                  ) : analytics ? (
                    <>
                      <AnalyticsDashboard analytics={analytics} />
                      <InventoryCharts analytics={analytics} />
                    </>
                  ) : null}
                </div>

                {/* Divider */}

                {/* Toggle Button for Active/Spoilage Inventory */}
                <div className="mb-6 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowSpoilageTable(false)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                      !showSpoilageTable
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-400/70 shadow-lg shadow-blue-500/30"
                        : "bg-gray-800/50 text-gray-400 border-2 border-gray-700/50 hover:border-gray-600"
                    }`}
                  >
                    <FaBoxes />
                    Active Inventory
                  </button>
                  <button
                    onClick={() => setShowSpoilageTable(true)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                      showSpoilageTable
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-red-400/70 shadow-lg shadow-red-500/30"
                        : "bg-gray-800/50 text-gray-400 border-2 border-gray-700/50 hover:border-gray-600"
                    }`}
                  >
                    <MdAssessment />
                    Spoilage Inventory ({spoilageInventory.length})
                  </button>
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
                    {/* Primary Filters Row */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 2xs:gap-3 xs:gap-4 mb-4">
                      <div>
                        <label className="block text-xs xs:text-sm text-gray-300 mb-1 xs:mb-2 font-medium">
                          Category
                        </label>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-600/50 focus:border-blue-400 cursor-pointer text-2xs xs:text-xs sm:text-sm transition-all"
                          aria-label="Filter by category"
                        >
                          <option value="">All Categories</option>
                          <option value="Meats">Meats</option>
                          <option value="Seafood">Seafood</option>
                          <option value="Vegetables & Fruits">
                            Vegetables & Fruits
                          </option>
                          <option value="Dairy & Eggs">Dairy & Eggs</option>
                          <option value="Seasonings & Condiments">
                            Seasonings & Condiments
                          </option>
                          <option value="Rice & Noodles">Rice & Noodles</option>
                          <option value="Cooking Oils">Cooking Oils</option>
                          <option value="Beverage">Beverage</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs xs:text-sm text-gray-300 mb-1 xs:mb-2 font-medium">
                          Stock Status
                        </label>
                        <select
                          value={stockStatusFilter}
                          onChange={(e) => setStockStatusFilter(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-600/50 focus:border-blue-400 cursor-pointer text-2xs xs:text-xs sm:text-sm transition-all"
                          aria-label="Filter by stock status"
                        >
                          <option value="">All Status</option>
                          <option value="Critical">Critical</option>
                          <option value="Low Stock">Low Stock</option>
                          <option value="Normal">Normal</option>
                          <option value="Out Of Stock">Out Of Stock</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs xs:text-sm text-gray-300 mb-1 xs:mb-2 font-medium">
                          Expiration Status
                        </label>
                        <select
                          value={expirationFilter}
                          onChange={(e) => setExpirationFilter(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-600/50 focus:border-blue-400 cursor-pointer text-2xs xs:text-xs sm:text-sm transition-all"
                          aria-label="Filter by expiration status"
                        >
                          <option value="">All Items</option>
                          <option value="expired">Expired</option>
                          <option value="expiring_soon">
                            Expiring Soon (7 days)
                          </option>
                          <option value="fresh">Fresh (&gt;7 days)</option>
                          <option value="no_expiry">No Expiry Date</option>
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-1 2xs:gap-1.5 xs:gap-2 text-gray-300 text-2xs 2xs:text-xs xs:text-sm font-medium mb-1 2xs:mb-2">
                          <FaCalendarAlt className="text-blue-400 text-2xs 2xs:text-xs flex-shrink-0" />
                          <span className="truncate">Time Period</span>
                        </label>
                        <select
                          value={period}
                          onChange={(e) =>
                            handleTimePeriodChange(
                              e.target.value as
                                | "all"
                                | "today"
                                | "week"
                                | "month"
                                | "year"
                                | "custom"
                            )
                          }
                          className="w-full bg-gray-700/50 text-white rounded-md 2xs:rounded-lg px-2 2xs:px-3 py-2 2xs:py-3 border border-gray-600/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 cursor-pointer text-2xs 2xs:text-xs xs:text-sm transition-all min-h-[36px] 2xs:min-h-[40px] xs:min-h-[44px] touch-manipulation"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                          <option value="year">This Year</option>
                          <option value="custom">Custom Range</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom Date Range (shown when Custom is selected) */}
                    {period === "custom" && (
                      <div className="mb-4 pb-4 border-b border-gray-700/30">
                        <label className="flex items-center gap-1.5 xs:gap-2 text-gray-300 text-xs xs:text-xs sm:text-sm font-medium mb-1.5 xs:mb-2">
                          <FaCalendarAlt className="text-blue-400 text-xs flex-shrink-0" />
                          <span className="truncate">Custom Date Range</span>
                        </label>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 2xs:gap-3 xs:gap-4">
                          <div>
                            <label className="block text-xs xs:text-sm text-gray-400 mb-1">
                              From Date
                            </label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-600/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-2xs xs:text-xs sm:text-sm transition-all"
                              placeholder="Start date"
                            />
                          </div>

                          <div>
                            <label className="block text-xs xs:text-sm text-gray-400 mb-1">
                              To Date
                            </label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-600/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-2xs xs:text-xs sm:text-sm transition-all"
                              placeholder="End date"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Clear All Button inside filter controls */}
                    {(searchQuery ||
                      categoryFilter ||
                      stockStatusFilter ||
                      expirationFilter ||
                      startDate ||
                      endDate ||
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
                        !stockStatusFilter &&
                        !expirationFilter &&
                        !startDate &&
                        !endDate &&
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
                            {stockStatusFilter && (
                              <div className="flex items-center gap-0.5 2xs:gap-1 bg-red-500/20 text-red-400 px-1 2xs:px-1.5 xs:px-2 py-0.5 2xs:py-1 rounded-sm 2xs:rounded-md border border-red-500/30 max-w-[120px] 2xs:max-w-[150px] xs:max-w-none">
                                <span className="truncate">
                                  Status: {stockStatusFilter}
                                </span>
                                <button
                                  onClick={clearStockStatus}
                                  className="text-red-300 hover:text-white transition-colors text-xs 2xs:text-sm touch-manipulation flex-shrink-0"
                                  title="Clear status filter"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {expirationFilter && (
                              <div className="flex items-center gap-0.5 2xs:gap-1 bg-yellow-500/20 text-yellow-400 px-1 2xs:px-1.5 xs:px-2 py-0.5 2xs:py-1 rounded-sm 2xs:rounded-md border border-yellow-500/30 max-w-[120px] 2xs:max-w-[150px] xs:max-w-none">
                                <span className="truncate">
                                  Expiry: {expirationFilter.replace("_", " ")}
                                </span>
                                <button
                                  onClick={clearExpiration}
                                  className="text-yellow-300 hover:text-white transition-colors text-xs 2xs:text-sm touch-manipulation flex-shrink-0"
                                  title="Clear expiration filter"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {(startDate || endDate) && (
                              <div
                                className="flex items-center gap-1 bg-pink-500/20 text-pink-400 px-3 py-1 rounded-md border border-pink-500/30 whitespace-nowrap overflow-visible shadow-md"
                                style={{ maxWidth: "none" }}
                              >
                                <span
                                  className="font-semibold"
                                  style={{
                                    whiteSpace: "nowrap",
                                    overflow: "visible",
                                    textOverflow: "unset",
                                  }}
                                >
                                  Range: {startDate || "..."} to{" "}
                                  {endDate || "..."}
                                </span>
                                <button
                                  onClick={clearDateRange}
                                  className="ml-2 text-pink-300 hover:text-white font-bold text-base"
                                  title="Clear date range"
                                  style={{ fontSize: "1.1em" }}
                                >
                                  ×
                                </button>
                              </div>
                            )}
                            {reportDate && (
                              <div className="flex items-center gap-0.5 2xs:gap-1 bg-cyan-500/20 text-cyan-400 px-1 2xs:px-1.5 xs:px-2 py-0.5 2xs:py-1 rounded-sm 2xs:rounded-md border border-cyan-500/30 max-w-[120px] 2xs:max-w-[150px] xs:max-w-none">
                                <span className="truncate">
                                  Date: {dayjs(reportDate).format("MMM D")}
                                </span>
                                <button
                                  onClick={clearReportDate}
                                  className="text-cyan-300 hover:text-white transition-colors text-xs 2xs:text-sm touch-manipulation flex-shrink-0"
                                  title="Clear specific date"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {period !== "today" && (
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

                {/* Table Section Header */}
                <div className="mb-4 flex items-center justify-between bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                  <div className="flex items-center gap-3">
                    {showSpoilageTable ? (
                      <>
                        <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                          <MdAssessment className="text-red-400 text-xl" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            Spoilage Inventory Report
                          </h3>
                          <p className="text-sm text-red-400">
                            Showing {sortedData.length} spoiled items
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <FaBoxes className="text-blue-400 text-xl" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            Active Inventory Report
                          </h3>
                          <p className="text-sm text-blue-400">
                            Showing {sortedData.length} active items
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

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
                        paginatedData.map((item, index) => (
                          <div
                            key={`${item.id ?? "noid"}-${index}`}
                            className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 rounded p-1.5 border border-gray-700/30 fold-compact"
                          >
                            <div className="flex justify-between items-start gap-1 mb-1">
                              <span
                                className="text-white font-semibold text-2xs truncate flex-1"
                                title={item.name}
                              >
                                {typeof item.name === "string"
                                  ? item.name.substring(0, 10)
                                  : String(item.name).substring(0, 10)}
                                ...
                              </span>
                              <span
                                className={`text-2xs font-bold ${
                                  item.stock === "Critical"
                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                    : item.stock === "Low Stock"
                                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                    : item.stock === "Out Of Stock"
                                    ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                    : "bg-green-500/20 text-green-400 border-green-500/30"
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
                        paginatedData.map((item, index) => (
                          <div
                            key={`${item.id ?? "noid"}-${index}`}
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
                                  item.stock === "Critical"
                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                    : item.stock === "Low Stock"
                                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                    : item.stock === "Out Of Stock"
                                    ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                    : "bg-green-500/20 text-green-400 border-green-500/30"
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

                    {/* Pagination for Fold View */}
                    {sortedData.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={sortedData.length}
                        onItemsPerPageChange={setItemsPerPage}
                      />
                    )}
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
                        paginatedData.map((item, index) => (
                          <div
                            key={`${item.id ?? "noid"}-${index}`}
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
                                      item.stock === "Critical"
                                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                                        : item.stock === "Low Stock"
                                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                        : item.stock === "Out Of Stock"
                                        ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                        : "bg-green-500/20 text-green-400 border-green-500/30"
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
                          </div>
                        ))
                      )}
                    </div>

                    {/* Pagination for XS View */}
                    {sortedData.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={sortedData.length}
                        onItemsPerPageChange={setItemsPerPage}
                      />
                    )}
                  </div>

                  {/* Tablet Table View - Medium screens */}
                  <div className="hidden md:block lg:hidden overflow-x-auto">
                    <table className="table-auto w-full text-sm text-left border-collapse min-w-[600px]">
                      <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                        <tr>
                          {(showSpoilageTable
                            ? [
                                { key: "name", label: "Item" },
                                { key: "category", label: "Category" },
                                { key: "wastage", label: "Wastage" },
                                { key: "expiration_date", label: "Expiration" },
                                { key: "reason", label: "Reason" },
                                { key: "stock", label: "Status" },
                                { key: "report_date", label: "Spoilage Date" },
                              ]
                            : [
                                { key: "name", label: "Item" },
                                { key: "category", label: "Category" },
                                { key: "inStock", label: "Stock" },
                                { key: "unit_cost", label: "Unit Cost" },
                                { key: "total_value", label: "Total Value" },
                                { key: "stock", label: "Status" },
                                { key: "report_date", label: "Date" },
                              ]
                          ).map((col) => (
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
                            <td
                              colSpan={showSpoilageTable ? 7 : 7}
                              className="px-3 py-8 text-center"
                            >
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
                          paginatedData.map((item, index) => (
                            <tr
                              key={`${item.id ?? "noid"}-${index}`}
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
                              {showSpoilageTable ? (
                                <>
                                  <td className="px-3 py-3 whitespace-nowrap text-center">
                                    <span className="text-red-400 font-semibold text-base">
                                      {item.wastage}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap">
                                    <span className="text-red-400 font-semibold text-xs">
                                      {item.expiration_date
                                        ? new Date(
                                            item.expiration_date
                                          ).toLocaleDateString()
                                        : "N/A"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap">
                                    <span className="text-yellow-400 text-xs italic">
                                      {item.reason || "Expired"}
                                    </span>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-3 py-3 whitespace-nowrap text-center">
                                    <span className="text-white font-semibold text-base">
                                      {item.inStock}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-center">
                                    <span className="text-blue-300 font-medium text-sm">
                                      {item.unit_cost !== undefined &&
                                      item.unit_cost !== null
                                        ? `₱${Number(item.unit_cost).toFixed(
                                            2
                                          )}`
                                        : "-"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-center">
                                    <span className="text-purple-300 font-semibold text-sm">
                                      {item.unit_cost !== undefined &&
                                      item.unit_cost !== null &&
                                      item.inStock
                                        ? `₱${(
                                            Number(item.unit_cost) *
                                            Number(item.inStock)
                                          ).toFixed(2)}`
                                        : "-"}
                                    </span>
                                  </td>
                                </>
                              )}
                              <td className="px-3 py-3 whitespace-nowrap">
                                {item.stock === "Spoiled" ? (
                                  <span className="bg-rose-700/30 text-rose-300 border border-rose-500/40 px-2 py-1 rounded-full text-xs font-bold">
                                    Spoiled
                                  </span>
                                ) : (
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-bold ${
                                      item.stock === "Critical"
                                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                                        : item.stock === "Low Stock"
                                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                        : item.stock === "Out Of Stock"
                                        ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                        : "bg-green-500/20 text-green-400 border-green-500/30"
                                    }`}
                                  >
                                    {item.stock}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-gray-300 text-xs font-mono">
                                {item.report_date}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {/* Pagination for Tablet View */}
                    {sortedData.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={sortedData.length}
                        onItemsPerPageChange={setItemsPerPage}
                      />
                    )}
                  </div>

                  {/* Desktop Table View - Large screens */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="table-auto w-full text-sm xl:text-base text-left border-collapse min-w-[800px]">
                      <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                        <tr>
                          {(showSpoilageTable
                            ? [
                                { key: "id", label: "#" },
                                { key: "name", label: "Item Name" },
                                { key: "batch_id", label: "Batch ID" },
                                { key: "category", label: "Category" },
                                { key: "wastage", label: "Wastage" },
                                {
                                  key: "expiration_date",
                                  label: "Expiration Date",
                                },
                                { key: "reason", label: "Reason" },
                                { key: "stock", label: "Status" },
                                { key: "report_date", label: "Spoilage Date" },
                              ]
                            : [
                                { key: "id", label: "#" },
                                { key: "name", label: "Item Name" },
                                { key: "batch_id", label: "Batch ID" },
                                { key: "category", label: "Category" },
                                { key: "inStock", label: "In Stock" },
                                { key: "unit_cost", label: "Unit Cost" },
                                { key: "total_value", label: "Total Value" },
                                {
                                  key: "expiration_date",
                                  label: "Expiration Date",
                                },
                                {
                                  key: "days_until_expiry",
                                  label: "Days Left",
                                },
                                { key: "stock", label: "Status" },
                                { key: "report_date", label: "Report Date" },
                              ]
                          ).map((col) => (
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
                              colSpan={showSpoilageTable ? 9 : 11}
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
                          paginatedData.map((item, index) => {
                            console.log(`[Table Render] Item ${index}:`, {
                              id: item.id,
                              name: item.name,
                              batch_id: item.batch_id,
                              raw_item: item,
                            });
                            return (
                              <tr
                                key={`${item.id ?? "noid"}-${index}`}
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
                                      #
                                      {(currentPage - 1) * itemsPerPage +
                                        index +
                                        1}
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
                                    {item.batch_id_display ||
                                      item.batch_id ||
                                      "N/A"}
                                  </span>
                                </td>
                                <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap text-gray-300">
                                  <span className="px-2 py-1 bg-gray-700/50 rounded-lg text-xs font-medium">
                                    {item.category}
                                  </span>
                                </td>
                                {showSpoilageTable ? (
                                  <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap">
                                    <span className="text-red-400 font-semibold text-lg">
                                      {item.wastage}
                                    </span>
                                  </td>
                                ) : (
                                  <>
                                    <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap">
                                      <span className="text-white font-semibold text-lg">
                                        {item.inStock}
                                        {item.unit}
                                      </span>
                                    </td>
                                    <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap">
                                      <span className="text-blue-300 font-medium">
                                        {item.unit_cost !== undefined &&
                                        item.unit_cost !== null
                                          ? `₱${Number(item.unit_cost).toFixed(
                                              2
                                            )}`
                                          : "-"}
                                      </span>
                                    </td>
                                    <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap">
                                      <span className="text-purple-300 font-semibold">
                                        {item.unit_cost !== undefined &&
                                        item.unit_cost !== null &&
                                        item.inStock
                                          ? `₱${(
                                              Number(item.unit_cost) *
                                              Number(item.inStock)
                                            ).toFixed(2)}`
                                          : "-"}
                                      </span>
                                    </td>
                                  </>
                                )}
                                <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap">
                                  {item.expiration_date ? (
                                    <div className="flex flex-col">
                                      <span
                                        className={`text-sm font-medium ${
                                          showSpoilageTable
                                            ? "text-red-400"
                                            : new Date(item.expiration_date) <=
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
                                      {!showSpoilageTable && (
                                        <span
                                          className={`text-xs ${
                                            new Date(item.expiration_date) <=
                                            new Date()
                                              ? "text-red-300"
                                              : new Date(
                                                  item.expiration_date
                                                ) <=
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
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-sm">
                                      N/A
                                    </span>
                                  )}
                                </td>
                                {/* Reason Column - Only show for Spoilage Inventory */}
                                {showSpoilageTable && (
                                  <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap">
                                    <span className="text-yellow-400 italic text-sm">
                                      {item.reason || "Expired"}
                                    </span>
                                  </td>
                                )}
                                {/* Days Until Expiry Column - Only show for Active Inventory */}
                                {!showSpoilageTable && (
                                  <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap">
                                    {item.expiration_date ? (
                                      (() => {
                                        const expirationDate = new Date(
                                          item.expiration_date
                                        );
                                        const today = new Date();
                                        const daysLeft = Math.ceil(
                                          (expirationDate.getTime() -
                                            today.getTime()) /
                                            (1000 * 60 * 60 * 24)
                                        );

                                        return (
                                          <span
                                            className={`px-3 py-1.5 rounded-lg font-bold text-sm ${
                                              daysLeft < 0
                                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                                : daysLeft <= 3
                                                ? "bg-red-500/10 text-red-300 border border-red-500/20"
                                                : daysLeft <= 7
                                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                                : daysLeft <= 14
                                                ? "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                                                : "bg-green-500/10 text-green-300 border border-green-500/20"
                                            }`}
                                          >
                                            {daysLeft < 0
                                              ? `${Math.abs(daysLeft)}d ago`
                                              : `${daysLeft}d`}
                                          </span>
                                        );
                                      })()
                                    ) : (
                                      <span className="text-gray-500 text-sm">
                                        -
                                      </span>
                                    )}
                                  </td>
                                )}
                                <td className="px-4 xl:px-6 py-4 xl:py-5 whitespace-nowrap">
                                  {item.stock === "Spoiled" ? (
                                    <span className="bg-rose-700/30 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full text-xs font-bold">
                                      Spoiled
                                    </span>
                                  ) : (
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                        item.stock === "Critical"
                                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                                          : item.stock === "Low Stock"
                                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                          : item.stock === "Out Of Stock"
                                          ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                          : "bg-green-500/20 text-green-400 border-green-500/30"
                                      }`}
                                    >
                                      {item.stock}
                                    </span>
                                  )}
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

                    {/* Pagination for Desktop View */}
                    {sortedData.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={sortedData.length}
                        onItemsPerPageChange={setItemsPerPage}
                      />
                    )}
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
                        paginatedData.map((item, index) => (
                          <div
                            key={`${item.id ?? "noid"}-${index}`}
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
                                    Batch:{" "}
                                    {item.batch_id_display ||
                                      item.batch_id ||
                                      "N/A"}
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ml-3 ${
                                  item.stock === "Critical"
                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                    : item.stock === "Low Stock"
                                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                    : item.stock === "Out Of Stock"
                                    ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                    : "bg-green-500/20 text-green-400 border-green-500/30"
                                }`}
                              >
                                {item.stock}
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

                    {/* Pagination for Mobile View */}
                    {sortedData.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={sortedData.length}
                        onItemsPerPageChange={setItemsPerPage}
                      />
                    )}
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

                  <div className="space-y-2 xs:space-y-3 sm:space-y-4 pt-1 xs:pt-2">
                    <button
                      onClick={() => {
                        exportExcel();
                        setExportSuccess(true);
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-semibold px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-1.5 xs:gap-2 text-xs xs:text-sm sm:text-base min-h-[40px] xs:min-h-[44px] touch-manipulation"
                      type="button"
                    >
                      <span className="text-sm xs:text-base sm:text-lg">
                        📊
                      </span>
                      <span className="truncate">Export to Excel (.xlsx)</span>
                    </button>

                    <GoogleSheetIntegration
                      onSuccess={handleGoogleLoginSuccess}
                      exporting={isExporting}
                    />

                    <button
                      onClick={() => setShowPopup(false)}
                      className="w-full border-2 border-gray-500/70 text-gray-400 hover:bg-gray-500 hover:text-white font-semibold px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-200 text-xs xs:text-sm sm:text-base min-h-[40px] xs:min-h-[44px] touch-manipulation"
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
                        <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl"></div>
                        <div className="relative bg-gradient-to-br from-blue-400 to-blue-500 p-4 rounded-full">
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
