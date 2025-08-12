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

interface ModalProps {
  message: ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ message, onClose }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 px-4">
    <section className="bg-gray-900 text-white p-8 border border-yellow-400 rounded-2xl shadow-2xl w-full max-w-sm text-center animate-fadeIn">
      <h3 className="text-2xl font-semibold mb-4">{message}</h3>
      <button
        onClick={onClose}
        className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-2 rounded-full transition duration-300 mt-2"
      >
        Close
      </button>
    </section>
  </div>
);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await loginUser(email, password);
      setIsModalOpen(true);
    } catch (error: any) {
      setError(error.message || "Login failed. Please try again.");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    router.push(routes.dashboard);
  };

  const handleResetPassword = () => {
    setShowResetModal(true);
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: "http://localhost:3000/update-password",
    });
    if (error) {
      setResetStatus("Failed to send reset link. Please check your email.");
    } else {
      setResetStatus("If your email exists, a reset link has been sent.");
    }
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

        {showResetModal && (
          <Modal
            message={
              <>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    Reset Password
                  </h3>
                  <form onSubmit={handleSendReset} className="space-y-4">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="w-full bg-gray-900/80 border-2 border-yellow-400 text-white placeholder-gray-400 px-3 py-2 rounded-lg shadow focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 transition-all mb-2"
                    />
                    <button
                      type="submit"
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-5 py-2 rounded-full transition duration-300 w-full"
                    >
                      Send Reset Link
                    </button>
                  </form>
                  {resetStatus && (
                    <div className="mt-3 text-yellow-200">{resetStatus}</div>
                  )}
                  <button
                    onClick={handleCloseResetModal}
                    className="mt-4 bg-black border border-yellow-400 text-yellow-400 px-4 py-2 rounded-full hover:bg-yellow-400 hover:text-black transition"
                  >
                    Close
                  </button>
                </div>
              </>
            }
            onClose={handleCloseResetModal}
          />
        )}
      </section>
      {isModalOpen && (
        <Modal message="Logged in successfully!" onClose={handleModalClose} />
      )}
    </main>
  );
};

export default Login;
