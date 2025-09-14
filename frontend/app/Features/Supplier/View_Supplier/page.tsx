"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { routes } from "@/app/routes/routes";
import NavigationBar from "@/app/components/navigation/navigation";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import { useSupplierAPI } from "@/app/Features/Supplier/hook/useSupplierAPI";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import {
  FiEye,
  FiHash,
  FiTag,
  FiPackage,
  FiTrendingUp,
  FiCalendar,
  FiEdit3,
  FiArrowLeft,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiClock,
} from "react-icons/fi";

export default function ViewSupplier() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMenuOpen, isMobile } = useNavigation();
  const { getSupplier } = useSupplierAPI();
  const [supplier, setSupplier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supplierId = searchParams.get("id");

  useEffect(() => {
    const fetchSupplier = async () => {
      if (!supplierId) {
        router.push(routes.supplier);
        return;
      }

      try {
        const data = await getSupplier(supplierId);
        const formatted = {
          id: data.supplier_id,
          name: data.supplier_name,
          contact_person: data.contact_person ?? "-",
          supplies: data.supplies ?? "-",
          phone_number: data.phone_number ?? "-",
          email: data.email ?? "-",
          address: data.address ?? "-",
          created_at: data.created_at ? formatDateTime(data.created_at) : "-",
          updated_at: data.updated_at ? formatDateTime(data.updated_at) : "-",
        };
        setSupplier(formatted);
      } catch (error) {
        console.error("Error fetching supplier:", error);
        router.push(routes.supplier);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplier();
  }, [supplierId, router, getSupplier]);

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

  const getMainContentStyles = () =>
    `transition-all duration-300 pb-8 md:pb-12 pt-28 px-4 sm:px-6 md:px-8 lg:px-10 ${
      isMobile ? "ml-0" : isMenuOpen ? "ml-64" : "ml-20"
    }`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500">
        <NavigationBar />
        <main className={getMainContentStyles()}>
          <div className="max-w-3xl mx-auto">
            <div className="bg-black rounded-3xl shadow-2xl p-10 flex justify-center items-center">
              <div className="animate-pulse text-yellow-400 text-xl font-semibold">
                Loading supplier details...
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500">
        <NavigationBar />
        <main className={getMainContentStyles()}>
          <div className="max-w-3xl mx-auto">
            <div className="bg-black rounded-3xl shadow-2xl p-10 text-center">
              <h2 className="text-2xl text-yellow-400 mb-4 font-bold">
                Supplier Not Found
              </h2>
              <button
                onClick={() => router.push(routes.supplier)}
                className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-xl font-semibold transition-all duration-200"
              >
                Back to Suppliers
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <section className="text-white font-poppins">
      <NavigationBar />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Supplier main content"
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
                    Supplier Details
                  </h1>
                  <div className="text-gray-400 text-xs sm:text-sm mt-1">
                    View complete supplier information
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

              {/* Supplier Information Grid */}
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  <ItemRow
                    icon={<FiHash className="text-yellow-400" />}
                    label="Supplier ID"
                    value={supplier.id}
                  />
                  <ItemRow
                    icon={<FiTag className="text-blue-400" />}
                    label="Supplier Name"
                    value={supplier.name}
                  />
                  <ItemRow
                    icon={<FiUser className="text-purple-400" />}
                    label="Contact Person"
                    value={supplier.contact_person}
                  />
                  <ItemRow
                    icon={<FiPackage className="text-green-400" />}
                    label="Supplies"
                    value={supplier.supplies}
                  />
                  <ItemRow
                    icon={<FiPhone className="text-cyan-400" />}
                    label="Phone Number"
                    value={supplier.phone_number}
                  />
                  <ItemRow
                    icon={<FiMail className="text-orange-400" />}
                    label="Email"
                    value={supplier.email}
                  />
                  <ItemRow
                    icon={<FiMapPin className="text-gray-400" />}
                    label="Address"
                    value={supplier.address}
                  />
                  <ItemRow
                    icon={<FiClock className="text-yellow-400" />}
                    label="Added Date"
                    value={supplier.created_at}
                  />
                </div>

                {/* Last Updated - Full Width */}
                <div className="pt-4 border-t border-gray-700/50">
                  <ItemRow
                    icon={<FiClock className="text-gray-400" />}
                    label="Last Updated"
                    value={supplier.updated_at}
                    fullWidth={true}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col xs:flex-row flex-wrap justify-end gap-2 xs:gap-3 sm:gap-4 pt-2 sm:pt-4 md:pt-6 border-t border-gray-700/50">
                <button
                  onClick={() =>
                    router.push(`${routes.UpdateSupplier(supplier.id)}`)
                  }
                  className="group flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 sm:px-5 md:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl border-2 border-yellow-400/50 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300 font-medium xs:font-semibold transition-all duration-300 cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto order-2 xs:order-1"
                >
                  <FiEdit3 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="hidden sm:inline">Edit Supplier</span>
                  <span className="sm:hidden">Edit</span>
                </button>
                <button
                  onClick={() => router.push(routes.supplier)}
                  className="group flex items-center justify-center gap-1.5 xs:gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-3 xs:px-4 sm:px-5 md:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl font-medium xs:font-semibold transition-all duration-300 cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto shadow-lg hover:shadow-yellow-400/25 order-1 xs:order-2"
                >
                  <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                  <span className="hidden sm:inline">Back to Suppliers</span>
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
