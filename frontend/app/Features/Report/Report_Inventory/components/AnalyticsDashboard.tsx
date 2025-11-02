import React from "react";
import {
  FaBoxes,
  FaExclamationTriangle,
  FaChartLine,
  FaLayerGroup,
  FaTrash,
  FaClock,
} from "react-icons/fa";
import { MdTrendingUp, MdTrendingDown } from "react-icons/md";
import { InventoryAnalytics } from "../hooks/useInventoryAnalytics";

interface AnalyticsDashboardProps {
  analytics: InventoryAnalytics;
}

export default function AnalyticsDashboard({
  analytics,
}: AnalyticsDashboardProps) {
  const { stock_overview, spoilage_summary, low_stock_items, expiring_items } =
    analytics;

  // Calculate health score (0-100)
  const calculateHealthScore = () => {
    const totalItems = stock_overview.total_items || 1;
    const outOfStockRatio = stock_overview.out_of_stock_items / totalItems;
    const lowStockRatio = low_stock_items.length / totalItems;
    const expiringRatio = expiring_items.length / totalItems;

    const score = Math.max(
      0,
      100 - outOfStockRatio * 40 - lowStockRatio * 30 - expiringRatio * 30
    );
    return Math.round(score);
  };

  const healthScore = calculateHealthScore();

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-2 border-blue-500/30 rounded-xl p-6 backdrop-blur-sm hover:border-blue-400/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <FaBoxes className="text-blue-400 text-2xl" />
            </div>
            <MdTrendingUp className="text-blue-400 text-xl" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stock_overview.total_items || 0}
          </div>
          <div className="text-gray-400 text-sm">Total Items</div>
          <div className="text-blue-400 text-xs mt-2">
            {stock_overview.total_quantity?.toLocaleString() || 0} units in
            stock
          </div>
        </div>

        {/* Categories */}
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-2 border-purple-500/30 rounded-xl p-6 backdrop-blur-sm hover:border-purple-400/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <FaLayerGroup className="text-purple-400 text-2xl" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stock_overview.total_categories || 0}
          </div>
          <div className="text-gray-400 text-sm">Categories</div>
          <div className="text-purple-400 text-xs mt-2">
            Organized inventory groups
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/30 rounded-xl p-6 backdrop-blur-sm hover:border-yellow-400/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <FaExclamationTriangle className="text-yellow-400 text-2xl" />
            </div>
            {low_stock_items.length > 0 && (
              <span className="px-2 py-1 bg-yellow-500/30 text-yellow-300 text-xs rounded-full font-semibold">
                Alert!
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {low_stock_items.length}
          </div>
          <div className="text-gray-400 text-sm">Low Stock Items</div>
          <div className="text-yellow-400 text-xs mt-2">
            {stock_overview.out_of_stock_items || 0} out of stock
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-2 border-orange-500/30 rounded-xl p-6 backdrop-blur-sm hover:border-orange-400/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <FaClock className="text-orange-400 text-2xl" />
            </div>
            {expiring_items.length > 0 && (
              <span className="px-2 py-1 bg-orange-500/30 text-orange-300 text-xs rounded-full font-semibold">
                {expiring_items.length}
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {expiring_items.length}
          </div>
          <div className="text-gray-400 text-sm">Expiring Soon</div>
          <div className="text-orange-400 text-xs mt-2">Next 7 days</div>
        </div>
      </div>

      {/* Spoilage Summary */}
      <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-500/20 rounded-lg">
            <FaTrash className="text-red-400 text-2xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Spoilage & Wastage Analysis
            </h3>
            <p className="text-gray-400 text-sm">
              Period: {analytics.period.start_date} to{" "}
              {analytics.period.end_date}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {spoilage_summary.total_incidents || 0}
            </div>
            <div className="text-gray-400 text-sm">Total Incidents</div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {spoilage_summary.total_quantity_spoiled?.toLocaleString() || 0}
            </div>
            <div className="text-gray-400 text-sm">Units Spoiled</div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {spoilage_summary.unique_items_spoiled || 0}
            </div>
            <div className="text-gray-400 text-sm">Unique Items</div>
          </div>
        </div>
      </div>

      {/* Alert Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        {low_stock_items.length > 0 && (
          <div className="bg-gray-800/30 border-2 border-yellow-500/30 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <FaExclamationTriangle />
              Low Stock Alerts
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {low_stock_items.slice(0, 10).map((item, idx) => (
                <div
                  key={idx}
                  className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-semibold">
                        {item.item_name}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {item.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-bold">
                        {item.stock_quantity}
                      </div>
                      <div className="text-gray-400 text-xs">
                        / {item.threshold}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiring Items */}
        {expiring_items.length > 0 && (
          <div className="bg-gray-800/30 border-2 border-orange-500/30 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
              <FaClock />
              Expiring Soon
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {expiring_items.slice(0, 10).map((item, idx) => (
                <div
                  key={idx}
                  className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-semibold">
                        {item.item_name}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {item.category} • {item.stock_quantity} units
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-orange-400 font-bold">
                        {item.days_until_expiry}d
                      </div>
                      <div className="text-gray-400 text-xs">
                        {new Date(item.expiration_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
