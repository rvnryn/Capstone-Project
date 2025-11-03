"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/app/routes/routes";
import { FaSearch, FaSort, FaWarehouse, FaTrash } from "react-icons/fa";
import { MdInventory, MdCheckCircle, MdWarning } from "react-icons/md";
import { FiFilter, FiRefreshCw } from "react-icons/fi";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import NavigationBar from "@/app/components/navigation/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import { useInventoryAPI } from "../hook/use-inventoryAPI";
import { GiBiohazard } from "react-icons/gi";

type SpoilageItem = {
  spoilage_id: number;
  item_id: number;
  item_name: string;
  quantity_spoiled: number;
  spoilage_date: string;
  reason?: string | null;
  user_id?: number | null;
  created_at: string;
  updated_at: string;
  unit_price?: number | null;
};

// Extend SpoilageItem type to include batch_date, expiration_date, and category
type ExtendedSpoilageItem = SpoilageItem & {
  batch_date?: string | null;
  expiration_date?: string | null;
  category?: string | null;
};

export default function SpoilageInventoryPage() {
  // Modal state for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const { user, role } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isMobile } = useNavigation();
  const { listSpoilage, deleteSpoilage } = useInventoryAPI();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "asc",
  });

  // Patch: Use cached data when offline, and show offline message if no cache
  const [offlineSpoilage, setOfflineSpoilage] = useState<
    ExtendedSpoilageItem[] | null
  >(null);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const spoilageQuery = useQuery<ExtendedSpoilageItem[]>({
    queryKey: ["spoilageInventory"],
    queryFn: async () => {
      if (typeof window !== "undefined" && !navigator.onLine) {
        try {
          const cached = localStorage.getItem("spoilageInventoryCache");
          if (cached) {
            const parsed = JSON.parse(cached);
            setOfflineSpoilage(parsed);
            setOfflineError(null);
            return parsed;
          } else {
            setOfflineSpoilage(null);
            setOfflineError(
              "No cached spoilage data available. Please connect to the internet to load spoilage inventory."
            );
            return [];
          }
        } catch (e) {
          setOfflineSpoilage(null);
          setOfflineError("Failed to load cached spoilage data.");
          return [];
        }
      }
      // Online: fetch and cache
      const data = await listSpoilage();
      const mapped = data.map((item: any) => ({
        ...item,
        spoilage_id: Number(item.spoilage_id),
        item_id: Number(item.item_id),
        quantity_spoiled: Number(item.quantity_spoiled),
        batch_date: item.batch_date || item.batch || null,
        expiration_date: item.expiration_date || null,
        unit_price:
          item.unit_price !== undefined ? Number(item.unit_price) : null,
      }));
      if (typeof window !== "undefined") {
        localStorage.setItem("spoilageInventoryCache", JSON.stringify(mapped));
      }
      setOfflineSpoilage(null);
      setOfflineError(null);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    refetchIntervalInBackground: false, // Only poll when tab is active
    retry: 1,
  });

  const spoilageData: ExtendedSpoilageItem[] = Array.isArray(spoilageQuery.data)
    ? spoilageQuery.data
    : [];
  const isLoading = spoilageQuery.isLoading;
  const isFetching = spoilageQuery.isFetching;

  const handleRefresh = () => {
    console.log("Refreshing inventory table...");
    queryClient.invalidateQueries({ queryKey: ["spoilageInventory"] });
  };

  const formatDateOnly = (date: string | Date | null | undefined): string => {
    if (!date) return "N/A";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
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

  const filtered = useMemo(() => {
    // Only skip records where spoilage_id is null or undefined (not 0)
    const validData = spoilageData.filter((item) => {
      if (
        item.spoilage_id === null ||
        item.spoilage_id === undefined ||
        isNaN(Number(item.spoilage_id))
      ) {
        console.warn(
          "Skipping spoilage record with invalid spoilage_id:",
          item
        );
        return false;
      }
      return true;
    });
    return validData.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.spoilage_id.toString().includes(searchQuery.toLowerCase()) ||
        (item.reason || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [spoilageData, searchQuery]);

  // Do not group spoilage records; show each record as a separate row
  const groupedData = useMemo(() => filtered, [filtered]);

  const sortedData = useMemo(() => {
    const data = [...groupedData];
    if (!sortConfig.key) {
      return data.sort((a, b) => Number(a.spoilage_id) - Number(b.spoilage_id));
    }
    if (sortConfig.key === "spoilage_date") {
      return data.sort((a, b) => {
        const aDate = new Date(a.spoilage_date);
        const bDate = new Date(b.spoilage_date);
        return sortConfig.direction === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      });
    }
    if (sortConfig.key === "quantity_spoiled") {
      return data.sort((a, b) =>
        sortConfig.direction === "asc"
          ? Number(a.quantity_spoiled) - Number(b.quantity_spoiled)
          : Number(b.quantity_spoiled) - Number(a.quantity_spoiled)
      );
    }
    // For string columns
    return data.sort((a, b) => {
      const valA = (a[sortConfig.key as keyof SpoilageItem] || "")
        .toString()
        .toLowerCase();
      const valB = (b[sortConfig.key as keyof SpoilageItem] || "")
        .toString()
        .toLowerCase();
      return sortConfig.direction === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [groupedData, sortConfig]);

  const requestSort = useCallback((key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        key,
        direction: "asc",
      };
    });
  }, []);

  const handleClear = useCallback(() => {
    setSearchQuery("");
    setSortConfig({ key: "", direction: "asc" });
  }, []);

  const columns = [
    { key: "spoilage_id", label: "#" },
    { key: "item_name", label: "Name" },
    { key: "batch_date", label: "Batch Date" },
    { key: "category", label: "Category" },
    { key: "quantity_spoiled", label: "Quantity Spoiled" },
    { key: "unit_price", label: "Unit Price" },
    { key: "expiration_date", label: "Expiration Date" },
    { key: "spoilage_date", label: "Spoilage Date" },
    { key: "reason", label: "Reason" },
    { key: "actions", label: "Actions" },
  ];
  // Show modal and set target for deletion
  const handleRemove = (spoilage_id: number | undefined | null) => {
    if (typeof spoilage_id !== "number" || !spoilage_id) return;
    setDeleteTargetId(spoilage_id);
    setShowDeleteModal(true);
  };

  // Confirm delete action from modal
  const confirmDelete = async () => {
    if (deleteTargetId == null) return;
    try {
      await deleteSpoilage(deleteTargetId);
      queryClient.invalidateQueries({ queryKey: ["spoilageInventory"] });
    } catch (error: any) {
      alert("Failed to remove spoilage record. Please try again.");
    }
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  return (
    <section className="text-white font-poppins">
      <NavigationBar showDeleteModal={showDeleteModal} />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Spoilage Inventory main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            <article className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-xl xs:rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full">
              <header className="flex flex-col space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                <div className="flex items-center justify-between gap-2 xs:gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                      <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-1.5 xs:p-2 sm:p-3 rounded-full">
                        <GiBiohazard className="text-black text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                        Spoilage Inventory
                      </h1>
                      <p className="text-gray-400 text-xs xs:text-sm sm:text-base mt-0.5 xs:mt-1">
                        View and track all spoiled inventory items
                      </p>
                    </div>
                  </div>
                  <nav
                    aria-label="Inventory actions"
                    className="flex items-center gap-1 xs:gap-2 sm:gap-3"
                  >
                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-300 hover:to-blue-400 text-black px-2 xs:px-3 sm:px-4 md:px-6 py-1.5 xs:py-2 sm:py-3 rounded-lg xs:rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-1 xs:gap-2 cursor-pointer text-xs xs:text-sm sm:text-base whitespace-nowrap"
                    >
                      <FiRefreshCw className={`text-xs xs:text-sm ${isFetching ? 'animate-spin' : ''}`} />
                      <span className="sm:inline">{isFetching ? 'Syncing...' : 'Refresh'}</span>
                    </button>
                  </nav>
                </div>
              </header>

              <div className="relative mb-6 sm:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-4 text-yellow-400/70 text-sm">
                    Spoilage Inventory List
                  </span>
                </div>
              </div>

              <section className="mb-6 sm:mb-8" aria-label="Search and filters">
                <form
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4"
                  role="search"
                >
                  <div className="relative flex-1 min-w-0">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 pointer-events-none">
                      <FaSearch className="text-sm" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name"
                      value={searchQuery}
                      onChange={(e) => {
                        // Only allow letters and spaces
                        const value = e.target.value.replace(
                          /[^a-zA-Z\s]/g,
                          ""
                        );
                        setSearchQuery(value);
                      }}
                      className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl px-12 py-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-400/50 border border-gray-600/50 hover:border-gray-500 transition-all text-sm sm:text-base"
                      aria-label="Search inventory"
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
                  {(searchQuery || sortConfig.key) && (
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
              <section
                className="bg-gray-800/30 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden"
                aria-label="Spoilage table"
              >
                <div className="overflow-x-auto">
                  {isLoading || isFetching ? (
                    offlineError ? (
                      <div className="flex flex-col items-center gap-2 xs:gap-3 sm:gap-4 py-12">
                        <MdWarning className="text-yellow-400 text-3xl mx-auto" />
                        <div className="text-yellow-400 text-sm xs:text-base sm:text-lg md:text-xl font-medium">
                          {offlineError}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 xs:gap-3 sm:gap-4 py-12">
                        <div className="w-8 xs:w-10 sm:w-12 h-8 xs:h-10 sm:h-12 border-2 xs:border-3 sm:border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                        <div className="text-yellow-400 text-sm xs:text-base sm:text-lg md:text-xl font-medium">
                          Loading spoilage data...
                        </div>
                      </div>
                    )
                  ) : (
                    <table className="table-auto w-full text-xs xs:text-sm sm:text-base lg:text-lg xl:text-xl text-left border-collapse min-w-[700px]">
                      <caption className="sr-only">
                        Spoilage Inventory Table
                      </caption>
                      <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                        <tr>
                          {columns.map((col) => (
                            <th
                              key={col.key}
                              onClick={() =>
                                col.key !== "actions" && requestSort(col.key)
                              }
                              className={`px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 text-left font-semibold cursor-pointer select-none whitespace-nowrap text-xs xs:text-sm sm:text-base lg:text-lg transition-colors ${
                                col.key !== "actions"
                                  ? "text-gray-300 hover:text-yellow-400"
                                  : "text-gray-300"
                              } ${
                                sortConfig.key === col.key
                                  ? "text-yellow-400"
                                  : ""
                              }`}
                              scope="col"
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
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedData.length > 0 ? (
                          sortedData.map(
                            (item: ExtendedSpoilageItem, index) => (
                              <tr
                                key={item.spoilage_id}
                                className={`group border-b border-gray-700/30 hover:bg-gradient-to-r hover:from-yellow-400/5 hover:to-yellow-500/5 transition-all duration-200 cursor-pointer ${
                                  index % 2 === 0
                                    ? "bg-gray-800/20"
                                    : "bg-gray-900/20"
                                }`}
                              >
                                <td
                                  className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 font-medium whitespace-nowrap text-gray-300 group-hover:text-yellow-400 transition-colors text-xs xs:text-sm sm:text-base"
                                  onClick={() =>
                                    router.push(
                                      routes.ViewSpoilageInventory(
                                        item.spoilage_id
                                      )
                                    )
                                  }
                                >
                                  {index + 1}
                                </td>
                                <td
                                  className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 font-medium whitespace-nowrap"
                                  onClick={() =>
                                    router.push(
                                      routes.ViewSpoilageInventory(
                                        item.spoilage_id
                                      )
                                    )
                                  }
                                >
                                  {item.item_name}
                                </td>
                                <td
                                  className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm"
                                  onClick={() =>
                                    router.push(
                                      routes.ViewSpoilageInventory(
                                        item.spoilage_id
                                      )
                                    )
                                  }
                                >
                                  {item.batch_date
                                    ? formatDateOnly(item.batch_date)
                                    : "N/A"}
                                </td>
                                <td
                                  className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm"
                                  onClick={() =>
                                    router.push(
                                      routes.ViewSpoilageInventory(
                                        item.spoilage_id
                                      )
                                    )
                                  }
                                >
                                  {item.category || "-"}
                                </td>
                                <td
                                  className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-white font-semibold text-sm xs:text-base sm:text-lg"
                                  onClick={() =>
                                    router.push(
                                      routes.ViewSpoilageInventory(
                                        item.spoilage_id
                                      )
                                    )
                                  }
                                >
                                  {item.quantity_spoiled}
                                </td>
                                <td
                                  className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-green-300 text-xs xs:text-sm"
                                  onClick={() =>
                                    router.push(
                                      routes.ViewSpoilageInventory(
                                        item.spoilage_id
                                      )
                                    )
                                  }
                                >
                                  {item.unit_price !== undefined &&
                                  item.unit_price !== null
                                    ? `$${item.unit_price.toFixed(2)}`
                                    : "-"}
                                </td>
                                <td
                                  className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm"
                                  onClick={() =>
                                    router.push(
                                      routes.ViewSpoilageInventory(
                                        item.spoilage_id
                                      )
                                    )
                                  }
                                >
                                  {item.expiration_date
                                    ? formatDateOnly(item.expiration_date)
                                    : "No Expiration Date"}
                                </td>
                                <td
                                  className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm"
                                  onClick={() =>
                                    router.push(
                                      routes.ViewSpoilageInventory(
                                        item.spoilage_id
                                      )
                                    )
                                  }
                                >
                                  {formatDateOnly(item.spoilage_date)}
                                </td>
                                <td
                                  className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm"
                                  onClick={() =>
                                    router.push(
                                      routes.ViewSpoilageInventory(
                                        item.spoilage_id
                                      )
                                    )
                                  }
                                >
                                  {item.reason || "-"}
                                </td>
                                <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-center">
                                  <button
                                    type="button"
                                    className="bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 text-xs xs:text-sm shadow transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemove(Number(item.spoilage_id));
                                    }}
                                    aria-label="Remove spoilage record"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            )
                          )
                        ) : (
                          <tr>
                            <td
                              colSpan={columns.length}
                              className="px-4 xl:px-6 py-12 xl:py-16 text-center"
                            >
                              <div className="flex flex-col items-center gap-4">
                                <MdInventory className="text-6xl text-gray-600" />
                                <div>
                                  <h3 className="text-gray-400 font-medium mb-2">
                                    No spoilage records found
                                  </h3>
                                  <p className="text-gray-500 text-sm">
                                    No items have been marked as spoiled yet.
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </article>
          </div>
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
                  Are you sure you want to delete this item? This action cannot
                  be undone and will permanently remove the item from your
                  inventory.
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
        </main>
      </ResponsiveMain>
    </section>
  );
}
