"use client";

import annotationPlugin from "chartjs-plugin-annotation";
import { useEffect, useState, useRef } from "react";
import { useDashboardQuery } from "./hook/useDashboardQuery";
import HolidayFormModal from "./Components/HolidayFormModal";
import { useMemo } from "react";
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

export default function Dashboard() {
  // Ref to store last chart data for deep comparison
  const lastChartDataRef = useRef<any>(null);
  const topSalesCanvasRef = useRef<HTMLCanvasElement>(null);
  const [filterType, setFilterType] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );
  const [topItemsCount, setTopItemsCount] = useState(5);
  const [showHistoricalView, setShowHistoricalView] = useState(false);

  // Use the combined analytics hook for better performance
  const { prediction, historical, loading, error } = useSalesAnalytics(
    filterType,
    topItemsCount
  );
  // Type guards for prediction/historical data
  const predictionData: import("./hook/useSalesPrediction").SalesPrediction[] =
    Array.isArray(prediction.data) ? prediction.data : [];
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
    expiring,
    surplus,
    expired,
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

  // Define variables for low stock and expiring ingredients
  const lowStockIngredients = lowStock.data || [];
  const expiringIngredients = expiring.data || [];
  const expiredItem = expired.data || [];

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEdit, setModalEdit] = useState<null | any>(null);
  const [modalDate, setModalDate] = useState<string | null>(null);

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
  // Interactive calendar section for custom holidays

  useEffect(() => {
    const topN = topItemsCount;
    const filteredData = predictionData.slice(0, topN);

    const chartDataString = JSON.stringify({ filteredData, filterType });
    if (
      loading ||
      !filteredData.length ||
      lastChartDataRef.current === chartDataString
    ) {
      // Skip if loading, no data, or data unchanged
      return;
    }
    lastChartDataRef.current = chartDataString;

    const canvas = topSalesCanvasRef.current;
    if (!canvas) {
      return;
    }

    // Destroy existing chart before creating new one
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    let chart: Chart | null = null;

    try {
      // Chart type and style logic
      let chartType: "bar" | "line" = "bar";
      let datasetOptions: any = {};
      if (filterType === "daily") {
        chartType = "line";
        datasetOptions = {
          backgroundColor: (color: string) => color + "33",
          borderColor: (color: string) => color,
          borderWidth: 2,
          tension: 0, // straight lines
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBorderWidth: 2,
        };
      } else if (filterType === "weekly") {
        chartType = "bar";
        datasetOptions = {
          backgroundColor: (color: string) => color + "66",
          borderWidth: 2,
          tension: 0,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
          pointBorderWidth: 0,
          barPercentage: 0.7,
          categoryPercentage: 0.7,
        };
      } else if (filterType === "monthly") {
        chartType = "line";
        datasetOptions = {
          backgroundColor: (color: string) => color + "33",
          borderWidth: 2,
          tension: 0.5,
          fill: { target: "origin", above: undefined }, // will set color below
          pointRadius: 6,
          pointHoverRadius: 10,
          pointBorderWidth: 2,
        };
      }

      // Ensure all datasets have the same labels and consistent data structure
      let allLabels = filteredData[0]?.week ?? [];
      // For daily, only show the last 7 dates (one week)
      if (filterType === "daily" && allLabels.length > 7) {
        allLabels = allLabels.slice(-7);
      }
      // For weekly, only show the last 4 weeks (about 1 month)
      if (filterType === "weekly" && allLabels.length > 4) {
        allLabels = allLabels.slice(-4);
      }
      // For monthly, only show the last 12 months (or less if not available)
      if (filterType === "monthly" && allLabels.length > 12) {
        allLabels = allLabels.slice(-12);
      }

      // Normalize datasets to ensure consistent data points
      const normalizedDatasets = filteredData.map((trend) => {
        // For daily, align sales data to last 7 days
        let salesData = trend.sales;
        if (filterType === "daily" && salesData.length > 7) {
          salesData = salesData.slice(-7);
        }
        // For weekly, align sales data to last 4 weeks
        if (filterType === "weekly" && salesData.length > 4) {
          salesData = salesData.slice(-4);
        }
        // For monthly, align sales data to last 12 months
        if (filterType === "monthly" && salesData.length > 12) {
          salesData = salesData.slice(-12);
        }
        const normalizedSales = allLabels.map(
          (_: string, index: number) => salesData[index] || 0
        );
        let base: any = {
          label: trend.name,
          data: normalizedSales,
        };
        if (filterType === "daily") {
          base = {
            ...base,
            borderColor: datasetOptions.borderColor(trend.color),
            backgroundColor: datasetOptions.backgroundColor(trend.color),
            borderWidth: datasetOptions.borderWidth,
            tension: datasetOptions.tension,
            fill: datasetOptions.fill,
            pointRadius: datasetOptions.pointRadius,
            pointHoverRadius: datasetOptions.pointHoverRadius,
            pointBackgroundColor: trend.color,
            pointBorderColor: "#fff",
            pointBorderWidth: datasetOptions.pointBorderWidth,
          };
        } else if (filterType === "weekly") {
          base = {
            ...base,
            borderColor: trend.color,
            backgroundColor: datasetOptions.backgroundColor(trend.color),
            borderWidth: datasetOptions.borderWidth,
            tension: datasetOptions.tension,
            fill: datasetOptions.fill,
            pointRadius: datasetOptions.pointRadius,
            pointHoverRadius: datasetOptions.pointHoverRadius,
            pointBackgroundColor: trend.color,
            pointBorderColor: "#fff",
            pointBorderWidth: datasetOptions.pointBorderWidth,
            barPercentage: datasetOptions.barPercentage,
            categoryPercentage: datasetOptions.categoryPercentage,
          };
        } else if (filterType === "monthly") {
          base = {
            ...base,
            borderColor: trend.color,
            backgroundColor: datasetOptions.backgroundColor(trend.color),
            borderWidth: datasetOptions.borderWidth,
            tension: datasetOptions.tension,
            fill: { target: "origin", above: trend.color + "20" },
            pointRadius: datasetOptions.pointRadius,
            pointHoverRadius: datasetOptions.pointHoverRadius,
            pointBackgroundColor: trend.color,
            pointBorderColor: "#fff",
            pointBorderWidth: datasetOptions.pointBorderWidth,
          };
        }
        return base;
      });

      chart = new Chart(canvas, {
        type: chartType,
        data: {
          labels: allLabels,
          datasets: normalizedDatasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            },
          },
          // Ensure consistent data alignment
          skipNull: false,
          spanGaps: false,
          elements: {
            bar: {
              borderWidth: 2,
            },
          },
          interaction: {
            intersect: false,
            mode: "index",
          },
          plugins: {
            title: {
              display: false,
            },
            legend: {
              display: true,
              position: "top",
              align: "start",
              maxHeight: 120,
              labels: {
                color: "#fff",
                font: { size: 11, weight: 500 },
                padding: 8,
                usePointStyle: true,
                pointStyle: "circle",
                boxWidth: 10,
                boxHeight: 10,
                textAlign: "left",
                generateLabels: function (chart: any) {
                  const original =
                    Chart.defaults.plugins.legend.labels.generateLabels;
                  const labels = original.call(this, chart);

                  const truncatedLabels = labels.map((label: any) => {
                    if (label.text && label.text.length > 35) {
                      label.text = label.text.substring(0, 32) + "...";
                    }
                    return label;
                  });

                  return truncatedLabels;
                },
              },
            },
            tooltip: {
              backgroundColor: "rgba(0,0,0,0.95)",
              titleFont: { size: 14, weight: 600 },
              bodyFont: { size: 12 },
              padding: 15,
              cornerRadius: 10,
              displayColors: true,
              usePointStyle: true,
              borderColor: "#fbbf24",
              borderWidth: 2,
              multiKeyBackground: "rgba(0,0,0,0.8)",
              filter: function (tooltipItem: any) {
                // Only show tooltip items that have sales > 0
                return tooltipItem.parsed.y > 0;
              },
              callbacks: {
                title: function (context: any) {
                  return context[0].label || "";
                },
                label: function (context: any) {
                  // Show full dataset label (menu item name) in tooltip
                  const label = context.dataset.label || "";
                  const value = context.parsed.y;
                  return `${label}: ${value} sales`;
                },
                afterLabel: function (context: any) {
                  // Calculate percentage only from items with sales > 0
                  const dataIndex = context.dataIndex;
                  const total = context.chart.data.datasets.reduce(
                    (sum: number, dataset: any) => {
                      const value = dataset.data[dataIndex] || 0;
                      return sum + (value > 0 ? value : 0);
                    },
                    0
                  );
                  if (total > 0 && context.parsed.y > 0) {
                    const percentage = (
                      (context.parsed.y / total) *
                      100
                    ).toFixed(1);
                    return `${percentage}% of total`;
                  }
                  return "";
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: "#374151",
                lineWidth: 1,
                display: true,
              },
              ticks: {
                color: "#d1d5db",
                font: { size: 11 },
                padding: 4,
              },
              border: { display: false },
            },
            x: {
              type: "category",
              grid: {
                display: false,
              },
              ticks: {
                color: "#d1d5db",
                font: { size: 11 },
                padding: 4,
                maxRotation: 0,
                minRotation: 0,
              },
              border: { display: false },
            },
          },
          animation: {
            duration: 800,
            easing: "easeInOutQuart",
          },
        },
      });
    } catch (error) {
      console.error("Chart creation failed:", error);
    }

    const handleResize = () => {
      if (chart) {
        try {
          chart.resize();
        } catch (error) {
          console.error("Chart resize failed:", error);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chart) {
        try {
          chart.destroy();
        } catch (error) {
          console.error("Chart destroy failed:", error);
        }
      }
    };
  }, [prediction.data, loading, filterType, topItemsCount]);

  // End of useEffect for top sales chart
  // <-- Add this closing brace to end the useEffect, restoring function structure

  const renderFilterButtons = () => (
    <div className="w-full sm:w-auto">
      {/* First row: Time period buttons */}
      <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-0">
        {["daily", "weekly", "monthly"].map((type) => (
          <button
            key={type}
            onClick={() =>
              setFilterType(type as "daily" | "weekly" | "monthly")
            }
            className={`text-xs sm:text-sm font-semibold px-2 xs:px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 flex-1 sm:flex-none min-w-0 ${
              filterType === type
                ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30"
                : "text-gray-300 hover:text-white hover:bg-gray-700/50 border border-gray-600"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Second row: Controls */}
      <div className="flex flex-wrap mt-5 items-center gap-2 sm:gap-3 justify-between sm:justify-start">
        <div className="flex items-center gap-2">
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
        </div>

        <button
          onClick={() => setShowHistoricalView(!showHistoricalView)}
          className={`text-xs sm:text-sm font-semibold px-2 xs:px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
            showHistoricalView
              ? "bg-blue-500 text-white"
              : "text-gray-300 hover:text-white border border-gray-600"
          }`}
        >
          <MdInsights className="inline mr-1" />
          <span className="hidden xs:inline">
            {showHistoricalView ? "Hide" : "Show"}
          </span>
          <span className="xs:hidden">
            {showHistoricalView ? "Hide Top Performers" : "Show Top Performers"}
          </span>
        </button>
      </div>
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

  const renderHistoricalInsights = () => {
    if (!showHistoricalView || !historicalData) return null;

    // Determine how many top performers to show based on topItemsCount
    const count = topItemsCount;
    const performers = historicalData.top_performers.by_total_sales;

    return (
      <section className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-4 mb-6 border border-blue-500/30">
        <header className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <FaChartBar className="text-yellow-400 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-300">Top Performers</h3>
          </div>
        </header>
        <div className="bg-black/40 rounded-lg p-3">
          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
            <FaChartBar className="text-yellow-400" />
            Top Performers
          </h4>
          <div className="space-y-2">
            {performers.slice(0, count).map(
              (
                item: {
                  item: string;
                  total_sales: number;
                  avg_sales: number;
                  frequency: number;
                },
                idx: number
              ) => (
                <div
                  key={item.item}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-300 truncate">{item.item}</span>
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {item.total_sales}
                    </div>
                    <div className="text-gray-400 text-xs">
                      Avg: {item.avg_sales}
                    </div>
                  </div>
                </div>
              )
            )}
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
    salesDataLength: prediction.data.length,
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
            <header className="mb-6 sm:mb-8">
              <div className="flex flex-row items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="p-2.5 sm:p-3 bg-black rounded-full shadow-lg">
                  <MdDashboard className="text-2xl sm:text-2xl lg:text-3xl xl:text-3xl text-yellow-400" />
                </div>
                <h1 className="text-3xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-4xl font-bold text-black font-poppins leading-tight">
                  Dashboard
                </h1>
                <HiSparkles className="text-black text-xl sm:text-2xl lg:text-3xl animate-pulse" />

                {/* Sync Button */}
                <div className="ml-auto hidden sm:block">
                  <SyncButton
                    onSync={() => window.location.reload()}
                    isLoading={false}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Offline Data Banner */}
              {inventoryFromCache && (
                <OfflineDataBanner
                  dataType="dashboard and inventory"
                  isFromCache={inventoryFromCache}
                  className="mb-4"
                />
              )}

              {!isOnline && (
                <aside
                  className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-4"
                  aria-live="polite"
                >
                  <div className="flex items-center">
                    <FiWifiOff className="text-yellow-600 mr-2" />
                    <div>
                      <p className="text-yellow-800 font-medium text-sm">
                        You're currently offline
                      </p>
                      <p className="text-yellow-700 text-xs mt-1">
                        Some data may be from cache. Connection will restore
                        automatically.
                      </p>
                    </div>
                  </div>
                </aside>
              )}

              <p className="text-lg sm:text-xl md:text-2xl text-gray-700 font-medium leading-relaxed">
                Monitor your inventory stock and historical sales performance
              </p>
            </header>

            {/* Stats Cards */}
            <section
              aria-label="Inventory Stats"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8"
            >
              <OfflineCard
                isFromCache={inventoryFromCache}
                lastUpdated={
                  lastDataUpdate ? String(lastDataUpdate) : undefined
                }
                dataType="inventory"
              >
                <StatCard
                  icon={<FaClock className="text-red-400 text-lg sm:text-xl" />}
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
                  icon={<FaClock className="text-red-400 text-lg sm:text-xl" />}
                  title="Expiring Soon"
                  count={expiringIngredients.length}
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
                    <FaExclamationTriangle className="text-orange-400 text-lg sm:text-xl" />
                  }
                  title="Low Stock Items"
                  count={lowStockIngredients.length}
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
                    <FaWarehouse className="text-yellow-400 text-lg sm:text-xl" />
                  }
                  title="Surplus Items"
                  count={surplus.data?.length ?? 0}
                  color="border-l-yellow-500"
                  bgColor="bg-black/75"
                />
              </OfflineCard>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
              <section className="xl:col-span-8 flex flex-col gap-4 sm:gap-6">
                {/* Chart Card: Top Selling Items */}
                <section
                  aria-label="Sales Analytics"
                  className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 border border-gray-400"
                >
                  <header className="mb-3 sm:mb-4 lg:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="p-1.5 sm:p-2 bg-yellow-400/20 rounded-lg flex-shrink-0">
                        <FaChartLine className="text-yellow-400 text-lg sm:text-xl" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-white">
                          Top Selling Items
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          Track your top performing items
                        </p>
                      </div>
                    </div>
                    <div className="w-full">{renderFilterButtons()}</div>
                  </header>
                  <div className="w-full h-56 xs:h-64 sm:h-72 md:h-80 lg:h-88 xl:h-[28rem] bg-gray-900/50 rounded-xl border border-gray-700">
                    {loading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-pulse text-center">
                          <div className="w-12 sm:w-16 h-12 sm:h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto">
                            <MdTrendingUp className="text-yellow-400 text-xl sm:text-2xl animate-bounce" />
                          </div>
                          <p className="text-gray-400 text-center mt-3 sm:mt-4 text-sm">
                            Loading historical sales data...
                          </p>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-red-400">
                          <p className="text-lg font-semibold">
                            Failed to load chart
                          </p>
                          <p className="text-sm mt-2">{String(error)}</p>
                        </div>
                      </div>
                    ) : !predictionData.length ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <p className="text-lg font-semibold">
                            No sales data available
                          </p>
                          <p className="text-sm mt-2">
                            Try changing the date range or check back later.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <canvas
                        ref={topSalesCanvasRef}
                        className="w-full h-full "
                      />
                    )}
                  </div>
                  <div className="mt-6">{renderHistoricalInsights()}</div>
                </section>

                <section
                  aria-label="ML Sales Forecast"
                  className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl 
             p-4 sm:p-6 border border-gray-500/40 flex flex-col"
                >
                  s{/* Header */}
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
                              Forecasts are estimates only and may not be 100%
                              accurate.
                            </span>
                          </span>
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                          Actual vs Predicted Sales
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        (window.location.href = "/Features/Report/Report_Sales")
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

                {/* Expired Ingredients Table */}
                <section
                  aria-label="Expired Ingredients"
                  className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 border border-pink-600/60"
                >
                  <header className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="p-1.5 sm:p-2 bg-red-700/30 rounded-lg">
                      <MdWarning className="text-red-400 text-lg sm:text-xl" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-red-500">
                        Expired Stock
                      </h2>
                      <p className="text-pink-200 text-xs sm:text-sm">
                        Items that have already expired and need to be removed
                      </p>
                    </div>
                  </header>
                  <div className="overflow-x-auto rounded-lg">
                    <table className="min-w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-pink-900/40 border-b border-red-600/40">
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-red-400">
                            Id
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-red-400">
                            Name
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-red-400 hidden sm:table-cell">
                            Category
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-red-400">
                            Stock
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-red-400 hidden md:table-cell">
                            Batch Date
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-red-400">
                            Expired
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {!expired.data || expired.data.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-6 sm:py-8 px-4 text-center text-red-300"
                            >
                              <div className="flex flex-col items-center justify-center gap-2 w-full">
                                <MdWarning className="text-red-400 text-xl sm:text-2xl" />
                                <p className="text-sm">
                                  No expired ingredients found
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          expired.data?.map(
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
                                className="border-b border-pink-900/40 hover:bg-pink-900/10 transition-colors duration-200"
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
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-red-200 hidden sm:table-cell">
                                  {item.category || "N/A"}
                                </td>
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-700/30 text-red-200 rounded-full text-xs font-medium">
                                    {item.stock_quantity}
                                  </span>
                                </td>
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-red-200 hidden md:table-cell">
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
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-red-200">
                                  <div className="text-xs">
                                    {item.expiration_date
                                      ? new Date(
                                          item.expiration_date
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year:
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

                {/* Expiring Ingredients Table */}
                <section
                  aria-label="Expiring Ingredients"
                  className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 border border-orange-500/60"
                >
                  <header className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="p-1.5 sm:p-2 bg-orange-700/30 rounded-lg">
                      <FaClock className="text-orange-400 text-lg sm:text-xl" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-orange-400">
                        Expiring Soon
                      </h2>
                      <p className="text-orange-200 text-xs sm:text-sm">
                        Items requiring immediate attention
                      </p>
                    </div>
                  </header>
                  <div className="overflow-x-auto rounded-lg">
                    <table className="min-w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-orange-900/40 border-b border-orange-500/40">
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-orange-300">
                            Id
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-orange-300">
                            Name
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-orange-300 hidden sm:table-cell">
                            Category
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-orange-300">
                            Stock
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-orange-300 hidden md:table-cell">
                            Batch Date
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-orange-300">
                            Expires
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {!expiring.data || expiring.data.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-6 sm:py-8 px-4 text-center text-orange-200"
                            >
                              <div className="flex flex-col items-center justify-center gap-2 w-full">
                                <FaClock className="text-orange-400 text-xl sm:text-2xl" />
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
                                className="border-b border-orange-900/40 hover:bg-orange-900/10 transition-colors duration-200"
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
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-orange-200 hidden sm:table-cell">
                                  {item.category || "N/A"}
                                </td>
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-orange-700/30 text-orange-200 rounded-full text-xs font-medium">
                                    {item.stock_quantity}
                                  </span>
                                </td>
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-orange-200 hidden md:table-cell">
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
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-orange-200">
                                  <div className="text-xs">
                                    {item.expiration_date
                                      ? new Date(
                                          item.expiration_date
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year:
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
              </section>

              {/* Right Sidebar */}
              <aside
                className="xl:col-span-4 flex flex-col gap-4 sm:gap-6 mt-4 xl:mt-0"
                aria-label="Inventory Sidebar"
              >
                {/* Calendar Widget */}
                <section
                  aria-label="Calendar Widget"
                  className=" rounded-2xl shadow-xl p-2 sm:p-3"
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
                      <p className="text-yellow-200 text-xs">Need restocking</p>
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
                                  <span className="mx-1 text-gray-400">|</span>
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
                      <p className="text-green-200 text-xs">Excess inventory</p>
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
                                  <span className="mx-1 text-gray-400">|</span>
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
              </aside>
            </div>
          </div>
        </main>
      </ResponsiveMain>
    </section>
  );
}
