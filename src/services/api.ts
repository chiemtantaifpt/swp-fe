import axios, { InternalAxiosRequestConfig, AxiosError } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add token to headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("eco_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const authPages = ["/login", "/register"];
      const isOnAuthPage = authPages.some((p) => window.location.pathname.startsWith(p));

      if (!isOnAuthPage) {
        // Token hết hạn khi đang dùng app → clear và redirect
        localStorage.removeItem("eco_token");
        localStorage.removeItem("eco_refresh_token");
        localStorage.removeItem("eco_user");
        window.location.href = "/login";
      }
      // Nếu đang ở trang login/register → để lỗi bubble lên catch bình thường
    }
    return Promise.reject(error);
  }
);

export default api;
