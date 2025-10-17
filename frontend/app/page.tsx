"use client";
import React, { useState } from "react";
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
          <h3 className="text-2xl font-bold mb-2 drop-shadow" id="modal-title">{message}</h3>
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
  <section className="relative bg-gradient-to-br from-gray-900/95 to-black/95 text-white p-6 border-2 border-yellow-400 rounded-3xl shadow-2xl w-full max-w-sm text-center" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" tabIndex={-1}>
  <h4 className="text-2xl font-bold mb-2 text-yellow-500" id="confirm-modal-title">{title}</h4>
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
  const [loading, setLoading] = useState(false);
  const [rateLimitTimer, setRateLimitTimer] = useState(0);
  const [otpTimerRef, setOtpTimerRef] = useState<NodeJS.Timeout | null>(null);
  const [resendTimerRef, setResendTimerRef] = useState<NodeJS.Timeout | null>(
    null
  );
  const [rateLimitTimerRef, setRateLimitTimerRef] =
    useState<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [showConfirmBack, setShowConfirmBack] = useState(false);

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
    setLoading(true); // <-- Show loading
    let loginEmail = email;

    let backendResponse;
    try {
      backendResponse = await loginUser(email, password);
      loginEmail = backendResponse.email;
    } catch (err) {
      setLoading(false); // <-- Hide loading on error
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    await refreshSession();
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    router.push(routes.dashboard);
  };

  const handleResetPassword = () => {
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
      const { error } = await supabase.auth.verifyOtp({
        email: resetEmail,
        token: resetOtp,
        type: "recovery",
      });
      if (error) {
        setResetStatus("Invalid or expired OTP. Please try again.");
      } else {
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
        setResetStatus("Password updated successfully!");
        setTimeout(() => {
          handleCloseResetModal();
        }, 2000);
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

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <FaSpinner className="animate-spin text-yellow-400 text-5xl" />
          <span className="ml-4 text-yellow-200 text-xl font-semibold">
            Logging in...
          </span>
        </div>
      )}

      {isModalOpen && (
        <Modal message="Logged in successfully!" onClose={handleModalClose} />
      )}

      {showResetModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 px-4 transition-opacity duration-300 animate-fadeIn">
          <section className="relative bg-gradient-to-br from-gray-900/95 to-black/95 text-white p-8 border-2 border-yellow-400 rounded-3xl shadow-2xl w-full max-w-sm text-center scale-100 animate-popIn">
            <button
              onClick={handleCloseResetModal}
              aria-label="Close modal"
              className="absolute top-3 right-3 text-yellow-400 hover:text-yellow-300 bg-black/40 rounded-full p-2 transition-colors focus:outline-none"
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
            <h3 className="text-2xl font-bold mb-4 drop-shadow text-yellow-300">
              {resetStep === "email"
                ? "Forgot Password"
                : resetStep === "otp"
                ? "Enter OTP"
                : "Set New Password"}
            </h3>

            {resetStep === "email" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="flex-1 bg-gray-900/80 border-2 border-yellow-400 text-white placeholder-gray-400 px-2 py-3 text-sm rounded-lg shadow focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={resetLoading || !resetEmail}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-2 px-3 rounded-lg transition-all shadow-lg hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </div>
              </div>
            )}
            {resetStep === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-yellow-200 text-sm mb-2">
                  OTP sent to: {resetEmail}
                  <br />
                  {otpTimer > 0 ? (
                    <span className="text-blue-300">
                      Code expires in: {Math.floor(otpTimer / 60)}:
                      {(otpTimer % 60).toString().padStart(2, "0")}
                    </span>
                  ) : (
                    <span className="text-red-400">
                      OTP has expired. Please request a new one.
                    </span>
                  )}
                </div>
                <div className="flex gap-2 justify-center">
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
                      className="w-12 h-12 bg-gray-900/80 border-2 border-yellow-400 text-white text-center text-xl font-bold rounded-lg shadow focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 transition-all"
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={resetLoading || resetOtp.length !== 6}
                    className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? (
                      <span className="flex items-center justify-center">
                        <FaSpinner className="animate-spin mr-2" />
                        Verifying...
                      </span>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackFromOtp}
                    className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg"
                  >
                    Back
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resetLoading}
                  className="w-full bg-transparent border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetLoading ? (
                    <span className="flex items-center justify-center">
                      <FaSpinner className="animate-spin mr-2" />
                      Resending...
                    </span>
                  ) : resendCooldown > 0 ? (
                    `Resend OTP (${resendCooldown}s)`
                  ) : (
                    "Resend OTP"
                  )}
                </button>
              </form>
            )}
            {resetStep === "password" && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-gray-900/80 border-2 border-yellow-400 text-white placeholder-gray-400 px-4 py-3 text-base rounded-lg shadow focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 hover:text-yellow-300 cursor-pointer text-xl focus:outline-none"
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-2 text-sm flex items-center gap-2">
                      <div
                        className={`h-2 flex-1 rounded ${
                          newPassword.length < 8
                            ? "bg-red-500"
                            : newPassword.length < 12
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      />
                      <span className="text-gray-300">
                        {newPassword.length < 8
                          ? "Weak"
                          : newPassword.length < 12
                          ? "Medium"
                          : "Strong"}
                      </span>
                    </div>
                  )}
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className={`w-full bg-gray-900/80 border-2 ${
                    confirmNewPassword && confirmNewPassword !== newPassword
                      ? "border-red-500"
                      : "border-yellow-400"
                  } text-white placeholder-gray-400 px-4 py-3 text-base rounded-lg shadow focus:outline-none focus:ring-2 ${
                    confirmNewPassword && confirmNewPassword !== newPassword
                      ? "focus:ring-red-500"
                      : "focus:ring-yellow-400"
                  } transition-all`}
                />
                <button
                  type="submit"
                  disabled={
                    resetLoading ||
                    !newPassword ||
                    newPassword !== confirmNewPassword
                  }
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetLoading ? (
                    <span className="flex items-center justify-center">
                      <FaSpinner className="animate-spin mr-2" />
                      Updating...
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            )}
            {resetStatus && (
              <div
                className={`mt-4 text-base font-medium rounded-lg py-2 px-4 ${
                  resetStatus.includes("sent") ||
                  resetStatus.includes("verified") ||
                  resetStatus.includes("successfully")
                    ? "bg-green-600/90 text-white"
                    : "bg-red-600/90 text-white"
                }`}
              >
                {resetStatus}
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
