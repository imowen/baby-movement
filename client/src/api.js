import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

// 请求拦截器：添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default {
  // 认证
  register(data) {
    return api.post('/auth/register', data);
  },
  login(data) {
    return api.post('/auth/login', data);
  },

  // 胎动记录
  createMovement(data) {
    return api.post('/movements', data);
  },
  getMovements(params) {
    return api.get('/movements', { params });
  },
  deleteMovement(id) {
    return api.delete(`/movements/${id}`);
  },

  // 统计
  getTodayStats(date) {
    // 如果没有传递日期，使用客户端本地日期
    if (!date) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      date = `${year}-${month}-${day}`;
    }
    return api.get('/movements/today-stats', { params: { date } });
  },
  getDailyStats(days = 30) {
    return api.get('/movements/daily-stats', { params: { days } });
  },

  // 设置
  getSettings() {
    return api.get('/settings');
  },
  setDueDate(dueDate) {
    return api.post('/settings/due-date', { dueDate });
  }
};
