"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import { routes } from "@/app/routes/routes";
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
} from "react-icons/fi";
import {
  FaCheckCircle,
  FaSortDown,
  FaTimesCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

export default function ViewMenu() {
  const { role } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchMenuById } = useMenuAPI();
  const [menu, setMenu] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const menuId = searchParams.get("id");

  useEffect(() => {
    const fetchMenu = async () => {
      if (!menuId) {
        router.push(routes.menu);
        return;
      }
      try {
        const data = await fetchMenuById(Number(menuId));
        console.log("Fetched menu in view page:", data);
        setMenu(data);
      } catch (error) {
        console.error("Error fetching menu:", error);
        router.push(routes.menu);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, [menuId, router, fetchMenuById]);

  function formatDateOnly(date?: string) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatDateTime(date?: string) {
    if (!date) return "-";
    return new Date(date).toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (isLoading) {
    return (
      <section className="text-white font-poppins">
        <NavigationBar />
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
                    onClick={() => router.push(routes.menu)}
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
                <ItemRow
                  icon={<FiCalendar className="text-orange-400" />}
                  label="Added Date"
                  value={formatDateOnly(menu.created_at)}
                />
              </div>

              {/* Ingredients - Full Width */}
              <div className="pt-2 sm:pt-4 border-t border-gray-700/50">
                <ItemRow
                  icon={<FiPackage className="text-gray-400" />}
                  label="Ingredients"
                  value={
                    menu.ingredients && menu.ingredients.length > 0 ? (
                      <div>
                        <ul className="list-disc list-inside text-white space-y-2">
                          {menu.ingredients.map((ing: any, idx: number) => {
                            const reasonProps = getUnavailabilityReasonProps(
                              ing.unavailable_reason
                            );
                            const isProblematic =
                              ing.is_unavailable || ing.is_low_stock;

                            return (
                              <li
                                key={idx}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border transition-all duration-200 ${
                                  isProblematic
                                    ? "bg-red-500/5 border-red-400/20 text-red-200"
                                    : "bg-green-500/5 border-green-400/20 text-green-200"
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {ing.ingredient_name || ing.name}
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                      {ing.quantity ? `(${ing.quantity})` : ""}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    Total: {ing.stock_quantity || 0} |
                                    Available: {ing.available_stock || 0}
                                    {ing.expired_stock > 0 && (
                                      <span className="text-red-400 ml-2">
                                        | Expired: {ing.expired_stock}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isProblematic && (
                                  <div className="flex flex-col gap-1">
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full border ${reasonProps.color} inline-flex items-center`}
                                    >
                                      {reasonProps.icon}
                                      {reasonProps.label}
                                    </span>
                                    <span className="text-xs text-gray-400 text-right">
                                      {reasonProps.description}
                                    </span>
                                  </div>
                                )}
                                {!isProblematic && (
                                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-400/30 inline-flex items-center">
                                    <FaCheckCircle
                                      className="inline mr-1"
                                      size={10}
                                    />
                                    Available
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : (
                      <span className="text-gray-500">
                        No ingredients listed.
                      </span>
                    )
                  }
                  fullWidth={true}
                />
              </div>

              {/* Image - Full Width */}
              <div className="pt-2 sm:pt-4 border-t border-gray-700/50">
                <div className="mb-2 text-gray-400 text-xs sm:text-sm font-medium uppercase tracking-wider text-center">
                  Menu Image
                </div>
                <div className="flex justify-center">
                  {menu.image_url ? (
                    <Image
                      src={menu.image_url}
                      alt={menu.dish_name}
                      width={180}
                      height={180}
                      className="rounded-lg object-cover bg-gray-300"
                      style={{
                        width: "100%",
                        maxWidth: "260px",
                        height: "auto",
                      }}
                    />
                  ) : (
                    <div className="w-40 h-40 sm:w-64 sm:h-64 bg-gray-300 flex items-center justify-center rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-16 h-16 sm:w-24 sm:h-24 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9 6 9-6"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col xs:flex-row flex-wrap justify-end gap-2 xs:gap-3 sm:gap-4 pt-2 sm:pt-4 md:pt-6 border-t border-gray-700/50">
                {["Owner", "General Manager", "Store Manager"].includes(
                  role || ""
                ) && (
                  <button
                    onClick={() => router.push(routes.UpdateMenu(menu.menu_id))}
                    className="group flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 sm:px-5 md:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl border-2 border-yellow-400/50 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300 font-medium xs:font-semibold transition-all duration-300 cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto order-2 xs:order-1"
                  >
                    <FiEdit3 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="hidden sm:inline">Edit Menu Item</span>
                    <span className="sm:hidden">Edit</span>
                  </button>
                )}
                <button
                  onClick={() => router.push(routes.menu)}
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
  value: string | React.ReactNode;
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
            {typeof value === "string" || typeof value === "number" ? (
              <p
                className={`text-sm xs:text-base sm:text-lg font-medium xs:font-semibold break-words leading-tight ${
                  valueClassName || className
                }`}
              >
                {value}
              </p>
            ) : (
              <div
                className={`text-sm xs:text-base sm:text-lg font-medium xs:font-semibold break-words leading-tight ${
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
