import { offlineAxiosRequest } from "@/app/utils/offlineAxios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function useBackupRestoreAPI() {
  // Delete backup from Supabase Storage
  const deleteBackup = async (filename: string): Promise<void> => {
    if (!filename) throw new Error("No filename provided for delete.");
    await offlineAxiosRequest(
      {
        method: "DELETE",
        url: `${API_BASE_URL}/api/delete-backup?filename=${encodeURIComponent(
          filename
        )}`,
      },
      {
        showErrorToast: true,
      }
    );
  };
  // Download backup from FastAPI, encrypt if password provided
  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Download backup from FastAPI Supabase endpoint
  const backup = async (password: string): Promise<void> => {
    if (!password) throw new Error("Password is required for backup.");
    const response = await offlineAxiosRequest<{ data: Blob; headers?: any }>(
      {
        method: "GET",
        url: `${API_BASE_URL}/api/backup?password=${encodeURIComponent(
          password
        )}`,
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
    // Defensive: fallback to application/octet-stream if type is missing
    let blobType = "application/octet-stream";
    if (
      response.data.data &&
      typeof response.data.data === "object" &&
      "type" in response.data.data
    ) {
      blobType = (response.data.data as Blob).type || blobType;
    }
    const blob = new Blob([response.data.data], { type: blobType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Restore backup from Supabase endpoint
  const restore = async (password: string, file: File): Promise<boolean> => {
    if (!file || !file.name) {
      throw new Error("No file selected for restore or file is invalid.");
    }
    if (file.name.endsWith(".enc") && !password) {
      throw new Error("Password is required for restore.");
    }
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("password", password || "");
    const token = getToken();
    try {
      await offlineAxiosRequest(
        {
          method: "POST",
          url: `${API_BASE_URL}/api/restore`,
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

  // List backups from Supabase Storage
  const listBackups = async (): Promise<string[]> => {
    const response = await offlineAxiosRequest(
      {
        method: "GET",
        url: `${API_BASE_URL}/api/list-backups`,
      },
      {
        showErrorToast: true,
      }
    );
    return response.data.files || [];
  };

  // Restore backup from user-uploaded file (local restore)
  const restoreLocal = async (
    file: File,
    password: string
  ): Promise<boolean> => {
    if (!file || !file.name)
      throw new Error("No file selected for local restore.");
    if (file.name.endsWith(".enc") && !password) {
      throw new Error("Password is required for restore.");
    }
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("password", password || "");
    const token = getToken();
    try {
      await offlineAxiosRequest(
        {
          method: "POST",
          url: `${API_BASE_URL}/api/restore-local`,
          data: formData,
          headers: {
            // Do NOT set Content-Type, browser will set it for FormData
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
        {
          showErrorToast: true,
        }
      );
    } catch (error: any) {
      const errData = error?.response?.data;
      throw new Error(
        (errData && errData.detail) || "Restore from local backup failed"
      );
    }
    return true;
  };

  return {
    backup,
    restore,
    restoreLocal,
    listBackups,
    deleteBackup,
  };
}
