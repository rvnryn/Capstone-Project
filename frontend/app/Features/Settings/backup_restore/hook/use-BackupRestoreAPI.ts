import { offlineAxiosRequest } from "@/app/utils/offlineAxios";

export function useBackupRestoreAPI() {
  // Download backup from FastAPI, encrypt if password provided
  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const backup = async (password: string): Promise<void> => {
    if (!password) throw new Error("Password is required for backup.");
    // Request backup from backend, passing password as query param (required)
    const response = await offlineAxiosRequest<{ data: Blob; headers?: any }>(
      {
        method: "GET",
        url: `/api/backup?password=${encodeURIComponent(password)}`,
        responseType: "blob",
      },
      {
        cacheKey: "backup-data",
        cacheHours: 0,
        showErrorToast: true,
        fallbackData: undefined,
      }
    );
    if (!response.data) {
      throw new Error("Backup not available offline");
    }
    // Use filename from content-disposition header if available
    let filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const disposition =
      response.data.headers?.["content-disposition"] ||
      response.data.headers?.get?.("content-disposition");
    if (disposition) {
      const match = /filename=([^;]+)/.exec(disposition);
      if (match) filename = match[1].replace(/"/g, "");
    } else {
      filename += ".json.enc";
    }
    const blob = new Blob([response.data.data], {
      type: (response.data.data as Blob).type || "application/octet-stream",
    });
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
  const restore = async (password: string, file: File): Promise<boolean> => {
    if (!file || !file.name) {
      throw new Error("No file selected for restore or file is invalid.");
    }
    // Only require password for .enc files
    if (file.name.endsWith(".enc") && !password) {
      throw new Error("Password is required for restore.");
    }
    // Send file and password as form fields
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("password", password || "");
    const token = getToken();
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
    if (!backupPassword)
      throw new Error("Password is required for Drive backup.");
    try {
      const token = getToken();
      const response = await offlineAxiosRequest(
        {
          method: "POST",
          url: "/api/backup_drive",
          data: { access_token, password: backupPassword },
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
    file_id: string,
    password: string
  ): Promise<boolean> => {
    if (!password) throw new Error("Password is required for Drive restore.");
    try {
      const token = getToken();
      await offlineAxiosRequest(
        {
          method: "POST",
          url: "/api/restore_drive",
          data: { access_token, file_id, password },
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

  const backupToS3 = async (
    backupPassword: string,
    filename?: string
  ): Promise<string> => {
    if (!backupPassword) throw new Error("Password is required for S3 backup.");
    try {
      const token = getToken();
      const response = await offlineAxiosRequest(
        {
          method: "POST",
          url: "/api/backup_s3",
          data: { password: backupPassword, ...(filename ? { filename } : {}) },
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
        {
          showErrorToast: true,
        }
      );
      return response.data.filename;
    } catch (error: any) {
      const errData = error?.response?.data;
      throw new Error(
        (errData && (errData.detail || JSON.stringify(errData))) ||
          error.message ||
          String(error)
      );
    }
  };

  const restoreFromS3 = async (
    filename: string | undefined,
    password: string
  ): Promise<boolean> => {
    // Only require password for .enc files
    if (filename && filename.endsWith(".enc") && !password) {
      throw new Error("Password is required for S3 restore.");
    }
    const token = getToken();
    try {
      await offlineAxiosRequest(
        {
          method: "POST",
          url: "/api/restore_s3",
          data: filename ? { filename, password } : { password },
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

  return {
    backup,
    restore,
    backupToDrive,
    restoreFromDrive,
    restoreFromS3,
    backupToS3,
  };
}
