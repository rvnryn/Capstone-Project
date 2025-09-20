# Backup and Restore Process Documentation

## Overview
This document describes the process for securely backing up and restoring data in the Cardiac Delights system, including both manual and automatic backups. All backups are encrypted for security.

---

## 1. Backup Process

### 1.1 Manual Backup (User-Initiated)
- **User Action:**
  - User initiates a backup from the frontend UI.
  - User is prompted to enter a password (optional).
- **Backend Logic:**
  - If the user provides a password, it is used to encrypt the backup file.
  - If no password is provided, the backend uses a strong, random password stored in an environment variable (e.g., `BACKUP_ENCRYPTION_PASSWORD`).
  - The backup data is compressed (gzip or zip) and then encrypted using Fernet (from the `cryptography` library).
  - The encrypted backup file is sent to the user for download (e.g., `backup.json.enc`).

### 1.2 Automatic Backup (Scheduled)
- **Schedule:**
  - Automatic backups are performed on a schedule (daily, weekly, or monthly) as configured in the system.
- **Backend Logic:**
  - The backup process runs without user input.
  - The backend always uses the environment variable password/key for encryption.
  - Data is exported, compressed, and encrypted using Fernet.
  - The encrypted backup file is saved locally and/or uploaded to cloud storage (e.g., S3, Google Drive).

---

## 2. Restore Process

### 2.1 Manual Restore (User-Initiated)
- **User Action:**
  - User selects a backup file to restore via the frontend UI.
  - User is prompted to enter the password used for encryption (if known).
- **Backend Logic:**
  - The backend attempts to decrypt the backup file using the provided password.
  - If the user did not provide a password, the backend tries the environment variable password/key.
  - If decryption is successful, the data is decompressed and restored to the database.
  - If decryption fails, an error is returned (e.g., wrong password).

### 2.2 Automatic Restore (Admin/Scripted)
- **Admin Action:**
  - Admin retrieves the encrypted backup file from storage.
  - Admin uses the environment variable password/key to decrypt and restore the backup.

---

## 3. Key Management
- The encryption key/password is stored securely in an environment variable (e.g., `BACKUP_ENCRYPTION_PASSWORD`).
- This key must be kept secret and never committed to version control.
- Only authorized personnel should have access to the key.
- If the key is rotated, document which backups were encrypted with which key.

---

## 4. Security Notes
- Never use user authentication passwords for backup encryption.
- Never hardcode encryption keys in source code.
- Always use strong, random passwords/keys for encryption.
- Protect your `.env` file and server environment.

---

## 5. Recovery
- To restore a backup, you must have:
  - The encrypted backup file.
  - The correct password (user-provided or environment key) used for encryption.
- If the password/key is lost, the backup cannot be decrypted or restored.

---

## 6. Example Environment Variable
```
# .env
BACKUP_ENCRYPTION_PASSWORD=your-strong-random-password-here
```

---

## 7. Contact
For questions or recovery assistance, contact your system administrator or support team. Do not share the encryption key via insecure channels.
