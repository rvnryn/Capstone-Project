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
  "Out of Stock": "#6b7280",
  Critical: COLORS.danger,
  "Low Stock": COLORS.warning,
  Normal: COLORS.success,
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

      {/* Stock Status - Pie Chart */}
      <div className="bg-gray-800/30 border-2 border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-white mb-4">
          Stock Status Overview
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Current stock health distribution
        </p>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={stock_status_distribution}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={130}
              label={({ status, percent }: any) =>
                `${status}: ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {stock_status_distribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] ||
                    PIE_COLORS[index % PIE_COLORS.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "#9ca3af" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
