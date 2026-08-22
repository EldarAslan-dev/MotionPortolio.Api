const ADMIN_TOKEN_KEY = "adminToken";
const STAFF_TOKEN_KEY = "staffToken";
const STAFF_USERNAME_KEY = "staffUsername";

export const adminAuth = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },
};

export const staffAuth = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STAFF_TOKEN_KEY);
  },
  getUsername(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(STAFF_USERNAME_KEY) || "";
  },
  setSession(token: string, username: string) {
    localStorage.setItem(STAFF_TOKEN_KEY, token);
    localStorage.setItem(STAFF_USERNAME_KEY, username);
  },
  clear() {
    localStorage.removeItem(STAFF_TOKEN_KEY);
    localStorage.removeItem(STAFF_USERNAME_KEY);
  },
};

export function authHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
