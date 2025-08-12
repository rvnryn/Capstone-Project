"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/Server/supabaseClient";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/update-password",
    });

    setLoading(false);
    if (error) {
      setStatus(
        "❌ Failed to send reset link. Please check your email address and try again."
      );
    } else {
      setStatus(
        "✅ If your email exists, a reset link has been sent. Please check your inbox and spam folder."
      );
    }
  };

  const handleBackToLogin = () => {
    router.push("/");
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-black">
      <section className="bg-black/70 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center flex flex-col items-center border border-yellow-400">
        <h1 className="text-yellow-400 text-2xl font-semibold mb-4">
          Reset Password
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full bg-black border border-yellow-400 text-yellow-100 placeholder-yellow-400 px-4 py-3 rounded-xl shadow focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 transition-all"
          />
          {status && (
            <div
              className={`rounded py-2 px-3 text-base font-medium shadow mb-2 ${
                status.startsWith("❌")
                  ? "bg-red-600/80 text-white animate-shake"
                  : "bg-green-100/80 text-black"
              }`}
            >
              {status}
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded transition-all shadow ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Sending..." : "Send"}
            </button>
            <button
              type="button"
              onClick={handleBackToLogin}
              className="bg-black border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-semibold py-2 px-6 rounded transition-all shadow"
            >
              Close
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default ResetPassword;
