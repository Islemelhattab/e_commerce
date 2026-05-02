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
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

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
  exportCsv: () => `${API_BASE}/admin/products/export_csv/`,
  getCategories: () => axios.get(`${API_BASE}/categories/`),
  getBrands: () => axios.get(`${API_BASE}/brands/`),
};

export const adminOrdersAPI = {
  list: (params) => adminApi.get('/orders/', { params }),
  get: (id) => adminApi.get(`/orders/${id}/`),
  updateStatus: (id, data) => adminApi.post(`/orders/${id}/update_status/`, data),
  updatePayment: (id, data) => adminApi.post(`/orders/${id}/update_payment/`, data),
  exportCsv: () => `${API_BASE}/admin/orders/export_csv/`,
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
