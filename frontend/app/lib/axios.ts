import axios, { AxiosError, AxiosResponse } from "axios";
import axiosRetry from "axios-retry";
import { toast } from "react-toastify";
import { loadingHandler } from "./loadingHandler";
import "react-toastify/dist/ReactToastify.css";

const toastConfig = {
  position: "top-right" as const,
  autoClose: 3000,
  theme: "colored" as const,
};

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 0,
  headers: { "Content-Type": "application/json" },
});

axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response ? error.response.status >= 500 : false)
    );
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    loadingHandler.start();
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    loadingHandler.stop();
    toast.error("❌ Request could not be sent.", toastConfig);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    loadingHandler.stop();
    return response;
  },
  (error: AxiosError) => {
    loadingHandler.stop();

    if (error.response) {
      const { status, data } = error.response as { status: number; data?: any };

      switch (status) {
        case 401:
          toast.warning(
            "⚠️ Session expired. Please log in again.",
            toastConfig
          );
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            window.location.href = "/";
          }
          break;
        case 403:
          toast.error("🚫 You don't have permission to do this.", toastConfig);
          break;
        case 404:
          toast.info("🔍 Requested resource not found.", toastConfig);
          break;
        case 500:
          toast.error("💥 Server error — retrying...", toastConfig);
          break;
        default:
          toast.error(
            `❗ ${data?.message || "Unexpected error occurred."}`,
            toastConfig
          );
      }
    } else if (error.request) {
      toast.error("🌐 No response from server. Please try again.", toastConfig);
    } else {
      toast.error(`⚙️ Error: ${error.message}`, toastConfig);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
