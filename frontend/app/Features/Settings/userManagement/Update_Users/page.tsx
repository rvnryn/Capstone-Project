/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { routes } from "@/app/routes/routes";
import NavigationBar from "@/app/components/navigation/navigation";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import { useUsersAPI } from "../hook/use-user";
import { FaUsers } from "react-icons/fa";
import type { User } from "../hook/use-user";
import { FiAlertTriangle, FiArrowRight } from "react-icons/fi";
import ResponsiveMain from "@/app/components/ResponsiveMain";

const ROLE_OPTIONS = [
  "Owner",
  "General Manager",
  "Store Manager",
  "Assistant Store Manager",
];

const STATUS_OPTIONS = ["active", "inactive"];

export default function EditUser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMenuOpen, isMobile } = useNavigation();
  const { getUser, updateUser, changeUserPassword } = useUsersAPI();
  const userId = searchParams.get("id");

  const [formData, setFormData] = useState<Partial<User>>({});
  const [errors, setErrors] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    re_password: "",
    user_role: "",
    status: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Add state for password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [reEnterPassword, setReEnterPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [initialSettings, setInitialSettings] = useState<any>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        router.push(routes.user_management_settings);
        return;
      }

      try {
        const data = await getUser(userId);
        setFormData({
          user_id: data.user_id,
          auth_id: data.auth_id,
          name: data.name,
          username: data.username,
          email: data.email,
          user_role: data.user_role,
          status: data.status,
        });

        setInitialSettings(data);
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push(routes.user_management_settings);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId, router, getUser]);

  // Validation logic
  const validate = useCallback((data: Partial<User>) => {
    const newErrors = {
      name: "",
      username: "",
      email: "",
      password: "",
      re_password: "",
      user_role: "",
      status: "",
    };

    if (!data.name || !data.name.trim()) {
      newErrors.name = "Name is required.";
    } else if (data.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    if (!data.username || !data.username.trim()) {
      newErrors.username = "Username is required.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username.trim())) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores.";
    }

    if (!data.email || !data.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(data.email.trim())) {
      newErrors.email = "Enter a valid Gmail address.";
    }

    if (!data.user_role) {
      newErrors.user_role = "User role is required.";
    } else if (!ROLE_OPTIONS.includes(data.user_role)) {
      newErrors.user_role = "Invalid role selected.";
    }

    if (!data.status) {
      newErrors.status = "Status is required.";
    } else if (!STATUS_OPTIONS.includes(data.status)) {
      newErrors.status = "Invalid status selected.";
    }

    return newErrors;
  }, []);

  useEffect(() => {
    if (isSubmitted) {
      setErrors(validate(formData));
    }
  }, [formData, validate, isSubmitted]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitted(true);
    setIsSubmitting(true);
    setErrorMessage(null);

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (
      validationErrors.name ||
      validationErrors.username ||
      validationErrors.email ||
      validationErrors.user_role ||
      validationErrors.status ||
      validationErrors.re_password
    ) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Explicitly construct payload without user_id
      const payload: any = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        user_role: formData.user_role,
        status: formData.status,
      };

      await updateUser(userId, payload);

      router.push(routes.user_management_settings);
    } catch {
      setErrorMessage("Failed to update the user. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleSaveClick = () => {
    if (isDirty) {
      setShowSaveModal(true);
    } else {
      router.push(routes.user_management_settings);
    }
  };

  const handleConfirmSave = () => {
    setShowSaveModal(false);
    handleSubmit(new Event("submit") as unknown as React.FormEvent);
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelModal(true);
    } else {
      router.push(routes.user_management_settings);
    }
  };

  const handleConfirmCancel = (confirm: boolean) => {
    if (confirm) {
      router.push(routes.user_management_settings);
    }
    setShowCancelModal(false);
  };

  const isSettingsChanged = () => {
    if (!initialSettings) return false;
    // Compare all relevant fields for your page!
    return (
      initialSettings.name !== formData.name ||
      initialSettings.username !== formData.username ||
      initialSettings.email !== formData.email ||
      initialSettings.user_role !== formData.user_role ||
      initialSettings.status !== formData.status
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

  if (isLoading) {
    return (
      <section className="text-white font-poppins w-full min-h-screen">
        <NavigationBar onNavigate={handleSidebarNavigate} />
        <ResponsiveMain>
          <main
            className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
            aria-label="Edit User main content"
            tabIndex={-1}
          >
            <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
              <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full">
                <div className="flex flex-row items-center justify-center gap-4 mb-6 w-full">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-lg"></div>
                    <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-full">
                      <FaUsers className="text-black text-2xl md:text-3xl lg:text-4xl" />
                    </div>
                  </div>
                  <div className="flex flex-col justify-center w-full">
                    <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins text-left w-full">
                      Edit User Information
                    </h2>
                    <p className="text-gray-400 text-base mt-1 text-left w-full">
                      Update user details and permissions
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex flex-col items-center gap-2 xs:gap-3 sm:gap-4">
                    <div className="w-8 xs:w-10 sm:w-12 h-8 xs:h-10 sm:h-12 border-2 xs:border-3 sm:border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                    <div className="text-yellow-400 font-medium text-sm xs:text-base">
                      Loading user details...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </ResponsiveMain>
      </section>
    );
  }

  return (
    <section className="text-white font-poppins w-full min-h-screen">
      <NavigationBar
        onNavigate={handleSidebarNavigate}
        showUnsavedModal={showUnsavedModal}
        showCancelModal={showCancelModal}
        showSaveModal={showSaveModal}
      />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Edit User main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full">
              <div className="flex flex-row items-center justify-center gap-4 mb-6 w-full">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                  <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-full">
                    <FaUsers className="text-black text-2xl md:text-3xl lg:text-4xl" />
                  </div>
                </div>
                <div className="flex flex-col justify-center w-full">
                  <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins text-left w-full">
                    Edit User Information
                  </h2>
                  <p className="text-gray-400 text-base mt-1 text-left w-full">
                    Update user details and permissions
                  </p>
                </div>
              </div>

              <div className="relative mb-3 xs:mb-4 sm:mb-6 md:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-2 xs:px-3 sm:px-4 text-yellow-400/85 text-xs xs:text-sm">
                    User Details
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-3 xs:space-y-4 sm:space-y-6 md:space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                  <div className="group">
                    <label
                      htmlFor="user_id"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base"
                    >
                      User ID
                    </label>
                    <input
                      type="text"
                      id="user_id"
                      name="user_id"
                      value={formData.user_id ?? ""}
                      readOnly
                      disabled
                      className="w-full bg-gray-700/50 text-gray-400 rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 border-gray-600/30 cursor-not-allowed text-xs xs:text-sm sm:text-base"
                    />
                  </div>

                  <div className="group">
                    <label
                      htmlFor="name"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base"
                    >
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name || ""}
                      onChange={handleChange}
                      placeholder="Enter name..."
                      className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 text-xs xs:text-sm sm:text-base transition-all duration-300 placeholder-gray-500 ${
                        isSubmitted && errors.name
                          ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                          : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                      }`}
                    />
                    {isSubmitted && errors.name && (
                      <div className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 text-red-400 text-xs sm:text-sm">
                        {errors.name}
                      </div>
                    )}
                  </div>

                  <div className="group">
                    <label
                      htmlFor="username"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base"
                    >
                      Username <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      required
                      value={formData.username || ""}
                      onChange={handleChange}
                      placeholder="Enter username..."
                      className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 text-xs xs:text-sm sm:text-base transition-all duration-300 placeholder-gray-500 ${
                        isSubmitted && errors.username
                          ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                          : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                      }`}
                    />
                    {isSubmitted && errors.username && (
                      <div className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 text-red-400 text-xs sm:text-sm">
                        {errors.username}
                      </div>
                    )}
                  </div>

                  <div className="group">
                    <label
                      htmlFor="email"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base"
                    >
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email || ""}
                      onChange={handleChange}
                      placeholder="Enter email..."
                      className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 text-xs xs:text-sm sm:text-base transition-all duration-300 placeholder-gray-500 ${
                        isSubmitted && errors.email
                          ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                          : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                      }`}
                    />
                    {isSubmitted && errors.email && (
                      <div className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 text-red-400 text-xs sm:text-sm">
                        {errors.email}
                      </div>
                    )}
                  </div>

                  <div className="group">
                    <label
                      htmlFor="user_role"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base"
                    >
                      User Role <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="user_role"
                      name="user_role"
                      required
                      value={formData.user_role || ""}
                      onChange={handleChange}
                      className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-xl px-4 py-3 sm:px-5 sm:py-4 border-2 text-sm sm:text-base transition-all duration-300 cursor-pointer ${
                        isSubmitted && errors.user_role
                          ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                          : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                      }`}
                    >
                      <option value="" className="bg-gray-800">
                        Select Role...
                      </option>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role} className="bg-gray-800">
                          {role}
                        </option>
                      ))}
                    </select>
                    {isSubmitted && errors.user_role && (
                      <div className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 text-red-400 text-xs sm:text-sm">
                        {errors.user_role}
                      </div>
                    )}
                  </div>

                  <div className="group">
                    <label
                      htmlFor="status"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base"
                    >
                      Status <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="status"
                      name="status"
                      required
                      value={formData.status || "active"}
                      onChange={handleChange}
                      className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-xl px-4 py-3 sm:px-5 sm:py-4 border-2 text-sm sm:text-base transition-all duration-300 cursor-pointer ${
                        isSubmitted && errors.status
                          ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                          : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                      }`}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                    {isSubmitted && errors.status && (
                      <div className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 text-red-400 text-xs sm:text-sm">
                        {errors.status}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col xs:flex-row justify-end gap-2 xs:gap-3 sm:gap-4 md:gap-4 pt-4 xs:pt-5 sm:pt-6 md:pt-8 border-t border-gray-700/50">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="group flex items-center justify-center gap-1.5 xs:gap-2 px-4 xs:px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 xs:py-3 sm:py-3.5 md:py-4 rounded-lg xs:rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-medium xs:font-semibold transition-all duration-300 cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto order-2 xs:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveClick}
                    disabled={isSubmitting}
                    className="group flex items-center justify-center gap-1.5 xs:gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-4 xs:px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 xs:py-3 sm:py-3.5 md:py-4 rounded-lg xs:rounded-xl font-medium xs:font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto shadow-lg hover:shadow-yellow-400/25 order-1 xs:order-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 border-2 border-black/30 border-t-black rounded-full animate-spin">
                          <span className="hidden xs:inline">Saving...</span>
                          <span className="xs:hidden">Save</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Save Changes</span>
                        <span className="sm:hidden">Save</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(true);
                      setNewPassword("");
                      setPasswordError("");
                    }}
                    className="group flex items-center justify-center gap-1.5 xs:gap-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-300 hover:to-blue-400 text-white px-4 xs:px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 xs:py-3 sm:py-3.5 md:py-4 rounded-lg xs:rounded-xl font-medium xs:font-semibold transition-all duration-300 cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto shadow-lg hover:shadow-blue-400/25"
                  >
                    Change Password
                  </button>
                </div>

                {errorMessage && (
                  <div className="mt-4 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-400">
                      <span className="flex-shrink-0">!</span>
                      <p className="text-sm">{errorMessage}</p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </main>

        {/* Save Confirmation Modal */}
        {showSaveModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <form
              method="dialog"
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-full flex items-center justify-center">
                <span className="text-yellow-400 text-3xl">!</span>
              </div>
              <h3
                id="save-dialog-title"
                className="text-xl sm:text-2xl font-bold text-white mb-2"
              >
                Save Changes
              </h3>
              <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                Are you sure you want to save these changes to the user?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base order-2 sm:order-1 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-4 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-lg hover:shadow-yellow-400/25 order-1 sm:order-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin">
                        <span className="hidden sm:inline">Saving...</span>
                        <span className="sm:hidden">Save</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Confirm</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <form
              method="dialog"
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-red-400/20 to-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-red-400 text-3xl">×</span>
              </div>
              <h3
                id="cancel-dialog-title"
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

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <form
              method="dialog"
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-blue-400/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-blue-400/20 to-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-blue-400 text-3xl">🔒</span>
              </div>
              <h3
                id="password-dialog-title"
                className="text-xl sm:text-2xl font-bold text-white mb-2"
              >
                Change User Password
              </h3>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white mb-2"
                placeholder="Enter new password"
              />
              <input
                type="password"
                value={reEnterPassword}
                onChange={(e) => setReEnterPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white mb-2"
                placeholder="Re-enter new password"
              />
              {passwordError && (
                <p className="text-red-400 text-sm">{passwordError}</p>
              )}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  type="button"
                  onClick={async () => {
                    if (!newPassword || newPassword.length < 6) {
                      setPasswordError(
                        "Password must be at least 6 characters."
                      );
                      return;
                    }
                    if (newPassword !== reEnterPassword) {
                      setPasswordError("Passwords do not match.");
                      return;
                    }
                    try {
                      await changeUserPassword(
                        String(formData.auth_id),
                        newPassword
                      );
                      setShowPasswordModal(false);
                      setNewPassword("");
                      setReEnterPassword("");
                      setPasswordError("");
                    } catch (err: any) {
                      setPasswordError(
                        err?.response?.data?.detail ||
                          "Failed to change password."
                      );
                    }
                  }}
                  className="px-8 py-3 rounded-lg border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-black font-semibold transition-all cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword("");
                    setReEnterPassword("");
                    setPasswordError("");
                  }}
                  className="px-8 py-3 rounded-lg border border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white font-semibold transition-all cursor-pointer"
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
