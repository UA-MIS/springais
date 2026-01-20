import axios, { AxiosInstance } from 'axios';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    });

    // Add token to all requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 Unauthorized (auto-logout)
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        if (!error.response) {
          error.message = 'Network error. Please check your connection.';
        }
        return Promise.reject(error);
      }
    );
  }

  get<T = any>(url: string, config?: object) {
    return this.client.get<T>(url, config);
  }

  post<T = any>(url: string, data?: unknown, config?: object) {
    return this.client.post<T>(url, data, config);
  }

  put<T = any>(url: string, data?: unknown, config?: object) {
    return this.client.put<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: object) {
    return this.client.delete<T>(url, config);
  }
}

const api = new APIClient();

export default api;
