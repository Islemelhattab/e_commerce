import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const adminApi = axios.create({ baseURL: `${API_BASE}/admin` });

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  r => r,
  async error => {
    if (error.response?.status === 401) {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh/`, { refresh });
          localStorage.setItem('access_token', res.data.access);
          error.config.headers.Authorization = `Bearer ${res.data.access}`;
          return adminApi(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// FIX: authenticated CSV download helper.
// Using <a href="..."> directly sends no Authorization header → 401.
// This fetches the file with the Bearer token and triggers a browser download.
async function downloadCsv(path, filename) {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE}/admin${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Export failed: ${response.status}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const dashboardAPI = {
  getStats: () => adminApi.get('/dashboard/'),
  getReports: (type, period) => adminApi.get(`/reports/?type=${type}&period=${period}`),
};

export const adminUsersAPI = {
  list: (params) => adminApi.get('/users/', { params }),
  get: (id) => adminApi.get(`/users/${id}/`),
  update: (id, data) => adminApi.patch(`/users/${id}/`, data),
  delete: (id) => adminApi.delete(`/users/${id}/`),
  toggleActive: (id) => adminApi.post(`/users/${id}/toggle_active/`),
  toggleStaff: (id) => adminApi.post(`/users/${id}/toggle_staff/`),
  getActivity: (id) => adminApi.get(`/users/${id}/activity/`),
};

export const adminProductsAPI = {
  list: (params) => adminApi.get('/products/', { params }),
  get: (id) => adminApi.get(`/products/${id}/`),
  create: (data) => adminApi.post('/products/', data),
  update: (id, data) => adminApi.patch(`/products/${id}/`, data),
  delete: (id) => adminApi.delete(`/products/${id}/`),
  uploadImage: (id, formData) => adminApi.post(`/products/${id}/upload_image/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateStock: (id, stock) => adminApi.patch(`/products/${id}/update_stock/`, { stock }),
  // FIX: was () => `${API_BASE}/admin/products/export_csv/` — plain URL, no auth header → 401
  exportCsv: () => downloadCsv('/products/export_csv/', 'produits.csv'),
};

export const adminOrdersAPI = {
  list: (params) => adminApi.get('/orders/', { params }),
  get: (id) => adminApi.get(`/orders/${id}/`),
  updateStatus: (id, data) => adminApi.post(`/orders/${id}/update_status/`, data),
  updatePayment: (id, data) => adminApi.post(`/orders/${id}/update_payment/`, data),
  // FIX: same issue — authenticated fetch+blob download
  exportCsv: () => downloadCsv('/orders/export_csv/', 'commandes.csv'),
  exportPdf: () => adminApi.get('/orders/export_pdf/'),
};

export const adminReturnsAPI = {
  list: (params) => adminApi.get('/returns/', { params }),
  approve: (id, data) => adminApi.post(`/returns/${id}/approve/`, data),
  reject: (id, data) => adminApi.post(`/returns/${id}/reject/`, data),
};

export const adminReviewsAPI = {
  list: (params) => adminApi.get('/reviews/', { params }),
  approve: (id) => adminApi.post(`/reviews/${id}/approve/`),
  reject: (id) => adminApi.post(`/reviews/${id}/reject/`),
  delete: (id) => adminApi.delete(`/reviews/${id}/`),
};

export const adminCouponsAPI = {
  list: (params) => adminApi.get('/coupons/', { params }),
  create: (data) => adminApi.post('/coupons/', data),
  update: (id, data) => adminApi.patch(`/coupons/${id}/`, data),
  delete: (id) => adminApi.delete(`/coupons/${id}/`),
  toggle: (id) => adminApi.post(`/coupons/${id}/toggle_active/`),
};

export const adminNewsletterAPI = {
  getStats: () => adminApi.get('/newsletter/'),
  send: (data) => adminApi.post('/newsletter/', data),
};

export const adminBannersAPI = {
  list: () => adminApi.get('/banners/'),
  create: (data) => adminApi.post('/banners/', data),
  update: (data) => adminApi.patch('/banners/', data),
};

export default adminApi;
