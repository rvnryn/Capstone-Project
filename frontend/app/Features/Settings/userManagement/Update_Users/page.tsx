"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { routes } from "@/app/routes/routes";
import NavigationBar from "@/app/components/navigation/navigation";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import { useUsersAPI } from "../hook/use-user";
import { useAuth } from "@/app/context/AuthContext";
import { FaUsers } from "react-icons/fa";
import type { User } from "../hook/use-user";
import { FiAlertTriangle, FiArrowRight, FiCheck, FiSave, FiUser, FiMail, FiShield, FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { MdCancel, MdEdit } from "react-icons/md";

const ROLE_OPTIONS = [
  "Owner",
  "General Manager",
  "Store Manager",
  "Assistant Store Manager",
];

const STATUS_OPTIONS = ["active", "inactive"];

export default function EditUser() {
  // --- Offline/Cache State ---
  const [isOnline, setIsOnline] = useState(true);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMenuOpen, isMobile } = useNavigation();
  const { getUser, updateUser, changeUserPassword } = useUsersAPI();
  const { user: currentUser } = useAuth();
  const userId = searchParams.get("id");
  const cacheKey = userId ? `edit_user_cache_${userId}` : null;

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
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [reEnterPassword, setReEnterPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [initialSettings, setInitialSettings] = useState<any>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

  // Password visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showReEnterPassword, setShowReEnterPassword] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 10) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength === 0) return { label: '', color: '' };
    if (strength <= 2) return { label: 'Weak', color: 'text-red-400' };
    if (strength <= 4) return { label: 'Medium', color: 'text-yellow-400' };
    return { label: 'Strong', color: 'text-green-400' };
  };

  const getPasswordStrengthBar = (strength: number) => {
    if (strength === 0) return '';
    if (strength <= 2) return 'bg-red-400';
    if (strength <= 4) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch user with offline/cache logic
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setOfflineError(null);
      if (!userId) {
        router.push(routes.user_management_settings);
        return;
      }
      if (!isOnline) {
        // Try to load from cache
        if (cacheKey && typeof window !== "undefined") {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const data = JSON.parse(cached);
              setFormData(data);
              setInitialSettings(data);
              setIsLoading(false);
              setOfflineError(null);
              return;
            } catch {}
          }
        }
        setOfflineError(
          "You are offline and no cached user data is available. Please connect to the internet to edit this user."
        );
        setIsLoading(false);
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
        // Cache user data
        if (cacheKey && typeof window !== "undefined") {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } catch (error) {
        setOfflineError("Failed to fetch user data. Please try again.");
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
    // Only refetch if userId or isOnline changes
  }, [userId, isOnline]);

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

  const capitalizeWords = (str: string) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setIsDirty(true);
    setFormData((prev) => {
      let newValue = value;
      if (name === "name") {
        newValue = capitalizeWords(value.trim());
      } else if (name === "username") {
        newValue = value.trim().toLowerCase();
      }
      return {
        ...prev,
        [name]: newValue,
      };
    });
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
      // 1. FIRST check if email or username changed and validate with backend
      const emailChanged = formData.email !== initialSettings?.email;
      const usernameChanged = formData.username !== initialSettings?.username;

      if (emailChanged || usernameChanged) {
        const token = localStorage.getItem("token");
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        // Build validation payload with ONLY the fields that changed
        const validationPayload: any = {};
        if (emailChanged) {
          validationPayload.email = formData.email;
        }
        if (usernameChanged) {
          validationPayload.username = formData.username;
        }

        // Validate with backend BEFORE attempting update
        const validationResponse = await fetch(`${API_BASE_URL}/api/users/validate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(validationPayload),
        });

        if (!validationResponse.ok) {
          const validationError = await validationResponse.json();
          setErrorMessage(validationError.detail || "Validation failed.");
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Only proceed with update if validation passed (or nothing changed)
      const payload: any = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        user_role: formData.user_role,
        status: formData.status,
      };

      await updateUser(userId, payload);
      setShowSuccessMessage(true);
      router.push(routes.user_management_settings);
    } catch (error: any) {
      // Show specific error message from backend
      const errorMessage = error?.message || error?.detail || error?.toString() || "Failed to update the user. Please try again.";
      setErrorMessage(errorMessage);
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

  // EmailJS integration for password change notification
  useEffect(() => {
    if (showPasswordSuccess) {
      console.log("EmailJS debug:", formData.email, formData.name);
      if (formData.email) {
        import("emailjs-com").then((emailjs) => {
          emailjs
            .send(
              process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
              process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
              {
                email: formData.email,
                to_name: formData.name || "",
                message: "Your password has been changed successfully.",
                date: new Date().toLocaleString("en-US"),
              },
              process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
            )
            .then(
              (result) => {
                console.log(
                  "EmailJS: Password change notification sent!",
                  result.text
                );
              },
              (error) => {
                console.error(
                  "EmailJS: Failed to send password change notification:",
                  error.text || error.message || error
                );
              }
            );
        });
      } else {
        console.error("EmailJS: No email address found for notification.");
      }
    }
  }, [showPasswordSuccess, formData.email, formData.name]);

  if (isLoading) {
    return (
      <section className="text-white font-poppins w-full min-h-screen">
        <NavigationBar onNavigate={handleSidebarNavigate} />
        <ResponsiveMain>
          <main className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
              <div className="text-yellow-400 font-medium text-base">
                Loading user details...
              </div>
            </div>
          </main>
        </ResponsiveMain>
      </section>
    );
  }

  if (offlineError) {
    return (
      <section className="text-white font-poppins w-full min-h-screen">
        <NavigationBar onNavigate={handleSidebarNavigate} />
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

  return (
    <section className="text-white font-poppins w-full min-h-screen">
      <NavigationBar
        onNavigate={handleSidebarNavigate}
        showUnsavedModal={showUnsavedModal}
        showCancelModal={showCancelModal}
        showSaveModal={showSaveModal}
        showPasswordModal={showPasswordModal}
        showAdminPasswordModal={showAdminPasswordModal}
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
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 space-y-4 sm:space-y-6 max-w-sm sm:max-w-lg w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 mb-4 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-full flex items-center justify-center">
                  <FiSave className="w-8 h-8 text-yellow-400" />
                </div>
                <h3
                  id="save-dialog-title"
                  className="text-xl sm:text-2xl font-bold text-white mb-2"
                >
                  Confirm Update
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-4">
                  Review the changes before saving
                </p>
              </div>

              {/* User Being Updated */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <MdEdit className="text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-300">User:</span>
                  <span className="text-sm font-bold text-white">{formData.name}</span>
                </div>

                {/* Changes Summary */}
                <div className="space-y-2">
                  {initialSettings && (
                    <>
                      {formData.username !== initialSettings.username && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <FiUser className="text-blue-400 flex-shrink-0" />
                          <span className="text-gray-400">Username:</span>
                          <span className="text-red-400 line-through">{initialSettings.username}</span>
                          <FiArrowRight className="text-gray-500" />
                          <span className="text-green-400">{formData.username}</span>
                        </div>
                      )}
                      {formData.email !== initialSettings.email && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <FiMail className="text-yellow-400 flex-shrink-0" />
                          <span className="text-gray-400">Email:</span>
                          <span className="text-red-400 line-through">{initialSettings.email}</span>
                          <FiArrowRight className="text-gray-500" />
                          <span className="text-green-400">{formData.email}</span>
                        </div>
                      )}
                      {formData.user_role !== initialSettings.user_role && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <FiShield className="text-purple-400 flex-shrink-0" />
                          <span className="text-gray-400">Role:</span>
                          <span className="text-red-400 line-through">{initialSettings.user_role}</span>
                          <FiArrowRight className="text-gray-500" />
                          <span className="text-green-400">{formData.user_role}</span>
                        </div>
                      )}
                      {formData.status !== initialSettings.status && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <FiAlertTriangle className="text-orange-400 flex-shrink-0" />
                          <span className="text-gray-400">Status:</span>
                          <span className="text-red-400 line-through capitalize">{initialSettings.status}</span>
                          <FiArrowRight className="text-gray-500" />
                          <span className="text-green-400 capitalize">{formData.status}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-4 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-lg hover:shadow-yellow-400/25 cursor-pointer"
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
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base cursor-pointer"
                >
                  Cancel
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
                <MdCancel className="w-8 h-8 text-red-400" />
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
                  onClick={() => handleConfirmCancel(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-300 hover:to-red-400 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-red-400/25 cursor-pointer"
                >
                  <span className="hidden sm:inline">Yes, Cancel</span>
                  <span className="sm:hidden">Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base cursor-pointer"
                >
                  <span className="hidden sm:inline">No, Go Back</span>
                  <span className="sm:hidden">Keep</span>
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
                  onClick={handleConfirmUnsaved}
                  className="flex-2 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-400 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-orange-400/25 order-1 sm:order-2 cursor-pointer"
                >
                  <FiArrowRight className="w-5 h-5" />
                  <span className="hidden sm:inline">Leave Without Saving</span>
                  <span className="sm:hidden">Leave</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelUnsaved}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base order-2 sm:order-1 cursor-pointer"
                >
                  Stay
                </button>
              </div>
            </form>
          </div>
        )}

        {showPasswordModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadein"
          >
            <div className="relative bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-black/80
            backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(59,130,246,0.2)]
            border border-blue-500/30 p-8 max-w-2xl w-full overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent opacity-50" />

              {/* Step indicator */}
              <div className="relative z-10 flex items-center justify-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    1
                  </div>
                  <div className="w-12 h-0.5 bg-gray-600" />
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs font-bold">
                    2
                  </div>
                </div>
              </div>

              {/* Icon and Title */}
              <div className="relative z-10 flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full" />
                  <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500/30 to-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-400/30 shadow-lg">
                    <FiLock className="text-blue-400 text-3xl drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  </div>
                </div>
                <h3 id="password-dialog-title" className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-blue-200 to-blue-300 bg-clip-text text-transparent mb-2">
                  Change Password
                </h3>
                <p className="text-gray-400 text-sm text-center">
                  {currentUser && String(currentUser.id) === String(formData?.auth_id)
                    ? "Update your account password"
                    : `Set new password for ${formData.name}`}
                </p>
              </div>

              {/* New Password Input */}
              <div className="relative z-10 mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError("");
                    }}
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-blue-500/20 bg-slate-900/50 text-white focus:border-blue-400/50 focus:outline-none transition-all backdrop-blur-sm"
                    placeholder="Enter new password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Password Strength</span>
                      <span className={`text-xs font-semibold ${getPasswordStrengthLabel(calculatePasswordStrength(newPassword)).color}`}>
                        {getPasswordStrengthLabel(calculatePasswordStrength(newPassword)).label}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i < calculatePasswordStrength(newPassword)
                              ? getPasswordStrengthBar(calculatePasswordStrength(newPassword))
                              : 'bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Password Requirements */}
                <div className="mt-4 p-3 bg-slate-900/30 rounded-xl border border-blue-500/10">
                  <p className="text-xs font-semibold text-gray-300 mb-2">Password must contain:</p>
                  <div className="space-y-1.5">
                    <div className={`flex items-center gap-2 text-xs transition-colors ${newPassword.length >= 6 ? 'text-green-400' : 'text-gray-500'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${newPassword.length >= 6 ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                        {newPassword.length >= 6 && <FiCheck size={10} />}
                      </div>
                      At least 6 characters
                    </div>
                    <div className={`flex items-center gap-2 text-xs transition-colors ${/[A-Z]/.test(newPassword) ? 'text-green-400' : 'text-gray-500'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[A-Z]/.test(newPassword) ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                        {/[A-Z]/.test(newPassword) && <FiCheck size={10} />}
                      </div>
                      One uppercase letter
                    </div>
                    <div className={`flex items-center gap-2 text-xs transition-colors ${/[a-z]/.test(newPassword) ? 'text-green-400' : 'text-gray-500'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[a-z]/.test(newPassword) ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                        {/[a-z]/.test(newPassword) && <FiCheck size={10} />}
                      </div>
                      One lowercase letter
                    </div>
                    <div className={`flex items-center gap-2 text-xs transition-colors ${/[0-9]/.test(newPassword) ? 'text-green-400' : 'text-gray-500'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[0-9]/.test(newPassword) ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                        {/[0-9]/.test(newPassword) && <FiCheck size={10} />}
                      </div>
                      One number
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm Password (only for other users) */}
              {!(currentUser && String(currentUser.id) === String(formData?.auth_id)) && (
                <div className="relative z-10 mb-6">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showReEnterPassword ? "text" : "password"}
                      value={reEnterPassword}
                      onChange={(e) => {
                        setReEnterPassword(e.target.value);
                        setPasswordError("");
                      }}
                      className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-blue-500/20 bg-slate-900/50 text-white focus:border-blue-400/50 focus:outline-none transition-all backdrop-blur-sm"
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowReEnterPassword(!showReEnterPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      {showReEnterPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  {reEnterPassword && newPassword !== reEnterPassword && (
                    <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                      <FiAlertTriangle size={12} />
                      Passwords do not match
                    </p>
                  )}
                </div>
              )}

              {/* Error Message */}
              {passwordError && (
                <div className="relative z-10 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <FiAlertTriangle size={16} />
                    {passwordError}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="relative z-10 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword("");
                    setReEnterPassword("");
                    setPasswordError("");
                    setShowNewPassword(false);
                    setShowReEnterPassword(false);
                  }}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // Password validation rules
                    if (!newPassword || newPassword.length < 6) {
                      setPasswordError("Password must be at least 6 characters.");
                      return;
                    }
                    if (!/[A-Z]/.test(newPassword)) {
                      setPasswordError("Password must contain at least one uppercase letter.");
                      return;
                    }
                    if (!/[a-z]/.test(newPassword)) {
                      setPasswordError("Password must contain at least one lowercase letter.");
                      return;
                    }
                    if (!/[0-9]/.test(newPassword)) {
                      setPasswordError("Password must contain at least one digit.");
                      return;
                    }
                    const isOwnAccount = currentUser && String(currentUser.id) === String(formData?.auth_id);
                    if (!isOwnAccount && newPassword !== reEnterPassword) {
                      setPasswordError("Passwords do not match.");
                      return;
                    }
                    setPasswordError("");

                    if (isOwnAccount) {
                      try {
                        await changeUserPassword(String(formData.auth_id), newPassword, "");
                        setShowPasswordModal(false);
                        setNewPassword("");
                        setReEnterPassword("");
                        setShowPasswordSuccess(true);
                        setTimeout(() => setShowPasswordSuccess(false), 3000);
                      } catch (err: any) {
                        setPasswordError(err?.message || "Failed to change password.");
                      }
                    } else {
                      setShowPasswordModal(false);
                      setShowAdminPasswordModal(true);
                    }
                  }}
                  className="flex-1 group relative flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-500/50 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative z-10">
                    {currentUser && String(currentUser.id) === String(formData.auth_id) ? "Change Password" : "Next"}
                  </span>
                  <FiArrowRight className="relative z-10" size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {showAdminPasswordModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-password-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadein"
          >
            <div className="relative bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-black/80
            backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(251,191,36,0.2)]
            border border-amber-500/30 p-8 max-w-2xl w-full overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-transparent to-transparent opacity-50" />

              {/* Step indicator - Step 2 active */}
              <div className="relative z-10 flex items-center justify-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                    <FiCheck size={16} />
                  </div>
                  <div className="w-12 h-0.5 bg-amber-500" />
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                    2
                  </div>
                </div>
              </div>

              {/* Icon and Title */}
              <div className="relative z-10 flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-amber-500/30 blur-2xl rounded-full" />
                  <div className="relative w-16 h-16 bg-gradient-to-br from-amber-500/30 to-amber-600/20 rounded-2xl flex items-center justify-center border border-amber-400/30 shadow-lg">
                    <FiShield className="text-amber-400 text-3xl drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                  </div>
                </div>
                <h3 id="admin-password-dialog-title" className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 bg-clip-text text-transparent mb-2">
                  Admin Verification
                </h3>
                <p className="text-gray-400 text-sm text-center">
                  Enter your admin password to authorize this change
                </p>
              </div>

              {/* Admin Password Input */}
              <div className="relative z-10 mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showAdminPass ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminPasswordError("");
                    }}
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-amber-500/20 bg-slate-900/50 text-white focus:border-amber-400/50 focus:outline-none transition-all backdrop-blur-sm"
                    placeholder="Enter your admin password"
                    autoComplete="current-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    {showAdminPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Summary of change */}
              <div className="relative z-10 mb-6 p-4 bg-slate-900/30 rounded-xl border border-amber-500/10">
                <p className="text-xs font-semibold text-gray-300 mb-2">Password Change Summary:</p>
                <div className="flex items-center gap-2 text-sm">
                  <FiUser className="text-amber-400" />
                  <span className="text-gray-400">User:</span>
                  <span className="text-white font-semibold">{formData.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <FiLock className="text-green-400" />
                  <span className="text-gray-400">New password set successfully</span>
                </div>
              </div>

              {/* Error Message */}
              {adminPasswordError && (
                <div className="relative z-10 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <FiAlertTriangle size={16} />
                    {adminPasswordError}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="relative z-10 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPasswordModal(false);
                    setAdminPassword("");
                    setAdminPasswordError("");
                    setShowAdminPass(false);
                  }}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!adminPassword) {
                      setAdminPasswordError("Please enter your admin password to confirm.");
                      return;
                    }
                    try {
                      await changeUserPassword(String(formData.auth_id), newPassword, adminPassword);
                      setShowAdminPasswordModal(false);
                      setShowPasswordModal(false);
                      setNewPassword("");
                      setReEnterPassword("");
                      setAdminPassword("");
                      setAdminPasswordError("");
                      setPasswordError("");
                      setShowAdminPass(false);
                      setShowNewPassword(false);
                      setShowReEnterPassword(false);
                      setShowPasswordSuccess(true);
                      setTimeout(() => setShowPasswordSuccess(false), 3000);
                    } catch (err: any) {
                      setAdminPasswordError(err?.message || "Failed to change password.");
                    }
                  }}
                  className="flex-1 group relative flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-amber-500/50 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-white/20 to-amber-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <FiCheck className="relative z-10" size={18} />
                  <span className="relative z-10">Confirm Change</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="w-5 xs:w-6 h-5 xs:h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FiCheck className="w-3 xs:w-4 h-3 xs:h-4 text-white" />
              </div>
              <span className="font-medium xs:font-semibold text-xs xs:text-sm sm:text-base leading-tight">
                User Updated successfully!
              </span>
            </div>
          </div>
        )}
        {showPasswordSuccess && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="w-5 xs:w-6 h-5 xs:h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FiCheck className="w-3 xs:w-4 h-3 xs:h-4 text-white" />
              </div>
              <span className="font-medium xs:font-semibold text-xs xs:text-sm sm:text-base leading-tight">
                Password changed successfully!
              </span>
            </div>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
}
