"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { loginUser } from "./utils/API/LoginAPI";
import { routes } from "@/app/routes/routes";
import Image from "next/image";
import { supabase } from "./utils/Server/supabaseClient";
import { ReactNode } from "react";
import { useAuth } from "@/app/context/AuthContext";

interface ModalProps {
  message: ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ message, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 px-4 transition-opacity duration-300 animate-fadeIn">
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
          <h3 className="text-2xl font-bold mb-2 drop-shadow">{message}</h3>
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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const router = useRouter();
  const { refreshSession } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let loginEmail = email;

    // 1. Call backend login API (handles username/email)
    let backendResponse;
    try {
      backendResponse = await loginUser(email, password); // returns { access_token, email, ... }
      loginEmail = backendResponse.email;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
      return;
    }

    // 2. Supabase client login (must use email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    if (error) {
      setError(error.message);
      return;
    }

    // 3. Refresh context/session
    await refreshSession();
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    router.push(routes.dashboard);
  };

  const handleResetPassword = () => {
    setShowResetModal(true);
  };

  const handleCloseResetModal = () => {
    setShowResetModal(false);
    setResetStatus(null);
    setResetEmail("");
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
              placeholder="Enter your email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            <div className="bg-red-600/90 text-white rounded-lg py-2 px-4 text-base font-medium shadow mb-2 animate-shake">
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

      {isModalOpen && (
        <Modal message="Logged in successfully!" onClose={handleModalClose} />
      )}

      {showResetModal && (
        <Modal
          message={
            <div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                Reset Password
              </h3>
              <p className="text-yellow-200 mb-4">
                Please contact the Owner to change your password.
              </p>
              <button
                onClick={handleCloseResetModal}
                className="mt-4 bg-black border border-yellow-400 text-yellow-400 px-4 py-2 rounded-full hover:bg-yellow-400 hover:text-black transition"
              >
                Close
              </button>
            </div>
          }
          onClose={handleCloseResetModal}
        />
      )}
    </main>
  );
};

export default Login;
