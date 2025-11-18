"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavigationBar from "@/app/components/navigation/navigation";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import {
  FaDollarSign,
  FaChartLine,
  FaExclamationTriangle,
  FaBoxes,
  FaTrophy,
  FaLayerGroup,
  FaCalendarAlt,
  FaDownload,
  FaMoneyBillWave,
} from "react-icons/fa";
import { MdTrendingUp, MdTrendingDown } from "react-icons/md";
import { BiRefresh } from "react-icons/bi";

interface ComprehensiveAnalytics {
  period: string;
  summary: {
    total_revenue: number;
    total_cogs: number;
    gross_profit: number;
    total_loss: number;
    net_profit: number;
    total_items_sold: number;
    unique_items_sold: number;
    total_transactions: number;
    avg_unit_price: number;
  };
  profitability: {
    gross_profit_margin: number;
    net_profit_margin: number;
    loss_percentage: number;
    cogs_percentage: number;
  };
  loss_analysis: {
    total_spoilage_cost: number;
    total_quantity_spoiled: number;
    total_incidents: number;
    unique_items_spoiled: number;
    spoilage_items: Array<{
      item_name: string;
      category: string;
      total_spoiled: number;
      total_cost: number;
      incidents: number;
      reasons: string;
    }>;
  };
  top_performers: Array<{
    item_name: string;
    category: string;
    total_quantity_sold: number;
    total_revenue: number;
    avg_price: number;
  }>;
  category_breakdown: Array<{
    category: string;
    total_quantity: number;
    total_revenue: number;
    revenue_percentage: number;
    unique_items: number;
    avg_price: number;
  }>;
  daily_trend: Array<{
    date: string;
    total_items: number;
    total_revenue: number;
  }>;
}

