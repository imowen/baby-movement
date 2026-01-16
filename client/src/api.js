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
  getTodayStats(params) {
    // 支持两种调用方式：
    // 1. 新方式：getTodayStats({ startDate, endDate })
    // 2. 旧方式（向后兼容）：getTodayStats(date)

    let queryParams;
    if (typeof params === 'object' && params.startDate && params.endDate) {
      // 新方式：使用日期范围
      queryParams = {
        startDate: params.startDate,
        endDate: params.endDate
      };
    } else {
      // 旧方式：使用日期字符串（向后兼容）
      let date = params;
      if (!date) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        date = `${year}-${month}-${day}`;
      }
      queryParams = { date };
    }

    return api.get('/movements/today-stats', { params: queryParams });
  },
  getDailyStats(days = 30, timezone = 'auto') {
    return api.get('/movements/daily-stats', { params: { days, timezone } });
  },

  // 设置
  getSettings() {
    return api.get('/settings');
  },
  setDueDate(dueDate) {
    return api.post('/settings/due-date', { dueDate });
  },
  setTimezone(timezone) {
    return api.post('/settings/timezone', { timezone });
  },

  // 孕期信息
  getPregnancyInfo() {
    return api.get('/pregnancy/info');
  },
  setupPregnancy(data) {
    return api.post('/pregnancy/setup', data);
  },
  getWeekInfo(weekNumber) {
    return api.get(`/pregnancy/week/${weekNumber}`);
  },
  getPregnancyStandards() {
    return api.get('/pregnancy/standards');
  },
  getPregnancyTimeline() {
    return api.get('/pregnancy/timeline');
  },

  // 胎动分析
  analyzeMovements() {
    return api.get('/movements/analyze');
  }
};
