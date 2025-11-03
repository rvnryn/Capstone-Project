"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { routes } from "@/app/routes/routes";
import NavigationBar from "@/app/components/navigation/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaSortDown,
  FaCheckCircle,
  FaTimesCircle,
  FaUtensils,
  FaPlus,
  FaSort,
  FaClock,
  FaCalendarAlt,
} from "react-icons/fa";
import { useMenuAPI, MenuItem as MenuItemType } from "./hook/use-menu";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { FiEye, FiMinus, FiRefreshCw, FiTrendingDown } from "react-icons/fi";
import { MdWarning, MdCheckCircle } from "react-icons/md";
import Pagination from "@/app/components/Pagination";
import { TableLoading, EmptyState } from "@/app/components/LoadingStates";

const columns = [
  { key: "menu_id", label: "Dish ID" },
  { key: "itemcode", label: "Item Code" },
  { key: "dish_name", label: "Dish Name" },
  { key: "image_url", label: "Image" },
  { key: "category", label: "Category" },
  { key: "description", label: "Description" },
  { key: "price", label: "Price" },
  { key: "stock_status", label: "Stock Status" },
  { key: "created_at", label: "Created" },
  { key: "updated_at", label: "Last Updated" },
  { key: "actions", label: "Actions" },
];

type SortableMenuKey = keyof MenuItemType;

// Utility function to format timestamps
const formatTimestamp = (timestamp: string | undefined): string => {
  if (!timestamp) return "N/A";

  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    return "Invalid Date";
  }
};

