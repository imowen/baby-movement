<template>
  <div class="max-w-md mx-auto p-4 pt-6 pb-24">
    <!-- 头部 -->
    <header class="card mb-6 fade-in">
      <h1 class="text-2xl font-bold text-primary-600 mb-2">📊 统计分析</h1>
      <p class="text-sm text-gray-500">了解宝宝的活动规律</p>
    </header>

    <!-- 统一时间选择器 -->
    <div class="flex flex-wrap gap-2 mb-6">
      <button
        v-for="option in periodOptions"
        :key="option.value"
        @click="selectPeriod(option.value)"
        class="tag-button"
        :class="{ 'tag-button-active': selectedPeriod === option.value }"
      >
        {{ option.label }}
      </button>
      <button
        @click="showCustomModal = true"
        class="tag-button"
        :class="{ 'tag-button-active': selectedPeriod === 'custom' }"
      >
        {{ customRangeLabel }}
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

    <!-- 图表区域（多日时显示趋势图） -->
    <div v-if="!isSingleDay && chartData" class="card mb-6 fade-in">
      <h3 class="font-semibold text-gray-700 mb-4">每日胎动趋势</h3>
      <div class="h-64">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- 单日时显示小时分布 -->
    <div v-if="isSingleDay && hourlyData.length > 0" class="card mb-6 fade-in">
      <h3 class="font-semibold text-gray-700 mb-4">小时分布</h3>
      <div class="h-48">
        <Bar :data="hourlyChartData" :options="hourlyChartOptions" />
      </div>
    </div>

    <!-- 时段分布 -->
    <div v-if="allMovements.length > 0" class="card mb-6 fade-in">
      <h3 class="font-semibold text-gray-700 mb-4">时段分布 🕐</h3>
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center bg-primary-50 rounded-2xl p-3">
          <div class="text-3xl mb-1">🌅</div>
          <div class="text-xs text-gray-600 mb-1">上午</div>
          <div class="text-xl font-bold text-primary-600">{{ timeStats.morning }}</div>
          <div class="text-xs text-gray-500">次</div>
        </div>
        <div class="text-center bg-warm-50 rounded-2xl p-3">
          <div class="text-3xl mb-1">☀️</div>
          <div class="text-xs text-gray-600 mb-1">下午</div>
          <div class="text-xl font-bold text-warm-600">{{ timeStats.afternoon }}</div>
          <div class="text-xs text-gray-500">次</div>
        </div>
        <div class="text-center bg-primary-50 rounded-2xl p-3">
          <div class="text-3xl mb-1">🌙</div>
          <div class="text-xs text-gray-600 mb-1">晚上</div>
          <div class="text-xl font-bold text-primary-600">{{ timeStats.evening }}</div>
          <div class="text-xs text-gray-500">次</div>
        </div>
      </div>
    </div>

    <!-- 强度分布 -->
    <div v-if="intensityDistribution.length > 0" class="card mb-6 fade-in">
      <h3 class="font-semibold text-gray-700 mb-4">强度分布 💪</h3>
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
    <div v-if="tagDistribution.length > 0" class="card mb-6 fade-in">
      <h3 class="font-semibold text-gray-700 mb-4">类型分布 🏷️</h3>
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

    <!-- 记录详情（按日期分组） -->
    <div class="card fade-in">
      <h3 class="font-semibold text-gray-700 mb-4">记录详情 📝</h3>

      <div v-if="allMovements.length === 0" class="text-center py-8 text-gray-400">
        <div class="text-4xl mb-2">💭</div>
        <p>{{ periodLabel }}暂无记录</p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="group in groupedMovements" :key="group.date">
          <!-- 日期分组头 -->
          <div
            @click="toggleGroup(group.date)"
            class="flex items-center justify-between p-3 bg-gray-100 rounded-2xl cursor-pointer hover:bg-gray-200 transition-colors"
          >
            <div class="flex items-center gap-2">
              <span class="text-lg">📅</span>
              <div>
                <div class="font-medium text-gray-700">{{ group.dateLabel }}</div>
                <div v-if="getPregnancyWeekForDate(group.date)" class="text-xs text-gray-500">
                  {{ getPregnancyWeekForDate(group.date) }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-primary-600 font-medium">{{ group.movements.length }}次</span>
              <span class="text-gray-400 transition-transform" :class="{ 'rotate-180': expandedGroups[group.date] }">
                ▼
              </span>
            </div>
          </div>

          <!-- 展开的记录列表 -->
          <div v-if="expandedGroups[group.date]" class="mt-2 space-y-2 pl-2">
            <div
              v-for="movement in group.movements"
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
      </div>
    </div>

    <!-- 自定义日期范围弹窗 -->
    <div
      v-if="showCustomModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="showCustomModal = false"
    >
      <div class="card max-w-sm w-full fade-in">
        <h2 class="text-xl font-bold text-primary-600 mb-4">选择日期范围 📅</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
            <input
              type="date"
              v-model="customStartDate"
              :max="today"
              class="input-field"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
            <input
              type="date"
              v-model="customEndDate"
              :max="today"
              class="input-field"
            />
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="showCustomModal = false"
            class="btn-secondary flex-1"
          >
            取消
          </button>
          <button
            @click="applyCustomRange"
            :disabled="!customStartDate || !customEndDate"
            class="btn-primary flex-1 disabled:opacity-50"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive, nextTick } from 'vue';
