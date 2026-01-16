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
            产妇出生日期
          </label>
          <input
            type="date"
            v-model="birthDateInput"
            @change="updateHighRiskFromAge"
            :max="maxBirthDate"
            class="input-field text-center"
          />
          <p class="text-xs text-gray-500 mt-2">
            💡 系统将根据年龄自动判断是否高危（<18岁或≥35岁）
          </p>
          <div v-if="ageInfo" class="text-xs mt-2" :class="ageInfo.isHighRisk ? 'text-orange-600 font-medium' : 'text-gray-600'">
            当前年龄：{{ ageInfo.age }}岁
            <span v-if="ageInfo.isHighRisk" class="ml-2">⚠️ {{ ageInfo.reason }}</span>
          </div>
        </div>

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

        <!-- 高危孕妇选项 -->
        <div class="bg-yellow-50 rounded-xl p-4 space-y-3">
          <div class="flex items-center">
            <input
              v-model="isHighRiskInput"
              type="checkbox"
              id="highRisk"
              class="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
            >
            <label for="highRisk" class="ml-3 text-sm text-gray-700">
              <span class="font-medium">我是高危孕妇</span>
              <span class="block text-xs text-gray-500 mt-1">从26周开始加强胎动监测</span>
            </label>
          </div>
          <div class="text-xs text-gray-600 bg-yellow-100 rounded-lg p-3">
            <p class="font-medium mb-1">💡 其他需要勾选的情况：</p>
            <ul class="space-y-1 ml-2">
              <li>• 妊娠糖尿病或高血糖</li>
              <li>• 妊娠高血压</li>
              <li>• 多胎妊娠（双胎、三胎等）</li>
              <li>• 前置胎盘或胎盘异常</li>
              <li>• 心脏病、肾病等慢性疾病</li>
            </ul>
          </div>
        </div>

        <button
          @click="saveDueDate"
          :disabled="!dueDateInput || saving"
          class="btn-primary w-full disabled:opacity-50"
        >
          {{ saving ? '保存中...' : '保存设置' }}
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

    <!-- 时区设置 -->
    <div class="card mb-6 fade-in">
      <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span>🌍</span>
        <span>时区设置</span>
      </h3>

      <!-- 当前时区显示 -->
      <div class="bg-gradient-to-br from-primary-50 to-warm-50 rounded-2xl p-4 mb-4">
        <div class="text-center">
          <div class="text-sm text-gray-600 mb-2">当前时区</div>
          <div class="text-lg font-semibold text-primary-600 mb-2">
            {{ currentTimezoneDisplay }}
          </div>
          <div class="text-sm text-gray-700">
            当前时间：{{ currentTimeDisplay }}
          </div>
        </div>
      </div>

      <!-- 时区选择器 -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            选择时区
          </label>
          <select
            v-model="timezoneInput"
            @change="updateCurrentTime"
            class="input-field"
          >
            <optgroup
              v-for="region in timezonesByRegion"
              :key="region.region"
              :label="region.region"
            >
              <option
                v-for="tz in region.timezones"
                :key="tz.value"
                :value="tz.value"
              >
                {{ tz.label }}
              </option>
            </optgroup>
          </select>
          <p class="text-xs text-gray-500 mt-2">
            💡 选择时区后，"今天"的统计将基于所选时区
          </p>
        </div>

        <button
          @click="saveTimezone"
          :disabled="savingTimezone"
          class="btn-primary w-full disabled:opacity-50"
        >
          {{ savingTimezone ? '保存中...' : '保存时区' }}
        </button>

        <!-- 成功提示 -->
        <div v-if="saveTimezoneSuccess" class="bg-green-50 text-green-700 px-4 py-3 rounded-2xl text-sm text-center fade-in">
          ✅ 保存成功！
        </div>

        <!-- 错误提示 -->
        <div v-if="saveTimezoneError" class="bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm text-center fade-in">
          {{ saveTimezoneError }}
        </div>
      </div>

      <!-- 时区说明 -->
      <div class="mt-6 pt-6 border-t border-gray-200">
        <h4 class="text-sm font-semibold text-gray-700 mb-2">为什么需要设置时区？</h4>
        <ul class="text-xs text-gray-600 space-y-1">
          <li>• 确保跨国家庭成员看到一致的"今天"数据</li>
          <li>• 避免服务器时区与用户时区不一致的问题</li>
          <li>• 自动模式会使用您设备的本地时区</li>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api.js';
