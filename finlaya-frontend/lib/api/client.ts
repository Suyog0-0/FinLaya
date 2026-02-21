const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  token?: string  // optional JWT token for protected routes
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Attach JWT if provided
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();

    return {
      data: response.ok ? data : undefined,
      error: !response.ok ? data.error || data.message : undefined,
      status: response.status,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 500,
    };
  }
}

export const api = {
  health: () => apiRequest('/health'),

  auth: {
    login: (email: string, password: string) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (email: string, password: string, name: string) =>
      apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),

    deleteAccount: (token: string) =>
      apiRequest('/auth/delete-account', { method: 'DELETE' }, token),
  },
};

export default api;