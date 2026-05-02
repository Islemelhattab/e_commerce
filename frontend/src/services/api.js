import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

const isAuthRoute = (url = '') => {
  return ['/auth/login/', '/auth/register/', '/auth/refresh/'].some((path) => url.includes(path));
};

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && !isAuthRoute(config.url)) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && isAuthRoute(original?.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh/`, { refresh: refreshToken });
          localStorage.setItem('access_token', res.data.access);
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// AUTH
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  verifyEmail: (token) => api.post('/auth/verify-email/', { token }),
  forgotPassword: (email) => api.post('/auth/forgot-password/', { email }),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
};

// USER
export const userAPI = {
  getProfile: () => api.get('/user/profile/'),
  updateProfile: (data) => api.patch('/user/profile/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  changePassword: (data) => api.put('/user/change-password/', data),
  getAddresses: () => api.get('/addresses/'),
  createAddress: (data) => api.post('/addresses/', data),
  updateAddress: (id, data) => api.patch(`/addresses/${id}/`, data),
  deleteAddress: (id) => api.delete(`/addresses/${id}/`),
  setDefaultAddress: (id) => api.post(`/addresses/${id}/set_default/`),
  getWishlist: () => api.get('/wishlist/'),
  toggleWishlist: (productId) => api.post('/wishlist/toggle/', { product_id: productId }),
};

// PRODUCTS
export const productAPI = {
  getProducts: (params) => api.get('/products/', { params }),
  getProduct: (slug) => api.get(`/products/${slug}/`),
  getFeatured: () => api.get('/products/featured/'),
  getNewArrivals: () => api.get('/products/new_arrivals/'),
  getBestSellers: () => api.get('/products/best_sellers/'),
  getSimilar: (slug) => api.get(`/products/${slug}/similar/`),
  getCategories: () => api.get('/categories/'),
  getBrands: () => api.get('/brands/'),
};

// CART
export const cartAPI = {
  getCart: () => api.get('/cart/'),
  addToCart: (data) => api.post('/cart/add/', data),
  updateQuantity: (itemId, quantity) => api.patch(`/cart/${itemId}/update_quantity/`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/${itemId}/remove/`),
  clearCart: () => api.delete('/cart/clear/'),
};

// ORDERS
export const orderAPI = {
  getOrders: () => api.get('/orders/'),
  getOrder: (id) => api.get(`/orders/${id}/`),
  createOrder: (data) => api.post('/orders/', data),
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel/`, { reason }),
  returnRequest: (id, data) => api.post(`/orders/${id}/return_request/`, data),
};

// REVIEWS
export const reviewAPI = {
  getProductReviews: (productId) => api.get(`/reviews/?product=${productId}`),
  createReview: (data) => api.post('/reviews/', data),
  updateReview: (id, data) => api.patch(`/reviews/${id}/`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}/`),
  reportReview: (id, reason) => api.post(`/reviews/${id}/report/`, { reason }),
};

// PAYMENT
export const paymentAPI = {
  createPaymentIntent: (orderId) => api.post('/payment/create-intent/', { order_id: orderId }),
  validateCoupon: (code, cartTotal) => api.post('/coupons/validate/', { code, cart_total: cartTotal }),
};

// NOTIFICATIONS
export const notificationAPI = {
  getNotifications: () => api.get('/notifications/'),
  markRead: (id) => api.patch(`/notifications/${id}/mark_read/`),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
};

// SHIPPING
export const shippingAPI = {
  getMethods: () => api.get('/shipping/methods/'),
};

export default api;
