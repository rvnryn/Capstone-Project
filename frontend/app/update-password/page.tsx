"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../utils/Server/supabaseClient";
import { FaCheck, FaEye, FaEyeSlash, FaSpinner, FaTimes } from "react-icons/fa";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4 py-10">
      <section className="backdrop-blur-md bg-black/70 p-8 border border-yellow-400/60 rounded-3xl shadow-2xl w-full max-w-md text-center animate-fadeIn">
        <h1 className="text-3xl font-extrabold mb-6 text-yellow-300 drop-shadow">
          🔒 Reset Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-left text-gray-200 font-semibold mb-2"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
                className="w-full bg-gray-900/70 border-2 border-yellow-400 text-white placeholder-gray-400 px-4 py-3 text-base rounded-lg shadow focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 transition-all pr-12"
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

            {/* Password Strength */}
            {password && (
              <div className="mt-2 text-sm flex items-center gap-2">
                <div
                  className={`h-2 flex-1 rounded ${
                    password.length < 8
                      ? "bg-red-500"
                      : password.length < 12
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                />
                <span className="text-gray-300">
                  {password.length < 8
                    ? "Weak"
                    : password.length < 12
                    ? "Medium"
                    : "Strong"}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-left text-gray-200 font-semibold mb-2"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={`w-full bg-gray-900/70 border-2 ${
                  confirmPassword && confirmPassword !== password
                    ? "border-red-500"
                    : "border-yellow-400"
                } text-white placeholder-gray-400 px-4 py-3 text-base rounded-lg shadow focus:outline-none focus:ring-2 ${
                  confirmPassword && confirmPassword !== password
                    ? "focus:ring-red-500"
                    : "focus:ring-yellow-400"
                } transition-all`}
              />
              {confirmPassword && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl">
                  {confirmPassword === password ? (
                    <FaCheck className="text-green-400" />
                  ) : (
                    <FaTimes className="text-red-400" />
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Error + Success */}
          {error && (
            <div className="bg-red-600/90 text-white rounded-lg py-2 px-4 text-base font-medium shadow mb-2 animate-shake">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-600/90 text-white rounded-lg py-2 px-4 text-base font-medium shadow mb-2 animate-fadeIn">
              ✅ Password updated! Redirecting...
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3 px-8 rounded-full transition-all text-lg shadow-lg hover:scale-105 active:scale-95 transform focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
            disabled={loading || !password || password !== confirmPassword}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" />
                Updating...
              </span>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
