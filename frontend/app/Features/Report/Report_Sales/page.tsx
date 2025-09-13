/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
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
import { MdCheckCircle, MdAssessment, MdTrendingUp } from "react-icons/md";
import { FiBarChart, FiPieChart, FiActivity } from "react-icons/fi";
import { TbReportAnalytics } from "react-icons/tb";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useSimpleSalesReport } from "./hooks/useSimpleSalesReport";
import NavigationBar from "@/app/components/navigation/navigation";
import ResponsiveMain from "@/app/components/ResponsiveMain";

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

export default function ReportSales() {
  // Use the sales report hook
  const {
    data: reportData,
    loading: isLoading,
    error,
    fetchReportData,
    fetchTodayReport,
    fetchWeekReport,
    fetchMonthReport,
  } = useSimpleSalesReport();

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [period, setPeriod] = useState("today");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Additional filter states
  const [priceRangeFilter, setPriceRangeFilter] = useState("");
  const [performanceFilter, setPerformanceFilter] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "asc" as "asc" | "desc",
  });

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

  // Fetch data based on period
  useEffect(() => {
    if (period === "today") {
      fetchTodayReport();
    } else if (period === "week") {
      fetchWeekReport();
    } else if (period === "month") {
      fetchMonthReport();
    }
  }, [period, fetchTodayReport, fetchWeekReport, fetchMonthReport]);

  // Helper functions
  const handleClear = useCallback(() => {
    setSearchQuery("");
    setCategoryFilter("");
    setPeriod("today");
    setPriceRangeFilter("");
    setPerformanceFilter("");
    setSortConfig({ key: "", direction: "asc" });
  }, []);

  const clearSearch = useCallback(() => setSearchQuery(""), []);
  const clearCategory = useCallback(() => setCategoryFilter(""), []);
  const clearPeriod = useCallback(() => setPeriod("today"), []);
  const clearPriceRangeFilter = useCallback(() => setPriceRangeFilter(""), []);
  const clearPerformanceFilter = useCallback(
    () => setPerformanceFilter(""),
    []
  );

  const requestSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  // Convert hook data to the format expected by the component
  const salesData = useMemo(() => {
    if (!reportData) return [];
    // Add report_date to each item for date filtering
    return reportData.topItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.revenue / item.quantity,
      totalRevenue: item.revenue,
      category: item.category || "",
      report_date: "",
    }));
  }, [reportData]);

  // Filter helpers
  const filterByCategory = (item: any, category: string) => {
    if (!category) return true;
    return item.category === category;
  };

  const filterByPeriod = (item: any, period: string) => {
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
      return (
        itemDate.getFullYear() === today.getFullYear() &&
        itemDate.getMonth() === today.getMonth()
      );
    }
    return true;
  };

  const filteredSales = useMemo(() => {
    return salesData.filter((item: any) => {
      // Search query filter
      const matchesSearch = searchQuery
        ? Object.values(item)
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true;

      // Category filter
      const matchesCategory = filterByCategory(item, categoryFilter);

      // Period filter
      const matchesPeriod = filterByPeriod(item, period);

      // Price range category filter
      const matchesPriceRangeFilter = (() => {
        if (!priceRangeFilter) return true;
        const price = Number(item.unitPrice) || 0;
        switch (priceRangeFilter) {
          case "budget":
            return price <= 100;
          case "mid_range":
            return price > 100 && price <= 300;
          case "premium":
            return price > 300;
          default:
            return true;
        }
      })();

      // Performance filter
      const matchesPerformanceFilter = (() => {
        if (!performanceFilter) return true;
        const quantity = Number(item.quantity) || 0;
        const revenue = Number(item.totalRevenue) || 0;

        // Calculate performance thresholds based on data
        const avgQuantity =
          salesData.reduce((sum, i) => sum + i.quantity, 0) / salesData.length;
        const avgRevenue =
          salesData.reduce((sum, i) => sum + i.totalRevenue, 0) /
          salesData.length;

        switch (performanceFilter) {
          case "top_seller":
            return quantity >= avgQuantity * 1.5;
          case "high_revenue":
            return revenue >= avgRevenue * 1.5;
          case "low_performer":
            return quantity < avgQuantity * 0.5 || revenue < avgRevenue * 0.5;
          case "average":
            return (
              quantity >= avgQuantity * 0.5 && quantity < avgQuantity * 1.5
            );
          default:
            return true;
        }
      })();

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPeriod &&
        matchesPriceRangeFilter &&
        matchesPerformanceFilter
      );
    });
  }, [
    salesData,
    searchQuery,
    categoryFilter,
    period,
    priceRangeFilter,
    performanceFilter,
  ]);

  const groupedSales = filteredSales;

  const sortedSales = useMemo(() => {
    const data = groupedSales;
    if (!sortConfig.key) return data;
    const sorted = [...data].sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity;
      if (b.totalRevenue !== a.totalRevenue)
        return b.totalRevenue - a.totalRevenue;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [groupedSales, sortConfig]);

  const values = [
    ["Item Name", "Category", "Quantity Sold", "Unit Price", "Total Revenue"],
    ...sortedSales.map((item) => [
      item.name,
      item.category,
      item.quantity,
      item.unitPrice,
      item.totalRevenue,
    ]),
  ];

  const exportToExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(values);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, `Sales_Report - ${getFormattedDate()}.xlsx`);
    setExportSuccess(true);
  };

  const appendToGoogleSheet = async (
    accessToken: string,
    sheetId: string,
    sheetRange: string,
    data: any[][]
  ) => {
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetRange}:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: data }),
        }
      );
      setExportSuccess(true);
    } catch (error) {
      console.error("Append failed:", error);
    }
  };

  const createGoogleSheet = async (accessToken: string) => {
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
      const sheetId = sheet.spreadsheetId;
      await appendToGoogleSheet(accessToken, sheetId, SHEET_RANGE, values);
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
                        {/* Export Button */}
                        <button
                          onClick={() => setShowPopup(true)}
                          className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg sm:rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm md:text-base whitespace-nowrap flex-1 sm:flex-none min-h-[44px]"
                        >
                          <FaDownload className="text-xs sm:text-sm" />
                          <span>Export Report</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Report Summary Cards */}
                  <div className="grid grid-cols-1 2xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 xs:gap-2 sm:gap-3 lg:gap-4">
                    <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-md xs:rounded-lg sm:rounded-xl p-1.5 xs:p-2 sm:p-3 lg:p-4 responsive-card">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-yellow-400 text-2xs xs:text-xs sm:text-sm font-medium truncate">
                            Total Items
                          </p>
                          <p
                            className="text-white text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold truncate"
                            title={`${sortedSales.length} items`}
                          >
                            {sortedSales.length}
                          </p>
                        </div>
                        <FiBarChart className="text-yellow-400 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-md xs:rounded-lg sm:rounded-xl p-1.5 xs:p-2 sm:p-3 lg:p-4 responsive-card">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-green-400 text-2xs xs:text-xs sm:text-sm font-medium truncate">
                            Revenue
                          </p>
                          <p
                            className="text-white text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold truncate"
                            title={`₱${sortedSales
                              .reduce((sum, item) => sum + item.totalRevenue, 0)
                              .toLocaleString()}`}
                          >
                            ₱
                            {sortedSales
                              .reduce((sum, item) => sum + item.totalRevenue, 0)
                              .toLocaleString()}
                          </p>
                        </div>
                        <MdTrendingUp className="text-green-400 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-md xs:rounded-lg sm:rounded-xl p-1.5 xs:p-2 sm:p-3 lg:p-4 responsive-card">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-blue-400 text-2xs xs:text-xs sm:text-sm font-medium truncate">
                            Quantity
                          </p>
                          <p
                            className="text-white text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold truncate"
                            title={`${sortedSales
                              .reduce((sum, item) => sum + item.quantity, 0)
                              .toLocaleString()} sold`}
                          >
                            {sortedSales
                              .reduce((sum, item) => sum + item.quantity, 0)
                              .toLocaleString()}
                          </p>
                        </div>
                        <FiActivity className="text-blue-400 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-md xs:rounded-lg sm:rounded-xl p-1.5 xs:p-2 sm:p-3 lg:p-4 responsive-card">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-purple-400 text-2xs xs:text-xs sm:text-sm font-medium truncate">
                            Avg Price
                          </p>
                          <p
                            className="text-white text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold truncate"
                            title={`₱${
                              sortedSales.length > 0
                                ? (
                                    sortedSales.reduce(
                                      (sum, item) => sum + item.unitPrice,
                                      0
                                    ) / sortedSales.length
                                  ).toFixed(2)
                                : "0.00"
                            } average`}
                          >
                            ₱
                            {sortedSales.length > 0
                              ? (
                                  sortedSales.reduce(
                                    (sum, item) => sum + item.unitPrice,
                                    0
                                  ) / sortedSales.length
                                ).toFixed(2)
                              : "0.00"}
                          </p>
                        </div>
                        <FiPieChart className="text-purple-400 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-md xs:rounded-lg sm:rounded-xl p-1.5 xs:p-2 sm:p-3 lg:p-4 2xs:col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-1 responsive-card">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-red-400 text-2xs xs:text-xs sm:text-sm font-medium truncate">
                            Best Seller
                          </p>
                          <p
                            className="text-white text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold truncate"
                            title={
                              sortedSales.length > 0
                                ? sortedSales
                                    .filter(
                                      (item) =>
                                        item.quantity ===
                                        Math.max(
                                          ...sortedSales.map((i) => i.quantity)
                                        )
                                    )
                                    .map((item) => item.name)
                                    .join(", ")
                                : "N/A"
                            }
                          >
                            {sortedSales.length > 0
                              ? sortedSales
                                  .filter(
                                    (item) =>
                                      item.quantity ===
                                      Math.max(
                                        ...sortedSales.map((i) => i.quantity)
                                      )
                                  )
                                  .map(
                                    (item) =>
                                      item.name.substring(
                                        0,
                                        window.innerWidth < 320
                                          ? 4
                                          : window.innerWidth < 480
                                          ? 6
                                          : 8
                                      ) + "..."
                                  )
                                  .join(", ")
                              : "N/A"}
                          </p>
                        </div>
                        <MdTrendingUp className="text-red-400 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Report Metadata */}
                  <div className="bg-gray-800/20 backdrop-blur-sm rounded-md xs:rounded-lg sm:rounded-xl p-1.5 xs:p-2 sm:p-3 lg:p-4 border border-gray-700/30">
                    <div className="flex flex-col 2xs:flex-row justify-between items-start 2xs:items-center gap-1.5 xs:gap-2 sm:gap-3 lg:gap-4">
                      <div className="flex flex-col 2xs:flex-row items-start 2xs:items-center gap-1.5 xs:gap-2 sm:gap-3 lg:gap-4 w-full 2xs:w-auto">
                        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-gray-300">
                          <FaCalendarAlt className="text-yellow-400 text-2xs xs:text-xs sm:text-sm flex-shrink-0" />
                          <span className="text-2xs xs:text-xs sm:text-sm truncate">
                            Generated: {new Date().toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-gray-300">
                          <MdAssessment className="text-yellow-400 text-2xs xs:text-xs sm:text-sm flex-shrink-0" />
                          <span className="text-2xs xs:text-xs sm:text-sm truncate">
                            Sales: {sortedSales.length}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-2xs xs:text-xs sm:text-sm text-gray-400 w-full 2xs:w-auto">
                        <span className="truncate">Updated:</span>
                        <span className="text-yellow-400 font-medium truncate">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </header>

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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400 rounded-md xs:rounded-lg sm:rounded-xl px-6 xs:px-8 sm:px-12 py-2 xs:py-2.5 sm:py-3 lg:py-4 shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-400/50 border border-gray-600/50 hover:border-gray-500 transition-all text-2xs xs:text-xs sm:text-sm md:text-base custom-scrollbar touch-target"
                    />
                    {searchQuery && (
                      <div className="absolute right-1.5 xs:right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          onClick={() => setSearchQuery("")}
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
                          Performance
                        </label>
                        <select
                          value={performanceFilter}
                          onChange={(e) => setPerformanceFilter(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-600/50 focus:border-yellow-400 cursor-pointer text-xs xs:text-sm transition-all"
                        >
                          <option value="">All Performance</option>
                          <option value="top_seller">Top Sellers</option>
                          <option value="high_revenue">High Revenue</option>
                          <option value="average">Average Performance</option>
                          <option value="low_performer">Low Performers</option>
                        </select>
                      </div>
                    </div>

                    {/* Clear All Button inside filter controls */}
                    {(searchQuery ||
                      categoryFilter ||
                      priceRangeFilter ||
                      performanceFilter ||
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
                        !performanceFilter &&
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
                            {performanceFilter && (
                              <div className="flex items-center gap-1 bg-orange-500/20 text-orange-400 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border border-orange-500/30 max-w-full">
                                <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                                  Performance:{" "}
                                  {performanceFilter.replace("_", " ")}
                                </span>
                                <button
                                  onClick={clearPerformanceFilter}
                                  className="text-orange-300 hover:text-white transition-colors ml-1 flex-shrink-0"
                                  title="Clear performance filter"
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
                        sortedSales.map((item, index) => (
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
                        ))
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
                        sortedSales.map((item, index) => (
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
                        ))
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
                        sortedSales.map((item, index) => (
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
                        ))
                      )}
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
                            { key: "totalRevenue", label: "Total Revenue" },
                          ].map((col) => (
                            <th
                              key={col.key}
                              onClick={() => requestSort(col.key)}
                              className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 text-left font-semibold cursor-pointer select-none whitespace-nowrap text-xs lg:text-sm xl:text-base transition-colors text-gray-300 hover:text-yellow-400 no-select touch-target"
                              scope="col"
                              tabIndex={0}
                              aria-label={`Sort by ${col.label}`}
                            >
                              <div className="flex items-center gap-1.5 lg:gap-2">
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
                          sortedSales.map((item, index) => (
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
                          ))
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
                          sortedSales.map((item, index) => (
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
                          ))
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
                      sortedSales.map((item, index) => (
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

                          {/* Total Revenue */}
                          <div className="bg-green-500/10 rounded-md xs:rounded-lg p-2 xs:p-3 border border-green-500/20">
                            <p className="text-green-400 text-xs font-medium mb-0.5 xs:mb-1 truncate">
                              Total Revenue
                            </p>
                            <p className="text-white text-lg xs:text-xl font-bold">
                              ₱{item.totalRevenue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
                              .reduce((sum, item) => sum + item.totalRevenue, 0)
                              .toLocaleString()}
                          </span>{" "}
                          revenue
                        </div>
                        <div className="text-gray-300 truncate">
                          <span className="text-blue-400 font-semibold">
                            {sortedSales
                              .reduce((sum, item) => sum + item.quantity, 0)
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
                                    (sum, item) => sum + item.unitPrice,
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
            </div>
          </main>
        </ResponsiveMain>
      </section>
    </GoogleOAuthProvider>
  );
}
