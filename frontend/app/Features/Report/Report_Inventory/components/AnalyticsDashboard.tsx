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
  const {
    stock_overview,
    spoilage_summary,
    low_stock_items = [],
    expiring_items = [],
    critical_stock_items = [],
    outOfStock_items = [],
    normal_items = [],
  } = analytics;

  // Debug logging
  console.log("Analytics Data:", {
    critical_stock_items: critical_stock_items.length,
    outOfStock_items: outOfStock_items.length,
    low_stock_items: low_stock_items.length,
    expiring_items: expiring_items.length,
    normal_items: normal_items.length,
  });

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

        {/* Critical Items */}
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <FaExclamationTriangle className="text-red-400 text-2xl" />
            </div>
            {critical_stock_items?.length > 0 && (
              <span className="px-2 py-1 bg-red-500/30 text-red-300 text-xs rounded-full font-semibold">
                Alert!
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {critical_stock_items?.length ?? 0}
          </div>
          <div className="text-gray-400 text-sm">Critical Items</div>
        </div>

        {/* Out Of Stock Items */}
        <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/10 border-2 border-gray-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-500/20 rounded-lg">
              <FaBoxes className="text-gray-400 text-2xl" />
            </div>
            {outOfStock_items?.length > 0 && (
              <span className="px-2 py-1 bg-gray-500/30 text-gray-300 text-xs rounded-full font-semibold">
                Out!
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {outOfStock_items?.length ?? 0}
          </div>
          <div className="text-gray-400 text-sm">Out Of Stock Items</div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <FaExclamationTriangle className="text-yellow-400 text-2xl" />
            </div>
            {low_stock_items?.length > 0 && (
              <span className="px-2 py-1 bg-yellow-500/30 text-yellow-300 text-xs rounded-full font-semibold">
                Warning!
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {low_stock_items?.length ?? 0}
          </div>
          <div className="text-gray-400 text-sm">Low Stock Items</div>
        </div>

        {/* Expiring Soon Items */}
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-2 border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <FaClock className="text-orange-400 text-2xl" />
            </div>
            {expiring_items?.length > 0 && (
              <span className="px-2 py-1 bg-orange-500/30 text-orange-300 text-xs rounded-full font-semibold">
                Soon!
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {expiring_items?.length ?? 0}
          </div>
          <div className="text-gray-400 text-sm">Expiring Soon</div>
        </div>

        {/* Normal Stock Items */}
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FaLayerGroup className="text-green-400 text-2xl" />
            </div>
            {normal_items?.length > 0 && (
              <span className="px-2 py-1 bg-green-500/30 text-green-300 text-xs rounded-full font-semibold">
                Good!
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {normal_items?.length ?? 0}
          </div>
          <div className="text-gray-400 text-sm">Normal Stock Items</div>
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
    </div>
  );
}