const Menu: React.FC = () => {
  const { role } = useAuth();
  // Patch: Prevent redirect to login when offline and cached user exists
  useEffect(() => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      const cachedUser = localStorage.getItem("cachedUser");
      if (!cachedUser) {
        window.location.href = "/login";
      }
    }
  }, []);
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  const [isOnline, setIsOnline] = useState(true);
  React.useEffect(() => {
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
  const router = useRouter();
  const { fetchMenu, deleteMenu } = useMenuAPI();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Patch: Use cached data when offline, and show offline message if no cache
  const [offlineMenu, setOfflineMenu] = useState<MenuItemType[] | null>(null);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const {
    data: menuData = [],
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      // Try to fetch from network
      try {
        const items = await fetchMenu();
        if (typeof window !== "undefined") {
          localStorage.setItem("menuCache", JSON.stringify(items));
        }
        setOfflineMenu(null);
        setOfflineError(null);
        return items;
      } catch (e) {
        // On error, fallback to cache
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem("menuCache");
          if (cached) {
            const parsed = JSON.parse(cached);
            setOfflineMenu(parsed);
            setOfflineError(null);
            return parsed;
          } else {
            setOfflineMenu(null);
            setOfflineError(
              "No cached menu data available. Please connect to the internet to load menu."
            );
            return [];
          }
        }
        setOfflineMenu(null);
        setOfflineError("Failed to load cached menu data.");
        return [];
      }
    },
    refetchOnWindowFocus: true,
  });

  // Robust loading state: if offline and no cache, do not show spinner
  const shouldShowLoading =
    (isLoading || isFetching) &&
    !offlineError &&
    (typeof window === "undefined" ||
      navigator.onLine ||
      !!localStorage.getItem("menuCache"));

  // Patch: Always reconstruct icons/actions from code when offline
  let displayMenu: MenuItemType[] = [];
  if (isOnline) {
    displayMenu = menuData;
  } else if (offlineMenu) {
    displayMenu = offlineMenu.map((item) => ({
      ...item,
      // Add any computed properties here if needed
    }));
  } else {
    displayMenu = menuData;
  }

  // If offline and no cached data, show a clear message
  if (!isOnline && (!offlineMenu || offlineMenu.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-yellow-400">
        <h2>No cached menu data available.</h2>
        <p>Connect to the internet to load menu data.</p>
      </div>
    );
  }

  const handleRefresh = () => {
    console.log("Refreshing inventory table...");
    queryClient.invalidateQueries({ queryKey: ["menu"] });
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      setShowDeleteModal(false);
    },
  });

  const handleClear = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSortConfig({ key: "", direction: "asc" });
  };

  const filtered = useMemo(() => {
    return menuData.filter(
      (item: MenuItemType) =>
        (!selectedCategory || item.category === selectedCategory) &&
        (!searchQuery ||
          [
            item.dish_name,
            item.category,
            item.description,
            item.menu_id?.toString(),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()))
    );
  }, [menuData, selectedCategory, searchQuery]);

  const summaryStats = useMemo(() => {
    const total = menuData.length;
    let outOfStock = 0;
    let criticalStock = 0;
    let lowStock = 0;
    let normalStock = 0;

    menuData.forEach((item: MenuItemType) => {
      if (item.stock_status === "Out of Stock") outOfStock++;
      else if (item.stock_status === "Critical") criticalStock++;
      else if (item.stock_status === "Low") lowStock++;
      else normalStock++;
    });

    return { total, outOfStock, criticalStock, lowStock, normalStock };
  }, [menuData]);

  const sortedData = useMemo(() => {
    const data = [...filtered];
    if (!sortConfig.key) {
      return data.sort((a, b) => Number(a.menu_id) - Number(b.menu_id));
    }
    if (sortConfig.key === "price") {
      return data.sort((a, b) =>
        sortConfig.direction === "asc"
          ? Number(a.price) - Number(b.price)
          : Number(b.price) - Number(a.price)
      );
    }
    // For string columns like category, dish_name, etc.
    return data.sort((a, b) => {
      let valA = "";
      let valB = "";
      switch (sortConfig.key) {
        case "menu_id":
          valA = a.menu_id?.toString().toLowerCase() || "";
          valB = b.menu_id?.toString().toLowerCase() || "";
          break;
        case "dish_name":
          valA = a.dish_name?.toLowerCase() || "";
          valB = b.dish_name?.toLowerCase() || "";
          break;
        case "category":
          valA = a.category?.toLowerCase() || "";
          valB = b.category?.toLowerCase() || "";
          break;
        case "stock_status":
          valA = a.stock_status?.toLowerCase() || "";
          valB = b.stock_status?.toLowerCase() || "";
          break;
        case "description":
          valA = a.description?.toLowerCase() || "";
          valB = b.description?.toLowerCase() || "";
          break;
        case "created_at":
        case "updated_at":
          valA = (a[sortConfig.key as keyof MenuItemType] as string) || "";
          valB = (b[sortConfig.key as keyof MenuItemType] as string) || "";
          // For dates, we can compare them directly as ISO strings
          return sortConfig.direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        default:
          valA = "";
          valB = "";
      }
      return sortConfig.direction === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [filtered, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    deleteMutation.mutate(itemToDelete);
  };

  return (
    <section className="text-white font-poppins">
      <NavigationBar showDeleteModal={showDeleteModal} />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Menu main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            <article className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-xl xs:rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full">
              <header className="flex flex-col space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                {/* Title and Action Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 xs:gap-3 sm:gap-4 md:gap-6">
                  <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                    <div className="relative">
                      <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-1.5 xs:p-2 sm:p-3 rounded-full">
                        <FaUtensils className="text-black text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                        Menu Management
                      </h1>
                      <p className="text-gray-400 text-xs xs:text-sm sm:text-base mt-0.5 xs:mt-1">
                        Manage your restaurant menu
                      </p>
                    </div>
                  </div>
                  <nav
                    className="flex items-center gap-1 xs:gap-2 sm:gap-3 w-full sm:w-auto"
                    aria-label="Menu actions"
                  >
                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-300 hover:to-blue-400 text-black px-2 xs:px-3 sm:px-4 md:px-6 py-1.5 xs:py-2 sm:py-3 rounded-lg xs:rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-1 xs:gap-2 cursor-pointer text-xs xs:text-sm sm:text-base whitespace-nowrap"
                      disabled={!isOnline}
                    >
                      <FiRefreshCw className="text-xs xs:text-sm" />
                      <span className="sm:inline">Refresh</span>
                    </button>

                    {/* Add Item Button - disabled offline */}
                    {["Owner", "General Manager", "Store Manager"].includes(
                      role || ""
                    ) && (
                      <button
                        onClick={() => router.push(routes.addMenu)}
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-2 xs:px-3 sm:px-4 md:px-6 py-1.5 xs:py-2 sm:py-3 rounded-lg xs:rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-1 xs:gap-2 cursor-pointer text-xs xs:text-sm sm:text-base whitespace-nowrap"
                        disabled={!isOnline}
                      >
                        <FaPlus className="text-xs xs:text-sm" />
                        <span className="sm:inline">Add Menu</span>
                      </button>
                    )}
                  </nav>
                </div>
                <section
                  className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4"
                  aria-label="Menu statistics"
                >
                  <article className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg xs:rounded-xl p-2 xs:p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-400 text-xs sm:text-sm font-medium">
                          Total Dishes
                        </p>
                        <p className="text-white text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                          {summaryStats.total}
                        </p>
                      </div>
                      <FaUtensils className="text-yellow-400 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl" />
                    </div>
                  </article>
                  <article className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-lg xs:rounded-xl p-2 xs:p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-xs sm:text-sm font-medium">
                          Not Available
                        </p>
                        <p className="text-white text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                          {summaryStats.outOfStock +
                            summaryStats.criticalStock +
                            summaryStats.lowStock}
                        </p>
                      </div>
                      <FiMinus className="text-gray-400 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl" />
                    </div>
                  </article>
                  <article className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg xs:rounded-xl p-2 xs:p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-400 text-xs sm:text-sm font-medium">
                          Available
                        </p>
                        <p className="text-white text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                          {summaryStats.normalStock}
                        </p>
                      </div>
                      <MdCheckCircle className="text-green-400 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl" />
                    </div>
                  </article>
                </section>
              </header>

              <div className="relative mb-3 xs:mb-4 sm:mb-6 md:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-2 xs:px-3 sm:px-4 text-yellow-400/70 text-xs xs:text-sm">
                    Menu Management
                  </span>
                </div>
              </div>

              <section
                className="mb-6 sm:mb-8"
                aria-label="Search and filter menu"
              >
                {/* Search and Filter Row */}
                <form
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4"
                  role="search"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="relative flex-1 min-w-0">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 pointer-events-none">
                      <FaSearch className="text-sm" />
                    </div>
                    <input
                      type="search"
                      placeholder="Search by name, category, description, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400 rounded-xl px-12 py-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-400/50 border border-gray-600/50 hover:border-gray-500 transition-all text-sm sm:text-base"
                      aria-label="Search menu"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <label className="sr-only" htmlFor="category-select">
                    Filter by category
                  </label>
                  <select
                    id="category-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full sm:w-auto bg-gray-700/50 text-white rounded-lg px-3 py-2 border border-gray-600/50 focus:border-yellow-400 cursor-pointer text-sm transition-all"
                  >
                    <option value="">All Categories</option>
                    <option>Bagnet Meals</option>
                    <option>Sizzlers</option>
                    <option>Unli Rice w/ Bone Marrow</option>
                    <option>Soups w/ Bone Marrow</option>
                    <option>Combo</option>
                    <option>For Sharing</option>
                    <option>Noodles</option>
                    <option>Desserts</option>
                    <option>Sides</option>
                    <option>Drinks</option>
                    <option>Extras</option>
                  </select>
                  {(searchQuery || selectedCategory || sortConfig.key) && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-red-400 hover:text-red-300 underline cursor-pointer text-sm sm:text-base whitespace-nowrap px-2"
                      aria-label="Clear all filters"
                    >
                      Clear All
                    </button>
                  )}
                </form>
              </section>

              {/* Table Section */}
              <section
                className="bg-gray-800/30 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden"
                aria-label="Menu items table"
              >
                <div className="overflow-x-auto">
                  <table className="table-auto w-full text-xs xs:text-sm sm:text-base lg:text-lg xl:text-xl text-left border-collapse min-w-[700px]">
                    <caption className="sr-only">Menu items</caption>
                    <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                      <tr>
                        {columns.map((col) => {
                          // Add responsive visibility classes for timestamp columns
                          let responsiveClass = "";
                          if (col.key === "created_at") {
                            responsiveClass = "hidden sm:table-cell";
                          } else if (col.key === "updated_at") {
                            responsiveClass = "hidden md:table-cell";
                          }

                          return (
                            <th
                              key={col.key}
                              onClick={() =>
                                col.key !== "actions" && requestSort(col.key)
                              }
                              scope="col"
                              className={`px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 text-left font-semibold cursor-pointer select-none whitespace-nowrap text-xs xs:text-sm sm:text-base lg:text-lg transition-colors ${responsiveClass} ${
                                col.key !== "actions"
                                  ? "text-gray-300 hover:text-yellow-400"
                                  : "text-gray-300"
                              } ${
                                sortConfig.key === col.key
                                  ? "text-yellow-400"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center gap-1 xs:gap-2">
                                {col.label}
                                {sortConfig.key === col.key &&
                                  col.key !== "actions" && (
                                    <span className="text-yellow-400">
                                      {sortConfig.direction === "asc"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                {col.key !== "actions" &&
                                  sortConfig.key !== col.key && (
                                    <FaSort className="text-gray-500 text-xs opacity-50" />
                                  )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {shouldShowLoading ? (
                        <tr>
                          <td colSpan={columns.length}>
                            <TableLoading
                              rows={itemsPerPage}
                              columns={columns.length}
                              message={
                                typeof navigator !== "undefined" &&
                                navigator.onLine
                                  ? "Refreshing menu data..."
                                  : "Loading from offline cache..."
                              }
                            />
                          </td>
                        </tr>
                      ) : offlineError ? (
                        <tr>
                          <td colSpan={columns.length}>
                            <div className="flex flex-col items-center gap-4 py-12">
                              <MdWarning className="text-yellow-400 text-5xl" />
                              <div className="text-yellow-400 text-lg font-medium text-center">
                                {offlineError}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : isError ? (
                        <tr>
                          <td colSpan={columns.length}>
                            <div className="flex flex-col items-center gap-4 py-12">
                              <MdWarning className="text-red-400 text-5xl" />
                              <div className="text-red-400 text-lg font-medium text-center">
                                Error loading menu items.
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedData.length > 0 ? (
                        paginatedData.map((dish, index) => (
                          <tr
                            key={
                              dish.menu_id ??
                              `${dish.dish_name}-${
                                dish.category
                              }-${Math.random()}`
                            }
                            className={`group border-b border-gray-700/30 hover:bg-gradient-to-r hover:from-yellow-400/5 hover:to-yellow-500/5 transition-all duration-200 cursor-pointer ${
                              index % 2 === 0
                                ? "bg-gray-800/20"
                                : "bg-gray-900/20"
                            }`}
                            onClick={() => {
                              router.push(routes.ViewMenu(dish.menu_id));
                            }}
                          >
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 font-medium whitespace-nowrap text-gray-300 group-hover:text-yellow-400 transition-colors text-xs xs:text-sm sm:text-base">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 font-medium whitespace-nowrap text-gray-300 group-hover:text-yellow-400 transition-colors text-xs xs:text-sm sm:text-base">
                              {dish.itemcode || "-"}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 font-medium whitespace-nowrap">
                              <div className="flex items-center gap-1 xs:gap-2 sm:gap-3">
                                <div className="w-1.5 xs:w-2 h-1.5 xs:h-2 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <span className="text-white group-hover:text-yellow-400 transition-colors text-xs xs:text-sm sm:text-base">
                                  {dish.dish_name}
                                </span>
                              </div>
                            </td>

                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 font-inter whitespace-nowrap">
                              {dish.image_url ? (
                                <figure className="flex items-center">
                                  <div className="relative w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-12 lg:h-12 xl:w-12 xl:h-12 2xl:w-12 2xl:h-12">
                                    <Image
                                      src={dish.image_url}
                                      alt={dish.dish_name}
                                      fill
                                      sizes="48px"
                                      className="rounded-lg object-cover"
                                    />
                                  </div>
                                  <figcaption className="sr-only">
                                    {dish.dish_name}
                                  </figcaption>
                                </figure>
                              ) : (
                                <span className="text-gray-500 text-xs xs:text-sm sm:text-base">
                                  No Image
                                </span>
                              )}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300">
                              <span className="px-1 xs:px-2 py-0.5 xs:py-1 bg-gray-700/50 rounded-md xs:rounded-lg text-xs font-medium">
                                {dish.category}
                              </span>
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 max-w-[200px]">
                              {dish.description ? (
                                <div className="group relative">
                                  <span className="text-gray-300 text-xs xs:text-sm truncate block cursor-help">
                                    {dish.description}
                                  </span>
                                  {dish.description.length > 50 && (
                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-600 max-w-xs whitespace-normal">
                                      {dish.description}
                                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500 text-xs xs:text-sm italic">
                                  No description
                                </span>
                              )}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap">
                              <span className="inline-block bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 text-yellow-400 font-bold rounded-lg px-3 py-1 shadow-sm text-xs xs:text-sm border border-yellow-400/30">
                                ₱
                                {Number(dish.price).toLocaleString("en-PH", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 font-inter whitespace-nowrap">
                              {(() => {
                                const isAvailable =
                                  dish.stock_status !== "Low" &&
                                  dish.stock_status !== "Out of Stock";
                                const stockStatusLabel = isAvailable
                                  ? "Available"
                                  : dish.stock_status === "Low"
                                  ? "Low Stock"
                                  : "Out of Stock";
                                const stockStatusColor = isAvailable
                                  ? "bg-green-500/20 text-green-400 border-green-400/40"
                                  : dish.stock_status === "Low"
                                  ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/40"
                                  : "bg-red-500/20 text-red-400 border-red-400/40";
                                const stockStatusIcon = isAvailable ? (
                                  <FaCheckCircle className="inline mr-1 text-green-400" />
                                ) : dish.stock_status === "Low" ? (
                                  <FaSortDown className="inline mr-1 text-yellow-400" />
                                ) : (
                                  <FaTimesCircle className="inline mr-1 text-red-400" />
                                );
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border font-semibold text-xs sm:text-sm ${stockStatusColor} w-fit`}
                                  >
                                    {stockStatusIcon}
                                    {stockStatusLabel}
                                  </span>
                                );
                              })()}
                            </td>
                            {/* Created At Column */}
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap hidden sm:table-cell">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <span className="text-gray-300 text-xs xs:text-sm">
                                    {formatTimestamp(dish.created_at)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            {/* Updated At Column */}
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap hidden md:table-cell">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <span className="text-gray-300 text-xs xs:text-sm">
                                    {formatTimestamp(dish.updated_at)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 xl:px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1 xl:gap-2">
                                {/* Only Owner, General Manager, Store Manager can edit/delete */}
                                {[
                                  "Owner",
                                  "General Manager",
                                  "Store Manager",
                                ].includes(role || "") && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(
                                          routes.UpdateMenu(dish.menu_id)
                                        );
                                      }}
                                      className="p-1 xs:p-1.5 sm:p-2 rounded-md xs:rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 hover:text-yellow-300 transition-all duration-200 cursor-pointer border border-yellow-400/20 hover:border-yellow-400/40"
                                      title="Edit"
                                      aria-label={`Edit ${dish.dish_name}`}
                                    >
                                      <FaEdit className="text-xs xs:text-sm" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setItemToDelete(dish.menu_id);
                                        setShowDeleteModal(true);
                                      }}
                                      className="p-1 xs:p-1.5 sm:p-2 rounded-md xs:rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-all duration-200 cursor-pointer border border-red-500/20 hover:border-red-500/40"
                                      title="Delete"
                                      aria-label={`Delete ${dish.dish_name}`}
                                    >
                                      <FaTrash className="text-xs xs:text-sm" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={columns.length}>
                            <EmptyState
                              icon={<FaUtensils className="text-6xl" />}
                              title={
                                menuData.length === 0
                                  ? "No menu items found"
                                  : "No matches found"
                              }
                              message={
                                menuData.length === 0
                                  ? "Add your first menu item to get started"
                                  : "Try adjusting your search or filter criteria"
                              }
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {sortedData.length > 0 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      itemsPerPage={itemsPerPage}
                      totalItems={sortedData.length}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  )}
                </div>
              </section>
            </article>
          </div>
        </main>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 xs:p-3 sm:p-4"
          >
            <form
              method="dialog"
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-3 xs:p-4 sm:p-6 md:p-8 rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-6 max-w-xs xs:max-w-sm sm:max-w-md w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex justify-center mb-2 xs:mb-3 sm:mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg xs:blur-xl"></div>
                  <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-2 xs:p-3 sm:p-4 rounded-full">
                    <MdWarning className="text-white text-lg xs:text-xl sm:text-2xl md:text-3xl" />
                  </div>
                </div>
              </div>
              <h2
                id="delete-dialog-title"
                className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-red-400 to-red-500 bg-clip-text font-poppins"
              >
                Confirm Deletion
              </h2>
              <p className="text-gray-300 text-xs xs:text-sm sm:text-base">
                Are you sure you want to delete this menu item? This action
                cannot be undone and will permanently remove the menu item.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2 xs:gap-3 sm:gap-4 pt-1 xs:pt-2">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="group flex items-center justify-center gap-1 xs:gap-2 px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl border-2 border-red-500/70 text-red-400 hover:bg-red-500 hover:text-white font-semibold transition-all duration-300 order-2 sm:order-1 cursor-pointer text-xs xs:text-sm sm:text-base"
                >
                  <FaTrash className="group-hover:scale-110 transition-transform duration-300" />
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="group flex items-center justify-center gap-1 xs:gap-2 px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl border-2 border-gray-500/70 text-gray-400 hover:bg-gray-500 hover:text-white font-semibold transition-all duration-300 order-1 sm:order-2 cursor-pointer text-xs xs:text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
};

export default Menu;
