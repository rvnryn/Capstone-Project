import { getToken } from "@/app/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useBackupRestoreAPI() {
  // Delete backup from Supabase Storage
  const deleteBackup = async (filename: string): Promise<void> => {
    if (!filename) throw new Error("No filename provided for delete.");

    const token = getToken();
    const response = await fetch(
      `${API_BASE_URL}/api/delete-backup?filename=${encodeURIComponent(
        filename
      )}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  };
  // Download backup from FastAPI Supabase endpoint
  const backup = async (password: string): Promise<void> => {
    if (!password) throw new Error("Password is required for backup.");

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/backup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: "Backup failed" }));
      throw new Error(
        errorData.detail || `HTTP error! status: ${response.status}`
      );
    }

    // Expecting a JSON response with backup info
    const data = await response.json();
    const filename =
      data.filename ||
      `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json.enc`;

    // Download the backup file from Supabase Storage
    const fileResponse = await fetch(
      `${API_BASE_URL}/api/download-backup?filename=${encodeURIComponent(
        filename
      )}`,
      {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!fileResponse.ok) {
      throw new Error("Failed to download backup file");
    }

    const blob = await fileResponse.blob();
    if (!blob) {
      throw new Error("Backup not available");
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
      const response = await fetch(`${API_BASE_URL}/api/restore`, {
        method: "POST",
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let browser handle it
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Restore failed" }));
        throw new Error(errorData.detail || "Restore failed");
      }
    } catch (error: any) {
      if (error.message) {
        throw error;
      }
      throw new Error("Restore failed");
    }
    return true;
  };

  // List backups from Supabase Storage
  const listBackups = async (): Promise<string[]> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/list-backups`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to list backups");
    }

    const data = await response.json();
    return data.files || [];
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
      const response = await fetch(`${API_BASE_URL}/api/restore-local`, {
        method: "POST",
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let browser handle it
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Restore from local backup failed" }));
        throw new Error(errorData.detail || "Restore from local backup failed");
      }
    } catch (error: any) {
      if (error.message) {
        throw error;
      }
      throw new Error("Restore from local backup failed");
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
