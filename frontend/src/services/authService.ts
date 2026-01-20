import axios from 'axios';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  department?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await authApi.post('/auth/login', { email, password });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async getCurrentUser(_token: string): Promise<User> {
    try {
      const response = await authApi.get('/auth/me', {
        headers: { Authorization: `Bearer ${_token}` },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get current user');
    }
  },

  async register(email: string, password: string, name: string): Promise<LoginResponse> {
    try {
      const response = await authApi.post('/auth/register', { email, password, name });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }
};
