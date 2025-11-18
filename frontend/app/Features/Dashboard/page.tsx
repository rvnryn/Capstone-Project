"use client";
import annotationPlugin from "chartjs-plugin-annotation";
import { useEffect, useState, useRef } from "react";
import { useDashboardQuery } from "./hook/useDashboardQuery";
import HolidayFormModal from "./Components/HolidayFormModal";
import dynamic from "next/dynamic";
import { useSimpleSalesReport } from "../Report/Report_Sales/hooks/useSimpleSalesReport";
import {
  useSalesPrediction,
  useHistoricalAnalysis,
  useSalesAnalytics,
} from "./hook/useSalesPrediction";
import { useComprehensiveAnalytics } from "../Report/Report_Sales/hooks/useComprehensiveAnalytics";
import Chart from "chart.js/auto";
import NavigationBar from "@/app/components/navigation/navigation";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { usePWA } from "@/app/hooks/usePWA";
import {
  FaChartLine,
  FaExclamationTriangle,
  FaWarehouse,
  FaBoxes,
  FaClock,
  FaMinus,
  FaChartBar,
  FaArrowUp,
  FaArrowDown,
  FaCalendarAlt,
  FaListUl,
  FaTrophy,
  FaDollarSign,
} from "react-icons/fa";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import {
  MdDashboard,
  MdTrendingUp,
  MdInsights,
  MdWarning,
} from "react-icons/md";
import { HiSparkles } from "react-icons/hi";
import { GiBiohazard } from "react-icons/gi";
import Pagination from "@/app/components/Pagination";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/app/components/UI/tabs";