import { Line, Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import api from '../api.js';
import { getToday } from '../utils/timezone.js';

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 状态
const selectedPeriod = ref('today');
const dailyStats = ref([]);
const allMovements = ref([]);
const showCustomModal = ref(false);
const customStartDate = ref('');
const customEndDate = ref('');
const appliedCustomStart = ref('');
const appliedCustomEnd = ref('');
const expandedGroups = reactive({});
const settings = ref({ dueDate: null, timezone: 'auto' });

const periodOptions = [
  { value: 'today', label: '今天' },
  { value: 'yesterday', label: '昨天' },
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

// 今天的日期
const today = computed(() => {
  return new Date().toISOString().split('T')[0];
});

// 是否是单日查看
const isSingleDay = computed(() => {
  return selectedPeriod.value === 'today' ||
         selectedPeriod.value === 'yesterday' ||
         (selectedPeriod.value === 'custom' && appliedCustomStart.value === appliedCustomEnd.value);
});

// 自定义按钮标签
const customRangeLabel = computed(() => {
  if (selectedPeriod.value === 'custom' && appliedCustomStart.value && appliedCustomEnd.value) {
    const start = formatDateShort(appliedCustomStart.value);
    const end = formatDateShort(appliedCustomEnd.value);
    if (appliedCustomStart.value === appliedCustomEnd.value) {
      return start;
    }
    return `${start}-${end}`;
  }
  return '自定义';
});

// 当前选择的时间范围描述
const periodLabel = computed(() => {
  if (selectedPeriod.value === 'today') return '今天';
  if (selectedPeriod.value === 'yesterday') return '昨天';
  if (selectedPeriod.value === 'custom') {
    if (appliedCustomStart.value === appliedCustomEnd.value) {
      return formatDateLong(appliedCustomStart.value);
    }
    return `${formatDateShort(appliedCustomStart.value)} - ${formatDateShort(appliedCustomEnd.value)}`;
  }
  return `最近${selectedPeriod.value}天`;
});

// 计算日期范围
const dateRange = computed(() => {
  let endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (selectedPeriod.value === 'today') {
    // 今天 - 使用时区
    const timezone = settings.value.timezone || 'auto';
    const todayStr = getToday(timezone);
    startDate = new Date(todayStr + 'T00:00:00');
    endDate = new Date(todayStr + 'T23:59:59');
  } else if (selectedPeriod.value === 'yesterday') {
    // 昨天 - 使用时区
    const timezone = settings.value.timezone || 'auto';
    const todayStr = getToday(timezone);
    const yesterday = new Date(todayStr);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    startDate = new Date(yesterdayStr + 'T00:00:00');
    endDate = new Date(yesterdayStr + 'T23:59:59');
  } else if (selectedPeriod.value === 'custom') {
    // 验证自定义日期是否有效
    if (appliedCustomStart.value && appliedCustomEnd.value) {
      startDate = new Date(appliedCustomStart.value + 'T00:00:00');
      endDate = new Date(appliedCustomEnd.value + 'T23:59:59');

      // 验证日期对象是否有效
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid custom dates:', {
          start: appliedCustomStart.value,
          end: appliedCustomEnd.value
        });
        // 回退到今天
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      }
    }
  } else {
    startDate.setDate(startDate.getDate() - selectedPeriod.value + 1);
  }

  return { startDate, endDate };
});

