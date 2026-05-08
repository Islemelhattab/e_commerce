import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Purchasing ──────────────────────────────────────────────────────────────
export const purchasingAPI = {
  // Suppliers
  getSuppliers:    (params) => api.get('/purchasing/suppliers/', { params }),
  createSupplier:  (data)   => api.post('/purchasing/suppliers/', data),
  updateSupplier:  (id, data) => api.patch(`/purchasing/suppliers/${id}/`, data),
  deleteSupplier:  (id)     => api.delete(`/purchasing/suppliers/${id}/`),

  // Purchase Orders
  getOrders:       (params) => api.get('/purchasing/orders/', { params }),
  getOrder:        (id)     => api.get(`/purchasing/orders/${id}/`),
  createOrder:     (data)   => api.post('/purchasing/orders/', data),
  updateOrder:     (id, d)  => api.patch(`/purchasing/orders/${id}/`, d),
  sendOrder:       (id)     => api.post(`/purchasing/orders/${id}/send/`),
  confirmOrder:    (id, d)  => api.post(`/purchasing/orders/${id}/confirm/`, d),
  receiveOrder:    (id, d)  => api.post(`/purchasing/orders/${id}/receive/`, d),
  cancelOrder:     (id)     => api.post(`/purchasing/orders/${id}/cancel/`),

  // Invoices
  getInvoices:     (params) => api.get('/purchasing/invoices/', { params }),
  createInvoice:   (data)   => api.post('/purchasing/invoices/', data),
  validateInvoice: (id)     => api.post(`/purchasing/invoices/${id}/validate/`),
  payInvoice:      (id)     => api.post(`/purchasing/invoices/${id}/mark_paid/`),
};

// ── Supplier Portal ─────────────────────────────────────────────────────────
export const supplierPortalAPI = {
  getMyOrders:     (params) => api.get('/supplier-portal/orders/', { params }),
  getMyOrder:      (id)     => api.get(`/supplier-portal/orders/${id}/`),
  getMyInvoices:   (params) => api.get('/supplier-portal/invoices/', { params }),
  submitInvoice:   (data)   => api.post('/supplier-portal/invoices/', data),
};

// ── Accounting ──────────────────────────────────────────────────────────────
export const accountingAPI = {
  getAccounts:        (p) => api.get('/accounting/accounts/', { params: p }),
  getPeriods:         ()  => api.get('/accounting/periods/'),
  closePeriod:        (id) => api.post(`/accounting/periods/${id}/close/`),
  getEntries:         (p) => api.get('/accounting/entries/', { params: p }),
  createEntry:        (d) => api.post('/accounting/entries/', d),
  postEntry:          (id) => api.post(`/accounting/entries/${id}/post_entry/`),
  getBalance:         ()  => api.get('/accounting/entries/balance/'),
  getIncomeStatement: ()  => api.get('/accounting/entries/income_statement/'),
  getTVADeclaration:  ()  => api.get('/accounting/entries/tva_declaration/'),
};

// ── HR ──────────────────────────────────────────────────────────────────────
export const hrAPI = {
  // Departments
  getDepartments:    ()     => api.get('/hr/departments/'),
  createDepartment:  (d)    => api.post('/hr/departments/', d),

  // Employees
  getEmployees:      (p)    => api.get('/hr/employees/', { params: p }),
  getEmployee:       (id)   => api.get(`/hr/employees/${id}/`),
  createEmployee:    (d)    => api.post('/hr/employees/', d),
  updateEmployee:    (id,d) => api.patch(`/hr/employees/${id}/`, d),
  terminateEmployee: (id,d) => api.post(`/hr/employees/${id}/terminate/`, d),
  getPayrollHistory: (id)   => api.get(`/hr/employees/${id}/payroll_history/`),
  getLeaveHistory:   (id)   => api.get(`/hr/employees/${id}/leave_history/`),

  // Leaves
  getLeaves:         (p)    => api.get('/hr/leaves/', { params: p }),
  createLeave:       (d)    => api.post('/hr/leaves/', d),
  approveLeave:      (id)   => api.post(`/hr/leaves/${id}/approve/`),
  rejectLeave:       (id)   => api.post(`/hr/leaves/${id}/reject/`),

  // Payrolls
  getPayrolls:       (p)    => api.get('/hr/payrolls/', { params: p }),
  createPayroll:     (d)    => api.post('/hr/payrolls/', d),
  generateBatch:     (d)    => api.post('/hr/payrolls/generate_batch/', d),
  validatePayroll:   (id)   => api.post(`/hr/payrolls/${id}/validate/`),
  payPayroll:        (id)   => api.post(`/hr/payrolls/${id}/pay/`),
  getSummary:        (p)    => api.get('/hr/payrolls/summary/', { params: p }),
};