export default function Dashboard() {
  // Animation for Top Selling list transition
  const [showList, setShowList] = useState(true);
  // Period filter: daily, weekly, monthly (default: monthly)
  const [filterType, setFilterType] = useState<"daily" | "weekly" | "monthly">(
    "monthly"
  );
  const [topItemsCount, setTopItemsCount] = useState(5);
  useEffect(() => {
    setShowList(false);
    const t = setTimeout(() => setShowList(true), 120);
    return () => clearTimeout(t);
  }, [filterType, topItemsCount]);

  function getMondayToSundayRange(date = new Date()) {
    const day = date.getDay();
    // getDay: 0=Sunday, 1=Monday, ..., 6=Saturday
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((day + 6) % 7)); // move to Monday
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6); // move to Sunday
    return {
      start: monday.toISOString().split("T")[0],
      end: sunday.toISOString().split("T")[0],
    };
  }

  function getMonthRange(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      start: firstDay.toISOString().split("T")[0],
      end: lastDay.toISOString().split("T")[0],
    };
  }

  let startDate = "";
  let endDate = "";

  if (filterType === "daily") {
    const today = new Date();
    startDate = today.toISOString().split("T")[0];
    endDate = startDate;
  } else if (filterType === "weekly") {
    const { start, end } = getMondayToSundayRange();
    startDate = start;
    endDate = end;
  } else if (filterType === "monthly") {
    const { start, end } = getMonthRange();
    startDate = start;
    endDate = end;
  }

  // Pass startDate and endDate to your analytics hook
  const { historical, loading, error } = useSalesAnalytics(
    filterType,
    topItemsCount,
    undefined,
    startDate || undefined,
    endDate || undefined
  );

  const historicalData:
    | import("./hook/useSalesPrediction").HistoricalAnalysis
    | null =
    historical.data &&
    typeof historical.data === "object" &&
    "overview" in historical.data
      ? (historical.data as import("./hook/useSalesPrediction").HistoricalAnalysis)
      : null;

  // Fetch Top Performance data
  const { analytics: topPerformanceData } = useComprehensiveAnalytics(
    startDate || "",
    endDate || ""
  );
  const topPerformers = topPerformanceData?.top_performers || [];

  if (
    typeof window !== "undefined" &&
    Chart.registry &&
    !Chart.registry.plugins.get("annotation")
  ) {
    Chart.register(annotationPlugin);
  }

  const HolidayCalendar = dynamic(
    () => import("./Components/HolidayCalendar"),
    {
      ssr: false,
    }
  );

  // Use React Query for real-time inventory data
  const {
    lowStock,
    outOfStock,
    expiring,
    surplus,
    expired,
    spoilage,
    customHolidays,
    addHoliday,
    editHoliday,
    deleteHoliday,
  } = useDashboardQuery();

  // Define variables for low stock, out of stock, and expiring ingredients
  type InventoryIngredient = {
    item_id: string | number;
    item_name: string;
    stock_status?: string;
    [key: string]: any;
  };
  const allLowStockData: InventoryIngredient[] = lowStock.data || [];

  // Split into Critical and Low
  const criticalStockIngredients = allLowStockData.filter(
    (item) => item.stock_status === "Critical"
  );
  const lowStockIngredients = allLowStockData.filter(
    (item) => item.stock_status === "Low"
  );

  const outOfStockItems = outOfStock?.data || [];
  const expiringIngredients = expiring.data || [];
  const expiredItem = expired.data || [];

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEdit, setModalEdit] = useState<null | any>(null);
  const [modalDate, setModalDate] = useState<string | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Pagination state for Expired Items
  const [expiredPage, setExpiredPage] = useState(1);
  const [expiredItemsPerPage, setExpiredItemsPerPage] = useState(25);

  // Pagination state for Expiring Soon Items
  const [expiringPage, setExpiringPage] = useState(1);
  const [expiringItemsPerPage, setExpiringItemsPerPage] = useState(25);

  // Open add modal
  const handleAddHoliday = (date: string) => {
    setModalEdit(null);
    setModalOpen(true);
  };
  // Open edit modal
  const handleEditHoliday = (holiday: any) => {
    setModalEdit(holiday);
    setModalDate(null);
    setModalOpen(true);
  };

  // Save handler
  const handleSaveHoliday = async (data: {
    date: string;
    name: string;
    description?: string;
  }) => {
    if (modalEdit) {
      editHoliday.mutate({ ...data, id: modalEdit.id });
    } else {
      await addHoliday.mutateAsync(data);
      // Force instant refetch for UI update
      if (customHolidays.refetch) await customHolidays.refetch();
    }
    setModalOpen(false);
    setModalEdit(null);
    setModalDate(null);
  };
  // Delete handler
  const handleDeleteHoliday = () => {
    if (modalEdit) {
      deleteHoliday.mutate(modalEdit.id);
    }
    setModalOpen(false);
    setModalEdit(null);
    setModalDate(null);
  };
  // Cancel modal
  const handleCancelModal = () => {
    setModalOpen(false);
    setModalEdit(null);
    setModalDate(null);
  };

  type InventoryItem = {
    item_id: string | number;
    [key: string]: any;
  };

  // Pagination calculations for expired items
  const expiredTotalPages = Math.ceil(expiredItem.length / expiredItemsPerPage);
  const paginatedExpiredItems = expiredItem.slice(
    (expiredPage - 1) * expiredItemsPerPage,
    expiredPage * expiredItemsPerPage
  );

  // Pagination calculations for expiring items
  const expiringTotalPages = Math.ceil(
    expiringIngredients.length / expiringItemsPerPage
  );
  const paginatedExpiringItems = expiringIngredients.slice(
    (expiringPage - 1) * expiringItemsPerPage,
    expiringPage * expiringItemsPerPage
  );

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

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "increasing":
        return <FiTrendingUp className="text-green-400" />;
      case "decreasing":
        return <FiTrendingDown className="text-red-400" />;
      default:
        return <FaMinus className="text-gray-400" />;
    }
  };

  // --- Sales Forecast Chart (Original UI, Chart.js, prediction data) ---
  const [forecastChartReady, setForecastChartReady] = useState(false);
  const forecastCanvasRef = useRef<HTMLCanvasElement>(null);
  // Use prediction data for sales forecast
  const { data: prediction, loading: predictionLoading } = useSalesPrediction(
    filterType,
    topItemsCount
  );

  useEffect(() => {
    if (!prediction || !prediction.data || !forecastCanvasRef.current) return;
    const chartData = prediction.data;
    const canvas = forecastCanvasRef.current;
    // Destroy existing chart before creating new one
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
    let chart: Chart | null = null;
    try {
      chart = new Chart(canvas, {
        type: "line",
        data: {
          labels: chartData.labels,
          datasets: chartData.datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true },
            tooltip: { enabled: true },
          },
          scales: {
            y: { beginAtZero: true },
            x: {},
          },
        },
      });
      setForecastChartReady(true);
    } catch (err) {
      setForecastChartReady(false);
    }
    return () => {
      if (chart) chart.destroy();
    };
  }, [prediction, filterType, topItemsCount]);

  // Render Top Selling Items from historical analytics
  const renderTopSelling = (showList: boolean) => {
    const count = topItemsCount;
    const performers = historicalData?.top_performers?.by_total_sales || [];

    if (!performers.length) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] py-8">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
            <FaChartBar className="relative text-blue-400 text-5xl mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          </div>
          <p className="text-gray-400 text-sm font-medium">
            No sales data available
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Start tracking sales to see insights
          </p>
        </div>
      );
    }

    return (
      <div
        className={`space-y-3 transition-opacity duration-300 ${
          showList ? "opacity-100" : "opacity-0"
        }`}
      >
        {performers.slice(0, count).map((item: any, idx: number) => {
          const total = item.total_sales;
          const revenue = item.total_revenue || 0;

          return (
            <div
              key={item.item}
              className="group relative flex items-center gap-4 p-4 rounded-2xl
              bg-gradient-to-r from-blue-950/40 via-slate-900/30 to-transparent
              hover:from-blue-900/50 hover:via-blue-950/40 hover:to-blue-900/20
              border border-blue-500/10 hover:border-blue-400/40
              backdrop-blur-sm transition-all duration-300
              hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)]
              hover:translate-x-1 cursor-pointer overflow-hidden"
            >
              {/* Animated shine effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/5 to-transparent
              translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
              />

              {/* Number Badge */}
              <div
                className="relative flex-shrink-0 w-12 h-12 rounded-2xl
              bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700
              flex items-center justify-center shadow-lg shadow-blue-500/30
              group-hover:shadow-blue-500/50 group-hover:scale-110 transition-all duration-300
              border border-blue-400/30"
              >
                <span className="text-white font-bold text-lg drop-shadow-lg">
                  {idx + 1}
                </span>
                {idx === 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4">
                    <HiSparkles className="text-yellow-400 text-sm animate-pulse drop-shadow-lg" />
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="relative flex-1 min-w-0">
                <div
                  className="text-white font-bold text-base truncate mb-0.5
                group-hover:text-blue-200 transition-colors"
                >
                  {item.item}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs font-medium">
                    {item.category || "Uncategorized"}
                  </span>
                  {idx < 3 && (
                    <span
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full
                    bg-gradient-to-r from-blue-500/20 to-blue-600/20
                    text-blue-300 border border-blue-400/30"
                    >
                      TOP {idx + 1}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="relative text-right flex-shrink-0">
                <div
                  className="text-blue-400 font-bold text-base mb-0.5
                group-hover:text-blue-300 transition-colors"
                >
                  {total} sold
                </div>
                <div className="text-gray-400 text-xs font-medium">
                  ₱{typeof revenue === "number" ? revenue.toFixed(2) : revenue}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Top Performance Items (by revenue)
  const renderTopPerformance = (showList: boolean) => {
    const count = topItemsCount;
    const performers = topPerformers.slice(0, count);

    if (!performers.length) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] py-8">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
            <FaTrophy className="relative text-emerald-400 text-5xl mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          </div>
          <p className="text-gray-400 text-sm font-medium">
            No performance data available
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Start tracking revenue to see top performers
          </p>
        </div>
      );
    }

    return (
      <div
        className={`space-y-3 transition-opacity duration-300 ${
          showList ? "opacity-100" : "opacity-0"
        }`}
      >
        {performers.map((item: any, idx: number) => {
          const revenue = item.total_revenue;
          const quantity = item.total_quantity_sold;

          return (
            <div
              key={item.item_name}
              className="group relative flex items-center gap-4 p-4 rounded-2xl
              bg-gradient-to-r from-emerald-950/40 via-slate-900/30 to-transparent
              hover:from-emerald-900/50 hover:via-emerald-950/40 hover:to-emerald-900/20
              border border-emerald-500/10 hover:border-emerald-400/40
              backdrop-blur-sm transition-all duration-300
              hover:shadow-[0_4px_20px_rgba(16,185,129,0.15)]
              hover:translate-x-1 cursor-pointer overflow-hidden"
            >
              {/* Animated shine effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/5 to-transparent
              translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
              />

              {/* Number Badge */}
              <div
                className="relative flex-shrink-0 w-12 h-12 rounded-2xl
              bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700
              flex items-center justify-center shadow-lg shadow-emerald-500/30
              group-hover:shadow-emerald-500/50 group-hover:scale-110 transition-all duration-300
              border border-emerald-400/30"
              >
                <span className="text-white font-bold text-lg drop-shadow-lg">
                  {idx + 1}
                </span>
                {idx === 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4">
                    <FaTrophy className="text-yellow-400 text-sm animate-pulse drop-shadow-lg" />
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="relative flex-1 min-w-0">
                <div
                  className="text-white font-bold text-base truncate mb-0.5
                group-hover:text-emerald-200 transition-colors"
                >
                  {item.item_name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs font-medium">
                    {item.category || "Uncategorized"}
                  </span>
                  {idx < 3 && (
                    <span
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full
                    bg-gradient-to-r from-emerald-500/20 to-emerald-600/20
                    text-emerald-300 border border-emerald-400/30"
                    >
                      TOP {idx + 1}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="relative text-right flex-shrink-0">
                <div
                  className="text-emerald-400 font-bold text-base mb-0.5
                group-hover:text-emerald-300 transition-colors"
                >
                  ₱{typeof revenue === "number" ? revenue.toFixed(2) : revenue}
                </div>
                <div className="text-gray-400 text-xs font-medium">
                  {typeof quantity === "number" ? quantity : quantity} sold
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const StatCard = ({ icon, title, count, color, bgColor }: any) => (
    <div
      className={`${bgColor} rounded-xl p-3 sm:p-4 border-l-4 ${color} shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-gray-300 text-xs sm:text-sm font-medium truncate">
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">
            {count}
          </p>
        </div>
        <div
          className={`p-2 sm:p-3 rounded-lg ${bgColor} border ${color.replace(
            "border-l-",
            "border-"
          )} flex-shrink-0`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  // ML Forecast Chart as a child component
  function MLForecastChart() {
    const mlForecastCanvasRef = useRef<HTMLCanvasElement>(null);
    const {
      data: mlReportData,
      loading: mlLoading,
      fetchWeekReport,
    } = useSimpleSalesReport();
    // Fetch ML forecast data on mount
    useEffect(() => {
      fetchWeekReport();
    }, []);

    useEffect(() => {
      console.log("[MLForecastChart] mlReportData:", mlReportData);
      console.log("[MLForecastChart] mlLoading:", mlLoading);
    }, [mlReportData, mlLoading]);

    // Prepare ML chart data and holiday highlights
    const mlChartData = (() => {
      if (!mlReportData) return null;
      const forecast = Array.isArray(mlReportData.forecast)
        ? mlReportData.forecast
        : [];
      const historical = Array.isArray(mlReportData.historicalPredictions)
        ? mlReportData.historicalPredictions
        : [];
      if (!forecast.length && !historical.length) return null;
      const allWeeks = [
        ...historical.map((w) => w.week_start),
        ...forecast
          .map((w) => w.week_start)
          .filter((w) => !historical.some((h) => h.week_start === w)),
      ];
      const weekHolidayType: Record<string, string | null> = {};
      historical.forEach((w) => {
        weekHolidayType[w.week_start] = w.holiday_type || null;
      });
      forecast.forEach((w) => {
        weekHolidayType[w.week_start] = w.holiday_type || null;
      });
      return {
        labels: allWeeks,
        datasets: [
          {
            label: "Actual Sales",
            data: allWeeks.map((w) => {
              const h = historical.find((x) => x.week_start === w);
              return h ? h.actual_sales : null;
            }),
            borderColor: "#34d399",
            backgroundColor: "rgba(52,211,153,0.2)",
            tension: 0.3,
            fill: false,
            spanGaps: true,
          },
          {
            label: "Predicted Sales",
            data: allWeeks.map((w) => {
              const h = historical.find((x) => x.week_start === w);
              if (h) return h.predicted_sales;
              const f = forecast.find((x) => x.week_start === w);
              return f ? f.predicted_sales : null;
            }),
            borderColor: "#facc15",
            backgroundColor: "rgba(250,204,21,0.2)",
            borderDash: [6, 4],
            tension: 0.3,
            fill: false,
            spanGaps: true,
          },
        ],
        weekHolidayType,
      };
    })();

    useEffect(() => {
      if (!mlChartData || mlLoading) return;
      const canvas = mlForecastCanvasRef.current;
      if (!canvas) return;

      const existingChart = Chart.getChart(canvas);
      if (existingChart) existingChart.destroy();

      let chart: Chart | null = null;
      try {
        const annotations: any = {};
        if (mlChartData.weekHolidayType) {
          mlChartData.labels.forEach((label: string, idx: number) => {
            const type = mlChartData.weekHolidayType[label];
            if (type === "official" || type === "custom") {
              annotations[`holiday-${idx}`] = {
                type: "box",
                xMin: idx - 0.5,
                xMax: idx + 0.5,
                yScaleID: "y",
                backgroundColor:
                  type === "official"
                    ? "rgba(59,130,246,0.12)"
                    : "rgba(236,72,153,0.12)",
                borderWidth: 0,
              };
            }
          });
        }

        chart = new Chart(canvas, {
          type: "line",
          data: mlChartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }, // we’ll handle custom legend
              tooltip: {
                backgroundColor: "rgba(0,0,0,0.95)",
                titleFont: { size: 14, weight: "bold" },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                borderColor: "#fbbf24",
                borderWidth: 2,
              },
              annotation: { annotations },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: "#374151" },
                ticks: { color: "#e5e7eb", font: { size: 11 } },
              },
              x: {
                grid: { display: false },
                ticks: { color: "#e5e7eb", font: { size: 11 } },
              },
            },
            animation: { duration: 700, easing: "easeOutQuart" },
          },
        });
      } catch (error) {
        console.error("ML Forecast Chart creation failed:", error);
      }

      const handleResize = () => {
        if (chart) chart.resize();
      };
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        if (chart) chart.destroy();
      };
    }, [mlChartData, mlLoading]);

    return (
      <section
        aria-label="ML Forecast Chart"
        className="w-full h-auto bg-gradient-to-br from-slate-950/80 via-black/90 to-slate-900/80
                 backdrop-blur-sm rounded-3xl shadow-[0_8px_32px_0_rgba(251,191,36,0.15)]
                 border border-amber-500/20 p-6 sm:p-8 flex flex-col overflow-hidden relative
                 hover:shadow-[0_8px_48px_0_rgba(251,191,36,0.25)] transition-all duration-300"
      >
        {/* Animated background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Chart / States */}
        <div className="relative z-10 flex-1 flex items-center justify-center h-[320px] sm:h-[380px] md:h-[420px]">
          {mlLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 animate-fadein">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/30 blur-3xl rounded-full" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl flex items-center justify-center shadow-lg border border-amber-400/30 backdrop-blur-sm">
                  <MdTrendingUp className="text-amber-400 text-4xl animate-bounce drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                </div>
              </div>
              <p className="text-gray-300 text-base font-medium">
                Loading forecast data...
              </p>
            </div>
          ) : mlChartData ? (
            <canvas ref={mlForecastCanvasRef} className="w-full h-full" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
                <MdTrendingUp className="relative text-amber-400/50 text-6xl drop-shadow-lg" />
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-base font-medium mb-1">
                  No forecast data available
                </p>
                <p className="text-gray-500 text-sm">
                  Forecast data will appear once sales history is available
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section>
      <NavigationBar />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Dashboard main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            {/* Dashboard Header */}
            <header className="flex flex-wrap justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <MdDashboard className="text-black text-3xl" />
                <div>
                  <h1 className="text-3xl font-bold text-black">Dashboard</h1>
                  <p className="text-black text-sm">
                    Restaurant Operations Overview
                  </p>
                </div>
              </div>
            </header>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-black">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="expired">Expiry</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <StatCard
                      icon={
                        <FaClock className="text-red-400 text-lg sm:text-xl" />
                      }
                      title="Expired Items"
                      count={expiredItem.length}
                      color="border-l-red-500"
                      bgColor="bg-black/75"
                    />

                    <StatCard
                      icon={
                        <FaClock className="text-amber-400 text-lg sm:text-xl" />
                      }
                      title="Expiring Soon"
                      count={expiringIngredients.length}
                      color="border-l-amber-500"
                      bgColor="bg-black/75"
                    />

                    <StatCard
                      icon={
                        <GiBiohazard className="text-pink-400 text-lg sm:text-xl" />
                      }
                      title="Spoilage"
                      count={spoilage?.data?.length ?? 0}
                      color="border-l-pink-500"
                      bgColor="bg-black/75"
                    />

                    <StatCard
                      icon={
                        <FaExclamationTriangle className="text-orange-400 text-lg sm:text-xl" />
                      }
                      title="Out of Stock Items"
                      count={outOfStockItems.length}
                      color="border-l-orange-500"
                      bgColor="bg-black/75"
                    />

                    <StatCard
                      icon={
                        <FaExclamationTriangle className="text-red-400 text-lg sm:text-xl" />
                      }
                      title="Critical Stock Items"
                      count={criticalStockIngredients.length}
                      color="border-l-red-500"
                      bgColor="bg-black/75"
                    />

                    <StatCard
                      icon={
                        <FaExclamationTriangle className="text-yellow-400 text-lg sm:text-xl" />
                      }
                      title="Low Stock Items"
                      count={lowStockIngredients.length}
                      color="border-l-yellow-500"
                      bgColor="bg-black/75"
                    />

                    <StatCard
                      icon={
                        <FaExclamationTriangle className="text-green-400 text-lg sm:text-xl" />
                      }
                      title="Surplus Items"
                      count={surplus.data?.length ?? 0}
                      color="border-l-green-500"
                      bgColor="bg-black/75"
                    />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Performance - Enhanced UI */}
                    <section
                      aria-label="Top Performance"
                      className="relative bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-black/80
                      backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(16,185,129,0.15)]
                      border border-emerald-500/20 p-6 flex flex-col overflow-hidden
                      hover:shadow-[0_8px_48px_0_rgba(16,185,129,0.25)] transition-all duration-300"
                    >
                      {/* Animated background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />

                      <header className="relative z-10 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-4 w-full">
                          <div
                            className="relative p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-2xl flex-shrink-0
                          shadow-lg border border-emerald-400/30 backdrop-blur-sm"
                          >
                            <FaTrophy className="text-emerald-400 text-2xl drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
                          </div>
                          <div className="flex-1">
                            <h2
                              className="text-xl font-bold bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-300
                            bg-clip-text text-transparent flex items-center gap-2 tracking-tight"
                            >
                              Top Performing Menu
                            </h2>
                            <p className="text-gray-400 text-sm mt-1 font-medium">
                              Based on revenue performance
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            (window.location.href =
                              "/Features/Report/Report_Sales")
                          }
                          className="group relative flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600
                          hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold text-sm px-5 py-2.5
                          rounded-xl shadow-lg hover:shadow-emerald-500/50 transition-all duration-300
                          w-full sm:w-auto justify-center overflow-hidden border border-emerald-400/30"
                          title="Go to Sales Report"
                        >
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/20 to-emerald-400/0
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                          />
                          <FaTrophy className="text-sm relative z-10" />
                          <span className="relative z-10 hidden sm:inline">
                            View Full Report
                          </span>
                          <span className="relative z-10 inline sm:hidden">
                            Report
                          </span>
                        </button>
                      </header>

                      <div className="relative z-10 w-full sm:w-auto mb-4">
                        {renderTopItemsCountSelector()}
                      </div>

                      <div className="relative z-10 flex-1 overflow-x-auto">
                        <div className="min-w-[220px] sm:min-w-0">
                          {renderTopPerformance(showList)}
                        </div>
                      </div>
                    </section>

                    {/* Top Selling Items - Enhanced UI */}
                    <section
                      aria-label="Top Selling Items"
                      className="relative bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-black/80
                      backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(59,130,246,0.15)]
                      border border-blue-500/20 p-6 flex flex-col overflow-hidden
                      hover:shadow-[0_8px_48px_0_rgba(59,130,246,0.25)] transition-all duration-300"
                    >
                      {/* Animated background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />

                      <header className="relative z-10 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-4 w-full">
                          <div
                            className="relative p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl flex-shrink-0
                          shadow-lg border border-blue-400/30 backdrop-blur-sm"
                          >
                            <FaChartBar className="text-blue-400 text-2xl drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75" />
                          </div>
                          <div className="flex-1">
                            <h2
                              className="text-xl font-bold bg-gradient-to-r from-blue-300 via-blue-200 to-blue-300
                            bg-clip-text text-transparent flex items-center gap-2 tracking-tight"
                            >
                              Top Selling Menu
                            </h2>
                            <p className="text-gray-400 text-sm mt-1 font-medium">
                              Based on historical analytics
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            (window.location.href =
                              "/Features/Report/Report_Sales")
                          }
                          className="group relative flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600
                          hover:from-blue-400 hover:to-blue-500 text-white font-semibold text-sm px-5 py-2.5
                          rounded-xl shadow-lg hover:shadow-blue-500/50 transition-all duration-300
                          w-full sm:w-auto justify-center overflow-hidden border border-blue-400/30"
                          title="Go to Sales Report"
                        >
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/20 to-blue-400/0
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                          />
                          <FaChartBar className="text-sm relative z-10" />
                          <span className="relative z-10 hidden sm:inline">
                            View Full Report
                          </span>
                          <span className="relative z-10 inline sm:hidden">
                            Report
                          </span>
                        </button>
                      </header>

                      <div className="relative z-10 w-full sm:w-auto mb-4">
                        {renderTopItemsCountSelector()}
                      </div>

                      <div className="relative z-10 flex-1 overflow-x-auto">
                        <div className="min-w-[220px] sm:min-w-0">
                          {renderTopSelling(showList)}
                        </div>
                      </div>
                    </section>

                    {/* ML Sales Forecast - Enhanced UI */}
                    <section
                      aria-label="ML Sales Forecast"
                      className="relative lg:col-span-2 bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-black/80
                      backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(251,191,36,0.15)]
                      border border-amber-500/20 p-6 flex flex-col overflow-hidden
                      hover:shadow-[0_8px_48px_0_rgba(251,191,36,0.25)] transition-all duration-300"
                    >
                      {/* Animated background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />

                      {/* Header */}
                      <header className="relative z-10 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-4 flex-1">
                          <div
                            className="relative p-3 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl flex-shrink-0
                          shadow-lg border border-amber-400/30 backdrop-blur-sm"
                          >
                            <FaChartLine className="text-amber-400 text-2xl drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping opacity-75" />
                          </div>
                          <div className="flex-1">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight drop-shadow-lg">
                              Sales Forecast
                              <span className="relative group cursor-help">
                                <AiOutlineInfoCircle
                                  size={20}
                                  className="text-amber-400 hover:text-amber-300 transition-colors"
                                  aria-label="Forecast info"
                                  tabIndex={0}
                                />
                                <span
                                  role="tooltip"
                                  className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-max min-w-[200px] sm:min-w-[280px]
                                  bg-gradient-to-br from-amber-950/95 to-slate-950/95 backdrop-blur-xl text-amber-100 text-xs
                                  rounded-xl px-4 py-3 shadow-2xl border border-amber-500/50
                                  opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                                  pointer-events-none transition-all duration-300 scale-95 group-hover:scale-100"
                                >
                                  <div className="font-semibold mb-1 text-amber-200">
                                    AI-Powered Predictions
                                  </div>
                                  Forecasts are estimates based on historical
                                  patterns and may not be 100% accurate.
                                </span>
                              </span>
                            </h2>
                            <p className="text-gray-300 text-sm mt-1 font-medium">
                              Machine learning predictions vs actual sales by
                              week
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            (window.location.href =
                              "/Features/Report/Report_Sales")
                          }
                          className="group relative flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600
                          hover:from-amber-400 hover:to-amber-500 text-white font-semibold text-sm px-5 py-2.5
                          rounded-xl shadow-lg hover:shadow-amber-500/50 transition-all duration-300
                          w-full sm:w-auto justify-center overflow-hidden border border-amber-400/30"
                          title="Go to Sales Report"
                        >
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-white/20 to-amber-400/0
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                          />
                          <FaChartLine className="text-sm relative z-10" />
                          <span className="relative z-10">
                            View Full Report
                          </span>
                        </button>
                      </header>

                      {/* Chart Area */}
                      <div className="relative z-10 w-full">
                        <MLForecastChart />
                      </div>

                      {/* Legend - Enhanced with better visibility */}
                      <div className="relative z-10 mt-8 p-4 bg-slate-900/50 rounded-2xl border border-amber-500/20">
                        <h3 className="text-center text-amber-300 text-xs font-semibold mb-3 uppercase tracking-wider">
                          Holiday Indicators
                        </h3>
                        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                          <div
                            className="flex items-center gap-3 px-5 py-2.5 bg-blue-500/20 border-2 border-blue-400/50
                            rounded-full backdrop-blur-sm hover:bg-blue-500/30 transition-all duration-300 cursor-pointer
                            shadow-lg hover:shadow-blue-500/40 hover:scale-105"
                          >
                            <span
                              className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600
                              shadow-lg shadow-blue-500/60 ring-2 ring-blue-400/50 animate-pulse"
                            />
                            <span className="text-blue-200 text-sm font-bold">
                              Official Holiday
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-3 px-5 py-2.5 bg-pink-500/20 border-2 border-pink-400/50
                            rounded-full backdrop-blur-sm hover:bg-pink-500/30 transition-all duration-300 cursor-pointer
                            shadow-lg hover:shadow-pink-500/40 hover:scale-105"
                          >
                            <span
                              className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-pink-600
                              shadow-lg shadow-pink-500/60 ring-2 ring-pink-400/50 animate-pulse"
                            />
                            <span className="text-pink-200 text-sm font-bold">
                              Custom Holiday
                            </span>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="inventory">
                <div>
                  {/* Low stock, out of stock, surplus, spoilage */}
                  <section
                    aria-label="Spoilage List"
                    className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 border border-pink-400 mb-4"
                  >
                    <header className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="p-1.5 sm:p-2 bg-pink-700/30 rounded-lg">
                        <GiBiohazard className="text-pink-300 text-base sm:text-lg" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-pink-200">
                          Spoilage
                        </h2>
                        <p className="text-pink-400 text-xs">
                          Items listed here have been marked as spoiled or
                          wasted due to damage, contamination, or expiration.
                          Review and address these records to minimize future
                          losses.
                        </p>
                      </div>
                    </header>
                    <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                      {!spoilage?.data || spoilage.data.length === 0 ? (
                        <div className="text-center py-3 sm:py-4">
                          <GiBiohazard className="text-pink-500 text-lg sm:text-xl mx-auto mb-2" />
                          <p className="text-pink-400 text-xs sm:text-sm">
                            No spoilage records
                          </p>
                        </div>
                      ) : (
                        spoilage.data.map(
                          (
                            item: {
                              id?: string | number;
                              item_name?: string;
                              quantity_spoiled?: number;
                              reason?: string;
                              spoilage_date?: string;
                              batch_date?: string;
                            },
                            idx: number
                          ) => (
                            <div
                              key={item.id || `${item.item_name}-${idx}`}
                              className="bg-pink-700/10 border border-pink-700/20 rounded-lg p-2 sm:p-3 hover:bg-pink-700/15 transition-colors duration-200"
                            >
                              <div className="flex justify-between items-center">
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-pink-200 truncate">
                                    {item.item_name}
                                    {item.batch_date && (
                                      <span className="text-pink-400 text-xs ml-2 font-normal">
                                        (Batch: {item.batch_date})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-pink-300">
                                    Qty:{" "}
                                    {typeof item.quantity_spoiled === "number"
                                      ? item.quantity_spoiled.toFixed(2)
                                      : item.quantity_spoiled}
                                    {item.reason && (
                                      <span className="ml-2 text-pink-400">
                                        ({item.reason})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-2">
                                    <p className="text-orange-400 text-xs">
                                      {item.spoilage_date
                                        ? new Date(
                                            item.spoilage_date
                                          ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })
                                        : "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    {/* Out of Stock List - Multi-Batch Support */}
                    <section
                      aria-label="Out of Stock"
                      className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 border border-orange-400"
                    >
                      <header className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="p-1.5 sm:p-2 bg-orange-700/30 rounded-lg">
                          <FaBoxes className="text-orange-300 text-base sm:text-lg" />
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-orange-200">
                            Out of Stock
                          </h2>
                          <p className="text-orange-400 text-xs">
                            Items where ALL batches are completely depleted.
                            Restock immediately to avoid service disruptions.
                          </p>
                        </div>
                      </header>
                      <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                        {!outOfStockItems.length ? (
                          <div className="text-center py-3 sm:py-4">
                            <FaBoxes className="text-orange-500 text-lg sm:text-xl mx-auto mb-2" />
                            <p className="text-orange-400 text-xs sm:text-sm">
                              No items are completely out of stock
                            </p>
                          </div>
                        ) : (
                          // Group by item_name to show aggregate view
                          Object.entries(
                            outOfStockItems.reduce((acc: any, item: any) => {
                              if (!acc[item.item_name]) {
                                acc[item.item_name] = [];
                              }
                              acc[item.item_name].push(item);
                              return acc;
                            }, {})
                          ).map(([itemName, batches]: [string, any]) => (
                            <div
                              key={itemName}
                              className="bg-orange-700/10 border border-orange-700/20 rounded-lg p-2 sm:p-3 hover:bg-orange-700/15 transition-colors duration-200"
                            >
                              <div className="flex justify-between items-start">
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-white text-xs sm:text-sm">
                                    {itemName}
                                  </p>
                                  <p className="text-orange-400 text-xs mt-1">
                                    All {batches.length} batch(es) depleted
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  <span className="inline-block px-2 py-0.5 bg-orange-600/30 text-orange-300 text-xs rounded">
                                    {batches[0]?.category || "N/A"}
                                  </span>
                                </div>
                              </div>
                              {/* Show batch details in collapsed view */}
                              <details className="mt-2">
                                <summary className="cursor-pointer text-orange-400 text-xs hover:text-orange-300">
                                  View batches
                                </summary>
                                <ul className="ml-3 mt-2 space-y-1">
                                  {batches.map((batch: any, idx: number) => (
                                    <li
                                      key={idx}
                                      className="text-xs text-gray-400"
                                    >
                                      <span className="text-orange-400">•</span>{" "}
                                      Batch {batch.batch_date || "N/A"}{" "}
                                      {batch.expiration_date &&
                                        `(exp: ${batch.expiration_date})`}
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            </div>
                          ))
                        )}
                      </div>
                    </section>

                    {/* Critical Stock */}
                    <section
                      aria-label="Critical Stock"
                      className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 border border-red-500"
                    >
                      <header className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="p-1.5 sm:p-2 bg-red-700/30 rounded-lg">
                          <FaExclamationTriangle className="text-red-400 text-base sm:text-lg" />
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-red-400">
                            Critical Stock
                          </h2>
                          <p className="text-red-200 text-xs">
                            These items are critically low and require immediate
                            restocking to prevent stockouts.
                          </p>
                        </div>
                      </header>
                      <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                        {criticalStockIngredients.length === 0 ? (
                          <div className="text-center py-3 sm:py-4">
                            <FaBoxes className="text-gray-500 text-lg sm:text-xl mx-auto mb-2" />
                            <p className="text-gray-400 text-xs sm:text-sm">
                              No critical stock items
                            </p>
                          </div>
                        ) : (
                          criticalStockIngredients.map(
                            (
                              item: {
                                id?: string | number;
                                item_id?: string | number;
                                item_name?: string;
                                stock_quantity?: number;
                                expiration_date?: string;
                                batch_date?: string;
                              },
                              idx: number
                            ) => (
                              <div
                                key={item.id || `${item.item_name}-${idx}`}
                                className="bg-red-700/10 border border-red-700/20 rounded-lg p-2 sm:p-3 hover:bg-red-700/15 transition-colors duration-200"
                              >
                                <div className="flex justify-between items-center">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-white text-xs sm:text-sm truncate">
                                      <span className="font-semibold">
                                        {item.item_name}
                                      </span>
                                      {item.batch_date && (
                                        <span className="text-gray-400 text-xs ml-2">
                                          (Batch: {item.batch_date})
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-red-300 text-xs">
                                      Stock:{" "}
                                      {typeof item.stock_quantity === "number"
                                        ? item.stock_quantity.toFixed(2)
                                        : item.stock_quantity}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-2">
                                    <p className="text-gray-400 text-xs">
                                      {item.expiration_date
                                        ? new Date(
                                            item.expiration_date
                                          ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })
                                        : "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </section>

                    {/* Low Stock */}
                    <section
                      aria-label="Low Stock"
                      className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 border border-yellow-500"
                    >
                      <header className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="p-1.5 sm:p-2 bg-yellow-700/30 rounded-lg">
                          <FaExclamationTriangle className="text-yellow-400 text-base sm:text-lg" />
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-yellow-400">
                            Low Stock
                          </h2>
                          <p className="text-yellow-200 text-xs">
                            These items are running low and may require
                            restocking soon to avoid shortages.
                          </p>
                        </div>
                      </header>
                      <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                        {lowStockIngredients.length === 0 ? (
                          <div className="text-center py-3 sm:py-4">
                            <FaBoxes className="text-gray-500 text-lg sm:text-xl mx-auto mb-2" />
                            <p className="text-gray-400 text-xs sm:text-sm">
                              All items well stocked
                            </p>
                          </div>
                        ) : (
                          lowStockIngredients.map(
                            (
                              item: {
                                id?: string | number;
                                item_id?: string | number;
                                item_name?: string;
                                stock_quantity?: number;
                                expiration_date?: string;
                                batch_date?: string;
                              },
                              idx: number
                            ) => (
                              <div
                                key={item.id || `${item.item_name}-${idx}`}
                                className="bg-yellow-700/10 border border-yellow-700/20 rounded-lg p-2 sm:p-3 hover:bg-yellow-700/15 transition-colors duration-200"
                              >
                                <div className="flex justify-between items-center">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-white text-xs sm:text-sm truncate">
                                      <span className="font-semibold">
                                        {item.item_name}
                                      </span>
                                      {item.batch_date && (
                                        <span className="text-gray-400 text-xs ml-2">
                                          (Batch: {item.batch_date})
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-yellow-300 text-xs">
                                      Stock:{" "}
                                      {typeof item.stock_quantity === "number"
                                        ? item.stock_quantity.toFixed(2)
                                        : item.stock_quantity}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-2">
                                    <p className="text-gray-400 text-xs">
                                      {item.expiration_date
                                        ? new Date(
                                            item.expiration_date
                                          ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })
                                        : "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Surplus */}
                  <section
                    aria-label="Surplus Stock"
                    className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 border border-green-500"
                  >
                    <header className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="p-1.5 sm:p-2 bg-green-700/30 rounded-lg">
                        <FaWarehouse className="text-green-400 text-base sm:text-lg" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-green-400">
                          Surplus Stock
                        </h2>
                        <p className="text-green-200 text-xs">
                          These items have higher than usual stock levels.
                          Consider using them in promotions or recipes to
                          optimize inventory and reduce waste.
                        </p>
                      </div>
                    </header>
                    <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                      {!surplus.data || surplus.data.length === 0 ? (
                        <div className="text-center py-3 sm:py-4">
                          <FaWarehouse className="text-gray-500 text-lg sm:text-xl mx-auto mb-2" />
                          <p className="text-gray-400 text-xs sm:text-sm">
                            No surplus items
                          </p>
                        </div>
                      ) : (
                        surplus.data?.map(
                          (
                            item: {
                              id?: string | number;
                              item_id?: string | number;
                              item_name?: string;
                              stock_quantity?: number;
                              expiration_date?: string;
                              batch_date?: string;
                            },
                            idx: number
                          ) => (
                            <div
                              key={item.id || `${item.item_name}-${idx}`}
                              className="bg-green-700/10 border border-green-700/20 rounded-lg p-2 sm:p-3 hover:bg-green-700/15 transition-colors duration-200"
                            >
                              <div className="flex justify-between items-center">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-white text-xs sm:text-sm truncate">
                                    <span className="font-semibold">
                                      {item.item_name}
                                    </span>
                                    {item.batch_date && (
                                      <span className="text-green-400 text-xs ml-2 font-normal">
                                        (Batch: {item.batch_date})
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-green-300 text-xs">
                                    Stock:{" "}
                                    {typeof item.stock_quantity === "number"
                                      ? item.stock_quantity.toFixed(2)
                                      : item.stock_quantity}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  <p className="text-gray-400 text-xs">
                                    {item.expiration_date
                                      ? new Date(
                                          item.expiration_date
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })
                                      : "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="expired">
                {/* Expired and Expiring Soon Tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Expired Ingredients Table - Left */}
                  <section
                    aria-label="Expired Ingredients"
                    className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 border border-red-700"
                  >
                    <header className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="p-1.5 sm:p-2 bg-red-700/30 rounded-lg">
                        <FaClock className="text-red-400 text-lg sm:text-xl" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-red-400">
                          Expired Items
                        </h2>
                        <p className="text-red-200 text-xs sm:text-sm">
                          These items have passed their expiration date and
                          should be removed from inventory to ensure safety and
                          compliance.
                        </p>
                      </div>
                    </header>
                    <div className="overflow-x-auto rounded-lg">
                      <table className="min-w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-red-900/40 border-b border-red-500/40">
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-red-300">
                              Name
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-red-300 hidden md:table-cell">
                              Batch Date
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-red-300 hidden sm:table-cell">
                              Category
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-red-300">
                              Stock
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-red-300">
                              Expiration Date
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-red-300">
                              Reason
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {!expired ||
                          !Array.isArray(expired.data) ||
                          expired.data.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="py-6 sm:py-8 px-4 text-center text-red-200"
                              >
                                <div className="flex flex-col items-center justify-center gap-2 w-full">
                                  <FaClock className="text-red-400 text-xl sm:text-2xl" />
                                  <p className="text-sm">
                                    No expired items found
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            paginatedExpiredItems.map(
                              (
                                item: {
                                  id?: string | number;
                                  item_id?: string | number;
                                  item_name?: string;
                                  category?: string;
                                  quantity_spoiled?: number;
                                  batch_date?: string;
                                  reason?: string;
                                  expiration_date?: string;
                                },
                                idx: number
                              ) => (
                                <tr
                                  key={
                                    item.id ||
                                    `${item.item_name}-${item.batch_date}-${idx}`
                                  }
                                  className="border-b border-red-900/40 hover:bg-red-900/10 transition-colors duration-200"
                                >
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-white">
                                    <div className="truncate max-w-[120px] sm:max-w-none">
                                      {item.item_name}
                                    </div>
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-red-200 hidden md:table-cell">
                                    {item.batch_date}
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-red-200 hidden sm:table-cell">
                                    {item.category || "N/A"}
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-700/30 text-red-200 rounded-full text-xs font-medium">
                                      {typeof item.quantity_spoiled === "number"
                                        ? item.quantity_spoiled.toFixed(2)
                                        : item.quantity_spoiled}
                                    </span>
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-red-200">
                                    <div className="text-xs">
                                      {item.expiration_date}
                                    </div>
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-red-200">
                                    <div className="text-xs">
                                      {item.reason || "Expired"}
                                    </div>
                                  </td>
                                </tr>
                              )
                            )
                          )}
                        </tbody>
                      </table>

                      {/* Pagination for Expired Items */}
                      {expiredItem.length > 0 && (
                        <Pagination
                          currentPage={expiredPage}
                          totalPages={expiredTotalPages}
                          onPageChange={setExpiredPage}
                          itemsPerPage={expiredItemsPerPage}
                          totalItems={expiredItem.length}
                          onItemsPerPageChange={setExpiredItemsPerPage}
                        />
                      )}
                    </div>
                  </section>

                  {/* Expiring Ingredients Table - Right */}
                  <section
                    aria-label="Expiring Ingredients"
                    className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 border border-amber-700"
                  >
                    <header className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="p-1.5 sm:p-2 bg-amber-700/30 rounded-lg">
                        <FaClock className="text-amber-400 text-lg sm:text-xl" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-amber-400">
                          Expiring Soon
                        </h2>
                        <p className="text-amber-200 text-xs sm:text-sm">
                          These items are approaching their expiration date and
                          should be used or restocked soon to prevent waste.
                        </p>
                      </div>
                    </header>
                    <div className="overflow-x-auto rounded-lg">
                      <table className="min-w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-amber-900/40 border-b border-amber-500/40">
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-amber-300">
                              Name
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-amber-300 hidden md:table-cell">
                              Batch Date
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-amber-300 hidden sm:table-cell">
                              Category
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-amber-300">
                              Stock
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-amber-300">
                              Expires
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {!expiring.data || expiring.data.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="py-6 sm:py-8 px-4 text-center text-amber-200"
                              >
                                <div className="flex flex-col items-center justify-center gap-2 w-full">
                                  <FaClock className="text-amber-400 text-xl sm:text-2xl" />
                                  <p className="text-sm">
                                    No expiring ingredients found
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            paginatedExpiringItems?.map(
                              (
                                item: {
                                  id?: string | number;
                                  item_id?: string | number;
                                  item_name?: string;
                                  stock_quantity?: number;
                                  expiration_date?: string;
                                  category?: string;
                                  batch_date?: string;
                                },
                                idx: number
                              ) => (
                                <tr
                                  key={
                                    item.id ||
                                    `${item.item_name}-${item.expiration_date}-${idx}`
                                  }
                                  className="border-b border-amber-900/40 hover:bg-amber-900/10 transition-colors duration-200"
                                >
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-white">
                                    <div className="truncate max-w-[120px] sm:max-w-none">
                                      {item.item_name}
                                    </div>
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-amber-200 hidden md:table-cell">
                                    {item.batch_date
                                      ? new Date(
                                          item.batch_date
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })
                                      : "N/A"}
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-amber-200 hidden sm:table-cell">
                                    {item.category || "N/A"}
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-700/30 text-amber-200 rounded-full text-xs font-medium">
                                      {typeof item.stock_quantity === "number"
                                        ? item.stock_quantity.toFixed(2)
                                        : item.stock_quantity}
                                    </span>
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-amber-200">
                                    <div className="text-xs">
                                      {item.expiration_date
                                        ? new Date(
                                            item.expiration_date
                                          ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year:
                                              typeof window !== "undefined" &&
                                              window.innerWidth < 640
                                                ? undefined
                                                : "numeric",
                                          })
                                        : "N/A"}
                                    </div>
                                  </td>
                                </tr>
                              )
                            )
                          )}
                        </tbody>
                      </table>

                      {/* Pagination for Expiring Items */}
                      {expiringIngredients.length > 0 && (
                        <Pagination
                          currentPage={expiringPage}
                          totalPages={expiringTotalPages}
                          onPageChange={setExpiringPage}
                          itemsPerPage={expiringItemsPerPage}
                          totalItems={expiringIngredients.length}
                          onItemsPerPageChange={setExpiringItemsPerPage}
                        />
                      )}
                    </div>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="calendar">
                <section
                  aria-label="Calendar Widget"
                  className="rounded-2xl shadow-none p-3 sm:p-4 lg:p-6
                   h-[55vh] w-full max-w-full mx-auto flex flex-col mb-8"
                >
                  <HolidayCalendar
                    holidays={customHolidays.data || []}
                    onAdd={handleAddHoliday}
                    onEdit={handleEditHoliday}
                  />

                  {modalOpen && (
                    <HolidayFormModal
                      initial={
                        modalEdit ||
                        (modalDate
                          ? { date: modalDate, name: "", description: "" }
                          : undefined)
                      }
                      isEdit={!!modalEdit}
                      onSave={handleSaveHoliday}
                      onCancel={handleCancelModal}
                      onDelete={modalEdit ? handleDeleteHoliday : undefined}
                    />
                  )}
                </section>
                {/* Add extra padding below the calendar tab */}
                <div className="pb-32" />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </ResponsiveMain>
    </section>
  );
}
