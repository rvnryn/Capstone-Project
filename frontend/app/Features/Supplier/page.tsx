/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { routes } from "@/app/routes/routes";
import { FaEdit, FaTrash, FaSearch, FaTruck } from "react-icons/fa";
import NavigationBar from "@/app/components/navigation/navigation";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupplierAPI } from "./hook/useSupplierAPI";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { MdWarning } from "react-icons/md";

type SupplierItem = {
  supplier_id: number;
  supplier_name: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  supplies?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  [key: string]: unknown;
};

export default function SupplierPage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const { listSuppliers, deleteSupplier } = useSupplierAPI();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "asc",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);

  const router = useRouter();
  const { isMenuOpen, isMobile } = useNavigation();

  // Fetch suppliers using React Query
  const { data: supplierData = [], isLoading } = useQuery<SupplierItem[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const items = await listSuppliers();
      return items.map((item: any) => ({
        ...item,
        supplier_id: item.supplier_id,
        supplier_name: item.supplier_name,
        contact_person: item.contact_person || "-",
        phone_number: item.phone_number || "-",
        email: item.email || "-",
        address: item.address || "-",
        supplies: item.supplies || "-",
        created_at: item.created_at ? new Date(item.created_at) : new Date(),
        updated_at: item.updated_at ? new Date(item.updated_at) : new Date(),
      }));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error: any) => {
      alert(
        error?.response?.data?.detail ||
          "Supplier not found or already deleted."
      );
    },
  });

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

  const handleClear = () => {
    setSearchQuery("");
    setSortConfig({ key: "", direction: "asc" });
  };

  const filtered = useMemo(() => {
    return supplierData.filter(
      (item) =>
        !searchQuery ||
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  }, [supplierData, searchQuery]);

  const sortedData = useMemo(() => {
    const data = [...filtered];
    if (!sortConfig.key) return data;
    if (sortConfig.key === "created_at") {
      return data.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        const aDate =
          aVal instanceof Date
            ? aVal
            : new Date(aVal as string | number | Date);
        const bDate =
          bVal instanceof Date
            ? bVal
            : new Date(bVal as string | number | Date);
        return sortConfig.direction === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      });
    }
    // For string columns
    return data.sort((a, b) => {
      const valA = a[sortConfig.key]?.toString().toLowerCase() || "";
      const valB = b[sortConfig.key]?.toString().toLowerCase() || "";
      return sortConfig.direction === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [filtered, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // Toggle direction if same column
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      } else {
        // First click: set column and default to "desc"
        return {
          key,
          direction: "desc",
        };
      }
    });
  };

  const confirmDelete = async () => {
    if (supplierToDelete === null) return;
    await deleteMutation.mutateAsync(supplierToDelete);
    setShowDeleteModal(false);
    queryClient.invalidateQueries({ queryKey: ["suppliers"] });
  };

  const columns = [
    { key: "supplier_id", label: "ID" },
    { key: "supplier_name", label: "Name" },
    { key: "contact_person", label: "Contact Person" },
    { key: "supplies", label: "Supplies" },
    { key: "phone_number", label: "Phone Number" },
    { key: "email", label: "Email" },
    { key: "address", label: "Address" },
    { key: "created_at", label: "Added Date" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <section className="text-white font-poppins">
      <NavigationBar showDeleteModal={showDeleteModal} />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Supplier main content"
          tabIndex={-1}
        >
          <div className="c">
            <article className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-xl xs:rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full">
              <header className="flex flex-col space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 xs:gap-3 sm:gap-4 md:gap-6">
                  <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                      <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-1.5 xs:p-2 sm:p-3 rounded-full">
                        <FaTruck className="text-black text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                        Suppliers
                      </h1>
                      <p className="text-gray-400 text-xs xs:text-sm sm:text-base mt-0.5 xs:mt-1">
                        Manage your supplier records
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 xs:gap-2 sm:gap-3 w-full sm:w-auto">
                    {["Owner", "General Manager", "Store Manager"].includes(
                      role || ""
                    ) && (
                      <button
                        onClick={() => router.push(routes.addSupplier)}
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-2 xs:px-3 sm:px-4 md:px-6 py-1.5 xs:py-2 sm:py-3 rounded-lg xs:rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-1 xs:gap-2 cursor-pointer text-xs xs:text-sm sm:text-base whitespace-nowrap"
                      >
                        + Add Supplier
                      </button>
                    )}
                  </div>
                </div>
              </header>

              <div className="relative mb-6 sm:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-4 text-yellow-400/70 text-sm">
                    Supplier Management
                  </span>
                </div>
              </div>

              <section className="mb-6 sm:mb-8" aria-label="Supplier filters">
                <form
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4"
                  role="search"
                >
                  <div className="relative flex-1 min-w-0">
                    <label htmlFor="supplier-search" className="sr-only">
                      Search suppliers
                    </label>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 pointer-events-none">
                      <FaSearch className="text-sm" />
                    </div>
                    <input
                      id="supplier-search"
                      type="text"
                      placeholder="Search suppliers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400 rounded-xl px-12 py-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-400/50 border border-gray-600/50 hover:border-gray-500 transition-all text-sm sm:text-base"
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
                    >
                      Clear Filters
                    </button>
                  )}
                </form>
              </section>

              <section
                className="bg-gray-800/30 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden"
                aria-label="Supplier table"
              >
                <div className="overflow-x-auto">
                  <table className="table-auto w-full text-xs xs:text-sm sm:text-base lg:text-lg xl:text-xl text-left border-collapse min-w-[700px]">
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
                                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                                  </span>
                                )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-8 xs:py-10 sm:py-12 md:py-14 lg:py-16 text-center"
                          >
                            <div className="flex flex-col items-center gap-2 xs:gap-3 sm:gap-4">
                              <div className="w-8 xs:w-10 sm:w-12 h-8 xs:h-10 sm:h-12 border-2 xs:border-3 sm:border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                              <div className="text-yellow-400 text-sm xs:text-base sm:text-lg md:text-xl font-medium">
                                Loading supplier data...
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : sortedData.length > 0 ? (
                        sortedData.map((item: any, index) => (
                          <tr
                            key={item.supplier_id}
                            className={`group border-b border-gray-700/30 hover:bg-gradient-to-r hover:from-yellow-400/5 hover:to-yellow-500/5 transition-all duration-200 cursor-pointer ${
                              index % 2 === 0
                                ? "bg-gray-800/20"
                                : "bg-gray-900/20"
                            }`}
                            onClick={() =>
                              router.push(routes.ViewSupplier(item.supplier_id))
                            }
                          >
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 font-medium whitespace-nowrap text-gray-300 group-hover:text-yellow-400 transition-colors text-xs xs:text-sm sm:text-base">
                              {item.supplier_id}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 font-medium whitespace-nowrap">
                              <span className="text-white group-hover:text-yellow-400 transition-colors text-xs xs:text-sm sm:text-base">
                                {item.supplier_name}
                              </span>
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm sm:text-base">
                              {item.contact_person}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300">
                              <span className="px-1 xs:px-2 py-0.5 xs:py-1 bg-gray-700/50 rounded-md xs:rounded-lg text-xs font-medium">
                                {item.supplies}
                              </span>
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm sm:text-base">
                              {item.phone_number}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm sm:text-base">
                              {item.email}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm sm:text-base">
                              {item.address}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm">
                              {formatDateTime(item.created_at)}
                            </td>
                            <td className="px-3 xl:px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1 xl:gap-2">
                                {[
                                  "Owner",
                                  "General Manager",
                                  "Store Manager",
                                ].includes(role || "") && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(
                                          routes.UpdateSupplier(
                                            item.supplier_id
                                          )
                                        );
                                      }}
                                      className="p-1 xs:p-1.5 sm:p-2 rounded-md xs:rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 hover:text-yellow-300 transition-all duration-200 cursor-pointer border border-yellow-400/20 hover:border-yellow-400/40"
                                      title="Edit"
                                    >
                                      <FaEdit className="text-xs xs:text-sm" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSupplierToDelete(item.supplier_id);
                                        setShowDeleteModal(true);
                                      }}
                                      className="p-1 xs:p-1.5 sm:p-2 rounded-md xs:rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-all duration-200 cursor-pointer border border-red-500/20 hover:border-red-500/40"
                                      title="Delete"
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
                          <td
                            colSpan={columns.length}
                            className="px-4 xl:px-6 py-12 xl:py-16 text-center"
                          >
                            <div className="flex flex-col items-center gap-4">
                              <FaTruck className="text-6xl text-gray-600" />
                              <div>
                                <h2 className="text-gray-400 font-medium mb-2">
                                  No suppliers found
                                </h2>
                                <p className="text-gray-500 text-sm">
                                  Try adjusting your search or filter criteria
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
}
