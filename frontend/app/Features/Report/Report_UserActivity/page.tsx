"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import NavigationBar from "@/app/components/navigation/navigation";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import UserActivityImg from "@/public/Report_UserActivity.png";
import * as XLSX from "xlsx";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import dayjs from "dayjs";
import axios from "@/app/lib/axios";
import {
  FaSearch,
  FaDownload,
  FaCalendarAlt,
  FaChartLine,
  FaSort,
  FaUserCheck,
  FaUsers,
  FaFilter,
} from "react-icons/fa";
import { MdCheckCircle, MdAssessment } from "react-icons/md";
import { TbReportAnalytics } from "react-icons/tb";
import { FiBarChart } from "react-icons/fi";
import { useUserActivityLogAPI } from "./hook/use-userActivityLogAPI";
const CLIENT_ID =
  "72672884523-epq2tf1eu53h6cvrq6jotgfs9osrnvpe.apps.googleusercontent.com";
const SHEET_RANGE = "Sheet1!A1";

interface GoogleSheetIntegrationProps {
  onLoginSuccess: (tokenResponse: any) => void;
}

const GoogleSheetIntegration = ({
  onLoginSuccess,
}: GoogleSheetIntegrationProps) => {
  const login = useGoogleLogin({
    scope:
      "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
    onSuccess: (tokenResponse) => {
      onLoginSuccess(tokenResponse);
    },
    onError: (error) => {
      console.error("Google Login Failed:", error);
    },
  });

  return (
    <button
      onClick={() => login()}
      className="w-full bg-blue-700 hover:bg-blue-600 text-white font-semibold px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-200 text-xs xs:text-sm sm:text-base min-h-[40px] xs:min-h-[44px] touch-manipulation"
      type="button"
    >
      Export to Google Sheets
    </button>
  );
};

