import React from "react";

interface OfflineDataBannerProps {
  message?: string;
}

const OfflineDataBanner: React.FC<OfflineDataBannerProps> = ({ message }) => (
  <div style={{
    background: "#f87171",
    color: "#fff",
    padding: "12px 20px",
    textAlign: "center",
    fontWeight: 600,
    borderRadius: 8,
    margin: "16px 0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    zIndex: 1000,
  }}>
    {message || "You are offline. Some features may be unavailable."}
  </div>
);

export default OfflineDataBanner;
