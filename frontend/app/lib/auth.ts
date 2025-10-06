/**
 * Authentication utility functions
 */

/**
 * Get the authentication token from localStorage
 * @returns The token string or null if not found
 */
export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

/**
 * Set the authentication token in localStorage
 * @param token The token to store
 */
export const setToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

/**
 * Remove the authentication token from localStorage
 */
export const removeToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};

/**
 * Check if user is authenticated (has a valid token)
 * @returns boolean indicating if user has a token
 */
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};
