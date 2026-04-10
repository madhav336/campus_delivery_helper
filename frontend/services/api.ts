import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.16.137.73:5000/api';

// ============= AUTH SERVICE =============

export const auth = {
  async signup(role: 'student' | 'outlet_owner', data: any) {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, role })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }
    const result = await response.json();
    await AsyncStorage.setItem('token', result.token);
    await AsyncStorage.setItem('user', JSON.stringify(result.user));
    return result;
  },

  async login(email: string, password: string) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    const result = await response.json();
    await AsyncStorage.setItem('token', result.token);
    await AsyncStorage.setItem('user', JSON.stringify(result.user));
    return result;
  },

  async logout() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  async getToken() {
    return await AsyncStorage.getItem('token');
  }
};

// Helper to add auth header
async function getHeaders() {
  const token = await auth.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
}

// ============= DELIVERY REQUESTS =============

export const requests = {
  async create(itemDescription: string, outlet: string, hostel: string, fee: number) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ itemDescription, outlet, hostel, fee })
    });
    if (!response.ok) throw new Error('Failed to create request');
    return response.json();
  },

  async getAll(filter: 'all' | 'own' | 'inprogress' | 'completed' = 'all', query?: string) {
    const headers = await getHeaders();
    const url = new URL(`${BASE_URL}/requests`);
    url.searchParams.append('filter', filter);
    if (query) url.searchParams.append('query', query);
    
    const response = await fetch(url.toString(), { headers });
    if (!response.ok) throw new Error('Failed to fetch requests');
    return response.json();
  },

  async getById(id: string) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/requests/${id}`, { headers });
    if (!response.ok) throw new Error('Request not found');
    return response.json();
  },

  async accept(id: string) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/requests/${id}/accept`, {
      method: 'PUT',
      headers
    });
    if (!response.ok) throw new Error('Failed to accept request');
    return response.json();
  },

  async complete(id: string) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/requests/${id}/complete`, {
      method: 'PUT',
      headers
    });
    if (!response.ok) throw new Error('Failed to complete request');
    return response.json();
  },

  async rate(id: string, rating: number, feedback?: string) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/requests/${id}/rate`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ rating, feedback })
    });
    if (!response.ok) throw new Error('Failed to rate request');
    return response.json();
  },

  async update(id: string, data: any) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/requests/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update request');
    return response.json();
  },

  async delete(id: string) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/requests/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error('Failed to delete request');
    return response.json();
  }
};

// ============= AVAILABILITY REQUESTS =============

export const availability = {
  async create(itemName: string, outlet: string) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/availability`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ itemName, outlet })
    });
    if (!response.ok) throw new Error('Failed to create availability request');
    return response.json();
  },

  async getOwn() {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/availability?filter=own`, { headers });
    if (!response.ok) throw new Error('Failed to fetch own requests');
    return response.json();
  },

  async getPublic() {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/availability?filter=public`, { headers });
    if (!response.ok) throw new Error('Failed to fetch public requests');
    return response.json();
  },

  async getPending() {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/availability/pending/all`, { headers });
    if (!response.ok) throw new Error('Failed to fetch pending requests');
    return response.json();
  },

  async respond(id: string, available: boolean) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/availability/${id}/respond`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ available })
    });
    if (!response.ok) throw new Error('Failed to respond');
    return response.json();
  },

  async update(id: string, itemName: string, outlet: string) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/availability/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ itemName, outlet })
    });
    if (!response.ok) throw new Error('Failed to update');
    return response.json();
  },

  async delete(id: string) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/availability/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error('Failed to delete');
    return response.json();
  }
};

// ============= USERS =============

export const users = {
  async getMe() {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/users/me`, { headers });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  async getById(id: string) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/users/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  async updateProfile(phone?: string, hostel?: string) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/users/me`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ phone, hostel })
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  async getAll(role?: string) {
    const headers = await getHeaders();
    const url = new URL(`${BASE_URL}/users`);
    if (role) url.searchParams.append('role', role);
    
    const response = await fetch(url.toString(), { headers });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async delete(id: string) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  }
};

// ============= OUTLETS =============

export const outlets = {
  async getAll() {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/outlets`, { headers });
    if (!response.ok) throw new Error('Failed to fetch outlets');
    return response.json();
  },

  async getById(id: string) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/outlets/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch outlet');
    return response.json();
  }
};

// ============= ANALYTICS =============

export const analytics = {
  async getSummary() {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/analytics/summary`, { headers });
    if (!response.ok) throw new Error('Failed to fetch summary');
    return response.json();
  },

  async getRequestsTrend(days: number = 30) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/analytics/requests-over-time?days=${days}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch requests trend');
    return response.json();
  },

  async getUsersTrend(days: number = 30) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/analytics/users-over-time?days=${days}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch users trend');
    return response.json();
  },

  async getApiUsage() {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/analytics/api-usage`, { headers });
    if (!response.ok) throw new Error('Failed to fetch API usage');
    return response.json();
  },

  async getLeaderboard() {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/analytics/leaderboard`, { headers });
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return response.json();
  }
};

export default { auth, requests, availability, users, outlets, analytics };
