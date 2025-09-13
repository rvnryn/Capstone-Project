"use client";
import { useEffect, useState, useRef } from "react";
import { useDashboardAPI } from "./hook/use-dashboardAPI";
import {
  useSalesPrediction,
  useHistoricalAnalysis,
  useSalesAnalytics,
} from "./hook/useSalesPrediction";
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
} from "react-icons/fa";
import { FiWifiOff, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { MdDashboard, MdTrendingUp, MdInsights } from "react-icons/md";
import { HiSparkles } from "react-icons/hi";

export default function Dashboard() {
  const topSalesCanvasRef = useRef<HTMLCanvasElement>(null);
  const [filterType, setFilterType] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );
  const [topItemsCount, setTopItemsCount] = useState(6);
  const [showHistoricalView, setShowHistoricalView] = useState(false);

  // Use the combined analytics hook for better performance
  const { prediction, historical, loading, fetchAll } = useSalesAnalytics();

  const [lowStockIngredients, setLowStockIngredients] = useState<any[]>([]);
  const [expiringIngredients, setExpiringIngredients] = useState<any[]>([]);
  const { fetchLowStock, fetchExpiring, fetchSurplus } = useDashboardAPI();
  const [surplusIngredients, setSurplusIngredients] = useState<any[]>([]);

  const { isOnline } = usePWA();

  // Fetch analytics data with historical analysis
  useEffect(() => {
    fetchAll(filterType, topItemsCount, 90); // 90 days of historical data
    const interval = setInterval(() => {
      fetchAll(filterType, topItemsCount, 90);
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, [filterType, topItemsCount, fetchAll]);

  useEffect(() => {
    let isMounted = true;

    const fetchInventoryData = async () => {
      if (!isMounted) return;

      console.log("🔄 Fetching inventory data...");

      try {
        const [lowStock, expiring, surplus] = await Promise.all([
          fetchLowStock(),
          fetchExpiring(),
          fetchSurplus(),
        ]);

        console.log("✅ Inventory data received:", {
          lowStock,
          expiring,
          surplus,
        });

        if (isMounted) {
          setLowStockIngredients(lowStock || []);
          setExpiringIngredients(expiring || []);
          setSurplusIngredients(surplus || []);

          // Simple cache
          const inventoryCache = {
            lowStock: lowStock || [],
            expiring: expiring || [],
            surplus: surplus || [],
            lastUpdated: new Date().toISOString(),
          };
          localStorage.setItem(
            "dashboard-inventory-cache",
            JSON.stringify(inventoryCache)
          );
        }
      } catch (error) {
        console.error("❌ Failed to fetch inventory data:", error);

        if (isMounted) {
          // Try cache on error
          const cached = localStorage.getItem("dashboard-inventory-cache");
          if (cached) {
            try {
              const parsedCache = JSON.parse(cached);
              console.log("📦 Using cached inventory data:", parsedCache);
              setLowStockIngredients(parsedCache.lowStock || []);
              setExpiringIngredients(parsedCache.expiring || []);
              setSurplusIngredients(parsedCache.surplus || []);
            } catch (parseError) {
              console.error("Cache parse error:", parseError);
            }
          }
        }
      }
    };

    fetchInventoryData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    console.log(
      "[DEBUG] Chart effect triggered. loading:",
      loading,
      "SalesData:",
      prediction.data
    );

    if (loading || !prediction.data.length) {
      console.log("[DEBUG] Skipping chart creation - loading or no data");
      return;
    }

    const canvas = topSalesCanvasRef.current;
    if (!canvas) {
      console.log("[DEBUG] No canvas found");
      return;
    }

    // Destroy existing chart before creating new one
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    let chart: Chart | null = null;

    try {
      // Use bar chart for daily, line for weekly/monthly
      const chartType = filterType === "daily" ? "bar" : "line";

      // Ensure all datasets have the same labels and consistent data structure
      const allLabels = prediction.data[0]?.week ?? [];
      console.log("[DEBUG] Chart labels:", allLabels);
      console.log(
        "[DEBUG] Prediction data structure:",
        prediction.data.map((d) => ({
          name: d.name,
          salesLength: d.sales?.length,
          sales: d.sales,
        }))
      );

      // Normalize datasets to ensure consistent data points
      const normalizedDatasets = prediction.data.map((trend: any) => {
        // Ensure sales array has same length as labels, fill with 0 if missing
        const normalizedSales = allLabels.map(
          (_, index) => trend.sales[index] || 0
        );

        return {
          label: trend.name,
          data: normalizedSales,
          borderColor: trend.color,
          backgroundColor:
            chartType === "bar" ? trend.color + "BB" : trend.color + "33",
          borderWidth: 3,
          tension: chartType === "line" ? 0.4 : 0,
          fill:
            chartType === "line"
              ? { target: "origin", above: trend.color + "20" }
              : false,
          pointRadius: chartType === "line" ? 4 : 0,
          pointHoverRadius: chartType === "line" ? 6 : 0,
          pointBackgroundColor: trend.color,
          pointBorderColor: "#fff",
          pointBorderWidth: chartType === "line" ? 2 : 0,
          // Bar chart specific options to reduce gaps
          barPercentage: chartType === "bar" ? 0.95 : undefined,
          categoryPercentage: chartType === "bar" ? 0.95 : undefined,
        };
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

                  console.log("[DEBUG] Legend labels:", truncatedLabels);
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
  }, [prediction.data, loading, filterType]);

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
            <option value={6}>All 6</option>
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
            {showHistoricalView ? "Hide Insights" : "Show Insights"}
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
    if (!showHistoricalView || !historical.data) return null;

    return (
      <section className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-4 mb-6 border border-blue-500/30">
        <header className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <MdInsights className="text-blue-400 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-300">
              Historical Analysis
            </h3>
            <p className="text-blue-200 text-sm">
              {historical.data.overview.analysis_period} •{" "}
              {historical.data.overview.total_sales} total sales
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Top Performers */}
          <div className="bg-black/40 rounded-lg p-3">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <FaChartBar className="text-yellow-400" />
              Top Performers
            </h4>
            <div className="space-y-2">
              {historical.data.top_performers.by_total_sales
                .slice(0, 3)
                .map((item, idx) => (
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
                ))}
            </div>
          </div>

          {/* Trends */}
          <div className="bg-black/40 rounded-lg p-3">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <FiTrendingUp className="text-green-400" />
              Trends
            </h4>
            <div className="space-y-2">
              {historical.data.trends.items_with_trends
                .slice(0, 3)
                .map((trend) => (
                  <div
                    key={trend.item}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-300 truncate">{trend.item}</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(trend.trend_direction)}
                      <span className="text-white text-xs">
                        {trend.change_percent > 0 ? "+" : ""}
                        {trend.change_percent}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-black/40 rounded-lg p-3">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <HiSparkles className="text-purple-400" />
              Insights
            </h4>
            <div className="space-y-1">
              {historical.data.insights.slice(0, 3).map((insight, idx) => (
                <p key={idx} className="text-gray-300 text-xs leading-relaxed">
                  • {insight}
                </p>
              ))}
            </div>
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

  // Debug: Log current state
  console.log("Dashboard State:", {
    loading,
    isOnline,
    salesDataLength: prediction.data.length,
    historicalData: historical.data ? "loaded" : "none",
    lowStockCount: lowStockIngredients.length,
    expiringCount: expiringIngredients.length,
    surplusCount: surplusIngredients.length,
    filterType,
  });

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
              </div>

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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8"
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
              <StatCard
                icon={<FaClock className="text-red-400 text-lg sm:text-xl" />}
                title="Expiring Soon"
                count={expiringIngredients.length}
                color="border-l-red-500"
                bgColor="bg-black/75"
              />
              <StatCard
                icon={
                  <FaWarehouse className="text-yellow-400 text-lg sm:text-xl" />
                }
                title="Surplus Items"
                count={surplusIngredients.length}
                color="border-l-yellow-500"
                bgColor="bg-black/75"
              />
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
              <section className="xl:col-span-8 flex flex-col gap-4 sm:gap-6">
                {/* Chart Card */}
                <section
                  aria-label="Sales Analytics"
                  className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 border border-gray-400"
                >
                  <header className="mb-3 sm:mb-4 lg:mb-6">
                    {/* Title Section */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="p-1.5 sm:p-2 bg-yellow-400/20 rounded-lg flex-shrink-0">
                        <FaChartLine className="text-yellow-400 text-lg sm:text-xl" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-white">
                          Sales Analytics
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          Track your top performing items
                        </p>
                      </div>
                    </div>

                    {/* Filter Controls */}
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
                    ) : (
                      <canvas
                        ref={topSalesCanvasRef}
                        className="w-full h-full"
                      />
                    )}
                  </div>
                  {/* Historical Insights Section */}
                  <div className="mt-6">
                    {/* Historical Insights Section */}
                    {renderHistoricalInsights()}
                  </div>
                </section>

                {/* Expiring Ingredients Table */}
                <section
                  aria-label="Expiring Ingredients"
                  className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 border border-red-500/30"
                >
                  <header className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="p-1.5 sm:p-2 bg-red-500/20 rounded-lg">
                      <FaClock className="text-red-400 text-lg sm:text-xl" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-red-400">
                        Expiring Soon
                      </h2>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        Items requiring immediate attention
                      </p>
                    </div>
                  </header>
                  <div className="overflow-x-auto rounded-lg">
                    <table className="min-w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-red-500/10 border-b border-red-500/30">
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-red-300">
                            Id
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-red-300">
                            Name
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-semibold text-red-300 hidden sm:table-cell">
                            Category
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-red-300">
                            Stock
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-red-300 hidden md:table-cell">
                            Batch Date
                          </th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold text-red-300">
                            Expires
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {expiringIngredients.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-6 sm:py-8 px-4 text-center text-gray-400"
                            >
                              <div className="flex flex-col items-center justify-center gap-2 w-full">
                                <FaClock className="text-gray-500 text-xl sm:text-2xl" />
                                <p className="text-sm">
                                  No expiring ingredients found
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          expiringIngredients.map((item, idx) => (
                            <tr
                              key={
                                item.id ||
                                `${item.item_name}-${item.expiration_date}-${idx}`
                              }
                              className="border-b border-gray-700 hover:bg-red-500/5 transition-colors duration-200"
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
                              <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-300 hidden sm:table-cell">
                                {item.category || "N/A"}
                              </td>
                              <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium">
                                  {item.stock_quantity}
                                </span>
                              </td>
                              <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-gray-300 hidden md:table-cell">
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
                              <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-gray-300">
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
                          ))
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
                {/* Low Stock */}
                <section
                  aria-label="Low Stock"
                  className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 border border-orange-400"
                >
                  <header className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-orange-500/20 rounded-lg">
                      <FaExclamationTriangle className="text-orange-400 text-base sm:text-lg" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-orange-400">
                        Low Stock
                      </h2>
                      <p className="text-gray-400 text-xs">Need restocking</p>
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
                      lowStockIngredients.map((item, idx) => (
                        <div
                          key={item.id || `${item.item_name}-${idx}`}
                          className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 sm:p-3 hover:bg-orange-500/15 transition-colors duration-200"
                        >
                          <div className="flex justify-between items-center">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-white text-xs sm:text-sm truncate">
                                <span className="text-orange-300 font-semibold">
                                  ID:
                                </span>{" "}
                                {item.item_id}
                                <span className="mx-1 text-gray-400">|</span>
                                <span className="font-semibold">
                                  {item.item_name}
                                </span>
                              </p>
                              <p className="text-orange-300 text-xs">
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
                      ))
                    )}
                  </div>
                </section>

                {/* Surplus */}
                <section
                  aria-label="Surplus Stock"
                  className="bg-gradient-to-br from-black/95 to-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 border border-yellow-400"
                >
                  <header className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-yellow-500/20 rounded-lg">
                      <FaWarehouse className="text-yellow-400 text-base sm:text-lg" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-yellow-400">
                        Surplus Stock
                      </h2>
                      <p className="text-gray-400 text-xs">Excess inventory</p>
                    </div>
                  </header>
                  <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                    {surplusIngredients.length === 0 ? (
                      <div className="text-center py-3 sm:py-4">
                        <FaWarehouse className="text-gray-500 text-lg sm:text-xl mx-auto mb-2" />
                        <p className="text-gray-400 text-xs sm:text-sm">
                          No surplus items
                        </p>
                      </div>
                    ) : (
                      surplusIngredients.map((item, idx) => (
                        <div
                          key={item.id || `${item.item_name}-${idx}`}
                          className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 sm:p-3 hover:bg-yellow-500/15 transition-colors duration-200"
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
                      ))
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
