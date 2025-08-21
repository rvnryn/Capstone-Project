/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { routes } from "@/app/routes/routes";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import NavigationBar from "@/app/components/navigation/navigation";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import { useInventoryAPI } from "@/app/Features/Inventory/hook/use-inventoryAPI";
import {
  FiEye,
  FiCalendar,
  FiTag,
  FiPackage,
  FiTrendingUp,
  FiHash,
  FiClock,
  FiEdit3,
  FiArrowLeft,
  FiAlertCircle,
} from "react-icons/fi";

export default function ViewTodayInventoryItem() {
  const { role } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMenuOpen, isMobile } = useNavigation();
  const { getTodayItem } = useInventoryAPI();
  const [item, setItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const itemId = searchParams.get("id");

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) {
        router.push(routes.todays_inventory);
        return;
      }

      try {
        const data = await getTodayItem(itemId);
        const formatted = {
          id: data.item_id,
          name: data.item_name,
          batch: data.batch_date,
          category: data.category,
          status: data.stock_status,
          stock: data.stock_quantity,
          added: data.created_at,
          updated: data.updated_at,
          expiration_date: data.expiration_date || null,
        };
        setItem(formatted);
      } catch (error) {
        console.error("Error fetching item:", error);
        router.push(routes.todays_inventory);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [itemId, router, getTodayItem]);

  const formatDateOnly = (input: string | null): string => {
    if (!input) return "-";
    const date = new Date(input);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (date: string | Date | null): string => {
    if (!date) return "-";
    const dt = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dt.getTime())) return "-";
    return dt.toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <section className="text-white font-poppins">
        <NavigationBar />
        <ResponsiveMain>
          <main
            className="pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12"
            aria-label="View Today Inventory main content"
            tabIndex={-1}
          >
            <div className="max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-4xl mx-auto w-full">
              <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-800/50 p-3 xs:p-4 sm:p-6 md:p-8 lg:p-12">
                <div className="flex flex-col items-center justify-center py-6 xs:py-8 sm:py-12 md:py-16">
                  <div className="relative mb-3 xs:mb-4 sm:mb-6">
                    <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-sm xs:blur-md sm:blur-lg"></div>
                    <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-2 xs:p-3 sm:p-4 rounded-full animate-pulse">
                      <FiEye className="text-black text-xl xs:text-2xl sm:text-3xl md:text-4xl" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-yellow-400 mb-1 xs:mb-2">
                      Loading Item Details
                    </h2>
                    <p className="text-gray-400 text-xs xs:text-sm sm:text-base">
                      Please wait while we fetch the today's inventory
                      information...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </ResponsiveMain>
      </section>
    );
  }

  if (!item) {
    return (
      <section className="text-white font-poppins">
        <NavigationBar />
        <ResponsiveMain>
          <main
            className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
            aria-label="View Today's Inventory main content"
            tabIndex={-1}
          >
            <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
              <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-800/50 p-3 xs:p-4 sm:p-6 md:p-8 lg:p-12">
                <div className="text-center py-6 xs:py-8 sm:py-12 md:py-16">
                  <div className="relative mb-3 xs:mb-4 sm:mb-6">
                    <div className="absolute inset-0 bg-red-400/20 rounded-full blur-lg"></div>
                    <div className="relative bg-gradient-to-br from-red-400 to-red-500 p-4 rounded-full">
                      <FiAlertCircle className="text-white text-3xl sm:text-4xl" />
                    </div>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                    Item Not Found
                  </h2>
                  <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-md mx-auto leading-relaxed">
                    The today's inventory item you're looking for could not be
                    found. It may have been removed or the link is invalid.
                  </p>
                  <button
                    onClick={() => router.push(routes.todays_inventory)}
                    className="group flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold transition-all duration-300 cursor-pointer text-sm sm:text-base shadow-lg hover:shadow-yellow-400/25 mx-auto"
                  >
                    <FiArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
                    Back to Today's Inventory
                  </button>
                </div>
              </div>
            </div>
          </main>
        </ResponsiveMain>
      </section>
    );
  }

  return (
    <section className="text-white font-poppins">
      <NavigationBar showEditModal={showEditModal} />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="View Today's Inventory main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-800/50 p-4 xs:p-6 sm:p-8 md:p-10 lg:p-12">
              {/* Enhanced Header */}
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                  <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-full">
                    <FiEye className="text-black text-2xl sm:text-3xl md:text-4xl" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    Today's Item Details
                  </h1>
                  <p className="text-gray-400 text-sm sm:text-base mt-1">
                    View complete today's inventory information
                  </p>
                </div>
              </div>

              {/* Elegant Divider */}
              <div className="relative mb-6 xs:mb-7 sm:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 px-3 xs:px-4 py-0.5 xs:py-1 rounded-full">
                    <div className="w-1.5 xs:w-2 h-1.5 xs:h-2 bg-yellow-400 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Item Information Grid */}
              <div className="space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                  <ItemRow
                    icon={<FiHash className="text-yellow-400" />}
                    label="Item ID"
                    value={item.id}
                  />
                  <ItemRow
                    icon={<FiTag className="text-blue-400" />}
                    label="Item Name"
                    value={item.name}
                  />
                  <ItemRow
                    icon={<FiPackage className="text-purple-400" />}
                    label="Category"
                    value={item.category}
                  />
                  <ItemRow
                    icon={<FiHash className="text-green-400" />}
                    label="Quantity In Stock"
                    value={item.stock.toString()}
                  />
                  <ItemRow
                    icon={<FiCalendar className="text-orange-400" />}
                    label="Batch Date"
                    value={formatDateOnly(item.batch)}
                  />
                  <ItemRow
                    icon={<FiCalendar className="text-red-400" />}
                    label="Expiration Date"
                    value={formatDateOnly(item.expiration_date)}
                  />
                  <ItemRow
                    icon={<FiTrendingUp className="text-cyan-400" />}
                    label="Stock Status"
                    value={item.status}
                    valueClassName={
                      item.status === "Low"
                        ? "text-red-400 font-semibold"
                        : item.status === "Normal"
                        ? "text-yellow-400 font-semibold"
                        : "text-green-400 font-semibold"
                    }
                  />
                  <ItemRow
                    icon={<FiClock className="text-indigo-400" />}
                    label="Procurement date"
                    value={formatDateTime(item.added)}
                  />
                </div>

                {/* Last Updated - Full Width */}
                <div className="pt-4 border-t border-gray-700/50">
                  <ItemRow
                    icon={<FiClock className="text-gray-400" />}
                    label="Last Updated"
                    value={formatDateTime(item.updated)}
                    fullWidth={true}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col xs:flex-row justify-end gap-2 xs:gap-3 sm:gap-4 pt-4 xs:pt-5 sm:pt-6 md:pt-8 border-t border-gray-700/50">
                  {["Owner", "General Manager", "Store Manager"].includes(
                    role || ""
                  ) && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="group flex items-center justify-center gap-1.5 xs:gap-2 px-4 xs:px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 xs:py-3 sm:py-3.5 md:py-4 rounded-lg xs:rounded-xl border-2 border-yellow-400/50 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300 font-medium xs:font-semibold transition-all duration-300 cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto order-2 xs:order-1"
                    >
                      <FiEdit3 className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="hidden sm:inline">Edit Item</span>
                      <span className="sm:hidden">Edit</span>
                    </button>
                  )}
                  <button
                    onClick={() => router.push(routes.todays_inventory)}
                    className="group flex items-center justify-center gap-1.5 xs:gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-4 xs:px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 xs:py-3 sm:py-3.5 md:py-4 rounded-lg xs:rounded-xl font-medium xs:font-semibold transition-all duration-300 cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto shadow-lg hover:shadow-yellow-400/25 order-1 xs:order-2"
                  >
                    <FiArrowLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                    <span className="hidden sm:inline">
                      Back to Today's Inventory
                    </span>
                    <span className="sm:hidden">Back</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl text-center space-y-8 max-w-md w-full border border-gray-400/50">
              <h2 className="text-2xl font-bold text-yellow-400 font-poppins">
                Edit Item
              </h2>
              <p className="text-gray-300">
                Are you sure you want to edit this item?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    router.push(routes.UpdateTodayInventory(item.id));
                  }}
                  className="px-8 py-3 rounded-lg border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-semibold transition-all order-2 sm:order-1 cursor-pointer"
                >
                  Yes, Edit
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-8 py-3 rounded-lg border border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white font-semibold transition-all order-1 sm:order-2 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
}

function ItemRow({
  icon,
  label,
  value,
  className = "text-white",
  valueClassName,
  fullWidth = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`group ${fullWidth ? "col-span-full" : ""}`}>
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg xs:rounded-xl p-3 xs:p-4 sm:p-5 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 h-full">
        <div className="flex items-start gap-2 xs:gap-3">
          {icon && (
            <div className="flex-shrink-0 mt-0.5 xs:mt-1">
              <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-auto sm:h-auto flex items-center justify-center">
                {icon}
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-400 text-xs xs:text-xs sm:text-sm font-medium mb-1 xs:mb-1.5 sm:mb-2 uppercase tracking-wider leading-tight">
              {label}
            </h3>
            <p
              className={`text-sm xs:text-base sm:text-lg font-medium xs:font-semibold break-words leading-tight ${
                valueClassName || className
              }`}
            >
              {value}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
