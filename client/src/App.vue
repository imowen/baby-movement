<template>
  <div id="app" class="min-h-screen pb-20">
    <router-view></router-view>

    <!-- 底部导航栏 -->
    <nav v-if="showNav" class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg border-t border-primary-100">
      <div class="max-w-md mx-auto flex justify-around items-center py-3 px-4">
        <router-link
          to="/"
          class="flex flex-col items-center gap-1 transition-colors duration-200"
          :class="$route.path === '/' ? 'text-primary-500' : 'text-gray-400'"
        >
          <span class="text-2xl">👶</span>
          <span class="text-xs font-medium">记录</span>
        </router-link>

        <router-link
          to="/stats"
          class="flex flex-col items-center gap-1 transition-colors duration-200"
          :class="$route.path === '/stats' ? 'text-primary-500' : 'text-gray-400'"
        >
          <span class="text-2xl">📊</span>
          <span class="text-xs font-medium">统计</span>
        </router-link>

        <router-link
          to="/pregnancy-photos"
          class="flex flex-col items-center gap-1 transition-colors duration-200"
          :class="$route.path === '/pregnancy-photos' ? 'text-primary-500' : 'text-gray-400'"
        >
          <span class="text-2xl">📸</span>
          <span class="text-xs font-medium">孕照</span>
        </router-link>

        <router-link
          to="/settings"
          class="flex flex-col items-center gap-1 transition-colors duration-200"
          :class="$route.path === '/settings' ? 'text-primary-500' : 'text-gray-400'"
        >
          <span class="text-2xl">⚙️</span>
          <span class="text-xs font-medium">设置</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const showNav = computed(() => {
  return route.path !== '/login';
});
</script>
