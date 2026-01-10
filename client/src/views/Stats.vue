<template>
  <div class="max-w-md mx-auto p-4 pt-6 pb-24">
    <!-- 头部 -->
    <header class="card mb-6 fade-in">
      <h1 class="text-2xl font-bold text-primary-600 mb-2">📊 统计分析</h1>
      <p class="text-sm text-gray-500">了解宝宝的活动规律</p>
    </header>

    <!-- 周期选择 -->
    <div class="flex gap-2 mb-6">
      <button
        v-for="option in periodOptions"
        :key="option.value"
        @click="selectedPeriod = option.value"
        class="tag-button flex-1"
        :class="{ 'tag-button-active': selectedPeriod === option.value }"
      >
        {{ option.label }}
      </button>
    </div>

    <!-- 总体统计卡片 -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="card fade-in text-center">
        <div class="text-3xl font-bold text-primary-600">{{ overallStats.total }}</div>
        <div class="text-sm text-gray-600 mt-1">总次数</div>
      </div>
      <div class="card fade-in text-center">
        <div class="text-3xl font-bold text-warm-600">{{ overallStats.avgPerDay }}</div>
        <div class="text-sm text-gray-600 mt-1">日均次数</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="card mb-6 fade-in">
      <h3 class="font-semibold text-gray-700 mb-4">每日胎动趋势</h3>
      <div class="h-64">
        <Line v-if="chartData" :data="chartData" :options="chartOptions" />
        <div v-else class="flex items-center justify-center h-full text-gray-400">
          暂无数据
        </div>
      </div>
    </div>

    <!-- 按日期查看记录 -->
    <div class="card mb-6 fade-in">
      <h3 class="font-semibold text-gray-700 mb-4">查看某日记录 📅</h3>

      <!-- 日期选择器 -->
      <div class="mb-4">
        <input
          type="date"
          v-model="selectedDate"
          :max="today"
          class="input-field text-center"
        />
      </div>

      <!-- 选中日期的记录列表 -->
      <div v-if="selectedDate">
        <!-- 日期统计 -->
        <div v-if="selectedDateMovements.length > 0" class="space-y-4 mb-4">
          <!-- 总次数卡片 -->
          <div class="bg-primary-50 rounded-2xl p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-600">{{ formatSelectedDate }}</div>
                <div class="text-2xl font-bold text-primary-600 mt-1">
                  共 {{ selectedDateMovements.length }} 次胎动
                </div>
              </div>
              <div class="text-4xl">👶</div>
            </div>
          </div>

          <!-- 时段分布卡片 -->
          <div class="bg-white rounded-2xl p-4 shadow-soft">
            <h4 class="text-sm font-semibold text-gray-700 mb-3">时段分布</h4>
            <div class="grid grid-cols-3 gap-3">
              <div class="text-center">
                <div class="text-3xl mb-1">🌅</div>
                <div class="text-xs text-gray-600 mb-1">上午</div>
                <div class="text-xl font-bold text-primary-600">{{ selectedDateTimeStats.morning }}</div>
                <div class="text-xs text-gray-500">次</div>
              </div>
              <div class="text-center">
                <div class="text-3xl mb-1">☀️</div>
                <div class="text-xs text-gray-600 mb-1">下午</div>
                <div class="text-xl font-bold text-warm-600">{{ selectedDateTimeStats.afternoon }}</div>
                <div class="text-xs text-gray-500">次</div>
              </div>
              <div class="text-center">
                <div class="text-3xl mb-1">🌙</div>
                <div class="text-xs text-gray-600 mb-1">晚上</div>
                <div class="text-xl font-bold text-primary-600">{{ selectedDateTimeStats.evening }}</div>
                <div class="text-xs text-gray-500">次</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 记录详情 -->
        <div v-if="selectedDateMovements.length === 0" class="text-center py-8 text-gray-400">
          <div class="text-4xl mb-2">💭</div>
          <p>{{ formatSelectedDate }}暂无记录</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="movement in selectedDateMovements"
            :key="movement.id"
            class="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl"
          >
            <div class="text-2xl">{{ getIntensityEmoji(movement.intensity) }}</div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-700">{{ movement.tag }}</span>
                <span class="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700">
                  {{ movement.intensity }}
                </span>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                {{ formatTime(movement.timestamp) }}
                <span v-if="movement.note" class="ml-2">· {{ movement.note }}</span>
              </div>
            </div>
            <div class="text-2xl">{{ getTagEmoji(movement.tag) }}</div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-400">
        <div class="text-4xl mb-2">📅</div>
        <p>选择日期查看当天记录</p>
      </div>
    </div>

    <!-- 强度分布 -->
    <div class="card mb-6 fade-in">
      <h3 class="font-semibold text-gray-700 mb-4">强度分布</h3>
      <div class="space-y-3">
        <div
          v-for="item in intensityDistribution"
          :key="item.intensity"
          class="flex items-center gap-3"
        >
          <div class="text-2xl">{{ getIntensityEmoji(item.intensity) }}</div>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-gray-700">{{ item.intensity }}</span>
              <span class="text-sm text-gray-500">{{ item.count }}次 ({{ item.percentage }}%)</span>
            </div>
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                :style="{ width: item.percentage + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 类型分布 -->
    <div class="card fade-in">
      <h3 class="font-semibold text-gray-700 mb-4">类型分布</h3>
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="item in tagDistribution"
          :key="item.tag"
          class="bg-primary-50 rounded-2xl p-3 text-center"
        >
          <div class="text-3xl mb-1">{{ getTagEmoji(item.tag) }}</div>
          <div class="text-sm font-medium text-gray-700">{{ item.tag }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ item.count }}次</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import api from '../api.js';

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 状态
const selectedPeriod = ref(7);
const dailyStats = ref([]);
const allMovements = ref([]);
const selectedDate = ref(''); // 选中的日期
const selectedDateMovements = ref([]); // 选中日期的记录

