import React from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { InventoryAnalytics } from "../hooks/useInventoryAnalytics";

interface InventoryChartsProps {
  analytics: InventoryAnalytics;
}

const COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
};

const STATUS_COLORS = {
  "High Stock": COLORS.success,
  "Medium Stock": COLORS.warning,
  "Low Stock": COLORS.danger,
};

const PIE_COLORS = [COLORS.success, COLORS.warning, COLORS.danger, COLORS.info];

export default function InventoryCharts({ analytics }: InventoryChartsProps) {
  const { stock_by_category, stock_status_distribution, spoilage_trend } =
    analytics;

  // Custom tooltip for better readability
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Visual Analytics</h2>
        <p className="text-gray-400">
          Data-driven insights for better inventory management
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Category - Bar Chart */}
        <div className="bg-gray-800/30 border-2 border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4">
            Stock Distribution by Category
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Compare inventory levels across different categories
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stock_by_category}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="category"
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: "#9ca3af" }} />
              <Bar
                dataKey="total_quantity"
                fill={COLORS.primary}
                name="Total Quantity"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="item_count"
                fill={COLORS.secondary}
                name="Unique Items"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-blue-400 text-xs">
              <strong>Insight:</strong> Identify which categories need
              restocking or have excess inventory
            </p>
          </div>
        </div>

        {/* Stock Status - Pie Chart */}
        <div className="bg-gray-800/30 border-2 border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4">
            Stock Status Overview
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Current stock health distribution
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stock_status_distribution}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ status, percent }: any) =>
                  `${status}: ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {stock_status_distribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      STATUS_COLORS[
                        entry.status as keyof typeof STATUS_COLORS
                      ] || PIE_COLORS[index % PIE_COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: "#9ca3af" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <p className="text-purple-400 text-xs">
              <strong>Insight:</strong> Monitor the proportion of critical vs
              healthy stock levels
            </p>
          </div>
        </div>
      </div>

      {/* Spoilage Trend - Line Chart (Full Width) */}
      {spoilage_trend && spoilage_trend.length > 0 && (
        <div className="bg-gray-800/30 border-2 border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4">
            Spoilage Trend Analysis
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Track wastage patterns over time to identify improvement
            opportunities
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={spoilage_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: "#9ca3af" }} />
              <Line
                type="monotone"
                dataKey="total_quantity"
                stroke={COLORS.danger}
                strokeWidth={3}
                name="Quantity Spoiled"
                dot={{ fill: COLORS.danger, r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="incidents"
                stroke={COLORS.warning}
                strokeWidth={2}
                name="Incidents"
                dot={{ fill: COLORS.warning, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-red-400 text-xs">
                <strong>Total Spoiled:</strong>{" "}
                {spoilage_trend
                  .reduce((sum, item) => sum + (item.total_quantity || 0), 0)
                  .toLocaleString()}{" "}
                units
              </p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-yellow-400 text-xs">
                <strong>Total Incidents:</strong>{" "}
                {spoilage_trend.reduce(
                  (sum, item) => sum + (item.incidents || 0),
                  0
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
