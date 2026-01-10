<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="card max-w-md w-full fade-in">
      <!-- 顶部装饰 -->
      <div class="text-center mb-8">
        <div class="text-6xl mb-4 pulse-soft">👶</div>
        <h1 class="text-3xl font-bold text-primary-600 mb-2">宝宝胎动记录</h1>
        <p class="text-gray-500">记录每一次温柔的互动 💕</p>
      </div>

      <!-- 表单 -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
          <input
            v-model="form.username"
            type="text"
            required
            class="input-field"
            placeholder="输入用户名"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
          <input
            v-model="form.password"
            type="password"
            required
            class="input-field"
            placeholder="输入密码"
          />
        </div>

        <!-- 注册时需要的昵称 -->
        <div v-if="isRegister">
          <label class="block text-sm font-medium text-gray-700 mb-2">昵称</label>
          <input
            v-model="form.displayName"
            type="text"
            :required="isRegister"
            class="input-field"
            placeholder="如：爸爸/妈妈"
          />
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm">
          {{ error }}
        </div>

        <!-- 提交按钮 -->
        <button
          type="submit"
          :disabled="loading"
          class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? '处理中...' : (isRegister ? '注册' : '登录') }}
        </button>

        <!-- 切换登录/注册 -->
        <div class="text-center">
          <button
            type="button"
            @click="toggleMode"
            class="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
          </button>
        </div>
      </form>

      <!-- 说明文字 -->
      <div class="mt-8 pt-6 border-t border-primary-100">
        <p class="text-xs text-gray-500 text-center">
          💡 建议夫妻两人各注册一个账号<br>
          这样可以同时记录和查看宝宝的胎动
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api.js';

const router = useRouter();

const isRegister = ref(false);
const loading = ref(false);
const error = ref('');

const form = ref({
  username: '',
  password: '',
  displayName: ''
});

const toggleMode = () => {
  isRegister.value = !isRegister.value;
  error.value = '';
};

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';

  try {
    const action = isRegister.value ? api.register : api.login;
    const result = await action(form.value);

    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));

    router.push('/');
  } catch (err) {
    error.value = err.error || '操作失败，请重试';
  } finally {
    loading.value = false;
  }
};
</script>
