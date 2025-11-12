"use client";

import { useState, useEffect } from "react";
import NavigationBar from "@/app/components/navigation/navigation";
import { useMenuAPI } from "../hook/use-menu";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import {
  FiEye,
  FiAlertCircle,
  FiArrowLeft,
  FiEdit3,
  FiHash,
  FiTag,
  FiPackage,
  FiCalendar,
  FiTrendingUp,
  FiClock,
  FiX,
  FiImage,
} from "react-icons/fi";
import {
  FaCheckCircle,
  FaSortDown,
  FaTimesCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaHistory,
} from "react-icons/fa";
import { useGlobalLoading } from "@/app/context/GlobalLoadingContext";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
// import routes from "@/app/routes"; // Commented out due to missing module
import Image from "next/image";
import { routes } from "@/app/routes/routes";

// Inline date formatting utilities
function formatDateTime(date: string | number | Date | undefined) {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(date: string | number | Date | undefined) {
  if (!date) return "-";
  const now = new Date();
  const past = new Date(date);
  if (isNaN(past.getTime())) return "Invalid date";
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return formatDateTime(date);
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
  value: string | React.ReactNode;
  className?: string;
  valueClassName?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`group ${fullWidth ? "col-span-full" : ""}`}>
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-700/50 hover:border-yellow-400/30 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300 h-full">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex-shrink-0 mt-1">
              <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 p-2.5 rounded-lg group-hover:from-yellow-400/30 group-hover:to-yellow-500/30 transition-all duration-200">
                {icon}
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-yellow-300 text-xs sm:text-sm font-semibold mb-2 uppercase tracking-wider">
              {label}
            </h3>
            {typeof value === "string" || typeof value === "number" ? (
              <p
                className={`text-base sm:text-lg font-semibold break-words ${
                  valueClassName || className
                }`}
              >
                {value}
              </p>
            ) : (
              <div
                className={`text-base sm:text-lg font-semibold break-words ${
                  valueClassName || className
                }`}
              >
                {value}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ViewMenu() {
  const { setLoading } = useGlobalLoading();
  // --- Offline/Cache State ---
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const { role } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const { fetchMenuById } = useMenuAPI();
  const [menu, setMenu] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const menuId = searchParams.get("id");

  useEffect(() => {
    const cacheKey = menuId ? `cached_menu_${menuId}` : null;
    setOfflineError(null);
    setIsLoading(true);
    setLoading(true);
    if (!menuId) {
      setIsLoading(false);
      setLoading(false);
      setOfflineError("No menu selected.");
      return;
    }
    if (!isOnline) {
      if (cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setMenu(parsed);
            setOfflineError(null);
          } catch (e) {
            setMenu(null);
            setOfflineError("Failed to parse cached menu data.");
          }
        } else {
          setMenu(null);
          setOfflineError(
            "No cached menu data available. Please connect to the internet to load menu."
          );
        }
      } else {
        setMenu(null);
        setOfflineError("No menu selected.");
      }
      setIsLoading(false);
      setLoading(false);
      return;
    }
    fetchMenuById(Number(menuId))
      .then((data) => {
        setMenu(data);
        setOfflineError(null);
        if (cacheKey) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      })
      .catch(() => {
        setMenu(null);
        setOfflineError("Failed to load menu data.");
      })
      .finally(() => {
        setIsLoading(false);
        setLoading(false);
      });
  }, [menuId, setLoading]);

  if (offlineError) {
    return (
      <section className="text-white font-poppins w-full min-h-screen">
        <NavigationBar />
        <ResponsiveMain>
          <main className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="text-red-400 font-bold text-lg">
                {offlineError}
              </div>
              <button
                className="mt-4 px-6 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </main>
        </ResponsiveMain>
      </section>
    );
  }
  if (isLoading) {
    return (
      <section className="text-white font-poppins">
        <NavigationBar showEditModal={showEditModal} />
        <ResponsiveMain>
          <main
            className="pb-2 xs:pb-4 sm:pb-6 md:pb-8 lg:pb-10 xl:pb-12 pt-16 xs:pt-20 sm:pt-24 md:pt-28 px-1 xs:px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 2xl:px-10"
            aria-label="View Menu main content"
            tabIndex={-1}
          >
            <div className="max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-4xl mx-auto w-full"></div>
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-xl xs:rounded-2xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="flex flex-col items-center justify-center py-4 xs:py-6 sm:py-8 md:py-12">
                <div className="relative mb-2 xs:mb-3 sm:mb-4">
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-sm xs:blur-md sm:blur-lg"></div>
                  <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-2 xs:p-2.5 sm:p-3 rounded-full animate-pulse">
                    <FiEye className="text-black text-lg xs:text-xl sm:text-2xl md:text-3xl" />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-yellow-400 mb-1 xs:mb-1.5">
                    Loading Menu Details
                  </h2>
                  <div className="text-gray-400 text-xs xs:text-sm sm:text-base">
                    Please wait while we fetch the menu information...
                  </div>
                </div>
              </div>
            </div>
          </main>
        </ResponsiveMain>
      </section>
    );
  }

  if (!menu) {
    return (
      <section className="text-white font-poppins">
        <NavigationBar />
        <ResponsiveMain>
          <main
            className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
            aria-label="Menu main content"
            tabIndex={-1}
          >
            <div className="max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-4xl mx-auto w-full">
              <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-xl xs:rounded-2xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
                <div className="text-center py-4 xs:py-6 sm:py-8 md:py-12">
                  <div className="relative mb-2 xs:mb-3 sm:mb-4">
                    <div className="absolute inset-0 bg-red-400/20 rounded-full blur-lg"></div>
                    <div className="relative bg-gradient-to-br from-red-400 to-red-500 p-3 rounded-full">
                      <FiAlertCircle className="text-white text-2xl sm:text-3xl" />
                    </div>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                    Menu Item Not Found
                  </h2>
                  <div className="text-gray-400 text-xs sm:text-sm mb-6 max-w-md mx-auto leading-relaxed">
                    The menu item you're looking for could not be found. It may
                    have been removed or the link is invalid.
                  </div>
                  <button
                    onClick={() => router.back()}
                    className="group flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold transition-all duration-300 cursor-pointer text-xs sm:text-base shadow-lg hover:shadow-yellow-400/25 mx-auto"
                  >
                    <FiArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
                    Back to Menu
                  </button>
                </div>
              </div>
            </div>
          </main>
        </ResponsiveMain>
      </section>
    );
  }

  function getStockStatusProps(stock_status?: string) {
    if (!stock_status || stock_status === "Available") {
      return {
        label: "Available",
        color: "bg-green-500/20 text-green-400 border-green-400/40",
        icon: <FaCheckCircle className="inline mr-1 text-green-400" />,
      };
    }
    if (stock_status === "Out of Stock") {
      return {
        label: "Out of Stock",
        color: "bg-red-500/20 text-red-400 border-red-400/40",
        icon: <FaTimesCircle className="inline mr-1 text-red-400" />,
      };
    }
    if (stock_status === "Critical") {
      return {
        label: "Critical Stock",
        color: "bg-orange-500/20 text-orange-400 border-orange-400/40",
        icon: <FiAlertCircle className="inline mr-1 text-orange-400" />,
      };
    }
    if (stock_status === "Low") {
      return {
        label: "Low Stock",
        color: "bg-yellow-400/20 text-yellow-400 border-yellow-400/40",
        icon: <FaSortDown className="inline mr-1 text-yellow-400" />,
      };
    }
    // Add more statuses if needed
    return {
      label: stock_status,
      color: "bg-gray-500/20 text-gray-400 border-gray-400/40",
      icon: <FiTrendingUp className="inline mr-1 text-gray-400" />,
    };
  }

  const {
    label: stockStatusLabel,
    color: stockStatusColor,
    icon: stockStatusIcon,
  } = getStockStatusProps(menu.stock_status);

  function getUnavailabilityReasonProps(reason?: string) {
    switch (reason) {
      case "expired":
        return {
          label: "Expired",
          color: "bg-red-600/20 text-red-300 border-red-500/40",
          icon: <FiClock className="inline mr-1" size={10} />,
          description: "Ingredients have expired",
        };
      case "no_stock":
        return {
          label: "No Stock",
          color: "bg-gray-600/20 text-gray-300 border-gray-500/40",
          icon: <FiX className="inline mr-1" size={10} />,
          description: "No inventory available",
        };
      case "low_stock":
        return {
          label: "Low Stock",
          color: "bg-orange-500/20 text-orange-300 border-orange-400/40",
          icon: <FaExclamationTriangle className="inline mr-1" size={10} />,
          description: "Limited quantity available",
        };
      default:
        return {
          label: "Not Available",
          color: "bg-red-500/20 text-red-300 border-red-400/30",
          icon: <FaTimesCircle className="inline mr-1" size={10} />,
          description: "Currently unavailable",
        };
    }
  }

  return (
    <section className="text-white font-poppins">
      <NavigationBar />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Menu main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-xl xs:rounded-2xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
              {/* Enhanced Header */}
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                  <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-2 rounded-full">
                    <FiEye className="text-black text-xl sm:text-2xl md:text-3xl" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    Menu Item Details
                  </h1>
                  <div className="text-gray-400 text-xs sm:text-sm mt-1">
                    View complete menu information
                  </div>
                </div>
              </div>

              {/* Elegant Divider */}
              <div className="relative mb-4 sm:mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 px-2 sm:px-3 py-0.5 rounded-full"></div>
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-yellow-400 rounded-full"></div>
                </div>
              </div>

              {/* Menu Information Grid */}
              <div className="space-y-2 sm:space-y-3 md:space-y-4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                <ItemRow
                  icon={<FiHash className="text-gray-400" />} // <-- Add this block
                  label="Item Code"
                  value={menu.itemcode || "-"}
                />
                <ItemRow
                  icon={<FiHash className="text-yellow-400" />}
                  label="Menu ID"
                  value={menu.menu_id?.toString() || "-"}
                />
                <ItemRow
                  icon={<FiTag className="text-blue-400" />}
                  label="Dish Name"
                  value={menu.dish_name}
                />
                <ItemRow
                  icon={<FiPackage className="text-purple-400" />}
                  label="Category"
                  value={menu.category}
                />
                <ItemRow
                  icon={<FiHash className="text-green-400" />}
                  label="Price"
                  value={`₱${menu.price}`}
                />
                {menu.description && (
                  <div className="sm:col-span-2">
                    <ItemRow
                      icon={<FiTag className="text-indigo-400" />}
                      label="Description"
                      value={menu.description}
                      valueClassName="text-sm text-gray-300 leading-relaxed"
                    />
                  </div>
                )}
                <ItemRow
                  icon={<FiTrendingUp className="text-cyan-400" />}
                  label="Stock Status"
                  value={
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded ${stockStatusColor}`}
                    >
                      {stockStatusIcon}
                      {stockStatusLabel}
                    </span>
                  }
                  valueClassName=""
                />

                {/* Enhanced timestamp display */}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  <ItemRow
                    icon={<FaCalendarAlt className="text-green-400" />}
                    label="Created"
                    value={
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-white">
                          {formatDateTime(menu.created_at)}
                        </div>
                      </div>
                    }
                    valueClassName=""
                  />
                  <ItemRow
                    icon={<FaHistory className="text-blue-400" />}
                    label="Last Updated"
                    value={
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-white">
                          {formatDateTime(menu.updated_at)}
                        </div>
                      </div>
                    }
                    valueClassName=""
                  />
                </div>
              </div>

              {/* Ingredients - Full Width */}
              <div className="pt-4 sm:pt-6 border-t border-gray-700/50">
                <div className="mb-4 flex items-center gap-3 bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-700/50">
                  <div className="bg-gradient-to-br from-green-400/20 to-green-500/20 p-2.5 rounded-lg">
                    <FiPackage className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-green-300">
                      Ingredients
                    </h2>
                    <p className="text-xs text-gray-400">
                      {menu.ingredients && menu.ingredients.length > 0
                        ? `${menu.ingredients.length} ingredient${
                            menu.ingredients.length !== 1 ? "s" : ""
                          }`
                        : "No ingredients listed"}
                    </p>
                  </div>
                </div>

                {menu.ingredients && menu.ingredients.length > 0 ? (
                  <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-xl">
                    <div className="space-y-3">
                      {menu.ingredients.map((ing: any, idx: number) => {
                        const reasonProps = getUnavailabilityReasonProps(
                          ing.unavailable_reason
                        );
                        const isProblematic =
                          ing.is_unavailable || ing.is_low_stock;

                        return (
                          <div
                            key={idx}
                            className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all duration-300 ${
                              isProblematic
                                ? "bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-400/30 hover:border-red-400/50"
                                : "bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-400/30 hover:border-green-400/50"
                            } hover:shadow-lg`}
                          >
                            {/* Ingredient Number Badge */}
                            <div className="flex items-center gap-3 flex-1">
                              <div
                                className={`px-3 py-1 rounded-full border ${
                                  isProblematic
                                    ? "bg-red-400/20 border-red-500/30"
                                    : "bg-green-400/20 border-green-500/30"
                                }`}
                              >
                                <span
                                  className={`text-xs font-bold ${
                                    isProblematic
                                      ? "text-red-400"
                                      : "text-green-400"
                                  }`}
                                >
                                  #{idx + 1}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`font-semibold text-base ${
                                      isProblematic
                                        ? "text-red-200"
                                        : "text-green-200"
                                    }`}
                                  >
                                    {ing.ingredient_name || ing.name}
                                  </span>
                                  {ing.quantity && (
                                    <span className="text-gray-400 text-sm font-medium">
                                      ({ing.quantity} {ing.measurements || ""})
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">Total:</span>{" "}
                                    {ing.stock_quantity || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">
                                      Available:
                                    </span>{" "}
                                    {ing.available_stock || 0}
                                  </span>
                                  {ing.expired_stock > 0 && (
                                    <span className="flex items-center gap-1 text-red-400">
                                      <span className="font-medium">
                                        Expired:
                                      </span>{" "}
                                      {ing.expired_stock}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isProblematic && (
                              <div className="flex flex-col gap-1 sm:items-end">
                                <span
                                  className={`text-xs px-3 py-1.5 rounded-full border ${reasonProps.color} inline-flex items-center gap-1 font-medium`}
                                >
                                  {reasonProps.icon}
                                  {reasonProps.label}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {reasonProps.description}
                                </span>
                              </div>
                            )}
                            {!isProblematic && (
                              <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1.5 rounded-full border border-green-400/30 inline-flex items-center gap-1 font-medium">
                                <FaCheckCircle size={12} />
                                Available
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-xl text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-gradient-to-br from-gray-400/20 to-gray-500/20 p-4 rounded-full">
                        <FiPackage className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400 text-sm">
                        No ingredients listed for this menu item.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Image - Full Width */}
              <div className="pt-4 sm:pt-6 border-t border-gray-700/50">
                <div className="mb-4 flex items-center gap-3 bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-700/50">
                  <div className="bg-gradient-to-br from-purple-400/20 to-purple-500/20 p-2.5 rounded-lg">
                    <FiImage className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-purple-300">
                      Menu Image
                    </h2>
                    <p className="text-xs text-gray-400">
                      Dish presentation photo
                    </p>
                  </div>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl">
                  <div className="flex justify-center">
                    {menu.image_url ? (
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                        <Image
                          src={menu.image_url}
                          alt={menu.dish_name}
                          width={400}
                          height={400}
                          className="relative rounded-xl object-cover shadow-2xl border-2 border-gray-700/50 group-hover:border-purple-400/50 transition-all duration-300"
                          style={{
                            width: "100%",
                            maxWidth: "400px",
                            height: "auto",
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full max-w-md aspect-square bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-600/50">
                        <div className="bg-gradient-to-br from-gray-400/20 to-gray-500/20 p-6 rounded-full mb-4">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-16 h-16 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-400 text-sm font-medium">
                          No image available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col xs:flex-row flex-wrap justify-end gap-2 xs:gap-3 sm:gap-4 pt-2 sm:pt-4 md:pt-6 border-t border-gray-700/50">
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
                  onClick={() => router.back()}
                  className="group flex items-center justify-center gap-1.5 xs:gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-3 xs:px-4 sm:px-5 md:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl font-medium xs:font-semibold transition-all duration-300 cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto shadow-lg hover:shadow-yellow-400/25 order-1 xs:order-2"
                >
                  <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                  <span className="hidden sm:inline">Back to Menu</span>
                  <span className="sm:hidden">Back</span>
                </button>
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
                    router.push(routes.UpdateMenu(menu.menu_id));
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