// 总体统计
const overallStats = computed(() => {
  const total = allMovements.value.length;

  // 计算实际天数
  const { startDate, endDate } = dateRange.value;
  const days = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

  return {
    total,
    avgPerDay: days > 0 ? Math.round(total / days) : 0
  };
});

// 时段统计
const timeStats = computed(() => {
  const stats = { morning: 0, afternoon: 0, evening: 0 };

  allMovements.value.forEach(m => {
    const hour = new Date(m.timestamp).getHours();
    if (hour >= 0 && hour < 12) stats.morning++;
    else if (hour >= 12 && hour < 18) stats.afternoon++;
    else stats.evening++;
  });

  return stats;
});

// 小时分布数据（单日用）
const hourlyData = computed(() => {
  if (!isSingleDay.value) return [];

  const hourCounts = new Array(24).fill(0);
  allMovements.value.forEach(m => {
    const hour = new Date(m.timestamp).getHours();
    hourCounts[hour]++;
  });

  return hourCounts;
});

// 小时分布图表数据
const hourlyChartData = computed(() => {
  const labels = [];
  for (let i = 0; i < 24; i++) {
    labels.push(`${i}:00`);
  }

  return {
    labels,
    datasets: [{
      label: '胎动次数',
      data: hourlyData.value,
      backgroundColor: 'rgba(251, 58, 139, 0.6)',
      borderColor: 'rgb(251, 58, 139)',
      borderWidth: 1,
      borderRadius: 4
    }]
  };
});

const hourlyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
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
      ticks: { stepSize: 1 }
    },
    x: {
      ticks: {
        maxTicksLimit: 8,
        callback: function(val, index) {
          return index % 3 === 0 ? this.getLabelForValue(val) : '';
        }
      }
    }
  }
};

