export const API_BASE_URL = "http://localhost:8080";

export const apiUrl = (path: string): string => {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
