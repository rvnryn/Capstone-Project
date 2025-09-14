import CryptoJS from "crypto-js";
import axiosInstance from "@/app/lib/axios";
import { offlineAxiosRequest } from "@/app/utils/offlineAxios";

export function useBackupRestoreAPI() {
  // Download backup from FastAPI, encrypt if password provided
  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const backup = async (password: string = ""): Promise<void> => {
    // Use offline-aware axios for GET request, get raw gzip backup
    const response = await offlineAxiosRequest(
      {
        method: "GET",
        url: "/api/backup",
        responseType: "blob",
      },
      {
        cacheKey: "backup-data",
        cacheHours: 0, // Backups should not be cached
        showErrorToast: true,
        fallbackData: null,
      }
    );

    if (!response.data) {
      throw new Error("Backup not available offline");
    }

    let blob: Blob;
    let filename: string;
    if (password) {
      // Read the blob as ArrayBuffer, then encrypt as base64 string
      const arrayBuffer = await (response.data as Blob).arrayBuffer();
      const wordArray = CryptoJS.lib.WordArray.create(
        new Uint8Array(arrayBuffer)
      );
      const encrypted = CryptoJS.AES.encrypt(wordArray, password).toString();
      blob = new Blob([encrypted], { type: "text/plain" });
      filename = `backup-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json.enc`;
    } else {
      blob = new Blob([response.data], { type: "application/gzip" });
      filename = `backup-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Upload restore file to FastAPI, decrypt and decompress if needed
  const restore = async (
    password: string = "",
    file: File
  ): Promise<boolean> => {
    if (!file || !file.name) {
      throw new Error("No file selected for restore or file is invalid.");
    }
    let jsonText: string = "";
    const isGzipped = file.name.endsWith(".gz") || file.name.endsWith(".enc");
    const isEncrypted = file.name.endsWith(".enc");

    if (isGzipped) {
      // Always treat as binary
      const arrayBuffer = await file.arrayBuffer();
      let dataBuffer = new Uint8Array(arrayBuffer);
      // If encrypted, decrypt first
      if (isEncrypted) {
        const encryptedText = new TextDecoder("latin1").decode(dataBuffer);
        if (!password)
          throw new Error("Password required for encrypted backup.");
        const decrypted = CryptoJS.AES.decrypt(encryptedText, password);
        // Convert decrypted WordArray to Uint8Array
        const decryptedBytes = CryptoJS.enc.Latin1.stringify(decrypted);
        const byteArray = new Uint8Array(
          decryptedBytes.split("").map((c) => c.charCodeAt(0))
        );
        dataBuffer = byteArray;
      }
      // Now decompress
      try {
        const pako = (await import("pako")).default;
        jsonText = pako.ungzip(dataBuffer, { to: "string" });
      } catch (e) {
        throw new Error(
          "Failed to decompress gzipped backup: " + (e as Error).message
        );
      }
    } else if (isEncrypted) {
      // .json.enc: decrypt, then treat as text
      const fileText = await file.text();
      if (!password) throw new Error("Password required for encrypted backup.");
      const decrypted = CryptoJS.AES.decrypt(fileText, password);
      jsonText = decrypted.toString(CryptoJS.enc.Utf8);
      if (!jsonText)
        throw new Error("Incorrect password or corrupted backup file.");
    } else {
      // Plain .json
      jsonText = await file.text();
    }

    const blob = new Blob([jsonText], { type: "application/json" });
    const formData = new FormData();
    formData.append("file", blob, "restore.json");
    const token = getToken(); // <-- Add this line
    try {
      await offlineAxiosRequest(
        {
          method: "POST",
          url: "/api/restore",
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
        {
          showErrorToast: true,
        }
      );
    } catch (error: any) {
      const errData = error?.response?.data;
      throw new Error((errData && errData.detail) || "Restore failed");
    }
    return true;
  };

  const backupToDrive = async (
    access_token: string,
    backupPassword: string
  ): Promise<string> => {
    try {
      const token = getToken();
      const response = await offlineAxiosRequest(
        {
          method: "POST",
          url: "/api/backup_drive",
          data: { access_token },
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
        {
          showErrorToast: true,
        }
      );
      return response.data.file_id;
    } catch (error: any) {
      const errData = error?.response?.data;
      throw new Error(
        (errData && (errData.detail || JSON.stringify(errData))) ||
          error.message ||
          String(error)
      );
    }
  };

  // Restore from Google Drive
  const restoreFromDrive = async (
    access_token: string,
    file_id: string
  ): Promise<boolean> => {
    try {
      const token = getToken();
      await offlineAxiosRequest(
        {
          method: "POST",
          url: "/api/restore_drive",
          data: { access_token, file_id },
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
        {
          showErrorToast: true,
        }
      );
      return true;
    } catch (error: any) {
      const errData = error?.response?.data;
      throw new Error(
        (errData && (errData.detail || JSON.stringify(errData))) ||
          error.message ||
          String(error)
      );
    }
  };

  return { backup, restore, backupToDrive, restoreFromDrive };
}