// 趋势图表数据
const chartData = computed(() => {
  if (dailyStats.value.length === 0 || isSingleDay.value) return null;

  const labels = dailyStats.value.map(item => {
    const date = new Date(item.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }).reverse();

  const data = dailyStats.value.map(item => item.count).reverse();

  return {
    labels,
    datasets: [{
      label: '胎动次数',
      data,
      borderColor: 'rgb(251, 58, 139)',
      backgroundColor: 'rgba(251, 58, 139, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
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
      ticks: { stepSize: 1 }
    }
  }
};

// 强度分布
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

// 类型分布
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

// 按日期分组的记录
const groupedMovements = computed(() => {
  if (allMovements.value.length === 0) return [];

  const groups = {};

  allMovements.value.forEach(m => {
    const date = new Date(m.timestamp).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(m);
  });

  // 转换为数组并排序（最新的在前）
  return Object.entries(groups)
    .map(([date, movements]) => ({
      date,
      dateLabel: formatDateLong(date),
      movements: movements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
});

// 方法
const getIntensityEmoji = (intensity) => intensityEmojiMap[intensity] || '👶';
const getTagEmoji = (tag) => tagEmojiMap[tag] || '✨';

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const formatDateShort = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatDateLong = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

// 计算特定日期的孕周期
const getPregnancyWeekForDate = (dateKey) => {
  if (!settings.value.dueDate) return null;

  const targetDate = new Date(dateKey + 'T00:00:00');
  targetDate.setHours(0, 0, 0, 0);

  const dueDate = new Date(settings.value.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  // 预产期通常是40周，280天
  const conceptionDate = new Date(dueDate);
  conceptionDate.setDate(conceptionDate.getDate() - 280);
  conceptionDate.setHours(0, 0, 0, 0);

  // 计算从怀孕开始到目标日期的天数
  const daysSinceConception = Math.round((targetDate - conceptionDate) / (1000 * 60 * 60 * 24));

  // 计算周和天
  const weeks = Math.floor(daysSinceConception / 7);
  const days = daysSinceConception % 7;

  if (weeks < 0) return null; // 如果日期在怀孕之前

  return `孕${weeks}周${days > 0 ? days + '天' : ''}`;
};

const selectPeriod = (period) => {
  selectedPeriod.value = period;
  // 重置展开状态
  Object.keys(expandedGroups).forEach(key => delete expandedGroups[key]);
  // 默认展开第一个分组
  setTimeout(() => {
    if (groupedMovements.value.length > 0) {
      expandedGroups[groupedMovements.value[0].date] = true;
    }
  }, 100);
};

const applyCustomRange = async () => {
  if (!customStartDate.value || !customEndDate.value) return;

  // 确保开始日期不晚于结束日期
  if (customStartDate.value > customEndDate.value) {
    [customStartDate.value, customEndDate.value] = [customEndDate.value, customStartDate.value];
  }

  console.log('applyCustomRange called:', {
    customStartDate: customStartDate.value,
    customEndDate: customEndDate.value,
    beforeApplied: {
      start: appliedCustomStart.value,
      end: appliedCustomEnd.value
    }
  });

  // 关闭弹窗
  showCustomModal.value = false;

  // 重置展开状态
  Object.keys(expandedGroups).forEach(key => delete expandedGroups[key]);

  // 批量更新状态，避免多次触发 watch
  // 先设置自定义日期，再设置 selectedPeriod，确保 dateRange computed 能正确计算
  appliedCustomStart.value = customStartDate.value;
  appliedCustomEnd.value = customEndDate.value;

  // 使用 nextTick 确保自定义日期已更新
  await nextTick();

  // 最后设置 selectedPeriod，这样 dateRange computed 计算时能获取到正确的日期
  selectedPeriod.value = 'custom';

  console.log('After setting:', {
    appliedCustomStart: appliedCustomStart.value,
    appliedCustomEnd: appliedCustomEnd.value,
    selectedPeriod: selectedPeriod.value
  });

  // 手动触发数据加载
  await loadData();

  // 默认展开第一个分组
  await nextTick();
  if (groupedMovements.value.length > 0) {
    expandedGroups[groupedMovements.value[0].date] = true;
  }
};

const toggleGroup = (date) => {
  expandedGroups[date] = !expandedGroups[date];
};

const loadData = async () => {
  try {
    const { startDate, endDate } = dateRange.value;

    console.log('loadData called:', {
      selectedPeriod: selectedPeriod.value,
      appliedCustomStart: appliedCustomStart.value,
      appliedCustomEnd: appliedCustomEnd.value,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    });

    // 计算天数用于获取每日统计
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    const [stats, movements] = await Promise.all([
      api.getDailyStats(days),
      api.getMovements({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000
      })
    ]);

    dailyStats.value = stats;
    allMovements.value = movements;

    // 默认展开第一个分组
    if (groupedMovements.value.length > 0 && Object.keys(expandedGroups).length === 0) {
      expandedGroups[groupedMovements.value[0].date] = true;
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

const loadSettings = async () => {
  try {
    const data = await api.getSettings();
    settings.value = data;
  } catch (error) {
    console.error('加载设置失败:', error);
  }
};

// 监听时间范围变化
// 注意：自定义日期范围由 applyCustomRange 函数手动触发 loadData，不需要 watch
watch(selectedPeriod, (newPeriod) => {
  if (newPeriod !== 'custom') {
    loadData();
  }
}, { immediate: false });

onMounted(() => {
  // 初始化自定义日期为今天
  customStartDate.value = today.value;
  customEndDate.value = today.value;
  loadSettings();
  loadData();
});
</script>
