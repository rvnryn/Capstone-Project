"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import {
  FaSearch,
  FaGoogle,
  FaBoxes,
  FaSort,
  FaChartLine,
  FaDownload,
  FaFilter,
  FaChartBar,
  FaFileImport,
  FaMoneyBillWave,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  MdCheckCircle,
  MdTrendingUp,
  MdInsights,
  MdAssessment,
} from "react-icons/md";
import { BiImport, BiExport } from "react-icons/bi";
import { FiBarChart, FiUpload } from "react-icons/fi";
import { TbReportAnalytics } from "react-icons/tb";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import {
  useComprehensiveSalesReport,
  useImportSalesData,
  useLogExport,
} from "../hooks/use-reportQuery";
import { useSalesAnalytics } from "../../Dashboard/hook/useSalesPrediction";
import NavigationBar from "@/app/components/navigation/navigation";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { saveAs } from "file-saver";
import { useComprehensiveAnalytics } from "./hooks/useComprehensiveAnalytics";
import { FaDollarSign, FaExclamationTriangle, FaTrophy } from "react-icons/fa";
import { MdTrendingDown } from "react-icons/md";
import Pagination from "@/app/components/Pagination";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const SHEET_RANGE = "Sheet1!A1";

interface SalesItem {
  name: string;
  quantity: number;
  unitPrice: number;
  report_date?: string;
  category?: string;
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

export default function ReportSales() {
  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [topItemsCount, setTopItemsCount] = useState(5);
  // Add filterType for period selection (daily, weekly, monthly)
  const [filterType, setFilterType] = useState<"daily" | "weekly" | "monthly">(
    "monthly"
  );
  const [showPopup, setShowPopup] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceRangeFilter, setPriceRangeFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "asc" as "asc" | "desc",
  });

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const autoDeduct = true; // Always auto-deduct from today's inventory
  // Initialize with "All Time" date range
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const now = new Date();
    const todayStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
    return {
      start: "2000-01-01", // Far back to capture all data
      end: todayStr
    };
  });
  const [timePeriod, setTimePeriod] = useState<
    "all" | "today" | "week" | "month" | "year" | "custom"
  >("all");
  const [viewMode, setViewMode] = useState<"detailed" | "summary">("detailed");
  // Track if date range was changed manually
  const [dateRangeManual, setDateRangeManual] = useState(false);

  // Fetch comprehensive analytics using unified date range with auto-refresh (30 seconds)
  const {
    analytics,
    loading: analyticsLoading,
    isRefreshing: analyticsRefreshing,
    error: analyticsError,
    lastUpdated: analyticsLastUpdated,
    refetch: refetchAnalytics,
  } = useComprehensiveAnalytics(
    dateRange.start ||
      (() => {
        const today = new Date();
        return (
          today.getFullYear() +
          "-" +
          String(today.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(today.getDate()).padStart(2, "0")
        );
      })(), // Today as default
    dateRange.end ||
      (() => {
        const today = new Date();
        return (
          today.getFullYear() +
          "-" +
          String(today.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(today.getDate()).padStart(2, "0")
        );
      })(), // Local date, no timezone issues
    30000 // Auto-refresh every 30 seconds
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Use React Query hooks with auto-refresh every 5 minutes
  const reportParams = useMemo(() => {
    // Helper to get local date string without timezone issues
    const getLocalDateStr = (date: Date) => {
      return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
      );
    };

    const todayStr = getLocalDateStr(new Date());
    return {
      start_date: dateRange.start || todayStr, // Today as default
      end_date: dateRange.end || todayStr, // Today in local timezone
    };
  }, [dateRange]);

  const { data: reportData, isLoading } =
    useComprehensiveSalesReport(reportParams);
  const importMutation = useImportSalesData();
  const logExportMutation = useLogExport();

  function normalizeDate(dateStr: string) {
    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Try to parse other formats (e.g., DD-MMM-YY)
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return dateStr; // fallback
  }

  // Use sales analytics for top selling (matches Dashboard)
  // Map filterType to days for correct period filtering
  const periodDays =
    filterType === "daily" ? 1 : filterType === "weekly" ? 7 : 30;
  const {
    historical,
    loading: historicalLoading,
    error: historicalError,
  } = useSalesAnalytics(filterType, topItemsCount, periodDays);
  const historicalData = historical?.data;

  // (Removed chart effect for Top Selling - not needed for historical analytics table)

  // Compute top items list from historical analytics (by_total_sales)
  const topItems = useMemo(() => {
    if (
      !historicalData ||
      !historicalData.top_performers ||
      !Array.isArray(historicalData.top_performers.by_total_sales)
    )
      return [];

    // Group by item name
    const grouped: { [key: string]: any } = {};
    historicalData.top_performers.by_total_sales.forEach((item: any) => {
      const key = item.item;
      if (!grouped[key]) {
        grouped[key] = { ...item, total_sales: 0, total_revenue: 0 };
      }
      grouped[key].total_sales += item.total_sales;
      grouped[key].total_revenue +=
        item.total_revenue || item.total_sales * (item.unitPrice || 0);
    });

    // Convert to array and sort
    return Object.values(grouped)
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, topItemsCount)
      .map((item, idx) => ({
        name: item.item,
        quantity: item.total_sales,
        unitPrice: "-",
        totalSales: item.total_revenue,
        rank: idx + 1,
        avgSales: item.avg_sales,
        frequency: item.frequency,
      }));
  }, [historicalData, topItemsCount]);

  // Format a period/week label into a nicer display. If the label is already human-friendly keep it.
  const formatPeriodLabel = (label?: string | null) => {
    if (!label) return "-";
    // If label already contains words like 'Week' assume it's friendly
    if (/week/i.test(label)) return label;
    // Try parse as date
    const d = new Date(label);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return label;
  };

  // Show item count and period selector for Top Selling
  const renderTopItemsCountSelector = () => (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-gray-300 text-xs sm:text-sm whitespace-nowrap">
        Items:
      </label>
      <select
        value={topItemsCount}
        onChange={(e) => setTopItemsCount(Number(e.target.value))}
        className="bg-gray-700 text-white text-xs sm:text-sm px-2 py-1 rounded border border-gray-600 focus:border-yellow-400 focus:outline-none min-w-0"
      >
        <option value={3}>Top 3</option>
        <option value={5}>Top 5</option>
        <option value={10}>Top 10</option>
      </select>
      <label className="text-gray-300 text-xs sm:text-sm ml-2 whitespace-nowrap">
        Period:
      </label>
      <select
        value={filterType}
        onChange={(e) =>
          setFilterType(e.target.value as "daily" | "weekly" | "monthly")
        }
        className="bg-gray-700 text-white text-xs sm:text-sm px-2 py-1 rounded border border-gray-600 focus:border-yellow-400 focus:outline-none min-w-0 transition-all duration-200"
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>
    </div>
  );

  useEffect(() => {
    console.log("[ReportSales] reportData:", reportData);
  }, [reportData]);

  const categories = [
    "Bagnet Meals",
    "Sizzlers",
    "Unli Rice w/ Bone Marrow",
    "Soups w/ Bone Marrow",
    "Combo",
    "For Sharing",
    "Noodles",
    "Desserts",
    "Sides",
    "Drinks",
  ];

  // React Query auto-refresh handles real-time updates (every 5 minutes)
  // No manual subscription needed

  // Handler for search input Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchQuery(pendingSearch);
    }
  };

  // Handler for time period changes
  const handleTimePeriodChange = useCallback(
    (period: "all" | "today" | "week" | "month" | "year" | "custom") => {
      setTimePeriod(period);
      setDateRangeManual(false); // Reset manual flag when preset selected

      const now = new Date();

      // Helper function to get local date string without timezone issues
      const getLocalDateStr = (date: Date) => {
        return (
          date.getFullYear() +
          "-" +
          String(date.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(date.getDate()).padStart(2, "0")
        );
      };

      const today = getLocalDateStr(now);

      switch (period) {
        case "today":
          setDateRange({ start: today, end: today });
          break;

        case "week": {
          // Create a "local" copy so timezone doesn't affect ISO conversion
          const localDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

          // Get the current day of the week (0=Sunday, 1=Monday, ..., 6=Saturday)
          const dayOfWeek = localDate.getDay();

          // Calculate Monday (if Sunday, go back 6 days)
          const monday = new Date(localDate);
          monday.setDate(
            localDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
          );

          // Calculate Sunday (6 days after Monday)
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);

          setDateRange({
            start: getLocalDateStr(monday),
            end: getLocalDateStr(sunday),
          });
          break;
        }

        case "month": {
          // Use local midnight date objects
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

          setDateRange({
            start: getLocalDateStr(firstDay),
            end: getLocalDateStr(lastDay),
          });
          break;
        }

        case "year": {
          const firstOfYear = new Date(now.getFullYear(), 0, 1);
          const lastOfYear = new Date(now.getFullYear(), 11, 31);

          setDateRange({
            start: getLocalDateStr(firstOfYear),
            end: getLocalDateStr(lastOfYear),
          });
          break;
        }

        case "all":
          // Use a very old start date to capture ALL data
          setDateRange({ start: "2000-01-01", end: getLocalDateStr(now) });
          break;

        case "custom":
          // Don't change date range, user will set manually
          break;
      }
    },
    []
  );

  // Helper functions
  const handleClear = useCallback(() => {
    setSearchQuery("");
    setCategoryFilter("");
    setPriceRangeFilter("");
    setDateRange({ start: "", end: "" });
    setTimePeriod("all");
    setSortConfig({ key: "", direction: "asc" });
  }, []);

  const clearSearch = useCallback(() => setSearchQuery(""), []);
  const clearCategory = useCallback(() => setCategoryFilter(""), []);
  const clearDateRange = useCallback(() => {
    setDateRange({ start: "", end: "" });
    setTimePeriod("all");
  }, []);
  const clearPriceRangeFilter = useCallback(() => setPriceRangeFilter(""), []);

  // Sync time period when user manually changes date range
  // DISABLED: This was causing conflicts with handleTimePeriodChange
  // The time period is already set explicitly when using the dropdown
  // useEffect(() => {
  //   // Only update timePeriod if not manual
  //   if (!dateRangeManual && (dateRange.start || dateRange.end)) {
  //     const now = new Date();
  //     // Helper to get local date string
  //     const getLocalDateStr = (date: Date) => {
  //       return (
  //         date.getFullYear() +
  //         "-" +
  //         String(date.getMonth() + 1).padStart(2, "0") +
  //         "-" +
  //         String(date.getDate()).padStart(2, "0")
  //       );
  //     };

  //     const today = getLocalDateStr(now);
  //     // Calculate preset ranges
  //     const weekAgo = getLocalDateStr(
  //       new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  //     );
  //     const monthAgo = getLocalDateStr(
  //       new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  //     );
  //     const yearAgo = getLocalDateStr(
  //       new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  //     );

  //     if (dateRange.start === today && dateRange.end === today) {
  //       setTimePeriod("today");
  //     } else if (dateRange.start === weekAgo && dateRange.end === today) {
  //       setTimePeriod("week");
  //     } else if (dateRange.start === monthAgo && dateRange.end === today) {
  //       setTimePeriod("month");
  //     } else if (dateRange.start === yearAgo && dateRange.end === today) {
  //       setTimePeriod("year");
  //     } else if (!dateRange.start && !dateRange.end) {
  //       setTimePeriod("all");
  //     } else {
  //       setTimePeriod("custom");
  //     }
  //   }
  // }, [dateRange.start, dateRange.end, dateRangeManual]);

  const requestSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  // Use the report data
  const effectiveReportData = reportData;

  // Convert hook data to the format expected by the component
  const salesData = useMemo(() => {
    if (!effectiveReportData || !Array.isArray(effectiveReportData.topItems)) {
      return [];
    }
    return effectiveReportData.topItems.map((item: any) => ({
      name: item?.item_name ?? "",
      quantity: Number(item?.quantity ?? 0),
      unitPrice:
        typeof item?.unit_price === "number"
          ? item.unit_price
          : Number(item?.total_price ?? 0) / (Number(item?.quantity ?? 1) || 1),
      totalRevenue: Number(item?.total_price ?? 0),
      category: item?.category ?? "",
      report_date: item?.report_date ?? "",
      subtotal: Number(item?.subtotal ?? 0),
      discount_percentage: Number(item?.discount_percentage ?? 0),
      sale_date: item?.sale_date ?? "",
      transaction_number: item?.transaction_number ?? "",
      dine_type: item?.dine_type ?? "",
      cashier: item?.cashier ?? "",
      terminal_no: item?.terminal_no ?? "",
      member: item?.member ?? "",
    }));
  }, [effectiveReportData]);

  const summarizedSalesData = useMemo(() => {
    if (viewMode === "detailed") return salesData;

    const grouped: { [key: string]: any } = {};

    salesData.forEach((item: any) => {
      const key = item.name;
      if (!grouped[key]) {
        grouped[key] = {
          name: item.name,
          category: item.category,
          quantity: 0,
          totalRevenue: 0,
          subtotal: 0,
          discountAmount: 0,
          transactions: 0,
        };
      }

      grouped[key].quantity += item.quantity;
      grouped[key].totalRevenue += item.totalRevenue;
      grouped[key].subtotal += item.subtotal;
      grouped[key].discountAmount += item.subtotal - item.totalRevenue;
      grouped[key].transactions += 1;
    });

    return Object.values(grouped).map((item: any) => ({
      ...item,
      unitPrice:
        item.quantity > 0 ? (item.totalRevenue / item.quantity).toFixed(2) : 0,
      avgDiscount:
        item.transactions > 0
          ? ((item.discountAmount / item.subtotal) * 100).toFixed(2)
          : 0,
    }));
  }, [salesData, viewMode]);

  // Always aggregated data for charts (regardless of view mode)
  const chartSalesData = useMemo(() => {
    const grouped: { [key: string]: any } = {};

    salesData.forEach((item: any) => {
      const key = item.name;
      if (!grouped[key]) {
        grouped[key] = {
          name: item.name,
          category: item.category,
          quantity: 0,
          totalRevenue: 0,
          subtotal: 0,
          discountAmount: 0,
          transactions: 0,
        };
      }

      grouped[key].quantity += item.quantity;
      grouped[key].totalRevenue += item.totalRevenue;
      grouped[key].subtotal += item.subtotal;
      grouped[key].discountAmount += item.subtotal - item.totalRevenue;
      grouped[key].transactions += 1;
    });

    return Object.values(grouped).map((item: any) => ({
      ...item,
      unitPrice:
        item.quantity > 0 ? (item.totalRevenue / item.quantity).toFixed(2) : 0,
      avgDiscount:
        item.transactions > 0
          ? ((item.discountAmount / item.subtotal) * 100).toFixed(2)
          : 0,
    }));
  }, [salesData]);

  // Use the appropriate data based on view mode
  const displaySalesData =
    viewMode === "summary" ? summarizedSalesData : salesData;

  // Filter helpers
  const filterByCategory = (item: any, category: string) => {
    if (!category) return true;
    return item.category === category;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    setImportModalOpen(true); // Always open modal when clicking import button
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    // Helper functions for Excel serial conversion
    function excelDateToJSDate(serial: number) {
      // Excel date serial to JS Date (YYYY-MM-DD)
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400; // seconds
      const date_info = new Date(utc_value * 1000);
      return date_info.toISOString().slice(0, 10);
    }
    function excelTimeToJSTime(serial: number) {
      // Excel time serial to HH:MM:SS
      const totalSeconds = Math.round(serial * 24 * 60 * 60);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      // Convert date/time columns if they are numbers
      const convertedRows = rows.map((row: any) => ({
        ...row,
        date:
          typeof row.date === "number"
            ? excelDateToJSDate(row.date)
            : normalizeDate(row.date),
        time:
          typeof row.time === "number" ? excelTimeToJSTime(row.time) : row.time,
      }));
      setImportedRows(convertedRows);
    };
    reader.readAsBinaryString(file);
  };

  const filteredSales = useMemo(() => {
    return displaySalesData.filter((item: any) => {
      // Robust search query filter: trim, ignore case, collapse spaces
      const normalize = (str: string) =>
        str.toLowerCase().replace(/\s+/g, " ").trim();
      const normalizedSearch = normalize(searchQuery);
      const normalizedItem = normalize(Object.values(item).join(" "));
      const matchesSearch = normalizedSearch
        ? normalizedItem.includes(normalizedSearch)
        : true;

      // Category filter
      const matchesCategory =
        !categoryFilter || item.category === categoryFilter;

      // Price range filter
      let matchesPriceRangeFilter = true;
      if (priceRangeFilter) {
        const price = Number(item.unitPrice);
        switch (priceRangeFilter) {
          case "budget":
            matchesPriceRangeFilter = price <= 100;
            break;
          case "mid_range":
            matchesPriceRangeFilter = price > 100 && price <= 300;
            break;
          case "premium":
            matchesPriceRangeFilter = price > 300;
            break;
          default:
            matchesPriceRangeFilter = true;
        }
      }

      let matchesDateRange = true;
      if (dateRange.start && dateRange.end && item.sale_date) {
        const itemDate = new Date(item.sale_date);
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0); // Start of day

        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // End of day

        matchesDateRange = itemDate >= startDate && itemDate <= endDate;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPriceRangeFilter &&
        matchesDateRange
      );
    });
  }, [
    displaySalesData,
    searchQuery,
    categoryFilter,
    priceRangeFilter,
    dateRange,
  ]);

  const groupedSales = filteredSales;

  // Enhanced sorting: sort by selected key and direction
  const sortedSales = useMemo(() => {
    const data = groupedSales;
    if (!sortConfig.key) return data;
    const sorted = [...data].sort((a, b) => {
      let aValue = a[sortConfig.key as keyof typeof a];
      let bValue = b[sortConfig.key as keyof typeof b];
      // Numeric sort for quantity, unitPrice, totalRevenue
      if (["quantity", "unitPrice", "totalRevenue"].includes(sortConfig.key)) {
        aValue = Number(aValue);
        bValue = Number(bValue);
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      }
      // String sort for name, category
      aValue = (aValue || "").toString().toLowerCase();
      bValue = (bValue || "").toString().toLowerCase();
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [groupedSales, sortConfig]);

  // Pagination calculations
  const totalItems = sortedSales.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSales = sortedSales.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, priceRangeFilter, dateRange, sortConfig]);

  // Prepare main sales data for export
  const values = [
    ["Item Name", "Category", "Quantity Sold", "Unit Price", "Total Sales"],
    ...sortedSales.map((item: any) => [
      item.name,
      item.category,
      item.quantity,
      item.unitPrice,
      item.totalRevenue,
    ]),
  ];

  // Temporary empty forecast data (to be replaced with ML feature)
  const forecastTable = [
    ["Week Start", "Actual Sales", "Predicted Sales", "Is Holiday Week"],
    ["No forecast data available", "", "", ""],
  ];

  const exportToExcel = async () => {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // Set workbook properties
    workbook.creator = "Cardiac Delights";
    workbook.created = new Date();
    workbook.modified = new Date();

    let currentRow = 1;

    // ========== 1. TITLE SECTION ==========
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = "SALES REPORT";
    titleCell.font = {
      name: "Arial",
      size: 20,
      bold: true,
      color: { argb: "FF8B5CF6" },
    };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(currentRow).height = 30;
    currentRow += 2;

    // ========== 2. REPORT METADATA ==========
    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "medium",
    });
    const totalSales = sortedSales.reduce(
      (sum: number, item: (typeof sortedSales)[0]) => sum + item.quantity,
      0
    );
    const totalRevenue = sortedSales.reduce(
      (sum: number, item: (typeof sortedSales)[0]) => sum + item.totalRevenue,
      0
    );

    worksheet.getCell(`A${currentRow}`).value = "Generated:";
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = timestamp;
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = "Total Sales:";
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = `${totalSales} items`;
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = "Total Revenue:";
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = `₱${totalRevenue.toLocaleString(
      "en-US",
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    )}`;
    worksheet.getCell(`B${currentRow}`).font = {
      color: { argb: "FF10B981" },
      bold: true,
    };
    currentRow += 2;

    // ========== 3. FILTER SUMMARY ==========
    if (
      searchQuery ||
      categoryFilter ||
      priceRangeFilter ||
      dateRange.start ||
      dateRange.end
    ) {
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      const filterTitleCell = worksheet.getCell(`A${currentRow}`);
      filterTitleCell.value = "ACTIVE FILTERS";
      filterTitleCell.font = { bold: true, size: 12 };
      filterTitleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" },
      };
      currentRow++;

      if (searchQuery) {
        worksheet.getCell(`A${currentRow}`).value = "Search:";
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`B${currentRow}`).value = searchQuery;
        currentRow++;
      }
      if (categoryFilter) {
        worksheet.getCell(`A${currentRow}`).value = "Category:";
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`B${currentRow}`).value = categoryFilter;
        currentRow++;
      }
      if (priceRangeFilter) {
        worksheet.getCell(`A${currentRow}`).value = "Price Range:";
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`B${currentRow}`).value = priceRangeFilter;
        currentRow++;
      }
      if (dateRange.start && dateRange.end) {
        worksheet.getCell(`A${currentRow}`).value = "Date Range:";
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(
          `B${currentRow}`
        ).value = `${dateRange.start} to ${dateRange.end}`;
        currentRow++;
      }
      currentRow++;
    }

    // ========== 4. SUMMARY STATISTICS SECTION ==========
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const statsHeaderCell = worksheet.getCell(`A${currentRow}`);
    statsHeaderCell.value = "SUMMARY STATISTICS";
    statsHeaderCell.font = {
      bold: true,
      size: 14,
      color: { argb: "FFFFFFFF" },
    };
    statsHeaderCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF10B981" },
    };
    statsHeaderCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    const dateRangeStr =
      dateRange.start && dateRange.end
        ? `${dateRange.start} to ${dateRange.end}`
        : "All Time";

    const statsData = [
      ["Metric", "Value"],
      ["Total Sales", `${totalSales} items`],
      [
        "Total Revenue",
        `₱${totalRevenue.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      ],
      [
        "Average Sale Value",
        `₱${avgSaleValue.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      ],
      ["Total Items Sold", `${totalSales} units`],
      ["Date Range", dateRangeStr],
    ];

    statsData.forEach((row, idx) => {
      worksheet.getRow(currentRow).values = row;
      const rowObj = worksheet.getRow(currentRow);
      if (idx === 0) {
        // Header row
        rowObj.font = { bold: true, color: { argb: "FFFFFFFF" } };
        rowObj.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF10B981" },
        };
      } else {
        // Data rows - alternating colors
        if (idx % 2 === 0) {
          rowObj.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0FDF4" },
          };
        }
        // Color revenue values in green
        if (row[0].includes("Revenue") || row[0].includes("Value")) {
          worksheet.getCell(`B${currentRow}`).font = {
            color: { argb: "FF10B981" },
            bold: true,
          };
        }
      }
      rowObj.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      currentRow++;
    });
    currentRow++;

    // ========== 5A. TOP 5 PERFORMING ITEMS (BY REVENUE) SECTION ==========
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const topRevenueHeaderCell = worksheet.getCell(`A${currentRow}`);
    topRevenueHeaderCell.value = "🏆 TOP 5 PERFORMING ITEMS (BY REVENUE)";
    topRevenueHeaderCell.font = {
      bold: true,
      size: 14,
      color: { argb: "FFFFFFFF" },
    };
    topRevenueHeaderCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF10B981" },
    };
    topRevenueHeaderCell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    const topPerformersByRevenue = [...sortedSales]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    const topRevenueHeaders = [
      "Rank",
      "Item Name",
      "Category",
      "Quantity Sold",
      "Revenue",
      "Avg Price",
    ];
    worksheet.getRow(currentRow).values = topRevenueHeaders;
    const topRevenueHeaderRow = worksheet.getRow(currentRow);
    topRevenueHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    topRevenueHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF10B981" },
    };
    topRevenueHeaderRow.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    currentRow++;

    topPerformersByRevenue.forEach((item, idx) => {
      const avgPrice =
        item.quantity > 0 ? item.totalRevenue / item.quantity : 0;
      const rowData = [
        idx + 1,
        item.name,
        item.category || "N/A",
        item.quantity,
        `₱${item.totalRevenue.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        `₱${avgPrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      ];
      worksheet.getRow(currentRow).values = rowData;
      const rowObj = worksheet.getRow(currentRow);

      // Alternating row colors
      if (idx % 2 === 1) {
        rowObj.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0FDF4" },
        };
      }

      // Revenue and Avg Price in green
      worksheet.getCell(`E${currentRow}`).font = {
        color: { argb: "FF10B981" },
        bold: true,
      };
      worksheet.getCell(`F${currentRow}`).font = {
        color: { argb: "FF10B981" },
        bold: true,
      };

      rowObj.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      currentRow++;
    });
    currentRow++;

    // ========== 5B. TOP 5 SELLING ITEMS (BY QUANTITY) SECTION ==========
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const topQuantityHeaderCell = worksheet.getCell(`A${currentRow}`);
    topQuantityHeaderCell.value = "📊 TOP 5 SELLING ITEMS (BY QUANTITY)";
    topQuantityHeaderCell.font = {
      bold: true,
      size: 14,
      color: { argb: "FFFFFFFF" },
    };
    topQuantityHeaderCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" },
    };
    topQuantityHeaderCell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    const topSellersByQuantity = [...sortedSales]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const topQuantityHeaders = [
      "Rank",
      "Item Name",
      "Category",
      "Quantity Sold",
      "Revenue",
      "Avg Price",
    ];
    worksheet.getRow(currentRow).values = topQuantityHeaders;
    const topQuantityHeaderRow = worksheet.getRow(currentRow);
    topQuantityHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    topQuantityHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" },
    };
    topQuantityHeaderRow.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    currentRow++;

    topSellersByQuantity.forEach((item, idx) => {
      const avgPrice =
        item.quantity > 0 ? item.totalRevenue / item.quantity : 0;
      const rowData = [
        idx + 1,
        item.name,
        item.category || "N/A",
        item.quantity,
        `₱${item.totalRevenue.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        `₱${avgPrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      ];
      worksheet.getRow(currentRow).values = rowData;
      const rowObj = worksheet.getRow(currentRow);

      // Alternating row colors with blue tint
      if (idx % 2 === 1) {
        rowObj.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDBEAFE" },
        };
      }

      // Quantity in blue
      worksheet.getCell(`D${currentRow}`).font = {
        color: { argb: "FF3B82F6" },
        bold: true,
      };

      rowObj.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      currentRow++;
    });
    currentRow++;

    // ========== 6. SALES BY CATEGORY SECTION ==========
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const categoryHeaderCell = worksheet.getCell(`A${currentRow}`);
    categoryHeaderCell.value = "SALES BY CATEGORY";
    categoryHeaderCell.font = {
      bold: true,
      size: 14,
      color: { argb: "FFFFFFFF" },
    };
    categoryHeaderCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF10B981" },
    };
    categoryHeaderCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    // Group by category
    const categoryMap: {
      [key: string]: { quantity: number; revenue: number };
    } = {};
    sortedSales.forEach((item: (typeof sortedSales)[0]) => {
      const cat = item.category || "Uncategorized";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { quantity: 0, revenue: 0 };
      }
      categoryMap[cat].quantity += item.quantity;
      categoryMap[cat].revenue += item.totalRevenue;
    });

    const categoryHeaders = [
      "Category",
      "Total Quantity",
      "Total Revenue",
      "% of Revenue",
    ];
    worksheet.getRow(currentRow).values = categoryHeaders;
    const catHeaderRow = worksheet.getRow(currentRow);
    catHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    catHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF10B981" },
    };
    catHeaderRow.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    currentRow++;

    Object.entries(categoryMap).forEach(([category, data], idx) => {
      const percentage =
        totalRevenue > 0
          ? ((data.revenue / totalRevenue) * 100).toFixed(2)
          : "0.00";
      const rowData = [
        category,
        data.quantity,
        `₱${data.revenue.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        `${percentage}%`,
      ];
      worksheet.getRow(currentRow).values = rowData;
      const rowObj = worksheet.getRow(currentRow);

      // Alternating row colors
      if (idx % 2 === 1) {
        rowObj.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0FDF4" },
        };
      }

      // Revenue in green
      worksheet.getCell(`C${currentRow}`).font = {
        color: { argb: "FF10B981" },
        bold: true,
      };

      rowObj.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      currentRow++;
    });
    currentRow++;

    // ========== 7. DETAILED SALES DATA SECTION ==========
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const detailHeaderCell = worksheet.getCell(`A${currentRow}`);
    detailHeaderCell.value = "DETAILED SALES DATA";
    detailHeaderCell.font = {
      bold: true,
      size: 14,
      color: { argb: "FFFFFFFF" },
    };
    detailHeaderCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF10B981" },
    };
    detailHeaderCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    const detailHeaders = [
      "#",
      "Item Name",
      "Category",
      "Quantity",
      "Unit Price",
      "Total Revenue",
      "Date",
      "Payment Method",
    ];
    worksheet.getRow(currentRow).values = detailHeaders;
    const detailHeaderRow = worksheet.getRow(currentRow);
    detailHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    detailHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF10B981" },
    };
    detailHeaderRow.alignment = { horizontal: "center", vertical: "middle" };
    detailHeaderRow.height = 20;
    detailHeaderRow.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    currentRow++;

    // Add all sales data with continuous numbering
    sortedSales.forEach((item: (typeof sortedSales)[0], idx: number) => {
      const rowData = [
        idx + 1, // Continuous numbering: 1, 2, 3, 4...
        item.name,
        item.category || "N/A",
        item.quantity,
        `₱${Number(item.unitPrice).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        `₱${item.totalRevenue.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        item.sale_date || item.report_date || "N/A",
        item.dine_type || "N/A",
      ];
      worksheet.getRow(currentRow).values = rowData;
      const rowObj = worksheet.getRow(currentRow);

      // Alternating row colors
      if (idx % 2 === 1) {
        rowObj.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0FDF4" },
        };
      }

      // Revenue values in green
      worksheet.getCell(`D${currentRow}`).font = {
        color: { argb: "FF10B981" },
      };
      worksheet.getCell(`E${currentRow}`).font = {
        color: { argb: "FF10B981" },
        bold: true,
      };

      rowObj.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      currentRow++;
    });
    currentRow++;

    // ========== 8. FOOTER ==========
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const footerCell = worksheet.getCell(`A${currentRow}`);
    footerCell.value = `Report generated by Cardiac Delights | ${new Date().toLocaleString()}`;
    footerCell.font = { italic: true, size: 10, color: { argb: "FF6B7280" } };
    footerCell.alignment = { horizontal: "center", vertical: "middle" };
    currentRow++;

    // ========== 9. COLUMN WIDTHS ==========
    worksheet.columns = [
      { width: 8 }, // A - #
      { width: 25 }, // B - Item Name
      { width: 18 }, // C - Category
      { width: 12 }, // D - Quantity
      { width: 15 }, // E - Unit Price
      { width: 18 }, // F - Total Revenue
      { width: 15 }, // G - Date
      { width: 18 }, // I - Payment Method
    ];

    // Forecast worksheet (keep existing simple version)
    const forecastWorksheet = workbook.addWorksheet("Sales Forecast");
    forecastWorksheet.addRows(forecastTable);
    const forecastHeaderRow = forecastWorksheet.getRow(1);
    forecastHeaderRow.font = { bold: true };
    forecastHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFCC99" },
    };
    forecastWorksheet.columns.forEach((column) => {
      column.width = 20;
    });

    // Generate buffer and save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Sales_Report_${getFormattedDate()}.xlsx`);
    setExportSuccess(true);
    setShowPopup(false);

    // Log export activity to backend
    try {
      const token = localStorage.getItem("access_token");
      // Helper to get local date string
      const getLocalDateStr = (date: Date) => {
        return (
          date.getFullYear() +
          "-" +
          String(date.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(date.getDate()).padStart(2, "0")
        );
      };

      const todayStr = getLocalDateStr(new Date());
      const startDate = dateRange.start || todayStr; // Today as default
      const endDate = dateRange.end || todayStr;

      await fetch(
        `${API_BASE_URL}/api/export-sales?start_date=${startDate}&end_date=${endDate}&export_type=${viewMode}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.warn("Failed to log export activity:", error);
      // Don't fail the export if logging fails
    }
  };

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

      // Log export activity to backend for Google Sheets
      try {
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("access_token");
        // Helper to get local date string
        const getLocalDateStr = (date: Date) => {
          return (
            date.getFullYear() +
            "-" +
            String(date.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(date.getDate()).padStart(2, "0")
          );
        };

        const todayStr = getLocalDateStr(new Date());
        const startDate = dateRange.start || todayStr; // Today as default
        const endDate = dateRange.end || todayStr;

        await fetch(
          `${API_BASE_URL}/api/export-sales?start_date=${startDate}&end_date=${endDate}&export_type=${viewMode}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (logError) {
        console.warn("Failed to log Google Sheets export activity:", logError);
      }
    } catch (error) {
      console.error("Append failed:", error);
      alert(
        "Google Sheets export failed. Please check your permissions and try again."
      );
    }
  };

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
            properties: { title: `Sales Report - ${getFormattedDate()}` },
            sheets: [{ properties: { title: "Sheet1" } }],
          }),
        }
      );
      const sheet = await response.json();
      console.log("[Google Export] Sheet created:", sheet);
      const sheetId = sheet.spreadsheetId;
      await appendToGoogleSheet(
        accessToken,
        sheetId,
        SHEET_RANGE,
        values,
        forecastTable
      );
    } catch (error) {
      console.error("Failed to create sheet:", error);
    }
  };

  const handleExportChoice = (choice: string) => {
    if (choice === "excel") {
      exportToExcel();
    } else if (choice === "googleSheets") {
      setShowPopup(true);
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

  const handleCloseSuccessPopup = () => {
    setExportSuccess(false);
    setShowPopup(false);
  };

  const getFormattedDate = () => {
    const date = new Date();
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const dayNumber = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${dayNumber}, ${year}`;
  };

  useEffect(() => {
    if (importSuccess) {
      const timer = setTimeout(() => setImportSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [importSuccess]);

  const handleCustomDateChange = (field: "start" | "end", value: string) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
    setTimePeriod("custom");
    setDateRangeManual(true);
  };
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <section className="min-h-screen bg-yellow-600 text-white font-poppins">
        <NavigationBar
          showPopup={showPopup}
          exportSuccess={exportSuccess}
          isExporting={isExporting}
        />
        <ResponsiveMain>
          <main
            className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
            aria-label="Sales Report main content"
            tabIndex={-1}
          >
            <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
              <section className="bg-black rounded-lg xs:rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl p-1 xs:p-2 sm:p-4 md:p-6 lg:p-8 xl:p-12 w-full overflow-hidden">
                {/* Header Section */}
                <header className="flex flex-col space-y-2 xs:space-y-3 sm:space-y-4 lg:space-y-6 mb-3 xs:mb-4 sm:mb-6 lg:mb-8">
                  {/* Title and Action Row */}
                  <div className="flex flex-col gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg"></div>
                          <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-2 sm:p-3 rounded-full">
                            <TbReportAnalytics className="text-black text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                            Sales Analytics Report
                          </h2>
                          <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-1">
                            Comprehensive sales data analysis and business
                            intelligence
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        {/* Import Button */}
                        <button
                          onClick={() => setImportModalOpen(true)}
                          className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg sm:rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm md:text-base whitespace-nowrap flex-1 sm:flex-none min-h-[44px]"
                        >
                          <BiImport className="text-xs sm:text-sm" />
                          <span>Import Report</span>
                        </button>
                        {/* Export Button */}
                        <button
                          onClick={() => setShowPopup(true)}
                          className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg sm:rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm md:text-base whitespace-nowrap flex-1 sm:flex-none min-h-[44px]"
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
                          <FaCalendarAlt className="text-yellow-400 text-xs 2xs:text-sm flex-shrink-0" />
                          <span className="text-2xs 2xs:text-xs xs:text-sm truncate">
                            Report Generated: {new Date().toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 2xs:gap-1.5 xs:gap-2 text-gray-300">
                          <MdAssessment className="text-yellow-400 text-xs 2xs:text-sm flex-shrink-0" />
                          <span className="text-2xs 2xs:text-xs xs:text-sm truncate">
                            Sales Records: {reportData?.totalItems || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 2xs:gap-1.5 xs:gap-2 text-2xs 2xs:text-xs xs:text-sm text-gray-400 w-full xs:w-auto justify-end">
                        <span className="truncate">Last Updated:</span>
                        <span className="text-yellow-400 font-medium truncate">
                          {analyticsLastUpdated
                            ? analyticsLastUpdated.toLocaleTimeString()
                            : new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Unified Sales Summary */}
                <section className="my-6">
                  {/* Header with refresh indicator and last updated timestamp */}
                  {(analytics || analyticsLoading) && (
                    <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                      <div className="flex items-center gap-3">
                        {analyticsRefreshing && (
                          <div className="flex items-center gap-2 text-xs text-blue-400">
                            <svg
                              className="w-4 h-4 animate-spin"
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
                            <span>Updating...</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {analyticsLastUpdated && (
                          <span className="text-xs text-gray-500">
                            Last updated:{" "}
                            {analyticsLastUpdated.toLocaleTimeString()}
                          </span>
                        )}
                        <button
                          onClick={() => refetchAnalytics()}
                          disabled={analyticsRefreshing}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            analyticsRefreshing
                              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                          title="Refresh analytics"
                        >
                          <svg
                            className={`w-4 h-4 ${
                              analyticsRefreshing ? "animate-spin" : ""
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
                          Refresh
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Only show loading spinner on initial load (when no data exists yet) */}
                  {analyticsLoading && !analytics ? (
                    <div className="bg-gradient-to-br from-black/80 to-slate-900 rounded-xl shadow p-8 border border-gray-700">
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-3 text-gray-400">
                          Loading analytics...
                        </span>
                      </div>
                    </div>
                  ) : analyticsError ? (
                    <div className="bg-gradient-to-br from-black/80 to-slate-900 rounded-xl shadow p-8 border border-gray-700">
                      <div className="text-center text-red-400">
                        <FaExclamationTriangle className="text-4xl mx-auto mb-3" />
                        <p className="text-lg font-semibold">
                          Error loading analytics
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          {analyticsError}
                        </p>
                      </div>
                    </div>
                  ) : analytics ? (
                    <div className="space-y-6">
                      {/* KPI Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Revenue */}
                        <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-xl p-4 border border-green-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <FaMoneyBillWave className="text-green-400 text-2xl" />
                            <span className="text-xs text-gray-400">
                              Revenue
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-white">
                            ₱{analytics.summary.total_revenue.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Gross Margin:{" "}
                            {analytics.profitability.gross_profit_margin.toFixed(
                              1
                            )}
                            %
                          </div>
                        </div>

                        {/* Net Profit */}
                        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-4 border border-blue-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <MdTrendingUp className="text-blue-400 text-2xl" />
                            <span className="text-xs text-gray-400">
                              Net Profit
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-white">
                            ₱{analytics.summary.net_profit.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Net Margin:{" "}
                            {analytics.profitability.net_profit_margin.toFixed(
                              1
                            )}
                            %
                          </div>
                        </div>

                        {/* Total Loss */}
                        <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-xl p-4 border border-red-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <MdTrendingDown className="text-red-400 text-2xl" />
                            <span className="text-xs text-gray-400">
                              Total Loss
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-white">
                            ₱{analytics.summary.total_loss.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Loss %:{" "}
                            {analytics.profitability.loss_percentage.toFixed(1)}
                            %
                          </div>
                        </div>

                        {/* Items Sold */}
                        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl p-4 border border-purple-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <FaBoxes className="text-purple-400 text-2xl" />
                            <span className="text-xs text-gray-400">
                              Items Sold
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {analytics.summary.total_items_sold.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Unique: {analytics.summary.unique_items_sold} items
                          </div>
                        </div>
                      </div>

                      {/* Financial Breakdown */}
                      <div className="bg-gradient-to-br from-black/80 to-slate-900 rounded-xl shadow p-6 border border-gray-700">
                        <h4 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                          <FiBarChart className="text-yellow-400" />
                          Financial Breakdown
                        </h4>
                        <div className="space-y-4">
                          {/* Revenue */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-300">
                                Total Revenue
                              </span>
                              <span className="text-sm font-semibold text-green-400">
                                ₱
                                {analytics.summary.total_revenue.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full"
                                style={{ width: "100%" }}
                              ></div>
                            </div>
                          </div>

                          {/* COGS */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-300">
                                Cost of Goods Sold (COGS)
                              </span>
                              <span className="text-sm font-semibold text-orange-400">
                                ₱{analytics.summary.total_cogs.toLocaleString()}{" "}
                                (
                                {analytics.profitability.cogs_percentage.toFixed(
                                  1
                                )}
                                %)
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full"
                                style={{
                                  width: `${analytics.profitability.cogs_percentage}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Loss */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-300">
                                Total Loss (Spoilage)
                              </span>
                              <span className="text-sm font-semibold text-red-400">
                                ₱{analytics.summary.total_loss.toLocaleString()}{" "}
                                (
                                {analytics.profitability.loss_percentage.toFixed(
                                  1
                                )}
                                %)
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-red-500 to-red-400 h-2 rounded-full"
                                style={{
                                  width: `${analytics.profitability.loss_percentage}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Gross Profit */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-300">
                                Gross Profit
                              </span>
                              <span className="text-sm font-semibold text-blue-400">
                                ₱
                                {analytics.summary.gross_profit.toLocaleString()}{" "}
                                (
                                {analytics.profitability.gross_profit_margin.toFixed(
                                  1
                                )}
                                %)
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full"
                                style={{
                                  width: `${analytics.profitability.gross_profit_margin}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Net Profit */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-300">
                                Net Profit
                              </span>
                              <span className="text-sm font-semibold text-cyan-400">
                                ₱{analytics.summary.net_profit.toLocaleString()}{" "}
                                (
                                {analytics.profitability.net_profit_margin.toFixed(
                                  1
                                )}
                                %)
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full"
                                style={{
                                  width: `${analytics.profitability.net_profit_margin}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Loss/Spoilage Analysis */}
                      <div className="bg-gradient-to-br from-black/80 to-slate-900 rounded-xl shadow p-6 border border-gray-700">
                        <h4 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                          <FaExclamationTriangle className="text-red-400" />
                          Loss & Spoilage Analysis
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                          <div className="bg-red-900/20 rounded-lg p-4 border border-red-700/30">
                            <div className="text-sm text-gray-400 mb-1">
                              Total Spoilage Cost
                            </div>
                            <div className="text-xl font-bold text-red-400">
                              ₱
                              {analytics.loss_analysis.total_spoilage_cost.toLocaleString()}
                            </div>
                          </div>
                          <div className="bg-red-900/20 rounded-lg p-4 border border-red-700/30">
                            <div className="text-sm text-gray-400 mb-1">
                              Quantity Spoiled
                            </div>
                            <div className="text-xl font-bold text-red-400">
                              {analytics.loss_analysis.total_quantity_spoiled.toLocaleString()}
                            </div>
                          </div>
                          <div className="bg-red-900/20 rounded-lg p-4 border border-red-700/30">
                            <div className="text-sm text-gray-400 mb-1">
                              Incidents
                            </div>
                            <div className="text-xl font-bold text-red-400">
                              {analytics.loss_analysis.total_incidents}
                            </div>
                          </div>
                        </div>

                        {analytics.loss_analysis.spoilage_items.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="text-gray-300 text-xs border-b border-gray-700">
                                  <th className="px-4 py-2 text-left">
                                    Item Name
                                  </th>
                                  <th className="px-4 py-2 text-left">
                                    Category
                                  </th>
                                  <th className="px-4 py-2 text-right">
                                    Qty Spoiled
                                  </th>
                                  <th className="px-4 py-2 text-right">Cost</th>
                                  <th className="px-4 py-2 text-right">
                                    Incidents
                                  </th>
                                  <th className="px-4 py-2 text-left">
                                    Reasons
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {analytics.loss_analysis.spoilage_items
                                  .slice(0, 5)
                                  .map((item, idx) => (
                                    <tr
                                      key={idx}
                                      className="border-b border-gray-800 hover:bg-gray-800/30"
                                    >
                                      <td className="px-4 py-3 text-white">
                                        {item.item_name}
                                      </td>
                                      <td className="px-4 py-3 text-gray-300">
                                        {item.category}
                                      </td>
                                      <td className="px-4 py-3 text-right text-red-400">
                                        {item.total_spoiled}
                                      </td>
                                      <td className="px-4 py-3 text-right text-red-400">
                                        ₱{item.total_cost.toLocaleString()}
                                      </td>
                                      <td className="px-4 py-3 text-right text-gray-300">
                                        {item.incidents}
                                      </td>
                                      <td className="px-4 py-3 text-gray-400 text-xs">
                                        {item.reasons || "N/A"}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 py-4">
                            <p>No spoilage data for this period</p>
                          </div>
                        )}
                      </div>

                      {/* Top Performers & Top Sellers - Side by Side */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Top Performing Items (By Revenue) */}
                        <div className="bg-gradient-to-br from-black/80 to-slate-900 rounded-xl shadow p-6 border border-gray-700">
                          <h4 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                            <FaTrophy className="text-green-400" />
                            Top 5 Performing Items (By Revenue)
                          </h4>
                          {chartSalesData.length > 0 ? (
                            <div className="space-y-3">
                              {[...chartSalesData]
                                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                                .slice(0, 5)
                                .map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-3 bg-gray-800/30 rounded-lg p-3"
                                  >
                                    <div
                                      className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                        idx === 0
                                          ? "bg-green-400 text-black"
                                          : idx === 1
                                          ? "bg-green-500 text-white"
                                          : idx === 2
                                          ? "bg-green-600 text-white"
                                          : "bg-gray-700 text-gray-300"
                                      }`}
                                    >
                                      {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-white font-semibold">
                                        {item.name}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {item.category || "N/A"}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-green-400 font-semibold">
                                        ₱{item.totalRevenue.toLocaleString()}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {item.quantity} sold
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-center text-gray-400 py-4">
                              <p>No sales data available</p>
                            </div>
                          )}
                        </div>

                        {/* Top Selling Items (By Quantity) */}
                        <div className="bg-gradient-to-br from-black/80 to-slate-900 rounded-xl shadow p-6 border border-gray-700">
                          <h4 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                            <FaChartBar className="text-blue-400" />
                            Top 5 Selling Items (By Quantity)
                          </h4>
                          {chartSalesData.length > 0 ? (
                            <div className="space-y-3">
                              {[...chartSalesData]
                                .sort((a, b) => b.quantity - a.quantity)
                                .slice(0, 5)
                                .map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-3 bg-gray-800/30 rounded-lg p-3"
                                  >
                                    <div
                                      className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                        idx === 0
                                          ? "bg-blue-400 text-black"
                                          : idx === 1
                                          ? "bg-blue-500 text-white"
                                          : idx === 2
                                          ? "bg-blue-600 text-white"
                                          : "bg-gray-700 text-gray-300"
                                      }`}
                                    >
                                      {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-white font-semibold">
                                        {item.name}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {item.category || "N/A"}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-blue-400 font-semibold">
                                        {item.quantity} sold
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        ₱{item.totalRevenue.toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-center text-gray-400 py-4">
                              <p>No sales data available</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Daily Trend */}
                      <div className="bg-gradient-to-br from-black/80 to-slate-900 rounded-xl shadow p-6 border border-gray-700">
                        <h4 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                          <FaChartLine className="text-yellow-400" />
                          Daily Sales Trend (Last 7 Days)
                        </h4>
                        {analytics.daily_trend.length > 0 ? (
                          <div className="overflow-x-auto">
                            <div className="flex gap-2 min-w-max">
                              {analytics.daily_trend.map((day, idx) => {
                                const maxRevenue = Math.max(
                                  ...analytics.daily_trend.map(
                                    (d) => d.total_revenue
                                  )
                                );
                                const heightPercent =
                                  (day.total_revenue / maxRevenue) * 100;
                                return (
                                  <div
                                    key={idx}
                                    className="flex flex-col items-center gap-2 flex-1 min-w-[80px]"
                                  >
                                    <div className="text-xs text-gray-400 font-semibold">
                                      {new Date(day.date).toLocaleDateString(
                                        "en-US",
                                        { month: "short", day: "numeric" }
                                      )}
                                    </div>
                                    <div className="relative w-full h-32 bg-gray-800/30 rounded-t-lg flex items-end justify-center">
                                      <div
                                        className="w-full bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg transition-all duration-300 hover:from-yellow-400 hover:to-yellow-300"
                                        style={{ height: `${heightPercent}%` }}
                                      ></div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-green-400 font-semibold text-sm">
                                        ₱{day.total_revenue.toLocaleString()}
                                      </div>
                                      <div className="text-gray-400 text-xs">
                                        {day.total_items} items
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 py-4">
                            <p>No daily trend data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-black/80 to-slate-900 rounded-xl shadow p-8 border border-gray-700">
                      <div className="text-center text-gray-400">
                        <p className="text-lg font-semibold mb-2">
                          No analytics data available
                        </p>
                        <p className="text-sm">
                          Select a date range to view comprehensive analytics
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {/* Machine Learning Sales Forecast Section */}
                <section className="my-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400 flex items-center gap-2">
                      <FaChartLine className="text-yellow-400" />
                      Weekly Sales Forecast
                      <span
                        role="tooltip"
                        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-max min-w-[200px] sm:min-w-[240px] 
                              bg-black/90 text-yellow-100 text-xs rounded-lg px-3 py-2 shadow-lg border border-yellow-500 
                              opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 
                              pointer-events-none transition-opacity duration-200"
                      >
                        Forecasts are estimates only and may not be 100%
                        accurate.
                      </span>
                    </h3>
                  </div>

                  {reportData &&
                  (reportData as any).forecast &&
                  (reportData as any).forecast.length > 0 ? (
                    <div className="bg-gradient-to-br from-black/80 to-slate-900 rounded-xl shadow p-6 border border-gray-700">
                      <div className="mb-4 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-blue-400 font-semibold mb-1">
                              Machine Learning Prediction
                            </h4>
                            <p className="text-gray-300 text-sm">
                              Our AI model analyzes historical sales patterns,
                              seasonality, and Philippine holidays to forecast
                              future sales. Use these insights to plan
                              inventory, staffing, and business operations.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="table-auto w-full text-sm text-left border-collapse min-w-[400px] bg-gray-900/60 rounded-lg">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="px-4 py-3 text-yellow-400 font-semibold">
                                Week Start
                              </th>
                              <th className="px-4 py-3 text-yellow-400 font-semibold">
                                Predicted Sales (ML)
                              </th>
                              <th className="px-4 py-3 text-green-400 font-semibold">
                                Actual Sales
                              </th>
                              <th className="px-4 py-3 text-blue-400 font-semibold text-center">
                                Holiday Week?
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {((reportData as any).forecast || [])
                              .slice(0, 4)
                              .map((row: any, idx: number) => (
                                <tr
                                  key={row.week_start || idx}
                                  className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                                >
                                  <td className="px-4 py-3 font-mono text-white">
                                    {row.week_start}
                                  </td>
                                  <td className="px-4 py-3 text-yellow-300 font-semibold">
                                    ₱
                                    {row.predicted_sales?.toLocaleString() ||
                                      "0"}
                                  </td>
                                  <td className="px-4 py-3 text-green-300 font-semibold">
                                    {row.actual_sales !== null &&
                                    row.actual_sales !== undefined ? (
                                      `₱${row.actual_sales.toLocaleString()}`
                                    ) : (
                                      <span className="text-gray-500 italic">
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {row.is_holiday_week ? (
                                      <span className="inline-flex items-center gap-1 text-blue-400 font-semibold px-2 py-1 bg-blue-900/30 rounded">
                                        <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
                                        Yes
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">No</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                        <p className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
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
                          Predictions are estimates and may vary from actual
                          results
                        </p>
                        <p className="text-purple-400 font-medium">
                          Powered by Machine Learning Algorithm
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-black/80 to-slate-900 rounded-xl shadow p-8 border border-gray-700">
                      <div className="text-center text-gray-400">
                        <FaChartLine className="text-5xl mx-auto mb-3 text-gray-600" />
                        <p className="text-lg font-semibold mb-2">
                          No forecast data available
                        </p>
                        <p className="text-sm">
                          Import historical sales data to generate ML
                          predictions
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {/* Divider */}
                <div className="relative mb-2 xs:mb-3 sm:mb-4 lg:mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-black px-1.5 xs:px-2 sm:px-3 lg:px-4 text-yellow-400/70 text-2xs xs:text-xs sm:text-sm flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                      <FaFilter className="text-2xs xs:text-xs sm:text-sm flex-shrink-0" />
                      <span className="truncate">Filters & Table</span>
                    </span>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="mb-4 flex items-center justify-between bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <FiBarChart className="text-blue-400 text-lg" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        Table View
                      </h3>
                      <p className="text-xs text-gray-400">
                        Choose how to display sales data
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-1 border border-gray-700">
                    <button
                      onClick={() => setViewMode("detailed")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        viewMode === "detailed"
                          ? "bg-yellow-500 text-black shadow-lg"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        Detailed
                      </div>
                    </button>
                    <button
                      onClick={() => setViewMode("summary")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        viewMode === "summary"
                          ? "bg-yellow-500 text-black shadow-lg"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        Summary
                      </div>
                    </button>
                  </div>
                </div>

                {/* Enhanced Filters Section */}
                <section className="mb-2 xs:mb-3 sm:mb-4 lg:mb-6">
                  {/* Filter Header */}
                  <div className="flex flex-col 2xs:flex-row items-start 2xs:items-center justify-between mb-2 xs:mb-3 gap-1.5 xs:gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="p-1 xs:p-1.5 sm:p-2 bg-yellow-500/10 rounded-md xs:rounded-lg border border-yellow-500/20 flex-shrink-0">
                        <FaFilter className="text-yellow-400 text-2xs xs:text-xs sm:text-sm" />
                      </div>
                      <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-white truncate">
                        Filters
                      </h3>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-2 xs:mb-3">
                    <div className="absolute left-2 xs:left-3 sm:left-4 top-1/2 -translate-y-1/2 text-yellow-400 pointer-events-none">
                      <FaSearch className="text-2xs xs:text-xs sm:text-sm" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search sales..."
                      value={pendingSearch}
                      onChange={(e) => setPendingSearch(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-md xs:rounded-lg sm:rounded-xl px-6 xs:px-8 sm:px-12 py-2 xs:py-2.5 sm:py-3 lg:py-4 shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-400/50 border border-gray-600/50 hover:border-gray-500 transition-all text-2xs xs:text-xs sm:text-sm md:text-base custom-scrollbar touch-target"
                    />
                    {pendingSearch && (
                      <div className="absolute right-1.5 xs:right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          onClick={() => {
                            setPendingSearch("");
                            setSearchQuery("");
                          }}
                          className="text-gray-400 hover:text-white transition-colors bg-gray-600/50 hover:bg-gray-500/50 rounded-full w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex items-center justify-center text-2xs xs:text-xs sm:text-sm touch-target no-select"
                          title="Clear search"
                          aria-label="Clear search"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Filter Controls */}
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg xs:rounded-xl p-2 xs:p-3 sm:p-4 border border-gray-700/50">
                    {/* Primary Filters Row */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 mb-4">
                      <div>
                        <label className="flex items-center gap-1.5 xs:gap-2 text-gray-300 text-xs xs:text-xs sm:text-sm font-medium mb-1.5 xs:mb-2">
                          <FaCalendarAlt className="text-yellow-400 text-xs flex-shrink-0" />
                          <span className="truncate">Time Period</span>
                        </label>
                        <select
                          value={timePeriod}
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
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-2 xs:px-3 py-2 xs:py-2.5 sm:py-3 border border-gray-600/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 cursor-pointer text-xs xs:text-sm transition-all"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                          <option value="year">This Year</option>
                          <option value="custom">Custom Range</option>
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 xs:gap-2 text-gray-300 text-xs xs:text-xs sm:text-sm font-medium mb-1.5 xs:mb-2">
                          <FaBoxes className="text-yellow-400 text-xs flex-shrink-0" />
                          <span className="truncate">Category</span>
                        </label>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-2 xs:px-3 py-2 xs:py-2.5 sm:py-3 border border-gray-600/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 cursor-pointer text-xs xs:text-sm transition-all"
                        >
                          <option value="">All Categories</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs xs:text-sm text-gray-300 mb-1 xs:mb-2 font-medium">
                          Price Range
                        </label>
                        <select
                          value={priceRangeFilter}
                          onChange={(e) => setPriceRangeFilter(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-600/50 focus:border-yellow-400 cursor-pointer text-xs xs:text-sm transition-all"
                        >
                          <option value="">All Price Ranges</option>
                          <option value="budget">Budget (≤₱100)</option>
                          <option value="mid_range">
                            Mid-range (₱101-₱300)
                          </option>
                          <option value="premium">Premium (&gt;₱300)</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom Date Range (shown when Custom is selected) */}
                    {timePeriod === "custom" && (
                      <div className="mb-4 pb-4 border-b border-gray-700/30">
                        <label className="flex items-center gap-1.5 xs:gap-2 text-gray-300 text-xs xs:text-xs sm:text-sm font-medium mb-1.5 xs:mb-2">
                          <FaCalendarAlt className="text-yellow-400 text-xs flex-shrink-0" />
                          <span className="truncate">Custom Date Range</span>
                        </label>
                        <div className="flex flex-col xs:flex-row gap-2 items-center">
                          <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) =>
                              handleCustomDateChange("start", e.target.value)
                            }
                            className="w-full xs:w-auto bg-gray-700/50 text-white rounded-md xs:rounded-lg px-2 xs:px-3 py-2 xs:py-2.5 border border-gray-600/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-xs xs:text-sm"
                            placeholder="Start date"
                          />
                          <span className="text-gray-400 text-xs xs:text-sm">
                            to
                          </span>
                          <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) =>
                              handleCustomDateChange("end", e.target.value)
                            }
                            className="w-full xs:w-auto bg-gray-700/50 text-white rounded-md xs:rounded-lg px-2 xs:px-3 py-2 xs:py-2.5 border border-gray-600/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-xs xs:text-sm"
                            placeholder="End date"
                          />
                        </div>
                      </div>
                    )}

                    {/* Clear All Button inside filter controls */}
                    {(searchQuery ||
                      categoryFilter ||
                      priceRangeFilter ||
                      timePeriod !== "all" ||
                      sortConfig.key !== "") && (
                      <div className="mt-3 xs:mt-4 pt-3 xs:pt-4 border-t border-gray-700/30">
                        <div className="flex justify-center">
                          <button
                            onClick={handleClear}
                            className="flex items-center gap-1.5 xs:gap-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 xs:px-4 py-1.5 xs:py-2 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-200 text-xs xs:text-sm font-medium"
                          >
                            <span>🗑️</span>
                            <span className="truncate">Clear All Filters</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Filter Summary */}
                    <div className="mt-3 xs:mt-4 pt-3 xs:pt-4 border-t border-gray-700/30">
                      <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 text-xs xs:text-sm">
                        <span className="text-gray-400 flex-shrink-0">
                          Active Filters:
                        </span>
                        {!searchQuery &&
                        !categoryFilter &&
                        !priceRangeFilter &&
                        timePeriod === "all" &&
                        sortConfig.key === "" ? (
                          <span className="text-gray-500 italic">None</span>
                        ) : (
                          <>
                            {timePeriod !== "all" && (
                              <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border border-green-500/30 max-w-full">
                                <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                                  Period:{" "}
                                  {timePeriod === "today"
                                    ? "Today"
                                    : timePeriod === "week"
                                    ? "Week"
                                    : timePeriod === "month"
                                    ? "Month"
                                    : timePeriod === "year"
                                    ? "Year"
                                    : timePeriod === "custom"
                                    ? "Custom"
                                    : timePeriod}
                                </span>
                                <button
                                  onClick={() =>
                                    handleTimePeriodChange("all")
                                  }
                                  className="text-green-300 hover:text-white transition-colors ml-1 flex-shrink-0"
                                  title="Clear time period"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {searchQuery && (
                              <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border border-yellow-500/30 max-w-full">
                                <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                                  Search: "{searchQuery}"
                                </span>
                                <button
                                  onClick={clearSearch}
                                  className="text-yellow-300 hover:text-white transition-colors ml-1 flex-shrink-0"
                                  title="Clear search"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {categoryFilter && (
                              <div className="flex items-center gap-1 bg-purple-500/20 text-purple-400 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border border-purple-500/30 max-w-full">
                                <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                                  Category: {categoryFilter}
                                </span>
                                <button
                                  onClick={clearCategory}
                                  className="text-purple-300 hover:text-white transition-colors ml-1 flex-shrink-0"
                                  title="Clear category filter"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {(dateRange.start || dateRange.end) && (
                              <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border border-blue-500/30 max-w-full">
                                <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                                  Range: {dateRange.start || "..."} to{" "}
                                  {dateRange.end || "..."}
                                </span>
                                <button
                                  onClick={clearDateRange}
                                  className="text-blue-300 hover:text-white transition-colors ml-1 flex-shrink-0"
                                  title="Clear date range"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {priceRangeFilter && (
                              <div className="flex items-center gap-1 bg-pink-500/20 text-pink-400 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border border-pink-500/30 max-w-full">
                                <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                                  Range: {priceRangeFilter.replace("_", " ")}
                                </span>
                                <button
                                  onClick={clearPriceRangeFilter}
                                  className="text-pink-300 hover:text-white transition-colors ml-1 flex-shrink-0"
                                  title="Clear price range filter"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {sortConfig.key !== "" && (
                              <div className="flex items-center gap-1 bg-gray-500/20 text-gray-400 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border border-gray-500/30 max-w-full">
                                <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                                  Sort: {sortConfig.key} (
                                  {sortConfig.direction === "asc" ? "↑" : "↓"})
                                </span>
                                <button
                                  onClick={() =>
                                    setSortConfig({ key: "", direction: "asc" })
                                  }
                                  className="text-gray-300 hover:text-white transition-colors ml-1 flex-shrink-0"
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

                {/* Table Section */}
                <section className="bg-gray-800/30 backdrop-blur-sm rounded-md xs:rounded-lg sm:rounded-xl lg:rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden custom-scrollbar">
                  {/* Ultra Small Screen - Compact Cards */}
                  <div className="hidden">
                    <div className="p-1.5 space-y-1.5">
                      {sortedSales.length === 0 ? (
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
                        paginatedSales.map(
                          (item: (typeof paginatedSales)[0], index: number) => (
                            <div
                              key={`${item.name}-${index}`}
                              className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 rounded p-1.5 border border-gray-700/30 fold-compact"
                            >
                              <div className="flex justify-between items-start gap-1 mb-1">
                                <span
                                  className="text-white font-semibold text-2xs truncate flex-1"
                                  title={item.name}
                                >
                                  {(item.name ?? "").substring(0, 12)}...
                                </span>
                                <span className="text-yellow-400 font-bold text-2xs">
                                  ₱{item.totalRevenue.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-2xs text-gray-400">
                                <span>Qty: {item.quantity}</span>
                                <span>₱{item.unitPrice}</span>
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>

                  {/* Extra Small Screen - Mobile Cards */}
                  <div className="hidden 2xs:block xs:hidden">
                    <div className="p-2 space-y-2">
                      {sortedSales.length === 0 ? (
                        <div className="text-center py-8">
                          <FaBoxes className="text-4xl text-gray-600 mx-auto mb-3" />
                          <h3 className="text-gray-400 font-medium mb-1 text-xs">
                            No sales data
                          </h3>
                          <p className="text-gray-500 text-2xs">
                            Try adjusting filters
                          </p>
                        </div>
                      ) : (
                        paginatedSales.map(
                          (item: (typeof paginatedSales)[0], index: number) => (
                            <div
                              key={`${item.name}-${index}`}
                              className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 rounded-lg p-2 border border-gray-700/30 xs-compact"
                            >
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <span
                                    className="text-white font-semibold text-xs truncate block"
                                    title={item.name}
                                  >
                                    {(item.name ?? "-").substring(0, 24)}
                                  </span>
                                  <span className="text-yellow-400 text-2xs">
                                    Sales Item
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 text-2xs">
                                <div className="bg-blue-500/10 rounded p-1.5">
                                  <p className="text-blue-400 mb-0.5">Qty</p>
                                  <p className="text-white font-bold">
                                    {item.quantity}
                                  </p>
                                </div>
                                <div className="bg-green-500/10 rounded p-1.5">
                                  <p className="text-green-400 mb-0.5">Total</p>
                                  <p className="text-white font-bold">
                                    ₱{item.totalRevenue.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>

                  {/* Small Screen and Above - Standard Mobile Cards */}
                  <div className="hidden xs:block md:hidden">
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
                          className="bg-gray-700/50 text-white rounded-md xs:rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 border border-gray-600/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-2xs xs:text-xs w-full xs:w-auto min-w-0 touch-target"
                        >
                          <option value="name-asc">Name (A-Z)</option>
                          <option value="name-desc">Name (Z-A)</option>
                          <option value="quantity-asc">Qty (Low-High)</option>
                          <option value="quantity-desc">Qty (High-Low)</option>
                          <option value="unitPrice-asc">
                            Price (Low-High)
                          </option>
                          <option value="unitPrice-desc">
                            Price (High-Low)
                          </option>
                          <option value="totalRevenue-asc">
                            Revenue (Low-High)
                          </option>
                          <option value="totalRevenue-desc">
                            Revenue (High-Low)
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="p-2 xs:p-3 space-y-2 xs:space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                      {sortedSales.length === 0 ? (
                        <div className="text-center py-8 xs:py-12">
                          <FaBoxes className="text-4xl xs:text-5xl text-gray-600 mx-auto mb-3 xs:mb-4" />
                          <h3 className="text-gray-400 font-medium mb-1 xs:mb-2 text-sm xs:text-base">
                            No sales data found
                          </h3>
                          <p className="text-gray-500 text-xs xs:text-sm">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      ) : (
                        paginatedSales.map(
                          (item: (typeof paginatedSales)[0], index: number) => (
                            <div
                              key={`${item.name}-${index}`}
                              className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-lg xs:rounded-xl p-2 xs:p-3 border border-gray-700/30 hover:border-yellow-500/30 transition-all duration-200 touch-manipulation responsive-card"
                            >
                              <div className="flex items-start justify-between mb-2 gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3
                                    className="text-white font-semibold text-xs xs:text-sm mb-1 truncate"
                                    title={item.name}
                                  >
                                    {item.name}
                                  </h3>
                                  <span className="px-1.5 py-0.5 bg-yellow-600/20 rounded text-2xs xs:text-xs font-medium text-yellow-300 whitespace-nowrap">
                                    Sales Item
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 xs:gap-3 mb-2">
                                <div className="bg-blue-500/10 rounded-md xs:rounded-lg p-1.5 xs:p-2 border border-blue-500/20">
                                  <p className="text-blue-400 text-2xs xs:text-xs font-medium mb-0.5 truncate">
                                    Quantity
                                  </p>
                                  <p className="text-white text-sm xs:text-base font-bold">
                                    {item.quantity}
                                  </p>
                                </div>
                                <div className="bg-green-500/10 rounded-md xs:rounded-lg p-1.5 xs:p-2 border border-green-500/20">
                                  <p className="text-green-400 mb-0.5 text-2xs xs:text-xs font-medium truncate">
                                    Total
                                  </p>
                                  <p className="text-white text-sm xs:text-base font-bold">
                                    ₱{item.totalRevenue.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>

                  {/* Desktop Table View - Large screens */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table
                      className={`table-auto w-full text-sm xl:text-base text-left border-collapse ${
                        viewMode === "detailed"
                          ? "min-w-[1400px]"
                          : "min-w-[700px]"
                      }`}
                    >
                      <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                        <tr>
                          {(viewMode === "detailed"
                            ? [
                                { key: "sale_date", label: "Date & Time" },
                                { key: "name", label: "Item Name" },
                                { key: "category", label: "Category" },
                                { key: "quantity", label: "Qty" },
                                { key: "price", label: "Unit Price" },
                                { key: "subtotal", label: "Subtotal" },
                                {
                                  key: "discount_percentage",
                                  label: "Discount %",
                                },
                                { key: "totalRevenue", label: "Final Amount" },
                                { key: "dine_type", label: "Dine Type" },
                                { key: "cashier", label: "Cashier" },
                              ]
                            : [
                                { key: "name", label: "Item Name" },
                                { key: "category", label: "Category" },
                                {
                                  key: "transactions",
                                  label: "# Transactions",
                                },
                                { key: "quantity", label: "Total Qty Sold" },
                                { key: "unitPrice", label: "Avg Unit Price" },
                                {
                                  key: "subtotal",
                                  label: "Total Before Discount",
                                },
                                {
                                  key: "discountAmount",
                                  label: "Total Discount",
                                },
                                { key: "avgDiscount", label: "Avg Discount %" },
                                { key: "totalRevenue", label: "Total Revenue" },
                              ]
                          ).map((col) => (
                            <th
                              key={col.key}
                              className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 text-left font-semibold whitespace-nowrap text-xs lg:text-sm xl:text-base text-gray-300 cursor-pointer select-none group hover:text-yellow-400 transition"
                              onClick={() =>
                                setSortConfig((prev) => ({
                                  key: col.key,
                                  direction:
                                    prev.key === col.key &&
                                    prev.direction === "asc"
                                      ? "desc"
                                      : "asc",
                                }))
                              }
                              aria-sort={
                                sortConfig.key === col.key
                                  ? sortConfig.direction === "asc"
                                    ? "ascending"
                                    : "descending"
                                  : undefined
                              }
                            >
                              <span className="flex items-center gap-1">
                                {col.label}
                                {sortConfig.key === col.key ? (
                                  sortConfig.direction === "asc" ? (
                                    <span className="text-yellow-400">▲</span>
                                  ) : (
                                    <span className="text-yellow-400">▼</span>
                                  )
                                ) : (
                                  <span className="text-gray-500 group-hover:text-yellow-300">
                                    ⇅
                                  </span>
                                )}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSales.length === 0 ? (
                          <tr>
                            <td
                              colSpan={viewMode === "detailed" ? 12 : 9}
                              className="px-3 lg:px-4 xl:px-6 py-8 lg:py-12 xl:py-16 text-center"
                            >
                              <div className="flex flex-col items-center gap-3 lg:gap-4">
                                <FaBoxes className="text-4xl lg:text-5xl xl:text-6xl text-gray-600" />
                                <div>
                                  <h3 className="text-gray-400 font-medium mb-1 lg:mb-2 text-sm lg:text-base">
                                    No sales data found
                                  </h3>
                                  <p className="text-gray-500 text-xs lg:text-sm">
                                    Try adjusting your search or filter criteria
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginatedSales.map(
                            (
                              item: (typeof paginatedSales)[0],
                              index: number
                            ) => (
                              <tr
                                key={`${item.name}-${index}`}
                                className={`group border-b border-gray-700/30 hover:bg-gradient-to-r hover:from-yellow-400/5 hover:to-yellow-500/5 transition-all duration-200 cursor-pointer ${
                                  index % 2 === 0
                                    ? "bg-gray-800/20"
                                    : "bg-gray-900/20"
                                }`}
                              >
                                {viewMode === "detailed" ? (
                                  <>
                                    {/* Detailed View - All transaction fields */}
                                    <td className="px-2 lg:px-3 py-3 whitespace-nowrap text-gray-400 text-xs">
                                      {item.sale_date || "-"}
                                    </td>

                                    <td className="px-2 lg:px-3 py-3 font-medium">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></div>
                                        <span
                                          className="text-white group-hover:text-yellow-400 transition-colors truncate text-xs"
                                          title={item.name}
                                        >
                                          {item.name ?? "-"}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-2 lg:px-3 py-3 whitespace-nowrap text-gray-400 text-xs">
                                      {item.category || "-"}
                                    </td>
                                    <td className="px-2 lg:px-3 py-3 whitespace-nowrap text-center">
                                      <span className="text-white font-semibold text-xs">
                                        {item.quantity}
                                      </span>
                                    </td>
                                    <td className="px-2 lg:px-3 py-3 whitespace-nowrap text-gray-300 text-xs">
                                      ₱{item.unitPrice?.toLocaleString() || 0}
                                    </td>
                                    <td className="px-2 lg:px-3 py-3 whitespace-nowrap text-gray-300 text-xs">
                                      ₱{item.subtotal?.toLocaleString() || 0}
                                    </td>
                                    <td className="px-2 lg:px-3 py-3 whitespace-nowrap text-center">
                                      {item.discount_percentage > 0 ? (
                                        <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs font-semibold border border-red-600/30">
                                          -{item.discount_percentage}%
                                        </span>
                                      ) : (
                                        <span className="text-gray-600 text-xs">
                                          -
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-2 lg:px-3 py-3 whitespace-nowrap">
                                      <span className="text-green-400 font-semibold text-xs">
                                        ₱
                                        {item.totalRevenue?.toLocaleString() ||
                                          0}
                                      </span>
                                    </td>
                                    <td className="px-2 lg:px-3 py-3 whitespace-nowrap text-xs">
                                      {item.dine_type ? (
                                        <span
                                          className={`px-2 py-1 rounded text-xs font-medium ${
                                            item.dine_type === "DINE-IN"
                                              ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                                              : item.dine_type === "TAKE-OUT"
                                              ? "bg-orange-600/20 text-orange-400 border border-orange-600/30"
                                              : "bg-purple-600/20 text-purple-400 border border-purple-600/30"
                                          }`}
                                        >
                                          {item.dine_type}
                                        </span>
                                      ) : (
                                        "-"
                                      )}
                                    </td>
                                    <td className="px-2 lg:px-3 py-3 whitespace-nowrap text-gray-400 text-xs">
                                      {item.cashier || "-"}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    {/* Summary View - Aggregated data */}
                                    <td className="px-3 lg:px-4 py-3 font-medium">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></div>
                                        <span
                                          className="text-white group-hover:text-yellow-400 transition-colors truncate text-sm"
                                          title={item.name}
                                        >
                                          {item.name ?? "-"}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-gray-400 text-sm">
                                      {item.category || "-"}
                                    </td>
                                    <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-center">
                                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-sm font-semibold border border-blue-600/30">
                                        {item.transactions}
                                      </span>
                                    </td>
                                    <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-center">
                                      <span className="text-white font-semibold text-sm">
                                        {item.quantity}
                                      </span>
                                    </td>
                                    <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-gray-300 text-sm">
                                      ₱
                                      {Number(
                                        item.unitPrice
                                      )?.toLocaleString() || 0}
                                    </td>
                                    <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-gray-300 text-sm">
                                      ₱{item.subtotal?.toLocaleString() || 0}
                                    </td>
                                    <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-red-400 text-sm font-semibold">
                                      -₱
                                      {item.discountAmount?.toLocaleString() ||
                                        0}
                                    </td>
                                    <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-center">
                                      {item.avgDiscount > 0 ? (
                                        <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-sm font-semibold border border-red-600/30">
                                          {item.avgDiscount}%
                                        </span>
                                      ) : (
                                        <span className="text-gray-600 text-sm">
                                          -
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                                      <span className="text-green-400 font-bold text-sm">
                                        ₱
                                        {item.totalRevenue?.toLocaleString() ||
                                          0}
                                      </span>
                                    </td>
                                  </>
                                )}
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>

                    {/* Pagination for Desktop View */}
                    {sortedSales.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={totalItems}
                        onItemsPerPageChange={setItemsPerPage}
                      />
                    )}
                  </div>

                  {/* Tablet Table View - Medium screens */}
                  <div className="hidden md:block lg:hidden overflow-x-auto">
                    <table className="table-auto w-full text-sm text-left border-collapse min-w-[600px]">
                      <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                        <tr>
                          {[
                            { key: "name", label: "Item" },
                            { key: "category", label: "Category" },
                            { key: "quantity", label: "Qty" },
                            { key: "totalRevenue", label: "Revenue" },
                          ].map((col) => (
                            <th
                              key={col.key}
                              onClick={() => requestSort(col.key)}
                              className="px-3 py-3 text-left font-semibold cursor-pointer select-none whitespace-nowrap text-sm transition-colors text-gray-300 hover:text-yellow-400 no-select touch-target"
                              scope="col"
                              tabIndex={0}
                              aria-label={`Sort by ${col.label}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{col.label}</span>
                                {sortConfig.key === col.key && (
                                  <span className="text-yellow-400 flex-shrink-0">
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
                        {sortedSales.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-8 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <FaBoxes className="text-4xl text-gray-600" />
                                <div>
                                  <h3 className="text-gray-400 font-medium mb-1 text-sm">
                                    No sales data found
                                  </h3>
                                  <p className="text-gray-500 text-xs">
                                    Try adjusting your search or filter criteria
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginatedSales.map(
                            (
                              item: (typeof paginatedSales)[0],
                              index: number
                            ) => (
                              <tr
                                key={`${item.name}-${index}`}
                                className={`group border-b border-gray-700/30 hover:bg-gradient-to-r hover:from-yellow-400/5 hover:to-yellow-500/5 transition-all duration-200 cursor-pointer ${
                                  index % 2 === 0
                                    ? "bg-gray-800/20"
                                    : "bg-gray-900/20"
                                }`}
                              >
                                <td className="px-3 py-3 font-medium">
                                  <div className="flex flex-col gap-1">
                                    <span
                                      className="text-white group-hover:text-yellow-400 transition-colors text-sm font-semibold truncate"
                                      title={item.name}
                                    >
                                      {item.name ?? "-"}
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                      ₱{item.unitPrice} each
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-gray-400 text-xs text-center">
                                  {item.category || "-"}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-center">
                                  <span className="text-white font-semibold text-base">
                                    {item.quantity}
                                  </span>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-right">
                                  <span className="text-green-400 font-semibold text-base">
                                    ₱{item.totalRevenue.toLocaleString()}
                                  </span>
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>

                    {/* Pagination for Tablet View */}
                    {sortedSales.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={totalItems}
                        onItemsPerPageChange={setItemsPerPage}
                      />
                    )}
                  </div>
                </section>
                <div className="md:hidden">
                  {/* Mobile Sort Controls */}
                  <div className="p-3 xs:p-4 border-b border-gray-700/30 bg-gray-800/50">
                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3">
                      <span className="text-gray-300 text-xs xs:text-sm font-medium flex-shrink-0">
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
                        className="bg-gray-700/50 text-white rounded-md xs:rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 border border-gray-600/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-xs xs:text-sm w-full xs:w-auto min-w-0 xs:min-w-[160px]"
                      >
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="quantity-asc">
                          Quantity (Low-High)
                        </option>
                        <option value="quantity-desc">
                          Quantity (High-Low)
                        </option>
                        <option value="unitPrice-asc">Price (Low-High)</option>
                        <option value="unitPrice-desc">Price (High-Low)</option>
                        <option value="totalRevenue-asc">
                          Revenue (Low-High)
                        </option>
                        <option value="totalRevenue-desc">
                          Revenue (High-Low)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="p-2 xs:p-3 sm:p-4 space-y-2 xs:space-y-3 sm:space-y-4">
                    {sortedSales.length === 0 ? (
                      <div className="text-center py-8 xs:py-10 sm:py-12">
                        <FaBoxes className="text-4xl xs:text-5xl sm:text-6xl text-gray-600 mx-auto mb-3 xs:mb-4" />
                        <h3 className="text-gray-400 font-medium mb-1 xs:mb-2 text-sm xs:text-base">
                          No sales data found
                        </h3>
                        <p className="text-gray-500 text-xs xs:text-sm">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    ) : (
                      sortedSales.map(
                        (item: (typeof sortedSales)[0], index: number) => (
                          <div
                            key={`${item.name}-${index}`}
                            className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-lg xs:rounded-xl p-3 xs:p-4 border border-gray-700/30 hover:border-yellow-500/30 transition-all duration-200 touch-manipulation"
                          >
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-2 xs:mb-3 gap-2">
                              <div className="flex-1 min-w-0">
                                <h3
                                  className="text-white font-semibold text-sm xs:text-base mb-1 truncate"
                                  title={item.name}
                                >
                                  {(item.name ?? "-").substring(0, 24)}
                                </h3>
                                <div className="flex flex-wrap gap-1 xs:gap-1.5 mb-1 xs:mb-2">
                                  <span className="px-1.5 xs:px-2 py-0.5 xs:py-1 bg-yellow-600/20 rounded text-xs font-medium text-yellow-300 whitespace-nowrap">
                                    Sales Item
                                  </span>
                                  {item.category && (
                                    <span className="px-1.5 xs:px-2 py-0.5 xs:py-1 bg-blue-600/20 rounded text-xs font-medium text-blue-300 whitespace-nowrap">
                                      {item.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Card Stats */}
                            <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 mb-2 xs:mb-3">
                              <div className="bg-blue-500/10 rounded-md xs:rounded-lg p-2 xs:p-3 border border-blue-500/20">
                                <p className="text-blue-400 text-xs font-medium mb-0.5 xs:mb-1 truncate">
                                  Quantity Sold
                                </p>
                                <p className="text-white text-base xs:text-lg font-bold">
                                  {item.quantity}
                                </p>
                              </div>
                              <div className="bg-yellow-500/10 rounded-md xs:rounded-lg p-2 xs:p-3 border border-yellow-500/20">
                                <p className="text-yellow-400 text-xs font-medium mb-0.5 xs:mb-1 truncate">
                                  Price
                                </p>
                                <p className="text-white text-base xs:text-lg font-bold">
                                  ₱{item.unitPrice}
                                </p>
                              </div>
                            </div>

                            {/* Category (if not in header) for extra visibility on mobile */}
                            {!item.category && (
                              <div className="bg-blue-500/10 rounded-md xs:rounded-lg p-2 xs:p-3 border border-blue-500/20 mb-2 xs:mb-3">
                                <p className="text-blue-400 text-xs font-medium mb-0.5 xs:mb-1 truncate">
                                  Category
                                </p>
                                <p className="text-white text-base xs:text-lg font-bold">
                                  -
                                </p>
                              </div>
                            )}

                            {/* Total Sales */}
                            <div className="bg-green-500/10 rounded-md xs:rounded-lg p-2 xs:p-3 border border-green-500/20">
                              <p className="text-green-400 text-xs font-medium mb-0.5 xs:mb-1 truncate">
                                Total Sales
                              </p>
                              <p className="text-white text-lg xs:text-xl font-bold">
                                ₱{item.totalRevenue.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                      {/* Page Info */}
                      <div className="text-sm text-gray-400">
                        Page{" "}
                        <span className="text-white font-semibold">
                          {currentPage}
                        </span>{" "}
                        of{" "}
                        <span className="text-white font-semibold">
                          {totalPages}
                        </span>
                      </div>

                      {/* Pagination Buttons */}
                      <div className="flex items-center gap-2">
                        {/* First Page */}
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          title="First Page"
                        >
                          &#171;
                        </button>

                        {/* Previous Page */}
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                          disabled={currentPage === 1}
                          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          title="Previous Page"
                        >
                          &#8249;
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`px-3 py-2 rounded-lg border transition-all ${
                                    currentPage === pageNum
                                      ? "bg-yellow-500 border-yellow-500 text-black font-semibold"
                                      : "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            }
                          )}
                        </div>

                        {/* Next Page */}
                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          title="Next Page"
                        >
                          &#8250;
                        </button>

                        {/* Last Page */}
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          title="Last Page"
                        >
                          &#187;
                        </button>
                      </div>

                      {/* Jump to Page */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400">Go to:</label>
                        <input
                          type="number"
                          min={1}
                          max={totalPages}
                          value={currentPage}
                          onChange={(e) => {
                            const page = Number(e.target.value);
                            if (page >= 1 && page <= totalPages) {
                              setCurrentPage(page);
                            }
                          }}
                          className="w-16 px-2 py-1.5 bg-gray-800 border border-gray-600 text-white rounded-lg text-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Enhanced Export Modal */}
              {showPopup && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 xs:p-3 sm:p-4">
                  <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-3 xs:p-4 sm:p-6 md:p-8 rounded-xl xs:rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-6 max-w-[90vw] xs:max-w-xs sm:max-w-sm md:max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-center mb-2 xs:mb-3 sm:mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl"></div>
                        <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-2 xs:p-2.5 sm:p-3 md:p-4 rounded-full">
                          <FaDownload className="text-black text-lg xs:text-xl sm:text-2xl md:text-3xl" />
                        </div>
                      </div>
                    </div>

                    <h3 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins leading-tight">
                      Export Sales Report
                    </h3>
                    <p className="text-gray-300 text-xs xs:text-xs sm:text-sm md:text-base px-2 xs:px-0">
                      Download your sales analytics report in your preferred
                      format
                    </p>

                    {/* Export Statistics */}
                    <div className="bg-gray-800/30 rounded-md xs:rounded-lg p-2 xs:p-3 text-left">
                      <div className="text-xs text-gray-400 mb-1 xs:mb-2">
                        Report Summary:
                      </div>
                      <div className="grid grid-cols-2 gap-1 xs:gap-2 text-xs xs:text-xs sm:text-sm">
                        <div className="text-gray-300 truncate">
                          <span className="text-yellow-400 font-semibold">
                            {sortedSales.length}
                          </span>{" "}
                          items
                        </div>
                        <div className="text-gray-300 truncate">
                          <span className="text-green-400 font-semibold">
                            ₱
                            {sortedSales
                              .reduce(
                                (sum: number, item: (typeof groupedSales)[0]) =>
                                  sum + item.totalRevenue,
                                0
                              )
                              .toLocaleString()}
                          </span>{" "}
                          revenue
                        </div>
                        <div className="text-gray-300 truncate">
                          <span className="text-blue-400 font-semibold">
                            {sortedSales
                              .reduce(
                                (sum: number, item: (typeof groupedSales)[0]) =>
                                  sum + item.quantity,
                                0
                              )
                              .toLocaleString()}
                          </span>{" "}
                          sold
                        </div>
                        <div className="text-gray-300 truncate">
                          <span className="text-purple-400 font-semibold">
                            ₱
                            {sortedSales.length > 0
                              ? (
                                  sortedSales.reduce(
                                    (
                                      sum: number,
                                      item: (typeof groupedSales)[0]
                                    ) => sum + Number(item.unitPrice),
                                    0
                                  ) / sortedSales.length
                                ).toFixed(2)
                              : "0.00"}
                          </span>{" "}
                          avg price
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 xs:space-y-3 sm:space-y-4 pt-1 xs:pt-2">
                      <button
                        onClick={() => handleExportChoice("excel")}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-semibold px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-1.5 xs:gap-2 text-xs xs:text-sm sm:text-base min-h-[40px] xs:min-h-[44px] touch-manipulation"
                        type="button"
                      >
                        <span className="text-sm xs:text-base sm:text-lg">
                          📊
                        </span>
                        <span className="truncate">
                          Export to Excel (.xlsx)
                        </span>
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
                        onClick={() => setExportSuccess(false)}
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
                        Please wait while we process your request. This may take
                        a few moments.
                      </p>
                    </div>
                  </form>
                </div>
              )}

              {importModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-100 p-4 animate-fadeIn">
                  <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl p-6 sm:p-8 max-w-6xl w-full shadow-2xl relative border border-gray-700/50 animate-slideUp max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header with gradient accent */}
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                          <BiImport className="text-white text-2xl" />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-white">
                            Import Sales Data
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                            Upload and preview your Excel data
                          </p>
                        </div>
                      </div>
                      <button
                        className="text-gray-400 hover:text-white hover:bg-gray-800 transition rounded-lg p-2"
                        onClick={() => {
                          setImportModalOpen(false);
                          setImportedRows([]);
                          setImportFile(null);
                        }}
                        title="Close"
                      >
                        <svg
                          className="w-6 h-6"
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
                      </button>
                    </div>

                    {/* Scrollable content area */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {/* File Upload - Enhanced UX with better visuals */}
                      <div
                        className={`mb-6 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 relative group ${
                          importFile
                            ? "border-green-500/50 bg-green-900/10"
                            : "border-gray-600 hover:border-yellow-500 bg-gray-800/30 hover:bg-gray-800/50"
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add(
                            "border-yellow-500",
                            "bg-yellow-900/20"
                          );
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove(
                            "border-yellow-500",
                            "bg-yellow-900/20"
                          );
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove(
                            "border-yellow-500",
                            "bg-yellow-900/20"
                          );
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            fileInputRef.current!.files = e.dataTransfer.files;
                            handleFileChange({
                              target: { files: e.dataTransfer.files },
                            } as React.ChangeEvent<HTMLInputElement>);
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileChange}
                          id="fileUpload"
                        />
                        {!importFile ? (
                          <label
                            htmlFor="fileUpload"
                            className="cursor-pointer flex flex-col items-center w-full"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ")
                                handleImportClick();
                            }}
                          >
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                              <FiUpload className="text-3xl text-white" />
                            </div>
                            <span className="text-gray-300 text-base sm:text-lg mb-2">
                              <span className="font-bold text-yellow-500 group-hover:text-yellow-400 transition">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500">
                              Excel files only (.xlsx, .xls)
                            </span>
                            <span className="text-xs text-gray-600 mt-2">
                              Maximum file size: 10MB
                            </span>
                          </label>
                        ) : (
                          <div className="flex items-center gap-4 w-full">
                            <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-6 h-6 text-white"
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
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-white font-semibold text-sm sm:text-base truncate">
                                {importFile.name}
                              </p>
                              <p className="text-gray-400 text-xs sm:text-sm">
                                {(importFile.size / 1024).toFixed(2)} KB
                                {importedRows.length > 0 &&
                                  ` • ${importedRows.length} rows detected`}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setImportFile(null);
                                setImportedRows([]);
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                              }}
                              className="flex-shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-900/20 transition rounded-lg p-2"
                              title="Remove file"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Data Preview Section with enhanced styling */}
                      {importedRows.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                  />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-white font-bold text-base sm:text-lg">
                                  Data Preview
                                </h4>
                                <p className="text-gray-400 text-xs sm:text-sm">
                                  Review your data before importing
                                </p>
                              </div>
                            </div>
                            <div className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                              <p className="text-blue-400 text-xs sm:text-sm font-semibold">
                                {importedRows.length}{" "}
                                {importedRows.length === 1 ? "row" : "rows"}
                              </p>
                            </div>
                          </div>

                          {/* Info banner */}
                          <div className="mb-4 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg flex items-start gap-3">
                            <svg
                              className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
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
                              <p className="text-blue-300 text-xs sm:text-sm">
                                <span className="font-semibold">
                                  Preview Mode:
                                </span>{" "}
                                This is a read-only preview of your data. Click{" "}
                                <span className="font-semibold">
                                  "Import to System"
                                </span>{" "}
                                to add these records to your database.
                              </p>
                            </div>
                          </div>

                          <div className="overflow-x-auto max-h-[35vh] rounded-lg border border-gray-700/50 shadow-lg">
                            <table className="min-w-full text-xs sm:text-sm text-left border-collapse">
                              <thead className="sticky top-0 z-10">
                                <tr className="bg-gradient-to-r from-gray-800 to-gray-900">
                                  {Object.keys(importedRows[0] || {}).map(
                                    (col) => (
                                      <th
                                        key={col}
                                        className="px-3 py-3 sm:px-4 sm:py-3 font-bold text-yellow-400 whitespace-nowrap border-b border-gray-700"
                                      >
                                        {col}
                                      </th>
                                    )
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {importedRows.map((row, idx) => (
                                  <tr
                                    key={idx}
                                    className={`border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors ${
                                      idx % 2 === 0
                                        ? "bg-gray-900/50"
                                        : "bg-gray-800/20"
                                    }`}
                                  >
                                    {Object.keys(row).map((col) => (
                                      <td
                                        key={col}
                                        className="px-3 py-3 sm:px-4 sm:py-3 text-gray-200 whitespace-nowrap"
                                      >
                                        {row[col]}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Empty state when no file is selected */}
                      {!importFile && importedRows.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <svg
                            className="w-16 h-16 mx-auto mb-4 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-sm">No file uploaded yet</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Upload an Excel file to preview your data
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions - Sticky at bottom */}
                    <div className="border-t border-gray-700/50 pt-4 mt-4 space-y-4">
                      {/* Auto-deduction Info - Always active */}
                      {importedRows.length > 0 && (
                        <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                          <div className="flex items-start gap-3">
                            <svg
                              className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
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
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-xs sm:text-sm">
                                Auto-deduction enabled
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                Today's sales will automatically deduct from inventory. Historical sales will be skipped.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Buttons row */}
                      <div className="flex flex-wrap justify-between items-center gap-3">
                      <div className="text-xs sm:text-sm text-gray-400">
                        {importedRows.length > 0 ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-green-500"
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
                            Ready to import {importedRows.length}{" "}
                            {importedRows.length === 1 ? "record" : "records"}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-600"
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
                            No data to import
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        <button
                          className="bg-gray-700 hover:bg-gray-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium transition-all hover:shadow-lg flex items-center gap-2"
                          onClick={() => {
                            setImportModalOpen(false);
                            setImportedRows([]);
                            setImportFile(null);
                          }}
                        >
                          <svg
                            className="w-4 h-4"
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
                          Cancel
                        </button>
                        <button
                          disabled={
                            importedRows.length === 0 ||
                            importMutation.isPending
                          }
                          onClick={async () => {
                            console.log("[DEBUG] Import mutation params:", {
                              rows: importedRows.length,
                              auto_deduct: autoDeduct,
                            });
                            importMutation.mutate(
                              { rows: importedRows, auto_deduct: autoDeduct },
                              {
                                onSuccess: () => {
                                  setImportModalOpen(false);
                                  setImportedRows([]);
                                  setImportFile(null);
                                  setImportSuccess(true);
                                },
                                onError: (error) => {
                                  console.error("Import failed:", error);
                                },
                              }
                            );
                          }}
                          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 min-w-[180px] ${
                            importedRows.length === 0 ||
                            importMutation.isPending
                              ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
                              : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white hover:shadow-xl hover:scale-105"
                          }`}
                        >
                          {importMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Importing...</span>
                            </>
                          ) : (
                            <>
                              <BiImport className="text-lg" />
                              <span>Import to System</span>
                            </>
                          )}
                        </button>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {importSuccess && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
                  <div className="flex items-center gap-2 xs:gap-3">
                    <MdCheckCircle className="text-white text-4xl mb-4 mx-auto" />
                    <h3 className="text-lg font-bold text-white mb-2">
                      Import Successful!
                    </h3>
                    <p className="text-white mb-4">
                      Your sales data has been imported successfully.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </ResponsiveMain>
      </section>
    </GoogleOAuthProvider>
  );
}
