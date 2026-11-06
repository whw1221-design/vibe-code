const rawBaseUrl = import.meta.env.VITE_API_URL || '/api';

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, errors = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError(
      'Unable to reach the API server. Make sure the backend is running on port 5000.'
    );
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.message || `The request failed with status ${response.status}.`,
      response.status,
      payload?.errors
    );
  }

  return payload?.data ?? null;
}

const list = (path) => () => request(path);

export const api = {
  health: () => request('/health'),

  products: {
    list: list('/get_products'),
    get: (pid) => request(`/get_product/${pid}`),
    create: (product) => request('/add_product', { method: 'POST', body: product }),
    update: (pid, product) => request(`/update_product/${pid}`, { method: 'PUT', body: product }),
    remove: (pid) => request(`/delete_product/${pid}`, { method: 'DELETE' }),
  },

  users: {
    list: list('/get_users'),
    get: (uid) => request(`/get_user/${uid}`),
    create: (user) => request('/add_user', { method: 'POST', body: user }),
    update: (uid, user) => request(`/update_user/${uid}`, { method: 'PUT', body: user }),
    remove: (uid) => request(`/delete_user/${uid}`, { method: 'DELETE' }),
  },

  orders: {
    list: ({ uid, pid } = {}) => {
      const params = new URLSearchParams();
      if (uid) params.set('uid', uid);
      if (pid) params.set('pid', pid);
      const query = params.toString();
      return request(`/get_orders${query ? `?${query}` : ''}`);
    },
    get: (oid) => request(`/get_order/${oid}`),
    byUser: (uid) => request(`/get_orders/uid/${uid}`),
    byProduct: (pid) => request(`/get_orders/pid/${pid}`),
    create: (order) => request('/add_order', { method: 'POST', body: order }),
    update: (oid, order) => request(`/update_order/${oid}`, { method: 'PUT', body: order }),
    remove: (oid) => request(`/delete_order/${oid}`, { method: 'DELETE' }),
  },
};
