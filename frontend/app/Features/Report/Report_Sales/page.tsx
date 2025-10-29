"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { isOnline } from "@/app/utils/offlineUtils";
import OfflineDataBanner from "@/app/components/OfflineDataBanner";
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
} from "react-icons/fa";
import { MdCheckCircle, MdTrendingUp, MdInsights } from "react-icons/md";
import { BiImport, BiExport } from "react-icons/bi";
import { FiBarChart, FiUpload } from "react-icons/fi";
import { TbReportAnalytics } from "react-icons/tb";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useSimpleSalesReport } from "./hooks/useSimpleSalesReport";
import { useSalesAnalytics } from "../../Dashboard/hook/useSalesPrediction";
import NavigationBar from "@/app/components/navigation/navigation";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { saveAs } from "file-saver";
import { supabase } from "@/app/utils/Server/supabaseClient";
import { useComprehensiveAnalytics } from "./hooks/useComprehensiveAnalytics";
import {
  FaDollarSign,
  FaExclamationTriangle,
  FaTrophy,
  FaLayerGroup,
} from "react-icons/fa";
import { MdTrendingDown } from "react-icons/md";

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
  const [period, setPeriod] = useState("today");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceRangeFilter, setPriceRangeFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "asc" as "asc" | "desc",
  });
  const [offlineData, setOfflineData] = useState<any>(null);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  // Comprehensive Analytics date range (last 30 days by default)
  const [analyticsStartDate, setAnalyticsStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [analyticsEndDate, setAnalyticsEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Fetch comprehensive analytics
  const {
    analytics,
    loading: analyticsLoading,
    error: analyticsError,
  } = useComprehensiveAnalytics(analyticsStartDate, analyticsEndDate);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Use the sales report hook
  const {
    data: reportData,
    loading: isLoading,
    error,
    fetchReportData,
    fetchTodayReport,
    fetchWeekReport,
    fetchMonthReport,
    importSalesData,
  } = useSimpleSalesReport();

  // Offline/online detection and fallback logic
  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
      setOfflineError(null);
    }
    function handleOffline() {
      setIsOffline(true);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!isOnline());
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch report data on mount and when period changes
  useEffect(() => {
    if (!isOffline) {
      // Online: fetch and cache
      let fetchPromise;
      if (period === "today") fetchPromise = fetchTodayReport();
      else if (period === "week") fetchPromise = fetchWeekReport();
      else if (period === "month") fetchPromise = fetchMonthReport();
      else fetchPromise = fetchReportData();
      fetchPromise.then((data) => {
        try {
          localStorage.setItem("salesReportCache", JSON.stringify(data));
        } catch {}
        setOfflineData(null);
        setOfflineError(null);
      });
    } else {
      // Offline: try to load from cache
      try {
        const cached = localStorage.getItem("salesReportCache");
        if (cached) {
          setOfflineData(JSON.parse(cached));
          setOfflineError(null);
        } else {
          setOfflineData(null);
          setOfflineError(
            "No cached sales report data available. Please connect to the internet to load report."
          );
        }
      } catch {
        setOfflineData(null);
        setOfflineError("Failed to load cached sales report data.");
      }
    }
  }, [
    period,
    isOffline,
    fetchTodayReport,
    fetchWeekReport,
    fetchMonthReport,
    fetchReportData,
  ]);

  // ...existing code...

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
    return historicalData.top_performers.by_total_sales
      .filter((item: any) => item.total_sales > 0)
      .sort((a: any, b: any) => b.total_sales - a.total_sales)
      .slice(0, topItemsCount)
      .map((item: any, idx: number) => ({
        name: item.item,
        quantity: item.total_sales,
        unitPrice: "-",
        totalSales: "-",
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
    console.log("[ReportSales] error:", error);
  }, [reportData, error]);

  const categories = [
    "Rice Toppings",
    "Sizzlers",
    "Dessert",
    "Soups & Noodles",
    "Desserts",
    "Soup",
    "Beverages",
    "Extras",
  ];

  useEffect(() => {
    const channel = supabase
      .channel("order_items_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        (payload) => {
          // Refresh sales data on any insert/update/delete
          if (period === "today") {
            fetchTodayReport();
          } else if (period === "week") {
            fetchWeekReport();
          } else if (period === "month") {
            fetchMonthReport();
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    period,
    fetchTodayReport,
    fetchWeekReport,
    fetchMonthReport,
    fetchReportData,
  ]);

  // Handler for search input Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchQuery(pendingSearch);
    }
  };

  // Helper functions
  const handleClear = useCallback(() => {
    setSearchQuery("");
    setCategoryFilter("");
    setPeriod("today");
    setPriceRangeFilter("");
    setSortConfig({ key: "", direction: "asc" });
  }, []);

  const clearSearch = useCallback(() => setSearchQuery(""), []);
  const clearCategory = useCallback(() => setCategoryFilter(""), []);
  const clearPeriod = useCallback(() => setPeriod("today"), []);
  const clearPriceRangeFilter = useCallback(() => setPriceRangeFilter(""), []);

  const requestSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  // Choose the correct report data source (online or offline)
  const effectiveReportData =
    isOffline && offlineData ? offlineData : reportData;

  // Convert hook data to the format expected by the component
  const salesData = useMemo(() => {
    if (!effectiveReportData) return [];
    return (
      effectiveReportData.topItems?.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: (item.revenue / item.quantity).toFixed(2),
        totalRevenue: item.revenue,
        category: item.category || "",
        report_date: "",
      })) || []
    );
  }, [effectiveReportData]);

  // Filter helpers
  const filterByCategory = (item: any, category: string) => {
    if (!category) return true;
    return item.category === category;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      setImportedRows(rows);
      setImportModalOpen(true);
    };
    reader.readAsBinaryString(file);
  };

  const filterByPeriod = (item: any, period: string) => {
    if (!period || period === "all" || period === "all_time") return true;
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
      return (
        itemDate.getFullYear() === today.getFullYear() &&
        itemDate.getMonth() === today.getMonth()
      );
    }
    return true;
  };

  const filteredSales = useMemo(() => {
    return salesData.filter((item: any) => {
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

      // Period filter
      const matchesPeriod = filterByPeriod(item, period);

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
      if (dateRange.start && dateRange.end && item.report_date) {
        const itemDate = new Date(item.report_date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        matchesDateRange = itemDate >= startDate && itemDate <= endDate;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPeriod &&
        matchesPriceRangeFilter &&
        matchesDateRange
      );
    });
  }, [
    salesData,
    searchQuery,
    categoryFilter,
    period,
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
  }, [
    searchQuery,
    categoryFilter,
    period,
    priceRangeFilter,
    sortConfig,
  ]);

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
    const workbook = new ExcelJS.Workbook();

    // Main sales worksheet
    const salesWorksheet = workbook.addWorksheet("Sales Report");
    salesWorksheet.addRows(values);

    // Style the header row
    const salesHeaderRow = salesWorksheet.getRow(1);
    salesHeaderRow.font = { bold: true };
    salesHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6FA" },
    };

    // Forecast worksheet
    const forecastWorksheet = workbook.addWorksheet("Sales Forecast");
    forecastWorksheet.addRows(forecastTable);

    // Style the forecast header row
    const forecastHeaderRow = forecastWorksheet.getRow(1);
    forecastHeaderRow.font = { bold: true };
    forecastHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFCC99" },
    };

    // Auto-fit columns for both sheets
    [salesWorksheet, forecastWorksheet].forEach((worksheet) => {
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });
    });

    // Generate buffer and save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Sales_Report_${getFormattedDate()}.xlsx`);
    setExportSuccess(true);
    setShowPopup(false);
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
                </header>

                {/* Unified Sales Summary */}
                <section className="my-6">
                  {analyticsLoading ? (
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

                      {/* Top Performers & Category Breakdown */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Performers */}
                        <div className="bg-gradient-to-br from-black/80 to-slate-900 rounded-xl shadow p-6 border border-gray-700">
                          <h4 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                            <FaTrophy className="text-yellow-400" />
                            Top Performers
                          </h4>
                          {analytics.top_performers.length > 0 ? (
                            <div className="space-y-3">
                              {analytics.top_performers
                                .slice(0, 5)
                                .map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-3 bg-gray-800/30 rounded-lg p-3"
                                  >
                                    <div
                                      className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                        idx === 0
                                          ? "bg-yellow-400 text-black"
                                          : idx === 1
                                          ? "bg-gray-300 text-black"
                                          : idx === 2
                                          ? "bg-orange-400 text-black"
                                          : "bg-gray-700 text-gray-300"
                                      }`}
                                    >
                                      {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-white font-semibold">
                                        {item.item_name}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {item.category}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-green-400 font-semibold">
                                        ₱{item.total_revenue.toLocaleString()}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {item.total_quantity_sold} sold
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

                        {/* Category Breakdown */}
                        <div className="bg-gradient-to-br from-black/80 to-slate-900 rounded-xl shadow p-6 border border-gray-700">
                          <h4 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                            <FaLayerGroup className="text-yellow-400" />
                            Category Performance
                          </h4>
                          {analytics.category_breakdown.length > 0 ? (
                            <div className="space-y-3">
                              {analytics.category_breakdown.map((cat, idx) => (
                                <div
                                  key={idx}
                                  className="bg-gray-800/30 rounded-lg p-3"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-white font-semibold">
                                      {cat.category}
                                    </span>
                                    <span className="text-green-400 font-semibold">
                                      ₱{cat.total_revenue.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                                    <span>
                                      {cat.total_quantity} items •{" "}
                                      {cat.unique_items} unique
                                    </span>
                                    <span>
                                      {cat.revenue_percentage.toFixed(1)}% of
                                      total
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                                    <div
                                      className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-1.5 rounded-full"
                                      style={{
                                        width: `${cat.revenue_percentage}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-gray-400 py-4">
                              <p>No category data available</p>
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

                      {/* Summary Statistics */}
                      <div className="bg-gradient-to-br from-black/80 to-slate-900 rounded-xl shadow p-6 border border-gray-700">
                        <h4 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                          <MdInsights className="text-yellow-400" />
                          Period Summary
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                              {analytics.summary.total_transactions}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Total Transactions
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                              ₱{analytics.summary.avg_unit_price.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Avg Unit Price
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                              {analytics.summary.unique_items_sold}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Unique Items
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                              {analytics.loss_analysis.unique_items_spoiled}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Items Spoiled
                            </div>
                          </div>
                        </div>
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

                {/* Divider */}
                <div className="relative mb-2 xs:mb-3 sm:mb-4 lg:mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-black px-1.5 xs:px-2 sm:px-3 lg:px-4 text-yellow-400/70 text-2xs xs:text-xs sm:text-sm flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                      <FaChartLine className="text-2xs xs:text-xs sm:text-sm flex-shrink-0" />
                      <span className="truncate">Analytics & Filtering</span>
                    </span>
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
                      className="w-full bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400 rounded-md xs:rounded-lg sm:rounded-xl px-6 xs:px-8 sm:px-12 py-2 xs:py-2.5 sm:py-3 lg:py-4 shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-400/50 border border-gray-600/50 hover:border-gray-500 transition-all text-2xs xs:text-xs sm:text-sm md:text-base custom-scrollbar touch-target"
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
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 mb-4">
                      <div>
                        <label className="flex items-center gap-1.5 xs:gap-2 text-gray-300 text-xs xs:text-xs sm:text-sm font-medium mb-1.5 xs:mb-2">
                          <FaBoxes className="text-yellow-400 text-xs flex-shrink-0" />
                          <span className="truncate">Category Filter</span>
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
                        <label className="flex items-center gap-1.5 xs:gap-2 text-gray-300 text-xs xs:text-xs sm:text-sm font-medium mb-1.5 xs:mb-2">
                          <FaChartLine className="text-yellow-400 text-xs flex-shrink-0" />
                          <span className="truncate">Time Period</span>
                        </label>
                        <select
                          value={period}
                          onChange={(e) => setPeriod(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-2 xs:px-3 py-2 xs:py-2.5 sm:py-3 border border-gray-600/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 cursor-pointer text-xs xs:text-sm transition-all"
                        >
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                          <option value="all_time">All Time</option>
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

                      <div>
                        <label className="block text-xs xs:text-sm text-gray-300 mb-1 xs:mb-2 font-medium">
                          Date Range
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) =>
                              setDateRange((prev) => ({
                                ...prev,
                                start: e.target.value,
                              }))
                            }
                            className="bg-gray-700/50 text-white rounded-md px-2 py-2 border border-gray-600/50 focus:border-yellow-400"
                          />
                          <span className="text-gray-400">to</span>
                          <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) =>
                              setDateRange((prev) => ({
                                ...prev,
                                end: e.target.value,
                              }))
                            }
                            className="bg-gray-700/50 text-white rounded-md px-2 py-2 border border-gray-600/50 focus:border-yellow-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Clear All Button inside filter controls */}
                    {(searchQuery ||
                      categoryFilter ||
                      priceRangeFilter ||
                      period !== "today" ||
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
                        period === "today" &&
                        sortConfig.key === "" ? (
                          <span className="text-gray-500 italic">None</span>
                        ) : (
                          <>
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
                            {period !== "today" && (
                              <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border border-blue-500/30 max-w-full">
                                <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                                  Period: {period}
                                </span>
                                <button
                                  onClick={clearPeriod}
                                  className="text-blue-300 hover:text-white transition-colors ml-1 flex-shrink-0"
                                  title="Clear period filter"
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
                                  {item.name.substring(0, 12)}...
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
                                    {item.name}
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

                  {/* Results Summary */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 px-2">
                    <div className="text-sm text-gray-400">
                      Showing{" "}
                      <span className="text-white font-semibold">
                        {startIndex + 1}
                      </span>{" "}
                      to{" "}
                      <span className="text-white font-semibold">
                        {Math.min(endIndex, totalItems)}
                      </span>{" "}
                      of{" "}
                      <span className="text-white font-semibold">
                        {totalItems}
                      </span>{" "}
                      results
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-400">Show:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-1.5 text-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-sm text-gray-400">per page</span>
                    </div>
                  </div>

                  {/* Desktop Table View - Large screens */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="table-auto w-full text-sm xl:text-base text-left border-collapse min-w-[700px]">
                      <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                        <tr>
                          {[
                            { key: "name", label: "Item Name" },
                            { key: "category", label: "Category" },
                            { key: "quantity", label: "Quantity Sold" },
                            { key: "unitPrice", label: "Unit Price" },
                            { key: "totalRevenue", label: "Total Sales" },
                          ].map((col) => (
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
                              colSpan={5}
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
                                <td className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 font-medium">
                                  <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></div>
                                    <span
                                      className="text-white group-hover:text-yellow-400 transition-colors truncate text-xs lg:text-sm xl:text-base"
                                      title={item.name}
                                    >
                                      {item.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 whitespace-nowrap text-gray-400 text-xs lg:text-sm xl:text-base">
                                  {item.category || "-"}
                                </td>
                                <td className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 whitespace-nowrap">
                                  <span className="text-white font-semibold text-sm lg:text-base xl:text-lg">
                                    {item.quantity}
                                  </span>
                                </td>
                                <td className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 whitespace-nowrap text-gray-300 text-xs lg:text-sm xl:text-base">
                                  ₱ {item.unitPrice}
                                </td>
                                <td className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 whitespace-nowrap">
                                  <span className="text-green-400 font-semibold text-sm lg:text-base xl:text-lg">
                                    ₱ {item.totalRevenue.toLocaleString()}
                                  </span>
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>
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
                                      {item.name}
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
                                  {item.name}
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
                                  Unit Price
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
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-100">
                  <div className="bg-black rounded-2xl p-6 max-w-5xl w-full shadow-2xl relative">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                        <BiImport className="text-yellow-500 text-2xl" />
                        Import Sales Data
                      </h3>
                      <button
                        className="text-gray-500 hover:text-black transition"
                        onClick={() => {
                          setImportModalOpen(false);
                          setImportedRows([]);
                          setImportFile(null);
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* File Upload - Enhanced UX */}
                    <div
                      className="mb-4 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-yellow-500 transition relative group"
                      onClick={handleImportClick}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
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
                      <label
                        htmlFor="fileUpload"
                        className="cursor-pointer text-gray-600 hover:text-yellow-600 font-medium flex flex-col items-center"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            handleImportClick();
                        }}
                      >
                        <FiUpload className="text-2xl mb-2 text-yellow-500 group-hover:text-yellow-600 transition" />
                        <span>
                          <span className="font-semibold text-yellow-600 group-hover:text-yellow-700 transition">
                            Click
                          </span>{" "}
                          or{" "}
                          <span className="font-semibold text-yellow-600 group-hover:text-yellow-700 transition">
                            drag & drop
                          </span>{" "}
                          your Excel file here
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          Supported: .xlsx, .xls
                        </span>
                      </label>
                      {importFile && (
                        <p className="text-sm text-gray-500 mt-2">
                          <span className="font-semibold text-yellow-500">
                            Selected:
                          </span>{" "}
                          {importFile.name}
                        </p>
                      )}
                    </div>
                    {/* Imported Table - Responsive and Modal-friendly */}
                    {importedRows.length > 0 && (
                      <div className="overflow-x-auto max-h-[40vh] mb-6 rounded-lg border border-gray-700/40">
                        <table className="min-w-full text-xs sm:text-sm text-left border-collapse bg-gray-900/80 rounded-lg">
                          <thead>
                            <tr>
                              {Object.keys(importedRows[0] || {}).map((col) => (
                                <th
                                  key={col}
                                  className="px-2 py-2 sm:px-3 sm:py-3 font-semibold text-gray-300 bg-gray-800/70 whitespace-nowrap"
                                >
                                  {col}
                                </th>
                              ))}
                              <th className="px-2 py-2 sm:px-3 sm:py-3 font-semibold text-gray-300 bg-gray-800/70 whitespace-nowrap">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {importedRows.map((row, idx) => (
                              <tr
                                key={idx}
                                className={`border-b border-gray-700/20 ${
                                  idx % 2 === 0
                                    ? "bg-gray-800/10"
                                    : "bg-gray-900/10"
                                }`}
                              >
                                {Object.keys(row).map((col) => (
                                  <td
                                    key={col}
                                    className="px-2 py-2 sm:px-3 sm:py-3"
                                  >
                                    <input
                                      value={row[col]}
                                      onChange={(e) => {
                                        const newRows = [...importedRows];
                                        newRows[idx][col] = e.target.value;
                                        setImportedRows(newRows);
                                      }}
                                      className="w-full border border-gray-600 rounded-md px-1.5 py-1 text-xs bg-gray-900 text-white focus:ring-1 focus:ring-yellow-400 outline-none"
                                    />
                                  </td>
                                ))}
                                <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">
                                  <button
                                    className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded transition text-xs font-medium"
                                    onClick={() =>
                                      setImportedRows(
                                        importedRows.filter((_, i) => i !== idx)
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                      <button
                        onClick={() => {
                          if (importedRows.length > 0) {
                            const columns = Object.keys(importedRows[0]);
                            const blankRow = columns.reduce(
                              (acc, col) => ({ ...acc, [col]: "" }),
                              {}
                            );
                            setImportedRows([...importedRows, blankRow]);
                          }
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
                      >
                        + Add Row
                      </button>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition"
                          onClick={() => {
                            setImportModalOpen(false);
                            setImportedRows([]);
                            setImportFile(null);
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          disabled={importedRows.length === 0}
                          onClick={async () => {
                            await importSalesData(importedRows);
                            setImportModalOpen(false);
                            setImportedRows([]);
                            setImportFile(null);
                            setImportSuccess(true);
                          }}
                          className={`px-5 py-2 rounded-lg font-semibold shadow-md transition flex items-center gap-2 ${
                            importedRows.length === 0
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-yellow-600 hover:bg-yellow-700 text-white"
                          }`}
                        >
                          <BiImport />
                          Import to System
                        </button>
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