import { COMMON_TIMEZONES, getTimezoneDisplayInfo, getCurrentTime } from '../utils/timezone.js';

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
const settings = ref({ dueDate: null, timezone: 'auto', isHighRisk: false });
const dueDateInput = ref('');
const birthDateInput = ref('');
const isHighRiskInput = ref(false);
const saving = ref(false);
const saveSuccess = ref(false);
const saveError = ref('');

// 时区状态
const timezoneInput = ref('auto');
const savingTimezone = ref(false);
const saveTimezoneSuccess = ref(false);
const saveTimezoneError = ref('');
const currentTimeDisplay = ref('');

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

const maxBirthDate = computed(() => {
  // 出生日期最大值为今天
  return new Date().toISOString().split('T')[0];
});

// 计算年龄信息
const ageInfo = computed(() => {
  if (!birthDateInput.value) return null;

  const birthDate = new Date(birthDateInput.value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // 如果还没到生日，年龄减1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  const isHighRisk = age < 18 || age >= 35;
  let reason = '';
  if (age < 18) {
    reason = '青少年妊娠，建议加强监测';
  } else if (age >= 35) {
    reason = '高龄产妇，建议加强监测';
  }

  return { age, isHighRisk, reason };
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

// 时区相关计算属性
const currentTimezoneDisplay = computed(() => {
  const timezone = settings.value.timezone || 'auto';
  const info = getTimezoneDisplayInfo(timezone);
  return info.label;
});

const timezonesByRegion = computed(() => COMMON_TIMEZONES);

// 更新当前时间显示
const updateCurrentTime = () => {
  const timezone = timezoneInput.value || 'auto';
  currentTimeDisplay.value = getCurrentTime(timezone);
};

// 根据年龄自动更新高危状态
const updateHighRiskFromAge = () => {
  if (ageInfo.value) {
    isHighRiskInput.value = ageInfo.value.isHighRisk;
  }
};

// 定时器
let timeUpdateInterval = null;

// 加载设置
const loadSettings = async () => {
  try {
    const data = await api.getSettings();
    settings.value = data;
    if (data.dueDate) {
      dueDateInput.value = data.dueDate.split('T')[0];
    }
    if (data.birthDate) {
      birthDateInput.value = data.birthDate.split('T')[0];
    }
    if (data.timezone) {
      timezoneInput.value = data.timezone;
    }
    if (data.isHighRisk !== undefined) {
      isHighRiskInput.value = data.isHighRisk;
    }
    updateCurrentTime();
  } catch (error) {
    console.error('加载设置失败:', error);
  }
};

// 保存时区
const saveTimezone = async () => {
  savingTimezone.value = true;
  saveTimezoneSuccess.value = false;
  saveTimezoneError.value = '';

  try {
    const data = await api.setTimezone(timezoneInput.value);
    settings.value = data;
    saveTimezoneSuccess.value = true;
    setTimeout(() => saveTimezoneSuccess.value = false, 3000);
  } catch (error) {
    saveTimezoneError.value = error.error || '保存失败，请重试';
    setTimeout(() => saveTimezoneError.value = '', 3000);
  } finally {
    savingTimezone.value = false;
  }
};

// 保存预产期
const saveDueDate = async () => {
  saving.value = true;
  saveSuccess.value = false;
  saveError.value = '';

  try {
    const data = await api.setDueDate(
      dueDateInput.value,
      isHighRiskInput.value,
      birthDateInput.value || null
    );
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
  // 每秒更新时间显示
  timeUpdateInterval = setInterval(updateCurrentTime, 1000);
});

onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
  }
});
</script>
