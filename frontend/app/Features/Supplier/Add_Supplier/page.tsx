"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/app/routes/routes";
import Image from "next/image";
import NavigationBar from "@/app/components/navigation/navigation";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import { useSupplierAPI } from "@/app/Features/Supplier/hook/useSupplierAPI";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { FaTruck } from "react-icons/fa";
import { MdCancel, MdSave } from "react-icons/md";
import { FiAlertTriangle, FiArrowRight, FiX } from "react-icons/fi";

export default function AddSupplier() {
  const router = useRouter();
  const { addSupplier } = useSupplierAPI();

  const [formData, setFormData] = useState({
    supplier_name: "",
    contact_person: "",
    phone_number: "",
    email: "",
    address: "",
    supplies: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [initialSettings, setInitialSettings] = useState<any>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setIsDirty(true);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  // Validation regex
  const phoneRegex = /^(?:\+63|0)\d{10}$/;
  const nameRegex = /^[A-Za-z\s.'-]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = useCallback((data: typeof formData) => {
    const newErrors: Record<string, string> = {};

    // Supplier Name validation
    if (!data.supplier_name.trim()) {
      newErrors.supplier_name = "Supplier name is required.";
    } else if (!nameRegex.test(data.supplier_name.trim())) {
      newErrors.supplier_name =
        "Supplier name should only contain letters, spaces, period, apostrophe, and dash.";
    }

    // Contact Person validation
    if (data.contact_person && !nameRegex.test(data.contact_person.trim())) {
      newErrors.contact_person =
        "Contact person should only contain letters, spaces, period, apostrophe, and dash.";
    }

    // Phone Number validation
    if (!data.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required.";
    } else if (!phoneRegex.test(data.phone_number.trim())) {
      newErrors.phone_number =
        "Phone number must be in +63XXXXXXXXXX or 09XXXXXXXXX format.";
    }

    // Email validation
    if (data.email && !emailRegex.test(data.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Address validation
    if (!data.address.trim()) {
      newErrors.address = "Address is required.";
    }

    // Supplies validation
    if (!data.supplies.trim()) {
      newErrors.supplies = "Supplies field cannot be empty.";
    } else if (/\d/.test(data.supplies.trim())) {
      newErrors.supplies = "Supplies should not contain numbers.";
    }

    return newErrors;
  }, []);

  useEffect(() => {
    if (isSubmitted) {
      setErrors(validate(formData));
    }
  }, [formData, validate, isSubmitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setIsSubmitting(true);

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    // Only proceed if there are no errors
    if (Object.keys(validationErrors).length > 0) {
      setIsSubmitting(false);
      return;
    }

    try {
      await addSupplier({
        supplier_name: formData.supplier_name.trim(),
        contact_person: formData.contact_person.trim(),
        phone_number: formData.phone_number.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        supplies: formData.supplies.trim(),
      });

      setFormData({
        supplier_name: "",
        contact_person: "",
        phone_number: "",
        email: "",
        address: "",
        supplies: "",
      });
      setIsDirty(false);
      setIsSubmitting(false);

      setShowSuccessMessage(true);
      setFormData({
        supplier_name: "",
        contact_person: "",
        phone_number: "",
        email: "",
        address: "",
        supplies: "",
      });
      setIsDirty(false);

      setTimeout(() => {
        setShowSuccessMessage(false);
        router.push(routes.supplier);
      }, 2000);
    } catch (error) {
      console.error("Error adding supplier:", error);
      alert("Failed to add supplier. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelModal(true);
    } else {
      router.push(routes.supplier);
    }
  };

  const handleConfirmCancel = (confirm: boolean) => {
    if (confirm) {
      router.push(routes.supplier);
    }
    setShowCancelModal(false);
  };

  useEffect(() => {
    setInitialSettings({
      supplier_name: "",
      contact_person: "",
      phone_number: "",
      email: "",
      address: "",
      supplies: "",
    });
  }, []);

  const isSettingsChanged = () => {
    if (!initialSettings) return false;
    return (
      initialSettings.supplier_name !== formData.supplier_name ||
      initialSettings.contact_person !== formData.contact_person ||
      initialSettings.phone_number !== formData.phone_number ||
      initialSettings.email !== formData.email ||
      initialSettings.address !== formData.address ||
      initialSettings.supplies !== formData.supplies
    );
  };

  const handleSidebarNavigate = (path: string) => {
    if (isSettingsChanged()) {
      setShowUnsavedModal(true);
      setPendingRoute(path);
      return false;
    }
    return true;
  };

  const handleConfirmUnsaved = () => {
    setShowUnsavedModal(false);
    if (pendingRoute) {
      router.push(pendingRoute);
      setPendingRoute(null);
    }
  };
  const handleCancelUnsaved = () => {
    setShowUnsavedModal(false);
    setPendingRoute(null);
  };

  return (
    <section>
      <NavigationBar
        onNavigate={handleSidebarNavigate}
        showCancelModal={showCancelModal}
        showUnsavedModal={showUnsavedModal}
      />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Add Master Inventory main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full">
              <div className="flex flex-row items-center justify-center gap-4 mb-6 w-full">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                  <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-full">
                    <FaTruck className="text-black text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl" />
                  </div>
                </div>
                <div className="flex flex-col justify-center w-full">
                  <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins text-left w-full">
                    Add Supplier
                  </h2>
                  <p className="text-gray-400 text-base mt-1 text-left w-full">
                    Add new supplier details
                  </p>
                </div>
              </div>
              <div className="relative mb-3 xs:mb-4 sm:mb-6 md:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-2 xs:px-3 sm:px-4 text-yellow-400/70 text-xs xs:text-sm">
                    Enter Supplier Details
                  </span>
                </div>
              </div>
              <form
                onSubmit={handleSubmit}
                className="space-y-3 xs:space-y-4 sm:space-y-6 md:space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                  <div className="space-y-4">
                    <div className="group">
                      <label
                        htmlFor="supplier_name"
                        className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                      >
                        Supplier Name
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="supplier_name"
                        name="supplier_name"
                        required
                        value={formData.supplier_name}
                        onChange={handleChange}
                        placeholder="Enter supplier name..."
                        className="w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 text-xs xs:text-sm sm:text-base transition-all duration-300 placeholder-gray-500 border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        pattern="[A-Za-z\s.'-]+"
                        title="Only letters, spaces, period, apostrophe, and dash allowed"
                      />
                    </div>
                    <div className="group">
                      <label
                        htmlFor="contact_person"
                        className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                      >
                        Contact Person
                      </label>
                      <input
                        type="text"
                        id="contact_person"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleChange}
                        placeholder="Enter contact person..."
                        className="w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 text-xs xs:text-sm sm:text-base transition-all duration-300 placeholder-gray-500 border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        pattern="[A-Za-z\s.'-]+"
                        title="Only letters, spaces, period, apostrophe, and dash allowed"
                      />
                    </div>
                    <div className="group">
                      <label
                        htmlFor="phone_number"
                        className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                      >
                        Phone Number
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="phone_number"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="Enter phone number..."
                        className="w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 text-xs xs:text-sm sm:text-base transition-all duration-300 placeholder-gray-500 border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        pattern="^(?:\+63|0)\d{10}$"
                        title="Enter a valid phone number (+63XXXXXXXXXX or 09XXXXXXXXX)"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="group">
                      <label
                        htmlFor="email"
                        className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email..."
                        className="w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 text-xs xs:text-sm sm:text-base transition-all duration-300 placeholder-gray-500 border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                      />
                    </div>
                    <div className="group">
                      <label
                        htmlFor="address"
                        className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                      >
                        Address
                        <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Enter address..."
                        className="w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 text-xs xs:text-sm sm:text-base transition-all duration-300 placeholder-gray-500 border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70 resize-y"
                        required
                      />
                    </div>
                    <div className="group">
                      <label
                        htmlFor="supplies"
                        className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                      >
                        Supplies
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="supplies"
                        name="supplies"
                        value={formData.supplies}
                        onChange={handleChange}
                        placeholder="Enter supplies..."
                        className="w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 text-xs xs:text-sm sm:text-base transition-all duration-300 placeholder-gray-500 border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        pattern="[^0-9]+"
                        title="Numbers are not allowed"
                        required
                      />
                    </div>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex flex-col xs:flex-row justify-end gap-2 xs:gap-3 sm:gap-4 md:gap-4 pt-4 xs:pt-5 sm:pt-6 md:pt-8 border-t border-gray-700/50">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex items-center justify-center gap-2 xs:gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-4 xs:px-5 sm:px-6 md:px-8 py-3 xs:py-4 sm:py-4 rounded-lg xs:rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm xs:text-base sm:text-base w-full sm:w-auto shadow-lg hover:shadow-yellow-400/25"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3 xs:w-4 h-3 xs:h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <MdSave className="group-hover:scale-110 transition-transform duration-300 text-xs xs:text-sm sm:text-base" />
                        Add Item
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="group flex items-center justify-center gap-2 xs:gap-2 px-4 xs:px-5 sm:px-6 md:px-8 py-3 xs:py-4 sm:py-4 rounded-lg xs:rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 cursor-pointer text-sm xs:text-base sm:text-base w-full sm:w-auto"
                  >
                    <MdCancel className="group-hover:rotate-180 transition-transform duration-300 text-base xs:text-lg sm:text-base" />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transfer-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <form
              method="dialog"
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-red-400/20 to-red-500/20 rounded-full flex items-center justify-center">
                <MdCancel className="w-8 h-8 text-red-400" />
              </div>
              <h3
                id="transfer-dialog-title"
                className="text-xl sm:text-2xl font-bold text-white mb-2"
              >
                Cancel Changes
              </h3>
              <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                Are you sure you want to cancel? All unsaved changes will be
                lost.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base order-2 sm:order-1 cursor-pointer"
                >
                  <span className="hidden sm:inline">No, Go Back</span>
                  <span className="sm:hidden">Keep</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmCancel(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-300 hover:to-red-400 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-red-400/25 order-1 sm:order-2 cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                  <span className="hidden sm:inline">Yes, Cancel</span>
                  <span className="sm:hidden">Cancel</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Unsaved Changes Modal */}
        {showUnsavedModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transfer-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <form
              method="dialog"
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-orange-400/20 to-orange-500/20 rounded-full flex items-center justify-center">
                <FiAlertTriangle className="w-8 h-8 text-orange-400" />
              </div>
              <h3
                id="transfer-dialog-title"
                className="text-xl sm:text-2xl font-bold text-white mb-2"
              >
                Unsaved Changes
              </h3>
              <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                You have unsaved changes. Are you sure you want to leave without
                saving?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleCancelUnsaved}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base order-2 sm:order-1 cursor-pointer"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUnsaved}
                  className="flex-2 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-400 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-orange-400/25 order-1 sm:order-2 cursor-pointer"
                >
                  <FiArrowRight className="w-5 h-5" />
                  <span className="hidden sm:inline">Leave Without Saving</span>
                  <span className="sm:hidden">Leave</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
}
