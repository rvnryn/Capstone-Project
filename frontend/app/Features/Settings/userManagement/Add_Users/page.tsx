"use client";

import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { routes } from "@/app/routes/routes";
import { FaUserPlus, FaEye, FaEyeSlash } from "react-icons/fa";
import NavigationBar from "@/app/components/navigation/navigation";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import { supabase } from "@/app/utils/Server/supabaseClient";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { MdCancel, MdSave } from "react-icons/md";
import { FiAlertTriangle, FiArrowRight, FiCheck, FiX } from "react-icons/fi";

export default function AddUsers() {
  const ROLE_OPTIONS = [
    "Owner",
    "General Manager",
    "Store Manager",
    "Assistant Store Manager",
  ];
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [initialSettings, setInitialSettings] = useState<any>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Form state and cache key
  const cacheKey = "add_user_form_cache";
  const [formData, setFormData] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return {
            name: "",
            username: "",
            email: "",
            password: "",
            re_password: "",
            user_role: "",
          };
        }
      }
    }
    return {
      name: "",
      username: "",
      email: "",
      password: "",
      re_password: "",
      user_role: "",
    };
  });

  const [errors, setErrors] = useState({
    name: "",
    username: "",
    gmail: "",
    password: "",
    re_password: "",
    user_role: "",
    duplicate: "",
    supabase: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Cache form data on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(cacheKey, JSON.stringify(formData));
    }
  }, [formData]);

  // Simulate loading state for offline/cached
  useEffect(() => {
    setIsLoading(false);
    if (!isOnline) {
      // If offline and no cache, show error
      const cached = localStorage.getItem(cacheKey);
      if (!cached) {
        setOfflineError(
          "You are offline and no cached form data is available. Please connect to the internet to add a user."
        );
      } else {
        setOfflineError(null);
      }
    } else {
      setOfflineError(null);
    }
  }, [isOnline]);
  // Validation logic
  const validate = useCallback((data: typeof formData) => {
    const newErrors = {
      name: "",
      username: "",
      gmail: "",
      re_password: "",
      password: "",
      user_role: "",
    };

    if (!data.name.trim()) {
      newErrors.name = "Name is required.";
    } else if (data.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    if (!data.username.trim()) {
      newErrors.username = "Username is required.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username.trim())) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores.";
    }

    if (!data.email.trim()) {
      newErrors.gmail = "Email is required.";
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(data.email.trim())) {
      newErrors.gmail = "Enter a valid Gmail address.";
    }

    // Enhanced password validation
    if (!data.password.trim()) {
      newErrors.password = "Password is required.";
    } else if (data.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    } else if (!/[A-Z]/.test(data.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter.";
    } else if (!/[a-z]/.test(data.password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter.";
    } else if (!/[0-9]/.test(data.password)) {
      newErrors.password = "Password must contain at least one digit.";
    }

    if (!data.user_role) {
      newErrors.user_role = "User role is required.";
    } else if (!ROLE_OPTIONS.includes(data.user_role)) {
      newErrors.user_role = "Invalid role selected.";
    }

    // Password match validation
    if (data.password !== data.re_password) {
      newErrors.re_password = "Passwords do not match.";
    }

    return newErrors;
  }, []);

  useEffect(() => {
    if (isSubmitting) {
      setErrors(() => ({
        ...validate(formData),
        duplicate: "",
        supabase: "",
      }));
    }
  }, [formData, validate, isSubmitting]);

  const capitalizeWords = (str: string) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setIsDirty(true);
      setFormData((prev: typeof formData) => {
        let newValue = value;
        if (name === "name") {
          newValue = capitalizeWords(value);
        } else if (name === "username") {
          newValue = value.trim().toLowerCase();
        }
        return {
          ...prev,
          [name]: newValue,
        };
      });
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setOfflineError(
        "You are offline. Please connect to the internet to add a user."
      );
      return;
    }
    setIsSubmitting(true);
    const validationErrors = validate(formData);
    setErrors({ ...validationErrors, duplicate: "", supabase: "" });
    if (
      validationErrors.name ||
      validationErrors.username ||
      validationErrors.gmail ||
      validationErrors.password ||
      validationErrors.re_password ||
      validationErrors.user_role
    ) {
      setIsSubmitting(false);
      return;
    }
    try {
      // 1. FIRST check with backend if email/username already exists (validation)
      const token = localStorage.getItem("token");
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Validate with backend BEFORE creating auth user
      const validationResponse = await fetch(`${API_BASE_URL}/api/users/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
        }),
      });

      if (!validationResponse.ok) {
        const validationError = await validationResponse.json();
        setErrors((prev) => ({
          ...prev,
          supabase: validationError.detail || "Validation failed.",
        }));
        setIsSubmitting(false);
        return;
      }

      // 2. Then create user in Supabase Auth (only if validation passed)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
        },
      });

      if (authError) {
        setErrors((prev) => ({
          ...prev,
          supabase: authError.message || "Supabase Auth error.",
        }));
        setIsSubmitting(false);
        return;
      }

      const authId = authData?.user?.id;
      if (!authId) {
        setErrors((prev) => ({
          ...prev,
          supabase: "User ID not returned from Supabase.",
        }));
        setIsSubmitting(false);
        return;
      }

      // 3. Finally create user in database via backend API (handles activity logging)
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          auth_id: authId,
          name: formData.name,
          username: formData.username,
          email: formData.email,
          user_role: formData.user_role,
          status: "active",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If DB insert fails after auth created, we have a problem
        // Log the auth_id so it can be cleaned up manually if needed
        console.error("User created in Auth but failed in DB. Auth ID:", authId);
        setErrors((prev) => ({
          ...prev,
          supabase: data.detail || "Failed to create user in database.",
        }));
        setIsSubmitting(false);
        return;
      }
      setFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        re_password: "",
        user_role: "",
      });
      setIsDirty(false);
      setShowSuccessMessage(true);
      setTimeout(() => {
        router.push(routes.user_management_settings);
      }, 2000);
    } catch (error: any) {
      console.error("Error adding user:", error);
      setErrors((prev) => ({
        ...prev,
        supabase: "Failed to add user. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    console.log("Cancel clicked");
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

  useEffect(() => {
    setInitialSettings({ ...formData });
  }, []);

  const isSettingsChanged = () => {
    if (!initialSettings) return false;
    return Object.keys(formData).some(
      (key) =>
        formData[key as keyof typeof formData] !==
        initialSettings[key as keyof typeof initialSettings]
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
          <main className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
              <div className="text-yellow-400 font-medium text-base">
                Loading Add User form...
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
    <section>
      <NavigationBar
        onNavigate={handleSidebarNavigate}
        showCancelModal={showCancelModal}
        showUnsavedModal={showUnsavedModal}
      />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Add User main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            <article className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-800/50 p-4 xs:p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 2xl:p-16 w-full">
              <header className="flex items-center gap-3 xs:gap-4 sm:gap-5 mb-4 xs:mb-6 sm:mb-8 md:mb-10">
                <div className="relative">
                  <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-2 xs:p-3 sm:p-4 rounded-full">
                    <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                    <FaUserPlus className="text-black text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl" />
                  </div>
                </div>
                <div>
                  <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                    Add User
                  </h1>
                  <p className="text-gray-400 text-xs xs:text-sm sm:text-base mt-0.5 xs:mt-1">
                    Add new users to your team
                  </p>
                </div>
              </header>
              {/* Elegant divider */}
              <div
                className="relative mb-3 xs:mb-4 sm:mb-6 md:mb-8"
                aria-hidden="true"
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-2 xs:px-3 sm:px-4 text-yellow-400/85 text-xs xs:text-sm">
                    Enter User Details
                  </span>
                </div>
              </div>
              <form
                onSubmit={handleSubmit}
                className="space-y-3 xs:space-y-4 sm:space-y-6 md:space-y-8"
                aria-label="Add User Form"
              >
                <fieldset className="grid grid-cols-1 lg:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                  {/* Name */}
                  <div className="group">
                    <label
                      htmlFor="name"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                    >
                      Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter name..."
                        className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-4 md:py-5 border-2 text-sm xs:text-base sm:text-lg transition-all duration-300 placeholder-gray-500 ${
                          errors.name
                            ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                            : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        }`}
                        aria-invalid={!!errors.name}
                        aria-describedby={
                          errors.name ? "name-error" : undefined
                        }
                      />
                    </div>
                    {errors.name && (
                      <div
                        id="name-error"
                        className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 text-red-400 text-xs sm:text-sm"
                        role="alert"
                      >
                        {errors.name}
                      </div>
                    )}
                  </div>
                  {/* Username */}
                  <div className="group">
                    <label
                      htmlFor="username"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                    >
                      Username <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="username"
                        name="username"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter username..."
                        className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-4 md:py-5 border-2 text-sm xs:text-base sm:text-lg transition-all duration-300 placeholder-gray-500 ${
                          errors.username
                            ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                            : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        }`}
                        aria-invalid={!!errors.username}
                        aria-describedby={
                          errors.username ? "username-error" : undefined
                        }
                      />
                    </div>
                    {errors.username && (
                      <div
                        id="username-error"
                        className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 text-red-400 text-xs sm:text-sm"
                        role="alert"
                      >
                        {errors.username}
                      </div>
                    )}
                  </div>
                  {/* Email */}
                  <div className="group">
                    <label
                      htmlFor="email"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                    >
                      Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@gmail.com"
                        className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-4 md:py-5 border-2 text-sm xs:text-base sm:text-lg transition-all duration-300 placeholder-gray-500 ${
                          errors.gmail
                            ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                            : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        }`}
                        aria-invalid={!!errors.gmail}
                        aria-describedby={
                          errors.gmail ? "email-error" : undefined
                        }
                      />
                    </div>
                    {errors.gmail && (
                      <div
                        id="email-error"
                        className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 text-red-400 text-xs sm:text-sm"
                        role="alert"
                      >
                        {errors.gmail}
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="group">
                    <label
                      htmlFor="password"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                    >
                      Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        placeholder="Enter password..."
                        className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-4 md:py-5 border-2 text-sm xs:text-base sm:text-lg transition-all duration-300 placeholder-gray-500 ${
                          errors.password
                            ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                            : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        }`}
                        aria-invalid={!!errors.password}
                        aria-describedby={
                          errors.password ? "password-error" : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer text-xl focus:outline-none"
                        tabIndex={-1}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.password && (
                      <div
                        id="password-error"
                        className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 text-red-400 text-xs sm:text-sm"
                        role="alert"
                      >
                        {errors.password}
                      </div>
                    )}
                  </div>

                  {/* Re Enter Password */}
                  <div className="group">
                    <label
                      htmlFor="re_password"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                    >
                      Re-Enter Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="re_password"
                        name="re_password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.re_password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        placeholder="Re-enter password..."
                        className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-4 md:py-5 border-2 text-sm xs:text-base sm:text-lg transition-all duration-300 placeholder-gray-500 ${
                          errors.re_password
                            ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                            : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        }`}
                        aria-invalid={!!errors.re_password}
                        aria-describedby={
                          errors.re_password ? "re_password-error" : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer text-xl focus:outline-none"
                        tabIndex={-1}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.re_password && (
                      <div
                        id="re_password-error"
                        className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 text-red-400 text-xs sm:text-sm"
                        role="alert"
                      >
                        {errors.re_password}
                      </div>
                    )}
                  </div>

                  {/* User Role */}
                  <div className="group">
                    <label
                      htmlFor="user_role"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                    >
                      User Role <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="user_role"
                        name="user_role"
                        required
                        value={formData.user_role}
                        onChange={handleChange}
                        className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-4 md:py-5 border-2 text-sm xs:text-base sm:text-lg transition-all duration-300 cursor-pointer ${
                          errors.user_role
                            ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                            : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        }`}
                        aria-invalid={!!errors.user_role}
                        aria-describedby={
                          errors.user_role ? "role-error" : undefined
                        }
                      >
                        <option value="">Select Role...</option>
                        {ROLE_OPTIONS.map((role) => (
                          <option
                            key={role}
                            value={role}
                            className="bg-gray-800"
                          >
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.user_role && (
                      <div
                        id="role-error"
                        className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 text-red-400 text-xs sm:text-sm"
                        role="alert"
                      >
                        {errors.user_role}
                      </div>
                    )}
                  </div>
                </fieldset>
                {errors.duplicate && (
                  <div className="text-red-400 text-center text-base mb-4">
                    {errors.duplicate}
                  </div>
                )}
                {errors.supabase && (
                  <div className="text-red-400 text-center text-base mb-4">
                    {errors.supabase}
                  </div>
                )}
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
                        <MdSave className="group-hover:scale-110 transition-transform duration-300 text-xs xs:text-sm sm:text-base" />{" "}
                        Add User
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
            </article>
          </div>
        </main>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="Add-dialog-title"
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
                id="Add-dialog-title"
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
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-300 hover:to-red-400 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-red-400/25 order-1 sm:order-2 cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                  <span className="hidden sm:inline">Yes, Cancel</span>
                  <span className="sm:hidden">Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base order-2 sm:order-1 cursor-pointer"
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
            aria-labelledby="Add-dialog-title"
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
                id="Add-dialog-title"
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

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="w-5 xs:w-6 h-5 xs:h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FiCheck className="w-3 xs:w-4 h-3 xs:h-4 text-white" />
              </div>
              <span className="font-medium xs:font-semibold text-xs xs:text-sm sm:text-base leading-tight">
                User added successfully!
              </span>
            </div>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
}
