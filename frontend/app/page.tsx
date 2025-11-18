"use client";
import React, { useState } from "react";
import { useGlobalLoading } from "@/app/context/GlobalLoadingContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { loginUser } from "./utils/API/LoginAPI";
import { routes } from "@/app/routes/routes";
import Image from "next/image";
import { supabase } from "./utils/Server/supabaseClient";
import { ReactNode } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { FaSpinner } from "react-icons/fa";

interface ModalProps {
  message: ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ message, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Focus management for modal
  const modalRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    modalRef.current?.focus();
  }, []);
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 px-4 transition-opacity duration-300 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Login status"
      tabIndex={-1}
      ref={modalRef}
    >
      <section className="relative g-gradient-to-br from-gray-900/95 to-black/95 text-white p-8 border-2 border-yellow-400 rounded-3xl shadow-2xl w-full max-w-sm text-center scale-100 animate-popIn">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 text-yellow-400 hover:text-yellow-300 bg-black/40 rounded-full p-2 transition-colors focus:outline-none"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M6 6l8 8M14 6l-8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="flex flex-col items-center gap-3">
          <div className="bg-yellow-400/80 rounded-full p-3 mb-2 shadow-lg animate-bounce">
            <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="16" fill="#FACC15" />
              <path
                d="M10 17l4 4 8-8"
                stroke="#222"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2 drop-shadow" id="modal-title">
            {message}
          </h3>
        </div>
      </section>
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }
        .animate-popIn {
          animation: popIn 0.25s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes popIn {
          0% {
            transform: scale(0.8);
          }
          80% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

// Simple in-modal confirmation component
interface ConfirmModalProps {
  title: string;
  countdownSeconds?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  countdownSeconds,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-60 px-4">
      <section
        className="relative bg-gradient-to-br from-gray-900/95 to-black/95 text-white p-6 border-2 border-yellow-400 rounded-3xl shadow-2xl w-full max-w-sm text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        tabIndex={-1}
      >
        <h4
          className="text-2xl font-bold mb-2 text-yellow-500"
          id="confirm-modal-title"
        >
          {title}
        </h4>
        <p className="text-sm mb-4 col">
          {countdownSeconds && countdownSeconds > 0 ? (
            <>
              You still have{" "}
              <span className="font-medium text-yellow-400">
                {countdownSeconds}s
              </span>{" "}
              left before you can request a new code.
              <br />
              Are you sure you want to go back?
            </>
          ) : (
            "Are you sure you want to go back?"
          )}
        </p>
        <div className="flex justify-center gap-2 ">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-300"
          >
            Yes, go back
          </button>
        </div>
      </section>
    </div>
  );
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetStep, setResetStep] = useState<"email" | "otp" | "password">(
    "email"
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpTimer, setOtpTimer] = useState(0);
  const { loading, setLoading, setMessage } = useGlobalLoading();
  const [rateLimitTimer, setRateLimitTimer] = useState(0);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [otpTimerRef, setOtpTimerRef] = useState<NodeJS.Timeout | null>(null);
  const [resendTimerRef, setResendTimerRef] = useState<NodeJS.Timeout | null>(
    null
  );
  const [rateLimitTimerRef, setRateLimitTimerRef] =
    useState<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { refreshSession, user } = useAuth();
  const [showConfirmBack, setShowConfirmBack] = useState(false);

  // Store password reset state in localStorage to prevent AuthContext redirect
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (isResettingPassword) {
        localStorage.setItem("isResettingPassword", "true");
      } else {
        localStorage.removeItem("isResettingPassword");
      }
    }
  }, [isResettingPassword]);

  // Redirect authenticated users to dashboard ONLY if not resetting password
  React.useEffect(() => {
    if (user && !isResettingPassword) {
      console.log("[Login] User authenticated, redirecting to dashboard");
      router.push(routes.dashboard);
    }
  }, [user, isResettingPassword, router]);

  // Cleanup function for timers
  const cleanupTimers = () => {
    if (otpTimerRef) {
      clearInterval(otpTimerRef);
      setOtpTimerRef(null);
    }
    if (resendTimerRef) {
      clearInterval(resendTimerRef);
      setResendTimerRef(null);
    }
    if (rateLimitTimerRef) {
      clearInterval(rateLimitTimerRef);
      setRateLimitTimerRef(null);
    }
    setOtpTimer(0);
    setResendCooldown(0);
    setRateLimitTimer(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Logging in...");
    setLoading(true); // Show global loading
    console.log("[DEBUG] handleSubmit called");
    try {
      await loginUser(email, password);
      console.log("[DEBUG] loginUser success");
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        setError(err.message);
        console.log("[DEBUG] loginUser error:", err.message);
      } else {
        setError("An unexpected error occurred.");
        console.log("[DEBUG] loginUser error: unexpected");
      }
      return;
    }
    setLoading(false);
    await refreshSession();
    router.push(routes.dashboard);
    console.log("[DEBUG] refreshSession complete, opening modal");
    // setIsModalOpen(true);
  };

  const handleModalClose = () => {
    console.log("[DEBUG] handleModalClose called");
    setIsModalOpen(false);
    router.push(routes.dashboard);
  };

  const handleResetPassword = () => {
    setIsResettingPassword(true);
    setShowResetModal(true);
    setResetStatus(null);
    setResetEmail("");
    setResetOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowNewPassword(false);
    setResetStep("email");
  };

  const handleCloseResetModal = () => {
    setIsResettingPassword(false);
    setShowResetModal(false);
    setResetStatus(null);
    setResetEmail("");
    setResetOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowNewPassword(false);
    setResetStep("email");
    setResetLoading(false);
    setResendCooldown(0);
    cleanupTimers(); // Clear all timers
  };

  const handleSendOtp = async () => {
    setResetLoading(true);
    setResetStatus(null);
    // Clear any existing timers
    cleanupTimers();
    // Clear previous OTP input
    setResetOtp("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      if (error) {
        // Check if it's a rate limiting message
        if (error.message.toLowerCase().includes("security purposes")) {
          // Use custom 10-second timeout instead of Supabase's timeout
          const customTimeout = 60;

          setResendCooldown(customTimeout);
          setResetStatus(
            `Please wait ${customTimeout} seconds before requesting another OTP.`
          );

          const countdown = setInterval(() => {
            setResendCooldown((prev) => {
              if (prev <= 1) {
                clearInterval(countdown);
                setResendTimerRef(null);
                setResetStatus(null);
                return 0;
              }
              const newTime = prev - 1;
              setResetStatus(
                `Please wait ${newTime} seconds before requesting another OTP.`
              );
              return newTime;
            });
          }, 1000);
          setResendTimerRef(countdown);
        } else {
          setResetStatus(error.message);
        }
      } else {
        setResetStatus("OTP sent to your email!");
        setResetStep("otp");

        setOtpTimer(300);
        const otpCountdown = setInterval(() => {
          setOtpTimer((prev) => {
            if (prev <= 1) {
              clearInterval(otpCountdown);
              setOtpTimerRef(null);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setOtpTimerRef(otpCountdown);

        // Start 10-second cooldown
        setResendCooldown(60);
        const countdown = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(countdown);
              setResendTimerRef(null);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setResendTimerRef(countdown);
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes("security purposes")) {
        const customTimeout = 60;

        setResendCooldown(customTimeout);
        setResetStatus(
          `Please wait ${customTimeout} seconds before requesting another OTP.`
        );

        const countdown = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(countdown);
              setResendTimerRef(null);
              setResetStatus(null);
              return 0;
            }
            const newTime = prev - 1;
            setResetStatus(
              `Please wait ${newTime} seconds before requesting another OTP.`
            );
            return newTime;
          });
        }, 1000);
        setResendTimerRef(countdown);
      } else {
        setResetStatus(err.message || "Failed to send OTP.");
      }
    }
    setResetLoading(false);
  };

  // Ask confirmation when user wants to go back from OTP step while cooldown is active
  const handleBackFromOtp = () => {
    if (resendCooldown > 0) {
      // open in-modal confirmation instead of window.confirm
      setShowConfirmBack(true);
      return;
    }

    // proceed to reset the modal to email step
    setResetStep("email");
    setResetOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setResetStatus(null);
  };

  const confirmBack = () => {
    setShowConfirmBack(false);
    // proceed with the back action
    setResetStep("email");
    setResetOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setResetStatus(null);
  };

  const cancelBack = () => {
    setShowConfirmBack(false);
    // keep user in OTP step
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = resetOtp.split("");
    newOtp[index] = value;
    const updatedOtp = newOtp.join("");
    setResetOtp(updatedOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === "Backspace" && !resetOtp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetStatus(null);
    try {
      // Ensure flag is set before verification to prevent redirect
      if (typeof window !== "undefined") {
        localStorage.setItem("isResettingPassword", "true");
      }

      const { error, data } = await supabase.auth.verifyOtp({
        email: resetEmail,
        token: resetOtp,
        type: "recovery",
      });
      if (error) {
        setResetStatus("Invalid or expired OTP. Please try again.");
      } else {
        // OTP verified successfully - user is now logged in temporarily
        // Keep them logged in so they can set the new password
        setResetStatus("OTP verified! Please set your new password.");
        setTimeout(() => {
          setResetStep("password");
          setResetStatus(null);
        }, 1500);
      }
    } catch (err: any) {
      setResetStatus(err.message || "Failed to verify OTP.");
    }
    setResetLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetStatus(null);

    if (newPassword.length < 8) {
      setResetStatus("Password must be at least 8 characters.");
      setResetLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetStatus("Passwords do not match.");
      setResetLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        setResetStatus(error.message);
      } else {
        setResetStatus(
          "Password updated successfully! Please log in with your new password."
        );
        // Sign out the user so they can log in with their new password
        await supabase.auth.signOut();
        setTimeout(() => {
          handleCloseResetModal();
        }, 2500);
      }
    } catch (err: any) {
      setResetStatus(err.message || "Failed to update password.");
    }
    setResetLoading(false);
  };

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center relative px-2 py-6 sm:px-4 sm:py-10 bg-cover bg-center"
      style={{
        backgroundImage: "url(/Login_bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        height: "100vh",
      }}
    >
      <div className="absolute inset-0 bg-black/80 z-0" />
      <section
        className="relative z-10 backdrop-blur-lg bg-black/30
        p-6 sm:p-8 md:p-10
        rounded-2xl shadow-2xl 
        w-full max-w-2xl
        text-center flex flex-col items-center"
      >
        <Image
          src={"/logo.png"}
          alt="Logo"
          width={80}
          height={80}
          className="mx-auto mb-4 rounded-full border-4 border-yellow-400 shadow-lg transition-transform duration-300 transform hover:scale-105 object-cover"
        />
        <h1 className="text-white text-3xl sm:text-4xl font-bold mb-2 font-poppins drop-shadow-lg">
          Cardiac Delights
        </h1>
        <p className="text-gray-200 text-base sm:text-lg mb-7 font-medium">
          Welcome back! Please login to continue.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 w-full max-w-xl mx-auto"
        >
          <div>
            <label
              htmlFor="username"
              className="block text-left text-gray-200 font-semibold mb-2"
            >
              Email or Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="enter your email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              required
              aria-required="true"
              aria-describedby={error ? "login-error" : undefined}
              autoComplete="username"
              className="w-full bg-gray-900/80 border-2 border-yellow-400 text-white placeholder-gray-400 px-4 py-3 text-base rounded-lg shadow focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-left text-gray-200 font-semibold mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
                aria-describedby={error ? "login-error" : undefined}
                autoComplete="current-password"
                className="w-full bg-gray-900/80 border-2 border-yellow-400 text-white placeholder-gray-400 px-4 py-3 text-base rounded-lg shadow focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 hover:text-yellow-300 cursor-pointer text-xl focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div className="text-right mt-2">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-sm text-yellow-400 hover:text-yellow-300 underline transition"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {error && (
            <div
              id="login-error"
              className="bg-red-600/90 text-white rounded-lg py-2 px-4 text-base font-medium shadow mb-2 animate-shake"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3 px-8 w-full rounded-full transition-all text-lg shadow-lg hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            Login
          </button>
        </form>
      </section>

      {/* Loading Overlay removed: now handled globally */}

      {isModalOpen && (
        <Modal message="Logged in successfully!" onClose={handleModalClose} />
      )}

      {showResetModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-lg z-50 px-4 transition-opacity duration-300 animate-fadeIn">
          <section className="relative bg-gradient-to-br from-gray-900/98 via-gray-800/95 to-black/98 text-white p-8 sm:p-10 border-2 border-yellow-400/80 rounded-3xl shadow-2xl w-full max-w-md text-center scale-100 animate-popIn">
            {/* Decorative gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-yellow-500/5 rounded-3xl pointer-events-none"></div>

            {/* Close button */}
            <button
              onClick={handleCloseResetModal}
              aria-label="Close modal"
              className="absolute top-4 right-4 text-yellow-400 hover:text-yellow-300 bg-black/60 hover:bg-black/80 rounded-full p-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 z-10"
            >
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M6 6l8 8M14 6l-8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Header with icon */}
            <div className="mb-6 relative z-10">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                {resetStep === "email" ? (
                  <svg
                    className="w-8 h-8 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                ) : resetStep === "otp" ? (
                  <svg
                    className="w-8 h-8 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                )}
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold drop-shadow-lg bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                {resetStep === "email"
                  ? "Forgot Password?"
                  : resetStep === "otp"
                  ? "Verify Your Identity"
                  : "Create New Password"}
              </h3>
              <p className="text-gray-400 text-sm mt-2">
                {resetStep === "email"
                  ? "Don't worry, we'll help you reset it"
                  : resetStep === "otp"
                  ? "Enter the code we sent to your email"
                  : "Choose a strong password for your account"}
              </p>
            </div>

            {resetStep === "email" && (
              <div className="space-y-4 relative z-10">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full bg-gray-900/60 backdrop-blur-sm border-2 border-yellow-400/50 focus:border-yellow-400 text-white placeholder-gray-500 pl-12 pr-4 py-4 text-base rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all duration-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resetLoading || !resetEmail}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-yellow-400/50 hover:scale-[1.02] transform focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {resetLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      <span>Send Verification Code</span>
                    </>
                  )}
                </button>
              </div>
            )}
            {resetStep === "otp" && (
              <form
                onSubmit={handleVerifyOtp}
                className="space-y-6 relative z-10"
              >
                {/* Email info banner */}
                <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-yellow-300 text-sm font-medium mb-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>
                      Code sent to:{" "}
                      <span className="text-white">{resetEmail}</span>
                    </span>
                  </div>
                  {otpTimer > 0 ? (
                    <div className="flex items-center gap-2 text-blue-300 text-sm">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        Expires in:{" "}
                        <span className="font-bold">
                          {Math.floor(otpTimer / 60)}:
                          {(otpTimer % 60).toString().padStart(2, "0")}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium">
                        Code expired. Request a new one.
                      </span>
                    </div>
                  )}
                </div>

                {/* OTP input boxes */}
                <div className="flex gap-2 sm:gap-3 justify-center">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={resetOtp[index] || ""}
                      onChange={(e) =>
                        handleOtpChange(
                          index,
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      maxLength={1}
                      className="w-11 h-14 sm:w-13 sm:h-16 bg-gray-900/60 backdrop-blur-sm border-2 border-yellow-400/50 focus:border-yellow-400 text-white text-center text-2xl font-bold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all duration-200"
                    />
                  ))}
                </div>
                {/* Action buttons */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={resetLoading || resetOtp.length !== 6}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-yellow-400/50 hover:scale-[1.02] transform focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Verify Code</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={resetLoading || resendCooldown > 0}
                    className="w-full bg-transparent border-2 border-yellow-400/50 hover:border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Resending...</span>
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Resend in {resendCooldown}s</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span>Resend Code</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackFromOtp}
                    className="w-full bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    <span>Back to Email</span>
                  </button>
                </div>
              </form>
            )}
            {resetStep === "password" && (
              <form
                onSubmit={handleUpdatePassword}
                className="space-y-5 relative z-10"
              >
                {/* New Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter at least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-gray-900/60 backdrop-blur-sm border-2 border-yellow-400/50 focus:border-yellow-400 text-white placeholder-gray-500 px-4 py-4 pr-12 text-base rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-400 hover:text-yellow-300 cursor-pointer text-xl focus:outline-none transition-colors"
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              newPassword.length < 8
                                ? "w-1/3 bg-red-500"
                                : newPassword.length < 12
                                ? "w-2/3 bg-yellow-500"
                                : "w-full bg-green-500"
                            }`}
                          />
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            newPassword.length < 8
                              ? "text-red-400"
                              : newPassword.length < 12
                              ? "text-yellow-400"
                              : "text-green-400"
                          }`}
                        >
                          {newPassword.length < 8
                            ? "Weak"
                            : newPassword.length < 12
                            ? "Medium"
                            : "Strong"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Password strength:{" "}
                        {newPassword.length < 8
                          ? "Use at least 8 characters"
                          : newPassword.length < 12
                          ? "Add more characters for better security"
                          : "Excellent!"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Confirm Password
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className={`w-full bg-gray-900/60 backdrop-blur-sm border-2 ${
                      confirmNewPassword && confirmNewPassword !== newPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                        : "border-yellow-400/50 focus:border-yellow-400 focus:ring-yellow-400/50"
                    } text-white placeholder-gray-500 px-4 py-4 text-base rounded-xl shadow-lg focus:outline-none focus:ring-2 transition-all duration-200`}
                  />
                  {confirmNewPassword && confirmNewPassword !== newPassword && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Passwords do not match
                    </p>
                  )}
                  {confirmNewPassword &&
                    confirmNewPassword === newPassword &&
                    newPassword && (
                      <p className="text-sm text-green-400 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Passwords match
                      </p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={
                    resetLoading ||
                    !newPassword ||
                    newPassword !== confirmNewPassword
                  }
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-yellow-400/50 hover:scale-[1.02] transform focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {resetLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Reset Password</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Status Message */}
            {resetStatus && (
              <div
                className={`mt-6 relative z-10 rounded-xl p-4 flex items-start gap-3 ${
                  resetStatus.includes("sent") ||
                  resetStatus.includes("verified") ||
                  resetStatus.includes("successfully")
                    ? "bg-green-500/20 border-2 border-green-500/50"
                    : "bg-red-500/20 border-2 border-red-500/50"
                }`}
              >
                <svg
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    resetStatus.includes("sent") ||
                    resetStatus.includes("verified") ||
                    resetStatus.includes("successfully")
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  {resetStatus.includes("sent") ||
                  resetStatus.includes("verified") ||
                  resetStatus.includes("successfully") ? (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
                <p
                  className={`text-sm font-medium ${
                    resetStatus.includes("sent") ||
                    resetStatus.includes("verified") ||
                    resetStatus.includes("successfully")
                      ? "text-green-200"
                      : "text-red-200"
                  }`}
                >
                  {resetStatus}
                </p>
              </div>
            )}
          </section>
        </div>
      )}
      {showConfirmBack && (
        <ConfirmModal
          title="Confirm leaving"
          countdownSeconds={resendCooldown}
          onConfirm={confirmBack}
          onCancel={cancelBack}
        />
      )}
    </main>
  );
};

export default Login;
