import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import Login from './views/Login.vue';
import Stats from './views/Stats.vue';
import Settings from './views/Settings.vue';
import PregnancyGuide from './views/PregnancyGuide.vue';
import PregnancyPhotos from './views/PregnancyPhotos.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/stats',
    name: 'Stats',
    component: Stats,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  },
  {
    path: '/pregnancy-guide',
    name: 'PregnancyGuide',
    component: PregnancyGuide,
    meta: { requiresAuth: true }
  },
  {
    path: '/pregnancy-photos',
    name: 'PregnancyPhotos',
    component: PregnancyPhotos,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');

  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (to.path === '/login' && token) {
    next('/');
  } else {
    next();
  }
});

export default router;
