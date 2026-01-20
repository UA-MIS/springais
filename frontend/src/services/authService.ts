export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  department?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Mock login function (remove when backend is ready)
const mockLogin = async (email: string, password: string): Promise<LoginResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Hardcoded credentials for testing
  if (email === 'admin@ey.com' && password === 'password') {
    return {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token',
      user: {
        id: 1,
        email: 'admin@ey.com',
        name: 'John Doe',
        role: 'Senior Consultant',
        department: 'Advisory'
      }
    };
  }
  
  throw new Error('Invalid credentials');
};

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await api.post('/auth/login', { email, password });
      // return response.data;
      
      return await mockLogin(email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  logout(): void {
    localStorage.removeItem('token');
  },

  async getCurrentUser(_token: string): Promise<User> {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await api.get('/auth/me');
      // return response.data;
      
      // Mock response for now
      return {
        id: 1,
        email: 'admin@ey.com',
        name: 'John Doe',
        role: 'Senior Consultant',
        department: 'Advisory'
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get current user');
    }
  }
};
