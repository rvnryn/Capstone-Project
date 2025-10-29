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
import Chart from "chart.js/auto";
import NavigationBar from "@/app/components/navigation/navigation";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { usePWA } from "@/app/hooks/usePWA";
import { useOfflineDataManager } from "@/app/hooks/useOfflineDataManager";
import {
  OfflineDataBanner,
  OfflineCard,
  OfflineLoading,
  OfflineError,
  SyncButton,
} from "@/app/components/OfflineComponents";
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
} from "react-icons/fa";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { FiWifiOff, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import {
  MdDashboard,
  MdTrendingUp,
  MdInsights,
  MdWarning,
} from "react-icons/md";
import { HiSparkles } from "react-icons/hi";
import { GiBiohazard } from "react-icons/gi";

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
  // Ref to store last chart data for deep comparison
  const lastChartDataRef = useRef<any>(null);
  const topSalesCanvasRef = useRef<HTMLCanvasElement>(null);
  // Removed showHistoricalView; always show Top Performers

  // Use only historical analytics for Top Selling
  // Map period to days
  const periodDays =
    filterType === "daily" ? 1 : filterType === "weekly" ? 7 : 30;
  const { historical, loading, error } = useSalesAnalytics(
    filterType,
    topItemsCount,
    periodDays // If your hook supports this, otherwise just filterType
  );
  const historicalData:
    | import("./hook/useSalesPrediction").HistoricalAnalysis
    | null =
    historical.data &&
    typeof historical.data === "object" &&
    "overview" in historical.data
      ? (historical.data as import("./hook/useSalesPrediction").HistoricalAnalysis)
      : null;

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

  // Define variables for inventory cache status and last update
  const inventoryFromCache =
    (lowStock && "isFromCache" in lowStock && (lowStock as any).isFromCache) ||
    (expiring && "isFromCache" in expiring && (expiring as any).isFromCache) ||
    (surplus && "isFromCache" in surplus && (surplus as any).isFromCache) ||
    (expired && "isFromCache" in expired && (expired as any).isFromCache) ||
    false;
  const lastDataUpdate =
    lowStock.dataUpdatedAt ||
    expiring.dataUpdatedAt ||
    surplus.dataUpdatedAt ||
    expired.dataUpdatedAt ||
    null;

  // Define variables for low stock, out of stock, and expiring ingredients
  type InventoryIngredient = {
    item_id: string | number;
    item_name: string;
    [key: string]: any;
  };
  const lowStockIngredients: InventoryIngredient[] = lowStock.data || [];
  const outOfStockItems = outOfStock?.data || [];
  const expiringIngredients = expiring.data || [];
  const expiredItem = expired.data || [];

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEdit, setModalEdit] = useState<null | any>(null);
  const [modalDate, setModalDate] = useState<string | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);

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
    // Period label for UI
    const periodLabel =
      filterType === "daily"
        ? "daily"
        : filterType === "weekly"
        ? "weekly"
        : "monthly";
    if (!performers.length) {
      return (
        <section className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-4 mb-6 border border-blue-500/30">
          <div className="bg-black/40 rounded-lg p-3 flex flex-col items-center justify-center min-h-[120px]">
            <FaChartBar className="text-blue-300 text-3xl mb-2" />
            <p className="text-gray-400 text-sm">
              No sales data available for top selling items.
            </p>
          </div>
        </section>
      );
    }
    return (
      <section className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-4 mb-6 border border-blue-500/30">
        <div className="bg-black/40 rounded-lg p-3">
          <div className="mb-2">
            <span className="text-xs text-blue-200">
              Based on{" "}
              <span className="font-semibold text-blue-100">{periodLabel}</span>{" "}
              historical analytics.
            </span>
          </div>
          <div
            className={`space-y-2 transition-opacity duration-200 ${
              showList ? "opacity-100" : "opacity-0"
            }`}
          >
            {performers.slice(0, count).map((item: any, idx: number) => {
              // Calculate total and average for the selected period
              const total = item.total_sales;
              const avg = item.avg_sales;
              let avgLabel = "Avg";
              if (filterType === "daily") avgLabel = "Avg/day";
              else if (filterType === "weekly") avgLabel = "Avg/week";
              else if (filterType === "monthly") avgLabel = "Avg/month";
              return (
                <div
                  key={item.item}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-300 truncate flex items-center gap-2">
                    <span className="font-bold text-blue-300">{idx + 1}.</span>
                    {item.item}
                  </span>
                  <div className="text-right">
                    <div className="text-white font-medium">{total}</div>
                    <div className="text-gray-400 text-xs">
                      {avgLabel}: {avg}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
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

  const offlineDataManager = useOfflineDataManager();

  const { isOnline } = usePWA();

  console.log("Dashboard State:", {
    loading,
    isOnline,
    historicalData: historical.data ? "loaded" : "none",
    lowStockCount: lowStock.data?.length,
    expiringCount: expiring.data?.length,
    expiredCount: expired.data?.length,
    surplusCount: surplus.data?.length,
    filterType,
  });

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
        className="w-full h-auto bg-gradient-to-br from-black/95 to-slate-800
                 rounded-2xl shadow-2xl border border-slate-700 p-4 sm:p-6 flex flex-col"
      >
        {/* Chart / States */}
        <div className="flex-1 flex items-center justify-center min-h-[16rem] sm:min-h-[20rem] relative">
          {mlLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
              <div className="w-14 h-14 bg-yellow-400/20 rounded-full flex items-center justify-center">
                <MdTrendingUp className="text-yellow-400 text-2xl animate-bounce" />
              </div>
              <p className="text-gray-400 text-sm">
                Loading ML forecast data...
              </p>
            </div>
          ) : mlChartData ? (
            <>
              <canvas ref={mlForecastCanvasRef} className="w-full h-full" />
            </>
          ) : (
            <div className="text-center text-gray-500">
              <MdTrendingUp className="mx-auto text-4xl mb-2 opacity-50" />
              <p className="text-sm">No forecast data available.</p>
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
              <SyncButton
                onSync={() => window.location.reload()}
                isLoading={false}
              />
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
                    {/* Offline Data Banner */}
                    {inventoryFromCache && (
                      <OfflineDataBanner
                        dataType="dashboard and inventory"
                        isFromCache={inventoryFromCache}
                      />
                    )}
                    <OfflineCard
                      isFromCache={inventoryFromCache}
                      lastUpdated={
                        lastDataUpdate ? String(lastDataUpdate) : undefined
                      }
                      dataType="inventory"
                    >
                      <StatCard
                        icon={
                          <FaClock className="text-red-400 text-lg sm:text-xl" />
                        }
                        title="Expired Items"
                        count={expiredItem.length}
                        color="border-l-red-500"
                        bgColor="bg-black/75"
                      />
                    </OfflineCard>

                    <OfflineCard
                      isFromCache={inventoryFromCache}
                      lastUpdated={
                        lastDataUpdate ? String(lastDataUpdate) : undefined
                      }
                      dataType="inventory"
                    >
                      <StatCard
                        icon={
                          <FaClock className="text-amber-400 text-lg sm:text-xl" />
                        }
                        title="Expiring Soon"
                        count={expiringIngredients.length}
                        color="border-l-amber-500"
                        bgColor="bg-black/75"
                      />
                    </OfflineCard>

                    <OfflineCard
                      isFromCache={inventoryFromCache}
                      lastUpdated={
                        lastDataUpdate ? String(lastDataUpdate) : undefined
                      }
                      dataType="inventory"
                    >
                      <StatCard
                        icon={
                          <GiBiohazard className="text-pink-400 text-lg sm:text-xl" />
                        }
                        title="Spoilage"
                        count={spoilage?.data?.length ?? 0}
                        color="border-l-pink-500"
                        bgColor="bg-black/75"
                      />
                    </OfflineCard>

                    <OfflineCard
                      isFromCache={inventoryFromCache}
                      lastUpdated={
                        lastDataUpdate ? String(lastDataUpdate) : undefined
                      }
                      dataType="inventory"
                    >
                      <StatCard
                        icon={
                          <FaExclamationTriangle className="text-orange-400 text-lg sm:text-xl" />
                        }
                        title="Out of Stock Items"
                        count={outOfStockItems.length}
                        color="border-l-orange-500"
                        bgColor="bg-black/75"
                      />
                    </OfflineCard>

                    <OfflineCard
                      isFromCache={inventoryFromCache}
                      lastUpdated={
                        lastDataUpdate ? String(lastDataUpdate) : undefined
                      }
                      dataType="inventory"
                    >
                      <StatCard
                        icon={
                          <FaExclamationTriangle className="text-yellow-400 text-lg sm:text-xl" />
                        }
                        title="Low Stock Items"
                        count={lowStockIngredients.length}
                        color="border-l-yellow-500"
                        bgColor="bg-black/75"
                      />
                    </OfflineCard>

                    <OfflineCard
                      isFromCache={inventoryFromCache}
                      lastUpdated={
                        lastDataUpdate ? String(lastDataUpdate) : undefined
                      }
                      dataType="inventory"
                    >
                      <StatCard
                        icon={
                          <FaExclamationTriangle className="text-green-400 text-lg sm:text-xl" />
                        }
                        title="Surplus Items"
                        count={surplus.data?.length ?? 0}
                        color="border-l-green-500"
                        bgColor="bg-black/75"
                      />
                    </OfflineCard>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section
                      aria-label="Top Selling Items"
                      className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl 
                      p-4 sm:p-6 flex flex-col"
                    >
                      <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3 w-full">
                          <div className="p-2 bg-yellow-400/20 rounded-lg flex-shrink-0">
                            <FaChartBar className="text-yellow-400 text-lg sm:text-xl" />
                          </div>
                          <div>
                            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                              Top Selling Items
                            </h2>
                            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                              Based on historical analytics
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            (window.location.href =
                              "/Features/Report/Report_Sales")
                          }
                          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black 
                        font-semibold text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-lg shadow 
                        transition-all duration-200 w-full sm:w-auto justify-center"
                          title="Go to Sales Report"
                        >
                          <FaChartBar className="text-sm" />
                          <span className="hidden sm:inline">
                            View Full Report
                          </span>
                          <span className="inline sm:hidden">Report</span>
                        </button>
                      </header>
                      <div className="w-full sm:w-auto mb-2">
                        {renderTopItemsCountSelector()}
                      </div>
                      <div className="mt-3 sm:mt-4 w-full overflow-x-auto">
                        <div className="min-w-[220px] sm:min-w-0">
                          {renderTopSelling(showList)}
                        </div>
                      </div>
                    </section>

                    {/* Left: ML Sales Forecast Chart */}
                    <section
                      aria-label="ML Sales Forecast"
                      className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl 
                  p-4 sm:p-6 flex flex-col"
                    >
                      {/* Header */}
                      <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="p-2 bg-yellow-400/20 rounded-lg flex-shrink-0">
                            <FaChartLine className="text-yellow-400 text-lg sm:text-xl" />
                          </div>
                          <div>
                            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                              Sales Forecast
                              <span className="relative group cursor-help">
                                <AiOutlineInfoCircle
                                  size={18}
                                  className="text-yellow-400"
                                  aria-label="Forecast info"
                                  tabIndex={0}
                                />
                                <span
                                  role="tooltip"
                                  className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-max min-w-[200px] sm:min-w-[240px] 
                              bg-black/90 text-yellow-100 text-xs rounded-lg px-3 py-2 shadow-lg border border-yellow-500 
                              opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 
                              pointer-events-none transition-opacity duration-200"
                                >
                                  Forecasts are estimates only and may not be
                                  100% accurate.
                                </span>
                              </span>
                            </h2>
                            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                              Compare actual sales with machine learning
                              predictions for each week. Highlighted weeks
                              indicate official or custom holidays.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            (window.location.href =
                              "/Features/Report/Report_Sales")
                          }
                          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black 
                      font-semibold text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-lg shadow 
                      transition-all duration-200 w-full sm:w-auto justify-center"
                          title="Go to Sales Report"
                        >
                          <FaChartLine className="text-sm" />
                          View Full Report
                        </button>
                      </header>
                      {/* Chart Area */}
                      <div
                        className="w-full relative aspect-[2/1] xs:aspect-[2.2/1] sm:aspect-[2.5/1] 
                    md:aspect-[2.8/1] lg:aspect-[3/1] xl:aspect-[3.5/1] flex items-center justify-center p-3"
                      >
                        <div className="w-full h-full min-h-[200px] flex items-center justify-center">
                          <MLForecastChart />
                        </div>
                      </div>
                      {/* Legend */}
                      <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
                        <span className="flex items-center gap-1 text-blue-300">
                          <span className="inline-block w-3 h-3 rounded-full bg-blue-400" />
                          Official Holiday
                        </span>
                        <span className="flex items-center gap-1 text-pink-300">
                          <span className="inline-block w-3 h-3 rounded-full bg-pink-400" />
                          Custom Holiday
                        </span>
                      </div>
                    </section>
                    {/* Right: (empty for now, or add more content here if needed) */}
                    <div />
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
                                  </div>
                                  <div className="text-xs text-pink-300">
                                    Qty: {item.quantity_spoiled}
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
                    {/* Out of Stock List */}
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
                            These items are currently out of stock and
                            unavailable for use or sale. Please reorder or
                            restock as soon as possible to avoid disruptions.
                          </p>
                        </div>
                      </header>
                      <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                        {!outOfStockItems.length ? (
                          <div className="text-center py-3 sm:py-4">
                            <FaBoxes className="text-orange-500 text-lg sm:text-xl mx-auto mb-2" />
                            <p className="text-orange-400 text-xs sm:text-sm">
                              No items are currently out of stock
                            </p>
                          </div>
                        ) : (
                          outOfStockItems.map(
                            (
                              item: {
                                id?: string | number;
                                item_id?: string | number;
                                item_name?: string;
                                stock_quantity?: number;
                                expiration_date?: string;
                              },
                              idx: number
                            ) => (
                              <div
                                key={item.id || `${item.item_name}-${idx}`}
                                className="bg-orange-700/10 border border-orange-700/20 rounded-lg p-2 sm:p-3 hover:bg-orange-700/15 transition-colors duration-200"
                              >
                                <div className="flex justify-between items-center">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-white text-xs sm:text-sm truncate">
                                      <span className="text-orange-300 font-semibold">
                                        ID:
                                      </span>{" "}
                                      {item.item_id}
                                      <span className="mx-1 text-orange-400">
                                        |
                                      </span>
                                      <span className="font-semibold">
                                        {item.item_name}
                                      </span>
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-2">
                                    <p className="text-orange-400 text-xs">
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
                        {!lowStock.data || lowStock.data.length === 0 ? (
                          <div className="text-center py-3 sm:py-4">
                            <FaBoxes className="text-gray-500 text-lg sm:text-xl mx-auto mb-2" />
                            <p className="text-gray-400 text-xs sm:text-sm">
                              All items well stocked
                            </p>
                          </div>
                        ) : (
                          lowStock.data?.map(
                            (
                              item: {
                                id?: string | number;
                                item_id?: string | number;
                                item_name?: string;
                                stock_quantity?: number;
                                expiration_date?: string;
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
                                      <span className="text-yellow-300 font-semibold">
                                        ID:
                                      </span>{" "}
                                      {item.item_id}
                                      <span className="mx-1 text-gray-400">
                                        |
                                      </span>
                                      <span className="font-semibold">
                                        {item.item_name}
                                      </span>
                                    </p>
                                    <p className="text-yellow-300 text-xs">
                                      Stock: {item.stock_quantity}
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
                                    <span className="text-green-300 font-semibold">
                                      ID:
                                    </span>{" "}
                                    {item.item_id}
                                    <span className="mx-1 text-gray-400">
                                      |
                                    </span>
                                    <span className="font-semibold">
                                      {item.item_name}
                                    </span>
                                  </p>
                                  <p className="text-green-300 text-xs">
                                    Stock: {item.stock_quantity}
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
                              Id
                            </th>
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
                                colSpan={6}
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
                            expired.data.map(
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
                                      {item.item_id}
                                    </div>
                                  </td>
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
                                      {item.quantity_spoiled}
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
                              Id
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-amber-300">
                              Name
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-amber-300 hidden sm:table-cell">
                              Category
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-amber-300">
                              Stock
                            </th>
                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-amber-300 hidden md:table-cell">
                              Batch Date
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
                                colSpan={6}
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
                            expiring.data?.map(
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
                                      {item.item_id}
                                    </div>
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-white">
                                    <div className="truncate max-w-[120px] sm:max-w-none">
                                      {item.item_name}
                                    </div>
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-amber-200 hidden sm:table-cell">
                                    {item.category || "N/A"}
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-700/30 text-amber-200 rounded-full text-xs font-medium">
                                      {item.stock_quantity}
                                    </span>
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
