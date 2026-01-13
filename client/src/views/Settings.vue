<template>
  <div class="max-w-md mx-auto p-4 pt-6 pb-24">
    <!-- 头部 -->
    <header class="card mb-6 fade-in">
      <h1 class="text-2xl font-bold text-primary-600 mb-2">⚙️ 设置</h1>
      <p class="text-sm text-gray-500">配置预产期和其他选项</p>
    </header>

    <!-- 预产期设置 -->
    <div class="card mb-6 fade-in">
      <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span>📅</span>
        <span>预产期设置</span>
      </h3>

      <!-- 当前孕周显示 -->
      <div v-if="settings.dueDate && pregnancyInfo" class="bg-gradient-to-br from-primary-50 to-warm-50 rounded-2xl p-4 mb-4">
        <div class="text-center">
          <div class="text-sm text-gray-600 mb-2">当前孕周</div>
          <div class="text-4xl font-bold text-primary-600 mb-2">
            {{ pregnancyInfo.weeks }}<span class="text-2xl">周</span>{{ pregnancyInfo.days }}<span class="text-2xl">天</span>
          </div>
          <div class="text-xs text-gray-500 mt-2">
            预产期：{{ formatDate(settings.dueDate) }}
          </div>
          <div class="text-xs text-gray-500 mt-1">
            距离预产期还有 {{ pregnancyInfo.daysUntilDue }} 天
          </div>
        </div>
      </div>

      <!-- 预产期输入 -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            预产期
          </label>
          <input
            type="date"
            v-model="dueDateInput"
            :min="minDate"
            :max="maxDate"
            class="input-field text-center"
          />
          <p class="text-xs text-gray-500 mt-2">
            💡 预产期通常为末次月经第一天 + 280天
          </p>
        </div>

        <button
          @click="saveDueDate"
          :disabled="!dueDateInput || saving"
          class="btn-primary w-full disabled:opacity-50"
        >
          {{ saving ? '保存中...' : '保存预产期' }}
        </button>

        <!-- 成功提示 -->
        <div v-if="saveSuccess" class="bg-green-50 text-green-700 px-4 py-3 rounded-2xl text-sm text-center fade-in">
          ✅ 保存成功！
        </div>

        <!-- 错误提示 -->
        <div v-if="saveError" class="bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm text-center fade-in">
          {{ saveError }}
        </div>
      </div>

      <!-- 预产期说明 -->
      <div class="mt-6 pt-6 border-t border-gray-200">
        <h4 class="text-sm font-semibold text-gray-700 mb-2">如何计算预产期？</h4>
        <ul class="text-xs text-gray-600 space-y-1">
          <li>• 方法1：末次月经第一天 + 280天（40周）</li>
          <li>• 方法2：末次月经月份 - 3（或 + 9），日期 + 7</li>
          <li>• 方法3：询问医生的B超推算结果</li>
        </ul>
      </div>
    </div>

    <!-- 账户设置 -->
    <div class="card fade-in">
      <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span>👤</span>
        <span>账户</span>
      </h3>

      <button
        @click="handleLogout"
        class="w-full px-4 py-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors font-medium flex items-center justify-center gap-2"
      >
        <span class="text-xl">👋</span>
        <span>退出登录</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api.js';

const router = useRouter();

// 退出登录
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }
};

// 状态
const settings = ref({ dueDate: null });
const dueDateInput = ref('');
const saving = ref(false);
const saveSuccess = ref(false);
const saveError = ref('');

// 日期范围限制
const minDate = computed(() => {
  // 最早：6个月前（约24周前）
  const date = new Date();
  date.setMonth(date.getMonth() - 6);
  return date.toISOString().split('T')[0];
});

const maxDate = computed(() => {
  // 最晚：10个月后（约40周后）
  const date = new Date();
  date.setMonth(date.getMonth() + 10);
  return date.toISOString().split('T')[0];
});

// 计算孕周信息
const pregnancyInfo = computed(() => {
  if (!settings.value.dueDate) return null;

  // 使用午夜时间（00:00:00）确保日期计算准确
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(settings.value.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  // 预产期通常是40周，280天
  const conceptionDate = new Date(dueDate);
  conceptionDate.setDate(conceptionDate.getDate() - 280);
  conceptionDate.setHours(0, 0, 0, 0);

  // 计算从怀孕开始到现在的天数
  const daysSinceConception = Math.round((today - conceptionDate) / (1000 * 60 * 60 * 24));

  // 计算周和天
  const weeks = Math.floor(daysSinceConception / 7);
  const days = daysSinceConception % 7;

  // 距离预产期的天数
  const daysUntilDue = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

  return {
    weeks,
    days,
    daysUntilDue,
    totalDays: daysSinceConception
  };
});

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// 加载设置
const loadSettings = async () => {
  try {
    const data = await api.getSettings();
    settings.value = data;
    if (data.dueDate) {
      dueDateInput.value = data.dueDate.split('T')[0];
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
};

// 保存预产期
const saveDueDate = async () => {
  saving.value = true;
  saveSuccess.value = false;
  saveError.value = '';

  try {
    const data = await api.setDueDate(dueDateInput.value);
    settings.value = data;

    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
  } catch (error) {
    saveError.value = error.error || '保存失败，请重试';
    setTimeout(() => {
      saveError.value = '';
    }, 3000);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadSettings();
});
</script>