const Report_UserActivity = () => {
  const { isMenuOpen, isMobile } = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportDate, setReportDate] = useState("");
  const [period, setPeriod] = useState("all");
  const [role, setRole] = useState("");

  // Additional filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [username, setUsername] = useState("");
  const [activityTimeFilter, setActivityTimeFilter] = useState("");

  const [userActivityData, setUserActivityData] = useState<any[]>([]);
  const [pastUserActivityData, setPastUserActivityData] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "", direction: "asc" });

  const roles = [
    "Owner",
    "General Manager",
    "Store Manager",
    "Assistant Store Manager",
  ];

  const { logs, loading, error, fetchLogs } = useUserActivityLogAPI();

  useEffect(() => {
    const params: any = {};
    if (reportDate) params.report_date = reportDate;
    if (role) params.role = role;
    fetchLogs(params);
  }, [reportDate, role]);

  // Remove redeclaration and update state instead
  useEffect(() => {
    setUserActivityData(logs);
  }, [logs]);

  // Always use userActivityData as the data source
  const dataSource = useMemo(() => userActivityData, [userActivityData]);

  function matchesPeriod(dateStr?: string) {
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
  }

  const uniqueReportDates = useMemo(() => {
    const dates = [...userActivityData, ...pastUserActivityData]
      .map((item) => item.report_date)
      .filter((date) => !!date)
      .map((date) => dayjs(date).format("YYYY-MM-DD"));
    return [...new Set(dates)];
  }, [userActivityData, pastUserActivityData]);

  const uniqueUsernames = useMemo(() => {
    const usernames = [...userActivityData, ...pastUserActivityData]
      .map((item) => item.user_name)
      .filter((name) => !!name);
    return [...new Set(usernames)];
  }, [userActivityData, pastUserActivityData]);

  // Sorting functionality
  const filteredActivity = useMemo(() => {
    const filtered = dataSource.filter((item) => {
      // Search query filter
      const matchesSearch = searchQuery
        ? Object.values(item)
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true;

      // Date filter
      const matchesDate = reportDate
        ? dayjs(item.report_date).format("YYYY-MM-DD") === reportDate
        : true;

      // Period filter (if no specific date is selected)
      const matchesPeriodFilter = reportDate
        ? true
        : period === "all"
        ? true
        : matchesPeriod(item.report_date);

      // Role filter
      const matchesRole = role ? item.role === role : true;

      // Date range filter
      const matchesDateRange = (() => {
        if (!startDate && !endDate) return true;
        const itemDate = dayjs(item.activity_date);
        const start = startDate ? dayjs(startDate) : null;
        const end = endDate ? dayjs(endDate) : null;

        if (start && end) {
          return (
            (itemDate.isAfter(start, "day") || itemDate.isSame(start, "day")) &&
            (itemDate.isBefore(end, "day") || itemDate.isSame(end, "day"))
          );
        } else if (start) {
          return (
            itemDate.isAfter(start, "day") || itemDate.isSame(start, "day")
          );
        } else if (end) {
          return itemDate.isBefore(end, "day") || itemDate.isSame(end, "day");
        }
        return true;
      })();

      // Username filter
      const matchesUsername = username
        ? item.user_name?.toLowerCase().includes(username.toLowerCase())
        : true;

      // Activity time filter (based on hour of day)
      const matchesActivityTime = (() => {
        if (!activityTimeFilter) return true;
        const hour = dayjs(item.activity_date).hour();

        switch (activityTimeFilter) {
          case "morning":
            return hour >= 6 && hour < 12;
          case "afternoon":
            return hour >= 12 && hour < 18;
          case "evening":
            return hour >= 18 && hour < 24;
          case "night":
            return hour >= 0 && hour < 6;
          default:
            return true;
        }
      })();

      return (
        matchesSearch &&
        matchesDate &&
        matchesPeriodFilter &&
        matchesRole &&
        matchesDateRange &&
        matchesUsername &&
        matchesActivityTime
      );
    });

    // No aggregation: just return all filtered items for the selected date
    return filtered;
  }, [
    dataSource,
    searchQuery,
    reportDate,
    period,
    role,
    startDate,
    endDate,
    username,
    activityTimeFilter,
  ]);

  const sortedActivity = useMemo(() => {
    const sorted = [...filteredActivity];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredActivity, sortConfig]);

  const requestSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleClear = useCallback(() => {
    setSearchQuery("");
    setReportDate("");
    setRole("");
    setPeriod("all");
    setStartDate("");
    setEndDate("");
    setUsername("");
    setActivityTimeFilter("");
    setSortConfig({ key: "", direction: "asc" });
  }, []);

  const clearSearch = useCallback(() => setSearchQuery(""), []);
  const clearDate = useCallback(() => setReportDate(""), []);
  const clearRole = useCallback(() => setRole(""), []);
  const clearPeriod = useCallback(() => setPeriod("all"), []);
  const clearDateRange = useCallback(() => {
    setStartDate("");
    setEndDate("");
  }, []);
  const clearUsername = useCallback(() => setUsername(""), []);
  const clearActivityTimeFilter = useCallback(
    () => setActivityTimeFilter(""),
    []
  );

  const values = [
    ["ID", "Username", "Role", "Action Performed", "Date & Time"],
    ...sortedActivity.map((item) => [
      item.activity_id,
      item.user_name,
      item.role,
      item.description,
      item.activity_date,
    ]),
  ];

  const exportToExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(values);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "User Activity Report");
    XLSX.writeFile(wb, `User_Activity_Report - ${getFormattedDate()}.xlsx`);
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
            properties: {
              title: `User Activity Report - ${getFormattedDate()}`,
            },
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

  const isClearAllVisible =
    searchQuery ||
    reportDate ||
    role ||
    startDate ||
    endDate ||
    username ||
    activityTimeFilter ||
    period !== "all" ||
    sortConfig.key !== "";
  const filterGridClass = isClearAllVisible
    ? "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 xs:gap-3 sm:gap-4"
    : "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4";

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <section className="min-h-screen bg-violet-600 text-white font-poppins">
        <NavigationBar
          showPopup={showPopup}
          exportSuccess={exportSuccess}
          isExporting={isExporting}
        />

        <ResponsiveMain>
          <main
            className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
            aria-label="User Activity Report main content"
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
                          <div className="absolute inset-0 bg-violet-400/20 rounded-full blur-lg"></div>
                          <div className="relative bg-gradient-to-br from-violet-400 to-violet-500 p-2 sm:p-3 rounded-full">
                            <TbReportAnalytics className="text-black text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-transparent bg-gradient-to-r from-violet-400 to-violet-500 bg-clip-text font-poppins">
                            User Activity Report
                          </h2>
                          <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-1">
                            Comprehensive user activity tracking and monitoring
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        {/* Export Button */}
                        <button
                          onClick={() => setShowPopup(true)}
                          className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-black px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg sm:rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm md:text-base whitespace-nowrap flex-1 sm:flex-none min-h-[44px] touch-manipulation"
                        >
                          <FaDownload className="text-xs sm:text-sm" />
                          <span>Export Report</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Report Summary Cards */}
                  <div className="grid grid-cols-1 2xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 xs:gap-2 sm:gap-3 lg:gap-4">
                    {/* Total Activities */}
                    <div className="bg-gradient-to-br from-violet-500/10 to-violet-600/10 border border-violet-500/20 rounded-md xs:rounded-lg sm:rounded-xl p-1.5 xs:p-2 sm:p-3 lg:p-4 responsive-card">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-violet-400 text-2xs xs:text-xs sm:text-sm font-medium truncate">
                            Total Activities
                          </p>
                          <p
                            className="text-white text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold truncate"
                            title={`${sortedActivity.length} activities`}
                          >
                            {sortedActivity.length}
                          </p>
                        </div>
                        <FiBarChart className="text-violet-400 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0" />
                      </div>
                    </div>

                    {/* Total Users */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-md xs:rounded-lg sm:rounded-xl p-1.5 xs:p-2 sm:p-3 lg:p-4 responsive-card">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-blue-400 text-2xs xs:text-xs sm:text-sm font-medium truncate">
                            Active Users
                          </p>
                          <p
                            className="text-white text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold truncate"
                            title={`${
                              new Set(
                                sortedActivity.map((item) => item.username)
                              ).size
                            } users`}
                          >
                            {
                              new Set(
                                sortedActivity.map((item) => item.username)
                              ).size
                            }
                          </p>
                        </div>
                        <FaUsers className="text-blue-400 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0" />
                      </div>
                    </div>

                    {/* Most Active User */}
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-md xs:rounded-lg sm:rounded-xl p-1.5 xs:p-2 sm:p-3 lg:p-4 2xs:col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-3 responsive-card">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-green-400 text-2xs xs:text-xs sm:text-sm font-medium truncate">
                            Most Active User
                          </p>
                          <p
                            className="text-white text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold truncate"
                            title={
                              sortedActivity.length > 0
                                ? Object.entries(
                                    sortedActivity.reduce((acc: any, item) => {
                                      acc[item.user_name] =
                                        (acc[item.user_name] || 0) + 1;
                                      return acc;
                                    }, {})
                                  ).reduce(
                                    (max, [user, count]) =>
                                      (count as number) >
                                      (max as [string, number])[1]
                                        ? [user, count as number]
                                        : max,
                                    ["N/A", 0]
                                  )[0]
                                : "N/A"
                            }
                          >
                            {sortedActivity.length > 0
                              ? Object.entries(
                                  sortedActivity.reduce((acc: any, item) => {
                                    acc[item.user_name] =
                                      (acc[item.user_name] || 0) + 1;
                                    return acc;
                                  }, {})
                                )
                                  .reduce(
                                    (max, [user, count]) =>
                                      (count as number) >
                                      (max as [string, number])[1]
                                        ? [user, count as number]
                                        : max,
                                    ["N/A", 0]
                                  )[0]
                                  .substring(0, 12) + "..."
                              : "N/A"}
                          </p>
                        </div>
                        <FaUserCheck className="text-green-400 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Report Metadata */}
                  <div className="bg-gray-800/20 backdrop-blur-sm rounded-md xs:rounded-lg sm:rounded-xl p-1.5 xs:p-2 sm:p-3 lg:p-4 border border-gray-700/30">
                    <div className="flex flex-col 2xs:flex-row justify-between items-start 2xs:items-center gap-1.5 xs:gap-2 sm:gap-3 lg:gap-4">
                      <div className="flex flex-col 2xs:flex-row items-start 2xs:items-center gap-1.5 xs:gap-2 sm:gap-3 lg:gap-4 w-full 2xs:w-auto">
                        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-gray-300">
                          <FaCalendarAlt className="text-violet-400 text-2xs xs:text-xs sm:text-sm flex-shrink-0" />
                          <span className="text-2xs xs:text-xs sm:text-sm truncate">
                            Generated: {new Date().toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-gray-300">
                          <MdAssessment className="text-violet-400 text-2xs xs:text-xs sm:text-sm flex-shrink-0" />
                          <span className="text-2xs xs:text-xs sm:text-sm truncate">
                            Activities: {sortedActivity.length}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-2xs xs:text-xs sm:text-sm text-gray-400 w-full 2xs:w-auto">
                        <span className="truncate">Updated:</span>
                        <span className="text-violet-400 font-medium truncate">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Divider */}
                <div className="relative mb-2 xs:mb-3 sm:mb-4 lg:mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gradient-to-r from-transparent via-violet-400/50 to-transparent"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-black px-1.5 xs:px-2 sm:px-3 lg:px-4 text-violet-400/70 text-2xs xs:text-xs sm:text-sm flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                      <FaChartLine className="text-2xs xs:text-xs sm:text-sm flex-shrink-0" />
                      <span className="truncate">Analytics & Filtering</span>
                    </span>
                  </div>
                </div>

                {/* Enhanced Filters Section */}
                <section
                  aria-label="Activity Filters"
                  className="mb-4 xs:mb-6 sm:mb-8 space-y-3 xs:space-y-4 sm:space-y-6"
                >
                  <div className="flex flex-col 2xs:flex-row items-start 2xs:items-center justify-between mb-2 xs:mb-3 gap-1.5 xs:gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="p-1 xs:p-1.5 sm:p-2 bg-yellow-500/10 rounded-md xs:rounded-lg border border-yellow-500/20 flex-shrink-0">
                        <FaFilter className="text-violet-400 text-2xs xs:text-xs sm:text-sm" />
                      </div>
                      <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-white truncate">
                        Filters
                      </h3>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <div className="absolute left-2 xs:left-3 sm:left-4 top-1/2 -translate-y-1/2 text-violet-400 pointer-events-none">
                      <FaSearch className="text-2xs xs:text-xs sm:text-sm" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search user activity..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400 rounded-md xs:rounded-lg sm:rounded-xl px-6 xs:px-8 sm:px-12 py-2 xs:py-2.5 sm:py-3 lg:py-4 shadow-inner focus:outline-none focus:ring-2 focus:ring-violet-400/50 border border-gray-600/50 hover:border-gray-500 transition-all text-2xs xs:text-xs sm:text-sm md:text-base custom-scrollbar touch-target"
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
                        <label className="block text-xs xs:text-sm text-gray-300 mb-1 xs:mb-2">
                          Date
                        </label>
                        <select
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-600/50 focus:border-violet-400 cursor-pointer text-2xs xs:text-xs sm:text-sm transition-all"
                          aria-label="Filter by date"
                        >
                          <option value="">All Dates</option>
                          {uniqueReportDates.map((date) => (
                            <option key={date} value={date}>
                              {date ? dayjs(date).format("MMMM D, YYYY") : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs xs:text-sm text-gray-300 mb-1 xs:mb-2">
                          Period
                        </label>
                        <select
                          value={period}
                          onChange={(e) => setPeriod(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-600/50 focus:border-violet-400 cursor-pointer text-2xs xs:text-xs sm:text-sm transition-all"
                          aria-label="Filter by period"
                        >
                          <option value="all">All Time</option>
                          <option value="weekly">This Week</option>
                          <option value="monthly">This Month</option>
                          <option value="yearly">This Year</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs xs:text-sm text-gray-300 mb-1 xs:mb-2">
                          Role
                        </label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-600/50 focus:border-violet-400 cursor-pointer text-2xs xs:text-xs sm:text-sm transition-all"
                          aria-label="Filter by role"
                        >
                          <option value="">All Roles</option>
                          {roles.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Secondary Filters Row */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 mb-4">
                      <div>
                        <label className="block text-xs xs:text-sm text-gray-300 mb-1 xs:mb-2">
                          Username
                        </label>
                        <select
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-600/50 focus:border-violet-400 cursor-pointer text-2xs xs:text-xs sm:text-sm transition-all"
                        >
                          <option value="">All Users</option>
                          {uniqueUsernames.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs xs:text-sm text-gray-300 mb-1 xs:mb-2">
                          Time of Day
                        </label>
                        <select
                          value={activityTimeFilter}
                          onChange={(e) =>
                            setActivityTimeFilter(e.target.value)
                          }
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-600/50 focus:border-violet-400 cursor-pointer text-2xs xs:text-xs sm:text-sm transition-all"
                        >
                          <option value="">All Times</option>
                          <option value="morning">Morning (6AM-12PM)</option>
                          <option value="afternoon">
                            Afternoon (12PM-6PM)
                          </option>
                          <option value="evening">Evening (6PM-12AM)</option>
                          <option value="night">Night (12AM-6AM)</option>
                        </select>
                      </div>
                    </div>

                    {/* Date Range Filters */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 xs:gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs xs:text-sm text-gray-300 mb-1 xs:mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-600/50 focus:border-violet-400 text-2xs xs:text-xs sm:text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs xs:text-sm text-gray-300 mb-1 xs:mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-gray-700/50 text-white rounded-md xs:rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-600/50 focus:border-violet-400 text-2xs xs:text-xs sm:text-sm transition-all"
                        />
                      </div>
                    </div>

                    {/* Clear All Button - only show when filters are active */}
                    {isClearAllVisible && (
                      <div className="mt-3 xs:mt-4 pt-3 xs:pt-4 border-t border-gray-700/30">
                        <div className="flex justify-center">
                          <button
                            onClick={handleClear}
                            className="flex items-center gap-1.5 xs:gap-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 xs:px-4 py-1.5 xs:py-2 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-200 text-xs xs:text-sm font-medium"
                          >
                            <span>🗑️</span>
                            <span>Clear All Filters</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Active Filters Summary */}
                    {(searchQuery ||
                      reportDate ||
                      role ||
                      startDate ||
                      endDate ||
                      username ||
                      activityTimeFilter ||
                      period !== "all" ||
                      sortConfig.key !== "") && (
                      <div className="mt-3 xs:mt-4 pt-3 xs:pt-4 border-t border-gray-700/30">
                        <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 text-xs xs:text-sm">
                          <span className="text-gray-400 flex-shrink-0">
                            Active Filters:
                          </span>
                          {searchQuery && (
                            <div className="flex items-center gap-1 bg-violet-500/20 text-violet-400 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border border-violet-500/30 max-w-full">
                              <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                                Search: "{searchQuery}"
                              </span>
                              <button
                                onClick={clearSearch}
                                className="text-violet-300 hover:text-white transition-colors ml-1 flex-shrink-0"
                                title="Clear search"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          {reportDate && (
                            <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border border-green-500/30 max-w-full">
                              <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                                Date: {reportDate}
                              </span>
                              <button
                                onClick={clearDate}
                                className="text-green-300 hover:text-white transition-colors ml-1 flex-shrink-0"
                                title="Clear date filter"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          {role && (
                            <div className="flex items-center gap-1 bg-purple-500/20 text-purple-400 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border border-purple-500/30 max-w-full">
                              <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                                Role: {role}
                              </span>
                              <button
                                onClick={clearRole}
                                className="text-purple-300 hover:text-white transition-colors ml-1 flex-shrink-0"
                                title="Clear role filter"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          {period !== "all" && (
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
                          {(startDate || endDate) && (
                            <div className="flex items-center gap-1 bg-cyan-500/20 text-cyan-400 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border border-cyan-500/30 max-w-full">
                              <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                                Range: {startDate || "Start"} -{" "}
                                {endDate || "End"}
                              </span>
                              <button
                                onClick={clearDateRange}
                                className="text-cyan-300 hover:text-white transition-colors ml-1 flex-shrink-0"
                                title="Clear date range"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          {username && (
                            <div className="flex items-center gap-1 bg-indigo-500/20 text-indigo-400 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border border-indigo-500/30 max-w-full">
                              <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                                User: {username}
                              </span>
                              <button
                                onClick={clearUsername}
                                className="text-indigo-300 hover:text-white transition-colors ml-1 flex-shrink-0"
                                title="Clear username filter"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          {activityTimeFilter && (
                            <div className="flex items-center gap-1 bg-pink-500/20 text-pink-400 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded border border-pink-500/30 max-w-full">
                              <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                                Time: {activityTimeFilter}
                              </span>
                              <button
                                onClick={clearActivityTimeFilter}
                                className="text-pink-300 hover:text-white transition-colors ml-1 flex-shrink-0"
                                title="Clear activity time filter"
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
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Table Section */}
                <section className="bg-gray-800/30 backdrop-blur-sm rounded-md xs:rounded-lg sm:rounded-xl lg:rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden custom-scrollbar">
                  {/* Ultra Small Screen - Compact Cards */}
                  <div className="2xs:block md:hidden">
                    <div className="p-1.5 space-y-1.5">
                      {sortedActivity.length === 0 ? (
                        <div className="text-center py-6">
                          <FaUserCheck className="text-3xl text-gray-600 mx-auto mb-2" />
                          <h3 className="text-gray-400 font-medium mb-1 text-xs">
                            No activities
                          </h3>
                          <p className="text-gray-500 text-2xs">
                            Try adjusting filters
                          </p>
                        </div>
                      ) : (
                        sortedActivity.map((item, index) => (
                          <div
                            key={`${item.activity_id}-${index}`}
                            className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 rounded-lg p-2 border border-gray-700/30 xs-compact"
                          >
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded text-2xs font-medium">
                                    ID: {item.activity_id}
                                  </span>
                                  <span className="bg-violet-600/20 text-violet-300 px-1.5 py-0.5 rounded text-2xs font-medium">
                                    {item.role}
                                  </span>
                                </div>
                                <span
                                  className="text-white font-semibold text-xs truncate block"
                                  title={item.user_name}
                                >
                                  Name: {item.user_name}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5 text-2xs">
                              <div className="bg-blue-500/10 rounded p-1.5">
                                <p className="text-blue-400 mb-0.5">Action</p>
                                <p className="text-white font-bold truncate">
                                  {item.description}
                                </p>
                              </div>
                              <div className="bg-green-500/10 rounded p-1.5">
                                <p className="text-green-400 mb-0.5">Time</p>
                                <p className="text-white font-bold">
                                  {new Date(
                                    item.activity_date
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Small Screen and Above - Standard Mobile Cards */}
                  <div className="hidden 2xs:block md:hidden">
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
                          className="bg-gray-700/50 text-white rounded-md px-2 xs:px-3 py-1 xs:py-1.5 text-xs xs:text-sm border border-gray-600/50 focus:border-violet-400 cursor-pointer flex-1 xs:flex-none min-w-[150px] xs:min-w-[200px]"
                        >
                          <option value="date_time-desc">Latest First</option>
                          <option value="date_time-asc">Oldest First</option>
                          <option value="user_name-asc">Name (A-Z)</option>
                          <option value="user_name-desc">Name (Z-A)</option>
                          <option value="role-asc">Role (A-Z)</option>
                          <option value="role-desc">Role (Z-A)</option>
                          <option value="action_performed-asc">
                            Action (A-Z)
                          </option>
                          <option value="action_performed-desc">
                            Action (Z-A)
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="p-2 xs:p-3 sm:p-4 space-y-2 xs:space-y-3 sm:space-y-4">
                      {sortedActivity.length === 0 ? (
                        <div className="text-center py-8 xs:py-10 sm:py-12">
                          <FaUserCheck className="text-4xl xs:text-5xl sm:text-6xl text-gray-600 mx-auto mb-3 xs:mb-4" />
                          <h3 className="text-gray-400 font-medium mb-1 xs:mb-2 text-sm xs:text-base">
                            No user activity found
                          </h3>
                          <p className="text-gray-500 text-xs xs:text-sm">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      ) : (
                        sortedActivity.map((item, index) => (
                          <div
                            key={`${item.id}-${index}`}
                            className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-lg xs:rounded-xl p-3 xs:p-4 border border-gray-700/30 hover:border-violet-500/30 transition-all duration-200 touch-manipulation"
                          >
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-2 xs:mb-3 gap-2">
                              <div className="flex-1 min-w-0">
                                <h3
                                  className="text-white font-semibold text-sm xs:text-base mb-1 truncate"
                                  title={item.user_name}
                                >
                                  {item.user_name}
                                </h3>
                                <div className="flex flex-wrap gap-1 xs:gap-1.5 mb-1 xs:mb-2">
                                  <span className="px-1.5 xs:px-2 py-0.5 xs:py-1 bg-violet-600/20 rounded text-xs font-medium text-violet-300 whitespace-nowrap">
                                    {item.role}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Card Stats */}
                            <div className="grid grid-cols-1 gap-2 xs:gap-3 sm:gap-4 mb-2 xs:mb-3">
                              <div className="bg-blue-500/10 rounded-md xs:rounded-lg p-2 xs:p-3 border border-blue-500/20">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-blue-400 text-xs xs:text-sm font-medium mb-1 truncate">
                                      Action Performed
                                    </p>
                                    <p className="text-white text-sm xs:text-base font-semibold truncate">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Date/Time */}
                            <div className="flex items-center justify-between text-xs xs:text-sm text-gray-400">
                              <span>Date & Time:</span>
                              <span className="text-violet-400 font-medium">
                                {new Date(item.activity_date).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Desktop Table View - Large screens */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="table-auto w-full text-sm xl:text-base text-left border-collapse min-w-[600px]">
                      <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                        <tr>
                          {[
                            { key: "activity_id", label: "ID" },
                            { key: "user_name", label: "Name" },
                            { key: "role", label: "Role" },
                            {
                              key: "description",
                              label: "Action Performed",
                            },
                            { key: "activity_date", label: "Date & Time" },
                          ].map((col) => (
                            <th
                              key={col.key}
                              className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 text-left font-semibold cursor-pointer select-none whitespace-nowrap text-xs lg:text-sm xl:text-base transition-colors text-gray-300 hover:text-violet-400 no-select touch-target"
                              onClick={() => requestSort(col.key)}
                              scope="col"
                              tabIndex={0}
                              aria-label={`Sort by ${col.label}`}
                            >
                              <div className="flex items-center gap-2 lg:gap-3">
                                <span className="truncate">{col.label}</span>
                                {sortConfig.key === col.key && (
                                  <span className="text-violet-400 flex-shrink-0">
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
                        {sortedActivity.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-3 lg:px-4 xl:px-6 py-8 lg:py-12 xl:py-16 text-center"
                            >
                              <div className="flex flex-col items-center gap-3 lg:gap-4">
                                <FaUserCheck className="text-4xl lg:text-5xl xl:text-6xl text-gray-600" />
                                <div>
                                  <h3 className="text-gray-400 font-medium mb-1 lg:mb-2 text-sm lg:text-base">
                                    No user activity found
                                  </h3>
                                  <p className="text-gray-500 text-xs lg:text-sm">
                                    Try adjusting your search or filter criteria
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          sortedActivity.map((item, index) => (
                            <tr
                              key={`${item.activity_id}-${index}`}
                              className={`group border-b border-gray-700/30 hover:bg-gradient-to-r hover:from-violet-400/5 hover:to-violet-500/5 transition-all duration-200 cursor-pointer ${
                                index % 2 === 0
                                  ? "bg-gray-800/20"
                                  : "bg-gray-900/20"
                              }`}
                            >
                              <td className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 font-medium">
                                <span className="text-white font-semibold text-xs lg:text-sm xl:text-base">
                                  {item.activity_id}
                                </span>
                              </td>
                              <td className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 font-medium">
                                <span className="text-white group-hover:text-violet-400 transition-colors truncate text-xs lg:text-sm xl:text-base">
                                  {item.user_name}
                                </span>
                              </td>
                              <td className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 whitespace-nowrap">
                                <span className="px-2 py-1 bg-violet-600/20 rounded text-xs font-medium text-violet-300">
                                  {item.role}
                                </span>
                              </td>
                              <td className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 whitespace-nowrap text-gray-300 text-xs lg:text-sm xl:text-base">
                                {item.description}
                              </td>
                              <td className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 xl:py-5 whitespace-nowrap">
                                <span className="text-green-400 font-semibold text-sm lg:text-base xl:text-lg">
                                  {new Date(
                                    item.activity_date
                                  ).toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </section>
            </div>

            {/* Export Modal */}
            {showPopup && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 xs:p-3 sm:p-4">
                <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-4 xs:p-5 sm:p-6 md:p-8 rounded-xl xs:rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-3 xs:space-y-4 sm:space-y-6 max-w-[90vw] xs:max-w-sm sm:max-w-md w-full">
                  <div className="flex justify-center mb-2 xs:mb-3 sm:mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-violet-400/20 rounded-full blur-xl"></div>
                      <div className="relative bg-gradient-to-br from-violet-400 to-violet-500 p-2.5 xs:p-3 sm:p-4 rounded-full">
                        <FaDownload className="text-black text-2xl xs:text-2xl sm:text-3xl" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-transparent bg-gradient-to-r from-violet-400 to-violet-500 bg-clip-text font-poppins leading-tight">
                    Export User Activity Report
                  </h3>
                  <p className="text-gray-300 text-xs xs:text-xs sm:text-sm md:text-base px-2 xs:px-0">
                    Download your user activity report in your preferred format
                  </p>

                  {/* Export Statistics */}
                  <div className="bg-gray-800/30 rounded-md xs:rounded-lg p-2 xs:p-3 text-left">
                    <div className="text-xs text-gray-400 mb-1 xs:mb-2">
                      Report Summary:
                    </div>
                    <div className="grid grid-cols-2 gap-2 xs:gap-3 text-xs xs:text-sm">
                      <div>
                        <span className="text-gray-400">Activities:</span>
                        <span className="text-white font-semibold ml-1">
                          {sortedActivity.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Users:</span>
                        <span className="text-white font-semibold ml-1">
                          {
                            new Set(sortedActivity.map((item) => item.username))
                              .size
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="space-y-2 xs:space-y-3">
                    <button
                      onClick={() => handleExportChoice("excel")}
                      className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-200 text-xs xs:text-sm sm:text-base min-h-[40px] xs:min-h-[44px] touch-manipulation"
                      type="button"
                    >
                      Export to Excel
                    </button>
                    <GoogleSheetIntegration
                      onLoginSuccess={handleGoogleLoginSuccess}
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
};

export default Report_UserActivity;