export default function ComprehensiveSalesReport() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Set default dates (ALL TIME - from year 2000 to today)
  useEffect(() => {
    const end = new Date();

    // Use local date to avoid timezone issues
    const endDateStr = end.getFullYear() + '-' +
      String(end.getMonth() + 1).padStart(2, '0') + '-' +
      String(end.getDate()).padStart(2, '0');

    const startDateStr = "2000-01-01";  // All time start date

    setEndDate(endDateStr);
    setStartDate(startDateStr);
  }, []);

  const fetchAnalytics = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${API_BASE_URL}/api/comprehensive-sales-analytics?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || "Error loading analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchAnalytics();
    }
  }, [startDate, endDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-PH").format(value);
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <NavigationBar />
        <ResponsiveMain>
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-semibold">
                Loading Analytics...
              </p>
            </div>
          </div>
        </ResponsiveMain>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <NavigationBar />
        <ResponsiveMain>
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center bg-red-50 p-8 rounded-xl border-2 border-red-200">
              <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
              <p className="text-red-600 font-semibold text-lg">{error}</p>
              <button
                onClick={() => fetchAnalytics()}
                className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </ResponsiveMain>
      </div>
    );
  }

  if (!analytics) return null;

  const {
    summary,
    profitability,
    loss_analysis,
    top_performers,
    category_breakdown,
    daily_trend,
  } = analytics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <NavigationBar />
      <ResponsiveMain>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Sales Report Analytics
              </h1>
              <p className="text-gray-600 font-medium">
                Period: {analytics.period}
              </p>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
              <div className="flex flex-col sm:flex-row gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BiRefresh className={`${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* Section 1: Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-2">
                <FaMoneyBillWave className="text-4xl opacity-80" />
                <div className="text-right">
                  <p className="text-xs font-semibold opacity-90 uppercase">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold">
                    c{formatCurrency(summary.total_revenue)}
                  </p>
                </div>
              </div>
              <p className="text-xs opacity-75 mt-2">
                From {summary.total_transactions} transactions
              </p>
            </div>

            {/* Net Profit */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-2">
                <FaChartLine className="text-4xl opacity-80" />
                <div className="text-right">
                  <p className="text-xs font-semibold opacity-90 uppercase">
                    Net Profit
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(summary.net_profit)}
                  </p>
                </div>
              </div>
              <p className="text-xs opacity-75 mt-2">
                {profitability.net_profit_margin.toFixed(1)}% margin
              </p>
            </div>

            {/* Total Loss */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-2">
                <FaExclamationTriangle className="text-4xl opacity-80" />
                <div className="text-right">
                  <p className="text-xs font-semibold opacity-90 uppercase">
                    Total Loss
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(summary.total_loss)}
                  </p>
                </div>
              </div>
              <p className="text-xs opacity-75 mt-2">
                {profitability.loss_percentage.toFixed(1)}% of revenue
              </p>
            </div>

            {/* Items Sold */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-2">
                <FaBoxes className="text-4xl opacity-80" />
                <div className="text-right">
                  <p className="text-xs font-semibold opacity-90 uppercase">
                    Items Sold
                  </p>
                  <p className="text-2xl font-bold">
                    {formatNumber(summary.total_items_sold)}
                  </p>
                </div>
              </div>
              <p className="text-xs opacity-75 mt-2">
                {summary.unique_items_sold} unique items
              </p>
            </div>
          </div>

          {/* Section 2: Financial Breakdown */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FaChartLine className="text-blue-600" />
              Financial Breakdown
            </h2>

            <div className="space-y-4">
              {/* Revenue */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">
                    Total Revenue
                  </span>
                  <span className="font-bold text-green-600 text-lg">
                    {formatCurrency(summary.total_revenue)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full"
                    style={{ width: "100%" }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">100% of revenue</p>
              </div>

              {/* COGS */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">
                    - Cost of Goods Sold (COGS)
                  </span>
                  <span className="font-bold text-orange-600 text-lg">
                    -{formatCurrency(summary.total_cogs)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full"
                    style={{ width: `${profitability.cogs_percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {profitability.cogs_percentage.toFixed(1)}% of revenue
                </p>
              </div>

              {/* Gross Profit */}
              <div className="border-t-2 border-dashed border-gray-300 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-800">
                    = Gross Profit
                  </span>
                  <span className="font-bold text-blue-600 text-xl">
                    {formatCurrency(summary.gross_profit)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full"
                    style={{ width: `${profitability.gross_profit_margin}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {profitability.gross_profit_margin.toFixed(1)}% gross margin
                </p>
              </div>

              {/* Loss */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">
                    - Loss/Spoilage
                  </span>
                  <span className="font-bold text-red-600 text-lg">
                    -{formatCurrency(summary.total_loss)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-red-400 to-red-600 h-3 rounded-full"
                    style={{ width: `${profitability.loss_percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {profitability.loss_percentage.toFixed(1)}% loss
                </p>
              </div>

              {/* Net Profit */}
              <div className="border-t-2 border-gray-300 pt-4 bg-blue-50 -mx-6 px-6 py-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800 text-lg">
                    = Net Profit
                  </span>
                  <span className="font-bold text-green-600 text-2xl">
                    {formatCurrency(summary.net_profit)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Net Profit Margin:{" "}
                  <span className="font-bold text-blue-600">
                    {profitability.net_profit_margin.toFixed(1)}%
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 & 4: Loss Analysis and Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Loss Analysis */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-red-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaExclamationTriangle className="text-red-600" />
                Loss & Spoilage Analysis
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <p className="text-xs font-semibold text-red-700 uppercase mb-1">
                    Total Cost
                  </p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(loss_analysis.total_spoilage_cost)}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <p className="text-xs font-semibold text-red-700 uppercase mb-1">
                    Qty Spoiled
                  </p>
                  <p className="text-xl font-bold text-red-600">
                    {formatNumber(loss_analysis.total_quantity_spoiled)}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <p className="text-xs font-semibold text-red-700 uppercase mb-1">
                    Incidents
                  </p>
                  <p className="text-xl font-bold text-red-600">
                    {loss_analysis.total_incidents}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <p className="text-xs font-semibold text-red-700 uppercase mb-1">
                    Items Affected
                  </p>
                  <p className="text-xl font-bold text-red-600">
                    {loss_analysis.unique_items_spoiled}
                  </p>
                </div>
              </div>

              <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">
                Top Spoiled Items
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loss_analysis.spoilage_items.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          {item.item_name}
                        </p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                      <span className="font-bold text-red-600 text-sm">
                        {formatCurrency(item.total_cost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>Qty: {item.total_spoiled}</span>
                      <span>Incidents: {item.incidents}</span>
                    </div>
                    {item.reasons && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Reasons: {item.reasons}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                Top Performing Items
              </h2>

              <div className="space-y-3">
                {top_performers.slice(0, 10).map((item, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`
                          flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                          ${index === 0 ? "bg-yellow-400 text-yellow-900" : ""}
                          ${index === 1 ? "bg-gray-300 text-gray-700" : ""}
                          ${index === 2 ? "bg-orange-400 text-orange-900" : ""}
                          ${index > 2 ? "bg-blue-200 text-blue-700" : ""}
                        `}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">
                            {item.item_name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-lg">
                          {formatCurrency(item.total_revenue)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.total_quantity_sold} sold
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            (item.total_revenue /
                              top_performers[0].total_revenue) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 6: Daily Trend */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              Daily Sales Trend (Last 7 Days)
            </h2>

            <div className="space-y-3">
              {daily_trend.map((day, index) => {
                const maxRevenue = Math.max(
                  ...daily_trend.map((d) => d.total_revenue)
                );
                const percentage = (day.total_revenue / maxRevenue) * 100;

                return (
                  <div
                    key={index}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-700 text-sm min-w-[100px]">
                          {new Date(day.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            weekday: "short",
                          })}
                        </span>
                        <span className="text-xs text-gray-500">
                          {day.total_items} items
                        </span>
                      </div>
                      <span className="font-bold text-blue-600 text-lg">
                        {formatCurrency(day.total_revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
            <h2 className="text-2xl font-bold mb-6">Summary Statistics</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                <p className="text-xs font-semibold opacity-90 uppercase mb-1">
                  Avg Transaction
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    summary.total_revenue / summary.total_transactions
                  )}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                <p className="text-xs font-semibold opacity-90 uppercase mb-1">
                  Avg Item Price
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary.avg_unit_price)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                <p className="text-xs font-semibold opacity-90 uppercase mb-1">
                  Items/Transaction
                </p>
                <p className="text-2xl font-bold">
                  {(
                    summary.total_items_sold / summary.total_transactions
                  ).toFixed(2)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                <p className="text-xs font-semibold opacity-90 uppercase mb-1">
                  Unique Items
                </p>
                <p className="text-2xl font-bold">
                  {summary.unique_items_sold}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveMain>
    </div>
  );
}