const periodOptions = [
  { value: 7, label: '7天' },
  { value: 14, label: '14天' },
  { value: 30, label: '30天' }
];

// Emoji 映射
const intensityEmojiMap = {
  '轻微': '✨',
  '明显': '💫',
  '强烈': '💪'
};

const tagEmojiMap = {
  '踢腿': '🦵',
  '翻身': '🔄',
  '打嗝': '💨',
  '推肚子': '👋',
  '伸懒腰': '🤸',
  '其他': '✨'
};

// 计算属性
const overallStats = computed(() => {
  const total = dailyStats.value.reduce((sum, day) => sum + day.count, 0);
  const days = dailyStats.value.length || 1;
  return {
    total,
    avgPerDay: Math.round(total / days)
  };
});

const chartData = computed(() => {
  if (dailyStats.value.length === 0) return null;

  const labels = dailyStats.value.map(item => {
    const date = new Date(item.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }).reverse();

  const data = dailyStats.value.map(item => item.count).reverse();

  return {
    labels,
    datasets: [
      {
        label: '胎动次数',
        data,
        borderColor: 'rgb(251, 58, 139)',
        backgroundColor: 'rgba(251, 58, 139, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context) => `${context.parsed.y} 次`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  }
};

const intensityDistribution = computed(() => {
  if (allMovements.value.length === 0) return [];

  const counts = {};
  allMovements.value.forEach(m => {
    counts[m.intensity] = (counts[m.intensity] || 0) + 1;
  });

  const total = allMovements.value.length;
  return Object.entries(counts).map(([intensity, count]) => ({
    intensity,
    count,
    percentage: Math.round((count / total) * 100)
  })).sort((a, b) => b.count - a.count);
});

const tagDistribution = computed(() => {
  if (allMovements.value.length === 0) return [];

  const counts = {};
  allMovements.value.forEach(m => {
    counts[m.tag] = (counts[m.tag] || 0) + 1;
  });

  return Object.entries(counts).map(([tag, count]) => ({
    tag,
    count
  })).sort((a, b) => b.count - a.count);
});

// 选中日期的时段统计
const selectedDateTimeStats = computed(() => {
  if (selectedDateMovements.value.length === 0) {
    return { morning: 0, afternoon: 0, evening: 0 };
  }

  const stats = {
    morning: 0,    // 上午 0:00-12:00
    afternoon: 0,  // 下午 12:00-18:00
    evening: 0     // 晚上 18:00-24:00
  };

  selectedDateMovements.value.forEach(movement => {
    const date = new Date(movement.timestamp);
    const hour = date.getHours();

    if (hour >= 0 && hour < 12) {
      stats.morning++;
    } else if (hour >= 12 && hour < 18) {
      stats.afternoon++;
    } else {
      stats.evening++;
    }
  });

  return stats;
});

// 今天的日期（用于日期选择器的max）
const today = computed(() => {
  return new Date().toISOString().split('T')[0];
});

// 格式化选中的日期
const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return '';
  const date = new Date(selectedDate.value + 'T00:00:00');
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
});

// 方法
const getIntensityEmoji = (intensity) => {
  return intensityEmojiMap[intensity] || '👶';
};

const getTagEmoji = (tag) => {
  return tagEmojiMap[tag] || '✨';
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const loadData = async () => {
  try {
    const [stats, movements] = await Promise.all([
      api.getDailyStats(selectedPeriod.value),
      api.getMovements({ limit: 1000 })
    ]);

    dailyStats.value = stats;

    // 筛选指定时期内的记录
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - selectedPeriod.value);
    allMovements.value = movements.filter(m =>
      new Date(m.timestamp) >= cutoffDate
    );
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

// 加载选中日期的记录
const loadSelectedDateMovements = async () => {
  if (!selectedDate.value) {
    selectedDateMovements.value = [];
    return;
  }

  try {
    const startDate = selectedDate.value + 'T00:00:00';
    const endDate = selectedDate.value + 'T23:59:59';

    const movements = await api.getMovements({
      startDate,
      endDate,
      limit: 100
    });

    selectedDateMovements.value = movements;
  } catch (error) {
    console.error('加载日期记录失败:', error);
    selectedDateMovements.value = [];
  }
};

// 监听周期变化
watch(selectedPeriod, () => {
  loadData();
});

// 监听日期选择变化
watch(selectedDate, () => {
  loadSelectedDateMovements();
});

onMounted(() => {
  loadData();
});
</script>
